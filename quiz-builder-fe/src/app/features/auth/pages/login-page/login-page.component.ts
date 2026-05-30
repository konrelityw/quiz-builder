import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {AuthApiService} from '../../../../services/auth-api.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  errorMessage = '';
  requestStatus = '';
  registrationNotice = '';

  form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.registrationNotice =
        'Registration successful. We sent a verification link to your email. Please verify your email, then sign in.';
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Enter username or email and password (min 6 characters).';
      return;
    }

    this.errorMessage = '';
    this.requestStatus = 'Logging in...';
    const {login, password} = this.form.getRawValue();
    this.authApiService
      .login({
        username: login.trim(),
        password,
      })
      .subscribe({
        next: () => {
          this.requestStatus = 'Signed in';
          void this.router.navigate(['/quiz-builder']);
        },
        error: (err: { error?: string | { message?: string } }) => {
          this.requestStatus = '';
          const payload = err?.error;
          const message =
            typeof payload === 'string'
              ? payload
              : payload?.message ?? 'Invalid username or password.';
          this.errorMessage = message;
        },
      });
  }
}
