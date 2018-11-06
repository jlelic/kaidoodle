import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatButtonToggleModule,
  MatProgressSpinnerModule,
} from '@angular/material';

import { GameComponent } from './game.component';
import { ChatComponent } from './chat/chat.component';
import { PlayerListComponent } from './player-list/player-list.component';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { ThicknessPickerComponent } from './thickness-picker/thickness-picker.component';
import { PowerUpsComponent } from './power-ups/power-ups.component';
import { PowerUpsService } from './power-ups/power-ups.service';
import { KeyBindComponent } from './key-bind/key-bind.component';
import { WordSuggestionsComponent } from './chat/word-suggestions/word-suggestions.component';
import { WordSuggestionComponent } from './chat/word-suggestion/word-suggestion.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  declarations: [
    GameComponent,
    ChatComponent,
    PlayerListComponent,
    ColorPickerComponent,
    ToolbarComponent,
    ThicknessPickerComponent,
    PowerUpsComponent,
    KeyBindComponent,
    WordSuggestionsComponent,
    WordSuggestionComponent
  ],
  providers: [
    PowerUpsService
  ]
})
export class GameModule { }
