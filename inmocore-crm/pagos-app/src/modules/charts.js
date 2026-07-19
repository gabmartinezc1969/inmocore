// Chart.js wrapper: a single drawChart() entry point used by every view so
// theming, empty-state handling and the "container not laid out yet" retry
// only exist in one place.
import Chart from 'chart.js/auto';
import { fmtMoney } from './format.js';

export const charts = {};

export function chartHasData(data) {
  if (!data || !Array.isArray(data.datasets)) return false;
  return data.datasets.some((ds) => {
    const vals = ds.data || [];
    return vals.some((v) => {
      if (v === null || v === undefined) return false;
      if (Array.isArray(v)) return v.some((x) => x !== 0 && x !== null);
      if (typeof v === 'object') return (v.x || 0) !== 0 || (v.y || 0) !== 0;
      return v !== 0;
    });
  });
}

export function chartTheme() {
  const light = document.body.dataset.theme === 'light';
  return {
    grid: light ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.06)',
    ticks: light ? '#5B6E64' : '#8CA096',
    legend: light ? '#3A4A42' : '#B7C6BD',
    border: light ? '#FFFFFF' : '#131B18',
  };
}

/** Draws (or replaces) the Chart.js instance for `canvasId`. Shows an empty-state message instead of an empty chart when `data` has no non-zero values. */
export function drawChart(canvasId, type, data, extraOptions, _isRetry) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const box = canvas.parentElement;
  let emptyEl = box.querySelector('.chart-empty-msg');
  if (charts[canvasId]) { charts[canvasId].destroy(); delete charts[canvasId]; }

  if (!chartHasData(data)) {
    canvas.style.display = 'none';
    if (!emptyEl) {
      emptyEl = document.createElement('div');
      emptyEl.className = 'chart-empty-msg empty';
      emptyEl.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;';
      emptyEl.textContent = 'Sin datos para mostrar en este periodo';
      box.appendChild(emptyEl);
    }
    emptyEl.style.display = 'flex';
    return;
  }
  canvas.style.display = '';
  if (emptyEl) emptyEl.style.display = 'none';

  // If the container hasn't been laid out yet (e.g. tab just became visible), retry once
  // on the next frame; if it still reports zero, draw anyway — Chart.js (responsive) will
  // size itself as soon as the element becomes visible.
  if ((box.clientWidth === 0 || box.clientHeight === 0) && !_isRetry) {
    requestAnimationFrame(() => { if (!charts[canvasId]) drawChart(canvasId, type, data, extraOptions, true); });
    return;
  }

  const ctx = canvas.getContext('2d');
  const th = chartTheme();
  const baseOptions = {
    responsive: true, maintainAspectRatio: false, color: th.ticks,
    plugins: { legend: { labels: { font: { family: 'Manrope', size: 11 }, color: th.legend } } },
    scales: type === 'doughnut' ? {} : {
      x: { grid: { color: th.grid }, ticks: { font: { size: 10 }, color: th.ticks } },
      y: { grid: { color: th.grid }, ticks: { font: { size: 10 }, color: th.ticks } },
    },
  };
  charts[canvasId] = new Chart(ctx, { type, data, options: Object.assign(baseOptions, extraOptions || {}) });
}

export function destroyChart(canvasId) {
  if (charts[canvasId]) { charts[canvasId].destroy(); delete charts[canvasId]; }
}

/**
 * Generic chart styler shared by the custom dashboard builder and its saved
 * widgets: turns a {labels, datasets} series (see calculations.js#buildSeries)
 * plus a chart-type choice into a ready-to-draw Chart.js {type, data, extra}.
 */
export function styleChartGeneric(choice, built) {
  const circular = ['doughnut', 'pie', 'polarArea', 'radar'].includes(choice);
  let type = choice; const extra = {};
  const multi = built.datasets.length > 1;
  const primary = '#F0655A', secondary = '#8CA096';
  const palette = ['#2DD4A7', '#E8B34B', '#5BA8D4', '#F0655A', '#9B8CFF', '#A9C177', '#F2C14E', '#7E97A1', '#C98F6B', '#7FB8A2', '#D4794C', '#93A87C', '#9FB3A7', '#C27E8D'];
  const data = {
    labels: built.labels,
    datasets: built.datasets.map((ds, i) => {
      const solid = multi ? (i === 0 ? secondary : primary) : primary;
      const perLabel = built.labels.map((l, li) => palette[li % palette.length]);
      return {
        label: ds.label,
        data: ds.data,
        backgroundColor: circular ? perLabel : (choice === 'line' ? 'transparent' : (choice === 'area' ? solid + '40' : (multi ? solid : perLabel))),
        borderColor: (choice === 'line' || choice === 'area' || choice === 'radar') ? solid : (circular ? chartTheme().border : undefined),
        borderWidth: (choice === 'line' || choice === 'area' || choice === 'radar') ? 2 : (circular ? 2 : 0),
        borderRadius: (choice === 'bar' || choice === 'barh') ? 5 : 0,
        fill: choice === 'area' || choice === 'radar',
        tension: (choice === 'line' || choice === 'area') ? 0.3 : 0,
        pointRadius: (choice === 'line' || choice === 'area') ? 2 : undefined,
      };
    }),
  };
  if (choice === 'barh') { type = 'bar'; extra.indexAxis = 'y'; }
  if (choice === 'area' || choice === 'line') { type = 'line'; }
  if (choice === 'pie') { extra.scales = {}; }
  if (choice === 'radar') {
    extra.scales = { r: { grid: { color: chartTheme().grid }, angleLines: { color: chartTheme().grid }, ticks: { color: chartTheme().ticks, backdropColor: 'transparent', font: { size: 9 } }, pointLabels: { color: chartTheme().legend, font: { size: 10 } } } };
    data.datasets.forEach((ds) => { ds.backgroundColor = (typeof ds.borderColor === 'string' ? ds.borderColor : primary) + '33'; });
  }
  if (choice === 'polarArea') {
    extra.scales = { r: { grid: { color: chartTheme().grid }, ticks: { color: chartTheme().ticks, backdropColor: 'transparent', font: { size: 9 } } } };
  }
  extra.plugins = {
    legend: { display: multi || (circular && choice !== 'radar'), position: circular ? 'right' : 'top', labels: { boxWidth: 10, font: { size: 10 }, color: chartTheme().legend } },
    tooltip: { callbacks: { label: (ctx) => ' ' + (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + fmtMoney(circular ? ctx.parsed : (choice === 'barh' ? ctx.parsed.x : ctx.parsed.y)) } },
  };
  return { type, data, extra };
}
