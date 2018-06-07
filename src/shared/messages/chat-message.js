class Message {

  constructor(sender, text) {
    this.payload = {sender, text};
  }

  static get type(){
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
