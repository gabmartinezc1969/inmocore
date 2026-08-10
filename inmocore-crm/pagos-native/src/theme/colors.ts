// Design tokens taken from the reference mock (indigo hero + orange accent,
// soft light surfaces, rounded cards). `light` is the primary/only fully
// designed theme; `dark` is a functional derivation used by the
// Configuración > Apariencia toggle.

export type ThemeName = 'light' | 'dark';

export interface Palette {
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  income: string;
  incomeSoft: string;
  expense: string;
  expenseSoft: string;
  warning: string;
  warningSoft: string;
  white: string;
  shadow: string;
}

export const light: Palette = {
  bg: '#F3F4FB',
  bgAlt: '#ECEDF9',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F7FD',
  border: '#E7E8F3',
  text: '#1C1B33',
  textMuted: '#6B6C89',
  textFaint: '#9A9BB3',
  primary: '#4B3FE4',
  primaryDark: '#2F27B0',
  primarySoft: '#E7E4FB',
  accent: '#FF7A33',
  accentSoft: '#FFE7D6',
  income: '#17B991',
  incomeSoft: '#DDF6EE',
  expense: '#F0655A',
  expenseSoft: '#FCE4E2',
  warning: '#F2AA3E',
  warningSoft: '#FCEDD3',
  white: '#FFFFFF',
  shadow: 'rgba(43, 40, 110, 0.12)',
};

export const dark: Palette = {
  bg: '#100F22',
  bgAlt: '#161530',
  surface: '#1C1B3A',
  surfaceAlt: '#221F45',
  border: '#312E5C',
  text: '#F2F2FB',
  textMuted: '#ABA9D6',
  textFaint: '#7C7AA8',
  primary: '#8A7BFF',
  primaryDark: '#5B4FE0',
  primarySoft: '#2A2760',
  accent: '#FF9257',
  accentSoft: '#3A2A22',
  income: '#3FE0B0',
  incomeSoft: '#193A32',
  expense: '#FF8377',
  expenseSoft: '#3A2222',
  warning: '#F8C067',
  warningSoft: '#3A2F16',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.4)',
};

export const palettes: Record<ThemeName, Palette> = { light, dark };

// Stable per-category chart color rotation, independent of theme.
export const CATEGORY_PALETTE = [
  '#4B3FE4', '#FF7A33', '#17B991', '#F2AA3E', '#5BA8D4',
  '#F0655A', '#9B8CFF', '#A9C177', '#D4794C', '#7FB8A2',
  '#C27E8D', '#7E97A1', '#93A87C', '#E8B34B',
];

const categoryColorMap: Record<string, string> = {};
let nextSlot = 0;
export function catColor(cat: string): string {
  if (!(cat in categoryColorMap)) {
    categoryColorMap[cat] = CATEGORY_PALETTE[nextSlot % CATEGORY_PALETTE.length];
    nextSlot += 1;
  }
  return categoryColorMap[cat];
}

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const spacing = (n: number) => n * 4;
