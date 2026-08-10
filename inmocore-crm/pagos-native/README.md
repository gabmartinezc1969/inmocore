# Pagos · app nativa (React Native / Expo)

Versión móvil nativa de **Pagos · Centro Financiero**, hermana de la app web
en [`../pagos-app`](../pagos-app) (`pagos.html`). Comparte el mismo modelo de
datos y las mismas fórmulas financieras, pero es una implementación 100%
nativa (Expo Router + TypeScript) con identidad visual propia — no es un
WebView ni empaqueta la versión web.

Todo se guarda localmente en el dispositivo (`AsyncStorage`); no requiere
backend ni conexión a internet.

## Stack

- **Expo 54** + **Expo Router 6** (rutas por archivo, TypeScript, `experiments.typedRoutes`)
- **Zustand** con persistencia en `@react-native-async-storage/async-storage`
- **react-native-svg** para las gráficas (línea, dona, barras, gauge) — motor propio, sin Chart.js
- **expo-linear-gradient**, **@expo/vector-icons**, **@react-native-community/datetimepicker**
- **expo-document-picker** / **expo-file-system** / **expo-sharing** para exportar/importar respaldo en `.json`

## Estructura

```
app/
  index.tsx            Splash + redirección (onboarding / PIN / tabs)
  onboarding.tsx        Pantalla de bienvenida
  (tabs)/                Inicio · Cuentas · Movimientos · Más
  resumen.tsx, anual.tsx, ingresos.tsx, gastos.tsx,
  deudas.tsx, patrimonio.tsx, inversiones.tsx,
  suscripciones.tsx, recordatorios.tsx, alertas.tsx,
  configuracion.tsx, acerca.tsx
src/
  theme/colors.ts        Tokens de color (claro/oscuro) + paleta por categoría
  types/models.ts         Movimiento, Crédito, Activo, Inversión, Settings
  config/config.ts         Categorías, meses, métodos de pago (espejo de config.js de la web)
  data/seedData.ts         Datos de demostración genéricos (no son datos reales de nadie)
  store/useStore.ts         Estado global (zustand + persistencia)
  store/hooks.ts             useTheme(), useEnrichedLedger()
  utils/finance.ts           Agregaciones, score financiero, amortización francesa, alertas,
                               detección de suscripciones — puerto de calculations.js
  utils/format.ts             fmtMoney / fmtPct / fmtDate
  components/                 Card, Button, gráficas SVG, formularios, etc.
```

## Desarrollar

```bash
npm install
npm run start      # Expo dev server (presiona i / a / w)
npm run typecheck  # tsc --noEmit
```

## Alcance

**✅ Implementado por completo:** movimientos (alta/edición/filtros), Inicio,
Resumen mensual, Dashboard anual, Ingresos, Gastos, Créditos y deudas
(amortización francesa), Patrimonio y score financiero, Inversiones,
detección automática de Suscripciones, Recordatorios, Alertas, tema
claro/oscuro, PIN de acceso y exportar/importar respaldo en JSON.

**🟡 Versión simplificada frente a la web:** las gráficas usan un motor
propio en SVG en vez de Chart.js; Gastos muestra concentración por
categoría y top de gastos como listas/barras en vez de treemap y
calendario de calor; no incluye el generador de dashboards personalizados
("Mi Dashboard") ni exportación a Excel/.ics.

**⛔ Fuera de alcance:** sincronización en la nube u OneDrive y cuentas
multiusuario — requieren un backend o servicio de terceros que esta app,
100% local, no incorpora. El detalle completo vive en la pantalla
**Más → Acerca de Pagos** dentro de la app.

## Datos de ejemplo

La primera vez que se abre la app se carga un libro contable de
demostración con cifras genéricas e ilustrativas (no son datos reales de
ningún usuario). Se reemplaza automáticamente en cuanto agregas tus propios
movimientos, o puedes restaurarlo/borrarlo desde **Configuración**.
