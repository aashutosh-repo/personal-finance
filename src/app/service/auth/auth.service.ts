import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { LoginRequest, LoginResponse, RegistrationRequest, RegistrationResponse } from "../../../model/loginRequest.model";
import { BehaviorSubject, catchError, Observable, tap, throwError } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import { BrowserStorageService } from "./BrowserStorageService.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly BASE_URL = 'http://localhost:8080/api/v1/auth';
  private readonly TOKEN_KEY = 'auth_token';
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private storage: BrowserStorageService,
  ) {
    const user = storage.get('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE_URL}/login`, credentials,
      {withCredentials: true,}
    )
      .pipe(
        // tap(response => this.saveToken(response.accessToken)),
        tap(response => {this.currentUserSubject.next(response),
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

  /**
   * Save JWT token to localStorage
   */
  saveToken(token: string) {
    this.storage.set(this.TOKEN_KEY, token);
  }

  /**
   * Retrieve JWT token from localStorage
   */
  getToken(): string | null {
    return this.getSessionItem(this.TOKEN_KEY);
  }

  /**
   * Logout and clear token
   */
  logout(): Observable<any> {
    return this.http.post(`${this.BASE_URL}/logout`, {}, {withCredentials: true})
      .pipe(
        tap(() => {
          this.currentUserSubject.next(null);
          this.storage.remove(this.TOKEN_KEY);
          this.storage.remove('user');
        }),
        catchError(this.handleError)
      );
  }
  
  // logout() {
  //   sessionStorage.removeItem(this.TOKEN_KEY);
  // }
  
  isLoggedIn(): boolean {
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