import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, Subject, tap } from 'rxjs';
import { Transaction, V2Transaction, V2TransactionListResponse } from '../../../model/transaction.model';
import { environment } from '../../../environments/environment.prod';
import { AuthService } from '../auth/auth.service';
import { response } from 'express';
import { endianness } from 'os';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
    
  private baseUrl = environment.apiUrl + '/api/v2/transactions';
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private transactionChangeService = new Subject<void>();
  readonly transactionChange$ = this.transactionChangeService.asObservable();

  constructor() {

  }

  addExpense(tx: Transaction): Observable<Transaction> {
    const endpoint = this.isIncome(tx) ? `${this.baseUrl}/income` : `${this.baseUrl}/expense`;
    console.log(this.isIncome(tx) + ' '+ endpoint)
    return this.http.post<V2Transaction>(endpoint, this.toV2CreateRequest(tx), {
        params: this.userParams(tx.userId), 
        withCredentials: true
        }).pipe(map(transaction => this.toLegacyTransaction(transaction)),
        tap(() => this.notifyTransactionChange())
      );
  }

  getExpensesByUser(userId: string): Observable<Transaction[]> {
    return this.http.get<V2TransactionListResponse>(this.baseUrl, {
      params : this.listParam(userId),
      withCredentials: true}).pipe(response => response.pipe(map(res => res.transactions.map(tx => this.toLegacyTransaction(tx)))));
  }


  getExpense(id: number): Observable<Transaction> {
    return this.http.get<V2Transaction>(`${this.baseUrl}/${id}`, {
      params : this.currentUserParams(),
      withCredentials: true}).pipe(map(transaction => this.toLegacyTransaction(transaction)));
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, {
      params: this.currentUserParams().set('deleteBy', this.authService.getCurrentUser() || 'user'),
      withCredentials: true}).pipe(
        tap(() => this.notifyTransactionChange()));
  }

  updateExpense(id: number, tx: Transaction): Observable<Transaction> {
    return this.http.put<V2Transaction>(`${this.baseUrl}/${id}`, this.toV2UpdateRequest(tx), {
      params: this.userParams(tx.userId),
      withCredentials: true}).pipe(map(transaction => this.toLegacyTransaction(transaction)),
      tap(()=> this.notifyTransactionChange())
    );
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

          if (type === 'DEBIT') totalInvestment += amount;
          else if (type === 'debt') totalDebt += amount;
        });

        return { totalExpense, totalInvestment, totalDebt };
      })
    );
  }

  isIncome(tx: Transaction) : boolean{
    console.log("Type of transaction: ", tx.txnType)
    return (tx.txnType || '').toUpperCase() == 'CREDIT';
  }

  userParams(userId: string| number) : HttpParams {
    return new HttpParams().set('userId', String(userId || this.authService.getCurrentUserID() || '1'));
  }

  currentUserParams() : HttpParams {
    return this.userParams(this.authService.getCurrentUserID() || '1');
  }

  listParam(userId: string): HttpParams {
    return new HttpParams()
      .set('userId', String(userId || this.authService.getCurrentUserID() || '1'))
      .set('startDate', '2023-01-01')
      .set('endDate', '2123-12-31')
      .set('pageSize', '100')
      .set('pageNumber', '0')
      .set('sortBy', 'transactionDate')
      .set('sortOrder', 'desc');
  }

  private toV2CreateRequest(transaction: Transaction): any {
    const category = transaction.expenseCategory || 'OTHER';
    const baseRequest = {
      amount: Number(transaction.txnAmount || 0),
      currency: 'INR',
      transactionDate: transaction.dateOfExpense,
      categoryId: transaction.categoryId,
      description: transaction.description,
      createdBy: this.authService.getCurrentUser() || String(transaction.userId || '1')
    };

    return this.isIncome(transaction) ? {...baseRequest, type: 'INCOME', incomeSource: category} : 
    {...baseRequest, type: 'EXPENSE', expenseCategory: category};
  }

    private toV2UpdateRequest(transaction: Transaction): any {
    const category = transaction.expenseCategory || 'OTHER';
    const baseRequest = {
      amount: Number(transaction.txnAmount || 0),
      currency: 'INR',
      transactionDate: transaction.dateOfExpense,
      categoryId: transaction.categoryId || 1,
      description: transaction.description || '',
      createdBy: this.authService.getCurrentUser() || String(transaction.userId || 'user')
    };

    console.log(baseRequest)

    return this.isIncome(transaction) ? {...baseRequest, type: 'INCOME', incomeSource: category} : 
    {...baseRequest, type: 'EXPENSE', expenseCategory: category};
  }

  private toLegacyTransaction(transaction: V2Transaction): Transaction {
    console.log('received Transaction : ', transaction)
    console.log('init type' , transaction.type)
    const type = transaction.type === 'INCOME' ? 'CREDIT' : 'DEBIT';    
 
    console.log('Type final ',type)

    return {
      id: transaction.id,
      userId: transaction.userId,
      categoryId: transaction.categoryId || 1,
      txnAmount: Number(transaction.amount || 0),
      expenseCategory: transaction.incomeSource || transaction.paymentMethod || transaction.investmentType || 'OTHER',
      txnType: type,
      dateOfExpense: transaction.transactionDate,
      description: transaction.description || ''
    };
  }

  private notifyTransactionChange() {
    this.transactionChangeService.next();
  }


}




