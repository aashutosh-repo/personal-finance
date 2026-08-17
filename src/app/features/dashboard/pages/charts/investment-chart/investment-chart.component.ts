import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../../service/auth/auth.service';
import { TransactionService } from '../../../../../service/tansaction/transaction.service';
import { Transaction } from '../../../../../../model/transaction.model';

@Component({
  selector: 'app-investment-chart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './investment-chart.component.html',
  styleUrl: './investment-chart.component.scss'
})
export class InvestmentChartComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private authService = inject(AuthService);

  loading = false;
  hasError = false;
  hasData = false;

  totalPortfolioValue = 0;
  totalInvestedAmount = 0;
  currentGainLoss = 0;
  returnPercent = 0;

  distribution: Array<{ label: string; value: number; percent: number }> = [];

  ngOnInit(): void {
    const userId = this.authService.getCurrentUserID();
    if (!userId) {
      this.hasData = false;
      this.hasError = true;
      return;
    }

    this.loadInvestmentSummary(userId);
  }

  private loadInvestmentSummary(userId: string): void {
    this.loading = true;
    this.hasError = false;

    this.transactionService.getExpensesByUser(userId).subscribe({
      next: (transactions) => {
        const investmentTransactions = (transactions || []).filter((tx) => {
          const type = (tx.txnType || '').toUpperCase();
          const category = (tx.expenseCategory || '').toLowerCase();
          return type === 'DEBIT' && category === 'investment';
        });

        if (!investmentTransactions.length) {
          this.hasData = false;
          this.loading = false;
          return;
        }

        this.totalInvestedAmount = investmentTransactions.reduce(
          (sum, tx) => sum + Number(tx.txnAmount || 0),
          0
        );

        // The backend currently exposes investment transactions but not market-value or
        // holding-price data, so the portfolio value can only be based on the invested amount.
        this.totalPortfolioValue = this.totalInvestedAmount;
        this.currentGainLoss = 0;
        this.returnPercent = 0;

        const distributionMap = new Map<string, number>();
        investmentTransactions.forEach((tx) => {
          const label = tx.description || tx.expenseCategory || 'Investment';
          distributionMap.set(label, (distributionMap.get(label) || 0) + Number(tx.txnAmount || 0));
        });

        const total = [...distributionMap.values()].reduce((sum, value) => sum + value, 0) || 1;
        this.distribution = [...distributionMap.entries()]
          .map(([label, value]) => ({ label, value, percent: (value / total) * 100 }))
          .sort((a, b) => b.value - a.value);

        this.hasData = true;
        this.loading = false;
      },
      error: () => {
        this.hasError = true;
        this.loading = false;
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  formatSignedAmount(value: number): string {
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${this.formatCurrency(Math.abs(value))}`;
  }
}
