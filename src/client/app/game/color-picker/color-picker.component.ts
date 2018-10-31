import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.css']
})
export class ColorPickerComponent implements OnInit {

  @Output() colorSelected = new EventEmitter<string>();
  colors = [
    [
      '#000000',
      '#7f7f7f',
      '#69421d',
      '#ff0400',
      '#ffa82c',
      '#ffff00',
      '#22b14c',
      '#00a2e8',
      '#3f48cc',
      '#a349a4',
    ],
    [
      '#ffffff',
      '#c3c3c3',
      '#b97a57',
      '#ffaec9',
      '#ffd0b3',
      '#efe4b0',
      '#b5e61d',
      '#99d9ea',
      '#7092be',
      '#c8bfe7',
    ]
  ];

  keys = [
    'QWERTYUIOP','ASDFGHJKL;'
  ];

  colorCoords = '0x0';

  private color = this.colors[0][0];

  constructor() {
  }

  ngOnInit() {
  }

  onColorSelected(i: number, j: number) {
    const newColor = this.colors[i][j];
    this.colorCoords = `${i}x${j}`;
    this.colorSelected.emit(newColor);
    this.color = newColor;
  }
}
