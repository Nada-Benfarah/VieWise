import { TestBed } from '@angular/core/testing';

import { AdminWorkflowService } from './admin-workflow.service';

describe('AdminWorkflowService', () => {
  let service: AdminWorkflowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminWorkflowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
