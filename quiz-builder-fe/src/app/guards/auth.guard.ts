import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';
import {AuthApiService} from '../services/auth-api.service';

export const authGuard: CanActivateFn = () => {
  const authApiService = inject(AuthApiService);
  const router = inject(Router);

  if (authApiService.isAuthenticated()) {
    return true;
  }

  return router.parseUrl('/login');
};
