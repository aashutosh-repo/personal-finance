export interface Budget {
  id?: number;
  userId: number;
  categoryId: number;
  categoryName?: string;
  budgetAmount: number;
  spentAmount?: number;
  month: string; // YYYY-MM format
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetRequest {
  name: string;
  userId: string;
  categoryId: number;
  amount: number;
  currency?: string;
  period: string; // MONTHLY, QUARTERLY, YEARLY
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  alertThreshold?: number;
  alertFrequency?: string;
  description?: string;
}

export interface BudgetResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
  currency?: string;
  alertThreshold?: number;
  alertFrequency?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetAlert {
  id?: number;
  budgetId: number;
  threshold: number; // Alert when spent % of budget
  alertMessage: string;
  createdAt?: string;
}

export interface Income {
  id?: number;
  userId: number;
  source: string;
  amount: number;
  date: string;
  month?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeRequest {
  sourceType: string;
  amount: number;
  incomeDate: string;
  currency?: string;
  description?: string;
}

export interface IncomeResponse {
  id: number;
  sourceType: string;
  amount: number;
  incomeDate: string;
  currency?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IncomeSummary {
  totalIncome: number;
  month: string;
  sources: Array<{
    source: string;
    amount: number;
  }>;
}
