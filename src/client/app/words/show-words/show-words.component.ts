import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-show-words',
  templateUrl: './show-words.component.html',
  styleUrls: ['./show-words.component.css']
})
export class ShowWordsComponent implements OnInit {

  words: any[];

  constructor(private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.data.forEach((data) => {
      console.log(data);
      this.words = data.words;
    });
  }

}
