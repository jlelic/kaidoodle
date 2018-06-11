class Message {

  constructor() {
  }

  static get type(){
    return 'game-over';
  }

  getType() {
    return Message.type;
  }

  getPayload() {
    return {};
  }
}

module.exports = Message;
