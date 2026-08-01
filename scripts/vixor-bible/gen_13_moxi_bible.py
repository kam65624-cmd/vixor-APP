#!/usr/bin/env python3
"""
Generate the COMPLETE MOXI_BIBLE PDF for VIXOR.
Doc ID: VIXOR-MXB-001
Title: إنجيل موكسي — التوثيق الكامل لرفيق التداول الذكي MOXI
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf

DOC_ID = "VIXOR-MXB-001"
TITLE = "إنجيل موكسي"
SUBTITLE = "التوثيق الكامل لرفيق التداول الذكي MOXI — من الشخصية إلى التنفيذ"
FOOTER = "VIXOR Engineering Bible — إنجيل موكسي"

chapters = [
    # ============================================================
    # SEC-01: نظرة عامة على MOXI
    # ============================================================
    {
        "tag": "SEC-01",
        "title": "نظرة عامة على MOXI",
        "content": """
        <p class="body-text">
            <strong>MOXI</strong> ليس روبوت محادثة عاديًا، ولا مجرد مساعد ذكي يردّ على الأسئلة. إنه <strong>رفيق التداول الاستباقي</strong> الذي يعيش داخل منظومة فيكسور — الطرفية الذكية لتداول عملات الميم على سولانا. صُمّم MOXI ليكون الوجه البشري للذكاء الاصطناعي في فيكسور: يفهم سياق المستخدم، يتذكّر تفضيلاته، يراقب محفظته، ويبادر بالتحذيرات قبل أن يُطرح السؤال.
        </p>
        <p class="body-text">
            يُمثّل MOXI نقلة نوعية في كيفية تفاعل المتداول مع البيانات. بدلاً من تصفّح سبعة لوحات مختلفة وقراءة إشارات وتحليلات منفصلة، يجمع MOXI كل السياق في لحظة واحدة ويقدّم رؤية متماسكة. يشمل ذلك محفظة المستخدم، استراتيجيته الحالية، إشارات التداول النشطة، أسعار العملات المباشرة، قائمة المراقبة، والأحداث القادمة — كلها تُجمع بشكل متوازٍ ثم تُقدَّم كجملة واحدة ذات معنى.
        </p>
        <p class="body-text">
            يتميّز MOXI بثلاث خصائص جوهرية: <strong>الاستباقية</strong> حيث يراقب المراكز المفتوحة ويبادر بتنبيهات دون طلب، <strong>الشخصية القابلة للتخصيص</strong> حيث يمكن لكل مستخدم ضبط اسم وشخصية وطريقة تواصل MOXI، و<strong>الذكاء العميق</strong> حيث يستخدم سلسلة مزوّدي الذكاء الاصطناعي (zai → anthropic → groq → openai) مع نظام أدوات متكامل لتحليل أزواج التداول وإنشاء التنبيهات.
        </p>
        <div class="callout callout-success">
            <div class="callout-title">💡 التصميم الجوهري</div>
            <div class="callout-body">
                MOXI يتحوّل من مستجيب سلبي إلى شريك نشط في التداول. لا ينتظر المستخدم ليسأل — بل يراقب، يحلّل، ويُنبه. هذه هي الفلسفة التي تميّزه عن كل مساعد تداول آخر.
            </div>
        </div>
        <p class="body-text">
            من الناحية التقنية، يعمل MOXI داخل نطاق <code>src/domains/moxi/</code> كمجال مستقل يحتوي على ثمانية ملفات أساسية تغطي كل شيء من تعريف الأنواع إلى توليد التنبيهات الاستباقية. يتكامل مع البنية التحتية لفيكسور عبر <code>supabase</code> لاسترجاع بيانات المستخدم، و<code>LLMRouter</code> لتوجيه الطلبات لمزوّدي الذكاء الاصطناعي، و<code>processWithAgent</code> لاكتشاف نية استخدام الأدوات، و<code>/api/copilot-stream</code> للبث المباشر عبر SSE.
        </p>
        <p class="body-text">
            تدفق العمل يبدأ عندما يُرسل المستخدم رسالة إلى الدالة الخادمية <code>askMoxi</code>. تُطبّق حدود المعدّل (25 طلب/دقيقة/مستخدم)، ثم يُشغَّل محرك السياق الذي يجلب تسعة مصادر بيانات بالتوازي. بعدها يمرّ الطلب عبر طبقة الذكاء حيث يُكتشف إن كان يحتاج أداة أم لا، ثم يُوجَّه إلى مزوّد الذكاء الاصطناعي المناسب مع السياق الكامل. النتيجة تُبثّ مباشرة عبر SSE إلى واجهة المستخدم.
        </p>
        """
    },

    # ============================================================
    # SEC-02: شخصية MOXI ونظام Avatar
    # ============================================================
    {
        "tag": "SEC-02",
        "title": "شخصية MOXI ونظام Avatar",
        "content": """
        <p class="body-text">
            كل مستخدم في فيكسور يحصل على نسخته الخاصة من MOXI — رفيق يحمل اسمًا وشخصية ومظهرًا فريدًا. نظام الشخصية يتيح تخصيصًا عميقًا يبدأ من الاسم وصولًا إلى نمط التواصل وخبيرية الذكاء الاصطناعي. الهدف هو جعل MOXI يشعر كشريك حقيقي يفهم أسلوب المستخدم في التداول، وليس مجرد أداة جامدة.
        </p>
        <p class="body-text">
            التعريف الأساسي للشخصية يُخزَّن في قاعدة البيانات ضمن جدول <code>moxi_personas</code>، ويُعبَّر عنه برمجيًا عبر نوع <code>MoxiPersona</code>. هذا النوع يحتوي على: الاسم، الشخصية النصية، الخبرات كمصفوفة JSONB، نمط التواصل (رسمي/عادي/مختلط)، متغير المظهر، معرّف رمز NFT غير القابل للاستبدال إن وُجد، وعلامة التخصيص.
        </p>
        <div class="subsection">
            <div class="subsection-title">نوع MoxiPersona — تعريف TypeScript</div>
        </div>
        <div class="code-block">type MoxiPersona = {
  name: string;              // اسم الشخصية، الافتراضي: 'MOXI'
  personality: string;       // وصف نصي للشخصية
  expertise: string[];       // مجالات الخبرة
  communication_style: 'formal' | 'casual' | 'mixed';
  avatar_variant: MoxiAvatarVariant;
  nft_token_id?: string;    // معرّف NFT إن وُجد
  is_customized: boolean;   // هل خُصّصت الشخصية؟
};</div>
        <p class="body-text">
            ثمانية متغيرات مظهر (<code>MoxiAvatarVariant</code>) تُتيح للمستخدم اختيار الهوية البصرية التي تناسبه. كل متغير يحمل دلالة بصرية وعاطفية مختلفة:
        </p>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>المتغير</th>
                    <th>الدلالة</th>
                    <th>الاستخدام المثالي</th>
                </tr>
            </thead>
            <tbody>
                <tr><td><code>default</code></td><td>المظهر الأساسي — هويّة فيكسور</td><td>الخيار الافتراضي لجميع المستخدمين</td></tr>
                <tr><td><code>bull</code></td><td>ثور صاعد — حماس وثقة</td><td>المتداولون المتفائلون الذين يبحثون عن فرص الشراء</td></tr>
                <tr><td><code>bear</code></td><td>دبّ هابط — حذر ومحلّل</td><td>المتداولون المحافظون الذين يفضّلون التحذيرات المبكرة</td></tr>
                <tr><td><code>crystal</code></td><td>بلّورة صافية — وضوح وبصيرة</td><td>المستخدمون الذين يفضّلون التحليلات الموضوعية الخالية من العاطفة</td></tr>
                <tr><td><code>flame</code></td><td>لهب متقدّ — سرعة وحسم</td><td>المتداولون السريعون (Scalpers) الذين يحتاجون قرارات فورية</td></tr>
                <tr><td><code>ocean</code></td><td>محيط هادئ — عمق واستقرار</td><td>المستثمرون طويلو المدى الذين يفضّلون الهدوء</td></tr>
                <tr><td><code>phantom</code></td><td>شبح خفي — تحليل في الظلال</td><td>المتداولون الذين يبحثون عن فرص غير مرئية للآخرين</td></tr>
                <tr><td><code>nova</code></td><td>نجم متفجّر — إبداع وابتكار</td><td>المستخدمون الذين يستكشفون استراتيجيات جديدة وغير تقليدية</td></tr>
            </tbody>
        </table>
        <div class="callout">
            <div class="callout-title">🔑 الشخصية الافتراضية</div>
            <div class="callout-body">
                <code>DEFAULT_MOXI_PERSONA</code> تضبط القيم التالية: الاسم "MOXI"، شخصية ودودة ومتحمسة، خبرات في تحليل العملات الميم وتداول سولانا وإدارة المخاطر، نمط التواصل "mixed" (مختلط)، ومظهر "default". يمكن للمستخدم تعديل أي من هذه القيم عبر <code>updateMoxiPersona</code>.
            </div>
        </div>
        <p class="body-text">
            تُعرَّف المتغيرات الثمانية كمصفوفة <code>AVATAR_VARIANTS</code> في ملف <code>persona.ts</code>، وتُستخدم في مكون <code>MoxiAvatar</code> في الواجهة الأمامية لعرض الرمز المناسب. نظام الشخصية مرتبط بقاعدة البيانات عبر <code>getMoxiPersona(userId)</code> الذي يسترجع الشخصية المخزّنة أو يعيد الافتراضية، و<code>updateMoxiPersona(userId, data)</code> الذي يحفّظ التعديلات.
        </p>
        """
    },

    # ============================================================
    # SEC-03: محرك السياق (Context Engine)
    # ============================================================
    {
        "tag": "SEC-03",
        "title": "محرك السياق (Context Engine)",
        "content": """
        <p class="body-text">
            قلب MOXI النابض هو محرك السياق <code>buildMoxiContext()</code> الموجود في <code>context-engine.ts</code>. هذه الدالة هي المسؤولة عن تحويل المستخدم المجهول إلى كيان مفهوم تمامًا — حيث تجمع كل البيانات ذات الصلة بالمستخدم في لحظة واحدة قبل أن يُبنى الطلب الذكي. بدون هذا المحرك، سيكون MOXI مجرد روبوت محادثة بلا سياق يردّ بإجابات عامة لا علاقة لها بواقع المستخدم.
        </p>
        <p class="body-text">
            يعمل المحرك باستخدام مبدأ <strong>الجلب المتوازي</strong> (Parallel Fetching): عند استدعاء <code>buildMoxiContext(userId, supabase)</code>، تُطلق تسعة استعلامات قاعدة بيانات في وقت واحد عبر <code>Promise.all()</code>. هذا يعني أن زمن الاستجابة يُحدَّد بأبطأ استعلام فردي وليس بمجموعها — فارق كبير في الأداء خاصةً عند التعامل مع اتصالات شبكة.
        </p>
        <div class="subsection">
            <div class="subsection-title">المصادر التسعة للسياق</div>
        </div>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>المصدر</th>
                    <th>الوصف</th>
                    <th>الغرض في الاستجابة</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>1</td><td><code>profile</code></td><td>ملف المستخدم الأساسي</td><td>معرفة مستوى الخبرة وتفضيلات التداول</td></tr>
                <tr><td>2</td><td><code>strategy</code></td><td>الاستراتيجية النشطة</td><td>تخصيص النصائح حسب نهج المستخدم</td></tr>
                <tr><td>3</td><td><code>signalTrackings</code></td><td>الإشارات المُتتبَّعة</td><td>معرفة أي إشارات يهتم بها المستخدم حاليًا</td></tr>
                <tr><td>4</td><td><code>recentAnalyses</code></td><td>التحليلات الأخيرة</td><td>بناء على السياق التحليلي السابق</td></tr>
                <tr><td>5</td><td><code>todaySignals</code></td><td>إشارات اليوم</td><td>تقديم رؤية محدثة عن فرص اليوم</td></tr>
                <tr><td>6</td><td><code>watchlist</code></td><td>قائمة المراقبة</td><td>فهم اهتمامات المستخدم الحالية</td></tr>
                <tr><td>7</td><td><code>livePrices</code></td><td>الأسعار المباشرة</td><td>تقديم بيانات سعرية حقيقية في الرد</td></tr>
                <tr><td>8</td><td><code>recentEvents</code></td><td>الأحداث الأخيرة</td><td>ربط الرد بالسياق الزمني الحالي</td></tr>
                <tr><td>9</td><td><code>userMemories</code></td><td>ذاكرة المستخدم</td><td>تذكّر تفاعلات سابقة وتفضيلات مُعبَّر عنها</td></tr>
            </tbody>
        </table>
        <div class="subsection">
            <div class="subsection-title">هيكل الدالة</div>
        </div>
        <div class="code-block">async function buildMoxiContext(
  userId: string,
  supabase: SupabaseClient
): Promise&lt;MoxiFormattedContext&gt; {
  const [profile, strategy, signalTrackings,
         recentAnalyses, todaySignals, watchlist,
         livePrices, recentEvents, userMemories
  ] = await Promise.all([
    fetchUserProfile(userId, supabase),
    fetchActiveStrategy(userId, supabase),
    fetchSignalTrackings(userId, supabase),
    fetchRecentAnalyses(userId, supabase),
    fetchTodaySignals(supabase),
    fetchWatchlist(userId, supabase),
    fetchLivePrices(supabase),
    fetchRecentEvents(supabase),
    fetchUserMemories(userId, supabase),
  ]);

  return { profile, strategy, signalTrackings,
           recentAnalyses, todaySignals, watchlist,
           livePrices, recentEvents, userMemories };
}</div>
        <p class="body-text">
            النتيجة هي كائن من نوع <code>MoxiFormattedContext</code> يُمرَّر مباشرة إلى <code>buildMoxiSystemPrompt()</code> حيث يُدمج في الطلب الذكي. هذا التصميم يفصل بين جلب البيانات وبناء الطلب، مما يسمح باختبار كل جزء بشكل مستقل وتعديل مصادر البيانات دون التأثير على المنطق الذكي.
        </p>
        <div class="callout callout-warn">
            <div class="callout-title">⚠️ أهمية السياق في تداول العملات الميم</div>
            <div class="callout-body">
                تداول عملات الميم على سولانا يتطلّب فهمًا فوريًا للسياق. الإشارة التي كانت ممتازة قبل ساعة قد تكون خطيرة الآن. محرك السياق يضمن أن MOXI يرى الصورة الكاملة في كل لحظة — من محفظة المستخدم إلى آخر حدث في السوق.
            </div>
        </div>
        <p class="body-text">
            كل دالة جلب فرعية تتعامل مع حالات الفشل بأمان — إذا تعذّر جلب مصدر معيّن، يُعيَّد بقيمة <code>null</code> دون إفشال العملية بأكملها. هذا يعني أن MOXI يستمر في العمل حتى لو كانت بعض الخدمات غير متاحة، مع تقليل جودة السياق بشكل متناسب.
        </p>
        """
    },

    # ============================================================
    # SEC-04: نظام الأدوات (Tool System)
    # ============================================================
    {
        "tag": "SEC-04",
        "title": "نظام الأدوات (Tool System)",
        "content": """
        <p class="body-text">
            MOXI لا يقتصر على توليد النصوص — يمتلك سجل أدوات متكامل (<code>MOXI_TOOLS</code>) في <code>tools.ts</code> يمنحه القدرة على تنفيذ إجراءات حقيقية في النظام. هذه الأدوات تُفعل عبر <code>processWithAgent</code> في طبقة الذكاء (P1) حيث يُكتشف قصد المستخدم ويُنفَّذ الأداة المناسبة. الفرق بين MOXI مع أدوات وبدونها هو الفرق بين محلّل يُقدّم المشورة ومُنفِّذ يتّخذ الإجراء.
        </p>
        <p class="body-text">
            سجل الأدوات يحتوي على <strong>سبع أدوات</strong> تغطي الدورة الكاملة لتداول العملات الميم: من التحليل والمراقبة إلى التنبيهات والملخصات. كل أداة تُعرَّف باسمها ووصفها ومعاملاتها (parameters) وأنواعها، مما يسمح لنظام اكتشاف القصد بفهم متى وكيف يُستدعى كل أداة.
        </p>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>الأداة</th>
                    <th>الوصف</th>
                    <th>المعاملات</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><code>analyzePair</code></td>
                    <td>تحليل شامل لزوج تداول محدد — يشمل السعر والحجم والسيولة والزخم</td>
                    <td><code>pairAddress</code> (string, مطلوب)</td>
                </tr>
                <tr>
                    <td><code>trackSignal</code></td>
                    <td>تتبع إشارة تداول محددة وإضافتها إلى لوحة المتابعة</td>
                    <td><code>signalId</code> (string, مطلوب)</td>
                </tr>
                <tr>
                    <td><code>createPriceAlert</code></td>
                    <td>إنشاء تنبيه سعري عند مستوى محدد لزوج تداول</td>
                    <td><code>pairAddress</code> (string), <code>targetPrice</code> (number), <code>direction</code> ('above'|'below')</td>
                </tr>
                <tr>
                    <td><code>getMarketSummary</code></td>
                    <td>ملخص شامل لسوق عملات الميم على سولانا</td>
                    <td>لا يوجد معاملات</td>
                </tr>
                <tr>
                    <td><code>getPortfolio</code></td>
                    <td>استرجاع ملخص المحفظة الحالية للمستخدم</td>
                    <td>لا يوجد معاملات (يستخدم userId من السياق)</td>
                </tr>
                <tr>
                    <td><code>getWatchlist</code></td>
                    <td>عرض قائمة المراقبة مع حالة كل عملة</td>
                    <td>لا يوجد معاملات (يستخدم userId من السياق)</td>
                </tr>
                <tr>
                    <td><code>getSignalStatus</code></td>
                    <td>التحقق من حالة إشارة تداول محددة</td>
                    <td><code>signalId</code> (string, مطلوب)</td>
                </tr>
            </tbody>
        </table>
        <p class="body-text">
            <strong>كيف يعمل اكتشاف القصد:</strong> عندما يُرسل المستخدم رسالة مثل "حلّل لي BONK" أو "أضف تنبيه عند 0.00005"، يمرّ النص أولاً عبر <code>processWithAgent</code> الذي يُحلّل القصد ويُطابقه مع الأدوات المتاحة. إذا وُجد تطابق، يُنفَّذ الأداة ويُدمج نتيجتها في سياق MOXI قبل الرد. إذا لم يُكتشف قصد أداة، يُحوَّل الطلب مباشرة إلى مسار الذكاء الاصطناعي العام.
        </p>
        <div class="callout callout-success">
            <div class="callout-title">⚡ أدوات vs محادثة عامة</div>
            <div class="callout-body">
                "ما رأيك بسوق اليوم؟" → محادثة عامة (بدون أدوات).<br>
                "حلّل لي BONK/W SOL" → <code>analyzePair</code> يُنفَّذ ثم يُبنى الرد حول النتيجة.<br>
                "نبّهني إذا وصل SOL لـ 200$" → <code>createPriceAlert</code> يُنفَّذ.<br>
                هذا التمييز يمنع استدعاء أدوات غير ضرورية ويحسّن سرعة الاستجابة.
            </div>
        </div>
        <p class="body-text">
            الأدوات التي لا تحتاج معاملات (<code>getMarketSummary</code>، <code>getPortfolio</code>، <code>getWatchlist</code>) تُستدعى تلقائيًا في بعض السياقات. مثلاً، عندما يسأل المستخدم عن حالته العامة، قد يستدعي MOXI <code>getPortfolio</code> و<code>getMarketSummary</code> معًا لتقديم صورة متكاملة دون أن يطلب المستخدم كل شيء صراحة.
        </p>
        """
    },

    # ============================================================
    # SEC-05: مولّد الأوامر (Prompt Builder)
    # ============================================================
    {
        "tag": "SEC-05",
        "title": "مولّد الأوامر (Prompt Builder)",
        "content": """
        <p class="body-text">
            في <code>prompt.ts</code>، تقع الدالة <code>buildMoxiSystemPrompt(persona, ctx)</code> — وهي المسؤولة عن بناء الطلب الذكي الكامل الذي يُرسل إلى مزوّدي اللغة الكبيرة. هذه الدالة هي الجسر بين بيانات المستخدم الخام والذكاء الاصطناعي: تأخذ شخصية MOXI وسياق المستخدم وتُنتج سلسلة نصية مُهيكلة تُخبر النموذج بدقّة من هو وماذا يفعل وماذا يعرف.
        </p>
        <p class="body-text">
            <strong>هيكل الطلب الذكي:</strong> يُبنى الطلب من أربعة أقسام متتالية، كل قسم يضيف طبقة من التخصيص:
        </p>
        <ol class="vixor-ol">
            <li><strong>قسم الهوية (Identity Block):</strong> يُعرِّف MOXI باسمه وشخصيته ونمط تواصله وخبراته. هذا القسم يأتي من كائن <code>MoxiPersona</code> ويُشكّل نبرة الرد الأساسية. إذا كان نمط التواصل "رسمي" يستخدم صياغة احترافية، وإذا كان "عادي" يستخدم لغة مألوفة.</li>
            <li><strong>قسم السياق (Context Block):</strong> يُضخّم كائن <code>MoxiFormattedContext</code> الذي أعدّه محرك السياق. يشمل ذلك ملف المستخدم، استراتيجيته، إشاراته، تحليلاته، أسعار السوق المباشرة، قائمة مراقبته، الأحداث الأخيرة، وذاكرته. كل مصدر يُنسّق بشكل مقروء ويُدمج في الطلب.</li>
            <li><strong>قسم القواعد (Rules Block):</strong> تعليمات سلوكية محددة: كيف يتعامل مع الأسعار، كيف يُحذّر من المخاطر، متى يقترح أفعالًا سريعة (<code>MOXI_QUICK_ACTIONS</code>)، وكيف يُصيغ الإجابات بشكل مهيكل.</li>
            <li><strong>قسم الأدوات (Tools Block):</strong> وصف سجل الأدوات المتاحة (<code>MOXI_TOOLS</code>) مع تعليمات حول متى وكيف يُشير إلى استخدامها. هذا القسم لا يُنفِّذ الأدوات بل يُعلم النموذج بوجودها لتقديم إجابات تتناسب مع قدراته.</li>
        </ol>
        <div class="subsection">
            <div class="subsection-title">مقتطف من هيكل الطلب</div>
        </div>
        <div class="code-block">function buildMoxiSystemPrompt(
  persona: MoxiPersona,
  ctx: MoxiFormattedContext
): string {
  return `
    [IDENTITY]
    أنت ${persona.name}، ${persona.personality}
    نمط التواصل: ${persona.communication_style}
    الخبرات: ${persona.expertise.join(', ')}

    [USER CONTEXT]
    الملف: ${JSON.stringify(ctx.profile)}
    الاستراتيجية: ${JSON.stringify(ctx.strategy)}
    الإشارات المتتبعة: ${ctx.signalTrackings?.length ?? 0}
    قائمة المراقبة: ${ctx.watchlist?.map(w => w.pair).join(', ')}
    الأسعار المباشرة: ${JSON.stringify(ctx.livePrices)}
    ذاكرة المستخدم: ${ctx.userMemories?.map(m => m.content).join('; ')}

    [RULES]
    - كن دقيقًا بالأرقام واذكر المصدر
    - نبّه من المخاطر دائمًا
    - اقترح إجراءات سريعة عند الاقتضاء
    ...
  `;
}</div>
        <p class="body-text">
            يوجد أيضًا <code>MOXI_QUICK_ACTIONS</code> — مصفوفة من الإجراءات السريعة المُعرَّفة في <code>types.ts</code> التي يُمكن لـ MOXI اقتراحها. هذه الإجراءات مثل "تتبع هذه الإشارة" أو "إنشاء تنبيه سعري" تُقدَّم كأزرار تفاعلية في واجهة المستخدم، مما يُحوّل النص الذكي إلى إجراء مباشر بنقرة واحدة.
        </p>
        <div class="callout">
            <div class="callout-title">🔑 مبدأ الفصل</div>
            <div class="callout-body">
                فصل بناء الطلب (Prompt) عن محرك السياق (Context) يعني أنه يمكن تعديل كيف يُقدَّم السياق للنموذج دون تغيير كيف يُجمع. هذا ضروري لأن نماذج اللغة المختلفة قد تحتاج تنسيقات مختلفة لنفس البيانات.
            </div>
        </div>
        """
    },

    # ============================================================
    # SEC-06: الاستجابة الاستباقية (Proactive Insights)
    # ============================================================
    {
        "tag": "SEC-06",
        "title": "الاستجابة الاستباقية (Proactive Insights)",
        "content": """
        <p class="body-text">
            أحد أكثر جوانب MOXI تميّزًا هو قدرته على <strong>الوصول إلى المستخدم قبل أن يطلب</strong>. في <code>notification-hub.ts</code>، يعمل نظام الاستباقية كمراقب دائم يُحلّل حالة المستخدم ويُولّد رؤى تُنقَل عبر <code>MoxiProactiveInsight</code>. هذا النظام يُحوّل MOXI من أداة ردّ فعلية إلى شريك نشط يُدرك المشاكل قبل أن تتفاقم.
        </p>
        <p class="body-text">
            النظام يحتوي على <strong>ثلاث وظائف كشف أساسية</strong>، كل واحدة تراقب نمطًا مختلفًا من المخاطر:
        </p>
        <div class="subsection">
            <div class="subsection-title">1. كشف التعرّض المفرط — detectOverexposure</div>
        </div>
        <p class="body-text">
            تُحلّل هذه الدالة توزيع المحفظة عبر العملات المختلفة وتكتشف ما إذا كان المستخدم مُعرَّضًا بشكل مفرط لعملة واحدة أو قطاع واحد. في سوق عملات الميم المتقلّب، التركيز الزائد على عملة واحدة يعني خطرًا كبيرًا إذا انعكست حركتها فجأة. تُقارن الدالة نسبة كل عملة من المحفظة بعتبات مُحدَّدة وتُولّد تنبيهًا إذا تجاوزت أي نسبة الحد الآمن.
        </p>
        <div class="subsection">
            <div class="subsection-title">2. كشف قرب الإشارة — detectSignalProximity</div>
        </div>
        <p class="body-text">
            تُراقب هذه الدالة إشارات التداول النشطة وتكتشف التي اقتربت من نقاط التنفيذ أو الانتهاء. مثلاً، إذا كانت إشارة شراء عند مستوى سعر معيّن واقترب السعر منه، تُنبّه الدالة المستخدم بأن اللحظة المناسبة اقتربت. هذا يضمن أن المستخدم لا يفوت الفرص بسبب الانشغال أو عدم المراقبة المستمرة.
        </p>
        <div class="subsection">
            <div class="subsection-title">3. كشف مخاطر الأحداث — detectEventRisk</div>
        </div>
        <p class="body-text">
            تُحلّل هذه الدالة الأحداث القادمة (مثل إطلاق عملات جديدة، أحداث على السلسلة، تغييرات في السيولة) وتُقيّم تأثيرها المحتمل على مراكز المستخدم المفتوحة. إذا كان هناك حدث قد يؤثر سلبًا على عملة في المحفظة، تُولّد الدالة تحذيرًا استباقيًا مع توضيح المخاطر المقترحة والبدائل المحتملة.
        </p>
        <div class="code-block">// notification-hub.ts — الهيكل العام
async function generateMoxiInsights(userId: string, supabase) {
  const context = await buildMoxiContext(userId, supabase);
  const insights: MoxiProactiveInsight[] = [];

  // فحص التعرّض المفرط
  const overexposure = await detectOverexposure(context);
  if (overexposure) insights.push(overexposure);

  // فحص قرب الإشارات
  const proximity = await detectSignalProximity(context);
  if (proximity) insights.push(proximity);

  // فحص مخاطر الأحداث
  const eventRisk = await detectEventRisk(context);
  if (eventRisk) insights.push(eventRisk);

  return insights;
}</div>
        <div class="callout callout-warn">
            <div class="callout-title">⚠️ التوازن بين الاستباقية والإزعاج</div>
            <div class="callout-body">
                يتم ضبط عتبات الكشف بعناية لتجنب إغراق المستخدم بالتنبيهات. الهدف هو تنبيه ذكي وليس إشعارات عشوائية. كل رؤية استباقية تمر بتقييم الأهمية قبل إرسالها.
            </div>
        </div>
        <p class="body-text">
            تُستدعى <code>generateMoxiInsights</code> بشكل دوري أو عند تغيّر مهم في البيانات (مثل تحديث سعر كبير أو حدث جديد). النتائج تُخزَّن مؤقتًا ويُمكن الوصول إليها عبر الدالة الخادمية <code>getMoxiInsights</code> (GET) التي تعرض الرؤى الاستباقية الحالية للمستخدم في واجهة المحادثة.
        </p>
        """
    },

    # ============================================================
    # SEC-07: البث المباشر والذكاء الاصطناعي
    # ============================================================
    {
        "tag": "SEC-07",
        "title": "البث المباشر والذكاء الاصطناعي",
        "content": """
        <p class="body-text">
            تجربة المستخدم مع MOXI تعتمد كليًا على <strong>البث المباشر</strong> (Streaming) عبر نقطة النهاية <code>/api/copilot-stream</code>. بدلاً من انتظار الرد الكامل ثم عرضه دفعة واحدة، يُرسل MOXI الكلمات والجمل تدريجيًا عبر بروتوكول SSE (Server-Sent Events). هذا يمنح إحساسًا فوريًا بالاستجابة ويُحسّن تجربة الانتظار بشكل كبير خاصةً مع نماذج اللغة الكبيرة التي قد تستغرق ثوانٍ عدة.
        </p>
        <p class="body-text">
            عند طلب البث، يُحدَّد الوكيل عبر المعامل <code>agent: "moxi"</code> الذي يُوجّه الطلب إلى مسار MOXI المحدد. المسار يبدأ بالتحقق من الحدود ثم بناء السياق ثم توجيه الطلب الذكي، وكل جزء من الرد يُبثّ فورًا كما يُولَّد.
        </p>
        <div class="subsection">
            <div class="subsection-title">سلسلة مزوّدي الذكاء الاصطناعي (LLM Fallback Chain)</div>
        </div>
        <p class="body-text">
            MOXI يستخدم <code>LLMRouter</code> لتوجيه الطلبات عبر سلسلة احتياطية من أربعة مزوّدين. هذا يضمن أن MOXI يعمل دائمًا حتى لو كان أحد المزوّدين غير متاح أو مُثقَّلًا:
        </p>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>الأولوية</th>
                    <th>المزوّد</th>
                    <th>الوصف</th>
                </tr>
            </thead>
            <tbody>
                <tr><td><code>P1</code></td><td><code>zai</code></td><td>المزوّد الأساسي — مُحسَّن لفيكسور، أداء أعلى وتخصيص أعمق للسياق المالي</td></tr>
                <tr><td><code>P2</code></td><td><code>anthropic</code></td><td>Claude — احتياطي أول، ممتاز في التحليل المالي والنصوص الطويلة</td></tr>
                <tr><td><code>P3</code></td><td><code>groq</code></td><td>Groq — احتياطي ثاني، سرعة فائقة في التوليد</td></tr>
                <tr><td><code>P4</code></td><td><code>openai</code></td><td>OpenAI — الاحتياطي الأخير، GPT models كخيار نهائي</td></tr>
            </tbody>
        </table>
        <p class="body-text">
            عند فشل المزوّد الأساسي (زمن استجابة طويل أو خطأ أو تجاوز الحصة)، ينتقل الجهاز تلقائيًا إلى المزوّد التالي في السلسلة دون تدخل المستخدم. هذا الانتقال شفاف تمامًا — المستخدم يرى MOXI يردّ بشكل طبيعي بغض النظر عن المزوّد الفعلي الذي يُعالج الطلب.
        </p>
        <div class="subsection">
            <div class="subsection-title">نظام الحدود (Rate Limiting)</div>
        </div>
        <p class="body-text">
            يُطبَّق حدّ معدّل صارم: <strong>25 طلبًا في الدقيقة لكل مستخدم</strong> عبر <code>SlidingWindowLimiter</code>. هذا يحمي النظام من الإساءة ويضمن توزيعًا عادلًا للموارد. نافذة الانزلاق تعني أن الحد يُحسب على آخر 60 ثانية وليس على حدود دقيقة ثابتة — مما يمنع تجاوز الحد بإرسال طلبات متتالية عند بداية كل دقيقة.
        </p>
        <div class="code-block">// functions.ts — الحد الأدنى للاستجابة
const RATE_LIMIT = { maxRequests: 25, windowMs: 60_000 };

export async function askMoxi(request: AskMoxiRequest) {
  // 1. التحقق من الحدود
  await SlidingWindowLimiter.check(request.userId, RATE_LIMIT);

  // 2. بناء السياق (9 مصادر بالتوازي)
  const ctx = await buildMoxiContext(request.userId, supabase);

  // 3. بناء الطلب الذكي
  const systemPrompt = buildMoxiSystemPrompt(persona, ctx);

  // 4. البث عبر LLMRouter مع agent: "moxi"
  return LLMRouter.stream({ systemPrompt, messages, agent: 'moxi' });
}</div>
        <div class="callout callout-danger">
            <div class="callout-title">🚫 تجاوز الحدود</div>
            <div class="callout-body">
                عند تجاوز 25 طلبًا/دقيقة، يُرفض الطلب فورًا مع رمز الحالة 429. لا يوجد طابور انتظار — المستخدم يحتاج الانتظار حتى تنخفض معدّلاته. هذا يمنع إغراق مزوّدي الذكاء الاصطناعي بالطلبات.
            </div>
        </div>
        """
    },

    # ============================================================
    # SEC-08: قاعدة بيانات MOXI
    # ============================================================
    {
        "tag": "SEC-08",
        "title": "قاعدة بيانات MOXI",
        "content": """
        <p class="body-text">
            يعتمد MOXI على جدول <code>moxi_personas</code> في قاعدة بيانات Supabase لتخزين شخصيات المستخدمين. هذا الجدول هو المصدر الوحيد للحقيقة للشخصيات المخصصة، ويضمن أن تفضيلات المستخدم تُحفظ وتُسترجع بشكل متسق عبر الجلسات والأجهزة.
        </p>
        <div class="subsection">
            <div class="subsection-title">مخطط الجدول — moxi_personas</div>
        </div>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>العمود</th>
                    <th>النوع</th>
                    <th>القيد</th>
                    <th>الوصف</th>
                </tr>
            </thead>
            <tbody>
                <tr><td><code>user_id</code></td><td>UUID</td><td>PRIMARY KEY, FK → profiles.id</td><td>معرّف المستخدم — يرتبط بجدول الملفات الشخصية</td></tr>
                <tr><td><code>name</code></td><td>TEXT</td><td>DEFAULT 'MOXI'</td><td>اسم الشخصية — الافتراضي "MOXI"</td></tr>
                <tr><td><code>personality</code></td><td>TEXT</td><td>NOT NULL</td><td>وصف نصي للشخصية يُمرَّر في الطلب الذكي</td></tr>
                <tr><td><code>expertise</code></td><td>JSONB</td><td>DEFAULT '[]'</td><td>مصفوفة مجالات الخبرة (string[])</td></tr>
                <tr><td><code>communication_style</code></td><td>TEXT</td><td>CHECK ('formal','casual','mixed')</td><td>نمط التواصل مع القيم المسموحة فقط</td></tr>
                <tr><td><code>avatar_variant</code></td><td>TEXT</td><td>CHECK (8 variants)</td><td>متغير المظهر من القيم المعرَّفة</td></tr>
                <tr><td><code>nft_token_id</code></td><td>TEXT</td><td>NULLABLE</td><td>معرّف رمز NFT إن ارتبطت الشخصية برمز غير قابل للاستبدال</td></tr>
                <tr><td><code>is_customized</code></td><td>BOOLEAN</td><td>DEFAULT false</td><td>علامة تُشير إلى ما إذا كانت الشخصية قد عُدِّلت عن الافتراضية</td></tr>
            </tbody>
        </table>
        <p class="body-text">
            <strong>العلاقة مع جدول profiles:</strong> <code>user_id</code> يعمل كمفتاح خارجي يرتبط بجدول <code>profiles</code>. هذا يضمن أن كل شخصية MOXI مرتبطة بملف شخصي صالح وأن حذف الملف الشخصي يؤدي لحذف الشخصية تلقائيًا (CASCADE). عند إنشاء مستخدم جديد، لا تُنشأ سجل شخصية تلقائيًا — بل يُستخدم <code>DEFAULT_MOXI_PERSONA</code> من الكود حتى يقوم المستخدم بتخصيص شخصيته لأول مرة.
        </p>
        <div class="subsection">
            <div class="subsection-title">سياسات أمان الصفوف (RLS)</div>
        </div>
        <ul class="vixor-list">
            <li><strong>SELECT:</strong> المستخدم يستطيع قراءة شخصيته فقط (<code>user_id = auth.uid()</code>)</li>
            <li><strong>INSERT:</strong> المستخدم يستطيع إنشاء شخصية لحسابه فقط</li>
            <li><strong>UPDATE:</strong> المستخدم يستطيع تعديل شخصيته فقط</li>
            <li><strong>DELETE:</strong> مقيّد — لا يمكن حذف الشخصية يدويًا (يتم عبر cascade عند حذف الملف)</li>
        </ul>
        <div class="callout">
            <div class="callout-title">🗄️ استراتيجية التخزين</div>
            <div class="callout-body">
                <code>expertise</code> يُخزَّن كـ JSONB وليس كجدول منفصل لأن عدد المجالات محدود (3-6 عادةً) ولا تحتاج استعلامات معقدة. هذا يُبسّط القراءة والكتابة مع الحفاظ على المرونة في إضافة مجالات جديدة.
            </div>
        </div>
        <p class="body-text">
            <strong>المُشغِّلات (Triggers):</strong> عند الإدراج الأول لسجل شخصية، يُفعَّل مُشغِّل يُعيّن <code>is_customized = false</code>. عند أي تحديث لاحق، يُغيَّر تلقائيًا إلى <code>true</code>، مما يسمح للنظام بمعرفة ما إذا كان يجب استخدام الشخصية المخزّنة أم الافتراضية، ويُسهّل ميزة "إعادة التعيين إلى الافتراضي" ببساطة.
        </p>
        <div class="subsection">
            <div class="subsection-title">الدوال الخادمية المتعلقة بقاعدة البيانات</div>
        </div>
        <ul class="vixor-list">
            <li><code>getMoxiPersona(userId)</code> — تستعلم <code>moxi_personas</code> وتُعيد الشخصية أو <code>DEFAULT_MOXI_PERSONA</code></li>
            <li><code>updateMoxiPersona(userId, data)</code> — تُحدِّث السجل وتُعيّن <code>is_customized = true</code></li>
            <li><code>getMoxiPersonaFn</code> — دالة خادمية (GET) تُغلّف <code>getMoxiPersona</code> للواجهة الأمامية</li>
            <li><code>updateMoxiPersona</code> — دالة خادمية (POST) تُغلّف <code>updateMoxiPersona</code> للواجهة الأمامية</li>
        </ul>
        """
    },

    # ============================================================
    # SEC-09: واجهات MOXI في المنتج
    # ============================================================
    {
        "tag": "SEC-09",
        "title": "واجهات MOXI في المنتج",
        "content": """
        <p class="body-text">
            MOXI ليس مجرد كود خلفي — يظهر في عدة نقاط عبر واجهة فيكسور الأمامية كعنصر بصري وتفاعلي حي. كل نقطة تكامل مُصمَّمة لتكون طبيعية وغير مُزعجة، بحيث يشعر المستخدم بأن MOXI جزء أصيل من التجربة وليس إضافة خارجية.
        </p>
        <div class="subsection">
            <div class="subsection-title">مكون MoxiAvatar</div>
        </div>
        <p class="body-text">
            مكون <code>MoxiAvatar</code> هو التمثيل البصري لـ MOXI في الواجهة. يستقبل خاصية <code>variant</code> من نوع <code>MoxiAvatarVariant</code> ويُرجّع الرمز المناسب. المتغيرات الثمانية تُترجم إلى ألوان وتأثيرات وحركات مختلفة: <code>default</code> باللون البنفسجي الأساسي لفيكسور، <code>bull</code> بالأخضر الصاعد، <code>bear</code> بالأحمر الهابط، <code>crystal</code> بالأزرق الشفاف، <code>flame</code> بالبرتقالي المتقدّ، <code>ocean</code> بالأزرق العميق، <code>phantom</code> بالرمادي الشفاف، و<code>nova</code> بالبنفسجي المتوهّج.
        </p>
        <p class="body-text">
            المكون يدعم ثلاثة أحجام: <code>sm</code> (في القوائم والأزرار)، <code>md</code> (في رأس المحادثة)، و<code>lg</code> (في الشاشات الترحيبية). كل حجم يُعدَّل بعناية ليتناسب مع سياق الاستخدام دون أن يطغى على المحتوى المحيط.
        </p>
        <div class="subsection">
            <div class="subsection-title">واجهة محادثة MOXI</div>
        </div>
        <p class="body-text">
            محادثة MOXI تظهر كجزء من نظام الـ Copilot في فيكسور. عند فتح نافذة المحادثة، يُحدَّد الوكيل كـ <code>"moxi"</code> مما يُفعّل مسار MOXI الكامل: بناء السياق، اكتشاف القصد، التوجيه عبر مزوّدي الذكاء الاصطناعي، والبث المباشر. واجهة المحادثة تعرض:
        </p>
        <ul class="vixor-list">
            <li><strong>فقاعات الرسائل:</strong> رسائل المستخدم والردود الذكية بتنسيق Markdown مع دعم الكود والجداول</li>
            <li><strong>الإجراءات السريعة:</strong> أزرار <code>MOXI_QUICK_ACTIONS</code> التي يقترحها MOXI (مثل "تتبع الإشارة" أو "إنشاء تنبيه")</li>
            <li><strong>مؤشر الكتابة:</strong> مؤشر بث مباشر يُظهر أن MOXI يُولّد الرد في الوقت الحقيقي</li>
            <li><strong>الرؤى الاستباقية:</strong> بطاقات <code>MoxiProactiveInsight</code> التي تظهر في أعلى المحادثة عند وجود تنبيهات</li>
        </ul>
        <div class="subsection">
            <div class="subsection-title">نقاط التكامل عبر التطبيق</div>
        </div>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>الموقع</th>
                    <th>التكامل</th>
                    <th>الوصف</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>الشريط الجانبي</td>
                    <td>أيقونة MoxiAvatar</td>
                    <td>رمز MOXI في الشريط الجانبي يفتح نافذة المحادثة بنقرة واحدة</td>
                </tr>
                <tr>
                    <td>لوحة الإشارات</td>
                    <td>زر "اسأل MOXI"</td>
                    <td>عند كل إشارة، زر يفتح المحادثة مع سياق الإشارة المُحدَّدة</td>
                </tr>
                <tr>
                    <td>بطاقة العملة</td>
                    <td>تكامل السياق</td>
                    <td>عند فتح بطاقة عملة، يُضاف السياق تلقائيًا لمحادثة MOXI</td>
                </tr>
                <tr>
                    <td>الإشعارات</td>
                    <td>رؤى استباقية</td>
                    <td>تنبيهات MOXI الاستباقية تظهر في مركز الإشعارات مع رمز MOXI</td>
                </tr>
                <tr>
                    <td>الصفحة الرئيسية</td>
                    <td>ترحيب MOXI</td>
                    <td>رسالة ترحيب شخصية من MOXI تُحدَّث حسب حالة السوق وملف المستخدم</td>
                </tr>
            </tbody>
        </table>
        <div class="callout callout-success">
            <div class="callout-title">🎯 التكامل غير المُزعج</div>
            <div class="callout-body">
                مبدأ التصميم هو أن MOXI يظهر عندما يحتاجه المستخدم ويختفي عندما لا يحتاجه. لا توجد نوافذ منبثقة إجبارية أو إشعارات مُزعجة — التفاعل دائمًا بالمبادرة من المستخدم أو عبر تنبيهات استباقية مُضبطة بعناية.
            </div>
        </div>
        """
    },

    # ============================================================
    # SEC-10: خريطة التتبع: MOXI → الكود
    # ============================================================
    {
        "tag": "SEC-10",
        "title": "خريطة التتبع: MOXI → الكود",
        "content": """
        <p class="body-text">
            هذا الفصل هو الخريطة الشاملة التي تربط كل ميزة MOXI بمسار الملف الدقيق واسم الدالة. استخدم هذه الخريطة للتنقل مباشرة إلى أي جزء من كود MOXI دون بحث.
        </p>
        <table class="vixor-table">
            <thead>
                <tr>
                    <th>الميزة</th>
                    <th>الملف</th>
                    <th>الدالة / التصدير</th>
                </tr>
            </thead>
            <tbody>
                <tr><td>نوع الشخصية</td><td><code>src/domains/moxi/types.ts</code></td><td><code>MoxiPersona</code>, <code>MoxiAvatarVariant</code></td></tr>
                <tr><td>نوع الاستجابة</td><td><code>src/domains/moxi/types.ts</code></td><td><code>MoxiResponse</code></td></tr>
                <tr><td>نوع الرؤية الاستباقية</td><td><code>src/domains/moxi/types.ts</code></td><td><code>MoxiProactiveInsight</code></td></tr>
                <tr><td>الإجراءات السريعة</td><td><code>src/domains/moxi/types.ts</code></td><td><code>MoxiQuickAction</code>, <code>MOXI_QUICK_ACTIONS</code></td></tr>
                <tr><td>نوع السياق المُنسَّق</td><td><code>src/domains/moxi/types.ts</code></td><td><code>MoxiFormattedContext</code></td></tr>
                <tr><td>الشخصية الافتراضية</td><td><code>src/domains/moxi/types.ts</code></td><td><code>DEFAULT_MOXI_PERSONA</code></td></tr>
                <tr><td>التصديرات المجمّعة</td><td><code>src/domains/moxi/index.ts</code></td><td>Barrel — كل الأنواع والأدوات والدوال</td></tr>
                <tr><td>سؤال MOXI (API)</td><td><code>src/domains/moxi/functions.ts</code></td><td><code>askMoxi</code> (POST, 25 req/min)</td></tr>
                <tr><td>تحديث الشخصية (API)</td><td><code>src/domains/moxi/functions.ts</code></td><td><code>updateMoxiPersona</code> (POST)</td></tr>
                <tr><td>جلب الشخصية (API)</td><td><code>src/domains/moxi/functions.ts</code></td><td><code>getMoxiPersonaFn</code> (GET)</td></tr>
                <tr><td>جلب الرؤى (API)</td><td><code>src/domains/moxi/functions.ts</code></td><td><code>getMoxiInsights</code> (GET)</td></tr>
                <tr><td>محرك السياق</td><td><code>src/domains/moxi/context-engine.ts</code></td><td><code>buildMoxiContext(userId, supabase)</code></td></tr>
                <tr><td>مولّد الطلب الذكي</td><td><code>src/domains/moxi/prompt.ts</code></td><td><code>buildMoxiSystemPrompt(persona, ctx)</code></td></tr>
                <tr><td>إدارة الشخصية (DB)</td><td><code>src/domains/moxi/persona.ts</code></td><td><code>getMoxiPersona</code>, <code>updateMoxiPersona</code></td></tr>
                <tr><td>متغيرات المظهر</td><td><code>src/domains/moxi/persona.ts</code></td><td><code>AVATAR_VARIANTS</code> (8 متغيرات)</td></tr>
                <tr><td>سجل الأدوات</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>MOXI_TOOLS</code> (7 أدوات)</td></tr>
                <tr><td>أداة تحليل الزوج</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>analyzePair</code></td></tr>
                <tr><td>أداة تتبع الإشارة</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>trackSignal</code></td></tr>
                <tr><td>أداة التنبيه السعري</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>createPriceAlert</code></td></tr>
                <tr><td>أداة ملخص السوق</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>getMarketSummary</code></td></tr>
                <tr><td>أداة المحفظة</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>getPortfolio</code></td></tr>
                <tr><td>أداة قائمة المراقبة</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>getWatchlist</code></td></tr>
                <tr><td>أداة حالة الإشارة</td><td><code>src/domains/moxi/tools.ts</code></td><td><code>getSignalStatus</code></td></tr>
                <tr><td>كشف التعرّض المفرط</td><td><code>src/domains/moxi/notification-hub.ts</code></td><td><code>detectOverexposure</code></td></tr>
                <tr><td>كشف قرب الإشارة</td><td><code>src/domains/moxi/notification-hub.ts</code></td><td><code>detectSignalProximity</code></td></tr>
                <tr><td>كشف مخاطر الأحداث</td><td><code>src/domains/moxi/notification-hub.ts</code></td><td><code>detectEventRisk</code></td></tr>
                <tr><td>توليد الرؤى الاستباقية</td><td><code>src/domains/moxi/notification-hub.ts</code></td><td><code>generateMoxiInsights</code></td></tr>
                <tr><td>البث المباشر (SSE)</td><td><code>src/app/api/copilot-stream/route.ts</code></td><td><code>agent: "moxi"</code></td></tr>
                <tr><td>مكون المظهر</td><td>واجهة المستخدم</td><td><code>MoxiAvatar</code> (variant, size)</td></tr>
                <tr><td>جدول قاعدة البيانات</td><td>Supabase Migration</td><td><code>moxi_personas</code> (RLS + Triggers)</td></tr>
            </tbody>
        </table>
        <div class="callout">
            <div class="callout-title">📍 ملخص الملفات</div>
            <div class="callout-body">
                <code>types.ts</code> — 6 أنواع + 2 ثوابت افتراضية<br>
                <code>index.ts</code> — تصدير مجمّع لكل شيء<br>
                <code>functions.ts</code> — 4 دوال خادمية (3 POST + 1 GET)<br>
                <code>context-engine.ts</code> — 1 دالة رئيسية + 9 دوال جلب فرعية<br>
                <code>prompt.ts</code> — 1 دالة بناء الطلب الذكي<br>
                <code>persona.ts</code> — 2 دالة DB + 1 مصفوفة متغيرات<br>
                <code>tools.ts</code> — 1 سجل أدوات (7 أدوات)<br>
                <code>notification-hub.ts</code> — 3 دوال كشف + 1 دالة توليد<br>
                <strong>المجموع: 8 ملفات، 25+ دالة/تصدير</strong>
            </div>
        </div>
        """
    },
]


def main():
    print("Generating MOXI_BIBLE HTML...")
    html = generate_vixor_html(
        title=TITLE,
        subtitle=SUBTITLE,
        doc_id=DOC_ID,
        chapters=chapters,
        footer_text=FOOTER,
    )
    html_path = save_html(html, "MOXI_BIBLE.html")
    print(f"HTML saved: {html_path}")

    print("Converting to PDF...")
    skill_dir = "/home/z/my-project/skills/pdf"
    pdf_path = convert_to_pdf(html_path, "MOXI_BIBLE.pdf", skill_dir)
    print(f"PDF saved: {pdf_path}")
    print("DONE — MOXI_BIBLE.pdf generated successfully.")


if __name__ == "__main__":
    main()
