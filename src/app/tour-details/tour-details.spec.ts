import { TestBed } from '@angular/core/testing';

import { TourDetails } from './tour-details';

describe('TourDetails', () => {
  let service: TourDetails;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TourDetails);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
