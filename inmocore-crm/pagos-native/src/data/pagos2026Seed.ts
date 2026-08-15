// Real ledger data for this installation, exported from the "Pagos 2026"
// backup format (`pagos2026_data_v4_1.json`) and bundled as JSON so it ships
// with the app as its default data set — no backend, no manual import
// needed on first launch. Field names in the raw export are abbreviated
// (`f`,`t`,`c`,`n`,`p`,`m`,`mp`,`ded`); this module maps them onto the
// app's own `Movimiento` / `Credito` / `Inversion` / `Activo` shapes.
//
// Users can still replace this data at any time from
// Configuración → Restaurar datos de ejemplo, or by importing their own
// backup — this file only supplies what a fresh install starts with.
import raw from './pagos2026-seed.json';
import { Movimiento, Credito, Activo, Inversion } from '@/src/types/models';

interface RawLedgerRow {
  id: string;
  f: string;
  t: 'I' | 'E';
  c: string;
  n: string;
  p: number;
  m: number | null;
  mp?: string;
  ded?: number | boolean;
}

interface RawCredit {
  id: string;
  nombre: string;
  tipo: string;
  categoria: string;
  monto: number;
  tasa: number;
  plazo: number;
  inicio: string;
  saldoBanco?: number | null;
  notas?: string;
}

interface RawInvestment {
  id: string;
  nombre: string;
  capital: number;
  valor: number;
}

interface RawAsset {
  id: string;
  nombre: string;
  tipo: string;
  valor: number;
}

interface RawSeed {
  ledger: RawLedgerRow[];
  credits: RawCredit[];
  investments: RawInvestment[];
  assets: RawAsset[];
}

const seed = raw as unknown as RawSeed;

export function buildRealLedger(): Movimiento[] {
  // The source export has one colliding pair of ids (two rows created in
  // the same millisecond upstream). React's list keys — and everything
  // that looks a row up by id (edit, delete) — need uniqueness guaranteed,
  // so de-dupe defensively instead of trusting the raw export.
  const seen = new Set<string>();
  return seed.ledger.map((r) => {
    let id = r.id;
    while (seen.has(id)) id = `${r.id}_dup${Math.random().toString(36).slice(2, 6)}`;
    seen.add(id);
    return {
      id,
      fecha: r.f,
      tipo: r.t,
      categoria: r.c,
      concepto: r.n,
      presupuesto: r.p || 0,
      monto: r.m,
      metodoPago: r.mp || undefined,
      deducible: !!r.ded,
    };
  });
}

export function buildRealCredits(): Credito[] {
  return seed.credits.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    tipo: (c.tipo as Credito['tipo']) || 'Otro',
    categoria: c.categoria,
    monto: c.monto,
    tasa: c.tasa,
    plazo: c.plazo,
    inicio: c.inicio,
    saldoBanco: c.saldoBanco ?? null,
    notas: c.notas || '',
  }));
}

export function buildRealAssets(): Activo[] {
  return seed.assets.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    tipo: (a.tipo as Activo['tipo']) || 'Otro',
    valor: a.valor,
  }));
}

export function buildRealInvestments(): Inversion[] {
  return seed.investments.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    capital: i.capital,
    valorActual: i.valor,
  }));
}
