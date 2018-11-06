import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WordSuggestionsComponent } from './word-suggestions.component';

describe('WordSuggestionsComponent', () => {
  let component: WordSuggestionsComponent;
  let fixture: ComponentFixture<WordSuggestionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WordSuggestionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WordSuggestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
