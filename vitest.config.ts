import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve the `@/…` path alias (mirrors tsconfig.json paths) so unit tests can
// import library modules the same way the app does.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
