import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { CookieService } from "./cookie.service";


@Injectable({ providedIn: 'root' })
export class BrowserStorageService {

    private platformId = inject(PLATFORM_ID);
    private cookiesService = inject(CookieService);


  set(key: string, value: string) {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      this.cookiesService.setCookie(key, value);
    }
  }

  get(key: string): string | null {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      return this.cookiesService.getCookie(key);
    }
    return null;
  }

  remove(key: string) {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      this.cookiesService.removeCookie(key);
    }
  }

  exists(key: string): boolean {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      return this.cookiesService.getCookie(key) !== null;
    }
    return false;
  }

  clearAll() {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      this.cookiesService.clearAllCookies();
    }
  }
}
