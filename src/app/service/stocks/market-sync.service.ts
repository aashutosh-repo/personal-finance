import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MarketSyncJobResponse, SyncJobPageResponse, SyncJobResponse } from '../../model/sync-job.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MarketSyncService {
  private readonly baseUrl = `${environment.apiUrl}${environment.apiEndpoints.stocks}`;
  private readonly syncJobUrl = `${environment.apiUrl}${environment.apiEndpoints.stockSyncJobs}`;

  constructor(private readonly http: HttpClient) {}

  startSync(symbol: string, fromDate: string, toDate: string): Observable<MarketSyncJobResponse> {
    const params = new HttpParams()
      .set('from', fromDate)
      .set('to', toDate);

    return this.http.post<MarketSyncJobResponse>(`${this.baseUrl}/${symbol}/prices/sync`, null, {
      params,
      withCredentials: true
    });
  }

  getJobs(
    symbol?: string,
    status?: string,
    page = 0,
    size = 20,
    sort = 'startedAt,desc'
  ): Observable<SyncJobPageResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort);

    if (symbol) {
      params = params.set('symbol', symbol);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<SyncJobPageResponse>(this.syncJobUrl, {
      params,
      withCredentials: true
    });
  }

  getJob(jobId: string): Observable<SyncJobResponse> {
    return this.http.get<SyncJobResponse>(`${this.syncJobUrl}/${jobId}`, { withCredentials: true });
  }
}
