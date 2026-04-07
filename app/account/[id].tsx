import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ListRenderItem,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { getDb } from '@/services/Database';
import { formatAmount } from '@/constants/currencies';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { Transaction, Category, Account } from '@/types';

const ACCOUNT_TYPE_ICONS: Record<Account['type'], string> = {
  cash: '💵',
  bank: '🏦',
  mobile_money: '📱',
  credit: '💳',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDay(txs: Transaction[]): { date: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const day = tx.timestamp.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(tx);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

type ListItem =
  | { kind: 'header'; date: string }
  | { kind: 'tx'; tx: Transaction };

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accounts = useAccountStore(s => s.accounts);
  const archiveAccount = useAccountStore(s => s.archiveAccount);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const transactions = useTransactionStore(s => s.transactions);

  const [categoryMap, setCategoryMap] = useState<Map<string, Category>>(new Map());

  const account = accounts.find(a => a.id === id) ?? null;

  useEffect(() => {
    if (!id) return;
    loadTransactions(id);

    (async () => {
      const db = getDb();
      const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM categories');
      const map = new Map<string, Category>();
      for (const r of rows) {
        const cat: Category = {
          id: r.id as string,
          name: r.name as string,
          icon: r.icon as string,
          color: r.color as string,
          isDefault: (r.is_default as number) === 1,
          budgetLimit: r.budget_limit as number | undefined,
          budgetCurrency: r.budget_currency as string | undefined,
        };
        map.set(cat.id, cat);
      }
      setCategoryMap(map);
    })();
  }, [id]);

  function handleArchive() {
    Alert.alert(
      'Archive Account',
      `Archive "${account?.name}"? It will no longer appear in your account list. Existing transactions are preserved.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await archiveAccount(id!);
            router.back();
          },
        },
      ]
    );
  }

  if (!account) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFound}>Account not found</Text>
        </View>
      </View>
    );
  }

  const isOutstanding = account.type === 'credit' && account.balance > 0;
  const balanceColor = isOutstanding ? colors.creditOutstanding : colors.textPrimary;

  // Build flat list items from grouped transactions
  const groups = groupByDay(transactions);
  const listItems: ListItem[] = [];
  for (const g of groups) {
    listItems.push({ kind: 'header', date: g.date });
    for (const tx of g.items) {
      listItems.push({ kind: 'tx', tx });
    }
  }

  const renderItem: ListRenderItem<ListItem> = ({ item }) => {
    if (item.kind === 'header') {
      return (
        <Text style={styles.dayHeader}>{formatDate(item.date + 'T00:00:00')}</Text>
      );
    }

    const { tx } = item;
    const cat = categoryMap.get(tx.categoryId);
    const isDebit = tx.type === 'debit';
    // For credit accounts, debit = spending (bad), credit = payment (good)
    const amountColor = isDebit ? colors.debit : colors.credit;
    const sign = isDebit ? '−' : '+';

    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: (cat?.color ?? '#6b7280') + '22' }]}>
          <Text style={styles.txIconText}>{cat?.icon ?? '📦'}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc}>{tx.description}</Text>
          <Text style={styles.txCategory}>{cat?.name ?? 'Unknown'}</Text>
        </View>
        <Text style={[styles.txAmount, { color: amountColor }]}>
          {sign}{formatAmount(tx.amount, tx.currency)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleArchive}>
          <Text style={styles.archiveBtn}>Archive</Text>
        </TouchableOpacity>
      </View>

      {/* Account header */}
      <View style={[styles.accountHeader, { borderBottomColor: account.color + '44' }]}>
        <View style={[styles.accountIconBadge, { backgroundColor: account.color + '22' }]}>
          <Text style={styles.accountIconText}>{ACCOUNT_TYPE_ICONS[account.type]}</Text>
        </View>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={[styles.accountBalance, { color: balanceColor }]}>
          {formatAmount(account.balance, account.currency)}
        </Text>
        {isOutstanding && (
          <Text style={styles.outstandingLabel}>outstanding balance</Text>
        )}
        <Text style={styles.accountMeta}>
          {account.type.replace('_', ' ')} · {account.currency}
        </Text>
      </View>

      {/* Transaction list */}
      <FlatList
        data={listItems}
        keyExtractor={(item, i) =>
          item.kind === 'header' ? `hdr-${item.date}` : `tx-${item.tx.id}-${i}`
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyTx}>
            <Text style={styles.emptyTxText}>No transactions yet</Text>
          </View>
        }
        contentContainerStyle={styles.txList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  backBtn: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  archiveBtn: {
    fontSize: fontSize.sm,
    color: colors.debit,
    fontWeight: fontWeight.medium,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  accountHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 2,
  },
  accountIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  accountIconText: {
    fontSize: 30,
  },
  accountName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  accountBalance: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  outstandingLabel: {
    fontSize: fontSize.xs,
    color: colors.creditOutstanding,
    marginTop: 2,
  },
  accountMeta: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  txList: {
    paddingVertical: spacing.sm,
  },
  dayHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: 2,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconText: {
    fontSize: 18,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  txCategory: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptyTx: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTxText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
});
