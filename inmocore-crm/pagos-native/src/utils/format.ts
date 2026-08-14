import { CONFIG } from '@/src/config/config';

export const fmtMoney = (v: number | null | undefined): string =>
  new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency, maximumFractionDigits: 0 }).format(v || 0);

export const fmtMoney2 = (v: number | null | undefined): string =>
  new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency, maximumFractionDigits: 2 }).format(v || 0);

export const fmtPct = (v: number): string => (isFinite(v) ? (v * 100).toFixed(1) + '%' : '—');

export const fmtDateISO = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(CONFIG.locale, { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateShort = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(CONFIG.locale, { day: '2-digit', month: 'short' });
};
