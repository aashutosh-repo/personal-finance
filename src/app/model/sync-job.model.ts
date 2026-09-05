export interface SyncJobResponse {
  jobId: string;
  symbol: string;
  status: string;
  fromDate: string | null;
  toDate: string | null;
  provider: string;
  totalRecords: number | null;
  insertedRecords: number | null;
  updatedRecords: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface SyncJobPageResponse {
  content: SyncJobResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface MarketSyncJobResponse {
  jobId: string;
  status: string;
  message: string;
}
