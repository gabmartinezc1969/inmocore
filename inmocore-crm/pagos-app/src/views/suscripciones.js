import { sum, detectSubscriptions } from '../modules/calculations.js';
import { fmtMoney, fmtMoney2, fmtDate } from '../modules/format.js';
import { state } from '../modules/state.js';
import { saveDismissedSubs } from '../modules/data.js';
import { drawChart } from '../modules/charts.js';
import { toast } from '../modules/ui.js';

export function render() {
  const subs = detectSubscriptions();
  const totalMensual = sum(subs, 'promedio');

  document.getElementById('subCards').innerHTML = `
    <div class="card"><div class="label">Suscripciones detectadas</div><div class="value">${subs.length}</div></div>
    <div class="card"><div class="label">Costo mensual estimado</div><div class="value neg">${fmtMoney(totalMensual)}</div></div>
    <div class="card"><div class="label">Costo anual estimado</div><div class="value neg">${fmtMoney(totalMensual * 12)}</div></div>
  `;

  let th = '<thead><tr><th>Categoría</th><th>Concepto</th><th class="num-cell">Promedio mensual</th><th class="num-cell">Meses activo</th><th>Última fecha</th><th class="num-cell">Costo anual</th><th>Acciones</th></tr></thead><tbody>';
  subs.forEach((s) => {
    th += `<tr><td>${s.categoria}</td><td>${s.concepto}</td><td class="num-cell">${fmtMoney2(s.promedio)}</td><td class="num-cell">${s.meses}</td><td class="mono">${fmtDate(s.ultimaFecha)}</td><td class="num-cell">${fmtMoney(s.costoAnual)}</td>
      <td><button class="icon-btn" data-dismiss-sub="${s.key}" title="No es una suscripción" aria-label="Marcar ${s.concepto} como no suscripción">✕</button></td></tr>`;
  });
  if (!subs.length) th += '<tr><td colspan="7" class="empty">No se detectaron cargos recurrentes con estas características (mismo concepto, 3+ meses, monto estable y menor a $5,000)</td></tr>';
  document.getElementById('tblSuscripciones').innerHTML = th + '</tbody>';

  drawChart('chartSuscripciones', 'bar', {
    labels: subs.map((s) => s.concepto),
    datasets: [{ data: subs.map((s) => s.promedio), backgroundColor: '#9B8CFF', borderRadius: 4 }],
  }, { indexAxis: 'y', plugins: { legend: { display: false } } });

  document.querySelectorAll('[data-dismiss-sub]').forEach((b) => b.addEventListener('click', () => {
    saveDismissedSubs([...state.dismissedSubs, b.dataset.dismissSub]);
    render();
    toast('Descartado de suscripciones');
  }));
}
