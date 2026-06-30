import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Budget, BudgetRequest, BudgetResponse, BudgetAlert } from '../../../model/budget.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private readonly BASE_URL = environment.apiUrl + '/api/v1/budgets';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /**
   * Create a new budget
   */
  createBudget(budgetData: BudgetRequest): Observable<BudgetResponse> {
    const userId = this.authService.getCurrentUserID();
    return this.http.post<BudgetResponse>(`${this.BASE_URL}?userId=${userId}`, budgetData, {withCredentials: true});
  }

  /**
   * Get all budgets for a specific user
   */
  getBudgetsByUser(userId: number): Observable<BudgetResponse[]> {
    return this.http.get<BudgetResponse[]>(`${this.BASE_URL}/user/${userId}`, {withCredentials: true});
  }

  /**
   * Get budgets for a specific month
   */
  getBudgetsByMonth(userId: number, month: string): Observable<BudgetResponse[]> {
    return this.http.get<BudgetResponse[]>(`${this.BASE_URL}/user/${userId}/month/${month}`, {withCredentials: true});
  }

  /**
   * Get a specific budget by ID
   */
  getBudget(id: number): Observable<BudgetResponse> {
    return this.http.get<BudgetResponse>(`${this.BASE_URL}/${id}`, {withCredentials: true});
  }

  /**
   * Update an existing budget
   */
  updateBudget(id: number, budgetData: BudgetRequest): Observable<BudgetResponse> {
    return this.http.put<BudgetResponse>(`${this.BASE_URL}/${id}`, budgetData, {withCredentials: true});
  }

  /**
   * Delete a budget
   */
  deleteBudget(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, {withCredentials: true});
  }

  /**
   * Get budget alerts
   */
  getBudgetAlerts(userId: number): Observable<BudgetAlert[]> {
    return this.http.get<BudgetAlert[]>(`${this.BASE_URL}/alerts/user/${userId}`, {withCredentials: true});
  }
}
