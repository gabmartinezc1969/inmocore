// Centralized configuration: storage keys, categories, palette, external services.
// Anything that used to be a scattered top-level `const` in the monolith lives here.

export const CONFIG = {
  brandName: 'Pagos',
  brandTitle: 'Pagos · Libro Mayor 2026',
  version: 'v2',
  locale: 'es-MX',
  currency: 'MXN',

  storage: {
    prefix: 'pagos2026_',
    keys: {
      ledger: 'pagos2026_ledger_v1',
      lastModified: 'pagos2026_last_modified_v1',
      goals: 'pagos2026_goals_v1',
      debt: 'pagos2026_debt_v1',
      investments: 'pagos2026_investments_v1',
      dismissedSubs: 'pagos2026_dismissed_subs_v1',
      customCats: 'pagos2026_customcats_v1',
      credits: 'pagos2026_credits_v1',
      navOrder: 'pagos2026_navorder_v1',
      cloudId: 'pagos2026_cloudid_v1',
      pin: 'pagos2026_pin_v1',
      autoBackup: 'pagos2026_autobackup_v1',
      gtaChartType: 'pagos2026_gta_charttype_v1',
      theme: 'pagos2026_theme_v1',
      accent: 'pagos2026_accent_v1',
      assets: 'pagos2026_assets_v1',
      dashWidgets: 'pagos2026_dashwidgets_v1',
    },
  },

  cloud: {
    api: 'https://jsonblob.com/api/jsonBlob',
  },

  sync: {
    // How often the autosave/backup loop flushes pending local changes.
    intervalMs: 5 * 60 * 1000,
  },

  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  monthsAbbr: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayOfWeekAbbr: ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'],
  paymentMethods: ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'Wallet'],

  categories: {
    egresoOrder: ['Tarjeta bancaria', 'Hipoteca', 'Mantenimiento', 'Seguro', 'Credito automotriz', 'Predial', 'Arreglos Casa', 'Varios', 'Creditos', 'Tenencia', 'Gasto Varios', 'Servicios', 'Gastos medicos', 'Auto', 'Hipotecario'],
    ingresoOrder: ['Percepcion', 'Inversion', 'Renta'],
    fijo: new Set(['Hipoteca', 'Hipotecario', 'Predial', 'Seguro', 'Tenencia', 'Credito automotriz', 'Creditos', 'Mantenimiento']),
    debt: ['Tarjeta bancaria', 'Hipoteca', 'Hipotecario', 'Credito automotriz', 'Creditos'],
  },

  colors: {
    accent: '#2DD4A7',
    accentDark: '#1FA07E',
    gold: '#E8B34B',
    red: '#F0655A',
    amber: '#F2C14E',
    violet: '#9B8CFF',
  },

  palette: ['#2DD4A7', '#E8B34B', '#5BA8D4', '#F0655A', '#9B8CFF', '#A9C177', '#F2C14E', '#7E97A1', '#C98F6B', '#7FB8A2', '#D4794C', '#93A87C', '#9FB3A7', '#C27E8D'],
};

const categoryColorMap = {};
[...CONFIG.categories.egresoOrder, ...CONFIG.categories.ingresoOrder].forEach((c, i) => {
  categoryColorMap[c] = CONFIG.palette[i % CONFIG.palette.length];
});

/** Stable color per category name; assigns new palette slots for categories not seeded above. */
export function catColor(cat) {
  if (!(cat in categoryColorMap)) {
    categoryColorMap[cat] = CONFIG.palette[Object.keys(categoryColorMap).length % CONFIG.palette.length];
  }
  return categoryColorMap[cat];
}
