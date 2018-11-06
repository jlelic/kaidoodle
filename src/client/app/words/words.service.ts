import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth/auth.service';

@Injectable()
export class WordsService {

  constructor(private api: ApiService, private auth: AuthService) {
  }

  addWords(words: string[]): Observable<any> {
    return this.api.post('words', { words, author: this.auth.loginName })
  }

  deleteWord(word: string): Observable<any> {
    return this.api.delete(`word/${word}`);
  }

  getWords(page = 1): Observable<any> {
    return this.api.get('words', { p: page });
  }
}
