import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/src/components/Screen';
import ScreenHeader from '@/src/components/ScreenHeader';
import Card from '@/src/components/Card';
import StatCard from '@/src/components/StatCard';
import ProgressBar from '@/src/components/ProgressBar';
import Button from '@/src/components/Button';
import EmptyState from '@/src/components/EmptyState';
import Sheet from '@/src/components/Sheet';
import { FormField } from '@/src/components/FormField';
import Chip from '@/src/components/Chip';
import { useTheme, useEnrichedLedger } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { amortizationStatus, creditRealPayments, totalDebt } from '@/src/utils/finance';
import { fmtMoney } from '@/src/utils/format';
import { pressedStyle } from '@/src/utils/press';
import { Credito, TipoCredito } from '@/src/types/models';

const TIPOS: TipoCredito[] = ['Hipotecario', 'Automotriz', 'Personal', 'Otro'];

function emptyCredito(): Omit<Credito, 'id'> {
  return { nombre: '', tipo: 'Hipotecario', categoria: '', monto: 0, tasa: 0, plazo: 0, inicio: new Date().toISOString().slice(0, 10), saldoBanco: null, notas: '' };
}

export default function DeudasScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const credits = useStore((s) => s.credits);
  const addCredito = useStore((s) => s.addCredito);
  const updateCredito = useStore((s) => s.updateCredito);
  const deleteCredito = useStore((s) => s.deleteCredito);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Credito | null>(null);
  const [draft, setDraft] = useState<Omit<Credito, 'id'>>(emptyCredito());

  const openNew = () => { setEditing(null); setDraft(emptyCredito()); setOpen(true); };
  const openEdit = (cr: Credito) => { setEditing(cr); setDraft({ ...cr }); setOpen(true); };
  const save = () => {
    if (editing) updateCredito(editing.id, draft); else addCredito(draft);
    setOpen(false);
  };

  const deudaTotal = totalDebt(credits);

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader title="Créditos y deudas" />
      <View style={styles.statsRow}>
        <StatCard icon="card-outline" label="Deuda total" value={fmtMoney(deudaTotal)} tone="expense" />
        <StatCard icon="albums-outline" label="Créditos activos" value={String(credits.length)} />
      </View>

      <View style={styles.rowBetween}>
        <Text style={[styles.title, { color: c.text }]}>Mis créditos</Text>
        <Button label="Registrar" icon="add" small onPress={openNew} />
      </View>

      {credits.length ? credits.map((cr) => {
        const am = amortizationStatus(cr);
        const saldo = (cr.saldoBanco && cr.saldoBanco > 0) ? cr.saldoBanco : am?.saldoTeorico ?? 0;
        const pagado = cr.monto ? 1 - saldo / cr.monto : 0;
        const pagos = creditRealPayments(cr, ledger);
        return (
          <Card key={cr.id}>
            <Pressable onPress={() => openEdit(cr)} style={({ pressed }) => pressedStyle(pressed)}>
              <View style={styles.rowBetween}>
                <Text style={[styles.creditName, { color: c.text }]}>{cr.nombre}</Text>
                <Ionicons name="create-outline" size={16} color={c.textFaint} />
              </View>
              <Text style={[styles.creditMeta, { color: c.textMuted }]}>{cr.tipo} · {cr.tasa}% anual · {cr.plazo} meses</Text>
              <View style={{ marginTop: 10, gap: 6 }}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.small, { color: c.textMuted }]}>Saldo restante</Text>
                  <Text style={[styles.small, { color: c.text, fontWeight: '800' }]}>{fmtMoney(saldo)} de {fmtMoney(cr.monto)}</Text>
                </View>
                <ProgressBar pct={pagado} />
              </View>
              {am && (
                <Text style={[styles.small, { color: c.textFaint, marginTop: 8 }]}>
                  Mensualidad teórica {fmtMoney(am.pago)} · {am.mesesRestantes} meses restantes
                </Text>
              )}
              <Text style={[styles.small, { color: c.textFaint, marginTop: 2 }]}>
                Pagado en libro contable: {fmtMoney(pagos.total)} ({pagos.count} pagos)
              </Text>
            </Pressable>
          </Card>
        );
      }) : <EmptyState icon="card-outline" title="Aún no registras créditos" subtitle="Agrega tu hipoteca o crédito automotriz para dar seguimiento" />}

      <Sheet visible={open} onClose={() => setOpen(false)} title={editing ? 'Editar crédito' : 'Registrar crédito'}>
        <FormField label="Nombre" value={draft.nombre} onChangeText={(v) => setDraft((d) => ({ ...d, nombre: v }))} placeholder="Ej. Hipoteca casa" />
        <View style={styles.wrap}>
          <Text style={[styles.small, { color: c.textMuted, fontWeight: '700' }]}>Tipo</Text>
          <View style={styles.chips}>
            {TIPOS.map((t) => <Chip key={t} label={t} active={draft.tipo === t} onPress={() => setDraft((d) => ({ ...d, tipo: t }))} />)}
          </View>
        </View>
        <FormField label="Categoría vinculada (libro contable)" value={draft.categoria} onChangeText={(v) => setDraft((d) => ({ ...d, categoria: v }))} placeholder="Ej. Hipotecario" />
        <View style={styles.row2}>
          <FormField label="Monto original" style={{ flex: 1 }} keyboardType="decimal-pad" value={String(draft.monto || '')} onChangeText={(v) => setDraft((d) => ({ ...d, monto: parseFloat(v) || 0 }))} />
          <FormField label="Tasa anual (%)" style={{ flex: 1 }} keyboardType="decimal-pad" value={String(draft.tasa || '')} onChangeText={(v) => setDraft((d) => ({ ...d, tasa: parseFloat(v) || 0 }))} />
        </View>
        <View style={styles.row2}>
          <FormField label="Plazo (meses)" style={{ flex: 1 }} keyboardType="number-pad" value={String(draft.plazo || '')} onChangeText={(v) => setDraft((d) => ({ ...d, plazo: parseInt(v) || 0 }))} />
          <FormField label="Inicio (AAAA-MM-DD)" style={{ flex: 1 }} value={draft.inicio} onChangeText={(v) => setDraft((d) => ({ ...d, inicio: v }))} />
        </View>
        <FormField label="Saldo actual según banco (opcional)" keyboardType="decimal-pad" value={draft.saldoBanco ? String(draft.saldoBanco) : ''} onChangeText={(v) => setDraft((d) => ({ ...d, saldoBanco: v ? parseFloat(v) : null }))} />
        <View style={styles.actions}>
          {editing ? <Button label="Eliminar" variant="danger" icon="trash-outline" onPress={() => { deleteCredito(editing.id); setOpen(false); }} style={{ flex: 1 }} /> : null}
          <Button label="Guardar" onPress={save} style={{ flex: 1 }} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '800' },
  creditName: { fontSize: 15.5, fontWeight: '800' },
  creditMeta: { fontSize: 12.5, marginTop: 2 },
  small: { fontSize: 12.5 },
  wrap: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row2: { flexDirection: 'row', gap: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
