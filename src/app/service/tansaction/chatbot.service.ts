import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ChatRequest, ChatResponse } from '../../../model/chatbot.model';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly BASE_URL = environment.apiUrl + '/api/bot';
  private http = inject(HttpClient);

  /**
   * Send a message to the chatbot
   */
  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    console.log('📤 Sending chatbot request:', request);
    
    return this.http.post<ChatResponse>(`${this.BASE_URL}/chat`, {
      userId: request.userId,
      message: request.message,
      conversationId: request.conversationId
    }, {withCredentials: true}).pipe(
      tap(response => {
        console.log('✓ Chatbot response received:', response);
      }),
      catchError(error => {
        console.error('✗ Chatbot request error:', error);
        console.error('Error status:', error.status);
        console.error('Error statusText:', error.statusText);
        console.error('Error body:', error.error);
        throw error;
      })
    );
  }

  /**
   * Get chat context for financial advice
   * Provides context about the user's finances
   */
  getChatContext(userId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/context/user/${userId}`, {withCredentials: true});
  }
}

