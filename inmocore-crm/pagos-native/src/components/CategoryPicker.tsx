import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '@/src/components/AppText';
import Chip from './Chip';
import { useTheme } from '@/src/store/hooks';
import { CONFIG } from '@/src/config/config';

export default function CategoryPicker({ tipo, value, onChange }: { tipo: 'I' | 'E'; value: string; onChange: (v: string) => void }) {
  const c = useTheme();
  const options = tipo === 'E' ? CONFIG.categories.egresoOrder : CONFIG.categories.ingresoOrder;
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.textMuted }]}>Categoría</Text>
      <View style={styles.chips}>
        {options.map((opt) => (
          <Chip key={opt} label={opt} active={opt === value} onPress={() => onChange(opt)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 12.5, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
