import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import { getDb } from '@/services/Database';
import type { Category } from '@/types';

interface CategoryStore {
  categories: Category[];
  loadCategories: () => Promise<void>;
  addCategory: (data: Pick<Category, 'name' | 'icon' | 'color'>) => Promise<void>;
  updateCategory: (id: string, data: Pick<Category, 'name' | 'icon' | 'color'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  canDeleteCategory: (id: string) => Promise<boolean>;
}

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: number;
  budget_limit: number | null;
  budget_currency: string | null;
};

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isDefault: row.is_default === 1,
    budgetLimit: row.budget_limit ?? undefined,
    budgetCurrency: row.budget_currency ?? undefined,
  };
}

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],

  loadCategories: async () => {
    const db = getDb();
    const rows = await db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories ORDER BY is_default DESC, name ASC'
    );
    set({ categories: rows.map(rowToCategory) });
  },

  addCategory: async (data) => {
    const db = getDb();
    const id = Crypto.randomUUID();
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, color, is_default) VALUES (?, ?, ?, ?, 0)',
      [id, data.name, data.icon, data.color]
    );
    const row = await db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
    if (row) {
      set(s => ({ categories: [...s.categories, rowToCategory(row)] }));
    }
  },

  updateCategory: async (id, data) => {
    const db = getDb();
    await db.runAsync(
      'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?',
      [data.name, data.icon, data.color, id]
    );
    set(s => ({
      categories: s.categories.map(c =>
        c.id === id ? { ...c, name: data.name, icon: data.icon, color: data.color } : c
      ),
    }));
  },

  deleteCategory: async (id) => {
    const db = getDb();
    await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
    set(s => ({ categories: s.categories.filter(c => c.id !== id) }));
  },

  canDeleteCategory: async (id) => {
    const db = getDb();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?',
      [id]
    );
    return !row || row.count === 0;
  },
}));
