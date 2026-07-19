import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import {
  sum, realSum, filterRows, allYears, targetYearMonth, pendingItems, catColor, amortizationStatus, creditRealPayments,
} from '../modules/calculations.js';
import { fmtMoney, fmtPct, fmtDate } from '../modules/format.js';
import { loadCredits, saveCredits, loadDebtBalances, saveDebtBalance } from '../modules/data.js';
import { drawChart } from '../modules/charts.js';
import { toast } from '../modules/ui.js';

const { debt: DEBT_CATS } = CONFIG.categories;
const ANNEX_MAX_BYTES = 400 * 1024; // per-file cap to keep the data file lightweight

let deuState = { year: null };
let editingCreditId = null;
let wired = false;

function renderCredits() {
  const credits = state.credits;
  const list = document.getElementById('creditsList');
  if (!list) return;
  if (!credits.length) {
    list.innerHTML = '<div class="empty">Aún no registras créditos. Usa "+ Registrar crédito" con los datos de tu contrato (monto, tasa, plazo, fecha de inicio).</div>';
    return;
  }
  list.innerHTML = credits.map((c) => {
    const am = amortizationStatus(c);
    const real = creditRealPayments(c);
    const saldo = (typeof c.saldoBanco === 'number' && c.saldoBanco > 0) ? c.saldoBanco : (am ? am.saldoTeorico : null);
    const saldoLabel = (typeof c.saldoBanco === 'number' && c.saldoBanco > 0) ? 'Saldo según banco' : 'Saldo teórico estimado';
    const progreso = (am && c.monto > 0 && saldo !== null) ? 1 - saldo / c.monto : 0;
    const annexes = c.anexos || [];
    return `<div class="goal-card">
      <div class="gc-head">
        <div class="gc-name">${c.nombre} <span class="fv-badge ${c.tipo === 'Hipotecario' ? 'fijo' : 'variable'}" style="margin-left:6px;">${c.tipo}</span></div>
        <div class="mono" style="font-size:1.05rem;font-weight:700;">${saldo !== null ? fmtMoney(saldo) : '—'} <span style="color:var(--muted);font-size:.7rem;font-weight:500;">restante</span></div>
      </div>
      <div class="budget-track"><div class="budget-fill green" style="width:${Math.max(0, Math.min(100, progreso * 100))}%"></div></div>
      <div class="gc-meta">
        <span>${fmtPct(progreso)} liquidado · ${saldoLabel}</span>
        <span>${am ? am.mesesRestantes + ' de ' + am.totalMeses + ' meses restantes' : 'Faltan datos de plazo'}</span>
      </div>
      <div class="gc-meta">
        <span>Monto original: ${fmtMoney(c.monto)} · Tasa: ${c.tasa}% anual${am ? ' · Pago mensual teórico: ' + fmtMoney(am.pago) : ''}</span>
      </div>
      <div class="gc-meta">
        <span>Pagado real (libro, cat. ${c.categoria || '—'}): <strong>${fmtMoney(real.total)}</strong> en ${real.count} pago(s)</span>
        ${c.notas ? `<span>${c.notas}</span>` : ''}
      </div>
      <div style="margin-top:10px;">
        ${annexes.map((a, i) => `<span class="annex-chip">📎 <a href="${a.data}" download="${a.name}">${a.name}</a> <span style="color:var(--muted);">${(a.size / 1024).toFixed(0)} KB</span> <button data-annex-del="${c.id}|${i}" title="Quitar anexo" aria-label="Quitar anexo ${a.name}">✕</button></span>`).join('')}
        <label class="btn ghost small" style="cursor:pointer;">📎 Adjuntar anexo<input type="file" data-annex-add="${c.id}" style="display:none;"></label>
      </div>
      <div class="gc-actions">
        <button class="btn ghost small" data-credit-edit="${c.id}">Editar</button>
        <button class="btn ghost small" data-credit-del="${c.id}">Eliminar</button>
      </div>
    </div>`;
  }).join('');

  document.querySelectorAll('[data-credit-edit]').forEach((b) => b.addEventListener('click', () => openCreditModal(b.dataset.creditEdit)));
  document.querySelectorAll('[data-credit-del]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('¿Eliminar este crédito y sus anexos del registro? (No afecta los movimientos del libro contable)')) {
      saveCredits(state.credits.filter((c) => c.id !== b.dataset.creditDel));
      renderCredits(); toast('Crédito eliminado');
    }
  }));
  document.querySelectorAll('[data-annex-add]').forEach((inp) => inp.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > ANNEX_MAX_BYTES) {
      toast(`El anexo supera el límite de ${(ANNEX_MAX_BYTES / 1024).toFixed(0)} KB. Guarda el archivo grande en OneDrive y anota su nombre en las notas del crédito.`);
      e.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const credits = state.credits;
      const c = credits.find((x) => x.id === inp.dataset.annexAdd);
      c.anexos = c.anexos || [];
      c.anexos.push({ name: file.name, size: file.size, data: ev.target.result });
      saveCredits(credits);
      renderCredits();
      toast('Anexo adjuntado');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }));
  document.querySelectorAll('[data-annex-del]').forEach((b) => b.addEventListener('click', () => {
    const [cid, idx] = b.dataset.annexDel.split('|');
    const credits = state.credits;
    const c = credits.find((x) => x.id === cid);
    c.anexos.splice(+idx, 1);
    saveCredits(credits);
    renderCredits();
    toast('Anexo eliminado');
  }));
}

function openCreditModal(id) {
  editingCreditId = id || null;
  document.getElementById('creditModalTitle').textContent = id ? 'Editar crédito' : 'Registrar crédito';
  document.getElementById('catListCredit').innerHTML = [...new Set(state.ledger.filter((r) => r.tipo === 'E').map((r) => r.categoria))].sort().map((c) => `<option value="${c}">`).join('');
  if (id) {
    const c = state.credits.find((x) => x.id === id);
    document.getElementById('crNombre').value = c.nombre;
    document.getElementById('crTipo').value = c.tipo;
    document.getElementById('crCategoria').value = c.categoria || '';
    document.getElementById('crMonto').value = c.monto;
    document.getElementById('crTasa').value = c.tasa;
    document.getElementById('crPlazo').value = c.plazo;
    document.getElementById('crInicio').value = c.inicio || '';
    document.getElementById('crSaldoBanco').value = c.saldoBanco || '';
    document.getElementById('crNotas').value = c.notas || '';
  } else {
    ['crNombre', 'crCategoria', 'crMonto', 'crTasa', 'crPlazo', 'crInicio', 'crSaldoBanco', 'crNotas'].forEach((fid) => { document.getElementById(fid).value = ''; });
    document.getElementById('crTipo').value = 'Hipotecario';
  }
  document.getElementById('creditModalBg').classList.add('active');
}

function wireOnce() {
  if (wired) return;
  wired = true;
  document.getElementById('btnAddCredit').addEventListener('click', () => openCreditModal(null));
  document.getElementById('crCancel').addEventListener('click', () => document.getElementById('creditModalBg').classList.remove('active'));
  document.getElementById('creditModalBg').addEventListener('click', (e) => { if (e.target.id === 'creditModalBg') document.getElementById('creditModalBg').classList.remove('active'); });
  document.getElementById('crSave').addEventListener('click', () => {
    const nombre = document.getElementById('crNombre').value.trim();
    if (!nombre) { toast('El nombre es obligatorio'); return; }
    const data = {
      nombre,
      tipo: document.getElementById('crTipo').value,
      categoria: document.getElementById('crCategoria').value.trim(),
      monto: parseFloat(document.getElementById('crMonto').value) || 0,
      tasa: parseFloat(document.getElementById('crTasa').value) || 0,
      plazo: parseInt(document.getElementById('crPlazo').value, 10) || 0,
      inicio: document.getElementById('crInicio').value || '',
      saldoBanco: parseFloat(document.getElementById('crSaldoBanco').value) || null,
      notas: document.getElementById('crNotas').value.trim(),
    };
    const credits = state.credits;
    if (editingCreditId) {
      Object.assign(credits.find((x) => x.id === editingCreditId), data);
    } else {
      credits.push({ id: 'c' + Date.now(), anexos: [], ...data });
    }
    saveCredits(credits);
    document.getElementById('creditModalBg').classList.remove('active');
    renderCredits();
    toast('Crédito guardado');
  });

  const sel = document.getElementById('deuAnio');
  sel.addEventListener('change', () => { deuState.year = +sel.value; render(); });
}

function initDeudasControls() {
  const years = allYears();
  const sel = document.getElementById('deuAnio');
  sel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  const { year } = targetYearMonth();
  deuState.year = years.includes(year) ? year : years[years.length - 1];
  sel.value = deuState.year;
}

export function render() {
  wireOnce();
  if (deuState.year === null) initDeudasControls();
  renderCredits();
  const year = deuState.year;
  const activeDebts = DEBT_CATS.filter((cat) => state.ledger.some((r) => r.tipo === 'E' && r.categoria === cat));
  const totalYear = sum(activeDebts.map((cat) => ({ v: realSum(filterRows({ year, tipo: 'E', categoria: cat })) })), 'v');
  const allTime = sum(activeDebts.map((cat) => ({ v: realSum(filterRows({ tipo: 'E', categoria: cat })) })), 'v');
  const monthsWithData = Math.max(1, CONFIG.months.filter((m, i) => state.ledger.some((r) => r.year === year && r.monthIdx === i && r.tipo === 'E')).length);

  document.getElementById('deuCards').innerHTML = `
    <div class="card"><div class="label">Pagado en deuda este año</div><div class="value neg">${fmtMoney(totalYear)}</div></div>
    <div class="card"><div class="label">Promedio mensual</div><div class="value">${fmtMoney(totalYear / monthsWithData)}</div></div>
    <div class="card"><div class="label">Categorías de deuda activas</div><div class="value">${activeDebts.length}</div></div>
    <div class="card"><div class="label">Pagado histórico (2020–hoy)</div><div class="value">${fmtMoney(allTime)}</div></div>
  `;

  drawChart('chartDeudaMensual', 'bar', {
    labels: CONFIG.monthsAbbr,
    datasets: activeDebts.map((cat) => ({
      label: cat, data: CONFIG.months.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo: 'E', categoria: cat }))),
      backgroundColor: catColor(cat),
    })),
  }, { scales: { x: { stacked: true }, y: { stacked: true } } });

  const balances = state.debtBalances;
  const pend = pendingItems();
  document.getElementById('deudaDetalle').innerHTML = activeDebts.length ? activeDebts.map((cat) => {
    const rows = filterRows({ tipo: 'E', categoria: cat }).filter((r) => r.monto);
    const avgPago = rows.length ? realSum(rows) / rows.length : 0;
    const proximo = pend.filter((i) => i.categoria === cat).sort((a, b) => a.date - b.date)[0];
    const saldo = balances[cat];
    const mesesRestantes = (saldo && avgPago > 0) ? Math.ceil(saldo / avgPago) : null;
    const safeId = cat.replace(/[^a-zA-Z0-9]/g, '_');
    return `<div class="debt-card">
      <h4>${cat}</h4>
      <div class="dc-sub">Pago promedio histórico: ${fmtMoney(avgPago)}</div>
      <div style="font-size:.8rem;margin-bottom:6px;">${proximo ? 'Próximo pago: ' + fmtDate(proximo.date) + ' · ' + fmtMoney(proximo.presupuesto) : 'Sin pagos pendientes registrados'}</div>
      ${saldo ? `<div style="font-size:.8rem;">Saldo pendiente (manual): <strong>${fmtMoney(saldo)}</strong>${mesesRestantes ? ' · ~' + mesesRestantes + ' meses para liquidar al ritmo actual' : ''}</div>` : ''}
      <div class="debt-input-row">
        <label class="sr-only" for="debtInput_${safeId}">Saldo pendiente actual de ${cat}</label>
        <input type="number" placeholder="Saldo pendiente actual" id="debtInput_${safeId}" value="${saldo || ''}">
        <button class="btn ghost small" data-debt-save="${cat}">Guardar</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">No se detectaron categorías de deuda en tus movimientos</div>';

  document.querySelectorAll('[data-debt-save]').forEach((b) => b.addEventListener('click', () => {
    const cat = b.dataset.debtSave;
    const safeId = cat.replace(/[^a-zA-Z0-9]/g, '_');
    const input = document.getElementById('debtInput_' + safeId);
    const val = parseFloat(input.value);
    saveDebtBalance(cat, isNaN(val) ? null : val);
    toast('Saldo actualizado');
    render();
  }));
}
