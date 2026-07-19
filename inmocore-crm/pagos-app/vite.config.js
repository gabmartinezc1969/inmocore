import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  build: {
    outDir: '../pagos-dist',
    emptyOutDir: true,
    // Namespaced (not the generic "assets") since the build output lands
    // in a directory shared with several other static apps (crmadmin.html,
    // micrm.html, ...) that could one day add their own "assets/" folder.
    assetsDir: 'assets-pagos',
    rollupOptions: {
      // Keep the historical /pagos.html URL stable across the rewrite instead of
      // Vite's default index.html, so existing bookmarks/PWA installs keep working.
      input: fileURLToPath(new URL('./pagos.html', import.meta.url)),
    },
  },
  plugins: [
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      injectRegister: null, // main.js registers the SW itself
      manifest: false, // we ship our own manifest-pagos.json
      includeAssets: ['icon-192-pagos.png', 'icon-512-pagos.png', 'apple-touch-icon-pagos.png', 'manifest-pagos.json'],
      filename: 'sw-pagos.js',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        // The plugin defaults this to "index.html"; our entry is "pagos.html".
        navigateFallback: 'pagos.html',
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
