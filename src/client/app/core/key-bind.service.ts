import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

const CHAR_MAPPING = {
  'Semicolon': ';'
};

'ABCDEFGHIJKLMNOPQRSTUVWXXYZ'.split('').forEach(char => {
  CHAR_MAPPING[`Key${char}`] = char;
});

'0123456798'.split('').forEach(char => {
  CHAR_MAPPING[`Digit${char}`] = char;
});

@Injectable()
export class KeyBindService {

  keyPressed = new Subject<string>();


  constructor() {
    window.addEventListener('keydown', e => {
      this.keyPressed.next(CHAR_MAPPING[e.code]);
    });
  }

}
