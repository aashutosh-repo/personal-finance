import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.prod';
import { Observable } from 'rxjs';

export interface CategoryExpense { category: string; amount: number; }
export interface BudgetStatus { category: string; budget: number; actual: number; exceeded: boolean; }
export interface FinancialContext {
  userId: string;
  month: string;
  totalIncome: number;
  totalExpense: number;
  categoryExpenses: CategoryExpense[];
  totalSavings: number;
  budgetStatuses: BudgetStatus[];
  savingsRate: number;
  comparisons: any[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/api/v1/analytics';

  getMonthlyContext(userId: string, month?: string): Observable<FinancialContext> {
    const params: any = { userId };
    if (month) params.month = month;
    return this.http.get<FinancialContext>(`${this.base}/monthly`, { params, withCredentials: true });
  }
}
