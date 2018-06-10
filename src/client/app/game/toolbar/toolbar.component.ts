import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit{

  @Output() toolSelected = new EventEmitter<string>();
  tools = [
    'brush',
    'kai'
  ];

  constructor() {}

  ngOnInit() {
    this.toolSelected.emit(this.tools[0]);
  }

  onToolSelected(tool) {
    this.toolSelected.emit(tool);
  }
}
