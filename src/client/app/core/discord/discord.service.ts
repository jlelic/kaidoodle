import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';

import { canvasToBlob } from 'blob-util';
import { fromPromise } from 'rxjs/observable/fromPromise';

@Injectable()
export class DiscordService {

  constructor(private api: ApiService) {
  }

  shareImage(canvas: HTMLCanvasElement) {
    return fromPromise(canvasToBlob(canvas))
      .do(blob => {
        const reader = new FileReader();
        reader.onload = () => {
          this.api.post('discord/share', { data: String.fromCharCode.apply(null, new Uint8Array(reader.result ))}).subscribe()
        };
        reader.readAsArrayBuffer(blob);
      })
      .subscribe();
  }
}
