import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '@/src/components/Chip';
import SegmentedControl from '@/src/components/SegmentedControl';
import TransactionRow from '@/src/components/TransactionRow';
import EmptyState from '@/src/components/EmptyState';
import MovimientoForm, { emptyDraft, draftFromMovimiento, draftToMovimiento, MovimientoDraft } from '@/src/components/MovimientoForm';
import { useTheme } from '@/src/store/hooks';
import { useStore } from '@/src/store/useStore';
import { useEnrichedLedger } from '@/src/store/hooks';
import { allYears } from '@/src/utils/finance';
import { CONFIG } from '@/src/config/config';
import { Movimiento } from '@/src/types/models';

export default function MovimientosScreen() {
  const c = useTheme();
  const ledger = useEnrichedLedger();
  const addMovimiento = useStore((s) => s.addMovimiento);
  const updateMovimiento = useStore((s) => s.updateMovimiento);
  const deleteMovimiento = useStore((s) => s.deleteMovimiento);

  const [tipo, setTipo] = useState<'ALL' | 'I' | 'E'>('ALL');
  const [year, setYear] = useState<number | null>(null);
  const [monthIdx, setMonthIdx] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Movimiento | null>(null);

  const years = useMemo(() => allYears(ledger), [ledger]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ledger.filter((r) =>
      (tipo === 'ALL' || r.tipo === tipo) &&
      (year === null || r.year === year) &&
      (monthIdx === null || r.monthIdx === monthIdx) &&
      (!q || r.concepto.toLowerCase().includes(q) || r.categoria.toLowerCase().includes(q)));
  }, [ledger, tipo, year, monthIdx, search]);

  const sections = useMemo(() => {
    const groups: Record<string, Movimiento[]> = {};
    [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha)).forEach((r) => {
      const key = `${CONFIG.months[r.monthIdx]} ${r.year}`;
      (groups[key] = groups[key] || []).push(r);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [filtered]);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (m: Movimiento) => { setEditing(m); setFormOpen(true); };

  const handleSave = (d: MovimientoDraft) => {
    if (editing) updateMovimiento(editing.id, draftToMovimiento(d));
    else addMovimiento(draftToMovimiento(d));
    setFormOpen(false);
  };
  const handleDelete = () => {
    if (editing) deleteMovimiento(editing.id);
    setFormOpen(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Movimientos</Text>
        <Pressable onPress={openNew} style={[styles.addBtn, { backgroundColor: c.primary }]}>
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Ionicons name="search" size={16} color={c.textFaint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar concepto o categoría…"
            placeholderTextColor={c.textFaint}
            style={[styles.searchInput, { color: c.text }]}
          />
        </View>
      </View>

      <SegmentedControl
        value={tipo}
        onChange={setTipo}
        options={[{ label: 'Todos', value: 'ALL' }, { label: 'Ingresos', value: 'I' }, { label: 'Gastos', value: 'E' }]}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
        <Chip label="Todos los años" active={year === null} onPress={() => setYear(null)} />
        {years.map((y) => <Chip key={y} label={String(y)} active={year === y} onPress={() => setYear(y)} />)}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
        <Chip label="Todos los meses" active={monthIdx === null} onPress={() => setMonthIdx(null)} />
        {CONFIG.monthsAbbr.map((label, idx) => (
          <Chip key={label} label={label} active={monthIdx === idx} onPress={() => setMonthIdx(monthIdx === idx ? null : idx)} />
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionHeader, { color: c.text, backgroundColor: c.bg }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => <TransactionRow item={item} onPress={() => openEdit(item)} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState title="Sin movimientos" subtitle="Ajusta los filtros o agrega uno nuevo" />}
        stickySectionHeadersEnabled
      />

      <MovimientoForm
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar movimiento' : 'Agregar movimiento'}
        initial={editing ? draftFromMovimiento(editing) : emptyDraft()}
        onSave={handleSave}
        onDelete={editing ? handleDelete : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '800' },
  addBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  yearsRow: { marginTop: 12, marginBottom: 4, flexGrow: 0 },
  monthsRow: { marginTop: 8, marginBottom: 10, flexGrow: 0 },
  sectionHeader: { fontSize: 12.5, fontWeight: '800', textTransform: 'capitalize', paddingTop: 14, paddingBottom: 6 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
});
