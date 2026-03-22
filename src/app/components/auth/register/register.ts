import { Component, inject } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }

  return null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly registerForm = new FormGroup(
    {
      username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: [passwordMatchValidator] }
  );

  errorMessage = '';

  onRegister(): void {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      if (this.registerForm.hasError('passwordMismatch')) {
        this.errorMessage = 'Password and confirm password must match.';
      }

      return;
    }

    const { username, password } = this.registerForm.getRawValue();
    const registrationSuccessful = this.authService.register(username, password);

    if (registrationSuccessful) {
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = 'Invalid username or password.';
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}