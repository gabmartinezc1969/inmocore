// Financial metrics: aggregation, scoring, budgets, ratios. Pure functions —
// no DOM access. Every function takes an explicit `ledger` (defaulting to
// the live store) so they can be unit-tested with fake data.
import { CONFIG, catColor } from './config.js';
import { fmtMoney, fmtPct } from './format.js';
import { state } from './state.js';

export { catColor };

const { egresoOrder: CAT_EGRESO_ORDER, ingresoOrder: CAT_INGRESO_ORDER, fijo: CAT_FIJO, debt: DEBT_CATS } = CONFIG.categories;

export const sum = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0);
export const realSum = (arr) => arr.reduce((s, r) => s + (r.monto || 0), 0);

export function filterRows(f, ledger = state.ledger) {
  return ledger.filter((r) =>
    (f.year === undefined || r.year === f.year) &&
    (f.monthIdx === undefined || r.monthIdx === f.monthIdx) &&
    (f.tipo === undefined || r.tipo === f.tipo) &&
    (f.categoria === undefined || r.categoria === f.categoria)
  );
}

export function allYears(ledger = state.ledger) {
  return [...new Set(ledger.map((r) => r.year))].sort((a, b) => a - b);
}

export function catList(tipo, ledger = state.ledger, customCats = state.customCats) {
  const order = tipo === 'E' ? CAT_EGRESO_ORDER : CAT_INGRESO_ORDER;
  const extra = [...new Set(ledger.filter((r) => r.tipo === tipo).map((r) => r.categoria))].filter((c) => !order.includes(c));
  const all = [...order, ...extra];
  const custom = (customCats && customCats[tipo === 'E' ? 'egreso' : 'ingreso']) || [];
  custom.forEach((c) => { if (!all.includes(c)) all.push(c); });
  return all;
}

export function categoryTable(year, monthIdx, tipo, ledger = state.ledger, customCats = state.customCats) {
  const cats = catList(tipo, ledger, customCats);
  const rows = cats.map((cat) => {
    const rs = filterRows({ year, monthIdx, tipo, categoria: cat }, ledger);
    const p = sum(rs, 'presupuesto'), m = realSum(rs);
    return { categoria: cat, presupuesto: p, real: m, variacion: m - p };
  });
  const totals = { presupuesto: sum(rows, 'presupuesto'), real: sum(rows, 'real') };
  totals.variacion = totals.real - totals.presupuesto;
  return { rows, totals };
}

export function topGastos(year, monthIdx, n, ledger = state.ledger) {
  const f = { tipo: 'E' };
  if (year !== undefined) f.year = year;
  if (monthIdx !== undefined) f.monthIdx = monthIdx;
  return filterRows(f, ledger).filter((r) => r.monto).sort((a, b) => b.monto - a.monto).slice(0, n);
}

/* ---- chronological month helpers (for trends / cumulative history) ---- */
export function allMonthsChronological(ledger = state.ledger) {
  const years = allYears(ledger);
  if (!years.length) return [];
  const minY = years[0], maxY = years[years.length - 1];
  let minM = Math.min(...ledger.filter((r) => r.year === minY).map((r) => r.monthIdx));
  let maxM = Math.max(...ledger.filter((r) => r.year === maxY).map((r) => r.monthIdx));
  const out = [];
  let y = minY, m = minM;
  while (y < maxY || (y === maxY && m <= maxM)) {
    out.push({ year: y, monthIdx: m });
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
}
export const monthLabelShort = (mo) => CONFIG.monthsAbbr[mo.monthIdx] + ' ' + String(mo.year).slice(2);

/** "Now", or the latest month present in the ledger if the current month has no data yet. */
export function targetYearMonth(ledger = state.ledger, today = new Date()) {
  const y = today.getFullYear(), m = today.getMonth();
  if (ledger.some((r) => r.year === y && r.monthIdx === m)) return { year: y, monthIdx: m };
  const years = allYears(ledger);
  const ly = years[years.length - 1];
  const lm = Math.max(...ledger.filter((r) => r.year === ly).map((r) => r.monthIdx));
  return { year: ly, monthIdx: lm };
}

// Months up to and including the target month — excludes future budgeted-only
// placeholder months so history, averages and alerts aren't skewed by things
// that haven't happened yet.
export function historicalMonths(ledger = state.ledger) {
  const { year, monthIdx } = targetYearMonth(ledger);
  return allMonthsChronological(ledger).filter((mo) => mo.year < year || (mo.year === year && mo.monthIdx <= monthIdx));
}
export const lastNMonths = (n, ledger = state.ledger) => historicalMonths(ledger).slice(-n);

export function movingAverage(arr, w) {
  return arr.map((_, i) => {
    const start = Math.max(0, i - w + 1);
    const slice = arr.slice(start, i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

/** Builds a minimal inline sparkline <svg> string — pure string templating, no DOM. */
export function sparklineSVG(values, w, h, color) {
  if (!values.length) return '';
  const max = Math.max(...values, 0.0001), min = Math.min(...values, 0);
  const range = (max - min) || 1;
  const step = w / Math.max(1, values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export const cumulativeArray = (arr) => { let acc = 0; return arr.map((v) => { acc += v; return acc; }); };

/* ---- fixed vs variable vs extraordinary (for the "Ingresos a Ahorro" waterfall) ---- */
export function conceptStats(categoria, concepto, ledger = state.ledger) {
  const rows = ledger.filter((r) => r.tipo === 'E' && r.categoria === categoria && r.concepto === concepto && r.monto !== null && r.monto > 0);
  if (rows.length < 3) return null;
  return { avg: realSum(rows) / rows.length, n: rows.length };
}
export function fixedVariableExtra(year, monthIdx, ledger = state.ledger) {
  const rows = filterRows({ year, monthIdx, tipo: 'E' }, ledger).filter((r) => r.monto !== null);
  let fijo = 0, variable = 0, extra = 0;
  rows.forEach((r) => {
    if (CAT_FIJO.has(r.categoria)) { fijo += r.monto; return; }
    const stats = conceptStats(r.categoria, r.concepto, ledger);
    if (stats && r.monto > stats.avg * 2) extra += r.monto;
    else variable += r.monto;
  });
  return { fijo, variable, extra };
}

/* ---- daily series within a month ---- */
export const daysInMonth = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();
export function dailySeriesMonth(year, monthIdx, ledger = state.ledger) {
  const n = daysInMonth(year, monthIdx);
  const ing = new Array(n).fill(0), egr = new Array(n).fill(0);
  filterRows({ year, monthIdx }, ledger).forEach((r) => {
    const d = r.date.getDate() - 1;
    if (r.monto === null) return;
    if (r.tipo === 'I') ing[d] += r.monto; else egr[d] += r.monto;
  });
  return { ing, egr };
}

/* ---- pareto (80/20) ---- */
export function paretoCategorias(year, ledger = state.ledger) {
  const rows = categoryTable(year, undefined, 'E', ledger).rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real);
  const total = sum(rows, 'real');
  let acc = 0;
  return rows.map((r) => { acc += r.real; return { ...r, pctAcum: total ? acc / total : 0 }; });
}

/* ---- treemap (simple proportional mosaic, not a strict squarified algorithm) ---- */
export function treemapData(year, tipo, ledger = state.ledger) {
  const rows = categoryTable(year, undefined, tipo, ledger).rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real);
  const total = sum(rows, 'real') || 1;
  return rows.map((r) => ({ categoria: r.categoria, value: r.real, pct: r.real / total }));
}

/* ---- payment methods / fiscal ---- */
export function paymentMethodTotals(year, ledger = state.ledger) {
  const rows = filterRows({ year, tipo: 'E' }, ledger).filter((r) => r.monto);
  const totals = {};
  rows.forEach((r) => { const key = r.metodoPago || 'Sin especificar'; totals[key] = (totals[key] || 0) + r.monto; });
  return Object.entries(totals).map(([k, v]) => ({ metodo: k, total: v })).sort((a, b) => b.total - a.total);
}
export function deducibleTotals(year, ledger = state.ledger) {
  const rows = filterRows({ year, tipo: 'E' }, ledger).filter((r) => r.monto && r.deducible);
  const byCat = {};
  rows.forEach((r) => { byCat[r.categoria] = (byCat[r.categoria] || 0) + r.monto; });
  return {
    rows: Object.entries(byCat).map(([c, v]) => ({ categoria: c, total: v })).sort((a, b) => b.total - a.total),
    total: sum(rows, 'monto'),
  };
}

/* ---- subscriptions (auto-detected recurring fixed charges) ---- */
export function detectSubscriptions(ledger = state.ledger, dismissedSubs = state.dismissedSubs) {
  const dismissed = new Set(dismissedSubs);
  const groups = {};
  ledger.filter((r) => r.tipo === 'E' && r.monto !== null && r.monto > 0 && !DEBT_CATS.includes(r.categoria)).forEach((r) => {
    const key = r.categoria + '||' + r.concepto;
    (groups[key] = groups[key] || []).push(r);
  });
  const subs = [];
  Object.entries(groups).forEach(([key, rows]) => {
    if (dismissed.has(key)) return;
    const monthsSet = new Set(rows.map((r) => r.year + '-' + r.monthIdx));
    if (monthsSet.size < 3) return;
    const amounts = rows.map((r) => r.monto);
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
    if (mean <= 0 || mean > 5000) return;
    const variance = amounts.reduce((s, v) => s + (v - mean) * (v - mean), 0) / amounts.length;
    const cv = Math.sqrt(variance) / mean;
    if (cv > 0.25) return;
    const sorted = rows.slice().sort((a, b) => a.date - b.date);
    subs.push({ key, categoria: sorted[0].categoria, concepto: sorted[0].concepto, promedio: mean, meses: monthsSet.size, ultimaFecha: sorted[sorted.length - 1].date, costoAnual: mean * 12 });
  });
  return subs.sort((a, b) => b.promedio - a.promedio);
}

/* ---- reminders / pending scheduled payments ---- */
export function pendingItems(ledger = state.ledger, today = new Date()) {
  const t = new Date(today); t.setHours(0, 0, 0, 0);
  return ledger
    .filter((r) => r.tipo === 'E' && r.presupuesto > 0 && (r.monto === null || r.monto === 0))
    .map((r) => ({ ...r, diffDays: Math.round((r.date - t) / 86400000) }))
    .sort((a, b) => a.date - b.date);
}

/* ---- alerts ---- */
export function computeAlerts(ledger = state.ledger, today = new Date()) {
  const alerts = [];
  const t = new Date(today); t.setHours(0, 0, 0, 0);
  const y = t.getFullYear(), m = t.getMonth();
  const hasCurrent = ledger.some((r) => r.year === y && r.monthIdx === m);
  const years = allYears(ledger);
  const targetY = hasCurrent ? y : years[years.length - 1];
  const monthsInTargetYear = ledger.filter((r) => r.year === targetY).map((r) => r.monthIdx);
  const targetM = hasCurrent ? m : Math.max(...monthsInTargetYear);

  const egr = categoryTable(targetY, targetM, 'E', ledger);
  egr.rows.filter((r) => r.presupuesto > 0 && r.real > r.presupuesto).forEach((r) => {
    alerts.push({ sev: 'high', icon: '⚠️', title: `${r.categoria} excedió el presupuesto`, detail: `Gastado ${fmtMoney(r.real)} de ${fmtMoney(r.presupuesto)} presupuestados (${fmtPct((r.real - r.presupuesto) / r.presupuesto)} sobre el límite).` });
  });

  const ing = categoryTable(targetY, targetM, 'I', ledger);
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

  filterRows({ year: targetY, monthIdx: targetM, tipo: 'E' }, ledger).filter((r) => r.monto !== null && r.monto > 0).forEach((r) => {
    const stats = conceptStats(r.categoria, r.concepto, ledger);
    if (stats && r.monto > stats.avg * 2.2) {
      alerts.push({ sev: 'medium', icon: '📈', title: `Gasto inusual en ${r.concepto}`, detail: `${fmtMoney(r.monto)} registrado vs. un promedio histórico de ${fmtMoney(stats.avg)}.` });
    }
  });

  const histMonths = historicalMonths(ledger).filter((mo) => !(mo.year === targetY && mo.monthIdx === targetM));
  if (histMonths.length >= 3) {
    const histAvg = sum(histMonths.map((mo) => ({ v: realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' }, ledger)) })), 'v') / histMonths.length;
    if (histAvg > 0 && ing.totals.real < histAvg * 0.7) {
      alerts.push({ sev: 'medium', icon: '📉', title: 'Ingreso por debajo del promedio', detail: `Este mes: ${fmtMoney(ing.totals.real)} vs. promedio histórico de ${fmtMoney(histAvg)}.` });
    }
  }
  const order = { high: 0, medium: 1, low: 2 };
  return alerts.sort((a, b) => order[a.sev] - order[b.sev]);
}

/* ---- credits / amortization ---- */
export function amortizationStatus(credit, now = new Date()) {
  const P = credit.monto || 0;
  const n = credit.plazo || 0;
  const rAnnual = (credit.tasa || 0) / 100;
  const r = rAnnual / 12;
  if (P <= 0 || n <= 0) return null;
  const start = new Date(credit.inicio + 'T00:00:00');
  let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  monthsElapsed = Math.max(0, Math.min(n, monthsElapsed));
  let pago, saldoTeorico;
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
export function creditRealPayments(credit, ledger = state.ledger) {
  if (!credit.categoria) return { total: 0, count: 0 };
  const start = credit.inicio ? new Date(credit.inicio + 'T00:00:00') : null;
  const rows = ledger.filter((r) => r.tipo === 'E' && r.categoria === credit.categoria && r.monto && (!start || r.date >= start));
  return { total: realSum(rows), count: rows.length };
}

export function totalDebt(credits = state.credits, debtBalances = state.debtBalances, now = new Date()) {
  let debt = 0;
  const coveredCats = new Set();
  credits.forEach((c) => {
    const am = amortizationStatus(c, now);
    const saldo = (typeof c.saldoBanco === 'number' && c.saldoBanco > 0) ? c.saldoBanco : (am ? am.saldoTeorico : 0);
    debt += saldo || 0;
    if (c.categoria) coveredCats.add(c.categoria);
  });
  Object.entries(debtBalances).forEach(([cat, saldo]) => {
    if (typeof saldo === 'number' && saldo > 0 && !coveredCats.has(cat)) debt += saldo;
  });
  return debt;
}

/**
 * Pure scoring formula: 0-100 financial health score from three ratios.
 * savingsRate: (income - expenses) / income, avg over the trailing window.
 * debtLoad: debt payments / income, avg over the trailing window.
 * budgetOverspendRatio: how far the current month's spend is over budget
 *   (0 = on/under budget, 0.2 = 20% over, etc).
 */
export function scoreFromMetrics({ savingsRate, debtLoad, budgetOverspendRatio }) {
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
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

/** Gathers the three ratios `scoreFromMetrics` needs from the live ledger, then scores them. */
export function computeFinancialScore(ledger = state.ledger) {
  const last6 = lastNMonths(6, ledger);
  const tasas = last6.map((mo) => {
    const i = realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' }, ledger));
    const e = realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'E' }, ledger));
    return i > 0 ? (i - e) / i : null;
  }).filter((v) => v !== null);
  const avgTasa = tasas.length ? tasas.reduce((s, v) => s + v, 0) / tasas.length : 0;

  const ingresos6 = sum(last6.map((mo) => ({ v: realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' }, ledger)) })), 'v');
  const pagosDeuda6 = sum(last6.map((mo) => ({ v: sum(DEBT_CATS.map((cat) => ({ v: realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'E', categoria: cat }, ledger)) })), 'v') })), 'v');
  const cargaDeuda = ingresos6 > 0 ? pagosDeuda6 / ingresos6 : 1;

  const { year, monthIdx } = targetYearMonth(ledger);
  const egr = categoryTable(year, monthIdx, 'E', ledger);
  const budgetOverspendRatio = (egr.totals.presupuesto > 0 && egr.totals.real > egr.totals.presupuesto)
    ? (egr.totals.real - egr.totals.presupuesto) / egr.totals.presupuesto
    : 0;

  return { ...scoreFromMetrics({ savingsRate: avgTasa, debtLoad: cargaDeuda, budgetOverspendRatio }), avgTasa, cargaDeuda };
}

/** Year/month keys strictly after the current real month — used for bulk "delete future" tools. */
export function futureMonthOptions(ledger = state.ledger, now = new Date()) {
  const curY = now.getFullYear(), curM = now.getMonth();
  const found = new Set();
  ledger.forEach((r) => { if (r.year > curY || (r.year === curY && r.monthIdx > curM)) found.add(r.year + '-' + r.monthIdx); });
  return [...found].map((k) => { const [y, mo] = k.split('-').map(Number); return { year: y, monthIdx: mo }; })
    .sort((a, b) => a.year - b.year || a.monthIdx - b.monthIdx);
}

/* ---- custom dashboard widget builder: turns a widget config into labels + datasets ---- */
export const CB_METRIC_TIPO = { egresos: 'E', ingresos: 'I', saldo: null, presupuestoE: 'E', presuVsReal: 'E' };
export const CB_GROUPS = {
  mes: { label: 'Por mes (de un año)' },
  anio: { label: 'Por año' },
  categoria: { label: 'Por categoría' },
  concepto: { label: 'Por concepto (top 10)' },
  dia: { label: 'Por día (de un mes)' },
};
export function cbGroupOptionsFor(metric) {
  return metric === 'saldo' ? ['mes', 'anio', 'dia'] : ['mes', 'anio', 'categoria', 'concepto', 'dia'];
}
export function cbAutoTitle(cfg) {
  const mNames = { egresos: 'Egresos', ingresos: 'Ingresos', saldo: 'Saldo', presupuestoE: 'Presupuesto', presuVsReal: 'Presupuesto vs. Real' };
  let t = mNames[cfg.metric] || '';
  const gNames = { mes: 'por mes', anio: 'por año', categoria: 'por categoría', concepto: 'por concepto', dia: 'por día' };
  t += ' ' + (gNames[cfg.groupBy] || '');
  if (cfg.categoria) t += ' · ' + cfg.categoria;
  if (cfg.groupBy !== 'anio') {
    if (cfg.monthIdx !== null && cfg.monthIdx !== undefined && (cfg.groupBy === 'dia' || cfg.groupBy === 'categoria' || cfg.groupBy === 'concepto')) t += ' · ' + CONFIG.months[cfg.monthIdx];
    if (cfg.year) t += ' ' + cfg.year;
  }
  return t;
}

export function buildSeries(cfg, ledger = state.ledger) {
  const tipo = CB_METRIC_TIPO[cfg.metric];
  const valOf = (f) => {
    if (cfg.metric === 'saldo') return realSum(filterRows({ ...f, tipo: 'I' }, ledger)) - realSum(filterRows({ ...f, tipo: 'E' }, ledger));
    if (cfg.metric === 'presupuestoE') return sum(filterRows({ ...f, tipo: 'E' }, ledger), 'presupuesto');
    return realSum(filterRows({ ...f, tipo }, ledger));
  };
  const presuOf = (f) => sum(filterRows({ ...f, tipo: 'E' }, ledger), 'presupuesto');
  const catFilter = cfg.categoria ? { categoria: cfg.categoria } : {};
  let labels = [], series = [];

  if (cfg.groupBy === 'mes') {
    const y = cfg.year || targetYearMonth(ledger).year;
    labels = CONFIG.monthsAbbr;
    series = CONFIG.months.map((m, i) => valOf({ year: y, monthIdx: i, ...catFilter }));
    if (cfg.metric === 'presuVsReal') {
      return { labels, datasets: [
        { label: 'Presupuesto', data: CONFIG.months.map((m, i) => presuOf({ year: y, monthIdx: i, ...catFilter })) },
        { label: 'Real', data: series },
      ] };
    }
  } else if (cfg.groupBy === 'anio') {
    const years = allYears(ledger);
    labels = years.map(String);
    series = years.map((y) => valOf({ year: y, ...catFilter }));
    if (cfg.metric === 'presuVsReal') {
      return { labels, datasets: [
        { label: 'Presupuesto', data: years.map((y) => presuOf({ year: y, ...catFilter })) },
        { label: 'Real', data: series },
      ] };
    }
  } else if (cfg.groupBy === 'categoria') {
    const f = {};
    if (cfg.year) f.year = cfg.year;
    if (cfg.monthIdx !== null && cfg.monthIdx !== undefined) f.monthIdx = cfg.monthIdx;
    const rows = categoryTable(f.year, f.monthIdx, tipo, ledger).rows
      .map((r) => ({ cat: r.categoria, real: r.real, presu: r.presupuesto }))
      .filter((r) => (cfg.metric === 'presupuestoE' ? r.presu > 0 : (r.real > 0 || (cfg.metric === 'presuVsReal' && r.presu > 0))))
      .sort((a, b) => (cfg.metric === 'presupuestoE' ? b.presu - a.presu : b.real - a.real));
    labels = rows.map((r) => r.cat);
    if (cfg.metric === 'presuVsReal') {
      return { labels, datasets: [
        { label: 'Presupuesto', data: rows.map((r) => r.presu) },
        { label: 'Real', data: rows.map((r) => r.real) },
      ] };
    }
    series = rows.map((r) => (cfg.metric === 'presupuestoE' ? r.presu : r.real));
  } else if (cfg.groupBy === 'concepto') {
    const f = { tipo };
    if (cfg.year) f.year = cfg.year;
    if (cfg.monthIdx !== null && cfg.monthIdx !== undefined) f.monthIdx = cfg.monthIdx;
    if (cfg.categoria) f.categoria = cfg.categoria;
    const groups = {};
    filterRows(f, ledger).forEach((r) => {
      const key = r.concepto || '(sin concepto)';
      groups[key] = groups[key] || { real: 0, presu: 0 };
      groups[key].real += (r.monto || 0);
      groups[key].presu += (r.presupuesto || 0);
    });
    const rows = Object.entries(groups)
      .map(([k, v]) => ({ con: k, ...v }))
      .filter((r) => (cfg.metric === 'presupuestoE' ? r.presu > 0 : r.real > 0 || cfg.metric === 'presuVsReal'))
      .sort((a, b) => (cfg.metric === 'presupuestoE' ? b.presu - a.presu : b.real - a.real))
      .slice(0, 10);
    labels = rows.map((r) => r.con);
    if (cfg.metric === 'presuVsReal') {
      return { labels, datasets: [
        { label: 'Presupuesto', data: rows.map((r) => r.presu) },
        { label: 'Real', data: rows.map((r) => r.real) },
      ] };
    }
    series = rows.map((r) => (cfg.metric === 'presupuestoE' ? r.presu : r.real));
  } else if (cfg.groupBy === 'dia') {
    const t = targetYearMonth(ledger);
    const y = cfg.year || t.year;
    const m = (cfg.monthIdx !== null && cfg.monthIdx !== undefined) ? cfg.monthIdx : t.monthIdx;
    const n = daysInMonth(y, m);
    labels = Array.from({ length: n }, (_, i) => String(i + 1));
    const perDay = (tp, field) => {
      const arr = new Array(n).fill(0);
      filterRows({ year: y, monthIdx: m, tipo: tp, ...catFilter }, ledger).forEach((r) => {
        arr[r.date.getDate() - 1] += (field === 'p' ? (r.presupuesto || 0) : (r.monto || 0));
      });
      return arr;
    };
    if (cfg.metric === 'saldo') {
      const i = perDay('I', 'm'), e = perDay('E', 'm');
      series = i.map((v, idx) => v - e[idx]);
    } else if (cfg.metric === 'presupuestoE') {
      series = perDay('E', 'p');
    } else if (cfg.metric === 'presuVsReal') {
      return { labels, datasets: [{ label: 'Presupuesto', data: perDay('E', 'p') }, { label: 'Real', data: perDay('E', 'm') }] };
    } else {
      series = perDay(tipo, 'm');
    }
  }
  return { labels, datasets: [{ label: '', data: series }] };
}
