import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';

import { ApiService } from '../api.service';
import { CookiesService } from '../cookies.service';
import { ReplaySubject } from 'rxjs/ReplaySubject';

@Injectable()
export class AuthService {

  COOKIE_TOKEN = 'token';

  token: string;
  private _loginName: string;
  private _loggedIn = new ReplaySubject<boolean>(1);

  constructor(private api: ApiService, private cookies: CookiesService) {
    this.token = this.cookies.getCookie(this.COOKIE_TOKEN);
    if (this.token) {
      this.autoLogin().subscribe(() => {}, () => this.logout());
    } else {
      this._loggedIn.next(false);
    }
  }

  get isLoggedIn() {
    return this._loggedIn.asObservable();
  }

  get loginName(): string {
    return this._loginName;
  }

  autoLogin() {
    return this.api.post('autoLogin', { token: this.token })
      .do((x) => this.storeProfile(x));
  }

  login(data): Observable<any> {
    return this.api.post('login', data)
      .do((x) => this.storeProfile(x));
  }

  logout() {
    this.token = null;
    this.cookies.deleteCookie(this.COOKIE_TOKEN);
    delete this.api.defaultOptions.headers.authorization;
    this._loggedIn.next(false);
  }

  storeProfile(data) {
    this.token = data.token;
    this._loginName = data.login;
    this.api.defaultOptions.headers.authorization = this.token;
    this.cookies.setCookie(this.COOKIE_TOKEN, this.token);
    this._loggedIn.next(true);
  }

}
