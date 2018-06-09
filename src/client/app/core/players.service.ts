import { Injectable } from '@angular/core';

import { CommunicationService } from './communication.service';
import * as HandshakeMessage from '../../../shared/messages/handshake-message';
import * as NewPlayerMessage from '../../../shared/messages/new-player-message';
import * as PlayerDisconnectedMessage from '../../../shared/messages/player-disconnected-message';
import * as StartGameMessage from '../../../shared/messages/start-game-message';

@Injectable()
export class PlayersService {

  private _players = [];
  private _drawing = null;

  constructor(private communication: CommunicationService) {
    this.communication.incomingMessages.subscribe(({type, data}) => {
      switch(type){
        case HandshakeMessage.type:
          this._players.push({ name: data.name, score: 0 });
          break;
        case NewPlayerMessage.type:
          this._players.push({ name: data.name, score: data.score });
          break;
        case PlayerDisconnectedMessage.type:
          const index = this._players.findIndex(({name}) => name == data.name);
          this._players.splice(index, 1);
          break;
        case StartGameMessage.type:
          this._drawing = data.drawing;
          break;
      }
    })
  }

  get players() {
    return this._players;
  }

  get drawing() {
    return this._drawing;
  }

}
