import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';

export interface DropdownOption<T> {
  label: string;
  value: T;
}

/**
 * A labeled trigger that opens a centered modal list to pick one option —
 * used for the Año / Mes filters in Movimientos. Kept dependency-free (no
 * @react-native-picker/picker) so the app stays runnable in plain Expo Go.
 */
export default function Dropdown<T extends string | number | null>({
  label, value, options, onChange, style,
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (v: T) => void;
  style?: object;
}) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { borderColor: c.border, backgroundColor: c.surfaceAlt }, style]}
      >
        <Text style={[styles.triggerLabel, { color: c.textMuted }]}>{label}</Text>
        <View style={styles.triggerValueRow}>
          <Text style={[styles.triggerValue, { color: c.text }]} numberOfLines={1}>{current?.label ?? '—'}</Text>
          <Ionicons name="chevron-down" size={15} color={c.textMuted} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.centerWrap} pointerEvents="box-none">
          <View style={[styles.menu, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }]}>
            <Text style={[styles.menuTitle, { color: c.text }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    onPress={() => { onChange(item.value); setOpen(false); }}
                    style={[styles.option, active && { backgroundColor: c.primarySoft }]}
                  >
                    <Text style={[styles.optionLabel, { color: active ? c.primary : c.text }]}>{item.label}</Text>
                    {active ? <Ionicons name="checkmark" size={16} color={c.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, gap: 2 },
  triggerLabel: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  triggerValueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  triggerValue: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize', flexShrink: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,30,0.35)' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  menu: { width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: 1, padding: 14, gap: 4, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 20, elevation: 4 },
  menuTitle: { fontSize: 13, fontWeight: '800', marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10 },
  optionLabel: { fontSize: 14.5, fontWeight: '600', textTransform: 'capitalize' },
});
