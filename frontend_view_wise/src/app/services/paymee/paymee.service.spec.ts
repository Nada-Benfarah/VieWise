import { TestBed } from '@angular/core/testing';

import { PaymeeService } from './paymee.service';

describe('PaymeeService', () => {
  let service: PaymeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
