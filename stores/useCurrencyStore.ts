import { create } from 'zustand';
import { DEFAULT_CURRENCY } from '@/constants/currencies';
import { getDb } from '@/services/Database';

interface CurrencyState {
  defaultCurrency: string;
  loadDefaultCurrency: () => Promise<void>;
  setDefaultCurrency: (code: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  defaultCurrency: DEFAULT_CURRENCY,

  loadDefaultCurrency: async () => {
    const db = getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'default_currency'"
    );
    if (row) set({ defaultCurrency: row.value });
  },

  setDefaultCurrency: async (code: string) => {
    const db = getDb();
    await db.runAsync(
      "UPDATE settings SET value = ? WHERE key = 'default_currency'",
      [code]
    );
    set({ defaultCurrency: code });
  },
}));
