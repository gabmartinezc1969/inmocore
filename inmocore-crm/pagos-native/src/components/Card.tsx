import React, { PropsWithChildren } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/store/hooks';

export default function Card({ children, style, padded = true }: PropsWithChildren<{ style?: ViewStyle; padded?: boolean }>) {
  const c = useTheme();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 2,
  },
  padded: { padding: 16 },
});
