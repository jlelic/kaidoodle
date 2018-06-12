import { Injectable } from '@angular/core';

import { WordsService } from './words.service';
import { Resolve } from '@angular/router';

@Injectable()
export class WordsResolver implements Resolve<any> {
  constructor(private words: WordsService) {
  }

  resolve() {
    return this.words.getWords();
  }
}
