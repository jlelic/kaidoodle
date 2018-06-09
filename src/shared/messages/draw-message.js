class Message {

  constructor(tool, thickness, x, y, prevX, prevY) {
    this.payload = {tool, thickness, x, y, prevX, prevY};
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
