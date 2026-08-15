import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { LoginRequest, LoginResponse, RegistrationRequest, RegistrationResponse } from "../../../model/loginRequest.model";
import { BehaviorSubject, catchError, Observable, tap, throwError, of } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import { BrowserStorageService } from "./BrowserStorageService.service";
import { environment } from "../../../environments/environment.prod";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseUrl = environment.apiUrl + '/api/v1/auth';

  private readonly BASE_URL = environment.apiUrl + '/api/v1/auth';
  private readonly TOKEN_KEY = 'auth_token';
  // Prefer cookie-based authentication by default. When true, do not persist tokens to localStorage.
  preferCookieAuth = true;
  // In-memory token storage to avoid persistent storage exposure
  private inMemoryToken: string | null = null;
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private storage = inject(BrowserStorageService);
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    const user = this.storage.get('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE_URL}/login`, credentials,
      {withCredentials: true,}
    )
      .pipe(
        tap(response => {
          if (!this.preferCookieAuth && response.accessToken) {
            this.saveToken(response.accessToken);
          } else {
            // keep token only in memory when present
            if (response.accessToken) this.inMemoryToken = response.accessToken;
          }
          this.currentUserSubject.next(response);
          this.storage.set('user', JSON.stringify(response.user)); 
        }),
      );
  }

  register(registrationData: RegistrationRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.BASE_URL}/register`, registrationData,
      {withCredentials: true}
    )
      .pipe(
        tap(response => {
          if (response.user) {
            this.storage.set('registered_user', JSON.stringify(response.user));
          }
        }),
        catchError(this.handleError)
      );
  }

  registerUser(registrationData: RegistrationRequest): Observable<RegistrationResponse> {
    
    return this.http.post<RegistrationResponse>(`${this.BASE_URL}/register`, registrationData, 
      {withCredentials: true})
      .pipe(
        tap(response => {
          if(response.user) {
            this.storage.set('registered_user', JSON.stringify(response.user));
          }
        })
      );
  }

  getSessionItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      return this.storage.get(key);
    }
    return null;
  }
  
  setSessionItem(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      this.storage.set(key, value);
    }
  }

  getCurrentUser(): string | null {
    const userStr= this.storage.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.email.toString();
  }

  getCurrentUserID(): string | null {
    const userStr= this.storage.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.id.toString();
  }

    getUserID(): string | null {
    const userStr= this.storage.get('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.id.toString();
  }

  /**
   * Save JWT token to localStorage
   */
  saveToken(token: string) {
    // Store token in-memory only to reduce XSS exposure. Avoid localStorage.
    this.inMemoryToken = token;
  }

  /**
   * Retrieve JWT token from localStorage
   */
  getToken(): string | null {
    // Prefer in-memory token. If not available and cookie-mode disabled, fall back to localStorage.
    if (this.inMemoryToken) return this.inMemoryToken;
    try {
      if (!this.preferCookieAuth && typeof window !== 'undefined') {
        return localStorage.getItem(this.TOKEN_KEY);
      }
    } catch (e) {}
    return null;
  }

  /**
   * Logout and clear token
   */
  logout(): Observable<any> {
    return this.http.post(`${this.BASE_URL}/logout`, {}, {withCredentials: true})
      .pipe(
        tap(() => {
          console.log('Logout successful');
          this.currentUserSubject.next(null);
          this.inMemoryToken = null;
          try { localStorage.removeItem(this.TOKEN_KEY); } catch {}
          this.storage.remove('user');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Clear client-side session state without contacting the server.
   * Useful when token has expired or a 401 is returned to avoid recursive requests.
   */
  clearLocalSession() {
    try { this.inMemoryToken = null; } catch {}
    try { localStorage.removeItem(this.TOKEN_KEY); } catch {}
    try { this.storage.remove('user'); } catch {}
    try { this.currentUserSubject.next(null); } catch {}
  }
  
  // logout() {
  //   sessionStorage.removeItem(this.TOKEN_KEY);
  // }
  
  verifyToken(): Observable<{ valid: boolean; message?: string }> {
    return this.http.get<{ valid: boolean; message?: string }>(`${this.BASE_URL}/verify`, {
      withCredentials: true  
    }).pipe(
      catchError(error => {
        // On verify failure, attempt refresh flow if supported by server
        return this.refreshToken().pipe(
          catchError(() => {
            if (this.isTokenValid()) {
              return of({ valid: true, message: 'Token valid (local validation)' });
            }
            return throwError(() => new Error('Token invalid or expired'));
          }),
          // If refresh succeeded, report valid
          // map to expected shape
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          // Note: refreshToken's tap will update token/user state
          () => of({ valid: true, message: 'Token refreshed' })
        );
      })
    );
  }

  /**
   * Attempt to rotate/refresh access token using server-side refresh cookie.
   * Server must expose a `/refresh` endpoint that sets a new HttpOnly cookie
   * or returns a new access token. Client uses { withCredentials: true }.
   */
  refreshToken(): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/refresh`, {}, { withCredentials: true }).pipe(
      tap(response => {
        // If server returns an accessToken, store according to preference
        if (response?.accessToken) {
          if (!this.preferCookieAuth) {
            this.saveToken(response.accessToken);
          } else {
            this.inMemoryToken = response.accessToken;
          }
        }
        // If server returns user info, update currentUser
        if (response?.user) {
          this.currentUserSubject.next(response);
          try { this.storage.set('user', JSON.stringify(response.user)); } catch {}
        }
      }),
      catchError(err => throwError(() => err))
    );
  }

  /**
   * Local token validation - checks if token exists and is not expired
   */
  private isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      // Decode JWT manually (JWT format: header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Decode payload
      const decoded = JSON.parse(atob(parts[1]));
      
      // Check expiration
      if (decoded.exp) {
        const expirationTime = decoded.exp * 1000; // exp is in seconds, convert to ms
        if (Date.now() > expirationTime) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
  
  isLoggedIn(): boolean {
    // Consider user logged in if we have current user info or a token
    try {
      if (this.currentUserSubject.value) return true;
      const userStr = this.storage.get('user');
      if (userStr) return true;
    } catch (e) {}
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMsg = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      // client-side or network error
      errorMsg = `Network error: ${error.error.message}`;
    } else {
      // backend error
      errorMsg = error.error?.message || `Server returned code ${error.status}`;
    }
    console.error('AuthService Error:', errorMsg);
    return throwError(() => new Error(errorMsg));
  }
}