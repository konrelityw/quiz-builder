import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../services/auth-api.service';

@Component({
  selector: 'app-verify-email-page',
  imports: [RouterLink],
  templateUrl: './verify-email-page.component.html',
  styleUrl: './verify-email-page.component.scss',
})
export class VerifyEmailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authApiService = inject(AuthApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  errorMessage = '';
  verified = false;
  loading = true;

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.errorMessage = 'Verification link is missing a token.';
      this.cdr.detectChanges();
      return;
    }

    this.authApiService.verifyEmail(token).subscribe({
      next: () => {
        this.loading = false;
        this.verified = true;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading = false;
        this.verified = false;
        this.errorMessage =
          err?.error?.message ?? 'This confirmation link is invalid or has expired.';
        this.cdr.detectChanges();
      },
    });
  }

  goToLogin() {
    void this.router.navigate(['/login']);
  }
}
