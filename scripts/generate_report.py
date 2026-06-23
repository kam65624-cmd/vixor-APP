#!/usr/bin/env python3
"""
Generate Vixor UI/UX Product Documentation Package - 11 Phases
Arabic RTL document using Playwright html2pdf-next.js pipeline
"""
import subprocess
import os
import sys

PDF_SKILL_DIR = os.path.expanduser("~/.openclaw/workspace/skills/pdf")
OUTPUT_DIR = "/home/z/my-project/download"
HTML_FILE = os.path.join(OUTPUT_DIR, "vixor_uiux_report.html")
PDF_FILE = os.path.join(OUTPUT_DIR, "vixor_uiux_product_documentation.pdf")

html_content = r"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vixor - UI/UX Product Documentation Package</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #0a0e1a;
  --surface: #111827;
  --surface2: #1a2035;
  --surface3: #1e2438;
  --text: #e8ecf4;
  --text2: #8899b4;
  --text3: #5a6a84;
  --blue: #3b82f6;
  --blue2: #60a5fa;
  --green: #10b981;
  --red: #ef4444;
  --yellow: #f59e0b;
  --purple: #8b5cf6;
  --border: rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.04);
  --page-w: 210mm;
  --page-h: 297mm;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
  font-size: 10.5pt;
  line-height: 1.7;
  direction: rtl;
  -webkit-font-smoothing: antialiased;
}

@page {
  size: var(--page-w) var(--page-h);
  margin: 18mm 16mm 20mm 16mm;
}

.page {
  width: var(--page-w);
  min-height: var(--page-h);
  padding: 0;
  margin: 0;
  background: var(--bg);
}

/* COVER PAGE */
.cover {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: linear-gradient(160deg, #0a0e1a 0%, #111827 50%, #0f1424 100%);
  position: relative;
  overflow: hidden;
}
.cover::before {
  content: '';
  position: absolute;
  top: -100px;
  left: -100px;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
}
.cover::after {
  content: '';
  position: absolute;
  bottom: -150px;
  right: -150px;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%);
}
.cover-content { position: relative; z-index: 2; }
.cover-badge {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 20px;
  background: rgba(59,130,246,0.12);
  border: 1px solid rgba(59,130,246,0.25);
  color: var(--blue2);
  font-size: 10pt;
  font-weight: 600;
  letter-spacing: 0.1em;
  margin-bottom: 24px;
}
.cover h1 {
  font-size: 32pt;
  font-weight: 900;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}
.cover h1 span { color: var(--blue2); }
.cover-sub {
  font-size: 13pt;
  color: var(--text2);
  margin-bottom: 32px;
  max-width: 500px;
}
.cover-meta {
  display: flex;
  gap: 24px;
  justify-content: center;
  color: var(--text3);
  font-size: 9pt;
}
.cover-meta div { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cover-meta .val { font-size: 14pt; font-weight: 700; color: var(--text); }

/* CONTENT STYLES */
h1.phase-title {
  font-size: 18pt;
  font-weight: 800;
  color: #fff;
  margin: 36px 0 6px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--blue);
  display: flex;
  align-items: center;
  gap: 10px;
}
h1.phase-title .num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--blue);
  color: #fff;
  font-size: 14pt;
  font-weight: 800;
  flex-shrink: 0;
}
h2 {
  font-size: 13pt;
  font-weight: 700;
  color: var(--blue2);
  margin: 20px 0 8px 0;
}
h3 {
  font-size: 11pt;
  font-weight: 700;
  color: var(--text);
  margin: 14px 0 6px 0;
}
p { margin-bottom: 10px; color: var(--text2); }
p.lead { font-size: 11pt; color: var(--text); line-height: 1.8; margin-bottom: 14px; }

/* TABLES */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 16px 0;
  font-size: 9pt;
}
th {
  background: var(--surface2);
  color: var(--text);
  font-weight: 700;
  padding: 8px 10px;
  text-align: right;
  border-bottom: 1px solid var(--border);
  font-size: 8.5pt;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--border2);
  color: var(--text2);
  vertical-align: top;
}
tr:hover td { background: rgba(255,255,255,0.02); }

/* CARDS & CALLOUTS */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin: 10px 0;
}
.card-accent {
  border-right: 3px solid var(--blue);
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 12px 0;
}
.stat-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}
.stat-box .num { font-size: 20pt; font-weight: 800; font-family: 'Inter', monospace; }
.stat-box .label { font-size: 8pt; color: var(--text3); margin-top: 2px; }

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 8pt;
  font-weight: 700;
}
.badge-green { background: rgba(16,185,129,0.15); color: var(--green); }
.badge-red { background: rgba(239,68,68,0.15); color: var(--red); }
.badge-yellow { background: rgba(245,158,11,0.15); color: var(--yellow); }
.badge-blue { background: rgba(59,130,246,0.15); color: var(--blue2); }

ul, ol { padding-right: 20px; margin: 8px 0 12px 0; }
li { margin-bottom: 4px; color: var(--text2); font-size: 9.5pt; }
li strong { color: var(--text); }

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
  margin: 24px 0;
}

/* BREAK INSIDE AVOID for tables and cards */
table, .card, .stat-grid { break-inside: avoid; }
h2, h3 { break-after: avoid; }

/* SCREEN CARD */
.screen-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin: 14px 0;
  break-inside: avoid;
}
.screen-card h3 {
  margin-top: 0;
  color: var(--blue2);
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.screen-card .meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  font-size: 9pt;
  margin-bottom: 10px;
}
.screen-card .meta-item {
  display: flex;
  gap: 6px;
}
.screen-card .meta-label { color: var(--text3); font-weight: 600; min-width: 80px; }
.screen-card .meta-value { color: var(--text); }

/* AI PROMPT BOX */
.ai-prompt-box {
  background: var(--surface2);
  border: 1px solid rgba(59,130,246,0.2);
  border-radius: 10px;
  padding: 16px;
  margin: 14px 0;
  font-family: 'Inter', monospace;
  font-size: 8.5pt;
  line-height: 1.8;
  color: var(--text2);
  white-space: pre-wrap;
  word-break: break-word;
  direction: ltr;
  text-align: left;
}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════
     COVER PAGE
     ═══════════════════════════════════════════ -->
<div class="cover">
  <div class="cover-content">
    <div class="cover-badge">UI/UX PRODUCT DOCUMENTATION</div>
    <h1><span>VIXOR</span> Trading Terminal</h1>
    <div class="cover-sub">Complete Product Design Blueprint — 11 Phases of UI/UX Documentation for Professional Implementation</div>
    <div style="width:60px;height:2px;background:var(--blue);margin:0 auto 24px;border-radius:2px;"></div>
    <div class="cover-meta">
      <div><span class="val">35</span><span>Screen</span></div>
      <div><span class="val">14</span><span>Component</span></div>
      <div><span class="val">13</span><span>API Route</span></div>
      <div><span class="val">11</span><span>Phase</span></div>
    </div>
    <div style="margin-top:24px;font-size:8pt;color:var(--text3);">
      Prepared for Stitch AI Design Generation<br>
      June 2026 &mdash; Version 1.0
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════
     TABLE OF CONTENTS
     ═══════════════════════════════════════════ -->
<div style="padding:20px 0;">
  <h1 class="phase-title"><span class="num">0</span> جدول المحتويات</h1>
  <div style="display:flex;flex-direction:column;gap:6px;margin-top:14px;">
"""

# Generate TOC entries
toc_items = [
    ("1", "Phase 1 — Project Structure Audit", "تدقيق بنية المشروع الحالية"),
    ("2", "Phase 2 — Information Architecture", "هندسة المعلومات المثالية"),
    ("3", "Phase 3 — Screen Inventory", "جرد كامل لكل شاشة"),
    ("4", "Phase 4 — Design System", "نظام التصميم الكامل"),
    ("5", "Phase 5 — Dashboard Specification", "مواصفات لوحة التحكم الرئيسية"),
    ("6", "Phase 6 — Analysis Result Page", "صفحة نتائج التحليل"),
    ("7", "Phase 7 — Lot Size Calculator", "حاسبة حجم الصفقة"),
    ("8", "Phase 8 — Referral System", "نظام الإحالة"),
    ("9", "Phase 9 — Premium Conversion", "تحويل المستخدمين المدفوع"),
    ("10", "Phase 10 — AI Design Export", "برومبت تصميم AI"),
    ("11", "Phase 11 — Development Handoff", "تسليم التطوير"),
]

for num, title_en, title_ar in toc_items:
    html_content += f"""    <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--surface);border-radius:6px;border:1px solid var(--border);">
      <span style="font-size:14pt;font-weight:800;color:var(--blue);min-width:28px;">{num}</span>
      <div>
        <div style="font-size:10pt;font-weight:600;color:var(--text);">{title_ar}</div>
        <div style="font-size:8pt;color:var(--text3);direction:ltr;text-align:left;">{title_en}</div>
      </div>
    </div>\n"""

html_content += """  </div>
</div>

<!-- ═══════════════════════════════════════════
     PHASE 1 — PROJECT STRUCTURE AUDIT
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">1</span> Phase 1 — تدقيق بنية المشروع الحالية</h1>

<h2>1.1 نظرة عامة على المشروع</h2>
<p class="lead">Vixor هو تيرمنال تداول عملات ميمكوين على شبكة سولانا مبني على TanStack Start + Supabase + Vercel. المشروع يحاكي تصميم Axiom.trade مع إضافة ميزات AI متقدمة. يتكون من أكثر من 61,000 سطر كود مصدري موزعة على أكثر من 250 ملف. الإطار التقني يستخدم React 19 مع Vite 7 و Tailwind CSS v4.</p>

<div class="stat-grid">
  <div class="stat-box">
    <div class="num" style="color:var(--blue2);">35</div>
    <div class="label">صفحة مسار (Route)</div>
  </div>
  <div class="stat-box">
    <div class="num" style="color:var(--green);">13</div>
    <div class="label">صفحة حقيقية متصلة</div>
  </div>
  <div class="stat-box">
    <div class="num" style="color:var(--yellow);">22</div>
    <div class="label">صفحة تجريبية (Mock)</div>
  </div>
  <div class="stat-box">
    <div class="num" style="color:var(--red);">1,490+</div>
    <div class="label">استايل مضمن (inline)</div>
  </div>
</div>

<h2>1.2 جميع الصفحات الحالية (35 Route)</h2>

<h3>الصفحات الحقيقية — متصلة بقاعدة البيانات والـ Backend (13 صفحة)</h3>
<table>
<tr><th>الصفحة</th><th>المسار</th><th>الأسطر</th><th>الحالة</th><th>الوصف</th></tr>
<tr><td>Auth</td><td>/auth</td><td style="direction:ltr;">514</td><td><span class="badge badge-green">حقيقي</span></td><td>صفحة تسجيل الدخول عبر تيليجرام مع بديل البريد</td></tr>
<tr><td>Copilot</td><td>/copilot</td><td style="direction:ltr;">1,693</td><td><span class="badge badge-green">حقيقي</span></td><td>محادثة AI متعددة الوكلاء مع سيدبار وطباعة</td></tr>
<tr><td>Daily Loop</td><td>/daily-loop</td><td style="direction:ltr;">1,303</td><td><span class="badge badge-green">حقيقي</span></td><td>حلقة التداول اليومية مع تحليل شامل</td></tr>
<tr><td>Analysis</td><td>/analysis/:id</td><td style="direction:ltr;">948</td><td><span class="badge badge-green">حقيقي</span></td><td>عرض تحليل مفرد مع رسوم بيانية</td></tr>
<tr><td>Token</td><td>/token/:symbol</td><td style="direction:ltr;">762</td><td><span class="badge badge-green">حقيقي</span></td><td>صفحة تفاصيل التوكن مع بيانات حية</td></tr>
<tr><td>Experiments</td><td>/experiments</td><td style="direction:ltr;">793</td><td><span class="badge badge-green">حقيقي</span></td><td>تجارب الاستراتيجيات مع تطور</td></tr>
<tr><td>Backtest</td><td>/backtest</td><td style="direction:ltr;">657</td><td><span class="badge badge-green">حقيقي</span></td><td>محاكي الباكتيست مع آلة حالة</td></tr>
<tr><td>Trade Desk</td><td>/trade-desk</td><td style="direction:ltr;">557</td><td><span class="badge badge-green">حقيقي</span></td><td>مكتب التداول المتقدم</td></tr>
<tr><td>Activity Web3</td><td>/activity-web3</td><td style="direction:ltr;">517</td><td><span class="badge badge-green">حقيقي</span></td><td>نشاطات الـ Web3</td></tr>
<tr><td>Analyze</td><td>/analyze</td><td style="direction:ltr;">502</td><td><span class="badge badge-green">حقيقي</span></td><td>رفع صور الرسم البياني للتحليل</td></tr>
<tr><td>Discover</td><td>/discover</td><td style="direction:ltr;">327</td><td><span class="badge badge-green">حقيقي</span></td><td>اكتشاف التوكنات مع جدول كثيف</td></tr>
<tr><td>Arbitrage</td><td>/arbitrage</td><td style="direction:ltr;">306</td><td><span class="badge badge-green">حقيقي</span></td><td>فحص المراجحة عبر الـ DEX</td></tr>
<tr><td>Index (Dashboard)</td><td>/</td><td style="direction:ltr;">375</td><td><span class="badge badge-yellow">نصف حقيقي</span></td><td>لوحة التحكم الرئيسية - بيانات تجريبية</td></tr>
</table>

<h3>الصفحات التجريبية — بيانات مزيفة بدون اتصال بالخادم (22 صفحة)</h3>
<table>
<tr><th>الصفحة</th><th>المسار</th><th>الأسطر</th><th>الحالة</th><th>المشكلة</th></tr>
<tr><td>Bags</td><td>/bags</td><td>108</td><td><span class="badge badge-red">تجريبي</span></td><td>بيانات WIF/POPCAT/BONK مزيفة - كلها inline styles</td></tr>
<tr><td>Whale</td><td>/whale</td><td>122</td><td><span class="badge badge-red">تجريبي</span></td><td>تنبيهات حيت مزيفة بدون مصدر بيانات حقيقي</td></tr>
<tr><td>Curves</td><td>/curves</td><td>227</td><td><span class="badge badge-red">تجريبي</span></td><td>بيانات منحنيات الربط مزيفة مع فلترات بسيطة</td></tr>
<tr><td>PnL</td><td>/pnl</td><td>130</td><td><span class="badge badge-red">تجريبي</span></td><td>سجل تداولات مزيف بدون اتصال بـ Supabase</td></tr>
<tr><td>Alpha</td><td>/alpha</td><td>165</td><td><span class="badge badge-red">تجريبي</span></td><td>إشارات ألفا مزيفة مع فلتر حسب النوع</td></tr>
<tr><td>Pulse</td><td>/pulse</td><td>186</td><td><span class="badge badge-red">تجريبي</span></td><td>إشارات السوق المزيفة مع لوكان أيقون</td></tr>
<tr><td>Trackers</td><td>/trackers</td><td>360</td><td><span class="badge badge-red">تجريبي</span></td><td>محافظ ذكية ومتداولين ومفضلة مزيفة</td></tr>
<tr><td>Perpetuals</td><td>/perpetuals</td><td>249</td><td><span class="badge badge-red">تجريبي</span></td><td>دفتر أوامر ومواقع مزيف بدون تنفيذ حقيقي</td></tr>
<tr><td>Premium</td><td>/premium</td><td>152</td><td><span class="badge badge-red">تجريبي</span></td><td>خطط اشتراك بدون تكامل دفع حقيقي</td></tr>
<tr><td>Rewards</td><td>/rewards</td><td>186</td><td><span class="badge badge-red">تجريبي</span></td><td>نقاط وأكواب وإحالات مزيفة</td></tr>
<tr><td>Referral</td><td>/referral</td><td>154</td><td><span class="badge badge-red">تجريبي</span></td><td>برنامج إحالة مزيف بدون استمرارية</td></tr>
<tr><td>Vision</td><td>/vision</td><td>149</td><td><span class="badge badge-red">تجريبي</span></td><td>تحليل AI للسوق - ملخص مزيف</td></tr>
<tr><td>Yield</td><td>/yield</td><td>155</td><td><span class="badge badge-red">تجريبي</span></td><td>مزارع العوائد المزيفة بدون بروتوكول حقيقي</td></tr>
<tr><td>Settings</td><td>/settings</td><td>133</td><td><span class="badge badge-red">تجريبي</span></td><td>إعدادات بدون حفظ في قاعدة البيانات</td></tr>
<tr><td>Profile</td><td>/profile</td><td>185</td><td><span class="badge badge-red">تجريبي</span></td><td>ملف شخصي مزيف "DegenKing"</td></tr>
<tr><td>Predictions</td><td>/predictions</td><td>160</td><td><span class="badge badge-red">تجريبي</span></td><td>سوق التوقعات المزيف</td></tr>
<tr><td>Signals</td><td>/signals</td><td>136</td><td><span class="badge badge-red">تجريبي</span></td><td>إشارات تداول مزيفة</td></tr>
<tr><td>Vision</td><td>/vision</td><td>149</td><td><span class="badge badge-red">تجريبي</span></td><td>تحليل قطاعي مزيف</td></tr>
<tr><td>Portfolio</td><td>/portfolio</td><td>129</td><td><span class="badge badge-red">تجريبي</span></td><td>محفظة مزيفة</td></tr>
<tr><td>Notifications</td><td>/notifications</td><td>110</td><td><span class="badge badge-red">تجريبي</span></td><td>إشعارات مزيفة</td></tr>
<tr><td>Wallet Web3</td><td>/wallet-web3</td><td>137</td><td><span class="badge badge-red">تجريبي</span></td><td>محفظة Web3 بسيطة</td></tr>
<tr><td>Communities</td><td>/communities</td><td>106</td><td><span class="badge badge-red">تجريبي</span></td><td>قائمة مجتمعات مزيفة</td></tr>
<tr><td>Journal</td><td>/journal</td><td>151</td><td><span class="badge badge-red">تجريبي</span></td><td>يوميات تداول مزيفة</td></tr>
</table>

<h2>1.3 جميع المكونات (14 Component)</h2>
<table>
<tr><th>المكون</th><th>الأسطر</th><th>الحالة</th><th>الوصف</th></tr>
<tr><td>AppShell</td><td>311</td><td><span class="badge badge-green">حقيقي</span></td><td>الهيكل الرئيسي مع شريط تنقل علوي وسفلي يحاكي Axiom</td></tr>
<tr><td>atoms.tsx</td><td>441</td><td><span class="badge badge-green">حقيقي</span></td><td>عناصر UI قابلة لإعادة الاستخدام (RecBadge, ConfidenceBar)</td></tr>
<tr><td>CoachOverlay</td><td>337</td><td><span class="badge badge-green">حقيقي</span></td><td>تراكب AI Coach</td></tr>
<tr><td>GovernorRiskPanel</td><td>383</td><td><span class="badge badge-green">حقيقي</span></td><td>لوحة حوكام المخاطر</td></tr>
<tr><td>HunterScoreCard</td><td>372</td><td><span class="badge badge-green">حقيقي</span></td><td>بطاقة تقييم الـ Hunter Agent</td></tr>
<tr><td>NoteEditorDialog</td><td>369</td><td><span class="badge badge-green">حقيقي</span></td><td>محرر الملاحظات</td></tr>
<tr><td>ExpandableWidget</td><td>317</td><td><span class="badge badge-green">حقيقي</span></td><td>ويدجيت قابل للتوسيع</td></tr>
<tr><td>AnalystReportPanel</td><td>272</td><td><span class="badge badge-green">حقيقي</span></td><td>عرض تقرير المحلل</td></tr>
<tr><td>EditAlertDialog</td><td>258</td><td><span class="badge badge-green">حقيقي</span></td><td>تعديل التنبيهات</td></tr>
<tr><td>TradingViewChart</td><td>233</td><td><span class="badge badge-green">حقيقي</span></td><td>مخطط TradingView خفيف</td></tr>
<tr><td>CreateAlertDialog</td><td>239</td><td><span class="badge badge-green">حقيقي</span></td><td>إنشاء تنبيه جديد</td></tr>
<tr><td>AlertsList</td><td>239</td><td><span class="badge badge-green">حقيقي</span></td><td>قائمة التنبيهات</td></tr>
<tr><td>PaginationBar</td><td>175</td><td><span class="badge badge-green">حقيقي</span></td><td>شريط الترقيم</td></tr>
<tr><td>OnboardingModal</td><td>108</td><td><span class="badge badge-green">حقيقي</span></td><td>نافذة التهيئة</td></tr>
<tr><td>42 shadcn/ui</td><td>~</td><td><span class="badge badge-blue">مكتبة</span></td><td>مكونات shadcn/ui قياسية (زر، حوار، إدخال، إلخ)</td></tr>
</table>

<h2>1.4 جميع الـ APIs (13 Route)</h2>
<table>
<tr><th>المسار</th><th>الوظيفة</th><th>الحالة</th></tr>
<tr><td>/api/sol-price</td><td>سعر SOL الحي مع التغيير 24 ساعة</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/discover</td><td>قائمة التوكنات المكتشفة</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/discover/scan</td><td>فحص التوكنات الجديدة</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/dexscreener</td><td>بيانات من DexScreener</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/copilot-stream</td><td>بث AI Copilot (Server-Sent Events)</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/generate-signals</td><td>توليد إشارات التداول AI</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/arbitrage-scan</td><td>فحص فرص المراجحة</td><td><span class="badge badge-green">يعمل</span></tr>
<tr><td>/api/check-alerts</td><td>فحص التنبيهات المحفوظة</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/stars-webhook</td><td>ويب هوك Telegram Stars</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/telegram-webhook</td><td>ويب هوك Telegram</td><td><span class="badge badge-green">يعمل</span></td></tr>
<tr><td>/api/health</td><td>فحص صحة الخادم</td><td><span class="badge badge-green">يعمل</span></tr>
<tr><td>/api/metrics</td><td>مقاييس الأداء</td><td><span class="badge badge-green">يعمل</span></tr>
<tr><td>/api/migrate</td><td>ترحيل قاعدة البيانات</td><td><span class="badge badge-green">يعمل</span></tr>
</table>

<h2>1.5 المشاكل الحرجة المكتشفة</h2>

<div class="card card-accent">
<h3>مشكلة P0 — تعارض نظام الألوان</h3>
<p>المشروع يستخدم نظامين مختلفين للألوان بشكل متزامن. نظام Design System V2 في styles.css يستخدم متغيرات CSS (bg-background, text-foreground) بينما 22 صفحة تجريبية تستخدم ألوان Axiom مضمنة مباشرة (#0f1424, #161b2e, #F0F4FC). هذا يسبب عدم اتساق بصري ولا يسمح بالتبديل بين الوضع الداكن والفاتح. يوجد أكثر من 1,490 حالة استخدام style={{}} مضمن في الملفات التجريبية مقابل 92 حالة استخدام tokens في الملفات الحقيقية.</p>
</div>

<div class="card card-accent">
<h3>مشكلة P1 — متغيرات البيئة فارغة</h3>
<p>ملف .env يحتوي فقط على DATABASE_URL. التطبيق يحتاج إلى أكثر من 15 متغير بيئة للإنتاج بما فيها: مفاتيح Supabase، Telegram Bot Token، مفاتيح TwelveData، Finnhub، مزودي LLM (OpenAI, Anthropic, Groq)، والمزيد. هذا يعني أن كل ميزة تعتمد على API خارجي لن تعمل في البيئة الحية.</p>
</div>

<div class="card card-accent">
<h3>مشكلة P1 — محولات التداول غير مكتملة</h3>
<p>محولات OKX و Bybit بالكامل عبارة عن stubs (دوال فارغة ترجع null). 20 عنصر TODO في هذين الملفين. فقط محول Binance ومحول Dummy لديهما تنفيذ حقيقي. هذا يعني أن ميزة التداول عبر بورص متعددة غير متاحة.</p>
</div>

<div class="card card-accent">
<h3>مشكلة P2 — تطبيق Style Tokens غير متناسق</h3>
<p>ملف __root.tsx في NotFoundComponent و ErrorView يستخدم ألوان Axiom مضمنة بدلاً من tokens التصميم. ملف AppShell.tsx يخلط بين الألوان المضمنة وألوان Axiom. 3 ملفات SQL و ai-gateway.server.ts وبعض ملفات JSON عشوائية في جذر المشروع يجب تنظيمها أو حذفها.</p>
</div>

<h2>1.6 قاعدة بيانات Supabase — الجداول (20 جدول)</h2>
<table>
<tr><th>الجدول</th><th>الوظيفة</th><th>الحالة</th></tr>
<tr><td>profiles</td><td>ملفات المستخدمين الشخصية</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>analyses</td><td>نتائج تحليل التداول</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>notifications</td><td>إشعارات المستخدم</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>points_balances</td><td>أرصدة النقاط</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>points_transactions</td><td>سجل حركات النقاط</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>point_packs</td><td>كتالوج باقات النقاط</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>premium_plans</td><td>خطط الاشتراك</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>premium_subscriptions</td><td>اشتراكات المستخدمين</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>price_alerts</td><td>تنبيهات الأسعار</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>daily_signals</td><td>إشارات اليوم AI</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>user_strategies</td><td>استراتيجيات المستخدم</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>watchlists / watchlist_items</td><td>قوائم المراقبة</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>copilot_conversations / copilot_messages</td><td>محادثات AI</td><td><span class="badge badge-green">m0030ugود</span></td></tr>
<tr><td>trading_notes</td><td>ملاحظات التداول</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>trades</td><td>سجل التداولات</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>daily_loops</td><td>لقطات الحلقة اليومية</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>user_streaks</td><td>سلاسل تسجيل الدخول</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>user_settings</td><td>إعدادات المستخدم</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>agent_tokens / agent_jobs / agent_audit_log</td><td>تتبع الـ Agents</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>experiments / experiment_generations</td><td>تجارب الاستراتيجيات</td><td><span class="badge badge-green">موجود</span></td></tr>
<tr><td>backtest_results</td><td>نتائج الباكتيست</td><td><span class="badge badge-red">مفقود</span></td></tr>
</table>

<!-- ═══════════════════════════════════════════
     PHASE 2 — INFORMATION ARCHITECTURE
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">2</span> Phase 2 — هندسة المعلومات المثالية</h1>

<h2>2.1 التسلسل الهرمي للتنقل</h2>
<p class="lead">التطبيق يستخدم نظام ملفات المسار (File-based Routing) من TanStack Router. الهيكل يتكون من ثلاثة مستويات: الجذر (root)، التخطيط المصدق (_authenticated)، والصفحات الفرعية. كل مستوى يضيف طبقة من التغليف والتحكم. المستخدم غير المصادق يرى فقط صفحة الدخول (/auth)، بينما المستخدم المصادق يرى كل الصفحات مع شريط التنقل العلوي والسفلي.</p>

<div class="card">
<h3>مخطط التنقل</h3>
<ul style="font-size:10pt;">
<li><strong>الجذر (Root):</strong> __root.tsx — يوفر AppShell (الشريط العلوي + السفلي + التخطيط الرئيسي) + ErrorBoundary + I18nProvider + WalletProvider + QueryClientProvider</li>
<li><strong>المستوى المحمي:</strong> _authenticated/route.tsx — يتحقق من الجلسة عبر Supabase ويوفر WorkspaceAutoDetector</li>
<li><strong>الصفحات:</strong> 35 مسار فرعي تحت _authenticated/ — كل صفحة مستقلة في ملفها الخاص</li>
</ul>
</div>

<h2>2.2 خريطة الموقع (Sitemap)</h2>
<div class="card">
<h3>التنقل الأساسي (الشريط العلوي)</h3>
<table>
<tr><th>الصفحة</th><th>الأيقونة</th><th>الأولوية</th></tr>
<tr><td>Rewards</td><td>جائزة</td><td>عالية</td></tr>
<tr><td>Portfolio</td><td>محفظة</td><td>عالية</td></tr>
<tr><td>Vision</td><td>عين</td><td>متوسطة</td></tr>
<tr><td>Yield</td><td>عائد</td><td>متوسطة</td></tr>
<tr><td>Predictions</td><td>رسم بياني</td><td>متوسطة</td></tr>
<tr><td>Perpetuals</td><td>مخاطر</td><td>متوسطة</td></tr>
<tr><td>Trackers</td><td>تتبع</td><td>متوسطة</td></tr>
<tr><td>Pulse</td><td>نبض</td><td>عالية</td></tr>
<tr><td>Discover</td><td>بحث</td><td>عالية جداً</td></tr>
</table>
</div>

<div class="card">
<h3>التنقل السريع (الشريط السفلي — 10 أيقونات)</h3>
<table>
<tr><th>الصفحة</th><th>الأيقونة</th><th>الوظيفة</th></tr>
<tr><td>Wallet</td><td>محفظة</td><td>الوصول السريع للمحفظة</td></tr>
<tr><td>Social</td><td>مجتمع</td><td>المجتمعات والنقاشات</td></tr>
<tr><td>Discover</td><td>بحث</td><td>اكتشاف التوكنات</td></tr>
<tr><td>Pulse</td><td>نبض</td><td>ذكاء السوق الحي</td></tr>
<tr><td>PnL</td><td>ربح وخسارة</td><td>تتبع الأرباح</td></tr>
<tr><td>Alpha</td><td>برق</td><td>إشارات الذكاء</td></tr>
<tr><td>Whale</td><td>حوت</td><td>تنبيهات الحيت</td></tr>
<tr><td>Pump</td><td>صاروخ</td><td>التتبع الذكي</td></tr>
<tr><td>VCurve</td><td>رسم بياني</td><td>منحنيات الربط</td></tr>
<tr><td>Bags</td><td>حقائب</td><td>الممتلكات الحالية</td></tr>
</table>
</div>

<h2>2.3 الصفحات المفقودة والمطلوبة</h2>
<div class="card">
<h3>ميزات UX مفقودة تحتاج للإضافة</h3>
<ul>
<li><strong>لوحة التحكم في التطبيق (In-App Dashboard):</strong> صفحة إعدادات سريعة تتيح للمستخدم تخصيص الصفحة الرئيسية (اختيار الويدجتات، إعادة ترتيب الأعمدة)</li>
<li><strong>مركز المساعدة (Help Center):</strong> صفحة FAQ و guides تشرح كيفية استخدام كل ميزة</li>
<li><strong>صفحة الإشعارات المفصلة:</strong> بدلاً من قائمة مزيفة، صفحة إشعارات حقيقية مع فلاتر حسب النوع ووقت القراءة</li>
<li><strong>صفحة الملف الشخصي الحقيقية:</strong> بيانات من Supabase بدلاً من بيانات "DegenKing" المزيفة</li>
<li><strong>تاريخ الطلبات (Order History):</strong> سجل كامل لكل طلبات التداول</li>
<li><strong>لوحة تحكم المسؤول (Admin Dashboard):</strong> لإدارة المستخدمين والاشتراكات</li>
</ul>
</div>

<!-- ═══════════════════════════════════════════
     PHASE 3 — SCREEN INVENTORY
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">3</span> Phase 3 — جرد كامل لكل شاشة</h1>
<p class="lead">فيما يلي جدول شامل بكل شاشة في التطبيق مع تحديد الغرض والهدف والمكونات وحالات الحالة المختلفة. كل شاشة مسجلة بمسارها ونوع البيانات (حقيقي أو تجريبي) وتقييم جاهزيتها للإنتاج.</p>

<div class="screen-card">
<h3>1. صفحة الدخول (Auth) — /auth</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">مصادقة المستخدم عبر تيليجرام أو البريد</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">تسجيل الدخول بأقل خطوات ممكنة</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-green">حقيقي</span> — متصل بـ Supabase Auth</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">514</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> شعار Vixor + زر "Continue with Telegram" + بديل البريد</li>
<li><strong>CTA أساسي:</strong> "Continue with Telegram" (أخضر)</li>
<li><strong>CTA ثانوي:</strong> "Sign in with email" (أزرق)</li>
<li><strong>حالة فارغة:</strong> رسالة ترحيب + إعادة توجيه لصفحة الـ onboarding</li>
<li><strong>حالة التحميل:</strong> Spinner + "Authenticating..."</li>
<li><strong>حالة الخطأ:</strong> رسالة خطأ واضحة مع زر إعادة المحاولة</li>
<li><strong>حالة النجاح:</strong> إعادة توجيه فورية للصفحة الرئيسية</li>
</ul>
</div>

<div class="screen-card">
<h3>2. لوحة التحكم الرئيسية (Dashboard) — /</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">نظرة شاملة على المحفظة والإشارات والسوق</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">فهم سريع لحالة المحفظة والفرص</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-yellow">نصف حقيقي</span> — SOL price حقيقي، الباقي تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">375</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> 3 أعمدة — المحفظة (يسار) + الإشارات والعمليات السريعة (وسط) + أعلى المتحركين والاتجاهات (يمين)</li>
<li><strong>CTA أساسي:</strong> روابط لصفحات Discover / Copilot / Whale / PnL / Alpha / Bags</li>
<li><strong>CTA ثانوي:</strong> "View All" في كل قسم</li>
<li><strong>حالة فارغة:</strong> رسالة "ابدأ بإضافة توكنات إلى محفظتك" + أزرار Discover / Deposit</li>
<li><strong>حالة التحميل:</strong> Skeleton loaders لكل قسم</li>
<li><strong>حالة الخطأ:</strong> رسالة "فشل في تحديث البيانات" + زر إعادة المحاولة</li>
<li><strong>حالة النجاح:</strong> البيانات تظهر مع تحديث حي (30 ثانية لسعر SOL)</li>
</ul>
</div>

<div class="screen-card">
<h3>3. الاكتشاف (Discover) — /discover</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">جدول كثيف بالتوكنات مع فرز وفلترة</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">اكتشاف فرص تداول جديدة</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-green">حقيقي</span> — متصل بـ API</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">327</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> Tabs (Trending/New/Top) + جدول التوكنات مع Sparklines + بحث</li>
<li><strong>CTA أساسي:</strong> زر "Trade" لكل توكن</li>
<li><strong>CTA ثانوي:</strong> نجمة المفضلة + تحميل CSV + رابط خارجي</li>
<li><strong>حالة فارغة:</strong> "No tokens found" مع اقتراح تعديل الفلاتر</li>
<li><strong>حالة التحميل:</strong> Skeleton rows مع shimmer animation</li>
<li><strong>حالة الخطأ:</strong> رسالة خطأ مع زر Retry</li>
</ul>
</div>

<div class="screen-card">
<h3>4. AI Copilot — /copilot</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">محادثة AI متعددة الوكلاء للتداول</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">الحصول على نصائح تداول ذكية</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-green">حقيقي</span> — متصل بـ Supabase + AI SDK</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">1,693</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> Sidebar (المحادثات) + منطقة الرسائل + حقلمة الإدخال + أوامر سريعة</li>
<li><strong>CTA أساسي:</strong> إرسال الرسالة (مفتاح Enter)</li>
<li><strong>CTA ثانوي:</strong> تحليل الرسم البياني / إنشاء تنبيه / مشاركة</li>
<li><strong>حالة فارغة:</strong> رسالة ترحيب + 4 اقتراحات جاهزة</li>
<li><strong>حالة التحميل:</strong> Streaming dots مع "AI is thinking..."</li>
<li><strong>حالة الخطأ:</strong> رسالة خطأ في الشريط مع إمكانية الإعادة</li>
</ul>
</div>

<div class="screen-card">
<h3>5. المحفظة (Bags) — /bags</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">عرض التوكنات المملوكة حالياً</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">تتبع الأداء الفوري للممتلكات</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-red">تجريبي</span> — بيانات WIF/POPCAT/BONK مزيفة</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">108</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> 3 بطاقات إحصائية (القيمة / الربح / النسبة) + قائمة الحقائب</li>
<li><strong>CTA أساسي:</strong> زر "Trade" لكل توكن</li>
<li><strong>حالة فارغة:</strong> "No holdings yet" + زر Discover</li>
<li><strong>المطلوب:</strong> اتصال حقيقي بمحفظة Supabase / بيانات حية من chain</li>
</ul>
</div>

<div class="screen-card">
<h3>6. تنبيهات الحيت (Whale) — /whale</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">تتبع المعاملات الكبيرة في الوقت الحقيقي</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">اكتشاف حركة الأموال الذكية</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-red">تجريبي</span> — تنبيهات مزيفة بدون مصدر حقيقي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">122</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> 4 إحصائيات (Volume / Txns / Buys / Sells) + قائمة التنبيهات</li>
<li><strong>حالة التحميل:</strong> Skeleton cards مع shimmer</li>
<li><strong>المطلوب:</strong> WebSocket حقيقي من Helius / بيانات من Blockchain</li>
</ul>
</div>

<div class="screen-card">
<h3>7. منحنيات الربط (Curves) — /curves</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">مراقبة توكنات pump.fun قبل انتقالها لـ Raydium</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">الدخول المبكر في الفرص</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="meta-value"><span class="badge badge-red">تجريبي</span> — 10 توكنات مزيفة مع شريط تقدم</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">227</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> 4 إحصائيات + فلترات (All/New/Near Complete/Completed) + جدول مفصل</li>
<li><strong>الجدول يحتوي:</strong> التوكن + شريط التقدم + Market Cap + الحائزون + الوقت المتبقي + الحجم + المعاملات + Dev Sold + الحالة</li>
<li><strong>المطلوب:</strong> اتصال بـ pump.fun API أو Helius للبيانات الحية</li>
</ul>
</div>

<div class="screen-card">
<h3>8. متتبع الربح والخسارة (PnL) — /pnl</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">تتبع أداء التداول والربح</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">تحليل الأداء وتحسين الاستراتيجية</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">130</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> 4 إحصائيات + جدول التداولات التفصيلي</li>
<li><strong>المطلوب:</strong> قراءة من جدول trades في Supabase + حساب إحصائيات حقيقية</li>
</ul>
</div>

<div class="screen-card">
<h3>9. إشارات الألفا (Alpha) — /alpha</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">فرص تداول مكتشفة بالذكاء الاصطناعي</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">التداول قبل الجمهور</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">165</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> فلتر حسب النوع (All/Accumulation/Breakout/Launch/Narrative) + بطاقات الإشارات</li>
<li><strong>كل بطاقة:</strong> التوكن + النوع + الثقة + الوصف + Entry + Target + Timeframe + Risk + الوقت</li>
</ul>
</div>

<div class="screen-card">
<h3>10. نبض السوق (Pulse) — /pulse</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">ذكاء السوق الحي (حجم + حيت + اجتماعي)</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">فهم اتجاه السوق بشكل فوري</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">186</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> 6 إحصائيات سوق + فلترات + 10 إشارات</li>
<li><strong>أنواع الإشارات:</strong> volume_spike, whale_move, social_trend, price_breakout, smart_money</li>
</ul>
</div>

<div class="screen-card">
<h3>11. المتتبعون (Trackers) — /trackers</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">تتبع المحافظ الذكية والمتداولين الأوائل</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">نسخ استراتيجيات الناجحين</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">360</span></div>
</div>
<ul>
<li><strong>3 Tabs:</strong> Smart Money (8 محافظ) + Top Traders (8 متداول) + Watchlist (8 توكنات)</li>
<li><strong>كل Tab:</strong> رأس عمود + صفوف مفصلة مع hover effect</li>
</ul>
</div>

<div class="screen-card">
<h3>12. العقود الدائمة (Perpetuals) — /perpetuals</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">تداول العقود الدائمة مع الرافعة المالية</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">تداول بالرافعة مع إدارة المخاطر</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">249</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> Positions المفتوحة + Order Book + لوحة التداول (Long/Short + الرافعة + الحجم + التنفيذ)</li>
<li><strong>ملاحظة:</strong> يحتوي على S object (44 سطر) لتعريف جميع الأنماط — نمط نظيف يجب تحويله إلى CSS/Tailwind</li>
</ul>
</div>

<div class="screen-card">
<h3>13. المكافآت (Rewards) — /rewards</h3>
<div class="meta">
  <div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">نظام نقاط وأكواب ومكافآت</span></div>
  <div class="meta-item"><span class="meta-label">الهدف:</span><span class="meta-value">تحفيز المستخدمين على الاستخدام اليومي</span></div>
  <div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
  <div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">186</span></div>
</div>
<ul>
<li><strong>الأقسام:</strong> رصيد النقاط + Streak اليومي + إحالة + المستوى + المكافآت المتاحة</li>
<li><strong>المستويات:</strong> Bronze (0+) / Silver (2,500+) / Gold (5,000+) / Platinum (10,000+)</li>
</ul>
</div>

<div class="screen-card">
<h3>14. الرؤية (Vision) — /vision</h3>
<div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">تحليل AI للسوق والقطاعات</span></div>
<div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
<div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">149</span></div>
<ul>
<li><strong>الأقسام:</strong> 4 بطاقات (Fear & Greed / Momentum / TVL / Wallets) + ملخص AI + جدول القطاعات + الأحداث القادمة</li>
</ul>
</div>

<div class="screen-card">
<h3>15. العوائد (Yield) — /yield</h3>
<div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value>إدارة مراكز السيولة وLP</span></div>
<div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
<div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">155</span></div>
<ul>
<li><strong>الأقسام:</strong> إجمالي المكتسب + 3 إحصائيات + المراكز النشطة + المراكز المتاحة (Raydium/Orca/Meteora/Kamino)</li>
</ul>
</div>

<div class="screen-card">
<h3>16. الاشتراك المدفوع (Premium) — /premium</h3>
<div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">خطط الاشتراك والترقية</span></div>
<div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
<div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">152</span></div>
<ul>
<li><strong>3 خطط:</strong> Free ($0) / Pro ($29/شهر) / Enterprise ($99/شهر)</li>
<li><strong>Pro ميزات POPULAR:</strong> شارة زاويّة + حدود زرقاء مميز + 10 ميزات</li>
<li><strong>الخطأ:</strong> لا يوجد تكامل دفع حقيقي (Stripe/Coinbase Commerce)</li>
</ul>
</div>

<div class="screen-card">
<h3>17. الإحالة (Referral) — /referral</h3>
<div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value>دعوة الأصدقاء وكسب المكافآت</span></div>
<div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
<div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">154</span></div>
<ul>
<li><strong>الأقسام:</strong> Hero + كود الإحالة + 4 إحصائيات + لوحة المتصدرين + كيف يعمل (3 خطوات)</li>
</ul>
</div>

<div class="screen-card">
<h3>18. الإعدادات (Settings) — /settings</h3>
<div class="meta-item"><span class="meta-label">الغرض:</span><span class="meta-value">تخصيص تجربة المستخدم</span></div>
<div class="meta-item"><span class="meta-label">النوع:</span><span class="badge badge-red">تجريبي</span></div>
<div class="meta-item"><span class="meta-label">الأسطر:</span><span class="meta-value">133</span></div>
<ul>
<li><strong>4 أقسام:</strong> التداول / الإشعارات / العرض / الأمان والحساب</li>
<li><strong>المشكلة:</strong> التغييرات لا تُحفظ — مجرد state محلي</li>
</ul>
</div>

<!-- ═══════════════════════════════════════════
     PHASE 4 — DESIGN SYSTEM
     ═════════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">4</span> Phase 4 — نظام التصميم الكامل</h1>

<h2>4.1 لوحة الألوان (Axiom Palette)</h2>
<p class="lead">نظام الألوان مبني بالكامل على ألوان Axiom.trade مع تعديلات طفيفة. يجب استخدام هذه الألوان حصرياً في كل الصفحات الجديدة.</p>
<table>
<tr><th>الاسم</th><th>القيمة</th><th>الاستخدام</th></tr>
<tr><td>Page Background</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#0f1424</td><td>خلفية الصفحة الرئيسية</td></tr>
<tr><td>Nav Background</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#121826</td><td>خلفية شريط التنقل</td></tr>
<tr><td>Card Surface</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#161b2e</td><td>خلفية البطاقات والحوارات</td></tr>
<tr><td>Card Light</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#1a2035</td><td>خلفية الحقول والحقول الفرعية</td></tr>
<tr><td>Card Hover</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#1e2438</td><td>تأثير Hover على البطاقات</td></tr>
<tr><td>Primary Text</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#F0F4FC</td><td>النص الرئيسي</td></tr>
<tr><td>Secondary Text</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#7B8BA8</td><td>النص الثانوي والعناوين الفرعية</td></tr>
<tr><td>Tertiary Text</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#4A5568</td><td>النص الثالثوي والتواريخ</td></tr>
<tr><td>Blue Primary</td><td style="direction:ltr;font-family:monospace;color:var(--blue);">#3B82F6</td><td>الأزرار الرئيسية والروابط النشطة</td></tr>
<tr><td>Blue Light</td><td style="direction:ltr;font-family:monospace;color:var(--blue2);">#60A5FA</td><td>النص النشط والروابط المحددة</td></tr>
<tr><td>Green (Bullish)</td><td style="direction:ltr;font-family:monospace;color:var(--green);">#22C55E</td><td>الأرباح والإشارات الإيجابية</td></tr>
<tr><td>Red (Bearish)</td><td style="direction:ltr;font-family:monospace;color:var(--red);">#EF4444</td><td>الخسائر والتنبيهات</td></tr>
<tr><td>Yellow</td><td style="direction:ltr;font-family:monospace;color:var(--yellow);">#F59E0B</td><td>التحذيرات والإشارات المتوسطة</td></tr>
<tr><td>Purple</td><td style="direction:ltr;font-family:monospace;color:var(--purple);">#8B5CF6</td><td>السمات والأيقونات</td></tr>
<tr><td>Border</td><td style="direction:ltr;font-family:monospace;">rgba(255,255,255,0.06)</td><td>الحدود الفاصلة بين العناصر</td></tr>
<tr><td>Border Light</td><td style="direction:ltr;font-family:monospace;">rgba(255,255,255,0.04)</td><td>حدود أفتح بين الصفوف</td></tr>
</table>

<h2>4.2 الطباعة (Typography)</h2>
<table>
<tr><th>العنصر</th><th>الخط</th><th>الحجم</th><th>الوزن</th></tr>
<tr><td>عناوين الصفحة</td><td>Inter</td><td>18-22px</td><td>700-800</td></tr>
<tr><td>عناوين الأقسام</td><td>Inter</td><td>11-13px</td><td>700</td></tr>
<tr><td>نص البطاقات</td><td>Inter</td><td>10-11px</td><td>600</td></tr>
<tr><td>الأرقام المالية</td><td>ui-monospace, SF Mono, Cascadia Code</td><td>10-12px</td><td>600-700</td></td>
<tr><td>النص الثانوي</td><td>Inter</td><td>9-10px</td><td>400-500</td></tr>
<tr><td>النص الثالثوي</td><td>Inter</td><td>8-9px</td><td>400</td></tr>
<tr><td>الشارات</td><td>Inter</td><td>8-10px</td><td>700</td></tr>
<tr><td>الأزرار</td><td>Inter</td><td>10-11px</td><td>600-700</td></tr>
</table>

<h2>4.3 الحدود المستديرة</h2>
<table>
<tr><th>العنصر</th><th>القيمة</th></tr>
<tr><td>البطاقات الصغيرة</td><td>8px</td></tr>
<tr><td>البطاقات المتوسطة</td><td>10-12px</td></tr>
<tr><td>البطاقات الكبيرة</td><td>12-16px</td></tr>
<tr><td>الأزرار</td><td>4-6px</td></tr>
<tr><td>الأزرار الدائرية</td><td>50% (border-radius: 50%)</td></tr>
<tr><td>الشارات</td><td>3-6px</td></tr>
<tr><td>حقول الإدخال</td><td>6-8px</td></tr>
</table>

<h2>4.4 الظلال</h2>
<table>
<tr><th>النوع</th><th>القيمة</th><th>الاستخدام</th></tr>
<tr><td>Card Shadow</td><td>0 4px 24px -8px rgba(0,0,0,0.4)</td><td>البطاقات العائمة</td></tr>
<tr><td>Elevated Shadow</td><td>0 12px 40px -12px rgba(0,0,0,0.6)</td><td>العناصر البارز</td></tr>
<tr><td>Glow (ممنوع)</td><td>0 0 32px -8px rgba(59,130,246,0.5)</td><td>لا يُستخدم — التصميم نظيف بدون توهج</td></tr>
</table>

<h2>4.5 المكونات القياسية</h2>
<ul>
<li><strong>البطاقة (Card):</strong> خلفية #161b2e + حدود 1px rgba(255,255,255,0.06) + border-radius 8-12px + padding 12-16px</li>
<li><strong>الشارة (Badge):</strong> padding 2-6px + border-radius 3-4px + خلفية شفافة (اللون @ 15% ألفا + اللون @ 12% للأغلف + اللون نفسه للنص)</li>
<li><strong>زر أساسي:</strong> خلفية صلبة + لون نص أبيض + border-radius 4-6px + padding 6-10px + font-weight 700</li>
<li><strong>زر شفاف:</strong> خلفية اللون @ 12% + حدود اللون @ 20% + نص اللون @ 100%</li>
<li><strong>مفتاح الإدخال:</strong> خلفية #1a2035 + حدود rgba(255,255,255,0.06) + border-radius 6-8px + padding 10-12px</li>
<li><strong>شريط تقدم:</strong> height 6px + border-radius 3px + خلفية rgba(255,255,255,0.06) + fill بنسبة مئوية</li>
<li><strong>Sparkline:</strong> SVG polyline بدون fill + stroke 1.2px + strokeLinecap round</li>
</ul>

<h2>4.6 الإشعارات (Alerts/Modals)</h2>
<ul>
<li><strong>Toast:</strong> position:fixed + bottom: 80px + خلفية #1a2035 + حدود 1px rgba(255,255,255,0.06) + padding 10px 16px + border-radius 8px + animation slide-up</li>
<li><strong>Modal:</strong> overlay rgba(0,0,0,0.6) + محتوى centered + خلفية #161b2e + border-radius 12px + max-width 480px</li>
<li><strong>Bottom Sheet:</strong> خلفية #121826 + border-top-left/right radius 16px + slide-up animation</li>
</ul>

<!-- ═══════════════════════════════════════════
     PHASE 5 — DASHBOARD SPECIFICATION
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">5</span> Phase 5 — مواصفات لوحة التحكم الرئيسية</h1>

<h2>5.1 التخطيط المستهدف</h2>
<p class="lead">لوحة التحكم الرئيسية يجب أن تكون نقطة البداية للمستخدم. يجب أن تعرض أهم 3-4 أقسام بشكل مرئي: حالة المحفظة المالية، الإشارات النشطة، وأهم الفرص المتاحة. التصميم الحالي (3 أعمدة) مناسب لكن يحتاج إلى بيانات حقيقية بدلاً من البيانات المزيفة.</p>

<h2>2.5.2 الأقسام المطلوبة</h2>
<div class="card">
<h3>العمود الأيسر — المحفظة</h3>
<ul>
<li><strong>بطاقة القيمة الإجمالية:</strong> $XX,XXX مع التغيير +XX.XX% في 24 ساعة</li>
<li><strong>سعر SOL الحي:</strong> من API (حقيقي حالياً) + التغيير</li>
<li><strong>قائمة الحيازات:</strong> اسم التوكن + النسبة + القيمة + الربح/الخسارة + Sparkline صغير</li>
<li><strong>النشاط الأخير:</strong> 5 عمليات أخيرة مع النوع (شراء/بيع/إشارة/مكافأة)</li>
</ul>
</div>

<div class="card">
<h3>العمود الأوسط — الإشارات والعمليات</h3>
<ul>
<li><strong>الإشارات الحية:</strong> 5 إشارات AI مع النوع (BUY/SELL) + التوكن + السبب + الثقة + Sparkline</li>
<li><strong>العمليات السريعة:</strong> 6 أزرار شبكة (Discover, AI Copilot, Whale, PnL, Alpha, Bags)</li>
</ul>
</div>

<div class="card">
<h3>العمود الأيمن — السوق</h3>
<ul>
<li><strong>أعلى المتحركين:</strong> 8 توكنات مع السعر + التغيير + الحجم + Sparkline</li>
<li><strong>الاتجاهات:</strong> 6 أخبار سوق مع علامة HOT + الوقت</li>
</ul>
</div>

<h2>5.3 حالات الصفحة المطلوبة</h2>
<ul>
<li><strong>حالة فارغة:</strong> "ابدأ بتصفح التوكنات وربط محفظتك" + أزرار Discover + Deposit</li>
<li><strong>حالة التحميل:</strong> Skeleton cards مع shimmer لكل قسم (6-8 عناصر)</li>
<li><strong>حالة الخطأ:</strong> رسالة فشل مع زر Retry + إعادة المحاولة التلقائية</li>
<li><strong>حالة النجاح:</strong> بيانات حية تتحديث كل 30 ثانية (SOL) + إمكانية WebSocket لتحديثات أسرع</li>
</ul>

<!-- ═══════════════════════════════════════════
     PHASE 6 — ANALYSIS RESULT PAGE
     ═════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">6</span> Phase 6 — صفحة نتائج التحليل</h1>

<h2>6.1 التخطيط المستهدف</h2>
<p class="lead">صفحة نتائج التحليل هي من أهم الصفحات في التطبيق. حالياً (analysis.$id.tsx) تعرض تحليلاً مفصلاً مع رسوم بيانية (TradingView) وبيانات من Supabase. يجب أن تكون هذه الصفحة شاملة وتعرض كل المعلومات التي يحتاجها المتداول لاتخاذ قرار.</p>

<h2>6.2 الأقسام المطلوبة</h2>
<ul>
<li><strong>اتجاه التجارة:</strong> BUY/SELL/HOLD مع شارة ملونة واضحة</li>
<li><strong>نقاط الثقة:</strong> شريط تقدم + رقم كبير</li>
<li><strong>بنية السوق:</strong> الاتجاه العام (صاعد/هابط/عرضي) + القوة النسبية</li>
<li><strong>تحليل الاتجاه:</strong> EMA، الدعم والمقاومة، المستويات، مستوى RSI</li>
<li><strong>نقطة الدخول:</strong> السعر المحدد مع المنطقة</li>
<li><strong>وقف الخسارة:</strong> السعر مع المنطقة</li>
<li>
<li><strong>جني الأرباح:</strong> TP1/TP2/TP3 مع أسعار مستهدفة</li>
<li><strong>نسبة المخاطرة/المكافأة:</strong> 1:R ratio مع منطقة خضراء</li>
<li><strong>نقاط التداول:</strong> أسباب الشراء مع الأدلة</li>
<li><strong>الأدلة الداعمة:</strong> مؤشرات فنية وبيانات على السلسلة</li>
<li><strong>السيناريو البديل:</strong> ماذا لو تحرك السوق عكس التوقع</li>
<li><strong>3 خطط (Conservative/Balanced/Aggressive):</strong> دخول/وقف/جني مختلفة</li>
<li><strong>تحذيرات المخاطر:</strong> تحذيرات واضحة بالمخاطر</li>
<li><strong>نصائح تعليمية:</strong> شرح المصطلحات</li>
<li><strong>مشاركة وحفظ:</strong> أزرار المشاركة والحفظ</li>
</ul>

<!-- ═══════════════════════════════════════════
     PHASE 7 — LOT SIZE CALCULATOR
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">7</span> Phase 7 — حاسبة حجم الصفقة</h1>

<h2>7.1 التخطيط المستهدف</h2>
<p class="lead">حاسبة حجم الصفقة (Lot Size Calculator) أداة احترافية ضرورية لكل متداول. يجب أن تكون متاحة كـ صفحة مستقلة أو كـ مكون ضمن صفحة trade-desk. المدخلات هي: الرصيد، نسبة المخاطرة، الزوج، نقطة الدخول، ونقطة وقف الخسارة. المخرجات: حجم الصفقة، قيمة المركز، مبلغ المخاطرة.</p>

<h2>7.2 الحقول والمخرجات</h2>
<table>
<tr><th>المدخل</th><th>النوع</th><th>المخرج</th></tr>
<tr><td>Account Balance</td><td>number</td><td>—</td></tr>
<tr><td>Risk %</td><td>select (0.5-5%)</td><td>—</td></tr>
<tr><td>Pair</td><td>text</td><td>—</td></tr>
<tr><td>Entry Price</td><td>number</td><td>—</td></tr>
<tr><td>Stop Loss</td><td>number</td><td>—</td></tr>
<tr><td>Pip Distance</td><td>auto</td><td>auto-calculated</td></tr>
<tr><td></td><td></td><td><strong>Lot Size</strong></td></tr>
<tr><td></td><td></td><td><strong>Position Value</strong></td></tr>
<tr><td></td><td></td><td><strong>Risk Amount</strong></td></tr>
</table>

<!-- ═══════════════════════════════════════════
     PHASE 8 — REFERRAL SYSTEM
     ═════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">8</span> Phase 8 — نظام الإحالة</h1>

<h2>8.1 التخطيط المستهدف</h2>
<p class="lead">نظام الإحالة يجب أن يحفز المستخدمين على دعوة أصدقائهم. النظام الحالي (referral.tsx) يعرض تصميماً جيداً لكنه بالكامل مزيف. يحتاج إلى: ربط حقيقي بـ Supabase لتتبع الإحالات الفعلية، نظام نقاط يعمل فعلياً، ومكافآت حقيقية عند بلوغ الأهداف.</p>

<h2>8.2 عناصر التصميم المطلوبة</h2>
<ul>
<li><strong>Hero Section:</strong> رسالة تحفيزية + إحصائيات سريعة (الإحالات / النشطة / المكتسب)</li>
<li><strong>كود الإحالة:</strong> عرض بارز واضح مع زر Copy + Share via Telegram</li>
<li><strong>لوحة المتصدرين:</strong> ترتيب أعلى 5 + اسم + عدد الإحالات + المكتسب + المستوى</li>
<li><strong>الأهداف:</strong> 3 مستويات (Bronze/Silver/Gold/Platinum) مع مكافآت متدرجة</li>
<li><strong>كيف يعمل:</strong> 3 خطوات واضحة مع أيقونات</li>
</ul>

<!-- ═══════════════════════════════════════════
     PHASE 9 — PREMIUM CONVERSION
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">9</span> Phase 9 — تحويل المستخدمين المدفوع</h1>

<h2>9.1 التخطيط المستهدف</h2>
<p class="lead">صفحة الاشتراك يجب أن تحول المستخدمين المجانيين إلى مدفوعين. التصميم الحالي يعرض 3 خطط بوضوح لكن بدون تكامل دفع حقيقي. المطلوب: ربط Stripe أو Coinbase Commerce، تجربة مجانية لمدة 7 أيام، وإشعارات داخل التطبيق.</p>

<h2>9.2 مقارنة الخطط</h2>
<table>
<tr><th>الميزة</th><th>Free</th><th>Pro ($29)</th><th>Enterprise ($99)</th></tr>
<tr><td>اكتشاف التوكنات</td><td>أساسي</td><td>متقدم</td><td>متقدم</td></tr>
<tr><td>التنبيهات</td><td>5 فقط</td><td>غير محدود</td><td>غير محدود</td></tr>
<tr><td>إشارات AI</td><td>—</td><td style="color:var(--green);">مضمّن</td><td style="color:var(--green);">مضمّن</td></tr>
<tr><td>تنبيهات الحيت</td><td>—</td><td style="color:var(--green);">مضمّن</td><td style="color:var(--green);">مضمّن</td></tr>
<tr><td>API Access</td><td>—</td><td style="color:var(--green);">مضمّن</td><td style="color:var(--green);">مضمّن</td></tr>
<tr><td>استراتيجيات مخصصة</td><td>—</td><td>—</td><td style="color:var(--green);">مضمّن</td></tr>
<tr><td>الدعم الفني</td><td>مجتمع</td><td>أولوية</td><td>مخصص 24/7</td></tr>
</table>

<!-- ═════════════════════════════════════════
     PHASE 10 — AI DESIGN GENERATOR PROMPT
     ═════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">10</span> Phase 10 — برومبت تصميم AI</h1>

<p class="lead">هذا القسم يحتوي على برومبت تصميم مفصل يمكن لصقه مباشرة في Google Stitch أو Gemini أو Figma AI أو v0 أو Lovable أو Bolt لإنشاء التصميم النهائي للتطبيق. البرومبت يصف كل جانب من التصميم بدقة.</p>

<div class="ai-prompt-box">
VIXOR TRADING TERMINAL — AI Design Generator Prompt
==================================================

PROJECT OVERVIEW
- Name: Vixor
- Type: Solana meme coin trading terminal (Telegram Mini App + Web)
- Reference: Axiom.trade (exact visual clone)
- Stack: React 19, Tailwind CSS, Inter font
- Devices: Mobile-first (375px), Tablet (768px), Desktop (1440px+)
- Orientation: Portrait only for mobile

VISUAL STYLE
- Background: #0f1424 (page), #121826 (nav bars)
- Cards: #161b2e with 1px border rgba(255,255,255,0.06)
- Text: #F0F4FC (primary), #7B8BA8 (secondary), #4A5568 (tertiary)
- Accent: #3B82F6 (blue), #60A5FA (blue light)
- Positive: #22C55E, Negative: #EF4444, Warning: #F59E0B
- Font: Inter, monospace for numbers (ui-monospace, SF Mono)
- Style: Dense data terminal, no glow/neon, minimal borders
- Border radius: 8px (cards), 4-6px (buttons/badges)
- Spacing: 4-8px between cards, 6-12px padding inside

NAVIGATION
- Top Nav: Fixed 40px height, logo | [Trade btn green] [Deposit btn blue] SOL $price | chain selector | nav links | search | star | bell | wallet | avatar
- Bottom Nav: Fixed 52px height, 10 icon links (Wallet, Social, Discover, Pulse, PnL, Alpha, Whale, Pump, VCurve, Bags) + SOL price + social links (md+)
- Active state: blue text + subtle blue background
- Hover: background #1e2438

COMPONENTS TO BUILD
1. AppShell — Top nav + Bottom nav + content area (pt-40 top, pb-52 bottom)
2. TokenTable — Dense data table with sparklines, sorting, filtering, star/favorite
3. SignalCard — BUY/SELL badge + token + reason + confidence bar + sparkline
4. WhaleAlert — Type icon + token + amount + wallet label + impact badge
5. ProgressCard — Title + progress bar with percentage + metadata
6. StatGrid — 3-4 column grid of metric cards (label + value + change%)
7. AlertFeed — Chronological feed with type icons, severity colors, timestamps
8. OrderBook — Bids/Asks with depth bars, spread indicator
9. TradingPanel — Long/Short toggle, leverage selector, input fields, execute button
10. StreakCalendar — 7-day grid with check/current/future states

PAGE SPECS (35 screens)
- / (Dashboard): 3-column grid — Portfolio (left) + Signals + Quick Actions (center) + Movers + Trending (right)
- /discover: Tabs + TokenTable with 12+ columns + search + sort + filter + pagination
- /copilot: Sidebar (conversation list) + Chat area + Input bar + Quick actions
- /bags: Stat cards + Holdings list with PnL allocation bars
- /whale: Stat cards + Alert feed with type/impact/wallet labels
- /curves: Stats + Filters + Full table with progress bars + dev sold %
- /pnl: Stats + Trade history table with PnL colors
- /alpha: Filter tabs + Signal cards with confidence + entry/target + risk badges
- /pulse: Market stats grid + Signal feed with severity
- /trackers: 3 tabs (Smart Money, Top Traders, Watchlist) with detailed tables
- /perpetuals: Positions table + Order book + Trading panel
- /rewards: Points hero + Streak calendar + Referral section + Tier progress + Rewards grid
- /referral: Hero + Referral code card + Stats grid + Leaderboard + How it works
- /premium: 3 pricing cards with feature comparison + FAQ
- /vision: Overview cards + AI summary + Sector rotation table + Events
- /yield: Earned hero + Stats + Active positions + Available pools
- /settings: Toggle switches + Select dropdowns + Action buttons
- /profile: User info + Stats + Activity
- /notifications: Notification feed with type/timestamp/read state
- /signals: Signal feed with confidence and action buttons
- /predictions: Prediction market with outcomes
- /wallet-web3: Wallet balance + Transaction history
- /communities: Community cards with members count
- /journal: Trade journal entries with notes
- /portfolio: Holdings breakdown with allocation chart
- /activity-web3: Web3 transaction feed
- /analyze: Chart image upload for AI analysis
- /trade-desk: Advanced trading desk
- /experiments: Strategy experiments list
- /backtest: Backtest simulator with results
- /daily-loop: Daily trading loop summary

MOBILE-FIRST RULES
- Cards use full width with 4-6px gap
- Tables use horizontal scroll for wide data
- Bottom nav is the primary navigation
- Top nav collapses to essential items on mobile
- Font sizes: 8-10px for dense data, 11px for headers
- Touch targets minimum 44x44px for interactive elements
- No hover states — use active/focus states instead

DARK MODE ONLY (no light mode needed)
- This is a trading terminal — always dark
- Backgrounds are very dark (#0f1424, #121826, #161b2e)
- Text is light (#F0F4FC, #7B8BA8)
- Borders are very subtle (rgba(255,255,255,0.04-0.06))
- No shadows or glow effects
</div>

<!-- ═════════════════════════════════════════
     PHASE 11 — DEVELOPMENT HANDOFF
     ═══════════════════════════════════════════ -->
<div style="page-break-before:always;"></div>
<h1 class="phase-title"><span class="num">11</span> Phase 11 — تسليم التطوير</h1>

<h2>11.1 هرم المكونات القابلة لإعادة الاستخدام</h2>
<table>
<tr><th>المكون</th><th>الملف</th><th>المستخدم في</th></tr>
<tr><td>TokenRow</td><td>جديد</td><td>Discover, Index, Movers</td></tr>
<tr><td>SparklineMini</td><td>جديد</td><td>Index, Discover</td></tr>
<tr><td>StatCard</td><td>جديد</td><td>كل صفحة بها إحصائيات</td></tr>
<tr><td>ProgressBar</td><td>جديد</td><td>Curves, Rewards</td></tr>
<tr><td>AlertCard</td><td>جديد</td><td>Whale, Pulse</td></tr>
<tr><td>FilterTabs</td><td>جديد</td><td>Alpha, Pulse, Curves, Trackers</td></tr>
<tr><td>Badge</td><td>atoms.tsx</td><td>كل الصفحات</td></tr>
<tr><td>PaginationBar</td><td>PaginationBar.tsx</td><td>Discover, Copilot</td></tr>
</table>

<h2>11.2 هرم الصفحات حسب الأولوية</h2>
<table>
<tr><th>الأولوية</th><th>الصفحة</th><th>السبب</th></tr>
<tr><td>P0 — حرج</td><td>index.tsx, __root.tsx, route.tsx</td><td>الصفحة الرئيسية مكسورة + تعارض الأنظمة</td></tr>
<tr><td>P1 — عالي</td><td>discover.tsx, copilot.tsx</td><td>أكثر الصفحات استخداماً</td></tr>
<tr><td>P2 — متوسط</td><td>bags, whale, curves, pnl, alpha, pulse</td><td>صفحات الميزات الأساسية</td></tr>
<tr><td>P3 — منخفض</td><td>trackers, perpetuals, yield</td><td>ميزات متقدمة</td></tr>
<tr><td>P4 — تخطيط</td><td>premium, rewards, referral, settings, profile</td><td>صفحات دعمية ونظام</td></tr>
<tr><td>P5 — بديل</td><td>vision, predictions, signals, wallet, communities, journal, portfolio, notifications, activity-web3</td><td>صفحات تحتاج بناء شامل</td></tr>
</table>

<h2>11.3 المشاكل التقنية التي يجب حلها أولاً</h2>
<ol>
<li><strong>توحيد الأنظمة:</strong> توحيد كل الصفحات التجريبية من inline styles إلى Tailwind + CSS variables. استخدام CSS classes بدلاً من style={{}}</li>
<li><strong>إصلاح .env:</strong> إضافة متغيرات البيئة المطلوبة (15+ متغير)</li>
<li><strong>إصلاح __root.tsx:</li> استبدال الألوان المضمنة في NotFound و ErrorView بـ CSS classes</li>
<li><strong>إصلاح AppShell.tsx:</li> توحيد الألوان المضمنة إلى CSS variables</li>
<li><strong>تطبيق route.tsx:</li> التأكد من أن WorkspaceAutoDetector لا يتعارض مع الأنظمة</li>
<li><strong>حذف الملفات العشوائية:</strong> نقل SQL files و ai-gateway.server.ts وملفات JSON الإضافية</li>
</ol>

</div>

</body>
</html>
"""

# Write HTML file
with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"HTML written: {HTML_FILE}")
print(f"Size: {os.path.getsize(HTML_FILE):,} bytes")

# Convert to PDF
print("Converting to PDF...")
result = subprocess.run(
    ['node', os.path.join(PDF_SKILL_DIR, 'scripts', 'html2pdf-next.js'), 
     HTML_FILE, '--output', PDF_FILE],
    capture_output=True, timeout=120
)

print(f"PDF result: {result}")
if os.path.exists(PDF_FILE):
    print(f"PDF written: {PDF_FILE}")
    print(f"Size: {os.path.getsize(PDF_FILE):,} bytes")
else:
    print("ERROR: PDF was not created!")