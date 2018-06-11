const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const UserModel = require('./models/user');

const WORDS = require('./words');

const HandshakeMessage = require('../shared/messages/handshake-message');
const DrawMessage = require('../shared/messages/draw-message');
const GameOverMessage = require('../shared/messages/game-over-message');
const ChatMessage = require('../shared/messages/chat-message');
const StartRoundMessage = require('../shared/messages/start-round-message');
const EndRoundMessage = require('../shared/messages/end-round-message');
const PlayerMessage = require('../shared/messages/player-message');
const PlayerDisconnectedMessage = require('../shared/messages/player-disconnected-message');
const TimerMessage = require('../shared/messages/timer-message');

const incomingMessages = [HandshakeMessage, DrawMessage, ChatMessage, 'disconnect'];

const PORT = process.env.PORT || 3000;
const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost/my_database';

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
}

const STATE_IDLE = 'IDLE';
const STATE_PLAYING = 'PLAYING';
const STATE_COOLDOWN = 'COOLDOWN';

const SERVER_NAME = 'Server';

const ROUND_TIME_BASE = 80;
const ROUND_TIME_REDUCTION = 5;
const ROUND_TIME_MINIMUM = 10;

const SCORE_BONUS_FIRST = 4;
const SCORE_BONUS_MAX = 6;
const SCORE_BONUS_REDUCTION = 1;
const SCORE_TIME_MULTIPLIER = 0.5;
const SCORE_TIME_MAXIMUM = 30;
const SCORE_BASE = 10;

const MAX_ROUNDS = 2;

const tokens = {};
const players = {};
const drawHistory = [];
const chatHistory = [];

let appState = STATE_IDLE;
let drawingPlayerName = '';
let word;
let wordHint;
let guessingTime;
let timerUpdateInterval;
let roundScores;
let remainingTime;
let scoreBonus;
let winnerScore;
let drawnThisRound;
let roundsPlayed;

const startGame = () => {
  roundsPlayed = 0;
  const playerNames = Object.keys(players);

  if (playerNames.length < 2) {
    return;
  }

  playerNames.forEach(name => {
    players[name].score = 0;
    sendToAllPlayers(new PlayerMessage(name, players[name]));
  });
  sendToAllPlayers(new ChatMessage(SERVER_NAME, 'Starting new game'));
  console.log('Starting new game');
  startRound();
};

const endGame = () => {
  clearInterval(timerUpdateInterval);

  appState = STATE_IDLE;

  sendToAllPlayers(new ChatMessage(SERVER_NAME, 'Game over!'));
  sendToAllPlayers(new GameOverMessage());
  console.log('Game over');

  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      remainingTime = 20 - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      return remainingTime <= 0;
    },
    () => {
      if (Object.keys(players).length >= 2) {
        startGame();
      } else {
        console.log('Not enough players to start a new game')
      }
    }
  );
};

const startRound = () => {
  clearInterval(timerUpdateInterval);

  drawnThisRound = drawnThisRound || new Set();

  const playerNames = Object.keys(players);
  if (playerNames.length < 2) {
    appState = STATE_IDLE;
    return;
  }

  drawingPlayerName = null;
  playerNames.forEach(name => {
    if (drawingPlayerName) {
      return;
    }
    if (!drawnThisRound.has(name)) {
      drawingPlayerName = name;
    }
  });

  if (!drawingPlayerName) {
    drawnThisRound.clear();
    roundsPlayed++;
    if (roundsPlayed == MAX_ROUNDS) {
      endGame();
    } else {
      startRound();
    }
    return;
  }

  word = WORDS[Math.floor(Math.random() * WORDS.length)];
  wordHint = word.replace(/[ ]/g, '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
  wordHint = wordHint.replace(/[a-zA-Z]/g, '＿ ');

  roundScores = {};
  playerNames.forEach(name => {
    const message = new StartRoundMessage(
      drawingPlayerName,
      name === drawingPlayerName ? word : wordHint,
      roundsPlayed + 1
    );
    players[name].guessed = false;
    players[name].socket.emit(message.getType(), message.getPayload());
    roundScores[name] = 0;
  });
  sendToAllPlayers(new ChatMessage(SERVER_NAME, `${drawingPlayerName} is drawing now!`));

  guessingTime = ROUND_TIME_BASE;
  remainingTime = guessingTime;
  winnerScore = 0;
  scoreBonus = SCORE_BONUS_MAX;
  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      remainingTime = guessingTime - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      return remainingTime <= 0;
    },
    () => {
      sendToAllPlayers(new ChatMessage(SERVER_NAME, `Round over, the word was "${word}"`));
      endRound();
    }
  );
  console.log(`Starting round, word: ${word}, player ${drawingPlayerName} drawing`);
  appState = STATE_PLAYING;
};

const endRound = () => {
  appState = STATE_COOLDOWN;

  drawnThisRound.add(drawingPlayerName);
  let playersGuessing = 0;
  let playersGuessed = 0;
  Object.keys(players).forEach(name => {
    if (name === drawingPlayerName) {
      return;
    }
    playersGuessing++;
    if (players[name].guessed) {
      playersGuessed++;
    }
  });

  const drawingPlayerScore = Math.round(winnerScore * playersGuessed / playersGuessing);
  roundScores[drawingPlayerName] = drawingPlayerScore;
  if (players[drawingPlayerName]) {
    players[drawingPlayerName].score += drawingPlayerScore;
    sendToAllPlayers(new PlayerMessage(drawingPlayerName, players[drawingPlayerName]));
  }

  drawingPlayerName = null;
  sendToAllPlayers(new EndRoundMessage(word, roundScores));
  clearInterval(timerUpdateInterval);
  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      const remainingTime = 10 - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      return remainingTime <= 0;
    },
    () => {
      if (Object.keys(players).length >= 2) {
        startRound();
      } else {
        endGame();
      }
    }
  );
};

const checkEveryoneGuessed = () => {
  let result = true;
  Object.keys(players).forEach(name => {
    if (!players[name].guessed && name != drawingPlayerName) {
      result = false;
    }
  });
  return result;
};

const getUnixTime = () => {
  return Math.round((new Date()).getTime() / 1000);
};

const startTimer = (updateCallback, doneCallback) => {
  const startTime = getUnixTime();
  updateCallback(0);
  const intervalId = setInterval(() => {
      if (updateCallback(getUnixTime() - startTime)) {
        doneCallback();
        clearInterval(intervalId);
      }
    },
    1000);
  return intervalId;
};

const sendToAllPlayers = (message) => {
  io.sockets.emit(message.getType(), message.getPayload());
};

const wsHandlers = {
  [HandshakeMessage.type]: (socket, data) => {
    const { token } = data;
    const newPlayerName = tokens[token] || 'TUTULO';
    if (!newPlayerName) {
      console.error(`Unknown player token ${token}!`);
      return;
    }
    console.log(`Identified player ${newPlayerName}`);
    socket.emit(HandshakeMessage.type, { name: newPlayerName });
    drawHistory.forEach((data) => socket.emit(DrawMessage.type, data));
    chatHistory.forEach((data) => socket.emit(ChatMessage.type, data));
    players[newPlayerName] = { socket, score: 0, guessed: false };

    const playerNames = Object.keys(players);

    if (appState == STATE_PLAYING) {
      roundScores[newPlayerName] = 0;
      socket.emit(StartRoundMessage.type, new StartRoundMessage(drawingPlayerName, wordHint, roundsPlayed + 1).getPayload());
    }

    playerNames.forEach(oldPlayerName => {
      if (oldPlayerName == newPlayerName) {
        return;
      }
      players[oldPlayerName].socket.emit(PlayerMessage.type, new PlayerMessage(newPlayerName, players[oldPlayerName]).getPayload());
      players[newPlayerName].socket.emit(PlayerMessage.type, new PlayerMessage(oldPlayerName, players[newPlayerName]).getPayload());
    });

    if (appState == STATE_IDLE && playerNames.length >= 2) {
      startGame();
    }

    delete tokens[token];
  },
  [DrawMessage.type]: (socket, data, playerName) => {
    if (appState == STATE_PLAYING && playerName !== drawingPlayerName) {
      return;
    }
    socket.broadcast.emit(DrawMessage.type, data);
    drawHistory.push(data)
  },
  [ChatMessage.type]: (socket, data, playerName) => {
    if (playerName !== data.sender) {
      console.error(`${playerName} is trying to send chat message under name ${data.sender}`);
    }
    data.sender = playerName;
    if (appState == STATE_PLAYING && playerName != drawingPlayerName && data.text.toLowerCase() === word.toLowerCase()) {
      socket.emit(ChatMessage.type, new ChatMessage(SERVER_NAME, 'You guessed the word!').getPayload());
      socket.broadcast.emit(ChatMessage.type, new ChatMessage(SERVER_NAME, `${data.sender} guessed the word!`).getPayload());
      const score = SCORE_BASE + Math.round(Math.min(SCORE_TIME_MAXIMUM, remainingTime * SCORE_TIME_MULTIPLIER)) + scoreBonus + (winnerScore ? 0 : SCORE_BONUS_FIRST);
      winnerScore = winnerScore || score;
      scoreBonus -= SCORE_BONUS_REDUCTION;
      roundScores[playerName] = score;
      players[playerName].score += score;
      players[playerName].guessed = true;
      sendToAllPlayers(new PlayerMessage(playerName, players[playerName]));
      if (remainingTime > 10)
        guessingTime = guessingTime - Math.min(ROUND_TIME_REDUCTION, Math.max(0, remainingTime - ROUND_TIME_MINIMUM));
      if (checkEveryoneGuessed()) {
        endRound();
      }
      return;
    }
    socket.broadcast.emit(ChatMessage.type, data);
    while (chatHistory.length >= 20) {
      chatHistory.shift();
    }
    chatHistory.push(data)
  },
};


io.on('connection', (socket) => {
  console.log('New websocket connection.');
  incomingMessages.forEach(msg => {
    socket.on(msg.type, data => {
      // console.log(`${msg.type}: ${JSON.stringify(data)}`);
      const handler = wsHandlers[msg.type];
      if (!handler) {
        console.warn(`No websocket handler for ${msg.type} message type!`);
        return;
      }
      let playerName;
      Object.keys(players).forEach(name => {
        if (players[name].socket === socket) {
          playerName = name;
        }
      });
      handler(socket, data, playerName);
    });
    socket.on('disconnect', () => {
      const playerNames = Object.keys(players);
      playerNames.forEach(name => {
        if (players[name].socket == socket) {
          socket.broadcast.emit(PlayerDisconnectedMessage.type, { name });
          delete players[name];
          console.log(`Player ${name} disconnected!`);

          if (name === drawingPlayerName) {
            if (playerNames.length < 2) {
              endGame();
            } else {
              endRound();
            }
          }
          return;
        }
        if (checkEveryoneGuessed()) {
          endRound();
        }
      })
    });
  });
});


mongoose.connect(DATABASE_URI, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Connected to database!')
});


// allow cors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.post('/api/login', (req, res, next) => {
  const { login, password, newAccount } = req.body;
  const token = uuid();

  UserModel.findOne({ login })
    .then(user => {
      if (!user) {
        if (newAccount) {
          const newUser = new UserModel({ login, password });
          return newUser.save()
            .then(savedUser => {
              console.log(`Created user ${login}`);
              return Promise.resolve(savedUser);
            })
        }
        throw `User ${login} not found`;
      }

      if (newAccount) {
        throw `User ${login} already exists!`;
      }

      return user.comparePassword(password)
        .then(passwordCorrect => {
          if (passwordCorrect) {
            return Promise.resolve(user);
          }
          throw 'Incorrect password!';
        });
    })
    .then(() => {
      tokens[token] = login;
      res.json({ token });
    })
    .catch(err => next(err));
});

app.use(function(error, req, res, next) {
  console.error(error);
  res.status(500).send({ message: error })
});

server.listen(PORT, () => console.log(`Game server is listening on ${PORT}`));
