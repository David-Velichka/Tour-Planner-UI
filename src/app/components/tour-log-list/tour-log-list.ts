import { Component, computed, input, output } from '@angular/core';
import { TourLog } from '../../models/tour-log.model';

@Component({
  selector: 'app-tour-log-list',
  imports: [],
  templateUrl: './tour-log-list.html',
  styleUrl: './tour-log-list.css',
})
export class TourLogList {
  // Input: ID of currently selected tour
  readonly tourId = input<string>('');
  // Input: all tour logs (in main-shell)
  readonly logs = input<TourLog[]>([]);
  // Output: Clicking "Add Log" button
  readonly addRequested = output<void>();

  // Filtered logs based on current tourId
  readonly filteredLogs = computed(() =>
    this.logs().filter(log => log.tourId === this.tourId())
  );

  readonly canAddLog = computed(() => this.tourId().trim().length > 0); // if a tour is selected

  requestAddLog(): void {
    if (!this.canAddLog()) {
      return;
    }

    this.addRequested.emit();
  }
}
