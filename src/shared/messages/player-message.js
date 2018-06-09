class Message {

  constructor(name, playerData) {
    this.payload = { name, score: playerData.score, guessed: playerData.guessed };
  }

  static get type() {
    return 'player';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
