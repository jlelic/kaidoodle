import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'


import { AppComponent } from './app.component';
import { CommunicationService } from './core/communication.service';
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from './login/login.component';
import { GameComponent } from './game/game.component';
import { ErrorComponent } from './error/error.component';
import { ApiService } from './core/api.service';

const appRoutes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'game',      component: GameComponent },
  { path: '**', component: ErrorComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GameComponent,
    ErrorComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    )
  ],
  providers: [
    ApiService,
    CommunicationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
