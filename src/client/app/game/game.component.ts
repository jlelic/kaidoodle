import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as colorString from 'color-string';

import { CommunicationService } from '../core/communication.service';
import * as DrawMessage from '../../../shared/messages/draw-message';
import * as StartRoundMessage from '../../../shared/messages/start-round-message';
import * as EndRoundMessage from '../../../shared/messages/end-round-message';
import * as GameOverMessage from '../../../shared/messages/game-over-message';
import * as TimerMessage from '../../../shared/messages/timer-message';
import * as WordMessage from '../../../shared/messages/word-message';
import * as WordChoicesMessage from '../../../shared/messages/word-choices-message';

import { PlayersService } from '../core/players.service';
import { SoundsService } from '../core/sounds.service';

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
  isOverCanvas = false;
  startedClickOnCanvas = false;
  prevX: number = null;
  prevY: number = null;
  word = '';
  words: string[] = null;
  time = 0;
  round = 0;

  thickness = 1;
  color: string;
  tool: string = 'brush';
  kaiImage;
  isPlaying = false;
  roundResults = null;
  gameResults = null;
  drawHistory = [];

  constructor(private communication: CommunicationService, private players: PlayersService, private sounds: SoundsService) {
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
    window.addEventListener('mousedown', e => this.onMouseDown(e));
    window.addEventListener('mouseup', e => this.onMouseUp(e));
    window.addEventListener('mousemove', e => this.onMouseMove(e));
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
          this.words = null;
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
          if (data.results[this.players.drawing] < 0) {
            this.sounds.playLoss();
          } else if (this.roundResults.filter(({ score }) => score == 0).length == 1) {
            this.sounds.playOneLeft();
          }
          this.word = data.word;
          break;
        case TimerMessage.type:
          this.time = data.time;
          break;
        case WordMessage.type:
          this.word = data.word;
          break;
        case WordChoicesMessage.type:
          this.sounds.playChooseWord();
          this.words = data.words;
          this.gameResults = null;
          this.roundResults = null;
          break;
        case GameOverMessage.type:
          this.gameResults = this.players.players;
          this.roundResults = null;
          this.round = 0;
          break;
      }
    });
  }

  bucketTool(startX: number, startY: number, color) {
    const colorEq = (data, color, b) => {
      return color[0] === data.data[b]
        && color[1] === data.data[b + 1]
        && color[2] === data.data[b + 2]
        && color[3] === data.data[b + 3]
    };

    const getIndex = (x, y, width) => y * (width * 4) + x * 4;

    const [r, g, b, _] = colorString.get.rgb(color);
    const a = 255;
    const ctx = this.context;
    const fillData = ctx.createImageData(1, 1);
    fillData.data[0] = r;
    fillData.data[1] = g;
    fillData.data[2] = b;
    fillData.data[3] = a;
    const w = this.canvas.nativeElement.width;
    const h = this.canvas.nativeElement.height;
    const startIndex = getIndex(startX, startY, w);
    const data = ctx.getImageData(0, 0, w, h);
    const newData = ctx.getImageData(0, 0, w, h);
    const bg = [
      data.data[startIndex + 0],
      data.data[startIndex + 1],
      data.data[startIndex + 2],
      data.data[startIndex + 3]
    ];

    if (bg[0] == r && bg[1] == g && bg[2] == b) {
      return
    }

    const stack = [{ x: startX, y: startY }];

    while (stack.length) {
      let { x, y } = stack.pop();

      if (!colorEq(data, bg, getIndex(x, y, w))) {
        continue;
      }

      while (x > 0 && colorEq(data, bg, getIndex(x - 1, y, w))) {
        x -= 1
      }

      let up = true, down = true;
      while (x < w && colorEq(data, bg, getIndex(x, y, w))) {
        const i = getIndex(x, y, w);
        data.data[i] = r;
        data.data[i + 1] = g;
        data.data[i + 2] = b;
        data.data[i + 3] = a;
        newData.data[i] = r;
        newData.data[i + 1] = g;
        newData.data[i + 2] = b;
        newData.data[i + 3] = a;

        if (y + 1 < h) {
          if (up && colorEq(data, bg, getIndex(x, y + 1, w))) {
            stack.push({ x, y: y + 1 });
          }
          up = !colorEq(data, bg, getIndex(x, y + 1, w));
        }

        if (y > 0) {
          if (down && colorEq(data, bg, getIndex(x, y - 1, w))) {
            stack.push({ x, y: y - 1 });
          }
          down = !colorEq(data, bg, getIndex(x, y - 1, w));
        }

        x += 1;
      }
    }
    ctx.putImageData(newData, 0, 0);
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

  calculateCanvasPosition(event: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    let x = Math.round(event.clientX - rect.left);
    let y = Math.round(event.clientY - rect.top);
    if (x < 0 || y < 0 || x > this.width || y > this.height) {
      if (this.isOverCanvas) {
        if (x < 0) {
          x = 0;
        } else if (x > this.width) {
          x = this.width
        }
        if (y < 0) {
          y = 0;
        } else if (y > this.height) {
          y = this.height;
        }
        this.isOverCanvas = false;
        return { x, y };
      }
      this.isOverCanvas = false;
      return null;
    }
    this.isOverCanvas = true;
    return { x, y };
  }

  onColorSelected(color: string) {
    this.color = color;
    if (this.tool == 'kai') {
      this.tool = 'brush';
    }
  }

  onThicknessSelected(thickness: number) {
    this.thickness = thickness;
  }

  onMouseDown(event: MouseEvent) {
    if (!this.canDraw) {
      return;
    }
    this.isMouseDown = true;
    const position = this.calculateCanvasPosition(event);
    if (!position) {
      this.startedClickOnCanvas = false;
      return
    }
    this.startedClickOnCanvas = true;
    const { x, y } = position;
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

  onMouseUp(event: MouseEvent) {
    this.prevX = null;
    this.prevY = null;
    this.isMouseDown = false;
  }

  onMouseMove(event: MouseEvent) {
    if (this.startedClickOnCanvas) {
      event.preventDefault();
    } else {
      return;
    }
    const position = this.calculateCanvasPosition(event);
    if (!position) {
      this.prevX = null;
      this.prevY = null;
      return;
    }
    const { x, y } = position;
    if (event.buttons) {
      if (!this.canDraw) {
        return;
      }
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

  onWordChoice(wordChoice: string) {
    this.communication.send(new WordMessage(wordChoice));
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
      case 'bucket':
        this.bucketTool(x, y, data.color);
        break;
      case 'kai':
        this.context.drawImage(this.kaiImage, x - 128, y - 400);
        break;
      case 'clear':
        this.drawHistory = [];
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
