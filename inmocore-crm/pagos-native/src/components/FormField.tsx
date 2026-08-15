import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet, Switch, StyleProp, ViewStyle } from 'react-native';
import Text from '@/src/components/AppText';
import { useTheme } from '@/src/store/hooks';

// `style` here sizes the wrapping View (e.g. `style={{ flex: 1 }}` to sit
// two fields side by side) — it was never forwarded to the inner
// TextInput, so type it as ViewStyle instead of inheriting TextInputProps'
// own (TextStyle-typed) `style`, which doesn't match how every call site
// actually uses it.
export function FormField({ label, style, ...rest }: { label: string; style?: StyleProp<ViewStyle> } & Omit<TextInputProps, 'style'>) {
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
