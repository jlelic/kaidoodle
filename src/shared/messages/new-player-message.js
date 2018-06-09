class Message {

  constructor(name, score) {
    this.payload = { name, score };
  }

  static get type(){
    return 'new-player';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
