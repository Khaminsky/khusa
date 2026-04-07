import { View, Text, StyleSheet, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { router } from 'expo-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { formatAmount } from '@/constants/currencies';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { Account } from '@/types';

const ACCOUNT_TYPE_ICONS: Record<Account['type'], string> = {
  cash: '💵',
  bank: '🏦',
  mobile_money: '📱',
  credit: '💳',
};

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_money: 'Mobile Money',
  credit: 'Credit',
};

export default function AccountsScreen() {
  const accounts = useAccountStore(s => s.accounts);

  const renderAccount: ListRenderItem<Account> = ({ item }) => {
    const isOutstanding = item.type === 'credit' && item.balance > 0;
    const balanceColor = isOutstanding ? colors.creditOutstanding : colors.textPrimary;

    return (
      <TouchableOpacity
        style={styles.accountRow}
        onPress={() => router.push({ pathname: '/account/[id]', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: item.color + '22', borderColor: item.color + '55' }]}>
          <Text style={styles.accountIcon}>{ACCOUNT_TYPE_ICONS[item.type]}</Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{item.name}</Text>
          <Text style={styles.accountType}>{ACCOUNT_TYPE_LABELS[item.type]} · {item.currency}</Text>
        </View>
        <View style={styles.accountRight}>
          <Text style={[styles.accountBalance, { color: balanceColor }]}>
            {formatAmount(item.balance, item.currency)}
          </Text>
          {isOutstanding && (
            <Text style={styles.outstandingLabel}>outstanding</Text>
          )}
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Accounts</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/modals/add-account')}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={a => a.id}
        renderItem={renderAccount}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptySubtitle}>Add an account to start tracking</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/modals/add-account')}
            >
              <Text style={styles.emptyBtnText}>Add Account</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          accounts.length > 0 ? <DebtsSection /> : null
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function DebtsSection() {
  return (
    <View style={styles.debtsSection}>
      <Text style={styles.sectionTitle}>Debts</Text>

      <View style={styles.debtGroup}>
        <Text style={styles.debtGroupLabel}>They Owe Me</Text>
        <Text style={styles.debtPlaceholder}>Coming in Phase 5</Text>
      </View>

      <View style={[styles.debtGroup, { marginTop: spacing.sm }]}>
        <Text style={styles.debtGroupLabel}>I Owe</Text>
        <Text style={styles.debtPlaceholder}>Coming in Phase 5</Text>
      </View>
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
  addBtn: {
    backgroundColor: colors.credit,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  addBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  list: {
    paddingTop: spacing.xs,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountIcon: {
    fontSize: 22,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  accountType: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  outstandingLabel: {
    fontSize: fontSize.xs,
    color: colors.creditOutstanding,
    marginTop: 2,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    backgroundColor: colors.credit,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.md,
  },
  debtsSection: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  debtGroup: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  debtGroupLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  debtPlaceholder: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
