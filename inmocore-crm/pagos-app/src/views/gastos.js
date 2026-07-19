import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { allYears, targetYearMonth, treemapData, paretoCategorias, dailySeriesMonth, topGastos, catColor } from '../modules/calculations.js';
import { fmtMoney, fmtMoney2, fmtDate } from '../modules/format.js';
import { drawChart } from '../modules/charts.js';

let gasState = { year: null, monthIdx: null };
let wired = false;

function initGastosControls() {
  const years = allYears();
  const selY = document.getElementById('gasAnio');
  selY.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  const selM = document.getElementById('gasMes');
  selM.innerHTML = CONFIG.months.map((m, i) => `<option value="${i}">${m[0].toUpperCase() + m.slice(1)}</option>`).join('');
  const { year, monthIdx } = targetYearMonth();
  gasState.year = years.includes(year) ? year : years[years.length - 1];
  const monthsInYear = state.ledger.filter((r) => r.year === gasState.year).map((r) => r.monthIdx);
  gasState.monthIdx = monthsInYear.includes(monthIdx) ? monthIdx : Math.max(...monthsInYear);
  selY.value = gasState.year; selM.value = gasState.monthIdx;
  if (!wired) {
    wired = true;
    selY.addEventListener('change', () => { gasState.year = +selY.value; render(); });
    selM.addEventListener('change', () => { gasState.monthIdx = +selM.value; render(); });
  }
}

export function render() {
  if (gasState.year === null) initGastosControls();
  const { year, monthIdx } = gasState;

  const tm = treemapData(year, 'E');
  document.getElementById('treemapGastos').innerHTML = tm.length ? tm.map((t) => {
    const grow = Math.max(1, Math.round(t.pct * 400));
    return `<div class="tm-tile" style="background:${catColor(t.categoria)};flex-grow:${grow};flex-basis:${Math.max(70, t.pct * 640)}px;">
      <div class="tm-name">${t.categoria}</div><div class="tm-val">${fmtMoney(t.value)} · ${(t.pct * 100).toFixed(1)}%</div>
    </div>`;
  }).join('') : '<div class="empty">Sin gastos registrados en este año</div>';

  const pareto = paretoCategorias(year);
  drawChart('chartPareto', 'bar', {
    labels: pareto.map((p) => p.categoria),
    datasets: [
      { type: 'bar', label: 'Gasto', data: pareto.map((p) => p.real), backgroundColor: pareto.map((p) => catColor(p.categoria)), order: 2, yAxisID: 'y' },
      { type: 'line', label: '% acumulado', data: pareto.map((p) => +(p.pctAcum * 100).toFixed(1)), borderColor: '#E7EFEA', backgroundColor: '#E7EFEA', tension: 0.2, yAxisID: 'y1', order: 1, pointRadius: 3 },
    ],
  }, {
    scales: {
      y: { position: 'left', grid: { color: '#EAEEE6' }, ticks: { font: { size: 10 } } },
      y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { callback: (v) => v + '%', font: { size: 10 } } },
      x: { ticks: { font: { size: 9 } } },
    },
  });

  document.getElementById('gasHeatSub').textContent = `${CONFIG.months[monthIdx][0].toUpperCase() + CONFIG.months[monthIdx].slice(1)} ${year}`;
  const { egr: egrDaily } = dailySeriesMonth(year, monthIdx);
  const maxDay = Math.max(1, ...egrDaily);
  const firstDow = (new Date(year, monthIdx, 1).getDay() + 6) % 7;
  let heatHtml = CONFIG.dayOfWeekAbbr.map((d) => `<div class="hc-dow">${d}</div>`).join('');
  for (let i = 0; i < firstDow; i++) heatHtml += '<div class="heat-cell empty"></div>';
  egrDaily.forEach((v, i) => {
    const alpha = v > 0 ? Math.min(0.9, 0.15 + (v / maxDay) * 0.75) : 0;
    const bg = v > 0 ? `background:#F0655A${Math.round(alpha * 255).toString(16).padStart(2, '0')}` : 'background:rgba(255,255,255,.04)';
    heatHtml += `<div class="heat-cell" style="${bg}" title="Día ${i + 1}: ${fmtMoney(v)}">${i + 1}</div>`;
  });
  document.getElementById('heatCalGastos').innerHTML = heatHtml;

  const top = topGastos(year, undefined, 15);
  let th = '<thead><tr><th>#</th><th>Fecha</th><th>Categoría</th><th>Concepto</th><th class="num-cell">Monto</th></tr></thead><tbody>';
  top.forEach((r, i) => { th += `<tr><td>${i + 1}</td><td class="mono">${fmtDate(r.date)}</td><td>${r.categoria}</td><td>${r.concepto}</td><td class="num-cell">${fmtMoney2(r.monto)}</td></tr>`; });
  if (!top.length) th += '<tr><td colspan="5" class="empty">Sin datos</td></tr>';
  document.getElementById('tblTopConceptosAnio').innerHTML = th + '</tbody>';
}
