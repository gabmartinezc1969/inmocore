import * as XLSX from 'xlsx';
import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { allYears, catColor } from '../modules/calculations.js';
import { fmtMoney2, fmtDate } from '../modules/format.js';
import { addTransaction, updateTransaction, deleteTransaction, resetLedgerToSeed } from '../modules/data.js';
import { toast } from '../modules/ui.js';

let movState = { page: 0, pageSize: 25, sortKey: 'date', sortDir: -1, filtersInit: false };
let editingId = null;
let wired = false;

function initMovFilters() {
  if (movState.filtersInit) return;
  movState.filtersInit = true;
  const years = allYears();
  document.getElementById('fAnio').insertAdjacentHTML('beforeend', years.map((y) => `<option value="${y}">${y}</option>`).join(''));
  document.getElementById('fMes').insertAdjacentHTML('beforeend', CONFIG.months.map((m, i) => `<option value="${i}">${m[0].toUpperCase() + m.slice(1)}</option>`).join(''));
  const cats = [...new Set(state.ledger.map((r) => r.categoria))].sort();
  document.getElementById('fCat').insertAdjacentHTML('beforeend', cats.map((c) => `<option value="${c}">${c}</option>`).join(''));
  ['fAnio', 'fMes', 'fTipo', 'fCat'].forEach((id) => document.getElementById(id).addEventListener('change', () => { movState.page = 0; render(); }));
  document.getElementById('fBuscar').addEventListener('input', () => { movState.page = 0; render(); });
  document.getElementById('pgPrev').addEventListener('click', () => { if (movState.page > 0) { movState.page--; render(); } });
  document.getElementById('pgNext').addEventListener('click', () => { movState.page++; render(); });
}

export function getFilteredMov() {
  const fA = document.getElementById('fAnio').value;
  const fM = document.getElementById('fMes').value;
  const fT = document.getElementById('fTipo').value;
  const fC = document.getElementById('fCat').value;
  const fB = document.getElementById('fBuscar').value.trim().toLowerCase();
  let rows = state.ledger.filter((r) =>
    (!fA || r.year === +fA) &&
    (fM === '' || r.monthIdx === +fM) &&
    (!fT || r.tipo === fT) &&
    (!fC || r.categoria === fC) &&
    (!fB || r.concepto.toLowerCase().includes(fB) || r.categoria.toLowerCase().includes(fB))
  );
  const { sortKey, sortDir } = movState;
  rows = rows.slice().sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === 'date') { av = a.date.getTime(); bv = b.date.getTime(); }
    if (av < bv) return -1 * sortDir;
    if (av > bv) return 1 * sortDir;
    return 0;
  });
  return rows;
}

function fillCatDatalist() {
  const cats = [...new Set(state.ledger.map((r) => r.categoria))].sort();
  document.getElementById('catList').innerHTML = cats.map((c) => `<option value="${c}">`).join('');
}

export function openAddModal() { openModal(null); }

function openModal(id) {
  fillCatDatalist();
  editingId = id || null;
  document.getElementById('modalTitle').textContent = id ? 'Editar movimiento' : 'Agregar movimiento';
  if (id) {
    const r = state.ledger.find((x) => x.id === id);
    document.getElementById('mFecha').value = r.f;
    document.getElementById('mTipo').value = r.tipo;
    document.getElementById('mCategoria').value = r.categoria;
    document.getElementById('mConcepto').value = r.concepto;
    document.getElementById('mPresupuesto').value = r.presupuesto;
    document.getElementById('mMonto').value = r.monto === null ? '' : r.monto;
    document.getElementById('mMetodo').value = r.metodoPago || '';
    document.getElementById('mDeducible').checked = !!r.deducible;
  } else {
    document.getElementById('mFecha').value = new Date().toISOString().slice(0, 10);
    document.getElementById('mTipo').value = 'E';
    document.getElementById('mCategoria').value = '';
    document.getElementById('mConcepto').value = '';
    document.getElementById('mPresupuesto').value = '';
    document.getElementById('mMonto').value = '';
    document.getElementById('mMetodo').value = '';
    document.getElementById('mDeducible').checked = false;
  }
  document.getElementById('modalBg').classList.add('active');
}
function closeModal() { document.getElementById('modalBg').classList.remove('active'); editingId = null; }

function wireOnce() {
  if (wired) return;
  wired = true;
  document.getElementById('btnAdd').addEventListener('click', () => openModal(null));
  document.getElementById('mCancel').addEventListener('click', closeModal);
  document.getElementById('modalBg').addEventListener('click', (e) => { if (e.target.id === 'modalBg') closeModal(); });
  document.getElementById('mSave').addEventListener('click', () => {
    const f = document.getElementById('mFecha').value;
    const tipo = document.getElementById('mTipo').value;
    const categoria = document.getElementById('mCategoria').value.trim();
    const concepto = document.getElementById('mConcepto').value.trim();
    const presupuesto = parseFloat(document.getElementById('mPresupuesto').value) || 0;
    const montoRaw = document.getElementById('mMonto').value;
    const monto = montoRaw === '' ? null : parseFloat(montoRaw);
    const metodoPago = document.getElementById('mMetodo').value;
    const deducible = document.getElementById('mDeducible').checked;
    try {
      if (editingId) {
        updateTransaction(editingId, { f, tipo, categoria, concepto, presupuesto, monto, metodoPago, deducible });
        toast('Movimiento actualizado');
      } else {
        addTransaction({ f, tipo, categoria, concepto, presupuesto, monto, metodoPago, deducible });
        toast('Movimiento agregado');
      }
    } catch (err) {
      toast(err.message);
      return;
    }
    closeModal();
    render();
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    if (confirm('Esto restaurará el libro contable a los datos originales del archivo Excel y se perderán los cambios locales. ¿Continuar?')) {
      resetLedgerToSeed();
      movState.page = 0;
      render();
      toast('Datos restaurados');
    }
  });
  document.getElementById('btnExport').addEventListener('click', () => {
    const rows = getFilteredMov().map((r) => ({
      Fecha: r.f, Tipo: r.tipo === 'I' ? 'Ingreso' : 'Egreso', Categoria: r.categoria, Concepto: r.concepto,
      Presupuesto: r.presupuesto, Real: r.monto === null ? '' : r.monto,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    XLSX.writeFile(wb, 'Movimientos_Pagos.xlsx');
    toast('Excel exportado');
  });

  initMovFilters();
}

export function render() {
  wireOnce();
  initMovFilters();
  const rows = getFilteredMov();
  const { page, pageSize } = movState;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  movState.page = Math.min(page, totalPages - 1);
  const pageRows = rows.slice(movState.page * pageSize, movState.page * pageSize + pageSize);

  const arrow = (key) => (movState.sortKey === key ? (movState.sortDir === 1 ? '▲' : '▼') : '');
  let html = `<thead><tr>
    <th class="sortable" data-k="date">Fecha <span class="arrow">${arrow('date')}</span></th>
    <th class="sortable" data-k="tipo">Tipo <span class="arrow">${arrow('tipo')}</span></th>
    <th class="sortable" data-k="categoria">Categoría <span class="arrow">${arrow('categoria')}</span></th>
    <th>Concepto</th>
    <th class="num-cell sortable" data-k="presupuesto">Presupuesto <span class="arrow">${arrow('presupuesto')}</span></th>
    <th class="num-cell sortable" data-k="monto">Real <span class="arrow">${arrow('monto')}</span></th>
    <th class="num-cell">Variación</th><th>Acciones</th></tr></thead><tbody>`;

  if (!pageRows.length) {
    html += '<tr><td colspan="8" class="empty">Sin movimientos con estos filtros</td></tr>';
  }
  pageRows.forEach((r) => {
    const varv = (r.monto || 0) - r.presupuesto;
    const pend = r.monto === null;
    const tags = [r.metodoPago ? `<span class="fv-badge variable">${r.metodoPago}</span>` : '', r.deducible ? '<span class="fv-badge fijo">Deducible</span>' : ''].filter(Boolean).join(' ');
    html += `<tr>
      <td class="mono">${fmtDate(r.date)}</td>
      <td>${r.tipo === 'I' ? 'Ingreso' : 'Egreso'}</td>
      <td><span class="cat-cell"><span class="dot" style="background:${catColor(r.categoria)}"></span>${r.categoria}</span></td>
      <td>${r.concepto}${tags ? '<br>' + tags : ''}</td>
      <td class="num-cell">${fmtMoney2(r.presupuesto)}</td>
      <td class="num-cell">${pend ? '<span class="stamp stamp-warn">Pendiente</span>' : fmtMoney2(r.monto)}</td>
      <td class="num-cell ${varv >= 0 ? 'pos-text' : 'neg-text'}">${pend ? '—' : fmtMoney2(varv)}</td>
      <td><button class="icon-btn" data-edit="${r.id}" title="Editar" aria-label="Editar movimiento de ${r.concepto}">✎</button> <button class="icon-btn" data-del="${r.id}" title="Eliminar" aria-label="Eliminar movimiento de ${r.concepto}">✕</button></td>
    </tr>`;
  });
  document.getElementById('tblMovimientos').innerHTML = html + '</tbody>';
  document.getElementById('pgInfo').textContent = rows.length
    ? `Mostrando ${movState.page * pageSize + 1}–${Math.min(rows.length, (movState.page + 1) * pageSize)} de ${rows.length}`
    : 'Sin resultados';

  document.querySelectorAll('#tblMovimientos th.sortable').forEach((th) => {
    th.addEventListener('click', () => {
      const k = th.dataset.k;
      if (movState.sortKey === k) movState.sortDir *= -1; else { movState.sortKey = k; movState.sortDir = 1; }
      render();
    });
  });
  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.edit)));
  document.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('¿Eliminar este movimiento? Esta acción no se puede deshacer.')) {
      deleteTransaction(b.dataset.del); render(); toast('Movimiento eliminado');
    }
  }));
}
