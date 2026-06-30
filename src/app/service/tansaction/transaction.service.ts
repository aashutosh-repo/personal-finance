import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Transaction } from '../../../model/transaction.model';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
    
  private baseUrl = environment.apiUrl + '/api/v1/transactions';
  private http = inject(HttpClient);

  constructor() {}

  addExpense(tx: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.baseUrl, tx, {withCredentials: true});
  }

  getExpensesByUser(userId: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/user/${userId}`, {withCredentials: true});
  }

  getExpense(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/${id}`, {withCredentials: true});
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {withCredentials: true});
  }

  updateExpense(id: number, tx: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.baseUrl}/${id}`, tx, {withCredentials: true});
  }

   calculateTotals(userId: string): Observable<{ totalExpense: number; totalInvestment: number; totalDebt: number }> {
    return this.getExpensesByUser(userId).pipe(
      map(transactions => {
        let totalExpense = 0;
        let totalInvestment = 0;
        let totalDebt = 0;
        transactions.forEach(txn => {
          const amount = Number(txn.txnAmount) || 0;
          const type = txn.expenseCategory?.toLowerCase();

          if (amount!=null) totalExpense += amount;
          if (type === 'investment') totalInvestment += amount;
          else if (type === 'debt') totalDebt += amount;
        });

        return { totalExpense, totalInvestment, totalDebt };
      })
    );
  }
}
