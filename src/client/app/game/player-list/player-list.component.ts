import { Component, OnInit } from '@angular/core';

import { PlayersService } from '../../core/players.service';


@Component({
  selector: 'player-list',
  templateUrl: './player-list.component.html',
  styleUrls: ['./player-list.component.css']
})
export class PlayerListComponent implements OnInit {

  players = [];


  constructor(private playersService: PlayersService) {
    this.players = playersService.players;
  }

  get drawingPlayerName() {
    return this.playersService.drawing;
  }

  ngOnInit() {
  }

}
