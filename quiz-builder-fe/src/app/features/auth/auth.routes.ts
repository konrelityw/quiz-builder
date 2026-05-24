import { Routes } from '@angular/router';
import { ForgotPasswordPageComponent } from './pages/forgot-password-page/forgot-password-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { RegisterPageComponent } from './pages/register-page/register-page.component';
import { ResendVerificationPageComponent } from './pages/resend-verification-page/resend-verification-page.component';
import { ResetPasswordPageComponent } from './pages/reset-password-page/reset-password-page.component';
import { VerifyEmailPageComponent } from './pages/verify-email-page/verify-email-page.component';

export const authRoutes: Routes = [
  {
    path: 'login',
    component: LoginPageComponent,
  },
  {
    path: 'register',
    component: RegisterPageComponent,
  },
  {
    path: 'verify-email',
    component: VerifyEmailPageComponent,
  },
  {
    path: 'resend-verification',
    component: ResendVerificationPageComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPageComponent,
  },
  {
    path: 'reset-password',
    component: ResetPasswordPageComponent,
  },
];
