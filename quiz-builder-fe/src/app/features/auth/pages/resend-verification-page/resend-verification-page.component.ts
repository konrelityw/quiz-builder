import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../services/auth-api.service';

@Component({
  selector: 'app-resend-verification-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './resend-verification-page.component.html',
  styleUrl: './resend-verification-page.component.scss',
})
export class ResendVerificationPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);

  status = '';
  errorMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Enter a valid email address.';
      return;
    }

    this.errorMessage = '';
    this.status = 'Sending...';
    this.authApiService.resendVerification(this.form.controls.email.value.trim()).subscribe({
      next: (response) => {
        this.status = response.message;
      },
      error: () => {
        this.status = '';
        this.errorMessage = 'Could not send email. Try again later.';
      },
    });
  }
}
