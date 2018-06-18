class Message {

  constructor(sender, text, color = 'black') {
    this.payload = { sender, text, color };
  }

  static get type() {
    return 'chat';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
