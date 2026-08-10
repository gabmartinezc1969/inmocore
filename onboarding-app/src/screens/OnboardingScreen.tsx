import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import PaginationDots from '../components/PaginationDots';
import { PrimaryButton, OutlineButton } from '../components/Buttons';
import { slides } from '../data/onboardingSlides';
import { colors, layout } from '../theme';

export default function OnboardingScreen({
  onSignUp,
  onLogIn,
}: {
  onSignUp: () => void;
  onLogIn: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    // Track the page live while dragging (not just on momentum end) so the
    // dots stay in sync on every platform, including react-native-web where
    // momentum-end timing can be unreliable.
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex((prev) => (prev === index ? prev : index));
  }

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" />
      <GradientBackground width={width} height={height} />
      <SafeAreaView style={styles.flex}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide) => {
            const Illustration = slide.Illustration;
            return (
              <View key={slide.key} style={[styles.slide, { width }]}>
                <View style={styles.illustrationWrap}>
                  <Illustration size={Math.min(width * 0.72, 280)} />
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <PaginationDots count={slides.length} activeIndex={activeIndex} />
          <View style={styles.buttonGroup}>
            <PrimaryButton label="Sign up" onPress={onSignUp} />
            <View style={{ height: 12 }} />
            <OutlineButton label="Log in" onPress={onLogIn} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.horizontalPadding,
  },
  illustrationWrap: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: layout.horizontalPadding,
    paddingBottom: 16,
  },
  buttonGroup: {
    marginTop: 28,
  },
});
