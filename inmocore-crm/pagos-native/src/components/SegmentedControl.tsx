import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { useTheme } from '@/src/store/hooks';
import { pressedStyle } from '@/src/utils/press';

export default function SegmentedControl<T extends string>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  const c = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [styles.segment, active && { backgroundColor: c.primary }, !active && pressedStyle(pressed)]}
          >
            <Text style={[styles.text, { color: active ? '#fff' : c.textMuted }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  text: { fontSize: 13, fontWeight: '700' },
});
