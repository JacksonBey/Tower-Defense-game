// Reference: SYSTEM.md#Build-And-Tooling
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"]
  }
});
