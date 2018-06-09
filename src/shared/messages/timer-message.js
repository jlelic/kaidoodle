class Message {

  constructor(time) {
    this.payload = { time };
  }

  static get type(){
    return 'timer';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }
}

module.exports = Message;
