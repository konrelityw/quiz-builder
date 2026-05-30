import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {AuthApiService} from '../../../../services/auth-api.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authApiService = inject(AuthApiService);

  status = '';
  errorMessage = '';
  token = '';

  form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirm: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage = 'Reset link is missing a token.';
    }
  }

  submit() {
    if (!this.token) {
      return;
    }

    const password = this.form.controls.password.value;
    const confirm = this.form.controls.confirm.value;

    if (this.form.invalid || password !== confirm) {
      this.form.markAllAsTouched();
      this.errorMessage =
        password !== confirm ? 'Passwords do not match.' : 'Password must be at least 6 characters.';
      return;
    }

    this.errorMessage = '';
    this.status = 'Updating password...';

    this.authApiService.resetPassword(this.token, password).subscribe({
      next: (response) => {
        this.status = `${response.message} You can log in now.`;
      },
      error: (err: { error?: { message?: string } }) => {
        this.status = '';
        this.errorMessage =
          err?.error?.message ?? 'This reset link is invalid or has expired. Request a new one.';
      },
    });
  }
}
