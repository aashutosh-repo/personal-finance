import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, OnChanges, OnInit, PLATFORM_ID, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../../../../../service/auth/auth.service';
import { TransactionService } from '../../../../../service/tansaction/transaction.service';

Chart.register(...registerables);

@Component({
  selector: 'app-expense-chart',
  standalone: true,
  imports: [BaseChartDirective, CommonModule, FormsModule],
  templateUrl: './expense-chart.component.html',
  styleUrls: ['./expense-chart.component.scss']
})
export class ExpenseChartComponent implements OnInit, OnChanges {
  @Input() months: string[] = [];
  @Input() income: number[] = [];
  @Input() expenses: number[] = [];
  @Input() periodLabel = '';

  isBrowser: boolean;
  hasData = false;

  chartConfig: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          font: { size: 11 }
        },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${Number(value).toLocaleString('en-IN')}`,
          font: { size: 11 }
        },
        grid: {
          color: 'rgba(15, 23, 42, 0.08)'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          padding: 16
        }
      },
      title: {
        display: true,
        text: 'Cash Flow Overview',
        font: { size: 13, weight: 600 },
        color: '#0f172a',
        padding: { top: 8, bottom: 12 }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const value = Number(context.parsed.y || 0);
            return `${context.dataset.label}: ${this.formatCurrency(value)}`;
          }
        }
      }
    }
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private txService: TransactionService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.buildChartData();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const userId = this.authService.getCurrentUserID();
    if (userId) {
      this.txService.calculateTotals(userId).subscribe(() => {
        this.buildChartData();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['months'] || changes['income'] || changes['expenses']) {
      this.buildChartData();
    }
  }

  private buildChartData(): void {
    if (!this.isBrowser) {
      return;
    }

    const safeMonths = Array.isArray(this.months) ? this.months : [];
    const safeIncome = Array.isArray(this.income) ? this.income.map(v => Number(v || 0)) : [];
    const safeExpenses = Array.isArray(this.expenses) ? this.expenses.map(v => Number(v || 0)) : [];

    const length = Math.max(safeMonths.length, safeIncome.length, safeExpenses.length);
    const entries = Array.from({ length }, (_, index) => {
      const month = safeMonths[index] ?? `Period ${index + 1}`;
      const incomeValue = Number(safeIncome[index] || 0);
      const expenseValue = Number(safeExpenses[index] || 0);
      const hasData = incomeValue > 0 || expenseValue > 0;

      return {
        month,
        incomeValue,
        expenseValue,
        hasData
      };
    }).filter(entry => entry.hasData || length <= 1);

    if (!entries.length) {
      this.chartConfig = { labels: [], datasets: [] };
      this.hasData = false;
      return;
    }

    this.hasData = true;

    const labels = entries.map(entry => entry.month);
    const incomeValues = entries.map(entry => entry.incomeValue);
    const expenseValues = entries.map(entry => entry.expenseValue);
    const savingsValues = entries.map((entry) => entry.incomeValue - entry.expenseValue);

    this.chartConfig = {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomeValues,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Expense',
          data: expenseValues,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1,
          borderRadius: 6
        },
        {
          label: 'Net Savings',
          data: savingsValues,
          backgroundColor: 'rgba(37, 99, 235, 0.8)',
          borderColor: 'rgba(37, 99, 235, 1)',
          borderWidth: 1,
          borderRadius: 6
        }
      ]
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }
}
