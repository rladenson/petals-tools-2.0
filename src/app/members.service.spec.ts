import { TestBed } from '@angular/core/testing';

import { PluralKitService } from './pluralkit.service';

describe('MembersService', () => {
  let service: PluralKitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PluralKitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
