import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';
import { colors } from '../../theme';

// Slide 2 — "Earn as You Spend": two interlocking twisted rings (blue + coral)
// forming a woven wreath, a dollar coin at the center, and sparkle accents.
export default function RewardsIllustration({ size = 280 }: { size?: number }) {
  const cx = 140;
  const cy = 140;
  const rOuter = 92;
  const rInner = 58;

  return (
    <Svg width={size} height={size} viewBox="0 0 280 280">
      <Defs>
        <LinearGradient id="ringBlue" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.mint} />
          <Stop offset="1" stopColor={colors.blueDark} />
        </LinearGradient>
        <LinearGradient id="ringCoral" x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor={colors.coralDark} />
          <Stop offset="1" stopColor={colors.gold} />
        </LinearGradient>
        <LinearGradient id="centerCoin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor={colors.lavenderMid} />
        </LinearGradient>
      </Defs>

      {/* twisted ring made of alternating arcs to fake a braided/woven look */}
      <G>
        <Circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="none" stroke="url(#ringBlue)"
          strokeWidth={rOuter - rInner} strokeDasharray="34 18" strokeLinecap="round" />
        <Circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} fill="none" stroke="url(#ringCoral)"
          strokeWidth={rOuter - rInner} strokeDasharray="18 34" strokeDashoffset={26} strokeLinecap="round" />
      </G>

      {/* center coin */}
      <Circle cx={cx} cy={cy} r={30} fill="url(#centerCoin)" />
      <Path
        d={`M${cx},${cy - 14} v28 M${cx - 6},${cy + 10} h9 a6,6 0 0 0 0,-12 h-6 a6,6 0 0 1 0,-12 h9`}
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* sparkle accents */}
      {[
        { x: 236, y: 92, s: 9 },
        { x: 48, y: 108, s: 6 },
        { x: 66, y: 210, s: 7 },
        { x: 214, y: 214, s: 5 },
      ].map((p, i) => (
        <G key={i} opacity={0.9}>
          <Path
            d={`M${p.x},${p.y - p.s} L${p.x},${p.y + p.s} M${p.x - p.s},${p.y} L${p.x + p.s},${p.y}`}
            stroke="#ffffff"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </G>
      ))}
    </Svg>
  );
}
