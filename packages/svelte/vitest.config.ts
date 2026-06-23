import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.{ts,svelte.ts}"],
    typecheck: {
      enabled: true,
      include: ["test/types/**/*.test-d.ts"],
      tsconfig: "./tsconfig.typecheck.json",
    },
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,svelte}"],
    },
  },
  // Resolve Svelte's client build (the default "node"/server build doesn't
  // render to the DOM, which jsdom-based tests need).
  resolve: { conditions: ["browser"] },
});
