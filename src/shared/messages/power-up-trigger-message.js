class Message {

  constructor(powerUp, active = true) {
    this.payload = { powerUp, active};
  }

  static get type() {
    return 'power-up-trigger';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
