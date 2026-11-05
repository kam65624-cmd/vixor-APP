# Gate 5 Recovery — Evidence Register

Baseline: `main` at `e746c4087823bb205cafc7988c54ae4c13ea3427`.
Recovery branch: `stage2/gate5-payment-rls-on-recovery-20261105` (based on PR #38 head `96243ee340ad0ecf6ef8a597c2d42d16c80b9b11`).
PR: #41 (Draft; not merged). It preserves PR #38's Gate 5 recovery and adds the unique payment-table RLS hardening from PR #26.
This register is append-only. Evidence below is from files fetched directly from the baseline commit and proposed branch. No production database or secrets were accessed.

## G5-01 — points_balances client mutation
- Status: **Confirmed design defect; isolated PostgreSQL 16 regression passed in CI run #447**.
- Evidence: `supabase/migrations/20260803000001_add_commerce_tables.sql` creates INSERT and UPDATE policies for `points_balances` without a role target, using `auth.uid() = user_id`. These are user-writable policies, not service-role-only policies.
- Impact: an authenticated user can potentially set their own balance/lifetime totals if table grants permit those operations.
- Remediation on PR #41: drop the old write policies, add a `TO service_role` all-operation policy, revoke INSERT/UPDATE/DELETE from anon/authenticated, retain authenticated SELECT.
- Verification: new PostgreSQL 16 suite attempts authenticated INSERT and UPDATE and expects privilege denial. CI run #447 passed the isolated PostgreSQL 16 regression.

## G5-02 — execute_signal_transition privilege boundary
- Status: **Confirmed design defect**.
- Evidence: `supabase/migrations/20260811000001_execute_signal_transition_rpc.sql` declares the function SECURITY DEFINER but does not set a fixed search_path and does not revoke default PUBLIC execution or grant only to service_role.
- Impact: direct callers may invoke a privileged state-transition routine and control parameters such as actor/source unless execution is restricted.
- Remediation on PR #31: replace ROW_COUNT handling with bigint, set fixed search_path, revoke PUBLIC/anon/authenticated execution, grant service_role only.
- Verification: PostgreSQL 16 suite checks authenticated lacks EXECUTE and service_role retains it; CI run #447 passed.

## G5-05 — Telegram identity trust boundary
- Status: **Confirmed**.
- Evidence: baseline `src/domains/user/functions.ts` exports `syncTelegramProfile`, accepts `telegramId` as client input and writes it to `profiles.telegram_id` using the admin client. Baseline AppShell passes `initDataUnsafe.user.id`. Baseline profile UPDATE policy permits own-row updates without column protection. Verified `linkTelegramAccount` already validates signed Telegram initData.
- Impact: client-controlled identity data could overwrite the Telegram identity used for account association/payment.
- Remediation on PR #41: remove sync function and caller; keep signed initData linking; reject cross-account collisions and silent relinking; add DB trigger plus column-level INSERT/UPDATE grants that explicitly exclude telegram_id.
- Verification: first PostgreSQL run showed the trigger-only defense did not block the test update; this was not accepted as a pass. Added column-level privilege revocation/grants and a regression assertion that ordinary profile display-name updates still work. Retest passed in CI run #447.

## G5-08 — migration-chain reproducibility
- Status: **Isolated PostgreSQL 16 replay verified; Production ledger remains Not Verified**.
- Evidence: no clean bootstrap of the complete current migration directory has been run in this recovery environment. The previous session's 36/40 result is not treated as proof.
- Impact: production schema may differ from repository migrations; applying a release may fail or behave differently.
- Verification: complete lexical migration replay passed **41/41** on a fresh PostgreSQL 16 database in CI run #447, with schema assertions. A separate read-only comparison of the Production migration ledger/schema remains unavailable. No production migration is authorized.

## G5-09 — P0004 exception handling
- Status: **Confirmed PostgreSQL handler constraint; project test reproduction pending CI**.
- Evidence: baseline `execute_signal_transition` raises SQLSTATE `P0004` for stale optimistic-lock conflicts. PostgreSQL PL/pgSQL `WHEN OTHERS` excludes assertion-failure class exceptions; generic handlers must not be used as the only catcher for P0004.
- Impact: generic exception handling may fail to translate a normal concurrency conflict, allowing it to escape as an unhandled error.
- Remediation on PR #31: regression test catches `SQLSTATE 'P0004'` explicitly.
- Verification: explicit SQLSTATE regression ran in the isolated PostgreSQL suite; CI run #447 passed.

## Telegram Stars payer binding
- Status: **Implemented on PR #41; isolated CI passed; Production not verified**.
- Baseline gap: payment rows and the atomic RPC were not bound to Telegram's actual payer ID; webhook handling passed successful_payment fields but ignored `message.from.id`.
- PR #41: stores the verified profile Telegram ID on each new order; pre-checkout compares `query.from.id`; successful-payment webhooks pass `message.from.id`; the six-argument RPC compares payer ID to the stored order identity.
- Legacy five-argument RPC is dropped by the new migration so old webhook code fails closed after migration.
- Existing pending orders without a payer ID intentionally cannot be fulfilled until reconciled/expired.
- Required tests: wrong payer rejected; correct payer confirmed; redelivery duplicate does not double-credit; credit failure rolls back order confirmation and entitlement.

## Payment table client-write isolation
- PR #41 adds migration `20261028000000_lock_down_payment_client_writes.sql`, removing client write policies while retaining own-row SELECT.
- PostgreSQL 16 regression asserts authenticated cannot UPDATE/DELETE/INSERT payment rows and service_role can still update.
- CI run #447: payment RLS regression passed.

## CI evidence — PR #41
- GitHub Actions run #447 (`41982419542`) completed successfully: lint/typecheck, tests, payment RLS, Stars/Gate 5 PostgreSQL suite, full migration replay, and build.
- Full migration replay: 41/41 passed in isolated PostgreSQL 16.

## Safety / deployment boundary
- No merge, deploy, Production database mutation, migration execution, or secret changes performed.
- PR #41 remains Draft; Production migration ledger/schema is still Not Verified.
