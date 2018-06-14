import { Component, OnInit } from '@angular/core';

import { AuthService } from './core/auth/auth.service';
import { CookiesService } from './core/cookies.service';
import { Router } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  title = 'app';

  constructor(
    private auth: AuthService,
    private cookies: CookiesService,
    private router: Router
  ){
  }

  ngOnInit() {
  }
}
