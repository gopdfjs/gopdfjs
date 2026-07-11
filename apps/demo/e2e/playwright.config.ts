import { defineConfig, devices } from "@playwright/test";
import { GOPDF_PORTS } from "../ports";

const DEMO_PORT = GOPDF_PORTS.demoE2e;
const BASE_URL = `http://127.0.0.1:${DEMO_PORT}`;

export default defineConfig({
  testDir: "./tools",
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm --filter=@gopdfjs/demo-react exec vite --port ${DEMO_PORT} --strictPort --host 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
