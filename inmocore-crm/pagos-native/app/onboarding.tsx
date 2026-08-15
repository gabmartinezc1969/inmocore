import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useStore } from '@/src/store/useStore';
import { pressedStyle } from '@/src/utils/press';

const { width } = Dimensions.get('window');

export default function Onboarding() {
  const setOnboardingSeen = useStore((s) => s.setOnboardingSeen);

  const start = () => {
    setOnboardingSeen();
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={['#4B3FE4', '#2F27B0']} style={styles.fill}>
      <Svg style={StyleSheet.absoluteFill} width={width} height="100%">
        <Circle cx={width * 0.85} cy={110} r={70} fill="#FFFFFF" opacity={0.06} />
        <Circle cx={width * 0.12} cy={260} r={46} fill="#FF7A33" opacity={0.18} />
        <Circle cx={width * 0.9} cy={420} r={34} fill="#FFFFFF" opacity={0.08} />
        <Path d={`M0,${520} C${width * 0.3},${470} ${width * 0.7},${620} ${width},${540} L${width},1000 L0,1000 Z`} fill="#FFFFFF" opacity={0.05} />
      </Svg>

      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Ionicons name="card" size={26} color="#FF7A33" />
          </View>
        </View>

        <View style={styles.coinsRow}>
          <View style={[styles.coin, { backgroundColor: 'rgba(255,255,255,0.14)' }]}><Ionicons name="cash-outline" size={20} color="#fff" /></View>
          <View style={[styles.coin, styles.coinBig, { backgroundColor: 'rgba(255,255,255,0.18)' }]}><Text style={styles.coinDollar}>$</Text></View>
          <View style={[styles.coin, { backgroundColor: 'rgba(255,255,255,0.14)' }]}><Ionicons name="trending-up-outline" size={20} color="#fff" /></View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Pagos</Text>
          <Text style={styles.subtitle}>Tu centro financiero personal.{'\n'}Ingresos, gastos, deudas y patrimonio — todo en un solo lugar y con la mayor seguridad.</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <Pressable onPress={start} style={({ pressed }) => [styles.cta, pressedStyle(pressed, 0.85)]}>
            <Text style={styles.ctaText}>Comenzar</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 28, justifyContent: 'space-between', paddingBottom: 24 },
  hero: { alignItems: 'flex-end', paddingTop: 12 },
  badge: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  coinsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 8 },
  coin: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  coinBig: { width: 88, height: 88, borderRadius: 44 },
  coinDollar: { color: '#fff', fontSize: 34, fontWeight: '800' },
  copy: { gap: 12 },
  title: { color: '#fff', fontSize: 40, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.82)', fontSize: 15, lineHeight: 22 },
  footer: { gap: 20 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 22, backgroundColor: '#FF7A33' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FF7A33', paddingVertical: 17, borderRadius: 18 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
