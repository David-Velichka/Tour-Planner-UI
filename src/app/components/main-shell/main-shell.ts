import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TourDetail } from '../tour-detail/tour-detail';
import { TourListComponent } from '../tour-list/tour-list';
import { AuthService } from '../../services/auth.service';
import { Tour, TransportType } from '../../models/tour.model';
import { TourLog } from '../../models/tour-log.model';
import { TourForm } from '../tours/tour-form/tour-form';
import { TourLogForm } from '../tour-logs/tour-log-form/tour-log-form';

interface TourDataExport {
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
  private readonly router = inject(Router);
  private readonly importFileInput = viewChild<ElementRef<HTMLInputElement>>('importFileInput');

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
  readonly searchTerm = signal('');
  readonly filteredTours = computed(() => {
    const normalizedSearchTerm = this.searchTerm().trim().toLowerCase();
    const currentTourLogs = this.tourLogs();

    if (!normalizedSearchTerm) {
      return this.tours();
    }

    return this.tours().filter((tour) => {
      const tourSearchText = [
        tour.name,
        tour.description,
        tour.from,
        tour.to,
        tour.transportType,
        String(tour.distanceKm),
        String(tour.estimatedTimeMin),
        tour.imageFilePath ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (tourSearchText.includes(normalizedSearchTerm)) {
        return true;
      }

      const relatedLogSearchText = currentTourLogs
        .filter((log) => log.tourId === tour.id)
        .map((log) =>
          [
            log.loggedAt,
            log.comment,
            String(log.difficulty),
            String(log.totalDistanceKm),
            String(log.totalTimeMin),
            String(log.rating),
          ].join(' ')
        )
        .join(' ')
        .toLowerCase();

      return relatedLogSearchText.includes(normalizedSearchTerm);
    });
  });
  readonly showCreateTourLogForm = signal(false);
  readonly editingTourLog = signal<TourLog | undefined>(undefined);
  readonly tourLogToDelete = signal<TourLog | undefined>(undefined);

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
      this.editingTourLog.set(undefined);
      this.tourLogToDelete.set(undefined);
    }

    this.selectedTour.set(tour);
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
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
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
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
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
      this.editingTourLog.set(undefined);
      this.tourLogToDelete.set(undefined);
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
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
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
    this.editingTourLog.set(log);
  }

  onEditTourLogSaved(updatedLog: TourLog): void {
    this.tourLogs.update((currentLogs) =>
      currentLogs.map((log) => (log.id === updatedLog.id ? updatedLog : log))
    );

    this.editingTourLog.set(undefined);
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
  }

  confirmDeleteTourLog(): void {
    const pendingDeleteLog = this.tourLogToDelete();

    if (!pendingDeleteLog) {
      return;
    }

    this.tourLogs.update((currentLogs) =>
      currentLogs.filter((log) => log.id !== pendingDeleteLog.id)
    );

    if (this.editingTourLog()?.id === pendingDeleteLog.id) {
      this.editingTourLog.set(undefined);
    }

    this.tourLogToDelete.set(undefined);
  }

  cancelDeleteTourLog(): void {
    this.tourLogToDelete.set(undefined);
  }

  onExport(): void {
    const exportData: TourDataExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tours: this.tours(),
      tourLogs: this.tourLogs(),
    };

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `tourplanner-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(downloadUrl);
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
      const importData = this.parseImportData(JSON.parse(fileContent) as unknown);
      this.applyImportedData(importData);
      window.alert('Import completed successfully.');
    } catch {
      window.alert('Import failed. Please use a valid Tourplanner JSON file.');
    } finally {
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  private parseImportData(rawData: unknown): TourDataExport {
    if (!this.isRecord(rawData)) {
      throw new Error('Invalid JSON root');
    }

    const rawTours = rawData['tours'];
    const rawTourLogs = rawData['tourLogs'];

    if (!Array.isArray(rawTours) || !Array.isArray(rawTourLogs)) {
      throw new Error('Missing data arrays');
    }

    const tours = rawTours.map((tour) => this.parseTour(tour));
    const tourLogs = rawTourLogs.map((log) => this.parseTourLog(log));

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      tours,
      tourLogs,
    };
  }

  private parseTour(rawTour: unknown): Tour {
    if (!this.isRecord(rawTour)) {
      throw new Error('Invalid tour');
    }

    const rawTransportType = rawTour['transportType'];

    if (!this.isTransportType(rawTransportType)) {
      throw new Error('Invalid transport type');
    }

    return {
      id: this.readRequiredString(rawTour, 'id'),
      name: this.readRequiredString(rawTour, 'name'),
      description: this.readRequiredString(rawTour, 'description'),
      from: this.readRequiredString(rawTour, 'from'),
      to: this.readRequiredString(rawTour, 'to'),
      transportType: rawTransportType,
      distanceKm: this.readRequiredNumber(rawTour, 'distanceKm'),
      estimatedTimeMin: this.readRequiredNumber(rawTour, 'estimatedTimeMin'),
      imageFilePath: this.readOptionalString(rawTour, 'imageFilePath'),
    };
  }

  private parseTourLog(rawTourLog: unknown): TourLog {
    if (!this.isRecord(rawTourLog)) {
      throw new Error('Invalid log');
    }

    return {
      id: this.readRequiredString(rawTourLog, 'id'),
      tourId: this.readRequiredString(rawTourLog, 'tourId'),
      loggedAt: this.readRequiredString(rawTourLog, 'loggedAt'),
      comment: this.readRequiredString(rawTourLog, 'comment'),
      difficulty: this.readRequiredNumber(rawTourLog, 'difficulty'),
      totalDistanceKm: this.readRequiredNumber(rawTourLog, 'totalDistanceKm'),
      totalTimeMin: this.readRequiredNumber(rawTourLog, 'totalTimeMin'),
      rating: this.readRequiredNumber(rawTourLog, 'rating'),
    };
  }

  private applyImportedData(importData: TourDataExport): void {
    const currentTours = this.tours();
    const currentLogs = this.tourLogs();

    const currentTourIds = new Set(currentTours.map((tour) => tour.id));
    const toursToAdd = importData.tours.filter((tour) => !currentTourIds.has(tour.id));
    const mergedTours = [...currentTours, ...toursToAdd];

    const mergedTourIds = new Set(mergedTours.map((tour) => tour.id));
    const currentLogIds = new Set(currentLogs.map((log) => log.id));
    const logsToAdd = importData.tourLogs.filter(
      (log) => mergedTourIds.has(log.tourId) && !currentLogIds.has(log.id)
    );

    this.tours.set(mergedTours);
    this.tourLogs.set([...currentLogs, ...logsToAdd]);

    this.showCreateTourForm.set(false);
    this.editingTour.set(undefined);
    this.tourToDelete.set(undefined);
    this.showCreateTourLogForm.set(false);
    this.editingTourLog.set(undefined);
    this.tourLogToDelete.set(undefined);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private isTransportType(value: unknown): value is TransportType {
    return Object.values(TransportType).includes(value as TransportType);
  }

  private readRequiredString(record: Record<string, unknown>, key: string): string {
    const rawValue = record[key];

    if (typeof rawValue !== 'string') {
      throw new Error(`Invalid ${key}`);
    }

    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      throw new Error(`Missing ${key}`);
    }

    return trimmedValue;
  }

  private readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
    const rawValue = record[key];

    if (rawValue === undefined || rawValue === null) {
      return undefined;
    }

    if (typeof rawValue !== 'string') {
      throw new Error(`Invalid ${key}`);
    }

    const trimmedValue = rawValue.trim();
    return trimmedValue || undefined;
  }

  private readRequiredNumber(record: Record<string, unknown>, key: string): number {
    const rawValue = record[key];

    if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
      throw new Error(`Invalid ${key}`);
    }

    return rawValue;
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
