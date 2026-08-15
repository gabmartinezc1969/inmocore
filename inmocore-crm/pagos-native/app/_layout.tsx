import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';

export default function RootLayout() {
  const c = useTheme();
  const theme = useStore((s) => s.settings.theme);

  return (
    // Every screen uses <SafeAreaView>/useSafeAreaInsets() to stay clear of
    // the status bar, notch and home indicator — that only works with a
    // SafeAreaProvider at the root; without it insets silently fall back to
    // zero and content draws under the system UI.
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          headerTitleStyle: { fontWeight: '800', fontSize: 16 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* headerShown: false everywhere below — each screen renders its own
            ScreenHeader inside a safe-area-aware Screen instead of relying
            on the native Stack header (see ScreenHeader.tsx for why). */}
        <Stack.Screen name="informes" options={{ headerShown: false }} />
        <Stack.Screen name="resumen" options={{ headerShown: false }} />
        <Stack.Screen name="anual" options={{ headerShown: false }} />
        <Stack.Screen name="ingresos" options={{ headerShown: false }} />
        <Stack.Screen name="gastos" options={{ headerShown: false }} />
        <Stack.Screen name="deudas" options={{ headerShown: false }} />
        <Stack.Screen name="patrimonio" options={{ headerShown: false }} />
        <Stack.Screen name="inversiones" options={{ headerShown: false }} />
        <Stack.Screen name="suscripciones" options={{ headerShown: false }} />
        <Stack.Screen name="recordatorios" options={{ headerShown: false }} />
        <Stack.Screen name="alertas" options={{ headerShown: false }} />
        <Stack.Screen name="configuracion" options={{ headerShown: false }} />
        <Stack.Screen name="acerca" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
