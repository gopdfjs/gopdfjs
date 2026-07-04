import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

/**
 * 消费 workspace 包 `@gopdfjs/engine-browser`；需先在仓库根目录 `pnpm build:wasm` 生成 `packages/engine-core/pkg/`。
 */
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
