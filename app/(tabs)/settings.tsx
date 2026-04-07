import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '@/constants/tokens';

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings — coming in Phase 7</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  text: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
});
