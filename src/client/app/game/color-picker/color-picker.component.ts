import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent implements OnInit{

  @Output() colorSelected = new EventEmitter<string>();
  colors = [
    [
      'black',
      'white',
      'red',
      'blue',
      '#69421d',
    ],
    [
      'gray',
      'yellow',
      'green',
      'pink',
      'cyan',
    ]
  ];

  constructor() {}

  ngOnInit() {
    this.colorSelected.emit(this.colors[0][0]);
  }

  onColorSelected(i:number, j:number) {
    this.colorSelected.emit(this.colors[i][j]);
  }
}
