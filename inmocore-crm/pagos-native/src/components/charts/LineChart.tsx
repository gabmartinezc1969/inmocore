import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line as SvgLine } from 'react-native-svg';
import { useTheme } from '@/src/store/hooks';
import { fmtMoney } from '@/src/utils/format';

export interface LineSeries { data: number[]; color: string; area?: boolean }

// Lightweight multi-series line chart in the style of the reference mock:
// smooth-ish polylines, optional gradient area fill under the first series,
// and a tappable point that pops a value bubble (mirrors the "$2,392"
// callout in the balance screen).
export default function LineChart({ labels, series, height = 180 }: { labels: string[]; series: LineSeries[]; height?: number }) {
  const c = useTheme();
  const [width, setWidth] = useState(0);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const allValues = series.flatMap((s) => s.data);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;
  const padTop = 24, padBottom = 22;
  const innerH = height - padTop - padBottom;
  const n = labels.length;
  const stepX = n > 1 ? width / (n - 1) : width;

  const toXY = (arr: number[]) => arr.map((v, i) => ({
    x: n > 1 ? i * stepX : width / 2,
    y: padTop + innerH - ((v - min) / range) * innerH,
  }));

  const pathFor = (pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  };

  const areaFor = (pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    const base = padTop + innerH;
    return `M${pts[0].x.toFixed(1)},${base} ` + pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1].x.toFixed(1)},${base} Z`;
  };

  const active = activeIdx !== null ? series[0]?.data[activeIdx] : undefined;
  const activeX = activeIdx !== null && width ? (n > 1 ? activeIdx * stepX : width / 2) : 0;

  return (
    <View>
      {activeIdx !== null && active !== undefined ? (
        <View style={[styles.bubble, { left: Math.max(0, Math.min(width - 90, activeX - 45)), backgroundColor: c.primary }]}>
          <Text style={styles.bubbleText}>{fmtMoney(active)}</Text>
        </View>
      ) : null}
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={series[0]?.color ?? c.primary} stopOpacity={0.28} />
                <Stop offset="1" stopColor={series[0]?.color ?? c.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <SvgLine key={f} x1={0} x2={width} y1={padTop + innerH * f} y2={padTop + innerH * f} stroke={c.border} strokeWidth={1} />
            ))}
            {series.map((s, si) => {
              const pts = toXY(s.data);
              return (
                <React.Fragment key={si}>
                  {s.area ? <Path d={areaFor(pts)} fill="url(#areaFill)" /> : null}
                  <Path d={pathFor(pts)} stroke={s.color} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </React.Fragment>
              );
            })}
            {activeIdx !== null && series[0] ? (
              <Circle cx={toXY(series[0].data)[activeIdx]?.x} cy={toXY(series[0].data)[activeIdx]?.y} r={5} fill={c.surface} stroke={series[0].color} strokeWidth={3} />
            ) : null}
          </Svg>
        )}
        {width > 0 && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {labels.map((_, i) => (
                <Pressable key={i} style={{ flex: 1 }} onPress={() => setActiveIdx(i === activeIdx ? null : i)} />
              ))}
            </View>
          </View>
        )}
      </View>
      <View style={styles.labelsRow}>
        {labels.map((l, i) => (
          <Text key={i} style={[styles.labelText, { color: i === activeIdx ? c.primary : c.textFaint, fontWeight: i === activeIdx ? '800' : '600' }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', top: -8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 2, width: 90, alignItems: 'center' },
  bubbleText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelText: { fontSize: 11 },
});
