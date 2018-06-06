import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import * as HandshakeMessage from '../../../shared/messages/handshake-message';
import { ApiService } from "./api.service";

interface Message {
  getType;
  getPayload;
}

@Injectable()
export class CommunicationService {

  socket;
  serverUrl: string;

  constructor(api: ApiService) {
    this.serverUrl = api.serverUrl;
  }

  init(token: string) {
    this.socket = io(this.serverUrl);
    this.socket.on('connect', () => {
      console.log('Websocket connection established.');
      this.send(new HandshakeMessage(token))
    });
  }

  send(message: Message){
    this.socket.emit(message.getType(), message.getPayload());
  }

}
