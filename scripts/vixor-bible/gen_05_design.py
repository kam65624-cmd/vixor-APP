"""
VIXOR Design System Bible — Document 05 (Arabic RTL)
Generates the complete design system specification document.
"""

import sys
sys.path.insert(0, "/home/z/my-project/scripts/vixor-bible")

from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


def build_chapters():
    return [

        # ─────────────────────────────────────────────
        # 01 — مبادئ التصميم
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-01",
            "title": "مبادئ التصميم",
            "content": """
<p class="body-text">
نظام تصميم فيكسور V5 مبني على مجموعة أساسية من المبادئ التي تحكم كل قرار تصيمي في المنظومة. هذه المبادئ ليست مجرد إرشادات جمالية، بل هي قواعد هندسية صارمة تضمن تجربة مستخدم متسقة واحترافية عبر جميع المكونات والشاشات. كل مبدأ يُترجم مباشرة إلى رموز CSS وقيم محددة يمكن للمطورين تطبيقها بشكل منهجي. تم صياغة هذه المبادئ بناءً على أفضل ممارسات تصميم منصات التداول الاحترافية مع مراعاة خصوصيات السوق العربي وبيئة التطبيق متعددة الأجهزة.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">الوضوح المطلق</div>
        <div class="info-card-body">كل عنصر بصري يجب أن يُقرأ فورًا بدون حيرة. الأرقام المالية تستخدم خط JetBrains Mono مع محاذاة رقمية ثابتة (Tabular Nums). الألوان الدلالية ثابتة: الأخضر للشراء والأرباح، الأحمر للبيع والخسائر. التباين بين النصوص يتبع هرمية ثلاثية واضحة.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">العمق الطبقي</div>
        <div class="info-card-body">الواجهة مبنية على نظام طبقات ثلاثي: القاعدة (<code>#08090C</code>) والبطاقات (<code>#101114</code>) والعناصر المرتفعة (<code>#16171C</code>). هذا النظام يوفر إحساسًا بالعمق المكاني دون الحاجة لظلال ثقيلة، مما يقلل التشتيت البصري أثناء التداول السريع.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">الأداء أولاً</div>
        <div class="info-card-body">لا تأثيرات حركية ثقيلة على المكونات الحرجة. حركات التحويل تستخدم <code>transform</code> و <code>opacity</code> فقط لتجنب إعادة الحساب (Layout Recalculation). الأيقونات من مكتبة lucide-react خفيفة الوزن. التدرجات اللونية محسّنة لعرضها على وحدات معالجة الرسومات.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">الاحترافية المالية</div>
        <div class="info-card-body">كل رقم مالي يُعرض بخط أحادي العرض (Monospace) مع تباعد أفقي سالب مقداره <code>-0.02em</code>. الألوان الدلالية تتبع معيار التداول العالمي. تدرجات Take Profit تستخدم ثلاث درجات من الأخضر لتوضيح المستويات. المؤشرات اللونية واضحة وسريعة القراءة.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">التعديل التكيفي</div>
        <div class="info-card-body">التصميم يدعم دعمًا كاملاً وضع RTL للغات العربية عبر <code>dir="rtl"</code>. نظام المسافات مرن يعمل على جميع أحجام الشاشات. المكونات تبني نفسها على نقاط التوقف <code>sm/md/lg/xl</code>. التجربة متسقة بين سطح المكتب والجوال و Telegram.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">الاتساق المنهجي</div>
        <div class="info-card-body">جميع المكونات تستخدم نفس مجموعة الرموز (Design Tokens) المعرّفة في <code>@theme inline</code>. لا توجد قيم صلبة (Hardcoded) في المكونات. كل زاوية حافة وتدرج وظل وسرعة حركة معرّفة كمتغير CSS يمكن تعديله مركزيًا من ملف <code>src/styles.css</code> الواحد.</div>
    </div>
</div>
<div class="callout callout-success">
    <div class="callout-title">نصيحة تطبيقية</div>
    <div class="callout-body">عند بناء مكون جديد، ابدأ بمراجعة المبادئ الستة وتأكد أن المكون يلتزم بكل منها قبل كتابة أي كود. استخدم الأصناف الجاهزة مثل <code>.vixor-card</code> و <code>.vx-btn-primary</code> بدلاً من بناء تنسيقات مخصصة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 02 — رموز الألوان
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-02",
            "title": "رموز الألوان",
            "content": """
<p class="body-text">
نظام الألوان في فيكسور V5 هو العمود الفقري للهوية البصرية. يعتمد على مجموعة منظمة من الرموز اللونية (Color Tokens) المعرّفة في ملف <code>src/styles.css</code> ضمن كتلة <code>@theme inline</code>. كل لون له اسم دلالي واضح وقيمة HEX ثابتة، مما يضمن الاتساق عبر جميع المكونات. النظام يدعم وضعين: الداكن (الافتراضي) والفاتح، مع تحويلات تلقائية بينهما عبر متغيرات CSS.
</p>
<div class="subsection">
    <div class="subsection-title">الألوان الأساسية والدلالية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>الاسم</th><th>القيمة (داكن)</th><th>القيمة (فاتح)</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--primary</code></td><td>الأزرق النيلي</td><td>#6366F1</td><td>#6366F1</td><td>العنصر الأساسي، الأزرار، الروابط</td></tr>
<tr><td><code>--primary-glow</code></td><td>النيلي المُضيء</td><td>#818CF8</td><td>#818CF8</td><td>حالة التمرير، التوهج، التمييز</td></tr>
<tr><td><code>--bullish</code></td><td>الأخضر الحديث</td><td>#22D3A6</td><td>#059669</td><td>الشراء، الأرباح، الاتجاه الصعودي</td></tr>
<tr><td><code>--bearish</code></td><td>الأحمر المرجاني</td><td>#FB4667</td><td>#DC2626</td><td>البيع، الخسائر، الاتجاه الهبوطي</td></tr>
<tr><td><code>--neutral-wait</code></td><td>العنبر</td><td>#F5A623</td><td>#D97706</td><td>الحالة المحايدة، الانتظار</td></tr>
<tr><td><code>--gold</code></td><td>الذهبي</td><td>#F0C419</td><td>#F0C419</td><td>الميزات المميزة، الحالة المدفوعة</td></tr>
<tr><td><code>--destructive</code></td><td>الخطر</td><td>#FB4667</td><td>#DC2626</td><td>حذف، إلغاء، تحذيرات حرجة</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">ألوان الأسطح (3 طبقات)</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة (داكن)</th><th>القيمة (فاتح)</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td><code>--background</code></td><td>#08090C</td><td>#FFFFFF</td><td>خلفية الصفحة القاعدية</td></tr>
<tr><td><code>--card</code></td><td>#101114</td><td>#FFFFFF</td><td>خلفية البطاقات والحاويات</td></tr>
<tr><td><code>--surface-elevated</code></td><td>#16171C</td><td>#F5F5F7</td><td>العناصر المرتفعة والمنبثقة</td></tr>
<tr><td><code>--card-hover</code></td><td>#16171C</td><td>#F5F5F7</td><td>حالة تمرير البطاقات</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">ألوان النصوص (3 مستويات)</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة (داكن)</th><th>القيمة (فاتح)</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--foreground</code></td><td>#FFFFFF</td><td>#111827</td><td>العناوين، النصوص الأساسية</td></tr>
<tr><td><code>--text-secondary</code></td><td>#9498A8</td><td>#6B7280</td><td>النصوص الفرعية، الوصف</td></tr>
<tr><td><code>--text-muted</code></td><td>#565A66</td><td>#9CA3AF</td><td>التلميحات، النصوص الخافتة</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">ألوان Take Profile وأسطح الإشارة</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td><code>--tp1</code></td><td>#22D3A6</td><td>مستوى الهدف الأول (أقوى)</td></tr>
<tr><td><code>--tp2</code></td><td>#26D07C</td><td>مستوى الهدف الثاني</td></tr>
<tr><td><code>--tp3</code></td><td>#6EE7B7</td><td>مستوى الهدف الثالث (أخف)</td></tr>
<tr><td><code>--bullish-bg</code></td><td>#22D3A614</td><td>خلفية إشارة صعودية شبه شفافة</td></tr>
<tr><td><code>--bearish-bg</code></td><td>#FB466714</td><td>خلفية إشارة هبوطية شبه شفافة</td></tr>
<tr><td><code>--neutral-wait-bg</code></td><td>#F5A62314</td><td>خلفية حالة الانتظار شبه شفافة</td></tr>
<tr><td><code>--gold-bg</code></td><td>#F0C41914</td><td>خلفية الحالة الذهبية شبه شفافة</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">الحدود والتراكبات</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة (داكن)</th><th>القيمة (فاتح)</th></tr>
</thead>
<tbody>
<tr><td><code>--border</code></td><td>rgba(255,255,255,0.08)</td><td>#E5E7EB</td></tr>
<tr><td><code>--border-subtle</code></td><td>rgba(255,255,255,0.04)</td><td>#F3F4F6</td></tr>
<tr><td><code>--border-hover</code></td><td>rgba(255,255,255,0.15)</td><td>#D1D5DB</td></tr>
<tr><td><code>--overlay</code></td><td>rgba(8,9,12,0.75)</td><td>rgba(0,0,0,0.30)</td></tr>
</tbody>
</table>

<div class="callout callout-warn">
    <div class="callout-title">تحذير مهم</div>
    <div class="callout-body">لا تستخدم ألوان الإشارة الدلالية (Bullish/Bearish) خارج سياق التداول. الأخضر يعني دائمًا ربح أو شراء، والأحمر يعني دائمًا خسارة أو بيع. لاستخدامات أخرى، استخدم الألوان المحايدة أو اللون الأساسي.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 03 — الطباعة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-03",
            "title": "الطباعة",
            "content": """
<p class="body-text">
نظام الطباعة في فيكسور V5 يعتمد على عائلتين خطيتين رئيسيتين، مدعومين بمقياس طباعي من ثمانية مستويات. يتم تحميل الخطوط عبر Google Fonts ويتم تعريف المتغيرات في كتلة <code>@theme inline</code>. كل عنصر نصي في المنظومة يستخدم واحدًا من هذين الخطين حسب السياق: واجهة المستخدم العامة تستخدم Inter، بينما الأرقام المالية والأسعار تستخدم JetBrains Mono.
</p>
<div class="subsection">
    <div class="subsection-title">عائلات الخطوط</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>المتغير</th><th>الخط</th><th>الأوزان</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--font-sans</code></td><td>Inter</td><td>400, 500, 600, 700</td><td>واجهة المستخدم، العناوين، النصوص</td></tr>
<tr><td><code>--font-display</code></td><td>Inter</td><td>400, 500, 600, 700</td><td>العناوين الكبيرة والعرضية</td></tr>
<tr><td><code>--font-mono</code></td><td>JetBrains Mono</td><td>400, 500, 600</td><td>الأرقام المالية، الأسعار، الكود</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">مقياس الطباعة (8 مستويات)</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>الحجم</th><th>الوصف</th><th>مثال الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--text-display</code></td><td>32px</td><td>العرض الكامل</td><td>عناوين الصفحات الرئيسية</td></tr>
<tr><td><code>--text-h1</code></td><td>24px</td><td>عنوان المستوى الأول</td><td>أقسام الصفحة</td></tr>
<tr><td><code>--text-h2</code></td><td>20px</td><td>عنوان المستوى الثاني</td><td>العناوين الفرعية الكبيرة</td></tr>
<tr><td><code>--text-h3</code></td><td>16px</td><td>عنوان المستوى الثالث</td><td>عناوين البطاقات</td></tr>
<tr><td><code>--text-body-lg</code></td><td>15px</td><td>نص كبير</td><td>الفقرات المهمة</td></tr>
<tr><td><code>--text-body</code></td><td>13px</td><td>النص الأساسي</td><td>المحتوى العام</td></tr>
<tr><td><code>--text-caption</code></td><td>12px</td><td>التسمية التوضيحية</td><td>الوصف تحت العناصر</td></tr>
<tr><td><code>--text-micro</code></td><td>11px</td><td>النص المصغر</td><td>الطوابع الزمنية، البيانات الوصفية</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">أصناف الأرقام المالية</div>
</div>
<p class="body-text">
جميع الأرقام المالية في فيكسور تُعرض بخط JetBrains Mono مع خاصية <code>font-variant-numeric: tabular-nums</code> لضمان محاذاة ثابتة للأرقام في الأعمدة. يتم استخدام صنفين مخصصين: <code>.text-mono</code> للأرقام العادية مع تباعد <code>-0.02em</code>، و <code>.text-num</code> للأرقام البارزة مع وزن خط <code>600</code>. هاتان الصنفان يضمنان أن الأسعار والأحجام تُقرأ بسرعة ودقة دون اهتزاز بصري عند التحديث.
</p>
<div class="callout">
    <div class="callout-title">الأسماء المستعارة القديمة (Legacy Aliases)</div>
    <div class="callout-body">لا تزال بعض الأسماء القديمة مدعومة للتوافق العكسي مثل <code>--text-xs</code> (11px)، <code>--text-sm</code> (12px)، <code>--text-base</code> (14px)، <code>--text-md</code> (16px). يُنصح باستخدام الأسماء الجديدة في المكونات الجديدة والانتقال تدريجيًا من القديمة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 04 — المسافات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-04",
            "title": "المسافات",
            "content": """
<p class="body-text">
نظام المسافات في فيكسور V5 مبني على وحدة أساسية مقدارها <strong>4 بكسل</strong>. جميع المسافات في المنظومة مشتقة من هذه الوحدة، مما يضمن إيقاعًا بصريًا متناسقًا عبر جميع المكونات. يتم تعريف الرموز في كتلة <code>@theme inline</code> ويمكن استخدامها عبر متغيرات CSS أو فئات Tailwind المخصصة. النظام يوفر 7 مستويات من المسافات تغطي جميع حالات الاستخدام من المسافة الدنيا بين العناصر إلى الحشوات الكبيرة للحاويات.
</p>
<div class="subsection">
    <div class="subsection-title">مقياس المسافات</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة</th><th>المضاعف</th><th>الوصف</th><th>مثال الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--space-xs</code></td><td>4px</td><td>1×</td><td>مسافة دنيا</td><td>المسافة بين أيقونة ونصها</td></tr>
<tr><td><code>--space-sm</code></td><td>8px</td><td>2×</td><td>مسافة صغيرة</td><td>الحشوة الداخلية للطوابع</td></tr>
<tr><td><code>--space-md</code></td><td>12px</td><td>3×</td><td>مسافة متوسطة</td><td>الحشوة الداخلية للطوابع الكبيرة</td></tr>
<tr><td><code>--space-lg</code></td><td>16px</td><td>4×</td><td>مسافة قياسية</td><td>الفجوة بين عناصر النموذج</td></tr>
<tr><td><code>--space-xl</code></td><td>24px</td><td>6×</td><td>مسافة واسعة</td><td>هامش البطاقات الخارجي</td></tr>
<tr><td><code>--space-2xl</code></td><td>32px</td><td>8×</td><td>مسافة كبيرة</td><td>الحشوة الداخلية للحاويات</td></tr>
<tr><td><code>--space-3xl</code></td><td>48px</td><td>12×</td><td>مسافة ضخمة</td><td>الفجوة بين الأقسام الرئيسية</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">قواعد استخدام المسافات</div>
</div>
<ul class="vixor-list">
<li>استخدم <code>--space-xs</code> (4px) فقط بين العناصر المرتبطة ارتباطًا وثيقًا مثل أيقونة بجانب نص أو عنصرين في مجموعة مدمجة.</li>
<li>استخدم <code>--space-sm</code> (8px) للمسافات بين عناصر القائمة والعناصر الفرعية داخل المكون الواحد.</li>
<li>استخدم <code>--space-md</code> (12px) و <code>--space-lg</code> (16px) كحشوة افتراضية داخل معظم المكونات والبطاقات.</li>
<li>استخدم <code>--space-xl</code> (24px) كفجوة بين البطاقات المتجاورة في الشبكات والمجموعات.</li>
<li>استخدم <code>--space-2xl</code> (32px) و <code>--space-3xl</code> (48px) للمسافات بين الأقسام الرئيسية في الصفحة.</li>
<li>لا تتجاوز <code>--space-3xl</code> إلا في حالات استثنائية مثل المسافات بين الأقسام الكبرى في الصفحات.</li>
</ul>

<div class="callout callout-success">
    <div class="callout-title">نصيحة تناسق</div>
    <div class="callout-body">عند بناء مكون جديد، اختر مستوى مسافة واحد للفجوات الداخلية ومستوى واحد أكبر للمسافات الخارجية. هذا يضمن إيقاعًا بصريًا 1:2 متسقًا في كل مكون.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 05 — الشبكة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-05",
            "title": "الشبكة",
            "content": """
<p class="body-text">
نظام الشبكة في فيكسور V5 يوفر إطارًا مرنًا لبناء التخطيطات على جميع أحجام الشاشات. يعتمد على نظام CSS Grid و Flexbox مع نقاط توقف متعددة. الشبكة الأساسية تستخدم 12 عمودًا على سطح المكتب و 4 أعمدة على الجوال، مع هوامش ثابتة تضمن إطارًا مرئيًا مريحًا. خلفية الشبكة الدقيقة (<code>--bg-grid</code>) تُستخدم في التخطيطات المتقدمة لإضافة عمق بصري.
</p>
<div class="subsection">
    <div class="subsection-title">نقاط التوقف (Breakpoints)</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>البادئة</th><th>العرض الأدنى</th><th>الأعمدة</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td>(افتراضي)</td><td>0px</td><td>1-4</td><td>الجوال والشاشات الصغيرة</td></tr>
<tr><td><code>sm:</code></td><td>640px</td><td>4-8</td><td>الأجهزة اللوحية الصغيرة</td></tr>
<tr><td><code>md:</code></td><td>768px</td><td>8</td><td>الأجهزة اللوحية</td></tr>
<tr><td><code>lg:</code></td><td>1024px</td><td>12</td><td>سطح المكتب الصغير</td></tr>
<tr><td><code>xl:</code></td><td>1280px</td><td>12</td><td>سطح المكتب الكبير</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">أنماط التخطيط الشائعة</div>
</div>
<p class="body-text">
التخطيط الرئيسي لتطبيق فيكسور يتكون من ثلاث مناطق رئيسية: الشريط الجانبي الثابت (عرض <code>260px</code>) على اليمين في وضع RTL، ومنطقة المحتوى الرئيسية التي تمتد لتملأ المساحة المتبقية، وشريط التنقل السفلي (ارتفاع <code>64px</code>) الذي يظهر فقط على الشاشات الصغيرة. في بيئة Telegram، الشريط الجانبي يُخفى بالكامل ويُستبدل بشريط التنقل السفلي.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">شبكة البطاقات</div>
        <div class="info-card-body">استخدم <code>grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4</code> لشبكات البطاقات القياسية. الفجوة بين البطاقات <code>16px</code> باستخدام <code>--space-lg</code>.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">شبكة البيانات</div>
        <div class="info-card-body">استخدم صنف <code>.data-grid</code> لشبكات البيانات المدمجة التي تستخدم <code>gap: 1px</code> مع خلفية حدودية. كل خلية تأخذ خلفية البطاقة وتُفصل بخط 1 بكسل.</div>
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">خلفية الشبكة الدقيقة</div>
</div>
<p class="body-text">
خلفية الشبكة الدقيقة (<code>--bg-grid</code>) تضيف نمطًا شبه شفاف من الخطوط المتقاطعة بتباعد <code>40px × 40px</code> إلى الخلفية القاعدية. تُنشأ باستخدام تدرجات خطية مكررة: <code>linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)</code>. يمكن تطبيقها عبر صنف <code>.nocturne-bg</code> الذي يجمع بين توهج الخلفية والشبكة الدقيقة والخلفية القاعدية. في الوضع الفاتح، يتم تعطيل هذه الشبكة تمامًا (<code>--bg-grid: none</code>).
</p>
"""
        },

        # ─────────────────────────────────────────────
        # 06 — نصف القطر
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-06",
            "title": "نصف القطر",
            "content": """
<p class="body-text">
نظام زوايا الاستدارة (Border Radius) في فيكسور V5 يوفر 8 مستويات من الاستدارة تغطي جميع حالات الاستخدام من الزوايا الحادة إلى الزوايا الدائرية بالكامل. يتم تعريف جميع الرموز في كتلة <code>@theme inline</code> ويمكن تطبيقها عبر Tailwind باستخدام <code>rounded-xs</code> إلى <code>rounded-pill</code>. النظام مصمم بحيث يكون الاستدارة متناسبة مع حجم المكون: العناصر الصغيرة تستخدم زوايا أصغر والعناصر الكبيرة تستخدم زوايا أكبر.
</p>
<div class="subsection">
    <div class="subsection-title">مقياس زوايا الاستدارة</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة</th><th>الوصف</th><th>مثال الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--radius-xs</code></td><td>4px</td><td>زوايا دنيا</td><td>الأزرار الصغيرة، حقول الإدخال</td></tr>
<tr><td><code>--radius-sm</code></td><td>8px</td><td>زوايا صغيرة</td><td>الطوابع، الأزرار المتوسطة</td></tr>
<tr><td><code>--radius-md</code></td><td>12px</td><td>زوايا متوسطة</td><td>البطاقات على سطح المكتب، الأزرار</td></tr>
<tr><td><code>--radius-lg</code></td><td>16px</td><td>زوايا كبيرة</td><td>البطاقات على الجوال، الحاويات</td></tr>
<tr><td><code>--radius-xl</code></td><td>20px</td><td>زوايا كبيرة جدًا</td><td>البطاقات المميزة <code>.vx-card</code></td></tr>
<tr><td><code>--radius-2xl</code></td><td>24px</td><td>زوايا أوسع</td><td>النوافذ المنبثقة، النماذج</td></tr>
<tr><td><code>--radius-pill</code></td><td>9999px</td><td>دائري بالكامل</td><td>الطوابع المستديرة، أزرار الإجراء</td></tr>
<tr><td><code>--radius-full</code></td><td>9999px</td><td>دائري بالكامل</td><td>صور الملفات الشخصية</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">قواعد التطبيق</div>
</div>
<ul class="vixor-list">
<li>المكونات التفاعلية الصغيرة (أزرار، حقول إدخال): <code>--radius-md</code> (12px) كافتراضي.</li>
<li>البطاقات والألواح: <code>--radius-lg</code> (16px) على سطح المكتب و <code>--radius-xl</code> (20px) على الجوال.</li>
<li>النوافذ المنبثقة والسحب: <code>--radius-2xl</code> (24px).</li>
<li>الطوابع والشارات: <code>--radius-pill</code> (9999px) للشكل الدائري أو <code>--radius-sm</code> (8px) للشكل المربع المستدير.</li>
<li>الصور والملفات الشخصية: <code>--radius-full</code> (9999px) دائمًا.</li>
</ul>

<div class="callout callout-warn">
    <div class="callout-title">تناسق الاستدارة</div>
    <div class="callout-body">لا تخلط بين مستويات الاستدارة في نفس الشاشة. اختر مستويين كحد أقصى واستخدمهما بشكل متسق. المكونات داخل نفس الحاوية يجب أن تستخدم نفس مستوى الاستدارة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 07 — الارتفاع
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-07",
            "title": "الارتفاع",
            "content": """
<p class="body-text">
نظام الارتفاع (Elevation) في فيكسور V5 يعتمد على ثلاثة مستويات من الظلال بالإضافة إلى تأثير التوهج الأساسي. على عكس أنظمة التصميم التقليدية التي تعتمد على الظلال الثقيلة، يستخدم فيكسور ظلالًا دقيقة وشبه شفافة تضيف عمقًا دون تشتيت. الخلفيات الطبقية الثلاثة توفر الجزء الأكبر من الإحساس بالعمق، بينما الظلال تُستخدم فقط للعناصر التفاعلية والعناصر المنبثقة.
</p>
<div class="subsection">
    <div class="subsection-title">مستويات الظلال</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة (داكن)</th><th>القيمة (فاتح)</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--shadow-resting</code></td><td>0 1px 2px rgba(0,0,0,0.4)</td><td>0 1px 3px rgba(0,0,0,0.08)</td><td>البطاقات الساكنة، العناصر الأساسية</td></tr>
<tr><td><code>--shadow-elevated</code></td><td>0 8px 24px rgba(0,0,0,0.5)</td><td>0 4px 12px rgba(0,0,0,0.06)</td><td>العناصر المنبثقة، القوائم</td></tr>
<tr><td><code>--shadow-glow</code></td><td>0 0 16px -4px #6366F125</td><td>0 0 16px -4px #6366F120</td><td>تأثير التوهج الأساسي</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">تأثيرات الارتفاع المخصصة</div>
</div>
<p class="body-text">
إلى جانب الظلال الثلاثة الأساسية، يوفر النظام تأثيرات ارتفاع إضافية عبر أصناف CSS. صنف <code>.glass-card</code> يستخدم <code>backdrop-filter: blur(8px)</code> مع تدرج شبه شفاف لإنشاء تأثير الزجاج. صنف <code>.vx-glass</code> يأخذ التأثير أبعد بـ <code>blur(20px) saturate(180%)</code> مع ظل مدمج. صنف <code>.glass-header</code> يستخدم <code>blur(16px) saturate(160%)</code> مع تراكب شبه شفاف بقيمة <code>rgba(8,9,12,0.75)</code> لرأسية الصفحة.
</p>

<div class="subsection">
    <div class="subsection-title">تراكيب Overlay</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة (داكن)</th><th>القيمة (فاتح)</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--overlay</code></td><td>rgba(8,9,12,0.75)</td><td>rgba(0,0,0,0.30)</td><td>التراكب الأساسي للنوافذ المنبثقة</td></tr>
<tr><td><code>--overlay-secondary</code></td><td>rgba(10,10,13,0.60)</td><td>rgba(0,0,0,0.25)</td><td>تراكب ثانوي للقوائم</td></tr>
</tbody>
</table>

<div class="callout">
    <div class="callout-title">ملاحظة على الأداء</div>
    <div class="callout-body">تأثير <code>backdrop-filter</code> يمكن أن يكون مكلفًا على الأجهزة المنخفضة. استخدمه بحذر على العناصر التي تتحرك أو تتغير كثيرًا. الأصناف الجاهزة <code>.glass-card</code> و <code>.vx-glass</code> محسّنة لأداء أفضل.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 08 — الأيقونات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-08",
            "title": "الأيقونات",
            "content": """
<p class="body-text">
نظام الأيقونات في فيكسور V5 يعتمد بالكامل على مكتبة <strong>lucide-react</strong> (الإصدار 0.575.0). هذه المكتبة توفر أكثر من 1000 أيقونة خطية (Stroke-based) بخط موحد وسلوك متسق. يتم استيراد كل أيقونة باسمها من مكتبة lucide-react مباشرة. جميع الأيقونات تُعرض بخط ثابت مقداره <code>strokeWidth={1.5}</code> كقيمة افتراضية، مع خيار تعديل السماكة حسب الحاجة.
</p>
<div class="subsection">
    <div class="subsection-title">أحجام الأيقونات المعتمدة</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الحجم</th><th>القيمة</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td>صغير</td><td>14px</td><td>داخل الأزرار والطوابع الصغيرة</td></tr>
<tr><td>قياسي</td><td>16px</td><td>العناصر التفاعلية، القوائم</td></tr>
<tr><td>متوسط</td><td>20px</td><td>أيقونات التنقل، العناوين الفرعية</td></tr>
<tr><td>كبير</td><td>24px</td><td>الأيقونات البارزة، حالات فارغة</td></tr>
<tr><td>كبير جدًا</td><td>32px</td><td>أيقونات الحالات الرئيسية، الأزرار الكبيرة</td></tr>
<tr><td>عرضي</td><td>48px+</td><td>صفحات الحالات الفارغة، الرسوم التوضيحية</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">قواعد استخدام الأيقونات</div>
</div>
<ul class="vixor-list">
<li><strong>التسمية مطلوبة</strong>: لا تستخدم أيقونة وحدها كزر إجراء بدون تسمية نصية. الأيقونة + النص معًا توفر وضوحًا أفضل خاصة للمستخدمين الجدد.</li>
<li><strong>الاتجاه الثابت</strong>: جميع الأيقونات تُعرض باتجاه LTR حتى في وضع RTL. اتجاه الأيقونة لا يتغير مع اتجاه النص.</li>
<li><strong>اللون التكيفي</strong>: استخدم <code>currentColor</code> دائمًا حتى تتكيف الأيقونة مع لون النص المحيط. لا تحدد ألوانًا ثابتة للأيقونات.</li>
<li><strong>الأيقونات الدلالية</strong>: للألوان الدلالية (صعود/هبوط)، أضف أيقونة <code>TrendingUp</code> بلون <code>--bullish</code> أو <code>TrendingDown</code> بلون <code>--bearish</code>.</li>
<li><strong>الأيقونات التفاعلية</strong>: أضف تأثير <code>transition: color var(--transition-fast)</code> وغيّر اللون عند التمرير.</li>
</ul>
<div class="callout callout-success">
    <div class="callout-title">اختيار الأيقونة المناسبة</div>
    <div class="callout-body">الأيقونة يجب أن تكون واضحة المعنى بدون نص. إذا احتجت إلى نص لتوضيح ما تفعله الأيقونة، فهذه علامة على أنك بحاجة إلى أيقونة مختلفة. استخدم أيقونات لوسيدي الموحدة فقط ولا تخلط مكتبات مختلفة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 09 — الرسوم التوضيحية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-09",
            "title": "الرسوم التوضيحية",
            "content": """
<p class="body-text">
نظام الرسوم التوضيحية في فيكسور V5 يوفر إطارًا منظمًا لتصميم الصور المرئية المستخدمة في الحالات الفارغة، رسائل الخطأ، وشاشات الترحيب. جميع الرسوم التوضيحية تستخدم أسلوبًا خطيًا متسقًا يتوافق مع أسلوب أيقونات lucide-react. الألوان المستخدمة في الرسوم تتبع نظام الألوان الدلالي في فيكسور: النيلي للعناصر العامة، والأخضر للنجاح، والأحمر للخطأ، والعنبر للانتظار.
</p>
<div class="subsection">
    <div class="subsection-title">أنواع الرسوم التوضيحية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>النوع</th><th>الحجم</th><th>الألوان</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td>حالة فارغة</td><td>120-160px</td><td>نيلي + رمادي</td><td>لا توجد بيانات، لا توجد نتائج</td></tr>
<tr><td>رسالة خطأ</td><td>80-120px</td><td>أحمر + رمادي</td><td>فشل الاتصال، خطأ في الطلب</td></tr>
<tr><td>رسالة نجاح</td><td>80-120px</td><td>أخضر + رمادي</td><td>تم بنجاح، اكتمل العملية</td></tr>
<tr><td>شاشة ترحيب</td><td>200-280px</td><td>نيلي + ألوان متعددة</td><td>الشاشة الأولى، المقدمة</td></tr>
<tr><td>توضيح تعليمي</td><td>60-80px</td><td>عنبر + رمادي</td><td>نصائح، تعليمات مختصرة</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">قواعد التصميم</div>
</div>
<ul class="vixor-list">
<li><strong>الأسلوب الخطي</strong>: جميع الرسوم تستخدم خطوطًا بسماكة <code>1.5-2px</code> متناسقة مع أيقونات lucide.</li>
<li><strong>الألوان المحدودة</strong>: لا تزيد عن 3 ألوان في الرسم الواحد. لون أساسي دلالي + لون رمادي للتفاصيل + لون الخلفية.</li>
<li><strong>الشفافية</strong>: استخدم تعتيم <code>opacity: 0.3-0.5</code> للعناصر الخلفية في الرسم لإضافة عمق.</li>
<li><strong>التوافق مع الوضعين</strong>: الرسوم يجب أن تعمل في الوضع الداكن والفاتح. استخدم ألوانًا من نظام الرموز بدلاً من ألوان ثابتة.</li>
<li><strong>الأبعاد المتجاوبة</strong>: استخدم SVG مع <code>viewBox</code> لتعريف الأبعاد النسبية. تطبيق <code>width: 100%; max-width: Xpx</code> للتحكم في الحجم.</li>
</ul>

<div class="callout">
    <div class="callout-title">التوليد عبر الذكاء الاصطناعي</div>
    <div class="callout-body">يمكن استخدام MOXI (مساعد فيكسور الذكي) لتوليد رسوم توضيحية مخصصة. في هذه الحالة، يجب تمرير وصف يحدد الأسلوب الخطي والألوان المطلوبة لتوليد رسم متسق مع بقية المنظومة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 10 — الرسوم البيانية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-10",
            "title": "الرسوم البيانية",
            "content": """
<p class="body-text">
نظام الرسوم البيانية في فيكسور V5 يعتمد على مكتبتين أساسيتين: <strong>lightweight-charts</strong> (الإصدار 5.2.0) من TradingView للرسوم البيانية المالية الاحترافية، و <strong>recharts</strong> (الإصدار 2.15.4) للرسوم الإحصائية والتحليلية. كلا المكتبتين مُهيأتان لتعمل مع نظام ألوان فيكسور الداكن كافتراضي.
</p>
<div class="subsection">
    <div class="subsection-title">مكتبة lightweight-charts</div>
</div>
<p class="body-text">
تُستخدم لعرض الشموع اليابانية (Candlestick)، خطوط الأسعار، ومناطق التداول. تدعم التكبير والسحب والتفاعل المباشر. ألوان الشموع تتطابق تلقائيًا مع ألوان الإشارة: الشموع الصاعدة تستخدم <code>#22D3A6</code> (bullish) والهبوطية تستخدم <code>#FB4667</code> (bearish). يمكن إضافة خطوط مستوى TP1 و TP2 و TP3 بألوان التدرج المحددة.
</p>

<div class="subsection">
    <div class="subsection-title">لوحة ألوان الرسوم البيانية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--color-chart-1</code></td><td>#6366F1</td><td>السلسلة البيانية الأولى (أساسي)</td></tr>
<tr><td><code>--color-chart-2</code></td><td>#8C9EFF</td><td>السلسلة البيانية الثانية</td></tr>
<tr><td><code>--color-chart-3</code></td><td>#7B61FF</td><td>السلسلة البيانية الثالثة</td></tr>
<tr><td>صعود</td><td>#22D3A6</td><td>شموع صاعدة، مناطق ربح</td></tr>
<tr><td>هبوط</td><td>#FB4667</td><td>شموع هابطة، مناطق خسارة</td></tr>
<tr><td>TP1</td><td>#22D3A6</td><td>خط الهدف الأول</td></tr>
<tr><td>TP2</td><td>#26D07C</td><td>خط الهدف الثاني</td></tr>
<tr><td>TP3</td><td>#6EE7B7</td><td>خط الهدف الثالث</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">أنماط الرسوم البيانية</div>
</div>
<p class="body-text">
يعتمد فيكسور عدة أنماط للرسوم البيانية حسب السياق. نمط الشموع اليابانية (<code>candlestick</code>) للرسم البياني الرئيسي. نمط المساحة (<code>area</code>) للرسوم البيانية الإحصائية التي تعرض الاتجاهات والتراكمات. نمط الأعمدة (<code>bar</code>) للمقارنات والأحجام. نمط الخطوط (<code>line</code>) للمؤشرات والبيانات المتتالية. كل نمط يستخدم ألوانًا من لوحة الرسوم البيانية مع حواف ناعمة عند الحاجة.
</p>

<div class="subsection">
    <div class="subsection-title">النصوص على الرسوم البيانية</div>
</div>
<p class="body-text">
جميع النصوص على الرسوم البيانية (محاور، تلميحات، وسائل إيضاح) تستخدم خط Inter بالأحجام المصغرة (11-12px). الأرقام المالية تستخدم JetBrains Mono. لون النص على الرسوم يتطابق مع <code>--text-secondary</code> في الوضع الداكن. التلميحات (Tooltips) تستخدم خلفية <code>--surface-elevated</code> مع حد <code>--border</code>.
</p>

<div class="callout callout-warn">
    <div class="callout-title">أداء الرسوم البيانية</div>
    <div class="callout-body">عند عرض أكثر من 1000 نقطة بيانات، استخدم خاصية <code>visible_range</code> في lightweight-charts لتقييد النقاط المرئية. على الجوال، قلل عدد النقاط إلى 500 كحد أقصى للحفاظ على سلاسة التفاعل.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 11 — البطاقات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-11",
            "title": "البطاقات",
            "content": """
<p class="body-text">
نظام البطاقات في فيكسور V5 يوفر عدة أنماط متنوعة مصممة لتغطية جميع حالات الاستخدام في منصة التداول. كل نمط له أصناف CSS جاهزة يمكن تطبيقها مباشرة. البطاقات هي اللبنة الأساسية لبناء واجهات المستخدم، وتُستخدم لعرض البيانات، حاويات الإجراءات، والمحتوى المنظم.
</p>
<div class="subsection">
    <div class="subsection-title">أنواع البطاقات</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الصنف</th><th>الوصف</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>.vixor-card</code></td><td>بطاقة قياسية بخلفية صلبة وحد نظيف</td><td>الحاويات العامة، محتوى المعلومات</td></tr>
<tr><td><code>.vx-card</code></td><td>بطاقة مميزة مع تدرج خفيف واستدارة 20px</td><td>البطاقات التفاعلية، المحتوى البارز</td></tr>
<tr><td><code>.glass-card</code></td><td>بطاقة زجاجية مع <code>backdrop-filter: blur(8px)</code></td><td>العناصر فوق الرسوم البيانية</td></tr>
<tr><td><code>.vx-glass</code></td><td>تأثير زجاجي متقدم مع <code>blur(20px) saturate(180%)</code></td><td>التراكبات البارزة</td></tr>
<tr><td><code>.terminal-card</code></td><td>بطاقة نمط الطرفية مع حدود دقيقة</td><td>بيانات التداول، المحطات الطرفية</td></tr>
<tr><td><code>.terminal-card-accent</code></td><td>بطاقة طرفية مع حدود ملونة على اليسار</td><td>تنبيهات التداول، التحليلات</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">بطاقات الإشارات (Scenario Cards)</div>
</div>
<p class="body-text">
فيكسور يوفر ثلاثة أنواع من بطاقات السيناريو لعرض التحليلات. <code>.scenario-primary</code> بحد أيسر بلون أساسي للسيناريو الرئيسي. <code>.scenario-alternative</code> بلون معلوماتي للسيناريو البديل. <code>.scenario-counter</code> بحد أحمر للسيناريو العكسي. في وضع RTL، يتم تبديل الاتجاه تلقائيًا: الحدود تنتقل إلى الجانب الأيمن والتدرج ينعكس بزاوية <code>225deg</code>.
</p>

<div class="subsection">
    <div class="subsection-title">بطاقات البيانات (Data Grid Cards)</div>
</div>
<p class="body-text">
صنف <code>.data-grid</code> يوفر شبكة بيانات مدمجة حيث تكون الخلايا مفصولة بخط حدود 1 بكسل. الخلفية العامة للشبكة تأخذ لون الحدود <code>--border</code>، بينما كل خلية تأخذ خلفية البطاقة <code>--card</code>. هذا الأسلوب يوفر فصلًا واضحًا بين البيانات بدون حدود ثقيلة.
</p>

<div class="subsection">
    <div class="subsection-title">بطاقات الإحصائيات (Stat Cards)</div>
</div>
<p class="body-text">
بطاقات الإحصائيات تستخدم نظام عرض البيانات المميز: <code>.vx-stat-label</code> للتسمية الصغيرة بأحرف كبيرة وتباعد <code>0.08em</code>، <code>.vx-stat-value</code> للقيمة الأساسية بخط أحادي عرض 16px ووزن 700، و <code>.vx-stat-sub</code> للتغيير الفرعي. يتوفر أيضًا صنف <code>.vx-price-up</code> للأسعار المرتفعة و <code>.vx-price-down</code> للمنخفضة.
</p>
"""
        },

        # ─────────────────────────────────────────────
        # 12 — الجداول
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-12",
            "title": "الجداول",
            "content": """
<p class="body-text">
نظام الجداول في فيكسور V5 مصمم خصيصًا لعرض البيانات المالية بكفاءة وسهولة قراءة. جميع الجداول تتبع نمطًا موحدًا مع رأس ثابت، صفوف تفاعلية، وأرقام بخط أحادي عرض. يتم استخدام الجداول في عدة أماكن حاسمة: قائمة الصفقات، سجل الأوامر، قائمة الأصول، وتقارير الأداء.
</p>
<div class="subsection">
    <div class="subsection-title">هيكل الجدول المعياري</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>العنصر</th><th>التنسيق</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td>الرأس (<code>thead th</code>)</td><td>خلفية <code>--bg-elevated</code>، حد سفلي 2px بلون أساسي</td><td>ثابت دائمًا، نص بخط 600</td></tr>
<tr><td>الصفوف (<code>tbody tr</code>)</td><td>حد سفلي <code>--border-subtle</code></td><td>تفاعل عند التمرير</td></tr>
<tr><td>الخلايا (<code>tbody td</code>)</td><td>حشوة <code>10px 14px</code>، محاذاة يمنى</td><td>محاذاة رقمية للأرقام</td></tr>
<tr><td>الأرقام</td><td>خط JetBrains Mono، tabular-nums</td><td>محاذاة أفقية ثابتة</td></tr>
</tbody>
</table>

<div class="subsection">
            <div class="subsection-title">قواعد عرض البيانات في الجداول</div>
        </div>
<ul class="vixor-list">
<li>الأرقام المالية (أسعار، أحجام، أرباح) يجب أن تُعرض بخط JetBrains Mono مع <code>tabular-nums</code> وتباعد <code>-0.02em</code>.</li>
<li>الألوان الدلالية تُطبق مباشرة على قيم الأرباح والخسائر: أخضر للإيجابي وأحمر للسلبي.</li>
<li>التواريخ والأوقات تُعرض بالنص المصغر (<code>--text-micro</code>) بلون <code>--text-muted</code>.</li>
<li>الحالات (مفتوح/مغلق/معلق) تُعرض كطوابع ملونة باستخدام أصناف <code>.vx-badge</code> المناسبة.</li>
<li>العملات والرموز تُعرض بأحرف كبيرة مع أيقونة العملة بجانبها.</li>
<li>الأعمدة القابلة للترتيب تُظهر سهم فرز بجانب العنوان عند التمرير.</li>
</ul>

<div class="callout callout-success">
    <div class="callout-title">الجداول المتجاوبة</div>
    <div class="callout-body">على الشاشات الصغيرة، استخدم <code>.data-grid</code> بدلاً من جدول HTML تقليدي. هذا يحول كل صف إلى بطاقة عمودية تُعرض بشكل أفضل على الشاشات الضيقة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 13 — الأزرار
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-13",
            "title": "الأزرار",
            "content": """
<p class="body-text">
نظام الأزرار في فيكسور V5 يوفر مجموعة شاملة من الأصناف الجاهزة المصممة لتغطية جميع حالات الاستخدام في منصة التداول. يعتمد النظام على صنف أساسي <code>.vx-btn</code> يحدد السلوك المشترك، مع أصناف معدّلة تضيف الألوان والحالات الخاصة. جميع الأزرار تتضمن تأثير الضغط <code>scale(0.96)</code> وتأثير الموجة (Ripple) عند النقر.
</p>
<div class="subsection">
    <div class="subsection-title">أصناف الأزرار الأساسية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الصنف</th><th>اللون</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>.vx-btn-primary</code></td><td>تدرج نيلي + توهج</td><td>الإجراء الأساسي، تأكيد، إنشاء</td></tr>
<tr><td><code>.vx-btn-bullish</code></td><td>تدرج أخضر + ظل أخضر</td><td>الشراء، فتح صفقة شراء</td></tr>
<tr><td><code>.vx-btn-bearish</code></td><td>تدرج أحمر + ظل أحمر</td><td>البيع، فتح صفقة بيع</td></tr>
<tr><td><code>.vx-btn-ghost</code></td><td>شفاف + حد</td><td>الإجراءات الثانوية، الإلغاء</td></tr>
<tr><td><code>.btn-buy</code></td><td>أخضر صلب + نص داكن</td><td>زر الشراء السريع (النمط القديم)</td></tr>
<tr><td><code>.btn-sell</code></td><td>شفاف + حد + نص أبيض</td><td>زر البيع السريع (النمط القديم)</td></tr>
<tr><td><code>.btn-primary</code></td><td>نيلي صلب + نص أبيض</td><td>الزر الأساسي (النمط القديم)</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">أحجام الأزرار</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الصنف</th><th>الارتفاع</th><th>الحشوة</th><th>حجم الخط</th><th>الاستدارة</th></tr>
</thead>
<tbody>
<tr><td><code>.vx-btn</code> (قياسي)</td><td>40px</td><td>0 16px</td><td>14px</td><td>--radius-md</td></tr>
<tr><td><code>.vx-btn-sm</code></td><td>32px</td><td>0 12px</td><td>12px</td><td>--radius-sm</td></tr>
<tr><td><code>.vx-btn-lg</code></td><td>48px</td><td>0 24px</td><td>15px</td><td>--radius-lg</td></tr>
<tr><td><code>.btn-buy/.btn-sell</code></td><td>36px</td><td>0 16px</td><td>14px</td><td>--radius-md</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">حالات الأزرار</div>
</div>
<p class="body-text">
كل زر يدعم أربع حالات أساسية. <strong>السكون</strong>: المظهر الافتراضي مع خلفية وحدود محددة. <strong>التمرير</strong>: تأثير <code>filter: brightness(1.1)</code> و <code>box-shadow</code> أكبر أو <code>border-color</code> أغمق. <strong>الضغط</strong>: <code>transform: scale(0.96)</code> مع ظهور تأثير الموجة. <strong>معطل</strong>: <code>opacity: 0.4</code> مع <code>cursor: not-allowed</code> وتعطيل التحويلات. جميع التحويلات تستخدم <code>--transition-normal</code> (240ms) مع استثناء حالة الضغط التي تستخدم <code>100ms</code> لاستجابة فورية.
</p>
<div class="callout callout-warn">
    <div class="callout-title">لا تخلط الأنماط</div>
    <div class="callout-body">لا تخلط بين أنماط الأزرار القديمة (<code>.btn-buy</code>) والجديدة (<code>.vx-btn-bullish</code>) في نفس الشاشة. اختر نظامًا واحدًا واستخدمه بشكل متسق. الأنماط الجديدة <code>.vx-btn-*</code> هي المعتمدة للمكونات الحديثة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 14 — حقول الإدخال
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-14",
            "title": "حقول الإدخال",
            "content": """
<p class="body-text">
نظام حقول الإدخال في فيكسور V5 يوفر تصميمًا موحدًا لجميع أنواع المدخلات: النصية، الرقمية، قوائم الاختيار، ومناطق النصوص. الصنف الأساسي <code>.vx-input</code> يحدد المظهر المشترك لجميع الحقول. يتميز بخلفية شبه شفافة <code>rgba(255,255,255,0.04)</code> وحد بلون <code>--border</code> وزوايا استدارة <code>--radius-md</code> (12px).
</p>
<div class="subsection">
    <div class="subsection-title">حالات حقل الإدخال</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الحالة</th><th>الحدود</th><th>الخلفية</th><th>الظل</th></tr>
</thead>
<tbody>
<tr><td>السكون</td><td>--border</td><td>rgba(255,255,255,0.04)</td><td>بدون</td></tr>
<tr><td>التمرير</td><td>--border-hover</td><td>rgba(255,255,255,0.04)</td><td>بدون</td></tr>
<tr><td>التركيز</td><td>--primary</td><td>rgba(255,255,255,0.06)</td><td>0 0 0 3px var(--color-ring)</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المواصفات الفنية لـ .vx-input</div>
</div>
<div class="code-block">.vx-input {
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);      /* 12px */
  color: var(--color-foreground);
  font-family: var(--font-sans);
  font-size: 14px;
  height: 40px;
  padding: 0 12px;
  transition: border-color var(--transition-fast),
              box-shadow var(--transition-fast),
              background var(--transition-fast);
  outline: none;
  width: 100%;
}</div>

<div class="subsection">
    <div class="subsection-title">النص التلميحي</div>
</div>
<p class="body-text">
نص التلميح (Placeholder) يُعرض بلون <code>--text-muted</code> بخط Inter. يجب أن يكون وصفيًا ويوضح ما هو المتوقع من المستخدم. للحقول المالية، استخدم نصًا يوضح الوحدة والتنسيق مثل "أدخل السعر بالدولار" بدلاً من "السعر". للحقول المطلوبة، لا تعتمد على التلميح فقط — استخدم تسمية واضحة فوق الحقل مع علامة النجمة (*) الحمراء.
</p>

<div class="subsection">
    <div class="subsection-title">أنواع خاصة</div>
</div>
<p class="body-text">
للحقول الرقمية المالية، أضف صنف <code>.text-mono</code> لعرض الأرقام بخط JetBrains Mono مع محاذاة رقمية ثابتة. لقوائم الاختيار المنسدلة، استخدم صنف <code>.vixor-select</code> الذي يضيف سهمًا مخصصًا على الجانب الأيسر في وضع RTL. لمناطق النصوص الكبيرة، استخدم نفس أنماط <code>.vx-input</code> مع إزالة <code>height</code> ثابت وإضافة <code>min-height: 80px</code> و <code>resize: vertical</code>.
</p>
"""
        },

        # ─────────────────────────────────────────────
        # 15 — النماذج
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-15",
            "title": "النماذج",
            "content": """
<p class="body-text">
نظام النماذج في فيكسور V5 يعتمد على مكتبة <strong>react-hook-form</strong> لإدارة حالة النموذج وتحقق المدخلات، مع <strong>zod</strong> لتعريف مخططات التحقق (Validation Schemas). هذا المزيج يوفر أداءً عاليًا مع تجربة مستخدم سلسة. كل نموذج يتكون من ثلاث طبقات: واجهة المستخدم (المكونات)، منطق التحقق (مخطط zod)، وإدارة الحالة (react-hook-form).
</p>
<div class="subsection">
    <div class="subsection-title">هيكل النموذج القياسي</div>
</div>
<ol class="vixor-ol">
<li>تعريف مخطط التحقق باستخدام zod: <code>z.object({ field: z.string().min(1) })</code></li>
<li>إنشاء دالة <code>useForm</code> مع ربط المخطط: <code>useForm({ resolver: zodResolver(schema) })</code></li>
<li>بناء واجهة المستخدم مع <code>register()</code> لكل حقل و <code>handleSubmit()</code> للنموذج</li>
<li>عرض أخطاء التحقق تحت كل حقل بلون <code>--bearish</code> مع أيقونة توضيحية</li>
</ol>

<div class="subsection">
    <div class="subsection-title">قواعد تصميم النماذج</div>
</div>
<ul class="vixor-list">
<li><strong>التسميات</strong>: فوق كل حقل، بخط <code>--text-caption</code> (12px) ووزن 500. للحقول المطلوبة أضف <code>*</code> بلون <code>--bearish</code>.</li>
<li><strong>المسافات</strong>: <code>--space-sm</code> (8px) بين التسمية والحقل، <code>--space-md</code> (12px) بين الحقل ورسالة الخطأ، <code>--space-lg</code> (16px) بين المجموعات.</li>
<li><strong>أزرار الإجراء</strong>: في أسفل النموذج مع <code>--space-xl</code> (24px) كفجوة عن الحقل الأخير.</li>
<li><strong>رسائل الخطأ</strong>: نص صغير (11px) بلون <code>--bearish</code> مع أيقونة <code>AlertCircle</code> بحجم 12px.</li>
<li><strong>رسالة النجاح</strong>: بعد الإرسال الناجح، اعرض تأثير <code>.vx-animate-fade-up</code> مع رسالة بلون <code>--bullish</code>.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">أنماط النماذج المتقدمة</div>
</div>
<p class="body-text">
للنماذج متعددة الخطوات، استخدم مكون <code>Stepper</code> مع أرقام الخطوات ودليل التقدم. كل خطوة تُعرض في بطاقة <code>.vixor-card</code> منفصلة. للنماذج المعقدة (مثل إعدادات الاستراتيجية)، قسّم الحقول إلى مجموعات منطقية مع عناوين فرعية و فواصل <code>.vx-divider</code>. للحقول التابعة (مثل تغيير نوع الترتيب يُظهر حقولًا إضافية)، استخدم تأثير <code>.collapsible-content</code> مع حركة سلسة.
</p>

<div class="callout callout-success">
    <div class="callout-title">أداء النماذج</div>
    <div class="callout-body">react-hook-form لا يعيد التقديم عند كل تغيير حقل، مما يحسن الأداء بشكل كبير مقارنة بالحالة المُدارَة التقليدية. استخدم <code>mode: "onChange"</code> للتحقق الفوري أو <code>mode: "onBlur"</code> للتحقق عند مغادرة الحقل.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 16 — مكونات الذكاء الاصطناعي
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-16",
            "title": "مكونات الذكاء الاصطناعي",
            "content": """
<p class="body-text">
نظام مكونات الذكاء الاصطناعي في فيكسور V5 يوفر إطارًا متكاملًا لعرض استجابات MOXI (مساعد فيكسور الذكي) والتفاعل مع الوكيل. يتضمن النظام ثلاثة مكونات رئيسية: صورة MOXI الرمزية، تخطيط استجابة الوكيل، وتراكب المدرب (Coach Overlay). جميع المكونات مصممة لتوفير تجربة محادثة سلسة ومتكاملة مع الهوية البصرية لفيكسور.
</p>
<div class="subsection">
    <div class="subsection-title">صورة MOXI الرمزية</div>
</div>
<p class="body-text">
صورة MOXI الرمزية هي العنصر المرئي الرئيسي لمكونات الذكاء الاصطناعي. تُعرض كدائرة مع تأثير توهج نيلي خفيف يشير إلى أن الاستجابة من الذكاء الاصطناعي. حجم الصورة الرمزية القياسي هو <code>32px</code> للرسائل العادية و <code>40px</code> للعناوين والرأسية. عند معالجة الطلب، تُعرض حلقة تحميل متحركة حول الصورة الرمزية بلون <code>--primary-glow</code> (<code>#818CF8</code>).
</p>

<div class="subsection">
    <div class="subsection-title">تخطيط استجابة الوكيل</div>
</div>
<p class="body-text">
استجابات MOXI تُعرض في تخطيط محادثة موحد. فقعة الرسالة تأخذ خلفية <code>--surface-elevated</code> (<code>#16171C</code>) مع حدود علوية ملونة بلون أساسي. الأرقام المالية داخل الاستجابة تُعرض بخط JetBrains Mono. أزرار الإجراء السريعة (Quick Actions) تُعرض أسفل الاستجابة كأزرار <code>.vx-btn-ghost</code> صغيرة. يستخدم تأثير <code>.vx-animate-fade-up</code> عند ظهور الاستجابة الجديدة.
</p>

<div class="subsection">
    <div class="subsection-title">تراكب المدرب (Coach Overlay)</div>
</div>
<p class="body-text">
تراكب المدرب هو مكون متقدم يعرض نصائح وتوجيهات MOXI في سياق المحتوى الحالي. يستخدم تراكب <code>.vx-overlay</code> مع بطاقة <code>.vx-glass</code> في المركز. يحتوي على صورة MOXI الرمزية، نص التوجيه بخط <code>--text-body</code>، وأزرار الإجراء. يظهر بتأثير <code>.vx-animate-scale-in</code> ويُغلق بتأثير عكسي. يمكن تقديمه على أي شاشة بدون مقاطعة تدفق المستخدم.
</p>

<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">حالة التحميل</div>
        <div class="info-card-body">عند انتظار استجابة MOXI، اعرض ثلاث نقاط متحركة (Typing Indicator) بلون <code>--primary-glow</code>. لا تستخدم شريط تقدم أو رسائل نصية مثل "جاري التفكير". النقاط المتحركة تُشير إلى المعالجة بطريقة بصرية أنيقة.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">حالة الخطأ</div>
        <div class="info-card-body">في حالة فشل استجابة الذكاء الاصطناعي، اعرض رسالة خطأ داخل فقعة الرسالة بلون <code>--bearish</code> مع زر "إعادة المحاولة" كـ <code>.vx-btn-ghost</code>. لا تُظهر نافذة منبثقة خطأ.</div>
    </div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 17 — نظام الحركة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-17",
            "title": "نظام الحركة",
            "content": """
<p class="body-text">
نظام الحركة في فيكسور V5 يوفر إطارًا متكاملًا للتحكم في التأثيرات الحركية عبر المنظومة. يعتمد على أربعة مستويات سرعة أساسية مع منحنيات تباطؤ (Easing Curves) محددة مسبقًا. يتم تعريف جميع الرموز في كتلة <code>@theme inline</code>. النظام يدعم تنفيذين: CSS Keyframes المدمجة في <code>styles.css</code> ومكتبة framer-motion للتأثيرات المتقدمة.
</p>
<div class="subsection">
    <div class="subsection-title">رموز السرعة (Motion Tokens)</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>المدة</th><th>المنحنى</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td><code>--transition-instant</code></td><td>100ms</td><td>ease</td><td>ردود الأفعال الفورية، أزرار الضغط</td></tr>
<tr><td><code>--transition-fast</code></td><td>180ms</td><td>ease</td><td>التمرير، تبديل الحالات</td></tr>
<tr><td><code>--transition-base</code></td><td>240ms</td><td>ease-in-out</td><td>التحويلات الأساسية، إظهار/إخفاء</td></tr>
<tr><td><code>--transition-slow</code></td><td>400ms</td><td>ease-out</td><td>الظهور التدريجي، الحركات المعقدة</td></tr>
<tr><td><code>--transition-normal</code></td><td>240ms</td><td>ease-in-out</td><td>الاسم المستعار (مستخدم في معظم المكونات)</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">منحنيات التباطؤ (Easing Curves)</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الرمز</th><th>القيمة</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td><code>--ease-standard</code></td><td>cubic-bezier(0.4, 0, 0.2, 1)</td><td>المنحنى القياسي — يبدأ بسرعة ويتباطأ</td></tr>
<tr><td><code>--ease-decelerate</code></td><td>cubic-bezier(0.16, 1, 0.3, 1)</td><td>التباطؤ — يدخل بسرعة ويتوقف بسلاسة</td></tr>
<tr><td><code>--ease-accelerate</code></td><td>cubic-bezier(0.4, 0, 1, 1)</td><td>التسارع — يبدأ ببطء ويسرع</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">تأثيرات CSS المدمجة</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>اسم المفتاح</th><th>الصنف</th><th>التأثير</th></tr>
</thead>
<tbody>
<tr><td><code>vx-fade-up</code></td><td><code>.vx-animate-fade-up</code></td><td>ظهور من الأسفل + شفافية</td></tr>
<tr><td><code>vx-fade-in</code></td><td><code>.vx-animate-fade-in</code></td><td>ظهور تدريجي فقط</td></tr>
<tr><td><code>vx-scale-in</code></td><td><code>.vx-animate-scale-in</code></td><td>ظهور مع تكبير من 95%</td></tr>
<tr><td><code>vx-slide-in-right</code></td><td>—</td><td>انزلاق من اليمين</td></tr>
<tr><td><code>vx-shimmer-premium</code></td><td><code>.vx-shimmer</code></td><td>تأثير لمعان متحرك</td></tr>
<tr><td><code>vx-glow-pulse</code></td><td>—</td><td>نبض توهج نيلي</td></tr>
<tr><td><code>vx-float</code></td><td>—</td><td>طفو عمودي (±6px)</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">نظام التتابع (Stagger System)</div>
</div>
<p class="body-text">
صنف <code>.vx-stagger</code> يوفر نظام تتابع تلقائي لعناصر الأبناء. كل عنصر يظهر بتأخير <code>50ms</code> إضافي عن سابقه (أول عنصر: 0ms، الثاني: 50ms، العاشر: 450ms). هذا يضمن ظهورًا متسلسلًا أنيقًا لقوائم البطاقات والعناصر المتعددة. يدعم حتى 10 عناصر فرعية.
</p>

<div class="subsection">
    <div class="subsection-title">استخدام framer-motion</div>
</div>
<p class="body-text">
للتأثيرات المتقدمة التي تحتاج تفاعلًا مع حالة المكون، استخدم مكتبة framer-motion. الأنماط الشائعة تشمل <code>AnimatePresence</code> لإظهار/إخفاء العناصر مع حركة الخروج، <code>motion.div</code> مع <code>layout</code> لإعادة الترتيب المتحركة، و <code>useSpring</code> للحركات الفيزيائية. جميع مدد framer-motion يجب أن تستخدم نفس رموز السرعة المعرّفة أعلاه.
</p>

<div class="callout callout-warn">
    <div class="callout-title">قاعدة الأداء</div>
    <div class="callout-body">استخدم فقط <code>transform</code> و <code>opacity</code> في الحركات. لا تحرك <code>width</code> أو <code>height</code> أو <code>top</code> أو <code>left</code> مباشرة لأنها تُحفّز إعادة حساب التخطيط (Layout Recalculation) مما يؤثر سلبًا على الأداء.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 18 — السمة الداكنة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-18",
            "title": "السمة الداكنة",
            "content": """
<p class="body-text">
السمة الداكنة هي <strong>الوضع الافتراضي</strong> في فيكسور V5 ومصممة لتكون تجربة التداول الأساسية. تُعرّف جميع متغيرات السمة الداكنة في <code>:root</code> في ملف <code>src/styles.css</code>. التصميم الداكن مبني على ثلاث طبقات عمق متدرجة توفر إحساسًا بالعمق المكاني الطبيعي. نظام الألوان محسّن لتقليل إجهاد العين أثناء جلسات التداول الطويلة مع الحفاظ على وضوح البيانات المالية.
</p>
<div class="subsection">
    <div class="subsection-title">طبقات العمق الثلاث</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الطبقة</th><th>اللون</th><th>الرمز</th><th>الاستخدام</th></tr>
</thead>
<tbody>
<tr><td>القاعدة</td><td>#08090C</td><td><code>--background</code></td><td>خلفية التطبيق الكاملة</td></tr>
<tr><td>البطاقات</td><td>#101114</td><td><code>--card</code></td><td>البطاقات، الحاويات، المحتوى</td></tr>
<tr><td>المرتفعة</td><td>#16171C</td><td><code>--surface-elevated</code></td><td>المنبثقات، التلميحات، النوافذ</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">الحدود والفواصل</div>
</div>
<p class="body-text">
في الوضع الداكن، الحدود تستخدم ألوانًا شبه شفافة بيضاء بدلاً من ألوان رمادية صلبة. الحد الأساسي <code>--border</code> بقيمة <code>rgba(255,255,255,0.08)</code> يوفر فصلًا خفيفًا بين العناصر. الحد الدقيق <code>--border-subtle</code> بقيمة <code>rgba(255,255,255,0.04)</code> للفواصل الداخلية. عند التمرير، يتحول الحد إلى <code>--border-hover</code> بقيمة <code>rgba(255,255,255,0.15)</code> لإظهار التفاعل.
</p>

<div class="subsection">
    <div class="subsection-title">التراكبات</div>
</div>
<p class="body-text">
التراكب الأساسي <code>--overlay</code> بقيمة <code>rgba(8,9,12,0.75)</code> يُستخدم للنوافذ المنبثقة مع تأثير <code>backdrop-filter: blur(4px)</code>. التراكب الثانوي <code>--overlay-secondary</code> بقيمة <code>rgba(10,10,13,0.60)</code> للقوائم المنسدلة والألواح الجانبية. شريط السحب (Handle Bar) يستخدم <code>rgba(99,102,241,0.15)</code> بلون أساسي شبه شفاف.
</p>

<div class="subsection">
    <div class="subsection-title">التدرجات</div>
</div>
<p class="body-text">
التدرج الأساسي <code>--gradient-primary</code> ينتقل من <code>#6366F1</code> إلى <code>#818CF8</code> بزاوية 135 درجة. التدرج الصعودي <code>--gradient-bullish</code> ينتقل من <code>#22D3A62E</code> إلى <code>#22D3A605</code>. التدرج الهبوطي <code>--gradient-bearish</code> ينتقل من <code>#FB46672E</code> إلى <code>#FB466705</code>. تدرج الزجاج <code>--gradient-glass</code> ينتقل من <code>rgba(255,255,255,0.04)</code> إلى <code>rgba(255,255,255,0.01)</code>. تدرج الخلفية <code>--gradient-accent-bg</code> يوفر توهجًا شعاعيًا نيليًا خفيفًا في الزاوية العلوية اليسرى.
</p>

<div class="callout callout-success">
    <div class="callout-title">منع وميض السمة (FOUC Prevention)</div>
    <div class="callout-body">فيكسور يتضمن نصًا برمجيًا مضمّنًا (Inline Script) في <code>&lt;head&gt;</code> يكشف تفضيل السمة المحفوظ قبل تحميل CSS ويضبط <code>class="dark"</code> على عنصر <code>&lt;html&gt;</code> مباشرة. هذا يمنع وميض السمة الفاتحة قبل تحميل السمة الداكنة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 19 — السمة الفاتحة
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-19",
            "title": "السمة الفاتحة",
            "content": """
<p class="body-text">
السمة الفاتحة في فيكسور V5 مدعومة بالكامل عبر صنف <code>.light</code> المعرّف في <code>src/styles.css</code>. على عكس بعض التطبيقات التي تعتبر الوضع الفاتح ثانويًا، يعامل فيكسور كلا الوضعين بشكل متساوٍ مع تحويلات دقيقة لكل متغير لوني. الوضع الفاتح يستخدم خلفية بيضاء نقية مع حدود رمادية صلبة بدلاً من الشبه شفافة.
</p>
<div class="subsection">
    <div class="subsection-title">فروقات الألوان الأساسية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>العنصر</th><th>القيمة الداكنة</th><th>القيمة الفاتحة</th></tr>
</thead>
<tbody>
<tr><td>الخلفية</td><td>#08090C</td><td>#FFFFFF</td></tr>
<tr><td>البطاقة</td><td>#101114</td><td>#FFFFFF</td></tr>
<tr><td>السطح المرتفع</td><td>#16171C</td><td>#F5F5F7</td></tr>
<tr><td>النص الأساسي</td><td>#FFFFFF</td><td>#111827</td></tr>
<tr><td>النص الثانوي</td><td>#9498A8</td><td>#6B7280</td></tr>
<tr><td>النص الخافت</td><td>#565A66</td><td>#9CA3AF</td></tr>
<tr><td>الحد الأساسي</td><td>rgba(255,255,255,0.08)</td><td>#E5E7EB</td></tr>
<tr><td>الحد الدقيق</td><td>rgba(255,255,255,0.04)</td><td>#F3F4F6</td></tr>
<tr><td>اللون الأساسي</td><td>#6366F1</td><td>#6366F1 (ثابت)</td></tr>
<tr><td>الصعودي</td><td>#22D3A6</td><td>#059669</td></tr>
<tr><td>الهبوطي</td><td>#FB4667</td><td>#DC2626</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">التحويلات الخاصة</div>
</div>
<p class="body-text">
بعض المتغيرات تتحول بشكل مختلف بين الوضعين. ألوان الإشارة الدلالية (Bullish/Bearish) تصبح أغمق في الوضع الفاتح لضمان تباين كافٍ على الخلفية البيضاء: الصعودي يتحول من <code>#22D3A6</code> إلى <code>#059669</code> والهبوطي من <code>#FB4667</code> إلى <code>#DC2626</code>. الظلال تصبح أخف بكثير: الظل الساكن من <code>rgba(0,0,0,0.4)</code> إلى <code>rgba(0,0,0,0.08)</code>. التراكبات تصبح أفتح: من <code>rgba(8,9,12,0.75)</code> إلى <code>rgba(0,0,0,0.30)</code>.
</p>

<div class="subsection">
    <div class="subsection-title">الشبكة الدقيقة في الوضع الفاتح</div>
</div>
<p class="body-text">
في الوضع الفاتح، يتم تعطيل الشبكة الدقيقة بالكامل عبر <code>--bg-grid: none</code>. هذا لأن الخطوط الرمادية الدقيقة على خلفية بيضاء تُسبب تشتيتًا بصريًا بدلاً من إضافة عمق. صنف <code>.nocturne-bg</code> يتحول تلقائيًا ليُظهر فقط الخلفية البيضاء النقية بدون توهج أو شبكة. اللون الذهبي <code>--gold</code> والنيلي الأساسي <code>--primary</code> يبقيان ثابتين بين الوضعين لضمان استمرارية الهوية البصرية.
</p>

<div class="callout callout-warn">
    <div class="callout-title">اختبار كلا الوضعين</div>
    <div class="callout-body">عند بناء أي مكون جديد، اختبره في كلا الوضعين. تأكد أن التباين كافٍ لقراءة النصوص وأن الألوان الدلالية واضحة. استخدم دائمًا متغيرات CSS بدلاً من ألوان صلبة لضمان التحويل التلقائي بين الوضعين.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 20 — إرشادات العلامة التجارية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-20",
            "title": "إرشادات العلامة التجارية",
            "content": """
<p class="body-text">
العلامة التجارية لفيكسور (VIXOR) هي هوية بصرية شاملة تمتد من الشعار إلى تجربة المستخدم الكاملة. فيكسور يُعرّف نفسه كمنصة تداول ذكية مدعومة بالذكاء الاصطناعي، وهذا ينعكس في كل جانب من جوانب التصميم. العلامة التجارية تجمع بين الجدية المالية والابتكار التكنولوجي مع لمسات فاخرة تميزها عن منصات التداول التقليدية.
</p>
<div class="subsection">
    <div class="subsection-title">عناصر الهوية البصرية</div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">اللون الأساسي — النيلي</div>
        <div class="info-card-body">اللون النيلي <code>#6366F1</code> هو لون فيكسور الأساسي ويمثل الابتكار والتكنولوجيا. يُستخدم في الشعار، الأزرار الأساسية، الروابط، والعناصر التفاعلية. النسخة المُضيئة <code>#818CF8</code> تُستخدم للتوهج والتمييز.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">اللون الذهبي — التميز</div>
        <div class="info-card-body">اللون الذهبي <code>#F0C419</code> يُمثل التميز والميزات المميزة. يُستخدم للعناصر المدفوعة، شارات الاشتراك المميز، والحالات الخاصة. لا يُستخدم بكثرة للحفاظ على تأثيره البصري.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">الخلفية الداكنة — الاحترافية</div>
        <div class="info-card-body">الخلفية العميقة <code>#08090C</code> تُعطي إحساسًا بالاحترافية والتركيز. مستوحاة من منصات التداول الاحترافية وتُقلل إجهاد العين في جلسات التداول الطويلة.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">تأثير الزجاج — الفخامة</div>
        <div class="info-card-body">تأثير Glassmorphism مع <code>backdrop-filter</code> يضيف لمسة فاخرة. يُستخدم بحذر في العناصر البارزة فقط: رأسية الصفحة، البطاقات العائمة، وتراكبات MOXI.</div>
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">قواعد استخدام الشعار</div>
</div>
<ul class="vixor-list">
<li><strong>الشعار النصي</strong>: يُعرض بخط Inter بوزن 800 وحجم مناسب للسياق. لون الشعار هو <code>--text-primary</code> في الوضع الداكن.</li>
<li><strong>المساحة المحمية</strong>: لا تضع عناصر أخرى على بعد أقل من <code>--space-xl</code> (24px) من أي جانب من الشعار.</li>
<li><strong>الأحجام</strong>: الشعار في الرأسية: <code>18-20px</code>. الشعار في صفحة الترحيب: <code>32-48px</code>. الشعار في التذييل: <code>12-14px</code>.</li>
<li><strong>الخلفيات</strong>: الشعار يعمل على أي خلفية من الثلاث طبقات. لا تضعه على تدرجات ملونة أو صور.</li>
<li><strong>الحركة</strong>: لا تطبق حركات على الشعار. يبقى ثابتًا دائمًا بدون تأثيرات بصرية.</li>
</ul>

<div class="subsection">
    <div class="subsection-title">صوت العلامة التجارية</div>
</div>
<p class="body-text">
فيكسور يتحدث بثقة ووضوح. الرسائل النصية قصيرة ومباشرة. لا تستخدم لغة تسويقية مبهجة أو مبالغ فيها. التركيز على القيمة والمعلومات المفيدة. عند مواجهة أخطاء، الاعتذار يكون موجزًا ومتبوعًا بحل واضح. أمثلة على النبرة المقبولة: "تم فتح الصفقة بنجاح" بدلاً من "مبروك! لقد حققت نجاحًا كبيرًا!".
</p>

<div class="callout">
    <div class="callout-title">المحافظة على الهوية</div>
    <div class="callout-body">لا تعدّل الألوان الأساسية أو الأحجام أو الزوايا خارج حدود رموز التصميم. الهوية البصرية تعتمد على الاتساق بين جميع العناصر. أي انحراف يُضعف إدراك المستخدم للعلامة التجارية.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # 21 — ملخص الرموز المرجعي
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-21",
            "title": "ملخص الرموز المرجعي",
            "content": """
<p class="body-text">
هذا القسم يوفر مرجعًا سريعًا شاملاً لجميع رموز التصميم (Design Tokens) في نظام فيكسور V5. يتم تنظيم الرموز حسب الفئة مع القيم الداكنة (الافتراضية). جميع الرموز معرّفة في ملف <code>src/styles.css</code> ويمكن الرجوع إليها من أي مكون عبر متغيرات CSS أو فئات Tailwind المخصصة.
</p>
<div class="subsection">
    <div class="subsection-title">أصناف CSS المرجعية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الصنف</th><th>النوع</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td><code>.vixor-card</code></td><td>بطاقة</td><td>بطاقة قياسية بخلفية صلبة</td></tr>
<tr><td><code>.glass-card</code></td><td>بطاقة</td><td>بطاقة زجاجية مع blur</td></tr>
<tr><td><code>.vx-card</code></td><td>بطاقة</td><td>بطاقة مميزة 20px radius</td></tr>
<tr><td><code>.vx-glass</code></td><td>تراكب</td><td>تأثير زجاجي متقدم</td></tr>
<tr><td><code>.gradient-primary</code></td><td>تدرج</td><td>تدرج نيلي 135deg</td></tr>
<tr><td><code>.gradient-bullish</code></td><td>تدرج</td><td>تدرج صعودي</td></tr>
<tr><td><code>.gradient-bearish</code></td><td>تدرج</td><td>تدرج هبوطي</td></tr>
<tr><td><code>.glow-primary</code></td><td>تأثير</td><td>توهج نيلي</td></tr>
<tr><td><code>.vx-btn-primary</code></td><td>زر</td><td>زر أساسي بتدرج نيلي</td></tr>
<tr><td><code>.vx-btn-ghost</code></td><td>زر</td><td>زر شفاف بحد</td></tr>
<tr><td><code>.vx-btn-bullish</code></td><td>زر</td><td>زر الشراء أخضر</td></tr>
<tr><td><code>.vx-btn-bearish</code></td><td>زر</td><td>زر البيع أحمر</td></tr>
<tr><td><code>.vx-btn-sm / .vx-btn-lg</code></td><td>حجم</td><td>أحجام الأزرار</td></tr>
<tr><td><code>.vx-input</code></td><td>إدخال</td><td>حقل إدخال قياسي</td></tr>
<tr><td><code>.vx-badge</code></td><td>طابع</td><td>طابع قياسي</td></tr>
<tr><td><code>.vx-badge-bullish</code></td><td>طابع</td><td>طابع صعودي</td></tr>
<tr><td><code>.vx-badge-bearish</code></td><td>طابع</td><td>طابع هبوطي</td></tr>
<tr><td><code>.vx-badge-wait</code></td><td>طابع</td><td>طابع انتظار</td></tr>
<tr><td><code>.vx-badge-gold</code></td><td>طابع</td><td>طابع ذهبي</td></tr>
<tr><td><code>.text-mono / .text-num</code></td><td>نص</td><td>أرقام بخط أحادي عرض</td></tr>
<tr><td><code>.vx-scroll</code></td><td>تمرير</td><td>شريط تمرير مخصص 4px</td></tr>
<tr><td><code>.nocturne-bg</code></td><td>خلفية</td><td>خلفية كاملة مع توهج وشبكة</td></tr>
<tr><td><code>.vx-divider</code></td><td>فاصل</td><td>فاصل متدرج</td></tr>
<tr><td><code>.vx-overlay</code></td><td>تراكب</td><td>تراكب شبه شفاف مع blur</td></tr>
<tr><td><code>.vx-shimmer</code></td><td>حركة</td><td>تأثير لمعان متحرك</td></tr>
<tr><td><code>.vx-stagger</code></td><td>حركة</td><td>نظام تتابع للعناصر</td></tr>
<tr><td><code>.live-badge</code></td><td>حالة</td><td>طابع "مباشر" متحرك</td></tr>
<tr><td><code>.vx-tabs / .vx-tab</code></td><td>تبويب</td><td>نظام تبويبات مميز</td></tr>
<tr><td><code>.data-grid</code></td><td>بيانات</td><td>شبكة بيانات مفصولة 1px</td></tr>
</tbody>
</table>

<div class="callout callout-success">
    <div class="callout-title">مصدر الحقيقة</div>
    <div class="callout-body">ملف <code>src/styles.css</code> هو المصدر الوحيد والحقيقي لجميع رموز التصميم. عند وجود تعارض بين هذا المستند والملف المصدري، اتبع ما هو في الملف المصدري. هذا المستند يهدف إلى شرح واستعراض الرموز وليس تعريفها.</div>
</div>
"""
        },
    ]


def main():
    print("=" * 60)
    print("VIXOR Design System Bible — DOC-05")
    print("Generating Arabic RTL PDF...")
    print("=" * 60)

    chapters = build_chapters()
    print(f"Total chapters: {len(chapters)}")

    title = "كتاب نظام التصميم"
    subtitle = "الوثيقة الرسمية لنظام تصميم فيكسور V5"
    doc_id = "DOC-05"

    html = generate_vixor_html(
        title=title,
        subtitle=subtitle,
        doc_id=doc_id,
        chapters=chapters,
        footer_text="VIXOR Design System Bible — DOC-05",
    )

    html_path = save_html(html, "05-design.html")
    print(f"HTML saved: {html_path}")

    pdf_path = convert_to_pdf(
        html_path,
        "05-design.pdf",
        skill_dir="/home/z/my-project/skills/pdf",
    )
    print(f"PDF saved: {pdf_path}")

    print("=" * 60)
    print("Done!")
    print(f"HTML: {html_path}")
    print(f"PDF:  {pdf_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
