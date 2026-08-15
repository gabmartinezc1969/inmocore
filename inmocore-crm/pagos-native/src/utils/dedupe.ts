// Guarantees unique `id`s in a list. Used both when seeding the real ledger
// (src/data/pagos2026Seed.ts) and when rehydrating persisted state
// (src/store/useStore.ts) — a ledger that was ever seeded before the seed
// fix, or any backup imported from elsewhere, may already have colliding
// ids saved to disk, and a code fix to the seed alone can't repair data
// that's already persisted in AsyncStorage. Rehydration must sanitize too.
export function dedupeIds<T extends { id: string }>(rows: T[]): { rows: T[]; changed: boolean } {
  const seen = new Set<string>();
  let changed = false;
  const out = rows.map((r) => {
    if (!seen.has(r.id)) { seen.add(r.id); return r; }
    changed = true;
    let id = r.id;
    while (seen.has(id)) id = `${r.id}_dup${Math.random().toString(36).slice(2, 6)}`;
    seen.add(id);
    return { ...r, id };
  });
  return { rows: out, changed };
}
