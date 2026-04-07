export type AccountType = 'cash' | 'bank' | 'mobile_money' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: string;
  lastUsedAt: string;
}

export type TransactionType = 'credit' | 'debit' | 'transfer';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  description: string;
  categoryId: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  toAccountId?: string;
  receiptImageUri?: string;
  receiptRawData?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  budgetLimit?: number;
  budgetCurrency?: string;
}

export type DebtDirection = 'i_owe' | 'they_owe';

export interface Debt {
  id: string;
  direction: DebtDirection;
  personName: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  isSettled: boolean;
  settledTransactionId?: string;
  createdAt: string;
}
