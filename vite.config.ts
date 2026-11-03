import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { CONTENT_SECURITY_POLICY } from "./src/shared/security/content-security-policy";

export default defineConfig({
  envPrefix: "VITE_",
  plugins: [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
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
      vercel: {
        functions: {
          // Vercel supports up to nodejs22.x as of 2025.
          // nodejs24.x (Nitro 3 default) causes deployment failures.
          runtime: "nodejs22.x",
        },
      },
      // Security headers — applied to all routes
      routeRules: {
        "/**": {
          headers: {
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
            "Content-Security-Policy": CONTENT_SECURITY_POLICY,
          },
        },
      },
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
        { route: "/api/discover", handler: "./server/api/discover.ts" },
        { route: "/api/sol-price", handler: "./server/api/sol-price.ts" },
        { route: "/api/shield-health", handler: "./server/api/shield-health.ts" },
        { route: "/api/market-data-health", handler: "./server/api/market-data-health.ts" },
        { route: "/api/echo-stats", handler: "./server/api/echo-stats.ts" },
        { route: "/api/market-overview", handler: "./server/api/market-overview.ts" },
        { route: "/api/wallet/connect", handler: "./server/api/wallet/connect.ts" },
        { route: "/api/wallet/session", handler: "./server/api/wallet/session.ts" },
        { route: "/api/stars-webhook", handler: "./server/api/stars-webhook.ts" },
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
  css: { transformer: "lightningcss", postcss: { plugins: [] } },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      external: ["ccxt", "@walletconnect/sign-client", "@tonconnect/sdk", "node:crypto"],
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
