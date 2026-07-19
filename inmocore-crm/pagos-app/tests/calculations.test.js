import { describe, test, expect } from 'vitest';
import {
  scoreFromMetrics,
  amortizationStatus,
  filterRows,
  categoryTable,
  sum,
  realSum,
  allYears,
  targetYearMonth,
  pendingItems,
  computeAlerts,
  detectSubscriptions,
  totalDebt,
} from '../src/modules/calculations.js';

function row(f, tipo, categoria, presupuesto, monto, extra = {}) {
  const [y, m, d] = f.split('-').map(Number);
  return { f, year: y, monthIdx: m - 1, date: new Date(y, m - 1, d), tipo, categoria, concepto: extra.concepto || 'x', presupuesto, monto, metodoPago: '', deducible: false, id: `${f}-${categoria}-${Math.random()}` };
}

describe('scoreFromMetrics', () => {
  test('perfect financial health caps at 100', () => {
    const score = scoreFromMetrics({ savingsRate: 0.30, debtLoad: 0, budgetOverspendRatio: 0 });
    expect(score.total).toBe(100);
    expect(score.label).toBe('Excelente');
  });

  test('no savings, heavy debt, over budget scores low', () => {
    const score = scoreFromMetrics({ savingsRate: 0, debtLoad: 0.5, budgetOverspendRatio: 1 });
    expect(score.total).toBe(0);
    expect(score.label).toBe('Frágil');
  });

  test('matches the known production figure for 30% savings / 0% debt / on-budget', () => {
    // Regression guard: mirrors computeFinancialScore's output against the deployed app.
    const score = scoreFromMetrics({ savingsRate: 0.372, debtLoad: 0, budgetOverspendRatio: 0 });
    expect(score.total).toBeGreaterThanOrEqual(70);
  });

  test('savingsRate and debtLoad are independently weighted (40 vs 30 points)', () => {
    const savingsOnly = scoreFromMetrics({ savingsRate: 0.30, debtLoad: 0.50, budgetOverspendRatio: 0 });
    const debtOnly = scoreFromMetrics({ savingsRate: 0, debtLoad: 0, budgetOverspendRatio: 0 });
    expect(savingsOnly.total).toBe(40 + 0 + 30);
    expect(debtOnly.total).toBe(0 + 30 + 30);
  });

  test('negative savings rate clamps to 0 points, does not go negative', () => {
    const score = scoreFromMetrics({ savingsRate: -0.5, debtLoad: 0, budgetOverspendRatio: 0 });
    expect(score.parts[0].pts).toBe(0);
    expect(score.total).toBeGreaterThanOrEqual(0);
  });
});

describe('amortizationStatus', () => {
  test('zero-interest loan amortizes linearly', () => {
    const credit = { monto: 12000, plazo: 12, tasa: 0, inicio: '2025-01-01' };
    const status = amortizationStatus(credit, new Date(2025, 5, 1)); // 5 months elapsed
    expect(status.pago).toBeCloseTo(1000, 5);
    expect(status.monthsElapsed).toBe(5);
    expect(status.saldoTeorico).toBeCloseTo(7000, 5);
  });

  test('returns null for a malformed credit (no principal or term)', () => {
    expect(amortizationStatus({ monto: 0, plazo: 12, tasa: 5, inicio: '2025-01-01' })).toBeNull();
    expect(amortizationStatus({ monto: 1000, plazo: 0, tasa: 5, inicio: '2025-01-01' })).toBeNull();
  });

  test('interest-bearing loan balance never goes negative past term', () => {
    const credit = { monto: 100000, plazo: 24, tasa: 12, inicio: '2024-01-01' };
    const status = amortizationStatus(credit, new Date(2027, 0, 1)); // well past term
    expect(status.saldoTeorico).toBe(0);
    expect(status.mesesRestantes).toBe(0);
  });
});

describe('filterRows / categoryTable', () => {
  const ledger = [
    row('2026-01-05', 'E', 'Renta', 1000, 1000),
    row('2026-01-10', 'E', 'Renta', 500, 600),
    row('2026-02-01', 'E', 'Renta', 1000, null),
    row('2026-01-01', 'I', 'Salario', 5000, 5000),
  ];

  test('filters by year/month/tipo/categoria', () => {
    expect(filterRows({ year: 2026, monthIdx: 0, tipo: 'E' }, ledger)).toHaveLength(2);
    expect(filterRows({ tipo: 'I' }, ledger)).toHaveLength(1);
  });

  test('categoryTable totals real spend and flags overspend', () => {
    const table = categoryTable(2026, 0, 'E', ledger, { egreso: [], ingreso: [] });
    const renta = table.rows.find((r) => r.categoria === 'Renta');
    expect(renta.presupuesto).toBe(1500);
    expect(renta.real).toBe(1600);
    expect(renta.variacion).toBe(100);
  });

  test('empty ledger yields zeroed totals, not NaN/undefined', () => {
    const table = categoryTable(2026, 0, 'E', [], { egreso: [], ingreso: [] });
    expect(table.totals.presupuesto).toBe(0);
    expect(table.totals.real).toBe(0);
    expect(Number.isNaN(table.totals.variacion)).toBe(false);
  });

  test('allYears / targetYearMonth handle an empty ledger without throwing', () => {
    expect(allYears([])).toEqual([]);
    expect(() => targetYearMonth([], new Date(2026, 0, 1))).not.toThrow();
  });
});

describe('sum / realSum', () => {
  test('zero income does not divide by zero or throw', () => {
    const ledger = [row('2026-01-01', 'E', 'Varios', 100, 100)];
    const ingresos = realSum(filterRows({ tipo: 'I' }, ledger));
    expect(ingresos).toBe(0);
    expect(() => (ingresos > 0 ? (0 - 100) / ingresos : null)).not.toThrow();
  });

  test('sum ignores rows missing the requested key', () => {
    expect(sum([{ presupuesto: 10 }, {}, { presupuesto: 5 }], 'presupuesto')).toBe(15);
  });
});

describe('pendingItems / computeAlerts', () => {
  test('a budgeted-but-unpaid row is pending and flagged by diffDays', () => {
    const today = new Date(2026, 0, 10);
    const ledger = [row('2026-01-15', 'E', 'Renta', 500, null)];
    const pending = pendingItems(ledger, today);
    expect(pending).toHaveLength(1);
    expect(pending[0].diffDays).toBe(5);
  });

  test('computeAlerts on an empty ledger returns no alerts instead of throwing', () => {
    expect(computeAlerts([], new Date(2026, 0, 1))).toEqual([]);
  });

  test('exceeding a category budget produces a high-severity alert', () => {
    const ledger = [row('2026-01-05', 'E', 'Renta', 1000, 1500)];
    const alerts = computeAlerts(ledger, new Date(2026, 0, 20));
    expect(alerts.some((a) => a.sev === 'high' && a.title.includes('Renta'))).toBe(true);
  });
});

describe('detectSubscriptions', () => {
  test('requires at least 3 distinct months of consistent charges', () => {
    const ledger = [
      row('2026-01-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
      row('2026-02-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
    ];
    expect(detectSubscriptions(ledger, [])).toHaveLength(0);
  });

  test('flags a stable recurring charge across 3+ months', () => {
    const ledger = [
      row('2026-01-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
      row('2026-02-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
      row('2026-03-05', 'E', 'Servicios', 0, 205, { concepto: 'Streaming' }),
    ];
    const subs = detectSubscriptions(ledger, []);
    expect(subs).toHaveLength(1);
    expect(subs[0].meses).toBe(3);
  });

  test('respects a dismissed key', () => {
    const ledger = [
      row('2026-01-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
      row('2026-02-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
      row('2026-03-05', 'E', 'Servicios', 0, 199, { concepto: 'Streaming' }),
    ];
    expect(detectSubscriptions(ledger, ['Servicios||Streaming'])).toHaveLength(0);
  });
});

describe('totalDebt', () => {
  test('a credit balance and an uncovered manual balance both count', () => {
    const credits = [{ categoria: 'Hipoteca', monto: 100000, plazo: 12, tasa: 0, inicio: '2025-01-01' }];
    const debtBalances = { Hipoteca: 50000, 'Tarjeta bancaria': 8000 };
    const now = new Date(2025, 0, 1); // 0 months elapsed -> credit saldoTeorico = full 100000
    // Hipoteca is covered by the credit, so its manual balance is ignored; Tarjeta bancaria is not.
    expect(totalDebt(credits, debtBalances, now)).toBe(100000 + 8000);
  });

  test('no credits and no balances is zero debt, not NaN', () => {
    expect(totalDebt([], {}, new Date())).toBe(0);
  });
});
