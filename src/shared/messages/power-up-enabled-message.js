class Message {

  constructor(powerUp, enabled) {
    this.payload = { powerUp, enabled};
  }

  static get type() {
    return 'power-up-powerUps';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
