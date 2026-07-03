import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TourDetail } from '../tour-detail/tour-detail';
import { TourListComponent } from '../tour-list/tour-list';
import { AuthService } from '../../services/auth.service';
import { TourService, TourFormData } from '../../services/tour.service';
import { TourLogService, TourLogFormData } from '../../services/tour-log.service';
import { Tour, TransportType } from '../../models/tour.model';
import { TourLog } from '../../models/tour-log.model';
import { TourForm } from '../tours/tour-form/tour-form';
import { TourLogForm } from '../tour-logs/tour-log-form/tour-log-form';

type TourDataExport = {
  version: number;
  exportedAt: string;
  tours: Tour[];
  tourLogs: TourLog[];
}

@Component({
  selector: 'app-main-shell',
  imports: [TourListComponent, TourDetail, TourForm, TourLogForm],
  templateUrl: './main-shell.html',
  styleUrl: './main-shell.css',
})
export class MainShell {
  private readonly authService = inject(AuthService);
  private readonly tourService = inject(TourService);
  private readonly tourLogService = inject(TourLogService);
  private readonly router = inject(Router);
  private readonly importFileInput = viewChild<ElementRef<HTMLInputElement>>('importFileInput');

  readonly tours = signal<Tour[]>([]);
  readonly selectedTour = signal<Tour | undefined>(undefined);
  readonly showCreateTourForm = signal(false);
  readonly editingTour = signal<Tour | undefined>(undefined);
  readonly tourToDelete = signal<Tour | undefined>(undefined);
  readonly searchTerm = signal('');
  // filteredTours is updated by backend search or shows all tours when search is empty
  readonly filteredTours = signal<Tour[]>([]);
  readonly showCreateTourLogForm = signal(false);
  readonly editingTourLog = signal<TourLog | undefined>(undefined);
  readonly tourLogToDelete = signal<TourLog | undefined>(undefined);
  // Logs for the currently selected tour only
  readonly tourLogs = signal<TourLog[]>([]);
  // Error message from API calls (e.g. ORS route failures)
  readonly apiError = signal<string | undefined>(undefined);

  constructor() {
    void this.loadTours();

    // When searchTerm changes: call backend search or reset to full list
    effect(() => {
      const query = this.searchTerm().trim();
      if (!query) {
        this.filteredTours.set(this.tours());
        return;
      }
      void this.runSearch(query);
    });
  }

  private getUserId(): number {
    const userId = this.authService.currentUserId();

    if (!userId) {
      void this.router.navigate(['/login']);
      throw new Error('Not authenticated');
    }

    return userId;
  }

  // Extract a user-friendly message from an HTTP error response.
  private extractErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
      const httpError = error as { error?: { message?: string } };
      const message = httpError.error?.message;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  }

  private async loadTours(): Promise<void> {
    try {
      const userId = this.getUserId();
      const loadedTours = await this.tourService.getTours(userId);
      this.tours.set(loadedTours);
      // Sync filtered list unless a search is active
      if (!this.searchTerm().trim()) {
        this.filteredTours.set(loadedTours);
      } else {
        void this.runSearch(this.searchTerm().trim());
      }
      // update currently selected tour when something changes
      const currentSelected = this.selectedTour();
      if (currentSelected) {
        const updated = loadedTours.find((t) => t.id === currentSelected.id);
        this.selectedTour.set(updated);
      }
    } catch (error) {
      this.apiError.set(this.extractErrorMessage(error, 'Failed to load tours.'));
    }
  }

  private async runSearch(query: string): Promise<void> {
    try {
      const userId = this.getUserId();
      const results = await this.tourService.searchTours(userId, query);
      this.filteredTours.set(results);
    } catch {
      // On search error, fall back to full list
      this.filteredTours.set(this.tours());
    }
  }

  async onTourSelected(tour: Tour): Promise<void> {
    const currentEditingTour = this.editingTour();
    const previouslySelectedTourId = this.selectedTour()?.id;

    // close edit form if tour is changed while editing
    if (currentEditingTour && currentEditingTour.id !== tour.id) {
      this.editingTour.set(undefined);
    }

    if (previouslySelectedTourId && previouslySelectedTourId !== tour.id) {
      this.showCreateTourLogForm.set(false);
      this.editingTourLog.set(undefined);
      this.tourLogToDelete.set(undefined);
    }

    this.selectedTour.set(tour);
    this.apiError.set(undefined);

    try {
      const userId = this.getUserId();
      const logs = await this.tourLogService.getLogs(userId, tour.id);
      this.tourLogs.set(logs);
    } catch {
      this.tourLogs.set([]);
    }
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm.set(input?.value ?? '');
  }

  openCreateTourForm(): void {
    this.showCreateTourLogForm.set(false);
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
    this.editingTour.set(undefined);
    this.tourToDelete.set(undefined);
    this.showCreateTourForm.set(true);
  }

  onTourSaved(data: TourFormData): void {
    void this.createTour(data);
  }

  private async createTour(data: TourFormData): Promise<void> {
    try {
      const userId = this.getUserId();
      if (data.imageFile) {
        data.imageFilePath = await this.tourService.uploadImage(userId, data.imageFile);
      }
      const createdTour = await this.tourService.createTour(userId, data);
      this.tours.update((currentTours) => [...currentTours, createdTour]);
      this.selectedTour.set(createdTour);
      this.tourLogs.set([]);
      this.showCreateTourForm.set(false);
      this.apiError.set(undefined);
    } catch (error) {
      this.apiError.set(
        this.extractErrorMessage(error, 'Failed to create tour. Check that locations are valid.')
      );
    }
  }

  onCreateCancelled(): void {
    this.showCreateTourForm.set(false);
    this.apiError.set(undefined);
  }

  startEditTour(tour: Tour): void {
    this.showCreateTourLogForm.set(false);
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
    this.showCreateTourForm.set(false);
    this.tourToDelete.set(undefined);
    this.apiError.set(undefined);
    this.editingTour.set(tour);
  }

  onEditTourSaved(data: TourFormData): void {
    void this.updateTour(data);
  }

  private async updateTour(data: TourFormData): Promise<void> {
    const tourBeingEdited = this.editingTour();

    if (!tourBeingEdited) {
      return;
    }

    try {
      const userId = this.getUserId();
      if (data.imageFile) {
        data.imageFilePath = await this.tourService.uploadImage(userId, data.imageFile);
      }
      const updatedTour = await this.tourService.updateTour(userId, tourBeingEdited.id, data);
      this.tours.update((currentTours) =>
        currentTours.map((t) => (t.id === updatedTour.id ? updatedTour : t))
      );

      if (this.selectedTour()?.id === updatedTour.id) {
        this.selectedTour.set(updatedTour);
      }

      this.editingTour.set(undefined);
      this.apiError.set(undefined);
    } catch (error) {
      this.apiError.set(
        this.extractErrorMessage(error, 'Failed to update tour. Check that locations are valid.')
      );
    }
  }

  onEditCancelled(): void {
    this.editingTour.set(undefined);
    this.apiError.set(undefined);
  }

  startDeleteTour(tour: Tour): void {
    this.showCreateTourLogForm.set(false);
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
    this.showCreateTourForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(tour);
    this.apiError.set(undefined);
  }

  confirmDeleteTour(): void {
    void this.deleteTour();
  }

  private async deleteTour(): Promise<void> {
    const pendingDeleteTour = this.tourToDelete();

    if (!pendingDeleteTour) {
      return;
    }

    try {
      const userId = this.getUserId();
      await this.tourService.deleteTour(userId, pendingDeleteTour.id);
      this.tours.update((currentTours) =>
        currentTours.filter((t) => t.id !== pendingDeleteTour.id)
      );

      if (this.selectedTour()?.id === pendingDeleteTour.id) {
        this.selectedTour.set(undefined);
        this.tourLogs.set([]);
        this.showCreateTourLogForm.set(false);
        this.editingTourLog.set(undefined);
        this.tourLogToDelete.set(undefined);
      }

      this.tourToDelete.set(undefined);
      this.apiError.set(undefined);
    } catch (error) {
      this.apiError.set(this.extractErrorMessage(error, 'Failed to delete tour.'));
      this.tourToDelete.set(undefined);
    }
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
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
    this.showCreateTourLogForm.set(true);
  }

  onTourLogSaved(data: TourLogFormData): void {
    void this.createLog(data);
  }

  private async createLog(data: TourLogFormData): Promise<void> {
    const currentSelectedTour = this.selectedTour();

    if (!currentSelectedTour) {
      return;
    }

    try {
      const userId = this.getUserId();
      const createdLog = await this.tourLogService.createLog(userId, currentSelectedTour.id, data);
      this.tourLogs.update((currentLogs) => [...currentLogs, createdLog]);
      await this.loadTours();
      this.showCreateTourLogForm.set(false);
      this.apiError.set(undefined);
    } catch (error) {
      this.apiError.set(this.extractErrorMessage(error, 'Failed to create tour log.'));
    }
  }

  onCreateTourLogCancelled(): void {
    this.showCreateTourLogForm.set(false);
  }

  startEditTourLog(log: TourLog): void {
    const currentSelectedTour = this.selectedTour();

    if (!currentSelectedTour || log.tourId !== currentSelectedTour.id) {
      return;
    }

    this.showCreateTourForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(undefined);
    this.showCreateTourLogForm.set(false);
    this.tourLogToDelete.set(undefined);
    this.apiError.set(undefined);
    this.editingTourLog.set(log);
  }

  onEditTourLogSaved(data: TourLogFormData): void {
    void this.updateLog(data);
  }

  private async updateLog(data: TourLogFormData): Promise<void> {
    const logBeingEdited = this.editingTourLog();

    if (!logBeingEdited) {
      return;
    }

    try {
      const userId = this.getUserId();
      const updatedLog = await this.tourLogService.updateLog(userId, logBeingEdited.id, data);
      this.tourLogs.update((currentLogs) =>
        currentLogs.map((l) => (l.id === updatedLog.id ? updatedLog : l))
      );
      await this.loadTours();
      this.editingTourLog.set(undefined);
      this.apiError.set(undefined);
    } catch (error) {
      this.apiError.set(this.extractErrorMessage(error, 'Failed to update tour log.'));
    }
  }

  onEditTourLogCancelled(): void {
    this.editingTourLog.set(undefined);
  }

  startDeleteTourLog(log: TourLog): void {
    const currentSelectedTour = this.selectedTour();

    if (!currentSelectedTour || log.tourId !== currentSelectedTour.id) {
      return;
    }

    this.showCreateTourForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(undefined);
    this.showCreateTourLogForm.set(false);
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(log);
    this.apiError.set(undefined);
  }

  confirmDeleteTourLog(): void {
    void this.deleteLog();
  }

  private async deleteLog(): Promise<void> {
    const pendingDeleteLog = this.tourLogToDelete();

    if (!pendingDeleteLog) {
      return;
    }

    try {
      const userId = this.getUserId();
      await this.tourLogService.deleteLog(userId, pendingDeleteLog.id);
      this.tourLogs.update((currentLogs) =>
        currentLogs.filter((l) => l.id !== pendingDeleteLog.id)
      );
      await this.loadTours();
      if (this.editingTourLog()?.id === pendingDeleteLog.id) {
        this.editingTourLog.set(undefined);
      }

      this.tourLogToDelete.set(undefined);
      this.apiError.set(undefined);
    } catch (error) {
      this.apiError.set(this.extractErrorMessage(error, 'Failed to delete tour log.'));
      this.tourLogToDelete.set(undefined);
    }
  }

  cancelDeleteTourLog(): void {
    this.tourLogToDelete.set(undefined);
  }

  async onExport(): Promise<void> {
    try {
      const userId = this.getUserId();
      const blob = await this.tourService.exportTours(userId);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `tourplanner-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      window.alert('Export failed. Please try again.');
    }
  }

  openImportDialog(): void {
    this.importFileInput()?.nativeElement.click();
  }

  async onImportFileSelected(event: Event): Promise<void> {
    const fileInput = event.target as HTMLInputElement | null;
    const selectedFile = fileInput?.files?.item(0);

    if (!selectedFile) {
      return;
    }

    try {
      const fileContent = await selectedFile.text();
      const importData = JSON.parse(fileContent);
      if (!importData.tours || !Array.isArray(importData.tours)) {
        throw new Error('Invalid export format');
      }
      const userId = this.getUserId();
      await this.tourService.importTours(userId, importData.tours);
      await this.loadTours();
      window.alert('Import completed successfully.');
    } catch (error) {
      window.alert('Import failed. Please use a valid Tourplanner JSON file.');
    } finally {
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }



  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
