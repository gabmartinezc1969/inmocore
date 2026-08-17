import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '@/src/components/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import SegmentedControl from '@/src/components/SegmentedControl';
import Chip from '@/src/components/Chip';
import LineChart from '@/src/components/charts/LineChart';
import RingProgress from '@/src/components/RingProgress';
import TransactionRow from '@/src/components/TransactionRow';
import EmptyState from '@/src/components/EmptyState';
import Badge from '@/src/components/Badge';
import MovimientoForm, { emptyDraft, draftToMovimiento } from '@/src/components/MovimientoForm';
import { useTheme } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { useEnrichedLedger } from '@/src/store/hooks';
import {
  targetYearMonth, categoryTable, lastNMonths, realSum, filterRows,
  computeAlerts, pendingItems, monthLabelShort, dailySeriesMonth, allYears,
} from '@/src/utils/finance';
import { fmtMoney, fmtPct } from '@/src/utils/format';
import { CONFIG } from '@/src/config/config';
import { pressedStyle } from '@/src/utils/press';

type Period = 'day' | 'week' | 'month' | 'year';
const PERIODS: { label: string; value: Period }[] = [
  { label: 'Día', value: 'day' },
  { label: 'Semana', value: 'week' },
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' },
];

export default function InicioScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const addMovimiento = useStore((s) => s.addMovimiento);
  const [metric, setMetric] = useState<'I' | 'E'>('I');
  const [period, setPeriod] = useState<Period>('month');
  const [addOpen, setAddOpen] = useState(false);

  const { year, monthIdx } = targetYearMonth(ledger);
  const ing = categoryTable(ledger, year, monthIdx, 'I');
  const egr = categoryTable(ledger, year, monthIdx, 'E');
  const disponible = ing.totals.real - egr.totals.real;
  const tasaAhorro = ing.totals.real > 0 ? disponible / ing.totals.real : 0;
  const budgetPct = egr.totals.presupuesto ? egr.totals.real / egr.totals.presupuesto : 0;

  const months = useMemo(() => lastNMonths(6, ledger), [ledger]);

  const trend = useMemo(() => {
    if (period === 'day') {
      const daily = dailySeriesMonth(ledger, year, monthIdx)[metric === 'I' ? 'ing' : 'egr'];
      return { labels: daily.map((_, i) => String(i + 1)), data: daily };
    }
    if (period === 'week') {
      const daily = dailySeriesMonth(ledger, year, monthIdx)[metric === 'I' ? 'ing' : 'egr'];
      const weeks: number[] = [];
      for (let i = 0; i < daily.length; i += 7) weeks.push(daily.slice(i, i + 7).reduce((s, v) => s + v, 0));
      return { labels: weeks.map((_, i) => `Sem ${i + 1}`), data: weeks };
    }
    if (period === 'year') {
      const years = allYears(ledger).slice(-5);
      return { labels: years.map(String), data: years.map((y) => realSum(filterRows(ledger, { year: y, tipo: metric }))) };
    }
    return { labels: months.map(monthLabelShort), data: months.map((mo) => realSum(filterRows(ledger, { year: mo.year, monthIdx: mo.monthIdx, tipo: metric }))) };
  }, [period, metric, ledger, year, monthIdx, months]);

  const alerts = useMemo(() => computeAlerts(ledger), [ledger]);
  const pending = useMemo(() => pendingItems(ledger).filter((p) => p.diffDays >= 0).slice(0, 3), [ledger]);
  const recent = useMemo(() => [...ledger].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5), [ledger]);

  return (
    <Screen edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.hello, { color: c.textMuted }]}>{CONFIG.months[monthIdx]} {year}</Text>
          <Text style={[styles.brand, { color: c.text }]}>Hola 👋</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => router.push('/informes')} style={({ pressed }) => [styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }, pressedStyle(pressed)]}>
            <Ionicons name="document-text-outline" size={18} color={c.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/configuracion')} style={({ pressed }) => [styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }, pressedStyle(pressed)]}>
            <Ionicons name="settings-outline" size={18} color={c.text} />
          </Pressable>
        </View>
      </View>

      <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Disponible este mes</Text>
        <Text style={styles.balanceValue}>{fmtMoney(disponible)}</Text>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Ionicons name="arrow-down-circle" size={16} color="#8DF0C7" />
            <Text style={styles.balanceItemText} numberOfLines={1}>Ingresos {fmtMoney(ing.totals.real)}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Ionicons name="arrow-up-circle" size={16} color="#FFB18A" />
            <Text style={styles.balanceItemText} numberOfLines={1}>Gastos {fmtMoney(egr.totals.real)}</Text>
          </View>
        </View>
      </LinearGradient>

      <SegmentedControl
        value={metric}
        onChange={setMetric}
        options={[{ label: 'Ingresos', value: 'I' }, { label: 'Gastos', value: 'E' }]}
      />

      <Card>
        <Text style={[styles.cardTitle, { color: c.text }]}>Tendencia</Text>
        <View style={styles.periodRow}>
          {PERIODS.map((p) => <Chip key={p.value} label={p.label} active={period === p.value} onPress={() => setPeriod(p.value)} />)}
        </View>
        {trend.data.some((v) => v > 0) ? (
          <LineChart labels={trend.labels} series={[{ data: trend.data, color: metric === 'I' ? c.income : c.expense, area: true }]} />
        ) : (
          <EmptyState title="Sin datos suficientes todavía" />
        )}
      </Card>

      <View style={styles.statsRow}>
        <StatCard icon="trending-up" label="Ingresos" value={fmtMoney(ing.totals.real)} tone="income" />
        <StatCard icon="trending-down" label="Gastos" value={fmtMoney(egr.totals.real)} tone="expense" />
        <StatCard icon="wallet" label="Ahorro" value={fmtPct(tasaAhorro)} tone={tasaAhorro >= 0.1 ? 'income' : 'warning'} />
      </View>

      <Pressable onPress={() => router.push('/resumen')} style={({ pressed }) => pressedStyle(pressed)}>
        <Card style={styles.budgetCard}>
          <RingProgress pct={budgetPct} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Presupuesto del mes</Text>
            <Text style={[styles.cardMeta, { color: c.textMuted, marginTop: 3 }]}>{fmtMoney(egr.totals.real)} de {fmtMoney(egr.totals.presupuesto)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
        </Card>
      </Pressable>

      {alerts.length > 0 && (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Alertas recientes</Text>
            <Pressable onPress={() => router.push('/alertas')} style={({ pressed }) => pressedStyle(pressed)}><Text style={[styles.link, { color: c.primary }]}>Ver todas</Text></Pressable>
          </View>
          <View style={{ gap: 10, marginTop: 8 }}>
            {alerts.slice(0, 2).map((a, i) => (
              <View key={i} style={styles.alertRow}>
                <Text style={{ fontSize: 16 }}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: c.text }]} numberOfLines={1}>{a.title}</Text>
                  <Text style={[styles.alertDetail, { color: c.textFaint }]} numberOfLines={2}>{a.detail}</Text>
                </View>
                <Badge text={a.sev === 'high' ? 'Alta' : 'Media'} tone={a.sev === 'high' ? 'expense' : 'warning'} />
              </View>
            ))}
          </View>
        </Card>
      )}

      {pending.length > 0 && (
        <Card>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Próximos pagos</Text>
            <Pressable onPress={() => router.push('/recordatorios')} style={({ pressed }) => pressedStyle(pressed)}><Text style={[styles.link, { color: c.primary }]}>Ver todos</Text></Pressable>
          </View>
          <View style={{ marginTop: 4 }}>
            {pending.map((p) => (
              <View key={p.id} style={styles.pendingRow}>
                <Text style={[styles.pendingConcepto, { color: c.text }]} numberOfLines={1}>{p.concepto}</Text>
                <Text style={[styles.pendingAmount, { color: c.textMuted }]}>{fmtMoney(p.presupuesto)}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Movimientos recientes</Text>
          <Pressable onPress={() => router.push('/(tabs)/movimientos')} style={({ pressed }) => pressedStyle(pressed)}><Text style={[styles.link, { color: c.primary }]}>Ver todos</Text></Pressable>
        </View>
        {recent.length ? recent.map((r) => <TransactionRow key={r.id} item={r} />) : <EmptyState title="Aún no hay movimientos" />}
      </Card>

      <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.fab, { backgroundColor: c.accent }, pressedStyle(pressed, 0.8)]}>
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>

      <MovimientoForm
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar movimiento"
        initial={emptyDraft()}
        onSave={(d) => { addMovimiento(draftToMovimiento(d)); setAddOpen(false); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { fontSize: 12.5, fontWeight: '700', textTransform: 'capitalize' },
  brand: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  balanceCard: { borderRadius: 24, padding: 20, gap: 6, overflow: 'hidden' },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
  balanceValue: { color: '#fff', fontSize: 34, fontWeight: '800' },
  // Wraps to a second line instead of overflowing the card when both
  // amounts together don't fit one row (large balances, narrow screens).
  balanceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  balanceItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  balanceItemText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  cardMeta: { fontSize: 12, fontWeight: '700' },
  periodRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 },
  budgetCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statsRow: { flexDirection: 'row', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { fontSize: 12.5, fontWeight: '700' },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  alertTitle: { fontSize: 13.5, fontWeight: '700' },
  alertDetail: { fontSize: 12, marginTop: 2 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  pendingConcepto: { fontSize: 13.5, fontWeight: '600', flex: 1 },
  pendingAmount: { fontSize: 13, fontWeight: '700' },
  fab: { position: 'absolute', right: 22, bottom: 22, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
});
