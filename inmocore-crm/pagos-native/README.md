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

## Ejecutar en Expo Go

Esta app **no requiere un development build ni EAS** — todas sus dependencias
(`expo-router`, `expo-linear-gradient`, `expo-file-system`, `expo-sharing`,
`expo-document-picker`, `@react-native-community/datetimepicker`,
`react-native-svg`, `@react-native-async-storage/async-storage`, etc.) forman
parte del runtime estándar que trae **Expo Go**; no se agregó código nativo
propio. Se verificó exportando el bundle de producción para iOS y Android
(`npx expo export --platform ios|android`) sin errores.

1. Instala la app **Expo Go** en tu teléfono (App Store en iOS, Google Play
   en Android) — necesitas la versión compatible con **Expo SDK 54**.
2. En tu computadora, dentro de esta carpeta:
   ```bash
   npm install
   npx expo start
   ```
3. Escanea el código QR que aparece en la terminal / navegador:
   - **Android:** desde el botón "Scan QR code" dentro de Expo Go.
   - **iOS:** desde la app Cámara del sistema (te ofrecerá abrir Expo Go).
4. El teléfono y la computadora deben estar en la **misma red Wi‑Fi**. Si no
   es posible (redes distintas, restricciones corporativas), usa:
   ```bash
   npm run start:tunnel
   ```

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
  data/pagos2026-seed.json  Respaldo real (pagos2026_data_v4_1.json) empaquetado como dato inicial
  data/pagos2026Seed.ts     Mapea el respaldo real al modelo Movimiento/Credito/Inversion/Activo
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
Informes (presupuesto mensual con anillo de balance disponible), Resumen
mensual, Dashboard anual, Ingresos, Gastos, Créditos y deudas
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

## Datos iniciales

La primera vez que se abre la app se carga el libro contable real
exportado en `pagos2026_data_v4_1.json` (1,034 movimientos 2025–2026, un
crédito hipotecario y una inversión en Cetes), empaquetado en
`src/data/pagos2026-seed.json`. Desde **Configuración** puedes exportar tu
propio respaldo en cualquier momento, importar uno distinto, o restaurar un
set de datos de demostración genérico (`src/data/seedData.ts`) si prefieres
partir de cero.

## Informes

La pantalla **Informes** (accesible desde Inicio o Más → Análisis)
reproduce el mockup de referencia: encabezado amarillo, totales de Gastos e
Ingreso del mes seleccionado, y una tarjeta "Presupuesto mensual" con un
anillo que muestra qué porcentaje de tu presupuesto objetivo sigue
disponible (Balance = Presupuesto − Gastos). El presupuesto mensual es un
monto libre que defines con el botón **Ajuste** — independiente de los
presupuestos por categoría usados en Resumen mensual.
