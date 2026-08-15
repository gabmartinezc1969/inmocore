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
        <Stack.Screen name="informes" options={{ headerShown: false }} />
        <Stack.Screen name="resumen" options={{ title: 'Resumen mensual' }} />
        <Stack.Screen name="anual" options={{ title: 'Dashboard anual' }} />
        <Stack.Screen name="ingresos" options={{ title: 'Ingresos' }} />
        <Stack.Screen name="gastos" options={{ title: 'Gastos' }} />
        <Stack.Screen name="deudas" options={{ title: 'Créditos y deudas' }} />
        <Stack.Screen name="patrimonio" options={{ title: 'Patrimonio y score' }} />
        <Stack.Screen name="inversiones" options={{ title: 'Inversiones' }} />
        <Stack.Screen name="suscripciones" options={{ title: 'Suscripciones' }} />
        <Stack.Screen name="recordatorios" options={{ title: 'Recordatorios' }} />
        <Stack.Screen name="alertas" options={{ title: 'Alertas' }} />
        <Stack.Screen name="configuracion" options={{ title: 'Configuración' }} />
        <Stack.Screen name="acerca" options={{ title: 'Acerca de esta app' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
