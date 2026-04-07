export const colors = {
  credit: '#22c55e',      // green-500
  debit: '#ef4444',       // red-500
  creditMuted: '#16a34a', // green-600
  debitMuted: '#dc2626',  // red-600
  creditOutstanding: '#ef4444', // same red for credit account outstanding balance
  background: '#0f0f0f',
  surface: '#1a1a1a',
  surfaceElevated: '#242424',
  border: '#2a2a2a',
  textPrimary: '#f5f5f5',
  textSecondary: '#a3a3a3',
  textMuted: '#525252',
  white: '#ffffff',
  black: '#000000',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  full: 9999,
} as const;
