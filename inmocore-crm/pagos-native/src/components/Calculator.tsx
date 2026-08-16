import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';

type Op = '+' | '−' | '×' | '÷';

function applyOp(a: number, b: number, op: Op): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? a : a / b;
  }
}

// Trims float noise (0.1 + 0.2 → 0.3, not 0.30000000000000004) without
// forcing a fixed number of decimals.
function cleanNumber(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e6) / 1e6;
}

function formatForDisplay(raw: string): string {
  const [intPart, decPart] = raw.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart !== undefined ? `${withThousands}.${decPart}` : withThousands;
}

const KEYS: (string | Op)[][] = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['C', '0', '.', '+'],
];

export default function Calculator({
  categoryLabel, initialValue, tone = 'expense', onConfirm, onCancel,
}: {
  categoryLabel: string;
  initialValue?: string;
  tone?: 'income' | 'expense';
  onConfirm: (value: number) => void;
  onCancel: () => void;
}) {
  const c = useTheme();
  const accentColor = tone === 'income' ? c.income : c.expense;
  const [display, setDisplay] = useState(initialValue && initialValue.trim() !== '' ? initialValue : '0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<Op | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(true);

  const inputDigit = (d: string) => {
    setDisplay((prev) => {
      if (justEvaluated) return d === '.' ? '0.' : d;
      if (d === '.' && prev.includes('.')) return prev;
      if (prev.length >= 12) return prev;
      if (prev === '0' && d !== '.') return d;
      return prev + d;
    });
    setJustEvaluated(false);
  };

  const chooseOperator = (op: Op) => {
    const current = parseFloat(display) || 0;
    if (operator && !justEvaluated) {
      const result = cleanNumber(applyOp(accumulator ?? 0, current, operator));
      setAccumulator(result);
      setDisplay(String(result));
    } else {
      setAccumulator(current);
    }
    setOperator(op);
    setJustEvaluated(true);
  };

  const clear = () => { setDisplay('0'); setAccumulator(null); setOperator(null); setJustEvaluated(true); };

  const backspace = () => setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));

  const finalValue = (): number => {
    const current = parseFloat(display) || 0;
    if (operator && accumulator !== null) return cleanNumber(applyOp(accumulator, current, operator));
    return current;
  };

  const handleKey = (key: string) => {
    if (key === 'C') return clear();
    if (key === '.') return inputDigit('.');
    if (['+', '−', '×', '÷'].includes(key)) return chooseOperator(key as Op);
    return inputDigit(key);
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.category, { color: c.textMuted }]} numberOfLines={1}>{categoryLabel}</Text>

      <View style={styles.displayRow}>
        <View style={{ flex: 1 }}>
          {operator ? (
            <Text style={[styles.pending, { color: c.textFaint }]}>
              {formatForDisplay(String(accumulator ?? 0))} {operator}
            </Text>
          ) : null}
          <Text style={[styles.display, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatForDisplay(display)}
          </Text>
        </View>
        <Pressable onPress={backspace} hitSlop={10} style={[styles.backspace, { backgroundColor: c.surfaceAlt }]}>
          <Ionicons name="backspace-outline" size={20} color={c.textMuted} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key) => {
              const isOp = ['+', '−', '×', '÷'].includes(key);
              const isClear = key === 'C';
              return (
                <Pressable
                  key={key}
                  onPress={() => handleKey(key)}
                  style={[
                    styles.key,
                    { backgroundColor: isOp ? accentColor : isClear ? c.expenseSoft : c.surfaceAlt },
                  ]}
                >
                  <Text style={[styles.keyText, { color: isOp ? '#fff' : isClear ? c.expense : c.text }]}>{key}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onCancel} style={[styles.cancelBtn, { borderColor: c.border }]}>
          <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancelar</Text>
        </Pressable>
        <Pressable onPress={() => onConfirm(finalValue())} style={[styles.okBtn, { backgroundColor: accentColor }]}>
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.okText}>OK</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  category: { fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  displayRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  pending: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  display: { fontSize: 44, fontWeight: '800' },
  backspace: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  key: { flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 20, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' },
  okBtn: { flex: 2, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  okText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
