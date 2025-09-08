import { TestBed } from '@angular/core/testing';

import { AdminAgentService } from './admin-agent.service';

describe('AdminAgentService', () => {
  let service: AdminAgentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminAgentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
