import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Switch, ViewStyle } from 'react-native';
import { useTheme } from '@/src/store/hooks';

// `style` sizes/positions the field as a whole (e.g. `{ flex: 1 }` to share a
// row) and lands on the wrapping View — that's what every existing caller
// actually wants. `inputStyle` is for styling the TextInput itself (e.g.
// `{ textAlign: 'center' }` for a PIN field); it used to be conflated with
// `style`, which both mistyped against the View and silently no-opped since
// a View has no text to align.
export function FormField({
  label, style, inputStyle, ...rest
}: { label: string; style?: ViewStyle; inputStyle?: TextInputProps['style'] } & Omit<TextInputProps, 'style'>) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.textFaint}
        style={[styles.input, { color: c.text, backgroundColor: c.surfaceAlt, borderColor: c.border }, inputStyle]}
        {...rest}
      />
    </View>
  );
}

export function FormSwitch({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const c = useTheme();
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.label, { color: c.text, marginBottom: 0 }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: c.primary, false: c.border }} thumbColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12.5, fontWeight: '700', marginBottom: 2 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
});
