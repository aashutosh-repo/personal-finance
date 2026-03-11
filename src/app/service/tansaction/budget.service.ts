import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Budget, BudgetRequest, BudgetResponse, BudgetAlert } from '../../../model/budget.model';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly BASE_URL = 'http://localhost:8080/api/v1/budgets';
  private http = inject(HttpClient);

  /**
   * Create a new budget
   */
  createBudget(budgetData: BudgetRequest): Observable<BudgetResponse> {
    return this.http.post<BudgetResponse>(`${this.BASE_URL}`, budgetData);
  }

  /**
   * Get all budgets for a specific user
   */
  getBudgetsByUser(userId: number): Observable<BudgetResponse[]> {
    return this.http.get<BudgetResponse[]>(`${this.BASE_URL}/user/${userId}`);
  }

  /**
   * Get budgets for a specific month
   */
  getBudgetsByMonth(userId: number, month: string): Observable<BudgetResponse[]> {
    return this.http.get<BudgetResponse[]>(`${this.BASE_URL}/user/${userId}/month/${month}`);
  }

  /**
   * Get a specific budget by ID
   */
  getBudget(id: number): Observable<BudgetResponse> {
    return this.http.get<BudgetResponse>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Update an existing budget
   */
  updateBudget(id: number, budgetData: BudgetRequest): Observable<BudgetResponse> {
    return this.http.put<BudgetResponse>(`${this.BASE_URL}/${id}`, budgetData);
  }

  /**
   * Delete a budget
   */
  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`);
  }

  /**
   * Get budget alerts
   */
  getBudgetAlerts(userId: number): Observable<BudgetAlert[]> {
    return this.http.get<BudgetAlert[]>(`${this.BASE_URL}/alerts/user/${userId}`);
  }
}
