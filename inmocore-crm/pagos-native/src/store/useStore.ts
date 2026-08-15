import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CONFIG } from '@/src/config/config';
import { Movimiento, Credito, Activo, Inversion, Settings, FontScaleSetting } from '@/src/types/models';
import { buildDemoLedger, buildDemoCredits, buildDemoAssets, buildDemoInvestments } from '@/src/data/seedData';
import { buildRealLedger, buildRealCredits, buildRealAssets, buildRealInvestments } from '@/src/data/pagos2026Seed';
import { dedupeIds } from '@/src/utils/dedupe';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

interface AppState {
  ledger: Movimiento[];
  credits: Credito[];
  assets: Activo[];
  investments: Inversion[];
  settings: Settings;
  hydrated: boolean;
  sessionUnlocked: boolean;

  setHydrated: () => void;
  unlockSession: () => void;
  sanitizeAfterHydrate: () => void;

  addMovimiento: (m: Omit<Movimiento, 'id'>) => void;
  updateMovimiento: (id: string, m: Omit<Movimiento, 'id'>) => void;
  deleteMovimiento: (id: string) => void;

  addCredito: (c: Omit<Credito, 'id'>) => void;
  updateCredito: (id: string, c: Omit<Credito, 'id'>) => void;
  deleteCredito: (id: string) => void;

  addActivo: (a: Omit<Activo, 'id'>) => void;
  updateActivo: (id: string, a: Omit<Activo, 'id'>) => void;
  deleteActivo: (id: string) => void;

  addInversion: (i: Omit<Inversion, 'id'>) => void;
  updateInversion: (id: string, i: Omit<Inversion, 'id'>) => void;
  deleteInversion: (id: string) => void;

  setTheme: (t: 'light' | 'dark') => void;
  setOnboardingSeen: () => void;
  setPin: (pin: string | null) => void;
  dismissSubscription: (key: string) => void;
  setPresupuestoMensual: (monto: number) => void;
  setFontScale: (scale: FontScaleSetting) => void;

  bulkRename: (filter: { year?: number; monthIdx?: number; categoria?: string; concepto?: string }, newCategoria: string | null, newConcepto: string | null) => number;
  copyMonth: (opts: { tipo?: 'I' | 'E'; fromYear: number; fromMonth: number; toYear: number; toMonth: number; asPending: boolean }) => number;
  deleteMonths: (opts: { tipo?: 'I' | 'E'; fromYear: number; fromMonth: number; mode: 'single' | 'onward' }) => number;

  resetToDemo: () => void;
  clearAll: () => void;
  importState: (data: Partial<Pick<AppState, 'ledger' | 'credits' | 'assets' | 'investments'>>) => void;
}

const defaultSettings: Settings = { theme: 'light', onboardingSeen: false, pin: null, dismissedSubs: [], presupuestoMensual: 0, fontScale: 'normal' };

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ledger: buildRealLedger(),
      credits: buildRealCredits(),
      assets: buildRealAssets(),
      investments: buildRealInvestments(),
      settings: defaultSettings,
      hydrated: false,
      sessionUnlocked: false,

      setHydrated: () => set({ hydrated: true }),
      unlockSession: () => set({ sessionUnlocked: true }),

      // Repairs id collisions in whatever was just loaded from disk. A code
      // fix to the seed data can't retroactively fix a device that already
      // persisted a colliding id before the fix shipped — this runs on
      // every app start so already-installed copies self-heal too.
      sanitizeAfterHydrate: () => set((s) => {
        const led = dedupeIds(s.ledger);
        const cred = dedupeIds(s.credits);
        const ast = dedupeIds(s.assets);
        const inv = dedupeIds(s.investments);
        if (!led.changed && !cred.changed && !ast.changed && !inv.changed) return {};
        return { ledger: led.rows, credits: cred.rows, assets: ast.rows, investments: inv.rows };
      }),

      addMovimiento: (m) => set((s) => ({ ledger: [...s.ledger, { ...m, id: uid() }] })),
      updateMovimiento: (id, m) => set((s) => ({ ledger: s.ledger.map((r) => (r.id === id ? { ...m, id } : r)) })),
      deleteMovimiento: (id) => set((s) => ({ ledger: s.ledger.filter((r) => r.id !== id) })),

      addCredito: (c) => set((s) => ({ credits: [...s.credits, { ...c, id: uid() }] })),
      updateCredito: (id, c) => set((s) => ({ credits: s.credits.map((r) => (r.id === id ? { ...c, id } : r)) })),
      deleteCredito: (id) => set((s) => ({ credits: s.credits.filter((r) => r.id !== id) })),

      addActivo: (a) => set((s) => ({ assets: [...s.assets, { ...a, id: uid() }] })),
      updateActivo: (id, a) => set((s) => ({ assets: s.assets.map((r) => (r.id === id ? { ...a, id } : r)) })),
      deleteActivo: (id) => set((s) => ({ assets: s.assets.filter((r) => r.id !== id) })),

      addInversion: (i) => set((s) => ({ investments: [...s.investments, { ...i, id: uid() }] })),
      updateInversion: (id, i) => set((s) => ({ investments: s.investments.map((r) => (r.id === id ? { ...i, id } : r)) })),
      deleteInversion: (id) => set((s) => ({ investments: s.investments.filter((r) => r.id !== id) })),

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),
      setOnboardingSeen: () => set((s) => ({ settings: { ...s.settings, onboardingSeen: true } })),
      setPin: (pin) => set((s) => ({ settings: { ...s.settings, pin } })),
      dismissSubscription: (key) => set((s) => ({ settings: { ...s.settings, dismissedSubs: [...s.settings.dismissedSubs, key] } })),
      setPresupuestoMensual: (monto) => set((s) => ({ settings: { ...s.settings, presupuestoMensual: Math.max(0, monto) } })),
      setFontScale: (fontScale) => set((s) => ({ settings: { ...s.settings, fontScale } })),

      bulkRename: (filter, newCategoria, newConcepto) => {
        let count = 0;
        set((s) => ({
          ledger: s.ledger.map((r) => {
            const matches = (filter.year === undefined || new Date(r.fecha + 'T00:00:00').getFullYear() === filter.year) &&
              (filter.monthIdx === undefined || new Date(r.fecha + 'T00:00:00').getMonth() === filter.monthIdx) &&
              (!filter.categoria || r.categoria === filter.categoria) &&
              (!filter.concepto || r.concepto === filter.concepto);
            if (!matches) return r;
            count += 1;
            return { ...r, categoria: newCategoria || r.categoria, concepto: newConcepto || r.concepto };
          }),
        }));
        return count;
      },

      copyMonth: ({ tipo, fromYear, fromMonth, toYear, toMonth, asPending }) => {
        const s = get();
        const src = s.ledger.filter((r) => {
          const d = new Date(r.fecha + 'T00:00:00');
          return d.getFullYear() === fromYear && d.getMonth() === fromMonth && (!tipo || r.tipo === tipo);
        });
        const copies: Movimiento[] = src.map((r) => {
          const d = new Date(r.fecha + 'T00:00:00');
          const targetDay = Math.min(d.getDate(), new Date(toYear, toMonth + 1, 0).getDate());
          const mm = String(toMonth + 1).padStart(2, '0');
          const dd = String(targetDay).padStart(2, '0');
          return { ...r, id: uid(), fecha: `${toYear}-${mm}-${dd}`, monto: asPending ? null : r.monto };
        });
        set({ ledger: [...s.ledger, ...copies] });
        return copies.length;
      },

      deleteMonths: ({ tipo, fromYear, fromMonth, mode }) => {
        const s = get();
        let count = 0;
        const keep = s.ledger.filter((r) => {
          const d = new Date(r.fecha + 'T00:00:00');
          const y = d.getFullYear(), m = d.getMonth();
          const inRange = mode === 'single' ? (y === fromYear && m === fromMonth) : (y > fromYear || (y === fromYear && m >= fromMonth));
          const typeMatch = !tipo || r.tipo === tipo;
          const shouldDelete = inRange && typeMatch;
          if (shouldDelete) count += 1;
          return !shouldDelete;
        });
        set({ ledger: keep });
        return count;
      },

      resetToDemo: () => set({
        ledger: buildDemoLedger(),
        credits: buildDemoCredits(),
        assets: buildDemoAssets(),
        investments: buildDemoInvestments(),
      }),
      clearAll: () => set({ ledger: [], credits: [], assets: [], investments: [] }),
      importState: (data) => set((s) => ({
        ledger: data.ledger ?? s.ledger,
        credits: data.credits ?? s.credits,
        assets: data.assets ?? s.assets,
        investments: data.investments ?? s.investments,
      })),
    }),
    {
      name: CONFIG.storage.key,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => { state?.sanitizeAfterHydrate(); state?.setHydrated(); },
      partialize: (s) => ({ ledger: s.ledger, credits: s.credits, assets: s.assets, investments: s.investments, settings: s.settings }),
    }
  )
);
