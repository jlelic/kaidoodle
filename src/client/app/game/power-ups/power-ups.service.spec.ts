import { TestBed, inject } from '@angular/core/testing';

import { PowerUpsService } from './power-ups.service';

describe('PowerUpsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PowerUpsService]
    });
  });

  it('should be created', inject([PowerUpsService], (service: PowerUpsService) => {
    expect(service).toBeTruthy();
  }));
});
