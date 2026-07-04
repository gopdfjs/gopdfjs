import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    ssr: true,
    outDir: "dist",
    emptyOutDir: true,
    target: "node18",
    rollupOptions: {
      input: resolve(__dirname, "src/index.ts"),
      output: {
        entryFileNames: "index.mjs",
        format: "es",
      },
      external: [
        "@gopdfjs/engine",
        "@gopdfjs/extract",
        "@gopdfjs/setup",
        "@modelcontextprotocol/sdk",
        "pdf-lib",
        /^node:/,
      ],
    },
  },
});
