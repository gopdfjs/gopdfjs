import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { externalWithBundledGopdf } from "../../scripts/vite-lib-externals.mjs";
import pkg from "./package.json";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const NPM_EXTERNAL = Object.keys(pkg.dependencies ?? {});
const BUNDLE_GOPDF = ["@gopdfjs/adapter", "@gopdfjs/model"];

/** Browser adapter — bundles internal adapter/model; engine + wasm stay peer deps. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(ROOT, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: (id) => externalWithBundledGopdf(id, BUNDLE_GOPDF, NPM_EXTERNAL),
    },
    sourcemap: true,
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    dts({
      rollupTypes: true,
      tsconfigPath: resolve(ROOT, "tsconfig.json"),
    }),
  ],
});
