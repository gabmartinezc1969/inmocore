export type TipoMovimiento = 'I' | 'E'; // Ingreso | Egreso

export interface Movimiento {
  id: string;
  fecha: string; // ISO date, e.g. 2026-03-15
  tipo: TipoMovimiento;
  categoria: string;
  concepto: string;
  presupuesto: number;
  monto: number | null; // null = pendiente (aún no ejercido)
  metodoPago?: string;
  deducible?: boolean;
}

export type TipoCredito = 'Hipotecario' | 'Automotriz' | 'Personal' | 'Otro';

export interface Credito {
  id: string;
  nombre: string;
  tipo: TipoCredito;
  categoria: string; // vincula con Movimiento.categoria para pagos reales
  monto: number; // monto original
  tasa: number; // tasa anual %
  plazo: number; // meses
  inicio: string; // ISO date
  saldoBanco?: number | null; // saldo real reportado por el banco (más preciso que el teórico)
  notas?: string;
}

export type TipoActivo = 'Propiedad' | 'Vehículo' | 'Cuenta bancaria' | 'Efectivo' | 'Otro';

export interface Activo {
  id: string;
  nombre: string;
  tipo: TipoActivo;
  valor: number;
}

export interface Inversion {
  id: string;
  nombre: string;
  capital: number;
  valorActual: number;
}

export type ThemeSetting = 'light' | 'dark';

export interface Settings {
  theme: ThemeSetting;
  onboardingSeen: boolean;
  pin: string | null; // 4-digit PIN, plain-stored locally like the web app (quick-lock, not encryption)
  dismissedSubs: string[]; // keys of subscriptions the user marked as "not a subscription"
}
