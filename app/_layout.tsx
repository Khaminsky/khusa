import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { initDatabase } from '@/services/Database';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCurrencyStore } from '@/stores/useCurrencyStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { colors } from '@/constants/tokens';

export default function RootLayout() {
  const loadAccounts = useAccountStore(s => s.loadAccounts);
  const loadDefaultCurrency = useCurrencyStore(s => s.loadDefaultCurrency);
  const loadCategories = useCategoryStore(s => s.loadCategories);

  useEffect(() => {
    (async () => {
      await initDatabase();
      await Promise.all([loadAccounts(), loadDefaultCurrency(), loadCategories()]);
    })();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modals/transaction"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modals/add-account"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="modals/category"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="account/[id]"
          options={{ headerShown: false }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
