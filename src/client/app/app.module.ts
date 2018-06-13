import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'
import {
  MatButtonModule
} from '@angular/material';

import { AppComponent } from './app.component';
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from './login/login.component';
import { GameComponent } from './game/game.component';
import { ErrorComponent } from './error/error.component';
import { GameModule } from "./game/game.module";
import { CoreModule } from './core/core.module';
import { MenuComponent } from './menu/menu.component';
import { WordsModule } from './words/words.module';
import { LoggedInGuard } from './core/auth/logged-in.guard';

const appRoutes: Routes = [
  { path: '', component: MenuComponent, canActivate: [LoggedInGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'game', component: GameComponent, canActivate: [LoggedInGuard] },
  { path: '**', component: ErrorComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ErrorComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    CoreModule,
    GameModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatButtonModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false } // <-- debugging purposes only
    ),
    WordsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
