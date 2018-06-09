import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { CommunicationService } from '../core/communication.service';
import * as DrawMessage from '../../../shared/messages/draw-message';
import * as StartGameMessage from '../../../shared/messages/start-game-message';
import { PlayersService } from '../core/players.service';

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
  thickness = 1;
  erasing = false;

  constructor(private communication: CommunicationService, private players: PlayersService) {
  }

  get name() {
    return this.communication.name;
  }

  get drawingPlayerName() {
    return this.players.drawing;
  }

  ngOnInit() {
    this.communication.init();

    const canvas = this.canvas.nativeElement;
    canvas.height = this.height;
    canvas.width = this.width;
    canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.context = canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.clearCanvas();
    const x = this.communication.incomingMessages.subscribe(({ type, data }) => {
      if (type == DrawMessage.type) {
        this.processDrawMessage(data);
      } else if (type == StartGameMessage.type) {
        this.clearCanvas();
        this.word = data.word;
      }
    })
  }

  clearCanvas() {
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  onMouseDown(event) {
    if(this.communication.name !== this.players.drawing) {
      return;
    }
    this.isMouseDown = true;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const message = new DrawMessage(
      this.erasing ? 'eraser' : 'pen',
      this.thickness,
      x,
      y,
      x,
      y
    );
    this.processDrawMessage(message.getPayload());
    this.prevX = x;
    this.prevY = y;
    this.communication.send(message);
  }

  onMouseUp() {
    this.prevX = null;
    this.prevY = null;
    this.isMouseDown = false;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isMouseDown) {
      if(this.communication.name !== this.players.drawing) {
        return;
      }
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const message = new DrawMessage(
        this.erasing ? 'eraser' : 'pen',
        this.thickness,
        x,
        y,
        this.prevX,
        this.prevY
      );
      this.processDrawMessage(message.getPayload());
      this.prevX = x;
      this.prevY = y;
      this.communication.send(message);
    }
  }

  processDrawMessage(data) {
    this.context.strokeStyle = data.tool == 'pen' ? 'black' : 'white';
    console.log(this.context.fillStyle);
    let { x, y, prevX, prevY, thickness } = data;
    this.context.lineWidth = thickness;
    if (typeof prevX !== 'number' || typeof prevY !== 'number'
      || (x === prevX && y === prevY)) {
      this.context.beginPath();
      this.context.ellipse(x-thickness, y, thickness, thickness, 0, 0, 0);
      this.context.stroke();
    } else {
      this.context.beginPath();
      this.context.lineCap = 'round';
      this.context.moveTo(prevX, prevY);
      this.context.lineTo(x, y);
      this.context.stroke();

    }
  }
}
