import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import { colors, layout } from '../theme';

// Minimal placeholder for the screens the onboarding buttons lead to. The
// design brief only covers the onboarding carousel, so these keep the same
// visual language and just prove the buttons wire up to real navigation.
export default function AuthPlaceholderScreen({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" />
      <GradientBackground width={width} height={height} />
      <SafeAreaView style={[styles.flex, styles.center]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>This screen is a placeholder — wire up your real form here.</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: layout.horizontalPadding },
  title: { color: colors.textPrimary, fontSize: 26, fontWeight: '700', marginBottom: 10 },
  subtitle: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 28 },
  backButton: { paddingVertical: 10, paddingHorizontal: 18 },
  backText: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
});
