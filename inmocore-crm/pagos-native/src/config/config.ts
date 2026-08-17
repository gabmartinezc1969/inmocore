// Mirrors the category taxonomy and storage-key conventions from the web
// app (`pagos-app/src/modules/config.js`) so both clients agree on the same
// vocabulary, even though this app keeps its own local storage.
import { FontScaleSetting } from '@/src/types/models';

// Multiplier applied to every Text's fontSize app-wide (see AppText.tsx).
// Independent from the OS accessibility text-size setting.
export const FONT_SCALES: Record<FontScaleSetting, number> = {
  small: 0.88,
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};
export const FONT_SCALE_LABELS: Record<FontScaleSetting, string> = {
  small: 'Pequeña', normal: 'Normal', large: 'Grande', xlarge: 'Muy grande',
};

export const CONFIG = {
  brandName: 'Pagos',
  brandTitle: 'Pagos · Centro Financiero',
  locale: 'es-MX',
  currency: 'MXN',

  storage: {
    prefix: 'pagos_native_',
    key: 'pagos_native_state_v1',
  },

  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  monthsAbbr: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  paymentMethods: ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Wallet'],

  categories: {
    egresoOrder: [
      'Tarjeta bancaria', 'Hipotecario', 'Mantenimiento', 'Seguro',
      'Credito automotriz', 'Predial', 'Arreglos Casa', 'Varios',
      'Creditos', 'Tenencia', 'Servicios', 'Gastos medicos', 'Auto',
    ],
    ingresoOrder: ['Percepcion', 'Inversion', 'Renta'],
    fijo: new Set([
      'Hipotecario', 'Predial', 'Seguro', 'Tenencia',
      'Credito automotriz', 'Creditos', 'Mantenimiento',
    ]),
    debt: ['Tarjeta bancaria', 'Hipotecario', 'Credito automotriz', 'Creditos'],
  },
};

export function yearMonthFromISO(iso: string): { year: number; monthIdx: number; day: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, monthIdx: (m || 1) - 1, day: d || 1 };
}
