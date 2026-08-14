import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/store/hooks';

export default function ProgressBar({ pct, color, height = 8 }: { pct: number; color?: string; height?: number }) {
  const c = useTheme();
  const clamped = Math.max(0, Math.min(1, pct));
  const barColor = color ?? (clamped > 0.95 ? c.expense : clamped > 0.8 ? c.warning : c.income);
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: c.border }]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: barColor, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});
