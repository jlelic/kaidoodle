import { Component, Input, OnInit } from '@angular/core';
import { WordsService } from '../../../words/words.service';

@Component({
  selector: 'word-suggestion',
  templateUrl: './word-suggestion.component.html',
  styleUrls: ['./word-suggestion.component.css']
})
export class WordSuggestionComponent implements OnInit {

  @Input() word: string;

  clicked = false;
  loading = false;
  done = false;
  error = false;

  constructor(private service: WordsService) { }

  ngOnInit() {
  }

  onSend() {
    this.clicked = true;
    this.loading = true;
    this.service.addWords([this.word])
      .subscribe(
        () => {
          this.loading = false;
          this.done = true;
        },
        () => {
          this.loading = false;
          this.error = true;
        }
      )
  }

}
