import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { JwtInterceptor } from './service/interceptor/jwt.interceptor';
import { ErrorInterceptor } from './service/interceptor/error.interceptor';
import { ErrorHandler } from '@angular/core';
import { GlobalErrorHandler } from './service/error-handler/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([JwtInterceptor, ErrorInterceptor]),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })),
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
]
};
