import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ["./tsconfig.json"] })],
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    globals: false,
    pool: "threads",
    testTimeout: 10000,
    reporters: ["default"],
    setupFiles: ["src/__tests__/setup.ts"],
  },
});
