import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowWordsComponent } from './show-words.component';

describe('ShowWordsComponent', () => {
  let component: ShowWordsComponent;
  let fixture: ComponentFixture<ShowWordsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowWordsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowWordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
