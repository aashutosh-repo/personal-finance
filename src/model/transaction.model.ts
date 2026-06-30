export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export enum ExpenseType {
  OTHER = 'OTHER',
  EDUCATION = 'EDUCATION',
  INVESTMENT = 'INVESTMENT',
  UTILITY = 'UTILITY',
  SHOPPING = 'SHOPPING',
  GROCERY = 'GROCERY',
  TRAVELLING = 'TRAVELLING',
  ADVENTURE = 'ADVENTURE'
}

export interface Transaction {
  id?: number;
   userId: number
  categoryId: number
  txnAmount: number
  expenseCategory: string
  txnType: string
  dateOfExpense: string
  description: string
}

export interface TransactionTotals {
  
}
