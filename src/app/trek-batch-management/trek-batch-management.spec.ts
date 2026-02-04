import { TestBed } from '@angular/core/testing';

import { TrekBatchManagement } from './trek-batch-management';

describe('TrekBatchManagement', () => {
  let service: TrekBatchManagement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrekBatchManagement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
