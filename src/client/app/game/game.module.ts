import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatSliderModule
} from '@angular/material';

import { GameComponent } from './game.component';
import { ChatComponent } from './chat/chat.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSliderModule,
    ReactiveFormsModule
  ],
  declarations: [
    GameComponent,
    ChatComponent,
    PlayerListComponent,
    ColorPickerComponent,
    ToolbarComponent
  ]
})
export class GameModule { }
