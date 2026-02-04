import { TestBed } from '@angular/core/testing';

import { TrekAdd } from './trek-add';

describe('TrekAdd', () => {
  let service: TrekAdd;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrekAdd);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
