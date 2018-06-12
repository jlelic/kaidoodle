import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

import { ApiService } from './api.service';
import { CookiesService } from './cookies.service';

@Injectable()
export class AuthService {

  COOKIE_TOKEN = 'token';

  token: string;
  private _loginName: string;

  constructor(private api: ApiService, private cookies: CookiesService) {
    this.token = this.cookies.getCookie(this.COOKIE_TOKEN);
    if (this.token) {
      this.cookies.setCookie(this.COOKIE_TOKEN, this.token);
    }
  }

  get loginName(): string {
    return this._loginName;
  }

  autoLogin(token: string) {
    return this.api.post('autoLogin', { token })
      .do((x) => this.storeProfile(x));
  }

  login(data): Observable<any> {
    return this.api.post('login', data)
      .do((x) => this.storeProfile(x));
  }

  storeProfile(data) {
    this.token = data.token;
    this._loginName = data.login;
    this.cookies.setCookie(this.COOKIE_TOKEN, this.token);
  }

}
