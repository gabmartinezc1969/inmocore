import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useStore } from '@/src/store/useStore';
import { FONT_SCALES } from '@/src/config/config';

// Drop-in replacement for RN's <Text> that multiplies whatever fontSize a
// screen already set by the user's app-wide text-size preference
// (Configuración → Apariencia). Every `import { Text } from 'react-native'`
// in app/ and src/components/ is swapped for this, so the effect is
// global without having to touch every StyleSheet in the app.
export default function AppText({ style, ...rest }: TextProps) {
  const fontScale = useStore((s) => s.settings.fontScale);
  const scale = FONT_SCALES[fontScale] ?? 1;
  if (scale === 1) return <RNText style={style} {...rest} />;
  const flat = StyleSheet.flatten(style) || {};
  const base = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  return <RNText {...rest} style={[style, { fontSize: base * scale }]} />;
}
