class Message {

  constructor(words) {
    this.payload = { words };
  }

  static get type() {
    return 'word-choices';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
