import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import Sheet from './Sheet';
import { FormField, FormSwitch } from './FormField';
import SegmentedControl from './SegmentedControl';
import CategoryPicker from './CategoryPicker';
import Chip from './Chip';
import Button from './Button';
import { useTheme } from '@/src/store/hooks';
import { CONFIG } from '@/src/config/config';
import { Movimiento, TipoMovimiento } from '@/src/types/models';

export interface MovimientoDraft {
  fecha: string;
  tipo: TipoMovimiento;
  categoria: string;
  concepto: string;
  presupuesto: string;
  monto: string;
  metodoPago: string;
  deducible: boolean;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDraft(tipo: TipoMovimiento = 'E'): MovimientoDraft {
  return { fecha: todayISO(), tipo, categoria: tipo === 'E' ? CONFIG.categories.egresoOrder[0] : CONFIG.categories.ingresoOrder[0], concepto: '', presupuesto: '', monto: '', metodoPago: '', deducible: false };
}

export function draftFromMovimiento(m: Movimiento): MovimientoDraft {
  return {
    fecha: m.fecha, tipo: m.tipo, categoria: m.categoria, concepto: m.concepto,
    presupuesto: String(m.presupuesto ?? ''), monto: m.monto === null ? '' : String(m.monto),
    metodoPago: m.metodoPago ?? '', deducible: !!m.deducible,
  };
}

export function draftToMovimiento(d: MovimientoDraft): Omit<Movimiento, 'id'> {
  return {
    fecha: d.fecha, tipo: d.tipo, categoria: d.categoria.trim() || 'Varios', concepto: d.concepto.trim() || 'Sin concepto',
    presupuesto: parseFloat(d.presupuesto) || 0,
    monto: d.monto.trim() === '' ? null : (parseFloat(d.monto) || 0),
    metodoPago: d.metodoPago || undefined,
    deducible: d.deducible,
  };
}

export default function MovimientoForm({
  visible, onClose, onSave, onDelete, initial, title,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (d: MovimientoDraft) => void;
  onDelete?: () => void;
  initial?: MovimientoDraft;
  title: string;
}) {
  const c = useTheme();
  const [draft, setDraft] = useState<MovimientoDraft>(initial ?? emptyDraft());
  const [showPicker, setShowPicker] = useState(false);

  // Reset the draft only when the sheet transitions to open — `initial` is
  // rebuilt on every parent render (e.g. `emptyDraft()` inline), so keying
  // off it too would wipe whatever the user is typing on unrelated re-renders.
  React.useEffect(() => { if (visible) setDraft(initial ?? emptyDraft()); }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof MovimientoDraft>(k: K, v: MovimientoDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const dateObj = new Date(draft.fecha + 'T00:00:00');

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <SegmentedControl
        value={draft.tipo}
        onChange={(tipo) => set('tipo', tipo)}
        options={[{ label: 'Egreso', value: 'E' }, { label: 'Ingreso', value: 'I' }]}
      />

      <View style={styles.dateRow}>
        <Text style={[styles.label, { color: c.textMuted }]}>Fecha</Text>
        <Pressable onPress={() => setShowPicker(true)} style={[styles.dateBtn, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
          <Ionicons name="calendar-outline" size={16} color={c.textMuted} />
          <Text style={{ color: c.text, fontWeight: '600' }}>{draft.fecha}</Text>
        </Pressable>
      </View>
      {showPicker && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) set('fecha', selected.toISOString().slice(0, 10));
          }}
        />
      )}

      <CategoryPicker tipo={draft.tipo} value={draft.categoria} onChange={(v) => set('categoria', v)} />

      <FormField label="Concepto" value={draft.concepto} onChangeText={(v) => set('concepto', v)} placeholder="Ej. Supermercado" />

      <View style={styles.row2}>
        <FormField
          label="Presupuesto" style={{ flex: 1 }} value={draft.presupuesto} onChangeText={(v) => set('presupuesto', v)}
          keyboardType="decimal-pad" placeholder="0"
        />
        <FormField
          label="Real (vacío o 0 = pendiente)" style={{ flex: 1 }} value={draft.monto} onChangeText={(v) => set('monto', v)}
          keyboardType="decimal-pad" placeholder="0"
        />
      </View>

      <View style={styles.wrap}>
        <Text style={[styles.label, { color: c.textMuted }]}>Método de pago</Text>
        <View style={styles.chips}>
          {CONFIG.paymentMethods.map((mp) => (
            <Chip key={mp} label={mp} active={draft.metodoPago === mp} onPress={() => set('metodoPago', draft.metodoPago === mp ? '' : mp)} />
          ))}
        </View>
      </View>

      <FormSwitch label="Gasto deducible" value={draft.deducible} onValueChange={(v) => set('deducible', v)} />

      <View style={styles.actions}>
        {onDelete ? <Button label="Eliminar" variant="danger" icon="trash-outline" onPress={onDelete} style={{ flex: 1 }} /> : null}
        <Button label="Guardar" variant="primary" icon="checkmark" onPress={() => onSave(draft)} style={{ flex: 1 }} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12.5, fontWeight: '700' },
  dateRow: { gap: 8 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, alignSelf: 'flex-start' },
  row2: { flexDirection: 'row', gap: 12 },
  wrap: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 6 },
});
