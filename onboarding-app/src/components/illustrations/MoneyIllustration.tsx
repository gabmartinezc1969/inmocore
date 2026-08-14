import React from 'react';
import Svg, { Circle, Ellipse, Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';
import { colors } from '../../theme';

// Slide 1 — "Master Your Money": stacked coins with a floating "+" badge,
// a small dollar coin, and a paper-fan accent at the base.
export default function MoneyIllustration({ size = 280 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 280 280">
      <Defs>
        <LinearGradient id="coinBack" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.slateLight} />
          <Stop offset="1" stopColor={colors.slateDark} />
        </LinearGradient>
        <LinearGradient id="coinFront" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor={colors.lavenderMid} />
        </LinearGradient>
        <LinearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor={colors.mint} />
        </LinearGradient>
        <LinearGradient id="dollarGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.pink} />
          <Stop offset="1" stopColor={colors.pinkDark} />
        </LinearGradient>
      </Defs>

      {/* fan/flower accent at the base */}
      <G opacity={0.9}>
        {Array.from({ length: 9 }).map((_, i) => {
          const angle = (i / 8) * Math.PI - Math.PI;
          const x1 = 100 + Math.cos(angle) * 8;
          const y1 = 235 + Math.sin(angle) * 8;
          const x2 = 100 + Math.cos(angle) * 46;
          const y2 = 235 + Math.sin(angle) * 46;
          return (
            <Path
              key={i}
              d={`M${x1},${y1} L${x2},${y2}`}
              stroke="#ffffff"
              strokeWidth={7}
              strokeLinecap="round"
              opacity={0.85 - i * 0.03}
            />
          );
        })}
      </G>

      {/* back coin */}
      <Ellipse cx={128} cy={150} rx={78} ry={62} fill="url(#coinBack)" opacity={0.9} />
      {/* front coin */}
      <Ellipse cx={150} cy={128} rx={82} ry={66} fill="url(#coinFront)" />
      <Ellipse cx={150} cy={128} rx={82} ry={66} fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={2} />
      <Circle cx={126} cy={104} r={14} fill="#ffffff" opacity={0.35} />

      {/* plus badge */}
      <Circle cx={228} cy={78} r={34} fill="url(#badgeGrad)" />
      <Path d="M228,63 L228,93 M213,78 L243,78" stroke={colors.navy} strokeWidth={6} strokeLinecap="round" />

      {/* small dollar coin */}
      <Circle cx={70} cy={196} r={30} fill="url(#dollarGrad)" />
      <Path
        d="M70,182 v28 M64,204 h9 a6,6 0 0 0 0,-12 h-6 a6,6 0 0 1 0,-12 h9"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
