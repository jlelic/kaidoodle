class Message {

  constructor(x, y) {
    this.payload = {x, y};
  }

  static get type(){
    return 'draw';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return this.payload;
  }

}

module.exports = Message;
