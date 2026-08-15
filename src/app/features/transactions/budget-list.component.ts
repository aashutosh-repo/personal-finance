import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BudgetService } from '../../service/tansaction/budget.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BudgetResponse } from '../../../model/budget.model';
import { isPlatformBrowser } from '@angular/common';
import { ExpenseType } from '../../../model/transaction.model';

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

  displayedColumns: string[] = ['category', 'name', 'amount', 'spending', 'percentage', 'period', 'status', 'actions'];
  
  expenseCategories = Object.values(ExpenseType);
  
  categories = [
    { id: 1, name: 'Food & Dining' },
    { id: 2, name: 'Transportation' },
    { id: 3, name: 'Entertainment' },
    { id: 4, name: 'Shopping' },
    { id: 5, name: 'Utilities' },
    { id: 6, name: 'Education' },
    { id: 7, name: 'Health' },
    { id: 8, name: 'Other' }
  ];

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

  loadBudgets() {
    const userId = this.authService.getCurrentUserID();
    if (!userId) return;

    this.isLoading = true;
    this.budgetService.getBudgetsByUser(userId).subscribe({
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
      const userId = this.authService.getCurrentUserID();
      if (!userId) {
        console.error('User ID not found. User might not be logged in.');
        this.snackBar.open('User not logged in', 'Close', { duration: 4000 });
        this.isLoading = false;
        return;
      };

      const budgetData = this.budgetForm.value;
      console.log(budgetData);
      
      if (this.editingId) {
        // Update existing budget
        this.budgetService.updateBudget(userId, budgetData).subscribe({
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
}
