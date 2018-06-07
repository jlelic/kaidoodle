class Message {

  constructor(name) {
    this.payload = { name };
  }

  static get type(){
    return 'player-connected';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
