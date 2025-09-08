import { TestBed } from '@angular/core/testing';

import { AdminMarketPlaceService } from './admin-market-place.service';

describe('AdminMarketPlaceService', () => {
  let service: AdminMarketPlaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminMarketPlaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
