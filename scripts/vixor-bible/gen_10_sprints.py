"""
VIXOR Engineering Bible - Document 10: Sprint Execution Bible (كتاب تنفيذ السبرنتات)
Generates the official 9-sprint improvement plan document in Arabic.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


def sprint_table(tasks):
    """Generate a sprint tasks table in HTML."""
    rows = ""
    for t in tasks:
        rows += f"""        <tr>
            <td>{t[0]}</td>
            <td>{t[1]}</td>
            <td>{t[2]}</td>
            <td>{t[3]}</td>
            <td>{t[4]}</td>
        </tr>\n"""
    return f"""<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
{rows}    </tbody>
</table>"""


def sprint_chapter(tag, title_ar, objectives, tasks, risks, dod):
    """Build a full sprint chapter content block."""
    obj_items = "".join(f"    <li>{o}</li>\n" for o in objectives)
    risk_items = "".join(f"    <li>{r}</li>\n" for r in risks)
    dod_items = "".join(f"    <li>{d}</li>\n" for d in dod)
    tbl = sprint_table(tasks)

    return f"""
<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<p class="body-text">
{objectives_intro if 'objectives_intro' in dir() else ""}
</p>
<ul class="vixor-list">
{obj_items}</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
{tbl}

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
{risk_items}</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
{dod_items}</ul>
"""


# ────────────────────────────────────────────────────────────────
# CHAPTERS DATA
# ────────────────────────────────────────────────────────────────

# Chapter 01 — Introduction
ch_intro = {
    "tag": "01",
    "title": "مقدمة وخطة السبرنتات",
    "content": """
<p class="body-text">
يُعد <strong>كتاب تنفيذ السبرنتات</strong> الوثيقة المرجعية الشاملة لخطة تحسين منظومة فيكسور عبر تسعة سبرنتات متتابعة. تأتي هذه الخطة ثمرةً لعمليات تدقيق معمارية مكثفة شملت <strong>455 ملفًا</strong> و<strong>114 ألف سطر</strong> من الكود البرمجي، والتي كشفت عن فرص تحسينية حيوية في البنية المكونية والأداء والأمان وتجربة المستخدم.
</p>
<p class="body-text">
تستهدف هذه الخطة معالجة الفجوات المحددة في تقارير التدقيق السابقة، بما في ذلك <strong>المكونات الضخمة</strong> مثل <code>AppShell</code> (1688 سطرًا) و<code>-analysis-id-component</code> (3179 سطرًا)، إضافة إلى تعزيز <strong>محرك MOXI</strong> الذكي وتحسين مستويات <strong>الأمان</strong> و<strong>أداء قاعدة البيانات</strong>.
</p>

<div class="callout callout-success">
    <div class="callout-title">✦ فلسفة التنفيذ</div>
    <div class="callout-body">
        تعتمد الخطة على مبدأ التدرج المنهجي: كل سبرنت يبني على نتائج سابقه ويُعد البيئة للسبرنت التالي. Sprint 0 يضع الأساس، والسبرنتات اللاحقة تتناول مجالات محددة بتعمق متزايد.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">ملخص خريطة الطريق</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>السبرنت</th>
            <th>المجال</th>
            <th>المدة</th>
            <th>الهدف الرئيسي</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Sprint 0</td>
            <td>التأسيس والاستقرار</td>
            <td>أسبوعان</td>
            <td>خط الأساس لجودة الكود وCI/CD</td>
        </tr>
        <tr>
            <td>Sprint 1</td>
            <td>تفكيك المكونات الضخمة</td>
            <td>3 أسابيع</td>
            <td>تقسيم المكونات الكبيرة إلى وحدات صغيرة</td>
        </tr>
        <tr>
            <td>Sprint 2</td>
            <td>تحسين الأداء</td>
            <td>أسبوعان</td>
            <td>تحسين حجم الحزمة وسرعة التحميل</td>
        </tr>
        <tr>
            <td>Sprint 3</td>
            <td>تعزيز MOXI</td>
            <td>3 أسابيع</td>
            <td>تطوير محرك الذكاء الاصطناعي</td>
        </tr>
        <tr>
            <td>Sprint 4</td>
            <td>الأمان والحماية</td>
            <td>أسبوعان</td>
            <td>تعزيز حماية النظام والبيانات</td>
        </tr>
        <tr>
            <td>Sprint 5</td>
            <td>تحسين قاعدة البيانات</td>
            <td>أسبوعان</td>
            <td>تحسين الأداء وهيكلة البيانات</td>
        </tr>
        <tr>
            <td>Sprint 6</td>
            <td>تجربة المستخدم والتصميم</td>
            <td>أسبوعان</td>
            <td>تحسين إمكانية الوصول والتصميم</td>
        </tr>
        <tr>
            <td>Sprint 7</td>
            <td>الاختبار والتوثيق</td>
            <td>أسبوعان</td>
            <td>رفع تغطية الاختبارات والتوثيق</td>
        </tr>
        <tr>
            <td>Sprint 8</td>
            <td>التحسينات المتقدمة</td>
            <td>3 أسابيع</td>
            <td>ميزات متقدمة ونحو الإصدار التالي</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">سياق المشروع</div>
</div>
<p class="body-text">
تبني فيكسور على <strong>React 19</strong> مع <strong>TanStack Start</strong> كإطار عمل و<strong>Tailwind v4</strong> للتنسيق، مع <strong>Supabase</strong> كخدمة خلفية و<strong>Vercel</strong> للنشر. يضم المشروع <strong>22 نطاقًا وظيفيًا</strong> تغطي سلسلة كاملة من التحليل والمعاملات والذكاء الاصطناعي.
</p>

<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">📊 البنية الحالية</div>
        <div class="info-card-body">455 ملفًا | 114K سطر | 22 نطاقًا وظيفيًا | لا تبعيات دائرية</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">⚠️ المكونات الضخمة</div>
        <div class="info-card-body">6 مكونات تتجاوز 1000 سطر | أكبرها 3179 سطرًا</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">🎯 المجالات المستهدفة</div>
        <div class="info-card-body">الأداء | الأمان | UX | الاختبار | التوثيق | MOXI | قاعدة البيانات</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">⏱️ المدة الإجمالية</div>
        <div class="info-card-body">21 أسبوعًا (≈5 أشهر) | 9 سبرنتات | تدريجي ومتزايد</div>
    </div>
</div>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ تنبيه مهم</div>
    <div class="callout-body">
        يُنصح بعدم بدء أي سبرنت دون اكتمال تعريف المنجزة للسبرنت السابق. التسلسل مُصمَّم بعناية لضمان استقرار النظام في كل مرحلة.
    </div>
</div>
"""
}

# Chapter 02 — Sprint 0
ch_sprint0 = {
    "tag": "02",
    "title": "Sprint 0: التأسيس والاستقرار",
    "content": """
<p class="body-text">
يمثل Sprint 0 حجر الأساس لجميع السبرنتات اللاحقة. يركز على إنشاء خط الأساس لجودة الكود، وإعداد بيئة التطوير المتكاملة CI/CD، وتوحيد معايير الكتابة، وتجهيز البنية التحتية للاختبارات، مع إجراء جرد شامل للمكونات الضخمة التي ستكون محور Sprint 1.
</p>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>إنشاء خط الأساس:</strong> قياس تغطية الاختبارات الحالية وحجم الحزمة ووقت البناء</li>
    <li><strong>إعداد CI/CD:</strong> تهيئة خطوط أنابيب التكامل والنشر المستمرة مع فحوصات آلية</li>
    <li><strong>توحيد المعايير:</strong> تكوين ESLint وPrettier مع قواعد صارمة موحدة عبر المشروع</li>
    <li><strong>تجهيز الاختبارات:</strong> إعداد Vitest مع تهيئة testing-library لاختبارات المكونات</li>
    <li><strong>جرد المكونات:</strong> توثيق كامل لجميع المكونات الضخمة مع خطة تفكيكها</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تهيئة Vitest مع <code>@testing-library/react</code> وتغطية الكود</td>
            <td>P0</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>بيئة اختبار عاملة مع تقارير تغطية أولية</td>
        </tr>
        <tr>
            <td>إعداد GitHub Actions CI مع فحوصات lint وbuild وtest</td>
            <td>P0</td>
            <td>لا يوجد</td>
            <td>20 ساعة</td>
            <td>خط أنابيب CI يعمل تلقائيًا عند كل commit</td>
        </tr>
        <tr>
            <td>توحيد إعدادات ESLint وPrettier مع قواعد مخصصة لفيكسور</td>
            <td>P0</td>
            <td>لا يوجد</td>
            <td>12 ساعة</td>
            <td>تكوين موحد مع إصلاح جميع التحذيرات الحالية</td>
        </tr>
        <tr>
            <td>جرد شامل للمكونات الضخمة (>500 سطر) مع خريطة التبعيات</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>مستند جرد مع توصيات التفكيك لكل مكون</td>
        </tr>
        <tr>
            <td>قياس خط الأساس: حجم الحزمة وLighthouse ووقت البناء</td>
            <td>P1</td>
            <td>CI Pipeline</td>
            <td>8 ساعات</td>
            <td>تقرير خط الأساس مع مؤشرات الأداء المرجعية</td>
        </tr>
        <tr>
            <td>إعداد Husky مع pre-commit hooks للفحص الآلي</td>
            <td>P2</td>
            <td>ESLint/Prettier</td>
            <td>6 ساعات</td>
            <td>فحوصات تلقائية قبل كل التزام</td>
        </tr>
        <tr>
            <td>إنشاء لوحة مؤشرات نجاح السبرنتات (Sprint Dashboard)</td>
            <td>P2</td>
            <td>خط الأساس</td>
            <td>12 ساعة</td>
            <td>لوحة تتبع مؤشرات الأداء عبر السبرنتات</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>مقاومة التغيير:</strong> قد يواجه الفريق صعوبة في تبنّي المعايير الجديدة الموحدة — <em>التخفيف: ورشة عمل توضيحية وجلسات مراجعة الكود</em></li>
    <li><strong>تعارضات التهيئة:</strong> إعدادات ESLint الجديدة قد تكشف عن مئات التحذيرات الحالية — <em>التخفيف: إصلاح تدريجي مع استثناءات مؤقتة موثقة</em></li>
    <li><strong>أوقات البناء:</strong> إضافة خطوات CI قد تطيل أوقات البناء — <em>التخفيف: استخدام التخزين المؤقت والتنفيذ المتوازي</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ يعمل CI pipeline بنجاح على جميع الفروع مع فحوصات lint وbuild وtest</li>
    <li>✅ تغطية اختبارات أولية مسجلة كخط أساس مرجعي</li>
    <li>✅ لا تحذيرات ESLint حمراء في الكود الرئيسي</li>
    <li>✅ مستند جرد المكونات الضخمة مُنجز ومراجع</li>
    <li>✅ تقرير خط الأساس للأداء مُنشر ومتاح للفريق</li>
    <li>✅ pre-commit hooks مُفعَّلة ومعتمدة من جميع المطوّرين</li>
</ul>
"""
}

# Chapter 03 — Sprint 1
ch_sprint1 = {
    "tag": "03",
    "title": "Sprint 1: تفكيك المكونات الضخمة",
    "content": """
<p class="body-text">
يُركز Sprint 1 على معالجة واحدة من أكبر المشكلات المعمارية في فيكسور: <strong>المكونات الضخمة</strong>. كشف التدقيق عن 6 مكونات تتجاوز 1000 سطر، مع أكبرها <code>-analysis-id-component</code> بـ 3179 سطرًا. يهدف هذا السبرنت إلى تفكيكها إلى مكونات أصغر قابلة لإعادة الاستخدام والاختبار والصيانة.
</p>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ تأثير عالي على الكود</div>
    <div class="callout-body">
        هذا السبرنت يتضمن تعديلات واسعة النطاق على المكونات الأساسية. يُنفَّذ مكونًا تلو الآخر مع اختبارات شاملة عند كل مرحلة لضمان عدم انكسار الوظائف الحالية.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>تفكيك AppShell:</strong> تقسيم المكون الرئيسي (1688 سطرًا) إلى Layout وNavigation وSidebar وHeader</li>
    <li><strong>تفكيك index.tsx:</strong> فصل منطق التوجيه عن واجهة الجذر (986 سطرًا)</li>
    <li><strong>تفكيك -analysis-id-component:</strong> تقسيم أكبر مكون (3179 سطرًا) إلى وحدات تحليل منفصلة</li>
    <li><strong>تفكيك -copilot-component:</strong> تقسيم واجهة MOXI (2135 سطرًا) إلى Chat وTools وMemory</li>
    <li><strong>توثيق أنماط التفكيك:</strong> إنشاء أدلة معيارية لتقسيم المكونات المستقبلية</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تفكيك <code>AppShell</code> إلى AppLayout + Navigation + Sidebar + Header</td>
            <td>P0</td>
            <td>Sprint 0</td>
            <td>32 ساعة</td>
            <td>4 مكونات مستقلة بأقل من 400 سطر لكل منها</td>
        </tr>
        <tr>
            <td>تفكيك <code>-analysis-id-component</code> إلى ChartPanel + DataPanel + ControlsPanel + SummaryPanel</td>
            <td>P0</td>
            <td>Sprint 0</td>
            <td>40 ساعة</td>
            <td>مكونات منفصلة قابلة للتحميل الكسول</td>
        </tr>
        <tr>
            <td>تفكيك <code>-copilot-component</code> إلى ChatView + ToolSelector + MemoryPanel + QuickActions</td>
            <td>P0</td>
            <td>Sprint 0</td>
            <td>32 ساعة</td>
            <td>واجهة copilot منظمة ووحدوية</td>
        </tr>
        <tr>
            <td>فصل منطق <code>index.tsx</code> الجذري إلى Router وAuthGuard وAppInitializer</td>
            <td>P1</td>
            <td>AppShell refactor</td>
            <td>20 ساعة</td>
            <td>ملف جذر نظيف تحت 300 سطر</td>
        </tr>
        <tr>
            <td>تفكيك <code>-token-symbol-component</code> (2831 سطرًا) إلى TokenCard + PriceChart + TradeButtons</td>
            <td>P1</td>
            <td>Sprint 0</td>
            <td>32 ساعة</td>
            <td>مكونات رمزية منفصلة ومختبرة</td>
        </tr>
        <tr>
            <td>تفكيك <code>settings.tsx</code> (1232 سطرًا) إلى SettingsLayout + GeneralSettings + SecuritySettings</td>
            <td>P2</td>
            <td>Sprint 0</td>
            <td>16 ساعة</td>
            <td>صفحة إعدادات منظمة</td>
        </tr>
        <tr>
            <td>إنشاء دليل أنماط التفكيك المعياري للفريق</td>
            <td>P2</td>
            <td>تفكيك AppShell</td>
            <td>8 ساعات</td>
            <td>مستند معايير مرجعي لتفكيك المكونات</td>
        </tr>
        <tr>
            <td>تفكيك <code>discover.tsx</code> (1991 سطرًا) و <code>trade-desk.tsx</code> (1422 سطرًا)</td>
            <td>P2</td>
            <td>دليل الأنماط</td>
            <td>24 ساعة</td>
            <td>مكونات اكتشاف وتداول منفصلة</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>انكسار الوظائف:</strong> التعديلات واسعة النطاق قد تؤثر على سلوكيات حالية — <em>التخفيف: اختبارات رجوع شاملة قبل وبعد كل تفكيك</em></li>
    <li><strong>تبعيات مخفية:</strong> المكونات الضخمة قد تحتوي على حالة مشتركة معقدة — <em>التخفيف: رسم خريطة حالة كاملة قبل البدء</em></li>
    <li><strong>أداء التنقل:</strong> زيادة عدد الملفات قد يبطئ التحميل الأولي — <em>التخفيف: تطبيق code splitting في Sprint 2</em></li>
    <li><strong>مدة طويلة:</strong> 204 ساعة قد تمتد — <em>التخفيف: إمكانية تقسيم المهام P2 إلى سبرنت لاحق</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ لا يوجد مكون يتجاوز 600 سطر في قاعدة الكود الرئيسية</li>
    <li>✅ جميع المكونات المفكوكة لها اختبارات وحدة لا تقل عن 60% تغطية</li>
    <li>✅ لا انكسارات في functional tests الحالية</li>
    <li>✅ دليل أنماط التفكيك مُنشر ومعتمد</li>
    <li>✅ جميع المكونات الجديدة تتبع معايير ESLint الموحدة</li>
    <li>✅ مراجعة كود السبرنت مكتملة ومعتمدة من مطوّرين اثنين على الأقل</li>
</ul>
"""
}

# Chapter 04 — Sprint 2
ch_sprint2 = {
    "tag": "04",
    "title": "Sprint 2: تحسين الأداء",
    "content": """
<p class="body-text">
بعد تفكيك المكونات الضخمة في Sprint 1، يركز Sprint 2 على <strong>تحسين الأداء</strong> الشامل. يستهدف تقليل حجم الحزمة، وتسريع التحميل الأولي، وتحسين استجابة واجهة المستخدم، وتطبيق أنماط التخزين المؤقت والتحميل الكسول عبر جميع نطاقات فيكسور.
</p>

<div class="callout callout-success">
    <div class="callout-title">✦ الأثر المتراكم</div>
    <div class="callout-body">
        تفكيك المكونات في Sprint 1 يُسهِّل بشكل كبير تطبيق code splitting في هذا السبرنت. كل مكون مستقل يمكن تحميله عند الحاجة فقط، مما يقلل الحمل الأولي بشكل ملحوظ.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>تحسين الحزمة:</strong> تقليل حجم JavaScript الرئيسي بنسبة 30% عبر tree-shaking وcode splitting</li>
    <li><strong>التحميل الكسول:</strong> تطبيق lazy loading على جميع النطاقات غير الأساسية</li>
    <li><strong>القوائم الافتراضية:</strong> استخدام virtualized lists في القوائم الطويلة (المحفظة، قائمة المراقبة)</li>
    <li><strong>التخزين المؤقت:</strong> تطبيق TanStack Query caching مع استراتيجيات مناسبة لكل نطاق</li>
    <li><strong>تحسين الصور:</strong> تنسيق WebP مع تحميل تدريجي وتحسين charts rendering</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تحليل الحزمة الحالية مع bundle Analyzer وتحديد الوحدات الثقيلة</td>
            <td>P0</td>
            <td>Sprint 1</td>
            <td>12 ساعة</td>
            <td>تقرير تحليل الحزمة مع خطة التحسين</td>
        </tr>
        <tr>
            <td>تطبيق <code>React.lazy()</code> على النطاقات: backtest, experiment, arbitrage, discovery, paper-trading</td>
            <td>P0</td>
            <td>تحليل الحزمة</td>
            <td>24 ساعة</td>
            <td>تحميل عند الطلب لـ 5 نطاقات ثانوية</td>
        </tr>
        <tr>
            <td>تنفيذ Virtualized Lists في Wallet وWatchlist وSignalTracking باستخدام <code>@tanstack/react-virtual</code></td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>20 ساعة</td>
            <td>قوائم سلسة مع 10K+ عنصر بدون تأخير</td>
        </tr>
        <tr>
            <td>تهيئة <code>@tanstack/react-query</code> مع stale-while-revalidate لجميع نقاط API</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>تخزين مؤقت ذكي مع تحديث خلفي</td>
        </tr>
        <tr>
            <td>تحسين charts rendering مع memoization وrequestAnimationFrame</td>
            <td>P1</td>
            <td>Sprint 1</td>
            <td>16 ساعة</td>
            <td>60fps في charts التفاعلية مع بيانات حية</td>
        </tr>
        <tr>
            <td>تحويل الصور إلى WebP مع lazy loading وتحجيم استجابي</td>
            <td>P2</td>
            <td>لا يوجد</td>
            <td>8 ساعات</td>
            <td>تقليل حجم الصور بنسبة 40%+</td>
        </tr>
        <tr>
            <td>إضافة Performance Observer وCustom Metrics للتتبع المستمر</td>
            <td>P2</td>
            <td>لا يوجد</td>
            <td>12 ساعة</td>
            <td>لوحة مؤشرات أداء حية في الإنتاج</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>مشاكل التوافق:</strong> code splitting قد يُكسر استيرادات مشتركة — <em>التخفيف: اختبار شامل على كل دمج</em></li>
    <li><strong>تجربة المستخدم:</strong> Lazy loading يُضيف loading states جديدة — <em>التخفيف: skeleton screens موحدة ومتجانسة</em></li>
    <li><strong>استقرار Charts:</strong> التحسينات قد تؤثر على دقة البيانات المعروضة — <em>التخفيف: مقارنة بيانات قبل وبعد مع بيانات مرجعية</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ تقليل حجم JS الرئيسي بنسبة 30% مقارنة بخط الأساس</li>
    <li>✅ Lighthouse Performance Score لا يقل عن 85</li>
    <li>✅ جميع النطاقات الثانوية تُحمَّل عند الطلب فقط</li>
    <li>✅ القوائم الطويلة تعمل بسلاسة مع 10K+ عنصر</li>
    <li>✅ Charts تعمل بـ 60fps بدون تأثير على دقة البيانات</li>
    <li>✅ مؤشرات الأداء مُتتبَّعة ومُسجَّلة تلقائيًا</li>
</ul>
"""
}

# Chapter 05 — Sprint 3
ch_sprint3 = {
    "tag": "05",
    "title": "Sprint 3: تعزيز محرك MOXI",
    "content": """
<p class="body-text">
<code>MOXI</code> هو محرك الذكاء الاصطناعي في فيكسور والمساعد الذكي للمتداولين. يهدف هذا السبرنت إلى رفع قدرات MOXI من مساعد أساسي إلى <strong>محلل استباقي ذكي</strong> يفهم سياق المتداول ويقدم رؤى مُخصصة ويدير دورة حياة الذاكرة بفعالية.
</p>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>أدوات إضافية:</strong> إضافة 8+ أدوات جديدة لمهام التحليل والتداول والبحث</li>
    <li><strong>محرك السياق:</strong> تحسين فهم MOXI لسياق المحادثة وسجل المتداول وتفضيلاته</li>
    <li><strong>رؤى استباقية:</strong> تنبيهات ذكية وتوصيات تلقائية بناءً على أنماط التداول</li>
    <li><strong>دورة حياة الذاكرة:</strong> إدارة ذاكرة طويلة/قصيرة المدى مع سياسات النسيان</li>
    <li><strong>تحسين Prompts:</strong> هندسة محسّنة لـ LLM prompts مع A/B testing</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تصميم وتنفيذ 8 أدوات MOXI جديدة: PortfolioAnalyzer, RiskCalculator, MarketScanner, NewsSummarizer, PatternDetector, SentimentAnalyzer, BacktestRunner, StrategyRecommender</td>
            <td>P0</td>
            <td>Sprint 1</td>
            <td>48 ساعة</td>
            <td>8 أدوات مُنفَّذة ومُوثَّقة ومُختبرة</td>
        </tr>
        <tr>
            <td>تحسين محرك السياق مع Context Window Manager وUser Profile Integration</td>
            <td>P0</td>
            <td>لا يوجد</td>
            <td>32 ساعة</td>
            <td>فهم سياقي عميق يتضمن التاريخ والتفضيلات</td>
        </tr>
        <tr>
            <td>تنفيذ نظام الرؤى الاستباقية مع Proactive Insight Engine وAlert Scheduler</td>
            <td>P1</td>
            <td>أدوات MOXI</td>
            <td>28 ساعة</td>
            <td>تنبيهات ذكية مخصصة حسب أنماط التداول</td>
        </tr>
        <tr>
            <td>بناء Memory Lifecycle Manager مع Short-term وLong-term وEpisodic memory</td>
            <td>P1</td>
            <td>محرك السياق</td>
            <td>24 ساعة</td>
            <td>نظام ذاكرة متعدد الطبقات مع سياسات النسيان</td>
        </tr>
        <tr>
            <td>تحسين LLM Prompts مع structured output وchain-of-thought وfew-shot examples</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>20 ساعة</td>
            <td>تحسن 25% في دقة وجودة الردود</td>
        </tr>
        <tr>
            <td>إعداد A/B Testing framework للمقارنة بين إصدارات Prompts</td>
            <td>P2</td>
            <td>Prompt Optimization</td>
            <td>12 ساعة</td>
            <td>إطار عمل اختبار A/B للم prompts</td>
        </tr>
        <tr>
            <td>تطوير MOXI Onboarding Flow مع تفاعل تعليمي للمستخدمين الجدد</td>
            <td>P2</td>
            <td>أدوات MOXI</td>
            <td>16 ساعة</td>
            <td>تجربة تعليمية تفاعلية لتعريف المستخدم بالقدرات</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>تكلفة LLM:</strong> الأدوات الإضافية تزيد استهلاك API calls — <em>التخفيف: caching ذكي وrate limiting وfallback models</em></li>
    <li><strong>جودة الرؤى:</strong> التوصيات الخاطئة قد تُلحق أضرارًا مالية — <em>التخفيف: إطار "AI-Assisted Not AI-Decided" مع تنبيهات واضحة</em></li>
    <li><strong>وقت الاستجابة:</strong> أدوات متعددة قد تطيل زمن الاستجابة — <em>التخفيف: parallel tool execution وstreaming responses</em></li>
    <li><strong>خصوصية البيانات:</strong> محرك السياق يحتاج بيانات المستخدم — <em>التخفيف: معالجة محلية أولية مع موافقة صريحة</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ 8 أدوات MOXI جديدة مُنفَّذة ومُوثَّقة مع اختبارات E2E</li>
    <li>✅ محرك السياق يفهم 90%+ من سياق المحادثة المعقدة</li>
    <li>✅ الرؤى الاستباقية تظهر لمستخدمي Beta مع معدل قبول >40%</li>
    <li>✅ نظام الذاكرة يحتفظ بالبيانات ذات الصلة وينسى البيانات القديمة</li>
    <li>✅ تحسن مقاس في جودة الردود مع Prompt Optimization</li>
    <li>✅ جميع تكاليف LLM مُراقبة وتحت الحد المالي المحدد</li>
</ul>
"""
}

# Chapter 06 — Sprint 4
ch_sprint4 = {
    "tag": "06",
    "title": "Sprint 4: الأمان والحماية",
    "content": """
<p class="body-text">
في ظل طبيعة فيكسور كمنصة تداول مالية تتعامل مع بيانات حساسة وأموال المستخدمين، يُعد <strong>الأمان</strong> أولوية قصوى. يركز هذا السبرنت على تعزيز طبقات الحماية المتعددة: من تقييد المعدل والمراجعة الأمنية إلى تقوية CSP ودوران المفاتيح السرية.
</p>

<div class="callout callout-warn">
    <div class="callout-title">⚠️ أولوية قصوى</div>
    <div class="callout-body">
        بعض مهام هذا السبرنت تُنفَّذ بالتوازي مع السبرنتات الأخرى حيثما أمكن، خاصة rate limiting وaudit logging التي يجب حماية النظام بها بأسرع وقت ممكن.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>تقييد المعدل:</strong> حماية API endpoints من الإساءة مع سياسات مُعدلة حسب نوع الطلب</li>
    <li><strong>سجلات التدقيق:</strong> تتبع شامل لجميع العمليات الحساسة مع توثيق كامل</li>
    <li><strong>تقوية CSP:</strong> إعدادات Content Security Policy صارمة لمنع XSS وcode injection</li>
    <li><strong>دوران المفاتيح:</strong> أتمتة دوران المفاتيح السرية والشهادات</li>
    <li><strong>تدقيق التبعيات:</strong> فحص أمني شامل لجميع الحزم المستخدمة</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تنفيذ Rate Limiting على جميع API endpoints مع سياسات مُتفاوتة (Auth: 5/min, Data: 60/min, Public: 120/min)</td>
            <td>P0</td>
            <td>Sprint 0</td>
            <td>20 ساعة</td>
            <td>حماية كاملة من DoS و Brute Force</td>
        </tr>
        <tr>
            <td>بناء Audit Logging System مع تسجيل جميع العمليات الحساسة (تداول، تسجيل دخول، تغيير إعدادات)</td>
            <td>P0</td>
            <td>لا يوجد</td>
            <td>24 ساعة</td>
            <td>سجل تدقيق شامل قابل للبحث والتصفية</td>
        </tr>
        <tr>
            <td>تقوية Content Security Policy مع nonce-based scripts وstrict-dynamic وreport-uri</td>
            <td>P0</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>CSP صارم يمنع XSS مع تقارير الانتهاك</td>
        </tr>
        <tr>
            <td>أتمتة Secret Rotation لجميع المفاتيح (TELEGRAM_BOT_TOKEN, ADMIN_KEY, JWT secrets)</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>20 ساعة</td>
            <td>دوران تلقائي دوري للمفاتيح السرية</td>
        </tr>
        <tr>
            <td>تشغيل Dependabot + Snyk لفحص أمني مستمر مع سياسة إصلاح <24 ساعة للثغرات الحرجة</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>12 ساعة</td>
            <td>فحص أمني يومي مع إصلاح آلي</td>
        </tr>
        <tr>
            <td>تنفيذ CORS tightening مع origin whitelist وcredentials policy</td>
            <td>P1</td>
            <td>CSP</td>
            <td>8 ساعات</td>
            <td>سياسات CORS صارمة ومُوثقة</td>
        </tr>
        <tr>
            <td>إضافة Subresource Integrity (SRI) لجميع CDN dependencies</td>
            <td>P2</td>
            <td>تدقيق التبعيات</td>
            <td>6 ساعات</td>
            <td>حماية من تعديل الموارد الخارجية</td>
        </tr>
        <tr>
            <td>إعداد Security Headers المرجعية (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)</td>
            <td>P2</td>
            <td>CSP</td>
            <td>6 ساعات</td>
            <td>تقييم A+ في securityheaders.com</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>حظر شرعي:</strong> Rate limiting صارم قد يحظر مستخدمين شرعيين — <em>التخفيف: adaptive rate limiting مع渐进ية صارمة</em></li>
    <li><strong>أداء السجلات:</strong> Audit logging مكثف قد يُبطئ العمليات — <em>التخفيف: asynchronous logging مع batch writes</em></li>
    <li><strong>انكسار CSP:</strong> سياسات صارمة قد تمنع ميزات حالية — <em>التخفيف: report-only mode أوليًا ثم enforcement تدريجي</em></li>
    <li><strong>تعطيل الخدمة:</strong> دوران المفاتيح قد يُسبب انقطاعًا مؤقتًا — <em>التخفيف: dual-key transition مع zero-downtime</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ جميع API endpoints محمية بـ rate limiting مُتفاوت</li>
    <li>✅ سجلات التدقيق تسجل 100% من العمليات الحساسة</li>
    <li>✅ CSP يعمل في وضع enforcement مع صفر انتهاكات XSS</li>
    <li>✅ Secret Rotation مُجدوَل ويعمل تلقائيًا</li>
    <li>✅ لا تبعيات ثغرات حرجة (CVSS 9+) غير مُصلحة</li>
    <li>✅ تقييم Security Headers لا يقل عن A</li>
</ul>
"""
}

# Chapter 07 — Sprint 5
ch_sprint5 = {
    "tag": "07",
    "title": "Sprint 5: تحسين قاعدة البيانات",
    "content": """
<p class="body-text">
تعتمد فيكسور على <strong>Supabase</strong> (PostgreSQL) كخلفية بيانات، مع 22 نطاقًا وظيفيًا يُنشئ ويقرأ ويُحدّث البيانات باستمرار. يهدف هذا السبرنت إلى تحسين أداء قاعدة البيانات عبر الفهرسة والنظرات وconnection pooling وتحسين الاستعلامات ومراجعة سياسات RLS.
</p>

<div class="callout">
    <div class="callout-title">✦ هدف كمّي</div>
    <div class="callout-body">
        استهداف تقليل متوسط زمن الاستعلامات بنسبة 50% وزيادة الإنتاجية الإجمالية لقاعدة البيانات بنسبة 40% مقارنة بخط الأساس المُقاس في Sprint 0.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>الفهرسة:</strong> إنشاء فهارس مُحسّنة للجداول الأكثر استعلامًا</li>
    <li><strong>النظرات:</strong> بناء database views للبيانات المُجمَّعة الشائعة الاستخدام</li>
    <li><strong>Connection Pooling:</strong> تطبيق Supavisor pooler لتحسين إدارة الاتصالات</li>
    <li><strong>تحسين الاستعلامات:</strong> مراجعة وإصلاح الاستعلامات البطيئة والـ N+1</li>
    <li><strong>مراجعة RLS:</strong> تدقيق سياسات Row Level Security للكفاءة والأمان</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تحليل EXPLAIN ANALYZE لأهم 20 استعلامًا وتحديد الاختناقات</td>
            <td>P0</td>
            <td>Sprint 0</td>
            <td>16 ساعة</td>
            <td>تقرير تحليل مفصّل مع خطة التحسين</td>
        </tr>
        <tr>
            <td>إنشاء فهارس مركّبة على جداول: trades, analysis, signals, watchlist (مع partial indexes)</td>
            <td>P0</td>
            <td>تحليل الاستعلامات</td>
            <td>20 ساعة</td>
            <td>تسريع الاستعلامات الأكثر تكرارًا بنسبة 60%+</td>
        </tr>
        <tr>
            <td>بناء Materialized Views للبيانات المُجمَّعة: Portfolio Summary, Daily P&L, Market Overview</td>
            <td>P1</td>
            <td>تحليل الاستعلامات</td>
            <td>24 ساعة</td>
            <td>استجابة فورية للواجهات المُجمَّعة</td>
        </tr>
        <tr>
            <td>تهيئة Supavisor Connection Pooling مع session mode وtransaction mode</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>تحسين استهلاك الاتصالات بنسبة 50%</td>
        </tr>
        <tr>
            <td>إصلاح مشاكل N+1 في استعلامات Supabase مع استخدام joins وselect مُحددة</td>
            <td>P1</td>
            <td>تحليل الاستعلامات</td>
            <td>20 ساعة</td>
            <td>تقليل عدد الاستعلامات لكل صفحة بنسبة 70%</td>
        </tr>
        <tr>
            <td>تدقيق سياسات RLS وتحسينها مع إضافةidx policy indexes</td>
            <td>P2</td>
            <td>الفهرسة</td>
            <td>16 ساعة</td>
            <td>RLS لا يُبطئ الاستعلامات المحمية</td>
        </tr>
        <tr>
            <td>إعداد pg_stat_statements لتتبع أداء الاستعلامات في الإنتاج</td>
            <td>P2</td>
            <td>لا يوجد</td>
            <td>8 ساعات</td>
            <td>مراقبة مستمرة لأداء قاعدة البيانات</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>تأثير الفهرسة:</strong> فهارس كثيرة قد تُبطئ عمليات الكتابة — <em>التخفيف: فهرسة انتقائية مع مراقبة write performance</em></li>
    <li><strong>انتهاء الصلاحية:</strong> Materialized Views تحتاج تحديث دوري — <em>التخفيف: concurrent refresh مع جدولة ذكية</em></li>
    <li><strong>Connection Limits:</strong> Supabase قد يكون له حدود على pooler — <em>التخفيف: تحسين pool size بناءً على负载 الفعلي</em></li>
    <li><strong>تراجع الأمان:</strong> تحسين RLS قد يُضعف بعض السياسات — <em>التخفيف: اختبارات اختراق قبل وبعد التعديل</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ متوسط زمن الاستعلامات أقل بنسبة 50% من خط الأساس</li>
    <li>✅ جميع الاستعلامات البطيئة (>500ms) مُصلحة أو مُوثقة بخطة إصلاح</li>
    <li>✅ Materialized Views تُحدَّث بانتظام مع استجابة <100ms</li>
    <li>✅ Connection pooling يعمل بكفاءة في بيئة الإنتاج</li>
    <li>✅ سياسات RLS مُدقَّقة ومُحسّنة بدون ثغرات أمنية</li>
    <li>✅ pg_stat_statements مُفعَّل ومُراقَب</li>
</ul>
"""
}

# Chapter 08 — Sprint 6
ch_sprint6 = {
    "tag": "08",
    "title": "Sprint 6: تجربة المستخدم والتصميم",
    "content": """
<p class="body-text">
يُركز Sprint 6 على <strong>تجربة المستخدم</strong> الشاملة: من إمكانية الوصول وفق WCAG 2.1 AA، إلى تحسين تجربة الأجهزة المحمولة، ووضع حالات التحميل والخطأ المتسقة، وإضافة حركات وتأثيرات بصرية سلسة تُعزز الشعور بالاحترافية والسيولة.
</p>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>إمكانية الوصول:</strong> تدقيق كامل وفق WCAG 2.1 AA مع إصلاح جميع الانتهاكات</li>
    <li><strong>تجربة الهاتف:</strong> تحسين واجهة المحمول مع إيماءات اللمس والتصميم الاستجابي</li>
    <li><strong>حالات التحميل:</strong> Skeleton screens وprogressive loading موحدة عبر جميع الصفحات</li>
    <li><strong>حالات الخطأ:</strong> Error boundaries مع رسائل خطأ واضحة وقابلة للتنفيذ</li>
    <li><strong>الحركات:</strong> Framer Motion transitions سلسة ومناسبة عبر جميع التفاعلات</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تدقيق WCAG 2.1 AA شامل مع axe-core وLighthouse و manual audit لجميع الصفحات</td>
            <td>P0</td>
            <td>Sprint 1</td>
            <td>20 ساعة</td>
            <td>تقرير تدقيق مفصّل مع أولويات الإصلاح</td>
        </tr>
        <tr>
            <td>إصلاح جميع انتهاكات accessibility الحرجة: contrast, focus management, aria labels, keyboard nav</td>
            <td>P0</td>
            <td>تدقيق WCAG</td>
            <td>32 ساعة</td>
            <td>100% توافق مع WCAG 2.1 AA المعايير الحرجة</td>
        </tr>
        <tr>
            <td>تصميم وتنفيذ Skeleton Loading System مع مكونات متعددة الأشكال (chart skeleton, table skeleton, card skeleton)</td>
            <td>P1</td>
            <td>Sprint 1</td>
            <td>20 ساعة</td>
            <td>loading states سلسة ومتوحية عبر كل الصفحات</td>
        </tr>
        <tr>
            <td>تنفيذ Error Boundary مركزي مع Error Fallback UI وتسجيل أخطاء تلقائي</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>معالجة خطأ أنيقة مع تجربة مستخدم إيجابية</td>
        </tr>
        <tr>
            <td>تحسين تجربة الهاتف: touch targets, swipe gestures, responsive charts, bottom navigation</td>
            <td>P1</td>
            <td>Sprint 1</td>
            <td>28 ساعة</td>
            <td>واجهة محمول احترافية وسلسة</td>
        </tr>
        <tr>
            <td>إضافة Framer Motion transitions: page transitions, list animations, micro-interactions</td>
            <td>P2</td>
            <td>Sprint 1</td>
            <td>20 ساعة</td>
            <td>حركات سلسة تُعزز تجربة المستخدم</td>
        </tr>
        <tr>
            <td>تنفيذ Dark/Light mode toggle مع theme persistence وsystem preference detection</td>
            <td>P2</td>
            <td>لا يوجد</td>
            <td>12 ساعة</td>
            <td>تبديل سلس بين الأوضاع مع حفظ التفضيل</td>
        </tr>
        <tr>
            <td>بناء Design Token System مع CSS custom properties موحدة</td>
            <td>P3</td>
            <td>لا يوجد</td>
            <td>16 ساعة</td>
            <td>نظام تصميم موحد وقابل للتوسع</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>نطاق واسع:</strong> Accessibility يحتاج مراجعة لكل مكون — <em>التخفيف: أتمتة الفحص مع axe-core وإصلاح تدريجي</em></li>
    <li><strong>تعارض الحركات:</strong> Framer Motion قد يتعارض مع lazy loading — <em>التخفيف: AnimatePresence مع proper exit animations</em></li>
    <li><strong>أداء الهاتف:</strong> الحركات والتحسينات قد تُبطئ الأجهزة الضعيفة — <em>التخفيف: reduced-motion support وperformance budgets</em></li>
    <li><strong>قيمة الألوان:</strong> Dark/Light mode يحتاج مراجعة تصميمية شاملة — <em>التخفيف: البدء بالوضع الداكن الحالي ثم إضافة الفاتح</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ Lighthouse Accessibility Score لا يقل عن 90</li>
    <li>✅ جميع المكونات التفاعلية يمكن الوصول إليها باللوحة المفاتيح</li>
    <li>✅ Skeleton screens موجودة في كل حالة تحميل</li>
    <li>✅ Error boundaries تلتقط وتعرض جميع الأخطاء بشكل أنيق</li>
    <li>✅ تجربة الهاتف تُقيَّم ≥4.0/5 من قبل فريق الاختبار</li>
    <li>✅ الحركات تعمل بسلاسة على أجهزة متوسطة الأداء</li>
</ul>
"""
}

# Chapter 09 — Sprint 7
ch_sprint7 = {
    "tag": "09",
    "title": "Sprint 7: الاختبار والتوثيق",
    "content": """
<p class="body-text">
يُعالج Sprint 7 فجوتين حرجتين: <strong>تغطية الاختبارات</strong> المجهولة حاليًا و<strong>فجوات التوثيق</strong> التي تُعيق علىboarding المطوّرين الجدد والتعاون. يهدف هذا السبرنت إلى رفع تغطية الاختبارات إلى 70%+ وبناء توثيق شامل يغطي API والمكونات ودليل البدء.
</p>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>تغطية الاختبارات:</strong> رفع تغطية Unit Tests إلى 70%+ مع Integration Tests للعمليات الحرجة</li>
    <li><strong>Storybook:</strong> بناء مكتبة مكونات مرئية مع حالات استخدام متنوعة</li>
    <li><strong>توثيق API:</strong> مستند OpenAPI/Swagger شامل لجميع نقاط النهاية</li>
    <li><strong>دليل البدء:</strong> Onboarding guide شامل للمطوّرين الجدد مع أمثلة عملية</li>
    <li><strong>اختبار E2E:</strong> مسارات E2E حرجة للمستخدم الرئيسي</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>كتابة Unit Tests لجميع النطاقات الوظيفية (22 نطاقًا) مع هدف 70%+ تغطية</td>
            <td>P0</td>
            <td>Sprint 1</td>
            <td>48 ساعة</td>
            <td>تغطية اختبارات 70%+ مع تقارير مفصلة</td>
        </tr>
        <tr>
            <td>تنفيذ Integration Tests للعمليات الحرجة: تسجيل الدخول، إجراء التداول، إدارة المحفظة</td>
            <td>P0</td>
            <td>Unit Tests</td>
            <td>32 ساعة</td>
            <td>اختبارات تكامل مُنفَّذة لجميع المسارات الحرجة</td>
        </tr>
        <tr>
            <td>إعداد Storybook مع مكونات مُخصصة لفيكسور (Dark theme, RTL, chart components)</td>
            <td>P1</td>
            <td>Sprint 1</td>
            <td>28 ساعة</td>
            <td>مكتبة Storybook مُنفَّذة مع 50+ قصة</td>
        </tr>
        <tr>
            <td>كتابة توثيق API شامل مع OpenAPI spec وأمثلة طلب/استجابة لكل endpoint</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>24 ساعة</td>
            <td>توثيق API مُتكامل ومُحدَّث تلقائيًا</td>
        </tr>
        <tr>
            <td>إنشاء Developer Onboarding Guide مع إعداد البيئة وهيكل المشروع وأفضل الممارسات</td>
            <td>P1</td>
            <td>لا يوجد</td>
            <td>20 ساعة</td>
            <td>دليل بدء شامل يُمكّن مطور جديد خلال يوم واحد</td>
        </tr>
        <tr>
            <td>بناء E2E Tests مع Playwright للمسارات الأساسية (تسجيل، تداول، تحليل)</td>
            <td>P2</td>
            <td>Integration Tests</td>
            <td>24 ساعة</td>
            <td>10+ مسارات E2E مُختبرة تلقائيًا</td>
        </tr>
        <tr>
            <td>إعداد Visual Regression Testing مع Chromatic أو Percy</td>
            <td>P3</td>
            <td>Storybook</td>
            <td>16 ساعة</td>
            <td>كشف تلقائي للتغييرات البصرية غير المقصودة</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>وقت طويل:</strong> كتابة اختبارات لـ 22 نطاقًا قد تستغرق أكثر من المقدر — <em>التخفيف: البدء بالنطاقات الحرجة والانتقال تدريجيًا</em></li>
    <li><strong>هشاشة الاختبارات:</strong> تغييرات UI قد تُكسر اختبارات بصرية — <em>التخفيف: فصل اختبارات السلوك عن اختبارات المظهر</em></li>
    <li><strong>صيانة التوثيق:</strong> التوثيق قد يصبح قديمًا بسرعة — <em>التخفيف: docs-as-code مع CI validation</em></li>
    <li><strong>أداء E2E:</strong> اختبارات E2E بطيئة — <em>التخفيف: parallel execution مع sharding</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ تغطية Unit Tests ≥ 70% لجميع النطاقات الوظيفية</li>
    <li>✅ جميع المسارات الحرجة مُغطاة بـ Integration Tests</li>
    <li>✅ Storybook مُنشر مع 50+ قصة ومُدمج في CI</li>
    <li>✅ توثيق API شامل ومُحدَّث ويمكن الوصول إليه عبر Swagger UI</li>
    <li>✅ Onboarding Guide يُمكّن مطورًا جديدًا من البدء خلال يوم عمل</li>
    <li>✅ جميع الاختبارات تعمل في CI بدون حالات فاشلة</li>
</ul>
"""
}

# Chapter 10 — Sprint 8
ch_sprint8 = {
    "tag": "10",
    "title": "Sprint 8: التحسينات المتقدمة",
    "content": """
<p class="body-text">
يمثل Sprint 8 <strong>السبرنت الأخير</strong> من الخطة الحالية ويُركز على ميزات متقدمة تُعد فيكسور للمرحلة التالية. يشمل بناء أسس سوق الاستراتيجيات وميزات اجتماعية وتحسينات MOXI Pro وتكامل AI متعدد الوسائط.
</p>

<div class="callout callout-success">
    <div class="callout-title">✦ نحو الإصدار التالي</div>
    <div class="callout-body">
        هذا السبرنت يضع الأسس لميزات ستُطوَّر بالكامل في دورة تطوير لاحقة. الهدف هو إنشاء MVP لكل ميزة يمكن اختباره مع المستخدمين وتحسينه.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">أهداف السبرنت</div>
</div>
<ul class="vixor-list">
    <li><strong>سوق الاستراتيجيات:</strong> بناء أسس منصة لمشاركة وتبادل استراتيجيات التداول</li>
    <li><strong>الميزات الاجتماعية:</strong> إضافة عناصر اجتماعية أساسية: مشاركة، تعليقات، إعجابات</li>
    <li><strong>MOXI Pro:</strong> ميزات متقدمة للمستخدمين المميزين: تحليل أعمق، رؤى مخصصة</li>
    <li><strong>AI متعدد الوسائط:</strong> دعم تحليل الرسوم البيانية بالصور والصوت</li>
    <li><strong>نظام الأحداث:</strong> نضج Event System مع event sourcing وreplay</li>
</ul>

<div class="subsection">
    <div class="subsection-title">المهام</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المهمة</th>
            <th>الأولوية</th>
            <th>الاعتماديات</th>
            <th>الساعات المقدرة</th>
            <th>النتيجة المتوقعة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>تصميم وبناء Strategy Schema مع StrategyStore وStrategyValidator وStrategyPublisher</td>
            <td>P0</td>
            <td>Sprint 7</td>
            <td>40 ساعة</td>
            <td>بنية بيانات استراتيجية مكتملة مع واجهة نشر</td>
        </tr>
        <tr>
            <td>تنفيذ Social Features MVP: Sharing, Comments, Likes, User Profiles</td>
            <td>P1</td>
            <td>Strategy Schema</td>
            <td>36 ساعة</td>
            <td>ميزات اجتماعية أساسية مُنفَّذة ومُختبرة</td>
        </tr>
        <tr>
            <td>تطوير MOXI Pro tier مع Advanced Analysis, Custom Alerts, Priority Support</td>
            <td>P1</td>
            <td>Sprint 3</td>
            <td>32 ساعة</td>
            <td>MVP لطبقة Pro مع 3 ميزات متقدمة</td>
        </tr>
        <tr>
            <td>تكوين Multimodal AI: تحليل صور الرسوم البيانية مع Vision model</td>
            <td>P1</td>
            <td>Sprint 3</td>
            <td>28 ساعة</td>
            <td>MOXI يستطيع تحليل صور charts المُرفقة</td>
        </tr>
        <tr>
            <td>نضج Event System مع EventStore وReplay وCausal Consistency</td>
            <td>P1</td>
            <td>Sprint 5</td>
            <td>28 ساعة</td>
            <td>نظام أحداث قابل لإعادة التشغيل والمراجعة</td>
        </tr>
        <tr>
            <td>بناء Strategy Marketplace UI مع Browse, Search, Filter, Subscribe</td>
            <td>P2</td>
            <td>Social Features</td>
            <td>24 ساعة</td>
            <td>واجهة تصفح واستكشاف الاستراتيجيات</td>
        </tr>
        <tr>
            <td>إضافة Voice Commands لـ MOXI مع Speech-to-Text وText-to-Speech</td>
            <td>P2</td>
            <td>Sprint 3</td>
            <td>20 ساعة</td>
            <td>تفاعل صوتي أساسي مع MOXI</td>
        </tr>
        <tr>
            <td>تخطيط دورة التطوير التالية مع Roadmap v2.0 والميزيات المطلوبة</td>
            <td>P3</td>
            <td>جميع السبرنتات</td>
            <td>12 ساعة</td>
            <td>خريطة طريق v2.0 مع أولويات واضحة</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">المخاطر</div>
</div>
<ul class="vixor-list">
    <li><strong>نطاق طموح:</strong> 8 مهام في سبرنت واحد قد يكون كثيرًا — <em>التخفيف: P2 وP3 تُنقل لدورة لاحقة إذا لزم الأمر</em></li>
    <li><strong>تكلفة Vision AI:</strong> تحليل الصور يستهلك موارد LLM كبيرة — <em>التخفيف: compression preprocessing وcaching للنتائج</em></li>
    <li><strong>قبول اجتماعي:</strong> الميزات الاجتماعية قد لا تحقق القبول المطلوب — <em>التخفيف: إصدار MVP مع ملاحظات المستخدمين</em></li>
    <li><strong>تعقيد Event Sourcing:</strong> قد يُضيف تعقيدًا غير ضروري — <em>التخفيف: تنفيذ تدريجي يبدأ بالعمليات الحرجة فقط</em></li>
</ul>

<div class="subsection">
    <div class="subsection-title">تعريف المنجزة</div>
</div>
<ul class="vixor-list">
    <li>✅ Strategy Schema مُطبَّق ومُوثَّق مع قدرات النشر</li>
    <li>✅ الميزات الاجتماعية الأساسية مُفعَّلة ويمكن اختبارها</li>
    <li>✅ MOXI Pro MVP مُتاح مع فرق واضح عن النسخة المجانية</li>
    <li>✅ Vision AI يُحلل صور Charts بدقة مقبولة في الاختبارات</li>
    <li>✅ Event System يعمل مع إمكانية إعادة تشغيل الأحداث</li>
    <li>✅ خريطة طريق v2.0 مُعَدّة ومُراجعة من الفريق</li>
</ul>
"""
}

# Chapter 11 — Summary
ch_summary = {
    "tag": "11",
    "title": "الملخص والإحصائيات",
    "content": """
<p class="body-text">
تُلخّص هذه الوثيقة <strong>خطة تنفيذ شاملة</strong> لتحسين منظومة فيكسور عبر 9 سبرنتات متتابعة تمتد على <strong>21 أسبوعًا</strong> (حوالي 5 أشهر). كل سبرنت يُعالج مجالًا محددًا من مجالات التحسين المحددة في عمليات التدقيق المعمارية.
</p>

<div class="subsection">
    <div class="subsection-title">إحصائيات الخطة</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المؤشر</th>
            <th>القيمة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>عدد السبرنتات</td>
            <td>9 (Sprint 0 - Sprint 8)</td>
        </tr>
        <tr>
            <td>المدة الإجمالية</td>
            <td>21 أسبوعًا (≈5 أشهر)</td>
        </tr>
        <tr>
            <td>إجمالي المهام</td>
            <td>61 مهمة</td>
        </tr>
        <tr>
            <td>المهام الحرجة (P0)</td>
            <td>23 مهمة (38%)</td>
        </tr>
        <tr>
            <td>المهام العالية (P1)</td>
            <td>24 مهمة (39%)</td>
        </tr>
        <tr>
            <td>المهام المتوسطة (P2)</td>
            <td>11 مهمة (18%)</td>
        </tr>
        <tr>
            <td>المهام المنخفضة (P3)</td>
            <td>3 مهام (5%)</td>
        </tr>
        <tr>
            <td>إجمالي الساعات المقدرة</td>
            <td>~1,064 ساعة</td>
        </tr>
        <tr>
            <td>المجالات المُغطاة</td>
            <td>10 مجالات رئيسية</td>
        </tr>
    </tbody>
</table>

<div class="subsection">
    <div class="subsection-title">توزيع الساعات حسب السبرنت</div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">Sprint 0 — التأسيس</div>
        <div class="info-card-body">90 ساعة | التركيز على البنية التحتية والمعايير</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Sprint 1 — التفكيك</div>
        <div class="info-card-body">204 ساعة | أكبر سبرنت حجمًا</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Sprint 2 — الأداء</div>
        <div class="info-card-body">108 ساعة | تحسينات تحميّة</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Sprint 3 — MOXI</div>
        <div class="info-card-body">180 ساعة | تطوير المحرك الذكي</div>
    </div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">Sprint 4 — الأمان</div>
        <div class="info-card-body">112 ساعة | حماية النظام والبيانات</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Sprint 5 — قاعدة البيانات</div>
        <div class="info-card-body">120 ساعة | تحسين الأداء والهيكلة</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Sprint 6 — UX</div>
        <div class="info-card-body">164 ساعة | تجربة مستخدم شاملة</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Sprint 7 — الاختبار</div>
        <div class="info-card-body">192 ساعة | رفع التغطية والتوثيق</div>
    </div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">Sprint 8 — المتقدم</div>
        <div class="info-card-body">220 ساعة | ميزات المرحلة التالية</div>
    </div>
</div>

<div class="callout">
    <div class="callout-title">✦ ملاحظة حول المدد</div>
    <div class="callout-body">
        المدد المذكورة تقديرية وتعتمد على فريق مطوّرين متوسطه 3-4 مطوّرين بدوام كامل. السبرنتات يمكن تقصيرها أو تمديدها حسب توفر الموارد وأولويات العمل.
    </div>
</div>

<div class="subsection">
    <div class="subsection-title">المبادئ التوجيهية</div>
</div>
<ul class="vixor-list">
    <li><strong>التدرج:</strong> كل سبرنت يبني على نتائج سابقه — لا تنتقل للسبرنت التالي دون إكمال تعريف المنجزة</li>
    <li><strong>الجودة أولاً:</strong> تغطية الاختبارات أولوية قبل كل تعديل على الكود</li>
    <li><strong>الشفافية:</strong> جميع المؤشرات قابلة للقياس ومُتتبَّعة عبر Sprint Dashboard</li>
    <li><strong>المرونة:</strong> المهام P2 وP3 قابلة لإعادة الجدولة حسب الأولويات المتغيرة</li>
    <li><strong>التوثيق:</strong> كل تغيير يُوثَّق ويُراجَع لضمان المعرفة المؤسسية</li>
    <li><strong>المستخدم في المركز:</strong> جميع التحسينات تُقاس بتأثيرها على تجربة المستخدم النهائي</li>
</ul>

<div class="callout callout-success">
    <div class="callout-title">✦ الرؤية بعيدة المدى</div>
    <div class="callout-body">
        بعد إكمال هذه السبرنتات التسعة، ستكون فيكسور في وضع قوي: كود نظيف ومنظم، أداء محسّن، أمان متين، تجربة مستخدم احترافية، تغطية اختبارات شاملة، ومحرك MOXI ذكي متطور. هذه الأسس تُمهّد لـ v2.0 مع ميزات جذرية مثل سوق الاستراتيجيات والتعاون الاجتماعي والتداول متعدد الوسائط.
    </div>
</div>
"""
}

# ────────────────────────────────────────────────────────────────
# GENERATE
# ────────────────────────────────────────────────────────────────

chapters = [
    ch_intro,
    ch_sprint0,
    ch_sprint1,
    ch_sprint2,
    ch_sprint3,
    ch_sprint4,
    ch_sprint5,
    ch_sprint6,
    ch_sprint7,
    ch_sprint8,
    ch_summary,
]

html = generate_vixor_html(
    title="كتاب تنفيذ السبرنتات",
    subtitle="خطة تنفيذ تحسينات فيكسور عبر 9 سبرنتات",
    doc_id="DOC-10",
    chapters=chapters,
    footer_text="VIXOR Engineering Bible — Sprint Execution Bible"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)
html_path = save_html(html, "10-sprints.html")
print(f"HTML saved to: {html_path}")

pdf_path = convert_to_pdf(html_path, "10-sprints.pdf", skill_dir="/home/z/my-project/skills/pdf")
print(f"PDF saved to: {pdf_path}")
