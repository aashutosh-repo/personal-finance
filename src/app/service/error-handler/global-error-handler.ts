import { ErrorHandler, Injectable, inject } from '@angular/core';
import { ErrorHandlerService } from './error-handler.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private handler = inject(ErrorHandlerService);

  handleError(error: unknown): void {
    try {
      this.handler.showError(error, { title: 'Unexpected Error' });
    } catch (e) {
      // fallback to console
      console.error('GlobalErrorHandler failed', e);
    }
    // Still rethrow to keep default behavior in dev
    console.error(error);
  }
}
