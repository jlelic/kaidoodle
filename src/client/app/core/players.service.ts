import { Injectable } from '@angular/core';

import { CommunicationService } from './communication.service';
import * as HandshakeMessage from '../../../shared/messages/handshake-message';
import * as PlayerConnectedMessage from '../../../shared/messages/player-connected-message';
import * as PlayerDisconnectedMessage from '../../../shared/messages/player-disconnected-message';

@Injectable()
export class PlayersService {

  private _players = [];

  constructor(private communication: CommunicationService) {
    this.communication.incomingMessages.subscribe(({type, data}) => {
      switch(type){
        case HandshakeMessage.type:
          this._players.push({ name: data.name });
          break;
        case PlayerConnectedMessage.type:
          this._players.push({ name: data.name });
          break;
        case PlayerDisconnectedMessage.type:
          const index = this._players.findIndex(({name}) => name == data.name);
          this._players.splice(index, 1);
          break;
      }
    })
  }

  get players() {
    return this._players;
  }

}
