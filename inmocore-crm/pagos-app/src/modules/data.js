// Data layer: ledger CRUD + persistence for every localStorage-backed slice.
// Nothing in this module touches the DOM. All mutations go through `state`
// (see state.js) so subscribers re-render automatically.
import { CONFIG } from './config.js';
import { state, toRaw } from './state.js';
import { SEED_DATA } from './seed-data.js';

const K = CONFIG.storage.keys;

function readJSON(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    return raw === null || raw === undefined ? fallback : raw;
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ============ LEDGER (movimientos) ============ */

export function normalize(r, i) {
  const parts = r.f.split('-').map(Number);
  return {
    id: r.id || ('t' + i + '_' + r.f + '_' + r.c + '_' + r.n).replace(/\s+/g, ''),
    date: new Date(parts[0], parts[1] - 1, parts[2]),
    f: r.f, year: parts[0], monthIdx: parts[1] - 1,
    tipo: r.t, categoria: r.c, concepto: r.n || '',
    presupuesto: (typeof r.p === 'number') ? r.p : 0,
    monto: (r.m === null || r.m === undefined) ? null : r.m,
    metodoPago: r.mp || '',
    deducible: !!r.ded,
  };
}
export function serialize(r) {
  return { id: r.id, f: r.f, t: r.tipo, c: r.categoria, n: r.concepto, p: r.presupuesto, m: r.monto, mp: r.metodoPago || '', ded: r.deducible ? 1 : 0 };
}
export function nextId() {
  return 'm' + Date.now() + Math.floor(Math.random() * 1000);
}

export function loadLedger() {
  const raw = readJSON(K.ledger, null);
  const src = (Array.isArray(raw) && raw.length) ? raw : SEED_DATA;
  state.ledger = src.map(normalize);
}
export function persistLedger() {
  writeJSON(K.ledger, toRaw(state.ledger).map(serialize));
}
export function resetLedgerToSeed() {
  localStorage.removeItem(K.ledger);
  loadLedger();
}

/**
 * Validates and appends a new movement. Mirrors the shape the "add movement"
 * form collects: date (YYYY-MM-DD), tipo ('I'|'E'), categoria, concepto,
 * presupuesto (budgeted amount), monto (actual amount, null = pending).
 * Throws a descriptive Error instead of silently accepting bad data.
 */
export function addTransaction({ f, tipo, categoria, concepto = '', presupuesto = 0, monto = null, metodoPago = '', deducible = false }) {
  assertValidTransaction({ f, tipo, categoria, presupuesto, monto });
  const row = normalize({ f, t: tipo, c: categoria, n: concepto, p: presupuesto, m: monto, mp: metodoPago, ded: deducible ? 1 : 0, id: nextId() }, state.ledger.length);
  state.ledger.push(row);
  persistLedger();
  return row;
}

export function updateTransaction(id, { f, tipo, categoria, concepto = '', presupuesto = 0, monto = null, metodoPago = '', deducible = false }) {
  assertValidTransaction({ f, tipo, categoria, presupuesto, monto });
  const row = state.ledger.find((x) => x.id === id);
  if (!row) throw new Error(`No existe un movimiento con id "${id}"`);
  Object.assign(row, normalize({ f, t: tipo, c: categoria, n: concepto, p: presupuesto, m: monto, mp: metodoPago, ded: deducible ? 1 : 0, id }, 0));
  persistLedger();
  return row;
}

export function deleteTransaction(id) {
  const idx = state.ledger.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  state.ledger.splice(idx, 1);
  persistLedger();
  return true;
}

export function deleteTransactionsMatching(predicate) {
  const kept = toRaw(state.ledger).filter((r) => !predicate(r));
  const removed = state.ledger.length - kept.length;
  state.ledger = kept;
  persistLedger();
  return removed;
}

function assertValidTransaction({ f, tipo, categoria, presupuesto, monto }) {
  if (!f || Number.isNaN(Date.parse(f))) {
    throw new Error('Fecha inválida: se esperaba un valor con formato AAAA-MM-DD.');
  }
  if (tipo !== 'I' && tipo !== 'E') {
    throw new Error('Tipo de movimiento inválido: debe ser "I" (ingreso) o "E" (egreso).');
  }
  if (!categoria || !String(categoria).trim()) {
    throw new Error('La categoría es obligatoria.');
  }
  if (presupuesto !== null && presupuesto !== undefined && Number.isNaN(Number(presupuesto))) {
    throw new Error('El presupuesto debe ser un número.');
  }
  if (monto !== null && monto !== undefined && Number.isNaN(Number(monto))) {
    throw new Error('El monto debe ser un número o estar vacío (pendiente).');
  }
}

/* ============ Custom categories ============ */
export function loadCustomCats() {
  const raw = readJSON(K.customCats, null);
  state.customCats = (raw && raw.egreso && raw.ingreso) ? raw : { egreso: [], ingreso: [] };
}
export function saveCustomCats(c) {
  state.customCats = c;
  writeJSON(K.customCats, c);
}

/* ============ Goals (metas) ============ */
export function loadGoals() {
  state.goals = readJSON(K.goals, []);
  if (!Array.isArray(toRaw(state.goals))) state.goals = [];
}
export function saveGoals(goals) {
  state.goals = goals;
  writeJSON(K.goals, toRaw(goals));
}

/* ============ Manual debt balances ============ */
export function loadDebtBalances() {
  const raw = readJSON(K.debt, {});
  state.debtBalances = (raw && typeof raw === 'object') ? raw : {};
}
export function saveDebtBalance(cat, saldo) {
  state.debtBalances[cat] = saldo;
  writeJSON(K.debt, toRaw(state.debtBalances));
}

/* ============ Investments ============ */
export function loadInvestments() {
  state.investments = readJSON(K.investments, []);
  if (!Array.isArray(toRaw(state.investments))) state.investments = [];
}
export function saveInvestments(list) {
  state.investments = list;
  writeJSON(K.investments, toRaw(list));
}

/* ============ Credits ============ */
export function loadCredits() {
  state.credits = readJSON(K.credits, []);
  if (!Array.isArray(toRaw(state.credits))) state.credits = [];
}
export function saveCredits(list) {
  state.credits = list;
  writeJSON(K.credits, toRaw(list));
}

/* ============ Assets (patrimonio) ============ */
export function loadAssets() {
  state.assets = readJSON(K.assets, []);
  if (!Array.isArray(toRaw(state.assets))) state.assets = [];
}
export function saveAssets(list) {
  state.assets = list;
  writeJSON(K.assets, toRaw(list));
}

/* ============ Dismissed subscriptions ============ */
export function loadDismissedSubs() {
  state.dismissedSubs = readJSON(K.dismissedSubs, []);
  if (!Array.isArray(toRaw(state.dismissedSubs))) state.dismissedSubs = [];
}
export function saveDismissedSubs(arr) {
  state.dismissedSubs = arr;
  writeJSON(K.dismissedSubs, toRaw(arr));
}

/* ============ Custom dashboard widgets ============ */
export function loadDashWidgets() {
  state.dashWidgets = readJSON(K.dashWidgets, []);
  if (!Array.isArray(toRaw(state.dashWidgets))) state.dashWidgets = [];
}
export function saveDashWidgets(list) {
  state.dashWidgets = list;
  writeJSON(K.dashWidgets, toRaw(list));
}

/* ============ Nav order ============ */
export function loadNavOrder() {
  const raw = readJSON(K.navOrder, null);
  state.navOrder = (Array.isArray(raw) && raw.length) ? raw : null;
}
export function saveNavOrder(order) {
  state.navOrder = order;
  writeJSON(K.navOrder, order);
}
export function clearNavOrder() {
  state.navOrder = null;
  localStorage.removeItem(K.navOrder);
}

/* ============ Bulk load / full-app snapshot (import/export/sync) ============ */
export function loadAllData() {
  loadLedger();
  loadCustomCats();
  loadGoals();
  loadDebtBalances();
  loadInvestments();
  loadCredits();
  loadAssets();
  loadDismissedSubs();
  loadDashWidgets();
  loadNavOrder();
}

export function collectAppData() {
  return {
    app: 'pagos2026', version: 1,
    ledger: toRaw(state.ledger).map(serialize),
    goals: toRaw(state.goals),
    debtBalances: toRaw(state.debtBalances),
    investments: toRaw(state.investments),
    dismissedSubs: toRaw(state.dismissedSubs),
    customCats: toRaw(state.customCats),
    credits: toRaw(state.credits),
    assets: toRaw(state.assets),
    dashWidgets: toRaw(state.dashWidgets),
    pinHash: localStorage.getItem(CONFIG.storage.keys.pin) || null,
    lastModified: localStorage.getItem(K.lastModified) || new Date().toISOString(),
  };
}

export function applyAppData(data) {
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data.ledger)) { writeJSON(K.ledger, data.ledger); state.ledger = data.ledger.map(normalize); }
  if (Array.isArray(data.goals)) { writeJSON(K.goals, data.goals); state.goals = data.goals; }
  if (data.debtBalances && typeof data.debtBalances === 'object') { writeJSON(K.debt, data.debtBalances); state.debtBalances = data.debtBalances; }
  if (Array.isArray(data.investments)) { writeJSON(K.investments, data.investments); state.investments = data.investments; }
  if (Array.isArray(data.dismissedSubs)) { writeJSON(K.dismissedSubs, data.dismissedSubs); state.dismissedSubs = data.dismissedSubs; }
  if (data.customCats && typeof data.customCats === 'object') { writeJSON(K.customCats, data.customCats); state.customCats = data.customCats; }
  if (Array.isArray(data.credits)) { writeJSON(K.credits, data.credits); state.credits = data.credits; }
  if (data.pinHash) localStorage.setItem(CONFIG.storage.keys.pin, data.pinHash);
  if (Array.isArray(data.assets)) { writeJSON(K.assets, data.assets); state.assets = data.assets; }
  if (Array.isArray(data.dashWidgets)) { writeJSON(K.dashWidgets, data.dashWidgets); state.dashWidgets = data.dashWidgets; }
  localStorage.setItem(K.lastModified, data.lastModified || new Date().toISOString());
  return true;
}
