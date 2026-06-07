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
import { TourFormData } from '../../../services/tour.service';

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

  readonly tourSaved = output<TourFormData>();
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
    imageFile: new FormControl<File | null>(null),
  });

  private getExistingImageName(tour: Tour | undefined): string {
    if (!tour?.imageFilePath) return '';
    const parts = tour.imageFilePath.split('_');
    return parts.length > 1 ? parts.slice(1).join('_') : (tour.imageFilePath.split('/').pop() || '');
  }

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
          imageFile: null,
        });
        this.selectedImageName.set(this.getExistingImageName(currentTour));
      } else {
        this.tourForm.reset({
          name: '',
          description: '',
          from: '',
          to: '',
          transportType: '',
          imageFile: null,
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
      this.tourForm.controls.imageFile.setValue(selectedFile);
      this.selectedImageName.set(fileName);
      return;
    }

    this.tourForm.controls.imageFile.setValue(null);
    this.selectedImageName.set(this.getExistingImageName(this.tour()));
  }

  onSave(): void {
    if (this.tourForm.invalid) {
      this.tourForm.markAllAsTouched();
      return;
    }

    const currentTour = this.tour();
    const formValue = this.tourForm.getRawValue();
    const imageFilePath = currentTour?.imageFilePath || undefined;

    const data: TourFormData = {
      name: formValue.name.trim(),
      description: formValue.description.trim(),
      from: formValue.from.trim(),
      to: formValue.to.trim(),
      transportType: formValue.transportType as TransportType,
      imageFilePath,
      imageFile: formValue.imageFile ?? undefined,
    };

    this.tourSaved.emit(data);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
