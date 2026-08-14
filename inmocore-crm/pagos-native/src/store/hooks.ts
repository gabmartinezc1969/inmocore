import { useMemo } from 'react';
import { useStore } from './useStore';
import { palettes, Palette } from '@/src/theme/colors';
import { enrich, EnrichedRow } from '@/src/utils/finance';

export function useTheme(): Palette {
  const theme = useStore((s) => s.settings.theme);
  return palettes[theme];
}

export function useEnrichedLedger(): EnrichedRow[] {
  const ledger = useStore((s) => s.ledger);
  return useMemo(() => enrich(ledger), [ledger]);
}
