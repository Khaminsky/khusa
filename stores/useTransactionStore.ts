import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Transaction } from '@/types';
import { getDb } from '@/services/Database';

interface TransactionState {
  transactions: Transaction[];
  undoStack: Transaction[];
  lastUsedCategoryId: string | null;
  loadTransactions: (accountId?: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'timestamp'>, accountType?: string) => Promise<Transaction>;
  undoLastTransaction: (accountType?: string) => Promise<Transaction | null>;
}

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    accountId: row.account_id as string,
    type: row.type as Transaction['type'],
    amount: row.amount as number,
    currency: row.currency as string,
    originalAmount: row.original_amount as number | undefined,
    originalCurrency: row.original_currency as string | undefined,
    exchangeRate: row.exchange_rate as number | undefined,
    description: row.description as string,
    categoryId: row.category_id as string,
    timestamp: row.timestamp as string,
    latitude: row.latitude as number | undefined,
    longitude: row.longitude as number | undefined,
    toAccountId: row.to_account_id as string | undefined,
    receiptImageUri: row.receipt_image_uri as string | undefined,
    receiptRawData: row.receipt_raw_data as string | undefined,
    createdAt: row.created_at as string,
  };
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  undoStack: [],
  lastUsedCategoryId: null,

  loadTransactions: async (accountId?: string) => {
    const db = getDb();
    const rows = accountId
      ? await db.getAllAsync<Record<string, unknown>>(
          'SELECT * FROM transactions WHERE account_id = ? ORDER BY timestamp DESC',
          [accountId]
        )
      : await db.getAllAsync<Record<string, unknown>>(
          'SELECT * FROM transactions ORDER BY timestamp DESC'
        );
    set({ transactions: rows.map(rowToTransaction) });
  },

  addTransaction: async (txData, accountType) => {
    const db = getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO transactions
        (id, account_id, type, amount, currency, original_amount, original_currency,
         exchange_rate, description, category_id, timestamp, latitude, longitude,
         to_account_id, receipt_image_uri, receipt_raw_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        txData.accountId,
        txData.type,
        txData.amount,
        txData.currency,
        txData.originalAmount ?? null,
        txData.originalCurrency ?? null,
        txData.exchangeRate ?? null,
        txData.description,
        txData.categoryId,
        now,
        txData.latitude ?? null,
        txData.longitude ?? null,
        txData.toAccountId ?? null,
        txData.receiptImageUri ?? null,
        txData.receiptRawData ?? null,
        now,
      ]
    );

    // Credit accounts: debit increases outstanding, credit decreases it (inverted vs normal)
    const isCredit = accountType === 'credit';
    const delta = isCredit
      ? (txData.type === 'debit' ? txData.amount : -txData.amount)
      : (txData.type === 'debit' ? -txData.amount : txData.amount);

    await db.runAsync(
      'UPDATE accounts SET balance = balance + ?, last_used_at = ? WHERE id = ?',
      [delta, now, txData.accountId]
    );

    const tx: Transaction = { id, ...txData, timestamp: now, createdAt: now };

    set(state => ({
      transactions: [tx, ...state.transactions],
      undoStack: [...state.undoStack, tx],
      lastUsedCategoryId: txData.categoryId,
    }));

    return tx;
  },

  undoLastTransaction: async (accountType) => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;

    const last = undoStack[undoStack.length - 1];
    const db = getDb();

    await db.runAsync('DELETE FROM transactions WHERE id = ?', [last.id]);

    // Reverse the balance delta
    const isCredit = accountType === 'credit';
    const delta = isCredit
      ? (last.type === 'debit' ? -last.amount : last.amount)
      : (last.type === 'debit' ? last.amount : -last.amount);

    await db.runAsync(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [delta, last.accountId]
    );

    set(state => ({
      transactions: state.transactions.filter(t => t.id !== last.id),
      undoStack: state.undoStack.slice(0, -1),
    }));

    return last;
  },
}));
