import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CookiesService } from './cookies.service';
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
    AuthService,
    CommunicationService,
    CookiesService,
    PlayersService,
    SoundsService
  ]
})
export class CoreModule { }
