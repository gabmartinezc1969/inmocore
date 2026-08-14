import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Polygon } from 'react-native-svg';
import { colors } from '../../theme';

// Slide 3 — "Smarter Investing": three gem-cut pedestal blocks of varying
// height (navy / pink / lavender) with a bitcoin coin, a diamond, and a
// sparkle floating above them.
function Pedestal({ x, w, h, topY, gradId }: { x: number; w: number; h: number; topY: number; gradId: string }) {
  const half = w / 2;
  const top = topY;
  const bottom = topY + h;
  return (
    <Path
      d={`M${x - half},${top + 14} L${x},${top} L${x + half},${top + 14}
          L${x + half},${bottom - 14} L${x},${bottom} L${x - half},${bottom - 14} Z`}
      fill={`url(#${gradId})`}
    />
  );
}

export default function InvestingIllustration({ size = 280 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 280 280">
      <Defs>
        <LinearGradient id="pedNavy" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.navyLight} />
          <Stop offset="1" stopColor={colors.navy} />
        </LinearGradient>
        <LinearGradient id="pedPink" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.pink} />
          <Stop offset="1" stopColor={colors.pinkDark} />
        </LinearGradient>
        <LinearGradient id="pedLav" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="1" stopColor={colors.lavenderMid} />
        </LinearGradient>
        <LinearGradient id="btcGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.gold} />
          <Stop offset="1" stopColor={colors.goldDark} />
        </LinearGradient>
        <LinearGradient id="ethGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.mint} />
          <Stop offset="1" stopColor={colors.blueDark} />
        </LinearGradient>
      </Defs>

      {/* three pedestals, short-tall-medium like the reference */}
      <Pedestal x={68} w={70} h={70} topY={168} gradId="pedNavy" />
      <Pedestal x={148} w={78} h={112} topY={126} gradId="pedPink" />
      <Pedestal x={224} w={64} h={90} topY={148} gradId="pedLav" />

      {/* bitcoin coin above the tall pink pedestal */}
      <Circle cx={150} cy={92} r={26} fill="url(#btcGrad)" />
      <Path
        d="M142,80 h11 a6,6 0 0 1 0,12 h-11 z M142,92 h13 a6.5,6.5 0 0 1 0,13 h-13 z M142,78 v28 M147,74 v6 M155,74 v6 M147,105 v6 M155,105 v6"
        stroke="#ffffff"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* diamond above the navy pedestal */}
      <Polygon points="68,140 84,154 68,178 52,154" fill="url(#ethGrad)" opacity={0.95} />

      {/* sparkle above the lavender pedestal */}
      <Path
        d="M224,120 L224,138 M215,129 L233,129"
        stroke="#ffffff"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}
