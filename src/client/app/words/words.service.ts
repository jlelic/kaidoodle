import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';

@Injectable()
export class WordsService {

  constructor(private api: ApiService, private auth: AuthService) {
  }

  addWords(words): Observable<any> {
    return this.api.post('words', { words, author: this.auth.loginName })
  }

  getWords(): Observable<any> {
    return this.api.get('words');
  }
}
