import './styles/main.css';
import { loadAllData } from './modules/data.js';
import {
  applyTheme, applyNavOrder, initThemeControls, initAppHeader, initPinLock,
  initModalAccessibility, switchToView, renderView,
} from './modules/ui.js';
import { initSync, initCloud, initAutoSave } from './modules/sync.js';

document.querySelectorAll('.rail-btn').forEach((b, i) => {
  b.dataset.orig = i;
  const num = b.querySelector('.num');
  if (num) num.textContent = String(i + 1).padStart(2, '0');
});

applyTheme();
loadAllData();
applyNavOrder();
initModalAccessibility();
renderView('inicio');
initSync();
initCloud();
initPinLock();
initAutoSave();
initThemeControls();
initAppHeader();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-pagos.js').catch(() => {});
  });
}

// Expose the router for debugging / deep-linking from a console.
window.__pagosSwitchToView = switchToView;
