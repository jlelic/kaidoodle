class Message {

  constructor(drawing, word) {
    this.payload = {drawing, word};
  }

  static get type(){
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
