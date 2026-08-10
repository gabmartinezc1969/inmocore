import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/store/hooks';

type Variant = 'primary' | 'accent' | 'ghost' | 'danger';

export default function Button({
  label, onPress, variant = 'primary', icon, style, disabled, loading, small,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
}) {
  const c = useTheme();
  const bg = variant === 'primary' ? c.primary : variant === 'accent' ? c.accent : variant === 'danger' ? c.expense : 'transparent';
  const border = variant === 'ghost' ? c.border : bg;
  const textColor = variant === 'ghost' ? c.text : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 17} color={textColor} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.label, small && styles.labelSmall, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1.5,
  },
  small: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  label: { fontSize: 15, fontWeight: '700' },
  labelSmall: { fontSize: 12.5 },
});
