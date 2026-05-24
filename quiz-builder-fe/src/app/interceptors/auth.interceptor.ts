import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthApiService } from '../services/auth-api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authApiService = inject(AuthApiService);
  const token = authApiService.getToken();

  if (!token) {
    return next(req);
  }

  const authenticatedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authenticatedRequest);
};
