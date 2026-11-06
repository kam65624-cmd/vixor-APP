# APP migration replay fixtures

`app-pre-migration-baseline.sql` is a byte-preserved copy of the APP's original schema bootstrap SQL recovered from Git history:

- Source commit: `9e213987d00bd2055be32c832507254ef5fe1380` (parent of `af223c2d6400cb4988d5f2281ad7e05594a1b2e6`)
- Original path: `20260607170345_9cb2747d-06d9-4226-9f98-309d3dd20570.sql`
- SHA-256: `f0312e55fb1f7036319c1342efe45821d0b9fa47100a0252d24bec903c2becb3`

It is a **test baseline fixture**, not a new production migration and not evidence that this historical SQL is present in the live Supabase migration ledger.

`supabase-platform-bootstrap.sql` supplies only the Supabase-managed roles, `auth.users`, `auth.uid()`, and `auth.role()` needed by the APP migrations on disposable vanilla PostgreSQL. It does not emulate Supabase Auth token issuance, Storage, Realtime, or production grants beyond those explicitly in the app SQL.
