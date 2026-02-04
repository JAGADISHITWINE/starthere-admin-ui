import { TestBed } from '@angular/core/testing';

import { TrekEdit } from './trek-edit';

describe('TrekEdit', () => {
  let service: TrekEdit;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrekEdit);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
