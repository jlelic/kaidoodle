class HandshakeMessage {

  constructor(token) {
    this.token = token;
  }

  static get type(){
    return 'handshake';
  }

  getType() {
    return HandshakeMessage.type;
  }

  getPayload() {
    return {
      protocol: '0.1',
      token: this.token
    };
  }

}

module.exports = HandshakeMessage;
