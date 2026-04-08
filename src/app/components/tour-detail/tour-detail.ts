import { Component, computed, input, output } from '@angular/core';
import { Tour } from '../../models/tour.model';
import { TourLog } from '../../models/tour-log.model';
import { TourLogList } from '../tour-log-list/tour-log-list';
import { AttributeField } from '../shared/attribute-field/attribute-field';

@Component({
  selector: 'app-tour-detail',
  imports: [TourLogList, AttributeField],
  templateUrl: './tour-detail.html',
  styleUrl: './tour-detail.css',
})
export class TourDetail {
  readonly tour = input<Tour | undefined>();
  readonly logs = input<TourLog[]>([]);
  readonly addLogRequested = output<void>();
  readonly editRequested = output<Tour>();
  readonly deleteRequested = output<Tour>();
  readonly imagePath = computed(() => {
    const imageFilePath = this.tour()?.imageFilePath?.trim();

    if (!imageFilePath) {
      return undefined;
    }

    // absolute path or full URL
    if (imageFilePath.startsWith('/') || imageFilePath.startsWith('http')) {
      return imageFilePath;
    }

    // Relative path
    return `/${imageFilePath}`;
  });
  readonly imageAlt = computed(() => `Tour image for ${this.tour()?.name ?? 'selected tour'}`);

  requestEdit(): void {
    const currentTour = this.tour();

    if (!currentTour) {
      return;
    }

    this.editRequested.emit(currentTour);
  }

  requestDelete(): void {
    const currentTour = this.tour();

    if (!currentTour) {
      return;
    }

    this.deleteRequested.emit(currentTour);
  }

  requestAddLog(): void {
    this.addLogRequested.emit();
  }
}
