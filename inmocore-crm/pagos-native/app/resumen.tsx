import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import ProgressBar from '@/src/components/ProgressBar';
import MonthSwitcher from '@/src/components/MonthSwitcher';
import EmptyState from '@/src/components/EmptyState';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { targetYearMonth, categoryTable, topGastos } from '@/src/utils/finance';
import { fmtMoney, fmtDateShort } from '@/src/utils/format';
import { catColor } from '@/src/theme/colors';

export default function ResumenScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const t = targetYearMonth(ledger);
  const [year, setYear] = useState(t.year);
  const [monthIdx, setMonthIdx] = useState(t.monthIdx);

  const ing = categoryTable(ledger, year, monthIdx, 'I');
  const egr = categoryTable(ledger, year, monthIdx, 'E');
  const saldo = ing.totals.real - egr.totals.real;
  const top10 = topGastos(ledger, year, monthIdx, 10);

  const budgetRows = egr.rows.filter((r) => r.presupuesto > 0).sort((a, b) => b.presupuesto - a.presupuesto).slice(0, 8);

  return (
    <Screen edges={['bottom']}>
      <MonthSwitcher year={year} monthIdx={monthIdx} onChange={(y, m) => { setYear(y); setMonthIdx(m); }} />

      <View style={styles.statsRow}>
        <StatCard icon="arrow-down-circle-outline" label="Ingresos" value={fmtMoney(ing.totals.real)} tone="income" />
        <StatCard icon="arrow-up-circle-outline" label="Egresos" value={fmtMoney(egr.totals.real)} tone="expense" />
        <StatCard icon="wallet-outline" label="Saldo" value={fmtMoney(saldo)} tone={saldo >= 0 ? 'income' : 'expense'} />
      </View>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Presupuesto por categoría</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>🟢 &lt;80% · 🟡 80–100% · 🔴 &gt;100%</Text>
        {budgetRows.length ? budgetRows.map((r) => (
          <View key={r.categoria} style={styles.budgetRow}>
            <View style={styles.rowBetween}>
              <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={1}>{r.categoria}</Text>
              <Text style={[styles.catValue, { color: c.textMuted }]}>{fmtMoney(r.real)} / {fmtMoney(r.presupuesto)}</Text>
            </View>
            <ProgressBar pct={r.presupuesto ? r.real / r.presupuesto : 0} />
          </View>
        )) : <EmptyState title="Sin presupuesto definido este mes" />}
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Ingresos por categoría</Text>
        {ing.rows.filter((r) => r.real > 0).map((r) => (
          <View key={r.categoria} style={styles.catRow}>
            <View style={[styles.dot, { backgroundColor: catColor(r.categoria) }]} />
            <Text style={[styles.catLabel, { color: c.text, flex: 1 }]}>{r.categoria}</Text>
            <Text style={[styles.catValue, { color: c.income }]}>{fmtMoney(r.real)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Egresos por categoría</Text>
        {egr.rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real).map((r) => (
          <View key={r.categoria} style={styles.catRow}>
            <View style={[styles.dot, { backgroundColor: catColor(r.categoria) }]} />
            <Text style={[styles.catLabel, { color: c.text, flex: 1 }]}>{r.categoria}</Text>
            <Text style={[styles.catValue, { color: c.expense }]}>{fmtMoney(r.real)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Top 10 gastos del mes</Text>
        {top10.length ? top10.map((r) => (
          <View key={r.id} style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={1}>{r.concepto}</Text>
              <Text style={[styles.sub, { color: c.textFaint, marginTop: 0 }]}>{r.categoria} · {fmtDateShort(r.fecha)}</Text>
            </View>
            <Text style={[styles.catValue, { color: c.expense }]}>{fmtMoney(r.monto)}</Text>
          </View>
        )) : <EmptyState title="Sin gastos registrados" />}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  budgetRow: { marginTop: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  catLabel: { fontSize: 13.5, fontWeight: '600' },
  catValue: { fontSize: 13, fontWeight: '700' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});
