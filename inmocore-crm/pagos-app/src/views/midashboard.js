import { CONFIG } from '../modules/config.js';
import { state } from '../modules/state.js';
import { allYears, targetYearMonth, buildSeries, cbGroupOptionsFor, cbAutoTitle, CB_METRIC_TIPO } from '../modules/calculations.js';
import { drawChart, styleChartGeneric } from '../modules/charts.js';
import { saveDashWidgets } from '../modules/data.js';
import { toast } from '../modules/ui.js';

let cbInit = false;
let cbEditingId = null;

function cbCollectCfg() {
  return {
    metric: document.getElementById('cbMetric').value,
    groupBy: document.getElementById('cbGroupBy').value,
    chartType: document.getElementById('cbTipoGrafico').value,
    year: document.getElementById('cbAnio').value ? +document.getElementById('cbAnio').value : null,
    monthIdx: document.getElementById('cbMes').value === '' ? null : +document.getElementById('cbMes').value,
    categoria: document.getElementById('cbCategoria').value || null,
    titulo: document.getElementById('cbTitulo').value.trim(),
  };
}

function cbUpdateControls() {
  const metric = document.getElementById('cbMetric').value;
  const gb = document.getElementById('cbGroupBy');
  const allowed = cbGroupOptionsFor(metric);
  const cur = gb.value;
  gb.innerHTML = allowed.map((g) => `<option value="${g}">${{ mes: 'Por mes (de un año)', anio: 'Por año', categoria: 'Por categoría', concepto: 'Por concepto (top 10)', dia: 'Por día (de un mes)' }[g]}</option>`).join('');
  gb.value = allowed.includes(cur) ? cur : allowed[0];
  const groupBy = gb.value;
  const selY = document.getElementById('cbAnio');
  selY.style.display = groupBy === 'anio' ? 'none' : '';
  const selM = document.getElementById('cbMes');
  selM.style.display = (groupBy === 'dia' || groupBy === 'categoria' || groupBy === 'concepto') ? '' : 'none';
  const selC = document.getElementById('cbCategoria');
  selC.style.display = (metric === 'saldo' || groupBy === 'categoria') ? 'none' : '';
  const tipo = CB_METRIC_TIPO[metric];
  if (tipo) {
    const cur2 = selC.value;
    const cats = [...new Set(state.ledger.filter((r) => r.tipo === tipo).map((r) => r.categoria))].sort();
    selC.innerHTML = '<option value="">Todas las categorías</option>' + cats.map((x) => `<option value="${x}">${x}</option>`).join('');
    if (cats.includes(cur2)) selC.value = cur2;
  }
}

function renderBuilderPreview() {
  const cfg = cbCollectCfg();
  const built = buildSeries(cfg);
  const { type, data, extra } = styleChartGeneric(cfg.chartType, built);
  drawChart('cbPreview', type, data, extra);
}

function cbExitEdit() {
  cbEditingId = null;
  document.getElementById('cbTitle').textContent = 'Generador de Gráficas';
  document.getElementById('btnCbAdd').textContent = '＋ Agregar al dashboard';
  document.getElementById('btnCbCancelEdit').style.display = 'none';
  document.getElementById('cbTitulo').value = '';
}

function cbLoadForEdit(w) {
  cbEditingId = w.id;
  document.getElementById('cbMetric').value = w.metric;
  cbUpdateControls();
  document.getElementById('cbGroupBy').value = w.groupBy;
  cbUpdateControls();
  document.getElementById('cbTipoGrafico').value = w.chartType;
  if (w.year) document.getElementById('cbAnio').value = w.year;
  document.getElementById('cbMes').value = (w.monthIdx === null || w.monthIdx === undefined) ? '' : w.monthIdx;
  document.getElementById('cbCategoria').value = w.categoria || '';
  document.getElementById('cbTitulo').value = w.titulo || '';
  document.getElementById('cbTitle').textContent = 'Editando: ' + (w.titulo || 'gráfica');
  document.getElementById('btnCbAdd').textContent = 'Guardar cambios';
  document.getElementById('btnCbCancelEdit').style.display = 'inline-flex';
  renderBuilderPreview();
  window.scrollTo(0, 0);
}

function initCustomBuilder() {
  if (cbInit) return;
  cbInit = true;
  const t = targetYearMonth();
  const selY = document.getElementById('cbAnio');
  selY.innerHTML = allYears().map((y) => `<option value="${y}" ${y === t.year ? 'selected' : ''}>${y}</option>`).join('');
  const selM = document.getElementById('cbMes');
  selM.innerHTML = '<option value="">Todos los meses</option>' + CONFIG.months.map((m, i) => `<option value="${i}">${m[0].toUpperCase() + m.slice(1)}</option>`).join('');
  cbUpdateControls();
  ['cbMetric', 'cbGroupBy', 'cbTipoGrafico', 'cbAnio', 'cbMes', 'cbCategoria'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => {
      if (id === 'cbMetric' || id === 'cbGroupBy') cbUpdateControls();
      renderBuilderPreview();
    });
  });
  document.getElementById('btnCbAdd').addEventListener('click', () => {
    const cfg = cbCollectCfg();
    if (!cfg.titulo) cfg.titulo = cbAutoTitle(cfg);
    const widgets = state.dashWidgets;
    if (cbEditingId) {
      Object.assign(widgets.find((x) => x.id === cbEditingId), cfg);
      cbExitEdit();
      toast('Gráfica actualizada');
    } else {
      widgets.push({ id: 'w' + Date.now(), size: 'half', ...cfg });
      toast('Gráfica agregada a tu dashboard');
    }
    saveDashWidgets(widgets);
    document.getElementById('cbTitulo').value = '';
    renderDashWidgets();
  });
  document.getElementById('btnCbCancelEdit').addEventListener('click', cbExitEdit);
}

function renderDashWidgets() {
  const grid = document.getElementById('customDashGrid');
  const widgets = state.dashWidgets;
  if (!widgets.length) {
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1;">Aún no tienes gráficas. Crea la primera con el generador de arriba.</div>';
    return;
  }
  grid.innerHTML = widgets.map((w, i) => `
    <div class="panel" style="margin-bottom:0;${w.size === 'full' ? 'grid-column:1/-1;' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;">
        <h3 style="font-size:.92rem;margin:0;">${w.titulo}</h3>
        <div style="display:flex;gap:4px;flex:none;">
          <button class="icon-btn" data-w-up="${i}" title="Subir" aria-label="Subir ${w.titulo}" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>↑</button>
          <button class="icon-btn" data-w-down="${i}" title="Bajar" aria-label="Bajar ${w.titulo}" ${i === widgets.length - 1 ? 'disabled style="opacity:.3"' : ''}>↓</button>
          <button class="icon-btn" data-w-size="${w.id}" title="${w.size === 'full' ? 'Media pantalla' : 'Ancho completo'}" aria-label="Cambiar ancho de ${w.titulo}">⤢</button>
          <button class="icon-btn" data-w-edit="${w.id}" title="Editar" aria-label="Editar ${w.titulo}">✎</button>
          <button class="icon-btn" data-w-dup="${w.id}" title="Duplicar" aria-label="Duplicar ${w.titulo}">⧉</button>
          <button class="icon-btn" data-w-del="${w.id}" title="Eliminar" aria-label="Eliminar ${w.titulo}">✕</button>
        </div>
      </div>
      <div class="chart-box"><canvas id="cw_${w.id}"></canvas></div>
    </div>`).join('');
  widgets.forEach((w) => {
    const built = buildSeries(w);
    const { type, data, extra } = styleChartGeneric(w.chartType, built);
    drawChart('cw_' + w.id, type, data, extra);
  });
  grid.querySelectorAll('[data-w-up]').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.wUp; const ws = state.dashWidgets;
    [ws[i - 1], ws[i]] = [ws[i], ws[i - 1]]; saveDashWidgets(ws); renderDashWidgets();
  }));
  grid.querySelectorAll('[data-w-down]').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.wDown; const ws = state.dashWidgets;
    [ws[i + 1], ws[i]] = [ws[i], ws[i + 1]]; saveDashWidgets(ws); renderDashWidgets();
  }));
  grid.querySelectorAll('[data-w-size]').forEach((b) => b.addEventListener('click', () => {
    const ws = state.dashWidgets; const w = ws.find((x) => x.id === b.dataset.wSize);
    w.size = w.size === 'full' ? 'half' : 'full'; saveDashWidgets(ws); renderDashWidgets();
  }));
  grid.querySelectorAll('[data-w-edit]').forEach((b) => b.addEventListener('click', () => {
    cbLoadForEdit(state.dashWidgets.find((x) => x.id === b.dataset.wEdit));
  }));
  grid.querySelectorAll('[data-w-dup]').forEach((b) => b.addEventListener('click', () => {
    const ws = state.dashWidgets; const w = ws.find((x) => x.id === b.dataset.wDup);
    ws.push({ ...w, id: 'w' + Date.now(), titulo: w.titulo + ' (copia)' });
    saveDashWidgets(ws); renderDashWidgets(); toast('Gráfica duplicada');
  }));
  grid.querySelectorAll('[data-w-del]').forEach((b) => b.addEventListener('click', () => {
    if (confirm('¿Eliminar esta gráfica de tu dashboard?')) {
      saveDashWidgets(state.dashWidgets.filter((w) => w.id !== b.dataset.wDel));
      renderDashWidgets(); toast('Gráfica eliminada');
    }
  }));
}

export function render() {
  initCustomBuilder();
  renderBuilderPreview();
  renderDashWidgets();
}
