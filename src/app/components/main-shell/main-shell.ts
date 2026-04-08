import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TourDetail } from '../tour-detail/tour-detail';
import { TourListComponent } from '../tour-list/tour-list';
import { AuthService } from '../../services/auth.service';
import { Tour, TransportType } from '../../models/tour.model';
import { TourLog } from '../../models/tour-log.model';
import { TourForm } from '../tours/tour-form/tour-form';
import { TourLogForm } from '../tour-logs/tour-log-form/tour-log-form';

@Component({
  selector: 'app-main-shell',
  imports: [TourListComponent, TourDetail, TourForm, TourLogForm],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.css',
})
export class MainShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly tours = signal<Tour[]>([
    {
      id: 'tour-1',
      name: 'Vienna City Bike Tour',
      description: 'A relaxed bike ride through central Vienna and along the canal.',
      from: 'Stephansplatz',
      to: 'Prater Hauptallee',
      transportType: TransportType.BIKE,
      distanceKm: 14.2,
      estimatedTimeMin: 75,
      imageFilePath: 'test_bike.png',
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
      imageFilePath: 'test_hike.png',
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
  ]);
  readonly selectedTour = signal<Tour | undefined>(undefined);
  readonly showCreateTourForm = signal(false);
  readonly editingTour = signal<Tour | undefined>(undefined);
  readonly tourToDelete = signal<Tour | undefined>(undefined);
  readonly showCreateTourLogForm = signal(false);

  // hardcoded Tour logs.
  readonly tourLogs = signal<TourLog[]>([
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
  ]);

  onTourSelected(tour: Tour): void {
    const currentEditingTour = this.editingTour();
    const previouslySelectedTourId = this.selectedTour()?.id;

    // close edit form if tour is changed while editing
    if (currentEditingTour && currentEditingTour.id !== tour.id) {
      this.editingTour.set(undefined);
    }

    if (previouslySelectedTourId && previouslySelectedTourId !== tour.id) {
      this.showCreateTourLogForm.set(false);
    }

    this.selectedTour.set(tour);
  }

  openCreateTourForm(): void {
    this.showCreateTourLogForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(undefined);
    this.showCreateTourForm.set(true);
  }

  onTourSaved(tour: Tour): void {
    this.tours.update((currentTours) => [...currentTours, tour]);
    this.selectedTour.set(tour);
    this.showCreateTourForm.set(false);
  }

  onCreateCancelled(): void {
    this.showCreateTourForm.set(false);
  }

  startEditTour(tour: Tour): void {
    this.showCreateTourLogForm.set(false);
    this.showCreateTourForm.set(false);
    this.tourToDelete.set(undefined);
    this.editingTour.set(tour);
  }

  onEditTourSaved(updatedTour: Tour): void {
    this.tours.update((currentTours) =>
      currentTours.map((tour) => (tour.id === updatedTour.id ? updatedTour : tour))
    );

    if (this.selectedTour()?.id === updatedTour.id) {
      this.selectedTour.set(updatedTour);
    }

    this.editingTour.set(undefined);
  }

  onEditCancelled(): void {
    this.editingTour.set(undefined);
  }

  startDeleteTour(tour: Tour): void {
    this.showCreateTourLogForm.set(false);
    this.showCreateTourForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(tour);
  }

  confirmDeleteTour(): void {
    const pendingDeleteTour = this.tourToDelete();

    if (!pendingDeleteTour) {
      return;
    }

    this.tours.update((currentTours) =>
      currentTours.filter((tour) => tour.id !== pendingDeleteTour.id)
    );

    this.tourLogs.update((currentLogs) =>
      currentLogs.filter((log) => log.tourId !== pendingDeleteTour.id)
    );

    if (this.selectedTour()?.id === pendingDeleteTour.id) {
      this.selectedTour.set(undefined);
      this.showCreateTourLogForm.set(false);
    }

    this.tourToDelete.set(undefined);
  }

  cancelDeleteTour(): void {
    this.tourToDelete.set(undefined);
  }

  openCreateTourLogForm(): void {
    const currentSelectedTour = this.selectedTour();

    if (!currentSelectedTour) {
      return;
    }

    this.showCreateTourForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(undefined);
    this.showCreateTourLogForm.set(true);
  }

  onTourLogSaved(log: TourLog): void {
    const currentSelectedTour = this.selectedTour();

    if (!currentSelectedTour) {
      return;
    }

    const logToSave: TourLog = {
      ...log, // ...log contains all form values except id and tourId which will get set here.
      id: log.id || `log-${Date.now()}`,
      tourId: currentSelectedTour.id,
    };

    this.tourLogs.update((currentLogs) => [...currentLogs, logToSave]);
    this.showCreateTourLogForm.set(false);
  }

  onCreateTourLogCancelled(): void {
    this.showCreateTourLogForm.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
