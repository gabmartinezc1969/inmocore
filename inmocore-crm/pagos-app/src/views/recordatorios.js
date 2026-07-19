import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { sum, realSum, filterRows, targetYearMonth, daysInMonth, catColor, pendingItems } from '../modules/calculations.js';
import { fmtMoney, fmtMoney2, fmtDate } from '../modules/format.js';
import { persistLedger } from '../modules/data.js';
import { toast, renderAllTabsSoft } from '../modules/ui.js';

let calState = { year: null, monthIdx: null, init: false };

function renderFinCalendar() {
  if (calState.year === null) {
    const t = targetYearMonth();
    calState.year = t.year; calState.monthIdx = t.monthIdx;
  }
  if (!calState.init) {
    calState.init = true;
    document.getElementById('calPrev').addEventListener('click', () => {
      calState.monthIdx--; if (calState.monthIdx < 0) { calState.monthIdx = 11; calState.year--; }
      renderFinCalendar();
    });
    document.getElementById('calNext').addEventListener('click', () => {
      calState.monthIdx++; if (calState.monthIdx > 11) { calState.monthIdx = 0; calState.year++; }
      renderFinCalendar();
    });
  }
  const { year, monthIdx } = calState;
  document.getElementById('calLabel').textContent = CONFIG.months[monthIdx][0].toUpperCase() + CONFIG.months[monthIdx].slice(1) + ' ' + year;
  const byDay = {};
  filterRows({ year, monthIdx, tipo: 'E' }).forEach((r) => {
    const d = r.date.getDate();
    (byDay[d] = byDay[d] || []).push(r);
  });
  const nDays = daysInMonth(year, monthIdx);
  const firstDow = (new Date(year, monthIdx, 1).getDay() + 6) % 7;
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === monthIdx && today.getDate() === d;
  let html = CONFIG.dayOfWeekAbbr.map((d) => `<div class="hc-dow">${d}</div>`).join('');
  for (let i = 0; i < firstDow; i++) html += '<div class="heat-cell empty"></div>';
  for (let d = 1; d <= nDays; d++) {
    const items = byDay[d] || [];
    const pend = items.filter((r) => r.presupuesto > 0 && (r.monto === null || r.monto === 0));
    const paid = items.filter((r) => r.monto);
    const totPend = sum(pend, 'presupuesto');
    const totPaid = realSum(paid);
    const border = isToday(d) ? 'border:2px solid var(--accent);' : '';
    let inner = `<div style="font-family:'JetBrains Mono',monospace;font-size:.66rem;color:var(--muted);">${d}</div>`;
    if (totPend > 0) inner += `<div style="font-size:.6rem;color:var(--amber);font-weight:700;" title="${pend.map((r) => r.categoria + ' · ' + r.concepto).join(', ')}">⏳ ${fmtMoney(totPend)}</div>`;
    if (totPaid > 0) inner += `<div style="font-size:.6rem;color:var(--accent);font-weight:700;" title="${paid.map((r) => r.categoria + ' · ' + r.concepto).join(', ')}">✓ ${fmtMoney(totPaid)}</div>`;
    html += `<div class="heat-cell" style="aspect-ratio:auto;flex-direction:column;align-items:flex-start;justify-content:flex-start;gap:2px;padding:5px 6px;${border}">${inner}</div>`;
  }
  document.getElementById('finCalendar').innerHTML = html;
}

function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
function buildICS() {
  const items = pendingItems().filter((i) => i.diffDays >= -31); // vencidos recientes + futuros
  if (!items.length) return null;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pagos Centro Financiero//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:Pagos pendientes', 'X-WR-TIMEZONE:America/Mexico_City',
  ];
  items.forEach((i) => {
    const d = i.date;
    const dstr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const dEnd = new Date(d.getTime() + 86400000);
    const dEndStr = `${dEnd.getFullYear()}${String(dEnd.getMonth() + 1).padStart(2, '0')}${String(dEnd.getDate()).padStart(2, '0')}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${i.id}@pagos-app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dstr}`,
      `DTEND;VALUE=DATE:${dEndStr}`,
      `SUMMARY:${icsEscape('💳 Pago: ' + i.categoria + ' · ' + i.concepto)}`,
      `DESCRIPTION:${icsEscape('Monto presupuestado: ' + fmtMoney2(i.presupuesto) + '. Generado por Pagos Centro Financiero.')}`,
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape('Mañana: pago de ' + i.categoria)}`, 'TRIGGER:-P1D', 'END:VALARM',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape('Hoy vence: ' + i.categoria + ' ' + fmtMoney2(i.presupuesto))}`, 'TRIGGER:PT9H', 'END:VALARM',
      'END:VEVENT'
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function exportICS() {
  const ics = buildICS();
  if (!ics) { toast('No hay pagos pendientes que exportar'); return; }
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pagos_pendientes.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Calendario descargado — impórtalo en Google Calendar');
}

let wired = false;
function wireOnce() {
  if (wired) return;
  wired = true;
  document.getElementById('btnExportICS').addEventListener('click', exportICS);
}

function group(title, list, cls) {
  if (!list.length) return '';
  let html = `<div class="reminder-group"><h4><span class="stamp ${cls}" style="font-size:.6rem;padding:1px 8px;">${title}</span> ${list.length} · ${fmtMoney(sum(list, 'presupuesto'))}</h4>`;
  list.forEach((i) => {
    const dayLabel = i.diffDays < 0 ? `Vencido hace ${Math.abs(i.diffDays)} día(s)` : i.diffDays === 0 ? 'Vence hoy' : `En ${i.diffDays} día(s)`;
    html += `<div class="reminder-item">
      <div class="ri-left">
        <div class="ri-date">${fmtDate(i.date)}<br><span style="font-size:.66rem;">${dayLabel}</span></div>
        <div class="ri-info"><div class="ri-cat"><span class="dot" style="background:${catColor(i.categoria)};display:inline-block;margin-right:6px;"></span>${i.categoria}</div><div class="ri-con">${i.concepto}</div></div>
      </div>
      <div class="ri-right">
        <div class="ri-amt">${fmtMoney2(i.presupuesto)}</div>
        <button class="btn small emerald" data-pay="${i.id}">Marcar pagado</button>
      </div>
    </div>`;
  });
  html += '</div>';
  return html;
}

export function render() {
  wireOnce();
  renderFinCalendar();
  const items = pendingItems();
  const vencidos = items.filter((i) => i.diffDays < 0);
  const hoy = items.filter((i) => i.diffDays === 0);
  const semana = items.filter((i) => i.diffDays > 0 && i.diffDays <= 7);
  const mes = items.filter((i) => i.diffDays > 7 && i.diffDays <= 30);
  const despues = items.filter((i) => i.diffDays > 30);

  const totalVencido = sum(vencidos, 'presupuesto');
  const total30 = sum([...hoy, ...semana, ...mes], 'presupuesto');

  document.getElementById('remCards').innerHTML = `
    <div class="card"><div class="label">Pagos pendientes</div><div class="value">${items.length}</div></div>
    <div class="card"><div class="label">Vencidos</div><div class="value ${vencidos.length ? 'neg' : ''}">${fmtMoney(totalVencido)}</div><div class="foot">${vencidos.length} movimiento(s)</div></div>
    <div class="card"><div class="label">Próximos 30 días</div><div class="value">${fmtMoney(total30)}</div></div>
  `;

  let body = '';
  body += group('Vencido', vencidos, 'stamp-neg');
  body += group('Hoy', hoy, 'stamp-warn');
  body += group('Próximos 7 días', semana, 'stamp-warn');
  body += group('Próximos 30 días', mes, 'stamp-flat');
  body += group('Más adelante', despues, 'stamp-flat');
  document.getElementById('remBody').innerHTML = body || '<div class="empty">No hay pagos pendientes registrados. ¡Al corriente!</div>';

  document.querySelectorAll('[data-pay]').forEach((b) => {
    b.addEventListener('click', () => {
      const r = state.ledger.find((x) => x.id === b.dataset.pay);
      const val = prompt('Monto pagado para "' + r.categoria + ' · ' + r.concepto + '":', r.presupuesto);
      if (val === null) return;
      const num = parseFloat(val);
      if (isNaN(num)) { toast('Monto inválido'); return; }
      r.monto = num;
      persistLedger();
      renderAllTabsSoft();
      toast('Pago registrado');
    });
  });
}
