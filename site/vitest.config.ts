import { defineConfig } from "vitest/config";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 与生产一致：依赖 npm 上的 @wsxjs/*，不使用 monorepo 源码 alias。 */
export default defineConfig({
  plugins: [
    wsx({
      jsxFactory: "h",
      jsxFragment: "Fragment",
    }),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "test/**/*.test.ts"],
    typecheck: {
      include: ["src/**/*.{ts,tsx,wsx}", "src/types.d.ts"],
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx,wsx}"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.{ts,tsx}", "src/main.ts"],
    },
  },
  resolve: {
    alias: [{ find: "@", replacement: path.resolve(__dirname, "./src") }],
  },
  esbuild: {
    jsx: "transform",
    jsxFactory: "h",
    jsxFragment: "Fragment",
    jsxInject: `import { h, Fragment } from '@wsxjs/wsx-core'`,
    target: "es2020",
  },
});
