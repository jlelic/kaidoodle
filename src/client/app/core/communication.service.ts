import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs/Subject';
import * as io from 'socket.io-client';

import * as HandshakeMessage from '../../../shared/messages/handshake-message';
import { AuthService } from './auth.service';

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

  constructor(private auth: AuthService, private router: Router) {
    this._incomingMessages = new Subject();
  }

  get incomingMessages() {
    return this._incomingMessages;
  }

  get name() {
    return this._name;
  }

  init() {
    if (!this.auth.token) {
      throw 'Token missing!';
    }

    this.socket = io(this.serverUrl, { reconnection: false });

    const onevent = this.socket.onevent;
    this.socket.onevent = function (packet) {
      const args = packet.data || [];
      onevent.call(this, packet);    // original call
      packet.data = ["*"].concat(args);
      onevent.call(this, packet);      // additional call to catch-all
    };

    this.socket.on('connect', () => {
      console.log('Websocket connection established.');
      this.send(new HandshakeMessage(this.auth.token))
    });

    this.socket.on('disconnect', () => {
      console.log('Websocket connection closed.');
      window.alert('Yo have been disconnected from the game!');
      this.router.navigate(['/menu']);
    });

    this.socket.on([HandshakeMessage.type], ({ name }) => {
      this._name = name;
    });

    this.socket.on("*", (type, data) => {
      this._incomingMessages.next({ type, data });
    });
  }

  send(message: Message) {
    this.socket.emit(message.getType(), message.getPayload());
  }

}
