import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { CommunicationService } from '../core/communication.service';
import * as DrawMessage from '../../../shared/messages/draw-message';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {
  @ViewChild('canvas') canvas: ElementRef;

  context: CanvasRenderingContext2D;
  width = 800;
  height = 600;
  isMouseDown = false;

  constructor(private commmunication: CommunicationService) {
  }

  ngOnInit() {
    const canvas = this.canvas.nativeElement;
    canvas.height = this.height;
    canvas.width = this.width;
    canvas.addEventListener('mousedown', () => this.onMouseDown());
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.context = canvas.getContext('2d');
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);
    const x = this.commmunication._incomingMessages.subscribe(({type, data}) => {
      if (type == DrawMessage.type) {
        this.processDrawMessage(data);
      }
    })
  }

  onMouseDown() {
    this.isMouseDown = true;
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isMouseDown) {
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const message = new DrawMessage(x, y);
      this.processDrawMessage(message.getPayload());
      this.commmunication.send(message);
    }
  }

  processDrawMessage(data) {
    const { x, y } = data;
    this.context.fillStyle = 'black';
    this.context.fillRect(x - 1, y - 1, 3, 3);
  }
}
