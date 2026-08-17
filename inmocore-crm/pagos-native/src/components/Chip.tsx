import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { useTheme } from '@/src/store/hooks';
import { pressedStyle } from '@/src/utils/press';

export default function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { backgroundColor: active ? c.primary : c.surfaceAlt, borderColor: active ? c.primary : c.border }, pressedStyle(pressed)]}
    >
      <Text style={[styles.text, { color: active ? '#FFFFFF' : c.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 12.5, fontWeight: '700' },
});
