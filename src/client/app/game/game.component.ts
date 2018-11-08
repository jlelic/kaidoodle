import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import * as tg from 'time-ago'

import * as DrawMessage from '../../../shared/messages/draw-message.js';
import * as StartRoundMessage from '../../../shared/messages/start-round-message.js';
import * as EndRoundMessage from '../../../shared/messages/end-round-message.js';
import * as GameOverMessage from '../../../shared/messages/game-over-message.js';
import * as TimerMessage from '../../../shared/messages/timer-message.js';
import * as WordMessage from '../../../shared/messages/word-message.js';
import * as WordChoicesMessage from '../../../shared/messages/word-choices-message.js';
import * as config from '../../../shared/config.js';
import * as render from '../../../shared/render-engine.js';

import { CommunicationService } from '../core/communication.service';
import { PlayersService } from '../core/players.service';
import { SoundsService } from '../core/sounds.service';
import { DiscordService } from '../core/discord/discord.service';
import { ChatService } from '../core/chat/chat.service';
import { PowerUpsService } from './power-ups/power-ups.service';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  @ViewChild('canvas') canvas: ElementRef;

  messageSubscription: Subscription;
  context: CanvasRenderingContext2D;
  width = 800;
  height = 600;
  isMouseDown = false;
  isOverCanvas = false;
  startedClickOnCanvas = false;
  prevX: number = null;
  prevY: number = null;
  word = '';
  words = null;
  time = 0;
  round = 0;

  thickness = 1;
  color: string = 'black';
  tool: string = 'brush';
  isPlaying = false;
  roundResults = null;
  gameResults = null;
  drawHistory = [];
  lastShared;

  mouseDownListener;
  mouseUpListener;
  mouseMoveListener;


  constructor(private chat: ChatService,
              private communication: CommunicationService,
              private discord: DiscordService,
              private players: PlayersService,
              public powerUps: PowerUpsService,
              private sounds: SoundsService) {
  }

  get name() {
    return this.communication.name;
  }

  get effectiveWord() {
    if (this.players.amDrawing){
      return this.word;
    }
    if(this.powerUps.isStretched()) {
      return this.stretchWordHint(this.word);
    }
    if(this.powerUps.isNoHint()) {
      return this.removeHints(this.word);
    }
    return this.word;
  }

  get drawingPlayerName() {
    return this.players.drawing;
  }

  get canDraw() {
    return !this.isPlaying || this.name == this.drawingPlayerName || this.powerUps.isSabotaging();
  }

  get maxRounds() {
    return config.MAX_ROUNDS;
  }

  get showWordHint() {
    return config.TIME_ROUND_BASE - this.time > 3 || this.players.amDrawing;
  }

  ngOnInit() {
    this.communication.init();
    this.powerUps.reset();

    const kaiImage = new Image();
    kaiImage.src = 'assets/presets/kai.png';
    render.loadImage('kai', kaiImage);

    const canvas = this.canvas.nativeElement;
    canvas.height = this.height;
    canvas.width = this.width;

    // fuck me
    this.mouseDownListener = this.onMouseDown.bind(this);
    this.mouseUpListener = this.onMouseUp.bind(this);
    this.mouseMoveListener = this.onMouseMove.bind(this);
    window.addEventListener('mousedown', this.mouseDownListener);
    window.addEventListener('mouseup', this.mouseUpListener);
    window.addEventListener('mousemove', this.mouseMoveListener);

    this.context = canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;
    render.clearCanvas(this.canvas.nativeElement);
    this.drawHistory = [];
    this.messageSubscription = this.communication.incomingMessages.subscribe(({ type, data }) => {
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
          render.clearCanvas(this.canvas.nativeElement);
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
          if (this.powerUps.isRevealed()) {
            this.word = this.word[0] + data.word.substring(1);
          } else {
            this.word = data.word;
          }
          break;
        case WordChoicesMessage.type:
          this.sounds.playChooseWord();
          this.words = data.words;
          this.gameResults = null;
          this.roundResults = null;
          break;
        case GameOverMessage.type:
          this.powerUps.reset();
          this.gameResults = this.players.getplayersScoresAsCopy();
          this.words = null;
          this.roundResults = null;
          this.round = 0;
          break;
      }
    });
  }

  ngOnDestroy() {
    this.drawHistory = [];
    window.removeEventListener('mousedown', this.mouseDownListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);
    this.communication.disconnect();
    this.messageSubscription.unsubscribe();
  }

  stretchWordHint(word: string): string {
    let result = word;
    if (this.powerUps.isStretched()) {
      for (let i = word.length / 2; i < 18; i++) {
        result += '＿\u00A0';
      }
    }
    return result
  }

  removeHints(word: string): string {
    if (this.powerUps.isRevealed()) {
      return word[0] + word.substring(1).replace(/[a-zA-Z]/g, '＿');
    }
    return word.replace(/[a-zA-Z]/g, '＿');
  }

  getTimeAgoString(timestamp: number): string {
    if (!timestamp) {
      return 'unknown';
    }
    return tg['ago'](timestamp);
  }

  calculateCanvasPosition(event: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const prevX = this.prevX;
    const prevY = this.prevY;
    let x = Math.round(event.clientX - rect.left) - 2;
    let y = Math.round(event.clientY - rect.top);
    this.prevX = x;
    this.prevY = y;
    const thickness = this.thickness;
    if (x < -thickness || y < -thickness || x > this.width + thickness || y > this.height + thickness) {
      if (this.isOverCanvas) {
        if (x < -thickness) {
          x = -thickness;
        } else if (x > this.width + thickness) {
          x = this.width + thickness;
        }
        if (y < -thickness) {
          y = -thickness;
        } else if (y > this.height + thickness) {
          y = this.height + thickness;
        }
        this.isOverCanvas = false;
        return { x, y, prevX, prevY };
      }
      this.isOverCanvas = false;
      return null;
    }
    this.isOverCanvas = true;
    return { x, y, prevX, prevY };
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
    let tool = this.tool;
    let thickness = this.thickness;
    if(this.powerUps.isSabotaging()) {
      tool = 'brush';
      thickness = 6;
    }
    const message = new DrawMessage(
      tool,
      this.color,
      thickness,
      x,
      y,
      x,
      y
    );
    this.processDrawMessage(message.getPayload());
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
      return;
    }
    const { x, y, prevX, prevY } = position;
    if (event.buttons) {
      if (!this.canDraw) {
        return;
      }
      let tool = this.tool;
      let thickness = this.thickness;
      if(this.powerUps.isSabotaging()) {
        tool = 'brush';
        thickness = 6;
      }
      const message = new DrawMessage(
        tool,
        this.color,
        thickness,
        x,
        y,
        prevX,
        prevY
      );
      this.processDrawMessage(message.getPayload());
      this.communication.send(message);
    }
  }

  onWordChoice(wordChoice: string) {
    this.communication.send(new WordMessage(wordChoice));
  }

  processDrawMessage(message) {
    render.processDrawMessage(this.canvas.nativeElement, message, this.drawHistory);
  }

  resetDrawing() {
    if (!this.canDraw) {
      return;
    }
    const message = new DrawMessage('clear');
    this.processDrawMessage(message.getPayload());
    this.communication.send(message);
  }

  shareImage() {
    const now: any = new Date();
    if (this.lastShared && now - this.lastShared < 30 * 1000) {
      this.chat.addSystemError(`Wait ${30 - Math.round((now - this.lastShared) / 1000)} seconds before sharing again!`);
      return;
    }
    this.lastShared = now;
    this.discord.shareImage(this.context.canvas)
      .subscribe(
        () => this.chat.addSystemMessage('Image shared on discord!', 'green'),
        err => {
          console.error(err);
          this.chat.addSystemError(`Sharing failed: ${err.error.message}`)
        }
      )
  }

  undo() {
    if (!this.canDraw) {
      return;
    }
    const message = new DrawMessage('undo');
    this.processDrawMessage(message.getPayload());
    this.communication.send(message);
  }

  processRoundResults(data) {
    const result = Object.keys(data).map(name => ({ name, score: data[name] }));
    result.sort((a, b) => b.score - a.score);
    return result;
  }
}
