const uuid = require('uuid/v4');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const HandshakeMessage = require('../shared/messages/handshake-message');
const DrawMessage = require('../shared/messages/draw-message');
const ChatMessage = require('../shared/messages/chat-message');
const StartGameMessage = require('../shared/messages/start-game-message');
const NewPlayerMessage = require('../shared/messages/new-player-message');
const PlayerDisconnectedMessage = require('../shared/messages/player-disconnected-message');

const incomingMessages = [HandshakeMessage, DrawMessage, ChatMessage, 'disconnect'];

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
}

const STATE_IDLE = 'IDLE';
const STATE_PLAYING = 'PLAYING';
const STATE_COOLDOWN = 'COOLDOWN';

const tokens = {};
const players = {};
const drawHistory = [];
const chatHistory = [];

let appState = STATE_IDLE;
let drawingPlayerName = '';

const startGame = () => {
  const word = 'kai';
  const wordHint = word.replace(/./g,'_ ');
  const playerNames = Object.keys(players);
  drawingPlayerName = playerNames[Math.floor(Math.random()*playerNames.length)];
  playerNames.forEach(name => {
    const message = new StartGameMessage(
      drawingPlayerName,
      name === drawingPlayerName ? word : wordHint
    );
    players[name].socket.emit(message.getType(), message.getPayload());
  });
  console.log(`Starting game, word: ${word}, player ${drawingPlayerName} drawing`);
  appState = STATE_PLAYING;
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
    socket.emit(HandshakeMessage.type, {name: newPlayerName});
    drawHistory.forEach((data) => socket.emit(DrawMessage.type ,data));
    chatHistory.forEach((data) => socket.emit(ChatMessage.type ,data));
    players[newPlayerName] = { socket, score: 0 };

    const playerNames = Object.keys(players);

    playerNames.forEach(oldPlayerName => {
      if(oldPlayerName == newPlayerName) {
        return;
      }
      const score = players[oldPlayerName].score;
      players[oldPlayerName].socket.emit(NewPlayerMessage.type, new NewPlayerMessage(newPlayerName, 0).getPayload());
      players[newPlayerName].socket.emit(NewPlayerMessage.type, new NewPlayerMessage(oldPlayerName, score).getPayload());
    });

    if (appState == STATE_IDLE && playerNames.length >= 2) {
      startGame();
    }

    delete tokens[token];
  },
  [DrawMessage.type]: (socket, data) => {
    socket.broadcast.emit(DrawMessage.type, data);
    while(drawHistory.length >= 1000) {
      drawHistory.shift();
    }
    drawHistory.push(data)
  },
  [ChatMessage.type]: (socket, data) => {
    socket.broadcast.emit(ChatMessage.type, data);
    while(chatHistory.length >= 10) {
      chatHistory.shift();
    }
    chatHistory.push(data)
  },
};


io.on('connection', (socket) => {
  console.log('New websocket connection.');
  incomingMessages.forEach(msg => {
    socket.on(msg.type, data => {
      console.log(`${msg.type}: ${JSON.stringify(data)}`);
      const handler = wsHandlers[msg.type];
      if(!handler){
        console.warn(`No websocket handler for ${msg.type} message type!`);
        return;
      }
      handler(socket, data);
    });
    socket.on('disconnect', () => {
      Object.keys(players).forEach(name => {
        if(players[name].socket == socket) {
          socket.broadcast.emit(PlayerDisconnectedMessage.type, { name });
          delete players[name];
          console.log(`Player ${name} disconnected!`)
        }
      })
    });
  });
});

// allow cors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


app.post('/api/login', (req, res) => {
  console.log(req.body);
  const { login } = req.body;
  const token = uuid();
  tokens[token] = login;
  res.json({ token });
});

server.listen(port, () => console.log(`Game server is listening on ${port}`));
