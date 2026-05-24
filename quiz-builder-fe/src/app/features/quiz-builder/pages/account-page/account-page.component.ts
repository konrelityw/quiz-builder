import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../services/auth-api.service';

export type DigestFrequency = 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly';

@Component({
  selector: 'app-account-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authApiService = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  profileStatus = '';
  passwordStatus = '';
  emailStatus = '';
  digestStatus = '';
  errorMessage = '';

  username = '';
  email = '';
  emailVerifiedLabel = '';

  showPasswordForm = false;
  showEmailForm = false;

  passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  emailForm = this.fb.nonNullable.group({
    newEmail: ['', [Validators.required, Validators.email]],
    currentPassword: ['', Validators.required],
  });

  digestForm = this.fb.nonNullable.group({
    frequency: this.fb.nonNullable.control<DigestFrequency>('off', { validators: [Validators.required] }),
  });

  constructor() {
    this.loadProfile();
  }

  private loadProfile() {
    this.profileStatus = 'Loading profile...';
    this.errorMessage = '';
    this.digestStatus = '';
    this.authApiService.getMe().subscribe({
      next: (user) => {
        this.username = user.username;
        this.email = user.email ?? '';
        this.emailVerifiedLabel = user.emailVerified ? 'Yes' : 'No';
        const freq = user.analyticsDigestFrequency ?? 'off';
        this.digestForm.patchValue({ frequency: freq });
        this.profileStatus = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.profileStatus = '';
        this.errorMessage = 'Could not load profile.';
        this.cdr.detectChanges();
      },
    });
  }

  saveDigestPreference() {
    const frequency = this.digestForm.controls.frequency.value;
    this.errorMessage = '';
    this.digestStatus = 'Saving...';
    this.authApiService.updateAnalyticsDigest(frequency).subscribe({
      next: (response) => {
        this.digestStatus = response.message;
        this.digestForm.patchValue({ frequency: response.analyticsDigestFrequency as DigestFrequency });
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.digestStatus = '';
        this.errorMessage = err?.error?.message ?? 'Could not save preference.';
        this.cdr.detectChanges();
      },
    });
  }

  openPasswordForm() {
    this.showEmailForm = false;
    this.emailForm.reset();
    this.emailStatus = '';
    this.showPasswordForm = true;
    this.passwordStatus = '';
    this.errorMessage = '';
    this.passwordForm.reset();
    this.cdr.detectChanges();
  }

  cancelPasswordForm() {
    this.showPasswordForm = false;
    this.passwordForm.reset();
    this.passwordStatus = '';
    this.cdr.detectChanges();
  }

  openEmailForm() {
    this.showPasswordForm = false;
    this.passwordForm.reset();
    this.passwordStatus = '';
    this.showEmailForm = true;
    this.emailStatus = '';
    this.errorMessage = '';
    this.emailForm.patchValue({
      newEmail: this.email,
      currentPassword: '',
    });
    this.cdr.detectChanges();
  }

  cancelEmailForm() {
    this.showEmailForm = false;
    this.emailForm.reset();
    this.emailStatus = '';
    this.cdr.detectChanges();
  }

  changePassword() {
    const current = this.passwordForm.controls.currentPassword.value;
    const nextPass = this.passwordForm.controls.newPassword.value;
    const confirm = this.passwordForm.controls.confirmPassword.value;

    if (this.passwordForm.invalid || nextPass !== confirm) {
      this.passwordForm.markAllAsTouched();
      this.errorMessage =
        nextPass !== confirm ? 'New passwords do not match.' : 'Fill all fields correctly.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.passwordStatus = 'Updating...';

    this.authApiService.changePassword(current, nextPass).subscribe({
      next: (response) => {
        this.passwordStatus = response.message;
        this.passwordForm.reset();
        this.showPasswordForm = false;
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.passwordStatus = '';
        this.errorMessage = err?.error?.message ?? 'Could not change password.';
        this.cdr.detectChanges();
      },
    });
  }

  saveEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.errorMessage = 'Enter a valid email and your current password.';
      this.cdr.detectChanges();
      return;
    }

    const { newEmail, currentPassword } = this.emailForm.getRawValue();
    this.errorMessage = '';
    this.emailStatus = 'Saving...';

    this.authApiService.updateEmail(newEmail.trim(), currentPassword).subscribe({
      next: (response) => {
        this.emailStatus = response.message;
        this.showEmailForm = false;
        this.emailForm.reset();
        this.email = response.email ?? newEmail.trim();
        this.emailVerifiedLabel = response.emailVerified ? 'Yes' : 'No';
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.emailStatus = '';
        this.errorMessage = err?.error?.message ?? 'Could not update email.';
        this.cdr.detectChanges();
      },
    });
  }
}
