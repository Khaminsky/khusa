import type { Category } from '@/types';

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining',      icon: 'restaurant-outline',       color: '#f97316', isDefault: true },
  { name: 'Transport',          icon: 'car-outline',               color: '#3b82f6', isDefault: true },
  { name: 'Shopping',           icon: 'bag-handle-outline',        color: '#a855f7', isDefault: true },
  { name: 'Bills & Utilities',  icon: 'flash-outline',             color: '#eab308', isDefault: true },
  { name: 'Health',             icon: 'medkit-outline',            color: '#ec4899', isDefault: true },
  { name: 'Entertainment',      icon: 'film-outline',              color: '#06b6d4', isDefault: true },
  { name: 'Education',          icon: 'book-outline',              color: '#8b5cf6', isDefault: true },
  { name: 'Income',             icon: 'trending-up-outline',       color: '#22c55e', isDefault: true },
  { name: 'Mobile Money Fees',  icon: 'phone-portrait-outline',    color: '#f43f5e', isDefault: true },
  { name: 'Other',              icon: 'ellipsis-horizontal-outline', color: '#6b7280', isDefault: true },
];
