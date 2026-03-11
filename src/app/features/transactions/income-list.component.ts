import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { SharedMaterialModules } from '../../service/common/shared-material.module';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IncomeService } from '../../service/tansaction/income.service';
import { AuthService } from '../../service/auth/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IncomeResponse, IncomeRequest } from '../../../model/budget.model';
import { IncomeSource } from '../../../model/enums/IncomeSource.model';
import { isPlatformBrowser } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-income-list',
  imports: [SharedMaterialModules],
  templateUrl: './income-list.component.html',
  styleUrls: ['./income-list.component.scss']
})
export class IncomeListComponent implements OnInit {
  incomes: IncomeResponse[] = [];
  isLoading = false;
  showAddForm = false;
  incomeForm: FormGroup;
  editingId: number | null = null;

  displayedColumns: string[] = ['date', 'source', 'amount', 'description', 'actions'];
  incomeSources = Object.values(IncomeSource);

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.incomeForm = this.fb.group({
      source: [IncomeSource.SALARY, [Validators.required]],
      amount: ['', [Validators.required, Validators.min(0)]],
      date: [new Date().toISOString().split('T')[0], [Validators.required]],
      description: ['']
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadIncome();
    }
  }

  loadIncome() {
    const userId = this.authService.getCurrentUserID();
    if (!userId) return;

    this.isLoading = true;
    this.incomeService.getIncomeByUser(parseInt(userId)).subscribe({
      next: (incomes) => {
        this.incomes = incomes;
        this.isLoading = false;
      },
      error: (err) => {
        this.snackBar.open('Failed to load income', 'Close', { duration: 4000 });
        this.isLoading = false;
      }
    });
  }

  onAddIncome() {
    if (this.incomeForm.valid && !this.isLoading) {
      this.isLoading = true;

      const incomeData: IncomeRequest = this.incomeForm.value;

      if (this.editingId) {
        // Update existing income
        this.incomeService.updateIncome(this.editingId, incomeData).subscribe({
          next: () => {
            this.snackBar.open('Income updated successfully', 'OK', { duration: 3000 });
            this.loadIncome();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            this.snackBar.open('Failed to update income', 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      } else {
        // Create new income
        this.incomeService.addIncome(incomeData).subscribe({
          next: () => {
            this.snackBar.open('Income added successfully', 'OK', { duration: 3000 });
            this.loadIncome();
            this.resetForm();
            this.isLoading = false;
          },
          error: (err) => {
            const errorMsg = err.error?.message || 'Failed to add income';
            this.snackBar.open(errorMsg, 'Close', { duration: 4000 });
            this.isLoading = false;
          }
        });
      }
    }
  }

  editIncome(income: IncomeResponse) {
    this.editingId = income.id;
    this.incomeForm.patchValue({
      source: income.source,
      amount: income.amount,
      date: income.date,
      description: income.description
    });
    this.showAddForm = true;
  }

  deleteIncome(id: number) {
    if (confirm('Are you sure you want to delete this income?')) {
      this.incomeService.deleteIncome(id).subscribe({
        next: () => {
          this.snackBar.open('Income deleted successfully', 'OK', { duration: 3000 });
          this.loadIncome();
        },
        error: (err) => {
          this.snackBar.open('Failed to delete income', 'Close', { duration: 4000 });
        }
      });
    }
  }

  resetForm() {
    this.incomeForm.reset({
      source: IncomeSource.SALARY,
      date: new Date().toISOString().split('T')[0]
    });
    this.editingId = null;
    this.showAddForm = false;
  }
}
