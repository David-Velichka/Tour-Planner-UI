import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TourLog } from '../../../models/tour-log.model';

@Component({
  selector: 'app-tour-log-form',
  imports: [ReactiveFormsModule],
  templateUrl: './tour-log-form.html',
  styleUrl: './tour-log-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourLogForm {
  readonly log = input<TourLog | undefined>(undefined);
  readonly tourId = input<string>('');

  readonly logSaved = output<TourLog>();
  readonly cancelled = output<void>();

  readonly isEditMode = computed(() => this.log() !== undefined);

  readonly logForm = new FormGroup({
    loggedAt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    difficulty: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(10)],
    }),
    totalDistanceKm: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0.1)],
    }),
    totalTimeMin: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    rating: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(5)],
    }),
  });

  constructor() {
    // Keep form values synced when switching between create and edit mode.
    effect(() => {
      const currentLog = this.log();

      if (currentLog) {
        this.logForm.patchValue({
          loggedAt: this.toDateTimeLocal(currentLog.loggedAt),
          comment: currentLog.comment,
          difficulty: currentLog.difficulty,
          totalDistanceKm: currentLog.totalDistanceKm,
          totalTimeMin: currentLog.totalTimeMin,
          rating: currentLog.rating,
        });
      } else {
        this.logForm.reset({
          loggedAt: '',
          comment: '',
          difficulty: null,
          totalDistanceKm: null,
          totalTimeMin: null,
          rating: null,
        });
      }

      this.logForm.markAsPristine();
      this.logForm.markAsUntouched();
    });
  }

  onSave(): void {
    if (this.logForm.invalid) {
      this.logForm.markAllAsTouched();
      return;
    }

    const currentLog = this.log();
    const formValue = this.logForm.getRawValue();
    const activeTourId = this.tourId().trim() || currentLog?.tourId || '';

    if (!activeTourId) {
      return;
    }

    const logToSave: TourLog = {
      id: currentLog?.id ?? this.createLogId(),
      tourId: activeTourId,
      loggedAt: this.fromDateTimeLocal(formValue.loggedAt),
      comment: formValue.comment.trim(),
      difficulty: formValue.difficulty ?? 1,
      totalDistanceKm: formValue.totalDistanceKm ?? 0,
      totalTimeMin: formValue.totalTimeMin ?? 0,
      rating: formValue.rating ?? 1,
    };

    this.logSaved.emit(logToSave);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  // Convert stored value format to datetime-local format for the input field.
  private toDateTimeLocal(value: string): string {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return '';
    }

    if (trimmedValue.includes('T')) {
      return trimmedValue.slice(0, 16);
    }

    return trimmedValue.replace(' ', 'T').slice(0, 16);
  }

  // Convert datetime-local value back to  display format.
  private fromDateTimeLocal(value: string): string {
    return value.trim().replace('T', ' ');
  }

  private createLogId(): string {
    return `log-${Date.now()}`;
  }
}