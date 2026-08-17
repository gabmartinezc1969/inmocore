import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useTheme } from '@/src/store/hooks';
import { pressedStyle } from '@/src/utils/press';
import { fmtMoney2 } from '@/src/utils/format';

type Op = '+' | '−' | '×' | '÷';

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : a;
  }
}

// Inline four-function calculator used to enter a movimiento's amount —
// surfaces right after picking a category (see MovimientoForm) so the
// most common next step (typing the amount) doesn't need the system
// keyboard. Confirming with OK hands the final number back and the
// calculator hides again.
export default function AmountCalculator({ initialValue, onConfirm, onCancel }: {
  initialValue?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
}) {
  const c = useTheme();
  const [display, setDisplay] = useState(initialValue && initialValue !== '0' ? initialValue : '0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [freshEntry, setFreshEntry] = useState(true);

  const pressDigit = (d: string) => {
    if (freshEntry) {
      setDisplay(d === '.' ? '0.' : d);
      setFreshEntry(false);
      return;
    }
    if (d === '.' && display.includes('.')) return;
    if (display.replace('.', '').length >= 10) return;
    setDisplay(display === '0' && d !== '.' ? d : display + d);
  };

  const pressOp = (op: Op) => {
    const current = parseFloat(display) || 0;
    if (accumulator !== null && pendingOp && !freshEntry) {
      const result = compute(accumulator, current, pendingOp);
      setAccumulator(result);
      setDisplay(String(result));
    } else {
      setAccumulator(current);
    }
    setPendingOp(op);
    setFreshEntry(true);
  };

  const pressClear = () => {
    setDisplay('0'); setAccumulator(null); setPendingOp(null); setFreshEntry(true);
  };

  const pressBackspace = () => {
    setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
  };

  const finalValue = () => {
    const current = parseFloat(display) || 0;
    if (accumulator !== null && pendingOp && !freshEntry) return compute(accumulator, current, pendingOp);
    return current;
  };

  const KEYS: { label: string; onPress: () => void; tone?: 'op' | 'muted' }[][] = [
    [
      { label: 'C', onPress: pressClear, tone: 'muted' },
      { label: '⌫', onPress: pressBackspace, tone: 'muted' },
      { label: '÷', onPress: () => pressOp('÷'), tone: 'op' },
      { label: '×', onPress: () => pressOp('×'), tone: 'op' },
    ],
    [
      { label: '7', onPress: () => pressDigit('7') },
      { label: '8', onPress: () => pressDigit('8') },
      { label: '9', onPress: () => pressDigit('9') },
      { label: '−', onPress: () => pressOp('−'), tone: 'op' },
    ],
    [
      { label: '4', onPress: () => pressDigit('4') },
      { label: '5', onPress: () => pressDigit('5') },
      { label: '6', onPress: () => pressDigit('6') },
      { label: '+', onPress: () => pressOp('+'), tone: 'op' },
    ],
    [
      { label: '1', onPress: () => pressDigit('1') },
      { label: '2', onPress: () => pressDigit('2') },
      { label: '3', onPress: () => pressDigit('3') },
      { label: '0', onPress: () => pressDigit('0') },
    ],
  ];

  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.text }]}>Monto del gasto</Text>
        {onCancel ? (
          <Pressable onPress={onCancel} hitSlop={10} style={({ pressed }) => pressedStyle(pressed)}>
            <Ionicons name="close" size={20} color={c.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.display}>
        {pendingOp && accumulator !== null && (
          <Text style={[styles.pending, { color: c.textFaint }]}>{fmtMoney2(accumulator)} {pendingOp}</Text>
        )}
        <Text style={[styles.displayValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {KEYS.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((k) => (
              <Pressable
                key={k.label}
                onPress={k.onPress}
                style={({ pressed }) => [
                  styles.key,
                  { backgroundColor: k.tone === 'op' ? c.primarySoft : k.tone === 'muted' ? 'transparent' : c.surface, borderColor: c.border },
                  pressedStyle(pressed),
                ]}
              >
                <Text style={[styles.keyLabel, { color: k.tone === 'op' ? c.primary : c.text }]}>{k.label}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <Pressable
            onPress={() => pressDigit('.')}
            style={({ pressed }) => [styles.key, { backgroundColor: c.surface, borderColor: c.border }, pressedStyle(pressed)]}
          >
            <Text style={[styles.keyLabel, { color: c.text }]}>.</Text>
          </Pressable>
          <View style={{ flex: 2 }} />
        </View>
      </View>

      <Button label="OK" icon="checkmark" onPress={() => onConfirm(String(finalValue()))} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '800' },
  display: { alignItems: 'flex-end', paddingVertical: 6 },
  pending: { fontSize: 12.5, fontWeight: '700' },
  displayValue: { fontSize: 34, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  keyLabel: { fontSize: 18, fontWeight: '700' },
});
