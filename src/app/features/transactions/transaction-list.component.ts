import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../service/tansaction/transaction.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Transaction, ExpenseType, TransactionType } from '../../../model/transaction.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-transaction-list',
  imports: [SharedMaterialModules],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading = false;
  showAddForm = false;
  transactionForm: FormGroup;
  editingId: number | null = null;
  transactionTypes = Object.values(TransactionType);
  expenseCategories = Object.values(ExpenseType);

  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'type', 'actions'];
  expenseTypes = Object.values(ExpenseType);

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.transactionForm = this.fb.group({
      txnType: [ExpenseType.SHOPPING, [Validators.required]],
      expenseCategory: ['', [Validators.required]],
      txnAmount: ['', [Validators.required, Validators.min(0)]],
      dateOfExpense: [new Date().toISOString().split('T')[0], [Validators.required]],
      description: [''],
      categoryId: [1]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTransactions();
    }
  }


  loadTransactions() {
    const userId = this.authService.getCurrentUserID();
    console.log('Current User ID:', userId); // Debugging line
    if (!userId) return;

    this.isLoading = true;
    this.transactionService.getExpensesByUser(userId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load transactions', 'Close', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  onAddTransaction() {
    if (this.transactionForm.valid && !this.isLoading) {
      this.isLoading = true;

      const userId = this.authService.getCurrentUserID();
      console.log('Current User ID:', userId); // Debugging line
      if (!userId) return;

      const transactionData: Transaction = {
        ...this.transactionForm.value,
        userId: userId,
        txnAmount: parseFloat(this.transactionForm.value.txnAmount)
      };
      console.log('Transaction Data:', transactionData); // Debugging line

      if (this.editingId) {
        // Update existing transaction
        this.transactionService.updateExpense(this.editingId, transactionData).subscribe({
          next: () => {
            this.snackBar.open('Transaction updated successfully', 'OK', { duration: 3000 });
            this.loadTransactions();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            this.snackBar.open('Failed to update transaction', 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      } else {
        // Create new transaction
        this.transactionService.addExpense(transactionData).subscribe({
          next: () => {
            this.snackBar.open('Transaction added successfully', 'OK', { duration: 3000 });
            this.loadTransactions();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Failed to add transaction';
            this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      }
    }
  }

  editTransaction(transaction: Transaction) {
    this.editingId = transaction.id || null;
    this.transactionForm.patchValue({
      txnType: transaction.txnType,
      expenseCategory: transaction.expenseCategory,
      txnAmount: transaction.txnAmount,
      dateOfExpense: transaction.dateOfExpense,
      description: transaction.description,
      categoryId: transaction.categoryId
    });
    this.showAddForm = true;
  }

  deleteTransaction(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.transactionService.deleteExpense(id).subscribe({
        next: () => {
          this.snackBar.open('Transaction deleted successfully', 'OK', { duration: 3000 });
          this.loadTransactions();
        },
        error: (err) => {
          this.snackBar.open('Failed to delete transaction', 'Close', { duration: 4000 });
        }
      });
    }
  }

  resetForm() {
    this.transactionForm.reset({
      txnType: ExpenseType.SHOPPING,
      dateOfExpense: new Date().toISOString().split('T')[0],
      categoryId: 1
    });
    this.editingId = null;
    this.showAddForm = false;
  }
}
