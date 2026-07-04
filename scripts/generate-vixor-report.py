#!/usr/bin/env python3
"""Generate VIXOR App State Report - Arabic RTL PDF via Playwright html2pdf-next.js"""

import os

OUTPUT_DIR = "/home/z/my-project/download"
HTML_FILE = os.path.join(OUTPUT_DIR, "vixor_app_report.html")
PDF_FILE = os.path.join(OUTPUT_DIR, "VIXOR_App_State_Report.pdf")
PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"

html_content = r"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
@page {
    size: 720px 1020px;
    margin: 0;
}

:root {
    --c-bg: #0a0e1a;
    --c-surface: #111827;
    --c-card: #1a2235;
    --c-border: rgba(255,255,255,0.08);
    --c-text: #e2e8f0;
    --c-text-muted: #94a3b8;
    --c-primary: #3b82f6;
    --c-primary-dim: rgba(59,130,246,0.15);
    --c-bullish: #10b981;
    --c-bearish: #ef4444;
    --c-warn: #f59e0b;
    --c-info: #6366f1;
    --c-accent: #8b5cf6;
    --font-ar: 'Noto Sans Arabic', 'Inter', sans-serif;
    --font-en: 'Inter', 'Noto Sans Arabic', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
    width: 720px;
    margin: 0;
    padding: 0;
    background: var(--c-bg);
    color: var(--c-text);
    font-family: var(--font-ar);
    font-size: 13px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
}

@media screen {
    html {
        height: auto;
        display: flex;
        justify-content: center;
        background: #1a1a2e;
    }
    body {
        margin: 20px auto;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    }
}

/* Cover Page */
.cover {
    width: 720px;
    height: 1020px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(160deg, #0a0e1a 0%, #111d35 40%, #0f172a 100%);
    break-after: page;
}

.cover::before {
    content: '';
    position: absolute;
    top: -120px;
    right: -120px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
}

.cover::after {
    content: '';
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
}

.cover-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    border-radius: 20px;
    background: rgba(59,130,246,0.12);
    border: 1px solid rgba(59,130,246,0.25);
    color: var(--c-primary);
    font-family: var(--font-en);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 28px;
    z-index: 1;
}

.cover h1 {
    font-family: var(--font-en);
    font-size: 52px;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 12px;
    z-index: 1;
}

.cover h2 {
    font-size: 22px;
    font-weight: 600;
    color: var(--c-text);
    margin-bottom: 8px;
    z-index: 1;
}

.cover .subtitle {
    font-size: 14px;
    color: var(--c-text-muted);
    margin-bottom: 40px;
    z-index: 1;
}

.cover-meta {
    display: flex;
    gap: 24px;
    z-index: 1;
}

.cover-meta-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.cover-meta-item .label {
    font-size: 9px;
    color: var(--c-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-family: var(--font-en);
}

.cover-meta-item .value {
    font-size: 13px;
    font-weight: 700;
    color: var(--c-text);
    font-family: var(--font-en);
}

/* Main Content */
.main-content {
    padding: 50px 55px 40px 55px;
}

/* Chapter Header */
.chapter-header {
    break-after: avoid;
    break-inside: avoid;
    margin-top: 28px;
    margin-bottom: 16px;
}

.chapter-header:first-child {
    margin-top: 0;
}

.section-tag {
    display: inline-block;
    font-family: var(--font-en);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--c-primary);
    background: var(--c-primary-dim);
    padding: 3px 10px;
    border-radius: 4px;
    margin-bottom: 8px;
}

.section-title {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    line-height: 1.3;
}

.section-desc {
    font-size: 12px;
    color: var(--c-text-muted);
    margin-top: 6px;
    line-height: 1.6;
}

.divider {
    width: 60px;
    height: 3px;
    background: var(--c-primary);
    border-radius: 2px;
    margin-top: 12px;
    margin-bottom: 4px;
}

/* Body Text */
.body-text {
    font-size: 13px;
    color: var(--c-text);
    line-height: 1.8;
    margin-bottom: 12px;
    text-align: justify;
    direction: rtl;
}

/* Stat Cards Row */
.stat-row {
    display: flex;
    gap: 8px;
    margin: 16px 0;
    flex-wrap: wrap;
}

.stat-card {
    flex: 1;
    min-width: 120px;
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 8px;
    padding: 14px 12px;
    text-align: center;
    break-inside: avoid;
}

.stat-card .stat-value {
    font-family: var(--font-en);
    font-size: 20px;
    font-weight: 800;
    color: #fff;
}

.stat-card .stat-label {
    font-size: 10px;
    color: var(--c-text-muted);
    margin-top: 2px;
}

.stat-card.bullish .stat-value { color: var(--c-bullish); }
.stat-card.bearish .stat-value { color: var(--c-bearish); }
.stat-card.info .stat-value { color: var(--c-info); }
.stat-card.warn .stat-value { color: var(--c-warn); }

/* Table */
.table-wrapper {
    margin: 14px 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--c-border);
    break-inside: avoid;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
}

thead {
    background: rgba(59,130,246,0.08);
}

th {
    padding: 10px 12px;
    text-align: right;
    font-weight: 700;
    color: var(--c-primary);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--c-border);
    font-family: var(--font-en);
}

td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--c-border);
    color: var(--c-text);
    vertical-align: top;
}

tr:last-child td { border-bottom: none; }

tr:nth-child(even) { background: rgba(255,255,255,0.02); }

/* Badge */
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 9px;
    font-weight: 700;
    font-family: var(--font-en);
    letter-spacing: 0.02em;
}

.badge-green { background: rgba(16,185,129,0.15); color: var(--c-bullish); }
.badge-red { background: rgba(239,68,68,0.15); color: var(--c-bearish); }
.badge-yellow { background: rgba(245,158,11,0.15); color: var(--c-warn); }
.badge-blue { background: rgba(59,130,246,0.15); color: var(--c-primary); }
.badge-purple { background: rgba(139,92,246,0.15); color: var(--c-accent); }
.badge-gray { background: rgba(148,163,184,0.12); color: var(--c-text-muted); }

/* Card */
.card {
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 8px;
    padding: 16px;
    margin: 12px 0;
    break-inside: avoid;
}

.card-title {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Issue Card */
.issue-card {
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 8px;
    padding: 14px 16px;
    margin: 10px 0;
    break-inside: avoid;
    border-right: 3px solid var(--c-bearish);
}

.issue-card.fix {
    border-right-color: var(--c-bullish);
}

.issue-card.warn {
    border-right-color: var(--c-warn);
}

.issue-title {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 6px;
}

.issue-desc {
    font-size: 11px;
    color: var(--c-text-muted);
    line-height: 1.6;
}

.issue-meta {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
}

/* Code */
code {
    font-family: var(--font-mono);
    font-size: 11px;
    background: rgba(255,255,255,0.06);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--c-primary);
    direction: ltr;
    display: inline-block;
}

/* Subsection */
.subsection {
    margin: 18px 0 8px 0;
}

.subsection-title {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--c-border);
}

/* List */
.item-list {
    list-style: none;
    padding: 0;
}

.item-list li {
    padding: 8px 0;
    border-bottom: 1px solid var(--c-border);
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    line-height: 1.6;
}

.item-list li:last-child { border-bottom: none; }

.bullet {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--c-primary);
    flex-shrink: 0;
    margin-top: 7px;
}

/* Priority Grid */
.priority-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 12px 0;
}

.priority-item {
    background: var(--c-card);
    border: 1px solid var(--c-border);
    border-radius: 8px;
    padding: 12px;
    break-inside: avoid;
}

.priority-item .p-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
}

.priority-item .p-title {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
}

.priority-item .p-desc {
    font-size: 11px;
    color: var(--c-text-muted);
    line-height: 1.5;
}

/* Flow step */
.flow-steps {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin: 14px 0;
}

.flow-step {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--c-border);
    break-inside: avoid;
}

.flow-step:last-child { border-bottom: none; }

.step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--c-primary-dim);
    border: 1px solid rgba(59,130,246,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-en);
    font-size: 12px;
    font-weight: 700;
    color: var(--c-primary);
    flex-shrink: 0;
}

.step-content .step-title {
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 3px;
}

.step-content .step-desc {
    font-size: 11px;
    color: var(--c-text-muted);
    line-height: 1.5;
}

.en { font-family: var(--font-en); direction: ltr; display: inline; }
.mono { font-family: var(--font-mono); direction: ltr; display: inline; }

</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
    <div class="cover-badge">VIXOR Terminal</div>
    <h1>VIXOR</h1>
    <h2>تقرير حالة التطبيق الشامل</h2>
    <div class="subtitle">اختبار جميع الصفحات والتدفقات ونقاط التحسين</div>
    <div class="cover-meta">
        <div class="cover-meta-item">
            <span class="label">Platform</span>
            <span class="value">Telegram Web App</span>
        </div>
        <div class="cover-meta-item">
            <span class="label">Stack</span>
            <span class="value">TanStack Start + Vercel</span>
        </div>
        <div class="cover-meta-item">
            <span class="label">Date</span>
            <span class="value" class="en">2026-06-26</span>
        </div>
        <div class="cover-meta-item">
            <span class="label">Pages</span>
            <span class="value">24</span>
        </div>
    </div>
</div>

<!-- MAIN CONTENT -->
<div class="main-content">

<!-- Chapter 1: App Overview -->
<div class="chapter-header">
    <div class="section-tag">Chapter 01</div>
    <div class="section-title">نظرة عامة على التطبيق</div>
    <div class="divider"></div>
    <div class="section-desc">ملخص شامل لبنية VIXOR وتقنياته المُستخدمة وهيكله العام</div>
</div>

<div class="body-text">
VIXOR هو تطبيق تداول عملات رقمية متكامل يعمل كتطبيق ويب داخل تيليجرام (<span class="en">Telegram Web App</span>). بُني باستخدام إطار <span class="en">TanStack Start</span> الذي يجمع بين <span class="en">Vite</span> و<span class="en">React</span> و<span class="en">Nitro Server</span> كخلفية خادم، مع نشر على منصة <span class="en">Vercel</span> باستخدام بيئة تشغيل <span class="en">Node.js 22.x</span>. يعتمد التطبيق على <span class="en">Supabase</span> كقاعدة بيانات رئيسية ونظام مصادقة، ويستخدم <span class="en">React Query</span> لإدارة البيانات والتحديثات في الوقت الفعلي.
</div>

<div class="body-text">
يتميز التطبيق ببنية مزدوجة للمسارات: مسارات <span class="en">TanStack</span> داخل <span class="en">src/routes/api/</span> للعمليات من جانب العميل، ومسارات <span class="en">Nitro</span> داخل <span class="en">server/api/</span> التي تُسجل في <span class="en">vite.config.ts</span> وهي التي تُنفذ فعليا على <span class="en">Vercel</span>. يتضمن التطبيق نظام مصادقة تلقائي عبر تيليجرام، حيث يتم تسجيل الدخول بصمت عند فتح التطبيق من داخل تيليجرام دون الحاجة لصفحة تسجيل دخول منفصلة.
</div>

<div class="stat-row">
    <div class="stat-card info">
        <div class="stat-value">24</div>
        <div class="stat-label">صفحة في التطبيق</div>
    </div>
    <div class="stat-card bullish">
        <div class="stat-value">12</div>
        <div class="stat-label">نقطة نهاية API</div>
    </div>
    <div class="stat-card warn">
        <div class="stat-value">7</div>
        <div class="stat-label">مصادر بيانات خارجية</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">6</div>
        <div class="stat-label">نطاقات أعمال (<span class="en">Domains</span>)</div>
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">مصادر البيانات الخارجية</div>
</div>

<div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>نوع الأصل</th>
                <th>المصدر الأساسي</th>
                <th>المصند الاحتياطي</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>عملات مدرجة</td>
                <td><span class="en">Binance WebSocket</span></td>
                <td><span class="en">CoinGecko REST</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>عملات الميم</td>
                <td><span class="en">Binance WebSocket</span></td>
                <td><span class="en">DexScreener</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>سولانا على السلسلة</td>
                <td><span class="en">Helius RPC</span></td>
                <td>—</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">EVM</span> على السلسلة</td>
                <td><span class="en">Alchemy RPC</span></td>
                <td>—</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>فوركس والذهب</td>
                <td><span class="en">TwelveData</span></td>
                <td><span class="en">Finnhub Quote</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
        </tbody>
    </table>
</div>

<!-- Chapter 2: Pages Inventory -->
<div class="chapter-header">
    <div class="section-tag">Chapter 02</div>
    <div class="section-title">جرد الصفحات ونتائج الاختبار</div>
    <div class="divider"></div>
    <div class="section-desc">تفاصيل كل صفحة في التطبيق مع تقييم حالتها واختبار التدفق الكامل</div>
</div>

<div class="body-text">
يحتوي تطبيق VIXOR على 24 صفحة مسجلة في نظام التوجيه، مقسمة إلى صفحات عامة (<span class="en">Public</span>) وصفحات محمية تتطلب مصادقة. جميع الصفحات المحمية تخضع لحراسة <span class="en">Auth Guard</span> التي تتحقق من جلسة <span class="en">Supabase</span> أو تحاول تسجيل الدخول تلقائيا عبر بيانات تيليجرام. فيما يلي تحليل تفصيلي لكل صفحة مع نتائج الاختبار.
</div>

<!-- Page: Home -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        الصفحة الرئيسية — <span class="en">/</span>
    </div>
    <div class="body-text">
        الصفحة الرئيسية هي نقطة الدخول الأساسية وتعرض لوحة تحكم شاملة تحتوي على أربعة أقسام رئيسية. أولا شريط الإحصائيات (<span class="en">StatsRow</span>) الذي يعرض أسعار <span class="en">BTC</span> و<span class="en">ETH</span> و<span class="en">SOL</span> مع نسب التغير اليومية عند عدم وجود محفظة، أو بيانات المحفظة عند وجود صفقات. ثانيا بطاقة نظرة عامة على السوق (<span class="en">Market Overview</span>) التي تعرض العملات الرئيسية مع أسعارها وحجم التداول. ثالثا شبكة من ثلاثة أعمدة تحتوي على المحفظة والإشارات والإجراءات السريعة والتحليلات. تم إصلاح خطأ <span class="en">null btcPrice</span> الذي كان يمنع الصفحة من العرض، والآن تعمل بشكل صحيح مع بيانات حية من <span class="en">Binance</span> أو <span class="en">CoinGecko</span> كاحتياطي.
    </div>
    <div class="body-text">
        <strong>المشكلة الحالية:</strong> الصفحة تعرض فقط 8 عملات بدون أيقونات أو صور للعملات. واجهة برمجة <span class="en">API</span> الخاصة بسوق العملات تعيد بيانات أساسية فقط (<span class="en">symbol, price, change24h, volume24h</span>) بدون حقول <span class="en">image, name, marketCap</span> المطلوبة للعرض الكامل في الواجهة. بالإضافة إلى ذلك أيقونات العملات تظهر كحروف مختصرة داخل دوائر بدلا من صور حقيقية.
    </div>
</div>

<!-- Page: Discover -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        اكتشاف العملات — <span class="en">/discover</span>
    </div>
    <div class="body-text">
        صفحة الاكتشاف تعرض توكنات من سلسلة <span class="en">DEX</span> مع بيانات تفصيلية تشمل السعر وحجم التداول والسيولة والقيمة السوقية ودرجة الاكتشاف. تدعم البحث والتصفية حسب الاتجاه (<span class="en">Trending</span>) أو الحجم أو التغير أو السيولة أو الأموال الذكية. كل توكن يعرض رمز السلسلة وواسم العملة وعلامة <span class="en">HONEYPOT</span> عند اكتشافها. البيانات تأتي من <span class="en">DexScreener</span> مع أنظمة حماية من الطلب المتكرر عبر <span class="en">LRU Cache</span>.
    </div>
</div>

<!-- Page: Signals -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        الإشارات — <span class="en">/signals</span>
    </div>
    <div class="body-text">
        صفحة الإشارات تعرض إشارات التحليل الفني اليومية من قاعدة بيانات <span class="en">daily_signals</span>. تدعم تصفية حسب النوع (<span class="en">BUY/SELL/WAIT</span>) مع عرض كل إشارة بما في ذلك الزوج والإطار الزمني ومستوى الثقة ونقاط الدخول ووقف الخسارة وأهداف الربح. تقرأ البيانات من <span class="en">Supabase</span> عبر وظيفة <span class="en">getDailySignals</span>. الإشارات تعرض الأسباب والأنماط الفنية المكتشفة مع شريط تقدم للثقة.
    </div>
</div>

<!-- Page: Copilot -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        المساعد الذكي — <span class="en">/copilot</span>
    </div>
    <div class="body-text">
        صفحة المساعد الذكي هي أكبر صفحة في التطبيق (حوالي 2000 سطر). توفر واجهة محادثة كاملة مع ذكاء اصطناعي تدعم تدفق <span class="en">SSE Streaming</span>. تتضمن محادثات متعددة مع إدارة القوائم والبحث وإعادة التسمية والحذف. يمكن إرفاق بيانات الرسوم البيانية من صفحة <span class="en">Charts</span>. محمية بنظام تحديد المعدل بحد أقصى 20 طلب في الدقيقة لكل مستخدم. تستخدم نقطة نهاية <span class="en">/api/copilot-stream</span> مع مصادقة عبر رمز <span class="en">Bearer</span>.
    </div>
</div>

<!-- Page: Analyze -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        تحليل الرسوم البيانية — <span class="en">/analyze</span>
    </div>
    <div class="body-text">
        صفحة التحليل تسمح للمستخدم رفع صورة رسم بياني أو لصقها من الحافظة ثم تحليلها باستخدام محرك <span class="en">SMC/ICT</span> المحلي. تدعم أزواج تداول متعددة (<span class="en">XAU/USD, EUR/USD, BTC/USDT</span> وغيرها) مع كشف تلقائي للزوج عبر <span class="en">VLM</span>. يعرض تقدم التحليل عبر أربع مراحل (اتصال واستخراج وحساب وتوليد). يتطلب 10 نقاط لكل تحليل للمستخدمين غير المميزين. يمكن الانتقال من صفحة الرسوم البيانية مباشرة مع الصورة الملتقطة كمعامل بحث.
    </div>
</div>

<!-- Page: Whale -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-yellow">بيانات محدودة</span>
        تنبيهات الحيتان — <span class="en">/whale</span>
    </div>
    <div class="body-text">
        صفحة تنبيهات الحيتان تعرض أكبر الصفقات مرتبة حسب القيمة. تقرأ البيانات من <span class="en">getWhaleData</span> وتعرض إحصائيات مثل حجم التداول في 24 ساعة وعدد الصفقات الكبيرة وأكبر صفقة. كل صفقة تعرض الاتجاه (<span class="en">LONG/SHORT</span>) والزوج والحجم والسعر والقيمة. الحالة تعتمد على وجود صفقات مسجلة في قاعدة البيانات، فإذا لم يكن هناك صفقات تظهر حالة فارغة.
    </div>
</div>

<!-- Page: PnL -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        متتبع الأرباح والخسائر — <span class="en">/pnl</span>
    </div>
    <div class="body-text">
        صفحة تتبع الأرباح والخسائر تعرض جدولا شاملا لجميع الصفقات المسجلة مع حسابات تفصيلية تشمل إجمالي الربح والخسارة ومعدل الفوز وعامل الربح وأفضل صفقة. الجدول يحتوي على 8 أعمدة: الزوج والاتجاه وسعر الدخول وسعر الخروج والكمية والربح ومضاعف <span class="en">R</span> والمدة. يدعم عرض 100 صفقة مع إمكانية التصفية بين الصفقات المغلقة والمفتوحة.
    </div>
</div>

<!-- Page: Bags -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        محفظتي — <span class="en">/bags</span>
    </div>
    <div class="body-text">
        صفحة المحفظة تعرض الأصول المملوكة مع بيانات تفصيلية لكل أصل تشمل الكمية وسعر الدخول المتوسط والقيمة الحالية والربح والخسارة. تستخدم بيانات من <span class="en">getPortfolioData</span>. عند عدم وجود أصول تظهر حالة فارغة مع زر الانتقال إلى <span class="en">Trade Desk</span> لتسجيل صفقة جديدة.
    </div>
</div>

<!-- Page: Trade Desk -->
<div class="card">
    <div class="card-title">
        <span class="badge badge-green">يعمل</span>
        مكتب التداول — <span class="en">/trade-desk</span>
    </div>
    <div class="body-text">
        صفحة مكتب التداول هي واجهة تسجيل الصفقات الكاملة التي تدعم أزواج <span class="en">Forex</span> و<span class="en">Crypto</span>. تحتوي على نموذج تفصيلي لإدخال الصفقة يشمل اختيار الزوج والاتجاه والكمية وسعر الدخول ووقف الخسارة وأهداف الربح مع حسابات تلقائية لنقاط البيب والربح المحتمل. تتضمن لوحة تحكم بالمخاطر (<span class="en">Governor Risk Panel</span>) ونصائح مدرب التداول (<span class="en">Coach Overlay</span>). تعرض أيضا قائمة الصفقات السابقة مع إمكانية التصفح عبر أرقام الصفحات.
    </div>
</div>

<!-- Remaining pages table -->
<div class="subsection">
    <div class="subsection-title">باقي الصفحات</div>
</div>

<div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>الصفحة</th>
                <th>المسار</th>
                <th>الوظيفة</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>إشارات ألفا</td>
                <td><span class="en">/alpha</span></td>
                <td>تغذية الإشارات والتحليلات مع الثقة والأهداف</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>الرؤية</td>
                <td><span class="en">/vision</span></td>
                <td>أحدث التحليلات الفنية من المحرك</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>التوقعات</td>
                <td><span class="en">/predictions</span></td>
                <td>توقعات الأسعار مع مستويات المخاطر</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المحفظة التفصيلية</td>
                <td><span class="en">/portfolio</span></td>
                <td>عرض المحفظة مع التوزيع والرسوم البيانية</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>الرسوم البيانية</td>
                <td><span class="en">/charts</span></td>
                <td>رسوم شموع مع مؤشرات فنية</td>
                <td><span class="badge badge-gray">قريبا</span></td>
            </tr>
            <tr>
                <td>المحاكاة الخلفية</td>
                <td><span class="en">/backtest</span></td>
                <td>محاكاة استراتيجيات التداول التاريخية</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>العقود الدائمة</td>
                <td><span class="en">/perpetuals</span></td>
                <td>مراقبة المراكز المفتوحة والمغلقة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المحفظة اللامركزية</td>
                <td><span class="en">/wallet-web3</span></td>
                <td>ربط محافظ <span class="en">Phantom/MetaMask</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المراجع</td>
                <td><span class="en">/journal</span></td>
                <td>مذكرة التداول اليومية</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المتتبعون</td>
                <td><span class="en">/trackers</span></td>
                <td>تتبع الأصول المحددة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>الإعدادات</td>
                <td><span class="en">/settings</span></td>
                <td>إعدادات المستخدم والتطبيق</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المشاركة</td>
                <td><span class="en">/referral</span></td>
                <td>نظام الإحالة والمكافآت</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المكافآت</td>
                <td><span class="en">/rewards</span></td>
                <td>نظام النقاط والمكافآت</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>الميزانية</td>
                <td><span class="en">/premium</span></td>
                <td>خطط الاشتراك المميز</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>الملف الشخصي</td>
                <td><span class="en">/profile</span></td>
                <td>بيانات المستخدم والرصيد</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>النشاط</td>
                <td><span class="en">/activity-web3</span></td>
                <td>سجل النشاطات على السلسلة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المجتمعات</td>
                <td><span class="en">/communities</span></td>
                <td>مجتمعات التداول</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المنحنيات</td>
                <td><span class="en">/curves</span></td>
                <td>منحنات العائد</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>العوائد</td>
                <td><span class="en">/yield</span></td>
                <td>فرص العائد من <span class="en">DeFi</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>النبض</td>
                <td><span class="en">/pulse</span></td>
                <td>نبض السوق الحي</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>الحلقة اليومية</td>
                <td><span class="en">/daily-loop</span></td>
                <td>روتين التداول اليومي</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>المسابقات</td>
                <td><span class="en">/experiments</span></td>
                <td>اختبارات الاستراتيجيات</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>التحكيم</td>
                <td><span class="en">/arbitrage</span></td>
                <td>فحص فرص التحكيم</td>
                <td><span class="badge badge-gray">قريبا</span></td>
            </tr>
            <tr>
                <td>الإشعارات</td>
                <td><span class="en">/notifications</span></td>
                <td>مركز الإشعارات</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>توكين مفصل</td>
                <td><span class="en">/token/$symbol</span></td>
                <td>تفاصيل التوكين الفردي</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td>نتيجة تحليل</td>
                <td><span class="en">/analysis/$id</span></td>
                <td>عرض نتيجة التحليل المكتمل</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
        </tbody>
    </table>
</div>

<!-- Chapter 3: API Endpoints -->
<div class="chapter-header">
    <div class="section-tag">Chapter 03</div>
    <div class="section-title">نقاط نهاية API ونتائج الاختبار</div>
    <div class="divider"></div>
    <div class="section-desc">تفاصيل جميع نقاط النهاية الخلفية مع حالتها التشغيلية</div>
</div>

<div class="body-text">
يعتمد التطبيق على نظام مزدوج لنقاط النهاية: مسارات <span class="en">Nitro</span> في <span class="en">server/api/</span> التي تُنفذ على <span class="en">Vercel</span> ومسارات <span class="en">TanStack</span> في <span class="en">src/routes/api/</span>. النقاط الحرجة التي تخدم البيانات للواجهة الأمامية هي مسارات <span class="en">Nitro</span>. تم اختبار جميع النقاط وتقييم حالتها.
</div>

<div class="table-wrapper">
    <table>
        <thead>
            <tr>
                <th>النقطة</th>
                <th>الطريقة</th>
                <th>الوظيفة</th>
                <th>المصادقة</th>
                <th>الحالة</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="en">/api/market-overview</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>أسعار 8 عملات رئيسية</td>
                <td>عامة</td>
                <td><span class="badge badge-yellow">يعمل مع نواقص</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/discover</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>اكتشاف التوكنات من <span class="en">DEX</span></td>
                <td>عامة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/copilot-stream</span></td>
                <td><span class="badge badge-purple">POST</span></td>
                <td>محادثة ذكاء اصطناعي متدفقة</td>
                <td><span class="badge badge-red">مطلوبة</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/health</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>فحص صحة الخدمات</td>
                <td><span class="badge badge-red">مطلوبة</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/wallet/connect</span></td>
                <td><span class="badge badge-purple">POST</span></td>
                <td>ربط المحفظة اللامركزية</td>
                <td><span class="badge badge-red">مطلوبة</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/wallet/session</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>جلسة المحفظة</td>
                <td><span class="badge badge-red">مطلوبة</span></td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/wallet/ip-fingerprint</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>بصمة عنوان الآي بي</td>
                <td>عامة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/generate-signals</span></td>
                <td><span class="badge badge-purple">POST</span></td>
                <td>توليد إشارات تداول</td>
                <td>محدودة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/dexscreener</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>بيانات <span class="en">DexScreener</span></td>
                <td>عامة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/sol-price</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>سعر سولانا</td>
                <td>عامة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/check-alerts</span></td>
                <td><span class="badge badge-purple">POST</span></td>
                <td>فحص تنبيهات الأسعار</td>
                <td>محدودة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/metrics</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>مقاييس الأداء</td>
                <td>محدودة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/arbitrage-scan</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>فحص فرص التحكيم</td>
                <td>عامة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/discover/scan</span></td>
                <td><span class="badge badge-blue">GET</span></td>
                <td>مسح تفصيلي للتوكنات</td>
                <td>عامة</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
            <tr>
                <td><span class="en">/api/telegram-webhook</span></td>
                <td><span class="badge badge-purple">POST</span></td>
                <td>استقبال ويب هوك تيليجرام</td>
                <td>توقيع</td>
                <td><span class="badge badge-green">يعمل</span></td>
            </tr>
        </tbody>
    </table>
</div>

<!-- Chapter 4: Auth Flow -->
<div class="chapter-header">
    <div class="section-tag">Chapter 04</div>
    <div class="section-title">تدفق المصادقة</div>
    <div class="divider"></div>
    <div class="section-desc">كيفية عمل نظام المصادقة التلقائي داخل تيليجرام</div>
</div>

<div class="body-text">
نظام المصادقة في VIXOR مصمم ليكون شفافا تماما للمستخدمين الذين يفتحون التطبيق من داخل تيليجرام. يعمل عبر ثلاث طبقات متتالية تضمن تجربة سلسة. عند زيارة أي صفحة محمية يتم تنفيذ <span class="en">beforeLoad</span> في مسار <span class="en">/_authenticated/route.tsx</span> الذي يتحقق أولا من وجود عميل <span class="en">Supabase</span> ثم يحاول التحقق من الجلسة الحالية.
</div>

<div class="flow-steps">
    <div class="flow-step">
        <div class="step-num">1</div>
        <div class="step-content">
            <div class="step-title">التحقق من <span class="en">Supabase</span></div>
            <div class="step-desc">النظام يتحقق من تهيئة عميل <span class="en">Supabase</span>. إذا لم يكن مهيأ يتم تحويل المستخدم فورا إلى صفحة تسجيل الدخول. هذا يحمي التطبيق من العمل بدون قاعدة بيانات.</div>
        </div>
    </div>
    <div class="flow-step">
        <div class="step-num">2</div>
        <div class="step-content">
            <div class="step-title">التحقق من الجلسة الحالية</div>
            <div class="step-desc">يتم استدعاء <span class="en">getSession()</span> من <span class="en">Supabase Auth</span>. إذا كانت هناك جلسة صالحة يتم السماح بالوصول فورا وتمرير بيانات المستخدم إلى الصفحة المطلوبة.</div>
        </div>
    </div>
    <div class="flow-step">
        <div class="step-num">3</div>
        <div class="step-content">
            <div class="step-title">تسجيل الدخول التلقائي عبر تيليجرام</div>
            <div class="step-desc">إذا لم تكن هناك جلسة يتحقق النظام من وجود بيانات تهيئة تيليجرام (<span class="en">initData</span>). إذا وجدت يتم استدعاء <span class="en">telegramSignIn()</span> الذي يستخرج معرف المستخدم من تيليجرام ويولد بريدا وكلمة مرور ثم يسجل الدخول تلقائيا عبر <span class="en">signInWithPassword</span>.</div>
        </div>
    </div>
    <div class="flow-step">
        <div class="step-num">4</div>
        <div class="step-content">
            <div class="step-title">التحويل لصفحة المصادقة</div>
            <div class="step-desc">إذا فشلت جميع محاولات المصادقة (لا جلسة ولا بيانات تيليجرام) يتم تحويل المستخدم إلى <span class="en">/auth</span>. يعالج النظام أيضا أخطاء انتهاء صلاحية الرمز والجلسة بشكل أنيق.</div>
        </div>
    </div>
</div>

<!-- Chapter 5: Issues Found -->
<div class="chapter-header">
    <div class="section-tag">Chapter 05</div>
    <div class="section-title">المشاكل المكتشفة</div>
    <div class="divider"></div>
    <div class="section-desc">المشاكل التي تم اكتشافها أثناء الاختبار مع تصنيفها حسب الأولوية</div>
</div>

<div class="stat-row">
    <div class="stat-card bearish">
        <div class="stat-value">3</div>
        <div class="stat-label">مشاكل حرجة</div>
    </div>
    <div class="stat-card warn">
        <div class="stat-value">5</div>
        <div class="stat-label">مشاكل متوسطة</div>
    </div>
    <div class="stat-card info">
        <div class="stat-value">6</div>
        <div class="stat-label">نقاط تحسين</div>
    </div>
</div>

<div class="subsection"><div class="subsection-title">مشاكل حرجة (الأولوية القصوى)</div></div>

<div class="issue-card">
    <div class="issue-title">1. بيانات سوق العملات غير مكتملة</div>
    <div class="issue-desc">
        نقطة نهاية <span class="en">/api/market-overview</span> تعيد بيانات أساسية فقط (<span class="en">symbol, price, change24h, volume24h</span>) بدون حقول <span class="en">image, name, marketCap</span>. هذا يسبب عرض العملات بدون أيقونات حقيقية أو أسماء كاملة أو قيم سوقية في الصفحة الرئيسية. المشكلة في كلا المسارين: مسار <span class="en">Binance</span> لا يستدعي البيانات الوصفية ومسار <span class="en">CoinGecko</span> لديه البيانات (<span class="en">image, name, market_cap</span>) لكن لا يشملها في الاستجابة. كذلك عدد العملات محدود بـ 8 فقط.
    </div>
    <div class="issue-meta">
        <span class="badge badge-red">حرج</span>
        <span class="badge badge-blue">market-overview.ts</span>
        <span class="badge badge-purple">الصفحة الرئيسية</span>
    </div>
</div>

<div class="issue-card">
    <div class="issue-title">2. خطأ <span class="en">CSP</span> قد يمنع تحميل صور العملات</div>
    <div class="issue-desc">
        رأس <span class="en">Content-Security-Policy</span> في <span class="en">vite.config.ts</span> يسمح فقط بـ <span class="en">api.coingecko.com</span> في <span class="en">connect-src</span>. إذا تم إضافة صور من مصادر أخرى (مثل <span class="en">assets.coingecko.com</span> أو <span class="en">coin-images.coingecko.com</span>) فستحتاج إلى تحديث الـ <span class="en">CSP</span> لتشمل هذه النطاقات. أيضا تحتاج إلى إضافة <span class="en">img-src</span> مناسب لعرض الصور.
    </div>
    <div class="issue-meta">
        <span class="badge badge-red">حرج</span>
        <span class="badge badge-blue">vite.config.ts</span>
        <span class="badge badge-purple">أمان</span>
    </div>
</div>

<div class="issue-card">
    <div class="issue-title">3. أيقونات العملات تعرض كأحرف مختصرة</div>
    <div class="issue-desc">
        جميع الواجهات التي تعرض عملات (الصفحة الرئيسية والمحفظة واكتشاف) تستخدم حروفين من رمز العملة داخل دائرة ملونة كبديل عن الصورة الحقيقية. هذا يقلل من الجودة البصرية بشكل كبير ويجعل التطبيق يبدو غير مكتمل. الحل يتطلب تمرير حقول الصور من الـ <span class="en">API</span> وتحديث مكونات العرض لاستخدامها.
    </div>
    <div class="issue-meta">
        <span class="badge badge-red">حرج</span>
        <span class="badge badge-blue">UI Components</span>
        <span class="badge badge-purple">تجربة المستخدم</span>
    </div>
</div>

<div class="subsection"><div class="subsection-title">مشاكل متوسطة</div></div>

<div class="issue-card warn">
    <div class="issue-title">4. لا يوجد <span class="en">Upstash Redis</span> مهيأ</div>
    <div class="issue-desc">
        متغيرات البيئة <span class="en">UPSTASH_REDIS_REST_URL</span> و<span class="en">UPSTASH_REDIS_REST_TOKEN</span> غير مضبوطة. النظام يتراجع إلى ذاكرة داخلية وهو مقبول للنشرات أحادية الخادم لكنه غير مناسب للتوسع. هذا يعني أن ذاكرة التخزين المؤقت لا تتشارك بين مثيلات الخادم على <span class="en">Vercel</span>.
    </div>
    <div class="issue-meta">
        <span class="badge badge-yellow">متوسط</span>
        <span class="badge badge-blue">البنية التحتية</span>
    </div>
</div>

<div class="issue-card warn">
    <div class="issue-title">5. صفحتان بوضع "قريبا" بدون وظائف فعلية</div>
    <div class="issue-desc">
        صفحتا الرسوم البيانية (<span class="en">/charts</span>) والتحكيم (<span class="en">/arbitrage</span>) تعرضان فقط رسالة "قريبا" مع وصف الميزات المتوقعة. الرسوم البيانية ميزة أساسية لأي تطبيق تداول والتحكيم تم بناء محركه الكامل في <span class="en">src/domains/arbitrage/</span> لكن الواجهة غير متصلة.
    </div>
    <div class="issue-meta">
        <span class="badge badge-yellow">متوسط</span>
        <span class="badge badge-blue">المحتوى</span>
    </div>
</div>

<div class="issue-card warn">
    <div class="issue-title">6. محدودية عدد العملات في الصفحة الرئيسية</div>
    <div class="issue-desc">
        استعلام <span class="en">Binance</span> في نقطة نهاية السوق يطلب فقط 8 عملات محددة (<span class="en">BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX</span>). هذا يترك فجوة كبيرة مقارنة بتطبيقات التداول المنافسة التي تعرض عشرات أو مئات العملات.
    </div>
    <div class="issue-meta">
        <span class="badge badge-yellow">متوسط</span>
        <span class="badge badge-blue">market-overview.ts</span>
    </div>
</div>

<div class="issue-card warn">
    <div class="issue-title">7. عدم وجود معالجة أخطاء شاملة في الواجهة</div>
    <div class="issue-desc">
        بعض الصفحات تعتمد على رسائل فارغة عند فشل جلب البيانات بينما البعض الآخر يعرض حالات شبه فارغة. لا يوجد نظام إشعارات موحد للتعامل مع أخطاء الشبكة أو انتهاء صلاحية الجلسة أو معدل الطلبات. المستخدم لا يتلقى ملاحظات واضحة عند حدوث مشاكل.
    </div>
    <div class="issue-meta">
        <span class="badge badge-yellow">متوسط</span>
        <span class="badge badge-blue">UI/UX</span>
    </div>
</div>

<div class="issue-card warn">
    <div class="issue-title">8. نقطة نهاية الصحة محمية بشكل مفرط</div>
    <div class="issue-desc">
        <span class="en">/api/health</span> يتطلب مصادقة في بيئة الإنتاج وهو ما يمنع أدوات المراقبة الخارجية من الوصول إليه. يمكن حله بإضافة رمز صحي مخصص للمتابعة أو استخدام <span class="en">Vercel Cron Header</span> فقط.
    </div>
    <div class="issue-meta">
        <span class="badge badge-yellow">متوسط</span>
        <span class="badge badge-blue">health.ts</span>
    </div>
</div>

<!-- Chapter 6: Improvement Recommendations -->
<div class="chapter-header">
    <div class="section-tag">Chapter 06</div>
    <div class="section-title">نقاط التحسين المقترحة</div>
    <div class="divider"></div>
    <div class="section-desc">توصيات مفصلة لتحسين التطبيق مع تصنيف حسب الأولوية والتأثير</div>
</div>

<div class="priority-grid">
    <div class="priority-item" style="border-right: 3px solid var(--c-bearish);">
        <div class="p-header">
            <span class="p-title">إثراء بيانات السوق</span>
            <span class="badge badge-red">P0</span>
        </div>
        <div class="p-desc">تحديث <span class="en">server/api/market-overview.ts</span> لإضافة حقول <span class="en">image</span> و<span class="en">name</span> و<span class="en">marketCap</span> في كلا المسارين (<span class="en">Binance</span> و<span class="en">CoinGecko</span>). تفضيل <span class="en">CoinGecko</span> كمسار أساسي لأنه يوفر هذه البيانات بشكل مباشر. زيادة عدد العملات إلى 20-50 عملة.</div>
    </div>
    <div class="priority-item" style="border-right: 3px solid var(--c-bearish);">
        <div class="p-header">
            <span class="p-title">إصلاح أيقونات العملات</span>
            <span class="badge badge-red">P0</span>
        </div>
        <div class="p-desc">تحديث مكونات <span class="en">MarketTokenRow</span> و<span class="en">HoldingRow</span> و<span class="en">BagRow</span> لاستخدام صور العملات من رابط <span class="en">image</span> الذي سيوفره الـ <span class="en">API</span>. إضافة <span class="en">fallback</span> للحرف المختصر عند فشل تحميل الصورة.</div>
    </div>
    <div class="priority-item" style="border-right: 3px solid var(--c-warn);">
        <div class="p-header">
            <span class="p-title">إضافة <span class="en">Redis</span> للتخزين المؤقت</span>
            <span class="badge badge-yellow">P1</span>
        </div>
        <div class="p-desc">تهيئة <span class="en">Upstash Redis</span> لمشاركة ذاكرة التخزين المؤقت بين مثيلات الخادم. هذا سيحسن أداء <span class="en">API</span> بشكل كبير عن طريق تقليل الاستدعاءات الخارجية وتسريع الاستجابات.</div>
    </div>
    <div class="priority-item" style="border-right: 3px solid var(--c-warn);">
        <div class="p-header">
            <span class="p-title">نظام إشعارات موحد</span>
            <span class="badge badge-yellow">P1</span>
        </div>
        <div class="p-desc">بناء مكون إشعارات مركزي يعرض أخطاء الشبكة وانتهاء الجلسة ومعدل الطلبات بأشكال واضحة للمستخدم. استبدال الحالات الفارغة الحالية بإشعارات قابلة للتفاعل مع أزرار إعادة المحاولة.</div>
    </div>
    <div class="priority-item" style="border-right: 3px solid var(--c-primary);">
        <div class="p-header">
            <span class="p-title">تفعيل صفحة الرسوم البيانية</span>
            <span class="badge badge-blue">P2</span>
        </div>
        <div class="p-desc">ربط مكون <span class="en">TradingViewChart</span> الموجود مع بيانات حية من <span class="en">Binance</span> أو <span class="en">TwelveData</span>. المكون موجود فعلا في المشروع (<span class="en">src/components/vixor/TradingViewChart.tsx</span>) لكن الصفحة تعرض وضع "قريبا".</div>
    </div>
    <div class="priority-item" style="border-right: 3px solid var(--c-primary);">
        <div class="p-header">
            <span class="p-title">تفعيل ماسح التحكيم</span>
            <span class="badge badge-blue">P2</span>
        </div>
        <div class="p-desc">محرك التحكيم مكتمل بالفعل في <span class="en">src/domains/arbitrage/</span> مع استراتيجيات ثلاثية وعبر <span class="en">DEX</span> وعبر <span class="en">CEX-DEX</span>. يحتاج فقط ربط الواجهة بالنقطة الخلفية <span class="en">/api/arbitrage-scan</span>.</div>
    </div>
</div>

<div class="subsection"><div class="subsection-title">تحسينات إضافية على مستوى الكود</div></div>

<ul class="item-list">
    <li><div class="bullet"></div>
        <div>تحديث سياسة أمان المحتوى (<span class="en">CSP</span>) لإضافة نطاقات صور العملات مثل <span class="en">assets.coingecko.com</span> و<span class="en">coin-images.coingecko.com</span> إلى كل من <span class="en">img-src</span> و<span class="en">connect-src</span></div>
    </li>
    <li><div class="bullet"></div>
        <div>إضافة نظام تسجيل مركزي (<span class="en">structured logging</span>) بدلا من <span class="en">console.log</span> المتناثر عبر الملفات لتحسين المراقبة في بيئة الإنتاج</div>
    </li>
    <li><div class="bullet"></div>
        <div>إضافة اختبارات وحدة (<span class="en">unit tests</span>) لنقاط النهاية الحرجة مثل <span class="en">market-overview</span> و<span class="en">discover</span> لضمان عدم الانتكاس</div>
    </li>
    <li><div class="bullet"></div>
        <div>تحسين أداء الصفحة الرئيسية بإضافة <span class="en">prefetching</span> للبيانات في الخلفية وتقليل عدد الاستدعاءات المتكررة لنفس البيانات</div>
    </li>
    <li><div class="bullet"></div>
        <div>إضافة دعم اللغة العربية الكامل في واجهة المستخدم مع اتجاه النص من اليمين لليسار لتجربة أفضل لمتحدثي العربية</div>
    </li>
    <li><div class="bullet"></div>
        <div>تنظيف المسارات المكررة في <span class="en">src/routes/api/</span> التي لا تعمل على <span class="en">Vercel</span> ونقل المنطق إلى مسارات <span class="en">Nitro</span> الموحدة</div>
    </li>
</ul>

<!-- Chapter 7: Architecture Summary -->
<div class="chapter-header">
    <div class="section-tag">Chapter 07</div>
    <div class="section-title">ملخص البنية التقنية</div>
    <div class="divider"></div>
    <div class="section-desc">نظرة شاملة على بنية التطبيق والنطاقات والمكونات المشتركة</div>
</div>

<div class="body-text">
يبني VIXOR على بنية نطاقات (<span class="en">Domains</span>) منظمة حيث يُفصل كل مجال وظيفي في مجلد مستقل يحتوي على الأنواع والوظائف والمنطق. يوجد 6 نطاقات رئيسية هي: التداول (<span class="en">Trading</span>)، المحفظة اللامركزية (<span class="en">Wallet</span>)، التحليل الفني (<span class="en">Analysis</span>) مع محرك <span class="en">SMC/ICT</span> كامل، الاكتشاف (<span class="en">Discovery</span>) مع عملاء متعددين لبيانات <span class="en">DEX</span>، المساعد الذكي (<span class="en">Copilot</span>) مع نظام وكلاء متعدد الأدوار، والتحكيم (<span class="en">Arbitrage</span>) مع استراتيجيات متنوعة.
</div>

<div class="body-text">
تشمل المكونات المشتركة نظام مقاومة متكامل يحتوي على مقسم معدل الطلبات (<span class="en">Rate Limiter</span>) بنافذة انزلاقية، وقاطع الدوائر (<span class="en">Circuit Breaker</span>)، وذاكرة <span class="en">LRU Cache</span>. كذلك يوجد نظام إشعارات متعدد القنوات يدعم البريد الإلكتروني وويب هوك وتيليجرام والإشعارات داخل التطبيق. نظام التدويل (<span class="en">i18n</span>) يدعم العربية والإنجليزية مع ملفات ترجمة منفصلة.
</div>

<div class="body-text">
قاعدة البيانات تعتمد على <span class="en">Supabase</span> مع 18 عملية ترحيل (<span class="en">migration</span>) تغطي جميع جداول التطبيق من المستخدمين والصفقات والإشارات إلى المحادثات والتنبيهات والمدفوعات. يتم تطبيق سياسات أمان على مستوى الصف (<span class="en">Row Level Security</span>) لحماية بيانات المستخدمين. النشر على <span class="en">Vercel</span> يستخدم <span class="en">nodejs22.x</span> كبيئة تشغيل مع إعدادات محسنة لملف <span class="en">nitro.json</span>.
</div>

</div><!-- /main-content -->

</body>
</html>
"""

# Write HTML file
with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"HTML written to: {HTML_FILE}")
print(f"PDF will be written to: {PDF_FILE}")