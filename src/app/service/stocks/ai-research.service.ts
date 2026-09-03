import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../../environments/environment.prod";
import { Observable } from "rxjs";
import { AiChatResponse, AiJobStatusResponse, AiJobSubmitResponse } from "../../features/stocks/models/stock.model";

@Injectable({providedIn: 'root'})
export class AiResearchService {
    private http = inject(HttpClient);
    private readonly baseUrl= environment.aiApiurl+ '/api/ai';

    chat(question: string): Observable<AiChatResponse> {
        return this.http.post<AiChatResponse>(`${this.baseUrl}/chat`, { question });
    }

    submitJob(question: string): Observable<AiJobSubmitResponse> {
        return this.http.post<AiJobSubmitResponse>(`${this.baseUrl}/chat/job`, { question });
    }

    getJob(jobId: string): Observable<AiJobStatusResponse> {
        return this.http.get<AiJobStatusResponse>(`${this.baseUrl}/chat/job/${jobId}`);
    }
}