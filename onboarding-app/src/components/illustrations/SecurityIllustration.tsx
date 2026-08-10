import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Ellipse } from 'react-native-svg';
import { colors } from '../../theme';

// Slide 4 — "Bank-Level Security": a rounded vault pedestal with a domed
// shield cap, a small cloud badge, and a floating orbit sphere — echoing the
// bottle-and-cloud silhouette from the reference while reading as "secure".
export default function SecurityIllustration({ size = 280 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 280 280">
      <Defs>
        <LinearGradient id="vaultBase" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.navyLight} />
          <Stop offset="1" stopColor={colors.navy} />
        </LinearGradient>
        <LinearGradient id="vaultCap" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor={colors.lavenderMid} />
        </LinearGradient>
        <LinearGradient id="cloudGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor={colors.mint} />
        </LinearGradient>
        <LinearGradient id="orbGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.pink} />
          <Stop offset="1" stopColor={colors.pinkDark} />
        </LinearGradient>
      </Defs>

      {/* base column */}
      <Path
        d="M96,236 L96,150 a44,44 0 0 1 88,0 L184,236 Z"
        fill="url(#vaultBase)"
      />
      <Ellipse cx={140} cy={236} rx={44} ry={12} fill={colors.navy} opacity={0.6} />

      {/* domed shield cap */}
      <Path
        d="M92,150 a48,48 0 0 1 96,0 L188,150 a48,58 0 0 1 -96,0 Z"
        fill="url(#vaultCap)"
      />
      <Circle cx={140} cy={112} r={44} fill="url(#vaultCap)" />

      {/* lock glyph on the cap */}
      <Path
        d="M126,108 v-10 a14,14 0 0 1 28,0 v10"
        stroke={colors.navy}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M120,108 h40 v26 a4,4 0 0 1 -4,4 h-32 a4,4 0 0 1 -4,-4 z" fill={colors.navy} />

      {/* cloud badge */}
      <Path
        d="M206,74 a14,14 0 0 1 26,-4 a11,11 0 0 1 3,21.5 h-30 a10,10 0 0 1 1,-17.5 z"
        fill="url(#cloudGrad)"
      />

      {/* floating orbit sphere */}
      <Circle cx={58} cy={168} r={16} fill="url(#orbGrad)" />
      <Circle cx={64} cy={162} r={4} fill="#ffffff" opacity={0.6} />
    </Svg>
  );
}
