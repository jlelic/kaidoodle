import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import * as HandshakeMessage from '../../../shared/messages/handshake-message';

interface Message {
  getType;
  getPayload;
}

@Injectable()
export class CommunicationService {

  socket;

  constructor() {
    this.socket = io('http://localhost:3000');
    // this.socket.on('connection', () => {
    //   console.log('Websocket connection established.');
    //   this.send(new HandshakeMessage())
    // });
  }

  public send(message: Message){
    this.socket.emit(message.getType(), message.getPayload());
  }

}
