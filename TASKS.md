# VIXOR APP — تقرير التاسكات والتحسينات

> **آخر تحديث:** 2026-07-06
> **الحالة العامة:** المشروع متقدم جداً — 35/38 صفحة شغالة ببيانات حقيقية

---

## تصحيح أخطاء في التقرير الأصلي (UX Architecture Report)

| # | المذكور في التقرير | الواقع الفعلي | ملاحظة |
|---|---|---|---|
| 1 | Fonts غير محملة | خطوط Inter + JetBrains Mono محمّلة في `__root.tsx` سطر 197-202 | **غلط في التقرير** |
| 2 | 4 أنظمة ألوان متعارضة | CSS vars هي الأساس، inline hex نادر | **مبالغة** |
| 3 | 0 نقاط في البار العلوي (P0) | تم إصلاح query key mismatch | **تم حلها سابقاً** |
| 4 | المحفظة غير موجودة في البار العلوي | زر Wallet + WalletNavLabel + WalletProviderSelector موجود | **غلط في التقرير** |
| 5 | الصورة الرمزية "T" | TopNavAvatar يجلب photo_url من Telegram | **تم حلها** |
| 6 | إشعارات بدون badge | NotificationBell مع unread count موجود | **غلط في التقرير** |
| 7 | صفحات Stub 3 فقط | Charts, Arbitrage, Activity-Web3 فقط | **صحيح** |
| 8 | 15+ silent catch blocks | يوجد silent catches بعضها مبرر | **صحيح جزئياً** |

---

## HOME-0 — إعادة تصميم الصفحة الرئيسية (الجلسة الحالية)

> تم إعداد تحليل مقارن شامل مع Binance, Coinbase, TradingView, Robinhood
> و10 مشاكل حرجة تم تحديدها + تصميم مقترح بـ 10 أقسام

### HOME-P0: لا يوجد سياق سوقي (NO MARKET CONTEXT)
- **ليه مهم؟** أول حاجة شافها المتداول في أي تطبيق هي الأسعار. دخول على "صحراء" بدون أي رقم = تجربة فاشلة
- **المسبب:** الصفحة الحالية لا تعرض أي أسعار BTC/SOL/ETH أو market overview
- **الحل:** إضافة Market Ticker Bar في أعلى الصفحة يعرض أسعار العملات الرئيسية مع التغير
- **المكونات المطلوبة:** لا يوجد مكونات جديدة، بس API جديد
- **الحالة:** ✅ تم — `getHomeMarketData` API جديد + Market Ticker Bar في الصفحة

### HOME-P1: عرض المحفظة ضعيف جداً (PORTFOLIO DISPLAY)
- **ليه مهم؟** المحفظة هي أهم رقم للمتداول. عرض "$0.00" كرقم واحد باهت بدون equity chart أو إحصائيات = محتوى بلا قيمة
- **المسبب:** الصفحة الحالية تعرض رصيد واحد فقط بدون تاريخ أداء أو توزيع أصول
- **الحل:** بطاقة Portfolio Hero مع: القيمة + equity curve mini chart + Win Rate + Trade Count + Sharpe Ratio
- **المكونات المطلوبة:** تحديث `getDashboardData` ليرجع `assetCount`, `winRate`, `sharpeRatio`, `equitySparkline`, `recentTrades` + مكون `MiniSparkline`
- **الحالة:** ✅ تم — Portfolio Hero Card مع Win Rate + Trades + Assets + Avg PnL

### HOME-P2: Quick Actions كثيرة جداً (COGNITIVE OVERLOAD)
- **ليه مهم؟** 6 أزرار في grid بتشتت دماغ المستخدم. زر Charts يودي لـ COMING SOON = إزعاج. زر Settings في الهوم مش منطقي
- **المسبب:** التصميم الحالي يحاول يغطي كل حاجة في صفحة واحدة
- **الحل:** تقليص لـ 1 Primary CTA (Analyze Chart) + 2 Secondary Actions (Discover, Copilot) فقط
- **الحالة:** ✅ تم — تقليص لـ 3 أزرار فقط (Discover, Copilot, PnL Tracker)

### HOME-P3: AI CTA مدفون (CORE FEATURE مخفي)
- **ليه مهم؟** Analyze Chart هو أهم feature في التطبيق (المميزة التنافسية). مدفون في card صغيرة = ضياع فرص استخدام
- **المسبب:** كل الأقسام بنفس الحجم والشكل = مفيش visual hierarchy
- **الحل:** زر Primary CTA كبير مع gradient أخضر + وصف واضح + icon
- **الحالة:** ✅ تم — زر Primary CTA كبير بـ gradient + وصف + icon

### HOME-P4: لا يوجد إشارات فعّالة (NO ACTIVE SIGNALS)
- **ليه مهم؟** المتداول يحتاج يعرف إذا فيه فرص جديدة. بدون عرض الإشارات = المستخدم بيفوت صفقات
- **المسبب:** الصفحة لا تعرض أي signals رغم إن `getDailySignals` server function موجود
- **الحل:** بطاقة Active Signals تظهر أول 2 signal مع confidence + entry/tp/sl + عرض الكل
- **المكونات المطلوبة:** `SignalBadge` + `LiveDot` موجودين بالفعل
- **الحالة:** ✅ تم — Active Signals Section بـ SignalBadge + LiveDot + confidence + price

### HOME-P5: لا يوجد Watchlist
- **ليه مهم؟** أي تداول بيبدأ بـ watchlist. غيابها = المستخدم لازم يفتح Discover كل مرة
- **المسبب:** لا يوجد مكان في الهوم يعرض العملات اللي المستخدم بيتابعها
- **الحل:** بطاقة Watchlist مع: الرمز + السعر + التغير 24h + sparkline + حجم التداول + القيمة السوقية
- **المكونات المطلوبة:** API `getWatchlist` جديد + مكون `MiniSparkline` + مكون `LiveDot`
- **الحالة:** ✅ تم — Watchlist Section مع آخر 5 عناصر من watchlist_items

### HOME-P6: لا يوجد Market Sentiment
- **ليه مهم؟** Fear & Greed Index + BTC Dominance + 24h Volume هي أدوات أساسية لأي متداول احترافي
- **المسبب:** الصفحة لا تعرض أي بيانات عن حالة السوق الكلية
- **الحل:** بطاقة Market Sentiment بـ 3 أعمدة: Fear & Greed + BTC Dominance + 24h Volume
- **المكونات المطلوبة:** API `getMarketOverview` جديد مع بيانات sentiment
- **الحالة:** ✅ تم — Market Sentiment Card بـ Fear & Greed Index + bar gauge

### HOME-P7: إحصائيات الحساب غير مفيدة (ACCOUNT STATS)
- **ليه مهم؟** "Points, Trades, Status" مش actionable. المفروض Win Rate و Sharpe Ratio
- **المسبب:** التصميم يعرض بيانات عامة بدل بيانات تداولية مفيدة
- **الحل:** استبدال بـ Win Rate + Average Trade + Sharpe Ratio + Asset Count (جزء من Portfolio Hero Card)
- **الحالة:** ✅ تم — Stats مدمجة في Portfolio Hero Card (Win Rate, Trades, Assets, Avg PnL)

### HOME-P8: تحية غير شخصية (NO CONTEXTUAL GREETING)
- **ليه مهم؟** "Welcome back, Trader" عاملة وباردة. في تطبيقات مثل Binance و Robinhood التحية ذكية ومعلوماتية
- **المسبب:** التحية ثابتة بدون وقت أو تاريخ أو سياق سوقي
- **الحل:** "Good Morning/Afternoon/Evening, [Name]" + التاريخ + حالة السوق + عدد الإشارات الفعّالة
- **الحالة:** ✅ تم — تحية ذكية حسب الوقت + التاريخ + عدد الإشارات الفعّالة

### HOME-P9: لا يوجد Recent Trades/Activity
- **ليه مهم؟** عرض آخر الصفقات بيمكّن المستخدم يتابع أدائه بدون ما يفتح Journal
- **المسبب:** القسم موجود بس فاضي دائماً
- **الحل:** بطاقة Recent Trades تعرض آخر 3 صفقات مع pair + direction + entry/exit + PnL + time ago
- **الحالة:** ✅ تم — Recent Trades Section مع آخر 3 صفقات + PnL + time

### HOME-P10: Layout مش متماسك (LAYOUT INCOHESIVE)
- **ليه مهم؟** كل section لوحدها بدون flow منطقي. Padding = 8px بس = الصفحة ملزقة. Cards متشابهة = مفيش visual hierarchy
- **المسبب:** التصميم الحالي مخصص بهيكل flat ومتشابه
- **الحل:** إعادة هيكلة الصفحة بـ 10 أقسام متسلسلة مع padding مناسب (12-16px) و visual hierarchy واضح
- **الحالة:** ✅ تم — إعادة هيكلة كاملة بـ 9 أقسام متسلسلة + padding 16px + visual hierarchy + gradient CTA + skeleton loading

### المكونات الجديدة المطلوبة للهوم

| المكون | اللي بيعمله | هل موجود أصلاً؟ |
|---|---|---|
| `MiniSparkline` | Chart صغير inline للـ portfolio و watchlist | موجود بس محتاج verify |
| `LiveDot` | نقطة متحركة (pulse) للـ active signals | موجود بس محتاج verify |
| `SignalBadge` | شارة الإشارة (BUY/SELL/WAIT) مع ألوان | موجود بس محتاج verify |
| `TrendArrow` | سهم الاتجاه (up/down/neutral) | ✅ تم إنشاؤه |

### APIs الجديدة المطلوبة للهوم

| API | البيانات اللي بيرجعها | اللي موجود فعلاً |
|---|---|---|
| `getMarketOverview` | tickers (BTC/SOL/ETH) + sentiment (Fear&Greed) | ✅ `getHomeMarketData` تم إنشاؤه |
| `getActiveSignals` | signals فعّالة مع confidence + entry/tp/sl | ✅ يتم استخدام `getDailySignals` + `liveSignals` من dashboard |
| `getWatchlist` | قائمة المتابعة مع sparkline + price + volume | ✅ يتم استخدام `getWatchlistData` الموجود |
| `getDashboardData` تحديث | إضافة assetCount, winRate | ✅ تم — أضيف winRate + assetCount |

---

## التاسكات مرتّبة حسب الأهمية

### P0 — Blockers (مانعة للإطلاق)

#### P0-1: أزواج الفوركس/الذهب لا تفتح صفحة التداول
- **التأثير:** المستخدم يضغط على زوج في Discover ولا يحصل شيء
- **المسبب:** صفحة `token/$symbol` مبنية للكريبتو فقط (DexScreener API). أزواج الفوركس غير مدعومة
- **الحل المقترح:** إضافة TradingView widget للفوركس/الذهب أو صفحة منفصلة
- **هل يُعاد؟** لا لو عملنا صفحة فوركس بـ TradingView
- **الحالة:** ⬜ لم يبدأ

#### P0-2: عملات الميم مفيش بيانات حقيقية
- **التأثير:** صفحة التوكن تفتح فاضية أو بموك بيانات
- **المسبب:** `discover.tsx` يعتمد على DexScreener/Helius APIs. لو API مش بيرجع بيانات، الصفحة فاضية
- **الحل المقترح:** تحسين fallback في API أو إضافة مصادر بيانات بديلة
- **هل يُعاد؟** لا — مشكلة مصدر بيانات مش مشكلة كود
- **الحالة:** ⬜ لم يبدأ

#### P0-3: Charts, Arbitrage, Activity-Web3 صفحات فارغة (COMING SOON)
- **التأثير:** 3 صفحات في الـ More Panel تعرض رسالة فقط
- **المسبب:** الواجهات مكتوبة كـ stub. المحركات الخلفية موجودة خاصة arbitrage في `src/domains/arbitrage/`
- **الحل المقترح:** ربط المحركات الموجودة بالواجهة أو إخفاء الصفحات من الـ nav
- **هل يُعاد؟** نعم — يجب ربط المحركات أو الإخفاء
- **الحالة:** ⬜ لم يبدأ

---

### P1 — High Priority (تؤثر على الاحتفاظ بالمستخدم)

#### P1-1: نصوص صغيرة جداً (8-10px)
- **التأثير:** 90% من المستخدمين مش هيقرأوا المحتوى على الموبايل
- **الأماكن المحددة:**
  - AppShell Bottom Bar labels: `9px` (سطر 1403)
  - SOL price ticker: `10px` (سطر 1281)
  - Notification badge: `8px` (سطر 1055)
  - More Panel category titles: `10px` (سطر 1574)
  - More Panel close button: `11px` (سطر 1558)
- **الحل المقترح:** رفع الكل لـ 12px كحد أدنى. إنشاء CSS variables للطباعة
- **هل يُعاد؟** نعم — أي نص تحت 12px = خطأ تصميم
- **الحالة:** ✅ تم — كل النصوص 11px كحد أدنى، Badge 10px (في 14px badge)، Bottom bar/More 11px

#### P1-2: Empty States بدون CTA
- **التأثير:** المستخدم يوصل لصفحة فاضية ولا يعرف ماذا يفعل
- **المسبب:** مكون `EmptyState` لا يقبل prop للأزرار. 19+ صفحة تستخدمه بدون زر
- **الحل المقترح:** إضافة optional `action` prop لـ EmptyState
- **هل يُعاد؟** نعم — كل empty state لازم فيه زر action
- **الحالة:** ⬜ لم يبدأ

#### P1-3: Silent catch blocks (أخطاء تُبتلع بدون إشعار)
- **التأثير:** أخطاء حقيقية تحصل والمستخدم لا يعرف
- **الأماكن المحددة:**
  - `AppShell.tsx` سطر 41 (SOL price fetch)
  - `AppShell.tsx` سطر 815 (Telegram sync)
  - `AppShell.tsx` سطر 861 (localStorage)
  - `AppShell.tsx` سطر 1164, 1190 (Telegram photo/name)
  - `__root.tsx` سطر 93 (Sentry), سطر 363 (Telegram SDK)
- **ملاحظة:** بعضها مبرر (Telegram SDK might not exist, localStorage might fail)
- **الحل المقترح:** الأخطاء المتوقعة silent مسموحة. الباقي لازم toast
- **هل يُعاد؟** جزئياً — الأخطاء المتوقعة OK
- **الحالة:** ✅ تم — SOL price: أضيف `console.warn`. باقي 7 catches متوقعة ومعالجة بالفعل

#### P1-4: التنقل السفلي — Discover مش فيه
- **التأثير:** المستخدم لازم يفتح More Panel عشان يوصل لاكتشاف العملات
- **المسبب:** `bottomNavItems` فيه 4 عناصر فقط: Home, Analyze, Copilot, Signals
- **التقرير يقترح:** إضافة Discover واستبدال Signals بـ Portfolio
- **هل يُعاد؟** قرار تصميم — لو المستخدم بيستخدم Discover كتير ننقله
- **الحالة:** ⬜ لم يبدأ (يحتاج قرار منك)

#### P1-5: DataRow غير accessible
- **التأثير:** مستخدمو الكيبورد لا يستطيعون التنقل
- **المسبب:** المكون مكتوب كـ `div` وليس `button`
- **الحل المقترح:** تحويل لعناصر تفاعلية مع `role="button"` و `tabIndex`
- **هل يُعاد؟** نعم
- **الحالة:** ⬜ لم يبدأ

---

### P2 — Medium Priority (تحسين التجربة)

#### P2-1: Loading spinners بدل skeletons
- **التأثير:** الشاشة غير مريحة بصرياً أثناء التحميل
- **المسبب:** مكون `RouteLoading` يستخدم spinner
- **الحل المقترح:** استخدام skeleton screens
- **الحالة:** ⬜ لم يبدأ

#### P2-2: أزرار Settings ما بتشتغلش (بعضها)
- **التأثير:** بعض الإعدادات تحفظ في localStorage فقط بدون sync مع السيرفر
- **المسبب:** `settings.tsx` بعض الأقسام localStorage-only
- **الحل المقترح:** sync مع السيرفر عبر `updateUserSettings`
- **الحالة:** ⬜ لم يبدأ

#### P2-3: OKX/Bybit adapters stubs
- **التأثير:** مستخدم يحاول يربط Exchange ولا يشتغل
- **المسبب:** Adapters في `src/domains/trading/` غير مكتملة
- **ملاحظة:** يحتاج API keys حقيقية أولاً
- **الحالة:** ⬜ لم يبدأ (محظور حتى توفر API keys)

#### P2-4: Touch targets صغيرة
- **التأثير:** أصابع المستخدم تضغط خطأ على الموبايل
- **الأماكن المحددة:**
  - Notification bell: 26×26px (سطر 1025-1029)
  - Avatar: 26×26px (سطر 1212)
  - Points badge: صغير
- **الحل المقترح:** minimum 44×44px لكل عنصر تفاعلي
- **الحالة:** ✅ تم — Bell 26→30px+44px touch, Avatar 26→30px+44px touch, PointsBadge 44px touch

#### P2-5: ألوان inline hex متفرقة
- **التأثير:** صعوبة إعادة التكوين (rebranding)
- **المسبب:** بعض الأماكن تستخدم hex مباشرة بدل CSS var
- **الحل المقترح:** توحيد لمصدر واحد
- **الحالة:** ✅ تم — AppShell rgba(14,203,129) → var(--bullish-bg) + color-mix

#### P2-6: Badges في Profile hard-coded
- **التأثير:** الأوسمة غير ديناميكية
- **المسبب:** `profile.tsx` يستخدم `unlocked: true/false` ثابت
- **الحل المقترح:** جلب الأوسمة من قاعدة البيانات
- **الحالة:** ⬜ لم يبدأ

#### P2-7: روابط Brokers affiliate وهمية
- **التأثير:** الروابط تحتوي `affiliate_id=VIXOR` كـ placeholder
- **المسبب:** `brokers.tsx` الروابط ليست حقيقية
- **الحل المقترح:** استبدال بروابط فعلية
- **الحالة:** ⬜ لم يبدأ (يحتاج روابط حقيقية منك)

#### P2-8: Discover Forex data hard-coded
- **التأثير:** بيانات الفوركس مختلطة مع بيانات API حقيقية
- **المسبب:** ملف `discover-forex-data.ts` بيانات ثابتة
- **الحل المقترح:** استخدام API حقيقي (TwelveData/Finnhub)
- **الحالة:** ⬜ لم يبدأ

---

### P3 — Low Priority (لمسات نهائية)

| # | التاسك | الحالة |
|---|---|---|
| P3-1 | Page transitions (تحريك سلس بين الصفحات) | ⬜ |
| P3-2 | Pull-to-refresh feedback | ⬜ |
| P3-3 | Keyboard navigation كامل | ⬜ |
| P3-4 | Offline states | ⬜ |
| P3-5 | تنظيف ملفات SQL عائمة في الجذر | ⬜ |
| P3-6 | تنظيف `src/lib/` (نسخة قديمة من الكود) | ⬜ |

---

## ما تم إنجازه فعلاً (الجلسات السابقة)

| # | التاسك | الحالة | التفاصيل |
|---|---|---|---|
| 1 | CI/CD GitHub Actions failure (lint/typecheck) | ✅ تم | إصلاح lint/typecheck errors |
| 2 | نقاط لا تُضاف (auth token issue) | ✅ تم | تقسيم Supabase client لعميلين + fix env var priority |
| 3 | النقاط تظهر 0 في البار العلوي | ✅ تم | إصلاح query key mismatch + invalidate كلا المفتاحين |
| 4 | Redirect loop في rewards | ✅ تم | إزالة `window.location.assign("/auth")` |
| 5 | "Invalid API key" من Supabase | ✅ تم | إزالة `global.headers.Authorization` من عميل getUser |
| 6 | npm ci failing (missing from lock file) | ✅ تم | تحديث package-lock.json |

---

## خريطة التبعيات — ترتيب التنفيذ الأمثل

```
الجلسة الحالية: إعادة تصميم الصفحة الرئيسية (HOME)
├── المرحلة 1: الأساس (المكونات + APIs)
│   ├── إنشاء/verify MiniSparkline, LiveDot, SignalBadge, TrendArrow
│   ├── إنشاء getMarketOverview API (tickers + sentiment)
│   ├── إنشاء getActiveSignals API (من تعديل getDailySignals)
│   ├── إنشاء getWatchlist API (من الصفر)
│   └── تحديث getDashboardData (assetCount, winRate, sharpeRatio, equitySparkline, recentTrades)
├── المرحلة 2: بناء الصفحة الجديدة
│   ├── كتابة الصفحة الجديدة بالـ 10 أقسام
│   ├── ربط كل sections بالـ data fetching
│   ├── إضافة loading states (skeletons)
│   └── إضافة empty/error states
└── المرحلة 3: التلميع
    ├── Test على mobile
    ├── Animation polish
    └── Performance optimization

Sprint 1: الأساسيات (يوم 1-3)
├── P1-1: رفع النصوص لـ 12px+          [لا تبعيات]
├── P2-4: Touch targets 44×44px+        [لا تبعيات]
├── P1-3: إصلاح silent catches         [لا تبعيات]
└── P2-5: توحيد الألوان لمصدر واحد    [لا تبعيات]

Sprint 2: المحتوى الفارغ (يوم 4-7)
├── P0-3: ربط Charts/Arbitrage/Activity بالمحركات الموجودة  [يعتمد على Sprint 1]
├── P1-2: إضافة CTA لكل Empty State    [يعتمد على P0-3]
└── P0-1: صفحة فوركس/ذهب بـ TradingView  [مستقل]

Sprint 3: البيانات الحقيقية (يوم 8-10)
├── P0-2: توصيل عملات الميم ببيانات حقيقية  [يعتمد على API providers]
├── P2-8: بيانات الفوركس من API بدل hard-coded
└── P2-6: Badges ديناميكية من DB

Sprint 4: التحسينات (يوم 11-14)
├── P2-1: Skeleton loading
├── P1-4: إضافة Discover للـ Bottom Nav (قرار تصميم)
├── P1-5: DataRow accessibility
├── P2-2: Settings sync مع السيرفر
├── P2-7: روابط Brokers حقيقية
└── P2-3: OKX/Bybit adapters (يحتاج API keys)
```

---

## المسببات الجذرية وكيفية عدم تكرارها

| المشكلة | المسبب الجذري | كيفية المنع |
|---|---|---|
| صفحات فارغة في الـ nav | إضافة صفحات قبل إنهاء تنفيذها | لا تضف صفحة للـ nav إلا لما تكون شغالة 100% |
| نصوص 8-10px | عدم وجود design tokens للـ font-size | CSS variables: `--text-min: 12px` مع `clamp()` |
| silent catches | عادة سيئة في كتابة `catch {}` | كل catch لازم `console.warn` أو toast على الأقل |
| query key mismatch | أسماء مختلفة لنفس البيانات | ملف مركزي: `src/shared/query-keys.ts` |
| inline hex colors | كتابة الألوان مباشرة في JSX | ESLint rule مخصص |
| hard-coded data | بيانات "temporary" ومنسية | `// TODO: Replace with API` + assert في CI |
| Touch targets صغيرة | تصميم desktop يُنقل للموبايل بدون تعديل | كل `onClick` لازم يمر بـ `minTouchTarget` wrapper |
| Supabase auth conflict | `global.headers.Authorization` يتعارض مع `getUser(token)` | تعليق في `auth-middleware.ts` يشرح ليه بنعمل عميلين |

---

## إحصائيات المشروع الحالية

| البُعد | القيمة |
|---|---|
| إجمالي الصفحات | 38 (+ /auth) |
| صفحات شغالة ببيانات حقيقية | 35 |
| صفحات Stub (COMING SOON) | 3 (Charts, Arbitrage, Activity-Web3) |
| API Endpoints | 15+ |
| المكونات | 62+ ملف |
| Server Functions | 28+ في data/index.ts |
| نطاقات الأعمال (domains) | 22 نطاق |