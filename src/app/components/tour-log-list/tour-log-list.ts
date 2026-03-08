import { Component, computed, input } from '@angular/core';
import { TourLog } from '../../models/tour-log.model';

@Component({
  selector: 'app-tour-log-list',
  imports: [],
  templateUrl: './tour-log-list.html',
  styleUrl: './tour-log-list.css',
})
export class TourLogList {
  // Input: ID der aktuell ausgewaehlten Tour
  readonly tourId = input<string>('');

  // Hardcodierte Log-Eintraege: 3 fuer Tour 1, 2 fuer Tour 2, keine fuer Tour 3
  private readonly allLogs: TourLog[] = [
    {
      id: 'log-1',
      tourId: 'tour-1',
      loggedAt: '2026-03-01 09:00',
      comment: 'Great weather, enjoyable ride.',
      difficulty: 3,
      totalDistanceKm: 14.2,
      totalTimeMin: 78,
      rating: 5,
    },
    {
      id: 'log-2',
      tourId: 'tour-1',
      loggedAt: '2026-02-14 10:30',
      comment: 'Busy streets near the canal.',
      difficulty: 4,
      totalDistanceKm: 14.2,
      totalTimeMin: 82,
      rating: 4,
    },
    {
      id: 'log-3',
      tourId: 'tour-1',
      loggedAt: '2026-01-20 08:15',
      comment: 'Cold but refreshing.',
      difficulty: 2,
      totalDistanceKm: 13.8,
      totalTimeMin: 70,
      rating: 4,
    },
    {
      id: 'log-4',
      tourId: 'tour-2',
      loggedAt: '2026-02-28 07:00',
      comment: 'Steep ascent, rewarding view.',
      difficulty: 8,
      totalDistanceKm: 11.8,
      totalTimeMin: 255,
      rating: 5,
    },
    {
      id: 'log-5',
      tourId: 'tour-2',
      loggedAt: '2025-11-10 08:30',
      comment: 'Muddy trail after rain.',
      difficulty: 7,
      totalDistanceKm: 11.5,
      totalTimeMin: 270,
      rating: 3,
    },
  ];

  // Gefilterte Logs basierend auf der aktuellen tourId
  readonly filteredLogs = computed(() =>
    this.allLogs.filter(log => log.tourId === this.tourId())
  );
}
