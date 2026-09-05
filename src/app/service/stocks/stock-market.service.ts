import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarketPrice } from '../../../model/market-price.model';
import { StockStatistics } from '../../../model/stock-statistics.model';
import { TechnicalAnalysis } from '../../../model/technical-analysis.model';



@Injectable({
  providedIn: 'root'
})
export class StockMarketService {

  private readonly apiUrl =
    'http://localhost:8080/api/stocks';

  constructor(
    private readonly http: HttpClient
  ) {}

  getPrices(
    symbol: string,
    from: string,
    to: string
  ): Observable<MarketPrice[]> {

    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get<MarketPrice[]>(
      `${this.apiUrl}/${symbol}/prices`,
      { params, withCredentials: true }
    );
  }

  getStatistics(
    symbol: string,
    from: string,
    to: string
  ): Observable<StockStatistics> {

    const params = new HttpParams()
      .set('from', from)
      .set('to', to);

    return this.http.get<StockStatistics>(
      `${this.apiUrl}/${symbol}/statistics`,
      { params, withCredentials: true }
    );
  }

  getTechnicalAnalysis(symbol: string, from: string, to: string, period = 14): Observable<TechnicalAnalysis> {
    const params = new HttpParams().set('from', from).set('to', to).set('period', period);
    return this.http.post<TechnicalAnalysis>(
      `http://localhost:8080/api/v1/stocks/${symbol}/technical`,
      null,
      { params, withCredentials: true }
    );
  }
}