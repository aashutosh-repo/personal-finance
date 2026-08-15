import { ExpenseType } from "../transaction.model";

export const ExpenseCategoryColors: Record<ExpenseType, string> = {
  [ExpenseType.EDUCATION]: '#FF6B6B',
  [ExpenseType.INVESTMENT]: '#4ECDC4',
  [ExpenseType.UTILITY]: '#FFE66D',
  [ExpenseType.SHOPPING]: '#95E1D3',
  [ExpenseType.GROCERY]: '#C0C0FF',
  [ExpenseType.TRAVELLING]: '#FF9E9E',
  [ExpenseType.ADVENTURE]: '#7FDBCA',
  [ExpenseType.OTHER]: '#FF8B9E'
};
