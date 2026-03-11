import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Income, IncomeRequest, IncomeResponse, IncomeSummary } from '../../../model/budget.model';

@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private readonly BASE_URL = 'http://localhost:8080/api/v1/income';
  private http = inject(HttpClient);

  /**
   * Add a new income
   */
  addIncome(incomeData: IncomeRequest): Observable<IncomeResponse> {
    return this.http.post<IncomeResponse>(`${this.BASE_URL}`, incomeData);
  }

  /**
   * Get all income for a specific user
   */
  getIncomeByUser(userId: number): Observable<IncomeResponse[]> {
    return this.http.get<IncomeResponse[]>(`${this.BASE_URL}/user/${userId}`);
  }

  /**
   * Get income for a specific month
   */
  getIncomeByMonth(userId: number, month: string): Observable<IncomeResponse[]> {
    return this.http.get<IncomeResponse[]>(`${this.BASE_URL}/user/${userId}/month/${month}`);
  }

  /**
   * Get a specific income by ID
   */
  getIncome(id: number): Observable<IncomeResponse> {
    return this.http.get<IncomeResponse>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Update an existing income
   */
  updateIncome(id: number, incomeData: IncomeRequest): Observable<IncomeResponse> {
    return this.http.put<IncomeResponse>(`${this.BASE_URL}/${id}`, incomeData);
  }

  /**
   * Delete an income
   */
  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Get income summary for a specific month
   */
  getIncomeSummary(userId: number, month: string): Observable<IncomeSummary> {
    return this.http.get<IncomeSummary>(`${this.BASE_URL}/summary/user/${userId}/month/${month}`);
  }
}
