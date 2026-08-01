"""
VIXOR Engineering Bible — Document 11: Master Execution Bible (إنجيل التنفيذ الرئيسي)
VIXOR-MEB-001 — The #1 most critical document connecting ALL 17 bible documents.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


# ────────────────────────────────────────────────────────────────
# HTML HELPERS
# ────────────────────────────────────────────────────────────────

def bl(items):
    return '<ul class="vixor-list">\n' + '\n'.join(f'    <li>{i}</li>' for i in items) + '\n</ul>'

def ol(items):
    return '<ol class="vixor-ol">\n' + '\n'.join(f'    <li>{i}</li>' for i in items) + '\n</ol>'

def p(t):
    return f'<p class="body-text">{t}</p>'

def s(t):
    return f'<div class="subsection"><div class="subsection-title">{t}</div></div>'

def co(ct, ti, bo):
    c = f" callout-{ct}" if ct else ""
    return f'<div class="callout{c}"><div class="callout-title">{ti}</div><div class="callout-body">{bo}</div></div>'

def cb(t):
    return f'<div class="code-block">{t}</div>'

def cg(cards):
    inner = "".join(f'<div class="info-card"><div class="info-card-title">{a}</div><div class="info-card-body">{b}</div></div>' for a, b in cards)
    return f'<div class="card-grid">{inner}</div>'

def ft(headers, rows):
    th = ''.join(f'<th>{h}</th>' for h in headers)
    trs = ''
    for r in rows:
        tds = ''.join(f'<td>{c}</td>' for c in r)
        trs += f'<tr>{tds}</tr>\n'
    return f'<table class="vixor-table"><thead><tr>{th}</tr></thead><tbody>\n{trs}</tbody></table>'


# ────────────────────────────────────────────────────────────────
# CHAPTERS
# ────────────────────────────────────────────────────────────────

chapters = [

    # ════════════════════════════════════════════════════════════
    # SEC-01: الرؤية التنفيذية والهدف
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-01",
        "title": "الرؤية التنفيذية والهدف",
        "content": """
<p class="body-text">
فيكسور ليس مشروعًا مكتوبًا بالوثائق — فيكسور مشروع <strong>يُنفَّذ بالكود</strong>. هذه هي الفلسفة الجوهرية التي تميّز منظومة فيكسور الهندسية عن أي مشروع آخر. نحن لا نكتب الوثائق لنُرْضي عمليةً بيروقراطية، بل نكتبها لتتحوّل فورًا إلى مهام تنفيذية قابلة للبرمجة والاختبار والنشر. كل حرف في هذه المنظومة يجب أن يقود إلى سطر كود، وكل سطر كود يجب أن يُتتبع إلى متطلب في أحد الإنجيلات السبعة عشرة.
</p>
<p class="body-text">
<code>إنجيل التنفيذ الرئيسي</code> (Master Execution Bible) هو المُدير الأعلى لجميع وثائق فيكسور. هو المستند الوحيد الذي يربط كل الإنجيلات ببعضها البعض ويُنشئ سلسلة تتبع كاملة من الفكرة إلى الكود إلى الاختبار إلى السبرنت. إذا كنت ستقرأ مستندًا واحدًا فقط لتفهم كيف يعمل فيكسور — فهذا هو المستند.
</p>
<div class="callout callout-success">
    <div class="callout-title">🎯 الهدف الأساسي</div>
    <div class="callout-body">
        تحويل منظومة الوثائق من كومة ورقية جامدة إلى <strong>آلة تنفيذ حية</strong> تعمل عبر Git Hooks وCI Checks ومهام السبرنت المُرمَّزة في الكود نفسه. الهدف النهائي: ضمان أن أي تغيير في الكود يمكن تتبعه إلى متطلبات محددة، وأي متطلب يمكن التحقق من تنفيذه عبر اختبارات آلية.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">فلسفة التنفيذ: من الدليل إلى الكود</div>
</div>
<p class="body-text">
تتبع فيكسور مبدأ <strong>Execution-Driven Development</strong> حيث يكون الكود هو الحقيقة المطلقة والوثائق هي الانعكاس الوصفي. هذا يعني أن كل مستند في المنظومة يُحدَّث من الكود، وليس العكس. عندما يُضاف جدول جديد إلى قاعدة البيانات، يجب تحديث كتاب قواعد البيانات فورًا. عندما يُنشأ نقطة نهاية API جديدة، يجب تحديث كتاب الواجهات البرمجية. هذه الدورة المستمرة تضمن بقاء الوثائق متزامنة مع الواقع الفعلي للنظام.
</p>
<div class="subsection">
    <div class="subsection-title">الأدوار الثلاثة لهذا المستند</div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">المُنسّق المركزي</div>
        <div class="info-card-body">يربط جميع الوثائق ببعضها ويُنشئ خريطة مرجعية شاملة تُسهّل التنقل بينها. كل مستند يُرجع إلى هذا المكان كمرجع مركزي للتنقل.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مُنفّذ الآليات</div>
        <div class="info-card-body">يُعرّف Git Hooks وCI Checks التي تُحوّل قواعد الوثائق إلى عمليات تلقائية تمنع انتهاك المعايير الهندسية.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">حاكم التغيير</div>
        <div class="info-card-body">يُحدد متى وأي وثيقة تحتاج إلى تحديث عند أي تغيير في الكود أو البنية أو المتطلبات، ويضمن عدم شيخوخة أي مستند.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">خريطة التتبع</div>
        <div class="info-card-body">يُوفّر مصفوفة تتبع كاملة من المتطلبات إلى الكود إلى الاختبارات إلى مهام السبرنت، مما يضمن عدم ضياع أي مطلب.</div>
    </div>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ قاعدة حديدية</div>
    <div class="callout-body">
        لا يوجد ميزة في فيكسور بدون مطلب في <code>PRD-01</code>. لا يوجد قرار معماري بدون توثيق في <code>ARC-02</code>. لا يوجد كود من دون مرجع في هذه المصفوفة. أي انتهاك لهذه القاعدة يُعتبر دينًا تقنيًا يجب تسديده في السبرنت التالي.
    </div>
</div>
<p class="body-text">
هذا المستند يُدير علاقة ثنائية الاتجاه: من الوثائق إلى الكود (تنفيذ المتطلبات)، ومن الكود إلى الوثائق (تحديث الانعكاسات). هذه الدورة المغلقة هي ما يجعل فيكسور مشروعًا حيًا يتطور باستمرار مع الحفاظ على اتساق تام بين ما نُخطط له وما نُنفذه.
</p>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-02: خريطة المستندات (Document Map)
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-02",
        "title": "خريطة المستندات (Document Map)",
        "content": """
<p class="body-text">
منظومة فيكسور الهندسية تتكون من <strong>سبعة عشر مستندًا</strong> مُصنّفة إلى خمس فئات رئيسية. كل مستند له دور محدد ومتكامل مع بقية المنظومة. هذا القسم يقدّم الخريطة الكاملة مع معرف المستند، العنوان، عدد الصفحات التقديري، المحتوى الأساسي، والمراجع المتبادلة بين المستندات. فهم هذه الخريطة هو الشرط الأساسي للتنقل في المنظومة بكفاءة.
</p>
<div class="subsection">
    <div class="subsection-title">الفئة الأولى: الأساسيات (Foundation) — 3 مستندات</div>
</div>
<p class="body-text">
هذه المستندات الثلاثة تشكّل حجر الأساس الذي تُبنى عليه كل المنظومة. تبدأ بوثيقة متطلبات المنتج التي تحدد "ماذا" نريد بناءه، ثم وثيقة البنية المعمارية التي تحدد "كيف" نبنيه تقنيًا، ثم وثيقة بنية المنتج التي تربط المتطلبات بالمكونات التقنية بصيغة MOXI-First.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>المعرف</th><th>العنوان</th><th>الصفحات</th><th>المحتوى</th><th>المراجع</th></tr>
    </thead>
    <tbody>
        <tr><td><code>PRD-01</code></td><td>وثيقة متطلبات المنتج</td><td>~35</td><td>جميع متطلبات المنتج النهائية، رؤية فيكسور، الجمهور المستهدف، الميزات الأساسية والثانوية، معايير القبول لكل ميزة</td><td>ARC-02, PARCH-11, UX-04</td></tr>
        <tr><td><code>ARC-02</code></td><td>وثيقة البنية المعمارية</td><td>~30</td><td>البنية التقنية الكاملة: Next.js 16، TypeScript، Prisma، Supabase، Solana Web3.js، استراتيجية التخزين المؤقت، الأمان</td><td>PRD-01, ENG-07, DB-14</td></tr>
        <tr><td><code>PARCH-11</code></td><td>وثيقة بنية المنتج</td><td>~25</td><td>تركيبة المكونات بصيغة MOXI-First، مخطط الشاشات، تدفق البيانات بين المجالات، رسم خرائط الميزات إلى المجالات</td><td>PRD-01, ARC-02, MOXI-12</td></tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">الفئة الثانية: المنتج الأساسي (Core Product) — 4 مستندات</div>
</div>
<p class="body-text">
هذه المستندات تحدد "كيف يبدو" و"كيف يعمل" المنتج من منظور المستخدم. كتاب MOXI هو الأهم لأنه يحدد تجربة الذكاء الاصطناعي الكاملة. كتاب UX يحدد قواعد التفاعل، وكتاب التصميم يحدد الهوية البصرية، وكتاب المكونات يحدد قطع البناء القابلة لإعادة الاستخدام.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>المعرف</th><th>العنوان</th><th>الصفحات</th><th>المحتوى</th><th>المراجع</th></tr>
    </thead>
    <tbody>
        <tr><td><code>MOXI-12</code></td><td>كتاب موكسي (إنجيل MOXI)</td><td>~40</td><td>شخصية MOXI، نظام الأوامر، سير المحادثة، معالجة الإشارات، توليد الرسوم البيانية، تكامل التداول، قوالب الاستجابة</td><td>PARCH-11, UX-04, API-13</td></tr>
        <tr><td><code>UX-04</code></td><td>كتاب تجربة المستخدم</td><td>~28</td><td>مبادئ UX، أنماط التفاعل، تدفقات المستخدم، إرشادات إمكانية الوصول، قواعد الحركة والانتقالات</td><td>PRD-01, DS-05, COMP-06</td></tr>
        <tr><td><code>DS-05</code></td><td>كتاب نظام التصميم</td><td>~22</td><td>الألوان، الخطوط، المسافات، الأيقونات، المتغيرات CSS/Tailwind، قواعد التخطيط، أنماط الظلال والتدرجات</td><td>UX-04, COMP-06</td></tr>
        <tr><td><code>COMP-06</code></td><td>كتاب المكونات</td><td>~35</td><td>كتالوج كل مكون React: Button, Card, Chart, ChatBubble, SignalBadge... مع Props API وأمثلة الاستخدام</td><td>DS-05, ENG-07</td></tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">الفئة الثالثة: التنفيذ (Execution) — 3 مستندات</div>
</div>
<p class="body-text">
مستندات التنفيذ تحول المتطلبات والتصاميم إلى كود فعلي. كتاب المعايير الهندسية يحدد "كيف نكتب الكود"، وهذا المستند (إنجيل التنفيذ الرئيسي) يربط الكل ببعض، وكتاب السبرنت يحدد "متى ننفذ ماذا" عبر خطة السبرنتات التفصيلية.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>المعرف</th><th>العنوان</th><th>الصفحات</th><th>المحتوى</th><th>المراجع</th></tr>
    </thead>
    <tbody>
        <tr><td><code>ENG-07</code></td><td>كتاب المعايير الهندسية</td><td>~30</td><td>Git Workflow، استراتيجية الفروع، قواعد TypeScript، معايير التسمية، هيكل المجلدات، استراتيجية الاختبار، CI/CD</td><td>ARC-02, SEC-09, هذا المستند</td></tr>
        <tr><td><code>MEB</code></td><td>إنجيل التنفيذ الرئيسي (هذا)</td><td>~20</td><td>الخريطة المركزية، آليات الربط، مصفوفة التتبع، Git Hooks، حوكمة التغيير، سلسلة القيمة من MOXI إلى التنفيذ</td><td>جميع المستندات</td></tr>
        <tr><td><code>SPRINT-10</code></td><td>كتاب السبرنتات</td><td>~25</td><td>خطة السبرنتات، أولويات الميزات، تقدير المجهود، تعيين المهام، معايير "تمّ" لكل مهمة</td><td>PRD-01, ENG-07</td></tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">الفئة الرابعة: البيانات والواجهات (Data & API) — 3 مستندات</div>
</div>
<p class="body-text">
هذه المستندات تُحدد كيف يتعامل فيكسور مع البيانات: كيف يُخزنها (قواعد البيانات)، كيف يعرضها (الواجهات البرمجية)، وكيف يحميها (الأمان). الثلاثة مترابطة بشكل وثيق لأن كل نقطة نهاية API تقرأ وتكتب جداول محددة، وكل جدول يحتاج قواعد حماية أمنية.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>المعرف</th><th>العنوان</th><th>الصفحات</th><th>المحتوى</th><th>المراجع</th></tr>
    </thead>
    <tbody>
        <tr><td><code>API-13</code></td><td>كتاب الواجهات البرمجية</td><td>~30</td><td>جميع نقاط النهاية: <code>/api/signal/*</code>, <code>/api/moxi/*</code>, <code>/api/trade/*</code>... مع الطلبات والردود وأخطاء المصادقة</td><td>ARC-02, DB-14, SEC-09</td></tr>
        <tr><td><code>DB-14</code></td><td>كتاب قواعد البيانات</td><td>~28</td><td>مخطط Prisma الكامل، كل جدول وعمود وعلاقة، الفهارس، سياسات RLS، إجراءات التهيئة وبذر البيانات</td><td>ARC-02, API-13, SEC-09</td></tr>
        <tr><td><code>SEC-09</code></td><td>كتاب الأمان</td><td>~22</td><td>المصادقة عبر Supabase Auth، RLS على كل جدول، تشفير JWT، حماية نقاط النهاية، سياسة الكشف عن الثغرات</td><td>DB-14, API-13, ENG-07</td></tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">الفئة الخامسة: العمليات (Operations) — 4 مستندات</div>
</div>
<p class="body-text">
مستندات العمليات تحكم كيف يُدار المشروع بعد كتابة الكود: كيف نتوثّق القرارات، كيف نُصدّر الإصدارات، كيف نُشغّل النظام في بيئة الإنتاج، وكيف نُنفّذ السبرنتات فعليًا مع تتبع التقدم والإنتاجية.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>المعرف</th><th>العنوان</th><th>الصفحات</th><th>المحتوى</th><th>المراجع</th></tr>
    </thead>
    <tbody>
        <tr><td><code>ADR-15</code></td><td>سجل القرارات المعمارية</td><td>~20</td><td>جميع القرارات التقنية الكبرى مع السياق والبدائل المعتبَرة والقرار النهائي والتأثير على النظام</td><td>ARC-02, ENG-07</td></tr>
        <tr><td><code>REL-16</code></td><td>كتاب الإصدارات</td><td>~15</td><td>استراتيجية الإصدارات، semantic versioning، قوائم التحقق قبل النشر، إجراءات التراجع، سجل التغييرات</td><td>ENG-07, ADR-15</td></tr>
        <tr><td><code>OPS-17</code></td><td>كتاب العمليات</td><td>~18</td><td>مراقبة الإنتاج، إدارة السجلات، تنبيهات الأعطال، إجراءات الاستجابة للحوادث، نسخ الاحتياطي</td><td>SEC-09, REL-16</td></tr>
        <tr><td><code>SPRINT-EX</code></td><td>تنفيذ السبرنت</td><td>~15</td><td>التنفيذ اليومي للسبرنت: Daily Standup، تعقب المهمات، مراجعة الكود، Demo، Retrospective</td><td>SPRINT-10, ENG-07</td></tr>
    </tbody>
</table>
<div class="callout">
    <div class="callout-title">📊 إحصائيات المنظومة</div>
    <div class="callout-body">
        المجموع: <strong>17 مستندًا</strong> تقريبيًا <strong>~380 صفحة</strong> من التوثيق الهندسي الشامل. كل مستند مرتبط بـ 2-5 مستندات أخرى على الأقل عبر مراجع متبادلة. هذه الكثافة من الربط هي ما يجعل المنظومة حية بدلًا من كومة ورقية.
    </div>
</div>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-03: سلسلة القيمة: من MOXI إلى التنفيذ
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-03",
        "title": "سلسلة القيمة: من MOXI إلى التنفيذ",
        "content": """
<p class="body-text">
فلسفة فيكسور تتمحور حول <strong>MOXI-First</strong> — فكرة أن الذكاء الاصطناعي (MOXI) هو نقطة الدخول الأساسية لكل شيء يفعله المستخدم. المستخدم لا يُدير الرسوم البيانية ولا يُنفّذ الصفقات يدويًا — بل يتحدث مع MOXI الذي يُترجم نية المستخدم إلى إجراءات فعلية. سلسلة القيمة هذه تُظهر كيف تتدفق الفكرة من المحادثة إلى التنفيذ الفعلي، مع ربط كل خطوة بالمستند المسؤول والكود المنفّذ.
</p>
<div class="subsection">
    <div class="subsection-title">مراحل سلسلة القيمة</div>
</div>
<table class="vixor-table">
    <thead>
        <tr><th>#</th><th>المرحلة</th><th>الوصف</th><th>المستند المسؤول</th><th>الكود المنفّذ</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><code>1</code></td>
            <td><strong>VIXOR Dashboard</strong></td>
            <td>لوحة التحكم الرئيسية تعرض نبذة السوق، الإشارات النشطة، حالة المحفظة، والأداء اليومي. نقطة البداية لكل تفاعل</td>
            <td>PRD-01, UX-04, DS-05</td>
            <td><code>src/app/(dashboard)/page.tsx</code></td>
        </tr>
        <tr>
            <td><code>2</code></td>
            <td><strong>MOXI Chat</strong></td>
            <td>محادثة المستخدم مع MOXI: فهم النية، صياغة الاستعلام، اقتراح الإجراءات. MOXI يحلل السوق ويُقدّم فرصًا</td>
            <td>MOXI-12, API-13</td>
            <td><code>src/domains/moxi/</code></td>
        </tr>
        <tr>
            <td><code>3</code></td>
            <td><strong>Today's Mission</strong></td>
            <td>مهمة اليوم: تلخيص أفضل الفرص بناءً على تحليل MOXI، تحديد العملات ذات الإشارات الأقوى، تحديد أهداف الربح والخسارة</td>
            <td>MOXI-12, PRD-01</td>
            <td><code>src/domains/mission/</code></td>
        </tr>
        <tr>
            <td><code>4</code></td>
            <td><strong>Best Opportunity</strong></td>
            <td>اختيار أفضل فرصة من القائمة: عرض تفصيلي للعملة، حجم التداول، مؤشرات التقنية،_sentiment السوق</td>
            <td>MOXI-12, UX-04</td>
            <td><code>src/domains/opportunity/</code></td>
        </tr>
        <tr>
            <td><code>5</code></td>
            <td><strong>Chart Analysis</strong></td>
            <td>عرض الرسم البياني المتقدم: شموع يابانية، مؤشرات فنية، مناطق الدعم والمقاومة، أدوات الرسم</td>
            <td>PRD-01, DS-05, COMP-06</td>
            <td><code>src/domains/chart/</code></td>
        </tr>
        <tr>
            <td><code>6</code></td>
            <td><strong>Trade Execution</strong></td>
            <td>تنفيذ الصفقة: تأكيد MOXI، إرسال المعاملة إلى Solana عبر Phantom، تتبع الحالة، إشعار النتيجة</td>
            <td>API-13, SEC-09, DB-14</td>
            <td><code>src/domains/trade/</code></td>
        </tr>
        <tr>
            <td><code>7</code></td>
            <td><strong>Review & Learn</strong></td>
            <td>مراجعة النتائج: تحليل أداء الصفقات، تعلم من الأخطاء، تحديث استراتيجية MOXI، إعداد مهمة الغد</td>
            <td>SPRINT-10, OPS-17</td>
            <td><code>src/domains/review/</code></td>
        </tr>
    </tbody>
</table>
<div class="callout callout-success">
    <div class="callout-title">🔄 الدورة المغلقة</div>
    <div class="callout-body">
        سلسلة القيمة ليست خطية — إنها <strong>دورة مستمرة</strong>. نتائج مرحلة المراجعة (7) تُغذّي مرحلة مهمة اليوم (3) في الدورة التالية. MOXI يتعلّم من كل صفقة ويُحسّن توصياته. هذه الدورة هي ما يجعل فيكسور <strong>أداة تداول ذكية</strong> وليست مجرد واجهة عرض بيانات.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">التدفق التقني الكامل</div>
</div>
<p class="body-text">
عندما يتحدث المستخدم مع MOXI، يمر الطلب عبر عدة طبقات تقنية. أولًا، واجهة المحادثة في <code>src/domains/moxi/components/ChatInterface.tsx</code> تُرسل الرسالة إلى نقطة النهاية <code>POST /api/moxi/chat</code>. هذه النقطة تُعالج النية عبر <code>src/server/routes/moxi.ts</code>، ثم تستعلم بيانات السوق من <code>src/lib/market-data/</code>. إذا كانت النية هي تنفيذ صفقة، يُنشأ سجل إشارة في <code>Signal</code> (جدول في Supabase)، ويُرسل أمر التداول عبر <code>src/lib/solana/trade.ts</code> إلى شبكة Solana. كل خطوة مُوثّقة في مستند مناسب وتُختبر في اختبارات وحدوية.
</p>
<div class="subsection">
    <div class="subsection-title">رسم الخرائط: المجالات ← الملفات</div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">مجال MOXI</div>
        <div class="info-card-body"><code>src/domains/moxi/</code> — محادثة الذكاء الاصطناعي، معالجة الأوامر، توليد الرسوم البيانية. يعتمد على <code>MOXI-12</code> و <code>API-13</code></div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مجال الإشارات</div>
        <div class="info-card-body"><code>src/domains/signal-tracking/</code> — تتبع إشارات التداول، حالة كل إشارة، إشعارات التنبيه. يعتمد على <code>DB-14</code> و <code>SEC-09</code></div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مجال التداول</div>
        <div class="info-card-body"><code>src/domains/trade/</code> — تنفيذ الصفقات، تكامل Phantom، إدارة المخاطر. يعتمد على <code>API-13</code> و <code>SEC-09</code></div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مجال الرسوم البيانية</div>
        <div class="info-card-body"><code>src/domains/chart/</code> — عرض الشموع، المؤشرات الفنية، أدوات الرسم. يعتمد على <code>COMP-06</code> و <code>DS-05</code></div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مجال المهمة</div>
        <div class="info-card-body"><code>src/domains/mission/</code> — مهمة اليوم، أفضل الفرص، ملخص السوق. يعتمد على <code>MOXI-12</code> و <code>UX-04</code></div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مجال المراجعة</div>
        <div class="info-card-body"><code>src/domains/review/</code> — مراجعة الأداء، تحليل النتائج، تقارير الربح والخسارة. يعتمد على <code>SPRINT-10</code> و <code>DB-14</code></div>
    </div>
</div>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-04: آلية الربط بين المستندات
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-04",
        "title": "آلية الربط بين المستندات",
        "content": """
<p class="body-text">
الربط بين المستندات ليس عشوائيًا — إنه يتبع <strong>نمط تتبع صارم</strong> يضمن عدم وجود متطلب معزول أو كود يتيم. كل عنصر في المنظومة يرتبط بسلسلة واضحة: المتطلبات ← القرارات المعمارية ← الكود ← الاختبارات ← مهام السبرنت. هذا النمط يُنفّذ عبر ثلاث آليات أساسية: المراجع المتبادلة في النص، مصفوفة التتبع الرقمية، والتحقق الآلي عبر CI.
</p>
<div class="subsection">
    <div class="subsection-title">آلية 1: المراجع المتبادلة في النص</div>
</div>
<p class="body-text">
كل مستند يحتوي مراجع صريحة للمستندات الأخرى باستخدام معرّفات المستندات. على سبيل المثال، عندما يذكر <code>PRD-01</code> ميزة "محادثة MOXI"، فإنه يشير صراحةً إلى <code>MOXI-12</code> للحصول على تفاصيل التنفيذ، وإلى <code>API-13</code> لنقاط النهاية المرتبطة، وإلى <code>DB-14</code> لجداول البيانات المطلوبة. هذه المراجع ليست مجرد إشارات نصية — إنها <strong>عقود وثائقية</strong> يُفترض أن يكون المحتوى متسقًا عبرها.
</p>
<div class="callout">
    <div class="callout-title">📝 قاعدة المرجعية</div>
    <div class="callout-body">
        أي ميزة مذكورة في <code>PRD-01</code> يجب أن يكون لها مرجع في <code>PARCH-11</code> (البنية)، ومرجع في <code>MOXI-12</code> (الذكاء الاصطناعي)، ومرجع في <code>API-13</code> (الواجهة)، ومرجع في <code>DB-14</code> (البيانات)، ومرجع في <code>SPRINT-10</code> (التنفيذ). إذا فقد أي مرجع — فهناك فجوة يجب ملؤها.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">آلية 2: مصفوفة التتبع الرقمية</div>
</div>
<p class="body-text">
مصفوفة التتبع هي جدول مركزي يربط كل متطلب منتج (من <code>PRD-01</code>) بالمكونات المعمارية (من <code>ARC-02</code>) وملفات الكود الفعلية واختباراتها ومهمة السبرنت المسؤولة عن تنفيذها. هذه المصفوفة تُحفَظ في هذا المستند وتُحدّث تلقائيًا عند كل تغيير في السبرنتات أو المتطلبات.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>متطلب PRD</th><th>قرار معماري</th><th>ملف الكود</th><th>ملف الاختبار</th><th>مهمة السبرنت</th><th>الحالة</th></tr>
    </thead>
    <tbody>
        <tr><td>PRD-01-F01<br>محادثة MOXI</td><td>ARC-02-S03<br>OpenAI + Edge Functions</td><td><code>moxi/ChatInterface.tsx</code></td><td><code>moxi/Chat.test.ts</code></td><td>SPRINT-02-T03</td><td>✅ مكتمل</td></tr>
        <tr><td>PRD-01-F04<br>تتبع الإشارات</td><td>ARC-02-S05<br>Supabase Realtime</td><td><code>signal-tracking/SignalList.tsx</code></td><td><code>signal-tracking/Signals.test.ts</code></td><td>SPRINT-03-T01</td><td>✅ مكتمل</td></tr>
        <tr><td>PRD-01-F06<br>تنفيذ التداول</td><td>ARC-02-S06<br>Solana Web3.js + Phantom</td><td><code>trade/TradeExecutor.tsx</code></td><td><code>trade/Trade.test.ts</code></td><td>SPRINT-04-T02</td><td>🔄 قيد التنفيذ</td></tr>
        <tr><td>PRD-01-F08<br>لوحة التحكم</td><td>ARC-02-S02<br>Server Components + ISR</td><td><code>dashboard/DashboardPage.tsx</code></td><td><code>dashboard/Dashboard.test.ts</code></td><td>SPRINT-01-T01</td><td>✅ مكتمل</td></tr>
        <tr><td>PRD-01-F10<br>مهمة اليوم</td><td>ARC-02-S04<br>AI Summarization Pipeline</td><td><code>mission/MissionPanel.tsx</code></td><td><code>mission/Mission.test.ts</code></td><td>SPRINT-05-T01</td><td>📋 مخطط</td></tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">آلية 3: التحقق الآلي عبر CI</div>
</div>
<p class="body-text">
أقوى آلية ربط هي التحقق الآلي. بدلًا من الاعتماد على البشر لتذكّر تحديث المستندات، نستخدم Git Hooks وCI Checks تُنفّذ عمليات فحص آلية. مثلاً، إذا أضاف مطوّر ملف هجرة جديد لقاعدة البيانات (ملف <code>.sql</code> في <code>prisma/migrations/</code>)، يجب أن تحتوي هذه الهجرة على سياسة RLS — وإلا يرفض الـ CI الطلب. هذا يُحوّل قواعد كتاب الأمان (<code>SEC-09</code>) من نصوص وثائقية إلى قيود تنفيذية فعلية.
</p>
<div class="callout callout-danger">
    <div class="callout-title">🚫 آلية الرفض الآلي</div>
    <div class="callout-body">
        CI Pipeline في فيكسور لا يكتشف الأخطاء البرمجية فقط — بل يتحقق أيضًا من <strong>الامتثال لوثائق الإنجيل</strong>. طلب سحب يحتوي على <code>any</code> في TypeScript يُرفض. طلب سحب يضيف جدولًا بدون RLS يُرفض. طلب سحب يُغيّر ملفًا مذكورًا في مصفوفة التتبع بدون تحديث المصفوفة يُرفض. الهدف: جعل المخالفة مستحيلة تقنيًا.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">رسم بياني لعلاقات المستندات</div>
</div>
<p class="body-text">
العلاقات بين المستندات تُشكّل شبكة مترابطة. <code>PRD-01</code> هو الجذر: كل مستند آخر يعتمد عليه بشكل مباشر أو غير مباشر. <code>ARC-02</code> يترجم متطلبات <code>PRD-01</code> إلى بنية تقنية. <code>PARCH-11</code> يربط البنية بمكونات المنتج. <code>MOXI-12</code> يُفصّل تجربة الذكاء الاصطناعي. <code>ENG-07</code> يحدد كيف نكتب الكود. <code>SEC-09</code> يحمي كل شيء. وهذا المستند (<code>MEB</code>) يجمع الكل في خريطة واحدة قابلة للتنقل والتحقق.
</p>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-05: من الدليل إلى الكود: خريطة التتبع
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-05",
        "title": "من الدليل إلى الكود: خريطة التتبع",
        "content": """
<p class="body-text">
هذا القسم هو الأداة العملية التي يستخدمها كل مطوّر في فيكسور يوميًا. عندما تحتاج لفهم ميزة ما — من فكرتها الأولى في متطلبات المنتج إلى سطر الكود الأخير الذي يُنفّذها — تبدأ من هنا. الخريطة تربط كل ميزة رئيسية بموقعها الدقيق في قاعدة الكود، مع تحديد الملفات الأساسية والمساعدة والاختبارات المرتبطة بها.
</p>
<div class="subsection">
    <div class="subsection-title">خريطة ميزات المنتج ← مواقع الكود</div>
</div>
<table class="vixor-table">
    <thead>
        <tr><th>الميزة</th><th>المتطلب</th><th>المسار الأساسي</th><th>الملفات المساعدة</th><th>الاختبار</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>محادثة MOXI</strong></td>
            <td>PRD-01-F01</td>
            <td><code>src/domains/moxi/ChatInterface.tsx</code></td>
            <td><code>moxi/MessageBubble.tsx</code><br><code>moxi/useChat.ts</code></td>
            <td><code>__tests__/moxi/</code></td>
        </tr>
        <tr>
            <td><strong>مهمة اليوم</strong></td>
            <td>PRD-01-F10</td>
            <td><code>src/domains/mission/MissionPanel.tsx</code></td>
            <td><code>mission/OpportunityCard.tsx</code><br><code>mission/MissionHeader.tsx</code></td>
            <td><code>__tests__/mission/</code></td>
        </tr>
        <tr>
            <td><strong>تتبع الإشارات</strong></td>
            <td>PRD-01-F04</td>
            <td><code>src/domains/signal-tracking/SignalList.tsx</code></td>
            <td><code>signal-tracking/SignalBadge.tsx</code><br><code>signal-tracking/SignalFilters.tsx</code></td>
            <td><code>__tests__/signal-tracking/</code></td>
        </tr>
        <tr>
            <td><strong>الرسوم البيانية</strong></td>
            <td>PRD-01-F05</td>
            <td><code>src/domains/chart/TradingChart.tsx</code></td>
            <td><code>chart/ChartIndicators.ts</code><br><code>chart/ChartToolbar.tsx</code></td>
            <td><code>__tests__/chart/</code></td>
        </tr>
        <tr>
            <td><strong>تنفيذ التداول</strong></td>
            <td>PRD-01-F06</td>
            <td><code>src/domains/trade/TradeExecutor.tsx</code></td>
            <td><code>trade/PhantomConnect.tsx</code><br><code>trade/TradeConfirmation.tsx</code></td>
            <td><code>__tests__/trade/</code></td>
        </tr>
        <tr>
            <td><strong>لوحة التحكم</strong></td>
            <td>PRD-01-F08</td>
            <td><code>src/app/(dashboard)/page.tsx</code></td>
            <td><code>dashboard/MarketOverview.tsx</code><br><code>dashboard/PortfolioSummary.tsx</code></td>
            <td><code>__tests__/dashboard/</code></td>
        </tr>
        <tr>
            <td><strong>إدارة المحفظة</strong></td>
            <td>PRD-01-F07</td>
            <td><code>src/domains/wallet/WalletManager.tsx</code></td>
            <td><code>wallet/BalanceDisplay.tsx</code><br><code>wallet/TransactionHistory.tsx</code></td>
            <td><code>__tests__/wallet/</code></td>
        </tr>
        <tr>
            <td><strong>مراجعة الأداء</strong></td>
            <td>PRD-01-F09</td>
            <td><code>src/domains/review/PerformanceReview.tsx</code></td>
            <td><code>review/PnLChart.tsx</code><br><code>review/TradeLog.tsx</code></td>
            <td><code>__tests__/review/</code></td>
        </tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">خريطة البنية التحتية ← مواقع الكود</div>
</div>
<table class="vixor-table">
    <thead>
        <tr><th>الطبقة</th><th>المستند</th><th>المسار</th><th>الوصف</th></tr>
    </thead>
    <tbody>
        <tr><td><strong>الواجهات البرمجية</strong></td><td>API-13</td><td><code>src/server/routes/</code></td><td>جميع نقاط النهاية: <code>moxi.ts</code>, <code>signal.ts</code>, <code>trade.ts</code>, <code>market.ts</code></td></tr>
        <tr><td><strong>قاعدة البيانات</strong></td><td>DB-14</td><td><code>prisma/schema.prisma</code></td><td>مخطط Prisma الكامل: كل نموذج، علاقة، فهرس، وسياسة RLS</td></tr>
        <tr><td><strong>المصادقة</strong></td><td>SEC-09</td><td><code>src/lib/auth/</code></td><td>إدارة الجلسات، التحقق من الرموز، حماية المسارات</td></tr>
        <tr><td><strong>بيانات السوق</strong></td><td>API-13</td><td><code>src/lib/market-data/</code></td><td>جلب بيانات السوق من Solana RPC، معالجة الإشارات</td></tr>
        <tr><td><strong>تكامل Solana</strong></td><td>ARC-02</td><td><code>src/lib/solana/</code></td><td>اتصال الشبكة، بناء المعاملات، إدارة المفاتيح عبر Phantom</td></tr>
        <tr><td><strong>المكونات المشتركة</strong></td><td>COMP-06</td><td><code>src/components/ui/</code></td><td>المكونات القابلة لإعادة الاستخدام: Button, Card, Badge, Input...</td></tr>
        <tr><td><strong>أنماط التصميم</strong></td><td>DS-05</td><td><code>src/styles/</code> + Tailwind</td><td>المتغيرات CSS، إعدادات Tailwind، الرسوم المتحركة</td></tr>
    </tbody>
</table>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ عند إضافة ميزة جديدة</div>
    <div class="callout-body">
        يجب إجراء ثلاث خطوات بالتوازي: (1) إضافة المتطلب إلى <code>PRD-01</code>، (2) تحديث مصفوفة التتبع في هذا المستند بإضافة صف جديد، (3) إنشاء مجلد الميزة في <code>src/domains/</code> مع ملفات الكود والاختبار. أي ميزة تنقص واحدة من هذه الخطوات تُعتبر <strong>دينًا تقنيًا</strong> يُسجّل في سجل ADR-15.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">هيكل مجلدات المجالات</div>
</div>
<div class="code-block">src/domains/
├── moxi/              # محادثة MOXI (MOXI-12)
│   ├── ChatInterface.tsx
│   ├── MessageBubble.tsx
│   ├── useChat.ts
│   └── types.ts
├── mission/           # مهمة اليوم (PRD-01-F10)
│   ├── MissionPanel.tsx
│   ├── OpportunityCard.tsx
│   └── MissionHeader.tsx
├── signal-tracking/   # تتبع الإشارات (PRD-01-F04)
│   ├── SignalList.tsx
│   ├── SignalBadge.tsx
│   └── SignalFilters.tsx
├── chart/             # الرسوم البيانية (PRD-01-F05)
│   ├── TradingChart.tsx
│   ├── ChartIndicators.ts
│   └── ChartToolbar.tsx
├── trade/             # تنفيذ التداول (PRD-01-F06)
│   ├── TradeExecutor.tsx
│   ├── PhantomConnect.tsx
│   └── TradeConfirmation.tsx
├── wallet/            # إدارة المحفظة (PRD-01-F07)
│   ├── WalletManager.tsx
│   └── BalanceDisplay.tsx
├── review/            # مراجعة الأداء (PRD-01-F09)
│   ├── PerformanceReview.tsx
│   └── PnLChart.tsx
└── dashboard/         # لوحة التحكم (PRD-01-F08)
    ├── MarketOverview.tsx
    └── PortfolioSummary.tsx</div>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-06: نظام التنفيذ: Git Hooks و CI Checks
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-06",
        "title": "نظام التنفيذ: Git Hooks و CI Checks",
        "content": """
<p class="body-text">
الوثائق وحدها لا تكفي — نحتاج آليات <strong>تُنفّذ قواعد الوثائق تلقائيًا</strong>. هذا القسم يُحدد نظام Git Hooks وCI Checks الذي يُحوّل قواعد كتب المعايير الهندسية (<code>ENG-07</code>) وكتاب الأمان (<code>SEC-09</code>) وكتاب قواعد البيانات (<code>DB-14</code>) من نصوص وثائقية إلى قيود تقنية تُرفض تلقائيًا عند مخالفتها. الهدف هو جعل <strong>الامتثال هو الحالة الافتراضية</strong> والمخالفة مستحيلة تقنيًا.
</p>
<div class="subsection">
    <div class="subsection-title">Git Hooks: الحماية عند المستوى المحلي</div>
</div>
<p class="body-text">
Git Hooks تُنفّذ قبل أن يُرسل المطور الكود إلى المستودع البعيد. هذا يوفر ردود فعل فورية ويمنع إرسال كود مخالف من الأساس. الفريق يستخدم <code>husky</code> لإدارة الـ hooks و<code>lint-staged</code> لتشغيل الفحوصات فقط على الملفات المعدلة.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>الخطاف</th><th>التوقيت</th><th>الفحوصات</th><th>القاعدة المُنفّذة</th><th>المستند المصدر</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><code>pre-commit</code></td>
            <td>قبل كل التزام</td>
            <td>ESLint + Prettier + TypeScript type check</td>
            <td>لا يُسمح بأخطاء Lint أو أنواع <code>any</code> غير المُعلَنة</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>pre-commit</code></td>
            <td>قبل كل التزام</td>
            <td>فحص الأمان: <code>no-hardcoded-secrets</code></td>
            <td>لا تُسمح المفاتيح السرية أو مفاتيح API في الكود</td>
            <td>SEC-09</td>
        </tr>
        <tr>
            <td><code>pre-commit</code></td>
            <td>قبل كل التزام</td>
            <td>فحص التسمية: مطابقة أسماء الملفات للمعايير</td>
            <td>المكونات: PascalCase، الأدوات: camelCase، الثوابت: UPPER_SNAKE</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>pre-push</code></td>
            <td>قبل كل دفع</td>
            <td>تشغيل اختبارات الوحدات: <code>vitest run</code></td>
            <td>لا يُسمح بدفع كود يكسر اختبارًا موجودًا</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>pre-push</code></td>
            <td>قبل كل دفع</td>
            <td>فحص البناء: <code>pnpm build</code></td>
            <td>لا يُسمح بدفع كود لا يبني بنجاح</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>commit-msg</code></td>
            <td>عند كتابة رسالة التزام</td>
            <td>فحص صيغة Conventional Commits</td>
            <td><code>feat:</code>, <code>fix:</code>, <code>docs:</code>, <code>refactor:</code> ... مطلوبة</td>
            <td>ENG-07</td>
        </tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">CI Checks: الحماية على مستوى طلبات السحب</div>
</div>
<p class="body-text">
CI Pipeline يُشغّل فحوصات أعمق عند إنشاء طلب سحب (Pull Request). هذه الفحوصات تتضمن تحليلًا شاملًا لا يمكن تشغيله محليًا لأسباب تتعلق بالأداء، مثل فحص جميع ملفات الكود (وليس فقط المعدلة) والتحقق من اتساق قاعدة البيانات ومطابقة المستندات.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>الفحص</th><th>الأداة</th><th>الوصف</th><th>القاعدة</th><th>المستند المصدر</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><code>no-any-check</code></td>
            <td>ESLint Plugin مخصص</td>
            <td>فحص شامل لاستخدام <code>any</code> في TypeScript</td>
            <td>رفض أي <code>any</code> بدون تعليق <code>// @ts-expect-error</code> مُوثّق</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>rls-enforcement</code></td>
            <td>سكريبت مخصص</td>
            <td>فحص كل هجرة جديدة في <code>prisma/migrations/</code></td>
            <td>كل جدول جديد يجب أن يحتوي سياسة RLS مُفعّلة</td>
            <td>SEC-09, DB-14</td>
        </tr>
        <tr>
            <td><code>api-consistency</code></td>
            <td>سكريبت مخصص</td>
            <td>مقارنة نقاط النهاية الفعلية مع <code>API-13</code></td>
            <td>كل نقطة نهاية جديدة يجب أن تكون مُوثّقة في API Bible</td>
            <td>API-13</td>
        </tr>
        <tr>
            <td><code>schema-sync</code></td>
            <td>سكريبت مخصص</td>
            <td>مقارنة <code>schema.prisma</code> مع توثيق <code>DB-14</code></td>
            <td>كل جدول/عمود جديد يجب أن يكون مُوثّقًا في كتاب قواعد البيانات</td>
            <td>DB-14</td>
        </tr>
        <tr>
            <td><code>test-coverage</code></td>
            <td>Vitest + c8</td>
            <td>قياس نسبة تغطية الاختبارات</td>
            <td>الحد الأدنى: 70% لكل ملف جديد، 50% للمشروع الكامل</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>build-check</code></td>
            <td><code>pnpm build</code></td>
            <td>بناء كامل للتطبيق</td>
            <td>يجب أن ينجح البناء بدون أخطاء أو تحذيرات</td>
            <td>ENG-07</td>
        </tr>
        <tr>
            <td><code>dependency-audit</code></td>
            <td><code>pnpm audit</code></td>
            <td>فحص الثغرات في الحزم المعتمدة</td>
            <td>لا تُسمح ثغرات ذات خطورة عالية أو حرجة</td>
            <td>SEC-09</td>
        </tr>
    </tbody>
</table>
<div class="callout callout-success">
    <div class="callout-title">✅ مثال: رفض طلب سحب مخالف</div>
    <div class="callout-body">
        مطوّر يُضيف جدول <code>Trade</code> جديد في <code>schema.prisma</code> بدون إضافة سياسة RLS. CI يُنفّذ <code>rls-enforcement</code>، يكتشف أن الجدول الجديد ليس له سياسة حماية، ويُرجع طلب السحب مع رسالة واضحة: <code>"جدول 'Trade' الجديد يفتقد سياسة RLS. راجع SEC-09 القسم 4.2 لإضافة السياسة."</code> — الطالب لا يُدمج حتى يتم إصلاح المشكلة.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">التكوين العملي: ملف .husky و lint-staged</div>
</div>
<div class="code-block"># .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged

# ─── Security: reject hardcoded secrets ───
if git diff --cached --name-only | xargs rg -l '(SECRET|PRIVATE_KEY|API_KEY|PASSWORD)\\s*=' --no-ignore-vcs; then
  echo "🚫 HARD-CODED SECRET DETECTED — See SEC-09 Section 2.1"
  exit 1
fi

# ─── Naming: enforce file naming conventions ───
# Components: PascalCase.tsx | Utilities: camelCase.ts | Constants: UPPER_SNAKE.ts</div>
<div class="code-block">// package.json — lint-staged config
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --max-warnings=0 --fix",
      "prettier --write",
      "tsc --noEmit --pretty"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}</div>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-07: مصفوفة التتبع: المتطلبات ← الكود ← الاختبار ← السبرنت
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-07",
        "title": "مصفوفة التتبع: المتطلبات ← الكود ← الاختبار ← السبرنت",
        "content": """
<p class="body-text">
مصفوفة التتبع هي <strong>العمود الفقري</strong> لإنجيل التنفيذ الرئيسي. تُوفّر رؤية شاملة تربط كل متطلب منتج بموقعه في الكود واختباره ومهمة السبرنت المسؤولة عن تنفيذه. هذه المصفوفة هي المرجع الأول عند الإجابة عن أسئلة مثل: "أين يُنفّذ هذا المتطلب؟" أو "هل هذا المتطلبات مُختبر؟" أو "في أي سبرنت سيُنفّذ؟"
</p>
<div class="callout">
    <div class="callout-title">📊 كيف تُقرأ هذه المصفوفة</div>
    <div class="callout-body">
        كل صف يمثل ميزة واحدة. ابدأ من المتطلب في <code>PRD-01</code>، ثم انتقل يمينًا لتجد القرار المعماري في <code>ARC-02</code>، ثم ملفات الكود، ثم ملفات الاختبار، ثم مهمة السبرنت في <code>SPRINT-10</code>. إذا أي عمود فارغ — فهناك فجوة يجب معالجتها.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">المصفوفة الكاملة — الميزات المُنفّذة</div>
</div>
<table class="vixor-table">
    <thead>
        <tr><th>المتطلب</th><th>القرار المعماري</th><th>الملف الأساسي</th><th>ملف الاختبار</th><th>السبرنت</th><th>الحالة</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><code>PRD-F01</code><br>محادثة MOXI</td>
            <td><code>ARC-S03</code><br>Edge Functions + SSE</td>
            <td><code>moxi/ChatInterface.tsx</code></td>
            <td><code>moxi/Chat.test.ts</code></td>
            <td><code>SPR-02-T03</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>PRD-F02</code><br>تحليل السوق</td>
            <td><code>ARC-S04</code><br>Helius RPC + Caching</td>
            <td><code>lib/market-data/fetcher.ts</code></td>
            <td><code>market-data/fetcher.test.ts</code></td>
            <td><code>SPR-01-T02</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>PRD-F03</code><br>مولّد الإشارات</td>
            <td><code>ARC-S05</code><br>Rule Engine + Realtime</td>
            <td><code>lib/signals/generator.ts</code></td>
            <td><code>signals/generator.test.ts</code></td>
            <td><code>SPR-03-T02</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>PRD-F04</code><br>تتبع الإشارات</td>
            <td><code>ARC-S05</code><br>Supabase Realtime</td>
            <td><code>signal-tracking/SignalList.tsx</code></td>
            <td><code>signal-tracking/SignalList.test.ts</code></td>
            <td><code>SPR-03-T01</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>PRD-F05</code><br>الرسوم البيانية</td>
            <td><code>ARC-S07</code><br>Lightweight Charts</td>
            <td><code>chart/TradingChart.tsx</code></td>
            <td><code>chart/TradingChart.test.ts</code></td>
            <td><code>SPR-02-T01</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>PRD-F06</code><br>تنفيذ التداول</td>
            <td><code>ARC-S06</code><br>Solana Web3.js + Phantom</td>
            <td><code>trade/TradeExecutor.tsx</code></td>
            <td><code>trade/TradeExecutor.test.ts</code></td>
            <td><code>SPR-04-T02</code></td>
            <td style="color:#F5A623">🔄 قيد التنفيذ</td>
        </tr>
        <tr>
            <td><code>PRD-F07</code><br>إدارة المحفظة</td>
            <td><code>ARC-S06</code><br>Phantom Deep Link</td>
            <td><code>wallet/WalletManager.tsx</code></td>
            <td><code>wallet/WalletManager.test.ts</code></td>
            <td><code>SPR-04-T01</code></td>
            <td style="color:#F5A623">🔄 قيد التنفيذ</td>
        </tr>
        <tr>
            <td><code>PRD-F08</code><br>لوحة التحكم</td>
            <td><code>ARC-S02</code><br>Server Components + ISR</td>
            <td><code>app/(dashboard)/page.tsx</code></td>
            <td><code>dashboard/Dashboard.test.ts</code></td>
            <td><code>SPR-01-T01</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>PRD-F09</code><br>مراجعة الأداء</td>
            <td><code>ARC-S04</code><br>Aggregate Queries</td>
            <td><code>review/PerformanceReview.tsx</code></td>
            <td><code>review/Performance.test.ts</code></td>
            <td><code>SPR-05-T02</code></td>
            <td style="color:#9498A8">📋 مخطط</td>
        </tr>
        <tr>
            <td><code>PRD-F10</code><br>مهمة اليوم</td>
            <td><code>ARC-S04</code><br>AI Summarization</td>
            <td><code>mission/MissionPanel.tsx</code></td>
            <td><code>mission/MissionPanel.test.ts</code></td>
            <td><code>SPR-05-T01</code></td>
            <td style="color:#9498A8">📋 مخطط</td>
        </tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">المصفوفة الكاملة — متطلبات الأمان والبنية</div>
</div>
<table class="vixor-table">
    <thead>
        <tr><th>المتطلب</th><th>القرار</th><th>الملف</th><th>الاختبار</th><th>السبرنت</th><th>الحالة</th></tr>
    </thead>
    <tbody>
        <tr>
            <td><code>SEC-R01</code><br>المصادقة</td>
            <td>Supabase Auth + JWT</td>
            <td><code>lib/auth/session.ts</code></td>
            <td><code>auth/session.test.ts</code></td>
            <td><code>SPR-01-T03</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>SEC-R02</code><br>RLS على كل جدول</td>
            <td>Supabase RLS Policies</td>
            <td><code>prisma/schema.prisma</code></td>
            <td><code>__tests__/rls/</code></td>
            <td><code>SPR-01-T04</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>SEC-R03</code><br>تشفير المعاملات</td>
            <td>Solana Native Encryption</td>
            <td><code>lib/solana/encrypt.ts</code></td>
            <td><code>solana/encrypt.test.ts</code></td>
            <td><code>SPR-04-T03</code></td>
            <td style="color:#F5A623">🔄 قيد التنفيذ</td>
        </tr>
        <tr>
            <td><code>DB-R01</code><br>هجرة قاعدة البيانات</td>
            <td>Prisma Migrate</td>
            <td><code>prisma/migrations/</code></td>
            <td><code>__tests__/db/migrate.test.ts</code></td>
            <td><code>SPR-01-T05</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
        <tr>
            <td><code>DB-R02</code><br>بذر البيانات</td>
            <td>Prisma Seed Script</td>
            <td><code>prisma/seed.ts</code></td>
            <td><code>__tests__/db/seed.test.ts</code></td>
            <td><code>SPR-01-T06</code></td>
            <td style="color:#22D3A6">✅ مكتمل</td>
        </tr>
    </tbody>
</table>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ إشارة الفجوة</div>
    <div class="callout-body">
        أي صف في المصفوفة يحتوي على خلية فارغة في عمود "الاختبار" يُمثّل <strong>دينًا تقنيًا</strong>. أي صف يحتوي على خلية فارغة في عمود "السبرنت" يُمثّل ميزة <strong>غير مُخطط لها</strong>. الهدف: أن تكون كل الخلايا مملوءة قبل إطلاق النسخة 1.0. الفريق يُراجع هذه المصفوفة في كل Retrospective لضمان عدم تراكم الفجوات.
    </div>
</div>
"""
    },

    # ════════════════════════════════════════════════════════════
    # SEC-08: حوكمة التغيير: كيف نحدث المستندات
    # ════════════════════════════════════════════════════════════
    {
        "tag": "SEC-08",
        "title": "حوكمة التغيير: كيف نحدث المستندات",
        "content": """
<p class="body-text">
الوثائق الميتة أخطر من عدم وجود وثائق — لأنها تُعطي إحساسًا زائفًا بالأمان. فيكسور يتعامل مع الوثائق ككود حي: يجب أن تكون دائمًا متزامنة مع الواقع، ويجب أن يكون تحديثها جزءًا لا يتجزأ من عملية التطوير. هذا القسم يُحدد <strong>حوكمة التغيير</strong>: متى تُحدَّث أي وثيقة، من المسؤول عن التحديث، وكيف نتحقق من أن التحديث تم.
</p>
<div class="subsection">
    <div class="subsection-title">مبدأ أساسي: الوثيقة تتحدث مع الكود</div>
</div>
<p class="body-text">
في المشاريع التقليدية، الكود يتبع الوثائق. في فيكسور، <strong>الوثائق تعكس الكود</strong>. عندما يُضاف جدول جديد إلى قاعدة البيانات، نحن لا نبحث في الوثائق عن القسم المناسب — بل الكود نفسه يُحدّث الوثائق عبر Git Hooks وCI Checks. هذه الدورة تضمن بقاء الوثائق حية ومتزامنة بدون إرهاق بشري.
</p>
<div class="subsection">
    <div class="subsection-title">مصفوفة حوكمة التغيير</div>
</div>
<p class="body-text">
الجدول التالي يُحدد أي وثيقة يجب تحديثها عند كل نوع من التغييرات في الكود. هذه المصفوفة هي المرجع الأول لكل مطوّر يُجري تغييرًا — راجعها قبل提交 (Commit) أي تعديل.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>نوع التغيير في الكود</th><th>الوثيقة المطلوب تحديثها</th><th>القسم المحدد</th><th>الآلية</th></tr>
    </thead>
    <tbody>
        <tr>
            <td>إضافة ميزة جديدة</td>
            <td><code>PRD-01</code>, <code>PARCH-11</code></td>
            <td>قسم الميزات + مخطط المكونات</td>
            <td>يدوي: يجب تحديث PRD قبل بدء التطوير</td>
        </tr>
        <tr>
            <td>إضافة جدول جديد في Prisma</td>
            <td><code>DB-14</code>, <code>SEC-09</code></td>
            <td>مخطط الجداول + سياسات RLS</td>
            <td>آلي: CI يفحص التوافق</td>
        </tr>
        <tr>
            <td>إضافة نقطة نهاية API جديدة</td>
            <td><code>API-13</code>, <code>SEC-09</code></td>
            <td>كتالوج نقاط النهاية + حماية المسارات</td>
            <td>آلي: CI يفحص التوافق</td>
        </tr>
        <tr>
            <td>تعديل مكون React</td>
            <td><code>COMP-06</code></td>
            <td>كتالوج المكونات (Props API)</td>
            <td>يدوي: تحديث عند تغيير واجهة المكون</td>
        </tr>
        <tr>
            <td>تعديل نمط UX</td>
            <td><code>UX-04</code></td>
            <td>أنماط التفاعل + تدفقات المستخدم</td>
            <td>يدوي: تحديث عند تغيير سلوك تفاعلي</td>
        </tr>
        <tr>
            <td>إضافة متغير CSS/Design Token</td>
            <td><code>DS-05</code></td>
            <td>كتالوج المتغيرات</td>
            <td>يدوي: إضافة المتغير الجديد للكتالوج</td>
        </tr>
        <tr>
            <td>تغيير هيكل المجلدات</td>
            <td><code>ENG-07</code>, <code>ARC-02</code></td>
            <td>هيكل المشروع + مخطط البنية</td>
            <td>يدوي: تحديث مخطط المجلدات</td>
        </tr>
        <tr>
            <td>قرار معماري جديد</td>
            <td><code>ADR-15</code>, <code>ARC-02</code></td>
            <td>سجل القرارات + وثيقة البنية</td>
            <td>يدوي: كتابة ADR قبل التنفيذ</td>
        </tr>
        <tr>
            <td>تغيير تكامل MOXI</td>
            <td><code>MOXI-12</code></td>
            <td>أوامر MOXI + قوالب الاستجابة</td>
            <td>يدوي: تحديث عند تغيير سلوك المحادثة</td>
        </tr>
        <tr>
            <td>إعداد إصدار جديد</td>
            <td><code>REL-16</code>, <code>SPRINT-10</code></td>
            <td>سجل التغييرات + تقرير السبرنت</td>
            <td>يدوي: إعداد قبل كل إصدار</td>
        </tr>
    </tbody>
</table>
<div class="subsection">
    <div class="subsection-title">دورة حياة تحديث الوثيقة</div>
</div>
<ol class="vixor-ol">
    <li><strong>اكتشاف التغيير:</strong> يُكتشف التغيير إما عبر CI (آلي) أو مراجعة الكود (يدوي). على سبيل المثال، CI يكتشف جدولًا جديدًا غير مُوثّق في <code>DB-14</code>.</li>
    <li><strong>إنشاء مهمة تحديث:</strong> يُنشأ تلقائيًا (أو يدويًا) تذكير في لوحة السبرنت: "تحديث <code>DB-14</code>: أضف توثيق الجدول الجديد <code>Trade</code>".</li>
    <li><strong>تنفيذ التحديث:</strong> المطور المسؤول عن التغيير الأصلي هو المسؤول الأول عن تحديث الوثيقة. لا يُسمح بترك الوثيقة لمطور آخر.</li>
    <li><strong>التحقق من الاتساق:</strong> CI يُنفّذ فحوصات التوافق للتأكد من أن الوثيقة المُحدّثة تعكس الكود فعلاً.</li>
    <li><strong>إغلاق المهمة:</strong> تُغلَق مهمة التحديث فقط بعد اجتياز فحوصات CI. إذا فشلت الفحوصات، تُعاد للمطور.</li>
</ol>
<div class="callout callout-danger">
    <div class="callout-title">🚫 قواعد عدم التسامح</div>
    <div class="callout-body">
        <strong>القاعدة 1:</strong> لا يُسمح بدمج طلب سحب يُغيّر <code>schema.prisma</code> بدون تحديث <code>DB-14</code>.<br>
        <strong>القاعدة 2:</strong> لا يُسمح بدمج طلب سحب يُضيف نقطة نهاية جديدة بدون تحديث <code>API-13</code>.<br>
        <strong>القاعدة 3:</strong> لا يُسمح بدمج طلب سحب يُغيّر سلوك MOXI بدون تحديث <code>MOXI-12</code>.<br>
        <strong>القاعدة 4:</strong> أي مستند لم يُحدّث منذ أكثر من سبرنتين يُعتبر <strong>قديمًا</strong> ويجب مراجعته.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">جدول الصلاحية</div>
</div>
<p class="body-text">
كل مستند له <strong>جدول صلاحية</strong> يُحدد مدة صلاحيته قبل مراجعة إلزامية. هذا لا يعني أن المستند يصبح غير صالح — بل يعني أنه يجب مراجعته للتأكد من أنه لا يزال يعكس الواقع.
</p>
<table class="vixor-table">
    <thead>
        <tr><th>المستند</th><th>أقصى مدة بدون مراجعة</th><th>آلية المراجعة</th><th>المسؤول</th></tr>
    </thead>
    <tbody>
        <tr><td><code>PRD-01</code></td><td>3 سبرنتات</td><td>مراجعة الميزات قبل كل سبرنت جديد</td><td>مدير المنتج</td></tr>
        <tr><td><code>ARC-02</code></td><td>5 سبرنتات</td><td>مراجعة البنية عند كل قرار معماري كبير</td><td>المهندس الرئيسي</td></tr>
        <tr><td><code>MOXI-12</code></td><td>2 سبرنتات</td><td>مراجعة سلوك MOXI مع كل تحديث للذكاء الاصطناعي</td><td>فريق MOXI</td></tr>
        <tr><td><code>API-13</code></td><td>1 سبرنت</td><td>فحص CI آلي عند كل طلب سحب</td><td>آلي + مطوّر API</td></tr>
        <tr><td><code>DB-14</code></td><td>1 سبرنت</td><td>فحص CI آلي عند كل هجرة جديدة</td><td>آلي + مطوّر DB</td></tr>
        <tr><td><code>SEC-09</code></td><td>3 سبرنتات</td><td>تدقيق أمني ربع سنوي</td><td>فريق الأمان</td></tr>
        <tr><td><code>ENG-07</code></td><td>4 سبرنتات</td><td>مراجعة المعايير عند تحديث الأدوات</td><td>المهندس الرئيسي</td></tr>
        <tr><td>هذا المستند (<code>MEB</code>)</td><td>2 سبرنتات</td><td>تحديث المصفوفات مع كل سبرنت</td><td>المهندس الرئيسي</td></tr>
    </tbody>
</table>
<div class="callout callout-success">
    <div class="callout-title">🎯 الهدف النهائي</div>
    <div class="callout-body">
        وثائق فيكسور ليست ملفات تأخذ الغبار على الرف — إنها <strong>أدوات تنفيذ حية</strong> تُوجّه التطوير، تُنفّذ القواعد آليًا، وتتطور مع الكود. عندما ينجح هذا النموذج، تصبح الوثائق والكود شيئًا واحدًا: انعكاسان لنظام واحد حي.
    </div>
</div>
"""
    },
]


# ────────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    html = generate_vixor_html(
        title="إنجيل التنفيذ الرئيسي",
        subtitle="المستند المركزي الذي يربط منظومة فيكسور الهندسية بالكامل — الخريطة الشاملة للتنفيذ",
        doc_id="VIXOR-MEB-001",
        chapters=chapters,
        footer_text="VIXOR Master Execution Bible — VIXOR-MEB-001",
    )
    html_path = save_html(html, "11-master-execution.html")
    print(f"✅ HTML saved: {html_path}")
    pdf_path = convert_to_pdf(html_path, "11-master-execution.pdf", skill_dir="/home/z/my-project/skills/pdf")
    print(f"✅ PDF saved: {pdf_path}")
    print(f"\n📄 Document: VIXOR-MEB-001 — إنجيل التنفيذ الرئيسي")
    print(f"   Chapters: {len(chapters)} sections")
    print(f"   Output dir: {OUTPUT_DIR}")
