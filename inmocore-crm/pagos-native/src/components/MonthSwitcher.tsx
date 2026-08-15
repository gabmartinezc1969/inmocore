import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';
import { CONFIG } from '@/src/config/config';
import { pressedStyle } from '@/src/utils/press';

export default function MonthSwitcher({ year, monthIdx, onChange }: { year: number; monthIdx: number; onChange: (year: number, monthIdx: number) => void }) {
  const c = useTheme();
  const go = (delta: number) => {
    let m = monthIdx + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    onChange(y, m);
  };
  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      <Pressable onPress={() => go(-1)} hitSlop={8} style={({ pressed }) => pressedStyle(pressed)}><Ionicons name="chevron-back" size={18} color={c.textMuted} /></Pressable>
      <Text style={[styles.label, { color: c.text }]}>{CONFIG.months[monthIdx]} {year}</Text>
      <Pressable onPress={() => go(1)} hitSlop={8} style={({ pressed }) => pressedStyle(pressed)}><Ionicons name="chevron-forward" size={18} color={c.textMuted} /></Pressable>
    </View>
  );
}

export function YearSwitcher({ year, onChange }: { year: number; onChange: (year: number) => void }) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      <Pressable onPress={() => onChange(year - 1)} hitSlop={8} style={({ pressed }) => pressedStyle(pressed)}><Ionicons name="chevron-back" size={18} color={c.textMuted} /></Pressable>
      <Text style={[styles.label, { color: c.text }]}>{year}</Text>
      <Pressable onPress={() => onChange(year + 1)} hitSlop={8} style={({ pressed }) => pressedStyle(pressed)}><Ionicons name="chevron-forward" size={18} color={c.textMuted} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize', minWidth: 90, textAlign: 'center' },
});
