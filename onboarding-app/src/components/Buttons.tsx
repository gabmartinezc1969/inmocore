import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, layout } from '../theme';

type ButtonProps = {
  label: string;
  onPress?: () => void;
};

export function PrimaryButton({ label, onPress }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles.primary, pressed && styles.pressed]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles.outline, pressed && styles.pressed]}
    >
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: layout.buttonHeight,
    borderRadius: layout.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  primary: {
    backgroundColor: colors.buttonPrimaryBg,
  },
  primaryText: {
    color: colors.buttonPrimaryText,
    fontSize: 17,
    fontWeight: '600',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.buttonOutlineBorder,
    backgroundColor: 'transparent',
  },
  outlineText: {
    color: colors.buttonOutlineText,
    fontSize: 17,
    fontWeight: '600',
  },
});
