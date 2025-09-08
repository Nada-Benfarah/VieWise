import { TestBed } from '@angular/core/testing';

import { AdminStaffService } from './admin-staff.service';

describe('AdminStaffService', () => {
  let service: AdminStaffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminStaffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
