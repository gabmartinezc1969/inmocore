// Shell UI: nav/drawer, the view router (code-split — each view is a
// dynamic import), toasts, generic modal accessibility, theme, the sticky
// app header, and nav badges. View-specific DOM building lives in views/*.js.
import { CONFIG, catColor } from './config.js';
import { state } from './state.js';
import { fmtMoney } from './format.js';
import { filterRows, realSum, targetYearMonth, pendingItems, computeAlerts } from './calculations.js';
import { loadNavOrder, saveNavOrder, clearNavOrder } from './data.js';
import * as sync from './sync.js';

/* ============ Toast ============ */
let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ============ Shared category table renderer (used by resumen/ingresos/gastos) ============ */
export function renderCategoryTable(tblId, data) {
  const { rows, totals } = data;
  const tbl = document.getElementById(tblId);
  if (!tbl) return;
  let html = '<thead><tr><th>Categoría</th><th class="num-cell">Presupuesto</th><th class="num-cell">Real</th><th class="num-cell">Variación</th></tr></thead><tbody>';
  rows.forEach((r) => {
    const vcls = r.variacion >= 0 ? 'pos-text' : 'neg-text';
    html += `<tr><td><span class="cat-cell"><span class="dot" style="background:${catColor(r.categoria)}"></span>${r.categoria}</span></td>
      <td class="num-cell">${fmtMoney(r.presupuesto)}</td>
      <td class="num-cell">${fmtMoney(r.real)}</td>
      <td class="num-cell ${vcls}">${fmtMoney(r.variacion)}</td></tr>`;
  });
  const vcls = totals.variacion >= 0 ? 'pos-text' : 'neg-text';
  html += `<tr class="total-row"><td>Total</td><td class="num-cell">${fmtMoney(totals.presupuesto)}</td><td class="num-cell">${fmtMoney(totals.real)}</td><td class="num-cell ${vcls}">${fmtMoney(totals.variacion)}</td></tr>`;
  html += '</tbody>';
  tbl.innerHTML = html;
}

/* ============ Nav drawer (mobile) ============ */
const railNav = document.getElementById('railNav');
const menuToggle = document.getElementById('menuToggle');
const backdrop = document.getElementById('backdrop');
export function openDrawer() { railNav.classList.add('open'); backdrop.classList.add('open'); }
export function closeDrawer() { railNav.classList.remove('open'); backdrop.classList.remove('open'); }
menuToggle?.addEventListener('click', () => { railNav.classList.contains('open') ? closeDrawer() : openDrawer(); });
backdrop?.addEventListener('click', closeDrawer);

/* ============ View router (code-split: each view is a dynamic import) ============ */
const viewLoaders = {
  inicio: () => import('../views/inicio.js'),
  midashboard: () => import('../views/midashboard.js'),
  resumen: () => import('../views/resumen.js'),
  anual: () => import('../views/anual.js'),
  matriz: () => import('../views/matriz.js'),
  ingresos: () => import('../views/ingresos.js'),
  gastos: () => import('../views/gastos.js'),
  suscripciones: () => import('../views/suscripciones.js'),
  deudas: () => import('../views/deudas.js'),
  patrimonio: () => import('../views/patrimonio.js'),
  inversiones: () => import('../views/inversiones.js'),
  movimientos: () => import('../views/movimientos.js'),
  recordatorios: () => import('../views/recordatorios.js'),
  alertas: () => import('../views/alertas.js'),
  configuracion: () => import('../views/configuracion.js'),
};

export async function renderView(name) {
  const load = viewLoaders[name];
  if (!load) return;
  const mod = await load();
  await mod.render();
  updateBadges();
  updateAppHeader();
}

/** Full nav switch: updates active states + mobile title, then renders the view. */
export async function switchToView(name) {
  document.querySelectorAll('.rail-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === 'view-' + name));
  const btn = document.querySelector(`.rail-btn[data-view="${name}"]`);
  const mt = document.getElementById('mobileTitle');
  if (mt) mt.textContent = btn?.dataset.label || name;
  closeDrawer();
  window.scrollTo(0, 0);
  await renderView(name);
}

/** Re-renders whichever view is currently active — used after data mutations that don't warrant a full nav switch. */
export function activeViewName() {
  return document.querySelector('.rail-btn.active')?.dataset.view;
}
export async function renderAllTabsSoft() {
  const active = activeViewName();
  if (active) await renderView(active);
}

document.querySelectorAll('.rail-btn').forEach((btn) => {
  btn.addEventListener('click', () => switchToView(btn.dataset.view));
});

/* ============ Badges (pending / alert counts in the nav) ============ */
export function updateBadges() {
  const pend = pendingItems().length;
  const pendEl = document.getElementById('pendingBadge');
  if (pendEl) pendEl.innerHTML = pend ? `<span class="stamp stamp-warn" style="padding:1px 6px;font-size:.58rem;">${pend}</span>` : '';
  const ale = computeAlerts().length;
  const aleEl = document.getElementById('alertBadge');
  if (aleEl) aleEl.innerHTML = ale ? `<span class="stamp stamp-neg" style="padding:1px 6px;font-size:.58rem;">${ale}</span>` : '';
}

/* ============ Nav reordering ============ */
function defaultNavOrder() {
  return [...document.querySelectorAll('.rail-btn')].sort((a, b) => (+a.dataset.orig) - (+b.dataset.orig)).map((b) => b.dataset.view);
}
export function applyNavOrder() {
  const order = state.navOrder;
  const nav = document.querySelector('.rail-nav');
  const groups = nav.querySelectorAll('.rail-group');
  if (!order) { groups.forEach((g) => { g.style.display = ''; }); return; }
  groups.forEach((g) => { g.style.display = 'none'; }); // custom order replaces grouped layout
  const btns = {};
  nav.querySelectorAll('.rail-btn').forEach((b) => { btns[b.dataset.view] = b; });
  const valid = order.filter((v) => btns[v]);
  defaultNavOrder().forEach((v) => { if (!valid.includes(v)) valid.push(v); }); // any new sections go to the end
  valid.forEach((v, i) => {
    const b = btns[v];
    const num = b.querySelector('.num');
    if (num) num.textContent = String(i + 1).padStart(2, '0');
    nav.appendChild(b); // moving preserves listeners
  });
}
export function renderNavOrderUI() {
  const el = document.getElementById('navOrderList');
  if (!el) return;
  const order = state.navOrder || defaultNavOrder();
  const labels = {};
  document.querySelectorAll('.rail-btn').forEach((b) => { labels[b.dataset.view] = b.dataset.label || b.dataset.view; });
  el.innerHTML = order.map((v, i) => `
    <div class="reminder-item" style="padding:8px 13px;">
      <div class="ri-left"><span class="mono" style="color:var(--muted);font-size:.72rem;width:24px;">${String(i + 1).padStart(2, '0')}</span><span style="font-weight:700;">${labels[v] || v}</span></div>
      <div class="ri-right">
        <button class="icon-btn" data-ord-up="${i}" title="Subir" aria-label="Subir ${labels[v] || v}" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>↑</button>
        <button class="icon-btn" data-ord-down="${i}" title="Bajar" aria-label="Bajar ${labels[v] || v}" ${i === order.length - 1 ? 'disabled style="opacity:.3"' : ''}>↓</button>
      </div>
    </div>`).join('');
  el.querySelectorAll('[data-ord-up]').forEach((b) => b.addEventListener('click', () => moveNavItem(+b.dataset.ordUp, -1)));
  el.querySelectorAll('[data-ord-down]').forEach((b) => b.addEventListener('click', () => moveNavItem(+b.dataset.ordDown, +1)));
}
export function moveNavItem(i, dir) {
  const order = state.navOrder || defaultNavOrder();
  const j = i + dir;
  if (j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  saveNavOrder(order);
  applyNavOrder();
  renderNavOrderUI();
}
document.getElementById('btnResetOrder')?.addEventListener('click', () => {
  clearNavOrder();
  location.reload();
});

/* ============ Theme ============ */
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) };
}
function shadeHex(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
export function applyTheme() {
  const K = CONFIG.storage.keys;
  const theme = localStorage.getItem(K.theme) || 'dark';
  document.body.dataset.theme = theme;
  state.theme = theme;
  const accent = localStorage.getItem(K.accent) || CONFIG.colors.accent;
  const { r, g, b } = hexToRgb(accent);
  const root = document.documentElement.style;
  root.setProperty('--accent', accent);
  root.setProperty('--accent-dark', shadeHex(accent, 0.72));
  root.setProperty('--accent-soft', `rgba(${r},${g},${b},.13)`);
  root.setProperty('--bg-glow-1', `rgba(${r},${g},${b},${theme === 'light' ? '.08' : '.07'})`);
  const sel = document.getElementById('themeSelect');
  if (sel) sel.value = theme;
  const picker = document.getElementById('accentPicker');
  if (picker) picker.value = accent;
  const icon = document.getElementById('ahThemeIcon');
  if (icon) {
    icon.innerHTML = theme === 'light'
      ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
      : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  }
}
export function setTheme(theme) {
  localStorage.setItem(CONFIG.storage.keys.theme, theme);
  applyTheme();
  renderAllTabsSoft(); // re-draw charts with theme colors
}
export function initThemeControls() {
  document.getElementById('themeSelect')?.addEventListener('change', (e) => setTheme(e.target.value));
  document.getElementById('accentPicker')?.addEventListener('change', (e) => {
    localStorage.setItem(CONFIG.storage.keys.accent, e.target.value);
    applyTheme();
  });
  document.getElementById('btnResetAccent')?.addEventListener('click', () => {
    localStorage.removeItem(CONFIG.storage.keys.accent);
    applyTheme();
    toast('Color restablecido');
  });
  document.getElementById('ahThemeToggle')?.addEventListener('click', () => {
    setTheme((localStorage.getItem(CONFIG.storage.keys.theme) || 'dark') === 'dark' ? 'light' : 'dark');
  });
}

/* ============ Sticky app header ============ */
export function updateAppHeader() {
  const { year, monthIdx } = targetYearMonth();
  const ingresos = realSum(filterRows({ year, monthIdx, tipo: 'I' }));
  const egresos = realSum(filterRows({ year, monthIdx, tipo: 'E' }));
  const saldo = ingresos - egresos;
  const monthEl = document.getElementById('ahMonth');
  if (monthEl) monthEl.textContent = CONFIG.months[monthIdx][0].toUpperCase() + CONFIG.months[monthIdx].slice(1) + ' ' + year;
  const bal = document.getElementById('ahBalance');
  if (bal) {
    bal.textContent = fmtMoney(saldo);
    bal.style.color = saldo >= 0 ? 'var(--accent)' : 'var(--red)';
  }
}
function updateHeaderSync(syncState, label) {
  const dot = document.getElementById('ahSyncDot');
  const lbl = document.getElementById('ahSyncLbl');
  if (!dot) return;
  dot.className = 'sync-dot' + (syncState === 'off' ? '' : ' ' + syncState);
  lbl.textContent = label;
}
export function refreshHeaderSyncFromState() {
  if (sync.cloudState.lastError || (!sync.syncStatus.connected && sync.syncStatus.needsPermission)) {
    updateHeaderSync('err', 'revisar sincronización');
  } else if (sync.getCloudId() || sync.syncStatus.connected) {
    updateHeaderSync('ok', 'sincronizado');
  } else {
    updateHeaderSync('off', 'solo local');
  }
}
export function initAppHeader() {
  document.getElementById('ahQuickAdd')?.addEventListener('click', async () => {
    (await viewLoaders.movimientos()).openAddModal?.();
  });
  document.getElementById('ahQuickCal')?.addEventListener('click', () => {
    document.querySelector('[data-view="recordatorios"]')?.click();
  });
  updateAppHeader();
  refreshHeaderSyncFromState();
}

// sync.js can't import ui.js (would be circular); it calls this instead whenever
// something changes that the header/status panels need to reflect.
sync.onSyncDirty((message) => {
  if (typeof message === 'string' && message) toast(message);
  refreshHeaderSyncFromState();
  document.getElementById('syncStatus') && renderSyncStatusPanel();
  document.getElementById('cloudStatus') && renderCloudStatusPanel();
  document.getElementById('backupStatus') && renderBackupStatusPanel();
});

export function renderSyncStatusPanel() {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const s = sync.syncStatus;
  const fmtWhen = (d) => (d ? d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : null);
  let html;
  if (s.connected) {
    html = `<span class="stamp stamp-pos">Conectado</span> <span style="margin-left:8px;">${s.filename}${s.lastSync ? ' · guardado ' + fmtWhen(s.lastSync) : ''}</span>`;
  } else if (s.needsPermission) {
    html = `<span class="stamp stamp-warn">Reconectar</span> <span style="margin-left:8px;">${s.filename} — dale clic a "Reconectar" para reanudar el guardado automático</span>`;
  } else if (!s.supported) {
    html = '<span class="stamp stamp-flat">No disponible</span> <span style="margin-left:8px;">Este navegador no soporta guardado directo a archivo — usa Exportar / Importar para sincronizar manualmente vía OneDrive</span>';
  } else {
    html = '<span class="stamp stamp-flat">Solo local</span> <span style="margin-left:8px;">Tus datos se guardan únicamente en este navegador — conecta un archivo para respaldarlos en OneDrive</span>';
  }
  el.innerHTML = html;
  const show = (id, v) => { const b = document.getElementById(id); if (b) b.style.display = v ? 'inline-flex' : 'none'; };
  show('btnSyncConnect', !s.supported || s.connected || s.needsPermission ? false : true);
  show('btnSyncReconnect', s.needsPermission);
  show('btnSyncNow', s.connected);
  show('btnSyncDisconnect', s.connected || s.needsPermission);
}
export function renderCloudStatusPanel() {
  const el = document.getElementById('cloudStatus');
  if (!el) return;
  const id = sync.getCloudId();
  let html;
  if (id) {
    const shortId = id.length > 14 ? id.slice(0, 7) + '…' + id.slice(-4) : id;
    html = `<span class="stamp stamp-pos">Nube conectada</span> <span class="mono" style="margin-left:8px;">código: ${shortId}</span>
      <button class="icon-btn" id="btnCloudCopy" title="Copiar código completo" aria-label="Copiar código completo" style="margin-left:6px;">⧉</button>
      ${sync.cloudState.lastPush ? `<span style="margin-left:8px;color:var(--muted);">subido ${sync.cloudState.lastPush.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>` : ''}
      ${sync.cloudState.lastError ? `<span style="margin-left:8px;color:var(--red);">${sync.cloudState.lastError}</span>` : ''}`;
  } else {
    html = '<span class="stamp stamp-flat">Sin nube</span> <span style="margin-left:8px;color:var(--muted);">Crea una nube nueva aquí, o conecta con el código generado en otro dispositivo</span>';
  }
  el.innerHTML = html;
  document.getElementById('btnCloudCopy')?.addEventListener('click', () => {
    const fullId = sync.getCloudId();
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(fullId).then(() => toast('Código copiado'));
    else prompt('Copia tu código:', fullId);
  });
  const show = (elId, visible) => { const b = document.getElementById(elId); if (b) b.style.display = visible ? 'inline-flex' : 'none'; };
  show('btnCloudCreate', !id); show('btnCloudJoin', !id);
  show('btnCloudPull', !!id); show('btnCloudPush', !!id); show('btnCloudDisconnect', !!id);
}
export function renderBackupStatusPanel() {
  const el = document.getElementById('backupStatus');
  if (!el) return;
  const info = sync.getAutoBackup();
  el.innerHTML = info
    ? `<span class="stamp stamp-pos">Respaldo listo</span> <span style="margin-left:8px;color:var(--muted);">Último respaldo automático: ${new Date(info.at).toLocaleString('es-MX')} · ${info.data.ledger.length} movimientos</span>`
    : '<span class="stamp stamp-flat">Aún sin respaldo</span> <span style="margin-left:8px;color:var(--muted);">El primero se toma automáticamente en los próximos 5 minutos</span>';
}
export function renderPinStatusPanel() {
  const el = document.getElementById('pinStatus');
  if (!el) return;
  const set = sync.pinIsSet();
  el.innerHTML = set
    ? '<span class="stamp stamp-pos">PIN activo</span> <span style="margin-left:8px;color:var(--muted);">Se pide al abrir la app en este dispositivo (y en los sincronizados)</span>'
    : '<span class="stamp stamp-flat">Sin PIN</span> <span style="margin-left:8px;color:var(--muted);">Cualquiera con acceso a este archivo puede abrirlo</span>';
  const show = (id, v) => { const b = document.getElementById(id); if (b) b.style.display = v ? 'inline-flex' : 'none'; };
  show('btnPinSet', !set); show('btnPinChange', set); show('btnPinRemove', set);
}

/* ============ Generic modal accessibility ============ */
// Every ".modal-bg" in the app follows the same open/close-by-class-toggle
// convention, so a11y (role, focus trap, Escape-to-close, focus restore) is
// wired once here instead of once per modal.
let lastFocused = null;
function focusableIn(container) {
  return [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.offsetParent !== null);
}
export function initModalAccessibility() {
  document.querySelectorAll('.modal-bg').forEach((bg) => {
    const modal = bg.querySelector('.modal');
    const heading = modal?.querySelector('h3[id]');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      if (heading) modal.setAttribute('aria-labelledby', heading.id);
      modal.setAttribute('tabindex', '-1');
    }
    new MutationObserver(() => {
      if (bg.classList.contains('active')) {
        lastFocused = document.activeElement;
        const first = modal && focusableIn(modal)[0];
        (first || modal)?.focus();
      } else if (lastFocused) {
        lastFocused.focus?.();
        lastFocused = null;
      }
    }).observe(bg, { attributes: true, attributeFilter: ['class'] });
  });

  document.addEventListener('keydown', (e) => {
    const openBg = document.querySelector('.modal-bg.active');
    if (!openBg) return;
    if (e.key === 'Escape') {
      openBg.querySelector('.modal-actions .btn.ghost')?.click();
      return;
    }
    if (e.key === 'Tab') {
      const modal = openBg.querySelector('.modal');
      const items = modal ? focusableIn(modal) : [];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* ============ PIN lock wiring ============ */
export function initPinLock() {
  renderPinStatusPanel();
  document.getElementById('btnPinSet')?.addEventListener('click', async () => {
    const p1 = await askPinModal('Elige tu PIN', 'Escribe 4 dígitos');
    if (!p1) return;
    const p2 = await askPinModal('Confirma tu PIN', 'Escríbelo otra vez');
    if (!p2) return;
    if (p1 !== p2) { toast('Los PIN no coinciden'); return; }
    await sync.setPin(p1);
    renderPinStatusPanel();
    toast('PIN activado — se pedirá al abrir la app');
  });
  document.getElementById('btnPinChange')?.addEventListener('click', async () => {
    const cur = await askPinModal('PIN actual', 'Para confirmar tu identidad');
    if (!cur) return;
    if (!(await sync.verifyPin(cur))) { toast('PIN incorrecto'); return; }
    const p1 = await askPinModal('Nuevo PIN', 'Escribe 4 dígitos');
    if (!p1) return;
    const p2 = await askPinModal('Confirma el nuevo PIN', '');
    if (!p2 || p1 !== p2) { toast('Los PIN no coinciden'); return; }
    await sync.setPin(p1);
    toast('PIN actualizado');
  });
  document.getElementById('btnPinRemove')?.addEventListener('click', async () => {
    const cur = await askPinModal('PIN actual', 'Se quitará la protección');
    if (!cur) return;
    if (!(await sync.verifyPin(cur))) { toast('PIN incorrecto'); return; }
    sync.removePin();
    renderPinStatusPanel();
    toast('PIN eliminado');
  });

  let pinModalResolve = null;
  function askPinModal(title, sub) {
    return new Promise((resolve) => {
      pinModalResolve = resolve;
      document.getElementById('pinModalTitle').textContent = title;
      document.getElementById('pinModalSub').textContent = sub || '';
      const inp = document.getElementById('pinModalInput');
      inp.value = '';
      document.getElementById('pinModalError').textContent = '';
      document.getElementById('pinModalBg').classList.add('active');
      setTimeout(() => inp.focus(), 80);
    });
  }
  function closePinModal(val) {
    document.getElementById('pinModalBg').classList.remove('active');
    if (pinModalResolve) { const r = pinModalResolve; pinModalResolve = null; r(val); }
  }
  function pinModalCurrentValue() {
    return document.getElementById('pinModalInput').value.replace(/\D/g, '').slice(0, 4);
  }
  const inp = document.getElementById('pinModalInput');
  inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmPinModal(); });
  document.getElementById('pinModalOk').addEventListener('click', confirmPinModal);
  document.getElementById('pinModalCancel').addEventListener('click', () => closePinModal(null));
  function confirmPinModal() {
    const v = pinModalCurrentValue();
    if (v.length !== 4) { document.getElementById('pinModalError').textContent = 'Debe ser de 4 dígitos'; return; }
    closePinModal(v);
  }

  if (!sync.pinIsSet()) return;
  const lock = document.getElementById('pinLock');
  const input = document.getElementById('pinInput');
  const err = document.getElementById('pinError');
  lock.style.display = 'flex';
  setTimeout(() => input.focus(), 100);
  input.addEventListener('input', async () => {
    input.value = input.value.replace(/\D/g, '').slice(0, 4);
    if (input.value.length === 4) {
      const pin = input.value;
      if (await sync.verifyPin(pin)) {
        lock.style.display = 'none';
        input.value = '';
        err.textContent = '';
      } else {
        err.textContent = 'PIN incorrecto — intenta de nuevo';
        input.value = '';
      }
    }
  });
}
