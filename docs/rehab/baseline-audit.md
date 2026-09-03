# VIXOR Baseline Audit — Day 1

Date: 2026-09-03
Branch: rehab/baseline
Commit baseline: d1cde8c
Repository: https://github.com/kam65624-cmd/vixor-APP
Production reference: https://vixor-app.vercel.app/

## 1. Stack Confirmation

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | TanStack Start | 1.168.25 | File-based routing + server functions |
| Router | React Router (TanStack) | 1.170.15 | Route conventions under `src/routes/` |
| UI | Tailwind CSS | 4.2.1 | `@tailwindcss/vite` plugin |
| Components | shadcn/ui + Radix | latest | CVA, dialog, drawer, tabs, etc. |
| State | TanStack Query | 5.83.0 | `useQuery`/`useMutation` patterns |
| State | Zustand | 5.0.14 | Lightweight client state |
| Forms/Validation | Zod | 4.4.3 | Server fn validators + schemas |
| Runtime | Node | >=20 | `.node-version` present |
| Package Manager | pnpm | 9.15.0 | `packageManager` field in package.json |
| Build | Vite | 7.3.1 | `vite build` with post-step `scripts/fix-vercel-bundle.mjs` |
| Test | Vitest | 2.1.9 | Unit + component tests |
| Backend | Nitro | 3.0.260603-beta | Server API under `server/api/` |
| Database | Supabase | 2.107.0 | Auth, Postgres, Storage, Edge Functions |
| Auth | Supabase Auth + JWT | — | Wallet sessions via JWT (7-day TTL) |
| AI/LLM | Vercel AI SDK | 6.0.224 | `@ai-sdk/google`, `@ai-sdk/openai` |
| Charts | lightweight-charts + TradingView widgets + recharts | — | |
| Wallets | Solana + EVM | — | `@solana/web3.js`, `wagmi`, `viem`, `ethers` |
| Monitoring | Sentry | 10.63.0 | `@sentry/react` |
| Analytics | Mixpanel | 2.80.0 | Browser SDK, no-op if token missing |

## 2. Commands

| Command | Purpose | Script |
|---------|---------|--------|
| `pnpm dev` | Local dev server | `vite dev` |
| `pnpm build` | Production build | `vite build && node scripts/fix-vercel-bundle.mjs` |
| `pnpm build:dev` | Dev build | `vite build --mode development` |
| `pnpm preview` | Preview build | `vite preview` |
| `pnpm lint` | Lint | `eslint src/ server/` |
| `pnpm typecheck` | Type check | `tsc --noEmit` |
| `pnpm format` | Format | `prettier --write .` |
| `pnpm prepare` | Git hooks | `husky` |

Test command not explicitly defined in package.json scripts. Vitest is installed and configured; tests are run via `vitest` directly or through workspace scripts if present.

## 3. Environment Variables

Source: `.env.example`

| Variable | Purpose | Client-side? | Risk |
|----------|---------|--------------|------|
| `SUPABASE_URL` | Supabase project URL | No (server) | Low |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | **Server-only** | **High** — must never be exposed to client |
| `SUPABASE_ANON_KEY` | Supabase anon key | Yes (via Vite expose) | Medium |
| `VITE_SUPABASE_URL` | Client Supabase URL | Yes | Low |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client Supabase key | Yes | Medium |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | No (server) | High |
| `VITE_TELEGRAM_BOT_USERNAME` | Telegram bot username | Yes | Low |
| `TELEGRAM_WEBHOOK_SECRET` | Webhook verification | No (server) | Medium |
| `TWELVEDATA_API_KEY` | Market data API key | No (server) | Medium |
| `FINNHUB_API_KEY` | Market data API key | No (server) | Medium |
| `CRON_SECRET` | Cron job auth | No (server) | Medium |
| `ENABLE_PAPER_TRADING` | Paper trading toggle | Yes | Low |
| `ONEINCH_API_KEY` | DEX aggregator API key | No (server) | Medium |

Additional variables referenced in code but not in `.env.example`:
- `ADMIN_API_KEY` — admin API key (server)
- `VIXOR_ADMIN_IDS` — comma-separated admin user IDs (server)
- `VITE_MIXPANEL_TOKEN` — Mixpanel token (client)
- `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` — Redis (server)

## 4. Repository Structure Summary

```
src/
  routes/                  # TanStack Start file-based routes
    _authenticated/        # Protected routes
      _discover/           # Discovery feed
      _hunt/               # Hunter/verification/radar/alpha/whales
      _shield/             # Security scanner/trust/exposure/alerts
      _analyze-page/       # Analysis upload/preview
      _daily-loop/         # Daily loop with streak tracking
      _settings/           # User settings
      _trade-desk/         # Trade desk + execution
      _swap/               # Token swap
    auth.tsx               # Auth entry
  domains/                 # Business logic domains
    moxi/                  # MOXI persona, agents, prompts
    user/                  # User auth, Telegram verification
    wallet/                # Wallet connection, sessions, adapters
    trading/               # Trading gateway, adapters
    shield/                # Trust score, rugcheck, goplus
    risk-governor/         # Risk rules and engine
    signal-tracking/       # Signal lifecycle, transitions
    trades/                # Trade history, performance
    daily-loop/            # Daily loop logic
    watchlist/             # Watchlist
    notes/                 # Notes
    strategy/              # Strategy runtime
  components/
    vixor/                 # App-specific components
    ui/                    # shadcn/ui primitives
  shared/
    supabase/              # Supabase client + types
    data/                  # Data accessors
    market-data/           # Market data providers
    llm/                   # LLM provider abstraction
    api-keys/              # Admin guard
    observability/         # Error handling, logging
    i18n/                  # Translations (en, ar)
packages/
  vixor-gamification/      # XP calculation engine
  vixor-auth/              # Auth types
  persona-config/          # Persona skins config
server/
  api/                     # Nitro API endpoints
  _security.ts             # CORS, rate limiting, auth helpers
supabase/
  migrations/              # Database migrations
archive/
  domains/                 # Legacy domains (paper-trading, experiment, arbitrage)
docs/
  rehab/                   # Baseline documentation (new)
```

## 5. Current Behavior Notes

- The authenticated home (`src/routes/_authenticated/index.tsx`) renders a dashboard with live ticker, MOXI quick actions, and `MoxiCharacter3D`.
- MOXI is currently the only fully implemented persona with a user-customizable avatar system including `nftTokenId`.
- The trading gateway supports both paper trading (DummyAdapter) and real exchange execution (Binance, Bybit, OKX, Exness) via encrypted credentials.
- Wallet connection flow creates JWT sessions stored in Supabase `wallet_sessions`.
- Security: admin guard uses `VIXOR_ADMIN_IDS` env var; API key validation accepts key from header or query string.
- Rate limiting in `server/api/_security.ts` is in-memory and explicitly marked as deprecated for Vercel serverless.

## 6. Known Issues and Blockers

- **VIX legacy copy**: Multiple route files contain "VIX micro-moment" stat blocks that need classification and eventual removal/replacement.
- **3D/ floating components**: `MoxiCharacter3D.tsx` and `FloatingCopilot.tsx` violate approved design constraints.
- **NFT references**: `nftTokenId` field in persona types and DB schema.
- **Real execution path**: `executeTrade` server function can execute real trades if exchange credentials are configured.
- **Admin key via query string**: `validateAdminKey` accepts `admin_key` from query parameters, which is a security risk.
- **In-memory rate limiter**: Deprecated, does not work on Vercel serverless.
- **Duplicated level calculation**: `profile.tsx` calculates level locally instead of using the shared `calculateLevelFromXP`.
- **Zod v4**: Using a pre-release major version; compatibility should be monitored.

## 7. Production vs Repository

- Production URL: `https://vixor-app.vercel.app/`
- Current branch: `rehab/baseline` from `origin/main` HEAD `d1cde8c`
- No production changes made during baseline.
- Production should be treated as reference only; rehab work proceeds on `rehab/baseline`.
