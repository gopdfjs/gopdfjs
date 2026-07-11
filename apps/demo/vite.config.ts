import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

/** demo-react dev */
const DEMO_DEV_PORT = 5174;

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
    port: DEMO_DEV_PORT,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
  preview: {
    port: DEMO_DEV_PORT,
    strictPort: true,
  },
});
