import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private checkSub?: Subscription;

  constructor(private auth: AuthService) {
    this.isAuthenticatedSubject.next(this.auth.isLoggedIn());
    // Periodically validate token (every 60s)
    this.checkSub = interval(60000).subscribe(() => this.validate());
    // update on login/logout
    this.auth.currentUser$.subscribe(user => {
      this.isAuthenticatedSubject.next(!!user && this.auth.isLoggedIn());
    });
  }

  validate() {
    if (!this.auth.isLoggedIn()) {
      this.isAuthenticatedSubject.next(false);
      return;
    }

    this.auth.verifyToken().subscribe({
      next: (res) => this.isAuthenticatedSubject.next(!!res && !!res.valid),
      error: () => this.isAuthenticatedSubject.next(false)
    });
  }

  ngOnDestroy() {
    this.checkSub?.unsubscribe();
  }
}
