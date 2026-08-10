import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/store/hooks';

export interface Bar { label: string; value: number; color?: string }

export default function BarChart({ data, height = 160 }: { data: Bar[]; height?: number }) {
  const c = useTheme();
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={[styles.row, { height }]}>
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / max) * (height - 26));
        return (
          <View key={i} style={styles.col}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={[styles.bar, { height: h, backgroundColor: d.color ?? c.primary }]} />
            </View>
            <Text style={[styles.label, { color: c.textFaint }]} numberOfLines={1}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  col: { flex: 1, alignItems: 'center', height: '100%' },
  bar: { width: '62%', minWidth: 8, borderRadius: 6, alignSelf: 'center' },
  label: { fontSize: 10, marginTop: 6 },
});
