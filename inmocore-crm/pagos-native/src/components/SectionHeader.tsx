import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import { useTheme } from '@/src/store/hooks';

export default function SectionHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sub, { color: c.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { fontSize: 13, marginTop: 2 },
});
