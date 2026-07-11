import { defineConfig, type Plugin } from 'vite';
import { wsx } from '@wsxjs/wsx-vite-plugin';
import { wsxPress } from '@wsxjs/wsx-press/node';
import UnoCSS from 'unocss/vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { cpSync, existsSync, copyFileSync } from 'fs';
import { resolveSiteBase } from './vite-plugins/resolveSiteBase';
import { wsxPressBasePlugin } from './vite-plugins/wsxPressBasePlugin';

const SITE_DEV_PORT = 5175;
const SITE_PREVIEW_PORT = 5176;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SITE_BASE = resolveSiteBase();
const IS_GH_PAGES = process.env.GITHUB_PAGES === 'true';

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

/** GitHub Pages SPA fallback — 404.html is a copy of index.html (History API). */
function copy404Plugin(): Plugin {
  return {
    name: 'copy-404',
    apply: 'build',
    closeBundle() {
      if (!IS_GH_PAGES) {
        return;
      }

      const indexHtml = path.resolve(__dirname, 'dist/index.html');
      const notFoundHtml = path.resolve(__dirname, 'dist/404.html');
      if (!existsSync(indexHtml)) {
        return;
      }

      copyFileSync(indexHtml, notFoundHtml);
    },
  };
}

export default defineConfig({
  base: SITE_BASE,

  plugins: [
    wsxPress({
      docsRoot: path.resolve(__dirname, './public/docs'),
      outputDir: path.resolve(__dirname, './.wsx-press'),
    }),
    wsxPressBasePlugin(SITE_BASE),
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
