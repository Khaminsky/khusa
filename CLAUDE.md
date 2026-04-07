# CLAUDE.md — Expense Tracker App

## Project Overview

A personal expense tracking and budgeting mobile application built with Expo + React Native. The defining philosophy is **ruthless simplicity** — this is the anti-dashboard finance app. Every design and implementation decision must serve the goal of recording a transaction in under 10 seconds.

---

## Core Philosophy

> "Record first, think later."

- The home screen has **two buttons and nothing else** (plus a slim header and bottom nav)
- Complexity is hidden, never eliminated — rich data lives underneath a simple surface
- The app must be fully usable **offline** at all times
- No login wall, no onboarding friction, no mandatory setup before first use
- Every feature added must be justified against the question: *does this help someone record a transaction faster?*

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo (managed workflow) + React Native |
| Language | TypeScript (strict mode) |
| Local Storage | SQLite via `expo-sqlite` |
| Receipt OCR | Google ML Kit (decoupled behind service interface) |
| Exchange Rates | Frankfurter API (free, no API key required) |
| Navigation | Expo Router (file-based routing) |
| Build / iOS | EAS Build |
| State Management | Zustand (lightweight, no boilerplate) |
| Styling | StyleSheet API + consistent design tokens |

---

## Project Structure

```
/app                  # Expo Router screens
  /(tabs)
    index.tsx         # Home — two-button screen
    history.tsx       # Transaction feed
    accounts.tsx      # Accounts + Debts section
    settings.tsx      # Categories, preferences, export
  /modals
    transaction.tsx   # Bottom sheet — transaction entry form
    receipt.tsx       # Receipt scanning flow
/components           # Shared UI components
/services
  ReceiptScanner.ts   # OCR abstraction layer (see below)
  ExchangeRate.ts     # Frankfurter API + local cache
  Database.ts         # SQLite initialization and migrations
/stores               # Zustand stores
  useAccountStore.ts
  useTransactionStore.ts
  useDebtStore.ts
  useCurrencyStore.ts
/constants
  tokens.ts           # Design tokens (colors, spacing, typography)
  categories.ts       # Default category list
  currencies.ts       # Supported currencies list
/types
  index.ts            # All shared TypeScript types
```

---

## Data Model

### Account
```ts
type AccountType = 'cash' | 'bank' | 'mobile_money' | 'credit';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;       // ISO 4217 e.g. 'MWK', 'USD', 'ZAR'
  balance: number;
  color: string;          // for visual distinction
  icon: string;
  isArchived: boolean;
  createdAt: string;      // ISO timestamp
  lastUsedAt: string;     // ISO timestamp — drives header default
}
```

### Transaction
```ts
type TransactionType = 'credit' | 'debit' | 'transfer';

interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string;           // may differ from account base currency
  originalAmount?: number;    // if foreign currency transaction
  originalCurrency?: string;
  exchangeRate?: number;
  description: string;
  categoryId: string;
  // Background-captured fields
  timestamp: string;          // ISO — captured automatically
  latitude?: number;          // captured silently if permission granted
  longitude?: number;
  // Transfer-specific
  toAccountId?: string;       // populated for transfer type
  // Receipt-linked
  receiptImageUri?: string;
  receiptRawData?: string;    // JSON blob of parsed receipt
  createdAt: string;
}
```

### Category
```ts
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  budgetLimit?: number;       // optional monthly limit
  budgetCurrency?: string;
}
```

### Debt
```ts
type DebtDirection = 'i_owe' | 'they_owe';

interface Debt {
  id: string;
  direction: DebtDirection;
  personName: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  isSettled: boolean;
  settledTransactionId?: string;  // links to transaction if settled via account
  createdAt: string;
}
```

---

## Default Seed Data

### Categories (seed on first launch)
Food & Dining, Transport, Shopping, Bills & Utilities, Health, Entertainment, Education, Income, Mobile Money Fees, Other

### Mobile Money Providers (Malawi defaults in account setup)
Airtel Money, TNM Mpamba

### Default Currency
MWK (Malawian Kwacha) — user can change in Settings

---

## Screen Specifications

### Home Screen (`index.tsx`)

**Header (5–10% viewport height)**
- Dropdown to switch active account (shows account name + balance)
- Last used account is default on app open
- Balance shown in account's base currency
- Credit account balances displayed in muted red when outstanding

**Body**
- Two buttons filling the remaining viewport (excluding header and bottom nav)
- Green `+` button (top or left half) — Credit
- Red `−` button (bottom or right half) — Debit
- No other elements. No labels beyond the symbols.

**Gestures**
- Shake device → undo last recorded transaction (with confirmation toast)
- Swipe up from home → open transaction entry form directly

### Transaction Entry (`modals/transaction.tsx`)
- Presented as a **bottom sheet** (not a new screen)
- Fields: Account (pre-filled with active account), Amount, Description, Category
- Currency defaults to account base currency, can be overridden
- Timestamp and location captured silently on submission — user never sees or inputs these
- Camera icon in the form triggers receipt scanning flow
- Smart defaults: last used category pre-selected

### History Screen (`history.tsx`)
- Scrollable feed of transactions grouped by day
- Each entry: category icon, description, amount, account indicator
- Filter bar: by account, category, date range
- No charts, no graphs — just the list

### Accounts Screen (`accounts.tsx`)
- List of all accounts with balance and type icon
- "Add Account" button
- **Debts section** below accounts list
  - Two sub-sections: "They Owe Me" and "I Owe"
  - Each debt shows person name, amount, currency, optional due date
  - Settle button → optionally creates a transaction on a selected account and marks debt settled
- Tap any account → account detail with its own transaction history

### Settings Screen (`settings.tsx`)
- Categories management (add, edit, delete, set budget limits)
- Default currency preference
- Exchange rate: last updated timestamp + manual refresh
- Export data (CSV or JSON)
- Location permission toggle
- Shake-to-undo toggle
- App version

---

## Receipt Scanner — Decoupled Architecture

All receipt scanning is accessed through a single service interface. The rest of the app never calls Google ML Kit directly.

```ts
// services/ReceiptScanner.ts

export interface ReceiptScanResult {
  merchant?: string;
  total?: number;
  currency?: string;
  date?: string;
  lineItems?: { description: string; amount: number }[];
  rawText: string;
}

export interface ReceiptScannerAdapter {
  scan(imageUri: string): Promise<ReceiptScanResult>;
}

// V1 implementation using Google ML Kit
export class MLKitReceiptScanner implements ReceiptScannerAdapter {
  async scan(imageUri: string): Promise<ReceiptScanResult> {
    // ML Kit OCR implementation here
  }
}

// Future: OpenAI, Google Vision, etc. just implement the same interface
// export class OpenAIReceiptScanner implements ReceiptScannerAdapter { ... }

// Singleton used throughout the app
export const receiptScanner: ReceiptScannerAdapter = new MLKitReceiptScanner();
```

After scanning, the result pre-fills the transaction entry form. The user reviews and confirms — the scanner never auto-submits.

---

## Exchange Rate Service

```ts
// services/ExchangeRate.ts
// Uses Frankfurter API: https://api.frankfurter.app
// Rates cached in SQLite with a timestamp
// Falls back to last cached rate when offline
// Cache TTL: 24 hours
```

---

## Multi-Currency Rules

- Each account has a base currency set at creation
- Transactions default to the account's base currency
- User can override currency per transaction (e.g. USD transaction on an MWK account)
- When currency differs from account base: store both `amount` (in account currency) and `originalAmount` + `originalCurrency` + `exchangeRate`
- Combined net worth across accounts in different currencies converts all to user's default currency using cached rates
- Debt amounts are stored in whatever currency the debt was incurred in

---

## Credit Account Logic

- Credit accounts carry a balance representing **what is owed**
- A debit transaction (spending) **increases** the outstanding balance
- A credit transaction (payment) **decreases** the outstanding balance
- Display balance as negative in combined views to reflect net worth correctly
- Visual: balance text in muted red when outstanding > 0

---

## Transfer Logic

- Transfer is a special transaction type
- Creates two linked transaction records: a debit on the source account and a credit on the destination account
- Both share a `transferGroupId` so they can be displayed and deleted together
- Transfers do not appear in category-based summaries

---

## Permissions

| Permission | Purpose | Behavior if Denied |
|---|---|---|
| Location | Silent background capture on transactions | Silently skipped, no prompt retry |
| Camera | Receipt scanning | Scanner feature hidden until granted |

Request permissions lazily — location on first transaction submission, camera only when scanner is first tapped. Never block the core flow on permission denial.

---

## Implementation Phases

### Phase 1 — Core Shell
- Expo project setup with TypeScript, Expo Router, EAS config
- Design tokens and base styling
- SQLite initialization and schema migrations
- Zustand store setup
- Home screen (two-button layout)
- Transaction entry bottom sheet (four fields, no smart defaults yet)
- Basic transaction persistence

### Phase 2 — Accounts & Categories
- Account creation, listing, and management
- Account type logic (cash, bank, mobile money, credit)
- Category seed data and management screen
- Smart defaults in transaction form (last used account and category)
- Account detail screen with filtered transaction history
- Header account switcher with last-used memory

### Phase 3 — History & Background Capture
- History screen with day grouping
- Filter bar (account, category, date range)
- Silent location capture on transaction save
- Timestamp recorded automatically
- Shake-to-undo last transaction (with Zustand undo stack)

### Phase 4 — Multi-Currency & Exchange Rates
- Currency field on accounts and transactions
- Frankfurter API integration with SQLite cache
- Foreign currency transaction recording
- Combined balance conversion in header

### Phase 5 — Credit & Debts
- Credit account balance logic
- Debt model and Debts section in Accounts screen
- Settle flow with optional linked transaction
- Credit visual indicators (muted red balance)

### Phase 6 — Receipt Scanning
- Camera permission flow
- ReceiptScanner service interface
- Google ML Kit V1 adapter
- Receipt scanning modal
- Pre-fill transaction form from scan result

### Phase 7 — Budgets & Settings
- Monthly budget limits per category
- Subtle budget indicator in transaction form category picker
- Settings screen (categories, export, preferences)
- CSV and JSON export
- iCloud backup (optional)

### Phase 8 — Polish
- Haptic feedback on button taps and key actions
- Swipe-up gesture on home screen
- Animations on bottom sheet and screen transitions
- Dark mode support
- App icon and splash screen

---

## Code Conventions

- All monetary amounts stored as **integers in the smallest currency unit** (tambala for MWK, cents for USD) to avoid floating point errors. Divide by 100 for display.
- All timestamps stored as ISO 8601 strings in UTC
- UUIDs generated with `crypto.randomUUID()` for all IDs
- No `any` types — use `unknown` and narrow properly
- Database access only through `services/Database.ts` — no raw SQL in components or stores
- Components are presentational — all business logic lives in stores or services

---

## Out of Scope (Do Not Implement)

- User authentication or cloud accounts
- Push notifications
- Recurring transactions (future phase)
- Investment or savings tracking
- Charts and graphs (future phase)
- Social or shared expense splitting
- Bank API integrations / Plaid

---

*This file is the source of truth for the project. When in doubt, default to simplicity.*
