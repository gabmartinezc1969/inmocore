import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import ProgressBar from '@/src/components/ProgressBar';
import { YearSwitcher } from '@/src/components/MonthSwitcher';
import EmptyState from '@/src/components/EmptyState';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { paretoCategorias, topGastos, targetYearMonth } from '@/src/utils/finance';
import { fmtMoney, fmtPct, fmtDateShort } from '@/src/utils/format';
import { catColor } from '@/src/theme/colors';

export default function GastosScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const t = targetYearMonth(ledger);
  const [year, setYear] = useState(t.year);

  const pareto = paretoCategorias(ledger, year);
  const total = pareto.reduce((s, r) => s + r.real, 0);
  const top20 = topGastos(ledger, year, undefined, 15);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Gastos" />
      <YearSwitcher year={year} onChange={setYear} />

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Concentración por categoría</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Ordenadas de mayor a menor · % acumulado del gasto anual</Text>
        {pareto.length ? pareto.map((r) => (
          <View key={r.categoria} style={styles.row}>
            <View style={styles.rowBetween}>
              <View style={styles.catLabelRow}>
                <View style={[styles.dot, { backgroundColor: catColor(r.categoria) }]} />
                <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={1}>{r.categoria}</Text>
              </View>
              <Text style={[styles.catValue, { color: c.text }]}>{fmtMoney(r.real)}</Text>
            </View>
            <ProgressBar pct={total ? r.real / total : 0} color={catColor(r.categoria)} />
            <Text style={[styles.acum, { color: c.textFaint }]}>{fmtPct(r.pctAcum)} acumulado</Text>
          </View>
        )) : <EmptyState title="Sin gastos registrados este año" />}
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Top gastos del año</Text>
        {top20.length ? top20.map((r) => (
          <View key={r.id} style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={1}>{r.concepto}</Text>
              <Text style={[styles.sub, { color: c.textFaint, marginTop: 0, marginBottom: 0 }]}>{r.categoria} · {fmtDateShort(r.fecha)}</Text>
            </View>
            <Text style={[styles.catValue, { color: c.expense }]}>{fmtMoney(r.monto)}</Text>
          </View>
        )) : <EmptyState title="Sin datos" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2, marginBottom: 10 },
  row: { marginTop: 12, gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  catLabel: { fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
  catValue: { fontSize: 13, fontWeight: '700' },
  acum: { fontSize: 11 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
