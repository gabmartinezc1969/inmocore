import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';
import { catColor } from '@/src/theme/colors';
import { fmtMoney, fmtDateShort } from '@/src/utils/format';
import { Movimiento } from '@/src/types/models';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Tarjeta bancaria': 'card-outline',
  Hipotecario: 'home-outline',
  Mantenimiento: 'construct-outline',
  Seguro: 'shield-checkmark-outline',
  'Credito automotriz': 'car-outline',
  Predial: 'business-outline',
  'Arreglos Casa': 'hammer-outline',
  Varios: 'basket-outline',
  Creditos: 'cash-outline',
  Tenencia: 'document-text-outline',
  Servicios: 'flash-outline',
  'Gastos medicos': 'medkit-outline',
  Auto: 'car-sport-outline',
  Percepcion: 'briefcase-outline',
  Inversion: 'trending-up-outline',
  Renta: 'key-outline',
};

export function categoryIcon(categoria: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICONS[categoria] ?? (categoria in CATEGORY_ICONS ? CATEGORY_ICONS[categoria] : 'ellipse-outline');
}

export default function TransactionRow({ item, onPress }: { item: Movimiento; onPress?: () => void }) {
  const c = useTheme();
  const color = catColor(item.categoria);
  const isIncome = item.tipo === 'I';
  const pending = item.monto === null;
  // A gasto only counts as settled ("Pagado") when what was actually paid
  // matches the expense's own amount exactly — a real payment that doesn't
  // match still shows as an outstanding expense (red/negative), not paid.
  const paidExpense = !isIncome && !pending && item.monto === item.presupuesto;
  const positive = isIncome || paidExpense;
  // A pending gasto still has a known amount (presupuesto) — show that
  // figure in red instead of just the word "Pendiente". Pending income
  // keeps the plain "Pendiente" label (there's no "owed" amount to redden).
  const pendingGasto = !isIncome && pending;

  let amountColor: string;
  let amountText: string;
  if (pendingGasto) {
    amountColor = c.expense;
    amountText = `− ${fmtMoney(Math.abs(item.presupuesto || 0))}`;
  } else if (pending) {
    amountColor = c.textFaint;
    amountText = 'Pendiente';
  } else {
    amountColor = positive ? c.income : c.expense;
    amountText = `${positive ? '+' : '−'} ${fmtMoney(Math.abs(item.monto || 0))}`;
  }

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={categoryIcon(item.categoria)} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.concepto, { color: c.text }]} numberOfLines={1}>{item.concepto}</Text>
        <Text style={[styles.meta, { color: c.textFaint }]} numberOfLines={1}>
          {item.categoria} · {fmtDateShort(item.fecha)}
          {paidExpense ? <Text style={{ color: c.income, fontWeight: '800' }}> · ✓ Pagado</Text> : null}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>{amountText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  concepto: { fontSize: 14.5, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 13.5, fontWeight: '800' },
});
