const uuid = require('uuid/v4');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const HandshakeMessage = require('../shared/messages/handshake-message');

const messages = [HandshakeMessage];

const tokens = {};
const players = {};


const wsHandlers = {
  [HandshakeMessage.type]: (socket, data) => {
    const { token } = data.token;
    const login = tokens[token];
    if (!login) {
      console.error(`Unknown player token ${token}!`);
      return;
    }
    console.log(`Identified player ${login}`);
    players[login] = {};
    delete tokens[token];
  }
};


io.on('connection', (socket) => {
  console.log('New websocket connection.');
  messages.forEach(msg => {
    socket.on(msg.type, data => {
      console.log(`${msg.type}: ${JSON.stringify(data)}`);
      wsHandlers[msg.type](socket, data);
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


app.post('/login', (req, res) => {
  console.log(req.body);
  const { login } = req.body;
  const token = uuid();
  tokens[token] = login;
  res.json({ token });
});

server.listen(3000);
