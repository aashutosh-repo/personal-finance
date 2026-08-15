import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../../service/analytics/analytics.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { ExpenseChartComponent } from '../charts/expense-chart/expense-chart.component';
import { DebtChartComponent } from '../charts/debt-chart/debt-chart.component';

@Component({
  selector: 'app-monthly-overview',
  standalone: true,
  imports: [CommonModule, ExpenseChartComponent, DebtChartComponent],
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

  ngOnInit(): void {
    const userId = this.auth.getCurrentUserID();
    if (!userId) return;

    // fetch current month analytics
    this.analytics.getMonthlyContext(userId).subscribe(ctx => {
      const ym = ctx.month || new Date().toISOString().slice(0,7);
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
    });
  }
}
