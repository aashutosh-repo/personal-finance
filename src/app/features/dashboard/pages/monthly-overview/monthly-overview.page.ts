import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, Chart, registerables, Colors } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsService, BudgetStatus } from '../../../../service/analytics/analytics.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { ExpenseChartComponent } from '../charts/expense-chart/expense-chart.component';
import { DebtChartComponent } from '../charts/debt-chart/debt-chart.component';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { Transaction } from '../../../../../model/transaction.model';
import { Console } from 'console';

Chart.register(...registerables);

interface CategoryBreakdownItem {
  label: string;
  value: number;
  percentage: number;
}

@Component({
  selector: 'app-monthly-overview',
  standalone: true,
  imports: [CommonModule, ExpenseChartComponent, DebtChartComponent, BaseChartDirective, MatIconModule, MatButtonModule],
  templateUrl: './monthly-overview.page.html',
  styleUrls: ['./monthly-overview.page.scss']
})
export class MonthlyOverviewPage implements OnInit, OnDestroy {
  
  private analytics = inject(AnalyticsService);
  private auth = inject(AuthService);
  private transactionService = inject(TransactionService);

  monthLabel = '';
  selectedMonthKey = '';
  totalIncome = 0;
  totalExpense = 0;
  netSavings = 0;
  totalDebt = 0;
  savingsRate = 0;
  financialHealthScore = 0;
  financialHealthStatus = 'Needs Attention';
  incomeData: number[] = [];
  expenseData: number[] = [];
  categories: CategoryBreakdownItem[] = [];
  budgetStatuses: BudgetStatus[] = [];
  loadError = false;
  isLoading = true;
  debtBreakdown: Array<{ label: string; value: number }> = [];
  insightMessages: string[] = [];
  financialHealthFactors: string[] = [];
  private transactionSyncSubscription?: Subscription;

  budgetChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  budgetChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${this.formatCurrency(Number(context.parsed.y || 0))}`
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        ticks: { maxRotation: 0, minRotation: 0, font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${Number(value).toLocaleString('en-IN')}`
        },
        grid: { color: 'rgba(15, 23, 42, 0.08)' }
      }
    }
  };

  ngOnInit(): void {
    this.transactionSyncSubscription = this.transactionService.transactionChange$.subscribe(() => {
      this.loadMonthlyOverview();
    })
    this.loadMonthlyOverview();
  }

  ngOnDestroy(): void {
    this.transactionSyncSubscription?.unsubscribe();
  }


  changeMonth(offset: number): void {
    const current = this.selectedMonthKey || this.getCurrentMonthKey();
    const [year, month] = current.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    this.selectedMonthKey = this.formatMonthKey(date);
    this.loadMonthlyOverview();
  }

  loadMonthlyOverview(): void {
    const userId = this.auth.getCurrentUserID();
    if (!userId) {
      this.isLoading = false;
      this.loadError = true;
      return;
    }

    this.isLoading = true;
    this.loadError = false;

    this.transactionService.calculateTotals(userId).subscribe({
      next: (totals) => {
        this.totalDebt = Number(totals.totalDebt || 0);
      },
      error: () => {
        this.totalDebt = 0;
      }
    });

    const targetMonth = this.selectedMonthKey || this.getCurrentMonthKey();
    this.selectedMonthKey = targetMonth;

    forkJoin({
      context: this.analytics.getMonthlyContext(userId, targetMonth).pipe(catchError(() => of(null))),
      transactions: this.transactionService.getExpensesByUser(userId).pipe(catchError(() => of([])))
    }).subscribe ({
      next: ({ context: ctx, transactions }) => {
          const transactionSnapShot = this.buildMonthlyTransactionSnapShot(transactions, targetMonth);
          if(!ctx && transactionSnapShot.count == 0) {
            this.loadError = true;
            this.isLoading= false;
            return;
          }

        const monthValue = ctx?.month || targetMonth;
        this.monthLabel = this.formatMonthLabel(monthValue);
        this.selectedMonthKey = monthValue;

        this.totalIncome = transactionSnapShot.count > 0 ? transactionSnapShot.totalIncome : Number(ctx?.totalIncome || 0);
        this.totalExpense = transactionSnapShot.count > 0 ? transactionSnapShot.totalExpense : Number(ctx?.totalExpense || 0);
        this.netSavings = this.totalIncome - this.totalExpense;
        this.savingsRate = this.calculateSavingsRate(this.totalIncome, this.netSavings);

        this.incomeData = [this.totalIncome];
        this.expenseData = [this.totalExpense];

        const rawCategories = (transactionSnapShot.categories.length ? transactionSnapShot.categories : (ctx?.categoryExpenses || [])).map((item) => ({
          label: item.category || 'Other',
          value: Number(item.amount || 0)
        }));

        const totalCategoryValue = rawCategories.reduce((sum, item) => sum + item.value, 0);
        this.categories = rawCategories
          .map((item) => ({
            label: item.label,
            value: item.value,
            percentage: totalCategoryValue > 0 ? (item.value / totalCategoryValue) * 100 : 0
          }))
          .sort((a, b) => b.value - a.value);

        this.budgetStatuses = (ctx?.budgetStatuses || []).map((item) => ({
          category: item.category || 'Budget',
          budget: Number(item.budget || 0),
          actual: Number(item.actual || 0),
          exceeded: Boolean(item.exceeded)
        }));

        this.debtBreakdown = [
          { label: 'Bank Loan', value: this.totalDebt * 0.5 },
          { label: 'Salary Advance', value: this.totalDebt * 0.25 },
          { label: 'Personal Debt', value: Math.max(this.totalDebt - (this.totalDebt * 0.75), 0) }
        ].filter((item) => item.value > 0);

        this.buildBudgetChart();
        this.calculateHealthMetrics();
        this.buildInsights();
        this.isLoading = false;
      },
      error: () => {
        this.loadError = true;
        this.isLoading = false;
      }
    });
  }

  buildMonthlyTransactionSnapShot(transactions: Transaction[], monthKey: string): {
    count: number,
    totalIncome: number,
    totalExpense: number,
    totalDebt: number,
    categories: Array<{category: string; amount: number}>;
  } {
    const categoryTotals = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;
    let totalDebt = 0;
    let count= 0;
    console.log(transactions);
    (transactions || [])
    .filter((tx) => (tx.dateOfExpense || '').startsWith(monthKey))
    .forEach(element => {
      count++;
      const amount = Number(element.txnAmount) || 0;
      const txnType = (element.txnType ?? '').toUpperCase();
      const category = element.expenseCategory || 'OTHER';
      const isIncome = (element.txnType || '').toUpperCase() == 'CREDIT'
      
      if(isIncome) {
        totalIncome += amount;
        return;
      }

      totalExpense += amount;
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);

      if(category.toLowerCase() === 'DEBIT') {
        totalDebt += amount;
      }
    });

    return {
      count, totalIncome, totalExpense, totalDebt, categories: [...categoryTotals.entries()].map(([category, amount]) => ({category, amount}))
    };
  }

  retryLoad(): void {
    this.loadMonthlyOverview();
  }

  get totalBudgeted(): number {
    return this.budgetStatuses.reduce((sum, item) => sum + Number(item.budget || 0), 0);
  }

  get totalSpentAgainstBudget(): number {
    return this.budgetStatuses.reduce((sum, item) => sum + Number(item.actual || 0), 0);
  }

  get remainingBudget(): number {
    return this.totalBudgeted - this.totalSpentAgainstBudget;
  }

  getBudgetState(item: BudgetStatus): string {
    const percentage = this.getBudgetUsage(item);
    if (percentage > 100) return 'Exceeded';
    if (percentage >= 90) return 'Near Limit';
    if (percentage >= 70) return 'Approaching Limit';
    return 'Healthy';
  }

  getBudgetUsage(item: BudgetStatus): number {
    const budget = Number(item.budget || 0);
    const actual = Number(item.actual || 0);
    if (!budget || budget <= 0) return 0;
    const percent = (actual / budget) * 100;
    return Number.isFinite(percent) ? percent : 0;
  }

  getBudgetRemaining(item: BudgetStatus): number {
    const budget = Number(item.budget || 0);
    const actual = Number(item.actual || 0);
    return budget - actual;
  }

  getBudgetHealthClass(item: BudgetStatus): string {
    const state = this.getBudgetState(item);
    return state.toLowerCase().replace(/\s+/g, '-');
  }

  getCategoryProgressStyle(value: number, total: number): string {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return `${Math.min(percentage, 100)}%`;
  }

  getExpenseDeltaPercent(): number {
    return Math.max(0, 100 - this.savingsRate);
  }

  getBudgetUsagePercent(item: BudgetStatus): number {
    return Math.min(this.getBudgetUsage(item), 100);
  }

  getBudgetRemainingAbsolute(item: BudgetStatus): number {
    return Math.abs(this.getBudgetRemaining(item));
  }

  getDonutBackground(): string {
    if (!this.categories.length) {
      return 'conic-gradient(#e2e8f0 0 100%)';
    }

    const first = this.categories[0];
    const second = this.categories[1] ?? { percentage: 0 };
    const firstPercent = Number(first.percentage || 0);
    const secondPercent = Number(second.percentage || 0);
    const split = Math.min(firstPercent + secondPercent, 100);

    return `conic-gradient(#2563eb 0 ${firstPercent}%, #60a5fa ${firstPercent}% ${split}%, #f59e0b ${split}% 100%)`;
  }

  private buildBudgetChart(): void {
    if (!this.budgetStatuses || this.budgetStatuses.length === 0) {
      this.budgetChartData = {
        labels: ['No data'],
        datasets: [
          { label: 'Budget', data: [0], backgroundColor: 'rgba(37, 99, 235, 0.75)' },
          { label: 'Expense', data: [0], backgroundColor: 'rgba(239, 68, 68, 0.75)' }
        ]
      };
      return;
    }

    const labels = this.budgetStatuses.map((item) => item.category || 'Category');
    const budgetValues = this.budgetStatuses.map((item) => Number(item.budget || 0));
    const actualValues = this.budgetStatuses.map((item) => Number(item.actual || 0));

    this.budgetChartData = {
      labels,
      datasets: [
        {
          label: 'Budget',
          data: budgetValues,
          backgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: 'Expense',
          data: actualValues,
          backgroundColor: 'rgba(239, 68, 68, 0.78)',
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    };
  }

  private calculateHealthMetrics(): void {
    const safetyBase = this.totalIncome > 0 ? this.calculateSavingsRate(this.totalIncome, this.netSavings) : 0;
    const budgetAvg = this.budgetStatuses.length
      ? this.budgetStatuses.reduce((sum, item) => sum + this.getBudgetUsage(item), 0) / this.budgetStatuses.length
      : 0;
    const debtRatio = this.totalIncome > 0 ? this.totalDebt / this.totalIncome : 0;

    const rawScore = Math.max(0, 100 - budgetAvg * 0.7 - debtRatio * 100 + safetyBase * 0.7);
    this.financialHealthScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    if (this.financialHealthScore >= 75) {
      this.financialHealthStatus = 'Excellent';
    } else if (this.financialHealthScore >= 55) {
      this.financialHealthStatus = 'Good';
    } else if (this.financialHealthScore >= 35) {
      this.financialHealthStatus = 'Needs Attention';
    } else {
      this.financialHealthStatus = 'Critical';
    }

    this.financialHealthFactors = [];
    if (this.savingsRate >= 15) this.financialHealthFactors.push('Savings rate is healthy');
    else this.financialHealthFactors.push('Savings rate needs attention');

    if (this.budgetStatuses.length === 0) this.financialHealthFactors.push('No budget data available');
    else if (budgetAvg <= 75) this.financialHealthFactors.push('Most budgets are within limits');
    else this.financialHealthFactors.push('Budget usage is elevated');

    if (this.totalDebt > 0) this.financialHealthFactors.push('Debt remains significant');
    else this.financialHealthFactors.push('No outstanding debt');
  }

  private buildInsights(): void {
    const insights: string[] = [];

    if (this.totalIncome > 0 && this.totalExpense > 0) {
      const savingsPct = this.savingsRate;
      if (savingsPct >= 15) {
        insights.push(`Strong Savings — You saved ${this.formatPercent(savingsPct)} of your income this month.`);
      } else if (savingsPct > 0) {
        insights.push(`Savings Pace — You saved ${this.formatPercent(savingsPct)} of your income this month.`);
      }
    }

    if (this.categories.length > 0) {
      const highest = this.categories[0];
      insights.push(`${highest.label} is your highest spending category this month.`);
    }

    this.budgetStatuses.forEach((budget) => {
      const usage = this.getBudgetUsage(budget);
      const remaining = this.getBudgetRemaining(budget);
      const label = budget.category || 'This budget';

      if (usage > 100) {
        insights.push(`${label} has exceeded its limit by ${this.formatCurrency(Math.abs(remaining))}.`);
      } else if (usage >= 90) {
        insights.push(`${label} is almost fully used.`);
      } else if (usage >= 70) {
        insights.push(`${label} is approaching its limit.`);
      } else if (usage > 0) {
        insights.push(`${label} is on track with ${this.formatCurrency(Math.max(remaining, 0))} remaining.`);
      }
    });

    if (this.totalDebt > 0) {
      insights.push(`Debt Alert — Your outstanding debt is ${this.formatCurrency(this.totalDebt)}.`);
    }

    this.insightMessages = insights.slice(0, 4);
  }

  private calculateSavingsRate(income: number, netSavings: number): number {
    if (!income || income <= 0) return 0;
    const rate = (netSavings / income) * 100;
    return Number.isFinite(rate) ? rate : 0;
  }

  private getCurrentMonthKey(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private formatMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private formatMonthLabel(monthValue: string): string {
    const [year, month] = monthValue.split('-').map(Number);
    if (!year || !month) return monthValue;
    return new Date(year, month - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }

  public formatCurrency(value: number | null | undefined): string {
    const safeValue = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(safeValue);
  }

  public formatPercent(value: number | null | undefined): string {
    const safe = Number(value || 0);
    return `${safe.toFixed(0)}%`;
  }
}
