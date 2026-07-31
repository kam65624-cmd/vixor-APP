"""
VIXOR Engineering Bible - Document 09: Security Bible (كتاب الأمن السيبراني)
Generates the official security standards and practices document in Arabic.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


# ────────────────────────────────────────────────────────────────
# CHAPTERS
# ────────────────────────────────────────────────────────────────

chapters = [

    # ── 01 ── المصادقة ──
    {
        "tag": "01",
        "title": "المصادقة (Authentication)",
        "content": """
<p class="body-text">
تتبنى فيكسور نموذج مصادقة فريدًا يعتمد على <strong>Telegram</strong> كقناة أولية للمصادقة، مع الاحتفاظ بـ <strong>البريد الإلكتروني</strong> كآلية بديلة. يعتمد هذا النهج على حقيقة أن مستخدمي فيكسور يصلون للتطبيق عبر <strong>Telegram WebApp</strong>، مما يمنحنا مصادقة موثوقة مسبقًا عبر SDK الخاص بـ Telegram. عند فتح التطبيق، يتم استلام بيانات <code>initData</code> المشفرة من Telegram والتي تحتوي على معرّف المستخدم واسمه وبيانات التوثيق. تُمرَّر هذه البيانات إلى دالة <code>telegramSignIn</code> الموجودة في <code>domains/user/auth.functions.ts</code> للتحقق من التوقيع الرقمي عبر <code>TELEGRAM_BOT_TOKEN</code> وإنشاء المستخدم إذا كان جديدًا.
</p>
<div class="callout callout-success">
    <div class="callout-title">✦ ميزة Telegram-First</div>
    <div class="callout-body">
        لا يحتاج المستخدم إلى تسجيل حساب منفصل أو تذكر كلمة مرور. المصادقة تتم تلقائيًا عبر حساب Telegram الموجود بالفعل، مما يقلل احتكاك التسجيل إلى صفر ويضمن هوية موثقة عبر البنية الأمنية لـ Telegram.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">تدفق المصادقة الكامل</div>
</div>
<p class="body-text">
يبدأ التدفق عند فتح <strong>Login Widget</strong> في واجهة المستخدم، والذي يستدعي <code>telegramSignIn</code> ويمرر تجزئة <code>hash</code> المستلمة من Telegram. تقوم الدالة بالتحقق من صحة التجزئة باستخدام خوارزمية HMAC-SHA256 مع <code>TELEGRAM_BOT_TOKEN</code> كملف سري. بعد التحقق الناجح، يتم إنشاء أو تحديث سجل المستخدم في Supabase وإصدار <strong>JWT token</strong> عبر Supabase Auth. في مسارات التطبيق المحمية، يتحقق <code>routes/_authenticated/route.tsx</code> — المُعد بـ <code>ssr: false</code> — من صلاحية الـ JWT عبر خطاف <code>beforeLoad</code> قبل عرض أي محتوى.
</p>
<ul class="vixor-list">
    <li><strong>WebApp Auto-Signin:</strong> المصادقة التلقائية عند فتح التطبيق من Telegram عبر <code>initData</code></li>
    <li><strong>Login Widget:</strong> واجهة تسجيل الدخول اليدوية للاستخدام خارج Telegram</li>
    <li><strong>Email Fallback:</strong> تسجيل الدخول بالبريد الإلكتروني وكلمة المرور كآلية احتياطية</li>
    <li><strong>telegramSignIn:</strong> الدالة المركزية للتحقق من تجزئة Telegram وإنشاء المستخدم</li>
</ul>
"""
    },

    # ── 02 ── التفويض ──
    {
        "tag": "02",
        "title": "التفويض (Authorization)",
        "content": """
<p class="body-text">
بعد نجاح المصادقة، ينتقل النظام إلى مرحلة <strong>التفويض</strong> التي تحدد ما يسمح للمستخدم بالوصول إليه. يعتمد فيكسور على طبقات متعددة للتفويض تبدأ من <strong>Row Level Security (RLS)</strong> في Supabase وصولًا إلى حراس المصادقة (Auth Guards) المُطبَّقين على كل نقطة نهاية API. تضمن سياسات RLS أن المستخدم لا يستطيع الوصول إلا إلى بياناته الخاصة، بينما تتحقق حراس المصادقة من صلاحيات المستخدم عند كل طلب.
</p>
<div class="subsection">
    <div class="subsection-title">Row Level Security (RLS)</div>
</div>
<p class="body-text">
تُفعَّل سياسات RLS على جميع الجداول الحساسة في قاعدة البيانات. تعمل هذه السياسات كجدران حماية على مستوى الصف (Row-level)، حيث يتم فحص كل استعلام ضد قواعد التفويض المحددة في Supabase. يستخدم الوسيط <code>auth-middleware.ts</code> الموجود في <code>shared/supabase/</code> دالتين مختلفتين لإنشاء عملاء Supabase: عميل <strong>Validation</strong> للتحقق من هوية المستخدم، وعميل <strong>RLS</strong> لتنفيذ الاستعلامات ضمن سياق أمان المستخدم. دالة <code>requireSupabaseAuth</code> تستخرج رمز Bearer من رأس الطلب وتُمرره لإنشاء هذين العميلين.
</p>
<div class="callout">
    <div class="callout-title">✦ حراس المصادقة على مستوى API</div>
    <div class="callout-body">
        كل نقطة نهاية Nitro (14 نقطة) مُزوَّدة بحارس مصادقة يحدد مستوى الوصول المطلوب: Admin/Cron للمهام الداخلية، Bearer Auth للمستخدمين المُصدَّق عليهم، Webhook Secret لعمليات التحقق من المصدر، Health Token لفحوصات الحالة، أو Public للنقاط المفتوحة.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">الوصول الإداري</div>
</div>
<p class="body-text">
يتمتع المديرون بصلاحيات واسعة تشمل الوصول إلى جميع سجلات المستخدمين وإدارة تكوين النظام ومراجعة سجلات التدقيق. يتطلب الوصول الإداري وجود <code>ADMIN_KEY</code> في رأس الطلب، وهو مفتاح سري مشفر يُخزَّن حصريًا في متغيرات بيئة الخادم. يتم التحقق من هذا المفتاح في طبقة الأمان <code>_security.ts</code> قبل السماح بتنفيذ أي عملية إدارية.
</p>
<table class="vixor-table">
    <thead>
        <tr>
            <th>مستوى الوصول</th>
            <th>آلية التحقق</th>
            <th>نطاق الصلاحيات</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>Admin/Cron</code></td>
            <td>ADMIN_KEY أو CRON_SECRET</td>
            <td>وصول كامل إلى جميع البيانات والعمليات</td>
        </tr>
        <tr>
            <td><code>Bearer Auth</code></td>
            <td>JWT صالح من Supabase</td>
            <td>بيانات المستخدم الخاص فقط</td>
        </tr>
        <tr>
            <td><code>Webhook</code></td>
            <td>TELEGRAM_WEBHOOK_SECRET</td>
            <td>معالجة أحداث Telegram الواردة</td>
        </tr>
        <tr>
            <td><code>Health</code></td>
            <td>Health token مُشترَك</td>
            <td>فحص حالة النظام فقط</td>
        </tr>
        <tr>
            <td><code>Public</code></td>
            <td>بدون تحقق</td>
            <td>بيانات عامة محدودة</td>
        </tr>
    </tbody>
</table>
"""
    },

    # ── 03 ── إدارة الجلسات ──
    {
        "tag": "03",
        "title": "إدارة الجلسات (Session Management)",
        "content": """
<p class="body-text">
تتبنى فيكسور نموذجًا عديم الحالة (Stateless) لإدارة الجلسات يعتمد بالكامل على <strong>JWT (JSON Web Tokens)</strong> الصادرة عن Supabase Auth. لا يوجد تخزين مركزي للجلسات على الخادم، بل يتم ترميز جميع معلومات الجلسة داخل الرمز المميز نفسه. هذا النهج يُبسِّط البنية التحتية ويتوافق مع طبيعة التطبيق كـ WebApp داخل Telegram حيث تكون الجلسات قصيرة ومتكررة.
</p>
<div class="subsection">
    <div class="subsection-title">دورة حياة الجلسة</div>
</div>
<p class="body-text">
تبدأ الجلسة عند نجاح المصادقة وتلقي العميل رمز <code>access_token</code> و<code>refresh_token</code>. يُخزَّن رمز الوصول في <strong>HttpOnly Cookie</strong> آمن ويُرسل مع كل طلب API عبر رأس <code>Authorization: Bearer</code>. عند انتهاء صلاحية رمز الوصول (عادةً بعد ساعة واحدة)، يستخدم العميل رمز التحديث للحصول على رمز وصول جديد تلقائيًا دون تدخل المستخدم. تتم إدارة هذه العملية عبر آلية التحديث المدمجة في <code>supabase-js</code> التي تعمل بشفافية في الخلفية.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">رمز الوصول (Access Token)</div>
        <div class="info-card-body">
            رمز JWT قصير العمر (ساعة واحدة) يُستخدم للمصادقة على كل طلب. يحتوي على معرّف المستخدم والصلاحيات ووقت الانتهاء. لا يُخزَّن أبدًا في LocalStorage.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">رمز التحديث (Refresh Token)</div>
        <div class="info-card-body">
            رمز طويل العمر يُستخدم فقط لاستبدال رمز الوصول المنتهي. يُخزَّن بشكل آمن ويُتبادل مع رمز وصول جديد فقط عبر نقطة نهاية مُحمية.
        </div>
    </div>
</div>
<div class="callout callout-warn">
    <div class="callout-title">⚠ سياسة الأمان للجلسات</div>
    <div class="callout-body">
        يُمنع تمامًا تخزين الرموز المميزة في <code>localStorage</code> أو <code>sessionStorage</code>. جميع الرموز تُخزَّن حصريًا في HttpOnly Cookies محمية بـ <code>Secure</code> و<code>SameSite=Strict</code> لتقليل مخاطر سرقة الجلسات عبر هجمات XSS و CSRF.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">مخزن Supabase الآمن</div>
</div>
<p class="body-text">
يتم الوصول إلى عميل Supabase من جانب المتصفح عبر دالة <code>getSupabaseOrNull</code> أو <code>getSupabaseOrThrow</code> التي تُنفِّذ نمط <strong>Lazy Initialization</strong> (التهيئة الكسولة). يضمن هذا النمط إنشاء عميل Supabase لمرة واحدة فقط (Singleton) وإعادة استخدامه في جميع أنحاء التطبيق. هذا يمنع تسرب الاتصالات ويضمن اتساق حالة المصادقة عبر جميع المكونات.
</p>
"""
    },

    # ── 04 ── رموز الويب JSON ──
    {
        "tag": "04",
        "title": "رموز الويب JSON (JWT)",
        "content": """
<p class="body-text">
<code>JSON Web Token</code> هو المعيار الأساسي لمصادقة الطلبات في فيكسور. يتكون كل رمز JWT من ثلاثة أجزاء مفصولة بنقاط: <strong>Header</strong> يحتوي على نوع الرمز وخوارزمية التوقيع، و<strong>Payload</strong> يحتوي على المطالبات (Claims) مثل معرّف المستخدم والصلاحيات ووقت الإصدار والانتهاء، و<strong>Signature</strong> وهو التوقيع الرقمي الذي يضمن سلامة الرمز. تُصدر جميع رموز JWT عبر <strong>Supabase Auth</strong> باستخدام مفتاح HMAC السري الخاص بقاعدة البيانات.
</p>
<div class="subsection">
    <div class="subsection-title">بنية الرمز المميز</div>
</div>
<div class="code-block">Header:    { "alg": "HS256", "typ": "JWT" }
Payload:   { "sub": "uuid", "role": "authenticated",
            "iat": 1700000000, "exp": 1700003600,
            "app_metadata": { "provider": "telegram" } }
Signature: HMAC-SHA256(base64(header) + "." + base64(payload), SECRET)</div>
<p class="body-text">
عند استلام طلب API، يستخرج وسيط <code>requireSupabaseAuth</code> رمز Bearer من رأس الطلب ويُمرره إلى Supabase للتحقق. تقوم Supabase بالتحقق من التوقيع الرقمي وفحص تاريخ الانتهاء وتأكيد أن المستخدم لا يزال نشطًا. في حالة نجاح التحقق، يُنشأ عميل Supabase مُهيأ بسياق أمان المستخدم (RLS Context) لتنفيذ الاستعلامات اللاحقة ضمن حدود صلاحياته.
</p>
<div class="callout">
    <div class="callout-title">✦ عملية التحقق من الرمز</div>
    <div class="callout-body">
        1. استخراج الرمز من رأس <code>Authorization: Bearer &lt;token&gt;</code><br>
        2. التحقق من صحة التوقيع باستخدام <code>SUPABASE_ANON_KEY</code><br>
        3. فحص تاريخ الانتهاء (<code>exp</code>) والمطالبة الخاصة بالمنشأ (<code>iss</code>)<br>
        4. إنشاء عميل Supabase مع سياق RLS الخاص بالمستخدم
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">انتهاء الصلاحية والتحديث</div>
</div>
<p class="body-text">
يُحدَّد عمر رمز الوصول بـ <strong>3600 ثانية</strong> (ساعة واحدة) كتوازن بين الأمان وأداء المستخدم. عند انتهاء الصلاحية، يُرسل العميل رمز التحديث إلى نقطة نهاية <code>/auth/token</code> في Supabase للحصول على رمز وصول جديد. تتم هذه العملية تلقائيًا وبشكل شفاف دون الحاجة لإعادة تحميل الصفحة. في حالة انتهاء صلاحية رمز التحديث أيضًا (بعد 30 يومًا افتراضيًا)، يُطلب من المستخدم إعادة المصادقة.
</p>
"""
    },

    # ── 05 ── الأسرار ──
    {
        "tag": "05",
        "title": "الأسرار (Secrets)",
        "content": """
<p class="body-text">
تُعد إدارة الأسرار من أعمدة الأمان الأساسية في فيكسور. يُعرَّف السر بأنه أي قطعة بيانات حساسة لا يجب أن تُكشف أبدًا — تشمل مفاتيح API، رموز الوصول، كلمات المرور، وبيانات الاعتماد المشفرة. تتبنى فيكسور مبدأ <strong>أقل الامتيازات (Principle of Least Privilege)</strong> حيث يحصل كل مكون على الأسرار الضرورية فقط لعمله، ولا شيء أكثر.
</p>
<div class="subsection">
    <div class="subsection-title">تصنيف الأسرار</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>السر</th>
            <th>الاستخدام</th>
            <th>السياق</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>SUPABASE_URL</code></td>
            <td>عنوان نقطة نهاية Supabase</td>
            <td>الخادم والعميل</td>
        </tr>
        <tr>
            <td><code>SUPABASE_ANON_KEY</code></td>
            <td>مفتاح Supabase العام مع RLS</td>
            <td>الخادم والعميل</td>
        </tr>
        <tr>
            <td><code>SUPABASE_SERVICE_ROLE_KEY</code></td>
            <td>مفتاح Supabase الإداري (يتجاوز RLS)</td>
            <td>الخادم فقط</td>
        </tr>
        <tr>
            <td><code>TELEGRAM_BOT_TOKEN</code></td>
            <td>مصادقة وتحقق بيانات Telegram</td>
            <td>الخادم فقط</td>
        </tr>
        <tr>
            <td><code>TELEGRAM_WEBHOOK_SECRET</code></td>
            <td>التحقق من مصدر Webhooks</td>
            <td>الخادم فقط</td>
        </tr>
        <tr>
            <td><code>CRON_SECRET</code></td>
            <td>مصادقة مهام Vercel Cron</td>
            <td>الخادم فقط</td>
        </tr>
        <tr>
            <td><code>ADMIN_KEY</code></td>
            <td>الوصول الإداري الكامل</td>
            <td>الخادم فقط</td>
        </tr>
        <tr>
            <td><code>REDIS_URL</code></td>
            <td>اتصال Redis للتخزين المؤقت</td>
            <td>الخادم فقط</td>
        </tr>
    </tbody>
</table>
<div class="callout callout-warn">
    <div class="callout-title">⚠ قاعدة ذهبية: لا تُرسل الأسرار للعميل أبدًا</div>
    <div class="callout-body">
        أي سري لا يحمل بادئة <code>VITE_</code> لا يمكن الوصول إليه من جانب العميل. يفرض Vite هذا التقييد بشكل مدمج. السرّ الوحيد المسموح للعميل هو <code>VITE_*</code> المتفق عليه والمُراجَع أمنيًا. جميع المفاتيح الحساسة مثل <code>SUPABASE_SERVICE_ROLE_KEY</code> و<code>TELEGRAM_BOT_TOKEN</code> و<code>ADMIN_KEY</code> تبقى حصريًا على الخادم.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">مفاتيح مزودي LLM</div>
</div>
<p class="body-text">
تحتوي فيكسور على مفاتيح API لمزودي نماذج اللغة الكبيرة (LLM) المختلفين. تُخزَّن هذه المفاتيح في متغيرات بيئة الخادم ولا يمكن الوصول إليها من العميل أبدًا. يتم تمريرها حصريًا عبر نقاط نهاية API المحمية التي تتحقق من هوية المستخدم قبل إعادة توجيه الطلبات إلى مزودي LLM. هذا يمنع استغلال مفاتيح API باهظة التكلفة من قبل جهات غير مصرح لها.
</p>
"""
    },

    # ── 06 ── متغيرات البيئة ──
    {
        "tag": "06",
        "title": "متغيرات البيئة (Environment Variables)",
        "content": """
<p class="body-text">
تعتمد فيكسور على نظام صارم لتصنيف متغيرات البيئة يضمن فصلًا واضحًا بين ما يمكن للعميل الوصول إليه وما يبقى حصريًا على الخادم. يتكامل هذا النظام مع آلية Vite المدمجة حيث يتم حقن المتغيرات التي تحمل بادئة <code>VITE_</code> في حزمة العميل (Client Bundle) أثناء مرحلة البناء، بينما تظل جميع المتغيرات الأخرى محجوبة تمامًا عن جانب المتصفح.
</p>
<div class="subsection">
    <div class="subsection-title">قاعدة البادئة VITE_</div>
</div>
<p class="body-text">
تُعد بادئة <code>VITE_</code> البوابة الوحيدة لنقل البيانات من بيئة الخادم إلى العميل. عند بناء التطبيق، يستبدل Vite تلقائيًا جميع مراجع <code>import.meta.env.VITE_*</code> بقيمها الفعلية وقت البناء. هذا يعني أن أي متغير لا يحمل هذه البادئة سيكون <code>undefined</code> على جانب العميل حتى لو كان موجودًا في بيئة الخادم. يوفر هذا حماية مدمجة وقوية دون الحاجة لأي تكوين إضافي.
</p>
<div class="callout callout-success">
    <div class="callout-title">✦ سياق الخادم مقابل العميل</div>
    <div class="callout-body">
        على الخادم: الوصول عبر <code>process.env.SECRET_KEY</code> (كامل الوصول).<br>
        على العميل: الوصول عبر <code>import.meta.env.VITE_PUBLIC_KEY</code> (مقيّد بالبادئة فقط).<br>
        الوسم <code>.server.ts</code>: يمنع بشكل صارم تضمين كود الخادم في حزمة المتصفح.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">فرض تنفيذ الخادم فقط</div>
</div>
<p class="body-text">
يستخدم فيكسور اصطلاح تسمية <code>.server.ts</code> كلاحقة لجميع الملفات التي تحتوي على كود يجب أن يُنفَّذ حصريًا على الخادم. يتعرف Nitro (محرك الخادم) على هذه اللاحقة ويمنع تضمين هذه الملفات في حزمة العميل أثناء البناء. هذا يضمن أن الأسرار والمنطق الحساس لا يمكن تسريبه إلى المتصفح عن طريق الخطأ، حتى إذا تم استيراد الملف بشكل غير مباشر من مكون عميل.
</p>
<ul class="vixor-list">
    <li><strong>VITE_ البادئة:</strong> العلامة الوحيدة المسموح بها لكشف متغير للعميل</li>
    <li><strong>process.env:</strong> متاح حصريًا في سياق الخادم (Nitro endpoints, .server.ts)</li>
    <li><strong>.server.ts:</strong> ضمان بنائي (Build-time) لعدم تسرب كود الخادم</li>
    <li><strong>client.server.ts:</strong> عميل Supabase الإداري يقتصر استخدامه على الخادم فقط</li>
</ul>
"""
    },

    # ── 07 ── أمان واجهات البرمجة ──
    {
        "tag": "07",
        "title": "أمان واجهات البرمجة (API Security)",
        "content": """
<p class="body-text">
تمتلك فيكسور <strong>14 نقطة نهاية Nitro</strong> محمية بطبقة أمان مركزية مُعرَّفة في <code>_security.ts</code>. هذه الطبقة تعمل كجدار حماية موحد يتحقق من هوية المصدر وصلاحياته قبل السماح بتنفيذ أي منطق تجاري. تم تصميم هذه البنية وفقًا لمبدأ <strong>Defense in Depth</strong> (الدفاع المتعدد الطبقات) حيث يوجد أكثر من حاجز أمني بين المهاجم والبيانات الحساسة.
</p>
<div class="subsection">
    <div class="subsection-title">طبقة الأمان المركزية (_security.ts)</div>
</div>
<p class="body-text">
ملف <code>_security.ts</code> يُعرِّف أربعة مكونات رئيسية: <strong>CORS</strong> يقيّد origins المسموح بها إلى <code>vixor.app</code> و<code>*.vercel.app</code> فقط، <strong>Rate Limiting</strong> عبر دالة <code>withRateLimit()</code> التي تُغلِّف نقاط النهاية بمحددات معدل الطلبات، <strong>Authentication</strong> يدعم خمس استراتيجيات مصادقة مختلفة (Bearer JWT, Admin Key, Vercel Cron, Cron Secret, Webhook Secret)، و<strong>Error Normalization</strong> الذي يُحوِّل الأخطاء غير المعالجة إلى استجابات موحدة وآمنة.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">CORS Policy</div>
        <div class="info-card-body">
            تقييد صارم لمصادر الطلبات. يُسمح فقط بـ <code>vixor.app</code> و <code>*.vercel.app</code>. أي طلب من مصدر خارجي يُرفض فورًا برمز 403. يمنع هذا هجمات Cross-Origin المحتملة.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Auth Strategies</div>
        <div class="info-card-body">
            خمس استراتيجيات: Bearer JWT للمستخدمين، ADMIN_KEY للمديرين، CRON_SECRET للمهام المجدولة، Webhook Secret لـ Telegram، و Health Token لفحوصات الحالة. كل استراتيجية لها منطق تحقق خاص.
        </div>
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">توزيع حراس المصادقة على النقاط</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>نوع الحارس</th>
            <th>العدد</th>
            <th>أمثلة على الاستخدام</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Admin/Cron</td>
            <td>متعدد</td>
            <td>إدارة المستخدمين، مهام التنظيف، التقارير الداخلية</td>
        </tr>
        <tr>
            <td>Bearer Auth</td>
            <td>الأغلبية</td>
            <td>جميع عمليات المستخدم: التداول، المحفظة، الإعدادات</td>
        </tr>
        <tr>
            <td>Webhook Secret</td>
            <td>محدود</td>
            <td>استقبال أحداث Telegram وعمليات الدفع عبر Stars</td>
        </tr>
        <tr>
            <td>Health Token</td>
            <td>واحد</td>
            <td>نقطة فحص الحالة الصحية للنظام</td>
        </tr>
        <tr>
            <td>Public</td>
            <td>محدود</td>
            <td>بيانات السوق العامة، معلومات الأسعار</td>
        </tr>
    </tbody>
</table>
"""
    },

    # ── 08 ── تقييد المعدل ──
    {
        "tag": "08",
        "title": "تقييد المعدل (Rate Limiting)",
        "content": """
<p class="body-text">
تُعد الحماية من إساءة الاستخدام (Abuse Prevention) ركنًا أساسيًا في بنية فيكسور الأمنية. توفر المنظومة ثلاث آليات مختلفة لتقييد معدل الطلبات (Rate Limiting) تُستخدم حسب السياق والاحتياج: <strong>SlidingWindowLimiter</strong> للتحكم المحلي، <strong>RedisRateLimiter</strong> للتوزيع عبر مثيلات متعددة، و<strong>withRateLimit()</strong> كغلاف مريح يُطبَّق على نقاط النهاية. تمنع هذه الآليات هجمات <strong>Brute Force</strong> و<strong>DDoS</strong> و<strong>API Abuse</strong>.
</p>
<div class="subsection">
    <div class="subsection-title">محدد النافذة المنزلقة (SlidingWindowLimiter)</div>
</div>
<p class="body-text">
يُنفِّذ <strong>SlidingWindowLimiter</strong> خوارزمية النافذة المنزلقة محليًا في ذاكرة العملية. يتتبع عدد الطلبات خلال إطار زمني متحرك (مثلاً 100 طلب في 60 ثانية). عند تجاوز الحد المسموح، يُرفض الطلب برمز <code>429 Too Many Requests</code>. يُفضَّل هذا المحدد في السيناريوهات التي تتطلب استجابة فورية دون اعتماد على شبكة خارجية، مثل حماية نقاط النهاية من الاستخدام المفرط من عميل واحد.
</p>
<div class="subsection">
    <div class="subsection-title">محدد Redis الموزع (RedisRateLimiter)</div>
</div>
<p class="body-text">
للبيئات التي تتطلب مزامنة عبر عدة مثيلات خادم، يُستخدم <strong>RedisRateLimiter</strong> الذي يعتمد على <code>REDIS_URL</code> لتخزين عدادات الطلبات في ذاكرة تخزين مؤقت موزعة. يضمن هذا أن الحد الأقصى يُحترم حتى إذا تم توزيع الطلبات على خوادم مختلفة. يتم استخدام خوارزمية <strong>Sliding Window Log</strong> في Redis لتتبع الطوابع الزمنية لكل طلب وتحديد ما إذا كان الحد قد تم تجاوزه.
</p>
<div class="callout callout-success">
    <div class="callout-title">✦ دالة withRateLimit() المريحة</div>
    <div class="callout-body">
        <code>withRateLimit(handler, options)</code> هي دالة تغليف عالية المستوى تُطبَّق على أي معالج نقطة نهاية Nitro. تقوم تلقائيًا باختيار المحدد المناسب (محلي أو Redis) بناءً على التكوين، وتُرجع استجابة 429 مع رأس <code>Retry-After</code> عند التجاوز. تبسط هذه الدالة تطبيق التقييد دون الحاجة ل boilerplate إضافي.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">قاطع الدائرة (CircuitBreaker)</div>
</div>
<p class="body-text">
إلى جانب تقييد المعدل، تُستخدم نمطية <strong>CircuitBreaker</strong> لحماية النظام من التسلسلات الفاشلة. عندما يفشل عدد معين من الطلبات المتتالية إلى خدمة خارجية (مثل مزود LLM أو Binance API)، يفتح القاطع الدائرة ويمنع إرسال طلبات إضافية لفترة محددة (Cooldown Period). بعد انتهاء هذه الفترة، يسمح القاطع بطلب تجريبي واحد — إذا نجح، يُغلق القاطع وتعود العمليات الطبيعية. هذا يمنع التأثيرات المتتالية (Cascade Failures) ويحافظ على استقرار النظام.
</p>
"""
    },

    # ── 09 ── سياسة أمان المحتوى ──
    {
        "tag": "09",
        "title": "سياسة أمان المحتوى (CSP)",
        "content": """
<p class="body-text">
تُعرَّف <strong>سياسة أمان المحتوى (Content Security Policy)</strong> في <code>vite.config.ts</code> كطبقة حماية أساسية ضد هجمات حقن المحتوى. تعمل CSP كقائمة بيضاء (Whitelist) تُحدد بدقة المصادر المسموح لها بتحميل الموارد في تطبيق فيكسور. أي محتوى من مصدر غير مُدرَج في القائمة البيضاء يُحظَر تلقائيًا بواسطة المتصفح، مما يمنع تنفيذ البرمجيات الخبيثة حتى في حالة وجود ثغرة XSS.
</p>
<div class="subsection">
    <div class="subsection-title">القائمة البيضاء المعتمدة</div>
</div>
<table class="vixor-table">
    <thead>
        <tr>
            <th>المجال المسموح</th>
            <th>الغرض</th>
            <th>الأنواع المسموحة</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>tradingview.com</code></td>
            <td>رسوم بيانية مدمجة</td>
            <td>frames, scripts, styles</td>
        </tr>
        <tr>
            <td><code>telegram.org</code></td>
            <td>WebApp SDK</td>
            <td>frames, scripts</td>
        </tr>
        <tr>
            <td><code>supabase.co</code></td>
            <td>مصادقة وبيانات</td>
            <td>connect, frames</td>
        </tr>
        <tr>
            <td><code>binance.com</code></td>
            <td>بيانات التداول</td>
            <td>connect, images</td>
        </tr>
        <tr>
            <td><code>dexscreener.com</code></td>
            <td>بيانات DEX</td>
            <td>connect, images</td>
        </tr>
        <tr>
            <td><code>birdeye.so</code></td>
            <td>تحليلات On-chain</td>
            <td>connect</td>
        </tr>
        <tr>
            <td><code>helius.xyz</code></td>
            <td>Solana RPC</td>
            <td>connect</td>
        </tr>
        <tr>
            <td><code>twitter.com</code></td>
            <td>تكامل وسائل التواصل</td>
            <td>frames, images</td>
        </tr>
        <tr>
            <td><code>lunarcrush.com</code></td>
            <td>بيانات المشاعر</td>
            <td>connect</td>
        </tr>
        <tr>
            <td><code>coingecko.com</code></td>
            <td>أسعار العملات</td>
            <td>connect, images</td>
        </tr>
    </tbody>
</table>
<div class="callout callout-warn">
    <div class="callout-title">⚠ توجيه frame-ancestors لـ Telegram</div>
    <div class="callout-body">
        تُعد توجيهات <code>frame-ancestors</code> ضرورية لتشغيل فيكسور كـ WebApp داخل Telegram. بدونها سيمنع المتصفح تحميل التطبيق داخل إطار Telegram. يتم تحديد <code>telegram.org</code> كمصدر أبو (parent origin) مسموح لضمان التشغيل الصحيح داخل بيئة Telegram WebApp.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">توجيهات CSP الأساسية</div>
</div>
<ul class="vixor-list">
    <li><strong>default-src 'self':</strong> السماح بالموارد من نفس المصدر فقط افتراضيًا</li>
    <li><strong>script-src:</strong> السماح بـ inline scripts محددة وscripts من المصادر الموثوقة</li>
    <li><strong>connect-src:</strong> تحديد نقاط النهاية المسموح باتصال fetch/WebSocket إليها</li>
    <li><strong>frame-src:</strong> التحكم في الإطارات المضمنة (TradingView, Telegram WebApp)</li>
    <li><strong>img-src:</strong> السماح بالصور من المصادر المعتمدة مع دعم data: URIs</li>
    <li><strong>style-src:</strong> السماح بأنماط inline وexternal من المصادر الموثوقة</li>
</ul>
"""
    },

    # ── 10 ── البرمجة عبر المواقع ──
    {
        "tag": "10",
        "title": "البرمجة عبر المواقع (XSS)",
        "content": """
<p class="body-text">
<code>Cross-Site Scripting (XSS)</code> هو أحد أخطر التهديدات الأمنية لتطبيقات الويب، حيث يقوم المهاجم بحقن برمجية خبيثة في صفحات يراها مستخدمون آخرون. تتبنى فيكسور استراتيجية <strong>Defense in Depth</strong> متعددة الطبقات للوقاية من XSS، تبدأ من إطار React نفسه وصولًا إلى سياسات CSP الصارمة. تضمن هذه الاستراتيجية أنه حتى في حالة وجود ثغرة في طبقة واحدة، تمنع الطبقات الأخرى استغلالها.
</p>
<div class="subsection">
    <div class="subsection-title">الحماية المدمجة في React</div>
</div>
<p class="body-text">
يوفر إطار <strong>React</strong> تلقائيًا حماية قوية ضد XSS عبر آلية <strong>Auto-Escaping</strong>. عند استخدام JSX لعرض المحتوى، يُهرب تلقائيًا (escape) جميع الأحرف الخاصة مثل <code>&lt;</code> و<code>&gt;</code> و<code>&quot;</code> و<code>&amp;</code> قبل إدراجها في DOM. هذا يعني أن <code>&lt;script&gt;alert('xss')&lt;/script&gt;</code> سيُعرض كنص عادي بدلاً من تنفيذه ككود. تنطبق هذه الحماية افتراضيًا على جميع مكونات React في فيكسور.
</p>
<div class="callout callout-danger">
    <div class="callout-title">✖ نقاط الضعف المحتملة</div>
    <div class="callout-body">
        الاستخدام المباشر لـ <code>dangerouslySetInnerHTML</code> أو <code>document.write()</code> أو <code>innerHTML</code> يُلغي حماية Auto-Escaping. يُمنع استخدام هذه الوظائف إلا بعد مراجعة أمنية صارمة وتطبيق <code>DOMPurify</code> على المحتوى المدخل. أي استخدام يجب أن يكون مُعلَّقًا بتعليق أمني يوضح السبب.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">طبقات الحماية الإضافية</div>
</div>
<ol class="vixor-ol">
    <li><strong>CSP Headers:</strong> تمنع تنفيذ أي script من مصدر غير مصرح به، حتى لو تم حقنه بنجاح في DOM</li>
    <li><strong>HttpOnly Cookies:</strong> تمنع JavaScript من الوصول إلى رموز الجلسات، مما يُبطل هجمات XSS السرقة</li>
    <li><strong>Input Validation:</strong> التحقق من صحة جميع المدخلات على الخادم قبل المعالجة أو التخزين</li>
    <li><strong>Output Encoding:</strong> ترميز مخصص للمحتوى المعروض في سياقات مختلفة (HTML, URL, CSS, JS)</li>
    <li><strong>Content Sanitization:</strong> عند الحاجة لعرض HTML (مثل وصف التوكن)، يُنظَّف عبر مكتبة معتمدة</li>
</ol>
<div class="subsection">
    <div class="subsection-title">التعامل مع المحتوى الخارجي</div>
</div>
<p class="body-text">
قد يحتاج التطبيق لعرض محتوى من مصادر خارجية مثل أوصاف العملات الرقمية من CoinGecko أو تغريدات من Twitter. في هذه الحالات، يُطبَّق بروتوكول تنظيف صارم يتضمن: إزالة جميع العناصر <code>&lt;script&gt;</code> و<code>&lt;iframe&gt;</code> و<code>&lt;object&gt;</code>، إزالة معالجات الأحداث مثل <code>onclick</code> و<code>onerror</code>، تقييد السمات المسموح بها إلى قائمة بيضاء صارمة، واستخدام <code>rel="noopener noreferrer"code> لجميع الروابط الخارجية.
</p>
"""
    },

    # ── 11 ── تزوير الطلبات ──
    {
        "tag": "11",
        "title": "تزوير الطلبات (CSRF)",
        "content": """
<p class="body-text">
<code>Cross-Site Request Forgery (CSRF)</code> هو هجوم يُجبر المتصفح على إرسال طلبات غير مصرح بها إلى تطبيق موثوق أثناء تصفح المستخدم لموقع ضار. تستفيد هذه الهجمات من حقيقة أن المتصفح يُرسل تلقائيًا ملفات تعريف الارتباط (Cookies) مع كل طلب إلى النطاق المستهدف. تتبنى فيكسور استراتيجية شاملة للوقاية من CSRF تعتمد على آليات متعددة مترابطة.
</p>
<div class="subsection">
    <div class="subsection-title">SameSite Cookies كخط دفاع أول</div>
</div>
<p class="body-text">
تُعد سمة <code>SameSite=Strict</code> على ملفات تعريف الارتباط أقوى حماية ضد CSRF. عند تفعيل هذه السمة، يُرسل المتصفح ملفات تعريف الارتباط فقط مع الطلبات التي تنشأ من نفس النطاق (First-Party Requests). أي طلب يأتي من موقع خارجي (Cross-Site) لن يحتوي على ملفات تعريف الارتباط، مما يُبطل هجوم CSRF تلقائيًا. تستخدم فيكسور هذا الإعداد على جميع ملفات تعريف الارتباط الحساسة بما فيها رموز المصادقة.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">SameSite=Strict</div>
        <div class="info-card-body">
            أقوى مستوى حماية. يمنع إرسال Cookies مع أي طلب cross-site، بما في ذلك الروابط العادية. يضمن أن الطلبات المُصدَّق عليها تأتي فقط من داخل التطبيق.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Bearer Token Authentication</div>
        <div class="info-card-body">
            بدلاً من الاعتماد فقط على Cookies، تستخدم فيكسور رأس <code>Authorization: Bearer</code> للمصادقة على API. لا يمكن للمتصفح إرسال هذا الرأس تلقائيًا في طلبات cross-site، مما يُبطل هجمات CSRF.
        </div>
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">CORS كطبقة حماية إضافية</div>
</div>
<p class="body-text">
تعمل سياسة <strong>CORS</strong> كحاجز إضافي ضد CSRF من خلال التحقق من رأس <code>Origin</code> في كل طلب. تُقبل الطلبات فقط من <code>vixor.app</code> و<code>*.vercel.app</code>، بينما يُرفض أي طلب من مصدر آخر. حتى لو تمكن المهاجم من تشغيل طلب من موقع ضار، فلن يتمكن من قراءة الاستجابة بسبب قيود CORS. تُعرَّف هذه السياسة في <code>_security.ts</code> وتُطبَّق على جميع نقاط النهاية.
</p>
<div class="callout callout-success">
    <div class="callout-title">✦ نموذج Telegram WebApp المقاوم لـ CSRF</div>
    <div class="callout-body">
        بما أن فيكسور يعمل كـ Telegram WebApp، فإن جميع التفاعلات تتم داخل بيئة Telegram المُتحكَّم بها. لا يمكن لموقع خارجي محاكاة بيئة WebApp أو إرسال طلبات حاملة لـ initData صالح. يوفر هذا طبقة حماية طبيعية إضافية تتجاوز الآليات التقنية التقليدية.
    </div>
</div>
"""
    },

    # ── 12 ── حقن SQL ──
    {
        "tag": "12",
        "title": "حقن SQL (SQL Injection)",
        "content": """
<p class="body-text">
<code>SQL Injection</code> هو هجوم يحاول المهاجم من خلاله حقن أكواد SQL خبيثة في استعلامات قاعدة البيانات للوصول إلى بيانات غير مصرح بها أو تعديلها أو حذفها. تُعد فيكسور محصَّنة بشكل أساسي ضد هذا النوع من الهجمات بفضل استخدام <strong>Supabase Client</strong> الذي يُنفِّذ <strong>Parameterized Queries</strong> بشكل افتراضي، بالإضافة إلى سياسات <strong>Row Level Security</strong> التي تُقيِّد الوصول على مستوى قاعدة البيانات نفسها.
</p>
<div class="subsection">
    <div class="subsection-title">الاستعلامات المُعَلْمَة (Parameterized Queries)</div>
</div>
<p class="body-text">
يستخدم <strong>supabase-js</strong> الاستعلامات المُعلَمة حصريًا لجميع عمليات قاعدة البيانات. في هذا النمط، تُفصَل معلمات الاستعلام عن هيكل الاستعلام نفسه، مما يمنع المحرك من تفسير أي مدخل كأمر SQL. على سبيل المثال، عند استخدام <code>.eq('id', userInput)</code>، تُعامَل قيمة <code>userInput</code> كقيمة بيانات فقط وليس كجزء من هيكل SQL. هذا يُلغي تمامًا إمكانية حقن SQL عبر المدخلات.
</p>
<div class="code-block">// آمن — supabase-js يُستخدم parameterized queries داخليًا
const { data } = await supabase
  .from('agents')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// محظور تمامًا — لا يوجد raw SQL في كود فيكسور
// const result = await db.raw(`SELECT * FROM agents WHERE id = ${userInput}`)</div>
<div class="subsection">
    <div class="subsection-title">Row Level Security كحاجز أخير</div>
</div>
<p class="body-text">
حتى في السيناريو النظري الذي يتمكن فيه المهاجم من حقن SQL، توفر سياسات <strong>RLS</strong> طبقة حماية إضافية على مستوى قاعدة البيانات. تتحقق RLS من هوية المستخدم الحالي (عبر <code>auth.uid()</code> في Supabase) وتقيّد النتائج بناءً على ملكيته. هذا يعني أنه حتى استعلام SQL محقون يمكنه فقط الوصول إلى بيانات المستخدم المُصدَّق عليه، وليس بيانات المستخدمين الآخرين. تُفعَّل RLS على جميع الجداول الحساسة في قاعدة البيانات.
</p>
<div class="callout callout-warn">
    <div class="callout-title">⚠ قاعدة صارمة: لا يُسمح بـ Raw SQL</div>
    <div class="callout-body">
        يُمنع تمامًا استخدام استعلامات SQL الخام (Raw SQL) في كود فيكسور. جميع العمليات يجب أن تتم عبر <code>supabase-js</code> Client فقط. هذا يضمن أن جميع الاستعلامات مُعلَمة ومحمية. أي استثناء يتطلب مراجعة أمنية رسمية وموافقة من فريق الأمان.
    </div>
</div>
"""
    },

    # ── 13 ── سجلات التدقيق ──
    {
        "tag": "13",
        "title": "سجلات التدقيق (Audit Logs)",
        "content": """
<p class="body-text">
تتبنى فيكسور نظامًا شاملاً لسجلات التدقيق (Audit Logging) يُسجِّل جميع الأنشطة المهمة في النظام لغرض المراجعة الأمنية والتحقيق في الحوادث ومراقبة الامتثال. يعتمد هذا النظام على طبقتين: <strong>سجلات التدقيق المُهيكَلة</strong> المخزنة في قاعدة البيانات عبر جداول <code>agent_audit_log</code> و<code>domain_events</code>، و<strong>المراقبة الخارجية</strong> عبر <strong>Sentry</strong> لالتقاط الأخطاء في الوقت الحقيقي و<strong>Mixpanel</strong> لتحليل سلوك المستخدمين.
</p>
<div class="subsection">
    <div class="subsection-title">جدول agent_audit_log</div>
</div>
<p class="body-text">
يُخزَّن <code>agent_audit_log</code> جميع العمليات المتعلقة بالوكلاء الذكيين (AI Agents) في فيكسور. يُسجَّل كل إجراء مع طابعه الزمني ومعرّف المستخدم المنفِّذ ونوع العملية والبيانات المتأثرة. يُستخدم هذا الجدول لمراجعة سلوك الوكلاء، وتحليل الأداء، والتحقيق في أي سلوك غير متوقع. تشمل العمليات المُسجَّلة: إنشاء الوكيل، تعديل الإعدادات، تنفيذ الصفقات، والتغييرات في استراتيجيات التداول.
</p>
<div class="subsection">
    <div class="subsection-title">جدول domain_events</div>
</div>
<p class="body-text">
يُمثِّل <code>domain_events</code> سجل الأحداث المجالية (Domain Events) الذي يُوثِّق جميع التغييرات الهامة في حالة النظام وفقًا لنمط <strong>Event Sourcing</strong>. كل حدث يحتوي على: نوع الحدث، البيانات المرتبطة، طابع زمني، ومعرّف التجمع (Aggregate ID). يوفر هذا السجل تاريخًا كاملاً وقابلًا للتدقيق لجميع التغييرات في النظام، مما يُسهِّل إعادة بناء الحالة في أي نقطة زمنية والتحقيق في الحوادث.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">Sentry — مراقبة الأخطاء</div>
        <div class="info-card-body">
            يلتقط Sentry جميع الأخطاء غير المُعالَجة في بيئة الإنتاج ويُرسل تنبيهات فورية لفريق التطوير. يتضمن كل حدث تتبع المكدس (Stack Trace)، سياق المستخدم، ومعلومات الجهاز. يُستخدم DSN خاص بفيكسور لعزل الأخطاء عن المشاريع الأخرى.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">Mixpanel — تحليل السلوك</div>
        <div class="info-card-body">
            يُتبع Mixpanel تفاعلات المستخدمين لتحليل أنماط الاستخدام واكتشاف الأنشطة المشبوهة. يُسجَّل كل حدث مهم (تسجيل دخول، صفقة، تعديل إعدادات) مع بيانات سياقية تُسهِّل التحقيق الأمني والتحليل الإحصائي.
        </div>
    </div>
</div>
<div class="callout">
    <div class="callout-title">✦ توحيد معالجة الأخطاء</div>
    <div class="callout-body">
        ملف <code>server.ts</code> يُطبِّق توحيدًا للأخطاء الكارثية (Catastrophic Error Normalization) حيث يُحوَّل جميع الأخطاء غير المُعالَجة إلى استجابات آمنة. في بيئة التطوير: يُعرض Stack Trace كامل للمطورين. في بيئة الإنتاج: يُرجع رسالة عامة آمنة مع تسجيل التفاصيل في Sentry لحماية المعلومات الحساسة.
    </div>
</div>
"""
    },

    # ── 14 ── التشفير ──
    {
        "tag": "14",
        "title": "التشفير (Encryption)",
        "content": """
<p class="body-text">
تُعد طبقة التشفير خط الدفاع الأخير في بنية فيكسور الأمنية، حيث تضمن أن البيانات الحساسة تظل محمية حتى في حالة اختراق طبقات الدفاع السابقة. يتم تطبيق التشفير على مستويين: <strong>تشفير بيانات الاعتماد</strong> (Credential Encryption) على مستوى التطبيق، و<strong>TLS</strong> على مستوى النقل. تستخدم فيكسور مكتبات <strong>@noble/ed25519</strong> و<strong>tweetnacl</strong> لتوفير تشفير عالي الأداء ومقاوم للتحليل الجانبي.
</p>
<div class="subsection">
    <div class="subsection-title">تشفير بيانات الاعتماد (Credential Encryption)</div>
</div>
<p class="body-text">
تُخزَّن بيانات الاعتماد الحساسة (مثل مفاتيح API الخاصة بالبورصات ورموز الوصول) في قاعدة البيانات بشكل <strong>مُشفَّر</strong>، وليس كنص عادي. يوفر مجلد <code>shared/crypto/</code> دالتين أساسيتين: <code>encryptCredential</code> لتشفير البيانات قبل التخزين، و<code>decryptCredential</code> لفك التشفير عند الحاجة. تعتمد هاتان الدالتان على خوارزميات <strong>Ed25519</strong> و<strong>NaCl</strong> (Networking and Cryptography Library) التي تُوفِّر سرية وموثوقية عالية.
</p>
<div class="code-block">// تشفير بيانات الاعتماد قبل التخزين
import { encryptCredential, decryptCredential } from '@/shared/crypto';

// عند حفظ بيانات اعتماد بورصة جديدة
const encrypted = encryptCredential(apiKey, secret);
await supabase.from('exchange_credentials').insert({
  user_id: userId,
  exchange: 'binance',
  encrypted_api_key: encrypted.key,
  encrypted_api_secret: encrypted.secret,
});

// عند استخدام بيانات الاعتماد
const { key, secret } = decryptCredential(cred);
const client = new BinanceClient({ apiKey: key, apiSecret: secret });</div>
<div class="subsection">
    <div class="subsection-title">نقل آمن عبر TLS</div>
</div>
<p class="body-text">
جميع الاتصالات بين عميل فيكسور وخوادمها تتم عبر <strong>TLS 1.3</strong> (Transport Layer Security). يوفر هذا تشفيرًا شاملًا لجميع البيانات أثناء النقل (In-Transit)، مما يمنع التنصت (Eavesdropping) وتعديل البيانات (Tampering) وهجمات إعادة التشغيل (Replay Attacks). تستخدم Supabase وVercel شهادات TLS صادرة من مراجع شهادات موثوقة (Certificate Authorities) مع HSTS (HTTP Strict Transport Security) لمنع الهبوط من HTTPS إلى HTTP.
</p>
<div class="callout callout-success">
    <div class="callout-title">✦ التشفير في حالة السكون (At-Rest)</div>
    <div class="callout-body">
        بيانات الاعتماد المُشفَّرة في قاعدة بيانات Supabase محمية بتشفير على مستوى التخزين (Storage-Level Encryption) المُفعَّل افتراضيًا في Supabase Cloud. مع تشفير التطبيق الإضافي عبر <code>shared/crypto/</code>، تحظى البيانات بطبقتي تشفير مستقلتين: واحدة من Supabase وأخرى من فيكسور.
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">مكتبات التشفير المعتمدة</div>
</div>
<ul class="vixor-list">
    <li><strong>@noble/ed25519:</strong> تنفيذ خفيف وصارم لخوارزمية Ed25519 للتوقيعات الرقمية وتبادل المفاتيح</li>
    <li><strong>tweetnacl:</strong> مكتبة NaCl المُصغَّرة لتشفير متقاسم (Shared Key Encryption) عبر XSalsa20-Poly1305</li>
    <li><strong>Web Crypto API:</strong> واجهة التشفير المدمجة في المتصفح للعمليات التي تتم على جانب العميل</li>
</ul>
"""
    },

    # ── 15 ── الاستجابة للحوادث ──
    {
        "tag": "15",
        "title": "الاستجابة للحوادث (Incident Response)",
        "content": """
<p class="body-text">
تتبنى فيكسور استراتيجية شاملة للاستجابة للحوادث الأمنية (Incident Response) تهدف إلى كشف الأخطاء بسرعة، احتواء تأثيرها، واستعادة الخدمة الطبيعية في أقصر وقت ممكن. تتكون هذه الاستراتيجية من أربع مراحل متكاملة: <strong>الكشف</strong> عبر أنظمة المراقبة، <strong>الاحتواء</strong> عبر حدود الخطأ، <strong>التحليل</strong> عبر السجلات، و<strong>الاسترداد</strong> عبر آليات التراجع.
</p>
<div class="subsection">
    <div class="subsection-title">حدود الخطأ (Error Boundaries)</div>
</div>
<p class="body-text">
تُستخدم <strong>Error Boundaries</strong> في React لمنع أخطاء المكونات الفردية من تعطيل التطبيق بالكامل. عند حدوث خطأ غير مُعالَج داخل مكون، يلتقط Error Boundary الخطأ ويُعرض واجهة بديلة بدلاً من الشاشة البيضاء. هذا يضمن أن خطأ في مكون واحد (مثلاً رسم بياني لعملة معينة) لا يؤثر على باقي التطبيق. يُطبَّق هذا النمط على مستويات متعددة: حدود عالمية على مستوى التطبيق، وحدود محلية على مستوى الميزات الحرجة.
</p>
<div class="subsection">
    <div class="subsection-title">تنبيهات Sentry الفورية</div>
</div>
<p class="body-text">
يرتبط فيكسور بـ <strong>Sentry</strong> عبر DSN خاص يُرسل جميع الأخطاء غير المُعالَجة في الإنتاج إلى لوحة المراقبة المركزية. تُفعَّل التنبيهات الفورية (Real-Time Alerts) التي تُخطِر فريق التطوير عبر قنوات متعددة عند حدوث أخطاء حرجة. يوفر Sentry أيضًا تجميع الأخطاء (Error Grouping) لتصنيف الأخطاء المتشابهة، وتتبع الإصدار (Release Tracking) لتحديد الإصدار الذي ظهر فيه الخطأ، وسياق المستخدم (User Context) لفهم تأثير الخطأ.
</p>
<div class="card-grid">
    <div class="info-card">
        <div class="info-card-title">الكشف المبكر</div>
        <div class="info-card-body">
            Sentry + Mixpanel يكشفان الأخطاء والأنشطة المشبوهة في الوقت الحقيقي. CircuitBreaker يكشف تدهور الخدمات الخارجية. Rate Limiter يكشف أنماط الهجوم. كل طبقة تُرسل إشارات إنذار تُتراكَم لتشكيل صورة شاملة لحالة النظام.
        </div>
    </div>
    <div class="info-card">
        <div class="info-card-title">الاحتواء والاسترداد</div>
        <div class="info-card-body">
            Error Boundaries تحتوي الأخطاء على مستوى المكون. CircuitBreaker يحتوي فشل الخدمات الخارجية. LRU Cache يوفر بيانات مخزنة مؤقتًا كـ Fallback. التوزيع عبر Vercel يسمح بالتراجع (Rollback) إلى إصدار سابق بنقرة واحدة.
        </div>
    </div>
</div>
<div class="subsection">
    <div class="subsection-title">توحيد الأخطاء الكارثية</div>
</div>
<p class="body-text">
يُنفِّذ ملف <code>server.ts</code> آلية <strong>Catastrophic Error Normalization</strong> التي تُحوِّل جميع الأخطاء غير المُعالَجة على الخادم إلى استجابات موحدة. في بيئة <strong>التطوير</strong>، تُعرض تفاصيل كاملة تشمل Stack Trace ونوع الخطأ والسياق لمساعدة المطورين في التصحيح. في بيئة <strong>الإنتاج</strong>، تُرجع رسالة عامة فقط ("حدث خطأ داخلي") لحماية المعلومات الحساسة، مع تسجيل التفاصيل الكاملة في Sentry للتحليل. يمنع هذا نمط التسريب المعلوماتي (Information Leakage) الذي قد يُسهِّل عمل المهاجمين.
</p>
<div class="callout">
    <div class="callout-title">✦ التراجع عبر Vercel</div>
    <div class="callout-body">
        يستفيد فيكسور من منصة <strong>Vercel</strong> للاستضافة مما يوفر إمكانية التراجع (Rollback) إلى أي نشر سابق بنقرة واحدة. في حالة اكتشاف مشكلة حرجة في إصدار جديد، يمكن إعادة توجيه حركة المرور إلى الإصدار السابق المستقر في ثوانٍ معدودة، مما يُقلل وقت التوقف (Downtime) إلى الحد الأدنى.
    </div>
</div>
"""
    },
]


# ────────────────────────────────────────────────────────────────
# GENERATE
# ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generating DOC-09: Security Bible …")

    html = generate_vixor_html(
        title="كتاب الأمن السيبراني",
        subtitle="الوثيقة الرسمية لمعايير وممارسات الأمان في فيكسور",
        doc_id="DOC-09",
        chapters=chapters,
        footer_text="VIXOR Security Bible — سري وخاص",
    )

    html_path = save_html(html, "09-security.html")
    print(f"  HTML  → {html_path}")

    pdf_path = convert_to_pdf(
        html_path,
        "09-security.pdf",
        skill_dir="/home/z/my-project/skills/pdf",
    )
    print(f"  PDF   → {pdf_path}")

    print("Done.")
