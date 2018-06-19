import { Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { canvasToBlob } from 'blob-util';
import 'rxjs/add/operator/switchMap';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class DiscordService {

  constructor(private api: ApiService) {
  }

  shareImage(canvas: HTMLCanvasElement): Observable<any> {
    return fromPromise(canvasToBlob(canvas))
      .switchMap(blob => {
        const reader = new FileReader();
        const fileReader$: Observable<any> = fromEvent(reader, 'load');
        reader.readAsBinaryString(blob);
        return fileReader$;
      })
      .switchMap(event => {
        return this.api.post('discord/share', { data: event.target.result });
      });
  }
}
