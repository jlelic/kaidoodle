import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import * as HandshakeMessage from '../../../shared/messages/handshake-message';
import { ApiService } from "./api.service";
import { Subject } from 'rxjs/Subject';

interface Message {
  getType;
  getPayload;
}

@Injectable()
export class CommunicationService {

  socket;
  serverUrl = window.location.origin;
  private _name: string;
  private _incomingMessages: Subject<any>;

  constructor(api: ApiService) {
    this._incomingMessages = new Subject();
  }

  get incomingMessages() {
    return this._incomingMessages;
  }

  get name() {
    return this._name;
  }

  init(token: string) {
    this.socket = io(this.serverUrl);

    const onevent = this.socket.onevent;
    this.socket.onevent = function (packet) {
      const args = packet.data || [];
      onevent.call (this, packet);    // original call
      packet.data = ["*"].concat(args);
      onevent.call(this, packet);      // additional call to catch-all
    };

    this.socket.on('connect', () => {
      console.log('Websocket connection established.');
      this.send(new HandshakeMessage(token))
    });

    this.socket.on([HandshakeMessage.type], ({name}) => {
      this._name = name;
    });

    this.socket.on("*", (type, data) => {
      this._incomingMessages.next({type, data});
    });
  }

  send(message: Message){
    this.socket.emit(message.getType(), message.getPayload());
  }

}
