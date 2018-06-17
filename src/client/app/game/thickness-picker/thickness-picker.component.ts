import {
  AfterViewChecked, AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output,
  ViewChild
} from '@angular/core';


@Component({
  selector: 'thickness-picker',
  templateUrl: './thickness-picker.component.html',
  styleUrls: ['./thickness-picker.component.css']
})
export class ThicknessPickerComponent implements OnInit, AfterViewInit {
  @ViewChild('thicknessContainer') container: ElementRef;

  @Output() thicknessSelected = new EventEmitter<string>();

  values = [1, 6, 16, 32];
  thickness = this.values[0];

  constructor() {
  }


  ngOnInit() {
  }

  ngAfterViewInit() {
    const canvases = this.container.nativeElement.querySelectorAll('canvas');
    this.values.forEach((value, i) => {
      const canvas = canvases[i];
      const context: CanvasRenderingContext2D = canvas.getContext('2d');

      context.beginPath();
      context.arc(canvas.width / 2, canvas.height / 2, value / 2, 0, 2 * Math.PI, false);
      context.fillStyle = 'black';
      context.fill();
    })
  }

  onThicknessSelected(value) {
    this.thickness = value;
    this.thicknessSelected.emit(value);
  }

}
