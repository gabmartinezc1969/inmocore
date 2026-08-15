import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import { YearSwitcher } from '@/src/components/MonthSwitcher';
import BarChart from '@/src/components/charts/BarChart';
import DonutChart from '@/src/components/charts/DonutChart';
import EmptyState from '@/src/components/EmptyState';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { targetYearMonth, categoryTable, realSum, filterRows } from '@/src/utils/finance';
import { fmtMoney } from '@/src/utils/format';
import { CONFIG } from '@/src/config/config';
import { catColor } from '@/src/theme/colors';

export default function IngresosScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const t = targetYearMonth(ledger);
  const [year, setYear] = useState(t.year);

  const ing = categoryTable(ledger, year, undefined, 'I');
  const monthly = CONFIG.monthsAbbr.map((label, m) => ({ label, value: realSum(filterRows(ledger, { year, monthIdx: m, tipo: 'I' })) }));
  const avgMensual = ing.totals.real / 12;
  const donutData = ing.rows.filter((r) => r.real > 0).map((r) => ({ label: r.categoria, value: r.real, color: catColor(r.categoria) }));

  return (
    <Screen edges={['bottom']}>
      <YearSwitcher year={year} onChange={setYear} />

      <View style={styles.statsRow}>
        <StatCard icon="cash-outline" label="Total del año" value={fmtMoney(ing.totals.real)} tone="income" />
        <StatCard icon="calendar-outline" label="Promedio mensual" value={fmtMoney(avgMensual)} tone="income" />
      </View>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Ingresos mensuales</Text>
        {ing.totals.real > 0 ? <BarChart data={monthly.map((m) => ({ ...m, color: c.income }))} /> : <EmptyState title="Sin ingresos registrados este año" />}
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Ingresos por fuente</Text>
        {donutData.length ? <DonutChart data={donutData} centerLabel={fmtMoney(ing.totals.real)} /> : <EmptyState title="Sin datos" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
});
