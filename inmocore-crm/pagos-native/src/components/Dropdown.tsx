import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sheet from './Sheet';
import { useTheme } from '@/src/store/hooks';

export interface DropdownOption {
  label: string;
  value: string;
}

// A compact "select" control: a small trigger button showing the current
// value, tapping it opens a bottom sheet with the full option list. Used to
// replace horizontally-scrolling chip rows where screen space is tight —
// one line instead of two, and nothing sits partially off-screen.
export default function Dropdown({
  title, icon, value, options, onChange, style,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.trigger, { backgroundColor: c.surfaceAlt, borderColor: c.border }, style]}
      >
        {icon ? <Ionicons name={icon} size={15} color={c.textMuted} /> : null}
        <Text style={[styles.label, { color: c.text }]} numberOfLines={1}>{current?.label ?? '—'}</Text>
        <Ionicons name="chevron-down" size={16} color={c.textFaint} />
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={title}>
        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => { onChange(opt.value); setOpen(false); }}
                style={[styles.option, { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primarySoft : 'transparent' }]}
              >
                <Text style={[styles.optionLabel, { color: active ? c.primary : c.text }]}>{opt.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color={c.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  label: { fontSize: 13.5, fontWeight: '700', flexShrink: 1 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  optionLabel: { fontSize: 14.5, fontWeight: '700' },
});
