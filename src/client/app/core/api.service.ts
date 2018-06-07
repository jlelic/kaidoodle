import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';

@Injectable()
export class ApiService {
  constructor(private http: HttpClient, private router: Router) {
  }

  login(login: string): Observable<any>  {
    return this.post('login', { login });
  }

  post(url, payload): Observable<any> {
    const body = JSON.stringify(payload);
    return this.http.post(`api/${url}`, body, {headers: {'Content-Type': 'application/json'}});
  }
}
