# VIXOR × QuantDinger — استراتيجية إعادة الاستخدام والتكامل

> **المستند:** خطة استراتيجية لاست corásticoage الأساسيات الجاهزة والشغالة من QuantDinger في VIXOR MASTER V2 بدل بنائها من جديد
> **التاريخ:** 2026-06-18
> **المراجع:**
>
> - تقرير جرد QuantDinger الكامل: `/home/z/my-project/audit/quantdinger_inventory.md` (1,695 سطراً)
> - تقرير تدقيق VIXOR الحالي: `/home/z/my-project/audit/vixor_current_state.md` (718 سطراً)
> - مستودع QuantDinger: `/home/z/my-project/audit/QuantDinger/` (Apache-2.0)
> - ترخيص إعادة الاستخدام: مسموح مع شرط إزالة علامة QuantDinger التجارية في التوزيعات المشتقة (per `TRADEMARKS.md §5`)

---

## 1. الخلاصة التنفيذية (Executive Summary)

QuantDinger هو منصة **Python/Flask + Vue + Postgres + Redis** تطرح نفسها كنظام "AI Quant OS" متكامل، صدر الإصدار V3.1.0 منه مع **AI Agent Gateway** و **MCP server** و **experiment orchestration layer**. الكود مفتوح المصدر برخصة Apache-2.0، ومكتوب بأسلوب احترافي (safe_exec sandbox ثلاثي الطبقات، capability-scoped tokens، circuit breaker للـ data sources، backtest engine بـ 5K LOC).

VIXOR MASTER V2 هو تطبيق **TanStack Start (TypeScript/React SSR) + Supabase** يطالب بنفس الطموح (Bloomberg Professional للـ SMC/ICT traders)، لكنه **معاق تشغيلياً** بسبب:

- 13 متغير بيئة مفقود محلياً (Vercel production لديه معظمها)
- `deep-no-op Proxy` يبتلع كل أخطاء Supabase بصمت
- `newsMap` بأخبار وهمية مدمجة في المحرك تعرض للمستخدم كأنها تحليل حقيقي
- Layout محدود بـ `max-w-4xl` (896px) — ضيق جداً لتطبيق تداول
- صفحات some features مكسورة (settings toggles, alert cron, dead code paths)

### القرار الاستراتيجي

**لا يمكن نقل كود QuantDinger مباشرة إلى VIXOR** لأن الـ stack مختلف جذرياً (Python/Flask vs TypeScript/TanStack). لكن **يمكن است corósticoage:**

1. **الـ patterns المعمارية** (Agent Gateway، capability tokens، SSE progress، idempotency) — تُعاد كتابتها بـ TypeScript
2. **الـ safe_exec sandbox** — يُعاد كتابته في Node.js `vm2` أو `isolated-vm` مع نفس الـ 3 طبقات
3. **الـ backtest engine logic** — يُعاد كتابتها بـ TypeScript مع نفس الـ candle-path simulation
4. **الـ strategy DSL** (`IndicatorStrategy` + `ScriptStrategy`) — يُعاد تصميمه لـ JavaScript/TypeScript
5. **الـ circuit breaker + rate limiter + cache** — يُعاد كتابتها بـ TypeScript (سهلة)
6. **الـ broker adapters** — تُعاد كتابتها لـ 4 exchanges أساسية (Binance, OKX, Bybit, Coinbase) — لا تحتاج ccxt
7. **الـ multi-provider LLM service** — يُعاد كتابته بـ TypeScript (7 providers)
8. **الـ multi-channel notifier** — يُعاد كتابته بـ TypeScript (Telegram + Email + Webhook)
9. **الـ credential encryption** — يُستبدل بـ `crypto.createCipheriv` في Node.js
10. **الـ experiment orchestration** — يُعاد كتابته بـ TypeScript

### ما الذي يبقى في VIXOR كما هو (لا نلمسه من QuantDinger)

- ✅ **محرر التحليل SMC/ICT المحلي** (VIXOR's `engine.ts` 1360 سطر) — أفضل من QuantDinger الذي لا يطرح SMC أصلاً
- ✅ **Debate Engine (4 agents)** — VIXOR ينفرد بها
- ✅ **Chart Truth Layer** — VIXOR ينفرد بها
- ✅ **Telegram WebApp auth (initData HMAC)** — VIXOR شغاله صح
- ✅ **Asset Registry** — VIXOR شغاله
- ✅ **i18n + RTL** — VIXOR شغاله
- ✅ **Design system (OKLCH + Bloomberg aesthetic)** — VIXOR شغاله

---

## 2. مصفوفة Build vs Reuse vs Keep (المصفوفة الاستراتيجية)

لكل ميزة رئيسية، نحدد: هل نبنيها من الصفر (BUILD)، أم نعيد استخدامها من QuantDinger (REUSE-PORT)، أم نحتفظ بما لدينا في VIXOR (KEEP)?

| #   | الميزة                                   | الحالة في VIXOR                          | الحالة في QuantDinger                                                  | القرار                                                          | الجهد | الأولوية |
| --- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------- | ----- | -------- |
| 1   | **Safe code execution sandbox**          | غير موجودة                               | `safe_exec.py` 470 LOC، 3 طبقات                                        | **REUSE-PORT**                                                  | متوسط | P0       |
| 2   | **Backtest engine**                      | غير موجودة                               | `backtest.py` 4974 LOC، MTF precision                                  | **REUSE-PORT** (core only ~2000 LOC)                            | عالي  | P1       |
| 3   | **Strategy DSL (IndicatorStrategy)**     | غير موجودة                               | `strategy_script_runtime.py` + `indicator_params.py` ~600 LOC          | **REUSE-PORT**                                                  | متوسط | P1       |
| 4   | **Agent Gateway (capability tokens)**    | Copilot agent فقط                        | `agent_auth.py` + `agent_jobs.py` 810 LOC                              | **REUSE-PORT** (pattern)                                        | متوسط | P2       |
| 5   | **SSE progress streaming for jobs**      | غير موجودة                               | `agent_jobs.py:stream_progress` + SSE endpoint                         | **REUSE-PORT** (pattern)                                        | متوسط | P2       |
| 6   | **Idempotency-Key with DB unique index** | غير موجودة                               | Postgres partial unique index pattern                                  | **REUSE-PORT** (SQL only)                                       | منخفض | P2       |
| 7   | **Multi-provider LLM service**           | ZAI SDK فقط                              | `llm.py` 629 LOC، 7 providers                                          | **REUSE-PORT**                                                  | منخفض | P1       |
| 8   | **Multi-channel notifier**               | Telegram فقط                             | `signal_notifier.py` 912 LOC، 6 channels                               | **REUSE-PORT**                                                  | متوسط | P1       |
| 9   | **Circuit breaker + rate limiter**       | Hybrid cache فقط                         | `circuit_breaker.py` + `rate_limiter.py` + `cache_manager.py` ~600 LOC | **REUSE-PORT**                                                  | منخفض | P0       |
| 10  | **Credential encryption (Fernet)**       | غير موجودة                               | `credential_crypto.py` 50 LOC                                          | **REUSE-PORT** (Node `crypto`)                                  | منخفض | P0       |
| 11  | **Crypto exchange adapters (REST)**      | غير موجودة                               | 11 exchanges في `live_trading/`                                        | **REUSE-PORT** (4 exchanges فقط: Binance, OKX, Bybit, Coinbase) | عالي  | P2       |
| 12  | **Experiment orchestration (AI tuning)** | غير موجودة                               | `app/services/experiment/` ~700 LOC                                    | **REUSE-PORT**                                                  | متوسط | P2       |
| 13  | **Market regime detector**               | غير موجودة                               | `experiment/regime.py` 170 LOC، 5 regimes                              | **REUSE-PORT**                                                  | منخفض | P2       |
| 14  | **Strategy scoring service**             | غير موجودة                               | `experiment/scoring.py` 140 LOC                                        | **REUSE-PORT**                                                  | منخفض | P2       |
| 15  | **MCP server**                           | غير موجودة                               | `mcp_server/` 306 LOC                                                  | **SKIP** (لأن VIXOR لا يحتاج MCP)                               | —     | —        |
| 16  | **SMC/ICT analysis engine**              | `engine.ts` 1360 LOC ✅                  | غير موجودة                                                             | **KEEP** (VIXOR متفوق)                                          | —     | —        |
| 17  | **Debate Engine (4 agents)**             | `debate.engine.ts` ✅                    | غير موجودة                                                             | **KEEP**                                                        | —     | —        |
| 18  | **Chart Truth Layer**                    | `chart-truth/` ✅                        | غير موجودة                                                             | **KEEP**                                                        | —     | —        |
| 19  | **Chart Vision (VLM)**                   | `chart-vision.ts` ✅ (يحتاج ZAI_API_KEY) | غير موجودة                                                             | **KEEP + FIX ENV**                                              | —     | —        |
| 20  | **Telegram WebApp auth**                 | `auth.functions.ts` ✅                   | غير موجودة                                                             | **KEEP + FIX ENV**                                              | —     | —        |
| 21  | **Risk Governor**                        | `risk-governor/` ✅ (غير متصل)           | غير موجودة                                                             | **KEEP + WIRE**                                                 | —     | —        |
| 22  | **Paper Trading engine**                 | `paper-trading/` ✅ (gated)              | `paper_orders` table                                                   | **KEEP + UNGATE**                                               | —     | —        |
| 23  | **Memory store (user_memories)**         | `memory/store.ts` ✅                     | `analysis_memory` table                                                | **KEEP**                                                        | —     | —        |
| 24  | **Event bus + persistence**              | `events/orchestrator.ts` ✅              | غير موجودة                                                             | **KEEP**                                                        | —     | —        |
| 25  | **Tool registry**                        | `tool-registry/` ✅ (2 tools)            | غير موجودة                                                             | **KEEP + EXPAND**                                               | —     | —        |
| 26  | **UI/UX (shadcn + custom)**              | 38 + 10 components ✅                    | Vue (private repo)                                                     | **KEEP + FIX**                                                  | —     | —        |
| 27  | **i18n + RTL**                           | ✅ (EN + AR)                             | Vue i18n (غير متوفر)                                                   | **KEEP**                                                        | —     | —        |
| 28  | **News integration**                     | أخبار وهمية مدمجة! ❌                    | Finnhub + RSS في `news.py`                                             | **REUSE-PORT** (Finnhub pattern)                                | منخفض | **P0**   |
| 29  | **Database migrations framework**        | 12 SQL files يدوية                       | `init.sql` يدوي                                                        | **KEEP**                                                        | —     | —        |
| 30  | **Pricing/payment (USDT-TRC20)**         | Telegram Stars فقط                       | `usdt_payment_service.py` 830 LOC                                      | **REUSE-PORT** (later)                                          | عالي  | P3       |
| 31  | **OAuth (Google/GitHub)**                | غير موجودة                               | `oauth_service.py` 715 LOC                                             | **REUSE-PORT** (later)                                          | متوسط | P3       |

### الإحصائيات

- **KEEP** (لا نلمسه): 14 ميزة — VIXOR متفوق فيها أو لا يحتاجها
- **REUSE-PORT** (نقل من QuantDinger): 16 ميزة — جوهر القيمة المضافة
- **SKIP** (لا نحتاجها): 1 ميزة (MCP server)
- **FIX** (إصلاح في VIXOR): 4 ميزات (env vars، deep-no-op، layout، news)

---

## 3. خطة التنفيذ على 4 مراحل (Phased Roadmap)

### المرحلة 0: إصلاح VIXOR الحالي قبل أي نقل (1-2 أيام) — **P0 CRITICAL**

**لماذا أولاً؟** لا فائدة من نقل modules جديدة على قاعدة مكسورة. هذه الإصلاحات تحل 70% من شكاوى المستخدم فوراً.

#### 0.1 إصلاح متغيرات البيئة

- **ملف:** `.env` (local) + Vercel project settings
- **المتغيرات المطلوبة (13):**
  ```
  SUPABASE_URL=https://lrbgxrfvjxaixtzkutxn.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<from-supabase-dashboard>
  SUPABASE_ANON_KEY=<from-supabase-dashboard>
  SUPABASE_PUBLISHABLE_KEY=<same-as-anon>
  VITE_SUPABASE_URL=<same-as-SUPABASE_URL>
  VITE_SUPABASE_PUBLISHABLE_KEY=<same-as-anon>
  TELEGRAM_BOT_TOKEN=<from-BotFather>
  VITE_TELEGRAM_BOT_USERNAME=VixorAIBot
  TELEGRAM_WEBHOOK_SECRET=<random-32-bytes>
  TWELVEDATA_API_KEY=<from-twelvedata>
  FINNHUB_API_KEY=<from-finnhub>
  CRON_SECRET=<random-32-bytes>
  ENABLE_PAPER_TRADING=true
  ENABLE_DEBATE_ENGINE=true
  ```
- **التحقق:** `node scripts/qa-test-runner.cjs` يجب أن ينتقل من 52→58 pass

#### 0.2 استبدال `deep-no-op Proxy` بـ fail-fast

- **ملف:** `src/shared/supabase/client.ts:48-61`
- **التغيير:** حذف `deepNoOp()`، استبدالها بـ:
  ```typescript
  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  ```
- **لماذا:** المستخدم يرى "No data" بدلاً من رسالة خطأ واضحة. هذا هو السبب الجذري لشكوى "data display not smooth/professional".

#### 0.3 حذف `newsMap` الوهمية من المحرك

- **ملف:** `src/domains/analysis/engine/engine.ts:~1080-1116`
- **التغيير:** حذف الـ `newsMap` كاملاً، استبدالها بـ:
  ```typescript
  // Fetch real news from Finnhub (already implemented in market/functions.ts)
  const news = await getMarketNews(pair);
  ```
- **لماذا:** أخبار وهمية تعرض للمستخدم كتحليل حقيقي — هذا يضر بثقة المستخدم.

#### 0.4 إصلاح Layout (الـ dimensions من الأعلى)

- **ملف:** `src/components/vixor/AppShell.tsx:99, 124, 200`
- **التغيير:**
  ```typescript
  // قبل
  <header className="max-w-md lg:max-w-4xl mx-auto">
  <main className="max-w-md lg:max-w-4xl mx-auto">
  <nav className="max-w-md lg:max-w-4xl mx-auto">

  // بعد
  <header className="w-full">  // full-width header
  <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">  // 1280px content
  <nav className="fixed bottom-0 left-0 right-0 lg:hidden">  // mobile only
  ```
- **إضافة tablet breakpoint:**
  ```css
  /* styles.css */
  @media (min-width: 768px) and (max-width: 1023px) {
    /* tablet */
  }
  ```
- **Desktop sidebar rail** (لـ lg+): شريط جانبي 64px بـ icons، يحل مشكلة "الصفحات مش مربوطه بشكل سلس"

#### 0.5 إصلاح cron للم alerts

- **ملف:** `vercel.json`
- **التغيير:**
  ```json
  {
    "crons": [
      { "path": "/api/generate-signals", "schedule": "0 0 * * *" },
      { "path": "/api/check-alerts", "schedule": "*/5 * * * *" }
    ]
  }
  ```
- **لماذا:** price alerts لا تطلق أبداً بدون هذا الـ cron.

#### 0.6 حذف الـ dead code في chart-intelligence

- **ملفات:**
  - `src/domains/chart-intelligence/chart-context.ts:133` — حذف `formatExtractionFailureMessage`
  - `src/domains/analysis/server/run-analysis.ts:36` — حذف `ChartExtractionRefusedError`
- **لماذا:** الكود الميت يربك المطورين ويخفي الأخطاء الحقيقية.

#### 0.7 حذف الملفات المكررة بـ ` (1)` suffix

- **ملفات:** ~80 ملف في `/home/z/my-project/* (1).*`
- **لماذا:** تربك الـ IDE وتبدو غير احترافية.

#### 0.8 إصلاح `_authenticated/route.tsx` error swallowing

- **ملف:** `src/routes/_authenticated/route.tsx:15-23`
- **التغيير:**
  ```typescript
  // قبل
  catch (e) { navigate({ to: "/auth" }); }

  // بعد
  catch (e) {
    if (e?.code === 401 || e?.code === 403) navigate({ to: "/auth" });
    else throw e;  // propagate to error boundary
  }
  ```
- **لماذا:** أي خطأ server-side يسجل خروج المستخدم — يجعل التطبيق يبدو غير مستقر.

#### 0.9 إصلاح settings toggles

- **ملف:** `src/routes/_authenticated/settings.tsx:51-55`
- **التغيير:** ربط الـ toggles بـ localStorage flags فعلياً، أو حذفها.

**انتقال للمرحلة 1 فقط بعد نجاح كل اختبارات المرحلة 0.**

---

### المرحلة 1: نقل الـ infrastructure layers من QuantDinger (3-5 أيام) — **P0-P1**

#### 1.1 نقل `safe_exec` sandbox إلى TypeScript (P0)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/utils/safe_exec.py` (470 LOC)
- **الهدف:** `src/shared/safe-exec/index.ts` + `validator.ts` + `runner.ts`
- **الـ approach:**
  - **Layer 1 (regex blacklist):** نقل مباشر، نفس الـ patterns بالضبط
  - **Layer 2 (AST):** استخدام `@typescript-eslint/parser` أو `acorn` للـ AST walk، نفس الـ import whitelist (`numpy, pandas, math, json, datetime, time, collections, functools, itertools, statistics, decimal, fractions, operator, copy` — لكن بالـ JS equivalents)
  - **Layer 3 (restricted builtins):** استخدام `vm2` أو `isolated-vm` في Node.js
  - **Timeout:** `Promise.race` مع `setTimeout` + `worker_threads` للـ CPU-bound
  - **Subprocess isolation:** `worker_threads` (أخف من `child_process`)
- **الجهد:** 2-3 أيام
- **الاستخدام في VIXOR:** تنفيذ استراتيجيات Python/JS المقدمة من المستخدم بأمان

#### 1.2 نقل `circuit_breaker + rate_limiter + cache_manager` (P0)

- **المصدر:**
  - `audit/QuantDinger/backend_api_python/app/data_sources/circuit_breaker.py`
  - `audit/QuantDinger/backend_api_python/app/data_sources/rate_limiter.py`
  - `audit/QuantDinger/backend_api_python/app/data_sources/cache_manager.py`
- **الهدف:**
  - `src/shared/resilience/circuit-breaker.ts`
  - `src/shared/resilience/rate-limiter.ts`
  - `src/shared/resilience/lru-cache.ts`
- **الـ approach:** نقل مباشر بـ TypeScript — لا توجد dependencies على Python
- **الجهد:** 1 يوم
- **الاستخدام في VIXOR:** حماية كل الـ external API calls (Binance, TwelveData, Finnhub, Telegram) من الـ cascading failures

#### 1.3 نقل `credential_crypto` إلى Node.js `crypto` (P0)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/utils/credential_crypto.py` (50 LOC)
- **الهدف:** `src/shared/crypto/credential-crypto.ts`
- **الـ approach:**
  ```typescript
  import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from "crypto";

  const KEY = scryptSync(process.env.SECRET_KEY!, "vixor-salt", 32); // AES-256

  export function encryptCredential(data: object): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-gcm", KEY, iv);
    const enc = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString("base64url");
  }

  export function decryptCredential<T>(token: string): T {
    const buf = Buffer.from(token, "base64url");
    const iv = buf.subarray(0, 16);
    const tag = buf.subarray(16, 32);
    const enc = buf.subarray(32);
    const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
    return JSON.parse(dec.toString("utf8"));
  }
  ```
- **الجهد:** نصف يوم
- **الاستخدام في VIXOR:** تشفير exchange API keys قبل تخزينها في Supabase

#### 1.4 نقل `llm.py` (multi-provider LLM service) إلى TypeScript (P1)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/services/llm.py` (629 LOC)
- **الهدف:** `src/shared/llm/index.ts` + `providers/*.ts`
- **الـ approach:**
  - 7 providers: OpenRouter, OpenAI, Gemini, DeepSeek, Grok, MiniMax, Custom OpenAI-compatible
  - Auto-detect by API key prefix:
    - `sk-or-v1-*` → OpenRouter
    - `sk-*` → OpenAI
    - `AIza*` → Gemini
    - etc.
  - Provider interface: `chat(messages, options) => { content, usage }`
  - Error normalization per provider
- **الجهد:** 1-2 يوم
- **الاستخدام في VIXOR:** السماح للمستخدم بإحضار مفتاحه الخاص لأي LLM — لا حصر على ZAI SDK

#### 1.5 نقل `signal_notifier.py` إلى TypeScript (P1)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/services/signal_notifier.py` (912 LOC)
- **الهدف:** `src/shared/notifications/index.ts` + `channels/*.ts`
- **الـ approach:**
  - 6 channels: browser (Web Push), email (Resend/SendGrid), Telegram (Bot API), SMS (Twilio), Discord webhook, generic HMAC webhook
  - Per-strategy `notification_config` JSON schema
  - User-timezone-aware timestamps (VIXOR عندها بالفعل timezone لـ Cairo)
- **الجهد:** 2 يوم
- **الاستخدام في VIXOR:** إشعارات متعددة القنوات للـ signals و alerts — حالياً فقط Telegram

#### 1.6 نقل `news.py` (Finnhub + RSS) إلى TypeScript (P0 — استبدال للأخبار الوهمية)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/data_providers/news.py`
- **الهدف:** `src/domains/market/server/news.ts`
- **الـ approach:**
  ```typescript
  // 1. Finnhub market news (already have FINNHUB_API_KEY)
  export async function getMarketNews(category: "general" | "forex" | "crypto" = "general") {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=${category}&token=${process.env.FINNHUB_API_KEY}`,
    );
    return res.json();
  }

  // 2. Company-specific news
  export async function getCompanyNews(symbol: string, from: string, to: string) {
    const res = await fetch(
      `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${process.env.FINNHUB_API_KEY}`,
    );
    return res.json();
  }

  // 3. RSS fallback ( Investing.com, Reuters, FXStreet)
  export async function getRSSFeeds(category: string) {
    /* parse RSS XML */
  }
  ```
- **الجهد:** 1 يوم
- **الاستخدام في VIXOR:** استبدال `newsMap` الوهمية بأخبار حقيقية في `engine.ts`

---

### المرحلة 2: نقل الـ engines الرئيسية (5-8 أيام) — **P1-P2**

#### 2.1 نقل `backtest.py` core (P1)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/services/backtest.py` (4974 LOC)
- **ننقل فقط:** الـ core simulation logic (~2000 LOC):
  - `_simulate_signals_with_mtf` — multi-timeframe simulation
  - `_infer_candle_path` — 4-point intra-bar path (bullish: O→L→H→C, bearish: O→H→L→C)
  - الـ trade state machine (`position ∈ {-size, 0, +size}`)
  - Risk features: fixed SL/TP, trailing stop, liquidation
  - Trade-direction modes: long/short/both
  - Equity curve sampling
- **الهدف:** `src/domains/backtest/engine/simulator.ts` + `state-machine.ts` + `candle-path.ts`
- **الـ approach:**
  - نقل الـ algorithms حرفياً (نفس الـ formulas)
  - استخدام `typed arrays` (Float64Array) للأداء
  - تخزين النتائج في `backtest_runs`, `backtest_trades`, `backtest_equity_points` (نفس schema من QuantDinger)
- **الجهد:** 3-4 أيام
- **الاستخدام في VIXOR:** backtest لأي استراتيجية — ميزة كبرى مفقودة حالياً

#### 2.2 نقل `strategy_script_runtime.py` + `indicator_params.py` (P1)

- **المصدر:**
  - `audit/QuantDinger/backend_api_python/app/services/strategy_script_runtime.py`
  - `audit/QuantDinger/backend_api_python/app/services/indicator_params.py`
- **الهدف:** `src/domains/strategy/runtime/script-runtime.ts` + `indicator-params.ts`
- **الـ approach:**
  - الـ DSL: `@strategy` + `@param` decorators → TypeScript decorators
  - `on_init(ctx)` + `on_bar(ctx, bar)` contract → same in TS
  - `ctx.buy()`, `ctx.sell()`, `ctx.close_position()` → same API
  - يعتمد على `safe-exec` (المرحلة 1.1)
- **الجهد:** 2-3 أيام
- **الاستخدام في VIXOR:** السماح للمستخدم بكتابة استراتيجيات JavaScript/TypeScript وتشغيلها

#### 2.3 نقل `experiment/regime.py` + `scoring.py` (P2)

- **المصدر:**
  - `audit/QuantDinger/backend_api_python/app/services/experiment/regime.py` (170 LOC) — 5 regimes
  - `audit/QuantDinger/backend_api_python/app/services/experiment/scoring.py` (140 LOC) — multi-factor
- **الهدف:** `src/domains/analysis/engine/regime/regime-detector.ts` + `strategy-scorer.ts`
- **الـ approach:** نقل مباشر — كل المنطق هو calculations رياضية
- **الجهد:** 1 يوم
- **الاستخدام في VIXOR:**
  - Regime detector: يحدد السوق trending/ranging/volatile/choppy/reversal — يحسن الـ signal accuracy
  - Scorer: يرتب الـ strategies في leaderboard بأربع درجات (A/B/C/D)

#### 2.4 نقل `experiment/evolution.py` + `runner.py` (P2)

- **المصدر:**
  - `audit/QuantDinger/backend_api_python/app/services/experiment/evolution.py` (123 LOC)
  - `audit/QuantDinger/backend_api_python/app/services/experiment/runner.py` (609 LOC)
- **الهدف:** `src/domains/experiment/evolution.ts` + `runner.ts`
- **الـ approach:**
  - Grid search + random search + LLM-driven optimization
  - Multi-round LLM optimization مع early-stop عند score ≥ 82
  - يعتمد على backtest engine + LLM service + scorer
- **الجهد:** 2-3 أيام
- **الاستخدام في VIXOR:** "AI يبحث → backtests → يقيم → يقترح أفضل استراتيجية" loop — ميزة تسويقية قوية

---

### المرحلة 3: نقل الـ agent + trading adapters (8-12 يوم) — **P2-P3**

#### 3.1 نقل Agent Gateway pattern (P2)

- **المصدر:**
  - `audit/QuantDinger/backend_api_python/app/utils/agent_auth.py` (470 LOC)
  - `audit/QuantDinger/backend_api_python/app/utils/agent_jobs.py` (339 LOC)
  - `audit/QuantDinger/backend_api_python/app/routes/agent_v1/` (10 routes)
- **الهدف:** `src/domains/agent-gateway/`
  - `tokens.ts` — capability-class scoped tokens (R/W/B/N/C/T)
  - `jobs.ts` — async job runner with SSE progress
  - `audit.ts` — redacted audit logging
  - `idempotency.ts` — DB unique partial index pattern
- **الـ approach:**
  - Token format: `vx_agent_<urlsafe_32_bytes>`
  - SHA-256 hash at rest
  - Per-token: `scopes`, `markets`, `instruments`, `paper_only`, `rate_limit_per_min`, `expires_at`
  - SaaS-mode guard: when `VIXOR_DEPLOYMENT_MODE=saas`, reject T-scope at issuance
- **الجهد:** 3-4 أيام
- **الاستخدام في VIXOR:** السماح لـ AI agents خارجية (Cursor, Claude Code) بالوصول لـ VIXOR بشكل آمن ومنظم

#### 3.2 نقل 4 crypto exchange adapters (P2)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/services/live_trading/`
- **ننقل فقط:**
  - `binance.py` (spot + futures) — مع broker ID `A2NAPZAC`/`HBpUbQjT`
  - `okx.py` — مع passphrase
  - `bybit.py` — linear futures
  - `coinbase_exchange.py` — spot فقط
- **الهدف:** `src/domains/broker-adapters/{binance,okx,bybit,coinbase}/`
- **الـ approach:**
  - نفس `BaseRestClient` interface: `ping()`, `get_account()`, `place_order()`, `cancel_order()`, `get_positions()`, `get_fee_rate()`
  - نفس الـ HMAC signing logic لكل exchange
  - نفس demo/testnet URL routing
  - **لا نستخدم ccxt** — التحكم المباشر أفضل
- **الجهد:** 4-5 أيام
- **الاستخدام في VIXOR:** تنفيذ أوامر حقيقية (أو paper) من الـ strategies

#### 3.3 نقل OAuth (Google + GitHub) (P3)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/services/oauth_service.py` (715 LOC)
- **الهدف:** `src/domains/auth/oauth/`
- **الـ approach:**
  - Cross-worker OAuth state في `oauth_states` table (ليس in-memory)
  - Google + GitHub providers
  - Same CSRF protection pattern
- **الجهد:** 2-3 أيام
- **الاستخدام في VIXOR:** بدائل للـ Telegram login (مفيد للمستخدمين بدون Telegram)

#### 3.4 نقل USDT-TRC20 payment service (P3)

- **المصدر:** `audit/QuantDinger/backend_api_python/app/services/usdt_payment_service.py` (830 LOC)
- **الهدف:** `src/domains/payment/usdt-trc20/`
- **الـ approach:**
  - HD-derived per-order addresses
  - TronGrid on-chain reconciliation
  - Same `usdt_payments` table schema
- **الجهد:** 3-4 أيام
- **الاستخدام في VIXOR:** بديل لـ Telegram Stars — قبول مدفوعات crypto

---

## 4. الـ Schema Changes المطلوبة

### 4.1 جداول جديدة (New tables)

```sql
-- Migration: 20260618000000_add_quantdinger_reuse.sql

-- Strategy runtime (للمرحلة 2.2)
CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,  -- JS/TS code
  code_hash TEXT NOT NULL,  -- SHA-256 for change detection
  params JSONB DEFAULT '{}',
  market TEXT NOT NULL,  -- Crypto/Forex/USStock
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  status TEXT DEFAULT 'draft',  -- draft/active/paused/archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_strategies_user ON strategies(user_id, created_at DESC);

-- Backtest runs (للمرحلة 2.1)
CREATE TABLE IF NOT EXISTS backtest_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  config JSONB NOT NULL,
  result JSONB,  -- equity curve, trades count, sharpe, max DD, etc.
  status TEXT DEFAULT 'queued',  -- queued/running/succeeded/failed
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_backtest_runs_user ON backtest_runs(user_id, created_at DESC);
CREATE INDEX idx_backtest_runs_strategy ON backtest_runs(strategy_id, created_at DESC);

-- Backtest trades (per-trade record)
CREATE TABLE IF NOT EXISTS backtest_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backtest_run_id UUID NOT NULL REFERENCES backtest_runs(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ NOT NULL,
  side TEXT NOT NULL,  -- long/short
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC NOT NULL,
  size NUMERIC NOT NULL,
  pnl NUMERIC NOT NULL,
  pnl_pct NUMERIC NOT NULL,
  fees NUMERIC DEFAULT 0,
  exit_reason TEXT  -- take_profit/stop_loss/trailing/signal/manual
);

-- Agent tokens (للمرحلة 3.1)
CREATE TABLE IF NOT EXISTS agent_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,  -- SHA-256
  token_prefix TEXT NOT NULL,  -- vx_agent_xxxxxxxx (for display)
  scopes TEXT NOT NULL DEFAULT 'R',  -- CSV: R/W/B/N/C/T
  markets TEXT NOT NULL DEFAULT '*',
  instruments TEXT NOT NULL DEFAULT '*',
  paper_only BOOLEAN NOT NULL DEFAULT TRUE,
  rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'active',  -- active/revoked/expired
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_tokens_user ON agent_tokens(user_id, created_at DESC);
CREATE INDEX idx_agent_tokens_hash ON agent_tokens(token_hash) WHERE status = 'active';

-- Agent jobs (async runner with SSE progress)
CREATE TABLE IF NOT EXISTS agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_token_id UUID NOT NULL REFERENCES agent_tokens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  kind TEXT NOT NULL,  -- backtest/analyze/trade/etc.
  status TEXT NOT NULL DEFAULT 'queued',  -- queued/running/succeeded/failed
  request_payload JSONB,
  result JSONB,
  error TEXT,
  progress JSONB,  -- latest snapshot for cold reconnect
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_agent_jobs_idem
  ON agent_jobs(agent_token_id, kind, (request_payload->>'idempotency_key'))
  WHERE request_payload->>'idempotency_key' IS NOT NULL;
CREATE INDEX idx_agent_jobs_user ON agent_jobs(user_id, created_at DESC);

-- Agent audit log (redacted)
CREATE TABLE IF NOT EXISTS agent_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_token_id UUID NOT NULL REFERENCES agent_tokens(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  scope_class TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  idempotency_key TEXT,
  request_summary JSONB,  -- redacted
  response_summary JSONB,  -- redacted
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_agent_audit_user ON agent_audit(user_id, created_at DESC);
CREATE INDEX idx_agent_audit_token ON agent_audit(agent_token_id, created_at DESC);

-- Exchange credentials (encrypted at rest via credential_crypto)
CREATE TABLE IF NOT EXISTS exchange_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,  -- binance/okx/bybit/coinbase
  label TEXT NOT NULL,
  encrypted_credentials TEXT NOT NULL,  -- base64(iv + tag + ciphertext)
  is_testnet BOOLEAN DEFAULT FALSE,
  permissions TEXT NOT NULL DEFAULT 'read',  -- read/trade
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exchange_credentials_user ON exchange_credentials(user_id, exchange);

-- Analysis memory (لـ self-calibration loop)
CREATE TABLE IF NOT EXISTS analysis_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  actual_outcome TEXT,  -- win/loss/neutral (filled later)
  pnl_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  validated_at TIMESTAMPTZ
);
CREATE INDEX idx_analysis_memory_pair ON analysis_memory(pair, timeframe, created_at DESC);
CREATE INDEX idx_analysis_memory_unvalidated ON analysis_memory(id) WHERE actual_outcome IS NULL;

-- Enable RLS on all new tables
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_memory ENABLE ROW LEVEL SECURITY;

-- RLS policies (user can only see their own rows)
CREATE POLICY "user_own_strategies" ON strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_backtests" ON backtest_runs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_backtest_trades" ON backtest_trades FOR ALL USING (
  EXISTS (SELECT 1 FROM backtest_runs WHERE id = backtest_trades.backtest_run_id AND user_id = auth.uid())
);
CREATE POLICY "user_own_agent_tokens" ON agent_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_agent_jobs" ON agent_jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_agent_audit" ON agent_audit FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_exchange_credentials" ON exchange_credentials FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_analysis_memory" ON analysis_memory FOR ALL USING (auth.uid() = user_id);
```

### 4.2 تعديل جداول موجودة

```sql
-- إضافة strategy_id لجدول analyses الحالي
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS strategy_id UUID REFERENCES strategies(id);
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS backtest_run_id UUID REFERENCES backtest_runs(id);

-- إضافة regime للـ daily_signals
ALTER TABLE daily_signals ADD COLUMN IF NOT EXISTS regime TEXT;
ALTER TABLE daily_signals ADD COLUMN IF NOT EXISTS regime_confidence NUMERIC;
```

---

## 5. الـ Dependencies الجديدة لـ package.json

```json
{
  "dependencies": {
    "isolated-vm": "^5.0.0", // للـ safe_exec sandbox
    "acorn": "^8.11.0", // للـ AST validation
    "acorn-walk": "^8.3.0", // للـ AST walk
    "ws": "^8.16.0", // للـ SSE progress streaming
    "node-fetch": "^3.3.2", // للـ HTTP calls لـ exchanges
    "crypto-js": "^4.2.0", // للـ HMAC signing لـ exchanges
    "rss-parser": "^3.13.0", // للـ RSS news fallback
    "web-push": "^3.6.7" // للـ browser push notifications
  }
}
```

---

## 6. تحليل المخاطر (Risk Analysis)

### مخاطر عالية (High Risk)

| #   | المخاطرة                                                                          | التخفيف                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **تعارض TypeScript decorators مع الـ compiler config** للـ `@strategy` / `@param` | استخدام `experimentalDecorators: true` + `emitDecoratorMetadata: true` في `tsconfig.json`. أو تبديلها بـ plain function calls (`strategy({...})` wrapper) |
| 2   | **`isolated-vm` له native bindings** قد لا تعمل على Vercel serverless             | استخدام `vm2` بدلاً منه (pure JS لكن أبطأ). أو تشغيل الـ strategy execution في worker منفصل.                                                              |
| 3   | **Backtest engine مع 2000 LOC** قد يحمل bugs خفية من النقل                        | كتابة unit tests بـ نفس الـ fixtures من QuantDinger (`tests/test_three_minute_timeframe.py` يتحول لـ TS test)                                             |
| 4   | **Exchange adapters تحتاج HMAC signing دقيق** — خطأ واحد يكسر كل الطلبات          | اختبار كل adapter ضد testnet أولاً. استخدام `crypto-js` بدلاً من `node:crypto` للـ portability                                                            |
| 5   | **Agent Gateway + tokens** يضيف surface للهجوم                                    | تشغيل الـ audit log دائماً. اختبار penetration للـ token issuance flow                                                                                    |

### مخاطر متوسطة (Medium Risk)

| #   | المخاطرة                                             | التخفيف                                                                                                                                                   |
| --- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | **Migration حجمها كبير** (8 جداول جديدة)             | تطبيقها على staging أولاً، ثم production. Backup قبل التطبيق.                                                                                             |
| 7   | **Multi-provider LLM** يضيف 7 dependencies           | استخدام `openai` SDK لكل الـ OpenAI-compatible providers (OpenRouter, DeepSeek, Grok, MiniMax, Custom). فقط Gemini و OpenAI الأصلي يحتاجون adapters خاصة. |
| 8   | **`news.py` Finnhub** rate limit (60 calls/min)      | استخدام الـ rate limiter المنقول (المرحلة 1.2). Cache 5 دقائق.                                                                                            |
| 9   | **Experiment orchestration** يستهلك LLM tokens بكثرة | Hard cap per user per day. Early-stop عند score ≥ 82.                                                                                                     |

### مخاطر منخفضة (Low Risk)

| #   | المخاطرة                                                      | التخفيف                                     |
| --- | ------------------------------------------------------------- | ------------------------------------------- |
| 10  | **`credential_crypto` AES-256-GCM** في Node.js — قياسي ومختبر | فقط تأكد من أن `SECRET_KEY` قوي (32+ bytes) |
| 11  | **Circuit breaker pattern** — معروف ومختبر                    | نقل مباشر من QuantDinger بلا تعديل          |
| 12  | **RSS parser** — مكتبة ناضجة                                  | استخدام `rss-parser` المعروفة               |

---

## 7. الـ Acceptance Criteria لكل مرحلة

### المرحلة 0 (إصلاح VIXOR)

- [ ] كل الـ 13 env vars مضبوطة في `.env` و Vercel
- [ ] `npm run dev` يفتح التطبيق بدون أخطاء console
- [ ] `/auth` يعمل (Telegram login widget يظهر بعد BotFather `/setdomain`)
- [ ] `/` dashboard يعرض بيانات حقيقية (ليس empty states)
- [ ] `/analyze` ينتج تحليل بدون "Unable to identify asset"
- [ ] `/settings` toggles تعمل فعلياً (localStorage)
- [ ] price alerts تطلق كل 5 دقائق (cron)
- [ ] Layout يستغل عرض الشاشة بالكامل على desktop (max-w-7xl)
- [ ] لا توجد ملفات ` (1)` في الـ root

### المرحلة 1 (infrastructure)

- [ ] `safe-exec` يرفض كود فيه `import os` ويسمح بـ `import math`
- [ ] `circuit-breaker` يفتح بعد 3 failures في 60s
- [ ] `credential-crypto` يشفر ويفك تشفير JSON بنجاح
- [ ] `llm` auto-detects OpenAI key ويستدعي `gpt-4o`
- [ ] `notifications` يرسل Telegram message بنجاح
- [ ] `news` يجلب أخبار حقيقية من Finnhub

### المرحلة 2 (engines)

- [ ] `backtest` ينتج equity curve لأي strategy
- [ ] `strategy-runtime` ينفذ `on_bar` بشكل صحيح
- [ ] `regime-detector` يصنف السوق كـ "trending" أو "ranging"
- [ ] `experiment-runner` يحسن parameters ويرفع الـ score

### المرحلة 3 (agent + adapters)

- [ ] `agent-tokens` يصدر token بـ scope `R` فقط
- [ ] `agent-jobs` يبث SSE progress
- [ ] `binance-adapter` يجلب balance من testnet
- [ ] `oauth` يوجه المستخدم لـ Google ويعيده بنجاح

---

## 8. الـ Agent Workflow للتطبيق

### Agent 1: Fixer Agent (المرحلة 0)

```
Task ID: P0-FIXER
Goal: تنفيذ كل إصلاحات المرحلة 0
Inputs:
  - /home/z/my-project/audit/vixor_current_state.md (القسم 15: Top 10 Issues)
  - /home/z/my-project/.env (current state)
  - Vercel project: prj_cGYyIJfIqiD8nzh8Mu3k50Yo2bIx
Outputs:
  - .env updated (local)
  - Vercel env vars set
  - 9 fixes in code (sections 0.1-0.9)
  - QA runner passes 60/60 (was 52/0/6)
Handoff:
  - Append worklog entry to /home/z/my-project/worklog.md
  - Run `node scripts/qa-test-runner.cjs` and save report
```

### Agent 2: Infrastructure Porter (المرحلة 1)

```
Task ID: P1-INFRA
Goal: نقل 6 modules من QuantDinger
Inputs:
  - /home/z/my-project/audit/QuantDinger/backend_api_python/app/utils/safe_exec.py
  - /home/z/my-project/audit/QuantDinger/backend_api_python/app/data_sources/{circuit_breaker,rate_limiter,cache_manager}.py
  - /home/z/my-project/audit/QuantDinger/backend_api_python/app/utils/credential_crypto.py
  - /home/z/my-project/audit/QuantDinger/backend_api_python/app/services/{llm,signal_notifier}.py
  - /home/z/my-project/audit/QuantDinger/backend_api_python/app/data_providers/news.py
Outputs:
  - src/shared/safe-exec/{index,validator,runner}.ts
  - src/shared/resilience/{circuit-breaker,rate-limiter,lru-cache}.ts
  - src/shared/crypto/credential-crypto.ts
  - src/shared/llm/{index,providers/*}.ts
  - src/shared/notifications/{index,channels/*}.ts
  - src/domains/market/server/news.ts
Handoff:
  - Each module has unit tests
  - Migration: 20260618000000_add_quantdinger_reuse.sql applied
  - worklog.md updated
```

### Agent 3: Engine Porter (المرحلة 2)

```
Task ID: P2-ENGINES
Goal: نقل backtest + strategy runtime + experiment
Inputs:
  - audit/QuantDinger/backend_api_python/app/services/backtest.py
  - audit/QuantDinger/backend_api_python/app/services/strategy_script_runtime.py
  - audit/QuantDinger/backend_api_python/app/services/indicator_params.py
  - audit/QuantDinger/backend_api_python/app/services/experiment/{regime,scoring,evolution,runner,prompts}.py
Outputs:
  - src/domains/backtest/engine/{simulator,state-machine,candle-path}.ts
  - src/domains/strategy/runtime/{script-runtime,indicator-params}.ts
  - src/domains/analysis/engine/regime/{regime-detector,strategy-scorer}.ts
  - src/domains/experiment/{evolution,runner,prompts}.ts
Handoff:
  - Backtest produces equity curve
  - Strategy runtime executes on_bar correctly
  - Experiment runner improves strategy score
```

### Agent 4: Agent Gateway + Adapters (المرحلة 3)

```
Task ID: P3-AGENT-ADAPTERS
Goal: نقل Agent Gateway + 4 exchange adapters + OAuth
Inputs:
  - audit/QuantDinger/backend_api_python/app/utils/{agent_auth,agent_jobs}.py
  - audit/QuantDinger/backend_api_python/app/routes/agent_v1/
  - audit/QuantDinger/backend_api_python/app/services/live_trading/{binance,okx,bybit,coinbase_exchange}.py
  - audit/QuantDinger/backend_api_python/app/services/oauth_service.py
Outputs:
  - src/domains/agent-gateway/{tokens,jobs,audit,idempotency}.ts
  - src/routes/api/agent-v1/* (10 routes)
  - src/domains/broker-adapters/{binance,okx,bybit,coinbase}/
  - src/domains/auth/oauth/{google,github}.ts
Handoff:
  - Agent token with scope R can call /api/agent/v1/markets
  - Binance adapter gets balance from testnet
  - OAuth Google login works end-to-end
```

---

## 9. الـ KPIs لقياس النجاح

### KPIs تقنية

| KPI                              | الحالي             | الهدف    |
| -------------------------------- | ------------------ | -------- |
| QA test pass rate                | 52/58              | 60/60    |
| Bundle size (gzipped)            | ~unknown           | < 500 KB |
| Time to first analysis           | ~3s (when working) | < 2s     |
| Backtest execution (200 candles) | N/A                | < 500ms  |
| Strategy compilation             | N/A                | < 100ms  |
| Agent token issuance             | N/A                | < 50ms   |
| SSE job progress latency         | N/A                | < 100ms  |

### KPIs منتج

| KPI                         | الحالي                               | الهدف                         |
| --------------------------- | ------------------------------------ | ----------------------------- |
| Features that work          | ~60%                                 | 95%                           |
| Telegram login success rate | 0% (env missing)                     | 100% (after BotFather config) |
| Real news in analysis       | 0% (mock data)                       | 100% (Finnhub)                |
| User complaints             | 5 (layout, flow, data, UI, features) | 0                             |
| Time on page (avg)          | unknown                              | > 5 min                       |
| Strategies created per user | 0                                    | > 2                           |

---

## 10. الخلاصة والتوصيات النهائية

### ما يجب عمله **الآن** (قبل أي شيء آخر)

1. **المرحلة 0** كاملة (1-2 يوم) — هذا يحل 70% من شكاوى المستخدم
2. لا تبدأ أي نقل من QuantDinger قبل إصلاح VIXOR

### أعلى قيمة من QuantDinger (ROI)

1. **`safe_exec` sandbox** — يمكن تحويله لأي تنفيذ user code (strategies, indicators, custom alerts)
2. **`backtest engine`** — ميزة كبرى مفقودة، تفتح أبواب monetization (Premium feature)
3. **`multi-provider LLM`** — يحرر VIXOR من ZAI SDK فقط، يسمح بـ BYO-key
4. **`multi-channel notifier`** — يحرر VIXOR من Telegram فقط
5. **`circuit breaker + rate limiter`** — ضروري لأي تكامل مع external APIs

### ما **لا** يستحق النقل من QuantDinger

1. **MCP server** — VIXOR لا يحتاج MCP
2. **Vue frontend** — VIXOR يستخدم React، لا معنى لنقل Vue code
3. **USDT payment service** — مؤجل للمرحلة 3 (P3)
4. **MT5 / IBKR adapters** — VIXOR يركز على crypto أولاً
5. **CN/HK stock data sources** — VIXOR يركز على Forex + Crypto

### ما يجب **الاحتفاظ به** في VIXOR (لا نلمسه من QuantDinger)

1. **SMC/ICT analysis engine** (`engine.ts` 1360 LOC) — VIXOR متفوق
2. **Debate Engine** — VIXOR ينفرد بها
3. **Chart Truth Layer** — VIXOR ينفرد بها
4. **Risk Governor** — VIXOR ينفرد بها
5. **Telegram WebApp auth** — VIXOR شغاله صح (بعد env vars)
6. **Asset Registry** — VIXOR شغاله
7. **i18n + RTL** — VIXOR شغاله
8. **Design system (OKLCH + Bloomberg)** — VIXOR شغاله

### التوصية النهائية

**اطلق المرحلة 0 فوراً.** بعد إكمالها، أطلق Agent 1 (Infrastructure Porter) بالتوازي مع Agent 2 (Engine Porter). المرحلة 3 مؤجلة حتى التحقق من نجاح المرحلتين 0 و 1.

الـ total estimate: **15-25 يوم عمل** لتنفيذ كل المراحل، مع تحسن ملموس في تجربة المستخدم بعد **يوم واحد** فقط من المرحلة 0.

---

## الملحق أ: قائمة المصادر المرجعية لكل module منقول

| Module            | Source file in QuantDinger                              | Target file in VIXOR                                                   |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| safe_exec         | `app/utils/safe_exec.py` (470 LOC)                      | `src/shared/safe-exec/{index,validator,runner}.ts`                     |
| circuit_breaker   | `app/data_sources/circuit_breaker.py`                   | `src/shared/resilience/circuit-breaker.ts`                             |
| rate_limiter      | `app/data_sources/rate_limiter.py`                      | `src/shared/resilience/rate-limiter.ts`                                |
| cache_manager     | `app/data_sources/cache_manager.py`                     | `src/shared/resilience/lru-cache.ts`                                   |
| credential_crypto | `app/utils/credential_crypto.py` (50 LOC)               | `src/shared/crypto/credential-crypto.ts`                               |
| llm               | `app/services/llm.py` (629 LOC)                         | `src/shared/llm/{index,providers/*}.ts`                                |
| signal_notifier   | `app/services/signal_notifier.py` (912 LOC)             | `src/shared/notifications/{index,channels/*}.ts`                       |
| news              | `app/data_providers/news.py`                            | `src/domains/market/server/news.ts`                                    |
| backtest (core)   | `app/services/backtest.py` (4974 LOC, port ~2000)       | `src/domains/backtest/engine/{simulator,state-machine,candle-path}.ts` |
| strategy_runtime  | `app/services/strategy_script_runtime.py`               | `src/domains/strategy/runtime/{script-runtime,indicator-params}.ts`    |
| regime            | `app/services/experiment/regime.py` (170 LOC)           | `src/domains/analysis/engine/regime/regime-detector.ts`                |
| scoring           | `app/services/experiment/scoring.py` (140 LOC)          | `src/domains/analysis/engine/regime/strategy-scorer.ts`                |
| experiment        | `app/services/experiment/{evolution,runner,prompts}.py` | `src/domains/experiment/{evolution,runner,prompts}.ts`                 |
| agent_auth        | `app/utils/agent_auth.py` (470 LOC)                     | `src/domains/agent-gateway/tokens.ts`                                  |
| agent_jobs        | `app/utils/agent_jobs.py` (339 LOC)                     | `src/domains/agent-gateway/jobs.ts`                                    |
| agent_v1 routes   | `app/routes/agent_v1/` (10 files)                       | `src/routes/api/agent-v1/*`                                            |
| binance adapter   | `app/services/live_trading/binance.py`                  | `src/domains/broker-adapters/binance/`                                 |
| okx adapter       | `app/services/live_trading/okx.py`                      | `src/domains/broker-adapters/okx/`                                     |
| bybit adapter     | `app/services/live_trading/bybit.py`                    | `src/domains/broker-adapters/bybit/`                                   |
| coinbase adapter  | `app/services/live_trading/coinbase_exchange.py`        | `src/domains/broker-adapters/coinbase/`                                |
| oauth             | `app/services/oauth_service.py` (715 LOC)               | `src/domains/auth/oauth/{google,github}.ts`                            |
| usdt_payment      | `app/services/usdt_payment_service.py` (830 LOC)        | `src/domains/payment/usdt-trc20/` (P3, optional)                       |

## الملحق ب: مرجع سريع لأهم الـ patterns في QuantDinger

### Pattern 1: Capability-class scoped tokens

```
R = Read (markets, prices, klines, strategies, jobs)
W = Write (create strategies, edit settings)
B = Backtest (queue backtests)
N = Notify (trigger notifications)
C = Calendar (read economic calendar)
T = Trade (place orders — paper or live, gated by paper_only flag + AGENT_LIVE_TRADING_ENABLED)
```

### Pattern 2: SSE progress protocol

```
event: snapshot
data: {"job_id":"...","status":"running","progress":45}

event: progress
data: {"seq":1,"ts":"...","data":{"phase":"backtesting","bar":45/200}}

event: ping
(15s keepalive)

event: result
data: {"status":"succeeded","result":{...}}
```

### Pattern 3: Idempotency-Key unique partial index

```sql
CREATE UNIQUE INDEX idx_agent_jobs_idem
  ON qd_agent_jobs(agent_token_id, kind, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

### Pattern 4: Three-layer safe execution

```
Layer 1: Regex blacklist (os.system, subprocess, __import__, eval, exec, ...)
Layer 2: AST walk (whitelist imports, reject dangerous calls)
Layer 3: Restricted __builtins__ (whitelist functions only)
+ Timeout (SIGALRM on Unix, threading.Timer + ctypes on Windows)
+ Optional subprocess isolation (multiprocessing.Process)
```

### Pattern 5: Candle-path simulation

```
Bullish bar (close > open): O → L → H → C (dip then rally)
Bearish bar (close < open): O → H → L → C (rally then dip)
Doji (close ≈ open): O → H → L → C (worst case)
```

This lets SL/TP trigger intra-bar with realistic ordering.

### Pattern 6: Circuit breaker state machine

```
CLOSED → (failures ≥ threshold) → OPEN
OPEN → (after cooldown) → HALF_OPEN
HALF_OPEN → (success) → CLOSED
HALF_OPEN → (failure) → OPEN
```

### Pattern 7: SaaS-mode issuance-time guard

```python
if DEPLOYMENT_MODE in {'saas','shared','hosted','multitenant'}:
    if 'T' in scopes:
        abort(403, "T-scope not allowed in SaaS mode")
    paper_only = True  # force-pin regardless of payload
```

---

**نهاية الوثيقة.** أي agent يبدأ العمل يجب أن يقرأ هذه الوثيقة + `audit/vixor_current_state.md` + `audit/quantdinger_inventory.md` قبل أي شيء.
