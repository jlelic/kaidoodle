import { Injectable } from '@angular/core';

import { CommunicationService } from './communication.service';
import * as HandshakeMessage from '../../../shared/messages/handshake-message';
import * as PlayerMessage from '../../../shared/messages/player-message';
import * as PlayerDisconnectedMessage from '../../../shared/messages/player-disconnected-message';
import * as StartRoundMessage from '../../../shared/messages/start-round-message';

@Injectable()
export class PlayersService {

  private _players = [];
  private _drawing = null;

  constructor(private communication: CommunicationService) {
    this.communication.incomingMessages.subscribe(({ type, data }) => {
      switch (type) {
        case HandshakeMessage.type:
          this._players.push({ name: data.name, score: 0 });
          break;
        case PlayerMessage.type:
          let updatedPlayer = false;
          this._players.forEach((player, index) => {
            if (updatedPlayer) {
              return
            }
            if (player.name == data.name) {
              this.updatePlayerData(this._players[index], data);
              updatedPlayer = true
            }
          });
          if (!updatedPlayer) {
            const newPlayer = {};
            this.updatePlayerData(newPlayer, data);
            this._players.push(newPlayer);
          }
          this.sortPlayers();
          break;
        case PlayerDisconnectedMessage.type:
          const index = this._players.findIndex(({ name }) => name == data.name);
          this._players.splice(index, 1);
          break;
        case StartRoundMessage.type:
          this._drawing = data.drawing;
          this._players.forEach(player => player.guessed = false);
          break;
        case 'disconnect':
          this._players = [];
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

  private sortPlayers() {
    this._players.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (!scoreDiff) {
        return a.name.localeCompare(b.name);
      }
      return scoreDiff;
    });
  }

  private updatePlayerData(player, data) {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'undefined') {
        return;
      }
      player[key] = data[key];
    });
  }
}
