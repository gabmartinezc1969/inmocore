# Pagos · Libro Mayor 2026 — source

This is the maintained source for the `pagos.html` app deployed at the root
of `inmocore-crm/`. It replaced a single ~4,700-line HTML file with a
modular Vite build:

```
src/
  modules/
    config.js        CONFIG object: storage keys, categories, palette, etc.
    state.js          Proxy-based reactive store (state.ledger.push(...) auto-notifies subscribers)
    format.js          fmtMoney / fmtPct / fmtDate
    calculations.js   Pure financial metrics (score, budgets, ratios) — unit tested
    data.js           Ledger CRUD + persistence, with input validation
    charts.js         Chart.js wrapper (theming, empty-state, generic widget styler)
    sync.js           OneDrive file sync, anonymous cloud sync, PIN lock, autosave
    ui.js             Nav/drawer, view router, toasts, modal accessibility, theme, app header
  views/              One file per nav section, each dynamically imported (code-split)
  styles/             CSS split by component, imported by main.css
tests/
  calculations.test.js  Vitest suite for the scoring/budget/ratio functions
```

## Develop

```
npm install
npm run dev      # Vite dev server
npm test         # Vitest
```

## Build & deploy

The site is served as static files (no server build step configured), so
after building, copy the output into place:

```
npm run build
cp ../pagos-dist/pagos.html ../pagos.html
rm -rf ../assets-pagos && cp -r ../pagos-dist/assets-pagos ../assets-pagos
cp ../pagos-dist/manifest-pagos.json ../manifest-pagos.json
cp ../pagos-dist/sw-pagos.js ../sw-pagos.js
rm -f ../workbox-*.js && cp ../pagos-dist/workbox-*.js ..
rm -rf ../pagos-dist
```

The build entry is intentionally named `pagos.html` (not Vite's default
`index.html`) so the deployed URL doesn't change. `vite.config.js` also
namespaces the assets directory as `assets-pagos/` to avoid collisions with
the other static apps that live alongside it (`crmadmin.html`, `micrm.html`, …).
