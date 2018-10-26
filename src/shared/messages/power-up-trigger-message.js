class Message {

  constructor(powerUp, active = true, player = '') {
    this.payload = { powerUp, active, player };
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
