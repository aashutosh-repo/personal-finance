import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../service/auth/auth.service';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Don't add Authorization header for login, register, or verify (they use cookies)
  // Add Authorization header for all other protected endpoints
  if (token && !req.url.includes('/login') && !req.url.includes('/register') && !req.url.includes('/verify')) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
