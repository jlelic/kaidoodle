class Message {

  constructor(drawing, word) {
    this.payload = {drawing, word};
  }

  static get type(){
    return 'start-game';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
