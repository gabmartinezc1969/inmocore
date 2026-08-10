import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function IconCircle({ icon, color, bg, size = 40 }: { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Ionicons name={icon} size={size * 0.46} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
