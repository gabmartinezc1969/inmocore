// Mirrors the category taxonomy and storage-key conventions from the web
// app (`pagos-app/src/modules/config.js`) so both clients agree on the same
// vocabulary, even though this app keeps its own local storage.

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
