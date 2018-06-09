import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import {
  MatSliderModule,
  MatSlideToggleModule,
} from '@angular/material';

import { AppComponent } from './app.component';
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from './login/login.component';
import { GameComponent } from './game/game.component';
import { ErrorComponent } from './error/error.component';
import { GameModule } from "./game/game.module";
import { CoreModule } from './core/core.module';

const appRoutes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'game',      component: GameComponent },
  { path: '**', component: ErrorComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    CoreModule,
    GameModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatSlideToggleModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    )
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
