class HandshakeMessage {
  static get type(){
    return 'handshake';
  }

  getType() {
    return HandshakeMessage.type;
  }

  getPayload() {
    return { protocol: '0.1' };
  }

}

module.exports = HandshakeMessage;
