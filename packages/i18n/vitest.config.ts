import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/index.ts",
        /** react-router navigation; not executed under Vitest */
        "**/routing.tsx",
        "**/basename-context.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
