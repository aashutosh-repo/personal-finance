import { Component, inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ExpenseChartComponent } from '../../pages/charts/expense-chart/expense-chart.component';
import { InvestmentChartComponent } from '../../pages/charts/investment-chart/investment-chart.component';
import { DebtChartComponent } from '../../pages/charts/debt-chart/debt-chart.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AnalyticsService } from '../../../../service/analytics/analytics.service';
import { AuthService } from '../../../../service/auth/auth.service';
import { TransactionService } from '../../../../service/tansaction/transaction.service';
import { BudgetService } from '../../../../service/tansaction/budget.service';
import { ChatbotService } from '../../../../service/tansaction/chatbot.service';
import { Transaction } from '../../../../../model/transaction.model';
import { BudgetResponse } from '../../../../../model/budget.model';
import { Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of, Subscription } from 'rxjs';
import { fork } from 'child_process';

interface KpiTrend {
  value: number;
  label: string;
  direction: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ExpenseChartComponent, InvestmentChartComponent,
    DebtChartComponent, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private iconRegistry = inject(MatIconRegistry);
  private sanitizer = inject(DomSanitizer);
  private platformId = inject(PLATFORM_ID);
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private chatbotService = inject(ChatbotService);
  private router = inject(Router);

  private currentUserId: string | null = null;
  private transactionSyncSubscription?: Subscription;

  isLoading = true;
  hasError = false;
  currentPeriodLabel = 'This month';

  totalIncome = 0;
  totalExpense = 0;
  totalDebt = 0;
  totalInvestment = 0;
  netBalance = 0;
  savingsRate = 0;

  financialHealthScore = 0;
  financialHealthStatus = 'Insufficient data';
  financialHealthTone: 'healthy' | 'warning' | 'danger' | 'neutral' = 'neutral';
  financialHealthReasons: Array<{ text: string; tone: 'positive' | 'warning' | 'danger' }> = [];
  financialHealthRecommendations: string[] = [];

  aiInsight = 'Your finances are being analyzed.';
  aiInsightLoading = false;
  aiInsightError = false;
  aiInsightPrompt = '';

  incomeTrend: KpiTrend = { value: 0, label: 'No prior month data', direction: 'neutral' };
  expenseTrend: KpiTrend = { value: 0, label: 'No prior month data', direction: 'neutral' };
  balanceTrend: KpiTrend = { value: 0, label: 'No prior month data', direction: 'neutral' };
  savingsTrend: KpiTrend = { value: 0, label: 'No prior month data', direction: 'neutral' };

  quickActions: Array<{ label: string; icon: string; route: string; tone: string }> = [
    { label: 'Add Transaction', icon: '➕', route: '/v1/transactions', tone: 'primary' },
    { label: 'Add Income', icon: '💰', route: '/v1/income', tone: 'success' },
    { label: 'Add Expense', icon: '🧾', route: '/v1/transactions', tone: 'warning' },
    { label: 'Add Investment', icon: '📈', route: '/v1/investments', tone: 'info' },
    { label: 'Add Debt', icon: '💳', route: '/v1/debts', tone: 'danger' }
  ];

  recentTransactions: Array<{
    id?: number;
    icon: string;
    title: string;
    category: string;
    dateLabel: string;
    amount: number;
    isIncome: boolean;
    sortDate: number;
  }> = [];
  recentTransactionsLoading = false;
  recentTransactionsError = false;

  budgetOverviewItems: Array<{
    label: string;
    spentAmount: number;
    budgetAmount: number;
    percentage: number;
    status: 'healthy' | 'high' | 'over';
  }> = [];
  budgetOverviewLoading = false;
  budgetOverviewError = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.iconRegistry.addSvgIcon(
        'user-icon',
        this.sanitizer.bypassSecurityTrustResourceUrl('assets/icons/user-icon.svg')
      );
    }
  }

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserID();
    if (!this.currentUserId) {
      this.isLoading = false;
      this.hasError = true;
      return;
    }

    this.transactionSyncSubscription = this.transactionService.transactionChange$.subscribe(() => {
      if (!this.currentUserId) {
        return;
      }
      this.loadDashboardData(this.currentUserId);
      this.loadRecentTransactions(this.currentUserId);
      this.loadBudgetOverview(this.currentUserId);
    });

    this.retryDashboardData();
  }

  ngOnDestroy(): void {
    this.transactionSyncSubscription?.unsubscribe();
  }
  retryDashboardData(): void {
    if (!this.currentUserId) {
      this.isLoading = false;
      this.hasError = true;
      return;
    }

    this.hasError = false;
    this.isLoading = true;
    this.loadDashboardData(this.currentUserId);
    this.loadRecentTransactions(this.currentUserId);
    this.loadBudgetOverview(this.currentUserId);
  }

  retryRecentTransactions(): void {
    if (!this.currentUserId) return;
    this.recentTransactionsError = false;
    this.loadRecentTransactions(this.currentUserId);
  }

  retryBudgetOverview(): void {
    if (!this.currentUserId) return;
    this.budgetOverviewError = false;
    this.loadBudgetOverview(this.currentUserId);
  }

  retryAiInsight(): void {
    if (!this.currentUserId) return;
    this.aiInsightError = false;
    this.generateAiInsight(this.currentUserId);
  }

  openChatbot(): void {
    const prompt = this.aiInsightPrompt || this.aiInsight;
    this.router.navigate(['/v1/chatbot'], {
      queryParams: {
        prompt: prompt
      }
    });
  }

  private loadRecentTransactions(userId: string): void {
    this.recentTransactionsLoading = true;
    this.recentTransactionsError = false;

    this.transactionService.getExpensesByUser(userId).subscribe({
      next: (transactions) => {
        console.log('Recent Transaction',transactions)
        this.recentTransactions = (transactions || [])
          .map((txn) => this.toRecentTransactionView(txn))
          .filter((txn) => txn && !!txn.title)
          .sort((a, b) => b.sortDate - a.sortDate)
          .slice(0, 5);

        this.recentTransactionsLoading = false;
      },
      error: () => {
        this.recentTransactionsError = true;
        this.recentTransactionsLoading = false;
      }
    });
  }

  private toRecentTransactionView(txn: Transaction): {
    id?: number;
    icon: string;
    title: string;
    category: string;
    dateLabel: string;
    amount: number;
    isIncome: boolean;
    sortDate: number;
  } {
    const dateValue = txn.dateOfExpense ? new Date(txn.dateOfExpense) : new Date();
    const isIncome = (txn.txnType || '').toUpperCase() === 'CREDIT';
    const amount = Number(txn.txnAmount || 0);
    const normalizedAmount = isIncome ? Math.abs(amount) : -Math.abs(amount);
    const category = txn.expenseCategory || 'General';

    return {
      id: txn.id,
      icon: this.getCategoryIcon(category),
      title: txn.description || category,
      category,
      dateLabel: this.formatRecentDate(dateValue),
      amount: normalizedAmount,
      isIncome,
      sortDate: dateValue.getTime()
    };
  }

  private getCategoryIcon(category: string): string {
    const normalized = category.toLowerCase();
    const iconMap: Record<string, string> = {
      food: '🍔',
      grocery: '🛒',
      shopping: '🛍️',
      travel: '✈️',
      salary: '💰',
      business: '📈',
      investment: '📊',
      education: '📚',
      utility: '💡',
      rent: '🏠',
      healthcare: '🏥',
      entertainment: '🎉',
      debt: '💳',
      default: '🧾'
    };

    return iconMap[normalized] || iconMap['default'];
  }

  private formatRecentDate(date: Date): string {
    const today = new Date();
    const isSameDay = date.toDateString() === today.toDateString();

    if (isSameDay) {
      return 'Today';
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  private getDateValue(dateLabel: string): number {
    const parsed = new Date(dateLabel);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }

  private loadBudgetOverview(userId: string): void {
    this.budgetOverviewLoading = true;
    this.budgetOverviewError = false;

    forkJoin({
      budgets: this.budgetService.getBudgetsByUser(userId),
      transactions: this.transactionService.getExpensesByUser(userId)
    }).subscribe({
      next: ({ budgets, transactions }) => {
        const expenseTransactions = (transactions || []).filter(
          (tx) => (tx.txnType || '').toUpperCase() === 'DEBIT'
        );

        const spentByCategory = new Map<string, number>();
        expenseTransactions.forEach((tx) => {
          const categoryName = (tx.expenseCategory || 'Other').trim();
          if (!categoryName) return;
          const amount = Number(tx.txnAmount || 0);
          spentByCategory.set(categoryName, (spentByCategory.get(categoryName) || 0) + amount);
        });

        this.budgetOverviewItems = (budgets || [])
          .map((budget): typeof this.budgetOverviewItems[number] | null => {
            const budgetAmount = Number(budget.amount) || 0;
            if (budgetAmount <= 0) return null;

            const spentAmount = this.calculateBudgetSpent(budget, spentByCategory);
            const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
            const status: 'healthy' | 'high' | 'over' = percentage >= 100 ? 'over' : percentage >= 80 ? 'high' : 'healthy';

            return {
              label: budget.categoryName || budget.name || 'Budget',
              spentAmount,
              budgetAmount,
              percentage,
              status
            };
          })
          .filter((item): item is NonNullable<typeof item> => !!item)
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);

        this.budgetOverviewLoading = false;
      },
      error: () => {
        this.budgetOverviewError = true;
        this.budgetOverviewLoading = false;
      }
    });
  }

  private calculateBudgetSpent(budget: BudgetResponse, spentByCategory: Map<string, number>): number {
    const budgetCategory = this.normalizeCategory(budget.categoryName || budget.name || 'General');
    let totalSpent = 0;

    spentByCategory.forEach((amount, categoryName) => {
      const normalizedCategory = this.normalizeCategory(categoryName);
      if (
        normalizedCategory === budgetCategory ||
        normalizedCategory.includes(budgetCategory) ||
        budgetCategory.includes(normalizedCategory)
      ) {
        totalSpent += amount;
      }
    });

    return totalSpent;
  }

  private normalizeCategory(value: string): string {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private loadDashboardData(userId: string): void {
    const currentMonth = this.getCurrentMonthKey();
    const previousMonth = this.getPreviousMonthKey(currentMonth);

    this.transactionService.calculateTotals(userId).subscribe({
      next: (totals) => {
        this.totalDebt = Number(totals.totalDebt || 0);
        this.totalInvestment = Number(totals.totalInvestment || 0);
        this.calculateFinancialHealth();
        this.generateAiInsight(userId);
      },
      error: () => {
        this.totalDebt = 0;
        this.totalInvestment = 0;
        this.generateAiInsight(userId);
      }
    });

    forkJoin({
      context: this.analyticsService.getMonthlyContext(userId, currentMonth).pipe(catchError(() => of(null))),
      previousContext: this.analyticsService.getMonthlyContext(userId, previousMonth).pipe(catchError(() => of(null))),
      transactions : this.transactionService.getExpensesByUser(userId).pipe(catchError(() => of([] as Transaction[])))
    }).subscribe({
      next: ({ context, previousContext, transactions }) => {
        console.log('Dashboard transactions:', transactions);

        const currentSnapshot = this.buildMonthlySnapshot(transactions, currentMonth);
        const previousSnapshot = this.buildMonthlySnapshot(transactions, previousMonth);

      console.log('Current month:', currentMonth);
      console.log('Current snapshot:', currentSnapshot);

        if (!context && currentSnapshot.count == 0) {
          this.hasError = true;
          this.isLoading = false;
          return;
        }
        this.totalIncome = currentSnapshot.count > 0 ? currentSnapshot.totalIncome : Number(context?.totalIncome || 0);
        this.totalExpense = currentSnapshot.count > 0 ? currentSnapshot.totalExpense : Number(context?.totalExpense || 0);
        this.netBalance = this.totalIncome - this.totalExpense;
        this.savingsRate = this.calculateSavingsRate(this.totalIncome, this.netBalance);
        this.currentPeriodLabel = this.formatMonthLabel(currentMonth);
        this.calculateFinancialHealth();
        this.generateAiInsight(userId);

        const previousIncome = previousSnapshot.count > 0 ? previousSnapshot.totalIncome : Number(previousContext?.totalIncome || 0);
        const previousExpense = previousSnapshot.count > 0 ? previousSnapshot.totalExpense : Number(previousContext?.totalExpense || 0);
        const previousNet = previousIncome - previousExpense;
        const previousSavingsRate = this.calculateSavingsRate(previousIncome, previousNet);

        this.incomeTrend = this.buildTrend(this.totalIncome, previousIncome, 'income');
        this.expenseTrend = this.buildTrend(this.totalExpense, previousExpense, 'expense');
        this.balanceTrend = this.buildTrend(this.netBalance, previousNet, 'balance');
        this.savingsTrend = this.buildTrend(this.savingsRate, previousSavingsRate, 'savings');
        this.isLoading = false;
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
      }
    });
  }

  buildMonthlySnapshot(transaction: Transaction[], monthKey: string): {

    count: number;
    totalIncome: number;
    totalExpense: number;
  } {
    let count = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    (transaction || [])
      .filter((txn) => (txn.dateOfExpense || '' ).startsWith(monthKey))
      .forEach((txn) => {
        count++;
        const amount = Number(txn.txnAmount || 0);
        const isIncome = (txn.txnType || '').toUpperCase() === 'CREDIT';
        if (isIncome) {
          totalIncome += amount;
        } else {
          totalExpense += amount;
        }
      });
    return { count, totalIncome, totalExpense };
  }

  private generateAiInsight(userId: string): void {
    const budgetUsage = this.budgetOverviewItems.length
      ? this.budgetOverviewItems.reduce((sum, item) => sum + item.percentage, 0) / this.budgetOverviewItems.length
      : 0;
    const topCategory = this.recentTransactions.length
      ? this.recentTransactions
          .slice()
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0]?.category || 'general spending'
      : 'general spending';

    const prompt = [
      'Based on my actual financial data only, give me a short insight in 1-3 sentences.',
      `Income: ${this.formatCurrency(this.totalIncome)}, Expenses: ${this.formatCurrency(this.totalExpense)}, Net balance: ${this.formatCurrency(this.netBalance)}, Savings rate: ${this.savingsRate.toFixed(1)}%,`,
      `Budget usage: ${budgetUsage.toFixed(0)}%, Debt: ${this.formatCurrency(this.totalDebt)}, Investment: ${this.formatCurrency(this.totalInvestment)}, Highest recent activity: ${topCategory}.`,
      'Keep it actionable and concise. Do not mention internal APIs, system details, or invented numbers.'
    ].join(' ');

    this.aiInsightPrompt = prompt;
    this.aiInsightLoading = true;
    this.aiInsightError = false;

    this.chatbotService.sendMessage({ userId, message: prompt }).subscribe({
      next: (response) => {
        const answer = response?.data?.response?.trim();
        this.aiInsight = answer && answer.length > 0 ? this.cleanInsight(answer) : this.buildFallbackInsight();
        this.aiInsightLoading = false;
      },
      error: () => {
        this.aiInsight = this.buildFallbackInsight();
        this.aiInsightError = true;
        this.aiInsightLoading = false;
      }
    });
  }

  private cleanInsight(value: string): string {
    return value
      .replace(/\s+/g, ' ')
      .replace(/\*\*|\*|_|`/g, '')
      .trim();
  }

  private buildFallbackInsight(): string {
    const monthlyVariance = this.totalIncome > 0 ? ((this.totalExpense / this.totalIncome) * 100) : 0;

    if (this.totalIncome > 0 && this.totalExpense > this.totalIncome) {
      const excessAmount = this.totalExpense - this.totalIncome;
      return `Your spending is ${monthlyVariance.toFixed(0)}% of income, which is above your monthly cash inflow. Consider reducing discretionary spending by about ${this.formatCurrency(excessAmount / 2)} next month.`;
    }

    if (this.savingsRate >= 15) {
      return `Your savings rate is ${this.savingsRate.toFixed(1)}%, which is a healthy buffer. Keep your spending discipline and continue directing surplus cash into investments or debt reduction.`;
    }

    if (this.totalExpense > 0 && this.totalIncome > 0) {
      const reductionTarget = Math.max((this.totalExpense - this.totalIncome) * 0.25, 0);
      return `Your current cash flow is stable but still leaves room to improve. Consider reducing spending by about ${this.formatCurrency(reductionTarget)} to build a stronger cushion.`;
    }

    return 'Your financial picture is still developing. Add a few more transactions and budgets so the dashboard can suggest a more precise monthly action.';
  }

  private calculateFinancialHealth(): void {
    const hasIncome = this.totalIncome > 0;
    const hasExpense = this.totalExpense > 0;
    const hasBudgetData = this.budgetOverviewItems.length > 0;
    const hasDebtData = this.totalDebt > 0;
    const hasInvestmentData = this.totalInvestment > 0;

    if (!hasIncome && !hasExpense && !hasBudgetData && !hasDebtData && !hasInvestmentData) {
      this.financialHealthScore = 0;
      this.financialHealthStatus = 'Insufficient data';
      this.financialHealthTone = 'neutral';
      this.financialHealthReasons = [{ text: 'Add income or expense activity to generate a score.', tone: 'warning' }];
      this.financialHealthRecommendations = [
        'Record your monthly income and expenses to unlock the score.',
        'Set a monthly budget to improve the score.'
      ];
      return;
    }

    const savingsScore = hasIncome ? this.clamp(50 + this.savingsRate * 0.75, 0, 100) : 50;
    const expenseScore = hasIncome ? this.clamp(100 - (this.totalExpense / this.totalIncome) * 100, 0, 100) : 50;

    let budgetScore = 50;
    if (hasBudgetData) {
      const averageBudgetUsage = this.budgetOverviewItems.reduce((sum, item) => sum + item.percentage, 0) / this.budgetOverviewItems.length;
      budgetScore = this.clamp(100 - averageBudgetUsage, 0, 100);
    }

    let debtScore = 50;
    if (hasDebtData && this.totalIncome > 0) {
      const debtRatio = this.totalDebt / this.totalIncome;
      debtScore = this.clamp(100 - (debtRatio * 100), 0, 100);
    }

    let investmentScore = 50;
    if (hasInvestmentData && this.totalIncome > 0) {
      const investmentRatio = this.totalInvestment / this.totalIncome;
      investmentScore = this.clamp(50 + (investmentRatio * 50), 0, 100);
    }

    const factorScores = [
      savingsScore,
      expenseScore,
      budgetScore,
      debtScore,
      investmentScore
    ];

    const score = factorScores.reduce((total, value) => total + value, 0) / factorScores.length;
    this.financialHealthScore = Math.round(score);

    if (this.financialHealthScore >= 75) {
      this.financialHealthStatus = 'Healthy';
      this.financialHealthTone = 'healthy';
    } else if (this.financialHealthScore >= 45) {
      this.financialHealthStatus = 'Watch';
      this.financialHealthTone = 'warning';
    } else {
      this.financialHealthStatus = 'Needs attention';
      this.financialHealthTone = 'danger';
    }

    this.financialHealthReasons = [];

    if (this.savingsRate >= 15) {
      this.financialHealthReasons.push({ text: 'Savings rate is healthy', tone: 'positive' });
    } else if (this.savingsRate >= 0) {
      this.financialHealthReasons.push({ text: 'Savings rate is stable', tone: 'warning' });
    } else {
      this.financialHealthReasons.push({ text: 'Savings rate needs attention', tone: 'danger' });
    }

    if (hasIncome && this.totalExpense <= this.totalIncome) {
      this.financialHealthReasons.push({ text: 'Spending is within income', tone: 'positive' });
    } else if (hasIncome) {
      this.financialHealthReasons.push({ text: 'Spending exceeds income', tone: 'danger' });
    }

    if (hasDebtData && this.totalDebt > 0) {
      this.financialHealthReasons.push({ text: 'Debt burden is being tracked', tone: this.totalDebt <= this.totalIncome ? 'warning' : 'danger' });
    }

    if (hasBudgetData) {
      const averageBudgetUsage = this.budgetOverviewItems.reduce((sum, item) => sum + item.percentage, 0) / this.budgetOverviewItems.length;
      if (averageBudgetUsage <= 75) {
        this.financialHealthReasons.push({ text: 'Budget usage remains manageable', tone: 'positive' });
      } else {
        this.financialHealthReasons.push({ text: 'Budget usage is elevated', tone: 'warning' });
      }
    }

    this.financialHealthRecommendations = this.buildRecommendations();
  }

  private buildRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.savingsRate < 10) {
      recommendations.push('Increase savings by directing a fixed amount from each income cycle.');
    }

    if (this.totalIncome > 0 && this.totalExpense > this.totalIncome) {
      recommendations.push('Reduce spending in the highest-cost categories to bring expenses below income.');
    } else {
      recommendations.push('Keep spending aligned with your monthly income to protect your balance.');
    }

    if (this.totalDebt > 0 && this.totalIncome > 0 && this.totalDebt / this.totalIncome > 0.35) {
      recommendations.push('Prioritize debt reduction to lower the debt burden on future cash flow.');
    }

    if (this.budgetOverviewItems.some(item => item.status === 'high' || item.status === 'over')) {
      recommendations.push('Review active budgets that are nearing or exceeding their limits.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain your current spending discipline and continue tracking monthly cash flow.');
    }

    return recommendations.slice(0, 3);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  getNetBalanceClass(): string {
    if (this.netBalance > 0) return 'positive';
    if (this.netBalance < 0) return 'negative';
    return 'neutral';
  }

  getSavingsRateClass(): string {
    if (this.savingsRate > 0) return 'positive';
    if (this.savingsRate < 0) return 'negative';
    return 'neutral';
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

  clampPercentage(value: number): number {
    return Math.min(Math.max(value, 0), 100);
  }

  formatPercent(value: number): string {
    return `${Math.abs(value).toFixed(1)}%`;
  }

  private buildTrend(currentValue: number, previousValue: number, type: 'income' | 'expense' | 'balance' | 'savings'): KpiTrend {
    if (previousValue === 0 && currentValue === 0) {
      return { value: 0, label: 'No change vs previous period', direction: 'neutral' };
    }

    if (previousValue === 0) {
      return {
        value: 100,
        label: currentValue > 0 ? 'New data vs previous period' : 'No prior data',
        direction: currentValue >= 0 ? 'up' : 'down'
      };
    }

    const delta = currentValue - previousValue;
    const percentChange = (Math.abs(delta) / Math.abs(previousValue)) * 100;

    if (type === 'expense' && delta > 0) {
      return { value: percentChange, label: `+${this.formatPercent(percentChange)} vs previous period`, direction: 'up' };
    }

    if (type === 'expense' && delta < 0) {
      return { value: percentChange, label: `-${this.formatPercent(percentChange)} vs previous period`, direction: 'down' };
    }

    if (delta >= 0) {
      return { value: percentChange, label: `+${this.formatPercent(percentChange)} vs previous period`, direction: 'up' };
    }

    return { value: percentChange, label: `-${this.formatPercent(percentChange)} vs previous period`, direction: 'down' };
  }

  private calculateSavingsRate(income: number, netBalance: number): number {
    if (income <= 0) {
      return 0;
    }
    return (netBalance / income) * 100;
  }

  private applyFallbackTrendStatus(): void {
    this.incomeTrend = { value: 0, label: 'Comparison unavailable', direction: 'neutral' };
    this.expenseTrend = { value: 0, label: 'Comparison unavailable', direction: 'neutral' };
    this.balanceTrend = { value: 0, label: 'Comparison unavailable', direction: 'neutral' };
    this.savingsTrend = { value: 0, label: 'Comparison unavailable', direction: 'neutral' };
  }

  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private getPreviousMonthKey(currentMonth: string): string {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private formatMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }
}
