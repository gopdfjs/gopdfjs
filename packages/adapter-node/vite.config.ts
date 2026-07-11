import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { adapterExternal } from "../../scripts/vite-adapter-external.mjs";
import { bundlePublicTypesPlugin } from "../../scripts/vite-plugin-bundle-public-dts.mjs";
import { vendorWasmPlugin } from "../../scripts/vite-plugin-vendor-wasm.mjs";
import pkg from "./package.json";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const WASM_PKG = resolve(ROOT, "../wasm/pkg");
const NPM_EXTERNAL = Object.keys(pkg.dependencies ?? {});

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
      external: (id) => adapterExternal(id, NPM_EXTERNAL),
    },
    sourcemap: false,
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [
    bundlePublicTypesPlugin({ pkgDir: ROOT, keepEngineExternal: true }),
    vendorWasmPlugin({ wasmPkgDir: WASM_PKG, outDir: resolve(ROOT, "dist") }),
  ],
});
