import { Component, input } from '@angular/core';
import { Tour } from '../../models/tour.model';

@Component({
  selector: 'app-tour-detail',
  imports: [],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.css',
})
export class TourDetail {
  readonly tour = input<Tour | undefined>();
}
