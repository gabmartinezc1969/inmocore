import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '@/src/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import Button from '@/src/components/Button';
import Gauge from '@/src/components/charts/Gauge';
import DonutChart from '@/src/components/charts/DonutChart';
import EmptyState from '@/src/components/EmptyState';
import Sheet from '@/src/components/Sheet';
import { FormField } from '@/src/components/FormField';
import Chip from '@/src/components/Chip';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { computeFinancialScore, totalDebt } from '@/src/utils/finance';
import { fmtMoney } from '@/src/utils/format';
import { pressedStyle } from '@/src/utils/press';
import { catColor } from '@/src/theme/colors';
import { Activo, TipoActivo } from '@/src/types/models';

const TIPOS: TipoActivo[] = ['Propiedad', 'Vehículo', 'Cuenta bancaria', 'Efectivo', 'Otro'];

function emptyActivo(): Omit<Activo, 'id'> {
  return { nombre: '', tipo: 'Propiedad', valor: 0 };
}

export default function PatrimonioScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const assets = useStore((s) => s.assets);
  const investments = useStore((s) => s.investments);
  const credits = useStore((s) => s.credits);
  const addActivo = useStore((s) => s.addActivo);
  const updateActivo = useStore((s) => s.updateActivo);
  const deleteActivo = useStore((s) => s.deleteActivo);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activo | null>(null);
  const [draft, setDraft] = useState<Omit<Activo, 'id'>>(emptyActivo());

  const score = computeFinancialScore(ledger);
  const inversionesValor = investments.reduce((s, i) => s + i.valorActual, 0);
  const activosTotal = assets.reduce((s, a) => s + a.valor, 0) + inversionesValor;
  const deudaTotal = totalDebt(credits);
  const patrimonioNeto = activosTotal - deudaTotal;

  const byType: Record<string, number> = {};
  assets.forEach((a) => { byType[a.tipo] = (byType[a.tipo] || 0) + a.valor; });
  if (inversionesValor > 0) byType['Inversiones'] = (byType['Inversiones'] || 0) + inversionesValor;
  const donutData = Object.entries(byType).map(([label, value]) => ({ label, value, color: catColor(label) }));

  const openNew = () => { setEditing(null); setDraft(emptyActivo()); setOpen(true); };
  const openEdit = (a: Activo) => { setEditing(a); setDraft({ ...a }); setOpen(true); };
  const save = () => { if (editing) updateActivo(editing.id, draft); else addActivo(draft); setOpen(false); };

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Patrimonio y score" />
      <View style={styles.statsRow}>
        <StatCard icon="wallet-outline" label="Patrimonio neto" value={fmtMoney(patrimonioNeto)} tone={patrimonioNeto >= 0 ? 'income' : 'expense'} />
        <StatCard icon="albums-outline" label="Activos" value={fmtMoney(activosTotal)} />
        <StatCard icon="card-outline" label="Deuda" value={fmtMoney(deudaTotal)} tone="expense" />
      </View>

      <Card style={{ alignItems: 'center' }}>
        <Text style={[styles.title, { color: c.text, alignSelf: 'flex-start' }]}>Score financiero</Text>
        <Gauge value={score.total} label={score.label} />
        <View style={{ width: '100%', gap: 8, marginTop: 4 }}>
          {score.parts.map((p) => (
            <View key={p.nombre} style={styles.rowBetween}>
              <Text style={[styles.small, { color: c.textMuted }]}>{p.nombre}</Text>
              <Text style={[styles.small, { color: c.text, fontWeight: '700' }]}>{p.pts}/{p.max} · {p.detalle}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={[styles.title, { color: c.text }]}>Composición del patrimonio</Text>
        {donutData.length ? <DonutChart data={donutData} centerLabel={fmtMoney(activosTotal)} /> : <EmptyState title="Registra tus activos" />}
      </Card>

      <View style={styles.rowBetween}>
        <Text style={[styles.title, { color: c.text }]}>Registro de activos</Text>
        <Button label="Registrar" icon="add" small onPress={openNew} />
      </View>
      {assets.length ? assets.map((a) => (
        <Card key={a.id}>
          <Pressable onPress={() => openEdit(a)} style={({ pressed }) => [styles.rowBetween, pressedStyle(pressed)]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.assetName, { color: c.text }]} numberOfLines={1}>{a.nombre}</Text>
              <Text style={[styles.small, { color: c.textFaint }]}>{a.tipo}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.assetValue, { color: c.text }]}>{fmtMoney(a.valor)}</Text>
              <Ionicons name="create-outline" size={16} color={c.textFaint} />
            </View>
          </Pressable>
        </Card>
      )) : <EmptyState icon="home-outline" title="Sin activos registrados" />}

      <Sheet visible={open} onClose={() => setOpen(false)} title={editing ? 'Editar activo' : 'Registrar activo'}>
        <FormField label="Nombre" value={draft.nombre} onChangeText={(v) => setDraft((d) => ({ ...d, nombre: v }))} placeholder="Ej. Casa, cuenta nómina" />
        <View style={styles.wrap}>
          <Text style={[styles.small, { color: c.textMuted, fontWeight: '700' }]}>Tipo</Text>
          <View style={styles.chips}>
            {TIPOS.map((t) => <Chip key={t} label={t} active={draft.tipo === t} onPress={() => setDraft((d) => ({ ...d, tipo: t }))} />)}
          </View>
        </View>
        <FormField label="Valor actual" keyboardType="decimal-pad" value={String(draft.valor || '')} onChangeText={(v) => setDraft((d) => ({ ...d, valor: parseFloat(v) || 0 }))} />
        <View style={styles.actions}>
          {editing ? <Button label="Eliminar" variant="danger" icon="trash-outline" onPress={() => { deleteActivo(editing.id); setOpen(false); }} style={{ flex: 1 }} /> : null}
          <Button label="Guardar" onPress={save} style={{ flex: 1 }} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  small: { fontSize: 12.5 },
  assetName: { fontSize: 14.5, fontWeight: '700' },
  assetValue: { fontSize: 14, fontWeight: '800' },
  wrap: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
