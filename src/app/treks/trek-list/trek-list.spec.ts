import { TestBed } from '@angular/core/testing';

import { TrekList } from './trek-list';

describe('TrekList', () => {
  let service: TrekList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrekList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
