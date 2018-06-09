import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatSliderModule,
  MatSlideToggleModule,
} from '@angular/material';

import { GameComponent } from './game.component';
import { ChatComponent } from './chat/chat.component';
import { PlayerListComponent } from './player-list/player-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatSliderModule,
    MatSlideToggleModule,
    ReactiveFormsModule
  ],
  declarations: [
    GameComponent,
    ChatComponent,
    PlayerListComponent
  ]
})
export class GameModule { }
