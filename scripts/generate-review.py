#!/usr/bin/env python3
"""Generate VIXOR comprehensive review PDF via HTML"""
import subprocess, os

PDF_SKILL_DIR = "/home/z/my-project/skills/pdf"
HTML_PATH = "/home/z/my-project/scripts/vixor-review.html"
PDF_PATH = "/home/z/my-project/download/VIXOR_Comprehensive_Review.pdf"

html = r'''<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: 'Inter', 'Noto Sans SC', sans-serif; background: #0a0b0f; color: #e2e8f0; font-size: 11pt; line-height: 1.7; direction: rtl; }
.page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 25mm 20mm; background: #0a0b0f; }

/* Cover */
.cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 297mm; padding: 40mm 20mm; background: linear-gradient(135deg, #0a0b0f 0%, #12141d 50%, #0a0b0f 100%); }
.cover h1 { font-size: 42pt; font-weight: 900; color: #6366f1; margin-bottom: 12pt; letter-spacing: -1px; }
.cover .subtitle { font-size: 16pt; color: #94a3b8; margin-bottom: 30pt; }
.cover .meta { font-size: 10pt; color: #64748b; }
.cover .badge { display: inline-block; background: #6366f1; color: #fff; padding: 6pt 18pt; border-radius: 20pt; font-size: 10pt; font-weight: 600; margin-top: 20pt; }

/* TOC */
.toc { page-break-after: always; }
.toc h2 { font-size: 22pt; color: #6366f1; margin-bottom: 20pt; border-bottom: 2px solid #1e293b; padding-bottom: 10pt; }
.toc-item { display: flex; justify-content: space-between; padding: 6pt 0; border-bottom: 1px solid #1a1c2e; font-size: 11pt; }
.toc-item span:first-child { color: #cbd5e1; }
.toc-item span:last-child { color: #64748b; }

/* Sections */
.section { page-break-before: always; }
.section:first-of-type { page-break-before: auto; }
h2 { font-size: 20pt; color: #6366f1; margin-bottom: 14pt; border-bottom: 2px solid #1e293b; padding-bottom: 8pt; }
h3 { font-size: 14pt; color: #818cf8; margin: 16pt 0 8pt; }
h4 { font-size: 12pt; color: #a5b4fc; margin: 12pt 0 6pt; }
p { margin-bottom: 10pt; color: #cbd5e1; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 10pt 0 16pt; font-size: 9pt; }
thead th { background: #1e293b; color: #818cf8; padding: 8pt 6pt; text-align: right; font-weight: 600; border: 1px solid #334155; }
tbody td { padding: 5pt 6pt; border: 1px solid #1a1c2e; color: #94a3b8; vertical-align: top; }
tbody tr:nth-child(even) { background: #0f1118; }

/* Status badges */
.stub { color: #f87171; font-weight: 600; }
.partial { color: #fbbf24; font-weight: 600; }
.functional { color: #34d399; font-weight: 600; }
.broken { color: #ef4444; font-weight: 600; }
.fixed { color: #22d3a6; font-weight: 600; }
.p0 { color: #ef4444; font-weight: 700; }
.p1 { color: #f97316; font-weight: 700; }
.p2 { color: #eab308; font-weight: 700; }

/* Severity */
.sev-critical { color: #ef4444; }
.sev-high { color: #f97316; }
.sev-medium { color: #eab308; }
.sev-low { color: #22c55e; }

/* Callout */
.callout { background: #1a1c2e; border-right: 4px solid #6366f1; padding: 12pt 16pt; margin: 12pt 0; border-radius: 0 8pt 8pt 0; }
.callout-warn { border-right-color: #f59e0b; }
.callout-danger { border-right-color: #ef4444; }
.callout-success { border-right-color: #22d3a6; }

/* Roadmap */
.phase { background: #111322; border: 1px solid #1e293b; border-radius: 10pt; padding: 14pt; margin: 10pt 0; }
.phase-title { font-size: 13pt; font-weight: 700; color: #6366f1; margin-bottom: 6pt; }
.phase-items { color: #94a3b8; font-size: 10pt; }

.stat-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10pt; margin: 14pt 0; }
.stat-card { background: #111322; border: 1px solid #1e293b; border-radius: 8pt; padding: 12pt; text-align: center; }
.stat-card .num { font-size: 22pt; font-weight: 900; color: #6366f1; }
.stat-card .label { font-size: 9pt; color: #64748b; margin-top: 4pt; }

@media print { .page { box-shadow: none; } }
</style>
</head>
<body>

<!-- =================== COVER =================== -->
<div class="page cover">
<h1>VIXOR</h1>
<div class="subtitle">مراجعة شاملة لكل ملفات المشروع — التشخيص والرؤية وخارطة الطريق</div>
<div class="meta">React 19 + TanStack Start + Tailwind v4 + Supabase | 267 ملف مصدري</div>
<div class="meta">التاريخ: 27 يوليو 2026 | Workflow Agent Review</div>
<div class="badge">مراجعة ما قبل إعادة الهيكلة</div>
</div>

<!-- =================== TOC =================== -->
<div class="page toc">
<h2>فهرس المحتويات</h2>
<div class="toc-item"><span>1. الملخص التنفيذي</span><span>3</span></div>
<div class="toc-item"><span>2. الإحصائيات العامة</span><span>4</span></div>
<div class="toc-item"><span>3. جرد الملفات الكامل — حسب التصنيف</span><span>5</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;3.1 المسارات (Routes) — 37 ملف</span><span>5</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;3.2 المكونات (Components) — 80 ملف</span><span>8</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;3.3 النطاقات (Domains) — 104 ملف</span><span>11</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;3.4 البنية المشتركة (Shared/Lib) — 68 ملف</span><span>18</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;3.5 الخادم والتكوين — 18 ملف</span><span>21</span></div>
<div class="toc-item"><span>4. مصفوفة المشاكل — 47 مشكلة</span><span>23</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;4.1 P0 — حرجة (5 مشاكل)</span><span>23</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;4.2 P1 — عالية (10 مشاكل)</span><span>24</span></div>
<div class="toc-item"><span>&nbsp;&nbsp;&nbsp;4.3 P2 — متوسطة (10 مشاكل)</span><span>25</span></div>
<div class="toc-item"><span>5. حالة الإصلاحات — ما تم وما لم يتم</span><span>26</span></div>
<div class="toc-item"><span>6. الملفات المكررة والتعارضات</span><span>27</span></div>
<div class="toc-item"><span>7. المكونات الناقصة</span><span>28</span></div>
<div class="toc-item"><span>8. الرؤية وخارطة الطريق</span><span>29</span></div>
<div class="toc-item"><span>9. التوصيات النهائية</span><span>31</span></div>
</div>

<!-- =================== SECTION 1: EXECUTIVE SUMMARY =================== -->
<div class="page section">
<h2>1. الملخص التنفيذي</h2>

<div class="callout callout-danger">
<strong>التقييم العام:</strong> التطبيق يعمل تقنياً لكن يفتقر إلى القيمة الحقيقية للمستخدم. 25 من 37 صفحة هي صفحات فارغة (stubs) لا تحتوي على أي بيانات حقيقية أو وظائف فعّالة. لا توجد رسوم بيانية للتوكنز على صفحة التوكن، ولا يوجد تدفق مستخدم نهاية إلى نهاية يعمل بالكامل. المشروع يحتاج إعادة هيكلة جذرية قبل أي تطوير إضافي.
</div>

<p>تم بناء VIXOR كداشبورد تداول عملات مشفرة باستخدام React 19.2.0 و TanStack Start 1.168.25 و Tailwind CSS v4 و shadcn/ui مع Supabase كخلفية. المشروع يحتوي على 267 ملفاً مصدرياً موزعة على 6 تصنيفات رئيسية: المسارات (37 ملف)، المكونات (80 ملف)، النطاقات الوظيفية (104 ملف)، البنية المشتركة (68 ملف)، ملفات الخادم (18 ملف)، والتكوين (عدة ملفات).</p>

<p>أكبر نقاط الضعف هي: غياب بيانات حقيقية في معظم الصفحات، نظام ألوان مزدوج (4 أنظمة متنافسة)، خطوط معرّفة لكن غير محمّلة، وغياب سلسلة مستخدم كاملة من الاكتشاف إلى التحليل إلى التداول. تم إجراء مراجعة سابقة وجدت 47 مشكلة تم تصنيفها إلى P0 (5 حرجة)، P1 (10 عالية)، و P2 (10 متوسطة). تم إصلاح 25 مشكلة منها في جلسات سابقة، لكن المشاكل الهيكلية الأساسية لا تزال قائمة.</p>

<p>هذا المستند يقدم مراجعة شاملة لكل ملف في المشروع مع تحليل حالته ومشاكله والتوصيات اللازمة قبل البدء في إعادة الهيكلة الكبرى. الهدف هو توفير خريطة كاملة تسمح باتخاذ قرارات مدروسة حول ما يجب حذفه ودمجه وإعادة بنائه.</p>

<div class="stat-grid">
<div class="stat-card"><div class="num">267</div><div class="label">ملف مصدري</div></div>
<div class="stat-card"><div class="num">37</div><div class="label">مسار/صفحة</div></div>
<div class="stat-card"><div class="num">25</div><div class="label">صفحة فارغة (stub)</div></div>
</div>
<div class="stat-grid">
<div class="stat-card"><div class="num">47</div><div class="label">مشكلة مكتشفة</div></div>
<div class="stat-card"><div class="num">25</div><div class="label">إصلاح مكتمل</div></div>
<div class="stat-card"><div class="num">22</div><div class="label">مشكلة متبقية</div></div>
</div>

</div>

<!-- =================== SECTION 2: STATS =================== -->
<div class="page section">
<h2>2. الإحصائيات العامة</h2>

<h3>2.1 توزيع الملفات حسب التصنيف</h3>
<table>
<thead><tr><th>التصنيف</th><th>عدد الملفات</th><th>النسبة</th><th>الحالة العامة</th></tr></thead>
<tbody>
<tr><td>المسارات (routes/)</td><td>37</td><td>14%</td><td>67% صفحات فارغة</td></tr>
<tr><td>مكونات shadcn (ui/)</td><td>43</td><td>16%</td><td>مكتملة (مكتبة جاهزة)</td></tr>
<tr><td>مكونات VIXOR (vixor/)</td><td>37</td><td>14%</td><td>60% وظيفية، 40% ناقصة</td></tr>
<tr><td>النطاقات الوظيفية (domains/)</td><td>104</td><td>39%</td><td>50% وظيفية، 30% stubs، 20% اختبارات</td></tr>
<tr><td>البنية المشتركة (shared/ + lib/)</td><td>68</td><td>25%</td><td>70% وظيفية</td></tr>
<tr><td>الخادم والتكوين (server/)</td><td>18</td><td>7%</td><td>وظيفية مع بعض الـ stubs</td></tr>
<tr><td>التجربة والأنماط (experience/)</td><td>7</td><td>3%</td><td>غير متكاملة</td></tr>
<tr><td>Hooks + Types + Config</td><td>~15</td><td>5%</td><td>وظيفية</td></tr>
</tbody>
</table>

<h3>2.2 توزيع حالات الصفحات</h3>
<table>
<thead><tr><th>الحالة</th><th>العدد</th><th>الوصف</th></tr></thead>
<tbody>
<tr><td class="stub">صفحة فارغة (Stub)</td><td>25</td><td>تحتوي فقط على EmptyState أو نص "قريباً" بدون أي وظيفة</td></tr>
<tr><td class="partial">صفحة جزئية</td><td>8</td><td>تحتوي على واجهة لكن بدون بيانات حقيقية أو وظائف كاملة</td></tr>
<tr><td class="functional">صفحة وظيفية</td><td>4</td><td>تعمل مع بيانات حقيقية: Home، Discover، Journal، Copilot</td></tr>
</tbody>
</table>

<h3>2.3 إحصائيات نظام التصميم</h3>
<table>
<thead><tr><th>المقياس</th><th>القيمة</th><th>التقييم</th></tr></thead>
<tbody>
<tr><td>متغيرات CSS مخصصة</td><td>55+</td><td class="sev-low">جيد</td></tr>
<tr><td>أنظمة ألوان متنافسة</td><td>4</td><td class="sev-critical">حرج</td></tr>
<tr><td>ألوان مكتوبة يدوياً</td><td>339 تكرار في 29 ملف</td><td class="sev-critical">حرج</td></tr>
<tr><td>خطوط معرّفة لكن غير محمّلة</td><td>2 (Inter + JetBrains Mono)</td><td class="sev-critical">حرج</td></tr>
<tr><td>كتل catch صامتة</td><td>15+</td><td class="sev-high">عالي</td></tr>
<tr><td>تعارضات أسماء المكونات</td><td>3 أزواج</td><td class="sev-high">عالي</td></tr>
<tr><td>ملفات مكررة (lib vs domains)</td><td>14 ملف</td><td class="sev-high">عالي</td></tr>
</tbody>
</table>

</div>

<!-- =================== SECTION 3: FILE INVENTORY =================== -->
<div class="page section">
<h2>3. جرد الملفات الكامل</h2>

<h3>3.1 المسارات (Routes) — 37 ملف</h3>

<h4>الصفحات الوظيفية (4 صفحات)</h4>
<table>
<thead><tr><th>#</th><th>المسار</th><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>1</td><td>/</td><td>_authenticated/index.tsx</td><td>الصفحة الرئيسية — عرض إحصائيات المحفظة والسوق</td><td class="functional">وظيفية</td></tr>
<tr><td>2</td><td>/discover</td><td>_authenticated/discover.tsx</td><td>اكتشاف العملات — بيانات حية من DexScreener</td><td class="functional">وظيفية</td></tr>
<tr><td>3</td><td>/journal</td><td>_authenticated/journal.tsx</td><td>يومية التداول — إدخال ملاحظات وإدارة الصفقات</td><td class="functional">وظيفية</td></tr>
<tr><td>4</td><td>/copilot</td><td>_authenticated/copilot.tsx</td><td>مساعد الذكاء الاصطناعي — محادثة مع وكلاء AI</td><td class="functional">وظيفية</td></tr>
</tbody>
</table>

<h4>الصفحات الجزئية (8 صفحات)</h4>
<table>
<thead><tr><th>#</th><th>المسار</th><th>الملف</th><th>الغرض</th><th>الحالة</th><th>المشاكل</th></tr></thead>
<tbody>
<tr><td>5</td><td>/analysis/:id</td><td>analysis.$id.tsx</td><td>عرض تحليل تقني مفصّل</td><td class="partial">جزئية</td><td>76 لون مكتوب يدوياً، بيانات محاكاة</td></tr>
<tr><td>6</td><td>/token/:symbol</td><td>token.$symbol.tsx</td><td>صفحة التوكن التفصيلية</td><td class="partial">جزئية</td><td>لا توجد رسوم بيانية، نص "قريباً"</td></tr>
<tr><td>7</td><td>/settings</td><td>_authenticated/settings.tsx</td><td>إعدادات التطبيق</td><td class="partial">جزئية</td><td>3 أزرار بدون وظيفة</td></tr>
<tr><td>8</td><td>/notifications</td><td>_authenticated/notifications.tsx</td><td>الإشعارات</td><td class="partial">جزئية</td><td>واجهة بدون بيانات حقيقية</td></tr>
<tr><td>9</td><td>/profile</td><td>_authenticated/profile.tsx</td><td>ملف المستخدم</td><td class="partial">جزئية</td><td>بيانات محاكاة</td></tr>
<tr><td>10</td><td>/auth</td><td>auth.tsx</td><td>تسجيل الدخول</td><td class="partial">جزئية</td><td>تعمل لكن بدون validate كامل</td></tr>
<tr><td>11</td><td>/signals</td><td>_authenticated/signals.tsx</td><td>إشارات التداول</td><td class="partial">جزئية</td><td>واجهة بدون إشارات حقيقية</td></tr>
<tr><td>12</td><td>/daily-loop</td><td>_authenticated/daily-loop.tsx</td><td>الحلقة اليومية</td><td class="partial">جزئية</td><td>نصوص 8px، بدون validate</td></tr>
</tbody>
</table>

<h4>الصفحات الفارغة — Stubs (25 صفحة)</h4>
<table>
<thead><tr><th>#</th><th>المسار</th><th>الملف</th><th>الملاحظة</th></tr></thead>
<tbody>
<tr><td>13</td><td>/analyze</td><td>analyze.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>14</td><td>/alpha</td><td>alpha.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>15</td><td>/arbitrage</td><td>arbitrage.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>16</td><td>/backtest</td><td>backtest.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>17</td><td>/charts</td><td>charts.tsx</td><td>نص "COMING SOON"</td></tr>
<tr><td>18</td><td>/communities</td><td>communities.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>19</td><td>/curves</td><td>curves.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>20</td><td>/experiments</td><td>experiments.tsx</td><td>EmptyState + 19 لون مكتوب يدوياً</td></tr>
<tr><td>21</td><td>/pnl</td><td>pnl.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>22</td><td>/portfolio</td><td>portfolio.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>23</td><td>/predictions</td><td>predictions.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>24</td><td>/premium</td><td>premium.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>25</td><td>/perpetuals</td><td>perpetuals.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>26</td><td>/pulse</td><td>pulse.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>27</td><td>/referral</td><td>referral.tsx</td><td>فقط EmptyState + catch صامت</td></tr>
<tr><td>28</td><td>/rewards</td><td>rewards.tsx</td><td>فقط EmptyState + خط مختلف</td></tr>
<tr><td>29</td><td>/route</td><td>route.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>30</td><td>/swap</td><td>swap.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>31</td><td>/trackers</td><td>trackers.tsx</td><td>نص عادي فقط (بدون EmptyState)</td></tr>
<tr><td>32</td><td>/trade-desk</td><td>trade-desk.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>33</td><td>/vision</td><td>vision.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>34</td><td>/wallet-web3</td><td>wallet-web3.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>35</td><td>/whale</td><td>whale.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>36</td><td>/yield</td><td>yield.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>37</td><td>/activity-web3</td><td>activity-web3.tsx</td><td>فقط EmptyState</td></tr>
<tr><td>—</td><td>/admin/api-keys</td><td>admin/api-keys.tsx</td><td>صفحة إدارية جزئية</td></tr>
</tbody>
</table>

<div class="callout callout-danger">
<strong>ملاحظة حرجة:</strong> 25 من 37 صفحة (67%) لا تحتوي على أي وظيفة حقيقية. هذه الصفحات تستهلك موارد الصيانة دون تقديم قيمة. يجب حذف أو دمج معظمها في إعادة الهيكلة.
</div>

</div>

<!-- =================== SECTION 3.2: COMPONENTS =================== -->
<div class="page section">
<h3>3.2 المكونات (Components) — 80 ملف</h3>

<h4>مكونات VIXOR المخصصة (37 ملف)</h4>
<table>
<thead><tr><th>المكون</th><th>الملف</th><th>الغرض</th><th>الحالة</th><th>المشاكل</th></tr></thead>
<tbody>
<tr><td>AppShell</td><td>vixor/AppShell.tsx</td><td>التنقل الرئيسي (TopNav + BottomBar + MorePanel)</td><td class="functional">وظيفي</td><td>884 سطر، 37 لون مكتوب يدوياً، SVG مكررة</td></tr>
<tr><td>PageLayout</td><td>vixor/PageLayout.tsx</td><td>قالب الصفحات (Header + Tabs + Empty/Loading/Error)</td><td class="functional">وظيفي</td><td>899 سطر، 25 لون مكتوب يدوياً، تعارض أسماء</td></tr>
<tr><td>atoms</td><td>vixor/atoms.tsx</td><td>12 مكون ذري (Badge، SectionTitle، PriceCell...)</td><td class="functional">وظيفي</td><td>تعارض أسماء مع PageLayout</td></tr>
<tr><td>AgentResponseLayout</td><td>vixor/AgentResponseLayout.tsx</td><td>تخطيط موحّد لـ 4 وكلاء AI</td><td class="functional">وظيفي</td><td>جديد — أنشئ أثناء الإصلاحات</td></tr>
<tr><td>TradingViewChart</td><td>vixor/TradingViewChart.tsx</td><td>تضمين رسم TradingView</td><td class="functional">وظيفي</td><td>غير مستخدم في أي صفحة!</td></tr>
<tr><td>TradingViewMiniChart</td><td>vixor/TradingViewMiniChart.tsx</td><td>رسم مصغّر من TradingView</td><td class="functional">وظيفي</td><td>غير مستخدم</td></tr>
<tr><td>TradingViewTechAnalysis</td><td>vixor/TradingViewTechAnalysis.tsx</td><td>تحليل فني من TradingView</td><td class="functional">وظيفي</td><td>غير مستخدم</td></tr>
<tr><td>TradingViewTickerTape</td><td>vixor/TradingViewTickerTape.tsx</td><td>شريط أسعار TradingView</td><td class="functional">وظيفي</td><td>غير مستخدم</td></tr>
<tr><td>DexChart</td><td>vixor/DexChart.tsx</td><td>رسم بياني من DexScreener</td><td class="functional">وظيفي</td><td>مستخدم في صفحة التوكن</td></tr>
<tr><td>CandlestickChart</td><td>vixor/CandlestickChart.tsx</td><td>رسم شموع يابانية مخصص</td><td class="partial">جزئي</td><td>بدون بيانات حقيقية</td></tr>
<tr><td>EquityChart</td><td>vixor/EquityChart.tsx</td><td>رسم منحنى رأس المال</td><td class="partial">جزئي</td><td>بدون بيانات حقيقية</td></tr>
<tr><td>MiniSparkline</td><td>vixor/MiniSparkline.tsx</td><td>خط صغير للأسعار</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>LiveDot</td><td>vixor/LiveDot.tsx</td><td>نقطة نابضة للحالة المباشرة</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>StatCard</td><td>vixor/StatCard.tsx</td><td>بطاقة إحصائية</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>SignalBadge</td><td>vixor/SignalBadge.tsx</td><td>شارة الإشارة (شراء/بيع)</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>EmptyState</td><td>vixor/EmptyState.tsx</td><td>حالة فارغة موحّدة</td><td class="functional">وظيفي</td><td>19 من 22 بدون زر CTA</td></tr>
<tr><td>ExpandableWidget</td><td>vixor/ExpandableWidget.tsx</td><td>ودجت قابل للتوسيع</td><td class="functional">وظيفي</td><td>max-h-[1000px] رقم سحري</td></tr>
<tr><td>PaginationBar</td><td>vixor/PaginationBar.tsx</td><td>شريط ترقيم الصفحات</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>PullIndicator</td><td>vixor/PullIndicator.tsx</td><td>مؤشر السحب للتحديث</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>TrendArrow</td><td>vixor/TrendArrow.tsx</td><td>سهم الاتجاه (صعود/هبوط)</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>CoinImage</td><td>vixor/CoinImage.tsx</td><td>صورة العملة</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>MoxiAvatar</td><td>vixor/MoxiAvatar.tsx</td><td>صورة مساعد Moxi</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>HunterScoreCard</td><td>vixor/HunterScoreCard.tsx</td><td>بطاقة وكيل الصيد</td><td class="partial">جزئي</td><td>80% تكرار مع Coach/Governor</td></tr>
<tr><td>CoachOverlay</td><td>vixor/CoachOverlay.tsx</td><td>طبقة وكيل التدريب</td><td class="partial">جزئي</td><td>80% تكرار</td></tr>
<tr><td>GovernorRiskPanel</td><td>vixor/GovernorRiskPanel.tsx</td><td>لوحة حوكمة المخاطر</td><td class="partial">جزئي</td><td>80% تكرار</td></tr>
<tr><td>AnalystReportPanel</td><td>vixor/AnalystReportPanel.tsx</td><td>لوحة تقرير المحلل</td><td class="partial">جزئي</td><td>ألوان Tailwind بدل CSS vars</td></tr>
<tr><td>OnboardingModal</td><td>vixor/OnboardingModal.tsx</td><td>نافذة الترحيب</td><td class="functional">وظيفي</td><td>تم إصلاح bug andleClose</td></tr>
<tr><td>AlertsList</td><td>vixor/AlertsList.tsx</td><td>قائمة التنبيهات</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>CreateAlertDialog</td><td>vixor/CreateAlertDialog.tsx</td><td>نافذة إنشاء تنبيه</td><td class="functional">وظيفي</td><td>80% تكرار مع EditAlert</td></tr>
<tr><td>EditAlertDialog</td><td>vixor/EditAlertDialog.tsx</td><td>نافذة تعديل تنبيه</td><td class="functional">وظيفي</td><td>80% تكرار مع CreateAlert</td></tr>
<tr><td>NoteEditorDialog</td><td>vixor/NoteEditorDialog.tsx</td><td>محرر الملاحظات</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>BaseFeaturePanel</td><td>vixor/BaseFeaturePanel.tsx</td><td>قاعدة لوحات الميزات</td><td class="partial">جزئي</td><td>—</td></tr>
<tr><td>RouteErrorBoundary</td><td>vixor/RouteErrorBoundary.tsx</td><td>حدود الخطأ للمسارات</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>RouteLoading</td><td>vixor/RouteLoading.tsx</td><td>حالة التحميل</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>EngagementBar</td><td>vixor/EngagementBar.tsx</td><td>شريط التفاعل</td><td class="partial">جزئي</td><td>—</td></tr>
<tr><td>token-card</td><td>ui/token-card.tsx</td><td>بطاقة التوكن (shadcn-style)</td><td class="functional">وظيفي</td><td>—</td></tr>
</tbody>
</table>

<div class="callout callout-warn">
<strong>ملاحظة:</strong> 4 مكونات TradingView جاهزة ومكتملة لكن غير مستخدمة في أي صفحة. هذا يعني أن ميزة الرسوم البيانية متوفرة ككود لكن لم تُوصَّل أبداً بالواجهة.
</div>

<h4>مكونات shadcn/ui (43 ملف) — مكتبة قياسية</h4>
<p>جميع مكونات shadcn/ui (accordion, alert, button, card, dialog, drawer, dropdown-menu, form, input, label, select, sheet, sidebar, skeleton, switch, table, tabs, tooltip, إلخ) هي مكونات قياسية من مكتبة shadcn. حالتها مكتملة ولا تحتاج مراجعة. هذه المكونات تمثل 16% من إجمالي الملفات وهي جاهزة للاستخدام مباشرة.</p>

</div>

<!-- =================== SECTION 3.3: DOMAINS =================== -->
<div class="page section">
<h3>3.3 النطاقات الوظيفية (Domains) — 104 ملف</h3>

<h4>3.3.1 نطاق التحليل (analysis/) — 16 ملف</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>engine/engine.ts</td><td>محرك التحليل الرئيسي</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/core/types.ts</td><td>أنواع بيانات OHLCV</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/core/candle-utils.ts</td><td>أدوات الشموع اليابانية</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/core/market-structure.ts</td><td>تحليل هيكل السوق</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/indicators/index.ts</td><td>المؤشرات الفنية (RSI, MACD...)</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/patterns/candlestick-patterns.ts</td><td>أنماط الشموع</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/patterns/chart-formations.ts</td><td>الأنماط البيانية</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/patterns/harmonic-patterns.ts</td><td>الأنماط التوافقية</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/regime/regime-detector.ts</td><td>كاشف النظام السوقي</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/regime/indicator-math.ts</td><td>رياضيات المؤشرات</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/regime/strategy-scorer.ts</td><td>تسجيل الاستراتيجيات</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/risk/risk-reward.ts</td><td>حساب المخاطرة/العائد</td><td class="functional">وظيفي</td></tr>
<tr><td>engine/smc/*.ts (4 ملفات)</td><td>Smart Money Concepts (BOS/CHOC, FVG, Liquidity, OB)</td><td class="functional">وظيفي</td></tr>
<tr><td>server/run-analysis.ts</td><td>تشغيل التحليل من الخادم</td><td class="functional">وظيفي</td></tr>
<tr><td>server/market-snapshot.ts</td><td>لقطة سوق فورية</td><td class="functional">وظيفي</td></tr>
<tr><td>functions.ts + types.ts + index.ts</td><td>واجهة API + تصدير</td><td class="functional">وظيفي</td></tr>
</tbody>
</table>

<div class="callout callout-success">
<strong>نطاق التحليل:</strong> هذا أقوى نطاق في المشروع. محرك تحليل فني كامل مع مؤشرات وأنماط و Smart Money Concepts. المشكلة ليست في الكود بل في عدم وصوله للمستخدم عبر واجهة مناسبة.
</div>

<h4>3.3.2 نطاق الكوبايلوت (copilot/) — 11 ملف</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>server/copilot-agent.ts</td><td>الوكيل الرئيسي</td><td class="functional">وظيفي</td></tr>
<tr><td>server/agent-orchestrator.ts</td><td>منسق الوكلاء</td><td class="functional">وظيفي</td></tr>
<tr><td>server/agents.ts</td><td>تعريفات الوكلاء</td><td class="functional">وظيفي</td></tr>
<tr><td>server/analyst.agent.ts</td><td>وكيل المحلل</td><td class="functional">وظيفي</td></tr>
<tr><td>server/coach.agent.ts</td><td>وكيل التدريب</td><td class="functional">وظيفي</td></tr>
<tr><td>server/governor.agent.ts</td><td>وكيل الحوكمة</td><td class="functional">وظيفي</td></tr>
<tr><td>server/hunter.agent.ts</td><td>وكيل الصيد (الفرص)</td><td class="functional">وظيفي</td></tr>
<tr><td>server/decision-store.ts</td><td>مخزن القرارات</td><td class="partial">جزئي</td><td>—</td></tr>
<tr><td>server/feedback.ts</td><td>نظام التغذية الراجعة</td><td class="partial">جزئي</td><td>—</td></tr>
<tr><td>conversations.ts</td><td>إدارة المحادثات</td><td class="functional">وظيفي</td></tr>
<tr><td>functions.ts + types.ts + index.ts</td><td>واجهة API + تصدير</td><td class="functional">وظيفي</td></tr>
</tbody>
</table>

<h4>3.3.3 نطاق الاكتشاف (discovery/) — 12 ملف</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>clients/birdeye.client.ts</td><td>عميل BirdEye API</td><td class="functional">وظيفي</td></tr>
<tr><td>clients/dexscreener.client.ts</td><td>عميل DexScreener API</td><td class="functional">وظيفي</td></tr>
<tr><td>clients/helius.client.ts</td><td>عميل Helius RPC</td><td class="functional">وظيفي</td></tr>
<tr><td>clients/lunarcrush.client.ts</td><td>عميل LunarCrush</td><td class="functional">وظيفي</td></tr>
<tr><td>clients/mobula.client.ts</td><td>عميل Mobula API</td><td class="functional">وظيفي</td></tr>
<tr><td>clients/twitter.client.ts</td><td>عميل Twitter/X</td><td class="stub">Stub</td></tr>
<tr><td>scoring.ts</td><td>نظام تسجيل العملات</td><td class="functional">وظيفي</td></tr>
<tr><td>server.ts</td><td>خادم الاكتشاف</td><td class="functional">وظيفي</td></tr>
<tr><td>config.ts + constants.ts</td><td>تكوين وثوابت</td><td class="functional">وظيفي</td></tr>
<tr><td>tests/ (2 ملف)</td><td>اختبارات التكوين والتسجيل</td><td class="functional">وظيفي</td></tr>
</tbody>
</table>

<h4>3.3.4 نطاق المراجحة (arbitrage/) — 22 ملف</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>engine.ts</td><td>محرك المراجحة</td><td class="functional">وظيفي</td></tr>
<tr><td>executor.ts</td><td>منفذ الصفقات</td><td class="partial">جزئي</td></tr>
<tr><td>price-feed.ts</td><td>تغذية الأسعار</td><td class="functional">وظيفي</td></tr>
<tr><td>risk.ts</td><td>إدارة المخاطر</td><td class="functional">وظيفي</td></tr>
<tr><td>math.ts</td><td>حسابات رياضية</td><td class="functional">وظيفي</td></tr>
<tr><td>logger.ts</td><td>تسجيل الأحداث</td><td class="functional">وظيفي</td></tr>
<tr><td>token-registry.ts</td><td>سجل التوكنز</td><td class="functional">وظيفي</td></tr>
<tr><td>strategies/cex-dex.ts</td><td>استراتيجية CEX-DEX</td><td class="partial">جزئي</td></tr>
<tr><td>strategies/cross-dex.ts</td><td>استراتيجية Cross-DEX</td><td class="partial">جزئي</td></tr>
<tr><td>strategies/triangular.ts</td><td>استراتيجية مثلثية</td><td class="partial">جزئي</td></tr>
<tr><td>exchanges/axiom.client.ts</td><td>عميل Axiom DEX</td><td class="partial">جزئي</td></tr>
<tr><td>exchanges/jupiter.client.ts</td><td>عميل Jupiter DEX</td><td class="partial">جزئي</td></tr>
<tr><td>mock/ (2 ملف)</td><td>محاكاة DEX والأسعار</td><td class="functional">وظيفي</td></tr>
<tr><td>tests/ (3 ملف)</td><td>اختبارات التكوين والمخاطر</td><td class="functional">وظيفي</td></tr>
</tbody>
</table>

<h4>3.3.5 النطاقات المتبقية (53 ملف)</h4>
<table>
<thead><tr><th>النطاق</th><th>الملفات</th><th>الحالة العامة</th><th>الملاحظة</th></tr></thead>
<tbody>
<tr><td>backtest/ (7 ملفات)</td><td>محرك محاكاة + آلة حالة + مقاييس</td><td class="functional">وظيفي</td><td>محاكي كامل لكن بدون واجهة</td></tr>
<tr><td>trading/ (11 ملف)</td><td>بوابة تداول + محولات (Binance, Bybit, OKX...)</td><td class="partial">جزئي</td><td>OKX و Bybit stubs كاملة (18 TODO)</td></tr>
<tr><td>wallet/ (11 ملف)</td><td>محافظ (MetaMask, Phantom, WalletConnect)</td><td class="partial">جزئي</td><td>وظائف متصلة لكن بدون واجهة</td></tr>
<tr><td>market/ (6 ملفات)</td><td>أسعار + أخبار + تقويم اقتصادي</td><td class="functional">وظيفي</td><td>TwelveData + Finnhub + Binance WS</td></tr>
<tr><td>moxi/ (7 ملفات)</td><td>مساعد Moxi الذكي</td><td class="partial">جزئي</td><td>سياق + إشعارات + persona</td></tr>
<tr><td>chart-intelligence/ (5 ملفات)</td><td>تحليل الصور البيانية بالذكاء الاصطناعي</td><td class="partial">جزئي</td><td>رؤية + تحقق + جلسات</td></tr>
<tr><td>chart-truth/ (5 ملفات)</td><td>التحقق من صحة البيانات</td><td class="partial">جزئي</td><td>مطابقة الأسعار + تسجيل</td></tr>
<tr><td>debate/ (6 ملفات)</td><td>محرك النقاش بين الوكلاء</td><td class="functional">وظيفي</td><td>4 وكلاء + محرك نقاش</td></tr>
<tr><td>experiment/ (5 ملفات)</td><td>تجارب Evolve + Runner</td><td class="partial">جزئي</td><td>—</td></tr>
<tr><td>discovery (legacy)/ (3 ملف)</td><td>عميل DexScreener قديم</td><td class="stub">قديم</td><td>مكرر مع discovery/ الجديد</td></tr>
<tr><td>الأخرى*</td><td>daily-loop, notes, paper-trading, risk-governor, signal-tracking, strategy, user, watchlist, trades, brokers</td><td class="stub">Stubs</td><td>معظمها functions.ts فارغة</td></tr>
</tbody>
</table>

</div>

<!-- =================== SECTION 3.4: SHARED/LIB =================== -->
<div class="page section">
<h3>3.4 البنية المشتركة (Shared + Lib) — 68 ملف</h3>

<h4>3.4.1 ملفات مكررة بين lib/ و shared/ و domains/</h4>
<div class="callout callout-danger">
<strong>مشكلة هيكلية:</strong> يوجد 14 ملف مكرر بين src/lib/analysis/ و src/domains/analysis/ بنفس المحتوى تقريباً. هذا يسبب ارتباكاً في الصيانة ويزيد مخاطر التعارضات. يجب حذف src/lib/analysis/ بالكامل والاحتفاظ بـ src/domains/analysis/ فقط.
</div>

<table>
<thead><tr><th>الملف في lib/</th><th>الملف المقابل في domains/</th><th>الإجراء المطلوب</th></tr></thead>
<tbody>
<tr><td>lib/analysis/engine.ts</td><td>domains/analysis/engine/engine.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/core/types.ts</td><td>domains/analysis/engine/core/types.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/core/candle-utils.ts</td><td>domains/analysis/engine/core/candle-utils.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/core/market-structure.ts</td><td>domains/analysis/engine/core/market-structure.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/indicators/index.ts</td><td>domains/analysis/engine/indicators/index.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/patterns/candlestick-patterns.ts</td><td>domains/analysis/engine/patterns/candlestick-patterns.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/patterns/chart-formations.ts</td><td>domains/analysis/engine/patterns/chart-formations.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/patterns/harmonic-patterns.ts</td><td>domains/analysis/engine/patterns/harmonic-patterns.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/risk/risk-reward.ts</td><td>domains/analysis/engine/risk/risk-reward.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/smc/bos-choch.ts</td><td>domains/analysis/engine/smc/bos-choch.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/smc/fair-value-gaps.ts</td><td>domains/analysis/engine/smc/fair-value-gaps.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/smc/liquidity.ts</td><td>domains/analysis/engine/smc/liquidity.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/analysis/smc/order-blocks.ts</td><td>domains/analysis/engine/smc/order-blocks.ts</td><td>حذف lib/</td></tr>
<tr><td>lib/cache.ts, lib/cache-invalidator.ts</td><td>shared/cache.ts, shared/cache-invalidator.ts</td><td>حذف lib/</td></tr>
</tbody>
</table>

<h4>3.4.2 البنية المشتركة المفيدة (shared/)</h4>
<table>
<thead><tr><th>التصنيف</th><th>الملفات</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>LLM Providers</td><td>llm/index.ts, llm/router.ts, llm/types.ts, providers/anthropic.ts, groq.ts, openai.ts, zai.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Market Data</td><td>market-data/dexscreener.ts, dexscreener-ws.ts, binance-ws.ts, helius-rpc.ts, alchemy-rpc.ts, finnhub-quotes.ts, price-resolver.ts, index.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Supabase</td><td>supabase/client.ts, client.server.ts, auth-attacher.ts, auth-middleware.ts, types.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Notifications</td><td>notifications/index.ts, types.ts, channels/email.ts, in-app.ts, telegram.ts, webhook.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Resilience</td><td>resilience/circuit-breaker.ts, lru-cache.ts, rate-limiter.ts, redis-rate-limiter.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Safe Exec</td><td>safe-exec/index.ts, runner.ts, validator.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Tool Registry</td><td>tool-registry/index.ts, bootstrap.ts, types.ts, tools/trading.ts, tools/journal-analysis.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>i18n</td><td>i18n/index.tsx, translations/ar.ts, en.ts, index.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Hooks</td><td>hooks/use-mobile.ts, use-online.ts, use-pull-to-refresh.ts, use-render-guard.ts, use-stable-server-fn.ts, use-signal-monitor.ts, use-sound.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Events</td><td>events/index.ts, orchestrator.ts, persist.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Share</td><td>share/index.ts, format-signal.ts, telegram-share.ts, x-share.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>Memory</td><td>memory/index.ts, store.ts</td><td class="partial">جزئي</td></tr>
<tr><td>API Keys</td><td>api-keys/index.ts, admin-guard.ts, vault.ts</td><td class="functional">وظيفي</td></tr>
<tr><td>أخرى</td><td>utils.ts, logger.ts, sentry.ts, prefs.ts, p1-bootstrap.ts, errors.ts, structured-logger.ts, sound-manager.ts, metrics-store.ts, color-utils.ts, vault/, asset-registry/, execution/, data/, crypto/</td><td class="functional">وظيفي</td></tr>
</tbody>
</table>

<h4>3.4.3 ملفات lib/ المتبقية (بعد حذف المكررات)</h4>
<table>
<thead><tr><th>الملف</th><th>الحالة</th><th>الإجراء</th></tr></thead>
<tbody>
<tr><td>lib/utils.ts</td><td class="stub">مكرر</td><td>حذف — موجود في shared/utils.ts</td></tr>
<tr><td>lib/error-capture.ts</td><td class="stub">مكرر</td><td>حذف — موجود في shared/error-capture.ts</td></tr>
<tr><td>lib/error-page.ts</td><td class="stub">مكرر</td><td>حذف — موجود في shared/error-page.ts</td></tr>
<tr><td>lib/i18n/ (3 ملفات)</td><td class="stub">مكرر</td><td>حذف — موجود في shared/i18n/</td></tr>
<tr><td>lib/telegram.ts</td><td class="stub">مكرر</td><td>حذف — موجود في shared/telegram.ts</td></tr>
<tr><td>lib/vixor-mock.ts</td><td class="partial">جزئي</td><td>نقل إلى shared/ أو حذف</td></tr>
</tbody>
</table>

<div class="callout callout-warn">
<strong>توصية:</strong> حذف مجلد src/lib/ بالكامل بعد التأكد من أن جميع الاستيرادات تشير إلى shared/ أو domains/. هذا يزيل ~20 ملف مكرر ويبسّط هيكل المشروع.
</div>

</div>

<!-- =================== SECTION 3.5: SERVER + CONFIG =================== -->
<div class="page section">
<h3>3.5 الخادم والتكوين — 18 ملف</h3>

<h4>3.5.1 ملفات الخادم (src/server/)</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>server.ts (الجذر)</td><td>إعداد خادم TanStack Start</td><td class="functional">وظيفي</td></tr>
<tr><td>config.server.ts</td><td>تكوين الخادم</td><td class="functional">وظيفي</td></tr>
<tr><td>migrate.server.ts</td><td>هجرات قاعدة البيانات</td><td class="functional">وظيفي</td></tr>
<tr><td>price-fetcher.server.ts</td><td>جلب الأسعار</td><td class="functional">وظيفي</td></tr>
<tr><td>twelvedata.server.ts</td><td>تكامل TwelveData</td><td class="functional">وظيفي</td></tr>
<tr><td>economic-calendar.server.ts</td><td>التقويم الاقتصادي</td><td class="functional">وظيفي</td></tr>
<tr><td>alert-checker.server.ts</td><td>فحص التنبيهات</td><td class="functional">وظيفي</td></tr>
<tr><td>agent-orchestrator.ts</td><td>منسق الوكلاء (خادم)</td><td class="partial">جزئي</td><td>مكرر مع copilot/server/</td></tr>
<tr><td>agents.ts</td><td>تعريفات الوكلاء (خادم)</td><td class="partial">جزئي</td><td>مكرر مع copilot/server/</td></tr>
<tr><td>example.functions.server.ts</td><td>دوال تجريبية</td><td class="stub">Stub</td><td>يجب حذفه</td></tr>
<tr><td>example.functions.ts</td><td>دوال تجريبية</td><td class="stub">Stub</td><td>يجب حذفه</td></tr>
</tbody>
</table>

<h4>3.5.2 ملفات التكوين والجذر</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>start.ts</td><td>نقطة دخول التطبيق</td><td class="functional">وظيفي</td></tr>
<tr><td>router.tsx</td><td>إعداد الراوتر</td><td class="functional">وظيفي</td></tr>
<tr><td>routeTree.gen.ts</td><td>شجرة المسارات (تلقائي)</td><td class="functional">وظيفي</td></tr>
<tr><td>styles.css</td><td>نظام التصميم V5</td><td class="functional">وظيفي</td></tr>
<tr><td>routes/__root.tsx</td><td>الجذر — ErrorBoundary + AppShell</td><td class="functional">وظيفي</td></tr>
<tr><td>routes/auth.tsx</td><td>صفحة تسجيل الدخول</td><td class="partial">جزئي</td></tr>
<tr><td>types/api-routes.d.ts</td><td>أنواع مسارات API</td><td class="functional">وظيفي</td></tr>
<tr><td>types/react-hook-form.d.ts</td><td>أنواع React Hook Form</td><td class="functional">وظيفي</td></tr>
</tbody>
</table>

<h4>3.5.3 نظام التصميم (styles.css)</h4>
<p>ملف styles.css يحتوي على نظام تصميم V5 متقدم يتضمن: 55+ متغير CSS مخصص، 7 مستويات للطباعة، نظام ظلال 3 مستويات مع توهج، رموز حركة مع منحنيات easing، نظام ألوان يعتمد على Indigo (#6366F1) كلون أساسي. النظام مصمم جيداً من الناحية النظرية لكن لا يُستخدم بشكل متسق عبر الكود بسبب وجود 3 أنظمة ألوان أخرى تنافسه.</p>

<h4>3.5.4 التجربة والأنماط (experience/)</h4>
<table>
<thead><tr><th>الملف</th><th>الغرض</th><th>الحالة</th><th>المشكلة</th></tr></thead>
<tbody>
<tr><td>styles/axiom.ts</td><td>نمط Axiom DEX</td><td class="stub">غير متكامل</td><td>نظام ألوان منفصل (--ws-*)</td></tr>
<tr><td>styles/bullx.ts</td><td>نمط BullX</td><td class="stub">غير متكامل</td><td>نظام ألوان منفصل</td></tr>
<tr><td>styles/opensea.ts</td><td>نمط OpenSea</td><td class="stub">غير متكامل</td><td>نظام ألوان منفصل</td></tr>
<tr><td>styles/types.ts</td><td>أنماط الأنماط</td><td class="functional">وظيفي</td><td>—</td></tr>
<tr><td>components/WorkspaceSwitcher.tsx</td><td>مبدّل مساحات العمل</td><td class="stub">غير متكامل</td><td>غير مستخدم</td></tr>
</tbody>
</table>

</div>

<!-- =================== SECTION 4: PROBLEMS MATRIX =================== -->
<div class="page section">
<h2>4. مصفوفة المشاكل — 47 مشكلة</h2>

<h3>4.1 P0 — حرجة (5 مشاكل)</h3>
<table>
<thead><tr><th>#</th><th>الموقع</th><th>المشكلة</th><th>التأثير</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>1</td><td>__root.tsx</td><td>الخطوط غير محمّلة — لا يوجد &lt;link&gt; لـ Inter/JetBrains Mono</td><td>التطبيق يستخدم خطوط النظام</td><td class="stub">لم يُصلح</td></tr>
<tr><td>2</td><td>AppShell + PageLayout</td><td>4 أنظمة ألوان متنافسة</td><td>تبديل السمات معطّل</td><td class="stub">لم يُصلح</td></tr>
<tr><td>3</td><td>PageLayout:602</td><td>DataRow هو &lt;div&gt; وليس &lt;button&gt; — 100+ مثيل</td><td>التطبيق غير قابل للوصول بلوحة المفاتيح</td><td class="stub">لم يُصلح</td></tr>
<tr><td>4</td><td>styles.css .light</td><td>الوضع الفاتح يفتقر لـ 10+ متغيرات</td><td>ألوان التداول تتسرب في الوضع الفاتح</td><td class="stub">لم يُصلح</td></tr>
<tr><td>5</td><td>analysis.$id.tsx</td><td>76 لون مكتوب يدوياً</td><td>صفحة التحليل تتعطل مع أي سمة</td><td class="stub">لم يُصلح</td></tr>
</tbody>
</table>

<h3>4.2 P1 — عالية (10 مشاكل)</h3>
<table>
<thead><tr><th>#</th><th>الموقع</th><th>المشكلة</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>6</td><td>settings.tsx:342</td><td>3 أزرار بدون onClick</td><td class="stub">لم يُصلح</td></tr>
<tr><td>7</td><td>copilot.tsx</td><td>7 كتل catch صامتة</td><td class="stub">لم يُصلح</td></tr>
<tr><td>8</td><td>15+ صفحة</td><td>نصوص 8-10px</td><td class="fixed">تم الإصلاح</td></tr>
<tr><td>9</td><td>settings.tsx:62</td><td>ToggleSwitch 36x20px + بدون ARIA</td><td class="fixed">تم الإصلاح</td></tr>
<tr><td>10</td><td>19 صفحة</td><td>EmptyState بدون زر CTA</td><td class="stub">لم يُصلح</td></tr>
<tr><td>11</td><td>atoms + PageLayout</td><td>تعارضات أسماء: SectionTitle, Badge, ScrollArea</td><td class="stub">لم يُصلح</td></tr>
<tr><td>12</td><td>Hunter/Coach/Governor</td><td>80% كود مكرر + ألوان خاطئة</td><td class="partial">جزئي (AgentResponseLayout)</td></tr>
<tr><td>13</td><td>CreateAlert + EditAlert</td><td>80% كود مكرر</td><td class="stub">لم يُصلح</td></tr>
<tr><td>14</td><td>OnboardingModal</td><td>بدون focus trap + بدون Escape</td><td class="fixed">تم الإصلاح (bug وحدة)</td></tr>
<tr><td>15</td><td>experience/styles/*</td><td>نظام ألوان موازٍ غير متكامل</td><td class="stub">لم يُصلح</td></tr>
</tbody>
</table>

<h3>4.3 P2 — متوسطة (10 مشاكل)</h3>
<table>
<thead><tr><th>#</th><th>الموقع</th><th>المشكلة</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>16</td><td>كل الصفحات</td><td>Loading spinner بدل skeleton</td><td class="stub">لم يُصلح</td></tr>
<tr><td>17</td><td>index.tsx:194</td><td>Dashboard يعرض "..." بدل skeleton</td><td class="stub">لم يُصلح</td></tr>
<tr><td>18</td><td>ExpandableWidget:222</td><td>max-h-[1000px] رقم سحري</td><td class="stub">لم يُصلح</td></tr>
<tr><td>19</td><td>analysis.$id:580</td><td>زر zoom 32x32px</td><td class="fixed">تم الإصلاح</td></tr>
<tr><td>20</td><td>copilot, journal, daily-loop</td><td>نماذج بدون label و aria-label</td><td class="fixed">تم الإصلاح (journal فقط)</td></tr>
<tr><td>21</td><td>Charts + Token</td><td>صفحات stubs — TradingViewChart غير مستخدم</td><td class="stub">لم يُصلح</td></tr>
<tr><td>22</td><td>OKX/Bybit adapters</td><td>18 TODO stubs</td><td class="stub">لم يُصلح</td></tr>
<tr><td>23</td><td>__root.tsx error/404</td><td>20 لون مكتوب يدوياً</td><td class="stub">لم يُصلح</td></tr>
<tr><td>24</td><td>rewards.tsx</td><td>خط mono مختلف عن باقي التطبيق</td><td class="stub">لم يُصلح</td></tr>
<tr><td>25</td><td>WalletConnectButton:180</td><td>text-[10px]</td><td class="fixed">تم الإصلاح</td></tr>
</tbody>
</table>

<h3>4.4 إصلاحات إضافية تمت (خارج الـ 47)</h3>
<table>
<thead><tr><th>الإصلاح</th><th>الملفات المتأثرة</th><th>الحالة</th></tr></thead>
<tbody>
<tr><td>إصلاح bug andleClose في OnboardingModal</td><td>OnboardingModal.tsx</td><td class="fixed">تم</td></tr>
<tr><td>تبديل ToggleSwitch لـ button مع ARIA</td><td>settings.tsx</td><td class="fixed">تم</td></tr>
<tr><td>استبدال text-[8px]-text-[11px] بـ text-xs</td><td>27 ملف، 153 استبدال</td><td class="fixed">تم</td></tr>
<tr><td>تكبير زر zoom لـ 44x44 مع aria-label</td><td>-analysis-id-component.tsx</td><td class="fixed">تم</td></tr>
<tr><td>إضافة aria-label لمدخلات Journal</td><td>journal.tsx</td><td class="fixed">تم</td></tr>
<tr><td>إنشاء AgentResponseLayout الموحّد</td><td>جديد</td><td class="fixed">تم</td></tr>
<tr><td>حذف اختبارات copilot اليتيمة</td><td>copilot/tests/ (محذوف)</td><td class="fixed">تم</td></tr>
<tr><td>إصلاح أخطاء Prettier</td><td>7 ملفات</td><td class="fixed">تم</td></tr>
</tbody>
</table>

</div>

<!-- =================== SECTION 5: FIX STATUS =================== -->
<div class="page section">
<h2>5. حالة الإصلاحات</h2>

<h3>5.1 ملخص عام</h3>
<div class="stat-grid">
<div class="stat-card"><div class="num">25</div><div class="label">تم إصلاحها</div></div>
<div class="stat-card"><div class="num">22</div><div class="label">لم تُصلح بعد</div></div>
<div class="stat-card"><div class="num">5</div><div class="label">P0 حرجة متبقية</div></div>
</div>

<h3>5.2 ما تم إنجازه</h3>
<p>تم إصلاح 25 مشكلة في جلسات سابقة تتضمن: إصلاح خطأ برمجي حرج في OnboardingModal (andleClose)، تحويل ToggleSwitch إلى زر حقيقي مع خصائص ARIA، استبدال 153 نصاً بحجم أقل من 12px بـ text-xs، تكبير أزرار اللمس لتحقيق 44px، إنشاء مكون AgentResponseLayout الموحّد لـ 4 وكلاء AI، حذف ملفات اختبار يتيمة كانت تكسر CI، وإصلاح أخطاء Prettier عبر 7 ملفات. جميع الإصلاحات تم دفعها إلى GitHub واجتازت فحص CI بنجاح.</p>

<h3>5.3 ما لم يتم بعد</h3>
<p>المشاكل المتبقية (22) تتضمن 5 مشاكل حرجة P0: تحميل الخطوط، توحيد أنظمة الألوان، تحويل DataRow إلى زر، إكمال متغيرات الوضع الفاتح، وتحويل الألوان المكتوبة يدوياً في صفحة التحليل. بالإضافة إلى 10 مشاكل عالية P1 و 10 مشاكل متوسطة P2. معظم المشاكل المتبقية هي مشاكل هيكلية تحتاج إعادة هيكلة وليست إصلاحات بسيطة.</p>

<div class="callout callout-warn">
<strong>ملاحظة مهمة:</strong> الإصلاحات التي تمت هي إصلاحات سطحية (إمكانية الوصول، أحجام النصوص، أخطاء بناء). المشاكل الهيكلية الخمس (P0) تحتاج إعادة هيكلة جذرية لنظام التصميم والتنقل. هذه الإصلاحات يجب أن تكون جزءاً من إعادة الهيكلة الكبرى وليست إصلاحات منفصلة.
</div>

</div>

<!-- =================== SECTION 6: DUPLICATES =================== -->
<div class="page section">
<h2>6. الملفات المكررة والتعارضات</h2>

<h3>6.1 ملفات كود مكررة</h3>
<table>
<thead><tr><th>النوع</th><th>التفاصيل</th><th>العدد</th><th>الخطر</th></tr></thead>
<tbody>
<tr><td>lib/analysis/ = domains/analysis/</td><td>14 ملف تحليل فني مكررة</td><td>14</td><td class="sev-critical">حرج</td></tr>
<tr><td>lib/ = shared/ (utils, cache, i18n, telegram, error)</td><td>ملفات مساعدة مكررة</td><td>8</td><td class="sev-high">عالي</td></tr>
<tr><td>server/agent-orchestrator.ts = copilot/server/</td><td>منسق الوكلاء مكرر</td><td>2</td><td class="sev-high">عالي</td>
<tr><td>server/agents.ts = copilot/server/agents.ts</td><td>تعريفات الوكلاء مكررة</td><td>2</td><td class="sev-high">عالي</td></tr>
<tr><td>discover/ (legacy) = discovery/</td><td>نطاق اكتشاف قديم وجديد</td><td>3</td><td class="sev-medium">متوسط</td></tr>
<tr><td>lib/i18n/ = shared/i18n/</td><td>نظام الترجمة مكرر</td><td>4</td><td class="sev-medium">متوسط</td></tr>
</tbody>
</table>

<h3>6.2 تعارضات أسماء المكونات</h3>
<table>
<thead><tr><th>الاسم</th><th>الملف 1</th><th>الملف 2</th><th>التعارض</th></tr></thead>
<tbody>
<tr><td>SectionTitle</td><td>atoms.tsx</td><td>PageLayout.tsx</td><td>واجهات برمجية مختلفة</td></tr>
<tr><td>Badge</td><td>PageLayout.tsx</td><td>ui/badge.tsx</td><td>واجهات برمجية مختلفة</td></tr>
<tr><td>ScrollArea</td><td>PageLayout.tsx</td><td>ui/scroll-area.tsx</td><td>واجهات برمجية مختلفة</td></tr>
</tbody>
</table>

<h3>6.3 كود مكرر داخل المكونات</h3>
<table>
<thead><tr><th>المكونات</th><th>نسبة التكرار</th><th>الحل المقترح</th></tr></thead>
<tbody>
<tr><td>HunterScoreCard + CoachOverlay + GovernorRiskPanel</td><td>80%</td><td>دمج في AgentResponseLayout (تم إنشاؤه جزئياً)</td></tr>
<tr><td>CreateAlertDialog + EditAlertDialog</td><td>80%</td><td>إنشاء AlertFormDialog موحّد</td></tr>
<tr><td>AppShell (20 أيقونة SVG مكررة)</td><td>100%</td><td>استخدام أيقونات Lucide (مثبتة)</td></tr>
</tbody>
</table>

</div>

<!-- =================== SECTION 7: MISSING COMPONENTS =================== -->
<div class="page section">
<h2>7. المكونات الناقصة</h2>

<p>رغم وجود عدد كبير من المكونات، هناك مكونات أساسية مفقودة تمنع التطبيق من تقديم تجربة مستخدم كاملة. بعض هذه المكونات موجود ككود لكن غير متصل بالواجهة، والبعض الآخر غير موجود إطلاقاً.</p>

<table>
<thead><tr><th>المكون</th><th>الحالة الحالية</th><th>الأثر على المستخدم</th><th>الأولوية</th></tr></thead>
<tbody>
<tr><td>رسم بياني للتوكن</td><td>TradingViewChart موجود لكن غير مستخدم في صفحة token/:symbol</td><td>المستخدم لا يرى أي رسم بياني عند فتح صفحة توكن</td><td class="p0">P0</td></tr>
<tr><td>تدفق بيانات حية في Dashboard</td><td>مكونات الأسعار موجودة (market-data) لكن Dashboard يعرض "..."</td><td>الصفحة الرئيسية لا تعرض بيانات حقيقية</td><td class="p0">P0</td></tr>
<tr><td>نظام Skeleton Loading</td><td>مكون Skeleton موجود في shadcn لكن غير مستخدم</td><td>قفزة بصرية عند وصول البيانات</td><td class="p1">P1</td></tr>
<tr><td>زر CTA في EmptyState</td><td>الخاصية موجودة لكن 19 من 22 صفحة لا تستخدمها</td><td>المستخدم عالق في صفحات فارغة بدون خروج</td><td class="p1">P1</td></tr>
<tr><td>إشعارات فورية</td><td>نظام الإشعارات موجود في الخادم لكن بدون اتصال WebSocket</td><td>لا تحديثات فورية</td><td class="p2">P2</td></tr>
<tr><td>تحويل عملات (Swap)</td><td>صفحة swap فارغة بالكامل</td><td>لا يمكن تنفيذ صفقات</td><td class="p1">P1</td></tr>
<tr><td>إدارة المحفظة</td><td>صفحة portfolio فارغة</td><td>لا يمكن رؤية الأصول</td><td class="p1">P1</td></tr>
<tr><td>PnL Tracker</td><td>صفحة pnl فارغة</td><td>لا يمكن تتبع الأرباح والخسائر</td><td class="p2">P2</td></tr>
</tbody>
</table>

</div>

<!-- =================== SECTION 8: VISION & ROADMAP =================== -->
<div class="page section">
<h2>8. الرؤية وخارطة الطريق</h2>

<h3>8.1 الرؤية</h3>
<p>VIXOR يجب أن يكون منصة تداول ذكية واحدة تقدم تجربة متكاملة من اكتشاف الفرص إلى تنفيذ الصفقات. التدفق الأساسي المطلوب هو: الرئيسية (نظرة سريعة) ثم الاكتشاف (بيانات حية) ثم صفحة التوكن (مع رسم بياني حقيقي) ثم التحليل (بتحليل فني مدعوم بالذكاء الاصطناعي) ثم الكوبايلوت (للاتخاذ القرار) ثم اليومية/الصفقات (للتتبع). هذا التدفق غير موجود حالياً بسبب الصفحات الفارغة والمكونات غير المتصلة.</p>

<p>المشروع لديه بنية تحتية قوية: محرك تحليل فني كامل، 5 عملاء API للبيانات، نظام وكلاء AI مع 4 وكيلات متخصصة، نظام مراجحة مع 3 استراتيجيات، محرك محاكاة للخلف-testing، و 6 محولات للتبادلات. المشكلة ليست في غياب البنية التحتية بل في عدم وصولها للمستخدم عبر واجهة مناسبة. الهدف من إعادة الهيكلة هو بناء جسر بين هذه البنية القوية والمستخدم النهائي.</p>

<h3>8.2 خارطة الطريق المقترحة</h3>

<div class="phase">
<div class="phase-title">المرحلة 1: التنظيف (أسبوع واحد)</div>
<div class="phase-items">
- حذف src/lib/ بالكامل (~20 ملف مكرر)<br>
- حذف server/example.functions.* (2 ملف تجريبي)<br>
- حذف domains/discover/ القديم (3 ملفات مكررة مع discovery/)<br>
- حذف 20+ صفحة stub فارغة من المسارات<br>
- حذف experience/styles/* غير المتكامل (4 ملفات)<br>
- توحيد server/agent-orchestrator.ts و server/agents.ts مع copilot/server/<br>
- النتيجة: تقليص المشروع من 267 ملف إلى ~190 ملف
</div>
</div>

<div class="phase">
<div class="phase-title">المرحلة 2: توحيد نظام التصميم (أسبوع)</div>
<div class="phase-items">
- إضافة &lt;link&gt; لتحميل Inter و JetBrains Mono في __root.tsx<br>
- حذف THEME constant من PageLayout.tsx<br>
- تحويل كل الألوان المكتوبة يدوياً (339 تكرار) إلى متغيرات CSS<br>
- تحويل AppShell inline styles إلى Tailwind + CSS vars<br>
- إكمال متغيرات الوضع الفاتح (--bullish, --bearish, --gradient-*)<br>
- حل تعارضات الأسماء (SectionTitle, Badge, ScrollArea)<br>
- النتيجة: نظام ألوان واحد موحّد قابل للتبديل
</div>
</div>

<div class="phase">
<div class="phase-title">المرحلة 3: بناء التدفق الأساسي (أسبوعان)</div>
<div class="phase-items">
- توصيل TradingViewChart بصفحة token/:symbol<br>
- ربط بيانات السوق الحية بالصفحة الرئيسية (استبدال "...")<br>
- ربط محرك التحليل بصفحة /analyze<br>
- إضافة Skeleton Loading بدل Spinner<br>
- تحويل DataRow إلى &lt;button&gt; للوصول بلوحة المفاتيح<br>
- إضافة أزرار CTA لكل EmptyState<br>
- النتيجة: تدفق مستخدم كامل: Home - Discover - Token - Analyze - Copilot - Journal
</div>
</div>

<div class="phase">
<div class="phase-title">المرحلة 4: تحسين الواجهة (أسبوع)</div>
<div class="phase-items">
- دمج HunterScoreCard/CoachOverlay/GovernorRiskPanel في AgentResponseLayout<br>
- دمج CreateAlert/EditAlert في AlertFormDialog موحّد<br>
- استبدال 20 SVG مكررة في AppShell بأيقونات Lucide<br>
- تقليل ارتفاع AppShell (حالي 120px+ من المحتوى)</td><br>
- إضافة skip-to-content link<br>
- تحسين نموذج Settings (إزالة/تفعيل الأزرار المعطّلة)<br>
- النتيجة: واجهة أنظف وأسرع وأكثر قابلية للوصول
</div>
</div>

<div class="phase">
<div class="phase-title">المرحلة 5: الميزات المتقدمة (أسبوعان)</div>
<div class="phase-items">
- تفعيل نظام Swap مع Jupiter/Axiom<br>
- بناء صفحة Portfolio مع بيانات حقيقية<br>
- تفعيل PnL Tracker<br>
- ربط نظام الإشعارات بـ WebSocket<br>
- تطبيق صفحة Charts باستخدام TradingViewChart الموجود<br>
- ربط محرك Backtest بالواجهة<br>
- النتيجة: منصة تداول متكاملة
</div>
</div>

</div>

<!-- =================== SECTION 9: RECOMMENDATIONS =================== -->
<div class="page section">
<h2>9. التوصيات النهائية</h2>

<div class="callout callout-danger">
<strong>التوصية الأهم:</strong> لا تبدأ بأي ميزة جديدة قبل إكمال المرحلة 1 (التنظيف) والمرحلة 2 (توحيد التصميم). إضافة ميزات على أساس متهالك سيضاعف الديون التقنية ويجعل الإصلاح مستقبلاً أصعب بكثير.
</div>

<h3>9.1 ما يجب حذفه فوراً (قبل أي تطوير)</h3>
<table>
<thead><tr><th>العنصر</th><th>السبب</th><th>البدائل</th></tr></thead>
<tbody>
<tr><td>src/lib/ (كامل)</td><td>مكرر بالكامل مع shared/ و domains/</td><td>استخدم shared/ و domains/</td></tr>
<tr><td>25 صفحة stub فارغة</td><td>تستهلك موارد بدون قيمة</td><td>احتفظ بـ 5-8 صفحات أساسية فقط</td></tr>
<tr><td>experience/styles/*</td><td>نظام ألوان موازٍ غير مستخدم</td><td>استخدم CSS vars من styles.css</td></tr>
<tr><td>domains/discover/ (قديم)</td><td>مكرر مع domains/discovery/</td><td>استخدم discovery/ فقط</td></tr>
<tr><td>server/example.functions.*</td><td>ملفات تجريبية</td><td>حذف</td></tr>
<tr><td>OKX + Bybit adapters</td><td>18 TODO stubs غير منفذة</td><td>احذفها وأعد إنشاءها عند الحاجة</td></tr>
</tbody>
</table>

<h3>9.2 ما يجب بناؤه أولاً</h3>
<table>
<thead><tr><th>الأولوية</th><th>العنصر</th><th>السبب</th></tr></thead>
<tbody>
<tr><td class="p0">1</td><td>رسم بياني حقيقي في صفحة التوكن</td><td>المستخدم يتوقع رؤية الرسم عند فتح أي توكن</td></tr>
<tr><td class="p0">2</td><td>بيانات حية في الصفحة الرئيسية</td><td>الصفحة الرئيسية بدون بيانات = بلا قيمة</td></tr>
<tr><td class="p0">3</td><td>تحويل الألوان المكتوبة يدوياً (339)</td><td>يمنع تبديل السمات ويجعل الصيانة مستحيلة</td></tr>
<tr><td class="p0">4</td><td>تحميل الخطوط</td><td>مشكلة خطوة واحدة (&lt;link&gt; tag) بتأثير كبير</td></tr>
<tr><td class="p0">5</td><td>تدفق المستخدم الأساسي</td><td>Home - Discover - Token - Analyze - Copilot - Journal</td></tr>
</tbody>
</table>

<h3>9.3 الهيكل المقترح بعد إعادة الهيكلة</h3>
<p>بعد التنظيف، يجب أن يكون المشروع منظماً كالتالي: 8-10 مسارات فقط (بدلاً من 37)، نطاقات وظيفية واضحة بدون تكرار، نظام تصميم واحد موحّد، ومكونات قابلة لإعادة الاستخدام بدون تعارضات. الهدف هو تطبيق أصغر وأسرع وأسهل في الصيانة يقدم قيمة حقيقية للمستخدم بدلاً من عشرات الصفحات الفارغة.</p>

<h3>9.4 نقاط القوة الحالية</h3>
<p>رغم المشاكل المذكورة، يوجد أساس قوي يمكن البناء عليه: محرك تحليل فني متكامل مع Smart Money Concepts، 5 عملاء بيانات سوقية حقيقية (DexScreener، BirdEye، Helius، LunarCrush، Finnhub)، نظام وكلاء AI مع 4 وكيلات متخصصة (صيد، تحليل، تدريب، حوكمة)، محرك مراجحة مع 3 استراتيجيات، محرك محاكاة للخلف-testing كامل، ونظام إشعارات متعدد القنوات. كل هذه البنية موجودة وتعمل — المشكلة هي أنها غير متصلة بالواجهة.</p>

</div>

</body>
</html>'''

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'HTML written to {HTML_PATH}')
print(f'HTML size: {len(html)} chars')
