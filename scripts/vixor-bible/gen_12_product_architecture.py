"""
VIXOR Product Architecture Bible — Document 12 (Arabic RTL)
Doc ID: VIXOR-PAB-001
Title: إجيل بنية المنتج — MOXI أولاً
"""

import sys
sys.path.insert(0, "/home/z/my-project/scripts/vixor-bible")

from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


DOC_ID = "VIXOR-PAB-001"
TITLE = "إجيل بنية المنتج"
SUBTITLE = "MOXI أولاً — البنية المنتجية التي تضع الذكاء الاصطناعي في قلب كل شيء"
FOOTER = "VIXOR Product Architecture Bible"
SKILL_DIR = "/home/z/my-project/skills/pdf"


def build_chapters():
    return [

        # ─────────────────────────────────────────────
        # SEC-01: فلسفة البناء — MOXI أولاً
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-01",
            "title": "فلسفة البناء: MOXI أولاً",
            "content": """
<p class="body-text">
تقوم فلسفة بناء فيكسور على مبدأ جوهري يُحدث تحوّلًا جذريًا في طريقة تفاعل المتداول مع منصة التداول: <strong>MOXI أولاً — وليس لوحة التحكم أولاً</strong>. في جميع المنصات التقليدية مثل TradingView وBullX وPhoton، يُفتح التطبيق لعرض لوحة تحكم مليئة بالرسوم البيانية والقوائم والأرقام، ثم يُتوقع من المستخدم أن يبحث بنفسه عن الفرص والمعلومات المهمة. هذا النهج يضع عبء الاكتشاف والتحليل بالكامل على كتف المتداول، وهو عبء ثقيل في سوق العملات الميمية على سولانا الذي يتسم بالسرعة والتعقيد.
</p>
<p class="body-text">
MOXI — المساعد الذكي الموجود في <code>src/domains/moxi/</code> — ليس ميزة إضافية أو روبوت محادثة ثانوي. إنه <strong>نقطة الانطلاق</strong> و<strong>الموجّه الرئيسي</strong> لكل تجربة المستخدم في فيكسور. عندما يفتح المستخدم فيكسور، لا يرى لوحة تحكم صامتة بل يستقبله MOXI برؤية مخصصة لحالته السوقية الشخصية، بناءً على محفظته وأسلوب تداوله وإشاراته النشطة وسجل صفقاته. هذا يعني أن الذكاء الاصطناعي لا يُضاف إلى المنتج بل <strong>المنتج يُبنى حول الذكاء الاصطناعي</strong>.
</p>
<p class="body-text">
الفرق الجوهري بين النهج التقليدي ونهج MOXI أولاً يشبه الفرق بين مكتبة ضخمة بلا فهرس وبين أمين مكتبة ذكي يعرفك شخصيًا ويضع بين يديك الكتاب الذي تحتاجه بالضبط. في المنصات التقليدية، المستخدم هو من يبحث. في فيكسور، MOXI هو من يبحث ويُقدّم. تتحول العلاقة من <strong>مستخدم ← أدوات</strong> إلى <strong>مستخدم ← MOXI ← أدوات</strong>، حيث يصبح MOXI الوسيط الذكي الذي يُترجم تعقيدات السوق إلى قرارات واضحة وقابلة للتنفيذ.
</p>

<table class="vixor-table">
<thead>
<tr><th>البُعد</th><th>المنصات التقليدية</th><th>VIXOR — MOXI أولاً</th></tr>
</thead>
<tbody>
<tr><td><strong>نقطة الدخول</strong></td><td>لوحة تحكم ثابتة بالرسوم البيانية</td><td>MOXI يستقبلك برؤية مخصصة</td></tr>
<tr><td><strong>اكتشاف الفرص</strong></td><td>المستخدم يتصفح القوائم يدويًا</td><td>MOXI يُقدّم "مهمة اليوم" تلقائيًا</td></tr>
<tr><td><strong>تحليل السوق</strong></td><td>أدوات منفصلة يُفعّلها المستخدم</td><td>وكلاء ذكاء اصطناعي يتشاورون ويتناقشون</td></tr>
<tr><td><strong>إدارة المخاطر</strong></td><td>تنبيهات يدوية أو غير موجودة</td><td>Risk Governor يتحقق تلقائيًا قبل كل صفقة</td></tr>
<tr><td><strong>مراجعة الأداء</strong></td><td>تقارير ثابتة أو غير موجودة</td><td>MOXI يُلخّص أداءك ويقترح تحسينات</td></tr>
<tr><td><strong>التعلم والتطوير</strong></td><td>المستخدم يتعلم وحده من أخطائه</td><td>Coach Overlay يُقدّم تغذية راجعة فورية</td></tr>
</tbody>
</table>

<div class="callout callout-success">
    <div class="callout-title">النتيجة المنتجية لنهج MOXI أولاً</div>
    <div class="callout-body">المستخدم لا يضيع وقته في البحث عن ما يجب فعله. MOXI يُخبره بما يجب فعله، لماذا يجب فعله، وكيف يفعله بأقل مخاطر ممكنة. هذا يُحوّل فيكسور من أداة تداول إلى <strong>شريك تداول ذكي</strong>.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # SEC-02: التدفق المنتجي الرئيسي
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-02",
            "title": "التدفق المنتجي الرئيسي",
            "content": """
<p class="body-text">
يتدفق المستخدم عبر ست خطوات متسلسلة تشكّل العمود الفقري لتجربة فيكسور. كل خطوة مُصممة لتقود المستخدم بشكل طبيعي من الوعي بالسوق إلى اتخاذ القرار إلى تنفيذ الصفقة再到مراجعة النتائج. هذا التدفق ليس عشوائيًا بل نتيجة تصميم مقصود يُقلل الاحتكاك المعرفي ويُسرّع اتخاذ القرارات الصحيحة. يبدأ كل شيء من MOXI وينتهي بالتعلم من التجربة.
</p>

<div class="subsection">
    <div class="subsection-title">الخطوة ١: الاستقبال الشخصي — MOXI يرحّب بك</div>
</div>
<p class="body-text">
عند فتح فيكسور، يُفعّل النظام وحدة <code>src/domains/moxi/</code> التي تتضمن محرك السياق <code>context-engine.ts</code> وجهاز الشخصية <code>persona.ts</code>. يُجمع MOXI بيانات المستخدم من محفظته وإشاراته النشطة وسجل تداوله، ثم يُنشئ رؤية شخصية فورية تُلخّص حالة السوق بالنسبة له. يشمل ذلك العملات المُراقبة، والإشارات المُعلّقة، وأي تنبيهات مهمة. هذه الخطوة تُلغي تمامًا الحاجة إلى تصفح لوحة تحكم صامتة بحثًا عن معلومات.
</p>

<div class="subsection">
    <div class="subsection-title">الخطوة ٢: مهمة اليوم — ما يجب التركيز عليه الآن</div>
</div>
<p class="body-text">
بعد الاستقبال، يُقدّم MOXI <strong>"مهمة اليوم"</strong> عبر نطاق <code>src/domains/daily-loop/</code>. هذه ليست قائمة مهام عامة بل خطة عمل مُخصصة بناءً على ظروف السوق الحالية وأهداف المستخدم. مثلاً: "عملة BONK تُظهر نمط انعكاس على الإطار الزمني ربع الساعي مع حجم تداول مرتفع — راجع الرسم البياني وقيّم الدخول". يتم التمرير تلقائيًا نحو الفرصة الأكثر إلحاحًا.
</p>

<div class="subsection">
    <div class="subsection-title">الخطوة ٣: أفضل فرصة — الإشارات والاكتشاف</div>
</div>
<p class="body-text">
يعتمد MOXI على نطاقي <code>src/domains/signal-tracking/</code> و<code>src/domains/discovery/</code> لتحديد أفضل الفرص المتاحة. نطاق الاكتشاف يجمع بيانات من DexScreener وBirdeye وLunarCrush وHelius لتقييم العملات الجديدة، بينما يتتبع نطاق الإشارات الإشارات النشطة ويُقيّم قوتها. يُدمج MOXI هذه البيانات ليُبرز الفرصة الأكثر وعدًا مع شرح مبسّط لأسباب الاختيار.
</p>

<div class="subsection">
    <div class="subsection-title">الخطوة ٤: الرسم البياني الذكي — التحليل البصري</div>
</div>
<p class="body-text">
عند اختيار المستخدم لفرصة، ينتقل إلى الرسم البياني المُعزّز بالذكاء الاصطناعي. المكون الرئيسي هو <code>src/components/vixor/TradingViewChart.tsx</code> المدمج مع نطاق <code>src/domains/chart-intelligence/</code>. لا يعرض الرسم البياني الشموع فقط، بل يُضيف تعليقات ذكية تشمل مناطق الدعم والمقاومة، وأنماط الشموع المكتشفة، وتقييم Truth Score عبر <code>chart-truth/</code>. يتحول الرسم من أداة عرض إلى أداة تحليل.
</p>

<div class="subsection">
    <div class="subsection-title">الخطوة ٥: تنفيذ الصفقة — مع حماية المخاطر</div>
</div>
<p class="body-text">
عند اتخاذ القرار بالدخول، يُفعّل نطاق <code>src/domains/trading/</code> الذي يتصل ببوابة التداول <code>trading/gateway/</code>. قبل التنفيذ الفعلي، يتدخل <code>src/domains/risk-governor/</code> الذي يُشغّل محافظ المخاطر <code>governor.engine.ts</code> وقواعد المخاطر <code>rules/risk-rules.ts</code>. يتحقق النظام تلقائيًا من حجم الصفقة نسبةً للمحفظة، ومستوى التداول، وتعرض العملة للسيولة. إذا تجاوزت الصفقة حدود المخاطر، يُحذّر MOXI المستخدم ويقترح تعديلات.
</p>

<div class="subsection">
    <div class="subsection-title">الخطوة ٦: المراجعة والتعلم — دفتر اليوميات</div>
</div>
<p class="body-text">
بعد إغلاق الصفقة، يُوجّه المستخدم إلى دفتر اليوميات عبر <code>src/domains/notes/</code> والمسار <code>src/routes/_authenticated/journal.tsx</code>. يُساعد MOXI المستخدم على توثيق القرار والعوامل المؤثرة والمشاعر وقت التداول. تُبنى هذه البيانات شخصية التداول الفريدة للمستخدم التي يُحسّن MOXI من خلالها توصياته المستقبلية. هذه الدورة المغلقة من التخطيط والتنفيذ والمراجعة هي ما يُحوّل فيكسور من مجرد أداة إلى نظام تعلّم متكامل.
</p>

<div class="callout">
    <div class="callout-title">التدفق في صورة واحدة</div>
    <div class="callout-body">VIXOR → MOXI → مهمة اليوم → أفضل فرصة → الرسم البياني → الصفقة → المراجعة. ست خطوات، ست نطاقات رئيسية، تجربة واحدة متكاملة لا تترك المستخدم وحيدًا في أي مرحلة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # SEC-03: خرائط المجال (Domain Maps)
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-03",
            "title": "خرائط المجال (Domain Maps)",
            "content": """
<p class="body-text">
يضم فيكسور أكثر من عشرين نطاقًا وظيفيًا في <code>src/domains/</code>، كل منها يُؤدي دورًا محددًا في التدفق المنتجي. لا تُنظَّم هذه النطاقات وفقًا للتقنية أو النوع، بل وفقًا <strong>لدورها في رحلة المستخدم من الاستقبال إلى المراجعة</strong>. هذا التنظيم المنتجي يضمن أن كل سطر كود يخدم تجربة المستخدم النهائية، وليس مجرد هيكل تقني جامد.
</p>
<p class="body-text">
النطاقات الموجودة في قلب التدفق المنتجي هي التي يتفاعل معها المستخدم مباشرة عبر MOXI. أما النطاقات الداعمة فتعمل في الخلفية لتغذية هذه النطاقات بالبيانات والتحليلات. هذا الفصل يضمن وضوح المسؤوليات وسهولة الصيانة، فإذا احتجت لتحسين محرك الاكتشاف، فتعرف بالضبط أين تذهب دون المساس بالتدفق المنتجي الأساسي.
</p>

<table class="vixor-table">
<thead>
<tr><th>المجال</th><th>المجلد</th><th>المسؤولية</th><th>خطوة التدفق</th></tr>
</thead>
<tbody>
<tr><td><strong>MOXI</strong></td><td><code>moxi/</code></td><td>الشخصية الذكية والمحرك السياقي والأدوات</td><td>الاستقبال + التوجيه</td></tr>
<tr><td><strong>الحلقة اليومية</strong></td><td><code>daily-loop/</code></td><td>تخطيط مهمة اليوم والتوجيه الشخصي</td><td>مهمة اليوم</td></tr>
<tr><td><strong>تتبع الإشارات</strong></td><td><code>signal-tracking/</code></td><td>إدارة وتقييم الإشارات التداولية</td><td>أفضل فرصة</td></tr>
<tr><td><strong>الاكتشاف</strong></td><td><code>discovery/</code></td><td>مسح العملات الجديدة وتهيئتها</td><td>أفضل فرصة</td></tr>
<tr><td><strong>ذكاء الرسم البياني</strong></td><td><code>chart-intelligence/</code></td><td>تحليل الرسوم البيانية بالذكاء الاصطناعي</td><td>الرسم البياني</td></tr>
<tr><td><strong>حقيقة الرسم</strong></td><td><code>chart-truth/</code></td><td>تقييم موثوقية بيانات السوق</td><td>الرسم البياني</td></tr>
<tr><td><strong>التداول</strong></td><td><code>trading/</code></td><td>تنفيذ الصفقات عبر البوابات</td><td>الصفقة</td></tr>
<tr><td><strong>حاكم المخاطر</strong></td><td><code>risk-governor/</code></td><td>التحقق من مخاطر كل صفقة</td><td>الصفقة</td></tr>
<tr><td><strong>الملاحظات</strong></td><td><code>notes/</code></td><td>دفتر اليوميات والتوثيق</td><td>المراجعة</td></tr>
<tr><td><strong>التحليل</strong></td><td><code>analysis/</code></td><td>محرك SMC والأنماط والمؤشرات</td><td>داعم (خلفية)</td></tr>
<tr><td><strong>السوق</strong></td><td><code>market/</code></td><td>بيانات الأسعار والأخبار والتقويم</td><td>داعم (خلفية)</td></tr>
<tr><td><strong>المحفظة</strong></td><td><code>wallet/</code></td><td>ربط المحافظ Phantom وMetaMask وTelegram</td><td>داعم (بنية)</td></tr>
<tr><td><strong>المستخدم</strong></td><td><code>user/</code></td><td>إدارة الحسابات والملفات الشخصية</td><td>داعم (بنية)</td></tr>
<tr><td><strong>المراقبة</strong></td><td><code>watchlist/</code></td><td>قوائم المراقبة المخصصة</td><td>داعم (أدوات)</td></tr>
<tr><td><strong>الصفقات</strong></td><td><code>trades/</code></td><td>سجل الصفقات والتاريخ</td><td>داعم (بيانات)</td></tr>
<tr><td><strong>الكوبيلوت</strong></td><td><code>copilot/</code></td><td>وكلاء التحليل والصيد والحوكمة</td><td>داعم (ذكاء)</td></tr>
<tr><td><strong>المناظرة</strong></td><td><code>debate/</code></td><td>محرك المناظرة بين الوكلاء</td><td>داعم (ذكاء)</td></tr>
<tr><td><strong>الاستراتيجية</strong></td><td><code>strategy/</code></td><td>بناء وتشغيل الاستراتيجيات</td><td>داعم (متقدم)</td></tr>
<tr><td><strong>الوساطة</strong></td><td><code>arbitrage/</code></td><td>محرك التداول التحكيمي</td><td>داعم (متقدم)</td></tr>
<tr><td><strong>التجربة الافتراضية</strong></td><td><code>paper-trading/</code></td><td>التداول الوهمي للتعلم</td><td>داعم (تعليم)</td></tr>
<tr><td><strong>الاختبار الرجعي</strong></td><td><code>backtest/</code></td><td>اختبار الاستراتيجيات على البيانات التاريخية</td><td>داعم (تحليل)</td></tr>
<tr><td><strong>التجارب</strong></td><td><code>experiment/</code></td><td>تجارب A/B وتطوير الميزات</td><td>داعم (تطوير)</td></tr>
<tr><td><strong>الوسيط</strong></td><td><code>broker/</code></td><td>ربط وسطاء التداول الخارجيين</td><td>داعم (تكامل)</td></tr>
</tbody>
</table>

<div class="callout callout-warn">
    <div class="callout-title">ملاحظة على التنظيم</div>
    <div class="callout-body">المجالات التسعة الأولى هي مجالات التدفق المباشر. الباقي مجالات داعمة تعمل في الخلفية. هذا لا يعني أنها أقل أهمية — بل يعني أن المستخدم لا يتفاعل معها مباشرة بل يختبر نتائجها عبر MOXI.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # SEC-04: هيكل الصفحات والمسارات
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-04",
            "title": "هيكل الصفحات والمسارات",
            "content": """
<p class="body-text">
يضم فيكسور أكثر من ثمانية وثلاثين مسارًا في <code>src/routes/_authenticated/</code>، وهي مُنظَّمة وفقًا <strong>للتدفق المنتجي MOXI-First وليس وفقًا لتصنيف الميزات</strong>. هذا يعني أن الترتيب الافتراضي للتنقل يعكس رحلة المستخدم الطبيعية: من MOXI إلى المهمة إلى الفرصة إلى الرسم البياني إلى الصفقة إلى المراجعة. المسارات الأخرى — كالإعدادات والمحفظة والبحث — تُعتبر مسارات ثانوية يمكن الوصول إليها عند الحاجة.
</p>
<p class="body-text">
هذا التنظيم يختلف جذريًا عن المنصات التقليدية التي تُرتّب المسارات حسب الميزة: "الرسوم البيانية" ثم "التداول" ثم "المحفظة". في فيكسور، الترتيب يُخبر قصة: <strong>ابدأ مع MOXI، دعه يُرشدك، نفّذ ما يقترحه، ثم تعلّم من النتائج</strong>. هذا التحوّل من تنظيم تقني إلى تنظيم تجريبي هو جوهر فلسفة MOXI أولاً.
</p>

<table class="vixor-table">
<thead>
<tr><th>خطوة التدفق</th><th>المسار</th><th>الملف</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td><strong>١. MOXI Home</strong></td><td><code>/</code></td><td><code>index.tsx</code></td><td>نقطة الدخول الرئيسية — MOXI يستقبلك</td></tr>
<tr><td><strong>٢. المهمة اليومية</strong></td><td><code>/daily-loop</code></td><td><code>daily-loop.tsx</code></td><td>خطة العمل المُخصصة لهذا اليوم</td></tr>
<tr><td><strong>٣. الفرص والرادار</strong></td><td><code>/radar</code></td><td><code>radar.tsx</code></td><td>عرض الفرص المكتشفة والإشارات النشطة</td></tr>
<tr><td><strong>٣. الاكتشاف</strong></td><td><code>/discover</code></td><td><code>discover.tsx</code></td><td>عملات جديدة مُكتشفة عبر خدمات متعددة</td></tr>
<tr><td><strong>٣. الإشارات</strong></td><td><code>/signals</code></td><td><code>signals.tsx</code></td><td>إشارات التداول المُتتبعة والمُقيَّمة</td></tr>
<tr><td><strong>٤. الرسوم البيانية</strong></td><td><code>/charts</code></td><td><code>charts.tsx</code></td><td>الرسم البياني مع التعليقات الذكية</td></tr>
<tr><td><strong>٤. التحليل</strong></td><td><code>/analyze</code></td><td><code>analyze.tsx</code></td><td>تحليل SMC والمؤشرات والأنماط</td></tr>
<tr><td><strong>٤. تفاصيل العملة</strong></td><td><code>/token/$symbol</code></td><td><code>token.$symbol.tsx</code></td><td>صفحة العملة الشاملة مع AI</td></tr>
<tr><td><strong>٥. مكتب التداول</strong></td><td><code>/trade-desk</code></td><td><code>trade-desk.tsx</code></td><td>تنفيذ الصفقات مع حماية المخاطر</td></tr>
<tr><td><strong>٥. التبديل</strong></td><td><code>/swap</code></td><td><code>swap.tsx</code></td><td>تبديل العملات عبر Jupiter</td></tr>
<tr><td><strong>٥. المضاربة المستمرة</strong></td><td><code>/perpetuals</code></td><td><code>perpetuals.tsx</code></td><td>تداول العقود المستمرة</td></tr>
<tr><td><strong>٦. دفتر اليوميات</strong></td><td><code>/journal</code></td><td><code>journal.tsx</code></td><td>توثيق ومراجعة الصفقات</td></tr>
<tr><td><strong>٦. الأرباح والخسائر</strong></td><td><code>/pnl</code></td><td><code>pnl.tsx</code></td><td>تقرير الأرباح والخسائر التفصيلي</td></tr>
<tr><td><strong>٦. الحقائب</strong></td><td><code>/bags</code></td><td><code>bags.tsx</code></td><td>إدارة المحافظ والعملات المملوكة</td></tr>
</tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المسارات الداعمة والثانوية</div>
</div>
<table class="vixor-table">
<thead>
<tr><th>الفئة</th><th>المسارات</th><th>الوظيفة</th></tr>
</thead>
<tbody>
<tr><td><strong>الذكاء الاصطناعي</strong></td><td><code>/copilot</code>, <code>/vision</code>, <code>/predictions</code></td><td>مساعد الكوبيلوت، التحليل البصري، التنبؤات</td></tr>
<tr><td><strong>السوق</strong></td><td><code>/alpha</code>, <code>/whale</code>, <code>/pulse</code></td><td>فرص ألفا، تتبع الحيتان، نبض السوق</td></tr>
<tr><td><strong>التحليل المتقدم</strong></td><td><code>/analysis/$id</code>, <code>/backtest</code>, <code>/experiments</code></td><td>تحليل تفصيلي، اختبار رجعي، تجارب</td></tr>
<tr><td><strong>التكاملات</strong></td><td><code>/brokers</code>, <code>/arbitrage</code>, <code>/yield</code></td><td>الوسطاء، التداول التحكيمي، العوائد</td></tr>
<tr><td><strong>المجتمع</strong></td><td><code>/communities</code>, <code>/trackers</code>, <code>/referral</code></td><td>المجتمعات، المتتبعون، الإحالات</td></tr>
<tr><td><strong>الحساب</strong></td><td><code>/profile</code>, <code>/settings</code>, <code>/premium</code></td><td>الملف الشخصي، الإعدادات، الاشتراك المميز</td></tr>
<tr><td><strong>الأدوات</strong></td><td><code>/wallet-web3</code>, <code>/curves</code>, <code>/activity-web3</code>, <code>/notifications</code></td><td>المحفظة، منحنيات الدوكوين، النشاط، التنبيهات</td></tr>
</tbody>
</table>

<div class="callout">
    <div class="callout-title">المسار الذهبي (Happy Path)</div>
    <div class="callout-body">في المثالية، يقضي المستخدم ٨٠٪ من وقته في المسارات الستة الأولى للمدفق المنتجي. المسارات الأخرى تُستخدم عند الحاجة وتكون دائمًا في متناول اليد من خلال التنقل الجانبي. MOXI هو من يُقرر متى يُوجّه المستخدم إلى مسار ثانوي.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # SEC-05: نموذج البيانات المنتجي
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-05",
            "title": "نموذج البيانات المنتجي",
            "content": """
<p class="body-text">
يتدفق البيانات في فيكسور وفقًا لنمط خطي واضح يتبع التدفق المنتجي نفسه. لا نتحدث هنا عن هيكل قاعدة البيانات (وهو موضوع إنجيل قاعدة البيانات)، بل عن <strong>الكيانات المنتجية</strong> وكيف تتحول من كيان إلى آخر مع كل خطوة من خطوات رحلة المستخدم. هذا النموذج يُجيب على سؤال جوهري: <strong>ما البيانات التي تنتقل بين كل خطوة؟</strong>
</p>
<p class="body-text">
يبدأ كل شيء من كيان <strong>الملف الشخصي</strong> الذي يحتوي على تفضيلات المستخدم وأسلوب تداوله ومستوى خبرته. يتحول هذا الملف إلى <strong>شخصية MOXI</strong> التي تُحدد كيف يتحدث MOXI مع المستخدم وما نوع التوصيات التي يُقدمها. من الشخصية، يُولَّد <strong>الحلقة اليومية</strong> التي تحتوي على المهمة والفرص المقترحة. كل فرصة تُغذّي من كيانات <strong>الإشارات</strong> وبيانات <strong>الاكتشاف</strong>. عند اختيار فرصة، تُنشأ <strong>جلسة تحليل</strong> تنتج <strong>تقييم الرسم البياني</strong>. وعند التنفيذ، تُولَّد <strong>صفقة</strong> تخضع لـ<strong>حوكمة المخاطر</strong>. بعد الإغلاق، تُوثَّق العملية في <strong>ملاحظة اليوميات</strong> التي تُغذّي بدورها شخصية MOXI في الدورة التالية.
</p>

<div class="subsection">
    <div class="subsection-title">سلسلة الكيانات المنتجية</div>
</div>

<table class="vixor-table">
<thead>
<tr><th>الكيان</th><th>المصدر</th><th>يُغذّي</th><th>الوصف</th></tr>
</thead>
<tbody>
<tr><td><strong>الملف الشخصي</strong></td><td><code>user/</code></td><td>شخصية MOXI</td><td>التفضيلات والمستوى والأسلوب</td></tr>
<tr><td><strong>شخصية MOXI</strong></td><td><code>moxi/persona.ts</code></td><td>الحلقة اليومية</td><td>نمط التواصل ونوع التوصيات</td></tr>
<tr><td><strong>الحلقة اليومية</strong></td><td><code>daily-loop/</code></td><td>الفرص المُختارة</td><td>مهمة اليوم والسياق السوقي</td></tr>
<tr><td><strong>الإشارات</strong></td><td><code>signal-tracking/</code></td><td>أفضل فرصة</td><td>إشارات الشراء/البيع مع القوة</td></tr>
<tr><td><strong>بيانات الاكتشاف</strong></td><td><code>discovery/</code></td><td>أفضل فرصة</td><td>عملات جديدة مع درجات التهيئة</td></tr>
<tr><td><strong>جلسة التحليل</strong></td><td><code>analysis/</code></td><td>تقييم الرسم</td><td>تحليل SMC والمؤشرات والأنماط</td></tr>
<tr><td><strong>تقييم الرسم</strong></td><td><code>chart-intelligence/</code></td><td>قرار التداول</td><td>تعليقات AI وTruth Score</td></tr>
<tr><td><strong>قرار التداول</strong></td><td><code>risk-governor/</code></td><td>الصفقة</td><td>موافقة/تعديل/رفض مع الأسباب</td></tr>
<tr><td><strong>الصفقة</strong></td><td><code>trading/</code></td><td>الملاحظة</td><td>تفاصيل التنفيذ والنتيجة</td></tr>
<tr><td><strong>ملاحظة اليوميات</strong></td><td><code>notes/</code></td><td>شخصية MOXI (دورة)</td><td>التوثيق والتعلم والدروس</td></tr>
</tbody>
</table>

<div class="callout callout-success">
    <div class="callout-title">الدورة المغلقة للبيانات</div>
    <div class="callout-body">الجمال في هذا النموذج هو دورته المغلقة: ملاحظات اليوميات ← شخصية MOXI ← الحلقة اليومية ← صفقة جديدة ← ملاحظة جديدة. كل دورة تُحسّن الدورة التالية. هذا ما يجعل فيكسور يتعلم ويتحسن مع كل صفقة يُجريها المستخدم، وهو ما لا تقدمه أي منصة تداول تقليدية.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # SEC-06: طبقات الذكاء الاصطناعي
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-06",
            "title": "طبقات الذكاء الاصطناعي",
            "content": """
<p class="body-text">
يتكون الذكاء الاصطناعي في فيكسور من خمسة وكلاء رئيسيين يعملون معًا ضمن نظام مناظرة متكامل. لا يعمل كل وكيل بمعزل بل يتناقشون ويتبادلون الآراء قبل تقديم التوصية النهائية للمستخدم عبر MOXI. هذا النهج <strong>الجماعي</strong> يُقلل التحيز الفردي ويُنتج توصيات أكثر توازنًا ودقة. كل وكيل يخدم خطوة محددة في التدفق المنتجي، مما يضمن أن الذكاء الاصطناعي لا يُوجد كطبقة منفصلة بل مُدمج في كل مرحلة من مراحل تجربة المستخدم.
</p>

<div class="card-grid">
<div class="info-card">
    <div class="info-card-title">١. MOXI — المُوجّه الرئيسي</div>
    <div class="info-card-body">الوكيل المركزي الذي يتحكم في التدفق المنتجي كاملًا. يُنشئ الشخصية ويُدير السياق ويُنسق بين الوكلاء الآخرين. يخدم <strong>كل خطوات التدفق</strong> كطبقة تنسيق عُليا. يتواجد في <code>src/domains/moxi/</code> ويستخدم <code>context-engine.ts</code> لفهم الصورة الكاملة.</div>
</div>
<div class="info-card">
    <div class="info-card-title">٢. محلل السوق (Market Analyst)</div>
    <div class="info-card-body">يخدم خطوات <strong>الفرصة والرسم البياني</strong>. يُحلل بنية السوق عبر SMC والأنماط والمؤشرات. يتواجد في <code>src/domains/copilot/server/analyst.agent.ts</code> ويُغذّي محرك التحليل في <code>src/domains/analysis/</code> بتفسيرات ذكية.</div>
</div>
<div class="info-card">
    <div class="info-card-title">٣. مدير المخاطر (Risk Manager)</div>
    <div class="info-card-body">يخدم خطوة <strong>الصفقة</strong>. يُقيّم كل صفقة مقترحة وفقًا لقواعد المخاطر في <code>src/domains/risk-governor/</code>. يتواجد في <code>src/domains/copilot/server/governor.agent.ts</code> ويملك حق النقض (Veto) على أي صفقة تتجاوز الحدود.</div>
</div>
<div class="info-card">
    <div class="info-card-title">٤. محلل الأخبار (News Analyst)</div>
    <div class="info-card-body">يخدم خطوات <strong>الفرصة ومهمة اليوم</strong>. يُحلل الأخبار والمشاعر من Twitter وLunarCrush لتحديد التأثير على العملات المُراقبة. يتواجد في <code>src/domains/market/server/news.ts</code> ويُغذّي MOXI بالسياق الإخباري.</div>
</div>
<div class="info-card">
    <div class="info-card-title">٥. باني الاستراتيجيات (Strategy Builder)</div>
    <div class="info-card-body">يخدم خطوة <strong>المراجعة والتعلم</strong>. يُحلل أداء المستخدم التاريخي ويبني استراتيجيات مُخصصة. يتواجد في <code>src/domains/copilot/server/strategist.agent.ts</code> ويرتبط بـ <code>src/domains/strategy/</code> و<code>src/domains/backtest/</code>.</div>
</div>
<div class="info-card">
    <div class="info-card-title">نظام المناظرة (Debate System)</div>
    <div class="info-card-body">المحرك في <code>src/domains/debate/</code> يُنظّم مناظرة بين وكلاء التحليل (analyst) والاستراتيجية (strategist) وحماية المخاطر (risk-guard) والمعارضة (contrarian). يُنتج توصية مُوازنة بدلًا من رأي واحد. يخدم <strong>جميع الخطوات</strong> التي تتطلب قرارًا.</div>
</div>
</div>

<div class="callout">
    <div class="callout-title">كيف تتكامل الطبقات</div>
    <div class="callout-body">MOXI يتلقى سؤال المستخدم ← يُجمع السياق من محلل السوق ومحلل الأخبار ← يُطلق نظام المناظرة ← يُراجع مدير المخاطر النتيجة ← يُقدّم MOXI التوصية النهائية بأسلوب شخصي. كل هذا يحدث في ثوانٍ معدودة خلف واجهة MOXI البسيطة.</div>
</div>
"""
        },

        # ─────────────────────────────────────────────
        # SEC-07: المقارنة التنافسية
        # ─────────────────────────────────────────────
        {
            "tag": "SEC-07",
            "title": "المقارنة التنافسية",
            "content": """
<p class="body-text">
يُواجه فيكسور منافسة شديدة في سوق منصات تداول العملات الرقمية، خاصة على شبكة سولانا. المنافسون الرئيسيون هم TradingView كمنصة رسوم بيانية، وBullX وPhoton كمنصات تداول ميم كوينز متخصصة، وdexscreener كأداة اكتشاف. لكن فيكسور يتميز بميزة جوهرية واحدة: <strong>MOXI أولاً — الذكاء الاصطناعي ليس إضافة بل هو المنتج</strong>. هذه الميزة تُغيّر جذريًا العلاقة بين المستخدم والمنصة.
</p>
<p class="body-text">
TradingView أداة ممتازة للرسوم البيانية لكنها تتطلب من المستخدم أن يكون خبيرًا تحليليًا. BullX وPhoton سريعان في تنفيذ الصفقات لكنهما يفتقران إلى التحليل الذكي ويتوقعان من المستخدم أن يعرف بالضبط ما يريد. dexscreener رائع في اكتشاف العملات الجديدة لكنه لا يُقدّم أي تحليل أو توجيه. فيكسور يدمج كل هذه القدرات معًا ويضع MOXI كطبقة ذكية فوقها جميعًا، مما يُحوّل المنصة من مجموعة أدوات إلى <strong>شريك تداول ذكي متكامل</strong>.
</p>

<table class="vixor-table">
<thead>
<tr><th>الميزة</th><th>VIXOR</th><th>TradingView</th><th>BullX</th><th>Photon</th><th>dexscreener</th></tr>
</thead>
<tbody>
<tr><td><strong>مساعد ذكي شخصي</strong></td><td style="color:var(--bullish)">MOXI ✅</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>مهمة يومية مُخصصة</strong></td><td style="color:var(--bullish)">✅ Daily Loop</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>تحليل AI للرسوم البيانية</strong></td><td style="color:var(--bullish)">✅</td><td>محدود</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>نظام مناظرة بين الوكلاء</strong></td><td style="color:var(--bullish)">✅ Debate</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>حوكمة مخاطر آلية</strong></td><td style="color:var(--bullish)">✅ Governor</td><td style="color:var(--bearish)">❌</td><td>يدوي</td><td>يدوي</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>اكتشاف العملات الجديدة</strong></td><td style="color:var(--bullish)">✅ Discovery</td><td style="color:var(--bearish)">❌</td><td>محدود</td><td>محدود</td><td style="color:var(--bullish)">✅</td></tr>
<tr><td><strong>تتبع الإشارات</strong></td><td style="color:var(--bullish)">✅</td><td>التنبيهات فقط</td><td>محدود</td><td>محدود</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>دفتر يوميات تداول</strong></td><td style="color:var(--bullish)">✅ Journal</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>اختبار رجعي للاستراتيجيات</strong></td><td style="color:var(--bullish)">✅ Backtest</td><td style="color:var(--bullish)">✅</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>تداول تحكيمي</strong></td><td style="color:var(--bullish)">✅ Arbitrage</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>تداول وهمي</strong></td><td style="color:var(--bullish)">✅ Paper</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bearish)">❌</td><td>محدود</td><td style="color:var(--bearish)">❌</td></tr>
<tr><td><strong>شبكة سولانا أصلية</strong></td><td style="color:var(--bullish)">✅</td><td style="color:var(--bearish)">❌</td><td style="color:var(--bullish)">✅</td><td style="color:var(--bullish)">✅</td><td style="color:var(--bullish)">✅</td></tr>
</tbody>
</table>

<div class="callout callout-success">
    <div class="callout-title">ميزة MOXI-First التنافسية</div>
    <div class="callout-body">المنافسون يبنون أدوات ويتركون المستخدم يُديرها. فيكسور يبني شريكًا ذكيًا يُدير الأدوات نيابةً عن المستخدم. هذا لا يعني أن المستخدم يفقد السيطرة — بل يعني أن MOXI يُبسّط التعقيد ويُسرّع القرار مع احتفاظ المستخدم بالقرار النهائي دائمًا. عندما يقول المنافسون "نحن نُعطيك الأدوات"، يقول فيكسور "نحن نُعطيك الشريك الذي يعرف كيف يستخدم الأدوات".</div>
</div>
"""
        },
    ]


def main():
    chapters = build_chapters()
    html = generate_vixor_html(
        title=TITLE,
        subtitle=SUBTITLE,
        doc_id=DOC_ID,
        chapters=chapters,
        footer_text=FOOTER,
    )
    html_path = save_html(html, "12_product_architecture.html")
    print(f"HTML saved: {html_path}")
    pdf_path = convert_to_pdf(html_path, "12_product_architecture.pdf", SKILL_DIR)
    print(f"PDF generated: {pdf_path}")


if __name__ == "__main__":
    main()
