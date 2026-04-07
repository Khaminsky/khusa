export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  subunit: number; // smallest unit multiplier, e.g. 100 for cents
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'MWK', name: 'Malawian Kwacha',  symbol: 'MK',  subunit: 100 },
  { code: 'USD', name: 'US Dollar',         symbol: '$',   subunit: 100 },
  { code: 'ZAR', name: 'South African Rand',symbol: 'R',   subunit: 100 },
  { code: 'EUR', name: 'Euro',              symbol: '€',   subunit: 100 },
  { code: 'GBP', name: 'British Pound',     symbol: '£',   subunit: 100 },
  { code: 'KES', name: 'Kenyan Shilling',   symbol: 'KSh', subunit: 100 },
  { code: 'TZS', name: 'Tanzanian Shilling',symbol: 'TSh', subunit: 100 },
  { code: 'ZMW', name: 'Zambian Kwacha',    symbol: 'ZK',  subunit: 100 },
];

export const DEFAULT_CURRENCY = 'MWK';

export function formatAmount(amountInSmallestUnit: number, currencyCode: string): string {
  const info = CURRENCIES.find(c => c.code === currencyCode);
  const divisor = info?.subunit ?? 100;
  const symbol = info?.symbol ?? currencyCode;
  const value = amountInSmallestUnit / divisor;
  return `${symbol} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
