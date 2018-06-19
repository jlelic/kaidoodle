import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';


@Injectable()
export class ApiService {

  defaultOptions = { headers: { 'Content-Type': 'application/json; charset=utf-8', 'authorization': '' } };

  constructor(private http: HttpClient) {
  }

  delete(url: string, params = {}): Observable<any> {
    return this.http.delete(`api/${url}`, { ...this.defaultOptions, params });
  }

  get(url: string, params = {}): Observable<any> {
    return this.http.get(`api/${url}`, { ...this.defaultOptions, params });
  }

  post(url: string, payload): Observable<any> {
    const body = JSON.stringify(payload);
    return this.http.post(`api/${url}`, body, this.defaultOptions);
  }
}
