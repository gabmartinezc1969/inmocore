import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';

export default function TabsLayout() {
  const c = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textFaint,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: 62, paddingBottom: 8, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="cuentas" options={{ title: 'Cuentas', tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} /> }} />
      <Tabs.Screen name="movimientos" options={{ title: 'Movimientos', tabBarIcon: ({ color, size }) => <Ionicons name="swap-vertical" size={size} color={color} /> }} />
      <Tabs.Screen name="mas" options={{ title: 'Más', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }} />
    </Tabs>
  );
}
