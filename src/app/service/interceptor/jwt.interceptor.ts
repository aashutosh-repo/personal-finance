import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // If using cookie-based auth (preferred), avoid adding Authorization header.
  // Only add Authorization header when a token is available and service is not in cookie-only mode.
  if (token && !authService.preferCookieAuth && !req.url.includes('/login') && !req.url.includes('/register') && !req.url.includes('/verify')) {
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(cloned);
  }

  return next(req);
};
