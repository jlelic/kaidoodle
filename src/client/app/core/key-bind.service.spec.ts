import { TestBed, inject } from '@angular/core/testing';

import { KeyBindService } from './key-bind.service';

describe('KeyBindService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeyBindService]
    });
  });

  it('should be created', inject([KeyBindService], (service: KeyBindService) => {
    expect(service).toBeTruthy();
  }));
});
