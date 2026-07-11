import { defineConfig } from "vitest/config";

/** Runtime package is types + re-exports; projection behavior tested in engine + runtime tests. */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    passWithNoTests: false,
  },
});
