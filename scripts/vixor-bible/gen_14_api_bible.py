#!/usr/bin/env python3
"""
VIXOR Engineering Bible — Gen 14: API Bible
Doc ID: VIXOR-API-001
Generates the complete API reference document in Arabic (RTL).
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf

SKILL_DIR = "/home/z/my-project/skills/pdf"

chapters = []

# ============================================================
# CHAPTER 1: SEC-01 — API Layer Overview
# ============================================================
chapters.append({
    "tag": "SEC-01",
    "title": "نظرة عامة على طبقة API",
    "content": """
<p class="body-text">
تُبنى منظومة فيكسور فوق طبقتين متميزتين لواجهات البرمجة التطبيقية (API)، صُممت كل منهما لتلبية احتياجات مختلفة ضمن البنية البرمجية الشاملة. الطبقة الأولى هي <strong>واجهات Nitro REST</strong> التي تُدار عبر خادم Nitro المدمج في إطار العمل، وتوفر خمسة عشر نقطة نهاية (endpoint) تُغطي مجالات الصحة والمقاييس والتدفق الذكي والاكتشاف والأسعار والتنبيهات المهيأة زمنياً وويب هوك تيليجرام والهجرة والتحقق من المحفظة. هذه الطبقة تتعامل مباشرة مع الطلبات الواردة من الخارج سواء كانت من خدمات المراقبة أو متصفحات المستخدمين أو بوتات تيليجرام.
</p>
<p class="body-text">
الطبقة الثانية هي <strong>وظائف الخادم عبر TanStack Start</strong>، وهي وظائف تُنفَّذ على الخادم (Server Functions) تُستدعى عبر بروتوكول الاستدعاء البعيد (RPC) من الواجهة الأمامية. تتميز هذه الطبقة بأنها تتوافق بشكل أعمق مع معمارية النطاقات (Domain Architecture) المعتمدة في المشروع، حيث يملك كل نطاق وظيفي ملف وظائف خاص به. تُغطي هذه الطبقة ستة عشر نطاقاً تشمل: المحلل الذكي (Moxi) والمساعد (Copilot) والتحليل والتداول والمستخدم وقائمة المراقبة وتتبع الإشارات والملاحظات والحلقة اليومية والمحفظة والاكتشاف والتجارب واختبار الاسترجاع والمراجحة والتداول الورقي وإدارة الصفقات.
</p>
<div class="callout">
    <div class="callout-title">لماذا هذا التصميم المزدوج؟</div>
    <div class="callout-body">
    واجهات Nitro مُحسّنة للوصول الخارجي وخدمات الجهات الخارجية (مثل DexScreener وBinance وتيليجرام)، بينما وظائف TanStack تُحسّن تجربة المطور من خلال توفير استدعاءات مُنبثقة (type-safe RPC) تتجاوز حاجز الشبكة بشكل شفاف للواجهة الأمامية. هذا الفصل يضمن أن كل طبقة تؤدي دورها بأقصى كفاءة ممكنة دون تداخل في المسؤوليات.
    </div>
</div>
<p class="body-text">
بالإضافة إلى هاتين الطبقتين، تعتمد منظومة فيكسور على <strong>نظام أحداث نطاقي (Domain Events)</strong> يُتيح التواصل غير المتزامن بين المكونات المختلفة. يُسجَّل كل حدث في جدول <code>domain_events</code> بقاعدة البيانات، مما يوفر سجلّاً تاماً لكل نشاط يحدث داخل المنظومة. تُشغَّل أيضاً <strong>مهام مجدولة عبر Vercel Cron</strong> لتنفيذ عمليات دورية مثل توليد الإشارات اليومية وفحص التنبيهات السعريّة.
</p>
"""
})

# ============================================================
# CHAPTER 2: SEC-02 — Nitro REST Endpoints
# ============================================================
chapters.append({
    "tag": "SEC-02",
    "title": "واجهات Nitro REST (15 نقطة نهاية)",
    "content": """
<p class="body-text">
تُمثّل واجهات Nitro REST العمود الفقري للتواصل الخارجي في منظومة فيكسور. كل نقطة نهاية مُعرَّفة في ملف مستقل داخل مجلد <code>server/api/</code>، وتخضع لسلسلة من طبقات التحقّق والأمان حسب حساسيتها. الجدول التالي يقدّم عرضاً شاملاً لجميع نقاط النهاية الخمس عشرة مع تفاصيلها الكاملة.
</p>
<table class="vixor-table">
<thead>
    <tr>
        <th>الطريقة</th>
        <th>المسار</th>
        <th>نوع المصادقة</th>
        <th>الوصف</th>
        <th>الملف</th>
    </tr>
</thead>
<tbody>
    <tr><td><code>GET/HEAD</code></td><td><code>/api/health</code></td><td>CRON_SECRET / HEALTH_TOKEN</td><td>فحص صحة Supabase وRedis</td><td><code>server/api/health.ts</code></td></tr>
    <tr><td><code>GET</code></td><td><code>/api/metrics</code></td><td>CRON_SECRET / HEALTH_TOKEN</td><td>مقاييس Prometheus</td><td><code>server/api/metrics.ts</code></td></tr>
    <tr><td><code>POST</code></td><td><code>/api/copilot-stream</code></td><td>Bearer JWT</td><td>تدفق SSE للمساعد الذكي</td><td><code>server/api/copilot-stream.ts</code></td></tr>
    <tr><td><code>GET</code></td><td><code>/api/discover</code></td><td>بدون (عام)</td><td>اكتشاف العملات عبر DexScreener</td><td><code>server/api/discover.ts</code></td></tr>
    <tr><td><code>GET</code></td><td><code>/api/sol-price</code></td><td>بدون (عام)</td><td>سعر SOL/USDT من Binance</td><td><code>server/api/sol-price.ts</code></td></tr>
    <tr><td><code>GET</code></td><td><code>/api/market-overview</code></td><td>بدون (عام)</td><td>بيانات أفضل الأسواق</td><td><code>server/api/market-overview.ts</code></td></tr>
    <tr><td><code>GET/POST</code></td><td><code>/api/check-alerts</code></td><td>Admin / Vercel Cron</td><td>فحص التنبيهات السعريّة</td><td><code>server/api/check-alerts.ts</code></td></tr>
    <tr><td><code>GET/POST</code></td><td><code>/api/generate-signals</code></td><td>Admin / Vercel Cron</td><td>توليد الإشارات اليومية</td><td><code>server/api/generate-signals.ts</code></td></tr>
    <tr><td><code>POST</code></td><td><code>/api/telegram-webhook</code></td><td>Webhook Secret</td><td>ويب هوك بوت تيليجرام</td><td><code>server/api/telegram-webhook.ts</code></td></tr>
    <tr><td><code>POST</code></td><td><code>/api/stars-webhook</code></td><td>Telegram Stars</td><td>ويب هوك دفع النجوم</td><td><code>server/api/stars-webhook.ts</code></td></tr>
    <tr><td><code>POST</code></td><td><code>/api/migrate</code></td><td>Admin Key</td><td>تشغيل هجرات قاعدة البيانات</td><td><code>server/api/migrate.ts</code></td></tr>
    <tr><td><code>POST</code></td><td><code>/api/p1-validate</code></td><td>Admin Key</td><td>التحقق من المرحلة الأولى</td><td><code>server/api/p1-validate.ts</code></td></tr>
    <tr><td><code>GET/POST</code></td><td><code>/api/reanalysis-cron</code></td><td>Admin / Cron</td><td>إعادة تحليل الإشارات</td><td><code>server/api/reanalysis-cron.ts</code></td></tr>
    <tr><td><code>GET|POST</code></td><td><code>/api/wallet/connect</code></td><td>Bearer JWT</td><td>تحدي/التحقق من المحفظة</td><td><code>server/api/wallet/connect.ts</code></td></tr>
    <tr><td><code>GET|POST</code></td><td><code>/api/wallet/session</code></td><td>Bearer JWT</td><td>جلسات المحفظة</td><td><code>server/api/wallet/session.ts</code></td></tr>
</tbody>
</table>
<p class="body-text">
تتوزع نقاط النهاية هذه بين ثلاث فئات أمنية: نقاط عامّة مفتوحة (<code>/api/discover</code> و<code>/api/sol-price</code> و<code>/api/market-overview</code>) لا تتطلب أي مصادقة، ونقاط محمية بمفتاح مسؤول أو رمز كرون (<code>/api/health</code> و<code>/api/metrics</code> و<code>/api/check-alerts</code> و<code>/api/generate-signals</code> و<code>/api/migrate</code> و<code>/api/p1-validate</code> و<code>/api/reanalysis-cron</code>)، ونقاط تتطلب مصادقة مستخدم عبر JWT (<code>/api/copilot-stream</code> و<code>/api/wallet/connect</code> و<code>/api/wallet/session</code>). نقطة <code>/api/telegram-webhook</code> تتطلب سريّة ويب هوك خاصة بينما <code>/api/stars-webhook</code> تعتمد على تحقّق النجوم من تيليجرام.
</p>
<div class="callout callout-warn">
    <div class="callout-title">ملاحظة على التقييد (Rate Limiting)</div>
    <div class="callout-body">
    نقاط النهاية العامة تخضع لتقييد صارم لمنع إساءة الاستخدام. نقاط المصادقة تحدّ من عدد الطلبات لكل مستخدم. نقاط المسؤول لا تُقيَّد لكنها محمية بمفاتيح مشفّرة.
    </div>
</div>
"""
})

# ============================================================
# CHAPTER 3: SEC-03 — TanStack Server Functions
# ============================================================
chapters.append({
    "tag": "SEC-03",
    "title": "وظائف الخادم عبر TanStack (Server Functions)",
    "content": """
<p class="body-text">
وظائف الخادم في TanStack Start هي الآلية الأساسية للتواصل بين الواجهة الأمامية والخادم في منظومة فيكسور. تُعرَّف هذه الوظائف عبر <code>createServerFn</code> وتُستدعى من المتصفح كما لو كانت دوال محلية، لكنها تُنفَّذ بالكامل على الخادم. هذا النمط يُلغي الحاجة إلى كتابة طلبات HTTP يدوية ويوفّر سلامة الأنواع (type safety) من الطرف إلى الطرف. يغطي الجدول التالي جميع النطاقات السالكة عشرة فصلاً.
</p>
<table class="vixor-table">
<thead>
    <tr>
        <th>النطاق</th>
        <th>الملف</th>
        <th>الوظائف</th>
        <th>الطريقة</th>
    </tr>
</thead>
<tbody>
    <tr><td><code>moxi</code></td><td><code>src/domains/moxi/functions.ts</code></td><td>askMoxi, updateMoxiPersona, getMoxiPersonaFn, getMoxiInsights</td><td>POST / GET</td></tr>
    <tr><td><code>copilot</code></td><td><code>src/domains/copilot/functions.ts</code></td><td>askCopilot, إدارة المحادثات</td><td>POST</td></tr>
    <tr><td><code>analysis</code></td><td><code>src/domains/analysis/functions.ts</code></td><td>تشغيل، جلب، قائمة، حذف التحليلات</td><td>CRUD</td></tr>
    <tr><td><code>trading</code></td><td><code>src/domains/trading/functions.ts</code></td><td>إنشاء، جلب، تحديث التنبيهات ووظائف التداول</td><td>CRUD</td></tr>
    <tr><td><code>user</code></td><td><code>src/domains/user/functions.ts</code></td><td>تسجيل الدخول عبر تيليجرام، تحديث الملف الشخصي</td><td>POST</td></tr>
    <tr><td><code>watchlist</code></td><td><code>src/domains/watchlist/functions.ts</code></td><td>إضافة، جلب، حذف عناصر قائمة المراقبة</td><td>CRUD</td></tr>
    <tr><td><code>signal-tracking</code></td><td><code>src/domains/signal-tracking/functions.ts</code></td><td>تتبع الإشارات CRUD</td><td>CRUD</td></tr>
    <tr><td><code>notes</code></td><td><code>src/domains/notes/functions.ts</code></td><td>ملاحظات التداول CRUD</td><td>CRUD</td></tr>
    <tr><td><code>daily-loop</code></td><td><code>src/domains/daily-loop/functions.ts</code></td><td>الحلقة اليومية CRUD</td><td>CRUD</td></tr>
    <tr><td><code>wallet</code></td><td><code>src/domains/wallet/functions.ts</code></td><td>ربط المحفظة بالحساب</td><td>POST</td></tr>
    <tr><td><code>discovery</code></td><td><code>src/domains/discovery/functions.ts</code></td><td>scanDiscovery, searchTokens</td><td>POST</td></tr>
    <tr><td><code>experiment</code></td><td><code>src/domains/experiment/functions.ts</code></td><td>إدارة التجارب CRUD</td><td>CRUD</td></tr>
    <tr><td><code>backtest</code></td><td><code>src/domains/backtest/functions.ts</code></td><td>تنفيذ اختبار الاسترجاع</td><td>POST</td></tr>
    <tr><td><code>arbitrage</code></td><td><code>src/domains/arbitrage/functions.ts</code></td><td>فحص فرص المراجحة</td><td>POST</td></tr>
    <tr><td><code>paper-trading</code></td><td><code>src/domains/paper-trading/</code></td><td>تنفيذ التداول الورقي</td><td>POST</td></tr>
    <tr><td><code>trades</code></td><td><code>src/domains/trades/functions.ts</code></td><td>إدارة الصفقات CRUD</td><td>CRUD</td></tr>
</tbody>
</table>
<p class="body-text">
كل نطاق وظيفي يملك ملف <code>functions.ts</code> خاصاً يُؤطر جميع الوظائف المتعلقة به. هذا التنظيم يجعل النظام قابلاً للتوسع والصيانة بسهولة، حيث يمكن إضافة نطاق جديد بإنشاء مجلد وملف وظائف دون التأثير على النطاقات الأخرى. جميع وظائف القراءة تستخدم <code>GET</code> بينما وظائف الكتابة والتحديث تستخدم <code>POST</code>. تمرّ جميع الوظائف التي تتطلب مصادقة عبر وسيط <code>authenticateRequest</code> الذي يتحقق من رمز JWT المُرسل في ترويسة <code>Authorization</code>.
</p>
<div class="callout callout-success">
    <div class="callout-title">ميزة RPC المُنبثق</div>
    <div class="callout-body">
    الواجهة الأمامية تستدعي هذه الوظائف مباشرة دون كتابة عناوين URL أو إدارة طلبات HTTP. TypeScript يتأكد من تطابق أنواع المدخلات والمخرجات بين الخادم والعميل في وقت الترجمة، مما يُقلّل الأخطاء البرمجية بشكل كبير.
    </div>
</div>
"""
})

# ============================================================
# CHAPTER 4: SEC-04 — Domain Events
# ============================================================
chapters.append({
    "tag": "SEC-04",
    "title": "نظام الأحداث (Domain Events)",
    "content": """
<p class="body-text">
يعتمد نظام فيكسور على معمارية أحداث نطاقية (Domain Events) تُتيح التواصل غير المتزامن والمُفكَّك بين المكونات المختلفة. كل حدث يُمثّل تغييراً مهماً في حالة النظام ويحمل حمولة (payload) مُحددة تصف ما حدث. يُسجَّل كل حدث في جدول <code>domain_events</code> بقاعدة بيانات Supabase، مما يوفر سجلّاً تاماً قابلاً للتدقيق لكل نشاط. يُنفَّذ النظام عبر كائن <code>VixorEvents</code> المركزي الذي يُصدِر الأحداث ويُثبّتها.
</p>
<div class="subsection"><div class="subsection-title">أحداث التحليل والإشارات</div></div>
<table class="vixor-table">
<thead>
    <tr><th>الحدث</th><th>الحمولة (Payload)</th></tr>
</thead>
<tbody>
    <tr><td><code>analysis.created</code></td><td>analysisId, pair, timeframe, userId, recommendation, confidence</td></tr>
    <tr><td><code>analysis.failed</code></td><td>pair, userId, error</td></tr>
    <tr><td><code>signal.generated</code></td><td>pair, timeframe, recommendation, confidence, signalDate</td></tr>
    <tr><td><code>signal.expired</code></td><td>pair, signalDate</td></tr>
    <tr><td><code>signal.tracking.created</code></td><td>trackingId, userId, pair, direction, entryPrice, stopLoss</td></tr>
    <tr><td><code>signal.tp_hit</code></td><td>trackingId, userId, pair, direction, prices</td></tr>
    <tr><td><code>signal.sl_hit</code></td><td>trackingId, userId, pair, direction, prices</td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">أحداث التنبيهات والتداول</div></div>
<table class="vixor-table">
<thead>
    <tr><th>الحدث</th><th>الحمولة (Payload)</th></tr>
</thead>
<tbody>
    <tr><td><code>alert.triggered</code></td><td>alertId, userId, pair, condition, targetPrice</td></tr>
    <tr><td><code>alert.created</code></td><td>alertId, userId, pair, condition, targetPrice</td></tr>
    <tr><td><code>trade.opened</code></td><td>tradeId, userId, pair, prices</td></tr>
    <tr><td><code>trade.closed</code></td><td>tradeId, userId, pair, prices, pnl</td></tr>
    <tr><td><code>trade.updated</code></td><td>tradeId, userId, pair, prices, pnl</td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">أحداث المستخدم والحلقة اليومية</div></div>
<table class="vixor-table">
<thead>
    <tr><th>الحدث</th><th>الحمولة (Payload)</th></tr>
</thead>
<tbody>
    <tr><td><code>user.telegram.linked</code></td><td>userId, telegramId</td></tr>
    <tr><td><code>user.premium.subscribed</code></td><td>userId, plan, expiresAt</td></tr>
    <tr><td><code>user.points.credited</code></td><td>userId, amount, reason</td></tr>
    <tr><td><code>dailyloop.morning-prep.completed</code></td><td>userId, date</td></tr>
    <tr><td><code>dailyloop.eod-review.completed</code></td><td>userId, date</td></tr>
    <tr><td><code>journal.created</code></td><td>noteId, userId, pair, mood</td></tr>
    <tr><td><code>journal.updated</code></td><td>noteId, userId, pair, mood</td></tr>
    <tr><td><code>notification.created</code></td><td>notificationId, userId, type, title</td></tr>
    <tr><td><code>copilot.message.sent</code></td><td>conversationId, userId, agentId</td></tr>
    <tr><td><code>copilot.action.executed</code></td><td>conversationId, userId, agentId, action</td></tr>
    <tr><td><code>watchlist.item.added</code></td><td>userId, pair, watchlistId</td></tr>
</tbody>
</table>
<p class="body-text">
يضمن هذا التصميم أن أي مكون في النظام يمكنه الاستجابة للأحداث دون معرفة المكون الذي أطلقها. مثلاً، يمكن لوحدة الإشعارات الاستماع لحدث <code>signal.tp_hit</code> وإرسال إشعار للمستخدم، بينما يمكن لوحدة التحليلات تحديث إحصائياتها بناءً على نفس الحدث. هذا الفصل يُبسّط إضافة ميزات جديدة دون تعديل الكود الموجود.
</p>
"""
})

# ============================================================
# CHAPTER 5: SEC-05 — Cron Jobs
# ============================================================
chapters.append({
    "tag": "SEC-05",
    "title": "المهام المجدولة (Cron Jobs)",
    "content": """
<p class="body-text">
تعتمد منظومة فيكسور على <strong>Vercel Cron Jobs</strong> لتنفيذ مهام دورية تضمن استمرارية تشغيل المنظومة وتحديث بياناتها بشكل آلي. تُعرَّف هذه المهام في ملف <code>vercel.json</code> ضمن قسم <code>cron</code>، وتُستدعى نقاط النهاية المحددة وفقاً للجدول الزمني المُهيأ. كل مهمة محمية بمفتاح <code>CRON_SECRET</code> يتم التحقق منه قبل تنفيذ أي منطق، مما يمنع الاستدعاءات غير المصرح بها من جهات خارجية.
</p>
<div class="subsection"><div class="subsection-title">جدول المهام المجدولة</div></div>
<table class="vixor-table">
<thead>
    <tr><th>الجدول الزمني</th><th>التوقيت (UTC)</th><th>نقطة النهاية</th><th>الوصف</th></tr>
</thead>
<tbody>
    <tr><td><code>0 0 * * *</code></td><td>00:00 منتصف الليل</td><td><code>/api/generate-signals</code></td><td>توليد إشارات التداول اليومية لجميع أزواج العملات المفعّلة</td></tr>
    <tr><td><code>30 0 * * *</code></td><td>00:30 بعد منتصف الليل</td><td><code>/api/check-alerts</code></td><td>فحص جميع التنبيهات السعريّة النشطة ومقارنتها بالأسعار الحالية</td></tr>
</tbody>
</table>
<p class="body-text">
تعمل مهمة توليد الإشارات عند منتصف الليل بتوقيت UTC بالتوازي مع افتتاح الأسواق اليومية الجديدة. تقوم هذه المهمة بمسح جميع أزواج العملات المُتتبَّعة وتشغيل محرك التحليل الفني لكل زوج، ثم تُخزّن الإشارات الناتجة في جدول <code>signals</code> مع تحديد مستويات الدخول والوقف والأهداف. بعد ثلاثين دقيقة، تُنفَّذ مهمة فحص التنبيهات التي تُقارن الأسعار اللحظية المسترجعة من Binance وDexScreener بالشروط المُعيَّنة في كل تنبيه، وتُطلق أحداث <code>alert.triggered</code> عند تحقق أي شرط.
</p>
<div class="callout">
    <div class="callout-title">آلية التحقق من المهام</div>
    <div class="callout-body">
    كل طلب من Vercel Cron يتضمن ترويسة <code>Authorization: Bearer {CRON_SECRET}</code>. يتم التحقق من هذه الترويسة عبر دالة <code>validateAdminKey</code> في بداية كل نقطة نهاية مُهيأة زمنياً. في حال فشل التحقق، يُردّ خطأ <code>401 Unauthorized</code> دون تنفيذ أي منطق. هذا يضمن أن المهام لا تُنفَّذ إلا بواسطة منصة Vercel نفسها.
    </div>
</div>
<p class="body-text">
بالإضافة إلى هاتين المهتمين الرئيسيتين، توجد نقطة نهاية <code>/api/reanalysis-cron</code> التي تُعاد تحليل الإشارات السابقة لتحديث تقييماتها بناءً على التطوّر اللاحق للأسعار. يمكن تفعيل هذه المهمة بجدول زمني إضافي أو استدعاؤها يدوياً من لوحة المسؤول. هذا النظام يضمن أن المنظومة تعمل بشكل مستمر دون تدخل بشري مباشر، مع الحفاظ على أعلى معايير الأمان والموثوقية.
</p>
"""
})

# ============================================================
# CHAPTER 6: SEC-06 — Authentication & Security
# ============================================================
chapters.append({
    "tag": "SEC-06",
    "title": "التحقق والأمان",
    "content": """
<p class="body-text">
تُطبَّق في منظومة فيكسور ثلاث طبقات تحقق رئيسية تُغطي جميع نقاط الوصول. كل طبقة مُصمَّمة لسيناريو محدد وتُستخدم حسب متطلبات الأمان لكل نقطة نهاية.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">authenticateRequest</div>
        <div class="info-card-body">
        الطبقة الأساسية لمصادقة المستخدمين. تتحقق من رمز JWT في ترويسة <code>Authorization: Bearer &lt;token&gt;</code>، تستخرج معرّف المستخدم (<code>userId</code>) وتُمرّره إلى معالج الطلب. تُستخدم في جميع وظائف TanStack Server Functions التي تتطلب صلاحية مستخدم، وفي نقاط Nitro مثل <code>/api/copilot-stream</code> و<code>/api/wallet/*</code>.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">validateAdminKey</div>
        <div class="info-card-body">
        تتحقق من مفتاح المسؤول المُرسل في ترويسة <code>Authorization</code> أو معامل <code>key</code>. تُستخدم لحماية نقاط الإدارة مثل <code>/api/migrate</code> و<code>/api/p1-validate</code> ونقاط الكرون. المفتاح يُخزَّن في متغير بيئة <code>CRON_SECRET</code> أو <code>ADMIN_KEY</code>.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">requireSupabaseAuth</div>
        <div class="info-card-body">
        طبقة إضافية تتحقق من جلسة Supabase Auth صالحة. تُستخدم في نقاط النهاية التي تحتاج لبيانات مستخدم موسّعة من Supabase، مثل استرجاع ملف المستخدم الكامل مع الاشتراكات والإعدادات.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">تقييد الطلبات (Rate Limiting)</div>
        <div class="info-card-body">
        يُطبَّق على عدة مستويات: تقييد عام لكل عنوان IP، وتقييد لكل مستخدم مُصادق عليه، وتقييد خاص لنقاط النهاية الحساسة. يُستخدم Redis لتخزين عدّادات الطلبات مع انتهاء الصلاحية التلقائي.
        </div>
    </div>
</div>
<p class="body-text">
تعمل هذه الطبقات بشكل مترادف حسب الحاجة. مثلاً، نقطة نهاية <code>/api/generate-signals</code> تستخدم <code>validateAdminKey</code> فقط لأنها تُستدعى من Vercel Cron ولا تحتاج معلومات مستخدم. بينما <code>/api/copilot-stream</code> تستخدم <code>authenticateRequest</code> لأنها تحتاج معرفة المستخدم لتقديم ردود مخصصة. نقطة <code>/api/wallet/connect</code> تُحقّق من JWT عبر <code>authenticateRequest</code> ثم تتأكد من أن المستخدم يملك المحفظة المطلوبة عبر <code>requireSupabaseAuth</code>.
</p>
<div class="callout callout-danger">
    <div class="callout-title">تحذير أمني</div>
    <div class="callout-body">
    جميع المفاتيح والرموز السرية تُخزَّن في متغيرات البيئة ولا تُدرَج أبداً في الكود المصدري. يتم تدوير المفاتيح دورياً ويُراقب الوصول غير المصرح به عبر سجلّات الأحداث في جدول <code>domain_events</code>.
    </div>
</div>
<p class="body-text">
بالإضافة إلى التحقق من الهوية، يوفر النظام حماية من هجمات التزوير عبر الطلبات (CSRF) عبر التحقق من أصل الطلب، وحماية من حقن البيانات عبر معالجة مُدخلات مُهيكلة بدلاً من استعلامات نصية. كافة الاتصالات الخارجية تتم عبر HTTPS مع التحقق من شهادات SSL.
</p>
"""
})

# ============================================================
# CHAPTER 7: SEC-07 — DTOs & Data Types
# ============================================================
chapters.append({
    "tag": "SEC-07",
    "title": "أنواع البيانات (DTOs)",
    "content": """
<p class="body-text">
تُعرَّف أنواع البيانات المُستخدمة في واجهات البرمجة باستخدام TypeScript مع قاعدة بيانات Supabase كمصدر حقيقة للهيكل. تُستخدم ثلاثة تعدادات (enums) رئيسية تتحكم في سلوك النظام، بالإضافة إلى أنواع مركبة (composite types) تُمثّل الكيانات الأساسية.
</p>
<div class="subsection"><div class="subsection-title">التعدادات الأساسية (Enums)</div></div>
<table class="vixor-table">
<thead>
    <tr><th>التعداد</th><th>القيم</th><th>الاستخدام</th></tr>
</thead>
<tbody>
    <tr><td><code>recommendation_type</code></td><td><code>strong_buy</code>, <code>buy</code>, <code>hold</code>, <code>sell</code>, <code>strong_sell</code></td><td>توصية التحليل الفني: شراء قوي، شراء، احتفاظ، بيع، بيع قوي</td></tr>
    <tr><td><code>analysis_status</code></td><td><code>pending</code>, <code>running</code>, <code>completed</code>, <code>failed</code></td><td>حالة التحليل: معلّق، جارٍ، مكتمل، فاشل</td></tr>
    <tr><td><code>signal_status</code></td><td><code>active</code>, <code>tp_hit</code>, <code>sl_hit</code>, <code>expired</code>, <code>cancelled</code></td><td>حالة الإشارة: نشطة، هدف محقق، وقف محقق، منتهية، ملغاة</td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">أنواع البيانات المركبة الرئيسية</div></div>
<p class="body-text">
يتكون كل تحليل تقني من الحقول التالية: معرّف فريد (<code>id: string</code>)، الزوج_currency (<code>pair: string</code>)، الإطار الزمني (<code>timeframe: string</code>)، التوصية من نوع <code>recommendation_type</code>، مستوى الثقة بين 0 و100 (<code>confidence: number</code>)، معرّف المستخدم (<code>userId: string</code>)، الحالة من نوع <code>analysis_status</code>، تاريخ الإنشاء والتحديث، ونتائج المؤشرات الفنية في كائن JSON.
</p>
<p class="body-text">
تتضمن الإشارة (<code>Signal</code>) الحقول: المعرّف، الزوج، الإطار الزمني، التوصية، مستوى الثقة، تاريخ الإشارة، سعر الدخول (<code>entryPrice</code>)، سعر وقف الخسارة (<code>stopLoss</code>)، سعر الهدف الأول والثاني (<code>tp1</code>, <code>tp2</code>)، الحالة من نوع <code>signal_status</code>، ومعرّف المستخدم المُنشئ.
</p>
<p class="body-text">
يتضمن التنبيه (<code>Alert</code>) الحقول: المعرّف، الزوج، شرط التنبيه (أكبر من، أصغر من، يتقاطع مع)، السعر المستهدف، الحالة (نشط/مُفعَّل/منتهي)، ومعرّف المستخدم. يتضمن التتبع (<code>SignalTracking</code>) معرّف الإشارة المرتبط، الاتجاه (شراء/بيع)، سعر الدخول الفعلي، والحالة الحالية مع الطوابع الزمنية لكل تحديث.
</p>
<div class="callout">
    <div class="callout-title">مصدر الأنواع</div>
    <div class="callout-body">
    تُولَّد أنواع TypeScript تلقائياً من مخطط Supabase عبر أداة <code>supabase gen types</code>. هذا يضمن تطابق تام بين هيكل قاعدة البيانات وأنواع البيانات المستخدمة في الكود، ويُلغي الحاجة لتحديث يدوي عند تغيير المخطط.
    </div>
</div>
"""
})

# ============================================================
# CHAPTER 8: SEC-08 — Security-to-Code Map
# ============================================================
chapters.append({
    "tag": "SEC-08",
    "title": "خرائط API: الأمان ← الكود",
    "content": """
<p class="body-text">
يُقدّم هذا الفصل خريطة مرجعية شاملة تربط كل نقطة نهاية بطبقة الأمان التي تحميها ومسار الملف في الكود المصدري. تُساعد هذه الخريطة المطورين ومُدقّقي الأمان في فهم نمط الحماية المُطبَّق بسرعة وتحديد أي فجوات محتملة.
</p>
<div class="subsection"><div class="subsection-title">نقاط محمية بـ CRON_SECRET / HEALTH_TOKEN</div></div>
<table class="vixor-table">
<thead>
    <tr><th>نقطة النهاية</th><th>آلية التحقق</th><th>مسار الملف</th></tr>
</thead>
<tbody>
    <tr><td><code>GET/HEAD /api/health</code></td><td><code>validateAdminKey</code></td><td><code>server/api/health.ts</code></td></tr>
    <tr><td><code>GET /api/metrics</code></td><td><code>validateAdminKey</code></td><td><code>server/api/metrics.ts</code></td></tr>
    <tr><td><code>GET/POST /api/check-alerts</code></td><td><code>validateAdminKey</code></td><td><code>server/api/check-alerts.ts</code></td></tr>
    <tr><td><code>GET/POST /api/generate-signals</code></td><td><code>validateAdminKey</code></td><td><code>server/api/generate-signals.ts</code></td></tr>
    <tr><td><code>GET/POST /api/reanalysis-cron</code></td><td><code>validateAdminKey</code></td><td><code>server/api/reanalysis-cron.ts</code></td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">نقاط محمية بـ Admin Key</div></div>
<table class="vixor-table">
<thead>
    <tr><th>نقطة النهاية</th><th>آلية التحقق</th><th>مسار الملف</th></tr>
</thead>
<tbody>
    <tr><td><code>POST /api/migrate</code></td><td><code>validateAdminKey</code></td><td><code>server/api/migrate.ts</code></td></tr>
    <tr><td><code>POST /api/p1-validate</code></td><td><code>validateAdminKey</code></td><td><code>server/api/p1-validate.ts</code></td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">نقاط محمية بـ Bearer JWT</div></div>
<table class="vixor-table">
<thead>
    <tr><th>نقطة النهاية</th><th>آلية التحقق</th><th>مسار الملف</th></tr>
</thead>
<tbody>
    <tr><td><code>POST /api/copilot-stream</code></td><td><code>authenticateRequest</code></td><td><code>server/api/copilot-stream.ts</code></td></tr>
    <tr><td><code>GET|POST /api/wallet/connect</code></td><td><code>authenticateRequest</code></td><td><code>server/api/wallet/connect.ts</code></td></tr>
    <tr><td><code>GET|POST /api/wallet/session</code></td><td><code>authenticateRequest</code></td><td><code>server/api/wallet/session.ts</code></td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">نقاط محمية بـ Webhook Secret</div></div>
<table class="vixor-table">
<thead>
    <tr><th>نقطة النهاية</th><th>آلية التحقق</th><th>مسار الملف</th></tr>
</thead>
<tbody>
    <tr><td><code>POST /api/telegram-webhook</code></td><td>Webhook Secret (Telegram)</td><td><code>server/api/telegram-webhook.ts</code></td></tr>
    <tr><td><code>POST /api/stars-webhook</code></td><td>Telegram Stars Validation</td><td><code>server/api/stars-webhook.ts</code></td></tr>
</tbody>
</table>
<div class="subsection"><div class="subsection-title">نقاط عامة (بدون مصادقة)</div></div>
<table class="vixor-table">
<thead>
    <tr><th>نقطة النهاية</th><th>الحماية</th><th>مسار الملف</th></tr>
</thead>
<tbody>
    <tr><td><code>GET /api/discover</code></td><td>Rate Limiting فقط</td><td><code>server/api/discover.ts</code></td></tr>
    <tr><td><code>GET /api/sol-price</code></td><td>Rate Limiting فقط</td><td><code>server/api/sol-price.ts</code></td></tr>
    <tr><td><code>GET /api/market-overview</code></td><td>Rate Limiting فقط</td><td><code>server/api/market-overview.ts</code></td></tr>
</tbody>
</table>
<p class="body-text">
جميع وظائف TanStack Server Functions الستة عشر المذكورة في الفصل الثالث تخضع لـ <code>authenticateRequest</code> بشكل افتراضي عند تعريفها بـ <code>.validator()</code>. النقاط العامة محمية بتقييد الطلبات فقط عبر Redis لمنع إساءة الاستخدام دون عرقلة الوصول الشرعي. يُنصح بمراجعة هذه الخريطة عند إضافة أي نقطة نهاية جديدة لضمان تطبيق طبقة الأمان المناسبة.
</p>
"""
})


# ============================================================
# GENERATE
# ============================================================
html = generate_vixor_html(
    title="إنجيل واجهات البرمجة",
    subtitle="كل نقطة نهاية، نوع بيانات، وحدث في منظومة فيكسور",
    doc_id="VIXOR-API-001",
    chapters=chapters,
    footer_text="VIXOR API Bible — VIXOR-API-001"
)

html_path = save_html(html, "14_api_bible.html")
print(f"HTML saved: {html_path}")

pdf_path = convert_to_pdf(html_path, "14_api_bible.pdf", SKILL_DIR)
print(f"PDF saved: {pdf_path}")
