import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Account } from '@/types';
import { getDb } from '@/services/Database';

interface AccountState {
  accounts: Account[];
  activeAccountId: string | null;
  loadAccounts: () => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'lastUsedAt' | 'balance' | 'isArchived'>) => Promise<Account>;
  setActiveAccount: (id: string) => void;
  getActiveAccount: () => Account | null;
  updateLastUsed: (id: string) => Promise<void>;
  archiveAccount: (id: string) => Promise<void>;
  refreshAccount: (id: string) => Promise<void>;
}

function rowToAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Account['type'],
    currency: row.currency as string,
    balance: row.balance as number,
    color: row.color as string,
    icon: row.icon as string,
    isArchived: (row.is_archived as number) === 1,
    createdAt: row.created_at as string,
    lastUsedAt: row.last_used_at as string,
  };
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  activeAccountId: null,

  loadAccounts: async () => {
    const db = getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM accounts WHERE is_archived = 0 ORDER BY last_used_at DESC'
    );
    const accounts = rows.map(rowToAccount);
    set(state => ({
      accounts,
      activeAccountId: state.activeAccountId ?? (accounts[0]?.id ?? null),
    }));
  },

  addAccount: async (data) => {
    const db = getDb();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO accounts (id, name, type, currency, balance, color, icon, is_archived, created_at, last_used_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, 0, ?, ?)`,
      [id, data.name, data.type, data.currency, data.color, data.icon, now, now]
    );

    const account: Account = {
      id,
      ...data,
      balance: 0,
      isArchived: false,
      createdAt: now,
      lastUsedAt: now,
    };

    set(state => ({
      accounts: [account, ...state.accounts],
      activeAccountId: state.activeAccountId ?? id,
    }));

    return account;
  },

  setActiveAccount: (id: string) => {
    set({ activeAccountId: id });
  },

  getActiveAccount: () => {
    const { accounts, activeAccountId } = get();
    return accounts.find(a => a.id === activeAccountId) ?? null;
  },

  updateLastUsed: async (id: string) => {
    const db = getDb();
    const now = new Date().toISOString();
    await db.runAsync('UPDATE accounts SET last_used_at = ? WHERE id = ?', [now, id]);
    set(state => ({
      accounts: state.accounts
        .map(a => a.id === id ? { ...a, lastUsedAt: now } : a)
        .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)),
      activeAccountId: id,
    }));
  },

  archiveAccount: async (id: string) => {
    const db = getDb();
    await db.runAsync('UPDATE accounts SET is_archived = 1 WHERE id = ?', [id]);
    set(state => {
      const remaining = state.accounts.filter(a => a.id !== id);
      const newActive = state.activeAccountId === id
        ? (remaining[0]?.id ?? null)
        : state.activeAccountId;
      return { accounts: remaining, activeAccountId: newActive };
    });
  },

  refreshAccount: async (id: string) => {
    const db = getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM accounts WHERE id = ?', [id]
    );
    if (!row) return;
    const updated = rowToAccount(row);
    set(state => ({
      accounts: state.accounts.map(a => a.id === id ? updated : a),
    }));
  },
}));
