import { Component, input, output } from '@angular/core';
import { Tour } from '../../models/tour.model';

@Component({
  selector: 'app-tour-list',
  imports: [],
  templateUrl: './tour-list.html',
  styleUrl: './tour-list.css',
})
export class TourListComponent {
  readonly tourSelected = output<Tour>();
  readonly tours = input<Tour[]>([]);
  readonly selectedTourId = input<number | undefined>(undefined);

  selectTour(tour: Tour): void {
    this.tourSelected.emit(tour);
  }
}
