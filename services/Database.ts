import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { DEFAULT_CURRENCY } from '@/constants/currencies';

let db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('khusa.db');

  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      currency TEXT NOT NULL,
      balance INTEGER NOT NULL DEFAULT 0,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      budget_limit INTEGER,
      budget_currency TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      account_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      original_amount INTEGER,
      original_currency TEXT,
      exchange_rate REAL,
      description TEXT NOT NULL,
      category_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      to_account_id TEXT,
      receipt_image_uri TEXT,
      receipt_raw_data TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY NOT NULL,
      direction TEXT NOT NULL,
      person_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      is_settled INTEGER NOT NULL DEFAULT 0,
      settled_transaction_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await seedInitialData();
}

async function seedInitialData(): Promise<void> {
  const database = getDb();

  // Only seed if categories table is empty
  const row = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );
  if (row && row.count > 0) return;

  // Seed categories
  for (const cat of DEFAULT_CATEGORIES) {
    const id = crypto.randomUUID();
    await database.runAsync(
      `INSERT INTO categories (id, name, icon, color, is_default) VALUES (?, ?, ?, ?, ?)`,
      [id, cat.name, cat.icon, cat.color, cat.isDefault ? 1 : 0]
    );
  }

  // Seed default settings
  await database.runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    ['default_currency', DEFAULT_CURRENCY]
  );
  await database.runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    ['shake_to_undo', 'true']
  );
  await database.runAsync(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
    ['location_enabled', 'false']
  );
}
