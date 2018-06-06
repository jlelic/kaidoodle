const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const HandshakeMessage = require('../shared/messages/handshake-message');

const messages = [HandshakeMessage];

io.on('connection', (socket) => {
  console.log('New websocket connection.');
  messages.forEach(msg => {
    socket.on(msg.type, data => console.log(`${msg.type}: ${JSON.stringify(data)}`));
  });
});

server.listen(3000);
