import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { sum, realSum, filterRows, allYears, targetYearMonth, categoryTable, catColor } from '../modules/calculations.js';
import { fmtMoney } from '../modules/format.js';
import { drawChart } from '../modules/charts.js';

let ingState = { year: null };
let wired = false;

function initIngresosControls() {
  const years = allYears();
  const sel = document.getElementById('ingAnio');
  sel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  const { year } = targetYearMonth();
  ingState.year = years.includes(year) ? year : years[years.length - 1];
  sel.value = ingState.year;
  if (!wired) {
    wired = true;
    sel.addEventListener('change', () => { ingState.year = +sel.value; render(); });
  }
}

export function render() {
  if (ingState.year === null) initIngresosControls();
  const year = ingState.year;
  const rows = categoryTable(year, undefined, 'I').rows.filter((r) => r.real > 0 || r.presupuesto > 0);
  const total = sum(rows, 'real');
  const fijo = sum(rows.filter((r) => r.categoria === 'Percepcion'), 'real');
  const variable = total - fijo;
  const monthsActive = Math.max(1, CONFIG.months.filter((m, i) => state.ledger.some((r) => r.year === year && r.monthIdx === i && r.tipo === 'I' && r.monto)).length);

  document.getElementById('ingCards').innerHTML = `
    <div class="card"><div class="label">Total ingresos</div><div class="value pos">${fmtMoney(total)}</div></div>
    <div class="card"><div class="label">Ingreso fijo (Percepción)</div><div class="value">${fmtMoney(fijo)}</div></div>
    <div class="card"><div class="label">Ingreso variable (otros)</div><div class="value">${fmtMoney(variable)}</div></div>
    <div class="card"><div class="label">Promedio mensual</div><div class="value">${fmtMoney(total / monthsActive)}</div></div>
  `;

  const ingM = CONFIG.months.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo: 'I' })));
  drawChart('chartIngresoMensual', 'bar', {
    labels: CONFIG.monthsAbbr,
    datasets: [{ label: 'Ingreso', data: ingM, backgroundColor: '#2DD4A7', borderRadius: 4 }],
  });

  drawChart('chartIngresoFuente', 'bar', {
    labels: rows.map((r) => r.categoria),
    datasets: [{ data: rows.map((r) => r.real), backgroundColor: rows.map((r) => catColor(r.categoria)), borderRadius: 4 }],
  }, { indexAxis: 'y', plugins: { legend: { display: false } } });

  drawChart('chartIngresoPct', 'doughnut', {
    labels: rows.map((r) => r.categoria),
    datasets: [{ data: rows.map((r) => r.real), backgroundColor: rows.map((r) => catColor(r.categoria)), borderWidth: 2, borderColor: '#131B18' }],
  }, { plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } } });
}
