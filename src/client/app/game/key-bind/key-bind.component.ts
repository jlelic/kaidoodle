import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { KeyBindService } from '../../core/key-bind.service';
import { PlayersService } from '../../core/players.service';
import { PowerUpsService } from '../power-ups/power-ups.service';

@Component({
  selector: 'key-bind',
  templateUrl: './key-bind.component.html',
  styleUrls: ['./key-bind.component.css']
})
export class KeyBindComponent implements OnInit, OnDestroy {

  @Input() char: string;
  @Output() trigger = new EventEmitter<string>();

  subscription;

  constructor(public players: PlayersService,
              public abilities: PowerUpsService,
              private service: KeyBindService,) {
  }

  ngOnInit() {
    this.subscription = this.service.keyPressed.subscribe(char => {
      if (char == this.char && (this.players.amDrawing || this.abilities.isSabotaging())) {
        this.trigger.next();
      }
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
