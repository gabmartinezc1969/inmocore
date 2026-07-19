// Pure formatting helpers — no DOM, no state, safe to unit test directly.
import { CONFIG } from './config.js';

export const fmtMoney = (v) =>
  new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency, maximumFractionDigits: 0 }).format(v || 0);

export const fmtMoney2 = (v) =>
  new Intl.NumberFormat(CONFIG.locale, { style: 'currency', currency: CONFIG.currency, maximumFractionDigits: 2 }).format(v || 0);

export const fmtPct = (v) => (isFinite(v) ? (v * 100).toFixed(1) + '%' : '—');

export const fmtDate = (d) => d.toLocaleDateString(CONFIG.locale, { day: '2-digit', month: 'short', year: 'numeric' });
