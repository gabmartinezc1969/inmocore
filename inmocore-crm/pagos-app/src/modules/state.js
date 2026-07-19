// Proxy-based reactive store. Mutating `state.ledger.push(...)`, assigning
// `state.theme = 'light'`, etc. all notify subscribers automatically — no
// more manually calling renderX() after every data mutation.

const RAW = Symbol('raw');
const MUTATING_ARRAY_METHODS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']);

const listeners = new Set();
let batching = false;
let pendingNotify = false;

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !(v instanceof Date);
}

function notify() {
  if (batching) {
    pendingNotify = true;
    return;
  }
  listeners.forEach((fn) => fn());
}

/** Run `fn`, coalescing every mutation inside it into a single notification. */
export function batch(fn) {
  const wasBatching = batching;
  batching = true;
  try {
    fn();
  } finally {
    batching = wasBatching;
    if (!batching && pendingNotify) {
      pendingNotify = false;
      notify();
    }
  }
}

function reactive(target) {
  if (!isPlainObject(target)) return target;
  if (target[RAW]) return target;

  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (prop === RAW) return obj;
      const val = Reflect.get(obj, prop, receiver);
      if (typeof val === 'function' && Array.isArray(obj) && MUTATING_ARRAY_METHODS.has(prop)) {
        return function (...args) {
          let result;
          // splice/push etc. touch several indices + .length internally; batch
          // those into the single notification a caller actually expects.
          batch(() => {
            result = val.apply(receiver, args);
          });
          return result;
        };
      }
      return isPlainObject(val) ? reactive(val) : val;
    },
    set(obj, prop, value) {
      const raw = isPlainObject(value) && value[RAW] ? value[RAW] : value;
      obj[prop] = raw;
      notify();
      return true;
    },
    deleteProperty(obj, prop) {
      const had = prop in obj;
      delete obj[prop];
      if (had) notify();
      return true;
    },
  });
}

/** Unwrap a reactive proxy back to a plain object/array, e.g. before JSON.stringify. */
export function toRaw(value) {
  return isPlainObject(value) && value[RAW] ? value[RAW] : value;
}

export const state = reactive({
  ledger: [],
  goals: [],
  debtBalances: {},
  investments: [],
  credits: [],
  assets: [],
  dashWidgets: [],
  customCats: { egreso: [], ingreso: [] },
  dismissedSubs: [],
  navOrder: null,
  theme: 'dark',
  accent: null,
  currentView: 'inicio',
  editingId: null,
});

/** Subscribe to any state mutation. Returns an unsubscribe function. */
export function onStateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
