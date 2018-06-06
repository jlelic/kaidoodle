import { Component } from '@angular/core';
import { CommunicationService } from './core/communication.service';
import * as HandshakeMessage from '../../shared/messages/handshake-message';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(private communication: CommunicationService){

  }

  send(){
    this.communication.send(new HandshakeMessage())
  }
}
