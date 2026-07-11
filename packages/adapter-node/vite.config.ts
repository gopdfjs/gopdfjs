import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { externalWithBundledGopdf } from "../../scripts/vite-lib-externals.mjs";
import pkg from "./package.json";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const NPM_EXTERNAL = Object.keys(pkg.dependencies ?? {});
const BUNDLE_GOPDF = ["@gopdfjs/adapter", "@gopdfjs/model"];

/** Node adapter — bundles internal adapter/model; engine + wasm stay peer deps. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(ROOT, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    ssr: true,
    target: "node20",
    rollupOptions: {
      external: (id) => {
        if (id.startsWith("node:")) return true;
        return externalWithBundledGopdf(id, BUNDLE_GOPDF, NPM_EXTERNAL);
      },
    },
    sourcemap: true,
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
