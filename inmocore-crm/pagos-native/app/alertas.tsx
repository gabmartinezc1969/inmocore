import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import Badge from '@/src/components/Badge';
import EmptyState from '@/src/components/EmptyState';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { computeAlerts } from '@/src/utils/finance';

export default function AlertasScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const alerts = useMemo(() => computeAlerts(ledger), [ledger]);

  return (
    <Screen edges={['bottom']}>
      {alerts.length ? alerts.map((a, i) => (
        <Card key={i}>
          <View style={styles.row}>
            <Text style={{ fontSize: 20 }}>{a.icon}</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{a.title}</Text>
              </View>
              <Text style={[styles.detail, { color: c.textMuted }]}>{a.detail}</Text>
              <View style={{ marginTop: 8 }}>
                <Badge text={a.sev === 'high' ? 'Prioridad alta' : a.sev === 'medium' ? 'Prioridad media' : 'Prioridad baja'} tone={a.sev === 'high' ? 'expense' : a.sev === 'medium' ? 'warning' : 'neutral'} />
              </View>
            </View>
          </View>
        </Card>
      )) : <EmptyState icon="checkmark-circle-outline" title="Todo en orden" subtitle="No hay alertas activas sobre tu mes actual" />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 14.5, fontWeight: '800', flex: 1 },
  detail: { fontSize: 12.5, marginTop: 4, lineHeight: 18 },
});
