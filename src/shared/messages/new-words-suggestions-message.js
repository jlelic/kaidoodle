class Message {

  constructor(words) {
    this.payload = { words };
  }

  static get type() {
    return 'new-words-suggestions';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
