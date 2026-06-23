import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost/" },
    },
    include: ["test/**/*.test.ts"],
    typecheck: {
      enabled: true,
      include: ["test/types/**/*.test-d.ts"],
    },
    coverage: { provider: "v8" },
  },
});
