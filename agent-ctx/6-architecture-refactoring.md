# Task 6 — Architecture Refactoring Agent

## Task
Refactor Vixor from feature-based to domain-based architecture.

## Summary
Completed the domain-based architecture refactoring by updating ALL import paths across the entire project from old locations to new domain/shared paths. The domain directories and files were already created by previous agents; this task focused on the critical remaining import path migration.

## What Was Done

1. **Updated 90+ files** with old import paths to use new domain/shared paths
2. **Converted old files** to backward-compatible re-export barrels
3. **Moved migrate.server.ts** to shared/ with updated internal imports
4. **Updated server.ts** to import from shared/ instead of lib/
5. **Updated shared/index.ts** barrel to include all shared exports
6. **Updated comments** in shared files to reference new paths

## Import Path Migrations
- `@/lib/utils` → `@/shared/utils` (46 files)
- `@/lib/i18n` → `@/shared/i18n` (15 files)
- `@/integrations/supabase/*` → `@/shared/supabase/*` (8 files)
- `@/hooks/*` → `@/shared/hooks/*` (21 files)
- `@/server/*` → domain/server paths (4 files)
- `@/lib/telegram` → `@/shared/telegram` (2 files)
- `@/lib/auth.functions` → `@/domains/user/auth.functions` (1 file)
- `@/lib/analysis/engine` → `@/domains/analysis/engine/engine` (1 file)

## Verification
- Zero remaining active imports from old paths
- All backward-compat re-export barrels in place
- All domain files use only `@/domains/*`, `@/shared/*`, or external packages
