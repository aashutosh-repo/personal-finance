import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AnalyticsService } from '../../../../service/analytics/analytics.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { ExpenseChartComponent } from '../charts/expense-chart/expense-chart.component';
import { DebtChartComponent } from '../charts/debt-chart/debt-chart.component';

Chart.register(...registerables);

@Component({
  selector: 'app-monthly-overview',
  standalone: true,
  imports: [CommonModule, ExpenseChartComponent, DebtChartComponent, BaseChartDirective],
  templateUrl: './monthly-overview.page.html',
  styleUrls: ['./monthly-overview.page.scss']
})
export class MonthlyOverviewPage implements OnInit {
  private analytics = inject(AnalyticsService);
  private auth = inject(AuthService);

  monthLabel = '';
  incomeData: number[] = [];
  expenseData: number[] = [];
  categories: { label: string; value: number }[] = [];
  budgetStatuses: any[] = [];

  budgetChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  budgetChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: {
        display: true,
        text: 'Budget vs Expense by Category',
        font: { size: 13 }
      }
    },
    scales: {
      x: {
        stacked: false,
        ticks: { maxRotation: 0, minRotation: 0 }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`
        }
      }
    }
  };

  ngOnInit(): void {
    const userId = this.auth.getCurrentUserID();
    if (!userId) return;

    this.analytics.getMonthlyContext(userId).subscribe(ctx => {
      const ym = ctx.month || new Date().toISOString().slice(0, 7);
      try {
        const parts = ym.split('-');
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        this.monthLabel = new Date(year, month - 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
      } catch (e) {
        this.monthLabel = ctx.month;
      }

      this.incomeData = [Number(ctx.totalIncome) || 0];
      this.expenseData = [Number(ctx.totalExpense) || 0];

      this.categories = (ctx.categoryExpenses || []).map(c => ({ label: c.category, value: Number(c.amount || 0) }));
      this.budgetStatuses = ctx.budgetStatuses || [];
      this.buildBudgetChart();
    });
  }

  private buildBudgetChart(): void {
    if (!this.budgetStatuses || this.budgetStatuses.length === 0) {
      this.budgetChartData = {
        labels: ['No data'],
        datasets: [
          { label: 'Budget', data: [0], backgroundColor: 'rgba(54, 162, 235, 0.7)' },
          { label: 'Expense', data: [0], backgroundColor: 'rgba(255, 99, 132, 0.7)' }
        ]
      };
      return;
    }

    const labels = this.budgetStatuses.map(item => item.category || 'Category');
    const budgetValues = this.budgetStatuses.map(item => Number(item.budget || 0));
    const actualValues = this.budgetStatuses.map(item => Number(item.actual || 0));

    this.budgetChartData = {
      labels,
      datasets: [
        {
          label: 'Budget',
          data: budgetValues,
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderRadius: 6
        },
        {
          label: 'Expense',
          data: actualValues,
          backgroundColor: 'rgba(255, 99, 132, 0.7)',
          borderRadius: 6
        }
      ]
    };
  }
}
