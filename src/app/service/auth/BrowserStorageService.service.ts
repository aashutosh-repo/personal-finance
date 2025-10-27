import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";


@Injectable({ providedIn: 'root' })
export class BrowserStorageService {

    private platformId = inject(PLATFORM_ID);


  set(key: string, value: string) {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      sessionStorage.setItem(key, value);
    }
  }

  get(key: string): string | null {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      return sessionStorage.getItem(key);
    }
    return null;
  }

  remove(key: string) {
    if (typeof window !== 'undefined' && isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(key);
    }
  }
}
