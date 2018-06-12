import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { WordsService } from '../words.service';

@Component({
  selector: 'app-add-words',
  templateUrl: './add-words.component.html',
  styleUrls: ['./add-words.component.css']
})
export class AddWordsComponent implements OnInit {
  @ViewChild('input') private input: ElementRef;

  results;
  error: string;
  loading = false;

  constructor(private service: WordsService) {
  }


  ngOnInit() {
  }

  onSend() {
    const data = this.input.nativeElement.value
      .split('\n')
      .filter(word => word.length > 0)
      .map(word => word.trim());
    this.loading = true;
    this.service.addWords(data)
      .subscribe(
        results => {
          this.loading = false;
          this.error = null;
          this.results = results;
        },
        err => {
          this.loading = false;
          this.results = null;
          this.error = err;
        }
      )
  }

}
