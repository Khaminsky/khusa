import { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { useAccountStore } from '@/stores/useAccountStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { formatAmount } from '@/constants/currencies';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { Account } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHAKE_THRESHOLD = 1.8;
const SHAKE_COOLDOWN_MS = 2000;

export default function HomeScreen() {
  const accounts = useAccountStore(s => s.accounts);
  const activeAccountId = useAccountStore(s => s.activeAccountId);
  const updateLastUsed = useAccountStore(s => s.updateLastUsed);
  const loadAccounts = useAccountStore(s => s.loadAccounts);
  const undoLastTransaction = useTransactionStore(s => s.undoLastTransaction);
  const undoStack = useTransactionStore(s => s.undoStack);
  const activeAccount = accounts.find(a => a.id === activeAccountId) ?? null;

  const [switcherVisible, setSwitcherVisible] = useState(false);
  const lastShakeRef = useRef(0);

  // Shake-to-undo
  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();
      if (magnitude > SHAKE_THRESHOLD && now - lastShakeRef.current > SHAKE_COOLDOWN_MS) {
        lastShakeRef.current = now;
        handleShakeUndo();
      }
    });
    return () => subscription.remove();
  }, [undoStack.length]);

  function handleShakeUndo() {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const acc = accounts.find(a => a.id === last.accountId);

    Alert.alert(
      'Undo Transaction',
      `Undo "${last.description}" (${formatAmount(last.amount, last.currency)})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo',
          style: 'destructive',
          onPress: async () => {
            await undoLastTransaction(acc?.type);
            await loadAccounts(); // refresh balances
          },
        },
      ]
    );
  }

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
              <Ionicons
                name={activeAccount.icon as IoniconsName}
                size={16}
                color={colors.textSecondary}
                style={styles.accountTypeIcon}
              />
              <Text style={styles.accountName}>{activeAccount.name}</Text>
              {accounts.length > 1 && (
                <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
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
              keyExtractor={(a: Account) => a.id}
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
                    <Ionicons
                      name={item.icon as IoniconsName}
                      size={20}
                      color={colors.textSecondary}
                      style={styles.switcherIcon}
                    />
                    <View style={styles.switcherInfo}>
                      <Text style={styles.switcherName}>{item.name}</Text>
                      <Text style={[styles.switcherBalance, { color: itemBalanceColor }]}>
                        {formatAmount(item.balance, item.currency)}
                      </Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark" size={18} color={colors.credit} />
                    )}
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
  accountTypeIcon: {
    marginRight: 2,
  },
  accountName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
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
    width: 28,
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
});
