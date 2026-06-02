import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { TourLog } from '../../../models/tour-log.model';
import { TourLogFormData } from '../../../services/tour-log.service';

function visibleCharactersValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? null : { visibleCharacters: true };
}

function validDateValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }

  const selectedDate = new Date(value);

  if (Number.isNaN(selectedDate.getTime())) {
    return { invalidDate: true };
  }

  return null;
}

@Component({
  selector: 'app-tour-log-form',
  imports: [ReactiveFormsModule],
  templateUrl: './tour-log-form.html',
  styleUrl: './tour-log-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourLogForm {
  readonly log = input<TourLog | undefined>(undefined);
  readonly tourId = input<number | undefined>(undefined);

  readonly logSaved = output<TourLogFormData>();
  readonly cancelled = output<void>();

  readonly isEditMode = computed(() => this.log() !== undefined);

  readonly logForm = new FormGroup({
    loggedAt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validDateValidator],
    }),
    comment: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(500),
        visibleCharactersValidator,
      ],
    }),
    difficulty: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.pattern(/^\d+$/), Validators.min(1), Validators.max(10)],
    }),
    totalDistanceKm: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0.1),
      ],
    }),
    totalTimeMin: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.pattern(/^\d+$/), Validators.min(1)],
    }),
    rating: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.pattern(/^\d+$/), Validators.min(1), Validators.max(5)],
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

    if (this.tourId() === undefined && !this.log()) {
      return;
    }

    const formValue = this.logForm.getRawValue();

    const data: TourLogFormData = {
      loggedAt: this.fromDateTimeLocal(formValue.loggedAt),
      comment: formValue.comment.trim(),
      difficulty: formValue.difficulty ?? 1,
      totalDistanceKm: formValue.totalDistanceKm ?? 0,
      totalTimeMin: formValue.totalTimeMin ?? 0,
      rating: formValue.rating ?? 1,
    };

    this.logSaved.emit(data);
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

  // Keep the ISO T separator so the backend can parse with LocalDateTime.parse.
  private fromDateTimeLocal(value: string): string {
    return value.trim();
  }

  private createLogId(): string {
    return `log-${Date.now()}`;
  }
}