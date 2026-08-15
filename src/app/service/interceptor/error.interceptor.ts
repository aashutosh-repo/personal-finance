import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ErrorHandlerService } from '../error-handler/error-handler.service';

export const ErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((err: any) => {
      try { errorHandler.showError(err); } catch {}
      if (err && err.status === 401) {
        try { auth.clearLocalSession(); } catch {}
        try { router.navigate(['/login']); } catch {}
      }
      return throwError(() => err);
    })
  );
};
