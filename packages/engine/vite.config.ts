import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { externalNpmOnly } from "../../scripts/vite-lib-externals.mjs";
import { bundlePublicTypesPlugin } from "../../scripts/vite-plugin-bundle-public-dts.mjs";
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
    sourcemap: false,
    target: "es2022",
    outDir: "dist",
    emptyOutDir: true,
  },
  plugins: [bundlePublicTypesPlugin({ pkgDir: ROOT })],
});
