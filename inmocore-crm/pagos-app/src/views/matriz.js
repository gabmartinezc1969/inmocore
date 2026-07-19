import { CONFIG } from '../modules/config.js';
import { sum, realSum, filterRows, allYears, catList, catColor } from '../modules/calculations.js';
import { fmtMoney } from '../modules/format.js';

let mxState = { year: null };
let wired = false;

function initMatrizControls() {
  const years = allYears();
  const sel = document.getElementById('mxAnio');
  sel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  const today = new Date();
  mxState.year = years.includes(today.getFullYear()) ? today.getFullYear() : years[years.length - 1];
  sel.value = mxState.year;
  if (!wired) {
    wired = true;
    sel.addEventListener('change', () => { mxState.year = +sel.value; render(); });
  }
}

function renderMatrizTable(tblId, year, tipo) {
  const cats = catList(tipo);
  const grid = cats.map((cat) => CONFIG.months.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo, categoria: cat }))));
  const rowTotals = grid.map((row) => sum(row.map((v) => ({ v })), 'v'));
  const colTotals = CONFIG.months.map((m, i) => grid.reduce((s, row) => s + row[i], 0));
  const grandTotal = sum(rowTotals.map((v) => ({ v })), 'v');
  const maxCell = Math.max(1, ...grid.flat());

  let html = `<thead><tr><th>Categoría</th>${CONFIG.monthsAbbr.map((m) => `<th class="num-cell">${m}</th>`).join('')}<th class="num-cell">Total Anual</th></tr></thead><tbody>`;
  cats.forEach((cat, ci) => {
    html += `<tr><td><span class="cat-cell"><span class="dot" style="background:${catColor(cat)}"></span>${cat}</span></td>`;
    grid[ci].forEach((v) => {
      const alpha = v > 0 ? Math.min(0.85, 0.1 + (v / maxCell) * 0.65) : 0;
      const bg = v > 0 ? `background:${catColor(cat)}${Math.round(alpha * 255).toString(16).padStart(2, '0')}` : '';
      html += `<td class="num-cell" style="${bg}">${v ? fmtMoney(v) : '—'}</td>`;
    });
    html += `<td class="num-cell" style="font-weight:600">${fmtMoney(rowTotals[ci])}</td></tr>`;
  });
  html += `<tr class="total-row"><td>Total</td>${colTotals.map((v) => `<td class="num-cell">${fmtMoney(v)}</td>`).join('')}<td class="num-cell">${fmtMoney(grandTotal)}</td></tr>`;
  document.getElementById(tblId).innerHTML = html + '</tbody>';
}

export function render() {
  if (mxState.year === null) initMatrizControls();
  renderMatrizTable('tblMatrizEgreso', mxState.year, 'E');
  renderMatrizTable('tblMatrizIngreso', mxState.year, 'I');
}
