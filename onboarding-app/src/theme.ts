// Shared design tokens for the onboarding flow. Colors are sampled to match
// the reference mockup: a deep indigo-to-violet gradient background with
// glossy pastel accent objects (coins, rings, gems, a vault) floating on top.
export const colors = {
  bgTop: '#181528',
  bgMid: '#3a1f6b',
  bgBottom: '#5b2a8c',
  glow: '#7c4fd1',

  white: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.68)',

  dotActive: '#ffffff',
  dotInactive: 'rgba(255,255,255,0.32)',

  buttonPrimaryBg: '#ffffff',
  buttonPrimaryText: '#151225',
  buttonOutlineBorder: 'rgba(255,255,255,0.55)',
  buttonOutlineText: '#ffffff',

  // Illustration palette (glossy pastel gradients, one trio per slide)
  lavenderLight: '#d9d3ff',
  lavenderMid: '#a78bfa',
  lavenderDark: '#5b3fa0',
  slateLight: '#c7c9e8',
  slateDark: '#4b4a78',
  coral: '#ff8a65',
  coralDark: '#d9522f',
  blue: '#6fb7ff',
  blueDark: '#2f6fd6',
  pink: '#ff9ecb',
  pinkDark: '#d9427f',
  gold: '#ffd479',
  goldDark: '#e0982c',
  mint: '#bfe9ff',
  navy: '#241f45',
  navyLight: '#352a6b',
};

export const layout = {
  horizontalPadding: 28,
  buttonHeight: 56,
  buttonRadius: 28,
  dotSize: 8,
  dotGap: 6,
  activeDotWidth: 24,
};
