
## Scope

Replace mock data with real backend, add real auth (email/password + Telegram WebApp), and run real AI analysis on uploaded charts. Drop the "match the screenshot" item — no screenshot was attached; ping me with one later and I'll do a pixel pass.

## 1. Database (one migration)

Tables in `public`, all with RLS scoped to `auth.uid()` + GRANTs to `authenticated` + `service_role`:

- `profiles` — `id` (FK auth.users), `telegram_id`, `username`, `display_name`, `avatar_url`, `referral_code` (unique), `referred_by`, `streak_days`, `last_active_at`
- `points_balances` — `user_id` PK, `balance` int, `lifetime_earned` int
- `points_transactions` — `user_id`, `delta`, `reason` (enum: signup_bonus, analysis_cost, pack_purchase, referral_bonus, daily_streak, premium_grant), `metadata` jsonb
- `point_packs` — catalog: `id`, `name`, `points`, `price_cents`, `bonus_points`, `is_active` (seeded, anon SELECT)
- `premium_plans` — catalog: `id`, `name`, `price_cents`, `interval`, `features` jsonb (seeded, anon SELECT)
- `premium_subscriptions` — `user_id`, `plan_id`, `status`, `current_period_end`
- `analyses` — `id`, `user_id`, `pair`, `timeframe`, `image_url`, `status` (queued/processing/complete/failed), `recommendation` (BUY/SELL/WAIT), `confidence`, `entry`, `stop_loss`, `take_profit` (numeric[]), `rr`, `pattern`, `reasons` (text[]), `scenarios` jsonb, `management` text[], `raw_ai_response` jsonb, `created_at`
- `notifications` — `user_id`, `title`, `body`, `type`, `read_at`

Storage bucket `charts` (private) — users upload chart images, signed URLs for read.

Trigger: on `auth.users` insert → create profile + points_balances (200 free points) + signup_bonus tx + unique referral code.

## 2. Auth

- Enable email/password (auto-confirm on; this is a Telegram Mini App, no inbox UX needed).
- Build `/auth` route (sign in / sign up tabs).
- Add `_authenticated` layout (managed pattern; redirects to `/auth`). Move all 12 existing screens under it.
- Telegram WebApp: detect `window.Telegram.WebApp.initData` on `/auth`. Server fn validates HMAC against `TELEGRAM_BOT_TOKEN` secret, creates/links auth user, returns a session token (admin `generateLink` → magic link exchange). Falls back to email/password outside Telegram.
- Root: `onAuthStateChange` listener invalidates router on SIGNED_IN/OUT/USER_UPDATED.

## 3. Server functions (`src/lib/*.functions.ts`)

- `getMe` — profile + balance + premium status + streak
- `getPointPacks`, `getPremiumPlans` — catalog reads
- `purchasePack({packId})` — atomic: deduct nothing, credit points, log tx (no payments yet; stubbed instant grant)
- `subscribePremium({planId})` — instant grant, sets current_period_end +30d
- `createAnalysis({imageBase64, pair?, timeframe?})` — uploads to storage, inserts queued row, kicks off AI, returns analysisId
- `getAnalysis({id})`, `listAnalyses({limit, offset})`
- `getNotifications`, `markNotificationRead`
- `claimReferral({code})`

All use `requireSupabaseAuth` middleware. Bearer attacher already wired.

## 4. AI analysis

Lovable AI Gateway via AI SDK (`@ai-sdk/openai-compatible` + `ai`), model `google/gemini-2.5-pro` (vision). 

`runAnalysis.server.ts`: takes image URL, calls Gemini with structured output (Zod schema for recommendation/confidence/entry/SL/TP[3]/RR/pattern/reasons[3-5]/scenarios{conservative,balanced,aggressive}/management[]). Writes results back to `analyses` row.

`createAnalysis` invokes it inline (await; fast enough for Gemini Flash, but use Pro for vision quality). Frontend polls `getAnalysis` every 800ms while status≠complete — replaces the fake 4-step timer with real progress.

Cost: 10 points per analysis, deducted on success. Premium users: free.

## 5. Frontend wiring

Replace all `mockUser`, `mockAnalyses`, `mockPacks`, etc. imports:
- `/` (Dashboard) → `useSuspenseQuery(getMe + listAnalyses(5))`
- `/analyze` → real upload + `createAnalysis` mutation → navigate to `/analysis/$id`
- `/analysis/$id` → polled `getAnalysis`; show real chart image + real AI levels overlay
- `/history` → paginated `listAnalyses`
- `/premium` → real plans + active sub state
- `/referral` → real code from profile, real referral count
- `/profile`, `/notifications`, `/settings` → real data
- `/charts`, `/lot-calculator` → keep as-is (no backend needed)

Keep `vixor-mock.ts` only for type exports; delete data exports.

## 6. Out of scope (this pass)

- Real chart-data API for `/charts` (still uses mock symbols)
- Stripe payments (pack/premium buttons grant instantly)
- Push notifications delivery (only DB rows)
- Pixel-perfect screenshot review (need the screenshot)

## Technical notes

- Storage path: `charts/{userId}/{analysisId}.{ext}`, RLS: users read own only, signed URLs from server fn
- Atomic point ops via Postgres function `spend_points(user_id, amount, reason, metadata)` to avoid race conditions
- Telegram HMAC verification per Telegram WebApp spec (sorted query string, secret = HMAC_SHA256("WebAppData", botToken))
- Public-route landing: `/auth` is public; everything else under `_authenticated/`
