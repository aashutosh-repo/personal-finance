import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Transaction } from '../../../model/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
    
  private baseUrl = 'http://localhost:8080/api/v1/transactions';

  constructor(private http: HttpClient) {}

  addExpense(tx: Transaction): Observable<Transaction> {
    return this.http.post<Transaction>(this.baseUrl, tx);
  }

  getExpensesByUser(userId: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/user/${userId}`);
  }

  getExpense(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/${id}`);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

   calculateTotals(userId: number): Observable<{ totalExpense: number; totalInvestment: number; totalDebt: number }> {
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
