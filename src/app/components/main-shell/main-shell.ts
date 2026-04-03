import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TourDetail } from '../tour-detail/tour-detail';
import { TourListComponent } from '../tour-list/tour-list';
import { AuthService } from '../../services/auth.service';
import { Tour, TransportType } from '../../models/tour.model';
import { TourForm } from '../tours/tour-form/tour-form';

@Component({
  selector: 'app-main-shell',
  imports: [TourListComponent, TourDetail, TourForm],
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

  onTourSelected(tour: Tour): void {
    const currentEditingTour = this.editingTour();

    // close edit form if tour is changed while editing
    if (currentEditingTour && currentEditingTour.id !== tour.id) {
      this.editingTour.set(undefined);
    }

    this.selectedTour.set(tour);
  }

  openCreateTourForm(): void {
    this.editingTour.set(undefined);
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
    this.showCreateTourForm.set(false);
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

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
