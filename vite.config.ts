import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
      serverFns: { disableCsrfMiddlewareWarning: true },
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
    nitro({
      preset: "vercel",
      // Increase serverless function timeout for Binance/TwelveData API calls
      vercel: {
        maxDuration: 30,
      },
      // Ensure all SSR chunks are included in the Vercel serverless function.
      // @vercel/nft doesn't trace imports within dynamically-loaded modules,
      // so code-split chunks in _ssr/ get excluded from the deployment.
      includeFiles: ["_ssr/**"],
      // API handlers: server/api/*.ts exports defineEventHandler from h3.
      // These are registered as Nitro route handlers alongside the SSR renderer.
      handlers: [
        { route: "/api/check-alerts", handler: "./server/api/check-alerts.ts" },
        { route: "/api/generate-signals", handler: "./server/api/generate-signals.ts" },
        { route: "/api/telegram-webhook", handler: "./server/api/telegram-webhook.ts" },
        { route: "/api/migrate", handler: "./server/api/migrate.ts" },
        { route: "/api/p1-validate", handler: "./server/api/p1-validate.ts" },
        { route: "/api/health", handler: "./server/api/health.ts" },
        { route: "/api/metrics", handler: "./server/api/metrics.ts" },
      ],
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  css: { transformer: "lightningcss" },
  build: {
    // P1: Suppress chunk size warning — the 600KB index chunk is mostly
    // TanStack Start/Router/Query runtime + React (~350KB) which cannot be
    // further code-split. The warning was triggered because the default limit
    // is 500KB. After P0/P1 code-splitting optimizations, the index chunk is
    // at ~500KB (down from 635KB) with all reducible modules already lazy-loaded.
    chunkSizeWarningLimit: 700,
  },
  server: {
    host: "::",
    port: 8080,
  },
});
