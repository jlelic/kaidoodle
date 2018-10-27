import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WordsService } from '../words.service';
import * as tg from 'time-ago'

@Component({
  selector: 'app-show-words',
  templateUrl: './show-words.component.html',
  styleUrls: ['./show-words.component.css']
})
export class ShowWordsComponent implements OnInit {

  data;
  error: string;
  pageLinks = 3;
  loading: number = null;
  pageNumDiffs = Array.from({ length: 2 * this.pageLinks + 1 }, (v, k) => k - this.pageLinks);


  constructor(private route: ActivatedRoute, private service: WordsService) {
  }

  ngOnInit() {
    this.route.data.forEach((data) => {
      this.data = data.words;
    });
  }

  getPageLinks(): number[] {
    return this.pageNumDiffs.map(diff => Number(this.data.page) + diff)
      .filter(pageNum => pageNum > 0 && pageNum <= this.data.pages)
  }

  getTimeAgoString(timestamp: number): string {
    if(!timestamp) {
      return '';
    }
    return tg.ago(timestamp);
  }

  onDeleteClick(index: number) {
    const entry = this.data.docs[index];
    if (window.confirm(`Are you sure you want to delete "${entry.word}"`)) {
      this.service.deleteWord(entry.word)
        .subscribe(
          updatedWord => this.data.docs[index] = updatedWord,
          error => window.alert(`Error occured!\n${error}`)
        )
    }
  }

  onPageChange(p: number) {
    this.service.getWords(p)
      .subscribe(
        data => this.data = data,
        error => this.error = error
      )
  }
}
