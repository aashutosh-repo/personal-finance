import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";

/**
 * CookieService - Handles cookie operations with secure defaults
 * Replaces sessionStorage for token and user data storage
 */
@Injectable({ providedIn: 'root' })
export class CookieService {
  private platformId = inject(PLATFORM_ID);
  private readonly COOKIE_EXPIRY_DAYS = 7; // 7 days expiry

  /**
   * Set a cookie with secure options
   * @param key Cookie name
   * @param value Cookie value
   * @param options Cookie options (days, path, domain, secure, sameSite)
   */
  setCookie(key: string, value: string, options?: {
    days?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }): void {
    if (typeof document === 'undefined' || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const opts = {
      days: options?.days ?? this.COOKIE_EXPIRY_DAYS,
      path: options?.path ?? '/',
      secure: options?.secure ?? true,
      sameSite: options?.sameSite ?? 'Lax',
      domain: options?.domain,
    };

    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    
    // Set expiry date
    if (opts.days) {
      const date = new Date();
      date.setTime(date.getTime() + opts.days * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    cookieString += `; path=${opts.path}`;
    cookieString += `; SameSite=${opts.sameSite}`;
    
    if (opts.secure) {
      cookieString += '; Secure';
    }
    
    if (opts.domain) {
      cookieString += `; domain=${opts.domain}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Get a cookie value
   * @param key Cookie name
   */
  getCookie(key: string): string | null {
    if (typeof document === 'undefined' || !isPlatformBrowser(this.platformId)) {
      return null;
    }

    const nameEQ = encodeURIComponent(key) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Remove a cookie
   * @param key Cookie name
   */
  removeCookie(key: string): void {
    this.setCookie(key, '', { days: -1 });
  }

  /**
   * Check if a cookie exists
   */
  exists(key: string): boolean {
    return this.getCookie(key) !== null;
  }

  /**
   * Clear all cookies
   */
  clearAllCookies(): void {
    if (typeof document === 'undefined' || !isPlatformBrowser(this.platformId)) {
      return;
    }

    document.cookie.split(';').forEach((c) => {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      if (name) {
        this.removeCookie(name);
      }
    });
  }
}
