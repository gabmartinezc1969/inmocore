import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import EmptyState from '@/src/components/EmptyState';
import Badge from '@/src/components/Badge';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { pendingItems } from '@/src/utils/finance';
import { fmtMoney, fmtDateShort } from '@/src/utils/format';

export default function RecordatoriosScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const pending = useMemo(() => pendingItems(ledger), [ledger]);
  const vencidos = pending.filter((p) => p.diffDays < 0);
  const proximos = pending.filter((p) => p.diffDays >= 0 && p.diffDays <= 7);
  const futuros = pending.filter((p) => p.diffDays > 7);

  const Group = ({ title, items, tone }: { title: string; items: typeof pending; tone: 'expense' | 'warning' | 'neutral' }) => items.length ? (
    <Card>
      <View style={styles.rowBetween}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        <Badge text={String(items.length)} tone={tone} />
      </View>
      {items.map((p) => (
        <View key={p.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{p.concepto}</Text>
            <Text style={[styles.meta, { color: c.textFaint }]}>{p.categoria} · {fmtDateShort(p.fecha)}</Text>
          </View>
          <Text style={[styles.amount, { color: c.text }]}>{fmtMoney(p.presupuesto)}</Text>
        </View>
      ))}
    </Card>
  ) : null;

  return (
    <Screen edges={['bottom']}>
      <Group title="Vencidos" items={vencidos} tone="expense" />
      <Group title="Próximos 7 días" items={proximos} tone="warning" />
      <Group title="Programados" items={futuros} tone="neutral" />
      {!pending.length && <EmptyState icon="notifications-outline" title="Sin pagos pendientes" subtitle="Los movimientos con presupuesto y sin monto real aparecen aquí" />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  name: { fontSize: 13.5, fontWeight: '700' },
  meta: { fontSize: 11.5, marginTop: 2 },
  amount: { fontSize: 13.5, fontWeight: '800' },
});
