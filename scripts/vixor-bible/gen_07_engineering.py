"""
VIXOR Engineering Bible — Document 07: Engineering Standards (كتاب المعايير الهندسية)
Generates the official engineering standards and methodology document in Arabic.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


# ────────────────────────────────────────────────────────────────
# CHAPTERS
# ────────────────────────────────────────────────────────────────

chapters = [

    # ── 01 ── سير العمل في جيت ──
    {
        "tag": "01",
        "title": "سير العمل في جيت (Git Workflow)",
        "content": """
<p class="body-text">
يعتمد مشروع فيكسور بالكامل على نظام التحكم بالإصدارات <strong>Git</strong> كمصدر وحيد للحقيقة (Single Source of Truth). المستودع الرئيسي مستضاف على <code>github.com/kam65624-cmd/vixor-APP.git</code> ويُدار من خلال فرع <code>main</code> كفرع أساسي للاستقرار والإنتاج. جميع عمليات النشر تتم تلقائيًا من هذا الفرع عبر <strong>Vercel</strong>، مما يعني أن أي كود يُدمج في <code>main</code> ينتقل مباشرة إلى بيئة الإنتاج بعد اجتياز بناء ناجح.
</p>
<p class="body-text">
يتبع فريق فيكسور نموذج سير عمل مبني على الفرع الرئيسي (Main-based Workflow) حيث يكون <code>main</code> دائمًا في حالة قابلة للنشر. يتم تطوير الميزات الجديدة في فروع منفصلة تُدمج عبر طلبات السحب (Pull Requests) بعد المراجعة. هذا النهج يضمن أن بيئة الإنتاج لا تتلقى سوى الكود المُراجَع والمُختبر، ويقلل من مخاطر الأعطال ويسهّل التتبع والرجوع عند الحاجة.
</p>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ قاعدة ذهبية</div>
    <div class="callout-body">
        يُمنع منعًا باتًا الدفع المباشر (Direct Push) إلى فرع <code>main</code>. جميع التغييرات يجب أن تمر عبر طلب سحب مع مراجعة كود واحدة على الأقل من عضو فريق آخر.
    </div>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">المستودع</div>
        <div class="info-card-body">github.com/kam65624-cmd/vixor-APP.git — الفرع الافتراضي: <code>main</code></div>
    </div>
    <div class="info-card">
        <div class="info-card-title">مدير الحزم</div>
        <div class="info-card-body"><code>pnpm</code> الإصدار 9.15.0 مع Node.js >= 20.0.0 كحد أدنى</div>
    </div>
</div>
<p class="body-text">
تتضمن أدوات المشروع الأساسية ثلاثة أوامر مُهيكلة: <code>pnpm dev</code> لتشغيل خادم التطوير عبر Vite، و<code>pnpm build</code> لتنفيذ عملية البناء التي تشمل تنفيذ <code>vite build</code> متبوعًا بسكريبت <code>fix-vercel-bundle.mjs</code> لمعالجة مشاكل حزم النشر على Vercel، و<code>pnpm lint</code> لتشغيل فحص ESLint على المجلدات <code>src/</code> و<code>server/</code>، إضافة إلى <code>pnpm format</code> لتنسيق الكود عبر Prettier.
</p>
"""
    },

    # ── 02 ── استراتيجية الفروع ──
    {
        "tag": "02",
        "title": "استراتيجية الفروع (Branch Strategy)",
        "content": """
<p class="body-text">
تتبع فيكسور استراتيجية فروع مبسطة وفعالة تركز على فرع واحد للاستقرار مع فروع مؤقتة للتطوير. الفرع <code>main</code> هو الفرع الوحيد الدائم الذي يمثل حالة التطبيق الجاهزة للإنتاج في أي لحظة. جميع الفروع الأخرى هي فروع مؤقتة تُحذف بعد دمجها لضمان نظافة المستودع.
</p>
<div class="subsection">
    <div class="subsection-title">الفرع الرئيسي — <code>main</code></div>
    <p class="body-text">
        يحتوي <code>main</code> دائمًا على كود مستقر ومُختبر. كل التزام (Commit) في هذا الفرع يجب أن يمر عبر طلب سحب مُراجَع. النشر إلى Vercel يتم تلقائيًا من هذا الفرع فقط، وعند دمج أي طلب سحب يبدأ Vercel عملية البناء فورًا.
    </p>
</div>
<div class="subsection">
    <div class="subsection-title">فروع الميزات — <code>feature/*</code></div>
    <p class="body-text">
        كل ميزة جديدة أو تعديل يتم في فرع منفصل يُنشأ من <code>main</code>. يجب أن يحتوي اسم الفرع على وصف واضح ومختصر باللغة الإنجليزية. يجب أن يكون الفرع مركّزًا على مهمة واحدة فقط لتسهيل المراجعة وتقليل التعارضات (Merge Conflicts).
    </p>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>نوع الفرع</th>
            <th>الصيغة</th>
            <th>مثال</th>
            <th>الوصف</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>ميزة</td>
            <td><code>feature/*</code></td>
            <td><code>feature/add-stop-loss</code></td>
            <td>تطوير ميزة جديدة بالكامل</td>
        </tr>
        <tr>
            <td>إصلاح</td>
            <td><code>fix/*</code></td>
            <td><code>fix/auth-token-expiry</code></td>
            <td>إصلاح خطأ محدد في الإنتاج أو التطوير</td>
        </tr>
        <tr>
            <td>تحسين</td>
            <td><code>refactor/*</code></td>
            <td><code>refactor/query-cache-layer</code></td>
            <td>إعادة هيكلة الكود بدون تغيير السلوك</td>
        </tr>
        <tr>
            <td>وثائق</td>
            <td><code>docs/*</code></td>
            <td><code>docs/api-endpoints</code></td>
            <td>تحديث أو إضافة وثائق</td>
        </tr>
        <tr>
            <td>صيانة</td>
            <td><code>chore/*</code></td>
            <td><code>chore/update-deps</code></td>
            <td>مهام صيانة وتحديثات بنية تحتية</td>
        </tr>
    </tbody>
</table>
<div class="callout">
    <div class="callout-title">📌 دورة حياة الفرع</div>
    <div class="callout-body">
        يُنشأ الفرع من <code>main</code> → يُطوَّر ويُختبر → يُرسل طلب سحب → يُراجَع ويُوافق عليه → يُدمج في <code>main</code> → يُحذف الفرع المؤقت.
    </div>
</div>
"""
    },

    # ── 03 ── اتفاقية الالتزامات ──
    {
        "tag": "03",
        "title": "اتفاقية الالتزامات (Commit Convention)",
        "content": """
<p class="body-text">
رغم عدم وجود تكوين صريح لاتفاقية الالتزامات في إعدادات المشروع الحالية، يُوصى بشدة باعتماد نمط <strong>Conventional Commits</strong> كمعيار رسمي لفريق فيكسور. هذا النمط يوفر تاريخًا واضحًا ومنظمًا للتعديلات، ويسهّل إنشاء سجلات التغييرات (Changelogs) تلقائيًا، ويدعم تكاملًا أفضل مع أدوات النشر المستمر.
</p>
<p class="body-text">
يعتمد النمط على صيغة موحدة تتكون من نوع الالتزام يتبعه نقطتان ثم وصف مختصر باللغة الإنجليزية. الوصف يجب أن يكون في صيغة الأمر المباشر (Imperative Mood) وألا يتجاوز 72 حرفًا. يمكن إضافة نص تفصيلي بعد سطر فارغ، وإضافة تذييل (Footer) لربط الالتزام بقضايا أو طلبات سحب محددة.
</p>
<div class="code-block">feat(trading): add trailing stop-loss order type

fix(auth): resolve token refresh race condition

refactor(api): extract security middleware to _security.ts

docs(readme): update environment setup instructions

chore(deps): upgrade React to 19.2.0</div>
<div class="subsection">
    <div class="subsection-title">أنواع الالتزامات المعتمدة</div>
    <table class="vixor-table">
        <thead>
            <tr>
                <th>النوع</th>
                <th>الاستخدام</th>
                <th>يرفع الإصدار</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>feat</code></td>
                <td>ميزة جديدة للمستخدم النهائي</td>
                <td>PATCH → MINOR</td>
            </tr>
            <tr>
                <td><code>fix</code></td>
                <td>إصلاح خطأ في سلوك موجود</td>
                <td>PATCH</td>
            </tr>
            <tr>
                <td><code>refactor</code></td>
                <td>إعادة هيكلة بدون تغيير السلوك</td>
                <td>لا يرفع</td>
            </tr>
            <tr>
                <td><code>docs</code></td>
                <td>تغييرات في التوثيق فقط</td>
                <td>لا يرفع</td>
            </tr>
            <tr>
                <td><code>chore</code></td>
                <td>مهام صيانة وبنية تحتية</td>
                <td>لا يرفع</td>
            </tr>
            <tr>
                <td><code>perf</code></td>
                <td>تحسين في الأداء</td>
                <td>PATCH</td>
            </tr>
            <tr>
                <td><code>style</code></td>
                <td>تنسيق وفواصل (لا منطق)</td>
                <td>لا يرفع</td>
            </tr>
        </tbody>
    </table>
</div>
<div class="callout callout-success">
    <div class="callout-title">✅ النطاق (Scope)</div>
    <div class="callout-body">
        يُضاف بين أقواس بعد النوع ويحدد الوحدة المتأثرة: <code>feat(trading):...</code> أو <code>fix(auth):...</code>. النطاق اختياري لكنه مطلوب في فيكسور.
    </div>
</div>
"""
    },

    # ── 04 ── طلبات السحب ──
    {
        "tag": "04",
        "title": "طلبات السحب (Pull Requests)",
        "content": """
<p class="body-text">
طلبات السحب (Pull Requests) هي البوابة الوحيدة لدمج الكود في فرع <code>main</code>. كل طلب سحب يمثل وحدة تغيير منطقية مكتملة ومُختبرة. يُشترط أن يحتوي كل طلب على وصف واضح يشرح السياق والتعديلات والاختبارات المُجراة، حتى يكون المراجع قادرًا على فهم نطاق التغيير بسرعة وفعالية.
</p>
<div class="subsection">
    <div class="subsection-title">هيكل طلب السحب</div>
    <p class="body-text">
        يجب أن يتبع كل طلب سحب قالبًا موحدًا يضمن اكتمال المعلومات المطلوبة. يبدأ بعنوان واضح يعكس نوع التغيير والمكون المتأثر، يليه قسم يشرح لماذا تم هذا التعديل (السياق والمشكلة)، ثم قسم يفصّل ما تم تغييره بالتحديد، وأخيرًا قسم للاختبارات وقائمة المراجعة (Checklist) التي يؤكد المطور تنفيذها.
    </p>
</div>
<div class="callout">
    <div class="callout-title">📋 قالب طلب السحب المطلوب</div>
    <div class="callout-body">
        <strong>العنوان:</strong> <code>type(scope): وصف مختصر</code><br>
        <strong>الوصف:</strong> شرح المشكلة والحل المقترح<br>
        <strong>التغييرات:</strong> قائمة بالملفات والوحدات المتأثرة<br>
        <strong>الاختبارات:</strong> وصف الاختبارات المُضافة أو المُعدّلة<br>
        <strong>قائمة المراجعة:</strong> تأكيد تنفيذ جميع النقاط قبل الطلب
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">شروط القبول</div>
    <ul class="vixor-list">
        <li>يجب أن يجتاز البناء (<code>pnpm build</code>) بنجاح بدون أخطاء أو تحذيرات حرجة</li>
        <li>يجب أن يجتاز فحص الكود (<code>pnpm lint</code>) بدون أخطاء</li>
        <li>يجب أن يحصل على موافقة (Approval) من مطور واحد على الأقل غير منشئ الطلب</li>
        <li>يجب أن تكون جميع التعليقات (Comments) في طلب السحب محلولة (Resolved)</li>
        <li>لا يجب أن يوجد تعارضات (Merge Conflicts) مع فرع <code>main</code></li>
        <li>يجب أن يكون الالتزام مُنسّقًا وفقًا لاتفاقية Conventional Commits</li>
    </ul>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ حجم طلب السحب</div>
    <div class="callout-body">
        يُفضل أن يكون كل طلب سحب مركّزًا على مهمة واحدة. إذا تجاوز الطلب 400 سطر من التغييرات (باستثناء الملفات المُولَّدة)، يجب تقسيمه إلى عدة طلبات أصغر.
    </div>
</div>
"""
    },

    # ── 05 ── مراجعة الكود ──
    {
        "tag": "05",
        "title": "مراجعة الكود (Code Review)",
        "content": """
<p class="body-text">
مراجعة الكود هي حجر الزاوية في ضمان جودة وسلامة مشروع فيكسور. الهدف من المراجعة ليس فقط اكتشاف الأخطاء البرمجية، بل أيضًا نشر المعرفة بين أعضاء الفريق، وضمان التوافق مع المعايير المعمول بها، والحفاظ على اتساق البنية البرمجية. كل كود يُدمج في <code>main</code> يجب أن يكون قد مر بمراجعة صريحة من مطور آخر.
</p>
<div class="subsection">
    <div class="subsection-title">مبادئ المراجعة</div>
    <ul class="vixor-list">
        <li><strong>المراجعة البنّاءة:</strong> التركيز على تحسين الكود وليس نقد المطور. استخدام لغة محترمة ومحددة في التعليقات</li>
        <li><strong>السرعة:</strong> الرد على طلبات المراجعة خلال 24 ساعة كحد أقصى. لا تترك الطلبات معلّقة لأيام</li>
        <li><strong>الشمولية:</strong> مراجعة المنطق والأمان والأداء وقابلية الصيانة، وليس فقط بناء الجملة</li>
        <li><strong>التسلسل الهرمي:</strong> التعليقات على النمط (Style) اختيارية، بينما التعليقات على المنطق والأمان إلزامية المعالجة</li>
    </ul>
</div>
<div class="subsection">
    <div class="subsection-title">نقاط التركيز في المراجعة</div>
    <table class="vixor-table">
        <thead>
            <tr>
                <th>الناحية</th>
                <th>ما يتم فحصه</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>الأمان</td>
                <td>صلاحيات RLS، حماية <code>service-role</code>، عدم تسريب بيانات حساسة للعميل</td>
            </tr>
            <tr>
                <td>الأداء</td>
                <td>استعلامات غير ضرورية، تسريبات ذاكرة، أحجام حزم كبيرة</td>
            </tr>
            <tr>
                <td>الأنماط</td>
                <td>التزام بنمط الخوادم فقط (<code>.server.ts</code>)، استخدام <code>useStableServerFn</code></td>
            </tr>
            <tr>
                <td>معالجة الأخطاء</td>
                <td>استخدام <code>RouteErrorBoundary</code>، تغليف الاستدعاءات بمعالجة أخطاء</td>
            </tr>
            <tr>
                <td>النوعية</td>
                <td>غياب <code>any</code>، أنواع TypeScript صحيحة، تغطية اختبارية كافية</td>
            </tr>
        </tbody>
    </table>
</div>
<div class="callout callout-success">
    <div class="callout-title">✅ قواعد الموافقة</div>
    <div class="callout-body">
        موافقة واحدة كافية للدمج. التعليقات المُعلَّمة كـ <strong>blocking</strong> يجب معالجتها قبل الدمج. المُراجِع يمكنه طلب تعديلات (Request Changes) أو الموافقة (Approve) أو التعليق فقط (Comment).
    </div>
</div>
"""
    },

    # ── 06 ── الاختبار ──
    {
        "tag": "06",
        "title": "الاختبار (Testing)",
        "content": """
<p class="body-text">
يعتمد مشروع فيكسور على طبقتين أساسيتين للاختبار: <strong>Vitest</strong> للاختبارات الوحدوية (Unit Tests) التي تتحقق من صحة الدوال والمنطق البرمجي المعزول، و<strong>Storybook</strong> (مع <code>@chromatic-com/storybook</code>) لاختبار المكونات المرئية بشكل منفصل عن التطبيق الكامل. هاتان الطبقتان معًا توفران شبكة أمان قوية تمنع الانحدارات (Regressions) وتضمن استقرار الواجهة.
</p>
<div class="subsection">
    <div class="subsection-title">اختبارات الوحدوية بـ Vitest</div>
    <p class="body-text">
        تُستخدم لاختبار الدوال المساعدة (Utility Functions)، ومُحوِّلات البيانات (Data Transformers)، والمنطق البرمجي البحت. يجب أن تكون الاختبارات سريعة ومحددة وقابلة للتكرار. كل اختبار يجب أن يكون مستقلًا عن غيره ولا يعتمد على حالة مشتركة أو ترتيب تنفيذ محدد.
    </p>
    <div class="code-block">// نمط اختبار معتمد في فيكسور
describe('formatPrice', () => {
  it('should format positive numbers with commas', () => {
    expect(formatPrice(1234567.89)).toBe('1,234,567.89')
  })

  it('should handle zero correctly', () => {
    expect(formatPrice(0)).toBe('0.00')
  })

  it('should handle negative numbers', () => {
    expect(formatPrice(-500)).toBe('-500.00')
  })
})</div>
</div>
<div class="subsection">
    <div class="subsection-title">اختبار المكونات بـ Storybook</div>
    <p class="body-text">
        يوفر Storybook بيئة معزولة لتطوير واختبار المكونات المرئية بشكل مستقل. من خلال التكامل مع Chromatic، يتم التقاط لقطات شاشة (Snapshots) تلقائيًا لكل نسخة ومقارنتها بالإصدار السابق لضمان عدم حدوث تغييرات غير مقصودة في المظهر. يُطلب كتابة قصة (Story) واحدة على الأقل لكل مكون UI جديد.
    </p>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">Vitest</div>
        <div class="info-card-body">اختبارات وحدوية سريعة للمنطق والدوال المساعدة. ملفات الاختبار بجانب الملف المصدر أو في مجلد <code>__tests__</code>.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Storybook + Chromatic</div>
        <div class="info-card-body">اختبارات مرئية للمكونات مع مقارنة لقطات الشاشة تلقائيًا عبر Chromatic لكل طلب سحب.</div>
    </div>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ مبدأ الاختبار</div>
    <div class="callout-body">
        لا يُطلب تغطية اختبارية 100%، لكن يجب اختبار كل مسار خطأ حرج وكل دالة معقّدة تحوي شروطًا متعددة. الأولوية للمنطق المالي والأمان وصلاحيات الوصول.
    </div>
</div>
"""
    },

    # ── 07 ── التكامل والنشر المستمر ──
    {
        "tag": "07",
        "title": "التكامل والنشر المستمر (CI/CD)",
        "content": """
<p class="body-text">
تعتمد فيكسور على منصة <strong>Vercel</strong> كنظام أساسي للنشر المستمر (Continuous Deployment). عملية النشر تتم تلقائيًا عند كل دمج في فرع <code>main</code>، حيث يقوم Vercel ببناء المشروع ونشره دون تدخل يدوي. هذا يضمن وصول أحدث التعديلات إلى المستخدمين بأسرع وقت ممكن مع الحفاظ على جودة عالية عبر عمليات الفحص التلقائية.
</p>
<div class="subsection">
    <div class="subsection-title">خطوة البناء (Build Process)</div>
    <p class="body-text">
        تبدأ عملية النشر بتنفيذ أمر <code>pnpm build</code> الذي يعمل على مرحلتين متسلسلتين. المرحلة الأولى هي <code>vite build</code> الذي يقوم بتجميع التطبيق وتحسينه للإنتاج. المرحلة الثانية هي تنفيذ <code>scripts/fix-vercel-bundle.mjs</code>، وهو سكريبت مخصص يعالج مشكلات محددة تتعلق بحزم النشر على بيئة Vercel، بما في ذلك ضمان توافق مسارات الوحدات مع نظام Nitro المستخدم في TanStack Start.
    </p>
</div>
<div class="subsection">
    <div class="subsection-title">التكوين التقني للبناء</div>
    <ul class="vixor-list">
        <li><strong>Vite 7.3.1</strong> — أداة البناء الرئيسية مع دعم Lightning CSS لتحسين الأنماط</li>
        <li><strong>TanStack Start 1.168.25</strong> — إطار العمل مع دعم التوجيه المبني على الملفات وتقديم الخادم (SSR)</li>
        <li><strong>chunkSizeWarningLimit: 700KB</strong> — حد تحذير لحجم الحزمة تم ضبطه وفقًا لاحتياجات المشروع</li>
        <li><strong>CSP Headers</strong> — رؤوس أمان المحتوى مُهيأة على مستوى الخادم</li>
        <li><strong>frame-ancestors</strong> — مُهيأ خصيصًا للسماح بتضمين التطبيق داخل Telegram</li>
    </ul>
</div>
<div class="callout">
    <div class="callout-title">🔧 سكريبت fix-vercel-bundle</div>
    <div class="callout-body">
        سكريبت <code>scripts/fix-vercel-bundle.mjs</code> يعالج تعقيدات نشر تطبيقات TanStack Start على Vercel. يشمل ضبط مسارات الاستيراد وتوافق وحدات Node.js مع بيئة Serverless الخاصة بـ Vercel. أي تعديل على هذا السكريبت يتطلب اختبار نشر كامل.
    </div>
</div>
<p class="body-text">
يتضمن خط أنابيب النشر أيضًا فحصًا تلقائيًا عبر ESLint أثناء البناء، مما يضمن عدم دمج كود يخالف قواعد المشروع. إذا فشل البناء أو فحص الكود، يتوقف النشر تلقائيًا ويُبلَّغ الفريق عبر إشعارات GitHub.
</p>
"""
    },

    # ── 08 ── عملية الإصدار ──
    {
        "tag": "08",
        "title": "عملية الإصدار (Release Process)",
        "content": """
<p class="body-text">
عملية الإصدار في فيكسور مبسطة ومباشرة بناءً على النشر المستمر عبر Vercel. بما أن النشر يتم تلقائيًا من فرع <code>main</code>، فإن كل دمج ناجح يُمثّل إصدارًا جديدًا فعليًا. ومع ذلك، تظل هناك حاجة لعملية إصدار منظمة للإصدارات المهمة التي تتضمن تغييرات جوهرية تحتاج توثيقًا وتواصلًا مع المستخدمين.
</p>
<div class="subsection">
    <div class="subsection-title">سير عمل النشر</div>
    <ol class="vixor-ol">
        <li>يُنشأ فرع الميزة من <code>main</code> ويُطوَّر مع اختبارات كافية</li>
        <li>يُرسل طلب سحب مع وصف كامل وقائمة مراجعة مكتملة</li>
        <li>يُراجَع الكود من قبل مطور آخر وتُحلّ جميع التعليقات</li>
        <li>يُدمج طلب السحب في <code>main</code> بعد الحصول على الموافقة</li>
        <li>يبدأ Vercel عملية البناء تلقائيًا (Build + fix-vercel-bundle)</li>
        <li>إذا نجح البناء، يُنفَّذ النشر إلى بيئة الإنتاج</li>
        <li>يتم التحقق من التطبيق مباشرة بعد النشر عبر Sentry وMixpanel</li>
    </ol>
</div>
<div class="subsection">
    <div class="subsection-title">خطة التراجع (Rollback)</div>
    <p class="body-text">
        في حال اكتشاف مشكلة حرجة بعد النشر، توفر فيكسور طبقات حماية متعددة. الطبقة الأولى هي <strong>Vercel Rollback</strong> الذي يسمح بالعودة إلى أي نشر سابق بنقرة واحدة من لوحة تحكم Vercel. الطبقة الثانية هي مراقبة الأخطاء عبر <strong>Sentry</strong> الذي يُبلِّغ فوريًا عن أي زيادة غير طبيعية في معدل الأخطاء. الطبقة الثالثة هي <strong>Mixpanel</strong> الذي يراقب مؤشرات أداء المستخدم ويكتشف التراجعات في الأداء.
    </p>
</div>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">النشر التلقائي</div>
        <div class="info-card-body">كل دمج في <code>main</code> يُنشئ نشرًا تلقائيًا. لا يوجد نشر يدوي في المسار العادي.</div>
    </div>
    <div class="info-card">
        <div class="info-card-title">التراجع</div>
        <div class="info-card-body">Vercel يتيح العودة للنشر السابق فورًا. Sentry يرصد الأخطاء والتدهورات تلقائيًا.</div>
    </div>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ إصدارات الطوارئ</div>
    <div class="callout-body">
        للإصلاحات العاجلة، يُسمح بالدمج المباشر بعد مراجعة واحدة سريعة مع إضافة <code>HOTFIX</code> في عنوان طلب السحب. يجب متابعة ذلك بمراجعة شاملة خلال 24 ساعة.
    </div>
</div>
"""
    },

    # ── 09 ── إدارة الإصدارات ──
    {
        "tag": "09",
        "title": "إدارة الإصدارات (Versioning)",
        "content": """
<p class="body-text">
تتبع فيكسور معيار <strong>Semantic Versioning</strong> (الإصدار الدلالي) لإدارة أرقام إصدارات المشروع. هذا المعيار يوفر طريقة واضحة ومفهومة عالميًا للإشارة إلى طبيعة التغييرات في كل إصدار، ويساعد المستخدمين والمطورين على فهم تأثير التحديثات وتوافقها مع الإصدارات السابقة.
</p>
<div class="subsection">
    <div class="subsection-title">بنية رقم الإصدار</div>
    <p class="body-text">
        يتكون رقم الإصدار من ثلاثة أجزاء: <code>MAJOR.MINOR.PATCH</code> (رئيسي.فرعي.تصحيحي). كل جزء يُرفع وفقًا لنوع التغيير المُقدَّم في الإصدار. هذه القواعد ليست اختيارية — الالتزام بها ضروري لضمان توافق تبعيات المشروع وتوقعات المستخدمين.
    </p>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المستوى</th>
            <th>متى يُرفع</th>
            <th>التأثير</th>
            <th>مثال</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>MAJOR</code> (رئيسي)</td>
            <td>تغييرات غير متوافقة مع الإصدارات السابقة (Breaking Changes)</td>
            <td>يتطلب تعديل الكود المستهلك</td>
            <td><code>1.x.x → 2.0.0</code></td>
        </tr>
        <tr>
            <td><code>MINOR</code> (فرعي)</td>
            <td>إضافة ميزات جديدة متوافقة مع الإصدارات السابقة</td>
            <td>إضافات بدون إزالة</td>
            <td><code>2.0.x → 2.1.0</code></td>
        </tr>
        <tr>
            <td><code>PATCH</code> (تصحيحي)</td>
            <td>إصلاح أخطاء بدون تغيير الواجهة البرمجية</td>
            <td>لا تأثير على الواجهات</td>
            <td><code>2.1.x → 2.1.1</code></td>
        </tr>
    </tbody>
</table>
<div class="callout">
    <div class="callout-title">📌 العلاقة مع Conventional Commits</div>
    <div class="callout-body">
        <code>feat:</code> → يرفع <code>MINOR</code> &nbsp;|&nbsp; <code>fix:</code> → يرفع <code>PATCH</code> &nbsp;|&nbsp; التزامات <code>BREAKING CHANGE:</code> في التذييل → ترفع <code>MAJOR</code>. هذا التآزر بين الاتفاقيتين يُمكّن من أتمتة تسجيل التغييرات.
    </div>
</div>
<div class="callout callout-success">
    <div class="callout-title">✅ الإصدارات المسبقة</div>
    <div class="callout-body">
        للإصدارات التجريبية يُضاف لاحقة: <code>2.1.0-alpha.1</code> أو <code>2.1.0-beta.3</code> أو <code>2.1.0-rc.1</code>. تسلسل الأولوية: alpha → beta → rc → stable.
    </div>
</div>
"""
    },

    # ── 10 ── قواعد التوثيق ──
    {
        "tag": "10",
        "title": "قواعد التوثيق (Documentation Rules)",
        "content": """
<p class="body-text">
التوثيق الجيد ليس رفاهية بل ضرورة هندسية في مشروع بحجم وتعقيد فيكسور. يُشترط توثيق كل واجهة برمجية عامة (Public API)، وكل مكون مُعاد استخدام، وكل منطق معقد يحتاج شرحًا. الهدف هو أن يتمكن أي مطور جديد من فهم قاعدة الكود دون الحاجة لشرح شفهي مطوّل.
</p>
<div class="subsection">
    <div class="subsection-title">JSDoc للدوال والمكونات</div>
    <p class="body-text">
        كل دالة عامة ومُصدَّرة يجب أن تحتوي على تعليق JSDoc كامل يصف الغرض والمعاملات والقيمة المُرجعة. هذا لا يُساعد فقط المطورين بل يُحسّن أيضًا تجربة التطوير عبر إكمال تلقائي دقيق في محرر الكود.
    </p>
    <div class="code-block">/**
 * Calculates the profit/loss percentage for a trade.
 *
 * @param entryPrice - The price at which the position was opened
 * @param exitPrice  - The price at which the position was closed
 * @param direction  - Trade direction: 'long' or 'short'
 * @returns Profit/loss as a percentage (positive = profit)
 * @throws {Error} If entryPrice is zero or negative
 *
 * @example
 * calcPnlPercent(50000, 55000, 'long') // returns 10
 */
export function calcPnlPercent(
  entryPrice: number,
  exitPrice: number,
  direction: 'long' | 'short'
): number { ... }</div>
</div>
<div class="subsection">
    <div class="subsection-title">تعليقات الكود المصدري</div>
    <ul class="vixor-list">
        <li><strong>لماذا وليس ماذا:</strong> التعليقات يجب أن تشرح <strong>لماذا</strong> تم اتخاذ قرار معين، وليس <strong>ماذا</strong> يفعله الكود (الكود نفسه يجب أن يكون واضحًا)</li>
        <li><strong>المنطق المعقد:</strong> أي منطق يحتوي على حسابات مالية أو شروط معقدة يجب توثيقه بتعليق يشرح السياق</li>
        <li><strong>التوافق (Workarounds):</strong> أي حل بديل لمشكلة في مكتبة خارجية يجب توثيقه مع إشارة للمشكلة الأصلية</li>
        <li><strong>TODO/FIXME:</strong> استخدام هذه العلامات مع رقم القضية: <code>TODO(#123): add rate limiting</code></li>
    </ul>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ التوازن في التوثيق</div>
    <div class="callout-body">
        تجنّب التعليقات الزائدة التي تعيد صياغة الكود. <code>x++ // increment x</code> تعليق ضار. الاستثناء الوحيد هو التعليقات التي تشرح <strong>لماذا</strong> وليس <strong>ماذا</strong>. المقياس: إذا حذفت التعليق، هل سيفهم المطور السبب؟
    </div>
</div>
"""
    },

    # ── 11 ── قواعد جودة الكود ──
    {
        "tag": "11",
        "title": "قواعد جودة الكود (Code Quality Rules)",
        "content": """
<p class="body-text">
تعتمد فيكسور على ثلاث طبقات متراكبة لضمان جودة الكود: <strong>TypeScript في الوضع الصارم (Strict Mode)</strong> كطبقة أولى لضمان سلامة الأنواع، و<strong>ESLint</strong> كطبقة ثانية لاكتشاف الأنماط السيئة والمخالفات، و<strong>Prettier</strong> كطبقة ثالثة لضمان تنسيق موحد عبر المشروع بالكامل. هذه الطبقات تعمل معًا لمنع فئات واسعة من الأخطاء قبل مرحلة التشغيل.
</p>
<div class="subsection">
    <div class="subsection-title">TypeScript — الوضع الصارم</div>
    <p class="body-text">
        المشروع مُهيأ بـ TypeScript 5.8.3 في الوضع الصارم (<code>strict: true</code>) مع دعم ES2022 ونظام حل الوحدات <code>bundler</code>. هذا يعني تفعيل جميع خيارات الفحص الصارمة بما فيها <code>noImplicitAny</code> و<code>strictNullChecks</code> و<code>noUncheckedIndexedAccess</code>. استخدام النوع <code>any</code> ممنوع إلا في حالات استثنائية مُوثّقة بتعليق يشرح السبب.
    </p>
</div>
<div class="subsection">
    <div class="subsection-title">ESLint — فحص الكود</div>
    <p class="body-text">
        يتم تشغيل ESLint عبر <code>pnpm lint</code> على المجلدات <code>src/</code> و<code>server/</code>. فحص ESLint يكشف مشاكل مثل المتغيرات غير المستخدمة، والوصول إلى خصائص قد تكون غير معرّفة، والأنماط المعرضة للأخطاء. يجب أن يجتاز الكود فحص ESLint بدون أخطاء قبل الدمج.
    </p>
</div>
<div class="subsection">
    <div class="subsection-title">Prettier — التنسيق التلقائي</div>
    <p class="body-text">
        يتم تشغيل Prettier عبر <code>pnpm format</code> لتنسيق جميع الملفات تلقائيًا. هذا يُلغي النقاشات حول التنسيق ويضمن مظهرًا موحدًا. يُنصح بتكوين المحرر لتنفيذ Prettier عند الحفظ (Format on Save) لتقليل الالتزامات التنسيقية.
    </p>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>الأداة</th>
            <th>الأمر</th>
            <th>النطاق</th>
            <th>الدور</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>TypeScript</strong></td>
            <td>بناء تلقائي</td>
            <td>المشروع بالكامل</td>
            <td>فحص الأنواع في وقت التحويل البرمجي</td>
        </tr>
        <tr>
            <td><strong>ESLint</strong></td>
            <td><code>pnpm lint</code></td>
            <td><code>src/ server/</code></td>
            <td>اكتشاف الأنماط السيئة والمخالفات</td>
        </tr>
        <tr>
            <td><strong>Prettier</strong></td>
            <td><code>pnpm format</code></td>
            <td>المشروع بالكامل</td>
            <td>تنسيق موحد للكود والأنماط</td>
        </tr>
    </tbody>
</table>
<div class="callout callout-success">
    <div class="callout-title">✅ حماية الخادم</div>
    <div class="callout-body">
        نظام حماية الطبقات: <code>.server.ts</code> يمنع الاستيراد من جهة العميل عبر TanStack Start، وطبقة الأمان <code>_security.ts</code> تحمي جميع نقاط النهاية الـ 14، و<code>useRenderGuard</code> يحمي من التنفيذ غير الصحيح.
    </div>
</div>
"""
    },

    # ── 12 ── قواعد الاعتماديات ──
    {
        "tag": "12",
        "title": "قواعد الاعتماديات (Dependency Rules)",
        "content": """
<p class="body-text">
إدارة الاعتماديات في فيكسور تخضع لقواعد صارمة لحماية المشروع من التضخم في حجم الحزم، ومن الثغرات الأمنية، ومن التعارضات بين المكتبات. كل إضافة اعتمادية جديدة يجب أن تكون مُبرَّرة ومدروسة، مع تفضيل الحلول المبنية على المتصفح أو المكتبات الموجودة في المشروع.
</p>
<div class="subsection">
    <div class="subsection-title">قواعد إضافة الحزم</div>
    <ul class="vixor-list">
        <li><strong>التقييم المسبق:</strong> قبل إضافة أي حزمة، يجب البحث عن بديل مُدمج في المشروع أو في مكتبة قياسية</li>
        <li><strong>حجم الحزمة:</strong> مراجعة حجم الحزمة عبر <code>bundlephobia.com</code> — لا تقبل الحزم التي تزيد حزمة التطبيق بشكل كبير</li>
        <li><strong>الصيانة النشطة:</strong> تجنب الحزم التي لم تتلقَ تحديثًا خلال الأشهر الستة الماضية</li>
        <li><strong>الترخيص:</strong> التأكد من توافق ترخيص الحزمة مع ترخيص المشروع</li>
        <li><strong>الأمان:</strong> فحص الحزمة عبر <code>pnpm audit</code> قبل وبعد الإضافة</li>
    </ul>
</div>
<div class="subsection">
    <div class="subsection-title">قضية CCXT — نموذج خارجية الحزم</div>
    <p class="body-text">
        مكتبة <strong>CCXT</strong> (للتواصل مع بورصات العملات الرقمية) تُمثّل حالة خاصة في فيكسور. نظرًا لحجمها الكبير ومتطلباتها البيئية، تم <strong>خارجية CCXT</strong> (Externalized) بحيث تعمل على الخادم فقط ولا تُضمَّن أبدًا في حزمة العميل (Client Bundle). هذا يحقق هدفين: حماية مفاتيح API الحساسة من التسريب للعميل، وتقليل حجم الحزمة المُرسَلة للمتصفح بشكل كبير.
    </p>
    <div class="code-block">// ✅ صحيح — في ملف .server.ts فقط
import ccxt from 'ccxt'

// ❌ خطأ — CCXT لا يمكن استيراده من الملفات العادية
// سيتم حظره بواسطة حماية TanStack Start</div>
</div>
<div class="callout">
    <div class="callout-title">📌 أنواع الاعتماديات</div>
    <div class="callout-body">
        <strong>dependencies:</strong> حزم مطلوبة في بيئة الإنتاج (React, TanStack). <strong>devDependencies:</strong> حزم للتطوير فقط (ESLint, Prettier, Vitest). لا تضع أداة تطوير كاعتمادية إنتاج أبدًا.
    </div>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠️ تحديث الاعتماديات</div>
    <div class="callout-body">
        التحديثات يجب أن تكون في طلب سحب منفصل (<code>chore(deps): ...</code>). لا تخلط تحديث الاعتماديات مع تغييرات الميزات. اختبر التطبيق بالكامل بعد كل تحديث رئيسي (Major).
    </div>
</div>
"""
    },

    # ── 13 ── قائمة مراجعة المراجعة ──
    {
        "tag": "13",
        "title": "قائمة مراجعة المراجعة (Review Checklist)",
        "content": """
<p class="body-text">
القائمة الشاملة التالية تُستخدم كمرجع موحد لكل مراجعة كود في فيكسور. تضمن هذه القائمة عدم تفويت أي جانب مهم أثناء المراجعة، وتوفر إطارًا متسقًا لجميع أعضاء الفريق. يُنصح بالرجوع إليها قبل بدء المراجعة وبعدها للتأكد من الشمولية.
</p>
<div class="subsection">
    <div class="subsection-title">الأمان والحماية</div>
    <ul class="vixor-list">
        <li>لا توجد مفاتيح API أو أسرار في الكود المصدري أو في حزمة العميل</li>
        <li>صلاحيات <strong>Supabase RLS</strong> مُهيأة بشكل صحيح لجميع الجداول المتأثرة</li>
        <li>مفتاح <code>service-role</code> يُستخدم في ملفات <code>.server.ts</code> فقط</li>
        <li>CCXT ومكتبات الخادم الثقيلة لا تُستورد من جهة العميل</li>
        <li>رؤوس CSP مُهيأة ولا تمنع الموارد الشرعية</li>
        <li>لا يوجد حقن SQL أو XSS — جميع المدخلات مُحققة ومُهروبة</li>
    </ul>
</div>
<div class="subsection">
    <div class="subsection-title">النوعية والأداء</div>
    <ul class="vixor-list">
        <li>لا يوجد استخدام لـ <code>any</code> بدون تعليق مُبرّر</li>
        <li>جميع الدوال والمتغيرات لها أنواع صريحة حيثما يكون ذلك ضروريًا</li>
        <li>لا توجد استعلامات قاعدة بيانات غير ضرورية أو حلقات غير محسّنة</li>
        <li>حجم الحزم لا يتجاوز حدود التحذير (<code>chunkSizeWarningLimit: 700KB</code>)</li>
        <li>مكونات React لا تعيد التحويل (Re-render) بدون سبب — استخدام <code>useMemo</code> و<code>useCallback</code> عند الحاجة</li>
    </ul>
</div>
<div class="subsection">
    <div class="subsection-title">البنية والأنماط</div>
    <ul class="vixor-list">
        <li>الملفات الخادمية تستخدم لاحقة <code>.server.ts</code> وتُحمَّل عبر <code>useStableServerFn</code></li>
        <li>معالجة الأخطاء موجودة: <code>RouteErrorBoundary</code> على المستوى المناسب</li>
        <li>المكونات الجديدة تحتوي قصص Storybook عند الحاجة</li>
        <li>الالتزامات تتبع اتفاقية Conventional Commits</li>
        <li>لا يوجد كود مكرر (DRY) — المنطق المشترك مُستخرج إلى دوال مشتركة</li>
    </ul>
</div>
<div class="subsection">
    <div class="subsection-title">التوثيق والاختبار</div>
    <ul class="vixor-list">
        <li>الدوال العامة تحتوي تعليقات JSDoc كاملة</li>
        <li>المنطق المالي والمُعقّد مُوثَّق بشرح السياق</li>
        <li>الاختبارات تغطي المسارات الحرجة والأخطاء المتوقعة</li>
        <li>لا توجد تعليقات <code>console.log</code> في الكود المُقدَّم</li>
        <li>المسارات الجديدة تحتوي على معالجة أخطاء مناسبة</li>
    </ul>
</div>
<div class="callout callout-success">
    <div class="callout-title">✅ التأكيد النهائي</div>
    <div class="callout-body">
        قبل الموافقة، تأكد أن: <strong>البناء ينجح</strong>، <strong>ESLint نظيف</strong>، <strong>لا تعارضات</strong>، <strong>جميع التعليقات مُحلّة</strong>، <strong>لا مخاطر أمنية</strong>. إذا استوفى طلب السحب هذه الشروط، فالموافقة مبررة.
    </div>
</div>
"""
    },

]


# ────────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────────

def main():
    title = "كتاب المعايير الهندسية"
    subtitle = "الوثيقة الرسمية لمعايير وأساليب العمل الهندسية في فيكسور"
    doc_id = "DOC-07"

    html = generate_vixor_html(
        title=title,
        subtitle=subtitle,
        doc_id=doc_id,
        chapters=chapters,
    )

    html_path = save_html(html, "07-engineering.html")
    print(f"HTML saved: {html_path}")

    pdf_path = convert_to_pdf(
        html_path,
        "07-engineering.pdf",
        skill_dir="/home/z/my-project/skills/pdf",
    )
    print(f"PDF saved: {pdf_path}")


if __name__ == "__main__":
    main()
