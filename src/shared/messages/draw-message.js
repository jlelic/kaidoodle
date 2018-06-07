class Message {

  constructor(x, y, prevX, prevY) {
    this.payload = {x, y, prevX, prevY};
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
