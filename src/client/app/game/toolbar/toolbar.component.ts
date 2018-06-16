import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit{

  @Output() toolChange = new EventEmitter<string>();
  tools = [
    'brush',
    'kai'
  ];

  private _tool: string;


  constructor() {}

  @Input()
  get tool() {
    return this._tool;
  }

  set tool(value) {
    this._tool = value;
    this.toolChange.emit(value)
  }


  ngOnInit() {
    this.toolChange.emit(this.tools[0]);
  }

  onToolSelected(tool) {
    this.toolChange.emit(tool);
  }
}
