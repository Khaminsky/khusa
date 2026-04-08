import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { formatAmount } from '@/constants/currencies';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { Transaction } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type DateRange = 'all' | 'today' | 'week' | 'month';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getDateRangeStart(range: DateRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  if (range === 'today') return startOfDay(now);
  if (range === 'week') {
    const d = startOfDay(now);
    d.setDate(d.getDate() - d.getDay()); // start of week (Sunday)
    return d;
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const txDay = startOfDay(d);

  if (txDay.getTime() === today.getTime()) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (txDay.getTime() === yesterday.getTime()) return 'Yesterday';

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

type ListItem =
  | { kind: 'header'; date: string; dayTotal: { credit: number; debit: number; currency: string } }
  | { kind: 'tx'; tx: Transaction };

export default function HistoryScreen() {
  const transactions = useTransactionStore(s => s.transactions);
  const loadTransactions = useTransactionStore(s => s.loadTransactions);
  const accounts = useAccountStore(s => s.accounts);
  const categories = useCategoryStore(s => s.categories);

  const [filterAccount, setFilterAccount] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<DateRange>('all');

  const categoryMap = new Map(categories.map(c => [c.id, c]));
  const accountMap = new Map(accounts.map(a => [a.id, a]));

  // Reload all transactions when tab gains focus
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  // Apply filters
  const filtered = transactions.filter(tx => {
    if (filterAccount && tx.accountId !== filterAccount) return false;
    if (filterCategory && tx.categoryId !== filterCategory) return false;
    if (filterDateRange !== 'all') {
      const rangeStart = getDateRangeStart(filterDateRange);
      if (rangeStart && new Date(tx.timestamp) < rangeStart) return false;
    }
    return true;
  });

  // Group by day
  const dayMap = new Map<string, Transaction[]>();
  for (const tx of filtered) {
    const day = tx.timestamp.slice(0, 10);
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(tx);
  }

  const listItems: ListItem[] = [];
  for (const [date, items] of dayMap.entries()) {
    let credit = 0;
    let debit = 0;
    for (const tx of items) {
      if (tx.type === 'credit') credit += tx.amount;
      else if (tx.type === 'debit') debit += tx.amount;
    }
    const currency = items[0]?.currency ?? 'MWK';
    listItems.push({ kind: 'header', date, dayTotal: { credit, debit, currency } });
    for (const tx of items) {
      listItems.push({ kind: 'tx', tx });
    }
  }

  const hasActiveFilters = filterAccount !== null || filterCategory !== null || filterDateRange !== 'all';

  function clearFilters() {
    setFilterAccount(null);
    setFilterCategory(null);
    setFilterDateRange('all');
  }

  const renderItem: ListRenderItem<ListItem> = ({ item }) => {
    if (item.kind === 'header') {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>
            {formatDate(item.date + 'T00:00:00')}
          </Text>
          <View style={styles.dayTotals}>
            {item.dayTotal.credit > 0 && (
              <Text style={styles.dayCredit}>
                +{formatAmount(item.dayTotal.credit, item.dayTotal.currency)}
              </Text>
            )}
            {item.dayTotal.debit > 0 && (
              <Text style={styles.dayDebit}>
                −{formatAmount(item.dayTotal.debit, item.dayTotal.currency)}
              </Text>
            )}
          </View>
        </View>
      );
    }

    const { tx } = item;
    const cat = categoryMap.get(tx.categoryId);
    const acc = accountMap.get(tx.accountId);
    const isDebit = tx.type === 'debit';
    const amountColor = isDebit ? colors.debit : colors.credit;
    const sign = isDebit ? '−' : '+';

    return (
      <View style={styles.txRow}>
        <View style={[styles.txIcon, { backgroundColor: (cat?.color ?? '#6b7280') + '22' }]}>
          <Ionicons
            name={(cat?.icon ?? 'ellipsis-horizontal-outline') as IoniconsName}
            size={16}
            color={cat?.color ?? '#6b7280'}
          />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
          <View style={styles.txMeta}>
            <Text style={styles.txCategory}>{cat?.name ?? 'Unknown'}</Text>
            {acc && <Text style={styles.txAccount}> · {acc.name}</Text>}
            <Text style={styles.txTime}> · {formatTime(tx.timestamp)}</Text>
          </View>
        </View>
        <Text style={[styles.txAmount, { color: amountColor }]}>
          {sign}{formatAmount(tx.amount, tx.currency)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {/* Date range */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {([
            ['all', 'All'],
            ['today', 'Today'],
            ['week', 'This Week'],
            ['month', 'This Month'],
          ] as [DateRange, string][]).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.filterChip, filterDateRange === value && styles.filterChipActive]}
              onPress={() => setFilterDateRange(value)}
            >
              <Text style={[styles.filterChipText, filterDateRange === value && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.filterDivider} />

          {/* Account filter */}
          <TouchableOpacity
            style={[styles.filterChip, filterAccount === null && styles.filterChipActive]}
            onPress={() => setFilterAccount(null)}
          >
            <Text style={[styles.filterChipText, filterAccount === null && styles.filterChipTextActive]}>
              All Accounts
            </Text>
          </TouchableOpacity>
          {accounts.map(acc => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.filterChip, filterAccount === acc.id && styles.filterChipActive]}
              onPress={() => setFilterAccount(acc.id)}
            >
              <Ionicons
                name={acc.icon as IoniconsName}
                size={12}
                color={filterAccount === acc.id ? colors.white : colors.textSecondary}
                style={styles.filterChipIcon}
              />
              <Text style={[styles.filterChipText, filterAccount === acc.id && styles.filterChipTextActive]}>
                {acc.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === null && styles.filterChipActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[styles.filterChipText, filterCategory === null && styles.filterChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, filterCategory === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color }]}
              onPress={() => setFilterCategory(cat.id)}
            >
              <Ionicons
                name={cat.icon as IoniconsName}
                size={12}
                color={filterCategory === cat.id ? cat.color : colors.textSecondary}
                style={styles.filterChipIcon}
              />
              <Text style={[styles.filterChipText, filterCategory === cat.id && { color: cat.color }]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction list */}
      <FlatList
        data={listItems}
        keyExtractor={(item, i) =>
          item.kind === 'header' ? `hdr-${item.date}` : `tx-${item.tx.id}`
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {hasActiveFilters ? 'No transactions match your filters' : 'No transactions yet'}
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearFilters} style={styles.emptyClearBtn}>
                <Text style={styles.emptyClearText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.txList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  clearBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearBtnText: {
    fontSize: fontSize.sm,
    color: colors.credit,
    fontWeight: fontWeight.medium,
  },
  filterBar: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.black,
    fontWeight: fontWeight.semibold,
  },
  filterChipIcon: {
    marginRight: 4,
  },
  filterDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  txList: {
    paddingVertical: spacing.xs,
  },
  emptyList: {
    flex: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    paddingTop: spacing.md,
  },
  dayHeaderText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTotals: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dayCredit: {
    fontSize: fontSize.xs,
    color: colors.credit,
    fontWeight: fontWeight.medium,
  },
  dayDebit: {
    fontSize: fontSize.xs,
    color: colors.debit,
    fontWeight: fontWeight.medium,
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
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  txMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  txCategory: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  txAccount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  txTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  txAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyClearBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
  },
  emptyClearText: {
    fontSize: fontSize.sm,
    color: colors.credit,
    fontWeight: fontWeight.medium,
  },
});
