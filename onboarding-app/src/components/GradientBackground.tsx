import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Full-bleed background: a top-to-bottom indigo→violet linear gradient with a
// soft radial glow behind the illustration, matching the mockup's lighting.
export default function GradientBackground({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.bgTop} />
          <Stop offset="0.55" stopColor={colors.bgMid} />
          <Stop offset="1" stopColor={colors.bgBottom} />
        </LinearGradient>
        <RadialGradient id="glow" cx="50%" cy="38%" r="45%">
          <Stop offset="0" stopColor={colors.glow} stopOpacity={0.55} />
          <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#bg)" />
      <Rect x={0} y={0} width={width} height={height} fill="url(#glow)" />
    </Svg>
  );
}
