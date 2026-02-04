import { TestBed } from '@angular/core/testing';

import { PostEditor } from './post-editor';

describe('PostEditor', () => {
  let service: PostEditor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostEditor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
