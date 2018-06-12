import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';


@Injectable()
export class ApiService {

  constructor(private http: HttpClient) {
  }

  get(url): Observable<any> {
    return this.http.get(`api/${url}`, { headers: { 'Content-Type': 'application/json' } });
  }

  post(url, payload): Observable<any> {
    const body = JSON.stringify(payload);
    return this.http.post(`api/${url}`, body, { headers: { 'Content-Type': 'application/json' } });
  }
}
