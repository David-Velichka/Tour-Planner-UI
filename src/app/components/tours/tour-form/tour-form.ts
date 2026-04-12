import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Tour, TransportType } from '../../../models/tour.model';

function visibleCharactersValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? null : { visibleCharacters: true };
}

function transportTypeValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (value === '' || value === undefined || value === null) {
    return null;
  }

  return Object.values(TransportType).includes(value as TransportType)
    ? null
    : { invalidTransportType: true };
}

@Component({
  selector: 'app-tour-form',
  imports: [ReactiveFormsModule],
  templateUrl: 'tour-form.html',
  styleUrl: 'tour-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TourForm {
  readonly tour = input<Tour | undefined>(undefined);

  readonly tourSaved = output<Tour>();
  readonly cancelled = output<void>();

  readonly transportTypes = Object.values(TransportType);
  readonly isEditMode = computed(() => this.tour() !== undefined);
  readonly selectedImageName = signal('');

  readonly tourForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        visibleCharactersValidator,
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500), visibleCharactersValidator],
    }),
    from: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100), visibleCharactersValidator],
    }),
    to: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100), visibleCharactersValidator],
    }),
    transportType: new FormControl<TransportType | ''>('', {
      nonNullable: true,
      validators: [Validators.required, transportTypeValidator],
    }),
    distanceKm: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
        Validators.min(0.1),
      ],
    }),
    estimatedTimeMin: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.pattern(/^\d+$/), Validators.min(1)],
    }),
    imageFile: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const currentTour = this.tour();

      if (currentTour) {
        this.tourForm.patchValue({
          name: currentTour.name,
          description: currentTour.description,
          from: currentTour.from,
          to: currentTour.to,
          transportType: currentTour.transportType,
          distanceKm: currentTour.distanceKm,
          estimatedTimeMin: currentTour.estimatedTimeMin,
          imageFile: '',
        });
        this.selectedImageName.set('');
      } else {
        this.tourForm.reset({
          name: '',
          description: '',
          from: '',
          to: '',
          transportType: '',
          distanceKm: null,
          estimatedTimeMin: null,
          imageFile: '',
        });
        this.selectedImageName.set('');
      }

      this.tourForm.markAsPristine();
      this.tourForm.markAsUntouched();
    });
  }

  onImageSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement | null;
    const selectedFile = fileInput?.files?.item(0);

    if (selectedFile) {
      const fileName = selectedFile.name.trim();
      const imageUrl = URL.createObjectURL(selectedFile);
      this.tourForm.controls.imageFile.setValue(imageUrl);
      this.selectedImageName.set(fileName);
      return;
    }

    this.tourForm.controls.imageFile.setValue('');
    this.selectedImageName.set('');
  }

  onSave(): void {
    if (this.tourForm.invalid) {
      this.tourForm.markAllAsTouched();
      return;
    }

    const currentTour = this.tour();
    const formValue = this.tourForm.getRawValue();
    // Use selected filename if provided, otherwise preserve existing image reference
    const imageFilePath = formValue.imageFile.trim() || currentTour?.imageFilePath || undefined;

    const tourToSave: Tour = {
      id: currentTour?.id ?? this.createTourId(),
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      from: formValue.from.trim(),
      to: formValue.to.trim(),
      transportType: formValue.transportType as TransportType,
      distanceKm: formValue.distanceKm ?? 0,
      estimatedTimeMin: formValue.estimatedTimeMin ?? 0,
      imageFilePath,
    };

    this.tourSaved.emit(tourToSave);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private createTourId(): string {
    return `tour-${Date.now()}`;
  }
}
