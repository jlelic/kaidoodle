import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { KeyBindService } from '../../core/key-bind.service';
import { PlayersService } from '../../core/players.service';

@Component({
  selector: 'key-bind',
  templateUrl: './key-bind.component.html',
  styleUrls: ['./key-bind.component.css']
})
export class KeyBindComponent implements OnInit, OnDestroy {

  @Input() char: string;
  @Output() trigger = new EventEmitter<string>();

  subscription;

  constructor(private service: KeyBindService, public players: PlayersService) { }

  ngOnInit() {
    this.subscription = this.service.keyPressed.subscribe(char => {
      if(char == this.char && this.players.amDrawing) {
        this.trigger.next();
      }
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
