import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { sum, realSum, filterRows, allYears } from '../modules/calculations.js';
import { fmtMoney, fmtPct } from '../modules/format.js';
import { saveInvestments } from '../modules/data.js';
import { drawChart } from '../modules/charts.js';
import { toast } from '../modules/ui.js';

let editingInvId = null;
let wired = false;

function openInvModal(id) {
  editingInvId = id || null;
  document.getElementById('invModalTitle').textContent = id ? 'Editar inversión' : 'Agregar inversión';
  if (id) {
    const i = state.investments.find((x) => x.id === id);
    document.getElementById('iNombre').value = i.nombre;
    document.getElementById('iCapital').value = i.capital;
    document.getElementById('iValor').value = i.valor;
  } else {
    document.getElementById('iNombre').value = '';
    document.getElementById('iCapital').value = '';
    document.getElementById('iValor').value = '';
  }
  document.getElementById('invModalBg').classList.add('active');
}

function wireOnce() {
  if (wired) return;
  wired = true;
  document.getElementById('btnAddInv').addEventListener('click', () => openInvModal(null));
  document.getElementById('iCancel').addEventListener('click', () => document.getElementById('invModalBg').classList.remove('active'));
  document.getElementById('invModalBg').addEventListener('click', (e) => { if (e.target.id === 'invModalBg') document.getElementById('invModalBg').classList.remove('active'); });
  document.getElementById('iSave').addEventListener('click', () => {
    const nombre = document.getElementById('iNombre').value.trim();
    const capital = parseFloat(document.getElementById('iCapital').value) || 0;
    const valor = parseFloat(document.getElementById('iValor').value) || 0;
    if (!nombre) { toast('El nombre es obligatorio'); return; }
    const invs = state.investments;
    if (editingInvId) {
      Object.assign(invs.find((x) => x.id === editingInvId), { nombre, capital, valor });
    } else {
      invs.push({ id: 'i' + Date.now(), nombre, capital, valor });
    }
    saveInvestments(invs);
    document.getElementById('invModalBg').classList.remove('active');
    render();
    toast('Inversión guardada');
  });
}

export function render() {
  wireOnce();
  const invs = state.investments;
  const capital = sum(invs, 'capital');
  const valor = sum(invs, 'valor');
  const ganancia = valor - capital;
  const rentab = capital > 0 ? ganancia / capital : 0;

  document.getElementById('invCards').innerHTML = `
    <div class="card"><div class="label">Capital invertido</div><div class="value">${fmtMoney(capital)}</div></div>
    <div class="card"><div class="label">Valor actual</div><div class="value">${fmtMoney(valor)}</div></div>
    <div class="card"><div class="label">Ganancia</div><div class="value ${ganancia >= 0 ? 'pos' : 'neg'}">${fmtMoney(ganancia)}</div></div>
    <div class="card"><div class="label">Rentabilidad</div><div class="value ${rentab >= 0 ? 'pos' : 'neg'}">${fmtPct(rentab)}</div></div>
  `;

  drawChart('chartInvDist', 'doughnut', {
    labels: invs.map((i) => i.nombre),
    datasets: [{ data: invs.map((i) => i.valor), backgroundColor: invs.map((i, idx) => CONFIG.palette[idx % CONFIG.palette.length]), borderWidth: 2, borderColor: '#131B18' }],
  }, { plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } } });

  const years = allYears();
  drawChart('chartInvAportaciones', 'bar', {
    labels: years,
    datasets: [{ data: years.map((y) => realSum(filterRows({ year: y, tipo: 'I', categoria: 'Inversion' }))), backgroundColor: '#9B8CFF', borderRadius: 4 }],
  });

  document.getElementById('invList').innerHTML = invs.length ? invs.map((i) => {
    const g = i.valor - i.capital; const r = i.capital > 0 ? g / i.capital : 0;
    return `<div class="goal-card">
      <div class="gc-head"><div class="gc-name">${i.nombre}</div><div class="mono ${g >= 0 ? 'pos-text' : 'neg-text'}">${fmtMoney(g)} (${fmtPct(r)})</div></div>
      <div class="gc-meta"><span>Capital: ${fmtMoney(i.capital)}</span><span>Valor actual: ${fmtMoney(i.valor)}</span></div>
      <div class="gc-actions">
        <button class="btn ghost small" data-inv-edit="${i.id}">Editar</button>
        <button class="btn ghost small" data-inv-del="${i.id}">Eliminar</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty">Aún no registras inversiones. Usa "+ Agregar inversión" para llevar el control de tu portafolio.</div>';

  document.querySelectorAll('[data-inv-edit]').forEach((b) => b.addEventListener('click', () => openInvModal(b.dataset.invEdit)));
  document.querySelectorAll('[data-inv-del]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('¿Eliminar esta inversión?')) { saveInvestments(state.investments.filter((i) => i.id !== b.dataset.invDel)); render(); toast('Inversión eliminada'); }
  }));
}
