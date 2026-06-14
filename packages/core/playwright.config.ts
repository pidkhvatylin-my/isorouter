import { defineConfig, devices } from "@playwright/test";
import type { PolyfillOptions } from "./e2e/test";

export default defineConfig<PolyfillOptions>({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5273",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx vite --port 5273 --strictPort",
    port: 5273,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Same spec suite, but with the native Navigation API stripped so the
    // fixture falls back to the @virtualstate/navigation polyfill — proving
    // behaviour parity between native and polyfilled engines.
    {
      name: "chromium-polyfill",
      use: { ...devices["Desktop Chrome"], polyfill: true },
    },
  ],
});
