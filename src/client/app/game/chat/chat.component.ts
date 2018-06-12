import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

import { CommunicationService } from '../../core/communication.service';
import { SoundsService } from '../../core/sounds.service';

import * as ChatMessage from '../../../../shared/messages/chat-message';


@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatHistory') private chatHistoryElement: ElementRef;
  @ViewChild('chatInput') private chatInput: ElementRef;

  form: FormGroup;
  messages = [];
  keepScrollingToBottom = true;

  constructor(private communication: CommunicationService, private fb: FormBuilder, private sounds: SoundsService) {
    this.communication.incomingMessages.subscribe(({ type, data }) => {
      if (type === ChatMessage.type) {
        this.processChatMessage(data);
      }
    });
  }

  ngOnInit() {
    this.buildForm();
    this.scrollToBottom();
    window.addEventListener('keydown', e => {
      this.chatInput.nativeElement.focus()
    });
  }

  ngAfterViewChecked() {
    if (this.keepScrollingToBottom) {
      this.scrollToBottom();
    }
  }

  buildForm() {
    this.form = this.fb.group({
      input: ['', Validators.required]
    });
  }

  processChatMessage(data) {
    const el = this.chatHistoryElement.nativeElement;
    this.keepScrollingToBottom = data.sender == this.communication.name || el.scrollHeight - el.offsetHeight - el.scrollTop < 5;

    if (data.sender === 'Server' && data.text.startsWith('You guessed the word')) {
      this.sounds.playOk();
    }

    this.messages.push(data)
  }

  onSubmit(event) {
    event.preventDefault();
    const { input } = this.form.value;
    if(!input || !input.length) {
      return;
    }
    const message = new ChatMessage(this.communication.name, input);
    this.processChatMessage(message.getPayload());
    this.communication.send(message);
    this.form.controls.input.reset();
  }

  scrollToBottom(force = false): void {
      this.chatHistoryElement.nativeElement.scrollTop = this.chatHistoryElement.nativeElement.scrollHeight;
  }
}
