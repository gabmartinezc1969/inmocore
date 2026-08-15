import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import Button from '@/src/components/Button';
import DonutChart from '@/src/components/charts/DonutChart';
import EmptyState from '@/src/components/EmptyState';
import Sheet from '@/src/components/Sheet';
import { FormField } from '@/src/components/FormField';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { filterRows, realSum, allYears } from '@/src/utils/finance';
import { fmtMoney, fmtPct } from '@/src/utils/format';
import { pressedStyle } from '@/src/utils/press';
import { catColor } from '@/src/theme/colors';
import BarChart from '@/src/components/charts/BarChart';
import { Inversion } from '@/src/types/models';

function emptyInv(): Omit<Inversion, 'id'> {
  return { nombre: '', capital: 0, valorActual: 0 };
}

export default function InversionesScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const investments = useStore((s) => s.investments);
  const addInversion = useStore((s) => s.addInversion);
  const updateInversion = useStore((s) => s.updateInversion);
  const deleteInversion = useStore((s) => s.deleteInversion);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inversion | null>(null);
  const [draft, setDraft] = useState<Omit<Inversion, 'id'>>(emptyInv());

  const capitalTotal = investments.reduce((s, i) => s + i.capital, 0);
  const valorTotal = investments.reduce((s, i) => s + i.valorActual, 0);
  const rendimiento = capitalTotal > 0 ? (valorTotal - capitalTotal) / capitalTotal : 0;

  const donutData = investments.filter((i) => i.valorActual > 0).map((i) => ({ label: i.nombre, value: i.valorActual, color: catColor(i.nombre) }));
  const years = allYears(ledger).slice(-6);
  const aportaciones = years.map((y) => ({ label: String(y), value: realSum(filterRows(ledger, { year: y, tipo: 'I', categoria: 'Inversion' })) }));

  const openNew = () => { setEditing(null); setDraft(emptyInv()); setOpen(true); };
  const openEdit = (i: Inversion) => { setEditing(i); setDraft({ ...i }); setOpen(true); };
  const save = () => { if (editing) updateInversion(editing.id, draft); else addInversion(draft); setOpen(false); };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.statsRow}>
        <StatCard icon="stats-chart-outline" label="Valor actual" value={fmtMoney(valorTotal)} tone="income" />
        <StatCard icon="trending-up-outline" label="Rendimiento" value={fmtPct(rendimiento)} tone={rendimiento >= 0 ? 'income' : 'expense'} />
      </View>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Distribución del portafolio</Text>
        {donutData.length ? <DonutChart data={donutData} centerLabel={fmtMoney(valorTotal)} /> : <EmptyState title="Sin inversiones registradas" />}
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Aportaciones por año</Text>
        <Text style={[styles.sub, { color: c.textMuted }]}>Ingresos categoría "Inversión" en tu libro contable</Text>
        {aportaciones.some((a) => a.value > 0) ? <BarChart data={aportaciones.map((a) => ({ ...a, color: c.primary }))} /> : <EmptyState title="Sin aportaciones registradas" />}
      </Card>

      <View style={styles.rowBetween}>
        <Text style={[styles.title, { color: c.text }]}>Mis inversiones</Text>
        <Button label="Agregar" icon="add" small onPress={openNew} />
      </View>
      {investments.length ? investments.map((i) => {
        const gan = i.capital > 0 ? (i.valorActual - i.capital) / i.capital : 0;
        return (
          <Card key={i.id}>
            <Pressable onPress={() => openEdit(i)} style={({ pressed }) => [styles.rowBetween, pressedStyle(pressed)]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{i.nombre}</Text>
                <Text style={[styles.sub, { color: c.textFaint, marginTop: 2 }]}>Capital {fmtMoney(i.capital)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.value, { color: c.text }]}>{fmtMoney(i.valorActual)}</Text>
                <Text style={{ color: gan >= 0 ? c.income : c.expense, fontSize: 12, fontWeight: '700' }}>{fmtPct(gan)}</Text>
              </View>
              <Ionicons name="create-outline" size={16} color={c.textFaint} style={{ marginLeft: 8 }} />
            </Pressable>
          </Card>
        );
      }) : <EmptyState icon="trending-up-outline" title="Sin inversiones registradas" />}

      <Sheet visible={open} onClose={() => setOpen(false)} title={editing ? 'Editar inversión' : 'Agregar inversión'}>
        <FormField label="Nombre / instrumento" value={draft.nombre} onChangeText={(v) => setDraft((d) => ({ ...d, nombre: v }))} placeholder="Ej. Fondo índice S&P500" />
        <View style={styles.row2}>
          <FormField label="Capital invertido" style={{ flex: 1 }} keyboardType="decimal-pad" value={String(draft.capital || '')} onChangeText={(v) => setDraft((d) => ({ ...d, capital: parseFloat(v) || 0 }))} />
          <FormField label="Valor actual" style={{ flex: 1 }} keyboardType="decimal-pad" value={String(draft.valorActual || '')} onChangeText={(v) => setDraft((d) => ({ ...d, valorActual: parseFloat(v) || 0 }))} />
        </View>
        <View style={styles.actions}>
          {editing ? <Button label="Eliminar" variant="danger" icon="trash-outline" onPress={() => { deleteInversion(editing.id); setOpen(false); }} style={{ flex: 1 }} /> : null}
          <Button label="Guardar" onPress={save} style={{ flex: 1 }} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14.5, fontWeight: '700' },
  value: { fontSize: 14, fontWeight: '800' },
  row2: { flexDirection: 'row', gap: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
