import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import { YearSwitcher } from '@/src/components/MonthSwitcher';
import LineChart from '@/src/components/charts/LineChart';
import DonutChart from '@/src/components/charts/DonutChart';
import EmptyState from '@/src/components/EmptyState';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { targetYearMonth, categoryTable, realSum, filterRows } from '@/src/utils/finance';
import { fmtMoney } from '@/src/utils/format';
import { CONFIG } from '@/src/config/config';
import { catColor } from '@/src/theme/colors';

export default function AnualScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const t = targetYearMonth(ledger);
  const [year, setYear] = useState(t.year);

  const ing = categoryTable(ledger, year, undefined, 'I');
  const egr = categoryTable(ledger, year, undefined, 'E');
  const saldo = ing.totals.real - egr.totals.real;

  const monthly = useMemo(() => CONFIG.monthsAbbr.map((_, m) => ({
    ing: realSum(filterRows(ledger, { year, monthIdx: m, tipo: 'I' })),
    egr: realSum(filterRows(ledger, { year, monthIdx: m, tipo: 'E' })),
  })), [ledger, year]);

  const donutData = egr.rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real).slice(0, 6)
    .map((r) => ({ label: r.categoria, value: r.real, color: catColor(r.categoria) }));

  const hasData = monthly.some((m) => m.ing > 0 || m.egr > 0);

  return (
    <Screen edges={['bottom']}>
      <YearSwitcher year={year} onChange={setYear} />

      <View style={styles.statsRow}>
        <StatCard icon="arrow-down-circle-outline" label="Ingreso anual" value={fmtMoney(ing.totals.real)} tone="income" />
        <StatCard icon="arrow-up-circle-outline" label="Egreso anual" value={fmtMoney(egr.totals.real)} tone="expense" />
        <StatCard icon="wallet-outline" label="Ahorro anual" value={fmtMoney(saldo)} tone={saldo >= 0 ? 'income' : 'warning'} />
      </View>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Tendencia mensual</Text>
        {hasData ? (
          <LineChart
            labels={CONFIG.monthsAbbr}
            series={[
              { data: monthly.map((m) => m.ing), color: c.income },
              { data: monthly.map((m) => m.egr), color: c.expense },
            ]}
          />
        ) : <EmptyState title="Sin datos para este año" />}
        <View style={styles.legendInline}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: c.income }]} /><Text style={{ color: c.textMuted, fontSize: 12 }}>Ingresos</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: c.expense }]} /><Text style={{ color: c.textMuted, fontSize: 12 }}>Egresos</Text></View>
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Egresos por categoría del año</Text>
        {donutData.length ? <DonutChart data={donutData} centerLabel={fmtMoney(egr.totals.real)} /> : <EmptyState title="Sin egresos registrados" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  legendInline: { flexDirection: 'row', gap: 16, marginTop: 10, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
