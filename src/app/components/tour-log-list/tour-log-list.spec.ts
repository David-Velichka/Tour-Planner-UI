import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourLogList } from './tour-log-list';

describe('TourLogList', () => {
  let component: TourLogList;
  let fixture: ComponentFixture<TourLogList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TourLogList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourLogList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
