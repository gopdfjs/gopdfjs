import { defineConfig, type Plugin } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';
import { wsxPress } from '@wsxjs/wsx-press/node';
import UnoCSS from 'unocss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { cpSync, existsSync, readFileSync, writeFileSync } from 'fs';

const SITE_DEV_PORT = 5175;
const SITE_PREVIEW_PORT = 5176;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_BASE = process.env.VITE_BASE ?? '/';
const IS_GH_PAGES = SITE_BASE !== '/';

/** Copy wsx-press build output into dist for static hosting. */
function copyWsxPressPlugin(): Plugin {
  return {
    name: 'copy-wsx-press',
    apply: 'build',
    closeBundle() {
      const wsxPressPath = path.resolve(__dirname, '.wsx-press');
      const distWsxPressPath = path.resolve(__dirname, 'dist/.wsx-press');
      if (!existsSync(wsxPressPath)) {
        console.warn('⚠️  .wsx-press not found — run vite build after wsxPress');
        return;
      }
      cpSync(wsxPressPath, distWsxPressPath, { recursive: true, force: true });
    },
  };
}

/** GitHub Pages SPA fallback: duplicate index.html as 404.html. */
function copy404Plugin(): Plugin {
  return {
    name: 'copy-404',
    apply: 'build',
    closeBundle() {
      if (!IS_GH_PAGES) return;

      const outDir = path.resolve(__dirname, 'dist');
      const indexHtml = path.resolve(outDir, 'index.html');
      const notFoundHtml = path.resolve(outDir, '404.html');
      if (!existsSync(indexHtml)) return;

      const redirectScript = `
    <script>
      if (!window.location.hash && window.location.pathname !== '${SITE_BASE}' && window.location.pathname !== '${SITE_BASE.replace(/\/$/, '')}') {
        window.location.replace('${SITE_BASE}');
      }
    </script>`;

      const htmlContent = readFileSync(indexHtml, 'utf-8').replace(
        '</head>',
        redirectScript + '\n  </head>',
      );
      writeFileSync(notFoundHtml, htmlContent, 'utf-8');
    },
  };
}

export default defineConfig({
  base: SITE_BASE,

  define: {
    __GOPDF_LOCALE_LOAD_PATH__: JSON.stringify(`${SITE_BASE}locales/{{lng}}/{{ns}}.json`),
  },

  plugins: [
    wsxPress({
      docsRoot: path.resolve(__dirname, './public/docs'),
      outputDir: path.resolve(__dirname, './.wsx-press'),
    }),
    UnoCSS(),
    wsx({
      debug: false,
      jsxFactory: 'h',
      jsxFragment: 'Fragment',
    }),
    copyWsxPressPlugin(),
    copy404Plugin(),
  ],

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@wsxjs/wsx-core', '@wsxjs/wsx-base-components', '@wsxjs/wsx-router'],
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: SITE_DEV_PORT,
    strictPort: true,
    open: true,
  },

  preview: {
    port: SITE_PREVIEW_PORT,
    strictPort: true,
    cors: true,
  },

  optimizeDeps: {
    exclude: [
      '@wsxjs/wsx-core',
      '@wsxjs/wsx-base-components',
      '@wsxjs/wsx-router',
    ],
  },
});
