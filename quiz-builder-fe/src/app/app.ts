import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthApiService } from './services/auth-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly authApiService = inject(AuthApiService);
  private readonly router = inject(Router);
  protected readonly title = signal('quiz-builder');

  logout() {
    this.authApiService.logout();
    this.router.navigate(['/login']);
  }
}
