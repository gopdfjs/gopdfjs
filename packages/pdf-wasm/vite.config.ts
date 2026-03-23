import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "index.ts"),
        worker: resolve(__dirname, "worker.ts"),
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ["@pdf/i18n"], // Externalize any internal workspace packages if needed
    },
    target: "esnext",
  },
  worker: {
    format: "es",
    plugins: () => [wasm(), topLevelAwait()],
  },
});
