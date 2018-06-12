import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';
import { CookiesService } from './cookies.service';


@Injectable()
export class ApiService {



  constructor(private http: HttpClient) {
  }

  post(url, payload): Observable<any> {
    const body = JSON.stringify(payload);
    return this.http.post(`api/${url}`, body, { headers: { 'Content-Type': 'application/json' } });
  }
}
