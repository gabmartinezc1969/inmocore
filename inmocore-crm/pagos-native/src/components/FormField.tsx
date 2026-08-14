import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet, Switch } from 'react-native';
import { useTheme } from '@/src/store/hooks';

export function FormField({ label, style, ...rest }: { label: string } & TextInputProps) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.textFaint}
        style={[styles.input, { color: c.text, backgroundColor: c.surfaceAlt, borderColor: c.border }]}
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
