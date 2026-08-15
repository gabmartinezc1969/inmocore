import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/src/store/hooks';
import { pressedStyle } from '@/src/utils/press';

// In-screen header for pushed (non-tab) screens, used instead of the
// native Stack header. Android's edge-to-edge default (SDK 54) can let
// the native header render under the status bar in this Expo Router
// setup, clipping the title — this renders inside the screen's own
// SafeAreaView (edges include 'top'), so its position is guaranteed
// correct regardless of platform header quirks.
export default function ScreenHeader({ title }: { title: string }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={10}
        style={({ pressed }) => [styles.backBtn, pressedStyle(pressed)]}
      >
        <Ionicons name="chevron-back" size={24} color={c.text} />
      </Pressable>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{title}</Text>
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 16.5, fontWeight: '800' },
});
