import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.prod";
import { Observable } from "rxjs";
import { DcfFromFundamentalsRequest, DcfValuationResponse, FundamentalsOverviewResponse, StockScore, TechnicalAnalysis } from "../../features/stocks/models/stock.model";


@Injectable({providedIn: 'root'})
export class StockService {
    private http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;


    getFundamentals(symbol: string): Observable<FundamentalsOverviewResponse> {
        return this.http.get<FundamentalsOverviewResponse>(`${this.baseUrl}/api/v1/stocks/${symbol}/fundamentals`, { withCredentials: true })
    }

    getTechnicalAnalysis(
        symbol: string,
        fromDate: string,
        toDate: string,
        period: 14
    ): Observable<TechnicalAnalysis> {
        const params = new HttpParams()
        .set('from', fromDate)
        .set('to', toDate)
        .set('period', period)

        return this.http.get<TechnicalAnalysis>(`${this.baseUrl}/api/v1/stocks/${symbol}/technical`, { params, withCredentials: true })
    }
    
    calculateDcfFromFundamentals(
        symbol: string,
        request : DcfFromFundamentalsRequest
    ): Observable<DcfValuationResponse> {
        return this.http.post<DcfValuationResponse>(`${this.baseUrl}/api/v1/stocks/${symbol}/valuation/dcf/from-Fundamental`, request, { withCredentials: true });
    }

    calculateScore(symbol: string, payload: Partial<StockScore>): Observable<StockScore> {
        return this.http.post<StockScore>(`${this.baseUrl}/api/v1/stocks/${symbol}/score`, payload, { withCredentials: true });
    }
}