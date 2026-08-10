// Generic demo data so the app is useful out of the box on a fresh install.
// Amounts are round, illustrative figures — not anyone's real financial
// records — and are fully replaced the moment the user adds their own
// movements or resets the ledger from Configuración.
import { Movimiento, Credito, Activo, Inversion } from '@/src/types/models';

function iso(year: number, monthIdx: number, day: number): string {
  const m = String(monthIdx + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// Small deterministic pseudo-random so the demo ledger looks organic
// without being different on every install.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function buildDemoLedger(): Movimiento[] {
  const rows: Movimiento[] = [];
  const rand = rng(42);
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth();
  const startYear = endYear - 1;
  let id = 1;
  const push = (fecha: string, tipo: 'I' | 'E', categoria: string, concepto: string, presupuesto: number, monto: number | null, metodoPago?: string, deducible?: boolean) => {
    rows.push({ id: `demo-${id++}`, fecha, tipo, categoria, concepto, presupuesto, monto, metodoPago, deducible });
  };

  let y = startYear, m = 0;
  // walk chronologically from Jan of last year through 2 months past "now"
  // (future months come in as budgeted-only, i.e. monto = null).
  while (y < endYear || (y === endYear && m <= Math.min(11, endMonth + 2))) {
    const future = y > endYear || (y === endYear && m > endMonth);
    const wobble = (base: number, spread: number) => Math.round(base + (rand() - 0.5) * spread);

    push(iso(y, m, 1), 'I', 'Percepcion', 'Salario', 45000, future ? null : wobble(45000, 2000));
    push(iso(y, m, 15), 'I', 'Renta', 'Renta departamento', 12000, future ? null : 12000);
    if (m % 3 === 0) push(iso(y, m, 20), 'I', 'Inversion', 'Rendimiento portafolio', 3000, future ? null : wobble(3000, 4000));

    push(iso(y, m, 3), 'E', 'Mantenimiento', 'Mantenimiento casa', 2200, future ? null : 2200, 'Transferencia');
    push(iso(y, m, 5), 'E', 'Servicios', 'Luz, agua, internet', 1800, future ? null : wobble(1800, 400), 'Débito');
    push(iso(y, m, 8), 'E', 'Tarjeta bancaria', 'Pago tarjeta principal', 6000, future ? null : wobble(6000, 3000), 'Crédito');
    push(iso(y, m, 12), 'E', 'Varios', 'Supermercado', 3500, future ? null : wobble(3500, 900), 'Débito');
    push(iso(y, m, 14), 'E', 'Credito automotriz', 'Mensualidad auto', 4200, future ? null : 4200, 'Transferencia');
    push(iso(y, m, 18), 'E', 'Seguro', 'Seguro auto y casa', 950, future ? null : 950, 'Débito', true);
    if (m % 2 === 0) push(iso(y, m, 22), 'E', 'Gastos medicos', 'Consulta / farmacia', 600, future ? null : wobble(600, 500), 'Efectivo', true);
    push(iso(y, m, 28), 'E', 'Hipotecario', 'Pago hipoteca', 9800, future ? null : 9800, 'Transferencia');
    if (m === 0) push(iso(y, m, 30), 'E', 'Predial', 'Predial anual', 5200, future ? null : 5200);
    // a few small recurring charges so Suscripciones has something to detect
    push(iso(y, m, 10), 'E', 'Varios', 'Streaming video', 199, future ? null : 199, 'Crédito');
    push(iso(y, m, 11), 'E', 'Varios', 'Streaming música', 129, future ? null : 129, 'Crédito');

    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return rows;
}

export function buildDemoCredits(): Credito[] {
  const now = new Date();
  const start = new Date(now.getFullYear() - 3, 2, 1);
  return [
    {
      id: 'demo-credit-1',
      nombre: 'Hipoteca casa',
      tipo: 'Hipotecario',
      categoria: 'Hipotecario',
      monto: 1800000,
      tasa: 10.5,
      plazo: 240,
      inicio: start.toISOString().slice(0, 10),
      saldoBanco: null,
      notas: 'Crédito a 20 años',
    },
    {
      id: 'demo-credit-2',
      nombre: 'Crédito auto',
      tipo: 'Automotriz',
      categoria: 'Credito automotriz',
      monto: 280000,
      tasa: 12,
      plazo: 60,
      inicio: new Date(now.getFullYear() - 1, 5, 1).toISOString().slice(0, 10),
      saldoBanco: null,
      notas: '',
    },
  ];
}

export function buildDemoAssets(): Activo[] {
  return [
    { id: 'demo-asset-1', nombre: 'Casa', tipo: 'Propiedad', valor: 2600000 },
    { id: 'demo-asset-2', nombre: 'Auto', tipo: 'Vehículo', valor: 320000 },
    { id: 'demo-asset-3', nombre: 'Cuenta nómina', tipo: 'Cuenta bancaria', valor: 65000 },
    { id: 'demo-asset-4', nombre: 'Efectivo', tipo: 'Efectivo', valor: 8000 },
  ];
}

export function buildDemoInvestments(): Inversion[] {
  return [
    { id: 'demo-inv-1', nombre: 'Fondo índice S&P500', capital: 180000, valorActual: 214000 },
    { id: 'demo-inv-2', nombre: 'Cetes / deuda gubernamental', capital: 90000, valorActual: 95500 },
  ];
}
