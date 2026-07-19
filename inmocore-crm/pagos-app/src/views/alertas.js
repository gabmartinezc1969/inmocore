import { computeAlerts } from '../modules/calculations.js';

export function render() {
  const alerts = computeAlerts();
  const high = alerts.filter((a) => a.sev === 'high').length;
  const medium = alerts.filter((a) => a.sev === 'medium').length;
  document.getElementById('aleCards').innerHTML = `
    <div class="card"><div class="label">Alertas totales</div><div class="value">${alerts.length}</div></div>
    <div class="card"><div class="label">Urgentes</div><div class="value ${high ? 'neg' : ''}">${high}</div></div>
    <div class="card"><div class="label">A revisar</div><div class="value">${medium}</div></div>
  `;
  document.getElementById('aleBody').innerHTML = alerts.length
    ? alerts.map((a) => `<div class="alert-item sev-${a.sev}" role="listitem"><div class="ai-icon" aria-hidden="true">${a.icon}</div><div><div class="ai-title">${a.title}</div><div class="ai-detail">${a.detail}</div></div></div>`).join('')
    : '<div class="empty">Sin alertas activas este mes. Todo en orden.</div>';
}
