import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyBindComponent } from './key-bind.component';

describe('KeyBindComponent', () => {
  let component: KeyBindComponent;
  let fixture: ComponentFixture<KeyBindComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KeyBindComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeyBindComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
