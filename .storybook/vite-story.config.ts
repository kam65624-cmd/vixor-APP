// Minimal Vite config for Storybook — avoids TanStack Start / Nitro plugins
// that would pull in the entire route tree and break the build.
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
  },
});