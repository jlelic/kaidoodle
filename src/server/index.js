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
const WordMessage = require('../shared/messages/word-message');
const WordChoicesMessage = require('../shared/messages/word-choices-message');

const incomingMessages = [HandshakeMessage, DrawMessage, ChatMessage, WordMessage, 'disconnect'];

const PORT = process.env.PORT || 3000;
const DATABASE_URI = process.env.MONGODB_URI || 'mongodb://localhost/my_database';

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
}

const STATE_IDLE = 'IDLE';
const STATE_PLAYING = 'PLAYING';
const STATE_COOLDOWN = 'COOLDOWN';
const STATE_CHOOSING_WORD = 'CHOOSING_WORD';

const SERVER_NAME = 'Server';

const TIME_ROUND_BASE = 80;
const TIME_ROUND_REDUCTION = 5;
const TIME_ROUND_MINIMUM = 10;
const TIME_ROUND_HINT_START = 30;
const TIME_WORD_CHOOSE = 10;
const TIME_COOLDOWN = 5;

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

let gameState = STATE_IDLE;
let drawingPlayerName = '';
let word;
let wordCharLength;
let wordHint;
let hintsShown;
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
  prepareRound();
};

const endGame = () => {
  clearInterval(timerUpdateInterval);

  gameState = STATE_IDLE;

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

const prepareRound = () => {
  clearInterval(timerUpdateInterval);

  drawnThisRound = drawnThisRound || new Set();

  const playerNames = Object.keys(players);
  if (playerNames.length < 2) {
    gameState = STATE_IDLE;
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
      prepareRound();
    }
    return;
  }

  const wordIndices = new Set();
  while (wordIndices.size < 3) {
    wordIndices.add(Math.floor(Math.random() * WORDS.length));
  }

  const words = [...wordIndices].map(i => WORDS[i]);
  console.log(`Preparing round, drawing ${drawingPlayerName}, choices: ${words.join(', ')}`);
  players[drawingPlayerName].socket.emit(WordChoicesMessage.type, new WordChoicesMessage(words).getPayload());
  sendToAllPlayers(new ChatMessage(SERVER_NAME, `${drawingPlayerName} is choosing the word`));

  gameState = STATE_CHOOSING_WORD;

  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      remainingTime = TIME_WORD_CHOOSE - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      return remainingTime <= 0;
    },
    () => {
      word = words[0];
      startRound();
    }
  );
};

const startRound = () => {
  clearInterval(timerUpdateInterval);

  wordCharLength = word.split('').reduce((length, char) => {
    if (char.match(/[a-zA-Z]/)) {
      return length + 1
    }
    return length;
  }, 0);

  wordHint = word.replace(/[ ]/g, '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
  wordHint = wordHint.replace(/[a-zA-Z]/g, '＿ ');
  hintsShown = new Set();
  wordHint = generateWordHint();

  roundScores = {};
  Object.keys(players).forEach(name => {
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

  guessingTime = TIME_ROUND_BASE;
  remainingTime = guessingTime;
  winnerScore = 0;
  scoreBonus = SCORE_BONUS_MAX;
  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      remainingTime = guessingTime - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      checkWordHintAvailable(remainingTime);
      return remainingTime <= 0;
    },
    () => {
      sendToAllPlayers(new ChatMessage(SERVER_NAME, `Round over, the word was "${word}"`));
      endRound();
    }
  );
  console.log(`Starting round, word: ${word}, player ${drawingPlayerName} drawing`);
  gameState = STATE_PLAYING;
};

const endRound = () => {
  gameState = STATE_COOLDOWN;

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
      const remainingTime = TIME_COOLDOWN - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      return remainingTime <= 0;
    },
    () => {
      if (Object.keys(players).length >= 2) {
        prepareRound();
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

const checkWordHintAvailable = (time) => {
  const maxHints = Math.ceil(wordCharLength / 3);
  if (time <= TIME_ROUND_HINT_START * (maxHints - hintsShown.size) / maxHints)
    wordHint = generateWordHint(true);
  players[drawingPlayerName].socket.broadcast.emit(WordMessage.type, new WordMessage(wordHint).getPayload());
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

const generateWordHint = (addHint = false) => {
  if (addHint && hintsShown.size < wordCharLength) {
    let newHintIndex;
    do {
      newHintIndex = Math.floor(Math.random() * word.length);
    } while (!word[newHintIndex].match(/[a-zA-Z]/) || hintsShown.has(newHintIndex));
    hintsShown.add(newHintIndex);
  }
  let result = '';
  word.split('').forEach((char, i) => {
    if (hintsShown.has(i)) {
      result += `${char}\u00A0`;
    }
    else if (char.match(/[a-zA-Z]/)) {
      result += '＿\u00A0'
    } else if (char === ' ') {
      result += '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
    } else {
      result += `${char}\u00A0`;
    }
  });

  return result;
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

    if (gameState == STATE_PLAYING) {
      roundScores[newPlayerName] = 0;
      socket.emit(StartRoundMessage.type, new StartRoundMessage(drawingPlayerName, wordHint, roundsPlayed + 1).getPayload());
    } else if (gameState == STATE_CHOOSING_WORD) {
      socket.emit(ChatMessage.type, new ChatMessage(SERVER_NAME, `${drawingPlayerName} is choosing the word`).getPayload());
    }

    playerNames.forEach(oldPlayerName => {
      if (oldPlayerName == newPlayerName) {
        return;
      }
      players[oldPlayerName].socket.emit(PlayerMessage.type, new PlayerMessage(newPlayerName, players[oldPlayerName]).getPayload());
      players[newPlayerName].socket.emit(PlayerMessage.type, new PlayerMessage(oldPlayerName, players[newPlayerName]).getPayload());
    });

    if (gameState == STATE_IDLE && playerNames.length >= 2) {
      startGame();
    }

    delete tokens[token];
  },
  [DrawMessage.type]: (socket, data, playerName) => {
    if (gameState == STATE_PLAYING && playerName !== drawingPlayerName) {
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
    if (gameState == STATE_PLAYING && playerName != drawingPlayerName && data.text.toLowerCase() === word.toLowerCase()) {
      const score = SCORE_BASE + Math.round(Math.min(SCORE_TIME_MAXIMUM, remainingTime * SCORE_TIME_MULTIPLIER)) + scoreBonus + (winnerScore ? 0 : SCORE_BONUS_FIRST);
      winnerScore = winnerScore || score;
      scoreBonus -= SCORE_BONUS_REDUCTION;
      roundScores[playerName] = score;
      players[playerName].score += score;
      players[playerName].guessed = true;
      socket.emit(ChatMessage.type, new ChatMessage(SERVER_NAME, `You guessed the word! +${score} points`).getPayload());
      socket.broadcast.emit(ChatMessage.type, new ChatMessage(SERVER_NAME, `${data.sender} guessed the word! +${score} points`).getPayload());
      sendToAllPlayers(new PlayerMessage(playerName, players[playerName]));
      if (remainingTime > 10)
        guessingTime = guessingTime - Math.min(TIME_ROUND_REDUCTION, Math.max(0, remainingTime - TIME_ROUND_MINIMUM));
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
  [WordMessage.type]: (socket, data, playerName) => {
    if (playerName != drawingPlayerName || gameState != STATE_CHOOSING_WORD) {
      return;
    }
    clearInterval(timerUpdateInterval);
    word = data.word;
    startRound();
  }
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
