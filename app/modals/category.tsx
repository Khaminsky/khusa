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
import { useCategoryStore } from '@/stores/useCategoryStore';
import { CATEGORY_ICON_OPTIONS } from '@/constants/icons';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#6b7280', '#14b8a6',
];

export default function CategoryModal() {
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(params.id);

  const { categories, addCategory, updateCategory } = useCategoryStore();
  const existing = categories.find(c => c.id === params.id);

  const [name, setName] = useState(existing?.name ?? '');
  const [selectedIcon, setSelectedIcon] = useState<string>(existing?.icon ?? CATEGORY_ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(existing?.color ?? PRESET_COLORS[5]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setSelectedIcon(existing.icon);
      setSelectedColor(existing.color);
    }
  }, [existing?.id]);

  async function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && params.id) {
        await updateCategory(params.id, { name: trimmedName, icon: selectedIcon, color: selectedColor });
      } else {
        await addCategory({ name: trimmedName, icon: selectedIcon, color: selectedColor });
      }
      router.back();
    } catch {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} category`);
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
        <Text style={styles.title}>{isEditing ? 'Edit Category' : 'New Category'}</Text>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Icon preview */}
          <View style={styles.iconPreview}>
            <View style={[styles.iconBadge, { backgroundColor: selectedColor + '33', borderColor: selectedColor + '66' }]}>
              <Ionicons name={selectedIcon as IoniconsName} size={32} color={selectedColor} />
            </View>
          </View>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Groceries"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
          />

          {/* Icon picker */}
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {CATEGORY_ICON_OPTIONS.map(iconName => {
              const isSelected = selectedIcon === iconName;
              return (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconOption,
                    isSelected && { borderColor: selectedColor, backgroundColor: selectedColor + '22' },
                  ]}
                  onPress={() => setSelectedIcon(iconName)}
                >
                  <Ionicons
                    name={iconName as IoniconsName}
                    size={22}
                    color={isSelected ? selectedColor : colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Color */}
          <Text style={styles.label}>Color</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
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
          <Text style={styles.submitText}>
            {submitting
              ? (isEditing ? 'Saving…' : 'Creating…')
              : (isEditing ? 'Save Changes' : 'Create Category')}
          </Text>
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
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  form: {
    flex: 1,
  },
  iconPreview: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  iconOption: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
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
