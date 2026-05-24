import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../services/auth-api.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly router = inject(Router);

  errorMessage = '';
  requestStatus = '';

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit() {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;

    if (this.form.invalid || password !== confirmPassword) {
      this.form.markAllAsTouched();
      this.errorMessage =
        password !== confirmPassword
          ? 'Passwords do not match.'
          : 'Use a valid email and username (min 3 chars), password (min 6 chars).';
      return;
    }

    this.errorMessage = '';
    this.requestStatus = 'Creating account...';

    const { username, email, password: pwd } = this.form.getRawValue();
    this.authApiService.register({ username, email, password: pwd }).subscribe({
      next: () => {
        void this.router.navigate(['/login'], {
          queryParams: { registered: '1' },
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.requestStatus = '';
        this.errorMessage =
          err?.error?.message ?? 'Registration failed. Try another username or email.';
      },
    });
  }
}
