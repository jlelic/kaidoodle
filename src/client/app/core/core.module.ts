import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from './api.service';
import { CommunicationService } from './communication.service';
import { PlayersService } from './players.service';
import { SoundsService } from './sounds.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    ApiService,
    CommunicationService,
    PlayersService,
    SoundsService
  ]
})
export class CoreModule { }
