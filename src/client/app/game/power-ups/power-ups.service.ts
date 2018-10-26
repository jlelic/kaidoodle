import { Injectable } from '@angular/core';
import { CommunicationService } from '../../core/communication.service';

import * as PowerUpEnabledMessage from '../../../../shared/messages/power-up-enabled-message';
import * as PowerUpTriggerMessage from '../../../../shared/messages/power-up-trigger-message';
import * as StartRoundMessage from '../../../../shared/messages/start-round-message';
import * as EndRoundMessage from '../../../../shared/messages/end-round-message';
import * as TimerMessage from '../../../../shared/messages/timer-message';
import * as config from '../../../../shared/config';
import { PlayersService } from '../../core/players.service';
import { AuthService } from '../../core/auth/auth.service';
import { SoundsService } from '../../core/sounds.service';

@Injectable()
export class PowerUpsService {

  private _powerUps = [];
  private _effects = {};
  private _isRoundGoingOn = false;
  private _timeLeft = 0;


  constructor(
    private auth: AuthService,
    private communication: CommunicationService,
    private sounds: SoundsService,
    private players: PlayersService
  ) {
    this.communication.incomingMessages.subscribe(({ type, data }) => {
      switch (type) {
       case PowerUpEnabledMessage.type:
        if(data.enabled){
          this._powerUps.push({...config.POWER_UPS[data.powerUp]});
        } else {
          const index = this._powerUps.findIndex(({ id }) => id == data.powerUp);
          if(index < 0) {
            console.error(`Cannot find ability ${data.powerUp} to remove!`);
            return;
          }
          this._powerUps.splice(index, 1);
        }
        break;
      case PowerUpTriggerMessage.type:
        if(this.auth.loginName == this.players.drawing) {
          return;
        }
        const powerUp = data.powerUp;
        this._effects[powerUp] = this._effects[powerUp] || 0;
        const change = data.active ? 1 : -1;
        if(change>0) {
          this.sounds.playAbilitySound(data.powerUp);
        }
        this._effects[powerUp] += change;
        break;
      case StartRoundMessage.type:
        this._isRoundGoingOn = true;
        break;
      case EndRoundMessage.type:
        this._isRoundGoingOn = false;
        this._effects = [];
        break;
      case TimerMessage.type:
        this._timeLeft = data.time;
        break;
      }
    });
  }

  get powerUps() {
    return this._powerUps;
  }

  get canUse() {
    return this._isRoundGoingOn
      && this._timeLeft > config.POWER_UP_TIME_LEFT_LIMIT
      && this.auth.loginName != this.players.drawing
  }

  public isActive(powerUp: string): boolean {
    return this._effects[powerUp] > 0;
  }

  public isBlackout(): boolean {
    return this.isActive(config.POWER_UPS.blackout.id)
  }

  public isBlurred(): boolean {
    return this.isActive(config.POWER_UPS.blur.id)
  }

  public isGray(): boolean {
    return this.isActive(config.POWER_UPS.gray.id)
  }

  public isRainbow(): boolean {
    return this.isActive(config.POWER_UPS.rainbow.id)
  }

  public isSilenced(): boolean {
    return this.isActive(config.POWER_UPS.silence.id);
  }

  public isHidden(): boolean {
    return this.isActive(config.POWER_UPS.hide.id);
  }

  public reset() {
    this._powerUps = [];
  }

  public use(powerUp: string) {
    let canUse = false;
    this._powerUps.forEach(({id}) => canUse = canUse || id === powerUp);
    if(!canUse) {
      console.error(`Cannot use power-up ${powerUp}`);
      return;
    }
    this.communication.send(new PowerUpTriggerMessage(powerUp));
  }
}
