import { CONFIG } from '../modules/config.js';
import { state, toRaw } from '../modules/state.js';
import { allYears, filterRows, realSum, catList, catColor, targetYearMonth, daysInMonth, futureMonthOptions } from '../modules/calculations.js';
import { fmtMoney, fmtDate } from '../modules/format.js';
import { saveCustomCats, resetLedgerToSeed, persistLedger, nextId, normalize, deleteTransactionsMatching } from '../modules/data.js';
import { toast, renderView, activeViewName, renderNavOrderUI, renderSyncStatusPanel, renderCloudStatusPanel, renderBackupStatusPanel, renderPinStatusPanel } from '../modules/ui.js';
import * as sync from '../modules/sync.js';

const { egresoOrder: CAT_EGRESO_ORDER, ingresoOrder: CAT_INGRESO_ORDER } = CONFIG.categories;

/* ---- Catálogo: renombrar / eliminar categorías y conceptos ---- */
function renameCategoria(oldName) {
  const val = prompt(`Nuevo nombre para la categoría "${oldName}" (si escribes el nombre de otra categoría existente, se combinarán en una sola):`, oldName);
  if (val === null) return;
  const newName = val.trim();
  if (!newName || newName === oldName) return;
  let count = 0;
  state.ledger.forEach((r) => { if (r.categoria === oldName) { r.categoria = newName; count++; } });
  const custom = toRaw(state.customCats);
  ['egreso', 'ingreso'].forEach((k) => {
    const idx = custom[k].indexOf(oldName);
    if (idx > -1) custom[k][idx] = newName;
  });
  saveCustomCats(custom);
  persistLedger();
  toast(count ? `${count} movimiento(s) actualizado(s) a "${newName}"` : `Categoría renombrada a "${newName}"`);
  render();
}
function deleteCategoriaEmpty(name) {
  if (!confirm(`¿Eliminar la categoría vacía "${name}"? No tiene movimientos asociados.`)) return;
  const custom = toRaw(state.customCats);
  ['egreso', 'ingreso'].forEach((k) => { custom[k] = custom[k].filter((c) => c !== name); });
  saveCustomCats(custom);
  toast('Categoría eliminada');
  render();
}
function renameConcepto(categoria, concepto) {
  const val = prompt(`Nuevo nombre para el concepto "${concepto}" (categoría ${categoria}):`, concepto);
  if (val === null) return;
  const newName = val.trim();
  if (!newName || newName === concepto) return;
  let count = 0;
  state.ledger.forEach((r) => { if (r.categoria === categoria && r.concepto === concepto) { r.concepto = newName; count++; } });
  persistLedger();
  toast(`${count} movimiento(s) renombrado(s) a "${newName}"`);
  render();
}
function moverConcepto(categoria, concepto) {
  const allCats = [...new Set(state.ledger.map((r) => r.categoria))].sort();
  const val = prompt(`¿A qué categoría quieres mover "${concepto}"?\n\nCategorías existentes: ${allCats.join(', ')}`, categoria);
  if (val === null) return;
  const newCat = val.trim();
  if (!newCat || newCat === categoria) return;
  let count = 0;
  state.ledger.forEach((r) => { if (r.categoria === categoria && r.concepto === concepto) { r.categoria = newCat; count++; } });
  persistLedger();
  toast(`${count} movimiento(s) movido(s) a "${newCat}"`);
  render();
}
function eliminarConcepto(categoria, concepto) {
  const n = state.ledger.filter((r) => r.categoria === categoria && r.concepto === concepto).length;
  if (!confirm(`¿Eliminar los ${n} movimiento(s) de "${concepto}" (${categoria})? Esta acción no se puede deshacer.`)) return;
  deleteTransactionsMatching((r) => r.categoria === categoria && r.concepto === concepto);
  toast('Movimientos eliminados');
  render();
}

/* ---- Copiar movimientos de un mes a otro ---- */
function updateCopyPreview() {
  const tipo = document.getElementById('cpTipo').value;
  const mo = +document.getElementById('cpMesOrigen').value;
  const ao = +document.getElementById('cpAnioOrigen').value;
  const f = { year: ao, monthIdx: mo };
  if (tipo) f.tipo = tipo;
  document.getElementById('cpPreviewCount').textContent = `${filterRows(f).length} movimiento(s) en el mes de origen`;
}
function copyMonthConcepts() {
  const tipo = document.getElementById('cpTipo').value;
  const mo = +document.getElementById('cpMesOrigen').value;
  const ao = +document.getElementById('cpAnioOrigen').value;
  const md = +document.getElementById('cpMesDestino').value;
  const ad = parseInt(document.getElementById('cpAnioDestino').value, 10);
  const comoPresupuesto = document.getElementById('cpComoPresupuesto').checked;

  if (!ad || ad < 2000 || ad > 2100) { toast('Escribe un año destino válido'); return; }
  if (mo === md && ao === ad) { toast('El mes origen y destino deben ser diferentes'); return; }

  const f = { year: ao, monthIdx: mo };
  if (tipo) f.tipo = tipo;
  const sourceRows = filterRows(f);
  if (!sourceRows.length) { toast('No hay movimientos en el mes de origen seleccionado'); return; }

  const destCount = filterRows({ year: ad, monthIdx: md }).length;
  if (destCount > 0 && !confirm(`El mes destino (${CONFIG.months[md]} ${ad}) ya tiene ${destCount} movimiento(s). ¿Agregar ${sourceRows.length} más de todas formas?`)) return;

  const destDays = daysInMonth(ad, md);
  const newRows = sourceRows.map((r) => {
    const day = Math.min(r.date.getDate(), destDays);
    const fecha = `${ad}-${String(md + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { f: fecha, t: r.tipo, c: r.categoria, n: r.concepto, p: r.presupuesto, m: comoPresupuesto ? null : r.monto, mp: r.metodoPago, ded: r.deducible ? 1 : 0, id: nextId() };
  });
  newRows.forEach((r, i) => state.ledger.push(normalize(r, state.ledger.length + i)));
  persistLedger();
  toast(`${newRows.length} movimiento(s) copiado(s) a ${CONFIG.months[md]} ${ad}`);
  render();
}
let copyControlsInit = false;
function initCopyControls() {
  if (copyControlsInit) return;
  copyControlsInit = true;
  const yearOptions = allYears().map((y) => `<option value="${y}">${y}</option>`).join('');
  const monthOptions = CONFIG.months.map((m, i) => `<option value="${i}">${m[0].toUpperCase() + m.slice(1)}</option>`).join('');
  document.getElementById('cpMesOrigen').innerHTML = monthOptions;
  document.getElementById('cpMesDestino').innerHTML = monthOptions;
  document.getElementById('cpAnioOrigen').innerHTML = yearOptions;

  const { year, monthIdx } = targetYearMonth();
  document.getElementById('cpAnioOrigen').value = year;
  document.getElementById('cpMesOrigen').value = monthIdx;
  let nm = monthIdx + 1, ny = year;
  if (nm > 11) { nm = 0; ny++; }
  document.getElementById('cpMesDestino').value = nm;
  document.getElementById('cpAnioDestino').value = ny;

  ['cpTipo', 'cpMesOrigen', 'cpAnioOrigen'].forEach((id) => document.getElementById(id).addEventListener('change', updateCopyPreview));
  document.getElementById('btnCopiarMes').addEventListener('click', copyMonthConcepts);
  document.getElementById('cfgConceptBuscar').addEventListener('input', render);
}

/* ---- Borrar meses futuros ---- */
let delControlsInit = false;
function updateDelPreview() {
  const tipo = document.getElementById('delTipo').value;
  const sel = document.getElementById('delMes');
  if (!sel.value) { document.getElementById('delPreviewCount').textContent = ''; return; }
  const [y, m] = sel.value.split('-').map(Number);
  const f = { year: y, monthIdx: m };
  if (tipo) f.tipo = tipo;
  const nMes = filterRows(f).length;
  const nDesde = state.ledger.filter((r) => (r.year > y || (r.year === y && r.monthIdx >= m)) && (!tipo || r.tipo === tipo)).length;
  document.getElementById('delPreviewCount').textContent = `${nMes} en el mes · ${nDesde} desde ese mes en adelante`;
}
function initDelControls() {
  if (delControlsInit) return;
  delControlsInit = true;
  document.getElementById('delTipo').addEventListener('change', updateDelPreview);
  document.getElementById('delMes').addEventListener('change', updateDelPreview);
  document.getElementById('btnDelMes').addEventListener('click', () => bulkDeleteFuture(false));
  document.getElementById('btnDelDesde').addEventListener('click', () => bulkDeleteFuture(true));
}
function refreshDelControls() {
  const opts = futureMonthOptions();
  const sel = document.getElementById('delMes');
  const selY = document.getElementById('delAnio');
  if (!opts.length) {
    sel.innerHTML = '<option value="">Sin meses futuros</option>';
    selY.innerHTML = '';
    selY.style.display = 'none';
    document.getElementById('delPreviewCount').textContent = '';
    return;
  }
  selY.style.display = 'none';
  sel.innerHTML = opts.map((o) => `<option value="${o.year}-${o.monthIdx}">${CONFIG.months[o.monthIdx][0].toUpperCase() + CONFIG.months[o.monthIdx].slice(1)} ${o.year}</option>`).join('');
  updateDelPreview();
}
function bulkDeleteFuture(fromOnward) {
  const sel = document.getElementById('delMes');
  if (!sel.value) { toast('No hay meses futuros con movimientos'); return; }
  const [y, m] = sel.value.split('-').map(Number);
  const tipo = document.getElementById('delTipo').value;
  const now = new Date();
  if (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) { toast('Solo se pueden borrar meses futuros'); return; }
  const match = (r) => (fromOnward
    ? (r.year > y || (r.year === y && r.monthIdx >= m)) && (!tipo || r.tipo === tipo)
    : (r.year === y && r.monthIdx === m && (!tipo || r.tipo === tipo)));
  const n = state.ledger.filter(match).length;
  if (!n) { toast('No hay movimientos que borrar con esos filtros'); return; }
  const label = fromOnward ? `desde ${CONFIG.months[m]} ${y} en adelante` : `de ${CONFIG.months[m]} ${y}`;
  if (!confirm(`¿Borrar ${n} movimiento(s) ${label}? Esta acción no se puede deshacer (puedes exportar una copia antes desde Sincronización).`)) return;
  deleteTransactionsMatching(match);
  refreshDelControls();
  render();
  toast(`${n} movimiento(s) eliminado(s)`);
}

/* ---- Renombrado masivo ---- */
let brControlsInit = false;
function brFilters() {
  const a = document.getElementById('brAnio').value;
  const m = document.getElementById('brMes').value;
  const c = document.getElementById('brCategoria').value;
  const n = document.getElementById('brConcepto').value;
  return (r) => (!a || r.year === +a) && (m === '' || r.monthIdx === +m) && (!c || r.categoria === c) && (!n || r.concepto === n);
}
function brRefreshConceptos() {
  const c = document.getElementById('brCategoria').value;
  const src = c ? state.ledger.filter((r) => r.categoria === c) : state.ledger;
  const conceptos = [...new Set(src.map((r) => r.concepto))].sort();
  const sel = document.getElementById('brConcepto');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todos los conceptos</option>' + conceptos.map((x) => `<option value="${x.replace(/"/g, '&quot;')}">${x}</option>`).join('');
  if (conceptos.includes(cur)) sel.value = cur;
  brUpdatePreview();
}
function brUpdatePreview() {
  const n = state.ledger.filter(brFilters()).length;
  document.getElementById('brPreviewCount').textContent = `${n} movimiento(s) coinciden con los filtros`;
}
function brRefreshOptions() {
  const selA = document.getElementById('brAnio');
  const curA = selA.value;
  selA.innerHTML = '<option value="">Todos los años</option>' + allYears().map((y) => `<option value="${y}">${y}</option>`).join('');
  selA.value = curA;
  const selM = document.getElementById('brMes');
  if (selM.options.length <= 1) {
    selM.innerHTML = '<option value="">Todos los meses</option>' + CONFIG.months.map((m, i) => `<option value="${i}">${m[0].toUpperCase() + m.slice(1)}</option>`).join('');
  }
  const selC = document.getElementById('brCategoria');
  const curC = selC.value;
  const cats = [...new Set(state.ledger.map((r) => r.categoria))].sort();
  selC.innerHTML = '<option value="">Todas las categorías</option>' + cats.map((c) => `<option value="${c}">${c}</option>`).join('');
  if (cats.includes(curC)) selC.value = curC;
  brRefreshConceptos();
}
function initBulkRenameControls() {
  if (brControlsInit) { brRefreshOptions(); return; }
  brControlsInit = true;
  brRefreshOptions();
  ['brAnio', 'brMes'].forEach((id) => document.getElementById(id).addEventListener('change', brUpdatePreview));
  document.getElementById('brCategoria').addEventListener('change', brRefreshConceptos);
  document.getElementById('brConcepto').addEventListener('change', brUpdatePreview);
  document.getElementById('btnBulkRename').addEventListener('click', applyBulkRename);
}
function applyBulkRename() {
  const nuevaCat = document.getElementById('brNuevaCategoria').value.trim();
  const nuevoCon = document.getElementById('brNuevoConcepto').value.trim();
  if (!nuevaCat && !nuevoCon) { toast('Escribe la nueva categoría, el nuevo concepto, o ambos'); return; }
  const match = brFilters();
  const rows = state.ledger.filter(match);
  if (!rows.length) { toast('Ningún movimiento coincide con los filtros'); return; }
  const cambios = [nuevaCat ? `categoría → "${nuevaCat}"` : null, nuevoCon ? `concepto → "${nuevoCon}"` : null].filter(Boolean).join(' y ');
  if (!confirm(`Se actualizarán ${rows.length} movimiento(s): ${cambios}. ¿Continuar?`)) return;
  rows.forEach((r) => {
    if (nuevaCat) r.categoria = nuevaCat;
    if (nuevoCon) r.concepto = nuevoCon;
  });
  persistLedger();
  document.getElementById('brNuevaCategoria').value = '';
  document.getElementById('brNuevoConcepto').value = '';
  brRefreshOptions();
  render();
  toast(`${rows.length} movimiento(s) actualizado(s)`);
}

/* ---- Sync / cloud / backup / PIN buttons (all live in this view) ---- */
let syncButtonsWired = false;
function wireSyncButtons() {
  if (syncButtonsWired) return;
  syncButtonsWired = true;
  document.getElementById('btnSyncConnect')?.addEventListener('click', sync.pickOrCreateSyncFile);
  document.getElementById('btnSyncReconnect')?.addEventListener('click', sync.reconnectSyncFile);
  document.getElementById('btnSyncNow')?.addEventListener('click', () => sync.pullFromFile(false));
  document.getElementById('btnSyncDisconnect')?.addEventListener('click', () => {
    if (confirm('¿Desconectar el archivo? Tus datos seguirán guardados en este navegador, pero dejarán de escribirse ahí.')) sync.disconnectSyncFile();
  });
  document.getElementById('btnExportJSON')?.addEventListener('click', sync.exportDataJSON);
  document.getElementById('btnImportJSON')?.addEventListener('click', () => document.getElementById('inputImportJSON').click());
  document.getElementById('inputImportJSON')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      sync.importDataJSON(file).then(() => toast('Datos importados correctamente')).catch((err) => toast(err.message));
    }
    e.target.value = '';
  });
  document.getElementById('btnRestoreBackup')?.addEventListener('click', () => {
    const info = sync.getAutoBackup();
    if (!info) { toast('Todavía no hay un respaldo automático'); return; }
    if (!confirm(`¿Restaurar el respaldo del ${new Date(info.at).toLocaleString('es-MX')} (${info.data.ledger.length} movimientos)? Reemplazará tus datos actuales.`)) return;
    sync.restoreAutoBackup();
    toast('Respaldo restaurado');
  });
  document.getElementById('btnCloudCreate')?.addEventListener('click', async () => {
    const id = await sync.cloudCreate();
    if (id) prompt('¡Nube creada! Este es tu código de sincronización — guárdalo y escríbelo en tu otro dispositivo (Configuración → Conectar con un código):', id);
  });
  document.getElementById('btnCloudJoin')?.addEventListener('click', () => {
    const code = prompt('Escribe el código de sincronización que generaste en tu otro dispositivo:');
    if (code) sync.cloudJoin(code);
  });
  document.getElementById('btnCloudPull')?.addEventListener('click', () => sync.cloudPull(false));
  document.getElementById('btnCloudPush')?.addEventListener('click', sync.cloudPush);
  document.getElementById('btnCloudDisconnect')?.addEventListener('click', () => {
    if (confirm('¿Desconectar la nube? Tus datos locales no se borran; solo dejarán de subirse ahí.')) sync.cloudDisconnect();
  });
}

/* ---- Catálogo table + stats + add-category + reset ---- */
let wired = false;
function wireOnce() {
  if (wired) return;
  wired = true;
  wireSyncButtons();
  document.getElementById('btnAddCat').addEventListener('click', () => {
    const name = document.getElementById('cfgAddCatName').value.trim();
    const tipo = document.getElementById('cfgAddCatTipo').value;
    if (!name) { toast('Escribe un nombre de categoría'); return; }
    const custom = toRaw(state.customCats);
    const key = tipo === 'E' ? 'egreso' : 'ingreso';
    const order = tipo === 'E' ? CAT_EGRESO_ORDER : CAT_INGRESO_ORDER;
    const exists = order.includes(name) || custom[key].includes(name) || state.ledger.some((r) => r.tipo === tipo && r.categoria === name);
    if (exists) { toast('Esa categoría ya existe'); return; }
    custom[key].push(name);
    saveCustomCats(custom);
    document.getElementById('cfgAddCatName').value = '';
    toast('Categoría agregada');
    render();
  });
  document.getElementById('btnCfgReset').addEventListener('click', () => {
    if (confirm('Esto restaurará el libro contable a los datos originales del archivo Excel y se perderán los cambios locales. ¿Continuar?')) {
      resetLedgerToSeed();
      renderView(activeViewName());
      toast('Datos restaurados');
    }
  });
}

export function render() {
  wireOnce();
  initCopyControls();
  updateCopyPreview();
  renderSyncStatusPanel();
  renderCloudStatusPanel();
  initDelControls();
  refreshDelControls();
  renderNavOrderUI();
  initBulkRenameControls();
  renderPinStatusPanel();
  renderBackupStatusPanel();

  const totalMov = state.ledger.length;
  const allCatsCount = catList('E').length + catList('I').length;
  const concepts = new Set(state.ledger.map((r) => r.categoria + '||' + r.concepto));
  let storageKB = 0;
  try { storageKB = new Blob([localStorage.getItem(CONFIG.storage.keys.ledger) || '']).size / 1024; } catch { /* ignore */ }

  document.getElementById('cfgStatsCards').innerHTML = `
    <div class="card"><div class="label">Movimientos totales</div><div class="value">${totalMov}</div></div>
    <div class="card"><div class="label">Categorías</div><div class="value">${allCatsCount}</div></div>
    <div class="card"><div class="label">Conceptos distintos</div><div class="value">${concepts.size}</div></div>
    <div class="card"><div class="label">Datos guardados localmente</div><div class="value">${storageKB.toFixed(0)} KB</div></div>
  `;

  const rows = [
    ...catList('E').map((c) => ({ categoria: c, tipo: 'Egreso', tcode: 'E' })),
    ...catList('I').map((c) => ({ categoria: c, tipo: 'Ingreso', tcode: 'I' })),
  ];
  let th = '<thead><tr><th>Categoría</th><th>Tipo</th><th class="num-cell">Movimientos</th><th class="num-cell">Total histórico</th><th>Acciones</th></tr></thead><tbody>';
  rows.forEach((r) => {
    const matching = state.ledger.filter((x) => x.categoria === r.categoria && x.tipo === r.tcode);
    const total = realSum(matching);
    th += `<tr>
      <td><span class="cat-cell"><span class="dot" style="background:${catColor(r.categoria)}"></span>${r.categoria}</span></td>
      <td>${r.tipo}</td>
      <td class="num-cell">${matching.length}</td>
      <td class="num-cell">${fmtMoney(total)}</td>
      <td><button class="icon-btn" data-rename-cat="${r.categoria}" title="Renombrar / combinar" aria-label="Renombrar categoría ${r.categoria}">✎</button>
        ${matching.length === 0 ? `<button class="icon-btn" data-del-cat="${r.categoria}" title="Eliminar categoría vacía" aria-label="Eliminar categoría ${r.categoria}">✕</button>` : ''}
      </td>
    </tr>`;
  });
  document.getElementById('tblCatalogoCategorias').innerHTML = th + '</tbody>';

  const buscar = (document.getElementById('cfgConceptBuscar').value || '').toLowerCase();
  const groups = {};
  state.ledger.forEach((r) => { const key = r.categoria + '||' + r.concepto; (groups[key] = groups[key] || []).push(r); });
  let th2 = '<thead><tr><th>Categoría</th><th>Concepto</th><th class="num-cell">Movimientos</th><th class="num-cell">Total histórico</th><th>Última fecha</th><th>Acciones</th></tr></thead><tbody>';
  const entries = Object.entries(groups)
    .filter(([key]) => !buscar || key.toLowerCase().includes(buscar))
    .sort((a, b) => b[1].length - a[1].length);
  entries.forEach(([key, matching]) => {
    const [categoria, concepto] = key.split('||');
    const total = realSum(matching);
    const last = matching.slice().sort((a, b) => b.date - a.date)[0];
    th2 += `<tr>
      <td>${categoria}</td><td>${concepto}</td>
      <td class="num-cell">${matching.length}</td>
      <td class="num-cell">${fmtMoney(total)}</td>
      <td class="mono">${fmtDate(last.date)}</td>
      <td>
        <button class="icon-btn" data-rename-con="${key}" title="Renombrar concepto" aria-label="Renombrar concepto ${concepto}">✎</button>
        <button class="icon-btn" data-move-con="${key}" title="Mover de categoría" aria-label="Mover concepto ${concepto} de categoría">⇄</button>
        <button class="icon-btn" data-del-con="${key}" title="Eliminar movimientos" aria-label="Eliminar movimientos de ${concepto}">✕</button>
      </td>
    </tr>`;
  });
  if (!entries.length) th2 += '<tr><td colspan="6" class="empty">Sin resultados</td></tr>';
  document.getElementById('tblCatalogoConceptos').innerHTML = th2 + '</tbody>';

  document.querySelectorAll('[data-rename-cat]').forEach((b) => b.addEventListener('click', () => renameCategoria(b.dataset.renameCat)));
  document.querySelectorAll('[data-del-cat]').forEach((b) => b.addEventListener('click', () => deleteCategoriaEmpty(b.dataset.delCat)));
  document.querySelectorAll('[data-rename-con]').forEach((b) => b.addEventListener('click', () => { const [c, n] = b.dataset.renameCon.split('||'); renameConcepto(c, n); }));
  document.querySelectorAll('[data-move-con]').forEach((b) => b.addEventListener('click', () => { const [c, n] = b.dataset.moveCon.split('||'); moverConcepto(c, n); }));
  document.querySelectorAll('[data-del-con]').forEach((b) => b.addEventListener('click', () => { const [c, n] = b.dataset.delCon.split('||'); eliminarConcepto(c, n); }));
}
