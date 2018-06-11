import { Injectable } from '@angular/core';

@Injectable()
export class SoundsService {


  audio;

  constructor() {
    this.audio = new Audio;
    this.audio.src = 'assets/sounds/ok.wav';
  }

  playOk() {
    this.audio.play();
  }

}
