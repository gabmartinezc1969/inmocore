import React, { PropsWithChildren } from 'react';
import { ScrollView, View, StyleSheet, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/store/hooks';

interface Props extends ScrollViewProps {
  scroll?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function Screen({ children, scroll = true, contentContainerStyle, edges, ...rest }: PropsWithChildren<Props>) {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]} edges={edges ?? ['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentContainerStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
});
