import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '@/src/store/hooks';
import { fmtMoney } from '@/src/utils/format';

export interface DonutSlice { label: string; value: number; color: string }

export default function DonutChart({ data, size = 150, strokeWidth = 20, centerLabel }: { data: DonutSlice[]; size?: number; strokeWidth?: number; centerLabel?: string }) {
  const c = useTheme();
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offsetAcc = 0;

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={c.border} strokeWidth={strokeWidth} fill="none" />
            {total > 0 && data.map((d, i) => {
              const frac = d.value / total;
              const dash = frac * circumference;
              const el = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={d.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offsetAcc}
                  strokeLinecap="butt"
                />
              );
              offsetAcc += dash;
              return el;
            })}
          </G>
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <Text style={[styles.centerLabel, { color: c.text }]} numberOfLines={1}>{centerLabel ?? fmtMoney(total)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {data.slice(0, 6).map((d, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <Text style={[styles.legendLabel, { color: c.textMuted }]} numberOfLines={1}>{d.label}</Text>
            <Text style={[styles.legendValue, { color: c.text }]}>{total ? Math.round((d.value / total) * 100) : 0}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  centerLabel: { fontSize: 13, fontWeight: '800' },
  legend: { flex: 1, minWidth: 130, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { fontSize: 12.5, flex: 1 },
  legendValue: { fontSize: 12.5, fontWeight: '700' },
});
