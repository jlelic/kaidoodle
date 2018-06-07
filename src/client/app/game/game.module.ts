import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { GameComponent } from './game.component';
import { ChatComponent } from './chat/chat.component';
import { PlayerListComponent } from './player-list/player-list.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  declarations: [
    GameComponent,
    ChatComponent,
    PlayerListComponent
  ]
})
export class GameModule { }
