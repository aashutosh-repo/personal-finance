import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../service/auth/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router,
    private auth: AuthService
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (typeof window !== 'undefined') {
      // Verify token via API endpoint (HttpOnly cookies sent automatically with withCredentials)
      return this.auth.verifyToken().pipe(
        map(response => response.valid ? true : this.router.createUrlTree(['/login'])),
        catchError(() => of(this.router.createUrlTree(['/login'])))
      );
    }

    return of(this.router.createUrlTree(['/login']));
  }
}
