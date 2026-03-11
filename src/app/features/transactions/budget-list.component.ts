import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetService } from '../../service/tansaction/budget.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BudgetResponse } from '../../../model/budget.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-budget-list',
  imports: [SharedMaterialModules],
  templateUrl: './budget-list.component.html',
  styleUrls: ['./budget-list.component.scss']
})
export class BudgetListComponent implements OnInit {
  budgets: BudgetResponse[] = [];
  isLoading = false;
  showAddForm = false;
  budgetForm: FormGroup;
  editingId: number | null = null;

  displayedColumns: string[] = ['category', 'budgetAmount', 'spentAmount', 'percentage', 'status', 'actions'];

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.budgetForm = this.fb.group({
      categoryId: [1, [Validators.required]],
      budgetAmount: ['', [Validators.required, Validators.min(0)]],
      month: ['', [Validators.required]],
      description: ['']
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadBudgets();
      // Set current month as default
      const today = new Date();
      const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      this.budgetForm.patchValue({ month });
    }
  }

  loadBudgets() {
    const userId = this.authService.getCurrentUserID();
    if (!userId) return;

    this.isLoading = true;
    this.budgetService.getBudgetsByUser(parseInt(userId)).subscribe({
      next: (budgets) => {
        this.budgets = budgets;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load budgets', 'Close', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  onAddBudget() {
    if (this.budgetForm.valid && !this.isLoading) {
      this.isLoading = true;

      const budgetData = this.budgetForm.value;
      
      if (this.editingId) {
        // Update existing budget
        this.budgetService.updateBudget(this.editingId, budgetData).subscribe({
          next: () => {
            this.snackBar.open('Budget updated successfully', 'OK', { duration: 3000 });
            this.loadBudgets();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            this.snackBar.open('Failed to update budget', 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      } else {
        // Create new budget
        this.budgetService.createBudget(budgetData).subscribe({
          next: () => {
            this.snackBar.open('Budget created successfully', 'OK', { duration: 3000 });
            this.loadBudgets();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Failed to create budget';
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
      budgetAmount: budget.budgetAmount,
      month: budget.month
    });
    this.showAddForm = true;
  }

  deleteBudget(id: number) {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.deleteBudget(id).subscribe({
        next: () => {
          this.snackBar.open('Budget deleted successfully', 'OK', { duration: 3000 });
          this.loadBudgets();
        },
        error: (err) => {
          this.snackBar.open('Failed to delete budget', 'Close', { duration: 4000 });
        }
      });
    }
  }

  resetForm() {
    this.budgetForm.reset();
    this.editingId = null;
    this.showAddForm = false;
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.budgetForm.patchValue({ month });
  }

  getStatusClass(budget: BudgetResponse): string {
    if (budget.isExceeded) {
      return 'status-exceeded';
    } else if (budget.percentageUsed > 80) {
      return 'status-warning';
    }
    return 'status-good';
  }

  getStatusText(budget: BudgetResponse): string {
    if (budget.isExceeded) {
      return 'Exceeded';
    } else if (budget.percentageUsed > 80) {
      return 'Warning';
    }
    return 'Good';
  }
}
