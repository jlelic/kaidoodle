class Message {

  constructor(powerUp, enabled = true) {
    this.payload = { powerUp, enabled};
  }

  static get type() {
    return 'power-up-enabled';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
