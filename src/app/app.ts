import { Component, signal } from '@angular/core';
import { TourDetail } from './components/tour-detail/tour-detail';
import { TourListComponent } from './components/tour-list/tour-list';
import { Tour } from './models/tour.model';

@Component({
  selector: 'app-root',
  imports: [TourListComponent, TourDetail],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly selectedTour = signal<Tour | undefined>(undefined);

  onTourSelected(tour: Tour): void {
    this.selectedTour.set(tour);
  }
}
