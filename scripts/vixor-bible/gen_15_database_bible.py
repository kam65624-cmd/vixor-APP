"""VIXOR-DBB-001 — إجيل قاعدة البيانات
Generate the complete DATABASE_BIBLE PDF for VIXOR.
41 tables, 8 functions, 11 triggers, 100+ RLS policies.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf

SKILL_DIR = "/home/z/my-project/skills/pdf"

# ─── Helper ──────────────────────────────────────────────────────────────
def tbl(cols):
    """Build a vixor-table HTML string. cols = [(header, rows), ...]"""
    ths = "".join(f"<th>{h}</th>" for h, _ in cols)
    rows_html = ""
    max_len = max(len(r) for _, r in cols)
    for i in range(max_len):
        cells = ""
        for _, r in cols:
            val = r[i] if i < len(r) else ""
            cells += f"<td>{val}</td>"
        rows_html += f"<tr>{cells}</tr>"
    return f'<table class="vixor-table"><thead><tr>{ths}</tr></thead><tbody>{rows_html}</tbody></table>'


def table_section(title, description, cols):
    """A subsection with title, description paragraph, and a table."""
    return f"""
<div class="subsection">
    <div class="subsection-title">{title}</div>
    <p class="body-text">{description}</p>
    {tbl(cols)}
</div>"""


# ─── Chapter 1 ───────────────────────────────────────────────────────────
ch1 = """
<p class="body-text">
تعتمد منظومة فيكسور الهندسية بالكامل على قاعدة بيانات <strong>PostgreSQL</strong> المُستضافة عبر منصة <strong>Supabase</strong>. تمثل قاعدة البيانات العمود الفقري لجميع عمليات المنظومة، من إدارة المستخدمين والتحليل الفني وحتى محادثات الذكاء الاصطناعي واكتشاف العملات الرقمية الجديدة. يتكون المخطط من <strong>41 جدولاً</strong> مُنظّماً عبر سلسلة من ملفات الهجرة (Migrations) بدءاً من الإصدار <code>004</code> وحتى <code>20260715</code>، بالإضافة إلى <strong>8 وظائف مخزّنة</strong> (Stored Functions) و<strong>11 زناداً</strong> (Triggers) و<strong>أكثر من 100 سياسة أمان صف</strong> (Row-Level Security Policies) تضمن عزل بيانات كل مستخدم عن الآخرين.
</p>
<p class="body-text">
تتميز قاعدة البيانات باستخدام أنواع البيانات المتقدمة مثل <code>JSONB</code> لتخزين البيانات شبه المنظمة مثل مناطق السيولة والهيكل السعري، ومصفوفات النصوص <code>TEXT[]</code> لتخزين الأسباب والوسوم، وأعمدة مُولّدة دائماً <code>GENERATED ALWAYS</code> لحساب الربح ونسبة المخاطرة تلقائياً. كذلك يتم استخدام قيود التحقق <code>CHECK</code> على أعمدة الحالة والاتجاه لضمان سلامة البيانات على مستوى قاعدة البيانات نفسها، وليس فقط على مستوى التطبيق.
</p>
<p class="body-text">
يُدار أمان البيانات عبر سياسات أمان الصفوف <strong>RLS</strong> المُفعّلة على جميع الجداول التي تحتوي على بيانات خاصة بالمستخدمين. كل سياسة تضمن أن المستخدم لا يستطيع الوصول إلا إلى بياناته الخاصة، مع استثناءات محددة للخدمات (Service Role) التي تحتاج وصولاً كاملاً لأداء عمليات الصيانة والمعالجة الدفعية. هذا النهج يُعرف بـ "الأمان الافتراضي" حيث يكون كل شيء مغلقاً بشكل افتراضي.
</p>
"""

# ─── Chapter 2 ───────────────────────────────────────────────────────────
ch2 = """
<p class="body-text">
تتوزع جداول قاعدة بيانات فيكسور على خمس مجموعات كبرى تُمثّل المجالات الوظيفية المختلفة للمنظومة. هذا التقسيم يُسهّل فهم العلاقات بين الكيانات ويُساعد في تخطيط التوسع المستقبلي. كل مجموعة تخدم غرضاً محدداً وتحمل علاقات وثيقة مع المجموعات الأخرى عبر مفاتيح أجنبية مُحكمة.
</p>
""" + tbl([
    ("المجموعة", ["النواة الأساسية للمستخدم", "التداول والتحليل", "الذكاء الاصطناعي", "الاكتشاف والبيانات السوقية", "البنية التحتية والخدمات"]),
    ("الجداول", ["profiles, user_settings, user_memories, user_streaks, points_balances, moxi_personas", "analyses, trades, daily_signals, signal_tracking, price_alerts, trading_notes", "copilot_conversations, copilot_messages, domain_events, vixor_decisions, user_strategies, strategies", "memecoin_discoveries, social_signals, pairs, news_cache, price_history", "wallet_sessions, web3_transactions, nft_badges, payments, agent_tokens, agent_jobs, agent_audit_log, notifications, arbitrage_opportunities, arbitrage_executions, arbitrage_bot_stats, experiments, experiment_generations, broker_connections, watchlists, watchlist_items"]),
    ("العدد", ["6", "6", "6", "5", "18"]),
]) + """
<p class="body-text">
ترتبط جميع المجموعات تقريباً بجدول <strong>profiles</strong> عبر مفتاح <code>user_id</code> الذي يُمثّل الرابط الأساسي بين المستخدم وبياناته. كما ترتبط بعض الجداول مباشرة بـ <code>auth.users</code> وهو جدول إدارة الهوية المُدمج في Supabase. هذا التصميم يُتيح الاستعلامات السريعة ويضمن التسلسل الهرمي الصحيح للبيانات.
</p>
"""

# ─── Chapter 3: User Core Tables ───────────────────────────────────────
ch3 = """
<p class="body-text">
تُشكّل جداول النواة الأساسية للمستخدم الأساس الذي تُبنى عليه جميع الوظائف الأخرى في المنظومة. يبدأ كل شيء بجدول <strong>profiles</strong> الذي يرتبط بجدول <code>auth.users</code> المُدمج في Supabase ويُضيف حقولاً مخصصة لتتبع مستوى المستخدم وخبرته ونقاطه. تتولى بقية الجداول تخزين الإعدادات الشخصية والذكريات المُستخرجة من التفاعلات، وسلسلة الأيام المتتالية، ورصيد النقاط، وشخصية المساعد الذكي المُخصّصة لكل مستخدم.
</p>
""" + \
table_section(
    "profiles — الملف الشخصي",
    "الجدول المركزي للمستخدم. يرتبط بـ <code>auth.users</code> عبر <code>id</code> ويحتوي على جميع مقاييس التقدم والأداء. يتضمن حقولاً مُولّدة مثل مستوى المستخدم ودرجات الكفاءة الأربعة.",
    [
        ("العمود", ["id", "display_name", "xp", "is_premium", "total_xp", "level", "technical_analysis_score", "risk_management_score", "psychology_score", "trade_management_score"]),
        ("النوع", ["UUID PK → auth.users.id", "TEXT", "INT DEFAULT 0", "BOOLEAN DEFAULT false", "INT DEFAULT 0", "INT GENERATED ALWAYS AS (total_xp/1000)", "REAL DEFAULT 0", "REAL DEFAULT 0", "REAL DEFAULT 0", "REAL DEFAULT 0"]),
    ]
) + \
table_section(
    "user_settings — إعدادات المستخدم",
    "إعدادات المستخدم التفضيلية. يستخدم <code>user_id</code> كمفتاح أساسي مرتبط بـ <code>auth.users</code>. يخزن قنوات الإشعارات ومفاتيح API وبيانات الاتصال الخارجية في حقول <code>JSONB</code>.",
    [
        ("العمود", ["user_id", "notification_channels", "preferred_llm_provider", "llm_api_keys", "telegram_chat_id", "webhook_url", "webhook_secret", "exchange_credentials"]),
        ("النوع", ["UUID PK → auth.users.id", "JSONB", "TEXT", "JSONB", "BIGINT", "TEXT", "TEXT", "JSONB"]),
    ]
) + \
table_section(
    "user_memories — ذكريات المستخدم",
    "يخزن المعلومات المُستخرجة من تفاعلات المستخدم مع المنظومة، مثل تفضيلاته وسلوكياته وأخطائه وخططه. يحتوي على قيد فريد مُركّب <code>UNIQUE(user_id, category, key)</code> لمنع التكرار.",
    [
        ("العمود", ["id", "user_id", "category", "key", "value", "confidence", "source"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "CHECK(preference/behavior/mistake/insight/strategy)", "TEXT", "JSONB", "REAL", "TEXT"]),
    ]
) + \
table_section(
    "user_streaks — سلاسل الأيام المتتالية",
    "يتتبع سلسلة الأيام المتتالية التي أكمل فيها المستخدم مراجعة نهاية اليوم. يحتوي على قيد <code>UNIQUE(user_id)</code> لضمان سجل واحد لكل مستخدم.",
    [
        ("العمود", ["id", "user_id", "current_streak", "longest_streak", "last_completed_date"]),
        ("النوع", ["UUID PK", "UUID FK → profiles UNIQUE", "INT DEFAULT 0", "INT DEFAULT 0", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "points_balances — رصيد النقاط",
    "يرتبط بجدول <code>profiles</code> عبر <code>user_id</code> كمفتاح أساسي. يتتبع الرصيد الحالي وإجمالي النقاط المكتسبة عبر تاريخ المستخدم. يُحدَّث عند شراء حزم النقاط أو إنفاقها.",
    [
        ("العمود", ["user_id", "balance", "lifetime_earned"]),
        ("النوع", ["UUID PK → profiles.id", "INT DEFAULT 0", "INT DEFAULT 0"]),
    ]
) + \
table_section(
    "moxi_personas — شخصية المساعد الذكي",
    "يُخزّن إعدادات شخصية المساعد الذكي MOXI المخصصة لكل مستخدم. يستخدم <code>user_id</code> كمفتاح أساسي مرتبط بـ <code>auth.users</code>. يتضمن أسلوب التواصل والمظهر وبيانات الخبرة.",
    [
        ("العمود", ["user_id", "name", "personality", "expertise", "communication_style", "avatar_variant", "nft_token_id", "is_customized"]),
        ("النوع", ["UUID PK → auth.users.id", "TEXT DEFAULT 'MOXI'", "TEXT", "JSONB", "CHECK(formal/casual/mixed)", "CHECK(default/bull/bear/crystal/flame/ocean/phantom/nova)", "TEXT", "BOOLEAN DEFAULT false"]),
    ]
)

# ─── Chapter 4: Trading Tables ──────────────────────────────────────────
ch4 = """
<p class="body-text">
تُمثّل جداول التداول قلب منظومة فيكسور النابض. تتعامل هذه الجداول مع التحليل الفني المُفصّل وتسجيل الصفقات وتتبع الإشارات اليومية ومراقبة الأسعار. يتميز هذا المجال باستخدام قيود تحقق صارمة على أعمدة الحالة والاتجاه، وأعمدة مُولّدة دائماً لحساب الربح تلقائياً، ومصفوفات JSONB لتخزين مناطق السيولة والهيكل السعري بتنسيق مرن.
</p>
""" + \
table_section(
    "analyses — التحليلات الفنية",
    "جدول التحليلات المُفصّل الذي يخزن كل تحليل فني يُجريه المستخدم أو المساعد الذكي. يتضمن حقول <code>JSONB</code> متعددة للهيكل السعري ومناطق السيولة والمستويات الرئيسية، بالإضافة إلى شارة الإشارة <code>signal_badge</code>.",
    [
        ("العمود", ["id", "user_id", "pair", "timeframe", "recommendation", "confidence", "entry", "stop_loss", "take_profit", "image_path", "market_structure", "liquidity_zones", "key_levels", "trend", "risk_level", "risk_reasons", "invalidation_level", "source", "opportunity_id", "signal_badge", "vixor_message"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "TEXT", "TEXT (recommendation_type ENUM)", "NUMERIC(5,2)", "NUMERIC", "NUMERIC", "NUMERIC", "TEXT", "JSONB", "JSONB", "JSONB", "TEXT", "TEXT", "TEXT[]", "NUMERIC", "TEXT", "UUID", "JSONB", "TEXT"]),
    ]
) + \
table_section(
    "trades — الصفقات",
    "يسجّل كل صفقة يُنفّذها المستخدم مع حسابات تلقائية للربح. يحتوي على أعمدة <code>GENERATED ALWAYS</code> لـ <code>pnl</code> و<code>pnl_pips</code> و<code>r_multiple</code>. يستخدم قيود <code>CHECK</code> على الاتجاه والحالة.",
    [
        ("العمود", ["id", "user_id", "pair", "direction", "status", "entry_price", "entry_date", "quantity", "exit_price", "exit_date", "stop_loss", "take_profit", "pnl", "pnl_pips", "r_multiple", "notes", "tags", "strategy", "analysis_id"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "CHECK(long/short)", "CHECK(open/closed/cancelled)", "NUMERIC", "TIMESTAMPTZ", "NUMERIC", "NUMERIC", "TIMESTAMPTZ", "NUMERIC", "NUMERIC", "NUMERIC GENERATED ALWAYS", "NUMERIC GENERATED ALWAYS", "NUMERIC GENERATED ALWAYS", "TEXT", "TEXT[]", "TEXT", "UUID FK → analyses"]),
    ]
) + \
table_section(
    "daily_signals — الإشارات اليومية",
    "يخزن الإشارات اليومية المُولّدة للجميع مع قيد <code>CHECK</code> على نوع التوصية. يتضمن مصفوفة <code>take_profit NUMERIC[]</code> لدعم مستويات أخذ الربح المتعددة ومصفوفة <code>reasons TEXT[]</code> للأسباب.",
    [
        ("العمود", ["id", "pair", "timeframe", "recommendation", "confidence", "entry", "stop_loss", "take_profit", "reasons", "pattern", "market_structure", "liquidity_zones", "signal_date"]),
        ("النوع", ["UUID PK", "TEXT", "TEXT", "CHECK(BUY/SELL/WAIT)", "NUMERIC(5,2)", "NUMERIC", "NUMERIC", "NUMERIC[]", "TEXT[]", "TEXT", "JSONB", "JSONB", "DATE"]),
    ]
) + \
table_section(
    "signal_tracking — تتبع الإشارات",
    "يربط المستخدمين بالإشارات اليومية لتتبع أدائها في الوقت الفعلي. يستخدم نوع <code>signal_status</code> المُخصّص الذي يشمل ثماني حالات من المعلّق حتى الإلغاء. يتتبع أقصى تحرك مواتٍ ومعاكس.",
    [
        ("العمود", ["id", "user_id", "signal_id", "source_type", "pair", "direction", "entry_price", "stop_loss", "take_profit", "status", "current_price", "previous_price", "max_favorable_excursion", "max_adverse_excursion", "hit_tp", "activated_at", "resolved_at", "expires_at"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "UUID FK → daily_signals", "TEXT", "TEXT", "CHECK(BUY/SELL/WAIT)", "NUMERIC", "NUMERIC", "JSONB", "signal_status ENUM (8 حالات)", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "INT", "TIMESTAMPTZ", "TIMESTAMPTZ", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "price_alerts — تنبيهات الأسعار",
    "يتتبع تنبيهات الأسعار التي يُعيّنها المستخدم مع قيود <code>CHECK</code> على الشرط والحالة. يدعم أربعة شروط: أعلى من، أسفل من، يتقاطع صاعداً، يتقاطع نازلاً.",
    [
        ("العمود", ["id", "user_id", "symbol", "pair", "condition", "target_price", "current_price", "status", "triggered_at", "note", "timeframe"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "TEXT", "CHECK(above/below/crosses_up/crosses_down)", "NUMERIC", "NUMERIC", "CHECK(active/triggered/cancelled)", "TIMESTAMPTZ", "TEXT", "TEXT"]),
    ]
) + \
table_section(
    "trading_notes — ملاحظات التداول",
    "مذكرة يومية للمستخدم لتسجيل أفكاره وتحليلاته حول السوق. يتضمن حقل المزاج <code>mood</code> بأربعة قيم ومصفوفة الوسوم <code>tags</code> وعلامة التثبيت <code>is_pinned</code>.",
    [
        ("العمود", ["id", "user_id", "pair", "analysis_id", "title", "content", "tags", "mood", "is_pinned"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "UUID FK → analyses", "TEXT", "TEXT", "TEXT[]", "CHECK(confident/cautious/anxious/neutral)", "BOOLEAN DEFAULT false"]),
    ]
)

# ─── Chapter 5: AI Tables ───────────────────────────────────────────────
ch5 = """
<p class="body-text">
تُمثّل جداول الذكاء الاصطناعي العقل المدبر لمنظومة فيكسور. تتضمن محادثات المساعد الذكي المُتعددة الوكلاء مع سجل الرسائل التفصيلي، وأحداث النطاق المُهيكلة لتتبع تدفق العمليات، وقرارات وكلاء فيكسور الأربعة (المدرب، المحلل، الحاكم، الصياد)، بالإضافة إلى استراتيجيات التداول الآلية.
</p>
""" + \
table_section(
    "copilot_conversations — محادثات المساعد الذكي",
    "كل محادثة مع المساعد الذكي تُمثّل سجلاً هنا. يدعم محادثات الإجماع عبر <code>is_consensus</code> وربطها بوكيل محدد عبر <code>agent_id</code>.",
    [
        ("العمود", ["id", "user_id", "title", "agent_id", "is_consensus"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "TEXT", "BOOLEAN DEFAULT false"]),
    ]
) + \
table_section(
    "copilot_messages — رسائل المساعد الذكي",
    "تخزّن كل رسالة في المحادثة مع بيانات وصفية في <code>metadata JSONB</code>. يتم تسمية المحادثة تلقائياً من أول رسالة عبر الزناد <code>copilot_messages_auto_title</code>.",
    [
        ("العمود", ["id", "conversation_id", "role", "content", "agent_id", "metadata"]),
        ("النوع", ["UUID PK", "UUID FK → copilot_conversations", "CHECK(user/assistant/system)", "TEXT", "TEXT", "JSONB"]),
    ]
) + \
table_section(
    "domain_events — أحداث النطاق",
    "سجل أحداث مركزي يُسجّل كل حدث مهم في المنظومة مع حمولة <code>JSONB</code> ومعرّف التتبع <code>trace_id</code> لربط الأحداث المترابطة عبر الخدمات المختلفة.",
    [
        ("العمود", ["id", "event_type", "payload", "source", "trace_id"]),
        ("النوع", ["UUID PK", "TEXT", "JSONB", "TEXT", "TEXT"]),
    ]
) + \
table_section(
    "vixor_decisions — قرارات وكلاء فيكسور",
    "يُسجّل قرارات الوكلاء الأربعة (المدرب coach، المحلل analyst، الحاكم governor، الصياد hunter) مع نوع القرار ومستوى الخطورة وتغذية راجعة من المستخدم. يدعم مساحات عمل متعددة.",
    [
        ("العمود", ["id", "user_id", "agent_id", "decision_type", "title", "description", "data", "confidence", "feedback", "expires_at", "workspace", "token_symbol", "chain", "severity"]),
        ("النوع", ["TEXT PK", "TEXT FK → auth.users", "CHECK(coach/analyst/governor/hunter)", "CHECK(suggestion/warning/block/alert/report)", "TEXT", "TEXT", "JSONB", "REAL", "CHECK(accepted/rejected/dismissed/expired)", "TIMESTAMPTZ", "CHECK(os/bullx/axiom/opensea)", "TEXT", "TEXT", "CHECK(low/medium/high/critical)"]),
    ]
) + \
table_section(
    "user_strategies — استراتيجيات المستخدم",
    "تخزّن استراتيجيات التداول المُخصصة لكل مستخدم مع أزواج التداول المفضلة والإطارات الزمنية وأسلوب التداول وتحمل المخاطر. تدعم مصفوفات النصوص لحقول متعددة القيم.",
    [
        ("العمود", ["id", "user_id", "name", "pairs", "trading_style", "risk_tolerance", "preferred_timeframes", "is_active"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "TEXT[]", "TEXT", "TEXT", "TEXT[]", "BOOLEAN DEFAULT true"]),
    ]
) + \
table_section(
    "strategies — استراتيجيات التداول الآلي",
    "تخزّن استراتيجيات التداول الآلي مع الكود البرمجي ومقاييس الأداء مثل نسبة العائد <code>return_pct</code> ومعامل شارب <code>sharpe</code> ونسبة الفوز <code>win_rate</code>. تدعم حالات متعددة للتشغيل.",
    [
        ("العمود", ["id", "user_id", "name", "description", "code", "status", "last_run_at", "return_pct", "sharpe", "win_rate", "trades_count"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "TEXT", "TEXT", "TEXT", "CHECK(running/idle/failed)", "TIMESTAMPTZ", "NUMERIC", "NUMERIC", "NUMERIC", "INT"]),
    ]
)

# ─── Chapter 6: Discovery & Data Tables ─────────────────────────────────
ch6 = """
<p class="body-text">
تختص جداول الاكتشاف والبيانات السوقية بجمع وتخزين البيانات التي تُغذّي عملية اتخاذ القرار في فيكسور. تشمل اكتشاف العملات الرقمية الجديدة مع نظام تسجيل مُتقدم، وإشارات التواصل الاجتماعي من مصادر متعددة، وقوائم الأزواج المتداولة مع بياناتها الأساسية، وذاكرة مؤقتة للأخبار، وسجل الأسعار التاريخي.
</p>
""" + \
table_section(
    "memecoin_discoveries — اكتشافات الميمكوين",
    "يخزن العملات الرقمية المُكتشفة مع نظام تسجيل مُتقدم يتضمن أربعة درجات (ذكاء الأموال، اجتماعي، سيولة، عُمر) ودرجة اكتشاف شاملة. يحتوي على قيد فريد <code>UNIQUE(token_address, chain)</code> لمنع التكرار.",
    [
        ("العمود", ["id", "user_id", "token_address", "symbol", "name", "chain", "price", "change_24h", "volume_24h", "liquidity", "market_cap", "discovery_score", "smart_money_score", "social_score", "liquidity_score", "age_score", "risk_level", "nft_badge", "raw_data", "scanned_at"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "TEXT", "TEXT", "TEXT", "TEXT", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "REAL", "REAL", "REAL", "REAL", "REAL", "CHECK(low/medium/high)", "TEXT", "JSONB", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "social_signals — إشارات التواصل الاجتماعي",
    "يُجمّع بيانات الإشارات الاجتماعية من أربعة مصادر (تويتر، تيليجرام، ريديت، LunarCrush) مع نافذة زمنية محددة لكل فترة جمع. يتتبع عدد الإشارات والمشاعر والتفاعل وتأثير المؤثرين.",
    [
        ("العمود", ["id", "token_symbol", "source", "mentions", "sentiment", "engagement", "influencer_score", "window_start", "window_end"]),
        ("النوع", ["UUID PK", "TEXT", "CHECK(twitter/telegram/reddit/lunarcrush)", "INT", "REAL", "REAL", "REAL", "TIMESTAMPTZ", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "pairs — الأزواج المتداولة",
    "القائمة الرئيسية للأزواج المتداولة المدعومة في المنظومة. يدعم خمس فئات (فوركس، عملات رقمية، معادن، أسهم، مؤشرات) مع بيانات الأس مثل عدد الخانات العشرية وحالة التفعيل.",
    [
        ("العمود", ["id", "symbol", "label", "category", "decimals", "is_active"]),
        ("النوع", ["UUID PK", "TEXT UNIQUE", "TEXT", "CHECK(forex/crypto/metal/stock/index)", "INT DEFAULT 5", "BOOLEAN DEFAULT true"]),
    ]
) + \
table_section(
    "news_cache — ذاكرة الأخبار المؤقتة",
    "تخزّن الأخبار المُجمّعة مؤقتاً مع تصنيف المشاعر (صاعد/هابط/محايد). تُستخدم لتغذية التحليلات والإشارات بآخر الأخبار المؤثرة على السوق.",
    [
        ("العمود", ["id", "symbol", "category", "headline", "summary", "source", "url", "datetime", "sentiment"]),
        ("النوع", ["UUID PK", "TEXT", "TEXT", "TEXT", "TEXT", "TEXT", "TEXT", "TIMESTAMPTZ", "CHECK(bullish/bearish/neutral)"]),
    ]
) + \
table_section(
    "price_history — تاريخ الأسعار",
    "يخزن بيانات الشموع اليابانية التاريخية مع قيد فريد مُركّب <code>UNIQUE(pair, timeframe, timestamp)</code> لمنع تكرار البيانات. يدعم جميع الإطارات الزمنية المُستخدمة في التحليل الفني.",
    [
        ("العمود", ["id", "pair", "timeframe", "timestamp", "open", "high", "low", "close", "volume"]),
        ("النوع", ["UUID PK", "TEXT", "TEXT", "TIMESTAMPTZ", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC"]),
    ]
)

# ─── Chapter 7: Infrastructure Tables ───────────────────────────────────
ch7 = """
<p class="body-text">
تُشكّل جداول البنية التحتية العمود الفقري التشغيلي لمنظومة فيكسور. تغطي هذه المجموعة ثمانية عشر جدولاً تتراوح بين إدارة المحافظ الرقمية والمعاملات اللامركزية، ونظام الدفع والاشتراكات، والوكلاء الخارجيين مع سجل تدقيقهم، والإشعارات متعددة القنوات، ومحرك المراجحة مع إحصائياته، ونظام التجارب التطوري، واتصالات الوسطاء، وقوائم المراقبة.
</p>
""" + \
table_section(
    "watchlists — قوائم المراقبة",
    "تخزّن قوائم المراقبة المُخصصة لكل مستخدم. يدعم قائمة افتراضية واحدة عبر <code>is_default</code> مع ترتيب مخصص. يتم إنشاء قائمة افتراضية تلقائياً عند إنشاء الملف الشخصي.",
    [
        ("العمود", ["id", "user_id", "name", "is_default", "sort_order"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "TEXT", "BOOLEAN DEFAULT false", "INT DEFAULT 0"]),
    ]
) + \
table_section(
    "watchlist_items — عناصر قوائم المراقبة",
    "يربط الأزواج بقوائم المراقبة مع إمكانية إضافة ملاحظات وتصنيفات وترتيب مخصص لكل عنصر.",
    [
        ("العمود", ["id", "watchlist_id", "pair", "category", "notes", "sort_order"]),
        ("النوع", ["UUID PK", "UUID FK → watchlists", "TEXT", "TEXT", "TEXT", "INT DEFAULT 0"]),
    ]
) + \
table_section(
    "notifications — الإشعارات",
    "نظام إشعارات متعدد القنوات يدعم التخزين المؤقت وتتبع حالة الإرسال. يحتوي على حمولة <code>JSONB</code> قابلة للتوسيع وحقول لتتبع وقت الإرسال والأخطاء. تم توسيعه في هجرة <code>20260618</code>.",
    [
        ("العمود", ["id", "user_id", "title", "body", "type", "read_at", "created_at", "channel", "payload", "status", "sent_at", "error"]),
        ("النوع", ["UUID PK", "UUID", "TEXT", "TEXT", "TEXT", "TIMESTAMPTZ", "TIMESTAMPTZ DEFAULT now()", "TEXT", "JSONB", "TEXT", "TIMESTAMPTZ", "TEXT"]),
    ]
) + \
table_section(
    "point_packs — حزم النقاط",
    "تُعرّف حزم النقاط المتاحة للشراء مع السعر والنقاط الإضافية ك bonus. يرتبط بها جدول <code>payments</code> عبر <code>pack_id</code>.",
    [
        ("العمود", ["id", "name", "points", "price_cents", "bonus_points", "badge"]),
        ("النوع", ["UUID PK", "TEXT", "INT", "INT", "INT DEFAULT 0", "TEXT"]),
    ]
) + \
table_section(
    "payments — المدفوعات",
    "يسجّل عمليات الدفع عبر تيليجرام مع ربطها بحزم النطاقات. يستخدم <code>telegram_charge_id UNIQUE</code> لمنع التكرار ويدعم حالات متعددة للمعاملة.",
    [
        ("العمود", ["id", "user_id", "telegram_charge_id", "payload", "amount_stars", "pack_id", "plan_id", "status", "telegram_invoice_url", "confirmed_at"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "TEXT UNIQUE", "JSONB", "INT", "UUID FK → point_packs", "TEXT", "CHECK(pending/confirmed/failed)", "TEXT", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "daily_loops — حلقات اليوم التداولي",
    "يُسجّل روتين اليوم التداولي الكامل: التحضير الصباحي، وجلسات لندن ونيويورك وآسيا، ومراجعة نهاية اليوم. يتضمن الحالة العاطفية والدروس المُستفادة ونسبة الإنجاز.",
    [
        ("العمود", ["id", "user_id", "date", "morning_prep_completed", "morning_prep_at", "market_bias", "key_levels", "watchlist_reviewed", "london_session_traded", "london_session_notes", "ny_session_traded", "ny_session_notes", "asian_session_traded", "asian_session_notes", "eod_review_completed", "eod_review_at", "daily_pnl", "trades_taken", "rules_followed", "rules_broken", "emotional_state", "lessons_learned", "tomorrow_plan", "completion_percentage"]),
        ("النوع", ["UUID PK", "UUID FK → profiles", "DATE UNIQUE", "BOOLEAN", "TIMESTAMPTZ", "TEXT", "TEXT", "BOOLEAN", "BOOLEAN", "TEXT", "BOOLEAN", "TEXT", "BOOLEAN", "TEXT", "BOOLEAN", "TIMESTAMPTZ", "NUMERIC", "INT", "INT", "INT", "CHECK(disciplined/anxious/fomo/revenge/calm/tired)", "TEXT", "TEXT", "INT"]),
    ]
) + \
table_section(
    "wallet_sessions — جلسات المحافظ الرقمية",
    "يُدارة جلسات اتصال المحافظ الرقمية مع دعم سلسلتي Solana وEVM. يستخدم <code>id TEXT PK</code> لتوافقية مع معرّفات الجلسات الخارجية مع قيود فريدة.",
    [
        ("العمود", ["id", "user_id", "wallet_address", "chain", "session_token", "expires_at", "ip_address", "user_agent", "is_active"]),
        ("النوع", ["TEXT PK", "TEXT FK → auth.users", "TEXT", "CHECK(solana/evm)", "TEXT", "TIMESTAMPTZ", "TEXT", "TEXT", "BOOLEAN DEFAULT true"]),
    ]
) + \
table_section(
    "web3_transactions — معاملات الويب 3",
    "يخزن جميع المعاملات اللامركزية مع دعم ستة أنواع (تبديل، تحويل، شراء/بيع NFT، رهن، فك رهن). يتتبع أسعار الدخول والخروج بالدولار مع رسوم الغاز والمنصة المُستخدمة.",
    [
        ("العمود", ["id", "user_id", "wallet_address", "chain", "type", "tx_signature", "status", "input_token", "output_token", "input_amount", "output_amount", "input_usd", "output_usd", "gas_paid", "venue", "metadata", "confirmed_at"]),
        ("النوع", ["TEXT PK", "TEXT FK → auth.users", "TEXT", "CHECK(solana/evm)", "CHECK(swap/transfer/nft_buy/nft_sell/stake/unstake)", "TEXT", "CHECK(pending/confirmed/failed/reverted)", "TEXT", "TEXT", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "TEXT", "JSONB", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "nft_badges — شارات NFT",
    "يربط المستخدمين بشارات NFT مُحددة مع دعم سلسلتي Solana وEVM. يحتوي على قيد فريد <code>UNIQUE(user_id, chain)</code> لضمان شارة واحدة لكل سلسلة لكل مستخدم.",
    [
        ("العمود", ["id", "user_id", "badge_type", "chain", "nft_mint", "nft_name", "nft_image_url", "verified_at", "metadata"]),
        ("النوع", ["TEXT PK", "TEXT FK → auth.users", "CHECK(none/nft/collection/verified)", "CHECK(solana/evm)", "TEXT", "TEXT", "TEXT", "TIMESTAMPTZ", "JSONB"]),
    ]
) + \
table_section(
    "agent_tokens — رموز الوكلاء",
    "يُدير رموز المصادقة للوكلاء الخارجيين مع نطاقات صلاحيات محددة في <code>scopes TEXT[]</code>. يخزن تجزئة الرمز <code>token_hash</code> وليس الرمز نفسه لأغراض أمنية مع وقت انتهاء الصلاحية.",
    [
        ("العمود", ["id", "user_id", "token_hash", "scopes", "name", "last_used_at", "expires_at"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "TEXT UNIQUE", "TEXT[]", "TEXT", "TIMESTAMPTZ", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "agent_jobs — مهام الوكلاء",
    "يخزن المهام المُنفّذة بواسطة الوكلاء مع تتبع التقدم والنتائج والأخطاء. يدعم خمس حالات من المُعلّق حتى المُلغى مع نتيجة <code>JSONB</code> قابلة للتوسيع.",
    [
        ("العمود", ["id", "user_id", "token_id", "status", "progress", "result", "error"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "UUID FK → agent_tokens", "CHECK(queued/running/done/failed/cancelled)", "INT DEFAULT 0", "JSONB", "TEXT"]),
    ]
) + \
table_section(
    "agent_audit_log — سجل تدقيق الوكلاء",
    "يُسجّل كل طلب يُنفذه الوكيل مع تفاصيل المسار والطريقة ورمز الحالة ومدة التنفيذ بالمللي ثانية. يُستخدم للمراجعة الأمنية وتصحيح الأخطاء.",
    [
        ("العمود", ["id", "user_id", "token_id", "route", "method", "status", "duration_ms"]),
        ("النوع", ["UUID PK", "UUID", "UUID", "TEXT", "TEXT", "INT", "INT"]),
    ]
) + \
table_section(
    "arbitrage_opportunities — فرص المراجحة",
    "يخزن فرص المراجحة المُكتشفة مع ثلاث استراتيجيات (عبر DEX، مثلثية، CEX-DEX). يحتوي على تفاصيل الأرجل وتقديرات الغاز والأرباح الصافية والخام بالنقاط الأساسية.",
    [
        ("العمود", ["id", "user_id", "strategy", "legs", "start_token", "end_token", "input_amount", "expected_output", "gross_profit_bps", "net_profit_bps", "estimated_gas_lamports", "confidence", "detected_at", "expires_at"]),
        ("النوع", ["TEXT PK", "UUID FK → auth.users", "CHECK(cross-dex/triangular/cex-dex)", "JSONB", "JSONB", "JSONB", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "NUMERIC", "REAL", "TIMESTAMPTZ", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "arbitrage_executions — تنفيذيات المراجحة",
    "يسجّل محاولات تنفيذ فرص المراجحة مع تتبع النجاح والفشل والتوقيع الفعلي والربح المحقق. يدعم التشغيل التجريبي عبر <code>dry_run</code>.",
    [
        ("العمود", ["id", "opportunity_id", "user_id", "success", "dry_run", "tx_signature", "actual_output", "profit_lamports", "error"]),
        ("النوع", ["UUID PK", "TEXT FK → arbitrage_opportunities", "UUID FK → auth.users", "BOOLEAN", "BOOLEAN DEFAULT false", "TEXT", "NUMERIC", "NUMERIC", "TEXT"]),
    ]
) + \
table_section(
    "arbitrage_bot_stats — إحصائيات بوت المراجحة",
    "إحصائيات يومية لبوت المراجحة مع قيد فريد <code>UNIQUE(stat_date, mode)</code>. يدعم وضعين (تجريبي وحقيقي) ويتتبع الفشل المتتالي وقاطع الدائرة.",
    [
        ("العمود", ["id", "stat_date", "mode", "total_scans", "opportunities_found", "trades_executed", "trades_succeeded", "total_profit_lamports", "consecutive_failures", "circuit_breaker_open"]),
        ("النوع", ["UUID PK", "DATE", "CHECK(mock/live)", "INT DEFAULT 0", "INT DEFAULT 0", "INT DEFAULT 0", "INT DEFAULT 0", "NUMERIC DEFAULT 0", "INT DEFAULT 0", "BOOLEAN DEFAULT false"]),
    ]
) + \
table_section(
    "experiments — التجارب",
    "يدعم التجارب التطورية مع تكوين ونتائج بصيغة <code>JSONB</code>. يرتبط بجدول الأجيال <code>experiment_generations</code> عبر <code>experiment_id</code>. يدعم أربع حالات.",
    [
        ("العمود", ["id", "user_id", "config", "result", "status", "completed_at"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "JSONB", "JSONB", "CHECK(running/completed/failed/cancelled)", "TIMESTAMPTZ"]),
    ]
) + \
table_section(
    "experiment_generations — أجيال التجارب",
    "يخزن بيانات كل جيل من التجارب التطورية مع أفضل درجة ومتوسط درجة ومصفوفة السكان. يرتبط بجدول <code>experiments</code> عبر <code>experiment_id</code>.",
    [
        ("العمود", ["id", "experiment_id", "generation", "best_score", "avg_score", "population"]),
        ("النوع", ["UUID PK", "UUID FK → experiments", "INT", "JSONB", "JSONB", "JSONB"]),
    ]
) + \
table_section(
    "broker_connections — اتصالات الوسطاء",
    "يُدير اتصالات المستخدم بوسطاء التداول مع قيد فريد <code>UNIQUE(user_id, broker_name)</code> لضمان اتصال واحد لكل وسيط لكل مستخدم. يدعم حالتي الاتصال والانفصال.",
    [
        ("العمود", ["id", "user_id", "broker_name", "status", "connected_at"]),
        ("النوع", ["UUID PK", "UUID FK → auth.users", "TEXT", "CHECK(connected/disconnected)", "TIMESTAMPTZ"]),
    ]
)

# ─── Chapter 8: Functions & Triggers ─────────────────────────────────────
ch8 = """
<p class="body-text">
تُوفّر الوظائف المخزّنة والزنادات طبقة أتمتة أساسية في قاعدة البيانات. تتعامل مع إنشاء البيانات الافتراضية عند تسجيل مستخدم جديد، وتحديث الطوابع الزمنية تلقائياً عند تعديل السجلات، وتسمية المحادثات بناءً على أول رسالة. هذا النهج يُقلّل من العبء على طبقة التطبيق ويضمن تناسق البيانات.
</p>
<h3 style="color:var(--primary-glow);font-size:12pt;margin:18px 0 10px 0;">الوظائف المخزّنة (8 وظائف)</h3>
""" + tbl([
    ("الوظيفة", ["create_default_watchlist()", "update_updated_at()", "auto_title_conversation()", "update_user_memories_updated_at()", "vixor_user_settings_touch_updated_at()", "vixor_agent_jobs_touch_updated_at()", "update_updated_at_column()", "moxi_personas_updated_at()"]),
    ("الغرض", ["إنشاء قائمة مراقبة افتراضية عند إنشاء الملف الشخصي", "تحديث عمود updated_at تلقائياً عند التعديل", "تعيين عنوان المحادثة من أول رسالة", "تحديث updated_at في user_memories", "تحديث updated_at في user_settings", "تحديث updated_at في agent_jobs", "تحديث updated_at في memecoin_discoveries", "تحديث updated_at في moxi_personas"]),
    ("الجداول المستهدفة", ["profiles, watchlists", "trading_notes, trades, copilot_conversations, daily_loops", "copilot_conversations, copilot_messages", "user_memories", "user_settings", "agent_jobs", "memecoin_discoveries", "moxi_personas"]),
]) + """
<h3 style="color:var(--primary-glow);font-size:12pt;margin:22px 0 10px 0;">الزنادات (11 زناداً)</h3>
""" + tbl([
    ("الزناد", ["on_profile_created", "trading_notes_updated_at", "trades_updated_at", "copilot_conversations_updated_at", "copilot_messages_auto_title", "daily_loops_updated_at", "trg_user_settings_touch_updated_at", "trg_agent_jobs_touch_updated_at", "trigger_update_user_memories_updated_at", "memecoin_discoveries_updated_at", "moxi_personas_set_updated_at"]),
    ("الجدول", ["profiles", "trading_notes", "trades", "copilot_conversations", "copilot_messages", "daily_loops", "user_settings", "agent_jobs", "user_memories", "memecoin_discoveries", "moxi_personas"]),
    ("الحدث", ["AFTER INSERT", "BEFORE UPDATE", "BEFORE UPDATE", "BEFORE UPDATE", "AFTER INSERT", "BEFORE UPDATE", "BEFORE UPDATE", "BEFORE UPDATE", "BEFORE UPDATE", "BEFORE UPDATE", "BEFORE UPDATE"]),
    ("الوظيفة", ["create_default_watchlist", "update_updated_at", "update_updated_at", "update_updated_at", "auto_title_conversation", "update_updated_at", "vixor_user_settings_touch_updated_at", "vixor_agent_jobs_touch_updated_at", "update_user_memories_updated_at", "update_updated_at_column", "moxi_personas_updated_at"]),
]) + """
<div class="callout callout-success">
    <div class="callout-title">ملاحظة هندسية</div>
    <div class="callout-body">معظم الزنادات (9 من 11) تُنفّذ قبل التعديل <code>BEFORE UPDATE</code> لتحديث الطوابع الزمنية. زناد واحد يُنفّذ بعد الإدراج <code>AFTER INSERT</code> لإنشاء قائمة المراقبة الافتراضية، وزناد واحد يُنفّذ بعد إدراج الرسائل لتسمية المحادثة.</div>
</div>
"""

# ─── Chapter 9: RLS Policies ─────────────────────────────────────────────
ch9 = """
<p class="body-text">
تُفعّل سياسات أمان الصفوف (Row-Level Security) على جميع الجداول التي تحتوي على بيانات خاصة بالمستخدمين. هذا يضمن أن كل مستخدم لا يستطيع الوصول إلا إلى بياناته الخاصة، بغض النظر عن كيفية الوصول إلى قاعدة البيانات (عبر API أو مباشرة). تُنفّذ السياسات على مستوى محرك قاعدة البيانات نفسه، مما يوفر طبقة حماية لا يمكن تجاوزها من طبقة التطبيق.
</p>
<p class="body-text">
كل جدول يحتوي على مجموعة سياسات تُغطّي العمليات الأساسية: القراءة <code>SELECT</code>، الإدراج <code>INSERT</code>، التعديل <code>UPDATE</code>، والحذف <code>DELETE</code>. تستخدم السياسات الدالة <code>auth.uid()</code> لمقارنة معرّف المستخدم الحالي مع عمود <code>user_id</code> في الجدول. كما توجد سياسات خاصة لدور الخدمة <code>service_role</code> الذي يحصل على صلاحيات كاملة لأداء العمليات الإدارية.
</p>
""" + tbl([
    ("الجدول", ["profiles", "user_settings", "user_memories", "user_streaks", "points_balances", "moxi_personas", "analyses", "trades", "daily_signals", "signal_tracking", "price_alerts", "trading_notes", "copilot_conversations", "copilot_messages", "domain_events", "vixor_decisions", "user_strategies", "strategies", "memecoin_discoveries", "social_signals", "pairs", "news_cache", "price_history", "watchlists", "watchlist_items", "notifications", "point_packs", "payments", "daily_loops", "wallet_sessions", "web3_transactions", "nft_badges", "agent_tokens", "agent_jobs", "agent_audit_log", "arbitrage_opportunities", "arbitrage_executions", "arbitrage_bot_stats", "experiments", "experiment_generations", "broker_connections"]),
    ("RLS مُفعّل", ["✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓", "—", "✓", "✓", "✓", "✓", "✓", "—", "—", "✓", "✓", "✓", "—", "—", "—", "—", "✓", "✓", "✓", "—", "✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓", "✓"]),
    ("السياسات", ["~4", "~4", "~4", "~3", "~3", "~4", "~4", "~4", "قراءة عامة", "~4", "~4", "~4", "~4", "~4", "خدمة فقط", "خدمة فقط", "~4", "~4", "~4", "قراءة عامة", "قراءة عامة", "قراءة عامة", "قراءة عامة", "~4", "~4", "~4", "قراءة عامة", "~4", "~4", "~4", "~4", "~4", "~4", "~4", "~4", "~4", "~4", "~4", "~4"]),
]) + """
<div class="callout callout-warn">
    <div class="callout-title">نمط الأمان الافتراضي</div>
    <div class="callout-body">الجداول التي تحمل علامة "قراءة عامة" مثل <code>daily_signals</code> و<code>pairs</code> و<code>news_cache</code> تسمح للجميع بالقراءة لكن تقيّد التعديل على المالك أو الخدمة فقط. الجداول العامة مثل <code>domain_events</code> و<code>vixor_decisions</code> تُقيّد على <code>service_role</code> فقط.</div>
</div>
"""

# ─── Chapter 10: Custom Types & Relationships ───────────────────────────
ch10 = """
<p class="body-text">
تستخدم قاعدة بيانات فيكسور أنواعاً مُخصصة (Custom ENUM Types) لضمان سلامة البيانات على مستوى قاعدة البيانات. هذه الأنواع تُقيّد قيم الأعمدة المقبولة وتمنع إدخال بيانات غير صالحة. بالإضافة إلى ذلك، تعتمد المنظومة على شبكة واسعة من العلاقات عبر المفاتيح الأجنبية التي تربط الجداول ببعضها البعض.
</p>
<h3 style="color:var(--primary-glow);font-size:12pt;margin:18px 0 10px 0;">الأنواع المُخصصة (ENUM Types)</h3>
""" + tbl([
    ("النوع", ["signal_status", "recommendation_type", "analysis_status"]),
    ("القيم", ["pending, active, tp1_hit, tp2_hit, tp3_hit, sl_hit, expired, cancelled", "BUY, SELL, WAIT", "pending, completed, failed"]),
    ("الاستخدام", ["signal_tracking.status", "daily_signals.recommendation, signal_tracking.direction", "—"]),
]) + """
<h3 style="color:var(--primary-glow);font-size:12pt;margin:22px 0 10px 0;">قيود CHECK المستخدمة (بدون ENUM مخصص)</h3>
""" + tbl([
    ("الجدول.العمود", ["trades.direction", "trades.status", "price_alerts.condition", "price_alerts.status", "trading_notes.mood", "user_memories.category", "daily_loops.emotional_state", "web3_transactions.chain", "web3_transactions.type", "web3_transactions.status", "arbitrage_opportunities.strategy", "arbitrage_bot_stats.mode", "nft_badges.badge_type", "nft_badges.chain", "vixor_decisions.agent_id", "vixor_decisions.decision_type", "vixor_decisions.feedback", "vixor_decisions.workspace", "vixor_decisions.severity", "memecoin_discoveries.risk_level", "social_signals.source", "pairs.category", "news_cache.sentiment", "payments.status", "agent_jobs.status", "broker_connections.status", "moxi_personas.communication_style", "moxi_personas.avatar_variant"]),
    ("القيم المقبولة", ["long, short", "open, closed, cancelled", "above, below, crosses_up, crosses_down", "active, triggered, cancelled", "confident, cautious, anxious, neutral", "preference, behavior, mistake, insight, strategy", "disciplined, anxious, fomo, revenge, calm, tired", "solana, evm", "swap, transfer, nft_buy, nft_sell, stake, unstake", "pending, confirmed, failed, reverted", "cross-dex, triangular, cex-dex", "mock, live", "none, nft, collection, verified", "solana, evm", "coach, analyst, governor, hunter", "suggestion, warning, block, alert, report", "accepted, rejected, dismissed, expired", "os, bullx, axiom, opensea", "low, medium, high, critical", "low, medium, high", "twitter, telegram, reddit, lunarcrush", "forex, crypto, metal, stock, index", "bullish, bearish, neutral", "pending, confirmed, failed", "queued, running, done, failed, cancelled", "connected, disconnected", "formal, casual, mixed", "default, bull, bear, crystal, flame, ocean, phantom, nova"]),
]) + """
<h3 style="color:var(--primary-glow);font-size:12pt;margin:22px 0 10px 0;">ملخص العلاقات عبر المفاتيح الأجنبية</h3>
""" + tbl([
    ("الجدول الفرعي", ["profiles", "user_settings", "user_memories", "user_streaks", "points_balances", "moxi_personas", "analyses", "trades", "trading_notes", "watchlists", "watchlist_items", "copilot_conversations", "copilot_messages", "price_alerts", "user_strategies", "signal_tracking", "daily_signals", "daily_loops", "agent_tokens", "agent_jobs", "payments", "arbitrage_opportunities", "arbitrage_executions", "memecoin_discoveries", "strategies", "experiments", "experiment_generations", "broker_connections", "web3_transactions", "nft_badges", "wallet_sessions"]),
    ("الجدول الأب", ["auth.users", "auth.users", "profiles", "profiles", "profiles", "auth.users", "profiles", "profiles", "profiles, analyses", "profiles", "watchlists", "profiles", "copilot_conversations", "profiles", "profiles", "profiles, daily_signals", "—", "profiles", "auth.users", "agent_tokens", "auth.users, point_packs", "auth.users, arbitrage_opportunities", "auth.users", "auth.users", "auth.users", "experiments", "auth.users", "auth.users", "auth.users", "auth.users"]),
    ("المفتاح", ["id → auth.users.id", "user_id → auth.users.id", "user_id → profiles.id", "user_id → profiles.id", "user_id → profiles.id", "user_id → auth.users.id", "user_id → profiles.id", "user_id → profiles.id", "user_id → profiles.id, analysis_id → analyses.id", "user_id → profiles.id", "watchlist_id → watchlists.id", "user_id → profiles.id", "conversation_id → copilot_conversations.id", "user_id → profiles.id", "user_id → profiles.id", "user_id → profiles.id, signal_id → daily_signals.id", "user_id → profiles.id", "user_id → auth.users.id", "token_id → agent_tokens.id", "user_id → auth.users.id, pack_id → point_packs.id", "user_id → auth.users.id, opportunity_id → arbitrage_opportunities.id", "user_id → auth.users.id", "user_id → auth.users.id", "user_id → auth.users.id", "experiment_id → experiments.id", "user_id → auth.users.id", "user_id → auth.users.id", "user_id → auth.users.id", "user_id → auth.users.id"]),
]) + """
<div class="callout">
    <div class="callout-title">ملاحظة على التصميم</div>
    <div class="callout-body">بعض الجداول مثل <code>vixor_decisions</code> و<code>wallet_sessions</code> تستخدم <code>TEXT</code> بدلاً من <code>UUID</code> كنوع لـ <code>user_id</code> للتوافقية مع الأنظمة الخارجية. جميع المفاتيح الأساسية إما <code>UUID</code> (مُولّدة بواسطة <code>gen_random_uuid()</code>) أو <code>TEXT</code> (للمعرّفات الخارجية).</div>
</div>
"""

# ─── Build Document ─────────────────────────────────────────────────────
chapters = [
    {"tag": "SEC-01", "title": "نظرة عامة على قاعدة البيانات", "content": ch1},
    {"tag": "SEC-02", "title": "المخطط العام (ER Overview)", "content": ch2},
    {"tag": "SEC-03", "title": "جداول المستخدم الأساسية", "content": ch3},
    {"tag": "SEC-04", "title": "جداول التداول", "content": ch4},
    {"tag": "SEC-05", "title": "جداول الذكاء الاصطناعي", "content": ch5},
    {"tag": "SEC-06", "title": "جداول الاكتشاف والبيانات", "content": ch6},
    {"tag": "SEC-07", "title": "جداول البنية التحتية", "content": ch7},
    {"tag": "SEC-08", "title": "الوظائف والزنادات", "content": ch8},
    {"tag": "SEC-09", "title": "سياسات أمان الصفوف (RLS)", "content": ch9},
    {"tag": "SEC-10", "title": "الأنواع المخصصة والعلاقات", "content": ch10},
]

html = generate_vixor_html(
    title="إجيل قاعدة البيانات",
    subtitle="كل جدول، زناد، سياسة أمان صف، وعلاقة في منظومة فيكسور",
    doc_id="VIXOR-DBB-001",
    chapters=chapters,
)

html_path = save_html(html, "VIXOR-DBB-001_database_bible.html")
print(f"HTML saved: {html_path}")

pdf_path = convert_to_pdf(html_path, "VIXOR-DBB-001_database_bible.pdf", SKILL_DIR)
print(f"PDF saved: {pdf_path}")
