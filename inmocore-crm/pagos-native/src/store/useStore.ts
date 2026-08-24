import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CONFIG } from '@/src/config/config';
import { Movimiento, Credito, Activo, Inversion, Settings } from '@/src/types/models';
import { buildDemoLedger, buildDemoCredits, buildDemoAssets, buildDemoInvestments } from '@/src/data/seedData';

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

  resetToDemo: () => void;
  clearAll: () => void;
  importState: (data: Partial<Pick<AppState, 'ledger' | 'credits' | 'assets' | 'investments'>>) => void;
}

const defaultSettings: Settings = { theme: 'light', onboardingSeen: false, pin: null, dismissedSubs: [] };

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ledger: buildDemoLedger(),
      credits: buildDemoCredits(),
      assets: buildDemoAssets(),
      investments: buildDemoInvestments(),
      settings: defaultSettings,
      hydrated: false,
      sessionUnlocked: false,

      setHydrated: () => set({ hydrated: true }),
      unlockSession: () => set({ sessionUnlocked: true }),

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
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      partialize: (s) => ({ ledger: s.ledger, credits: s.credits, assets: s.assets, investments: s.investments, settings: s.settings }),
    }
  )
);
