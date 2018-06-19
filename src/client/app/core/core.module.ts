import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from './api.service';
import { AuthService } from './auth/auth.service';
import { CookiesService } from './cookies.service';
import { CommunicationService } from './communication.service';
import { PlayersService } from './players.service';
import { SoundsService } from './sounds.service';
import { LoggedInGuard } from './auth/logged-in.guard';
import { DiscordService } from './discord/discord.service';
import { ChatService } from './chat/chat.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    ApiService,
    AuthService,
    ChatService,
    CommunicationService,
    CookiesService,
    DiscordService,
    LoggedInGuard,
    PlayersService,
    SoundsService
  ]
})
export class CoreModule { }
