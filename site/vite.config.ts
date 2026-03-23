import { defineConfig } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import UnoCSS from "unocss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { copyFileSync, cpSync } from "fs";
import { wsxPress } from "@wsxjs/wsx-press/node";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** GitHub Pages 子路径：默认 `/gopdf/`，可用 `GOPDF_PAGES_BASE` 覆盖（须含首尾 `/`）。 */
function pagesBase(): string {
  if (process.env.NODE_ENV === "production" && process.env.GITHUB_PAGES === "true") {
    if (process.env.CUSTOM_DOMAIN === "true") {
      return "/";
    }
    return process.env.GOPDF_PAGES_BASE ?? "/gopdf/";
  }
  return "/";
}

const copy404Plugin = () => {
  return {
    name: "copy-404-for-github-pages",
    apply: "build" as const,
    closeBundle() {
      const distPath = path.resolve(__dirname, "dist");
      const indexPath = path.join(distPath, "index.html");
      const notFoundPath = path.join(distPath, "404.html");
      try {
        copyFileSync(indexPath, notFoundPath);
        console.log("✅ Generated 404.html from index.html for GitHub Pages SPA routing");
      } catch (error) {
        console.error("❌ Failed to generate 404.html:", error);
      }
    },
  };
};

const copyWsxPressPlugin = () => {
  return {
    name: "copy-wsx-press",
    apply: "build" as const,
    closeBundle() {
      const wsxPressPath = path.resolve(__dirname, ".wsx-press");
      const distWsxPressPath = path.resolve(__dirname, "dist/.wsx-press");
      try {
        cpSync(wsxPressPath, distWsxPressPath, { recursive: true });
        console.log("✅ Copied .wsx-press directory to dist");
      } catch (error) {
        console.error("❌ Failed to copy .wsx-press directory:", error);
      }
    },
  };
};

export default defineConfig({
  base: pagesBase(),
  plugins: [
    UnoCSS() as any,
    wsx({
      debug: false,
      jsxFactory: "h",
      jsxFragment: "Fragment",
    }) as any,
    wsxPress({
      docsRoot: path.resolve(__dirname, "public/docs"),
      outputDir: path.resolve(__dirname, ".wsx-press"),
    }) as any,
    copy404Plugin() as any,
    copyWsxPressPlugin() as any,
  ],
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV !== "production",
  },
  optimizeDeps: {
    exclude: [
      "@wsxjs/wsx-core",
      "@wsxjs/wsx-base-components",
      "@wsxjs/wsx-i18next",
      "@wsxjs/wsx-router",
      "@calenderjs/calendar",
    ],
  },
  server: {
    proxy: {
      "/api/github": {
        target: "https://api.github.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/github/, ""),
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.error("GitHub API proxy error", err);
          });
        },
      },
      "/api/npm": {
        target: "https://api.npmjs.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/npm/, ""),
      },
    },
  },
});
