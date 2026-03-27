import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TourDetail } from '../tour-detail/tour-detail';
import { TourListComponent } from '../tour-list/tour-list';
import { AuthService } from '../../services/auth.service';
import { Tour } from '../../models/tour.model';

@Component({
  selector: 'app-main-shell',
  imports: [TourListComponent, TourDetail],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.css',
})
export class MainShell {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly selectedTour = signal<Tour | undefined>(undefined);

  onTourSelected(tour: Tour): void {
    this.selectedTour.set(tour);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
