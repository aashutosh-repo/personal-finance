import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent, ErrorDialogData } from '../../shared/error-dialog/error-dialog.component';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private dialog = inject(MatDialog);
  private openRef: any = null;

  showError(err: any, opts?: { title?: string; message?: string }) {
    // Normalize message
    const message = opts?.message || this.formatErrorMessage(err) || 'An unexpected error occurred.';
    const details = this.formatErrorDetails(err);

    // If a dialog is already open, update content or ignore
    if (this.openRef) {
      try { this.openRef.componentInstance.data = { title: opts?.title || 'Error', message, details }; } catch {}
      return this.openRef;
    }

    this.openRef = this.dialog.open(ErrorDialogComponent, {
      width: '560px',
      data: { title: opts?.title || 'Error', message, details }
    });

    this.openRef.afterClosed().subscribe(() => { this.openRef = null; });
    return this.openRef;
  }

  private formatErrorMessage(err: any): string | null {
    if (!err) return null;
    if (err.status === 0) return 'Network error — please check your connection.';
    if (err.status === 401) return 'Unauthorized — please log in again.';
    if (err.error && err.error.message) return err.error.message;
    if (err.message) return err.message;
    return null;
  }

  private formatErrorDetails(err: any): string | null {
    try { return JSON.stringify(err, Object.getOwnPropertyNames(err), 2); } catch { return null; }
  }
}
