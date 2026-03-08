import { Component, input } from '@angular/core';
import { Tour } from '../../models/tour.model';
import { TourLogList } from '../tour-log-list/tour-log-list';

@Component({
  selector: 'app-tour-detail',
  imports: [TourLogList],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.css',
})
export class TourDetail {
  readonly tour = input<Tour | undefined>();
}
