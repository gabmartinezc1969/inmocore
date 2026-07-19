import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import {
  sum, realSum, filterRows, allYears, targetYearMonth, categoryTable, catColor,
  fixedVariableExtra, historicalMonths, sparklineSVG, monthLabelShort,
  totalDebt, computeFinancialScore, detectSubscriptions, computeAlerts, pendingItems, amortizationStatus,
} from '../modules/calculations.js';
import { fmtMoney, fmtMoney2, fmtPct, fmtDate } from '../modules/format.js';
import { drawChart, chartTheme } from '../modules/charts.js';

export function render() {
  const { year, monthIdx } = targetYearMonth();
  const ing = categoryTable(year, monthIdx, 'I');
  const egr = categoryTable(year, monthIdx, 'E');
  const ingresos = ing.totals.real, egresos = egr.totals.real;
  const saldo = ingresos - egresos;
  const tasa = ingresos > 0 ? saldo / ingresos : (egresos > 0 ? -1 : 0);
  const pctGastoIngreso = ingresos > 0 ? egresos / ingresos : null;
  const { fijo, variable, extra } = fixedVariableExtra(year, monthIdx);

  const allMonths = historicalMonths();
  let acc = 0;
  const cumSeries = allMonths.map((mo) => {
    const i = realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'I' }));
    const e = realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'E' }));
    acc += (i - e); return acc;
  });
  const ahorroAcumulado = cumSeries.length ? cumSeries[cumSeries.length - 1] : 0;

  const porEjercerMes = sum(filterRows({ year, monthIdx, tipo: 'E' }).filter((r) => r.presupuesto > 0 && (r.monto === null || r.monto === 0)), 'presupuesto');
  const porEjercerAnio = sum(filterRows({ year, tipo: 'E' }).filter((r) => r.presupuesto > 0 && (r.monto === null || r.monto === 0)), 'presupuesto');
  const ejercidoAnio = realSum(filterRows({ year, tipo: 'E' }));
  const ingresoAnio = realSum(filterRows({ year, tipo: 'I' }));

  const ingPendMes = sum(filterRows({ year, monthIdx, tipo: 'I' }).filter((r) => r.presupuesto > 0 && (r.monto === null || r.monto === 0)), 'presupuesto');
  const ingresoProyectado = ingresos + ingPendMes;
  const egresoProyectado = egresos + porEjercerMes;
  const cierreProyectado = ingresoProyectado - egresoProyectado;

  const last6 = historicalMonths().slice(-6);
  const spark6 = last6.map((mo) => realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'E' })));

  const presuMes = sum(filterRows({ year, monthIdx, tipo: 'E' }), 'presupuesto');
  const pctEjercido = presuMes > 0 ? Math.min(1, egresos / presuMes) : 0;

  const monthLabel = CONFIG.months[monthIdx][0].toUpperCase() + CONFIG.months[monthIdx].slice(1);
  document.getElementById('inicioFecha').innerHTML = `<span class="mono" style="color:var(--muted);font-size:.78rem;">${monthLabel} ${year}</span>`;
  document.getElementById('inCards').innerHTML = `
    <div class="card hero-kpi"><div class="label">Por ejercer este mes</div><div class="value">${fmtMoney(porEjercerMes)}</div>
      <div class="kpi-bar"><div class="budget-track"><div class="budget-fill ${pctEjercido > 1 ? 'red' : pctEjercido >= 0.8 ? 'yellow' : 'green'}" style="width:${pctEjercido * 100}%"></div></div></div>
      <div class="foot">${fmtPct(pctEjercido)} del presupuesto de ${CONFIG.months[monthIdx]} ya ejercido</div></div>
    <div class="card hero-kpi"><div class="label">Forecast cierre de mes</div><div class="value ${cierreProyectado >= 0 ? 'pos' : 'neg'}">${fmtMoney(cierreProyectado)}</div>
      <div class="foot">Proyección: ingresos ${fmtMoney(ingresoProyectado)} − gastos ${fmtMoney(egresoProyectado)} (real + pendiente)</div></div>
    <div class="card hero-kpi"><div class="label">Por ejercer resto del año</div><div class="value">${fmtMoney(porEjercerAnio)}</div>
      <div class="foot">Todo lo presupuestado sin pagar en ${year}</div></div>
    <div class="card"><div class="label">Saldo del mes</div><div class="value ${saldo >= 0 ? 'pos' : 'neg'}">${fmtMoney(saldo)}</div>
      <div class="foot"><span class="stamp ${saldo >= 0 ? 'stamp-pos' : 'stamp-neg'}">${saldo >= 0 ? 'Superávit' : 'Déficit'}</span></div></div>
    <div class="card"><div class="label">Ingresos del mes</div><div class="value pos">${fmtMoney(ingresos)}</div></div>
    <div class="card"><div class="label">Ejercido del mes</div><div class="value neg">${fmtMoney(egresos)}</div>
      <div class="kpi-spark">${sparklineSVG(spark6, 110, 24, '#F0655A')}</div>
      <div class="foot">Últimos 6 meses${pctGastoIngreso === null ? '' : ' · ' + fmtPct(pctGastoIngreso) + ' del ingreso'}</div></div>
    <div class="card"><div class="label">% de ahorro del mes</div><div class="value ${tasa >= 0 ? 'pos' : 'neg'}">${fmtPct(tasa)}</div></div>
    <div class="card"><div class="label">Acumulado ${year}</div><div class="value ${ingresoAnio - ejercidoAnio >= 0 ? 'pos' : 'neg'}">${fmtMoney(ingresoAnio - ejercidoAnio)}</div>
      <div class="foot">Ingresos ${fmtMoney(ingresoAnio)} − ejercido ${fmtMoney(ejercidoAnio)}</div></div>
    <div class="card"><div class="label">Ahorro histórico (2020–hoy)</div><div class="value ${ahorroAcumulado >= 0 ? 'pos' : 'neg'}">${fmtMoney(ahorroAcumulado)}</div></div>
  `;

  document.getElementById('inFvSub').textContent = `${monthLabel} ${year}`;
  drawChart('chartFijoVar', 'doughnut', {
    labels: ['Fijos', 'Variables', 'Extraordinarios'],
    datasets: [{ data: [fijo, variable, extra], backgroundColor: ['#2DD4A7', '#F2C14E', '#F0655A'], borderWidth: 2, borderColor: '#131B18' }],
  }, { plugins: { legend: { display: false } } });
  const totalFVE = (fijo + variable + extra) || 1;
  document.getElementById('inFvLegend').innerHTML = `
    <span><span class="dot" style="background:#2DD4A7"></span>Fijos ${fmtMoney(fijo)} (${fmtPct(fijo / totalFVE)})</span>
    <span><span class="dot" style="background:#F2C14E"></span>Variables ${fmtMoney(variable)} (${fmtPct(variable / totalFVE)})</span>
    <span><span class="dot" style="background:#F0655A"></span>Extraordinarios ${fmtMoney(extra)} (${fmtPct(extra / totalFVE)})</span>
  `;

  drawChart('chartAhorroAcum', 'line', {
    labels: allMonths.map(monthLabelShort),
    datasets: [{ data: cumSeries, borderColor: '#E8B34B', backgroundColor: '#E8B34B22', fill: true, tension: 0.25, pointRadius: 0 }],
  });

  const _assets = state.assets;
  const _invs = state.investments;
  const _invValor = sum(_invs, 'valor');
  const _activos = sum(_assets, 'valor') + _invValor;
  const _deuda = totalDebt();
  const _pat = _activos - _deuda;
  const _score = computeFinancialScore();
  const _liquidos = sum(_assets.filter((a) => a.tipo === 'Cuenta bancaria' || a.tipo === 'Efectivo'), 'valor') + _invValor;
  const _last6 = historicalMonths().slice(-6);
  const _gastoProm = _last6.length ? sum(_last6.map((mo) => ({ v: realSum(filterRows({ year: mo.year, monthIdx: mo.monthIdx, tipo: 'E' })) })), 'v') / _last6.length : 0;
  const _liqMeses = _gastoProm > 0 ? _liquidos / _gastoProm : null;
  const _subs = detectSubscriptions();
  const _subsMes = sum(_subs, 'promedio');
  const _scoreColor = _score.total >= 80 ? 'var(--accent)' : _score.total >= 60 ? 'var(--gold)' : _score.total >= 40 ? 'var(--amber)' : 'var(--red)';
  document.getElementById('inPatCards').innerHTML = `
    <div class="card"><div class="label">Patrimonio neto</div><div class="value ${_pat >= 0 ? 'pos' : 'neg'}">${fmtMoney(_pat)}</div>
      <div class="foot">Activos ${fmtMoney(_activos)} − deuda ${fmtMoney(_deuda)}</div></div>
    <div class="card"><div class="label">Score financiero</div><div class="value" style="color:${_scoreColor}">${_score.total} <span style="font-size:.8rem;">/ 100</span></div>
      <div class="foot">${_score.label} · ahorro 6m ${fmtPct(_score.avgTasa)}</div></div>
    <div class="card"><div class="label">Deuda total</div><div class="value neg">${fmtMoney(_deuda)}</div>
      <div class="foot">Créditos + saldos manuales</div></div>
    <div class="card"><div class="label">Liquidez</div><div class="value">${_liqMeses === null ? '—' : _liqMeses.toFixed(1) + ' m'}</div>
      <div class="foot">Meses de gasto cubiertos con líquidos</div></div>
    <div class="card"><div class="label">Suscripciones</div><div class="value neg">${fmtMoney(_subsMes)}</div>
      <div class="foot">${_subs.length} detectada(s) · ${fmtMoney(_subsMes * 12)} al año</div></div>
  `;

  const mesesCut = CONFIG.monthsAbbr.slice(0, monthIdx + 1);
  const tIng = mesesCut.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo: 'I' })));
  const tEgr = mesesCut.map((m, i) => realSum(filterRows({ year, monthIdx: i, tipo: 'E' })));
  document.getElementById('inTendSub').textContent = `Ingresos, egresos y saldo — ${year} hasta ${CONFIG.months[monthIdx]}`;
  drawChart('chartInTendencia', 'line', {
    labels: mesesCut,
    datasets: [
      { label: 'Ingreso', data: tIng, borderColor: '#2DD4A7', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2, borderWidth: 2 },
      { label: 'Egreso', data: tEgr, borderColor: '#F0655A', backgroundColor: 'transparent', tension: 0.3, pointRadius: 2, borderWidth: 2 },
      { label: 'Saldo', data: tIng.map((v, i) => v - tEgr[i]), borderColor: '#E8B34B', backgroundColor: '#E8B34B22', tension: 0.3, fill: true, borderDash: [5, 3], pointRadius: 0, borderWidth: 2 },
    ],
  });

  const catMes = categoryTable(year, monthIdx, 'E').rows.filter((r) => r.real > 0).sort((a, b) => b.real - a.real);
  document.getElementById('inCatMesSub').textContent = `${monthLabel} ${year} · ${fmtMoney(sum(catMes, 'real'))}`;
  drawChart('chartInCatMes', 'doughnut', {
    labels: catMes.map((r) => r.categoria),
    datasets: [{ data: catMes.map((r) => r.real), backgroundColor: catMes.map((r) => catColor(r.categoria)), borderWidth: 2, borderColor: chartTheme().border }],
  }, { plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 }, color: chartTheme().legend } } } });

  const budRows = categoryTable(year, monthIdx, 'E').rows.filter((r) => r.presupuesto > 0).sort((a, b) => b.presupuesto - a.presupuesto).slice(0, 6);
  document.getElementById('inBudgetBars').innerHTML = budRows.length ? budRows.map((r) => {
    const pct = r.real / r.presupuesto;
    const cls = pct > 1 ? 'red' : pct >= 0.8 ? 'yellow' : 'green';
    return `<div class="budget-row" style="margin-bottom:11px;">
      <div class="br-head"><div class="br-name" style="font-size:.8rem;"><span class="semaforo ${cls}"></span>${r.categoria}</div><div class="br-pct">${fmtPct(pct)}</div></div>
      <div class="budget-track" style="height:9px;"><div class="budget-fill ${cls}" style="width:${Math.min(100, pct * 100)}%"></div></div>
      <div class="br-foot"><span>${fmtMoney(r.real)} de ${fmtMoney(r.presupuesto)}</span><span>Disp: ${fmtMoney(Math.max(0, r.presupuesto - r.real))}</span></div>
    </div>`;
  }).join('') : '<div class="empty">Sin presupuestos este mes</div>';

  const _credits = state.credits;
  document.getElementById('inCreditsPreview').innerHTML = _credits.length ? _credits.map((c) => {
    const am = amortizationStatus(c);
    const saldoC = (typeof c.saldoBanco === 'number' && c.saldoBanco > 0) ? c.saldoBanco : (am ? am.saldoTeorico : null);
    const prog = (c.monto > 0 && saldoC !== null) ? 1 - saldoC / c.monto : 0;
    return `<div class="budget-row" style="margin-bottom:11px;">
      <div class="br-head"><div class="br-name" style="font-size:.8rem;">${c.nombre}</div><div class="br-pct">${saldoC !== null ? fmtMoney(saldoC) : '—'} restante</div></div>
      <div class="budget-track" style="height:9px;"><div class="budget-fill green" style="width:${Math.max(0, Math.min(100, prog * 100))}%"></div></div>
      <div class="br-foot"><span>${fmtPct(prog)} liquidado</span><span>${am ? am.mesesRestantes + ' meses restantes' : ''}</span></div>
    </div>`;
  }).join('') : '<div class="empty">Sin créditos registrados — agrégalos en Créditos y Deudas</div>';

  const _years = allYears();
  document.getElementById('inAniosSub').textContent = `Historial completo — ${year} solo hasta ${CONFIG.months[monthIdx]}`;
  drawChart('chartInAnios', 'bar', {
    labels: _years.map(String),
    datasets: [{ data: _years.map((y) => realSum(filterRows({ year: y, tipo: 'E' }))), backgroundColor: _years.map((y) => (y === year ? '#F0655A' : '#5B6E64')), borderRadius: 5 }],
  }, { plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ' ' + fmtMoney(ctx.parsed.y) } } } });

  const recientes = state.ledger.filter((r) => r.monto).sort((a, b) => b.date - a.date).slice(0, 8);
  let rh = '<thead><tr><th>Fecha</th><th>Categoría</th><th>Concepto</th><th class="num-cell">Monto</th></tr></thead><tbody>';
  recientes.forEach((r) => {
    rh += `<tr><td class="mono" style="font-size:.74rem;">${fmtDate(r.date)}</td>
      <td><span class="cat-cell"><span class="dot" style="background:${catColor(r.categoria)}"></span>${r.categoria}</span></td>
      <td style="font-size:.78rem;">${r.concepto}</td>
      <td class="num-cell ${r.tipo === 'I' ? 'pos-text' : 'neg-text'}">${r.tipo === 'I' ? '+' : '−'}${fmtMoney2(r.monto)}</td></tr>`;
  });
  document.getElementById('inRecentTable').innerHTML = rh + '</tbody>';

  const allAlerts = computeAlerts();
  const alerts = allAlerts.slice(0, 4);
  document.getElementById('inAlertsPreview').innerHTML = alerts.length
    ? alerts.map((a) => `<div class="alert-item sev-${a.sev}"><div class="ai-icon" aria-hidden="true">${a.icon}</div><div><div class="ai-title">${a.title}</div><div class="ai-detail">${a.detail}</div></div></div>`).join('') + (allAlerts.length > 4 ? `<div style="font-size:.76rem;color:var(--muted);margin-top:2px;">+${allAlerts.length - 4} más en Alertas</div>` : '')
    : '<div class="empty">Sin alertas activas. Todo en orden.</div>';

  const allPend = pendingItems();
  const pend = allPend.slice(0, 4);
  document.getElementById('inRemindersPreview').innerHTML = pend.length
    ? pend.map((i) => `<div class="reminder-item"><div class="ri-left"><div class="ri-date">${fmtDate(i.date)}${i.diffDays < 0 ? ' <span class="stamp stamp-neg" style="padding:0 5px;font-size:.58rem;">Vencido</span>' : ''}</div><div class="ri-info"><div class="ri-cat">${i.categoria}</div><div class="ri-con">${i.concepto}</div></div></div><div class="ri-right"><div class="ri-amt">${fmtMoney2(i.presupuesto)}</div></div></div>`).join('') + (allPend.length > 4 ? `<div style="font-size:.76rem;color:var(--muted);margin-top:2px;">+${allPend.length - 4} más en Recordatorios</div>` : '')
    : '<div class="empty">No hay pagos pendientes.</div>';
}
