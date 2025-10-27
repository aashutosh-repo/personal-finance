import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';
import { AuthService } from '../service/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router,
    private auth: AuthService
  ) {}

  canActivate(): boolean | UrlTree {
    if (typeof window !== 'undefined') {
      const token = this.auth.getToken();
      if (token) {
        return true; // ✅ user is logged in
      }
    }

    // ❌ no token → redirect to login
    // this.router.navigate(['/v1/login']);
    return this.router.createUrlTree(['/v1/login']);
  }
}
