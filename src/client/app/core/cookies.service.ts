import { Injectable } from '@angular/core';

@Injectable()
export class CookiesService {

  constructor() {
  }

  getCookie(name: string): string {
    const v = document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`);
    return v ? v[2] : null;
  }

  setCookie(name: string, value: string, days = 30) {
    const date = new Date;
    date.setTime(date.getTime() + 24 * 60 * 60 * 1000 * days);
    document.cookie = `${name}=${value};path=/;expires=${date.toUTCString()}`;
  }

  deleteCookie(name) {
    this.setCookie(name, '', -1);
  }
}
