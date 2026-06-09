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
