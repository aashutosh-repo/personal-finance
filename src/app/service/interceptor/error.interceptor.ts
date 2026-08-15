import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: any) => {
      if (err && err.status === 401) {
        try { auth.clearLocalSession(); } catch {}
        try { router.navigate(['/login']); } catch {}
      }
      return throwError(() => err);
    })
  );
};
