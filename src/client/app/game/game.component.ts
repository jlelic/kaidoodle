import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { CommunicationService } from '../core/communication.service';
import * as DrawMessage from '../../../shared/messages/draw-message';
import * as StartGameMessage from '../../../shared/messages/start-game-message';

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
  prevX = null;
  prevY = null;
  word = '';
  drawingPlayerName = false;

  constructor(private commmunication: CommunicationService) {
  }

  get name() {
    return this.commmunication.name;
  }

  ngOnInit() {
    this.commmunication.init();

    const canvas = this.canvas.nativeElement;
    canvas.height = this.height;
    canvas.width = this.width;
    canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.context = canvas.getContext('2d');
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);
    const x = this.commmunication.incomingMessages.subscribe(({ type, data }) => {
      if (type == DrawMessage.type) {
        this.processDrawMessage(data);
      } else if (type == StartGameMessage.type){
        this.word = data.word;
        this.drawingPlayerName = data.drawing;
      }
    })
  }

  onMouseDown(event) {
    this.isMouseDown = true;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const message = new DrawMessage(x, y, this.prevX, this.prevY);
    this.processDrawMessage(message.getPayload());
    this.prevX = x;
    this.prevY = y;
    this.commmunication.send(message);
  }

  onMouseUp() {
    this.prevX = null;
    this.prevY = null;
    this.isMouseDown = false;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isMouseDown) {
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const message = new DrawMessage(x, y, this.prevX, this.prevY);
      this.processDrawMessage(message.getPayload());
      this.prevX = x;
      this.prevY = y;
      this.commmunication.send(message);
    }
  }

  processDrawMessage(data) {
    this.context.fillStyle = 'black';

    let { x, y, prevX, prevY } = data;
    if (typeof prevX !== 'number' || typeof prevY !== 'number'
      || (x === prevX && y === prevY)) {
      this.context.fillRect(x, y, 1, 1);
    } else {
      this.context.beginPath();
      this.context.moveTo(prevX, prevY);
      this.context.lineTo(x, y);
      this.context.stroke();

    }
  }
}
