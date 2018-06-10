class Message {

  constructor(word, results) {
    this.payload = { word, results };
  }

  static get type() {
    return 'end-round';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
