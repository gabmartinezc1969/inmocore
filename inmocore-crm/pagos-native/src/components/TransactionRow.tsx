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
  // Treat an explicit 0 the same as "sin dato" (null): a lot of the real
  // ledger's future/unconfirmed rows are stored as monto=0 rather than
  // null, and showing those as a real "−$0" expense in red reads as an
  // actual (if tiny) charge instead of "nothing happened here yet".
  const pending = item.monto === null || item.monto === 0;
  const paidAsBudgeted = !pending && item.presupuesto > 0 && item.monto === item.presupuesto;

  let statusLabel: string | null = null;
  let statusColor = c.textFaint;
  let amountText: string;
  let amountColor: string;
  if (pending) {
    // A pending row hasn't happened yet — show what's expected to be
    // paid/received (the budget) instead of a bare "Pendiente" with no
    // number to act on.
    statusLabel = 'Pendiente';
    amountText = fmtMoney(item.presupuesto);
    amountColor = c.textFaint;
  } else if (paidAsBudgeted) {
    statusLabel = 'Pagado';
    statusColor = c.income;
    amountText = `${isIncome ? '+' : '−'} ${fmtMoney(Math.abs(item.monto || 0))}`;
    amountColor = isIncome ? c.income : c.expense;
  } else {
    amountText = `${isIncome ? '+' : '−'} ${fmtMoney(Math.abs(item.monto || 0))}`;
    amountColor = isIncome ? c.income : c.expense;
  }

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={categoryIcon(item.categoria)} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.concepto, { color: c.text }]} numberOfLines={1}>{item.concepto}</Text>
        <Text style={[styles.meta, { color: c.textFaint }]} numberOfLines={1}>{item.categoria} · {fmtDateShort(item.fecha)}</Text>
      </View>
      <View style={styles.amountWrap}>
        {statusLabel ? <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text> : null}
        <Text style={[styles.amount, { color: amountColor }]}>{amountText}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  concepto: { fontSize: 14.5, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2 },
  amountWrap: { alignItems: 'flex-end' },
  status: { fontSize: 11, fontWeight: '700', marginBottom: 1 },
  amount: { fontSize: 13.5, fontWeight: '800' },
});
