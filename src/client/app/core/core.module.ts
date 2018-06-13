import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from './api.service';
import { AuthService } from './auth/auth.service';
import { CookiesService } from './cookies.service';
import { CommunicationService } from './communication.service';
import { PlayersService } from './players.service';
import { SoundsService } from './sounds.service';
import { LoggedInGuard } from './auth/logged-in.guard';

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
    LoggedInGuard,
    PlayersService,
    SoundsService
  ]
})
export class CoreModule { }
