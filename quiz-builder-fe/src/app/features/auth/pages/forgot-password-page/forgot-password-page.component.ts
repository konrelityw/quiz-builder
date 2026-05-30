import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {AuthApiService} from '../../../../services/auth-api.service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
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
    this.authApiService.forgotPassword(this.form.controls.email.value.trim()).subscribe({
      next: (response) => {
        this.status = response.message;
      },
      error: () => {
        this.status = '';
        this.errorMessage = 'Could not process request. Try again later.';
      },
    });
  }
}
