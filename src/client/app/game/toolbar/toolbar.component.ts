import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { PlayersService } from '../../core/players.service';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit{

  @Output() toolChange = new EventEmitter<string>();
  tools = [
    {
      id: 'brush',
      key: '1'
    },
    {
      id: 'bucket',
      key: '2'
    },
    {
      id: 'eraser',
      key: '3'
    },
    {
      id: 'kai',
      key: '4'
    }
  ];

  private _tool: string = 'brush';
  private keyMapping = {};

  constructor(private players: PlayersService) {
    this.tools.forEach(({id, key}) => {
      this.keyMapping[key] = id;
    });
    window.addEventListener('keydown', e => {
      if(this.players.amDrawing) {
        if(this.keyMapping[e.code]) {
          this.onToolSelected(this.keyMapping[e.code]);
        }
      }
    });
  }


  @Input()
  get tool() {
    return this._tool;
  }

  set tool(value) {
    this._tool = value;
    this.toolChange.emit(value)
  }


  ngOnInit() {
  }

  onToolSelected(tool) {
    this.toolChange.emit(tool);
  }
}
