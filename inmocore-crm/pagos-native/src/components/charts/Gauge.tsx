import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/src/store/hooks';

// Half-circle 0-100 score gauge (Patrimonio y Score).
export default function Gauge({ value, label, size = 180 }: { value: number; label: string; size?: number }) {
  const c = useTheme();
  const color = value >= 80 ? c.income : value >= 60 ? c.primary : value >= 40 ? c.warning : c.expense;
  const r = size / 2 - 14;
  const cx = size / 2, cy = size / 2;
  const startAngle = Math.PI;
  const endAngle = Math.PI - (value / 100) * Math.PI;

  const arcPath = (a0: number, a1: number, radius: number) => {
    const x0 = cx + radius * Math.cos(a0), y0 = cy - radius * Math.sin(a0);
    const x1 = cx + radius * Math.cos(a1), y1 = cy - radius * Math.sin(a1);
    const large = Math.abs(a0 - a1) > Math.PI ? 1 : 0;
    return `M${x0},${y0} A${radius},${radius} 0 ${large} ${a0 > a1 ? 1 : 0} ${x1},${y1}`;
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size / 2 + 20}>
        <Path d={arcPath(Math.PI, 0, r)} stroke={c.border} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path d={arcPath(startAngle, endAngle, r)} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.value, { color: c.text }]}>{Math.round(value)}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: '38%', alignItems: 'center' },
  value: { fontSize: 34, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', marginTop: 2 },
});
