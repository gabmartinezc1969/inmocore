import { CONFIG } from '../modules/config.js';
import { realSum, filterRows, allYears, targetYearMonth, categoryTable, topGastos, sum, catColor } from '../modules/calculations.js';
import { fmtMoney, fmtMoney2, fmtPct } from '../modules/format.js';
import { drawChart, chartTheme } from '../modules/charts.js';

let anState = { year: null };
let gtaControlsInit = false;
let wired = false;

function initAnualControls() {
  const years = allYears();
  const sel = document.getElementById('anAnio');
  sel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
  const today = new Date();
  anState.year = years.includes(today.getFullYear()) ? today.getFullYear() : years[years.length - 1];
  sel.value = anState.year;
  if (!wired) {
    wired = true;
    sel.addEventListener('change', () => { anState.year = +sel.value; render(); });
  }
}

function renderGastoTotalAnio() {
  const sel = document.getElementById('gtaTipo');
  const K = CONFIG.storage.keys.gtaChartType;
  if (!gtaControlsInit) {
    gtaControlsInit = true;
    const saved = localStorage.getItem(K);
    if (saved && [...sel.options].some((o) => o.value === saved)) sel.value = saved;
    sel.addEventListener('change', () => {
      localStorage.setItem(K, sel.value);
      renderGastoTotalAnio();
    });
  }
  const choice = sel.value;
  const years = allYears();
  const vals = years.map((y) => realSum(filterRows({ year: y, tipo: 'E' })));
  const { year: tgtY, monthIdx: tgtM } = targetYearMonth();
  document.getElementById('gtaSub').textContent = years.includes(tgtY)
    ? `Egresos reales de cada año — ${tgtY} incluye solo lo transcurrido hasta ${CONFIG.months[tgtM]}`
    : 'Egresos reales de cada año del historial';

  const yearColors = years.map((y, i) => (y === tgtY ? '#F0655A' : CONFIG.palette[i % CONFIG.palette.length]));
  const circular = ['doughnut', 'pie', 'polarArea', 'radar'].includes(choice);
  let type = choice; const extra = {};
  const data = {
    labels: years.map(String),
    datasets: [{
      label: 'Gasto total',
      data: vals,
      backgroundColor: circular ? yearColors : (choice === 'line' ? 'transparent' : (choice === 'area' ? 'rgba(240,101,90,.25)' : yearColors)),
      borderColor: (choice === 'line' || choice === 'area' || choice === 'radar') ? '#F0655A' : (circular ? chartTheme().border : undefined),
      borderWidth: (choice === 'line' || choice === 'area' || choice === 'radar') ? 2 : (circular ? 2 : 0),
      borderRadius: (choice === 'bar' || choice === 'barh') ? 6 : 0,
      fill: choice === 'area',
      tension: (choice === 'line' || choice === 'area') ? 0.3 : 0,
      pointRadius: (choice === 'line' || choice === 'area') ? 3 : undefined,
      pointBackgroundColor: (choice === 'line' || choice === 'area' || choice === 'radar') ? '#F0655A' : undefined,
    }],
  };
  if (choice === 'barh') { type = 'bar'; extra.indexAxis = 'y'; }
  if (choice === 'area' || choice === 'line') { type = 'line'; }
  if (choice === 'pie') { extra.scales = {}; }
  if (choice === 'radar') {
    extra.scales = { r: { grid: { color: 'rgba(255,255,255,.08)' }, angleLines: { color: 'rgba(255,255,255,.08)' }, ticks: { color: '#8CA096', backdropColor: 'transparent', font: { size: 9 } }, pointLabels: { color: '#B7C6BD', font: { size: 11 } } } };
    data.datasets[0].backgroundColor = 'rgba(240,101,90,.2)';
    data.datasets[0].fill = true;
  }
  if (choice === 'polarArea') {
    extra.scales = { r: { grid: { color: 'rgba(255,255,255,.08)' }, ticks: { color: '#8CA096', backdropColor: 'transparent', font: { size: 9 } } } };
    data.datasets[0].backgroundColor = yearColors.map((c) => c + 'CC');
  }
  extra.plugins = {
    legend: { display: circular && choice !== 'radar', position: 'right', labels: { boxWidth: 10, font: { size: 11 }, color: chartTheme().legend } },
    tooltip: { callbacks: { label: (ctx) => ' ' + fmtMoney(circular ? ctx.parsed : (choice === 'barh' ? ctx.parsed.x : ctx.parsed.y)) } },
  };
  drawChart('chartGastoTotalAnio', type, data, extra);
}

export function render() {
  if (anState.year === null) initAnualControls();
  renderGastoTotalAnio();
  const year = anState.year;
  const years = allYears();
  const prevYear = year - 1;

  const ingresos = realSum(filterRows({ year, tipo: 'I' }));
  const egresos = realSum(filterRows({ year, tipo: 'E' }));
  const ahorro = ingresos - egresos;
  const tasa = ingresos > 0 ? ahorro / ingresos : (egresos > 0 ? -1 : 0);

  const ingresosPrev = realSum(filterRows({ year: prevYear, tipo: 'I' }));
  const egresosPrev = realSum(filterRows({ year: prevYear, tipo: 'E' }));
  const deltaIng = ingresosPrev > 0 ? (ingresos - ingresosPrev) / ingresosPrev : null;
  const deltaEgr = egresosPrev > 0 ? (egresos - egresosPrev) / egresosPrev : null;

  document.getElementById('anCards').innerHTML = `
    <div class="card"><div class="label">Ingresos del año</div><div class="value pos">${fmtMoney(ingresos)}</div></div>
    <div class="card"><div class="label">Egresos del año</div><div class="value neg">${fmtMoney(egresos)}</div></div>
    <div class="card"><div class="label">Ahorro neto</div><div class="value ${ahorro >= 0 ? 'pos' : 'neg'}">${fmtMoney(ahorro)}</div></div>
    <div class="card"><div class="label">Tasa de ahorro</div><div class="value ${tasa >= 0 ? 'pos' : 'neg'}">${fmtPct(tasa)}</div></div>
    <div class="card"><div class="label">Δ Ingresos vs año anterior</div><div class="value ${deltaIng === null ? '' : (deltaIng >= 0 ? 'pos' : 'neg')}">${deltaIng === null ? '—' : fmtPct(deltaIng)}</div></div>
    <div class="card"><div class="label">Δ Egresos vs año anterior</div><div class="value ${deltaEgr === null ? '' : (deltaEgr <= 0 ? 'pos' : 'neg')}">${deltaEgr === null ? '—' : fmtPct(deltaEgr)}</div></div>
  `;

  const { year: tgtY, monthIdx: tgtM } = targetYearMonth();
  const isCurrentYear = (year === tgtY);
  const lastMonthIdx = isCurrentYear ? tgtM : 11;

  const mesesAbrCut = CONFIG.monthsAbbr.slice(0, lastMonthIdx + 1);
  const ingM = mesesAbrCut.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo: 'I' })));
  const egrM = mesesAbrCut.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo: 'E' })));
  const saldoM = ingM.map((v, i) => v - egrM[i]);
  document.getElementById('anTendenciaSub').textContent = isCurrentYear
    ? `Ingreso, egreso y saldo mes a mes — datos a la fecha (hasta ${CONFIG.months[tgtM]})`
    : 'Ingreso, egreso y saldo mes a mes';
  drawChart('chartTendencia', 'line', {
    labels: mesesAbrCut,
    datasets: [
      { label: 'Ingreso', data: ingM, borderColor: '#2DD4A7', backgroundColor: '#2DD4A722', tension: 0.3, fill: false },
      { label: 'Egreso', data: egrM, borderColor: '#F0655A', backgroundColor: '#F0655A22', tension: 0.3, fill: false },
      { label: 'Saldo', data: saldoM, borderColor: '#E8B34B', backgroundColor: '#E8B34B22', tension: 0.3, fill: true, borderDash: [5, 3] },
    ],
  });

  document.getElementById('anMultiAnioSub').textContent = `Ingresos y egresos reales por año${isCurrentYear || years.includes(tgtY) ? ` — ${tgtY} muestra solo lo transcurrido hasta ${CONFIG.months[tgtM]}` : ''}`;
  drawChart('chartMultiAnio', 'bar', {
    labels: years,
    datasets: [
      { label: 'Ingresos reales', data: years.map((y) => realSum(filterRows({ year: y, tipo: 'I' }))), backgroundColor: years.map((y) => (y === tgtY ? '#2DD4A799' : '#2DD4A7')) },
      { label: 'Egresos reales', data: years.map((y) => realSum(filterRows({ year: y, tipo: 'E' }))), backgroundColor: years.map((y) => (y === tgtY ? '#F0655A99' : '#F0655A')) },
    ],
  });

  const egrRows = categoryTable(year, undefined, 'E').rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real);
  const totalEgr = sum(egrRows, 'real');
  document.getElementById('anCatAnioSub').textContent = isCurrentYear
    ? `% del total acumulado a la fecha (hasta ${CONFIG.months[tgtM]})`
    : '% del total anual';
  drawChart('chartCatAnio', 'bar', {
    labels: egrRows.map((r) => r.categoria),
    datasets: [{ data: egrRows.map((r) => r.real), backgroundColor: egrRows.map((r) => catColor(r.categoria)) }],
  }, {
    indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmtMoney(ctx.parsed.x) + ' (' + ((ctx.parsed.x / totalEgr) * 100).toFixed(1) + '%)' } } },
  });

  const top10 = topGastos(year, undefined, 10);
  let th = '<thead><tr><th>#</th><th>Categoría</th><th>Concepto</th><th class="num-cell">Monto</th></tr></thead><tbody>';
  top10.forEach((r, i) => { th += `<tr><td>${i + 1}</td><td>${r.categoria}</td><td>${r.concepto}</td><td class="num-cell">${fmtMoney2(r.monto)}</td></tr>`; });
  document.getElementById('tblTop10Anio').innerHTML = th + '</tbody>';
}
