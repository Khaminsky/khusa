import { useState } from 'react';
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
import { router } from 'expo-router';
import { useAccountStore } from '@/stores/useAccountStore';
import { CURRENCIES, DEFAULT_CURRENCY } from '@/constants/currencies';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { AccountType } from '@/types';

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string; description: string }[] = [
  { type: 'cash',         label: 'Cash',         icon: '💵', description: 'Physical money in hand' },
  { type: 'bank',         label: 'Bank',          icon: '🏦', description: 'Bank account or savings' },
  { type: 'mobile_money', label: 'Mobile Money',  icon: '📱', description: 'Airtel Money, TNM Mpamba, etc.' },
  { type: 'credit',       label: 'Credit',        icon: '💳', description: 'Credit card or line of credit' },
];

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#14b8a6',
];

const MOBILE_MONEY_SUGGESTIONS = ['Airtel Money', 'TNM Mpamba'];

export default function AddAccountModal() {
  const addAccount = useAccountStore(s => s.addAccount);

  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<AccountType>('cash');
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[5]); // blue default
  const [submitting, setSubmitting] = useState(false);

  const typeConfig = ACCOUNT_TYPES.find(t => t.type === selectedType)!;

  function applyNameSuggestion(suggestion: string) {
    setName(suggestion);
  }

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setSubmitting(true);
    try {
      await addAccount({
        name: trimmed,
        type: selectedType,
        currency: selectedCurrency,
        color: selectedColor,
        icon: typeConfig.icon,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.dismissArea} onPress={() => router.back()} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>New Account</Text>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Account Type */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map(t => (
              <TouchableOpacity
                key={t.type}
                style={[styles.typeCard, selectedType === t.type && styles.typeCardActive]}
                onPress={() => {
                  setSelectedType(t.type);
                  if (t.type === 'credit') setSelectedColor('#ef4444');
                  else if (t.type === 'mobile_money') setSelectedColor('#22c55e');
                  else if (t.type === 'bank') setSelectedColor('#3b82f6');
                  else setSelectedColor('#eab308');
                }}
              >
                <Text style={styles.typeIcon}>{t.icon}</Text>
                <Text style={[styles.typeLabel, selectedType === t.type && styles.typeLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.typeDescription}>{typeConfig.description}</Text>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={`e.g. ${selectedType === 'mobile_money' ? 'Airtel Money' : selectedType === 'bank' ? 'NBS Account' : selectedType === 'credit' ? 'Visa Card' : 'Wallet'}`}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            selectionColor={selectedColor}
          />
          {selectedType === 'mobile_money' && (
            <View style={styles.suggestions}>
              {MOBILE_MONEY_SUGGESTIONS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={styles.suggestion}
                  onPress={() => applyNameSuggestion(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Currency */}
          <Text style={styles.label}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {CURRENCIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.chip,
                  selectedCurrency === c.code && { backgroundColor: selectedColor, borderColor: selectedColor },
                ]}
                onPress={() => setSelectedCurrency(c.code)}
              >
                <Text style={[
                  styles.chipText,
                  selectedCurrency === c.code && styles.chipTextActive,
                ]}>
                  {c.symbol} {c.code}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorDotSelected,
                ]}
                onPress={() => setSelectedColor(c)}
              />
            ))}
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: selectedColor }, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? 'Creating…' : 'Create Account'}</Text>
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
    maxHeight: '92%',
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
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
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
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  typeCardActive: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.surfaceElevated,
  },
  typeIcon: {
    fontSize: 22,
  },
  typeLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  typeDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
  suggestions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  suggestion: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  suggestionText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
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
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: colors.white,
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
