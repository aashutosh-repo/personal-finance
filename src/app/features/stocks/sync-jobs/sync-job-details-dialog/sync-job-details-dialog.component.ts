import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SyncJobResponse } from '../../../../model/sync-job.model';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';

export interface SyncJobDetailsDialogData {
  job: SyncJobResponse;
}

@Component({
  selector: 'app-sync-job-details-dialog',
  standalone: true,
  imports: [SharedMaterialModules, MatDialogActions, MatDialogModule],
  templateUrl: './sync-job-details-dialog.component.html',
  styleUrl: './sync-job-details-dialog.component.scss'
})
export class SyncJobDetailsDialogComponent {
  readonly job: SyncJobResponse;

  constructor(@Inject(MAT_DIALOG_DATA) public data: SyncJobDetailsDialogData) {
    this.job = data.job;
  }

  getStatusText(status: string | null | undefined): string {
    if (!status) {
      return 'UNKNOWN';
    }

    return status === 'QUEUED' ? 'PENDING' : status;
  }

  getStatusClass(status: string | null | undefined): string {
    const normalized = (status || '').toUpperCase();

    if (normalized === 'SUCCESS') {
      return 'status-success';
    }

    if (normalized === 'FAILED') {
      return 'status-failed';
    }

    if (normalized === 'RUNNING') {
      return 'status-running';
    }

    return 'status-pending';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }

    return new Date(value).toLocaleString();
  }
}
