import { Injectable } from '@angular/core';

@Injectable()
export class CookiesService {

  constructor() {
  }

  getCookie(name: string): string {
    const v = document.cookie.match(`(^|;) ?${name}=([^;]*)(;|$)`);
    return v ? v[2] : null;
  }

  setCookie(name: string, value: string) {
    const date = new Date;
    document.cookie = `${name}=${value};path=/;`;
  }

  deleteCookie(name) {
    this.setCookie(name, '');
  }
}
