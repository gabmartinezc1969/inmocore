import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, layout } from '../theme';

export default function PaginationDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex && {
              width: layout.activeDotWidth,
              backgroundColor: colors.dotActive,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.dotGap,
  },
  dot: {
    width: layout.dotSize,
    height: layout.dotSize,
    borderRadius: layout.dotSize / 2,
    backgroundColor: colors.dotInactive,
  },
});
