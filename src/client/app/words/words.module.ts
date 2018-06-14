import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShowWordsComponent } from './show-words/show-words.component';
import { AddWordsComponent } from './add-words/add-words.component';
import { WordsResolver } from './words.resolver';
import { WordsService } from './words.service';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material';
import { LoggedInGuard } from '../core/auth/logged-in.guard';


const wordsRoutes = [
  {
    path: 'words',
    canActivateChild: [LoggedInGuard],
    children: [
      { path: 'add', component: AddWordsComponent },
      { path: 'show', component: ShowWordsComponent, resolve: { words: WordsResolver }  },
      { path: '**', component: ShowWordsComponent, resolve: { words: WordsResolver }  },
    ]
  }
];


@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    RouterModule.forChild(wordsRoutes)
  ],
  declarations: [ShowWordsComponent, AddWordsComponent],
  providers: [
    WordsResolver,
    WordsService
  ]
})
export class WordsModule {
}
