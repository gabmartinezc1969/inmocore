import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '@/src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import EmptyState from '@/src/components/EmptyState';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { detectSubscriptions } from '@/src/utils/finance';
import { fmtMoney, fmtDateShort } from '@/src/utils/format';
import { pressedStyle } from '@/src/utils/press';
import { catColor } from '@/src/theme/colors';

export default function SuscripcionesScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const dismissedSubs = useStore((s) => s.settings.dismissedSubs);
  const dismissSubscription = useStore((s) => s.dismissSubscription);

  const subs = useMemo(() => detectSubscriptions(ledger, dismissedSubs), [ledger, dismissedSubs]);
  const totalMensual = subs.reduce((s, r) => s + r.promedio, 0);
  const totalAnual = subs.reduce((s, r) => s + r.costoAnual, 0);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Suscripciones" />
      <View style={styles.statsRow}>
        <StatCard icon="repeat-outline" label="Costo mensual" value={fmtMoney(totalMensual)} tone="expense" />
        <StatCard icon="calendar-outline" label="Costo anual" value={fmtMoney(totalAnual)} tone="expense" />
      </View>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Suscripciones detectadas</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Cargos que se repiten mes con mes con un monto similar y menor a $5,000. Descarta las que no apliquen.</Text>
        {subs.length ? subs.map((s) => (
          <View key={s.key} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: catColor(s.categoria) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{s.concepto}</Text>
              <Text style={[styles.meta, { color: c.textFaint }]}>{s.categoria} · {s.meses} meses · última {fmtDateShort(s.ultimaFecha)}</Text>
            </View>
            <Text style={[styles.amount, { color: c.text }]}>{fmtMoney(s.promedio)}</Text>
            <Pressable onPress={() => dismissSubscription(s.key)} hitSlop={8} style={({ pressed }) => [{ marginLeft: 10 }, pressedStyle(pressed)]}>
              <Ionicons name="close-circle" size={20} color={c.textFaint} />
            </Pressable>
          </View>
        )) : <EmptyState icon="repeat-outline" title="Sin suscripciones detectadas" subtitle="Se detectan automáticamente después de 3 meses de historial" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  name: { fontSize: 13.5, fontWeight: '700' },
  meta: { fontSize: 11.5, marginTop: 2 },
  amount: { fontSize: 13.5, fontWeight: '800' },
});
