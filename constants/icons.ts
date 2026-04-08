import type { Account } from '@/types';

/** Ionicons name for each account type — used when creating accounts */
export const ACCOUNT_TYPE_ICONS: Record<Account['type'], string> = {
  cash: 'wallet-outline',
  bank: 'business-outline',
  mobile_money: 'phone-portrait-outline',
  credit: 'card-outline',
};

/** Curated Ionicons names available in the category icon picker */
export const CATEGORY_ICON_OPTIONS: string[] = [
  'restaurant-outline',
  'car-outline',
  'bag-handle-outline',
  'flash-outline',
  'medkit-outline',
  'film-outline',
  'book-outline',
  'trending-up-outline',
  'phone-portrait-outline',
  'ellipsis-horizontal-outline',
  'home-outline',
  'airplane-outline',
  'game-controller-outline',
  'cafe-outline',
  'paw-outline',
  'fitness-outline',
  'musical-notes-outline',
  'gift-outline',
  'leaf-outline',
  'football-outline',
  'school-outline',
  'heart-outline',
  'cart-outline',
  'bicycle-outline',
  'bus-outline',
  'beer-outline',
  'pizza-outline',
  'shirt-outline',
  'build-outline',
  'color-palette-outline',
  'cut-outline',
  'desktop-outline',
];

/** Emoji → Ionicons name migration map (used in DB migration only) */
export const EMOJI_TO_IONICONS: Record<string, string> = {
  '🍽️': 'restaurant-outline',
  '🚗': 'car-outline',
  '🛍️': 'bag-handle-outline',
  '⚡': 'flash-outline',
  '💊': 'medkit-outline',
  '🎬': 'film-outline',
  '📚': 'book-outline',
  '💰': 'trending-up-outline',
  '📱': 'phone-portrait-outline',
  '📦': 'ellipsis-horizontal-outline',
};
