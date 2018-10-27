class Message {

  constructor(powerUp, enabled = true, isNew = true) {
    this.payload = { powerUp, enabled, isNew };
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
