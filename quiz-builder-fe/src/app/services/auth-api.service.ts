import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

export type AuthResponse = {
  access_token: string;
  emailVerified?: boolean;
  email?: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000';
  private readonly tokenStorageKey = 'access_token';

  register(payload: RegisterPayload) {
    return this.http.post<{ message: string; email: string }>(
      `${this.apiUrl}/auth/register`,
      payload,
    );
  }

  login(credentials: LoginCredentials) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        this.setToken(response.access_token);
      }),
    );
  }

  verifyEmail(token: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/verify-email`, { token });
  }

  resendVerification(email: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/resend-verification`, {
      email,
    });
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      password,
    });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/auth/password`, {
      currentPassword,
      newPassword,
    });
  }

  updateEmail(newEmail: string, currentPassword: string) {
    return this.http.patch<{
      message: string;
      email: string;
      emailVerified: boolean;
    }>(`${this.apiUrl}/auth/email`, {
      newEmail,
      currentPassword,
    });
  }

  updateAnalyticsDigest(frequency: 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly') {
    return this.http.patch<{
      message: string;
      analyticsDigestFrequency: string;
    }>(`${this.apiUrl}/auth/analytics-digest`, { frequency });
  }

  getMe() {
    return this.http.get<{
      username: string;
      email?: string;
      emailVerified?: boolean;
      analyticsDigestFrequency?: 'off' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    }>(`${this.apiUrl}/auth/me`);
  }

  getToken() {
    return localStorage.getItem(this.tokenStorageKey);
  }

  logout() {
    localStorage.removeItem(this.tokenStorageKey);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  private setToken(token: string) {
    localStorage.setItem(this.tokenStorageKey, token);
  }
}
