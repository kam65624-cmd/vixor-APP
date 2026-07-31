"""
VIXOR Architecture Bible — Document 02 (Arabic RTL)
Generates the official Software Architecture Bible for the VIXOR system.
"""

import sys
sys.path.insert(0, "/home/z/my-project/scripts/vixor-bible")

from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


def build_chapters():
    return [

        # ─────────────────────────────────────────────
        # 01 — مبادئ البنية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-01",
            "title": "مبادئ البنية",
            "content": """
<p class="body-text">
تستند بنية نظام فيكسور الهندسية إلى مجموعة من المبادئ الأساسية التي تضمن الاتساق والقابلية للصيانة والتوسع على المدى الطويل. هذه المبادئ ليست مجرد إرشادات عامة، بل قواعد صارمة يلتزم بها كل مطور يعمل على المشروع. تم صياغتها بناءً على أفضل الممارسات في هندسة البرمجيات الحديثة، مع تعديلات تناسب طبيعة سوق التداول والعملات الرقمية السريعة التغير.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ الأول: عزل النطاقات (Domain Isolation)</div>
</div>
<p class="body-text">
كل وحدة نطاقية <code>domain module</code> في فيكسور مستقلة تمامًا عن غيرها من النطاقات. لا يحق لأي نطاق الوصول مباشرة إلى الملفات الداخلية لنطاق آخر. يقتصر التواصل بين النطاقات على واجهات التصدير المحددة في ملف <code>index.ts</code> الرئيسي لكل نطاق. هذا العزل يضمن إمكانية تطوير أو استبدال أي نطاق دون التأثير على بقية النظام.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ الثاني: الاعتمادية الأحادية (Unidirectional Dependencies)</div>
</div>
<p class="body-text">
بُني رسم الاعتماديات بين النطاقات على شكل رسم بياني موجه غير دوري <strong>DAG</strong>، مما يعني أن التبعيات تسير في اتجاه واحد فقط ولا توجد حلقات معتمدة. هذا يضمن سهولة فهم تدفق البيانات ويمنع الاعتماديات الدائرية التي قد تؤدي إلى أخطاء يصعب تتبعها.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ الثالث: الخادم أولاً (Server-First Architecture)</div>
</div>
<p class="body-text">
جميع العمليات الحساسة — مثل الوصول إلى قاعدة البيانات، واستدعاء واجهات التداول <code>ccxt</code>، والاتصال بمقدمي الذكاء الاصطناعي — تُنفذ حصريًا على الخادم. لا يُسمح للعميل بالوصول المباشر إلى قاعدة البيانات أو الخدمات الخارجية. هذا يحمي بيانات الاعتمادات ويضمن أمان النظام.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ الرابع: الأمان الصفري (Zero Trust Security)</div>
</div>
<p class="body-text">
يُعامل كل طلب وارد كأنه غير موثوق، حتى لو صدر من مستخدم مُصادَق عليه. تُستخدم سياسات أمان الصفوف <code>RLS</code> في Supabase على جميع الجداول الـ27، ويُتحقق من صلاحيات كل عملية على حدة. لا يُعتمد على مصادقة العميل فقط لحماية البيانات.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ الخامس: النمطية القابلة للتجميع (Composable Modularity)</div>
</div>
<p class="body-text">
كل وحدة برمجية صُممت لتكون قابلة لإعادة الاستخدام والتركيب مع وحدات أخرى. يستخدم النظام نمط التصدير البرملي <code>barrel exports</code> في كل نطاق لتوفير واجهة نظيفة وموحدة. المكونات والهوكس والخدمات مصممة لتكون كتل بناء مستقلة يمكن تجميعها بمرونة.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ السادس: التسامح مع الأخطاء (Fault Tolerance)</div>
</div>
<p class="body-text">
يتبنى فيكسور نمط المرونة <code>Resilience Patterns</code> على مستوى الطبقة المشتركة، بما في ذلك قواطع الدوائر <code>Circuit Breakers</code>، ومحددات المعدل <code>Rate Limiters</code>، وذاكرة التخزين المؤقت <code>LRU Cache</code>. عند فشل مزود ذكاء اصطناعي، ينتقل النظام تلقائيًا إلى المزود التالي في سلسلة الاحتياط دون انقطاع الخدمة.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ السابع: قابلية التوسع الأفقي (Horizontal Scalability)</div>
</div>
<p class="body-text">
صُمم النظام ليتوسع أفقيًا عبر استضافة بدون خوادم <code>Serverless</code> باستخدام Nitro 3.0 مع إعداد Vercel. تعتمد حالة التطبيق على خدمات خارجية مثل Upstash Redis بدلًا من الذاكرة المحلية للخادم، مما يسمح بتشغيل نسخ متعددة من التطبيق دون تعارضات.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ الثامن: قابلية المراقبة (Observability)</div>
</div>
<p class="body-text">
كل عملية مهمة في النظام مُزودة بتتبع مُنظَّم عبر Sentry للأخطاء، وMixpanel لتحليلات الاستخدام، ونظام أحداث مُطَبَّق بدقة يضم أكثر من 20 حدثًا مُطَبَّقًا. يُسجل كل خطأ مع سياقه الكامل لتمكين التشخيص السريع وحل المشكلات.
</p>

<div class="subsection">
    <div class="subsection-title">المبدأ التاسع: الدعم ثنائي اللغة (Bilingual Support)</div>
</div>
<p class="body-text">
يدعم النظام العربية والإنجليزية بالكامل عبر نظام تدويل <code>i18n</code> مدمج في الطبقة المشتركة. جميع النصوص في واجهة المستخدم قابلة للترجمة، مع اتجاه تلقائي للصفحات حسب اللغة المختارة. يُحفظ اللغة كجزء من إعدادات المستخدم في قاعدة البيانات.
</p>

<div class="callout">
    <div class="callout-title">📌 ملاحظة مهمة</div>
    <div class="callout-body">هذه المبادئ التسعة تشكل الأساس الذي يُبنى عليه كل قرار هندسي في فيكسور. أي انتهاك لهذه المبادئ يتطلب موافقة كتابية من قائد الفريق التقني مع تبرير واضح للأسباب.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 02 — هيكل المجلدات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-02",
            "title": "هيكل المجلدات",
            "content": """
<p class="body-text">
يتبنى فيكسور هيكل مجلدات صارم مبني على مبدأ الطبقات والنطاقات. فهرس المشروع الرئيسي <code>src/</code> ينقسم إلى أربع طبقات رئيسية متتالية، كل طبقة بمسؤوليات محددة وواضحة. هذا الهيكل يضمن فصلًا واضحًا بين المسؤوليات ويجعل التنقل في المشروع سهلًا حتى للمطورين الجدد.
</p>

<div class="subsection">
    <div class="subsection-title">الطبقة المشتركة — shared/</div>
</div>
<p class="body-text">
تحتوي على 96 ملفًا تُشكّل البنية التحتية المشتركة بين جميع النطاقات. تشمل هذه الطبقة وظائف الوصول إلى البيانات، ومُوجّه نماذج اللغة الكبيرة، ونظام التدويل، ونظام الأحداث، وذاكرة التطبيق، وسجل الأدوات، وبيانات السوق، ونظام المرونة، والإشعارات، والتشفير. كل ملف هنا قابل للاستخدام من أي طبقة أعلى.
</p>

<div class="subsection">
    <div class="subsection-title">طبقة الميزات — features/</div>
</div>
<p class="body-text">
تحتوي على 22 وحدة نطاقية <code>domain module</code>، كل منها يمثل مجال أعمال محدد. تشمل: التحليل <code>analysis</code>، والمراجحة <code>arbitrage</code>، والاختبار الاسترجاعي <code>backtest</code>، والوسيط <code>broker</code>، وذكاء الرسوم البيانية <code>chart-intelligence</code>، وحقيقة الرسوم البيانية <code>chart-truth</code>، والرفيق الذكي <code>copilot</code>، والحلقة اليومية <code>daily-loop</code>، والمناظرة <code>debate</code>، والاكتشاف <code>discover</code>، واكتشاف العملات <code>discovery</code>، والتجارب <code>experiment</code>، والسوق <code>market</code>، وموكسي <code>moxi</code>، والملاحظات <code>notes</code>، والتداول الورقي <code>paper-trading</code>، وحاكم المخاطر <code>risk-governor</code>، وتتبع الإشارات <code>signal-tracking</code>، والاستراتيجيات <code>strategy</code>، والصفقات <code>trades</code>، والتداول <code>trading</code>، والمستخدم <code>user</code>، والمحفظة <code>wallet</code>، وقائمة المراقبة <code>watchlist</code>.
</p>

<div class="subsection">
    <div class="subsection-title">طبقة التطبيق — app/</div>
</div>
<p class="body-text">
تحتوي على جميع المسارات <code>routes</code> والتخطيطات <code>layouts</code> والصفحات <code>pages</code>. يضم هذا المجلد 44 مسارًا متنوعًا، بالإضافة إلى <code>AppShell</code> الذي يمثل الهيكل الرئيسي للتطبيق بواقع 1688 سطرًا برمجيًا، و<code>PageLayout</code> الذي يوفر التخطيط الموحد للصفحات بواقع 929 سطرًا. هذه الطبقة تجمع بين المكونات من طبقة الميزات وتُقدمها للمستخدم.
</p>

<div class="subsection">
    <div class="subsection-title">طبقة البنية التحتية — infrastructure/</div>
</div>
<p class="body-text">
تحتوي على 14 نقطة نهاية <code>API endpoints</code> عبر Nitro، وإدارة الاتصال بـ Supabase مع 27 جدول بيانات، وتهيئة Redis عبر Upstash، وإعداد نظام المراقبة عبر Sentry وMixpanel. تُعزل هذه الطبقة تمامًا عن طبقة الميزات لضمان إمكانية تبديل أي خدمة خارجية دون التأثير على منطق الأعمال.
</p>

<div class="code-block">src/
├── shared/                  # الطبقة المشتركة (96 ملف)
│   ├── data-access/         # وظائف الوصول إلى البيانات (26+ server fn)
│   ├── llm/                 # موجّه نماذج اللغة (4 مزودات)
│   ├── i18n/                # التدويل (en/ar)
│   ├── events/              # نظام الأحداث (20+ حدث مُطَبَّق)
│   ├── memory/              # ذاكرة التطبيق (PostgreSQL-backed)
│   ├── tool-registry/       # سجل الأدوات
│   ├── market-data/         # بيانات السوق (BinanceWS, DexScreenerWS)
│   ├── resilience/         # المرونة (circuit-breaker, rate-limiter, LRU)
│   ├── notifications/       # الإشعارات (email/telegram/webhook/in-app)
│   └── crypto/              # التشفير (credential encryption)
├── features/                # طبقة الميزات (22 نطاق)
│   ├── analysis/            # التحليل (24 ملف، SMC/ICT ~9,924 سطر)
│   ├── market/              # السوق (ورقة — الأكثر اعتمادًا)
│   ├── trading/             # التداول (15 ملف)
│   ├── wallet/              # المحفظة (16 ملف)
│   ├── copilot/             # الرفيق الذكي (13 ملف، متعدد الوكلاء)
│   ├── discovery/           # اكتشاف العملات (16 ملف)
│   └── ...                  # 16 نطاق إضافي
├── app/                     # طبقة التطبيق (44 مسار)
│   ├── AppShell.tsx         # الهيكل الرئيسي (1,688 سطر)
│   ├── PageLayout.tsx       # تخطيط الصفحات (929 سطر)
│   └── routes/              # المسارات والتخطيطات
└── infrastructure/          # طبقة البنية التحتية
    ├── api/                 # 14 نقطة نهاية Nitro
    ├── database/            # Supabase (27 جدول)
    └── integrations/        # Redis, Sentry, Mixpanel</div>

<div class="callout">
    <div class="callout-title">📁 قاعدة ذهبية للمجلدات</div>
    <div class="callout-body">لا يجوز لأي ملف في طبقة التطبيق استيراد ملف من طبقة البنية التحتية مباشرة. يجب أن تمر جميع الطلبات عبر طبقة الميزات أو الطبقة المشتركة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 03 — حدود النطاقات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-03",
            "title": "حدود النطاقات",
            "content": """
<p class="body-text">
يتألف نظام فيكسور من 22 وحدة نطاقية <code>domain module</code>، كل منها يمثل مجال أعمال مستقل بحدود واضحة ومحددة. العلاقة بين هذه النطاقات تُدار عبر رسم بياني موجه غير دوري <strong>DAG</strong>، مما يضمن عدم وجود اعتماديات دائرية ويجعل تدفق البيانات متنبئًا وسهل الفهم.
</p>

<div class="subsection">
    <div class="subsection-title">النطاقات الورقية مقابل النطاقات الجذرية</div>
</div>
<p class="body-text">
في الرسم البياني للاعتماديات، تُصنف النطاقات إلى نوعين: <strong>النطاقات الورقية</strong> <code>leaf domains</code> التي لا تعتمد عليها أي نطاقات أخرى، و<strong>النطاقات الجذرية</strong> <code>root domains</code> التي تعتمد عليها نطاقات متعددة. نطاق السوق <code>market</code> هو النطاق الورقي الأكثر اعتمادًا في النظام، حيث تُعتمد عليه نطاقات مثل التحليل والتداول والاكتشاف للحصول على بيانات الأسعار والأحجام.
</p>

<table class="vixor-table">
<thead>
<tr>
    <th>النطاق</th>
    <th>الوصف</th>
    <th>عدد الملفات</th>
    <th>الدور</th>
</tr>
</thead>
<tbody>
<tr><td><code>analysis</code></td><td>محرك التحليل الفني SMC/ICT</td><td>24</td><td>جذر</td></tr>
<tr><td><code>arbitrage</code></td><td>محرك المراجحة بين المنصات</td><td>27</td><td>جذر</td></tr>
<tr><td><code>backtest</code></td><td>اختبار الاستراتيجيات استرجاعيًا</td><td>9</td><td>جذر</td></tr>
<tr><td><code>broker</code></td><td>إدارة اتصال الوسيط</td><td>1</td><td>ورقة</td></tr>
<tr><td><code>chart-intelligence</code></td><td>تحليل الرسوم البيانية بالذكاء الاصطناعي</td><td>5</td><td>جذر</td></tr>
<tr><td><code>chart-truth</code></td><td>التحقق من دقة الرسوم البيانية</td><td>5</td><td>جذر</td></tr>
<tr><td><code>copilot</code></td><td>الرفيق الذكي متعدد الوكلاء</td><td>13</td><td>جذر</td></tr>
<tr><td><code>daily-loop</code></td><td>الحلقة اليومية للمهام المجدولة</td><td>3</td><td>جذر</td></tr>
<tr><td><code>debate</code></td><td>مناظرة خوارزمية بين الاستراتيجيات</td><td>7</td><td>جذر</td></tr>
<tr><td><code>discover</code></td><td>اكتشاف فرص جديدة</td><td>2</td><td>جذر</td></tr>
<tr><td><code>discovery</code></td><td>محرك اكتشاف العملات الميمية</td><td>16</td><td>جذر</td></tr>
<tr><td><code>experiment</code></td><td>إدارة التجارب والاختبارات</td><td>5</td><td>جذر</td></tr>
<tr><td><code>market</code></td><td>بيانات السوق والأسعار</td><td>7</td><td>ورقة ⭐</td></tr>
<tr><td><code>moxi</code></td><td>مساعد MOXI الذكي</td><td>8</td><td>جذر</td></tr>
<tr><td><code>notes</code></td><td>ملاحظات المتداول</td><td>3</td><td>جذر</td></tr>
<tr><td><code>paper-trading</code></td><td>التداول الورقي</td><td>4</td><td>جذر</td></tr>
<tr><td><code>risk-governor</code></td><td>حاكم المخاطر</td><td>4</td><td>جذر</td></tr>
<tr><td><code>signal-tracking</code></td><td>تتبع إشارات التداول</td><td>3</td><td>جذر</td></tr>
<tr><td><code>strategy</code></td><td>إدارة الاستراتيجيات</td><td>6</td><td>جذر</td></tr>
<tr><td><code>trades</code></td><td>سجل الصفقات</td><td>3</td><td>جذر</td></tr>
<tr><td><code>trading</code></td><td>تنفيذ عمليات التداول</td><td>15</td><td>جذر</td></tr>
<tr><td><code>user</code></td><td>إدارة المستخدمين</td><td>5</td><td>جذر</td></tr>
<tr><td><code>wallet</code></td><td>إدارة المحافظ الرقمية</td><td>16</td><td>جذر</td></tr>
<tr><td><code>watchlist</code></td><td>قائمة المراقبة</td><td>3</td><td>جذر</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">قواعد حدود النطاقات</div>
</div>
<ul class="vixor-list">
<li><strong>القاعدة 1:</strong> لا يُسمح لملف في نطاق ما باستيراد أي شيء من مجلد داخلي لنطاق آخر. الاستيراد فقط عبر ملف <code>index.ts</code> الرئيسي للنطاق المستهدف.</li>
<li><strong>القاعدة 2:</strong> لا يجوز لنطاقين من نفس المستوى في DAG الاستيراد من بعضهما البعض. يجب رفع الاعتماد المشترك إلى الطبقة المشتركة.</li>
<li><strong>القاعدة 3:</strong> عند الحاجة إلى بيانات من نطاق ورقي، يتم استهلاكها عبر هوك مخصص في النطاق الطالب، لا عبر استيراد مباشر لمكونات النطاق الورقي.</li>
<li><strong>القاعدة 4:</strong> يُحظر تمامًا إنشاء اعتماديات دائرية بين النطاقات. يتم فحص ذلك آليًا عبر أدوات تحليل الاعتماديات <code>dependency-cruiser</code>.</li>
</ul>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ تحذير</div>
    <div class="callout-body">أي محاولة لتجاوز قواعد حدود النطاقات ستُرفض في مراجعة الكود. استثناءات هذه القواعد تتطلب موافقة قائد الفريق التقني وإنشاء issue لتتبع الديون التقنية الناتجة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 04 — مسؤوليات الطبقات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-04",
            "title": "مسؤوليات الطبقات",
            "content": """
<p class="body-text">
يقسم فيكسور المشروع إلى أربع طبقات رئيسية، كل طبقة بمسؤوليات محددة وصارمة. هذا الفصل الواضح يضمن أن كل جزء من النظام يركز على مهمة واحدة فقط، مما يسهل الاختبار والصيانة والتوسع. فهم مسؤوليات كل طبقة هو الأساس للعمل بكفاءة في المشروع.
</p>

<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">الطبقة المشتركة — shared/</div>
        <div class="info-card-body">
            توفر البنية التحتية المشتركة لجميع الطبقات العليا. تضم وظائف الوصول إلى البيانات (26+ وظيفة خادم)، ومُوجّه نماذج اللغة الكبيرة مع 4 مزودات، ونظام التدويل ثنائي اللغة، ونظام الأحداث المُطَبَّق بدقة (20+ حدث)، وذاكرة التطبيق القائمة على PostgreSQL، وسجل الأدوات، وبيانات السوق الحية عبر BinanceWS وDexScreenerWS، ونظام المرونة، والإشعارات متعددة القنوات، وتشفير الاعتمادات. 96 ملفًا تشكل العمود الفقري للنظام.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">طبقة الميزات — features/</div>
        <div class="info-card-body">
            تضم منطق الأعمال لكل مجال من مجالات النظام. كل نطاق يحتوي على مكونات React، وهوكس مخصصة، وخدمات نطاقية، وأنواع TypeScript، وأختبارات وحدة. تضم 22 وحدة نطاقية تشمل محرك التحليل SMC/ICT بأكثر من 9,924 سطر، ومحرك المراجحة بـ27 ملفًا، ومحرك اكتشاف العملات بـ16 ملفًا، والرفيق الذكي متعدد الوكلاء بـ13 ملفًا.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">طبقة التطبيق — app/</div>
        <div class="info-card-body">
            المسؤولة عن تجميع المكونات من طبقة الميزات وتقديمها للمستخدم عبر 44 مسارًا. تحتوي على AppShell الرئيسي (1,688 سطر) الذي يُهيكل التطبيق بالكامل، وPageLayout (929 سطر) الذي يوفر التخطيط الموحد. هذه الطبقة لا تحتوي على أي منطق أعمال بل تستدعيه فقط من الطبقات السفلى.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">طبقة البنية التحتية — infrastructure/</div>
        <div class="info-card-body">
            تُعنى بإدارة الاتصالات الخارجية والخدمات الأساسية. تضم 14 نقطة نهاية API عبر Nitro 3.0، واتصال Supabase مع 27 جدول بيانات محمية بـ RLS، وUpstash Redis للتخزين المؤقت الموزع، وSentry لمراقبة الأخطاء، وMixpanel لتحليلات الاستخدام. تُعزل تمامًا عن منطق الأعمال.
        </div>
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">قاعدة التسلسل الطبقي</div>
</div>
<p class="body-text">
الاعتماديات تسير دائمًا من الأعلى إلى الأسفل: طبقة التطبيق ← طبقة الميزات ← الطبقة المشتركة ← طبقة البنية التحتية. لا يجوز لأي طبقة استيراد ملف من طبقة أعلى منها. طبقة البنية التحتية هي الأدنى ولا يمكنها الاعتماد على أي طبقة أخرى. الطبقة المشتركة مستقلة ولا تعتمد على طبقة الميزات أو التطبيق. هذا التسلسل يضمن بنية نظيفة وخالية من الاعتماديات المعقدة.
</p>

<div class="callout">
    <div class="callout-title">📌 استثناء مصرح به</div>
    <div class="callout-body">يُسمح لطبقة الميزات بالاستيراد مباشرة من الطبقة المشتركة دون المرور عبر طبقة التطبيق. هذا الاستثناء مقصود لتجنب تكرار الكود وتقليل التعقيد.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 05 — قواعد الاعتماديات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-05",
            "title": "قواعد الاعتماديات",
            "content": """
<p class="body-text">
نظام الاعتماديات في فيكسور صُمم ليكون صارمًا وواضحًا، مما يمنع تشكل الديون التقنية ويضمن بقاء المشروع صالحًا للعمل على المدى الطويل. يُدار هذا النظام عبر قواعد محددة تُفرض برمجيًا عبر أدوات تحليل ثابت للكود وتُتحقق في كل مراجعة كود <code>PR review</code>.
</p>

<div class="subsection">
    <div class="subsection-title">القاعدة الأولى: منع الاعتماديات الدائرية</div>
</div>
<p class="body-text">
يُحظر تمامًا إنشاء حلقات اعتمادية بين أي ملفين أو نطاقين في المشروع. يُستخدم أداة <code>dependency-cruiser</code> لفحص الرسم البياني للاعتماديات في كل build والتأكد من بقاءه على شكل DAG. أي دائرة اعتمادية جديدة تمنع الدمج تلقائيًا في الفرع الرئيسي وتتطلب إعادة هيكلة فورية.
</p>

<div class="subsection">
    <div class="subsection-title">القاعدة الثانية: فصل العميل والخادم</div>
</div>
<p class="body-text">
جميع المكتبات التي تعمل فقط على الخادم — مثل <code>ccxt</code> للتداول، ومكتبات إرسال البريد الإلكتروني، وأدوات التشفير المتقدمة — تُستورد فقط في ملفات تُنفذ على الخادم. يُستخدم شرط <code>server-only</code> لمنع حزم هذه المكتبات في بناء العميل. هذا يقلل حجم الحزمة المُرسلة للمتصفح ويحمي المفاتيح السرية من التسريب.
</p>

<div class="code-block">// ✅ صحيح: استيراد مشروط على الخادم
import { serverOnly } from 'vinxi/server-only';
const ccxt = serverOnly(() => require('ccxt'));

// ❌ خاطئ: استيراد ccxt في ملف عميل
import ccxt from 'ccxt'; // سيُرفض في مراجعة الكود</div>

<div class="subsection">
    <div class="subsection-title">القاعدة الثالثة: الاعتماد على واجهات التصدير فقط</div>
</div>
<p class="body-text">
عند حاجة نطاق إلى استخدام وظيفة من نطاق آخر أو من الطبقة المشتركة، يجب أن يستوردها فقط من ملف <code>index.ts</code> العام (التصدير البرملي) وليس من الملفات الداخلية. هذا يخلق طبقة تجريد تسمح بتغيير التطبيق الداخلي لنطاق ما دون التأثير على المستهلكين له.
</p>

<div class="subsection">
    <div class="subsection-title">القاعدة الرابعة: الأولوية للاعتماد على الطبقة المشتركة</div>
</div>
<p class="body-text">
عندما يحتاج نطاقان إلى نفس الوظيفة، يجب رفع هذه الوظيفة إلى الطبقة المشتركة بدلًا من جعل أحد النطاقين يعتمد على الآخر. هذا يقلل الاقتران بين النطاقات ويزيد من إمكانية إعادة الاستخدام. يُقيّم هذا القرار في مراجعة الكود مع التحقق من أن الوظيفة عامة بما يكفي لتكون في الطبقة المشتركة.
</p>

<div class="subsection">
    <div class="subsection-title">القاعدة الخامسة: الحد الأقصى لعمق الاعتماديات</div>
</div>
<p class="body-text">
لا يجوز أن يتجاوز عمق سلسلة الاعتماديات 4 مستويات. أي سلسلة أطول تشير إلى تصميم سيء وتتطلب إعادة هيكلة. على سبيل المثال، إذا كان مسار في طبقة التطبيق يستدعي مكونًا من طبقة الميزات، الذي يستدعي خدمة من نفس الطبقة، التي تستدعي وظيفة من الطبقة المشتركة، التي تستدعي خدمة من طبقة البنية التحتية — فهذا الحد الأقصى المسموح به.
</p>

<div class="callout callout-warn">
    <div class="callout-title">⚠ية أداء</div>
    <div class="callout-body">الاعتماديات الدائرية لا تؤثر فقط على قابلية الصيانة بل تسبب أيضًا مشاكل في أداء البناء <code>build performance</code>، حيث تمنع التحسين التلقائي <code>tree-shaking</code> من العمل بكفاءة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 06 — الطبقة المشتركة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-06",
            "title": "الطبقة المشتركة",
            "content": """
<p class="body-text">
الطبقة المشتركة <code>shared/</code> هي العمود الفقري لنظام فيكسور، وتضم 96 ملفًا توفر البنية التحتية المشتركة لجميع النطاقات والطبقات العليا. تُصمم هذه الطبقة لتكون مستقرة قدر الإمكان — التغييرات فيها تؤثر على النظام بأكمله، لذا تُخضع لاختبارات صارمة قبل أي تعديل.
</p>

<div class="subsection">
    <div class="subsection-title">الوصول إلى البيانات — data-access/</div>
</div>
<p class="body-text">
يحتوي هذا المجلد على أكثر من 26 وظيفة خادم <code>server function</code> تُعالج جميع عمليات القراءة والكتابة في قاعدة البيانات. كل وظيفة مُغلقة بنظام <code>RLS</code> الخاص بـ Supabase لضمان الأمان على مستوى الصفوف. تشمل هذه الوظائف عمليات الإدراج والتحديث والحذف والاستعلامات المعقدة، مع دعم الترقيم والتصفية والفرز. كل وظيفة تُغلف في ملف مستقل باسم وصفي يتبع نمط <code>get-xxx</code> أو <code>create-xxx</code> أو <code>update-xxx</code>.
</p>

<div class="subsection">
    <div class="subsection-title">مُوجّه نماذج اللغة الكبيرة — llm/</div>
</div>
<p class="body-text">
يدير هذا المكون الاتصال بمقدمي الذكاء الاصطناعي الأربعة: <code>zai</code> كمزود أساسي، ثم <code>anthropic</code> و<code>groq</code> و<code>openai</code> كسلسلة احتياط. يعمل المُوجّه على التبديل التلقائي بين المزودين عند فشل أي منهم، مع تتبع الاستهلاك والحدود المالية لكل مزود. يدعم المُوجّه أنواعًا مختلفة من المهام: توليد النصوص، وتحليل البيانات، والاستجابة للمحادثات.
</p>

<div class="subsection">
    <div class="subsection-title">نظام التدويل — i18n/</div>
</div>
<p class="body-text">
يدعم اللغتين العربية والإنجليزية بالكامل. يتضمن ملفات الترجمة لكل لغة، ومزود سياق React لإدارة اللغة الحالية، وخطاف مخصص <code>useTranslation</code> لاستخدام الترجمات في المكونات. يتحكم تلقائيًا في اتجاه الصفحة <code>direction</code> والخطوط والتنسيقات حسب اللغة المختارة. تُحفظ اللغة المفضلة للمستخدم في قاعدة البيانات وتُستعاد تلقائيًا عند تسجيل الدخول.
</p>

<div class="subsection">
    <div class="subsection-title">نظام الأحداث — events/</div>
</div>
<p class="body-text">
نظام أحداث مُطَبَّق بدقة يضم أكثر من 20 حدثًا مُعرَّفًا. كل حدث له اسم فريد ونوع TypeScript محدد يدقيق يصف بياناته. يستخدم <code>EventOrchestrator</code> لنشر الأحداث والاشتراك فيها عبر أجزاء النظام المختلفة. من الأمثلة على الأحداث: اكتمال تحليل، وتنفيذ صفقة، وتحديث بيانات السوق، وتلقي إشعار. يضمن النظام أن كل حدث يُعالج بالترتيب الصحيح وبالتزامن عند الحاجة.
</p>

<div class="subsection">
    <div class="subsection-title">ذاكرة التطبيق — memory/</div>
</div>
<p class="body-text">
نظام ذاكرة قائم على PostgreSQL يُستخدم لحفظ جلسات المحادثة مع الرفيق الذكي وتاريخ تفاعلات المستخدم مع النظام. يدعم تخزين واسترجاع البيانات المهيكلة مع تحديد صلاحية زمنية للبيانات المؤقتة. تُكتب جميع عمليات الذاكرة عبر وظائف الوصول إلى البيانات في <code>data-access/</code>.
</p>

<div class="subsection">
    <div class="subsection-title">سجل الأدوات — tool-registry/</div>
</div>
<p class="body-text">
يُسجل جميع الأدوات المتاحة لمُوجّه الذكاء الاصطناعي. كل أداة لها اسم وتوصيف ونوع مدخلات ومخرجات محدد بدقة. يُستخدم هذا السجل من قبل الرفيق الذكي <code>copilot</code> ومساعد <code>MOXI</code> لاتخاذ قرارات حول الأدوات المناسبة لكل طلب. يدعم إضافة أدوات جديدة ديناميكيًا دون تعديل الكود الأساسي.
</p>

<div class="subsection">
    <div class="subsection-title">بيانات السوق — market-data/</div>
</div>
<p class="body-text">
يوفر بيانات السوق الحية عبر اتصالين WebSocket مستمرين: <code>BinanceWS</code> لبيانات العملات الرئيسية، و<code>DexScreenerWS</code> لبيانات العملات الميمية على شبكة سولانا. يتضمن نظام إعادة اتصال تلقائي عند انقطاع الاتصال، وتخزين مؤقت للبيانات الأخيرة لتقليل عدد الطلبات، وتطبيع للبيانات القادمة من مصادر مختلفة لتنسيق موحد.
</p>

<div class="subsection">
    <div class="subsection-title">نظام المرونة — resilience/</div>
</div>
<p class="body-text">
يضم ثلاثة أنماط أساسية: قاطع الدائرة <code>Circuit Breaker</code> يوقف الطلبات إلى خدمة فاشلة بعد عدد محدد من المحاولات، ومحدد المعدل <code>Rate Limiter</code> يتحكم في عدد الطلبات المُرسلة لكل خدمة، وذاكرة LRU <code>Least Recently Used Cache</code> تحتفظ بأحدث البيانات وتتجاهل الأقدم تلقائيًا. تعمل هذه الأنماط معًا لحماية النظام من التحميل الزائد وفشل الخدمات الخارجية.
</p>

<div class="subsection">
    <div class="subsection-title">الإشعارات — notifications/</div>
</div>
<p class="body-text">
نظام إشعارات متعدد القنوات يدعم: البريد الإلكتروني، ورسائل Telegram، وWebhooks المخصصة، والإشعارات داخل التطبيق. يوفر واجهة موحدة لإرسال الإشعارات عبر أي قناة، مع إمكانية تحديد أولوية كل إشعار وقنوات التسليم المفضلة للمستخدم. يُسجل كل إشعار مُرسل مع حالته في قاعدة البيانات.
</p>

<div class="subsection">
    <div class="subsection-title">التشفير — crypto/</div>
</div>
<p class="body-text">
يُوفر وظائف تشفير وفك تشفير للاعتمادات الحساسة مثل مفاتيح API الخاصة بالتداول. يُستخدم التشفير المتماثل <code>AES-256</code> مع مفاتيح مُدارة بشكل آمن. لا تُخزن أي بيانات حساسة كنص صريح في قاعدة البيانات. كل عملية تشفير تُسجل في سجل التدقيق لمتابعة من يصل إلى البيانات الحساسة ومتى.
</p>

<div class="callout">
    <div class="callout-title">📌 ملاحظة لل مطورين</div>
    <div class="callout-body">عند إضافة ملف جديد إلى الطبقة المشتركة، تأكد من إضافته إلى ملف التصدير البرملي المناسب ووثّقه في هذا الكتاب. تغييرات الطبقة المشتركة تتطلب مراجعة من مطورين اثنين على الأقل.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 07 — طبقة الميزات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-07",
            "title": "طبقة الميزات",
            "content": """
<p class="body-text">
طبقة الميزات <code>features/</code> هي المكان الذي يعيش فيه منطق الأعمال لنظام فيكسور. كل وحدة نطاقية في هذه الطبقة تُمثل مجال أعمال مستقل بتنظيم داخلي متسق. هذه الطبقة تضم 22 نطاقًا بإجمالي مئات الملفات التي تشكل قلب النظام التشغيلي.
</p>

<div class="subsection">
    <div class="subsection-title">البنية الداخلية لكل نطاق</div>
</div>
<p class="body-text">
يتبع كل نطاق نمطًا داخليًا موحدًا يسهل الانتقال بين النطاقات المختلفة. كل نطاق يحتوي عادةً على المجلدات التالية: <code>components/</code> للمكونات المرئية الخاصة بالنطاق، و<code>hooks/</code> للهوكس المخصصة التي تُغلف منطق النطاق، و<code>services/</code> لخدمات النطاق التي تتصل بالخادم والخدمات الخارجية، و<code>types/</code> لأنواع TypeScript الخاصة بالنطاق، و<code>utils/</code> للوظائف المساعدة الداخلية، و<code>index.ts</code> كملف تصدير برملي.
</p>

<div class="subsection">
    <div class="subsection-title">النطاقات الرئيسية وتفاصيلها</div>
</div>

<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">analysis — التحليل</div>
        <div class="info-card-body">
            أكبر نطاق في النظام بأكثر من 24 ملفًا و9,924 سطرًا برمجيًا. يضم محرك التحليل الفني المبني على منهجية SMC/ICT. يشمل كشف مناطق السيولة، وتحليل هيكل السوق، وتحديد أوامر الصناعي، وتحليل نقاط الفشل، وتحليل أنماط الشموع. يعمل هذا المحرك على بيانات OHLCV في الوقت الفعلي.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">arbitrage — المراجحة</div>
        <div class="info-card-body">
            ثاني أكبر نطاق بـ27 ملفًا. يفحص فرق الأسعار بين المنصات المختلفة ويحسب فرص المراجحة المحتملة مع احتساب رسوم الغاز والانزلاق السعري. يدعم المراجحة بين DEXs وCEXs مع مراقبة مستمرة للفرص.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">discovery — اكتشاف العملات</div>
        <div class="info-card-body">
            محرك اكتشاف متقدم بـ16 ملفًا. يفحص السوق باستمرار للعثور على عملات ميمية جديدة وواعدة على شبكة سولانا. يستخدم مؤشرات متعددة مثل حجم التداول الأولي، وعدد حاملي المحافظ، ونشاط المطورين، وبيانات الشبكة الاجتماعية.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">copilot — الرفيق الذكي</div>
        <div class="info-card-body">
            نظام متعدد الوكلاء بـ13 ملفًا. يتكون من وكلاء متخصصين: وكيل التحليل، ووكيل التداول، ووكيل المخاطر. ينسقون معًا لتقديم توصيات شاملة مدعومة بالبيانات. يستخدم نظام الذاكرة المشترك لتتبع سياق المحادثة.
        </div>
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">نطاقات الدعم والتشغيل</div>
</div>
<p class="body-text">
بالإضافة إلى النطاقات الرئيسية، يضم النظام نطاقات دعم أساسية: <code>wallet</code> (16 ملفًا) لإدارة محافظ Web3 مع دعم شبكة سولانا، و<code>trading</code> (15 ملفًا) لتنفيذ الصفقات وإدارتها، و<code>chart-intelligence</code> و<code>chart-truth</code> (5 ملفات لكل منهما) لتحليل والتحقق من الرسوم البيانية بالذكاء الاصطناعي، و<code>risk-governor</code> (4 ملفات) لحساب وإدارة المخاطر، و<code>paper-trading</code> (4 ملفات) للتداول التجريبي بدون مخاطر مالية حقيقية.
</p>

<div class="subsection">
    <div class="subsection-title">نطاقات مساعدة</div>
</div>
<p class="body-text">
تشمل النطاقات المساعدة: <code>backtest</code> (9 ملفات) لاختبار الاستراتيجيات على بيانات تاريخية، و<code>debate</code> (7 ملفات) للمناظرة الخوارزمية بين استراتيجيات مختلفة، و<code>moxi</code> (8 ملفات) لمساعد MOXI الذكي المخصص، و<code>strategy</code> (6 ملفات) لإدارة الاستراتيجيات، و<code>experiment</code> (5 ملفات) لإدارة التجارب، و<code>user</code> (5 ملفات) لإدارة ملفات المستخدمين، ونطاقات أصغر مثل <code>notes</code>، <code>watchlist</code>، <code>signal-tracking</code>، <code>trades</code>، <code>discover</code>، <code>daily-loop</code>، و<code>broker</code>.
</p>

<div class="callout">
    <div class="callout-title">📐 قاعدة التوحيد</div>
    <div class="callout-body">كل نطاق جديد يجب أن يتبع نفس البنية الداخلية الموحدة، حتى لو كان يحتوي على ملف واحد فقط. هذا الاتساق يُسهل انتقال المطورين بين النطاقات ويُقلل وقت الإعداد.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 08 — طبقة التطبيق
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-08",
            "title": "طبقة التطبيق",
            "content": """
<p class="body-text">
طبقة التطبيق <code>app/</code> هي نقطة التلاقي بين المستخدم وبقية النظام. تُمسك هذه الطبقة بجميع المسارات <code>routes</code> والتخطيطات <code>layouts</code> والصفحات <code>pages</code>، وتعمل على تجميع المكونات من طبقة الميزات وتقديمها في واجهة مستخدم متماسكة ومنظمة.
</p>

<div class="subsection">
    <div class="subsection-title">AppShell — الهيكل الرئيسي للتطبيق</div>
</div>
<p class="body-text">
يمثل <code>AppShell.tsx</code> الهيكل الخارجي للتطبيق بأكمله، وهو ملف ضخم يضم 1,688 سطرًا برمجيًا. يتضمن شريط التنقل العلوي، والشريط الجانبي القابل للطي، ومنطقة المحتوى الرئيسية، والشريط السفلي، ونظام الإشعارات المركزي، ولوحة التحكم في المزودات. يدير AppShell أيضًا حالة التطبيق العامة مثل حالة الاتصال والوضع الحالي للواجهة. يُنفذ AppShell مرة واحدة فقط ويُغلف جميع المسارات داخله، مما يضمن تجربة مستخدم متسقة عبر جميع الصفحات.
</p>

<div class="subsection">
    <div class="subsection-title">PageLayout — تخطيط الصفحات</div>
</div>
<p class="body-text">
يوفر <code>PageLayout.tsx</code> تخطيطًا موحدًا لجميع الصفحات الداخلية بواقع 929 سطرًا برمجيًا. يحدد هذا المكون رأس الصفحة مع عنوانها وأزرار الإجراءات، ومنطقة المحتوى الرئيسية مع أنماط التمرير الموحدة، وشريط الأدوات السفلي عند الحاجة. يدعم أنماطًا مختلفة من التخطيطات: التخطيط الكامل، والتخطيط مع شريط جانبي، والتخطيط المقسم. كل صفحة جديدة يجب أن تستخدم PageLayout لضمان التناسق البصري.
</p>

<div class="subsection">
    <div class="subsection-title">نظام المسارات</div>
</div>
<p class="body-text">
يتضمن النظام 44 مسارًا يُغطي جميع وظائف التطبيق. يُدار نظام المسارات عبر TanStack Start الذي يوفر تحميلًا كسولًا تلقائيًا لكل صفحة، وتقسيم الكود على مستوى المسار، ومعالجة مسبقة للبيانات <code>data loaders</code>. كل مسار مرتبط بنطاق واحد رئيسي في طبقة الميزات، مع إمكانية استهلاك مكونات من نطاقات أخرى عند الحاجة. تُنظم المسارات في مجموعات منطقية: مسارات التحليل، ومسارات التداول، ومسارات المحفظة، ومسارات الإعدادات.
</p>

<div class="subsection">
    <div class="subsection-title">التحميل المسبق للبيانات</div>
</div>
<p class="body-text">
كل صفحة ذات محتوى ديناميكي تستخدم محمل بيانات <code>data loader</code> يُنفذ على الخادم قبل عرض الصفحة. هذا يضمن توفر البيانات عند التحميل الأول ويقلل من حالة التحميل على العميل. محملات البيانات تستخدم وظائف الوصول إلى البيانات من الطبقة المشتركة وتُنفذ ضمن سياق الخادم فقط.
</p>

<div class="callout">
    <div class="callout-title">📌 قاعدة طبقة التطبيق</div>
    <div class="callout-body">لا يجوز لكتابة أي منطق أعمال في طبقة التطبيق. إذا اكتشفت حاجة لمنطق معالجة بيانات معقد، يجب نقله إلى خدمة في طبقة الميزات أو الطبقة المشتركة. طبقة التطبيق هي مجرد "غراء" يربط المكونات معًا.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 09 — طبقة البنية التحتية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-09",
            "title": "طبقة البنية التحتية",
            "content": """
<p class="body-text">
طبقة البنية التحتية <code>infrastructure/</code> تُعنى بجميع الاتصالات الخارجية والخدمات الأساسية التي يعتمد عليها النظام. تُصمم هذه الطبقة لتكون قابلة للاستبدال — يمكن تبديل أي خدمة خارجية بخدمة بديلة دون التأثير على منطق الأعمال في الطبقات العليا.
</p>

<div class="subsection">
    <div class="subsection-title">نقاط نهاية API عبر Nitro 3.0</div>
</div>
<p class="body-text">
يتضمن النظام 14 نقطة نهاية <code>API endpoint</code> مُنفذة عبر Nitro 3.0 مع إعداد Vercel. تتعامل هذه النقاط مع: عمليات التداول عبر <code>ccxt</code>، والتحقق من صحة البيانات، ووظائف إدارة المستخدمين، وعمليات الويب هوك للخدمات الخارجية. يُنفذ كل endpoint كمعالج مستقل <code>handler</code> يتبع نمط REST مع تحقق من المدخلات وإرجاع استجابات موحدة. يتم تجميع <code>ccxt</code> كخادم فقط <code>server-only</code> لتقليل حجم حزمة العميل.
</p>

<div class="subsection">
    <div class="subsection-title">قاعدة بيانات Supabase</div>
</div>
<p class="body-text">
يستخدم النظام Supabase كقاعدة بيانات رئيسية مع 27 جدول بيانات مُنظمة حسب النطاقات. كل جدول محمي بنظام أمان الصفوف <code>Row Level Security — RLS</code> الذي يضمن أن كل مستخدم يمكنه الوصول فقط إلى بياناته الخاصة. الجداول تشمل: بيانات المستخدمين، وإعدادات التطبيق، وسجل الصفقات، وتحليلات السوق، وجلسات المحادثة مع الذكاء الاصطناعي، وإعدادات المحافظ، والإشعارات، وسجل التدقيق.
</p>

<div class="subsection">
    <div class="subsection-title">Upstash Redis</div>
</div>
<p class="body-text">
يُستخدم Redis عبر Upstash لتخزين البيانات المؤقتة الموزعة والجلسات المؤقتة ونتائج التحليلات الحديثة. يُفصل Redis تمامًا عن الذاكرة المحلية للخادم، مما يسمح للنظام بالعمل على عدة نسخ بدون تعارضات. يُستخدم أيضًا لمخزن المعدل <code>rate limiter</code> الموزع ومنع الطلبات المتكررة.
</p>

<div class="subsection">
    <div class="subsection-title">Sentry لمراقبة الأخطاء</div>
</div>
<p class="body-text">
يُرسل جميع الأخطاء التي تحدث على الخادم والعميل إلى Sentry للمراقبة المركزية. يُضاف سياق إضافي لكل خطأ يشمل: معرف المستخدم، والنطاق الذي حدث فيه الخطأ، ومعاملات الطلب، وتتبع المكدس الكامل. تُنشئ Sentry تلقائيًا إشعارات عند اكتشاف أنماط جديدة من الأخطاء أو زيادة معدل الأخطاء.
</p>

<div class="subsection">
    <div class="subsection-title">Mixpanel لتحليلات الاستخدام</div>
</div>
<p class="body-text">
يتتبع Mixpanel جميع تفاعلات المستخدمين المهمة لتحليل أنماط الاستخدام وقياس أداء الميزات. يُرسل كل حدث مع خصائص غنية تشمل: نوع الجهاز واللغة المفضلة والوقت المنقضي منذ آخر تسجيل دخول والنطاق النشط. لا تُرسل أي بيانات شخصية أو مالية إلى Mixpanel، فقط بيانات الاستخدام المجهولة.
</p>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ قاعدة الأمان</div>
    <div class="callout-body">جميع مفاتيح API وأسرار الخدمات الخارجية تُخزن في متغيرات البيئة <code>environment variables</code> فقط. لا يُسمح بتخزين أي مفتاح سري في الكود المصدري أو في ملفات الإعدادات.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 10 — اتفاقيات التسمية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-10",
            "title": "اتفاقيات التسمية",
            "content": """
<p class="body-text">
اتفاقيات التسمية المتسقة تُسهل قراءة الكود والتنقل فيه، وتُقلل الأخطاء الناتجة عن التسمية المربكة. يتبع فيكسور مجموعة صارمة من القواعد في تسمية المجلدات والملفات والعناصر البرمجية المختلفة. الالتزام بهذه الاتفاقيات إلزامي لجميع المطورين.
</p>

<div class="subsection">
    <div class="subsection-title">تسمية المجلدات</div>
</div>
<ul class="vixor-list">
<li><strong>النطاقات:</strong> تُسمى بأحرف صغيرة مفصولة بشرطة <code>kebab-case</code>: <code>chart-intelligence</code>، <code>paper-trading</code>، <code>risk-governor</code>، <code>signal-tracking</code>.</li>
<li><strong>المجلدات الفرعية:</strong> تُسمى بأحرف صغيرة بدون فواصل: <code>components</code>، <code>hooks</code>، <code>services</code>، <code>types</code>، <code>utils</code>.</li>
<li><strong>مجلدات البنية التحتية:</strong> تتبع <code>kebab-case</code>: <code>market-data</code>، <code>tool-registry</code>، <code>data-access</code>.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">تسمية الملفات</div>
</div>
<ul class="vixor-list">
<li><strong>مكونات React:</strong> تُسمى بنمط <code>PascalCase.tsx</code>: <code>TradingPanel.tsx</code>، <code>MarketOverview.tsx</code>، <code>WalletConnect.tsx</code>.</li>
<li><strong>الهوكس المخصصة:</strong> تبدأ بـ <code>use</code> متبوعًا باسم وصفي <code>camelCase.ts</code>: <code>useMarketData.ts</code>، <code>useTrading.ts</code>، <code>useAuth.ts</code>.</li>
<li><strong>الخدمات:</strong> تُسمى <code>camelCase.ts</code> مع لاحقة <code>service</code> عند الحاجة: <code>marketService.ts</code>، <code>analysisService.ts</code>.</li>
<li><strong>الأنواع:</strong> تُسمى <code>PascalCase.types.ts</code> أو <code>camelCase.types.ts</code>: <code>Trade.types.ts</code>، <code>market.types.ts</code>.</li>
<li><strong>ملفات التصدير:</strong> دائمًا <code>index.ts</code> في كل مجلد نطاق.</li>
<li><strong>وظائف الخادم:</strong> تتبع نمط الفعل-الاسم: <code>getMarketData.ts</code>، <code>createTrade.ts</code>، <code>updateUserSettings.ts</code>.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">تسمية العناصر البرمجية</div>
</div>
<ul class="vixor-list">
<li><strong>المكونات:</strong> <code>PascalCase</code>: <code>function TradingPanel() {}</code></li>
<li><strong>الهوكس:</strong> <code>camelCase</code> يبدأ بـ <code>use</code>: <code>function useMarketData() {}</code></li>
<li><strong>الثوابت:</strong> <code>UPPER_SNAKE_CASE</code>: <code>MAX_RETRY_ATTEMPTS</code>، <code>DEFAULT_STALE_TIME</code></li>
<li><strong>الواجهات والأنواع:</strong> <code>PascalCase</code>: <code>interface MarketData {}</code>، <code>type TradeStatus = ...</code></li>
<li><strong>الدوال العادية:</strong> <code>camelCase</code>: <code>calculateRisk()</code>، <code>formatPrice()</code></li>
<li><strong>الأحداث:</strong> <code>UPPER_SNAKE_CASE</code> مع بادئة <code>EVENT_</code>: <code>EVENT_TRADE_EXECUTED</code>، <code>EVENT_MARKET_UPDATED</code></li>
<li><strong>المتغيرات الخاصة:</strong> تبدأ بـ <code>_</code>: <code>_internalCache</code>، <code>_pendingRequests</code></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تسمية الاختبارات</div>
</div>
<ul class="vixor-list">
<li><strong>ملفات الاختبارات:</strong> <code>[اسم-الملف].test.ts</code>: <code>marketService.test.ts</code></li>
<li><strong>كتل الاختبار:</strong> تُسمى <code>describe()</code> بما يصف المكون/الدالة المُختبرة</li>
<li><strong>الحالات الفردية:</strong> تُسمى <code>it()</code> بصيغة الجملة الواضحة: <code>it('should return empty array when no trades exist')</code></li>
</ul>

<div class="callout">
    <div class="callout-title">📋 ملاحظة</div>
    <div class="callout-body">تُفحص اتفاقيات التسمية تلقائيًا عبر قواعد ESLint المخصصة. أي مخالفة تُظهر تحذيرًا في بيئة التطوير وتمنع الدمج في مراجعة الكود.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 11 — تنظيم الكود
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-11",
            "title": "تنظيم الكود",
            "content": """
<p class="body-text">
تنظيم الكود الجيد يُسهل الصيانة ويُسرّع عملية التطوير. يتبع فيكسور مجموعة من الأنماط المتفق عليها لتنظيم الملفات والكود داخليًا، بما في ذلك أنماط التصدير البرملي، والترتيب المنطقي للاستيرادات، وتنظيم المكونات والهوكس والخدمات.
</p>

<div class="subsection">
    <div class="subsection-title">التصدير البرملي — Barrel Exports</div>
</div>
<p class="body-text">
كل نطاق ومجلد مشترك يُنهي بملف <code>index.ts</code> يُصدّر جميع الواجهات العامة. هذا يُبسط عمليات الاستيراد ويُخفي التفاصيل الداخلية للمستهلكين. يتم ترتيب التصديرات في <code>index.ts</code> بالترتيب التالي: الأنواع والواجهات أولًا، ثم الثوابت، ثم الهوكس، ثم المكونات، ثم الخدمات.
</p>

<div class="code-block">// features/market/index.ts — مثال على التصدير البرملي

// الأنواع
export type { MarketData, MarketStats, TickerInfo };

// الثوابت
export { DEFAULT_PAIRS, MARKET_REFRESH_INTERVAL };

// الهوكس
export { useMarketData, useMarketStats, useTicker };

// المكونات
export { MarketOverview, MarketChart, TickerBar };

// الخدمات
export { marketService };</div>

<div class="subsection">
    <div class="subsection-title">ترتيب الاستيرادات</div>
</div>
<p class="body-text">
يُرتّب قسم الاستيرادات في كل ملف وفق ترتيب محدد صارم. يبدأ بمكتبات React والنظام، ثم مكتبات الطرف الثالث، ثم الاستيرادات من المشروع (الطبقة المشتركة أولًا، ثم النطاقات الأخرى، ثم الملفات المحلية). تُفصل كل مجموعة بسطر فارغ. تُضاف تعليقات توضيحية اختيارية للاستيرادات المعقدة.
</p>

<div class="subsection">
    <div class="subsection-title">تنظيم المكونات</div>
</div>
<p class="body-text">
كل مكون React يتبع الهيكل التالي: تعريف الأنواع أولاً، ثم تعريف المكون كدالة أساسية، ثم المكونات الفرعية إن وُجدت، ثم أنماط CSS إن لزم. يُفصل منطق المكون المعقد إلى هوكس مخصصة تُعرَّف في نفس مجلد النطاق. لا يُسمح بتعريف أكثر من مكون رئيسي واحد في الملف نفسه.
</p>

<div class="subsection">
    <div class="subsection-title">تنظيم الخدمات</div>
</div>
<p class="body-text">
تُنظم الخدمات ككائنات تحتوي على وظائف مرتبطة منطقيًا. كل خدمة تتبع نمطًا موحدًا: تعريف الأنواع، ثم ثوابت الخدمة (مثل عناوين URL)، ثم الوظائف الرئيسية، ثم الوظائف المساعدة. كل وظيفة في الخدمة مسؤولة عن مهمة واحدة فقط وتُوثق بتعليق JSDoc يصف مدخلاتها ومخرجاتها وسلوكها.
</p>

<div class="subsection">
    <div class="subsection-title">تنظيم الهوكس</div>
</div>
<p class="body-text">
كل هوك مخصص يُعرَّف في ملف مستقل داخل مجلد <code>hooks/</code> للنطاق. يبدأ الملف بتعليق JSDoc يصف الغرض من الهوكس وحالات الاستخدام، ثم تعريف الأنواع المرتبطة، ثم دالة الهوكس نفسها. الهوكس المعقدة التي تحتاج إلى حالة داخلية تستخدم <code>useReducer</code> بدلًا من عدة <code>useState</code> لمنع إعادة التصيير المتكررة.
</p>

<div class="callout">
    <div class="callout-title">📐 أفضل ممارسة</div>
    <div class="callout-body">إذا تجاوز ملف ما 200 سطرًا، فكر في تقسيمه. الملفات الكبيرة تُصعب المراجعة وتزيد احتمالية حدوث تعارضات عند العمل الجماعي. الاستثناء الوحيد هو ملفات التخطيط الرئيسية مثل AppShell.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 12 — قواعد إدارة الحالة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-12",
            "title": "قواعد إدارة الحالة",
            "content": """
<p class="body-text">
يستخدم فيكسور أربع آليات مختلفة لإدارة الحالة، كل واحدة مخصصة لنوع معين من البيانات. فهم متى تستخدم كل آلية هو أمر بالغ الأهمية لكتابة كود نظيف وفعال. استخدام الآلية الخاطئة لحالة معينة يُسبب مشاكل في الأداء وسلوكيات غير متوقعة.
</p>

<div class="subsection">
    <div class="subsection-title">TanStack Query — حالة الخادم</div>
</div>
<p class="body-text">
تُستخدم TanStack Query لجميع البيانات القادمة من الخادم. يُعيَّن <code>staleTime</code> بقيمة 30 ثانية افتراضيًا، مما يعني أن البيانات تُعتبر طازجة لمدة 30 ثانية قبل أن تُعاد طلبها. تُستخدم مفاتيح الاستعلام <code>query keys</code> المُنسقة وفق نمط محدد: <code>[نطاق، نوع، مُعرّف]</code>. على سبيل المثال: <code>['market', 'ticker', 'SOL-USDT']</code>. يوفر TanStack Query تلقائيًا حالات التحميل والخطأ وإعادة المحاولة والتخزين المؤقت.
</p>

<div class="subsection">
    <div class="subsection-title">Zustand — المؤشرات والمقاييس</div>
</div>
<p class="body-text">
يُستخدم Zustand لإدارة المقاييس <code>metrics</code> ومؤشرات الأداء الحية مثل أسعار العملات في الوقت الفعلي وأحجام التداول. تتميز مخازن Zustand بخفة الوزن وعدم إعادة التصيير التلقائي عند عدم الحاجة. كل مخزن Zustand مُعرَّف في ملف مستقل بلاحقة <code>.store.ts</code> ويُصدَّر عبر التصدير البرملي للنطاق.
</p>

<div class="subsection">
    <div class="subsection-title">React Context — الحالة المشتركة</div>
</div>
<p class="body-text">
يُستخدم React Context لحالة التطبيق العميقة التي يحتاجها عدة مكونات في مستويات مختلفة من شجرة المكونات. يستخدم حاليًا لسياق التدويل <code>i18n</code> وسياق المحفظة <code>wallet</code>. يُنصح بعدم إنشاء سياقات جديدة إلا عند الحاجة الفعلية، لأن كل سياق يضيف طبقة إعادة تصيير إضافية عند تغير قيمته.
</p>

<div class="subsection">
    <div class="subsection-title">EventOrchestrator — حالة الأحداث</div>
</div>
<p class="body-text">
يُستخدم <code>EventOrchestrator</code> كناقل أحداث مُطَبَّق بدقة لنشر الأحداث والاشتراك فيها بين النطاقات المختلفة. على عكس قناة البث <code>broadcast channel</code> العامة، يُطَبَّق كل حدث بنوع TypeScript محدد، مما يضمن سلامة البيانات المُرسلة والمستقبلة. الأحداث مُفصلة عن حالة المكونات وتعمل بشكل غير متزامن.
</p>

<table class="vixor-table">
<thead>
<tr>
    <th>الآلية</th>
    <th>نوع الحالة</th>
    <th>مثال</th>
    <th>ملاحظات</th>
</tr>
</thead>
<tbody>
<tr><td><code>TanStack Query</code></td><td>بيانات الخادم</td><td>بيانات المستخدم، الصفقات</td><td>staleTime: 30 ثانية</td></tr>
<tr><td><code>Zustand</code></td><td>مؤشرات حية</td><td>أسعار الوقت الفعلي</td><td>تحديثات متكررة</td></tr>
<tr><td><code>React Context</code></td><td>حالة عميقة مشتركة</td><td>اللغة، المحفظة</td><td>تقليل عدد السياقات</td></tr>
<tr><td><code>EventOrchestrator</code></td><td>أحداث بين النطاقات</td><td>تنفيذ صفقة</td><td>أنواع مُطَبَّقة</td></tr>
</tbody>
</table>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ قاعدة ذهبية</div>
    <div class="callout-body">لا تُخزن بيانات الخادم في Zustand أو React Context. استخدم دائمًا TanStack Query لبيانات الخادم. البيانات المتكررة والسريعة مثل الأسعار فقط هي التي تذهب إلى Zustand.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 13 — معايير واجهات البرمجة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-13",
            "title": "معايير واجهات البرمجة",
            "content": """
<p class="body-text">
تُدار جميع نقاط نهاية API في فيكسور عبر Nitro 3.0 الذي يعمل كخادم تطبيقات عالي الأداء. تتبع هذه النقاط معايير REST صارمة مع تحقق من المدخلات واستجابات موحدة، مما يضمن تجربة متسقة لجميع المستهلكين سواء كانوا مكونات React أو تطبيقات خارجية.
</p>

<div class="subsection">
    <div class="subsection-title">اصطلاحات REST</div>
</div>
<ul class="vixor-list">
<li><strong>GET</strong> — لجلب البيانات: <code>/api/market/tickers</code>، <code>/api/trades?page=1&limit=20</code></li>
<li><strong>POST</strong> — لإنشاء موارد جديدة: <code>/api/trades/execute</code>، <code>/api/analysis/start</code></li>
<li><strong>PUT</strong> — لتحديث الموارد بالكامل: <code>/api/user/settings</code></li>
<li><strong>PATCH</strong> — لتحديث جزئي: <code>/api/wallet/preferences</code></li>
<li><strong>DELETE</strong> — لحذف الموارد: <code>/api/notifications/:id</code></li>
</ul>

<div class="subsection">
    <div class="subsection-title">بنية نقاط النهاية</div>
</div>
<p class="body-text">
كل نقطة نهاية تُعرَّف في ملف مستقل داخل مجلد <code>infrastructure/api/</code>. يتبع كل معالج <code>handler</code> نمطًا موحدًا: استخراج المعاملات والتحقق منها، ثم تنفيذ العملية عبر وظائف الوصول إلى البيانات، ثم إرجاع استجابة موحدة. الأخطاء تُلتقط وتُحوّل إلى استجابات HTTP مناسبة مع رسائل خطأ واضحة.
</p>

<div class="subsection">
    <div class="subsection-title">التحقق من المدخلات</div>
</div>
<p class="body-text">
جميع المدخلات من العميل تُتحقق قبل المعالجة. يُستخدم Zod لتحديد أنماط التحقق <code>schemas</code> التي تُربط بأنواع TypeScript. كل نقطة نهاية تحدد مخطط التحقق الخاص بها، وفشل التحقق يُرجع خطأ <code>400 Bad Request</code> مع تفاصيل الحقول الخاطئة.
</p>

<div class="subsection">
    <div class="subsection-title">تنسيق الاستجابات</div>
</div>
<p class="body-text">
تتبع جميع الاستجابات الناجحة تنسيقًا موحدًا يُغلّف البيانات مع معلومات وصفية. الاستجابات غير الناجحة تتضمن رمز الخطأ ورسالة وصفية ومعرف فريد لتتبعه في Sentry. يُستخدم نمط الاستجابة الموحد <code>ApiResponse&lt;T&gt;</code> المُعرَّف في أنواع البنية التحتية.
</p>

<div class="code-block">// تنسيق الاستجابة الموحد
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}</div>

<div class="callout">
    <div class="callout-title">📌 قاعدة الخادم فقط</div>
    <div class="callout-body">جميع نقاط نهاية API تُنفذ على الخادم فقط عبر Nitro. لا يُسمح بإنشاء نقاط نهاية عميل. المكتبات الحساسة مثل ccxt تُستورد فقط في ملفات المعالجات الخادمية مع شرط server-only.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 14 — معايير الخدمات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-14",
            "title": "معايير الخدمات",
            "content": """
<p class="body-text">
الخدمات النطاقية <code>domain services</code> هي الوحدات التي تُغلف منطق الأعمال المعقد وتُدير التفاعلات مع الخدمات الخارجية ووظائف الوصول إلى البيانات. كل خدمة تابعة لنطاق معين وتُعرَّف داخل مجلد <code>services/</code> الخاص بذلك النطاق.
</p>

<div class="subsection">
    <div class="subsection-title">بنية الخدمة القياسية</div>
</div>
<p class="body-text">
تتبع كل خدمة النمط التالي: تعريف الأنواع الداخلية أولاً، ثم ثوابت التهيئة (مثل عناوين URL وفترات المهلة)، ثم الوظائف الرئيسية العامة، ثم الوظائف المساعدة الخاصة. تُصدَّر الوظائف العامة فقط عبر ملف <code>index.ts</code> للنطاق. لا تحتوي الخدمات على حالة متغيرة — كل وظيفة تتلقى مدخلاتها وتُرجع مخرجاتها دون الاعتماد على حالة مشتركة.
</p>

<div class="subsection">
    <div class="subsection-title">أنواع الخدمات</div>
</div>
<ul class="vixor-list">
<li><strong>خدمات البيانات:</strong> تُغلف استدعاءات وظائف الوصول إلى البيانات وتُحول البيانات الخام إلى أنواع منطقية للنطاق. مثال: <code>analysisService.ts</code> يحول بيانات OHLCV الخام إلى تحليل SMC مهيكل.</li>
<li><strong>خدمات التكامل:</strong> تتصل بالخدمات الخارجية مثل منصات التداول ومقدمي الذكاء الاصطناعي. مثال: <code>tradingService.ts</code> يُنفذ الصفقات عبر ccxt.</li>
<li><strong>خدمات الحساب:</strong> تُنفذ حسابات معقدة مثل حساب المخاطر وتحليل الربحية. مثال: <code>riskService.ts</code> يحسب حجم الصفقة المناسب بناءً على تحمل المخاطر.</li>
<li><strong>خدمات التنسيق:</strong> تُنسق بين خدمات متعددة لتنفيذ عمليات مركبة. مثال: <code>copilotService.ts</code> ينسق بين خدمة التحليل وخدمة التداول وخدمة المخاطر.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">معالجة الأخطاء في الخدمات</div>
</div>
<p class="body-text">
كل وظيفة في الخدمة تُغلف في كتلة <code>try-catch</code> تُطبع الأخطاء وتُعيدها بشكل موحد. لا تُطلق الخدمات استثناءات غير مُعالجة — بدلًا من ذلك تُرجع كائن خطأ مُهيكل يتضمن نوع الخطأ والرسالة والسياق. هذا يسمح للمستهلكين بالتعامل مع الأخطاء بطريقة متسقة.
</p>

<div class="subsection">
    <div class="subsection-title">اختبار الخدمات</div>
</div>
<p class="body-text">
تُختبر كل خدمة بوحدات اختبار مستقلة تُحاكي <code>mock</code> جميع التبعيات الخارجية. تُكتب الاختبارات بشكل يصف السلوك المتوقع بدقة: الحالات الناجحة، وحالات الخطأ المتوقعة، والحالات الحدية. تُنفذ الاختبارات تلقائيًا في خط CI/CD ويُمنع الدمج إذا فشل أي اختبار.
</p>

<div class="callout">
    <div class="callout-title">📐 قاعدة بدون حالة</div>
    <div class="callout-body">الخدمات يجب أن تكون خالية من الحالة <code>stateless</code>. إذا احتجت إلى مشاركة حالة بين وظائف الخدمة، استخدم مُعَدِّل <code>parameter object</code> ينقل الحالة كمعامل. هذا يجعل الخدمات قابلة للاختبار ومتوازية في التنفيذ.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 15 — معايير المكونات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-15",
            "title": "معايير المكونات",
            "content": """
<p class="body-text">
مكونات React في فيكسور تتبع معايير صارمة لضمان الاتساق والأداء وسهولة الصيانة. جميع المكونات تُبنى باستخدام مكونات shadcn/ui كأساس، مع تخصيص الأنماط عبر Tailwind CSS 4. يُمنع بناء مكونات أساسية من الصفر عندما يوجد بديل في shadcn/ui.
</p>

<div class="subsection">
    <div class="subsection-title">أنواع المكونات</div>
</div>
<ul class="vixor-list">
<li><strong>مكونات الصفحة:</strong> مكونات كبيرة تُمثل صفحة كاملة وتجمع مكونات أصغر. تُعرَّف في مجلد النطاق وتُستخدم في طبقة التطبيق. مثال: <code>TradingPanel.tsx</code> يضم المخطط وأوامر الشراء والبيع وسجل الصفقات.</li>
<li><strong>مكونات الميزة:</strong> مكونات متوسطة الحجم تُمثل ميزة واحدة. تُخزن في مجلد <code>components/</code> للنطاق. مثال: <code>OrderForm.tsx</code> لنموذج إدخال الأوامر.</li>
<li><strong>مكونات واجهة المستخدم:</strong> مكونات أساسية صغيرة تُبنى على shadcn/ui. مثال: <code>PriceBadge.tsx</code> لعرض السعر بلون يُعبّر عن الاتجاه.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">هيكل المكون القياسي</div>
</div>
<p class="body-text">
كل مكون React يتبع الهيكل التالي: تعريف واجهة الدعائم <code>Props interface</code> أولاً مع تعليقات JSDoc لكل دعمة، ثم المكون الرئيسي كدالة أساسية، ثم أي مكونات فرعية مُغلقة <code>encapsulated</code>. المكونات المعقدة التي تحتوي على منطق معالجة بيانات تستخرج هذا المنطق إلى هوك مخصص يُستهلك داخل المكون.
</p>

<div class="subsection">
    <div class="subsection-title">قواعد الأداء</div>
</div>
<ul class="vixor-list">
<li>استخدم <code>React.memo()</code> للمكونات التي تتلقى نفس الدعائم بشكل متكرر ولا تحتاج إلى إعادة تصيير.</li>
<li>استخدم <code>useMemo()</code> للحسابات المكلفة داخل المكون.</li>
<li>استخدم <code>useCallback()</code> لدوال معالجة الأحداث المُمررة كمكونات فرعية.</li>
<li>لا تُعرّف دوال أو كائنات جديدة داخل جسم المكون الرئيسي — حركها خارجه أو استخدم <code>useMemo</code>.</li>
<li>قوائم البيانات الطويلة تستخدم <code>react-window</code> أو <code>@tanstack/react-virtual</code> للعرض الافتراضي.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">قواعد إمكانية الوصول</div>
</div>
<ul class="vixor-list">
<li>استخدم العناصر الدلالية: <code>button</code>، <code>nav</code>، <code>main</code>، <code>article</code>.</li>
<li>أضف <code>aria-label</code> لجميع العناصر التفاعلية التي لا تحتوي على نص مرئي.</li>
<li>اضبط <code>alt</code> وصفيًا لجميع الصور.</li>
<li>تأكد من إمكانية التنقل بالكيبورد عبر جميع العناصر التفاعلية.</li>
<li>استخدم <code>sr-only</code> للنصوص المخفية المرئية المهمة لقارئات الشاشة.</li>
</ul>

<div class="callout">
    <div class="callout-title">📐 مكونات shadcn/ui</div>
    <div class="callout-body">جميع مكونات واجهة المستخدم في مجلد <code>src/components/ui/</code> موجودة مسبقًا من shadcn/ui. استخدمها دائمًا بدلًا من بناء مكونات بديلة. يُسمح بتخصيص الأنماط عبر Tailwind فقط.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 16 — معايير الهوكس
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-16",
            "title": "معايير الهوكس",
            "content": """
<p class="body-text">
الهوكس المخصصة <code>custom hooks</code> هي الآلية الأساسية لإعادة استخدام منطق الحالة والسلوك بين المكونات في فيكسور. كل هوك مخصص يتبع معايير صارمة لضمان الاتساق وسهولة الفهم. يُعرَّف كل هوك في ملف مستقل داخل مجلد <code>hooks/</code> الخاص بالنطاق.
</p>

<div class="subsection">
    <div class="subsection-title">تصنيف الهوكس</div>
</div>
<ul class="vixor-list">
<li><strong>هوكس البيانات:</strong> تُغلّف استعلامات TanStack Query وتُبسط استخدامها. مثال: <code>useMarketData(pair)</code> يُرجع البيانات وحالة التحميل والخطأ في كائن واحد. يُعرِّف كل هوك بيانات مفتاح الاستعلام ومدة الطزاجة وخيارات إعادة المحاولة.</li>
<li><strong>هوكس السلوك:</strong> تُغلف تفاعلات المستخدم والمنطق الشرطي. مثال: <code>useTradingForm()</code> يُدير حالة نموذج التداول والتحقق من صحة المدخلات وإرسال الأوامر.</li>
<li><strong>هوكس الاشتراك:</strong> تُدير اشتراكات WebSocket والحدث. مثال: <code>useTickerSubscription(pairs)</code> يُشترك في بيانات الأسعار الحية ويُحدث حالة Zustand تلقائيًا.</li>
<li><strong>هوكس التكامل:</strong> تُسهل التكامل مع الخدمات الخارجية. مثال: <code>useWalletConnection()</code> يُدير اتصال المحفظة الرقمية والتحقق من التوازن والسماح بالعمليات.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">قواعد كتابة الهوكس</div>
</div>
<ul class="vixor-list">
<li>اسم الهوك يجب أن يصف ما يفعله بدقة، لا ما يعيده: <code>useWalletBalance()</code> أفضل من <code>useWallet()</code>.</li>
<li>كل هوك يجب أن يبدأ بتعليق JSDoc يصف الغرض والمدخلات والمخرجات وسلوكه.</li>
<li>هوكس البيانات يجب أن تُرجع كائنًا موحدًا يضم <code>data</code> و<code>isLoading</code> و<code>error</code> و<code>refetch</code>.</li>
<li>لا تُنفذ عمليات DOM مباشرة داخل الهوكس — استخدم <code>useRef</code> و<code>useEffect</code> بالشكل الصحيح.</li>
<li>هوكس الاشتراك يجب أن تُنظّف اشتراكاتها في دالة إرجاع <code>cleanup function</code> في <code>useEffect</code>.</li>
<li>لا تستدعي هوكسًا داخل حلقات أو شروط — فقط في مستوى أعلى من المكون.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">التوثيق المطلوب</div>
</div>
<p class="body-text">
كل هوك مخصص يجب أن يوثق بالشكل التالي: تعليق JSDoc في أعلى الملف يصف الغرض، ووصف لكل معامل، ووصف لكل قيمة مُرجعة، وملاحظات حول السلوك المتوقع. هذا التوثيق يظهر تلقائيًا في IntelliSense عند استخدام الهوكس من مكونات أخرى، مما يُساعد المطورين على فهم كيفية الاستخدام الصحيح.
</p>

<div class="callout">
    <div class="callout-title">📌 قاعدة القابلية للإعادة</div>
    <div class="callout-body">إذا وجدت نفسك تنسخ نفس منطق الحالة بين مكونين، استخرج هذا المنطق إلى هوك مخصص. الهوكس هي أفضل آلية لمشاركة السلوك بين المكونات في React.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 17 — معايير المزودات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-17",
            "title": "معايير المزودات",
            "content": """
<p class="body-text">
مزودات السياق <code>Context Providers</code> في فيكسور تُستخدم بحذر وبشكل مُحصور لأن كل مزود يضيف طبقة إعادة تصيير عند تغير قيمته. تُقيّد المزودات على الحالات العميقة التي يحتاجها عدد كبير من المكونات عبر مستويات متعددة من شجرة المكونات.
</p>

<div class="subsection">
    <div class="subsection-title">المزودات المصرح بها</div>
</div>
<ul class="vixor-list">
<li><strong>I18nProvider:</strong> مزود التدويل الذي يوفر اللغة الحالية ودوال الترجمة لجميع المكونات. مُعرَّف في الطبقة المشتركة ويُغلّف التطبيق بأكمله في <code>AppShell</code>. يتحكم تلقائيًا في اتجاه الصفحة والخطوط حسب اللغة المختارة.</li>
<li><strong>WalletProvider:</strong> مزود المحفظة الذي يُدير حالة اتصال المحفظة الرقمية وبيانات التوازن. يوفر سياقًا مشتركًا لجميع المكونات التي تحتاج إلى التحقق من حالة المحفظة أو قراءة التوازن أو إرسال المعاملات.</li>
<li><strong>QueryClientProvider:</strong> مزود TanStack Query الذي يُهيئ إعدادات التخزين المؤقت وإعادة المحاولة وإعدادات الاتصال. مُهيأ بقيم افتراضية محسّنة لتطبيق التداول الحي.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">قواعد إنشاء مزود جديد</div>
</div>
<ul class="vixor-list">
<li><strong>التقييم الأول:</strong> هل تحتاج حقًا إلى مزود؟ هل يمكن تحقيق نفس الهدف بهوك مخصص أو مخزن Zustand أو TanStack Query؟ إذا كان الجواب نعم لكلتا الأسئلتين، فقد لا تحتاج مزودًا.</li>
<li><strong>تحديد النطاق:</strong> إذا لزم إنشاء مزود، ضعه في أقرب نقطة ممكنة في شجرة المكونات — لا تُغلّف التطبيق بأكمله بمزود يُستخدم في صفحة واحدة فقط.</li>
<li><strong>تقسيم القيمة:</strong> إذا كان المزود يحتوي على عدة قيم مستقلة، قسّمه إلى عدة مزودات لتقليل نطاق إعادة التصيير.</li>
<li><strong>التحسين:</strong> استخدم <code>useMemo</code> لقيمة السياق لمنع إعادة التصيير عند كل تصيير للمزود.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">هيكل المزود القياسي</div>
</div>
<p class="body-text">
يتبع كل مزود النمط التالي: تعريف السياق مع قيمة افتراضية، ثم تعريف المزود كمكون يُدير الحالة، ثم دالة <code>useContext</code> مُغلّفة تُطبع خطأ واضح عند الاستخدام خارج المزود. هذا النمط يضمن أمان الاستخدام ويُوفر رسائل خطأ مفيدة عند المحاولة الخاطئة.
</p>

<div class="code-block">// نمط المزود القياسي
const MyContext = createContext<MyContextValue | null>(null);

export function MyProvider({ children }: Props) {
  const value = useMemo(() => ({ /* state */ }), [deps]);
  return (
    &lt;MyContext.Provider value={value}&gt;
      {children}
    &lt;/MyContext.Provider&gt;
  );
}

export function useMyContext() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error('useMyContext must be used within MyProvider');
  return ctx;
}</div>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ تحذير الأداء</div>
    <div class="callout-body">كل تغيير في قيمة مزود يُعيد تصيير جميع المكونات المستهلكة له، حتى لو لم تتغير القيمة الفعلية التي يستخدمها كل مكون. قلل عدد المزودات واستخدم <code>useMemo</code> دائمًا.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 18 — معالجة الأخطاء
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-18",
            "title": "معالجة الأخطاء",
            "content": """
<p class="body-text">
نظام معالجة الأخطاء في فيكسور مُصمم ليكون شاملًا ومتسقًا، من التقاط الأخطاء على مستوى المكونات إلى الإبلاغ المركزي عبر Sentry. الهدف هو ضمان أن أي خطأ يُعالج بشكل مناسب دون أن يُسبب انهيارًا للنظام أو تجربة مستخدم سيئة.
</p>

<div class="subsection">
    <div class="subsection-title">حدود الأخطاء — Error Boundaries</div>
</div>
<p class="body-text">
تُستخدم حدود الأخطاء <code>Error Boundaries</code> في React لمنع انتشار الأخطاء إلى التطبيق بأكمله. يُوضع حد أخطاء حول كل صفحة رئيسية لمنع فشل صفحة واحدة من التأثير على بقية التطبيق. عند التقاط خطأ، يعرض حد الأخطاء واجهة بديلة مع رسالة وصفية وزر إعادة المحاولة. تُرسل جميع الأخطاء الملتقطة إلى Sentry مع سياق إضافي لتمكين التشخيص السريع.
</p>

<div class="subsection">
    <div class="subsection-title">تسوية الأخطاء — Error Normalization</div>
</div>
<p class="body-text">
جميع الأخطاء في النظام تُحوّل إلى تنسيق موحد <code>VixorError</code> يتضمن: رمز الخطأ <code>code</code>، والرسالة الوصفية <code>message</code>، والشدة <code>severity</code> (منخفضة/متوسطة/حرجة)، والسياق <code>context</code> الذي حدث فيه الخطأ، والطابع الزمني <code>timestamp</code>. هذا التنسيق الموحد يُسهل التعامل مع الأخطاء في جميع طبقات النظام.
</p>

<div class="subsection">
    <div class="subsection-title">مستويات الخطأ</div>
</div>
<table class="vixor-table">
<thead>
<tr>
    <th>المستوى</th>
    <th>الوصف</th>
    <th>مثال</th>
    <th>الإجراء</th>
</tr>
</thead>
<tbody>
<tr><td><code>LOW</code></td><td>أخطاء غير حرجة</td><td>فشل تحميل صورة</td><td>إظهار عنصر بديل</td></tr>
<tr><td><code>MEDIUM</code></td><td>أخطاء تؤثر على ميزة</td><td>فشل تحديث بيانات السوق</td><td>إعادة المحاولة + إشعار</td></tr>
<tr><td><code>HIGH</code></td><td>أخطاء تؤثر على تدفق العمل</td><td>فشل تنفيذ صفقة</td><td>تنبيه فوري + Sentry</td></tr>
<tr><td><code>CRITICAL</code></td><td>أخطاء تؤثر على النظام</td><td>فشل قاعدة البيانات</td><td>صفحة صيانة + تنبيه الطوارئ</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">معالجة الأخطاء على الخادم</div>
</div>
<p class="body-text">
جميع معالجات Nitro تُغلّف في كتلة <code>try-catch</code> موحدة تلتقط الأخطاء وتُسجلها في Sentry وتُرجع استجابة HTTP مناسبة. الأخطاء المتوقعة (مثل عدم وجود بيانات) تُرجع <code>404</code>، والأخطاء الناتجة عن مدخلات خاطئة تُرجع <code>400</code>، والأخطاء المتعلقة بالصلاحيات تُرجع <code>403</code>، والأخطاء غير المتوقعة تُرجع <code>500</code> مع معرف طلب لتتبعه.
</p>

<div class="subsection">
    <div class="subsection-title">معالجة الأخطاء على العميل</div>
</div>
<p class="body-text">
TanStack Query يُعالج أخطاء الخادم تلقائيًا عبر حالة <code>error</code> في كل استعلام. الهوكس المخصصة تُضيف معالجة إضافية مثل إظهار إشعارات <code>toast</code> للمستخدم عند فشل العمليات المهمة. الأخطاء في مكونات React تُلتقط عبر حدود الأخطاء. تُسجل جميع الأخطاء المحلية أيضًا في Sentry لتتبعها.
</p>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ قاعدة صارمة</div>
    <div class="callout-body">لا يجوز تجاهل الأخطاء (catch فارغ). حتى الأخطاء "غير المهمة" يجب أن تُسجل على الأقل في وحدة التحكم. الأخطاء التي تؤثر على تجربة المستخدم يجب أن تُرسل إلى Sentry دائمًا.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 19 — التسجيل
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-19",
            "title": "التسجيل والمراقبة",
            "content": """
<p class="body-text">
نظام التسجيل والمراقبة في فيكسور يضمن رؤية كاملة في سلوك النظام في بيئة الإنتاج. يُستخدم Sentry للأخطاء وMixpanel لتحليلات الاستخدام، بالإضافة إلى نظام أحداث مُطَبَّق بدقة يُسجل جميع العمليات المهمة.
</p>

<div class="subsection">
    <div class="subsection-title">Sentry — مراقبة الأخطاء</div>
</div>
<p class="body-text">
يتكامل Sentry مع النظام على مستويين: مستوى الخادم ومستوى العميل. على الخادم، يُلتقط كل خطأ في معالجات Nitro مع سياق يشمل المعاملات والرؤوس وبيانات المستخدم. على العميل، يُلتقط كل خطأ في مكونات React وأخطاء الشبكة وأخطاء عدم الوعود <code>unhandled promise rejections</code>. يُرسل كل خطأ مع تتبع مكدس كامل وسياق إضافي يُسهل التشخيص.
</p>

<div class="subsection">
    <div class="subsection-title">Mixpanel — تحليلات الاستخدام</div>
</div>
<p class="body-text">
يتتبع Mixpanel الأحداث الرئيسية لفهم سلوك المستخدمين. يُرسل كل حدث مع خصائص مستخدم وأجهزة ومهمة. لا تُرسل أي بيانات شخصية أو مالية — فقط أحداث مجهولة مثل: فتح صفحة التحليل، وتنفيذ صفقة، وفتح اتصال المحفظة. هذه البيانات تُستخدم لتحسين تجربة المستخدم وتحديد الميزات الأكثر استخدامًا.
</p>

<div class="subsection">
            <div class="subsection-title">نظام الأحداث المُطَبَّق</div>
</div>
<p class="body-text">
يُسجل <code>EventOrchestrator</code> أكثر من 20 حدثًا مُطَبَّقًا بدقة، كل بنوع TypeScript محدد. من هذه الأحداث: اكتمال التحليل، وتنفيذ الصفقة، وتحديث بيانات السوق، وفشل مزود الذكاء الاصطناعي، واكتمال اكتشاف عملة جديدة. يمكن إضافة مستمعين <code>listeners</code> لأي حدث لتسجيله في قاعدة البيانات أو إرسال إشعارات أو تحديث لوحات المعلومات.
</p>

<div class="subsection">
    <div class="subsection-title">مستويات التسجيل</div>
</div>
<table class="vixor-table">
<thead>
<tr>
    <th>المستوى</th>
    <th>الاستخدام</th>
    <th>مثال</th>
</tr>
</thead>
<tbody>
<tr><td><code>DEBUG</code></td><td>معلومات تطويرية مفصلة</td><td>قيم المدخلات والمخرجات</td></tr>
<tr><td><code>INFO</code></td><td>أحداث التشغيل المهمة</td><td>بدء تحليل، اكتمال صفقة</td></tr>
<tr><td><code>WARN</code></td><td>مواقف غير متوقعة</td><td>فشل مزود AI (مع احتياط)</td></tr>
<tr><td><code>ERROR</code></td><td>أخطاء تتطلب تدخلًا</td><td>فشل استعلام قاعدة البيانات</td></tr>
<tr><td><code>FATAL</code></td><td>أخطاء حرجة توقف النظام</td><td>فشل الاتصال بقاعدة البيانات</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">سجل التدقيق</div>
</div>
<p class="body-text">
جميع العمليات الحساسة — مثل تنفيذ الصفقات، وتغيير إعدادات الأمان، والوصول إلى بيانات مشفرة — تُسجل في سجل تدقيق <code>audit log</code> دائم. كل سجل يتضمن: معرف المستخدم، ونوع العملية، والطابع الزمني، وعنوان IP، والنتيجة. لا يمكن حذف أو تعديل سجلات التدقيق لضمان الشفافية والمساءلة.
</p>

<div class="callout">
    <div class="callout-title">📌 إرشادات التسجيل</div>
    <div class="callout-body">سجّل كل عملية تغيير الحالة (state change) مع القيمة القديمة والجديدة. سجّل كل عملية خارجية (API call) مع وقت التنفيذ والنتيجة. لا تسجل بيانات حساسة مثل المفاتيح أو كلمات المرور في أي مستوى.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 20 — قواعد الأداء
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-20",
            "title": "قواعد الأداء",
            "content": """
<p class="body-text">
الأداء عامل حاسم في تطبيقات التداول حيث التأخير قد يعني خسارة مالية حقيقية. يتبع فيكسور مجموعة من القواعد لضمان استجابة سريعة وتجربة مستخدم سلسة حتى مع حجم بيانات كبير.
</p>

<div class="subsection">
    <div class="subsection-title">التحميل الكسول — Lazy Loading</div>
</div>
<p class="body-text">
يُستخدم التحميل الكسول على مستوى المسار عبر TanStack Start، حيث يُحمّل كود كل صفحة فقط عند التنقل إليها أول مرة. المكونات الثقيلة — مثل محركات التحليل ومخططات الأسعار — تُحمّل بشكل كسول داخل الصفحات أيضًا. هذا يقلل حجم الحزمة الأولية ويسرّع عرض الصفحة الأولى.
</p>

<div class="subsection">
    <div class="subsection-title">القوائم الافتراضية — Virtual Lists</div>
</div>
<p class="body-text">
جميع القوائم التي قد تحتوي على أكثر من 50 عنصرًا يجب أن تستخدم عرضًا افتراضيًا <code>virtual scrolling</code> عبر <code>@tanstack/react-virtual</code>. هذا يشمل: سجل الصفقات، وقائمة العملات المكتشفة، وسجل الإشعارات، وقائمة المراقبة. يعرض العرض الافتراضي فقط العناصر المرئية في منفذ العرض، مما يحسن الأداء بشكل كبير مع قوائم كبيرة.
</p>

<div class="subsection">
    <div class="subsection-title">تقسيم الكود — Code Splitting</div>
</div>
<p class="body-text">
يتم تقسيم الكود تلقائيًا على مستوى المسار عبر TanStack Start، وعلى مستوى المكونات الثقيلة عبر <code>React.lazy()</code>. المكتبات الكبيرة مثل مكتبات الرسوم البيانية تُفصل في حزم منفصلة. هذا يضمن أن كل صفحة تحمل فقط الكود الذي تحتاجه، مما يقلل وقت التحميل بشكل ملحوظ.
</p>

<div class="subsection">
    <div class="subsection-title">تحسين الاستعلامات</div>
</div>
<ul class="vixor-list">
<li><strong>staleTime مناسب:</strong> تُعيَّن فترة الطزاجة لكل استعلام حسب طبيعة البيانات: 30 ثانية للبيانات شبه الثابتة، و5 ثوانٍ لبيانات الأسعار، و0 ثانية للبيانات الحساسة للمستخدم.</li>
<li><strong>التحديث الانتقائي:</strong> عند تحديث بيانات، يُعاد جلب الاستعلام ذي الصلة فقط عبر <code>invalidateQueries</code> بدلًا من تحديث جميع الاستعلامات.</li>
<li><strong>الترقيم:</strong> جميع القوائم الطويلة تستخدم ترقيم الصفحات <code>pagination</code> بدلًا من تحميل كل البيانات دفعة واحدة.</li>
<li><strong>التحميل المسبق:</strong> بيانات الصفحات المحتملة التالية تُحمّل مسبقًا عند تحريك المؤشر فوق روابط التنقل.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">تحسين WebSocket</div>
</div>
<p class="body-text">
اتصالات WebSocket لبيانات السوق تُدارة بعناية لتقليل الضغط. تُستخدم تقنية debounce لتقليل عدد التحديثات المعروضة عند تلقي بيانات متكررة. البيانات تُخزن مؤقتًا في مخزن Zustand وذاكرة LRU لمنع الطلبات المتكررة. عند فقدان الاتصال، يُحاول النظام إعادة الاتصال تلقائيًا مع زيادة تدريجية في الفترة بين المحاولات.
</p>

<div class="callout">
    <div class="callout-title">⚡ قاعدة الأداء الحرجة</div>
    <div class="callout-body">أي عملية حسابية تستغرق أكثر من 16 مللي ثانية (إطار واحد) يجب أن تُنقل إلى Web Worker أو تُنفذ على الخادم. واجهة المستخدم يجب أن تظل مستجبة دائمًا بغض النظر عن تعقيد العمليات في الخلفية.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 21 — إرشادات التوسع
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-21",
            "title": "إرشادات التوسع",
            "content": """
<p class="body-text">
يُصمم فيكسور ليتعامل مع نمو مستمر في عدد المستخدمين وحجم البيانات وتعقيد الميزات. هذه الإرشادات تضمن أن البنية يمكنها التوسع دون إعادة هيكلة كبيرة.
</p>

<div class="subsection">
    <div class="subsection-title">التوسع الأفقي</div>
</div>
<p class="body-text">
يعتمد النظام على استضافة بدون خوادم <code>serverless</code> عبر Vercel، مما يسمح بتوسع تلقائي حسب الطلب. حالة التطبيق تُعتمد على خدمات خارجية (Redis وPostgreSQL) بدلًا من الذاكرة المحلية، مما يسمح بتشغيل عدة نسخ من التطبيق بدون تعارضات. اتصالات WebSocket تُدار عبر بروتوكولات مناسبة للاستضافة بدون خوادم.
</p>

<div class="subsection">
    <div class="subsection-title">إضافة نطاق جديد</div>
</div>
<p class="vixor-ol">
<li>إنشاء مجلد النطاق في <code>features/</code> باسم يتبع اتفاقية <code>kebab-case</code>.</li>
<li>إنشاء المجلدات الفرعية: <code>components/</code>، <code>hooks/</code>، <code>services/</code>، <code>types/</code>، <code>utils/</code>.</li>
<li>تعريف الأنواع في ملف <code>types/index.types.ts</code>.</li>
<li>بناء المكونات في <code>components/</code> مع استخدام مكونات shadcn/ui.</li>
<li>إنشاء هوك بيانات في <code>hooks/</code> يُغلف استعلامات TanStack Query.</li>
<li>إنشاء خدمة في <code>services/</code> للعمليات المعقدة.</li>
<li>إنشاء ملف <code>index.ts</code> تصدير برملي.</li>
<li>إضافة مسار جديد في طبقة التطبيق يستهلك مكونات النطاق.</li>
<li>تحديث رسم الاعتماديات وتحقق من عدم وجود دوران.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">إضافة جدول بيانات جديد</div>
</div>
<ul class="vixor-list">
<li>تُضاف الجداول في Supabase مع تمكين RLS على كل جدول.</li>
<li>تُنشأ وظائف الوصول إلى البيانات المقابلة في <code>shared/data-access/</code>.</li>
<li>تُعرَّف أنواع TypeScript مطابقة لهيكل الجدول في النطاق المعني.</li>
<li>تُكتب اختبارات وحدة لوظائف الوصول للتحقق من صحة عمليات القراءة والكتابة.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">إضافة مزود ذكاء اصطناعي جديد</div>
</div>
<p class="body-text">
لإضافة مزود جديد لنماذج اللغة الكبيرة، أضف تكوين المزود في <code>shared/llm/</code> مع تحديد نقطة النهاية ونموذج المصادقة والحدود المالية. أضف المزود إلى سلسلة الاحتياط في الترتيب المطلوب. كل مزود يجب أن يُنفذ واجهة موحدة تتضمن: <code>generate()</code>، و<code>stream()</code>، و<code>getUsage()</code>.
</p>

<div class="subsection">
    <div class="subsection-title">إضافة قناة إشعارات جديدة</div>
</div>
<p class="body-text">
لإضافة قناة إشعارات جديدة (مثل Discord أو Slack)، أنشئ مُرسلًا <code>sender</code> جديد في <code>shared/notifications/</code> يُنفذ واجهة <code>NotificationSender</code> الموحدة. أضف القناة إلى تكوين المستخدم في قاعدة البيانات وواجهة إعدادات الإشعارات. أضف اختبارات وحدة تتحقق من إرسال الإشعارات بنجاح.
</p>

<div class="callout">
    <div class="callout-title">📌 إرشادات عامة للتوسع</div>
    <div class="callout-body">كل ميزة جديدة يجب أن تُقيّم من حيث تأثيرها على الأداء والأمان قبل التطوير. يُنصح بالبدء بتنفيذ مصغر (MVP) واختباره على بيئة تجريبية قبل النشر الكامل.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 22 — قواعد المؤسسة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-22",
            "title": "قواعد المؤسسة",
            "content": """
<p class="body-text">
قواعد المؤسسة <code>Enterprise Rules</code> هي مجموعة من المعايير والسياسات التي تضمن جودة الكود على المستوى التنظيمي. هذه القواعد مُلزمة لجميع أعضاء فريق التطوير وتُفرض عبر أدوات آلية وعمليات مراجعة الكود.
</p>

<div class="subsection">
    <div class="subsection-title">معايير مراجعة الكود — Code Review</div>
</div>
<ul class="vixor-list">
<li>كل طلب دمج <code>PR</code> يتطلب موافقة مطورين اثنين على الأقل قبل الدمج في الفرع الرئيسي.</li>
<li>تُفحص جميع التغييرات آليًا عبر ESLint وTypeScript compiler قبل قبول الطلب.</li>
<li>مراجعات الكود تركز على: صحة المنطق، والالتزام بالمعايير المُعرَّفة في هذا الكتاب، وأمان البيانات، والأداء.</li>
<li>التغييرات على الطبقة المشتركة تتطلب مراجعة إضافية من قائد الفريق التقني.</li>
<li>لا يُسمح بدمج كود يحتوي على تعليقات <code>TODO</code> دون إنشاء issue مُوافق عليه في نظام تتبع المهام.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">إدارة الديون التقنية</div>
</div>
<p class="body-text">
تُسجل جميع الديون التقنية كـ issues في نظام التتبع مع تصنيف <code>tech-debt</code>. كل دين تقني يُقيّم من حيث التأثير على الأداء والمخاطر ومدى الصعوبة في الإصلاح. يُخصص 20% من كل دورة تطوير لسداد الديون التقنية المُتراكمة. الأولوية للأديان ذات التأثير الأعلى على الأداء أو الأمان.
</p>

<div class="subsection">
    <div class="subsection-title">معايير التوثيق</div>
</div>
<ul class="vixor-list">
<li>كل ملف خدمة أو هوك مخصص يجب أن يتضمن تعليق JSDoc في أعلاه يصف الغرض والاستخدام.</li>
<li>كل وظيفة عامة يجب أن تُوثق مع وصف المدخلات والمخرجات والسلوك المتوقع.</li>
<li>تُحدَّث هذه الوثيقة (كتاب البنية) مع كل تغيير جوهري في البنية.</li>
<li>يُكتب README لكل نطاق يصف مسؤولياته وواجهاته واعتمادياته.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">معايير الأمان</div>
</div>
<ul class="vixor-list">
<li>جميع الاعتمادات الحساسة تُخزن مشفرة في قاعدة البيانات عبر <code>shared/crypto/</code>.</li>
<li>مفاتيح API وأسرار الخدمات تُحفظ فقط في متغيرات البيئة — لا تُوجد أبدًا في الكود المصدري.</li>
<li>يُفعّل RLS على كل جدول في Supabase، حتى الجداول المؤقتة.</li>
<li>جميع المدخلات من المستخدم تُتحقق على الخادم قبل المعالجة، بغض النظر عن التحقق على العميل.</li>
<li>يُجرى فحص أمني شامل ربع سنوي لجميع التبعيات والخدمات.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">سياسة الإصدارات</div>
</div>
<p class="body-text">
يتبع فيكسور نظام الإصدارات الدلالية <code>Semantic Versioning</code>. تغييرات البنية الرئيسية (مثل إعادة هيكلة النطاقات) تُ increment الرقم الرئيسي. إضافة ميزات جديدة تُ increment الرقم الفرعي. إصلاحات الأخطاء تُ increment رقم التصحيح. كل إصدار يُرفقه سجل تغييرات مفصل يصف جميع التغييرات والإضافات والإصلاحات.
</p>

<div class="subsection">
    <div class="subsection-title">سياسة التوظيف والتدريب</div>
</div>
<p class="body-text">
كل مطور جديد يخضع لفترة تدريب تتضمن: دراسة هذا الكتاب بالكامل، واستكشاف البنية الفعلية للمشروع، وإكمال مهمة تطوير أولية مُرشدة. يُعيَّن لكل مطور جديد مرشد <code>mentor</code> من الفريق الحالي يُرافقه خلال الأسابيع الثمانية الأولى. يُقيَّم المطور الجديد بعد الفترة التجريبية للتأكد من فهمه للبنية والمعايير.
</p>

<div class="callout callout-success">
    <div class="callout-title">✅ الالتزام المؤسسي</div>
    <div class="callout-body">الالتزام بهذه القواعد ليس خياريًا — إنه شرط أساسي للعمل على مشروع فيكسور. الجودة لا تُحدث بالصدفة بل بالتزام واعٍ وصارم بالمعايير المتفق عليها. كل سطر كود نكتبه يعكس مستوى احترافيتنا.</div>
</div>
"""
        },
    ]


def main():
    print("🏗️  Generating VIXOR Architecture Bible (DOC-02)...")

    chapters = build_chapters()
    print(f"   📄 {len(chapters)} chapters prepared.")

    html = generate_vixor_html(
        title="كتاب البنية البرمجية",
        subtitle="الوثيقة الرسمية لبنية نظام فيكسور الهندسية",
        doc_id="DOC-02",
        chapters=chapters,
        footer_text="VIXOR Architecture Bible — سري وخاص"
    )

    html_path = save_html(html, "02-architecture.html")
    print(f"   💾 HTML saved: {html_path}")

    pdf_path = convert_to_pdf(
        html_path,
        "02-architecture.pdf",
        skill_dir="/home/z/my-project/skills/pdf"
    )
    print(f"   📕 PDF saved: {pdf_path}")

    print("\n✅ Document 02 — Architecture Bible generated successfully!")
    return html_path, pdf_path


if __name__ == "__main__":
    main()
