import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import {
  realSum, filterRows, allYears, categoryTable, topGastos, catColor, dailySeriesMonth, cumulativeArray, fixedVariableExtra,
} from '../modules/calculations.js';
import { fmtMoney, fmtMoney2, fmtPct } from '../modules/format.js';
import { drawChart } from '../modules/charts.js';
import { renderCategoryTable } from '../modules/ui.js';

let resState = { year: null, monthIdx: null };
let wired = false;

function initResumenControls() {
  const years = allYears();
  const selY = document.getElementById('resAnio');
  selY.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  const selM = document.getElementById('resMes');
  selM.innerHTML = CONFIG.months.map((m, i) => `<option value="${i}">${m[0].toUpperCase() + m.slice(1)}</option>`).join('');

  const today = new Date();
  resState.year = years.includes(today.getFullYear()) ? today.getFullYear() : years[years.length - 1];
  const monthsInYear = state.ledger.filter((r) => r.year === resState.year).map((r) => r.monthIdx);
  resState.monthIdx = monthsInYear.includes(today.getMonth()) ? today.getMonth() : Math.max(...monthsInYear);

  selY.value = resState.year;
  selM.value = resState.monthIdx;
  if (!wired) {
    wired = true;
    selY.addEventListener('change', () => { resState.year = +selY.value; render(); });
    selM.addEventListener('change', () => { resState.monthIdx = +selM.value; render(); });
  }
}

export function render() {
  if (resState.year === null) initResumenControls();
  const { year, monthIdx } = resState;
  const ing = categoryTable(year, monthIdx, 'I');
  const egr = categoryTable(year, monthIdx, 'E');
  const ingresos = ing.totals.real, egresos = egr.totals.real;
  const saldo = ingresos - egresos;
  const tasa = ingresos > 0 ? saldo / ingresos : (egresos > 0 ? -1 : 0);

  const monthLabel = CONFIG.months[monthIdx][0].toUpperCase() + CONFIG.months[monthIdx].slice(1);
  document.getElementById('resIngresoSub').textContent = `${monthLabel} ${year}`;
  document.getElementById('resEgresoSub').textContent = `${monthLabel} ${year}`;

  const stampClass = saldo >= 0 ? 'stamp-pos' : 'stamp-neg';
  const stampText = saldo >= 0 ? 'Superávit' : 'Déficit';
  document.getElementById('resCards').innerHTML = `
    <div class="card"><div class="label">Ingresos del mes</div><div class="value pos">${fmtMoney(ingresos)}</div></div>
    <div class="card"><div class="label">Egresos del mes</div><div class="value neg">${fmtMoney(egresos)}</div></div>
    <div class="card"><div class="label">Saldo del mes</div><div class="value ${saldo >= 0 ? 'pos' : 'neg'}">${fmtMoney(saldo)}</div>
      <div class="foot"><span class="stamp ${stampClass}">${stampText}</span></div></div>
    <div class="card"><div class="label">Tasa de ahorro</div><div class="value ${tasa >= 0 ? 'pos' : 'neg'}">${fmtPct(tasa)}</div></div>
  `;

  renderCategoryTable('tblIngresoMes', ing);
  renderCategoryTable('tblEgresoMes', egr);

  const budgetRows = egr.rows.filter((r) => r.presupuesto > 0 || r.real > 0).sort((a, b) => b.presupuesto - a.presupuesto);
  document.getElementById('resBudgetBars').innerHTML = budgetRows.length ? budgetRows.map((r) => {
    if (r.presupuesto > 0) {
      const pct = r.real / r.presupuesto;
      const cls = pct > 1 ? 'red' : pct >= 0.8 ? 'yellow' : 'green';
      const scaleMax = Math.max(120, pct * 100 + 15);
      const fillPct = Math.min(100, (pct * 100 / scaleMax) * 100);
      const markerPct = (100 / scaleMax) * 100;
      return `<div class="budget-row">
        <div class="br-head"><div class="br-name"><span class="semaforo ${cls}"></span>${r.categoria}</div><div class="br-pct">${fmtPct(pct)}</div></div>
        <div class="budget-track"><div class="budget-fill ${cls}" style="width:${fillPct}%"></div><div class="budget-marker" style="left:${markerPct}%"></div></div>
        <div class="br-foot"><span>Ejercido: ${fmtMoney(r.real)}</span><span>Presupuesto: ${fmtMoney(r.presupuesto)}</span><span>Disponible: ${fmtMoney(Math.max(0, r.presupuesto - r.real))}</span></div>
      </div>`;
    }
    return `<div class="budget-row">
      <div class="br-head"><div class="br-name"><span class="semaforo yellow" style="opacity:.4"></span>${r.categoria}</div><div class="br-pct">sin presupuesto</div></div>
      <div class="budget-track"><div class="budget-fill" style="width:100%;background:rgba(255,255,255,.14)"></div></div>
      <div class="br-foot"><span>Ejercido: ${fmtMoney(r.real)}</span><span></span><span></span></div>
    </div>`;
  }).join('') : '<div class="empty">Sin categorías con presupuesto o gasto este mes</div>';

  const top10 = topGastos(year, monthIdx, 10);
  let th = '<thead><tr><th>#</th><th>Categoría</th><th>Concepto</th><th class="num-cell">Monto</th></tr></thead><tbody>';
  if (!top10.length) th += '<tr><td colspan="4" class="empty">Sin gastos registrados este mes</td></tr>';
  top10.forEach((r, i) => { th += `<tr><td>${i + 1}</td><td>${r.categoria}</td><td>${r.concepto}</td><td class="num-cell">${fmtMoney2(r.monto)}</td></tr>`; });
  document.getElementById('tblTop10Mes').innerHTML = th + '</tbody>';

  const chartRows = egr.rows.filter((r) => r.real > 0);
  drawChart('chartMesEgreso', 'doughnut', {
    labels: chartRows.map((r) => r.categoria),
    datasets: [{ data: chartRows.map((r) => r.real), backgroundColor: chartRows.map((r) => catColor(r.categoria)), borderWidth: 2, borderColor: '#131B18' }],
  }, { plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } } });

  let prevY = year, prevM = monthIdx - 1; if (prevM < 0) { prevM = 11; prevY--; }
  const hasPrev = state.ledger.some((r) => r.year === prevY && r.monthIdx === prevM);
  const egresosPrev = hasPrev ? realSum(filterRows({ year: prevY, monthIdx: prevM, tipo: 'E' })) : null;
  const panel = document.getElementById('resVsAnteriorPanel');
  if (egresosPrev === null) {
    panel.innerHTML = '<h3>Comparativo vs. Mes Anterior</h3><div class="panel-sub">No hay datos del mes anterior para comparar.</div>';
  } else {
    const diff = egresos - egresosPrev;
    const pctDiff = egresosPrev > 0 ? diff / egresosPrev : 0;
    const up = diff > 0;
    panel.innerHTML = `<h3>Comparativo vs. Mes Anterior</h3>
      <div class="panel-sub">Egresos de ${CONFIG.months[monthIdx]} ${year} vs. ${CONFIG.months[prevM]} ${prevY}</div>
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;">
        <span class="mono" style="font-size:1.3rem;font-weight:600;">${fmtMoney(egresos)}</span>
        <span class="kpi-trend ${up ? 'down' : 'up'}">${up ? '▲' : '▼'} ${fmtPct(Math.abs(pctDiff))} ${up ? 'más que' : 'menos que'} el mes anterior (${fmtMoney(egresosPrev)})</span>
      </div>`;
  }

  const { ing: ingDaily, egr: egrDaily } = dailySeriesMonth(year, monthIdx);
  const days = ingDaily.map((_, i) => i + 1);
  const egrCum = cumulativeArray(egrDaily);
  const ingCum = cumulativeArray(ingDaily);
  drawChart('chartDiario', 'line', {
    labels: days,
    datasets: [
      { label: 'Gasto acumulado', data: egrCum, borderColor: '#F0655A', backgroundColor: '#F0655A22', fill: true, tension: 0.25, pointRadius: 0 },
      { label: 'Ingreso acumulado', data: ingCum, borderColor: '#2DD4A7', backgroundColor: '#2DD4A711', fill: false, tension: 0.25, pointRadius: 0, borderDash: [4, 3] },
    ],
  }, { scales: { x: { title: { display: true, text: 'Día del mes', font: { size: 10 } } } } });

  const { fijo, variable, extra } = fixedVariableExtra(year, monthIdx);
  let running = ingresos;
  const steps = [
    { label: 'Ingresos', from: 0, to: ingresos, color: '#2DD4A7' },
    { label: 'Gastos fijos', from: running - fijo, to: running, color: '#F0655A' },
  ];
  running -= fijo;
  steps.push({ label: 'Gastos variables', from: running - variable, to: running, color: '#F2C14E' });
  running -= variable;
  steps.push({ label: 'Extraordinarios', from: running - extra, to: running, color: '#9B8CFF' });
  running -= extra;
  steps.push({ label: 'Ahorro', from: 0, to: running, color: running >= 0 ? '#2DD4A7' : '#F0655A' });
  drawChart('chartWaterfall', 'bar', {
    labels: steps.map((s) => s.label),
    datasets: [{ data: steps.map((s) => [Math.min(s.from, s.to), Math.max(s.from, s.to)]), backgroundColor: steps.map((s) => s.color), borderRadius: 4 }],
  }, { indexAxis: 'x', plugins: { legend: { display: false } } });
}
