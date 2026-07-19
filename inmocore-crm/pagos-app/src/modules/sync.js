// Sync & backup: local IndexedDB-remembered File System Access handle
// (for OneDrive-folder sync), an anonymous jsonblob.com cloud code, a PIN
// lock, and a 5-minute local autosave snapshot.
//
// Design note: every data.js save*() call mutates `state`, and this module
// subscribes to `onStateChange` once (see initSync/initAutoSave) instead of
// each save function individually calling a `touch()` — that's what makes
// the reactive store in state.js pull its weight here.
import { CONFIG } from './config.js';
import { state, onStateChange } from './state.js';
import { loadLedger, collectAppData, applyAppData } from './data.js';

const K = CONFIG.storage.keys;
const CLOUD_API = CONFIG.cloud.api;

let fileHandle = null;
let syncTimer = null;
let cloudTimer = null;
let onDirty = () => {}; // set by initSync/UI wiring: called after every touch()

export let syncStatus = { connected: false, filename: null, lastSync: null, needsPermission: false, supported: !!(typeof window !== 'undefined' && window.showSaveFilePicker) };
export let cloudState = { lastPush: null, lastError: null };

/** Call once from ui.js so sync.js can ask for a header/status re-render after a change, without importing ui.js. */
export function onSyncDirty(fn) { onDirty = fn; }

function touch() {
  localStorage.setItem(K.lastModified, new Date().toISOString());
  queueFileSync();
  queueCloudSync();
  onDirty();
}

/* ---- tiny IndexedDB wrapper, just to remember the picked file handle across sessions ---- */
function idbOpen() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no-indexeddb')); return; }
    const req = indexedDB.open('pagos2026_sync_db', 1);
    req.onupgradeneeded = () => { req.result.createObjectStore('handles'); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve) => {
      const tx = db.transaction('handles', 'readonly');
      const req = tx.objectStore('handles').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}
async function idbSet(key, val) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(val, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}
async function idbDel(key) {
  try {
    const db = await idbOpen();
    return await new Promise((resolve) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch { return false; }
}

/* ============ File sync (OneDrive-folder-friendly, via File System Access API) ============ */
function queueFileSync() {
  if (!fileHandle) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(writeSyncFile, 800);
}
export async function writeSyncFile() {
  if (!fileHandle) return;
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(collectAppData(), null, 2));
    await writable.close();
    syncStatus.connected = true; syncStatus.needsPermission = false; syncStatus.lastSync = new Date();
  } catch {
    syncStatus.connected = false;
    onDirty('El archivo conectado no se pudo escribir. Vuelve a conectarlo en Configuración.');
  }
  onDirty();
}
async function readSyncFile() {
  if (!fileHandle) return null;
  try {
    const file = await fileHandle.getFile();
    const text = await file.text();
    return text.trim() ? JSON.parse(text) : null;
  } catch { return null; }
}
export async function pullFromFile(silent) {
  const data = await readSyncFile();
  if (!data) { if (!silent) onDirty('El archivo está vacío o no se pudo leer'); return; }
  const localModified = localStorage.getItem(K.lastModified);
  if (localModified && data.lastModified && new Date(data.lastModified) <= new Date(localModified)) {
    if (!silent) onDirty('Tus datos locales ya están al día');
    return;
  }
  applyAppData(data);
  loadLedger();
  if (!silent) onDirty('Datos actualizados desde el archivo conectado');
}
export async function pickOrCreateSyncFile() {
  if (!window.showSaveFilePicker) {
    onDirty('Tu navegador no soporta conexión directa a archivos. Usa Exportar / Importar.');
    return;
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'pagos2026_data.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    fileHandle = handle;
    await idbSet('handle', handle);
    syncStatus.connected = true; syncStatus.filename = handle.name; syncStatus.needsPermission = false;
    await writeSyncFile();
    onDirty(`Conectado a "${handle.name}". Guarda esta ubicación dentro de tu carpeta de OneDrive para que sincronice.`);
  } catch { /* user cancelled the picker */ }
}
export async function reconnectSyncFile() {
  const handle = await idbGet('handle');
  if (!handle) return;
  try {
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      fileHandle = handle;
      syncStatus.connected = true; syncStatus.filename = handle.name; syncStatus.needsPermission = false;
      await pullFromFile(true);
      onDirty('Archivo reconectado');
    } else {
      onDirty('Permiso no concedido');
    }
  } catch { onDirty('No se pudo reconectar el archivo'); }
}
export async function disconnectSyncFile() {
  fileHandle = null;
  await idbDel('handle');
  syncStatus = { connected: false, filename: null, lastSync: null, needsPermission: false, supported: syncStatus.supported };
  onDirty('Archivo desconectado. Tus datos siguen guardados en este navegador.');
}
export async function initFileSync() {
  if (!('indexedDB' in window) || !window.showSaveFilePicker) { onDirty(); return; }
  const handle = await idbGet('handle');
  if (!handle) { onDirty(); return; }
  syncStatus.filename = handle.name;
  try {
    const perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      fileHandle = handle;
      syncStatus.connected = true;
      await pullFromFile(true);
    } else {
      syncStatus.needsPermission = true;
    }
  } catch { syncStatus.needsPermission = true; }
  onDirty();
}
export function hasFileHandle() { return !!fileHandle; }

/* ============ Export / import a portable JSON snapshot ============ */
export function exportDataJSON() {
  const data = collectAppData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pagos2026_data.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export function importDataJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!applyAppData(data)) { reject(new Error('El archivo no tiene el formato esperado')); return; }
        loadLedger();
        resolve();
      } catch {
        reject(new Error('El archivo no es un JSON válido'));
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsText(file);
  });
}

/* ============ Nube anónima (jsonblob.com — sin cuenta) ============ */
export function getCloudId() { return localStorage.getItem(K.cloudId) || null; }
function queueCloudSync() {
  if (!getCloudId()) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(cloudPush, 1500);
}
export async function cloudPush() {
  const id = getCloudId();
  if (!id) return;
  try {
    const res = await fetch(`${CLOUD_API}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collectAppData()) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    cloudState.lastPush = new Date(); cloudState.lastError = null;
  } catch {
    cloudState.lastError = 'No se pudo subir a la nube (¿sin internet?)';
  }
  onDirty();
}
export async function cloudPull(silent) {
  const id = getCloudId();
  if (!id) return false;
  try {
    const res = await fetch(`${CLOUD_API}/${id}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data || data.app !== 'pagos2026') { if (!silent) onDirty('El código no corresponde a datos de esta app'); return false; }
    const localModified = localStorage.getItem(K.lastModified);
    if (localModified && data.lastModified && new Date(data.lastModified) <= new Date(localModified)) {
      if (!silent) onDirty('Tus datos locales ya están al día');
      return true;
    }
    applyAppData(data);
    loadLedger();
    if (!silent) onDirty('Datos traídos desde la nube');
    return true;
  } catch {
    cloudState.lastError = 'No se pudo leer la nube';
    if (!silent) onDirty('No se pudo conectar con la nube (revisa tu internet o el código)');
    return false;
  }
}
export async function cloudCreate() {
  try {
    const res = await fetch(CLOUD_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(collectAppData()) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const loc = res.headers.get('Location') || res.headers.get('location');
    if (!loc) { onDirty('El servicio no devolvió un código. Intenta de nuevo o usa OneDrive.'); return null; }
    const id = loc.split('/').pop();
    localStorage.setItem(K.cloudId, id);
    cloudState.lastPush = new Date();
    onDirty();
    return id;
  } catch {
    onDirty('No se pudo crear la nube. Revisa tu conexión a internet e intenta de nuevo.');
    return null;
  }
}
export async function cloudJoin(code) {
  const id = (code || '').trim().split('/').pop();
  if (!id) { onDirty('Código inválido'); return false; }
  localStorage.setItem(K.cloudId, id);
  const ok = await cloudPull(false);
  if (!ok) localStorage.removeItem(K.cloudId);
  onDirty();
  return ok;
}
export function cloudDisconnect() {
  localStorage.removeItem(K.cloudId);
  cloudState = { lastPush: null, lastError: null };
  onDirty();
}
export async function initCloud() {
  if (getCloudId()) await cloudPull(true);
  onDirty();
}

/* ============ PIN lock ============ */
async function hashPinSubtle(pin) {
  const msg = 'pagos2026:' + pin;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function hashPinDjb2(pin) {
  const msg = 'pagos2026:' + pin;
  let h = 5381;
  for (let i = 0; i < msg.length; i++) h = ((h << 5) + h + msg.charCodeAt(i)) | 0;
  return 'djb2:' + (h >>> 0).toString(16);
}
export async function hashPin(pin) {
  if (window.crypto && crypto.subtle && crypto.subtle.digest) {
    try { return await hashPinSubtle(pin); } catch { /* fall through */ }
  }
  return hashPinDjb2(pin);
}
/** Tolerant verification: a hash created on another device/context (SHA-256 or djb2) still unlocks here. */
export async function verifyPin(pin) {
  const stored = localStorage.getItem(K.pin);
  if (!stored) return true;
  if (hashPinDjb2(pin) === stored) return true;
  if (window.crypto && crypto.subtle && crypto.subtle.digest) {
    try { if ((await hashPinSubtle(pin)) === stored) return true; } catch { /* ignore */ }
  }
  return false;
}
export function pinIsSet() { return !!localStorage.getItem(K.pin); }
export async function setPin(pin) { localStorage.setItem(K.pin, await hashPin(pin)); touch(); }
export function removePin() { localStorage.removeItem(K.pin); touch(); }

/* ============ Autosave / local backup ============ */
export function takeAutoBackup() {
  try {
    localStorage.setItem(K.autoBackup, JSON.stringify({ at: new Date().toISOString(), data: collectAppData() }));
  } catch { /* storage full — skip silently */ }
  onDirty();
}
export function getAutoBackup() {
  try { return JSON.parse(localStorage.getItem(K.autoBackup)); } catch { return null; }
}
export function restoreAutoBackup() {
  const info = getAutoBackup();
  if (!info) return false;
  applyAppData(info.data);
  loadLedger();
  return true;
}
export function flushSyncNow() {
  if (fileHandle) { clearTimeout(syncTimer); writeSyncFile(); }
  if (getCloudId()) { clearTimeout(cloudTimer); cloudPush(); }
}

/**
 * Wires the reactive store to the sync/backup machinery: every state
 * mutation (any save*() in data.js) now automatically marks the app dirty,
 * debounce-queues a file/cloud push, and takes a 5-minute local snapshot —
 * no call site needs to remember to do this itself.
 */
export function initAutoSave() {
  onStateChange(touch);
  takeAutoBackup();
  setInterval(takeAutoBackup, CONFIG.sync.intervalMs);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSyncNow(); });
  window.addEventListener('beforeunload', flushSyncNow);
}

export async function initSync() {
  await initFileSync();
}
