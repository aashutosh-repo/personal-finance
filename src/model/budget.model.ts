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
  categoryId: number;
  budgetAmount: number;
  month: string;
  description?: string;
}

export interface BudgetResponse {
  id: number;
  categoryId: number;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  month: string;
  percentageUsed: number;
  isExceeded: boolean;
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
  source: string;
  amount: number;
  date: string;
  description?: string;
}

export interface IncomeResponse {
  id: number;
  source: string;
  amount: number;
  date: string;
  description?: string;
}

export interface IncomeSummary {
  totalIncome: number;
  month: string;
  sources: Array<{
    source: string;
    amount: number;
  }>;
}
