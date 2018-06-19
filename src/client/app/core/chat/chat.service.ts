import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { DomSanitizer } from '@angular/platform-browser';

import { CommunicationService } from '../communication.service';

import * as ChatMessage from '../../../../shared/messages/chat-message';

@Injectable()
export class ChatService {


  messageAdded = new Subject<any>();
  private _messages = [];

  constructor(private communication: CommunicationService, private sanitizer: DomSanitizer) {
    this.communication.incomingMessages.subscribe(({ type, data }) => {
      if (type === ChatMessage.type) {
        this.addMessage(data);
      }
    });
  }

  get messages() {
    return this._messages;
  }

  addSystemMessage(text, color = 'gray') {
    this.addMessage({
      sender: '/system',
      text,
      color
    })
  }

  addSystemError(text) {
    this.addSystemMessage(text, 'red');
  }

  sendMessage(text) {
    const message = new ChatMessage(this.communication.name, text);
    this.addMessage(message.getPayload());
    this.communication.send(message);
  }

  private addMessage(data) {
    data.system = data.sender.startsWith('/');
    if(data.system) {
      data.html = this.sanitizer.bypassSecurityTrustHtml(data.text);
    }
    this.messages.push(data);
    this.messageAdded.next(data);
  }
}
