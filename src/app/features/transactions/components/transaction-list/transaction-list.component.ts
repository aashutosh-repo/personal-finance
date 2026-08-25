import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Transaction, ExpenseType, TransactionType, IncomeSource } from '../../../../../model/transaction.model';
import { isPlatformBrowser } from '@angular/common';

interface SummaryCard {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'positive' | 'negative' | 'count';
}

@Component({
  standalone: true,
  selector: 'app-transaction-list',
  imports: [SharedMaterialModules],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent implements OnInit {
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  paginatedTransactions: Transaction[] = [];
  isLoading = false;
  hasError = false;
  showAddForm = false;
  transactionForm: FormGroup;
  editingId: number | null = null;
  transactionTypes = Object.values(TransactionType);
  expenseCategories: string[] = Object.values(ExpenseType);

  displayedColumns: string[] = ['date', 'category', 'description', 'amount', 'type', 'actions'];
  transactionType = TransactionType.DEBIT;
  expenseTypes = Object.values(ExpenseType);
  incomeSources = Object.values(IncomeSource);

  searchTerm = '';
  selectedCategory = 'All';
  selectedType = 'All';
  startDate = '';
  endDate = '';
  currentPage = 1;
  pageSize = 10;

  private currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  get categoryOptions(): string[] {
    return this.transactionType === TransactionType.DEBIT
      ? this.expenseTypes
      : this.incomeSources;
  }

  get summaryCards(): SummaryCard[] {
    const totalIncome = this.transactions
      .filter((txn) => txn.txnType === TransactionType.CREDIT)
      .reduce((sum, txn) => sum + Number(txn.txnAmount || 0), 0);

    const totalExpenses = this.transactions
      .filter((txn) => txn.txnType === TransactionType.DEBIT)
      .reduce((sum, txn) => sum + Number(txn.txnAmount || 0), 0);

    const netBalance = totalIncome - totalExpenses;

    return [
      { label: 'Total Income', value: this.formatCurrency(totalIncome), tone: 'income' },
      { label: 'Total Expenses', value: this.formatCurrency(totalExpenses), tone: 'expense' },
      { label: 'Net Balance', value: this.formatSignedCurrency(netBalance), tone: netBalance >= 0 ? 'positive' : 'negative' },
      { label: 'Transaction Count', value: String(this.transactions.length), tone: 'count' }
    ];
  }

  get pageInfo(): string {
    const total = this.filteredTransactions.length;
    if (!total) return 'Showing 0 of 0 transactions';
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);
    return `Showing ${start}–${end} of ${total} transactions`;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.pageSize));
  }

  get uniqueCategories(): string[] {
    return Array.from(new Set(this.transactions.map((txn) => txn.expenseCategory).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.transactionForm = this.fb.group({
      txnType: [TransactionType.DEBIT, [Validators.required]],
      expenseCategory: ['', [Validators.required]],
      txnAmount: ['', [Validators.required, Validators.min(0)]],
      dateOfExpense: [new Date().toISOString().split('T')[0], [Validators.required]],
      description: [''],
      categoryId: [1]
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.transactionForm.get('txnType')?.valueChanges.subscribe((type) => {
        if (type === 'DEBIT') {
          this.expenseCategories = Object.values(ExpenseType);
        } else if (type === 'CREDIT') {
          this.expenseCategories = Object.values(IncomeSource);
        }

        this.transactionForm.get('expenseCategory')?.reset();
      });

      this.loadTransactions();
    }
  }

  loadTransactions() {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      this.hasError = true;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.hasError = false;
    this.transactionService.getExpensesByUser(userId).subscribe({
      next: (transactions) => {
        this.transactions = transactions || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.transactions = [];
        this.filteredTransactions = [];
        this.paginatedTransactions = [];
        this.isLoading = false;
        this.snackBar.open('Failed to load transactions', 'Close', { duration: 4000 });
      }
    });
  }

  retryLoadTransactions(): void {
    this.loadTransactions();
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredTransactions = this.transactions.filter((txn) => {
      const matchesSearch = !term || [
        txn.expenseCategory,
        txn.description,
        txn.txnType,
        String(txn.txnAmount)
      ].some((value) => (value || '').toString().toLowerCase().includes(term));

      const matchesCategory = this.selectedCategory === 'All' || txn.expenseCategory === this.selectedCategory;
      const matchesType = this.selectedType === 'All' || txn.txnType === this.selectedType;

      const txnDate = new Date(txn.dateOfExpense);
      const hasStartDate = !!this.startDate && !Number.isNaN(txnDate.getTime()) && txnDate < new Date(this.startDate);
      const hasEndDate = !!this.endDate && !Number.isNaN(txnDate.getTime()) && txnDate > new Date(`${this.endDate}T23:59:59`);

      return matchesSearch && matchesCategory && matchesType && !hasStartDate && !hasEndDate;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedTransactions = this.filteredTransactions.slice(start, end);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'All';
    this.selectedType = 'All';
    this.startDate = '';
    this.endDate = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages) {
      return;
    }

    this.currentPage = pageNumber;
    this.updatePagination();
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(value || 0);
  }

  formatSignedCurrency(value: number): string {
    const absolute = this.formatCurrency(Math.abs(value));
    return value >= 0 ? `+${absolute}` : `-${absolute}`;
  }

  formatAmount(txn: Transaction): string {
    const numericValue = Number(txn.txnAmount) || 0;
    const absolute = this.formatCurrency(Math.abs(numericValue));
    return txn.txnType === TransactionType.DEBIT ? `- ${absolute}` : `+ ${absolute}`;
  }

  formatFriendlyDate(dateValue: string): string {
    if (!dateValue) {
      return '—';
    }

    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    const hasTime = dateValue.includes('T') || dateValue.includes(' ');
    const pattern = hasTime ? 'd MMM y, h:mm a' : 'd MMM y';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: hasTime ? 'numeric' : undefined,
      minute: hasTime ? '2-digit' : undefined,
      hour12: hasTime
    }).format(parsed).replace(',', hasTime ? ', ' : '');
  }

  getDescriptionLabel(description: string | undefined): string {
    return description && description.trim() !== '' && description !== '-' ? description : 'No description';
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
    const confirmed = window.confirm('Delete Transaction?\n\nAre you sure you want to delete this transaction?');
    if (!confirmed) return;

    this.transactionService.deleteExpense(id).subscribe({
      next: () => {
        this.snackBar.open('Transaction deleted successfully', 'OK', { duration: 3000 });
        this.loadTransactions();
      },
      error: () => {
        this.snackBar.open('Failed to delete transaction', 'Close', { duration: 4000 });
      }
    });
  }

  resetForm() {
    this.transactionForm.reset({
      txnType: TransactionType.DEBIT,
      dateOfExpense: new Date().toISOString().split('T')[0],
      categoryId: 1
    });
    this.editingId = null;
    this.showAddForm = false;
  }
}
