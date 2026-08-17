import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetService } from '../../service/tansaction/budget.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BudgetResponse } from '../../../model/budget.model';
import { isPlatformBrowser } from '@angular/common';
import { ExpenseType } from '../../../model/transaction.model';

interface BudgetRow extends BudgetResponse {
  currentSpending?: number;
  percentageUsed?: number;
  budgetStatus?: string;
}

type BudgetHealth = 'Healthy' | 'Approaching Limit' | 'Near Limit' | 'Exceeded';

@Component({
  standalone: true,
  selector: 'app-budget-list',
  imports: [SharedMaterialModules],
  templateUrl: './budget-list.component.html',
  styleUrls: ['./budget-list.component.scss']
})
export class BudgetListComponent implements OnInit {
  budgets: BudgetRow[] = [];
  filteredBudgets: BudgetRow[] = [];
  isLoading = false;
  loadError = false;
  showAddForm = false;
  budgetForm: FormGroup;
  editingId: number | null = null;
  searchTerm = '';
  selectedCategory = 'all';
  selectedPeriod = 'all';
  selectedStatus = 'all';

  displayedColumns: string[] = ['category', 'name', 'amount', 'spending', 'progress', 'period', 'status', 'actions'];

  expenseCategories = Object.values(ExpenseType);

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    this.budgetForm = this.fb.group({
      category: [ExpenseType.OTHER, [Validators.required]],
      userId: [this.authService.getCurrentUserID(), [Validators.required]],
      categoryId: [1, [Validators.required]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      currency: ['INR'],
      period: ['MONTHLY', [Validators.required]],
      startDate: [startDate, [Validators.required]],
      endDate: [endDate, [Validators.required]],
      alertThreshold: [80, [Validators.min(1), Validators.max(100)]],
      alertFrequency: ['WEEKLY'],
      description: ['']
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBudgets();
    }
  }

  get activeBudgets(): BudgetRow[] {
    return this.budgets.filter((budget) => this.isBudgetActive(budget));
  }

  get totalBudgetAmount(): number {
    return this.activeBudgets.reduce((total, budget) => total + this.safeNumber(budget.amount), 0);
  }

  get totalSpentAmount(): number {
    return this.activeBudgets.reduce((total, budget) => total + this.getSpentAmount(budget), 0);
  }

  get totalRemainingAmount(): number {
    return this.totalBudgetAmount - this.totalSpentAmount;
  }

  get activeBudgetCount(): number {
    return this.activeBudgets.length;
  }

  get filtersActive(): boolean {
    return !!this.searchTerm || this.selectedCategory !== 'all' || this.selectedPeriod !== 'all' || this.selectedStatus !== 'all';
  }

  get budgetInsights(): string[] {
    const sourceBudgets = (this.filteredBudgets.length ? this.filteredBudgets : this.budgets).slice(0, 3);

    return sourceBudgets
      .map((budget) => {
        const health = this.getBudgetHealth(budget);
        const remaining = this.getRemainingAmount(budget);
        const absoluteRemaining = Math.abs(remaining);
        const prettyName = budget.name || 'This budget';

        if (health === 'Healthy') {
          return `${prettyName} is on track with ${this.formatCurrency(remaining)} remaining.`;
        }

        if (health === 'Approaching Limit') {
          return `${prettyName} is approaching its limit.`;
        }

        if (health === 'Near Limit') {
          return `${prettyName} is almost fully used.`;
        }

        if (health === 'Exceeded') {
          return `${prettyName} has exceeded its limit by ${this.formatCurrency(absoluteRemaining)}.`;
        }

        return `${prettyName} is currently within plan.`;
      })
      .filter((insight) => !!insight);
  }

  loadBudgets(): void {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      this.budgets = [];
      this.filteredBudgets = [];
      this.isLoading = false;
      this.loadError = false;
      return;
    }

    this.isLoading = true;
    this.loadError = false;

    this.budgetService.getBudgetsByUser(userId).subscribe({
      next: (budgets) => {
        this.budgets = (budgets || []).map((budget) => this.normalizeBudget(budget));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.budgets = [];
        this.filteredBudgets = [];
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  retryLoadBudgets(): void {
    this.loadBudgets();
  }

  onAddBudget() {
    if (this.budgetForm.valid && !this.isLoading) {
      this.isLoading = true;
      const userId = this.authService.getCurrentUserID();
      if (!userId) {
        console.error('User ID not found. User might not be logged in.');
        this.snackBar.open('User not logged in', 'Close', { duration: 4000 });
        this.isLoading = false;
        return;
      }

      const budgetData = this.budgetForm.value;

      if (this.editingId) {
        this.budgetService.updateBudget(userId, budgetData).subscribe({
          next: () => {
            this.snackBar.open('Budget updated successfully', 'OK', { duration: 3000 });
            this.loadBudgets();
            this.resetForm();
            this.isLoading = false;
          },
          error: () => {
            this.snackBar.open('Failed to update budget', 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      } else {
        this.budgetService.createBudget(budgetData).subscribe({
          next: () => {
            this.snackBar.open('Budget created successfully', 'OK', { duration: 3000 });
            this.loadBudgets();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            const errorMsg = err?.error?.message || 'Failed to create budget';
            this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      }
    }
  }

  editBudget(budget: BudgetResponse) {
    this.editingId = budget.id;
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      name: budget.name,
      amount: budget.amount,
      currency: budget.currency || 'USD',
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      alertThreshold: budget.alertThreshold || 80,
      alertFrequency: budget.alertFrequency || 'WEEKLY'
    });
    this.showAddForm = true;
  }

  deleteBudget(id: number) {
    const confirmed = typeof window !== 'undefined' ? window.confirm('Delete this budget?\n\nThis action cannot be undone.') : true;

    if (!confirmed) {
      return;
    }

    this.budgetService.deleteBudget(id).subscribe({
      next: () => {
        this.snackBar.open('Budget deleted successfully', 'OK', { duration: 3000 });
        this.loadBudgets();
      },
      error: () => {
        this.snackBar.open('Failed to delete budget', 'Close', { duration: 4000 });
      }
    });
  }

  resetForm() {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    this.budgetForm.reset({
      categoryId: 1,
      currency: 'USD',
      period: 'MONTHLY',
      startDate: startDate,
      endDate: endDate,
      alertThreshold: 80,
      alertFrequency: 'WEEKLY'
    });
    this.editingId = null;
    this.showAddForm = false;
  }

  applyFilters(): void {
    const value = this.searchTerm.trim().toLowerCase();

    this.filteredBudgets = this.budgets.filter((budget) => {
      const categoryName = (budget.categoryName || '').toLowerCase();
      const budgetName = (budget.name || '').toLowerCase();
      const matchesSearch = !value || budgetName.includes(value) || categoryName.includes(value);
      const matchesCategory = this.selectedCategory === 'all' || categoryName === this.selectedCategory.toLowerCase();
      const matchesPeriod = this.selectedPeriod === 'all' || (budget.period || '').toLowerCase() === this.selectedPeriod.toLowerCase();
      const matchesStatus = this.selectedStatus === 'all' || this.getStatusValue(budget) === this.selectedStatus.toLowerCase();

      return matchesSearch && matchesCategory && matchesPeriod && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'all';
    this.selectedPeriod = 'all';
    this.selectedStatus = 'all';
    this.applyFilters();
  }

  getStatusValue(budget: BudgetRow): string {
    const health = this.getBudgetHealth(budget);
    const active = this.isBudgetActive(budget) ? 'active' : 'inactive';

    if (this.selectedStatus === 'health' || this.selectedStatus === 'all') {
      return health.toLowerCase().replace(/\s+/g, '-');
    }

    return active;
  }

  getBudgetHealth(budget: BudgetRow): BudgetHealth {
    const percent = this.getBudgetPercent(budget);

    if (percent > 100) {
      return 'Exceeded';
    }

    if (percent >= 90) {
      return 'Near Limit';
    }

    if (percent >= 70) {
      return 'Approaching Limit';
    }

    return 'Healthy';
  }

  getBudgetPercent(budget: BudgetRow): number {
    const amount = this.safeNumber(budget.amount);
    const spentAmount = this.getSpentAmount(budget);

    if (!amount || amount <= 0) {
      return 0;
    }

    const percentage = (spentAmount / amount) * 100;
    return Number.isFinite(percentage) ? Math.min(Math.max(percentage, 0), 1000) : 0;
  }

  getSpentAmount(budget: BudgetRow): number {
    const runtimeSpent = (budget as BudgetRow).currentSpending ?? (budget as BudgetRow & { spentAmount?: number }).spentAmount ?? 0;
    return this.safeNumber(runtimeSpent);
  }

  getRemainingAmount(budget: BudgetRow): number {
    return this.safeNumber(budget.amount) - this.getSpentAmount(budget);
  }

  getProgressBarValue(budget: BudgetRow): number {
    return Math.min(this.getBudgetPercent(budget), 100);
  }

  getAbsoluteRemainingAmount(budget: BudgetRow): number {
    return Math.abs(this.getRemainingAmount(budget));
  }

  formatCurrency(value: number | null | undefined): string {
    const safeValue = this.safeNumber(value);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeValue);
  }

  normalizeBudget(budget: BudgetResponse): BudgetRow {
    const amount = this.safeNumber(budget.amount);
    const spentAmount = this.safeNumber((budget as BudgetRow).currentSpending ?? (budget as BudgetRow & { spentAmount?: number }).spentAmount ?? 0);
    const percentageUsed = amount > 0 ? (spentAmount / amount) * 100 : 0;

    return {
      ...budget,
      currentSpending: spentAmount,
      percentageUsed: Number.isFinite(percentageUsed) ? percentageUsed : 0,
      budgetStatus: this.getBudgetHealth({ ...budget, currentSpending: spentAmount })
    };
  }

  isBudgetActive(budget: BudgetRow): boolean {
    return budget.isActive !== false;
  }

  private safeNumber(value: number | string | null | undefined): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
