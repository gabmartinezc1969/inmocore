import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import SectionHeader from '@/src/components/SectionHeader';
import TransactionRow from '@/src/components/TransactionRow';
import EmptyState from '@/src/components/EmptyState';
import MovimientoForm, { emptyDraft, draftToMovimiento } from '@/src/components/MovimientoForm';
import { useTheme } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { useEnrichedLedger } from '@/src/store/hooks';
import { targetYearMonth, categoryTable, totalDebt } from '@/src/utils/finance';
import { fmtMoney } from '@/src/utils/format';
import { pressedStyle } from '@/src/utils/press';

// First row mirrors the reference mock's single-row "popular operations"
// (All / Health / Travel / Food) — the rest live one tap away in Más.
const OPS: { icon: keyof typeof Ionicons.glyphMap; label: string; href: string }[] = [
  { icon: 'trending-up-outline', label: 'Ingresos', href: '/ingresos' },
  { icon: 'trending-down-outline', label: 'Gastos', href: '/gastos' },
  { icon: 'card-outline', label: 'Deudas', href: '/deudas' },
  { icon: 'stats-chart-outline', label: 'Inversiones', href: '/inversiones' },
];

export default function CuentasScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const assets = useStore((s) => s.assets);
  const credits = useStore((s) => s.credits);
  const addMovimiento = useStore((s) => s.addMovimiento);
  const [addOpen, setAddOpen] = useState(false);

  const { year, monthIdx } = targetYearMonth(ledger);
  const ing = categoryTable(ledger, year, monthIdx, 'I');
  const egr = categoryTable(ledger, year, monthIdx, 'E');
  const disponible = ing.totals.real - egr.totals.real;
  const activosTotal = assets.reduce((s, a) => s + a.valor, 0);
  const deudaTotal = totalDebt(credits);
  const patrimonio = activosTotal - deudaTotal;

  const recent = useMemo(() => [...ledger].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8), [ledger]);

  return (
    <Screen edges={['top']}>
      <SectionHeader title="Mis tarjetas" subtitle="Un vistazo a tu dinero" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
        <Pressable onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.addCard, { borderColor: c.border, backgroundColor: c.surfaceAlt }, pressedStyle(pressed)]}>
          <View style={[styles.addCardIcon, { backgroundColor: c.primarySoft }]}>
            <Ionicons name="add" size={22} color={c.primary} />
          </View>
          <Text style={[styles.addCardLabel, { color: c.textMuted }]}>Agregar{'\n'}movimiento</Text>
        </Pressable>

        <LinearGradient colors={[c.primary, c.primaryDark]} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Disponible</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.cardValue}>{fmtMoney(disponible)}</Text>
          <Text style={styles.cardFoot}>Mes en curso</Text>
        </LinearGradient>

        <LinearGradient colors={[c.accent, '#C9531B']} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Patrimonio neto</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.cardValue}>{fmtMoney(patrimonio)}</Text>
          <Text style={styles.cardFoot}>Activos − deudas</Text>
        </LinearGradient>

        <LinearGradient colors={['#2C2A4A', '#171628']} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Deuda total</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color="rgba(255,255,255,0.7)" />
          </View>
          <Text style={styles.cardValue}>{fmtMoney(deudaTotal)}</Text>
          <Text style={styles.cardFoot}>{credits.length} crédito(s) activo(s)</Text>
        </LinearGradient>
      </ScrollView>

      <View>
        <View style={styles.rowBetween}>
          <Text style={[styles.opsTitle, { color: c.text }]}>Operaciones frecuentes</Text>
          <Pressable onPress={() => router.push('/(tabs)/mas')} style={({ pressed }) => pressedStyle(pressed)}>
            <Text style={[styles.link, { color: c.primary }]}>Ver todas</Text>
          </Pressable>
        </View>
        <View style={styles.opsRow}>
          {OPS.map((op) => (
            <Pressable key={op.href} onPress={() => router.push(op.href as any)} style={({ pressed }) => [styles.opItem, pressedStyle(pressed)]}>
              <View style={[styles.opIcon, { backgroundColor: c.primarySoft }]}>
                <Ionicons name={op.icon} size={20} color={c.primary} />
              </View>
              <Text style={[styles.opLabel, { color: c.textMuted }]} numberOfLines={1}>{op.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitleDark, { color: c.text }]}>Transacciones</Text>
          <Pressable onPress={() => router.push('/(tabs)/movimientos')} style={({ pressed }) => pressedStyle(pressed)}>
            <Text style={[styles.link, { color: c.primary }]}>Ver todas</Text>
          </Pressable>
        </View>
        {recent.length ? recent.map((r) => <TransactionRow key={r.id} item={r} />) : <EmptyState title="Sin movimientos todavía" />}
      </Card>

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
  cardsRow: { gap: 14, paddingRight: 8 },
  addCard: { width: 96, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12 },
  addCardIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addCardLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  card: { width: 220, borderRadius: 22, padding: 18, gap: 22, justifyContent: 'space-between' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '700' },
  cardValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  cardFoot: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  opsTitle: { fontSize: 15, fontWeight: '800' },
  opsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  opItem: { alignItems: 'center', gap: 6, width: 72 },
  opIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  opLabel: { fontSize: 10.5, fontWeight: '600', textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitleDark: { fontSize: 15, fontWeight: '800' },
  link: { fontSize: 12.5, fontWeight: '700' },
});
