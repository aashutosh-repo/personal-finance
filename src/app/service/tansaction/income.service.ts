import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Income, IncomeRequest, IncomeResponse, IncomeSummary } from '../../../model/budget.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment.prod';
import { V2Transaction, V2TransactionListResponse } from '../../../model/transaction.model';

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
    return this.http.post<V2Transaction>(`${this.BASE_URL}/income`, this.toCreateRequest(incomeData), {
      params: this.userParams(userId),
      withCredentials: true}).pipe(map(transaction => this.toIncomeResponse(transaction)));
    }

  /**
   * Get all income for a specific user
   */
  getIncomeByUser(userId: string): Observable<IncomeResponse[]> {
    return this.http.get<V2TransactionListResponse>(this.BASE_URL, {
      params: this.listParams(userId),
      withCredentials: true}).pipe(map(res => res.transactions.map(tx => this.toIncomeResponse(tx))));
  }

  /**
   * Get income for a specific month
   */
  getIncomeByMonth(userId: number, month: string): Observable<IncomeResponse[]> {
    return this.http.get<V2TransactionListResponse[]>(this.BASE_URL, {
      params: this.listParams(String(userId), month),
      withCredentials: true
    }).pipe(map(res => res[0]?.transactions.map(tx => this.toIncomeResponse(tx)) || []));
  }

  /**
   * Get a specific income by ID
   */
  getIncome(id: number): Observable<IncomeResponse> {
    return this.http.get<V2Transaction>(`${this.BASE_URL}/${id}`, {
      params: this.currentUserParams(),
      withCredentials: true}).pipe(map(transaction => this.toIncomeResponse(transaction)));
  }


  /**
   * Update an existing income
   */
  updateIncome(id: number, incomeData: IncomeRequest): Observable<IncomeResponse> {
    return this.http.put<V2Transaction>(`${this.BASE_URL}/${id}`, this.toUpdateRequest(incomeData), {
      params: this.currentUserParams(),
      withCredentials: true
    }).pipe(map(txn => this.toIncomeResponse(txn)));
  }

  /**
   * Delete an income
   */
  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, {
      params: this.currentUserParams().set('deleteBy', this.authService.getCurrentUser() || 'user'),
      withCredentials: true});
  }

  /**
   * Get income summary for a specific month
   */
  getIncomeSummary(userId: number, month: string): Observable<IncomeSummary> {
    return this.getIncomeByMonth(userId, month).pipe(
      map(income => ({
        totalIncome: income.reduce((sum, inc) => sum + Number(inc.amount || 0), 0),
        month,
        sources: income.map(income => ({
          source: income.sourceType,
          amount: Number(income.amount || 0)
        }))
      }))
    );
      
  }

  private toCreateRequest(incomeData: IncomeRequest) {
    return  {
      amount: Number(incomeData.amount || 0),
      currency: incomeData.currency || 'INR',
      transactionDate: incomeData.incomeDate,
      sourceType: incomeData.sourceType,
      incomeDate: incomeData.incomeDate,
      description: incomeData.description || '' 
    };
  }

  private toUpdateRequest(incomeData: IncomeRequest) {
    return  {
      amount: Number(incomeData.amount || 0),
      transactionDate: incomeData.incomeDate,
      categoryId: 1,
      sourceType: incomeData.sourceType,
      incomeDate: incomeData.incomeDate,
      description: incomeData.description || '' 
    };
  }

  toIncomeResponse(transaction: V2Transaction): IncomeResponse {
    return  {
      id: transaction.id || 0,
      amount: Number(transaction.amount || 0),
      incomeDate: transaction.transactionDate,
      sourceType: transaction.incomeSource || 'OTHER',
      description: transaction.description || '',
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
  }

  userParams(userId: string | null): HttpParams {
    return new HttpParams().set('userId', String(userId || this.authService.getCurrentUserID() || '1'));
  }
    
  toLegacyTransaction(transaction: any) {
    throw new Error('Method not implemented.');
  }

  listParams(userId: string, month?: string): HttpParams {
    const range = this.dateRange(month);
    
    return new HttpParams()
      .set('userId', userId)
      .set('type', 'INCOME')
      .set('startDate', '2023-01-01')
      .set('endDate', '2123-12-31')
      .set('pageSize', '100')
      .set('pageNumber', '0')
      .set('sortBy', 'transactionDate')
      .set('sortOrder', 'desc');
  }

  currentUserParams(): HttpParams {
    return this.userParams(this.authService.getCurrentUserID() || '1');
  }

  dateRange(month?: string) : {startDate: string, endDate: string} {
    if(!month) {
      return {startDate: '1900-01-01', endDate: '2100-01-01'};
    }

    const [year, monthNumber] = month.split('-').map(Number);
    const endDate = new Date(year, monthNumber, 0).getDate();

    return {
      startDate : `${year}-${String(monthNumber).padStart(2,'0')}-01`,
      endDate: `${year}-${String(monthNumber).padStart(2,'0')}-${String(endDate).padStart(2,'0')}`
    };
    
  }

}
