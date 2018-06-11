import { Injectable } from '@angular/core';

@Injectable()
export class SoundsService {


  audio;

  constructor() {
    this.audio = new Audio;
  }

  playOk() {
    this.audio.src = 'assets/sounds/ok.wav';
    this.audio.play();
  }

}
