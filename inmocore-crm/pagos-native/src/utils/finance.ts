// Financial aggregation / scoring logic, ported from the web app's
// `pagos-app/src/modules/calculations.js` so both clients agree on the same
// formulas. Pure functions — everything takes the ledger explicitly.
import { CONFIG, yearMonthFromISO } from '@/src/config/config';
import { catColor } from '@/src/theme/colors';
import { fmtMoney, fmtPct } from './format';
import { Movimiento, Credito } from '@/src/types/models';

export { catColor };

const { egresoOrder: CAT_EGRESO_ORDER, ingresoOrder: CAT_INGRESO_ORDER, fijo: CAT_FIJO, debt: DEBT_CATS } = CONFIG.categories;

export interface RowFilter {
  year?: number;
  monthIdx?: number;
  tipo?: 'I' | 'E';
  categoria?: string;
}

export interface EnrichedRow extends Movimiento {
  year: number;
  monthIdx: number;
  day: number;
}

export function enrich(ledger: Movimiento[]): EnrichedRow[] {
  return ledger.map((r) => ({ ...r, ...yearMonthFromISO(r.fecha) }));
}

export const sum = (arr: { presupuesto: number }[]) => arr.reduce((s, r) => s + (r.presupuesto || 0), 0);
export const realSum = (arr: { monto: number | null }[]) => arr.reduce((s, r) => s + (r.monto || 0), 0);

export function filterRows(ledger: EnrichedRow[], f: RowFilter): EnrichedRow[] {
  return ledger.filter((r) =>
    (f.year === undefined || r.year === f.year) &&
    (f.monthIdx === undefined || r.monthIdx === f.monthIdx) &&
    (f.tipo === undefined || r.tipo === f.tipo) &&
    (f.categoria === undefined || r.categoria === f.categoria));
}

export function allYears(ledger: EnrichedRow[]): number[] {
  return [...new Set(ledger.map((r) => r.year))].sort((a, b) => a - b);
}

export function catList(tipo: 'I' | 'E', ledger: EnrichedRow[]): string[] {
  const order = tipo === 'E' ? CAT_EGRESO_ORDER : CAT_INGRESO_ORDER;
  const extra = [...new Set(ledger.filter((r) => r.tipo === tipo).map((r) => r.categoria))].filter((c) => !order.includes(c));
  return [...order, ...extra];
}

export interface CategoryRow { categoria: string; presupuesto: number; real: number; variacion: number }
export interface CategoryTable { rows: CategoryRow[]; totals: { presupuesto: number; real: number; variacion: number } }

export function categoryTable(ledger: EnrichedRow[], year: number | undefined, monthIdx: number | undefined, tipo: 'I' | 'E'): CategoryTable {
  const cats = catList(tipo, ledger);
  const rows = cats.map((categoria) => {
    const rs = filterRows(ledger, { year, monthIdx, tipo, categoria });
    const p = sum(rs), m = realSum(rs);
    return { categoria, presupuesto: p, real: m, variacion: m - p };
  });
  const totals = { presupuesto: rows.reduce((s, r) => s + r.presupuesto, 0), real: rows.reduce((s, r) => s + r.real, 0), variacion: 0 };
  totals.variacion = totals.real - totals.presupuesto;
  return { rows, totals };
}

export function topGastos(ledger: EnrichedRow[], year: number | undefined, monthIdx: number | undefined, n: number): EnrichedRow[] {
  const f: RowFilter = { tipo: 'E' };
  if (year !== undefined) f.year = year;
  if (monthIdx !== undefined) f.monthIdx = monthIdx;
  return filterRows(ledger, f).filter((r) => r.monto).sort((a, b) => (b.monto || 0) - (a.monto || 0)).slice(0, n);
}

export interface MonthKey { year: number; monthIdx: number }

export function allMonthsChronological(ledger: EnrichedRow[]): MonthKey[] {
  const years = allYears(ledger);
  if (!years.length) return [];
  const minY = years[0], maxY = years[years.length - 1];
  let minM = Math.min(...ledger.filter((r) => r.year === minY).map((r) => r.monthIdx));
  let maxM = Math.max(...ledger.filter((r) => r.year === maxY).map((r) => r.monthIdx));
  const out: MonthKey[] = [];
  let y = minY, m = minM;
  while (y < maxY || (y === maxY && m <= maxM)) {
    out.push({ year: y, monthIdx: m });
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
export const monthLabelShort = (mo: MonthKey) => CONFIG.monthsAbbr[mo.monthIdx] + ' ' + String(mo.year).slice(2);

export function targetYearMonth(ledger: EnrichedRow[], today: Date = new Date()): MonthKey {
  const y = today.getFullYear(), m = today.getMonth();
  if (ledger.some((r) => r.year === y && r.monthIdx === m && r.monto !== null)) return { year: y, monthIdx: m };
  const years = allYears(ledger);
  if (!years.length) return { year: y, monthIdx: m };
  const withReal = ledger.filter((r) => r.monto !== null);
  const pool = withReal.length ? withReal : ledger;
  const ly = Math.max(...pool.map((r) => r.year));
  const lm = Math.max(...pool.filter((r) => r.year === ly).map((r) => r.monthIdx));
  return { year: ly, monthIdx: lm };
}

export function historicalMonths(ledger: EnrichedRow[]): MonthKey[] {
  const { year, monthIdx } = targetYearMonth(ledger);
  return allMonthsChronological(ledger).filter((mo) => mo.year < year || (mo.year === year && mo.monthIdx <= monthIdx));
}
export const lastNMonths = (n: number, ledger: EnrichedRow[]) => historicalMonths(ledger).slice(-n);

export const cumulativeArray = (arr: number[]) => { let acc = 0; return arr.map((v) => { acc += v; return acc; }); };

export function conceptStats(categoria: string, concepto: string, ledger: EnrichedRow[]) {
  const rows = ledger.filter((r) => r.tipo === 'E' && r.categoria === categoria && r.concepto === concepto && r.monto !== null && (r.monto || 0) > 0);
  if (rows.length < 3) return null;
  return { avg: realSum(rows) / rows.length, n: rows.length };
}

export function fixedVariableExtra(ledger: EnrichedRow[], year: number, monthIdx: number) {
  const rows = filterRows(ledger, { year, monthIdx, tipo: 'E' }).filter((r) => r.monto !== null);
  let fijo = 0, variable = 0, extra = 0;
  rows.forEach((r) => {
    if (CAT_FIJO.has(r.categoria)) { fijo += r.monto || 0; return; }
    const stats = conceptStats(r.categoria, r.concepto, ledger);
    if (stats && (r.monto || 0) > stats.avg * 2) extra += r.monto || 0;
    else variable += r.monto || 0;
  });
  return { fijo, variable, extra };
}

export const daysInMonth = (year: number, monthIdx: number) => new Date(year, monthIdx + 1, 0).getDate();
export function dailySeriesMonth(ledger: EnrichedRow[], year: number, monthIdx: number) {
  const n = daysInMonth(year, monthIdx);
  const ing = new Array(n).fill(0), egr = new Array(n).fill(0);
  filterRows(ledger, { year, monthIdx }).forEach((r) => {
    if (r.monto === null) return;
    const d = r.day - 1;
    if (r.tipo === 'I') ing[d] += r.monto; else egr[d] += r.monto;
  });
  return { ing, egr };
}

export function paretoCategorias(ledger: EnrichedRow[], year: number) {
  const rows = categoryTable(ledger, year, undefined, 'E').rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real);
  const total = rows.reduce((s, r) => s + r.real, 0);
  let acc = 0;
  return rows.map((r) => { acc += r.real; return { ...r, pctAcum: total ? acc / total : 0 }; });
}

export interface Subscription {
  key: string; categoria: string; concepto: string; promedio: number; meses: number; ultimaFecha: string; costoAnual: number;
}
export function detectSubscriptions(ledger: EnrichedRow[], dismissed: string[] = []): Subscription[] {
  const dismissedSet = new Set(dismissed);
  const groups: Record<string, EnrichedRow[]> = {};
  ledger.filter((r) => r.tipo === 'E' && r.monto !== null && (r.monto || 0) > 0 && !DEBT_CATS.includes(r.categoria)).forEach((r) => {
    const key = r.categoria + '||' + r.concepto;
    (groups[key] = groups[key] || []).push(r);
  });
  const subs: Subscription[] = [];
  Object.entries(groups).forEach(([key, rows]) => {
    if (dismissedSet.has(key)) return;
    const monthsSet = new Set(rows.map((r) => r.year + '-' + r.monthIdx));
    if (monthsSet.size < 3) return;
    const amounts = rows.map((r) => r.monto || 0);
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    if (mean <= 0 || mean > 5000) return;
    const variance = amounts.reduce((s, v) => s + (v - mean) * (v - mean), 0) / amounts.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv > 0.25) return;
    const sorted = rows.slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
    subs.push({ key, categoria: sorted[0].categoria, concepto: sorted[0].concepto, promedio: mean, meses: monthsSet.size, ultimaFecha: sorted[sorted.length - 1].fecha, costoAnual: mean * 12 });
  });
  return subs.sort((a, b) => b.promedio - a.promedio);
}

export interface PendingItem extends EnrichedRow { diffDays: number }
export function pendingItems(ledger: EnrichedRow[], today: Date = new Date()): PendingItem[] {
  const t = new Date(today); t.setHours(0, 0, 0, 0);
  return ledger
    .filter((r) => r.tipo === 'E' && r.presupuesto > 0 && (r.monto === null || r.monto === 0))
    .map((r) => ({ ...r, diffDays: Math.round((new Date(r.fecha + 'T00:00:00').getTime() - t.getTime()) / 86400000) }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export interface Alert { sev: 'high' | 'medium' | 'low'; icon: string; title: string; detail: string }
export function computeAlerts(ledger: EnrichedRow[], today: Date = new Date()): Alert[] {
  if (!ledger.length) return [];
  const alerts: Alert[] = [];
  const { year: targetY, monthIdx: targetM } = targetYearMonth(ledger, today);

  const egr = categoryTable(ledger, targetY, targetM, 'E');
  egr.rows.filter((r) => r.presupuesto > 0 && r.real > r.presupuesto).forEach((r) => {
    alerts.push({ sev: 'high', icon: '⚠️', title: `${r.categoria} excedió el presupuesto`, detail: `Gastado ${fmtMoney(r.real)} de ${fmtMoney(r.presupuesto)} presupuestados (${fmtPct((r.real - r.presupuesto) / r.presupuesto)} sobre el límite).` });
  });

  const ing = categoryTable(ledger, targetY, targetM, 'I');
  if (ing.totals.real > 0) {
    const tasa = (ing.totals.real - egr.totals.real) / ing.totals.real;
    if (tasa < 0.10) {
      alerts.push({ sev: tasa < 0 ? 'high' : 'medium', icon: '💸', title: 'Tasa de ahorro baja este mes', detail: `Tu tasa de ahorro es de ${fmtPct(tasa)}. Se recomienda mantenerla arriba de 10–20%.` });
    }
  }

  const pend = pendingItems(ledger, today);
  const vencidos = pend.filter((i) => i.diffDays < 0);
  const proximos = pend.filter((i) => i.diffDays >= 0 && i.diffDays <= 7);
  if (vencidos.length) alerts.push({ sev: 'high', icon: '⏰', title: `${vencidos.length} pago(s) vencido(s)`, detail: vencidos.slice(0, 3).map((i) => `${i.categoria} · ${i.concepto} (${fmtMoney(i.presupuesto)})`).join(' · ') });
  if (proximos.length) alerts.push({ sev: 'medium', icon: '📅', title: `${proximos.length} pago(s) en los próximos 7 días`, detail: proximos.slice(0, 3).map((i) => `${i.categoria} · ${i.concepto} (${fmtMoney(i.presupuesto)})`).join(' · ') });

  filterRows(ledger, { year: targetY, monthIdx: targetM, tipo: 'E' }).filter((r) => r.monto !== null && (r.monto || 0) > 0).forEach((r) => {
    const stats = conceptStats(r.categoria, r.concepto, ledger);
    if (stats && (r.monto || 0) > stats.avg * 2.2) {
      alerts.push({ sev: 'medium', icon: '📈', title: `Gasto inusual en ${r.concepto}`, detail: `${fmtMoney(r.monto)} registrado vs. un promedio histórico de ${fmtMoney(stats.avg)}.` });
    }
  });

  const histMonths = historicalMonths(ledger).filter((mo) => !(mo.year === targetY && mo.monthIdx === targetM));
  if (histMonths.length >= 3) {
    const histAvg = histMonths.reduce((s, mo) => s + realSum(filterRows(ledger, { year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' })), 0) / histMonths.length;
    if (histAvg > 0 && ing.totals.real < histAvg * 0.7) {
      alerts.push({ sev: 'medium', icon: '📉', title: 'Ingreso por debajo del promedio', detail: `Este mes: ${fmtMoney(ing.totals.real)} vs. promedio histórico de ${fmtMoney(histAvg)}.` });
    }
  }
  const order = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => order[a.sev] - order[b.sev]);
}

/* ---- credits / French amortization ---- */
export interface AmortizationStatus { pago: number; saldoTeorico: number; monthsElapsed: number; mesesRestantes: number; totalMeses: number }
export function amortizationStatus(credit: Credito, now: Date = new Date()): AmortizationStatus | null {
  const P = credit.monto || 0;
  const n = credit.plazo || 0;
  const rAnnual = (credit.tasa || 0) / 100;
  const r = rAnnual / 12;
  if (P <= 0 || n <= 0) return null;
  const start = new Date(credit.inicio + 'T00:00:00');
  let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  monthsElapsed = Math.max(0, Math.min(n, monthsElapsed));
  let pago: number, saldoTeorico: number;
  if (r === 0) {
    pago = P / n;
    saldoTeorico = P - pago * monthsElapsed;
  } else {
    pago = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    saldoTeorico = P * (Math.pow(1 + r, n) - Math.pow(1 + r, monthsElapsed)) / (Math.pow(1 + r, n) - 1);
  }
  saldoTeorico = Math.max(0, saldoTeorico);
  return { pago, saldoTeorico, monthsElapsed, mesesRestantes: n - monthsElapsed, totalMeses: n };
}

export function creditRealPayments(credit: Credito, ledger: EnrichedRow[]) {
  if (!credit.categoria) return { total: 0, count: 0 };
  const start = credit.inicio ? new Date(credit.inicio + 'T00:00:00') : null;
  const rows = ledger.filter((r) => r.tipo === 'E' && r.categoria === credit.categoria && r.monto && (!start || new Date(r.fecha + 'T00:00:00') >= start));
  return { total: realSum(rows), count: rows.length };
}

export function totalDebt(credits: Credito[], now: Date = new Date()): number {
  return credits.reduce((debt, c) => {
    const am = amortizationStatus(c, now);
    const saldo = (typeof c.saldoBanco === 'number' && c.saldoBanco > 0) ? c.saldoBanco : (am ? am.saldoTeorico : 0);
    return debt + (saldo || 0);
  }, 0);
}

/* ---- 0-100 financial health score ---- */
export interface ScoreResult { total: number; label: string; parts: { nombre: string; pts: number; max: number; detalle: string }[] }
export function scoreFromMetrics({ savingsRate, debtLoad, budgetOverspendRatio }: { savingsRate: number; debtLoad: number; budgetOverspendRatio: number }): ScoreResult {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const ptsAhorro = clamp((savingsRate / 0.30) * 40, 0, 40);
  const ptsDeuda = clamp((1 - debtLoad / 0.50) * 30, 0, 30);
  const ptsPresu = budgetOverspendRatio > 0 ? clamp(30 * (1 - budgetOverspendRatio), 0, 30) : 30;
  const total = Math.round(ptsAhorro + ptsDeuda + ptsPresu);
  const label = total >= 80 ? 'Excelente' : total >= 60 ? 'Bueno' : total >= 40 ? 'Regular' : 'Frágil';
  return {
    total, label,
    parts: [
      { nombre: 'Tasa de ahorro (6m)', pts: Math.round(ptsAhorro), max: 40, detalle: fmtPct(savingsRate) + ' promedio' },
      { nombre: 'Carga de deuda', pts: Math.round(ptsDeuda), max: 30, detalle: fmtPct(debtLoad) + ' del ingreso va a deuda' },
      { nombre: 'Cumplimiento de presupuesto', pts: Math.round(ptsPresu), max: 30, detalle: 'mes en curso' },
    ],
  };
}

export function computeFinancialScore(ledger: EnrichedRow[]): ScoreResult & { avgTasa: number; cargaDeuda: number } {
  if (!ledger.length) return { ...scoreFromMetrics({ savingsRate: 0, debtLoad: 0, budgetOverspendRatio: 0 }), avgTasa: 0, cargaDeuda: 0 };
  const last6 = lastNMonths(6, ledger);
  const tasas = last6.map((mo) => {
    const i = realSum(filterRows(ledger, { year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' }));
    const e = realSum(filterRows(ledger, { year: mo.year, monthIdx: mo.monthIdx, tipo: 'E' }));
    return i > 0 ? (i - e) / i : null;
  }).filter((v): v is number => v !== null);
  const avgTasa = tasas.length ? tasas.reduce((s, v) => s + v, 0) / tasas.length : 0;

  const ingresos6 = last6.reduce((s, mo) => s + realSum(filterRows(ledger, { year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' })), 0);
  const pagosDeuda6 = last6.reduce((s, mo) => s + DEBT_CATS.reduce((s2, cat) => s2 + realSum(filterRows(ledger, { year: mo.year, monthIdx: mo.monthIdx, tipo: 'E', categoria: cat })), 0), 0);
  const cargaDeuda = ingresos6 > 0 ? pagosDeuda6 / ingresos6 : 1;

  const { year, monthIdx } = targetYearMonth(ledger);
  const egr = categoryTable(ledger, year, monthIdx, 'E');
  const budgetOverspendRatio = (egr.totals.presupuesto > 0 && egr.totals.real > egr.totals.presupuesto)
    ? (egr.totals.real - egr.totals.presupuesto) / egr.totals.presupuesto
    : 0;

  return { ...scoreFromMetrics({ savingsRate: avgTasa, debtLoad: cargaDeuda, budgetOverspendRatio }), avgTasa, cargaDeuda };
}
