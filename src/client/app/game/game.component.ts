import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { CommunicationService } from '../core/communication.service';
import * as DrawMessage from '../../../shared/messages/draw-message';
import * as StartRoundMessage from '../../../shared/messages/start-round-message';
import * as EndRoundMessage from '../../../shared/messages/end-round-message';
import * as TimerMessge from '../../../shared/messages/timer-message';
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
  time = 0;

  thickness = 1;
  color: string;
  isPlaying = false;
  roundResults = null;

  constructor(private communication: CommunicationService, private players: PlayersService) {
  }

  get name() {
    return this.communication.name;
  }

  get drawingPlayerName() {
    return this.players.drawing;
  }

  get canDraw() {
    return !this.isPlaying || this.name == this.drawingPlayerName;
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
      } else if (type == StartRoundMessage.type) {
        this.roundResults = null;
        this.isPlaying = true;
        this.word = data.word;
        this.clearCanvas();
      } else if (type == EndRoundMessage.type) {
        this.isPlaying = false;
        this.roundResults = this.processRoundResults(data.results);
        this.word = data.word;
      } else if (type == TimerMessge.type) {
        this.time = data.time;
      }
    });
  }

  clearCanvas() {
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  onColorSelected(color) {
    this.color = color;
  }

  onMouseDown(event) {
    if (!this.canDraw) {
      return;
    }
    this.isMouseDown = true;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const message = new DrawMessage(
      'pen',
      this.color,
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
      if (!this.canDraw) {
        return;
      }
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const message = new DrawMessage(
        'pen',
        this.color,
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
    this.context.strokeStyle = data.color;
    let { x, y, prevX, prevY, thickness } = data;
    this.context.lineWidth = thickness;
    if (typeof prevX !== 'number' || typeof prevY !== 'number'
      || (x === prevX && y === prevY)) {
      this.context.beginPath();
      this.context.ellipse(x - thickness, y, thickness, thickness, 0, 0, 0);
      this.context.stroke();
    } else {
      this.context.beginPath();
      this.context.lineCap = 'round';
      this.context.moveTo(prevX, prevY);
      this.context.lineTo(x, y);
      this.context.stroke();

    }
  }

  processRoundResults(data) {
    const result = Object.keys(data).map(name => ({ name, score: data[name] }));
    result.sort((a, b) => b.score - a.score);
    return result;
  }
}
