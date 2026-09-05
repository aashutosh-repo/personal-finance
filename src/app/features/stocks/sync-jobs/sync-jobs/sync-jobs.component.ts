import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';
import { Company } from '../../../../../model/company.model';
import { SyncJobDetailsDialogComponent } from '../sync-job-details-dialog/sync-job-details-dialog.component';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';
import { SyncJobResponse } from '../../../../model/sync-job.model';
import { StockCompanyService } from '../../../../service/stocks/stock-company.service';
import { MarketSyncService } from '../../../../service/stocks/market-sync.service';

@Component({
  selector: 'app-sync-jobs',
  standalone: true,
  imports: [SharedMaterialModules, MatPaginatorModule, MatDialogModule],
  templateUrl: './sync-jobs.component.html',
  styleUrl: './sync-jobs.component.scss'
})
export class SyncJobsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  companies: Company[] = [];
  jobs: SyncJobResponse[] = [];

  loadingCompanies = false;
  loadingJobs = false;
  syncing = false;
  errorMessage = '';

  selectedSymbol = '';
  selectedStatus = 'ALL';
  selectedCompany = '';
  fromDate = '';
  toDate = '';

  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  displayedColumns = [
    'symbol',
    'provider',
    'fromDate',
    'toDate',
    'status',
    'recordsProcessed',
    'inserted',
    'updated',
    'startedAt',
    'completedAt',
    'action'
  ];

  private readonly destroy$ = new Subject<void>();
  private activePollSub?: { jobId: string; stop: () => void };

  constructor(
    private readonly companyService: StockCompanyService,
    private readonly marketSyncService: MarketSyncService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearPolling();
  }

  loadCompanies(): void {
    this.loadingCompanies = true;

    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        this.companies = companies ?? [];
        this.loadingCompanies = false;
      },
      error: () => {
        this.loadingCompanies = false;
      }
    });
  }

  loadJobs(): void {
    this.loadingJobs = true;
    this.errorMessage = '';

    const statusFilter = this.selectedStatus === 'ALL' ? undefined : this.selectedStatus;

    this.marketSyncService
      .getJobs(this.selectedSymbol || undefined, statusFilter, this.pageIndex, this.pageSize)
      .subscribe({
        next: (page) => {
          this.jobs = page.content ?? [];
          this.totalElements = page.totalElements ?? 0;
          this.loadingJobs = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load sync jobs right now.';
          this.loadingJobs = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadJobs();
  }

  syncMarketData(): void {
    if (!this.selectedCompany) {
      this.showError('Please select a company before syncing market data.');
      return;
    }

    if (!this.fromDate) {
      this.showError('Please choose a start date.');
      return;
    }

    if (!this.toDate) {
      this.showError('Please choose an end date.');
      return;
    }

    if (new Date(this.fromDate) > new Date(this.toDate)) {
      this.showError('From date must be earlier than or equal to the end date.');
      return;
    }

    this.syncing = true;
    this.errorMessage = '';

    this.marketSyncService.startSync(this.selectedCompany, this.fromDate, this.toDate).subscribe({
      next: (response) => {
        this.syncing = false;
        this.snackBar.open('Market data sync started.', 'Close', { duration: 3000 });
        this.loadJobs();

        if (response?.jobId) {
          this.pollJob(response.jobId);
        }
      },
      error: (error) => {
        this.syncing = false;
        const message = error?.error?.message || error?.message || 'Unable to start market data sync. Please try again.';
        this.showError(message);
      }
    });
  }

  pollJob(jobId: string): void {
    this.clearPolling();

    const stop$ = new Subject<void>();

    this.activePollSub = {
      jobId,
      stop: () => stop$.next()
    };

    timer(2000, 2000)
      .pipe(
        switchMap(() => this.marketSyncService.getJob(jobId)),
        tap((job) => {
          const normalized = this.resolveStatus(job.status);

          if (normalized === 'SUCCESS' || normalized === 'FAILED') {
            this.loadJobs();
            this.clearPolling();

            if (normalized === 'SUCCESS') {
              this.snackBar.open('Market data synchronized successfully.', 'Close', { duration: 3500 });
            } else {
              const backendMessage = job.errorMessage || 'Market data synchronization failed.';
              this.snackBar.open(backendMessage, 'Close', { duration: 4000 });
            }
          }
        }),
        takeUntil(stop$),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => undefined,
        error: () => {
          this.clearPolling();
          this.syncing = false;
        }
      });
  }

  clearPolling(): void {
    if (this.activePollSub) {
      this.activePollSub.stop();
      this.activePollSub = undefined;
    }
  }

  refreshJobs(): void {
    this.loadJobs();
  }

  viewJobDetails(job: SyncJobResponse): void {
    this.dialog.open(SyncJobDetailsDialogComponent, {
      width: '720px',
      maxWidth: '90vw',
      data: { job }
    });
  }

  resetForm(): void {
    this.selectedCompany = '';
    this.fromDate = '';
    this.toDate = '';
  }

  get statuses(): string[] {
    return ['ALL', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED'];
  }

  getStatusText(status: string | null | undefined): string {
    if (!status) {
      return 'PENDING';
    }

    return status === 'QUEUED' ? 'PENDING' : status;
  }

  resolveStatus(status: string | null | undefined): string {
    return (status || '').toUpperCase();
  }

  getStatusClass(status: string | null | undefined): string {
    const normalized = this.resolveStatus(status);

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

  private showError(message: string): void {
    this.errorMessage = message;
    this.snackBar.open(message, 'Close', { duration: 4000 });
  }
}
