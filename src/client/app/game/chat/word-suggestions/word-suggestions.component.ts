import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'word-suggestions',
  templateUrl: './word-suggestions.component.html',
  styleUrls: ['./word-suggestions.component.css']
})
export class WordSuggestionsComponent implements OnInit {

  @Input() words: string[];

  constructor() { }

  ngOnInit() {
  }

}
