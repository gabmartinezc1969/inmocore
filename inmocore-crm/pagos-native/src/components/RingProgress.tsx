import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/src/store/hooks';

// Compact full-circle progress ring — mirrors the "75% · your credit limit"
// card from the reference mock.
export default function RingProgress({ pct, size = 56, strokeWidth = 6, color }: { pct: number; size?: number; strokeWidth?: number; color?: string }) {
  const c = useTheme();
  const clamped = Math.max(0, Math.min(1, pct));
  const ringColor = color ?? (clamped > 0.95 ? c.expense : clamped > 0.8 ? c.warning : c.income);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = clamped * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.border} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={ringColor} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`} strokeLinecap="round"
          rotation={-90} origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.pct, { color: c.text, fontSize: size * 0.24 }]}>{Math.round(clamped * 100)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pct: { fontWeight: '800' },
});
