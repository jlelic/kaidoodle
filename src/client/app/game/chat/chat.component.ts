import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms'

import { CommunicationService } from '../../core/communication.service';

import * as ChatMessage from '../../../../shared/messages/chat-message';


@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked  {
  @ViewChild('chatHistory') private chatHistoryElement: ElementRef;
  form: FormGroup;
  messages = [];
  keepScrollingToBottom = true;

  constructor(private communication: CommunicationService, private fb: FormBuilder) {
    this.communication.incomingMessages.subscribe(({type, data}) => {
      if (type === ChatMessage.type){
        this.processChatMessage(data);
      }
    })
  }

  ngOnInit() {
    this.buildForm();
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    if(this.keepScrollingToBottom) {
      this.scrollToBottom();
    }
  }

  buildForm() {
    this.form = this.fb.group(
      {
        input: ''
      }
    );
  }

  processChatMessage(data) {
    const el = this.chatHistoryElement.nativeElement;
    this.keepScrollingToBottom =  data.sender == this.communication.name || el.scrollHeight - el.offsetHeight - el.scrollTop < 5;
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

  scrollToBottom(force = false): void {
    try {
      this.chatHistoryElement.nativeElement.scrollTop = this.chatHistoryElement.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
