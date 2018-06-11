import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { CommunicationService } from '../core/communication.service';
import * as DrawMessage from '../../../shared/messages/draw-message';
import * as StartRoundMessage from '../../../shared/messages/start-round-message';
import * as EndRoundMessage from '../../../shared/messages/end-round-message';
import * as GameOverMessage from '../../../shared/messages/game-over-message';
import * as TimerMessage from '../../../shared/messages/timer-message';
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
  round = 0;

  thickness = 1;
  color: string;
  tool: string;
  kaiImage;
  isPlaying = false;
  roundResults = null;
  gameResults = null;
  drawHistory = [];

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

    this.kaiImage = new Image();
    this.kaiImage.src = 'assets/presets/kai.png';

    const canvas = this.canvas.nativeElement;
    canvas.height = this.height;
    canvas.width = this.width;
    canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.context = canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    this.clearCanvas();
    this.drawHistory = [];
    const x = this.communication.incomingMessages.subscribe(({ type, data }) => {
      switch (type) {
        case DrawMessage.type:
          this.processDrawMessage(data);
          break;
        case StartRoundMessage.type:
          this.roundResults = null;
          this.gameResults = null;
          this.isPlaying = true;
          this.word = data.word;
          this.round = data.round;
          this.clearCanvas();
          this.drawHistory = [];
          break;
        case EndRoundMessage.type:
          this.isPlaying = false;
          this.roundResults = this.processRoundResults(data.results);
          this.word = data.word;
          break;
        case TimerMessage.type:
          this.time = data.time;
          break;
        case GameOverMessage.type:
          this.gameResults = this.players.players;
          this.roundResults = null;
          this.round = 0;
          break;
      }
    });
  }

  clearCanvas() {
    this.context.fillStyle = 'white';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  isDrawContinuous(data) {
    if (!data) {
      return false;
    }
    const { x, y, prevX, prevY } = data;
    return !(typeof prevX !== 'number' || typeof prevY !== 'number' || (x === prevX && y === prevY));
  }

  onColorSelected(color) {
    this.color = color;
  }

  onToolSelected(tool) {
    this.tool = tool;
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
      this.tool,
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
        this.tool,
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

  resetDrawing() {
    if (!this.canDraw) {
      return;
    }
    const message = new DrawMessage('clear');
    this.processDrawMessage(message.getPayload());
    this.communication.send(message);
  }

  undo() {
    if (!this.canDraw) {
      return;
    }
    const message = new DrawMessage('undo');
    this.processDrawMessage(message.getPayload());
    this.communication.send(message);
  }

  processDrawMessage(data, addToHistory = true) {
    this.context.strokeStyle = data.color;
    let { tool, x, y, prevX, prevY, thickness } = data;
    this.context.lineWidth = thickness;
    const isContinuous = this.isDrawContinuous(data);
    switch (tool) {
      case 'brush':
        this.context.beginPath();
        if (isContinuous) {
          this.context.lineCap = 'round';
          this.context.moveTo(prevX, prevY);
          this.context.lineTo(x, y);
        } else {
          this.context.ellipse(x - thickness, y, thickness, thickness, 0, 0, 0);
        }
        this.context.stroke();
        break;
      case 'kai':
        this.context.drawImage(this.kaiImage, x - 128, y - 400);
        break;
      case 'clear':
        this.clearCanvas();
        break;
      case 'undo':
        this.clearCanvas();
        let isLastContinuous;
        do {
          isLastContinuous = this.isDrawContinuous(this.drawHistory[this.drawHistory.length - 1]);
          this.drawHistory.pop();
        } while (isLastContinuous);
        this.drawHistory.forEach(data => this.processDrawMessage(data, false));
        addToHistory = false;
        break;
    }

    if (addToHistory) {
      this.drawHistory.push(data);
    }
  }

  processRoundResults(data) {
    const result = Object.keys(data).map(name => ({ name, score: data[name] }));
    result.sort((a, b) => b.score - a.score);
    return result;
  }
}
