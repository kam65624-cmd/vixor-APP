import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

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
            "Content-Security-Policy": [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://s3.tradingview.com/tv.js https://telegram.org",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://s3.tradingview.com",
              "connect-src 'self' https://*.supabase.co https://api.twelvedata.com https://api.binance.com https://api.telegram.org https://finnhub.io https://api.finnhub.io wss://*.supabase.co https://s3.tradingview.com https://*.tradingview.com https://public-api.birdeye.so https://mainnet.helius-rpc.com https://api.twitter.com https://api.dexscreener.com https://lunarcrush.com https://api.lunarcrush.com",
              "frame-ancestors 'self' https://web.telegram.org https://t.me",
            ].join("; "),
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
        { route: "/api/copilot-stream", handler: "./server/api/copilot-stream.ts" },
        { route: "/api/discover", handler: "./server/api/discover.ts" },
        { route: "/api/discover/scan", handler: "./server/api/discover/scan.ts" },
        { route: "/api/sol-price", handler: "./server/api/sol-price.ts" },
        { route: "/api/dexscreener", handler: "./server/api/dexscreener.ts" },
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
