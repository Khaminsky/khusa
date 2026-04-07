import type { Category } from '@/types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining',      icon: '🍽️', color: '#f97316', isDefault: true },
  { name: 'Transport',          icon: '🚗', color: '#3b82f6', isDefault: true },
  { name: 'Shopping',           icon: '🛍️', color: '#a855f7', isDefault: true },
  { name: 'Bills & Utilities',  icon: '⚡', color: '#eab308', isDefault: true },
  { name: 'Health',             icon: '💊', color: '#ec4899', isDefault: true },
  { name: 'Entertainment',      icon: '🎬', color: '#06b6d4', isDefault: true },
  { name: 'Education',          icon: '📚', color: '#8b5cf6', isDefault: true },
  { name: 'Income',             icon: '💰', color: '#22c55e', isDefault: true },
  { name: 'Mobile Money Fees',  icon: '📱', color: '#f43f5e', isDefault: true },
  { name: 'Other',              icon: '📦', color: '#6b7280', isDefault: true },
];
