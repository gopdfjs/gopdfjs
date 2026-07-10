import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

/** Consumes workspace `@gopdfjs/engine` + `@gopdfjs/adapter-browser`; run `pnpm build:wasm` first. */
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), wasm(), topLevelAwait()],
  optimizeDeps: {
    exclude: ["@gopdfjs/engine"],
  },
  worker: {
    format: "es",
    plugins: () => [wasm(), topLevelAwait()],
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
});
