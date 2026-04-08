import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { captureLocation } from '@/services/Location';
import type { TransactionType } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';

export default function TransactionModal() {
  const params = useLocalSearchParams<{ type?: string }>();
  const txType: TransactionType = params.type === 'credit' ? 'credit' : 'debit';

  const accounts = useAccountStore(s => s.accounts);
  const activeAccountId = useAccountStore(s => s.activeAccountId);
  const updateLastUsed = useAccountStore(s => s.updateLastUsed);
  const addTransaction = useTransactionStore(s => s.addTransaction);
  const lastUsedCategoryId = useTransactionStore(s => s.lastUsedCategoryId);
  const categories = useCategoryStore(s => s.categories);

  const defaultCategoryId = lastUsedCategoryId && categories.find(c => c.id === lastUsedCategoryId)
    ? lastUsedCategoryId
    : categories[0]?.id ?? '';

  const [selectedAccountId, setSelectedAccountId] = useState<string>(activeAccountId ?? '');
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      const fallback = lastUsedCategoryId && categories.find(c => c.id === lastUsedCategoryId)
        ? lastUsedCategoryId
        : categories[0].id;
      setSelectedCategoryId(fallback);
    }
  }, [categories.length]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  async function handleSubmit() {
    if (!selectedAccountId) {
      Alert.alert('Error', 'Please select an account');
      return;
    }
    const parsedAmount = parseFloat(amountText.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      const currency = selectedAccount?.currency ?? 'MWK';
      const subunit = 100; // all supported currencies use 100 subunits
      const amountInSmallestUnit = Math.round(parsedAmount * subunit);

      // Silently capture location (non-blocking if denied)
      const location = await captureLocation();

      await addTransaction(
        {
          accountId: selectedAccountId,
          type: txType,
          amount: amountInSmallestUnit,
          currency,
          description: description.trim(),
          categoryId: selectedCategoryId,
          latitude: location?.latitude,
          longitude: location?.longitude,
        },
        selectedAccount?.type
      );

      await updateLastUsed(selectedAccountId);
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  }

  const accentColor = txType === 'credit' ? colors.credit : colors.debit;
  const typeLabel = txType === 'credit' ? 'Income / Credit' : 'Expense / Debit';

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.dismissArea} onPress={() => router.back()} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        <Text style={[styles.title, { color: accentColor }]}>{typeLabel}</Text>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Account */}
          <Text style={styles.label}>Account</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {accounts.map(acc => (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.chip,
                  selectedAccountId === acc.id && { backgroundColor: accentColor },
                ]}
                onPress={() => setSelectedAccountId(acc.id)}
              >
                <Text style={[
                  styles.chipText,
                  selectedAccountId === acc.id && styles.chipTextActive,
                ]}>
                  {acc.icon} {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
            {accounts.length === 0 && (
              <Text style={styles.emptyNote}>No accounts — add one in Accounts tab first</Text>
            )}
          </ScrollView>

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            value={amountText}
            onChangeText={setAmountText}
            placeholder={`0.00 ${selectedAccount?.currency ?? ''}`}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            selectionColor={accentColor}
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="What was this for?"
            placeholderTextColor={colors.textMuted}
            selectionColor={accentColor}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && { backgroundColor: cat.color + '33', borderColor: cat.color },
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Ionicons
                  name={cat.icon as IoniconsName}
                  size={16}
                  color={selectedCategoryId === cat.id ? cat.color : colors.textSecondary}
                />
                <Text style={[
                  styles.categoryLabel,
                  selectedCategoryId === cat.id && { color: cat.color },
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: accentColor }, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismissArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: fontSize.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  emptyNote: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  submitBtn: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  bottomPad: {
    height: spacing.xl,
  },
});
