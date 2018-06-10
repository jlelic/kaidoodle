class Message {

  constructor(tool, color, thickness, x, y, prevX, prevY) {
    this.payload = {tool, color, thickness, x, y, prevX, prevY};
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
