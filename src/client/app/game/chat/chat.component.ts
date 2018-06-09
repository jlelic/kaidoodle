import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms'

import { CommunicationService } from '../../core/communication.service';

import * as ChatMessage from '../../../../shared/messages/chat-message';


@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  form: FormGroup;
  messages = [];

  constructor(private communication: CommunicationService, private fb: FormBuilder) {
    this.communication.incomingMessages.subscribe(({type, data}) => {
      if (type === ChatMessage.type){
        this.processChatMessage(data);
      }
    })
  }

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.form = this.fb.group(
      {
        input: ''
      }
    );
  }

  processChatMessage(data) {
    this.messages.push(data)
  }

  onSubmit(event) {
    event.preventDefault();
    const { input } = this.form.value;
    const message = new ChatMessage(this.communication.name, input);
    this.processChatMessage(message.getPayload());
    this.communication.send(message);
    this.form.controls.input.reset();
  }
}
