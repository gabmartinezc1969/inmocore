import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Sheet from '@/src/components/Sheet';
import Button from '@/src/components/Button';
import { FormField } from '@/src/components/FormField';
import RingProgress from '@/src/components/RingProgress';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { targetYearMonth, categoryTable, lastNMonths, daysInMonth } from '@/src/utils/finance';
import { fmtMoney } from '@/src/utils/format';
import { CONFIG } from '@/src/config/config';

// "Informes" — monthly budget snapshot styled after the reference mock:
// warm yellow hero header, a floating white panel with "Este mes" totals
// and a "Presupuesto mensual" ring showing how much of the user's own
// monthly spending target is still available.
const YELLOW = '#FFC93D';
const YELLOW_DARK = '#E8A800';
const INK = '#20180A';

export default function InformesScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const presupuestoMensual = useStore((s) => s.settings.presupuestoMensual);
  const setPresupuestoMensual = useStore((s) => s.setPresupuestoMensual);

  const today = targetYearMonth(ledger);
  const [year, setYear] = useState(today.year);
  const [monthIdx, setMonthIdx] = useState(today.monthIdx);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [ajusteInput, setAjusteInput] = useState('');

  const ing = categoryTable(ledger, year, monthIdx, 'I');
  const egr = categoryTable(ledger, year, monthIdx, 'E');
  const gastos = egr.totals.real;
  const ingreso = ing.totals.real;
  const balance = presupuestoMensual - gastos;
  const pctDisponible = presupuestoMensual > 0 ? balance / presupuestoMensual : 0;

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && monthIdx === now.getMonth();
  const dayLabel = isCurrentMonth ? now.getDate() : daysInMonth(year, monthIdx);

  const monthOptions = useMemo(() => {
    const months = lastNMonths(12, ledger);
    if (!months.some((m) => m.year === today.year && m.monthIdx === today.monthIdx)) months.push(today);
    return months.slice().reverse();
  }, [ledger, today]);

  const openAjuste = () => {
    setAjusteInput(presupuestoMensual > 0 ? String(presupuestoMensual) : '');
    setAjusteOpen(true);
  };
  const saveAjuste = () => {
    const val = parseFloat(ajusteInput.replace(',', '.'));
    setPresupuestoMensual(isNaN(val) ? 0 : val);
    setAjusteOpen(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: YELLOW }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: YELLOW }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={INK} />
          </Pressable>
          <Text style={styles.headerTitle}>Informes</Text>
          <View style={styles.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.panel, { backgroundColor: c.surface, shadowColor: c.shadow }]}>
          <Pressable style={styles.sectionRow} onPress={() => setMonthPickerOpen(true)}>
            <Text style={[styles.sectionLabel, { color: c.text }]}>
              {CONFIG.months[monthIdx]} {year}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
          </Pressable>

          <View style={styles.thisMonthRow}>
            <Text style={[styles.dayBig, { color: c.text }]}>{String(dayLabel).padStart(2, '0')}</Text>
            <View style={[styles.vDivider, { backgroundColor: c.border }]} />
            <View style={styles.thisMonthCol}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Gastos</Text>
              <Text style={[styles.statValue, { color: c.expense }]}>{gastos > 0 ? '−' : ''}{fmtMoney(gastos)}</Text>
            </View>
            <View style={styles.thisMonthCol}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Ingreso</Text>
              <Text style={[styles.statValue, { color: c.text }]}>{fmtMoney(ingreso)}</Text>
            </View>
          </View>

          <View style={[styles.hr, { backgroundColor: c.border }]} />

          <View style={styles.sectionRow}>
            <Text style={[styles.sectionLabel, { color: c.text }]}>Presupuesto mensual</Text>
            <Pressable onPress={openAjuste} style={[styles.ajusteBtn, { backgroundColor: YELLOW }]}>
              <Ionicons name="create-outline" size={14} color={INK} />
              <Text style={styles.ajusteLabel}>Ajuste</Text>
            </Pressable>
          </View>

          {presupuestoMensual > 0 ? (
            <View style={styles.budgetRow}>
              <View style={styles.ringWrap}>
                <RingProgress pct={pctDisponible} size={92} strokeWidth={10} color={YELLOW_DARK} />
                <Text style={[styles.ringCaption, { color: c.textFaint }]}>Balance</Text>
              </View>
              <View style={{ flex: 1, gap: 8 }}>
                <View style={styles.budgetLine}>
                  <Text style={[styles.budgetLabel, { color: c.text }]}>Balance :</Text>
                  <Text style={[styles.budgetValue, { color: c.text }]}>{fmtMoney(balance)}</Text>
                </View>
                <View style={styles.budgetLine}>
                  <Text style={[styles.budgetLabel, { color: c.textMuted }]}>Presupuesto :</Text>
                  <Text style={[styles.budgetValueMuted, { color: c.textMuted }]}>{fmtMoney(presupuestoMensual)}</Text>
                </View>
                <View style={styles.budgetLine}>
                  <Text style={[styles.budgetLabel, { color: c.textMuted }]}>Gastos :</Text>
                  <Text style={[styles.budgetValueMuted, { color: c.textMuted }]}>{fmtMoney(gastos)}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.emptyBudget}>
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                Define un presupuesto mensual para ver cuánto te queda disponible.
              </Text>
              <Button label="Establecer presupuesto" small onPress={openAjuste} />
            </View>
          )}
        </View>

        <View style={[styles.panel, { backgroundColor: c.surface, shadowColor: c.shadow }]}>
          <Text style={[styles.sectionLabel, { color: c.text, marginBottom: 10 }]}>Egresos por categoría</Text>
          {egr.rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real).slice(0, 6).map((r) => (
            <View key={r.categoria} style={styles.catRow}>
              <Text style={[styles.catLabel, { color: c.text }]} numberOfLines={1}>{r.categoria}</Text>
              <Text style={[styles.catValue, { color: c.expense }]}>{fmtMoney(r.real)}</Text>
            </View>
          ))}
          {egr.rows.every((r) => r.real <= 0) && (
            <Text style={[styles.emptyText, { color: c.textMuted }]}>Sin gastos registrados este mes.</Text>
          )}
        </View>
      </ScrollView>

      <Sheet visible={monthPickerOpen} onClose={() => setMonthPickerOpen(false)} title="Elegir mes">
        {monthOptions.map((m) => (
          <Pressable
            key={`${m.year}-${m.monthIdx}`}
            onPress={() => { setYear(m.year); setMonthIdx(m.monthIdx); setMonthPickerOpen(false); }}
            style={[styles.monthOption, { borderColor: c.border }, m.year === year && m.monthIdx === monthIdx && { backgroundColor: c.surfaceAlt }]}
          >
            <Text style={{ color: c.text, fontWeight: '700', textTransform: 'capitalize' }}>{CONFIG.months[m.monthIdx]} {m.year}</Text>
          </Pressable>
        ))}
      </Sheet>

      <Sheet visible={ajusteOpen} onClose={() => setAjusteOpen(false)} title="Ajustar presupuesto mensual">
        <FormField
          label="Presupuesto mensual (MXN)"
          keyboardType="decimal-pad"
          value={ajusteInput}
          onChangeText={setAjusteInput}
          placeholder="0.00"
        />
        <Button label="Guardar" onPress={saveAjuste} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 42, paddingTop: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: INK },
  scrollContent: { padding: 20, paddingTop: 0, marginTop: -30, gap: 16, paddingBottom: 40 },
  panel: { borderRadius: 24, padding: 18, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 24, elevation: 3 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  thisMonthRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 16 },
  dayBig: { fontSize: 36, fontWeight: '800' },
  vDivider: { width: 1, alignSelf: 'stretch' },
  thisMonthCol: { gap: 3 },
  statLabel: { fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 16, fontWeight: '800' },
  hr: { height: 1, marginVertical: 18 },
  ajusteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  ajusteLabel: { color: INK, fontWeight: '800', fontSize: 12.5 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
  ringWrap: { alignItems: 'center', gap: 4 },
  ringCaption: { fontSize: 11, fontWeight: '700' },
  budgetLine: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel: { fontSize: 13.5, fontWeight: '700' },
  budgetValue: { fontSize: 15, fontWeight: '800' },
  budgetValueMuted: { fontSize: 13.5, fontWeight: '700' },
  emptyBudget: { marginTop: 16, gap: 12, alignItems: 'flex-start' },
  emptyText: { fontSize: 13, lineHeight: 18 },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  catLabel: { fontSize: 13.5, fontWeight: '600', flex: 1, marginRight: 10 },
  catValue: { fontSize: 13, fontWeight: '700' },
  monthOption: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
});
