import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income, IncomeRequest, IncomeResponse, IncomeSummary } from '../../../model/budget.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private readonly BASE_URL = environment.apiUrl + '/api/v1/income';
  private http = inject(HttpClient);
  authService = inject(AuthService);


  /**
   * Add a new income
   */
  addIncome(incomeData: IncomeRequest): Observable<IncomeResponse> {
      const userId = this.authService.getCurrentUserID();
    return this.http.post<IncomeResponse>(`${this.BASE_URL}?userId=${userId}`, incomeData, {withCredentials: true});
  }

  /**
   * Get all income for a specific user
   */
  getIncomeByUser(userId: number): Observable<IncomeResponse[]> {
    return this.http.get<IncomeResponse[]>(`${this.BASE_URL}/user/${userId}`, {withCredentials: true});
  }

  /**
   * Get income for a specific month
   */
  getIncomeByMonth(userId: number, month: string): Observable<IncomeResponse[]> {
    return this.http.get<IncomeResponse[]>(`${this.BASE_URL}/user/${userId}/month/${month}`, {withCredentials: true});
  }

  /**
   * Get a specific income by ID
   */
  getIncome(id: number): Observable<IncomeResponse> {
    return this.http.get<IncomeResponse>(`${this.BASE_URL}/${id}`, {withCredentials: true});
  }

  /**
   * Update an existing income
   */
  updateIncome(id: number, incomeData: IncomeRequest): Observable<IncomeResponse> {
    return this.http.put<IncomeResponse>(`${this.BASE_URL}/${id}`, incomeData, {withCredentials: true});
  }

  /**
   * Delete an income
   */
  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, {withCredentials: true});
  }

  /**
   * Get income summary for a specific month
   */
  getIncomeSummary(userId: number, month: string): Observable<IncomeSummary> {
    return this.http.get<IncomeSummary>(`${this.BASE_URL}/summary/user/${userId}/month/${month}`, {withCredentials: true});;
  }
}
