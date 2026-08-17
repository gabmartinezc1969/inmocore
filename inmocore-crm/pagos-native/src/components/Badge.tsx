import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { useTheme } from '@/src/store/hooks';

export default function Badge({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'income' | 'expense' | 'warning' }) {
  const c = useTheme();
  const bg = tone === 'income' ? c.incomeSoft : tone === 'expense' ? c.expenseSoft : tone === 'warning' ? c.warningSoft : c.primarySoft;
  const fg = tone === 'income' ? c.income : tone === 'expense' ? c.expense : tone === 'warning' ? c.warning : c.primary;
  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 11.5, fontWeight: '700' },
});
