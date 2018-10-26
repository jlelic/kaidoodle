import { Injectable } from '@angular/core';
import { CommunicationService } from '../../core/communication.service';

import * as PowerUpEnabledMessage from '../../../../shared/messages/power-up-enabled-message';
import * as PowerUpTriggerMessage from '../../../../shared/messages/power-up-trigger-message';
import * as StartRoundMessage from '../../../../shared/messages/start-round-message';
import * as config from '../../../../shared/config';

@Injectable()
export class PowerUpsService {

  private _powerUps = [];
  private _effects = {};


  constructor(private communication: CommunicationService) {
    this.communication.incomingMessages.subscribe(({ type, data }) => {
      if (type === PowerUpEnabledMessage.type) {
        if(data.enabled){
          this._powerUps.push({...config.POWER_UPS[data.powerUp]});
        } else {
          const index = this._powerUps.indexOf(({id}) => id == data.powerUp);
          this._powerUps.splice(index, 1);
        }
      } else if (type === PowerUpTriggerMessage.type) {
        const powerUp = data.powerUp;
        this._effects[powerUp] = this._effects[powerUp] || 0;
        const change = data.active ? 1 : -1;
        this._effects[powerUp] += change;
        console.log(this._effects);
      } else if (type === StartRoundMessage.type) {
        this.reset();
      }
    });
    this._powerUps.push({id: "silence", description: "Loream ekio wo wdpm dpon dp w pad dp 20 scoendo. definitelt. ou heaj."});
  }

  get powerUps() {
    return this._powerUps;
  }

  public isActive(powerUp: string): boolean {
    return this._effects[powerUp] > 0;
  }

  public isBlackout(): boolean {
    return this.isActive(config.POWER_UPS.blackout.id)
  }

  public isBlurred(): boolean {
    return this.isActive(config.POWER_UPS.blackout.id)
  }

  public isSilenced(): boolean {
    return this.isActive(config.POWER_UPS.silence.id);
  }

  public isHidden(): boolean {
    return this.isActive(config.POWER_UPS.hide.id);
  }

  private reset() {
    this._effects = [];
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
