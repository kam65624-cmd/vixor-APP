---
Task ID: 1
Agent: main
Task: Fix Vixor Vercel 500 FUNCTION_INVOCATION_FAILED crash

Work Log:
- Read all critical server entry files: server.ts, start.ts, supabase clients, auth middleware
- Ran local `vite build` — discovered build FAILURE due to missing `src/shared/supabase/` directory
- Root cause: `start.ts` imports `@/shared/supabase/auth-attacher` but that directory didn't exist
- The actual supabase files were at `src/integrations/supabase/` but code referenced `@/shared/supabase/`
- Pulled from remote — found that remote had already added `src/shared/supabase/` with full implementations
- Resolved merge conflicts — `integrations/supabase/` is now re-export shims, `shared/supabase/` has canonical implementations
- Removed `.vercel/output/` from git tracking (build artifacts shouldn't be committed)
- Build now succeeds locally: `vite build` completes, server responds with 200 OK
- Verified no static imports to missing chunks in built output
- Server entry is now statically imported (remote fix) preventing Vercel code-splitting issues
- Pushed fix to origin/main — Vercel auto-deploy triggered

Stage Summary:
- Root cause: `src/shared/supabase/` directory was missing, causing `ERR_MODULE_NOT_FOUND` at build time
- This resulted in a broken Vercel deployment that crashed on cold start with FUNCTION_INVOCATION_FAILED
- Fix: Created re-export shims in `integrations/supabase/`, kept canonical implementations in `shared/supabase/`
- Server.ts now uses static import for `@tanstack/react-start/server-entry` (prevents Vercel chunk splitting)
- Build output verified: no missing chunk references, server boots and serves 200 OK locally
---
Task ID: 1
Agent: main
Task: Fix `createMiddleware is not a function` crash on Vercel

Work Log:
- Investigated `@tanstack/react-start` package: version 1.168.25 installed, `createMiddleware` exists and is properly exported from `@tanstack/start-client-core@1.170.12`
- Examined the build output `_ssr/index.mjs`: confirmed `createMiddleware` is defined at line 615 and exported as `a`
- Examined `_ssr/start-6fN4pgRM.mjs`: imports `{ a as createMiddleware } from "./index.mjs"`
- **ROOT CAUSE IDENTIFIED**: `fix-vercel-bundle.mjs` Step 2 (`fixSsrIndex`) converted dynamic `import()` calls to static `import * as __vixor_*__ from "./start-*.mjs"` in `_ssr/index.mjs`. This created a circular dependency: `index.mjs → static import → start-*.mjs → import createMiddleware from index.mjs`. In ESM, when `index.mjs` hasn't finished loading and `start-*.mjs` tries to import `createMiddleware`, the live binding resolves to `undefined`, causing `TypeError: createMiddleware is not a function`.
- Fixed `fix-vercel-bundle.mjs`: removed `fixSsrIndex` function and its call. Step 1 (`addNftTraceableImports`) is sufficient — it adds dynamic `import()` calls to the main `index.mjs` entry point for @vercel/nft tracing, which doesn't create circular deps.
- Pinned exact versions in `package.json` for TanStack packages to prevent version drift between local and Vercel
- Rebuilt project: build succeeds, no circular imports in output
- Simulated Vercel cold-start: `node -e "await import('./.vercel/output/functions/__server.func/index.mjs')"` loads successfully

Stage Summary:
- Root cause: `fix-vercel-bundle.mjs` Step 2 created ESM circular import, causing `createMiddleware` to be `undefined` at runtime
- Fix: Removed `fixSsrIndex` from `fix-vercel-bundle.mjs`, keeping only `addNftTraceableImports` and `fixNitroErrorHandler`
- Pinned `@tanstack/react-router` to `1.170.15`, `@tanstack/react-start` to `1.168.25`, `@tanstack/router-plugin` to `1.168.18`
- Local build + cold-start simulation both pass
