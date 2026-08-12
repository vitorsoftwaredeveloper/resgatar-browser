import { defineConfig } from "vitest/config";
import path from "node:path";
import globs from "./tests/coverage-globs.json";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    include: globs.testInclude,
    setupFiles: ["tests/setup.ts"],
    globals: false,
    coverage: {
      provider: "istanbul",
      include: globs.coverageInclude,
      exclude: globs.coverageExclude,
      reporter: ["text-summary", "text", "html", "json-summary", "json"],
      reportsDirectory: "coverage/unit",
    },
  },
});
