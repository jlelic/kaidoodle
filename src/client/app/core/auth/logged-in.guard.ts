import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';

import { AuthService } from './auth.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class LoggedInGuard implements CanActivate, CanActivateChild {

  constructor(private auth: AuthService, private router: Router) {
  }

  canActivate(): Observable<boolean> {
    return this.auth.isLoggedIn
      .do(loggedIn => {
        if(!loggedIn) {
          this.router.navigate(['/login'])
        }
      })
  }

  canActivateChild(): Observable<boolean> {
    return this.canActivate();
  }
}
