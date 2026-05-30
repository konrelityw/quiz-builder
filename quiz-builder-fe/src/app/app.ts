import {Component, inject, signal} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {AuthApiService} from './services/auth-api.service';
import {filter} from 'rxjs';

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

  isStore = false;
  isPublicQuiz = false;

  constructor() {
    const storeRoutes = ['/home', '/products/'];

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects;

        this.isStore = storeRoutes.some(route =>
          currentUrl.includes(route)
        );
        this.isPublicQuiz = currentUrl.startsWith('/quiz/');
      });
  }

  logout() {
    this.authApiService.logout();
    this.router.navigate(['/login']);
  }
}
