import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import EmptyState from '@/src/components/EmptyState';
import Badge from '@/src/components/Badge';
import Button from '@/src/components/Button';
import Sheet from '@/src/components/Sheet';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { pendingItems, PendingItem } from '@/src/utils/finance';
import { fmtMoney, fmtDateShort } from '@/src/utils/format';

function estadoOf(diffDays: number): { label: string; tone: 'expense' | 'warning' | 'neutral' } {
  if (diffDays < 0) return { label: `Vencido hace ${Math.abs(diffDays)} día${Math.abs(diffDays) === 1 ? '' : 's'}`, tone: 'expense' };
  if (diffDays === 0) return { label: 'Vence hoy', tone: 'warning' };
  if (diffDays <= 7) return { label: `Vence en ${diffDays} día${diffDays === 1 ? '' : 's'}`, tone: 'warning' };
  return { label: 'Programado', tone: 'neutral' };
}

// Defined at module scope (not inside RecordatoriosScreen) so it keeps a
// stable component identity across renders. A component re-declared inside
// a parent's render body gets a brand-new type on every render, which makes
// React unmount + remount the whole subtree whenever the parent re-renders —
// if that happens mid-gesture (very easy to hit, since selecting a row is
// itself a re-render-triggering state change) the touch responder can lose
// the press before onPress ever fires, which is why the rows read as
// "not tappable".
function ReminderGroup({
  title, items, tone, onSelect,
}: {
  title: string;
  items: PendingItem[];
  tone: 'expense' | 'warning' | 'neutral';
  onSelect: (p: PendingItem) => void;
}) {
  const c = useTheme();
  if (!items.length) return null;
  return (
    <Card>
      <View style={styles.rowBetween}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        <Badge text={String(items.length)} tone={tone} />
      </View>
      {items.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onSelect(p)}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          hitSlop={4}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{p.concepto}</Text>
            <Text style={[styles.meta, { color: c.textFaint }]}>{p.categoria} · {fmtDateShort(p.fecha)}</Text>
          </View>
          <Text style={[styles.amount, { color: c.expense }]}>{fmtMoney(p.presupuesto)}</Text>
          <Ionicons name="chevron-forward" size={16} color={c.textFaint} style={{ marginLeft: 6 }} />
        </Pressable>
      ))}
    </Card>
  );
}

export default function RecordatoriosScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const updateMovimiento = useStore((s) => s.updateMovimiento);
  const pending = useMemo(() => pendingItems(ledger), [ledger]);
  const vencidos = pending.filter((p) => p.diffDays < 0);
  const proximos = pending.filter((p) => p.diffDays >= 0 && p.diffDays <= 7);
  const futuros = pending.filter((p) => p.diffDays > 7);

  const [selected, setSelected] = useState<PendingItem | null>(null);

  // Marking a reminder as paid sets its real payment (monto) to exactly its
  // expected amount (presupuesto) — the same exact-match rule Movimientos
  // uses to decide whether a gasto counts as "Pagado".
  const markPaid = (p: PendingItem) => {
    updateMovimiento(p.id, {
      fecha: p.fecha,
      tipo: p.tipo,
      categoria: p.categoria,
      concepto: p.concepto,
      presupuesto: p.presupuesto,
      monto: p.presupuesto,
      metodoPago: p.metodoPago,
      deducible: p.deducible,
    });
    setSelected(null);
  };

  const selectedEstado = selected ? estadoOf(selected.diffDays) : null;

  return (
    <Screen edges={[]}>
      <ReminderGroup title="Vencidos" items={vencidos} tone="expense" onSelect={setSelected} />
      <ReminderGroup title="Próximos 7 días" items={proximos} tone="warning" onSelect={setSelected} />
      <ReminderGroup title="Programados" items={futuros} tone="neutral" onSelect={setSelected} />
      {!pending.length && <EmptyState icon="notifications-outline" title="Sin pagos pendientes" subtitle="Los movimientos con presupuesto y sin monto real aparecen aquí" />}

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.concepto ?? 'Recordatorio'}>
        {selected && selectedEstado ? (
          <View style={styles.detail}>
            <Badge text={selectedEstado.label} tone={selectedEstado.tone} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: c.textMuted }]}>Categoría</Text>
              <Text style={[styles.detailValue, { color: c.text }]}>{selected.categoria}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: c.textMuted }]}>Fecha</Text>
              <Text style={[styles.detailValue, { color: c.text }]}>{fmtDateShort(selected.fecha)}</Text>
            </View>
            {selected.metodoPago ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: c.textMuted }]}>Método de pago</Text>
                <Text style={[styles.detailValue, { color: c.text }]}>{selected.metodoPago}</Text>
              </View>
            ) : null}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: c.textMuted }]}>Monto pendiente</Text>
              <Text style={[styles.detailAmount, { color: c.expense }]}>{fmtMoney(selected.presupuesto)}</Text>
            </View>

            <Button
              label="Marcar como pagado"
              icon="checkmark-circle"
              onPress={() => markPaid(selected)}
              style={{ backgroundColor: c.income, borderColor: c.income }}
            />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  name: { fontSize: 13.5, fontWeight: '700' },
  meta: { fontSize: 11.5, marginTop: 2 },
  amount: { fontSize: 13.5, fontWeight: '800' },
  detail: { gap: 14 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 13, fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: '700' },
  detailAmount: { fontSize: 18, fontWeight: '800' },
});
