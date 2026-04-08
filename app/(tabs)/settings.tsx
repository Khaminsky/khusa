import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ListRenderItem } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { colors, fontSize, fontWeight, spacing, radius } from '@/constants/tokens';
import type { Category } from '@/types';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function SettingsScreen() {
  const { categories, deleteCategory, canDeleteCategory } = useCategoryStore();

  async function handleDelete(category: Category) {
    const deletable = await canDeleteCategory(category.id);
    if (!deletable) {
      Alert.alert(
        'Cannot Delete',
        `"${category.name}" is used by existing transactions. Remove those transactions first.`
      );
      return;
    }
    Alert.alert(
      'Delete Category',
      `Delete "${category.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(category.id),
        },
      ]
    );
  }

  const renderCategory: ListRenderItem<Category> = ({ item }) => (
    <View style={styles.categoryRow}>
      <View style={[styles.iconBadge, { backgroundColor: item.color + '33', borderColor: item.color + '66' }]}>
        <Ionicons name={item.icon as IoniconsName} size={18} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      {item.isDefault && <Text style={styles.defaultBadge}>default</Text>}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => router.push({ pathname: '/modals/category', params: { id: item.id } })}
      >
        <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
      {!item.isDefault && (
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="close-outline" size={16} color={colors.debit} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={c => c.id}
        renderItem={renderCategory}
        ListHeaderComponent={
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => router.push('/modals/category')}
              >
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListFooterComponent={<PlaceholderSection />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function PlaceholderSection() {
  return (
    <View style={styles.placeholderSection}>
      <Text style={styles.placeholderTitle}>More settings coming soon</Text>
      <Text style={styles.placeholderSubtitle}>
        Default currency, export, exchange rates, and preferences will be added in Phase 7.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
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
  list: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
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
  categoryRow: {
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
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },
  defaultBadge: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginRight: spacing.xs,
  },
  editBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  deleteBtn: {
    padding: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.debit + '22',
  },
  placeholderSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  placeholderTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  placeholderSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
