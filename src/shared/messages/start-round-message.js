class Message {

  constructor(drawing, word, round) {
    this.payload = { drawing, word, round };
  }

  static get type() {
    return 'start-round';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
