import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatRequest, ChatResponse } from '../../../model/chatbot.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly BASE_URL = 'http://localhost:8080/api/llm';
  private http = inject(HttpClient);

  /**
   * Send a message to the chatbot
   */
  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.BASE_URL}/chat`, {
      message: request.message,
      conversationId: request.conversationId
    });
  }

  /**
   * Get chat context for financial advice
   * Provides context about the user's finances
   */
  getChatContext(userId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/context/user/${userId}`);
  }
}
