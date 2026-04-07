import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { formatAmount } from '@/constants/currencies';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { Account } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ACCOUNT_TYPE_ICONS: Record<Account['type'], string> = {
  cash: '💵',
  bank: '🏦',
  mobile_money: '📱',
  credit: '💳',
};

export default function HomeScreen() {
  const accounts = useAccountStore(s => s.accounts);
  const activeAccountId = useAccountStore(s => s.activeAccountId);
  const updateLastUsed = useAccountStore(s => s.updateLastUsed);
  const activeAccount = accounts.find(a => a.id === activeAccountId) ?? null;

  const [switcherVisible, setSwitcherVisible] = useState(false);

  const balanceColor =
    activeAccount?.type === 'credit' && activeAccount.balance > 0
      ? colors.creditOutstanding
      : colors.textPrimary;

  function openTransaction(type: 'credit' | 'debit') {
    if (!activeAccount) {
      router.push('/modals/add-account');
      return;
    }
    router.push({ pathname: '/modals/transaction', params: { type } });
  }

  async function selectAccount(id: string) {
    setSwitcherVisible(false);
    await updateLastUsed(id);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => accounts.length > 0 && setSwitcherVisible(true)}
        activeOpacity={accounts.length > 0 ? 0.7 : 1}
      >
        {activeAccount ? (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.accountName}>
                {ACCOUNT_TYPE_ICONS[activeAccount.type]} {activeAccount.name}
              </Text>
              {accounts.length > 1 && (
                <Text style={styles.chevron}>⌄</Text>
              )}
            </View>
            <Text style={[styles.balance, { color: balanceColor }]}>
              {formatAmount(activeAccount.balance, activeAccount.currency)}
            </Text>
          </>
        ) : (
          <Text style={styles.accountName}>Tap Accounts to add your first account</Text>
        )}
      </TouchableOpacity>

      {/* Two-button body */}
      <View style={styles.body}>
        <TouchableOpacity
          style={[styles.button, styles.creditButton]}
          onPress={() => openTransaction('credit')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonSymbol}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.debitButton]}
          onPress={() => openTransaction('debit')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonSymbol}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Account switcher dropdown */}
      <Modal
        visible={switcherVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwitcherVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSwitcherVisible(false)}>
          <View style={styles.switcher}>
            <Text style={styles.switcherTitle}>Switch Account</Text>
            <FlatList
              data={accounts}
              keyExtractor={a => a.id}
              renderItem={({ item }) => {
                const isActive = item.id === activeAccountId;
                const itemBalanceColor =
                  item.type === 'credit' && item.balance > 0
                    ? colors.creditOutstanding
                    : colors.textPrimary;
                return (
                  <TouchableOpacity
                    style={[styles.switcherRow, isActive && styles.switcherRowActive]}
                    onPress={() => selectAccount(item.id)}
                  >
                    <Text style={styles.switcherIcon}>{ACCOUNT_TYPE_ICONS[item.type]}</Text>
                    <View style={styles.switcherInfo}>
                      <Text style={styles.switcherName}>{item.name}</Text>
                      <Text style={[styles.switcherBalance, { color: itemBalanceColor }]}>
                        {formatAmount(item.balance, item.currency)}
                      </Text>
                    </View>
                    {isActive && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: SCREEN_HEIGHT * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  accountName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chevron: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    lineHeight: fontSize.md * 1.2,
  },
  balance: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  body: {
    flex: 1,
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creditButton: {
    backgroundColor: colors.credit,
  },
  debitButton: {
    backgroundColor: colors.debit,
  },
  buttonSymbol: {
    fontSize: 80,
    color: colors.white,
    fontWeight: fontWeight.bold,
    lineHeight: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingTop: SCREEN_HEIGHT * 0.08,
  },
  switcher: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.5,
  },
  switcherTitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  switcherRowActive: {
    backgroundColor: colors.surfaceElevated,
  },
  switcherIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  switcherInfo: {
    flex: 1,
  },
  switcherName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  switcherBalance: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: fontSize.md,
    color: colors.credit,
    fontWeight: fontWeight.bold,
  },
});
