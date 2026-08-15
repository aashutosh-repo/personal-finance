import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

export interface ErrorDialogData {
  title?: string;
  message?: string;
  details?: string;
}

@Component({
  standalone: true,
  selector: 'app-error-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
  <h2 mat-dialog-title>
    <mat-icon aria-hidden>error_outline</mat-icon>
    <span class="title">{{ data.title || 'Error' }}</span>
  </h2>
  <mat-dialog-content>
    <p>{{ data.message || 'An unexpected error occurred.' }}</p>
    <pre *ngIf="showDetails" class="details">{{ data.details }}</pre>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="toggleDetails()">{{ showDetails ? 'Hide' : 'Show' }} details</button>
    <button mat-raised-button color="primary" (click)="close()">OK</button>
  </mat-dialog-actions>
  `,
  styles: [
    `:host { display:block; } .details { max-height:200px; overflow:auto; background:#f6f8fa; padding:8px; border-radius:4px; } .title{margin-left:8px}`
  ]
})
export class ErrorDialogComponent {
  showDetails = false;
  constructor(public dialogRef: MatDialogRef<ErrorDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: ErrorDialogData) {}

  close() { this.dialogRef.close(); }
  toggleDetails() { this.showDetails = !this.showDetails; }
}
