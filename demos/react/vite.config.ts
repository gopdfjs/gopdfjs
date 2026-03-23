import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

/**
 * 消费 workspace 包 `@gopdfjs/pdf-wasm`；需先 `pnpm --filter=@gopdfjs/pdf-wasm build:wasm` 生成 `pkg/`。
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react(), wasm(), topLevelAwait()],
  optimizeDeps: {
    exclude: ["@gopdfjs/pdf-wasm"],
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
