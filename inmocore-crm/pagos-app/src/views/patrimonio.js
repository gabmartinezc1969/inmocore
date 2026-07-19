import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { sum, realSum, filterRows, historicalMonths, totalDebt, computeFinancialScore } from '../modules/calculations.js';
import { fmtMoney, fmtPct } from '../modules/format.js';
import { saveAssets } from '../modules/data.js';
import { drawChart } from '../modules/charts.js';
import { toast } from '../modules/ui.js';

let editingAssetId = null;
let wired = false;

function openAssetModal(id) {
  editingAssetId = id || null;
  document.getElementById('assetModalTitle').textContent = id ? 'Editar activo' : 'Registrar activo';
  if (id) {
    const a = state.assets.find((x) => x.id === id);
    document.getElementById('asNombre').value = a.nombre;
    document.getElementById('asTipo').value = a.tipo;
    document.getElementById('asValor').value = a.valor;
  } else {
    document.getElementById('asNombre').value = '';
    document.getElementById('asTipo').value = 'Propiedad';
    document.getElementById('asValor').value = '';
  }
  document.getElementById('assetModalBg').classList.add('active');
}

function wireOnce() {
  if (wired) return;
  wired = true;
  document.getElementById('btnAddAsset').addEventListener('click', () => openAssetModal(null));
  document.getElementById('asCancel').addEventListener('click', () => document.getElementById('assetModalBg').classList.remove('active'));
  document.getElementById('assetModalBg').addEventListener('click', (e) => { if (e.target.id === 'assetModalBg') document.getElementById('assetModalBg').classList.remove('active'); });
  document.getElementById('asSave').addEventListener('click', () => {
    const nombre = document.getElementById('asNombre').value.trim();
    const tipo = document.getElementById('asTipo').value;
    const valor = parseFloat(document.getElementById('asValor').value) || 0;
    if (!nombre) { toast('El nombre es obligatorio'); return; }
    const assets = state.assets;
    if (editingAssetId) {
      Object.assign(assets.find((a) => a.id === editingAssetId), { nombre, tipo, valor });
    } else {
      assets.push({ id: 'a' + Date.now(), nombre, tipo, valor });
    }
    saveAssets(assets);
    document.getElementById('assetModalBg').classList.remove('active');
    render();
    toast('Activo guardado');
  });
}

export function render() {
  wireOnce();
  const assets = state.assets;
  const invs = state.investments;
  const invValor = sum(invs, 'valor');
  const activosTotal = sum(assets, 'valor') + invValor;
  const deuda = totalDebt();
  const patrimonio = activosTotal - deuda;
  const score = computeFinancialScore();

  const liquidos = sum(assets.filter((a) => a.tipo === 'Cuenta bancaria' || a.tipo === 'Efectivo'), 'valor') + invValor;
  const last6 = historicalMonths().slice(-6);
  const gastoProm = last6.length ? sum(last6.map((mo) => ({ v: realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'E' })) })), 'v') / last6.length : 0;
  const mesesLiquidez = gastoProm > 0 ? liquidos / gastoProm : null;
  const invCapital = sum(invs, 'capital');
  const rendInv = invCapital > 0 ? (invValor - invCapital) / invCapital : null;
  const endeudamiento = activosTotal > 0 ? deuda / activosTotal : null;

  document.getElementById('patCards').innerHTML = `
    <div class="card hero-kpi"><div class="label">Patrimonio neto</div><div class="value ${patrimonio >= 0 ? 'pos' : 'neg'}">${fmtMoney(patrimonio)}</div>
      <div class="foot">Activos ${fmtMoney(activosTotal)} − deuda ${fmtMoney(deuda)}</div></div>
    <div class="card"><div class="label">Activos totales</div><div class="value">${fmtMoney(activosTotal)}</div>
      <div class="foot">${assets.length} activo(s) + ${invs.length} inversión(es)</div></div>
    <div class="card"><div class="label">Deuda total</div><div class="value neg">${fmtMoney(deuda)}</div>
      <div class="foot">Créditos registrados + saldos manuales</div></div>
  `;

  const pct = score.total / 100;
  const gcolor = score.total >= 80 ? '#2DD4A7' : score.total >= 60 ? '#E8B34B' : score.total >= 40 ? '#F2C14E' : '#F0655A';
  document.getElementById('scoreValue').textContent = score.total;
  document.getElementById('scoreLabel').textContent = score.label;
  drawChart('chartScoreGauge', 'doughnut', {
    datasets: [{ data: [pct, 1 - pct], backgroundColor: [gcolor, 'rgba(255,255,255,.06)'], borderWidth: 0 }],
  }, { rotation: -90, circumference: 180, cutout: '75%', plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: {} });
  document.getElementById('scoreBreakdown').innerHTML = score.parts.map((p) => `
    <div class="budget-row" style="margin-bottom:10px;">
      <div class="br-head"><div class="br-name" style="font-size:.78rem;">${p.nombre}</div><div class="br-pct">${p.pts}/${p.max}</div></div>
      <div class="budget-track" style="height:7px;"><div class="budget-fill ${p.pts / p.max >= 0.7 ? 'green' : p.pts / p.max >= 0.4 ? 'yellow' : 'red'}" style="width:${(p.pts / p.max) * 100}%"></div></div>
      <div class="br-foot"><span>${p.detalle}</span></div>
    </div>`).join('');

  const tipos = {};
  assets.forEach((a) => { tipos[a.tipo] = (tipos[a.tipo] || 0) + a.valor; });
  if (invValor > 0) tipos.Inversiones = invValor;
  const labels = Object.keys(tipos);
  drawChart('chartPatrimonio', 'bar', {
    labels: [...labels, 'Deuda total'],
    datasets: [{
      data: [...labels.map((l) => tipos[l]), -deuda],
      backgroundColor: [...labels.map((l, i) => CONFIG.palette[i % CONFIG.palette.length]), '#F0655A'], borderRadius: 6,
    }],
  }, { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ' ' + fmtMoney(Math.abs(ctx.parsed.y)) } } } });

  document.getElementById('patMetricas').innerHTML = `
    <div class="card"><div class="label">Tasa de ahorro (6m)</div><div class="value ${score.avgTasa >= 0 ? 'pos' : 'neg'}">${fmtPct(score.avgTasa)}</div></div>
    <div class="card"><div class="label">% de endeudamiento</div><div class="value">${endeudamiento === null ? '—' : fmtPct(endeudamiento)}</div><div class="foot">Deuda / activos</div></div>
    <div class="card"><div class="label">Liquidez</div><div class="value">${mesesLiquidez === null ? '—' : mesesLiquidez.toFixed(1) + ' meses'}</div><div class="foot">Cobertura del gasto con activos líquidos</div></div>
    <div class="card"><div class="label">Rendimiento inversiones</div><div class="value ${rendInv === null ? '' : (rendInv >= 0 ? 'pos' : 'neg')}">${rendInv === null ? '—' : fmtPct(rendInv)}</div></div>
    <div class="card"><div class="label">Carga de deuda mensual</div><div class="value">${fmtPct(score.cargaDeuda)}</div><div class="foot">Pagos de deuda / ingreso (6m)</div></div>
  `;

  document.getElementById('assetsList').innerHTML = assets.length ? assets.map((a) => `
    <div class="reminder-item">
      <div class="ri-left">
        <div class="ri-info"><div class="ri-cat">${a.nombre} <span class="fv-badge variable" style="margin-left:6px;">${a.tipo}</span></div></div>
      </div>
      <div class="ri-right">
        <div class="ri-amt">${fmtMoney(a.valor)}</div>
        <button class="icon-btn" data-asset-edit="${a.id}" title="Editar" aria-label="Editar ${a.nombre}">✎</button>
        <button class="icon-btn" data-asset-del="${a.id}" title="Eliminar" aria-label="Eliminar ${a.nombre}">✕</button>
      </div>
    </div>`).join('') : '<div class="empty">Registra tus propiedades, vehículos y cuentas para calcular tu patrimonio neto.</div>';

  document.querySelectorAll('[data-asset-edit]').forEach((b) => b.addEventListener('click', () => openAssetModal(b.dataset.assetEdit)));
  document.querySelectorAll('[data-asset-del]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('¿Eliminar este activo del registro?')) {
      saveAssets(state.assets.filter((a) => a.id !== b.dataset.assetDel));
      render(); toast('Activo eliminado');
    }
  }));
}
