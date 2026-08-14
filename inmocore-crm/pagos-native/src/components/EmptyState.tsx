import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';

export default function EmptyState({ icon = 'file-tray-outline', title, subtitle }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  const c = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={30} color={c.textFaint} />
      <Text style={[styles.title, { color: c.textMuted }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: c.textFaint }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28, gap: 6 },
  title: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12.5, textAlign: 'center', paddingHorizontal: 20 },
});
