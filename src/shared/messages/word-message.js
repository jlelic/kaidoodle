class Message {

  constructor(word) {
    this.payload = { word };
  }

  static get type() {
    return 'word';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
