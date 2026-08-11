import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests for pure logic (revenue math, IST bucketing, GST). No DB needed.
// The logic under test lives in the shared workspace package, so these run once
// at the repo root and cover both the storefront and the admin panel.
export default defineConfig({
  resolve: {
    alias: {
      "@everfit/core": fileURLToPath(new URL("./packages/core/src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
