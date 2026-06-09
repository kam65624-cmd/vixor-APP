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
      // Ensure all SSR chunks are included in the Vercel serverless function.
      // @vercel/nft doesn't trace imports within dynamically-loaded modules,
      // so code-split chunks in _ssr/ get excluded from the deployment.
      includeFiles: ["_ssr/**"],
      // Register API routes as Nitro event handlers.
      // These files use `defineEventHandler` from h3 instead of
      // the non-existent `createAPIFileRoute` from TanStack Start.
      routes: {
        "/api/check-alerts": "./src/routes/api/check-alerts.ts",
        "/api/generate-signals": "./src/routes/api/generate-signals.ts",
        "/api/telegram-webhook": "./src/routes/api/telegram-webhook.ts",
        "/api/migrate": "./src/routes/api/migrate.ts",
      },
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
  server: {
    host: "::",
    port: 8080,
  },
});
