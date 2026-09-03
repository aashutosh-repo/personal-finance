import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.prod";
import { Observable } from "rxjs";
import { DcfFromFundamentalsRequest, DcfValuationResponse, FundamentalsOverviewResponse, StockScore } from "../../features/stocks/models/stock.model";
import { TechnicalAnalysis } from "../../../model/technical-analysis.model";


@Injectable({providedIn: 'root'})
export class StockService {
    private http = inject(HttpClient);
    private readonly baseUrl= environment.aiApiurl+ '/api/ai';


    getFundamentals(symbol: string): Observable<FundamentalsOverviewResponse> {
        return this.http.get<FundamentalsOverviewResponse>(`${this.baseUrl}/${symbol}/fundamentals`)
    }

    getTechnicalAnalysis(
        symbol: string,
        fromDate: string,
        toDate: string,
        period: 14
    ): Observable<TechnicalAnalysis> {
        const params = new HttpParams()
        .set('fromDate', fromDate)
        .set('toDate', toDate)
        .set('period', period)

        return this.http.get<TechnicalAnalysis>(`${this.baseUrl}/${symbol}/analysis/technical`, {params})
    }
    
    calculateDcfFromFundamentals(
        symbol: string,
        request : DcfFromFundamentalsRequest
    ): Observable<DcfValuationResponse> {
        return this.http.post<DcfValuationResponse>(`${this.baseUrl}/${symbol}/valuation/dcf/from-Fundamental`, request);
    }

    calculateScore(symbol: string, payload: Partial<StockScore>): Observable<StockScore> {
        return this.http.post<StockScore>(`${this.baseUrl}/${symbol}/analysis/score`, payload);
    }
}