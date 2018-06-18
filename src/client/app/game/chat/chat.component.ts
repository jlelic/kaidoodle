import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { Subscription } from 'rxjs/Subscription';

import { CommunicationService } from '../../core/communication.service';
import { SoundsService } from '../../core/sounds.service';

import * as ChatMessage from '../../../../shared/messages/chat-message';


@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatHistory') private chatHistoryElement: ElementRef;
  @ViewChild('chatInput') private chatInput: ElementRef;

  form: FormGroup;
  messageSubscription: Subscription;
  messages = [];
  keepScrollingToBottom = true;

  constructor(private communication: CommunicationService, private fb: FormBuilder, private sounds: SoundsService) {
    this.messageSubscription = this.communication.incomingMessages.subscribe(({ type, data }) => {
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

  ngOnDestroy() {
    this.messageSubscription.unsubscribe();
  }

  buildForm() {
    this.form = this.fb.group({
      input: ['', Validators.required]
    });
  }

  processChatMessage(data) {
    const el = this.chatHistoryElement.nativeElement;
    this.keepScrollingToBottom = data.sender == this.communication.name || el.scrollHeight - el.offsetHeight - el.scrollTop < 5;

    data.system = data.sender.startsWith('/');
    if (data.system && data.text.startsWith('You guessed the word')) {
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
