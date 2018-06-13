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
    const token = this.cookies.getCookie(this.auth.COOKIE_TOKEN);
    if (token) {
      this.auth.autoLogin(token)
        .subscribe(
          () => {
            this.router.navigate(['/'])
          },
          data => console.error(data.error.message)
        )
    }
  }
}
