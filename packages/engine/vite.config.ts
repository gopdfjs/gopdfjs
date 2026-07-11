import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { externalNpmOnly } from "../../scripts/vite-lib-externals.mjs";
import pkg from "./package.json";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const NPM_EXTERNAL = Object.keys(pkg.dependencies ?? {});

/** Published `@gopdfjs/engine` — bundles all internal `@gopdfjs/*`; npm deps stay external. */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(ROOT, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: (id) => externalNpmOnly(id, NPM_EXTERNAL),
    },
    sourcemap: true,
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [dts({ rollupTypes: true, exclude: ["src/**/__tests__/**"] })],
});
