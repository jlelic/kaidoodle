const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const leven = require('leven');
const colorString = require('color-string');
const checkWord = (require('check-word')('en'));

const DiscordBot = require('./discord-bot');

const UserModel = require('./models/user');
const WordModel = require('./models/word');

const config = require('../shared/config');

const HandshakeMessage = require('../shared/messages/handshake-message');
const DrawMessage = require('../shared/messages/draw-message');
const GameOverMessage = require('../shared/messages/game-over-message');
const ChatMessage = require('../shared/messages/chat-message');
const StartRoundMessage = require('../shared/messages/start-round-message');
const EndRoundMessage = require('../shared/messages/end-round-message');
const NewWordsSuggestionsMessage = require('../shared/messages/new-words-suggestions-message');
const PowerUpEnabledMessage = require('../shared/messages/power-up-enabled-message');
const PowerUpTriggerMessage = require('../shared/messages/power-up-trigger-message');
const PlayerMessage = require('../shared/messages/player-message');
const PlayerDisconnectedMessage = require('../shared/messages/player-disconnected-message');
const TimerMessage = require('../shared/messages/timer-message');
const WordMessage = require('../shared/messages/word-message');
const WordChoicesMessage = require('../shared/messages/word-choices-message');

const incomingMessages = [
  HandshakeMessage,
  DrawMessage,
  ChatMessage,
  PowerUpTriggerMessage,
  WordMessage,
  'disconnect'
];

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

const COLOR_TEXT_ERROR = '#ff0000';
const COLOR_TEXT_POWER_UP = '#9300d6';

const players = {};
const drawHistory = [];
const chatHistory = [];
const tempIntervals = [];
const doubleBonus = new Set();
const sabotagingPlayers = new Set();
const newWordsSuggestions = new Map();


let gameState = STATE_IDLE;
let gamePaused = false;
let drawingPlayerName = '';
let lastDrawingPlayerName;
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
let gameId;

const startGame = () => {
  roundsPlayed = 0;
  gameId = uuid();
  roundScores = {};
  const playerNames = Object.keys(players);

  console.log(`Starting new game ${gameId}`);

  if (playerNames.length < 2) {
    return;
  }

  playerNames.forEach(name => {
    players[name].score = 0;
    players[name].powerUps = [];
    sendToAllPlayers(new PlayerMessage(name, players[name]));
  });
  sendChatMessageToAllPlayers('Starting new game');

  UserModel.where({ login: { $in: playerNames } })
    .updateMany({ $set: { lastGameId: gameId, score: 0 } })
    .then(() => {
    }); // :(

  prepareRound();
};

const endGame = () => {
  clearInterval(timerUpdateInterval);

  gameState = STATE_IDLE;

  sendChatMessageToAllPlayers('Game over!');
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
    if (roundsPlayed >= config.MAX_ROUNDS) {
      endGame();
    } else {
      prepareRound();
    }
    return;
  }

  WordModel.findRandom({ $or: [{ deleted: false }, { deleted: null }] }, {}, { limit: 100 }, function(err, randomWords) { // does't work with promises :(
    if (err) {
      endGame();
      sendChatMessageToAllPlayers('Error occured when generating words. Please contact administrator.');
      console.log(err);
      return;
    }
    randomWords.sort((a, b) => (a.lastSeen || 0) - (b.lastSeen || 0));
    const wordChoices = randomWords.slice(0, 2 + Math.floor(Math.random() * 9));
    console.log(`Preparing round, drawing ${drawingPlayerName}, choices: ${wordChoices.map(({ word }) => word).join(', ')}`);
    players[drawingPlayerName].socket.emit(WordChoicesMessage.type, new WordChoicesMessage(wordChoices).getPayload());
    sendChatMessageToAllPlayers(`${drawingPlayerName} is choosing a word`);

    wordChoices.forEach(seenWord => updateWordStats(seenWord.word, false));

    gameState = STATE_CHOOSING_WORD;

    timerUpdateInterval = startTimer(
      (elapsedTime) => {
        remainingTime = config.TIME_WORD_CHOOSE - elapsedTime;
        sendToAllPlayers(new TimerMessage(remainingTime));
        return remainingTime <= 0;
      },
      () => {
        word = wordChoices[0].word;
        startRound();
      }
    );
  });
};

const startRound = () => {
  clearInterval(timerUpdateInterval);

  lastDrawingPlayerName = drawingPlayerName;

  wordCharLength = word.split('').reduce((length, char) => {
    if (char.match(/[a-zA-Z]/)) {
      return length + 1
    }
    return length;
  }, 0);

  wordHint = word.replace(/[ ]/g, '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0');
  wordHint = wordHint.replace(/[a-zA-Z]/g, '_ ');
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
  drawHistory.splice(0, drawHistory.length);
  sendChatMessageToAllPlayers(`${drawingPlayerName} is drawing now!`);

  guessingTime = config.TIME_ROUND_BASE;
  remainingTime = guessingTime;
  winnerScore = 0;
  scoreBonus = config.SCORE_BONUS_MAX;
  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      remainingTime = guessingTime - elapsedTime;
      sendToAllPlayers(new TimerMessage(remainingTime));
      checkWordHintAvailable(remainingTime);
      return remainingTime <= 0;
    },
    () => endRound()
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

  const ratioGuessed = playersGuessed / playersGuessing;
  const drawingPlayerScore = playersGuessed > 0 ? Math.round(winnerScore * ratioGuessed) : config.SCORE_NO_CORRECT_GUESSES;
  roundScores[drawingPlayerName] = drawingPlayerScore;
  if (players[drawingPlayerName]) {
    updatePlayerInDb(drawingPlayerName);
  }
  Object.keys(players).forEach(playerName => {
    players[playerName].score += roundScores[playerName] || 0;
    sendToAllPlayers(new PlayerMessage(playerName, players[playerName]));
    sendNewWordsSuggestions(playerName);
  });


  let msg = `The word was ${word}. ${playersGuessed}/${playersGuessing} guessed. ${drawingPlayerName} receives ${Math.round(ratioGuessed * 100)}% of ${winnerScore} = ${drawingPlayerScore}`;
  if (playersGuessed === 0) {
    msg = `The word was ${word}. No one guessed. ${drawingPlayerName} loses ${-config.SCORE_NO_CORRECT_GUESSES} points`;
  }
  sendChatMessageToAllPlayers(msg, colorString.to.hex([200 - 100 * ratioGuessed, 100 + 100 * ratioGuessed, 0]));
  updateWordStats(word, true);

  tempIntervals.forEach(clearInterval);
  doubleBonus.clear();
  sabotagingPlayers.clear();
  newWordsSuggestions.clear();
  grantAbility();

  drawingPlayerName = null;
  sendToAllPlayers(new EndRoundMessage(word, roundScores));
  clearInterval(timerUpdateInterval);
  timerUpdateInterval = startTimer(
    (elapsedTime) => {
      const remainingTime = config.TIME_COOLDOWN - elapsedTime;
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

const addWordSuggestion = (playerName, suggestion) => {
  let isValid = false;
  try {
    isValid = checkWord.check(suggestion);
  } catch (err) {
  }
  if (!isValid) {
    return;
  }
  if (!newWordsSuggestions.has(playerName)) {
    newWordsSuggestions.set(playerName, new Set());
  }
  newWordsSuggestions.get(playerName).add(suggestion);
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
  if (time <= config.TIME_ROUND_HINT_START * (maxHints - hintsShown.size) / maxHints) {
    wordHint = generateWordHint(true);
    players[drawingPlayerName].socket.broadcast.emit(WordMessage.type, new WordMessage(wordHint).getPayload());
  }
};

const updatePlayerInDb = (login) => {
  UserModel.findOne({ login })
    .update({
      $set: {
        score: players[login].score,
        abilities: players[login].powerUps.join(config.STRING_ARRAY_DELIMITER)
      }
    })
    .then(() => {
    });
};

const getUnixTime = () => {
  return Math.round((new Date()).getTime() / 1000);
};

const startTimer = (updateCallback, doneCallback) => {
  let lastTime = getUnixTime();
  let elapsedTime = 0;
  updateCallback(0);
  const intervalId = setInterval(() => {
      const nowTime = getUnixTime();
      if (!gamePaused) {
        elapsedTime += nowTime - lastTime;
      }
      if (updateCallback(elapsedTime)) {
        doneCallback();
        clearInterval(intervalId);
      }
      lastTime = nowTime;
    },
    1000);
  return intervalId;
};

const sendChatMessageToAllPlayers = (text, color = 'gray') => {
  const message = new ChatMessage(config.SERVER_CHAT_NAME, text, color);
  sendToAllPlayers(message);
  chatHistory.push(message.getPayload());
};

const sendChatMessage = (playerName, text, color = 'gray') => {
  const message = new ChatMessage(config.SERVER_CHAT_NAME, text, color);
  players[playerName].socket.emit(ChatMessage.type, message.getPayload());
  chatHistory.push(message.getPayload());
};

const sendToAllPlayers = (message) => {
  io.sockets.emit(message.getType(), message.getPayload());
};

const sendNewWordsSuggestions = (playerName) => {
  if (!newWordsSuggestions.has(playerName)) {
    return;
  }
  const suggestionsSet = newWordsSuggestions.get(playerName);
  WordModel.find({
    word: {
      $in: [...suggestionsSet]
    }
  })
    .then(words => {
      words.forEach(({word}) => suggestionsSet.delete(word));
      if(suggestionsSet.size == 0) {
        return;
      }
      players[playerName].socket.emit(
        NewWordsSuggestionsMessage.type,
        new NewWordsSuggestionsMessage([...suggestionsSet]).getPayload()
      );
    })
    .catch(console.error);
};

const acceptGuess = (playerName, fake = false) => {
  if (players[playerName].guessed) {
    return;
  }
  const socket = players[playerName].socket;
  let score = config.SCORE_BASE
    + Math.round(Math.min(config.SCORE_TIME_MAXIMUM, remainingTime * config.SCORE_TIME_MULTIPLIER))
    + scoreBonus
    + (winnerScore ? 0 : config.SCORE_BONUS_FIRST);
  if (fake) {
    socket.broadcast.emit(
      PlayerMessage.type,
      new PlayerMessage(playerName, { ...players[playerName], guessed: true }).getPayload()
    );
  } else {
    winnerScore = winnerScore || score;
    if (doubleBonus.has(playerName)) {
      score *= 2;
    }
    scoreBonus -= config.SCORE_BONUS_REDUCTION;
    roundScores[playerName] = score;
    players[playerName].guessed = true;

    sendToAllPlayers(new PlayerMessage(playerName, players[playerName]));
    updatePlayerInDb(playerName);

    if (checkEveryoneGuessed()) {
      endRound();
    }
    socket.emit(ChatMessage.type, new ChatMessage(config.SERVER_CHAT_NAME, `You guessed the word! +${score} points`, '#00cc00').getPayload());
  }
  socket.broadcast.emit(ChatMessage.type, new ChatMessage(config.SERVER_CHAT_NAME, `${playerName} guessed the word! +${score} points`, '#007700').getPayload());
  if (remainingTime > 10)
    guessingTime = guessingTime - Math.min(config.TIME_ROUND_REDUCTION, Math.max(0, remainingTime - config.TIME_ROUND_MINIMUM));

};

const processAdminCommand = (playerName, text) => {
  const [command, ...params] = text.slice(1).split(' ').filter(x => x);
  switch (command) {
    case 'pause':
      if (gamePaused) {
        sendChatMessage(playerName, 'The game is already paused');
        return;
      }
      gamePaused = true;
      sendChatMessageToAllPlayers(`${playerName} paused the game`);
      break;
    case 'play':
      if (!gamePaused) {
        sendChatMessage(playerName, 'The game is already in progress');
        return;
      }
      gamePaused = false;
      sendChatMessageToAllPlayers(`${playerName} resumed the game`);
      break;
    case 'kick':
      if (params.length == 0) {
        sendChatMessage(playerName, 'Usage: /kick <player name>',);
      }
      const toKick = params[0];
      if (!players[toKick]) {
        sendChatMessage(playerName, `Player ${toKick} not found`, COLOR_TEXT_ERROR);
        return;
      }
      players[toKick].socket.disconnect(0);
      const messageText = `${toKick} was kicked by ${playerName}`;
      sendChatMessageToAllPlayers(messageText);
      console.log(messageText);
  }
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

const grantAbility = () => {
  if (Math.random() > config.POWER_UP_CHANCE) {
    return;
  }
  let lowestScore = 900000;
  let playerToReceive = null;
  const playerNames = Object.keys(players);
  playerNames.forEach(name => {
    if (players[name].score < lowestScore) {
      playerToReceive = name;
      lowestScore = players[name].score;
    }
  });

  if (playerToReceive == null
    || players[playerToReceive].powerUps.length >= config.MAX_POWER_UPS
    || Math.random() < config.POWER_UP_TO_RANDOM_PLAYER_CHANCE
  ) {
    playerToReceive = playerNames[Math.floor(Math.random() * playerNames.length)];
  }

  if (!playerToReceive || players[playerToReceive].powerUps.length >= config.MAX_POWER_UPS) {
    return;
  }

  const powerUpList = Object.keys(config.POWER_UPS);
  const powerUpToGift = powerUpList[Math.floor(Math.random() * powerUpList.length)];

  players[playerToReceive].powerUps.push(powerUpToGift);
  players[playerToReceive].socket.emit(PowerUpEnabledMessage.type, new PowerUpEnabledMessage(powerUpToGift).getPayload());
  players[playerToReceive].socket.emit(ChatMessage.type,
    new ChatMessage(
      config.SERVER_CHAT_NAME,
      `You have received ability '${config.POWER_UPS[powerUpToGift].name}'! You can use it while guessing with more than ${config.POWER_UP_TIME_LEFT_LIMIT} seconds left!`,
      COLOR_TEXT_POWER_UP
    ).getPayload()
  );
  updatePlayerInDb(playerToReceive);
  console.log(`Player ${playerToReceive} received ability ${powerUpToGift}`);
};

const resolveSelfAbility = (playerName, ability) => {
  const player = players[playerName];
  switch (ability.id) {
    case config.POWER_UPS.reveal.id:
      player.socket.emit(WordMessage.type, new WordMessage(word[0] + wordHint.substring(1)).getPayload());
      break;
    case config.POWER_UPS.double.id:
      doubleBonus.add(playerName);
      sendChatMessageToAllPlayers(`${playerName} will get double points if their next guess is correct!`, COLOR_TEXT_POWER_UP);
      player.socket.broadcast.emit(PowerUpTriggerMessage.type, new PowerUpTriggerMessage(ability.id));
      break;
    case config.POWER_UPS.fakeGuess.id:
      acceptGuess(playerName, true);
      break;
    case config.POWER_UPS.sabotage.id:
      sabotagingPlayers.add(playerName);
      const sabotageInterval = startTimer(
        elapsedTime => config.POWER_UPS.sabotage.duration < elapsedTime,
        () => {
          sabotagingPlayers.delete(playerName);
          sendChatMessage(playerName, 'Sabotage ended', COLOR_TEXT_POWER_UP);
        }
      );
      tempIntervals.push(sabotageInterval);
      break;
  }
};

const updateWordStats = (wordToUpdate, played) => {
  WordModel.findOne({ word: wordToUpdate })
    .then(w => {
      if (played) {
        if (Object.keys(players).length < 4) {
          w.played++;
        }
        w.lastPlayed = +new Date();
      }
      w.lastSeen = +new Date();
      return w.save();
    })
    .then(() => {
    });
};

const wsHandlers = {
  [HandshakeMessage.type]: (socket, data) => {
    const { token } = data;
    UserModel.findOne({ token })
      .then(user => {
        let { login, score, abilities, lastGameId } = user;
        const newPlayerName = login;
        if (!newPlayerName) {
          console.error(`Unknown player token ${token}!`);
          return;
        }
        console.log(`Identified player ${newPlayerName}`);
        socket.emit(HandshakeMessage.type, { name: newPlayerName });

        if (lastGameId !== gameId) {
          score = 0;
          abilities = '';
          user.lastGameId = gameId;
          user.save().then(() => {
          });
        }

        if (players[newPlayerName]) {
          players[newPlayerName].socket.disconnect();
        }

        players[newPlayerName] = {
          socket,
          score,
          guessed: false,
          powerUps: abilities.split(config.STRING_ARRAY_DELIMITER).filter(x => x)
        };

        players[newPlayerName].powerUps.forEach(ability => {
          socket.emit(PowerUpEnabledMessage.type, new PowerUpEnabledMessage(ability, true, false).getPayload());
        });

        const playerNames = Object.keys(players);

        if (gameState == STATE_PLAYING) {
          roundScores[newPlayerName] = 0;
          socket.emit(StartRoundMessage.type, new StartRoundMessage(drawingPlayerName, wordHint, roundsPlayed + 1).getPayload());
        } else if (gameState == STATE_CHOOSING_WORD) {
          socket.emit(ChatMessage.type, new ChatMessage(config.SERVER_CHAT_NAME, `${drawingPlayerName} is choosing a word`, 'gray').getPayload());
        }

        drawHistory.forEach((data) => socket.emit(DrawMessage.type, data));
        chatHistory.forEach((data) => socket.emit(ChatMessage.type, data));

        playerNames.forEach(oldPlayerName => {
          players[oldPlayerName].socket.emit(PlayerMessage.type, new PlayerMessage(newPlayerName, players[newPlayerName]).getPayload());
          if (oldPlayerName == newPlayerName) {
            return;
          }
          players[newPlayerName].socket.emit(PlayerMessage.type, new PlayerMessage(oldPlayerName, players[oldPlayerName]).getPayload());
        });

        sendChatMessageToAllPlayers(`${login} connected`);

        if (gameState == STATE_IDLE && playerNames.length >= 2) {
          startGame();
        }

        DiscordBot.updateBotStatus(playerNames);
      })
  },
  [DrawMessage.type]: (socket, data, playerName) => {
    if (gameState == STATE_PLAYING && playerName !== drawingPlayerName && !sabotagingPlayers.has(playerName)) {
      console.warn(`${playerName} is trying to draw on another player's round!`);
      return;
    }
    socket.broadcast.emit(DrawMessage.type, data);
    if (data.tool == 'clear') {
      drawHistory.splice(0, drawHistory.length);
    } else {
      drawHistory.push(data)
    }
  },
  [ChatMessage.type]: (socket, data, playerName) => {
    if (playerName !== data.sender) {
      console.warn(`${playerName} is trying to send chat message under name ${data.sender}`);
    }
    data.sender = playerName;
    if (data.text.startsWith(config.ADMIN_COMMAND_PREFIX)) {
      processAdminCommand(playerName, data.text);
      return;
    }
    if (gameState == STATE_PLAYING
      && word
      && data.text.trim()
      && playerName != drawingPlayerName
      && (
        data.text.trim().toLowerCase() === word.toLowerCase()
        || data.text.trim().toLowerCase() === word.replace(/-/g, '').toLowerCase()
      )
    ) {
      acceptGuess(playerName);
      return;
    } else if (data.text && word) {
      const lDistance = leven(data.text, word);
      if (lDistance == 1) {
        socket.emit(ChatMessage.type, new ChatMessage(config.SERVER_CHAT_NAME, `${data.text} is really close!`, '#3153ff').getPayload());
      } else if (lDistance == 2 && remainingTime <= config.TIME_ROUND_MINIMUM) {
        socket.emit(ChatMessage.type, new ChatMessage(config.SERVER_CHAT_NAME, `${data.text} is kinda close!`, '#5078cc').getPayload());
      }
      addWordSuggestion(playerName, data.text);
    }
    if (doubleBonus.has(playerName)) {
      sendChatMessageToAllPlayers(`${playerName} lost double bonus!`, COLOR_TEXT_POWER_UP);
      doubleBonus.delete(playerName);
    }
    socket.broadcast.emit(ChatMessage.type, data);
    while (chatHistory.length >= 20) {
      chatHistory.shift();
    }
    chatHistory.push(data)
  },
  [PowerUpTriggerMessage.type]: (socket, data, playerName) => {
    const powerUp = config.POWER_UPS[data.powerUp];

    let canCast = false;
    let powerUpIndex;

    if (!powerUp) {
      sendChatMessage(playerName, 'Unknown ability, please refresh the page using "Ctrl + F5"', COLOR_TEXT_ERROR);
      return;
    }

    players[playerName].powerUps.forEach((playerPowerUp, i) => {
      if (playerPowerUp === powerUp.id) {
        canCast = true;
        powerUpIndex = i;
      }
    });

    socket.emit(PowerUpEnabledMessage.type, new PowerUpEnabledMessage(data.powerUp, false).getPayload());

    if (!canCast) {
      console.error(`${playerName} cannot use power-up ${powerUp.id}`);
      players[playerName].socket.emit(ChatMessage.type,
        new ChatMessage(
          config.SERVER_CHAT_NAME,
          `Cannot use ${powerUp.name}!`,
          COLOR_TEXT_ERROR
        ).getPayload());
      return;
    }

    players[playerName].powerUps.splice(powerUpIndex, 1);

    players[playerName].socket.emit(ChatMessage.type, new ChatMessage(
      config.SERVER_CHAT_NAME,
      `${powerUp.name} activated!`,
      COLOR_TEXT_POWER_UP
    ).getPayload());

    const getEmitter = () => powerUp.self ? socket : socket.broadcast; // socket.broadcast is single use?! :(

    if (powerUp.self) {
      resolveSelfAbility(playerName, powerUp)
    } else if (powerUp.message) {
      const chatMsg = new ChatMessage(config.SERVER_CHAT_NAME, powerUp.message, COLOR_TEXT_POWER_UP);
      Object.keys(players).forEach(pName => {
        if (pName === drawingPlayerName || pName === playerName) {
          return
        }
        players[pName].socket.emit(ChatMessage.type, chatMsg.getPayload());
      });
    }

    getEmitter().emit(PowerUpTriggerMessage.type, new PowerUpTriggerMessage(data.powerUp, true).getPayload());

    const duration = powerUp.duration;
    const powerUpInterval = startTimer(
      (elapsedTime) => duration < elapsedTime,
      () => {
        if (duration) {
          getEmitter().emit(PowerUpTriggerMessage.type, new PowerUpTriggerMessage(data.powerUp, false).getPayload());
        }
      }
    );
    tempIntervals.push(powerUpInterval);
  },
  [WordMessage.type]: (socket, data, playerName) => {
    if (gamePaused) {
      sendChatMessage(playerName, 'Cannot choose the word while the game is paused', COLOR_TEXT_ERROR);
      return;
    }
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
          sendChatMessageToAllPlayers(`${name} disconnected`);

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
        DiscordBot.updateBotStatus(playerNames);
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
app.use(express.json({ type: 'application/json', limit: '10mb' }));


app.post('/api/login', (req, res, next) => {
  console.log(req.body);

  const { login, password, newAccount } = req.body;

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
    .then(user => {
      const token = uuid();
      user.token = token;
      return user.save();
    })
    .then(({ token, login }) => res.json({ token, login }))
    .catch(err => next(err));
});

app.post('/api/autoLogin', (req, res, next) => {
  const { token } = req.body;

  UserModel.findOne({ token })
    .then(user => {
      if (!user) {
        throw 'Login token invalid!'
      }
      const token = uuid();
      user.token = token;
      return user.save();
    })
    .then(({ token, login }) => {
      res.json({ token, login });
    })
    .catch(err => next(err));
});

app.use((req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    throw 'You must be logged in';
  }

  UserModel.findOne({ token })
    .then(user => {
      if (!user) {
        throw 'You must be logged in';
      }
      req.user = user;
      next();
    })
});

app.get('/api/words', (req, res, next) => {
  const page = req.query.p || 0;
  const limit = req.query.pageSize || 50;

  if (page <= 0) {
    throw `Invalid page number ${page}`;
  }

  WordModel.paginate({}, { page, limit, sort: [['_id', 1]] })
    .then(result => {
      res.json(result);
    })
    .catch(err => next(err));
});

app.post('/api/words', (req, res, next) => {
  const allWords = req.body.words.map(word => word.toLowerCase());
  const addedBy = req.user.login;
  const force = req.body.force;

  const lastSeen = getUnixTime();

  const validWords = [];
  const invalid = [];
  const short = [];
  allWords.forEach(word => {
    let isValid = false;
    try {
      isValid = checkWord.check(word);
    } catch (err) {
    }
    if (!word || (!force && !isValid)) {
      invalid.push(word)
    } else if (word.length < 3) {
      short.push(word)
    } else {
      word = word.toLowerCase();
      validWords.push({ word, addedBy, lastSeen })
    }
  });

  WordModel.insertMany(validWords, { ordered: false })
    .then((x) => {
      res.json({
        added: validWords.map(({ word }) => word),
        invalid
      });
    })
    .catch(err => {
      if (!err.writeErrors && err.code == 11000) {
        err.writeErrors = [err];
      }
      if (!err.writeErrors) {
        throw err;
      }
      const addedSet = new Set(validWords.map(({ word }) => word));
      const duplicate = [];
      const error = [];
      err.writeErrors.forEach(we => {
        const word = we.getOperation().word;
        addedSet.delete(word);
        if (we.code == 11000) {
          duplicate.push(word);
        } else {
          error.push(word);
        }
      });
      const added = [...addedSet];
      res.json({ added, short, duplicate, error, invalid });
    })
    .catch(err => next(err));
});

app.delete('/api/word/:word', (req, res, next) => {
  const { word } = req.params;
  WordModel.findOne({ word })
    .then(entry => {
      entry.deleted = true;
      entry.deletedBy = req.user.login;
      return entry.save();
    })
    .then(result => res.json(result))
    .catch(err => next(err));

});

let lastSharedTime;
let lastSharedBy;
app.post('/api/discord/share', (req, res, next) => {
  const now = getUnixTime();
  if (now - lastSharedTime < 5) {
    throw `${lastSharedBy} already shared the image ${now - lastSharedTime} seconds ago!`
  }
  lastSharedTime = getUnixTime();
  lastSharedBy = req.user.login;
  let text;
  switch (gameState) {
    case STATE_PLAYING:
      text = `${drawingPlayerName} is drawing ${wordHint}. Shared by ${lastSharedBy}`;
      break;
    case STATE_COOLDOWN:
    case STATE_CHOOSING_WORD:
      text = `${lastDrawingPlayerName} was drawing ${word}. Shared by ${lastSharedBy}`;
      break;
    default:
      text = `Shared by ${lastSharedBy}`;
  }
  DiscordBot.shareImage(text, req.body.data)
    .then((msg) => {
      sendChatMessageToAllPlayers(
        `${lastSharedBy} shared <a target="_blank" href="${msg.attachments.first().proxyURL}">this image</a> on the discord channel!`,
        '#7586d6');
      res.json({});
    })
    .catch(err => next(err));
});


app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).send({ message: error.toString() })
});

server.listen(PORT, () => console.log(`Game server is listening on ${PORT}`));
