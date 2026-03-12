import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TourListComponent } from './tour-list';

describe('TourListComponent', () => {
  let component: TourListComponent;
  let fixture: ComponentFixture<TourListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TourListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TourListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
