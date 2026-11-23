import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["testes/**/*.test.ts"],
    setupFiles: ["testes/preparacao.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
