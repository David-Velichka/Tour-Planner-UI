import { Component, output } from '@angular/core';
import { Tour, TransportType } from '../../models/tour.model';

@Component({
  selector: 'app-tour-list',
  imports: [],
  templateUrl: './tour-list.html',
  styleUrl: './tour-list.css',
})
export class TourListComponent {
  readonly tourSelected = output<Tour>();

  readonly tours: Tour[] = [
    {
      id: 'tour-1',
      name: 'Vienna City Bike Tour',
      description: 'A relaxed bike ride through central Vienna and along the canal.',
      from: 'Stephansplatz',
      to: 'Prater Hauptallee',
      transportType: TransportType.BIKE,
      distanceKm: 14.2,
      estimatedTimeMin: 75,
    },
    {
      id: 'tour-2',
      name: 'Alpine Hike',
      description: 'A mountain trail with steady climbs and a scenic summit view.',
      from: 'Innsbruck',
      to: 'Seegrube',
      transportType: TransportType.HIKE,
      distanceKm: 11.8,
      estimatedTimeMin: 240,
    },
    {
      id: 'tour-3',
      name: 'Danube Running Trail',
      description: 'A flat running route following the Danube for an easy training session.',
      from: 'Tulln',
      to: 'Krems',
      transportType: TransportType.RUNNING,
      distanceKm: 9.5,
      estimatedTimeMin: 52,
    },
  ];

  selectTour(tour: Tour): void {
    this.tourSelected.emit(tour);
  }
}
