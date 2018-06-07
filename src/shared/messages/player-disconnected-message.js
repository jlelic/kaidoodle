class Message {

  constructor(name) {
    this.payload = { name };
  }

  static get type(){
    return 'player-disconnected';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
