import { test as base, expect } from "@playwright/test";

export interface PolyfillOptions {
  /**
   * When true, the native Navigation API is shadowed before any page script
   * runs, forcing the fixture down its `@virtualstate/navigation` polyfill path
   * (see e2e/fixture/main.ts). Set per-project in playwright.config.ts.
   */
  polyfill: boolean;
}

export const test = base.extend<PolyfillOptions>({
  polyfill: [false, { option: true }],

  page: async ({ page, polyfill }, use) => {
    if (polyfill) {
      // Every current Playwright engine ships the Navigation API, so to prove
      // the polyfill works we remove the native one first. `configurable: true`
      // lets the polyfill's own `defineProperty(window, "navigation")` succeed.
      await page.addInitScript(() => {
        Object.defineProperty(window, "navigation", {
          value: undefined,
          configurable: true,
        });
      });
    }
    await use(page);
  },
});

export { expect };
