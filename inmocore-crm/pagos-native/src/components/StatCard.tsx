import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { useTheme } from '@/src/store/hooks';

export default function StatCard({
  icon, label, value, tone = 'neutral', hint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone?: 'neutral' | 'income' | 'expense' | 'warning';
  hint?: string;
}) {
  const c = useTheme();
  const toneColor = tone === 'income' ? c.income : tone === 'expense' ? c.expense : tone === 'warning' ? c.warning : c.primary;
  const toneSoft = tone === 'income' ? c.incomeSoft : tone === 'expense' ? c.expenseSoft : tone === 'warning' ? c.warningSoft : c.primarySoft;
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: toneSoft }]}>
        <Ionicons name={icon} size={18} color={toneColor} />
      </View>
      <Text style={[styles.label, { color: c.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, { color: c.text }]} numberOfLines={1}>{value}</Text>
      {hint ? <Text style={[styles.hint, { color: toneColor }]} numberOfLines={1}>{hint}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 150, gap: 6 },
  iconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 19, fontWeight: '800' },
  hint: { fontSize: 11, fontWeight: '700' },
});
