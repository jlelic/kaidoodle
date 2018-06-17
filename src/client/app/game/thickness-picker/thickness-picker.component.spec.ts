import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ThicknessPickerComponent } from './thickness-picker.component';

describe('ThicknessPickerComponent', () => {
  let component: ThicknessPickerComponent;
  let fixture: ComponentFixture<ThicknessPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ThicknessPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ThicknessPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
