import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatButtonToggleModule
} from '@angular/material';

import { GameComponent } from './game.component';
import { ChatComponent } from './chat/chat.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ThicknessPickerComponent } from './thickness-picker/thickness-picker.component';
import { PowerUpsComponent } from './power-ups/power-ups.component';
import { PowerUpsService } from './power-ups/power-ups.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    ReactiveFormsModule
  ],
  declarations: [
    GameComponent,
    ChatComponent,
    PlayerListComponent,
    ColorPickerComponent,
    ToolbarComponent,
    ThicknessPickerComponent,
    PowerUpsComponent
  ],
  providers: [
    PowerUpsService
  ]
})
export class GameModule { }
