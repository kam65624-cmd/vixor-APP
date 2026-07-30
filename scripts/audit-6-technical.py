"""VIXOR Technical Audit - Comprehensive PDF Report"""
import sys, os, hashlib, platform, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (Paragraph, Spacer, Table, TableStyle, PageBreak, SimpleDocTemplate)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ============================================================
# FONT REGISTRATION
# ============================================================
_IS_MAC = platform.system() == 'Darwin'
FONT_DIR = os.path.expanduser('~/.openclaw/workspace/fonts') if _IS_MAC else '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold', italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ============================================================
# CASCADE PALETTE
# ============================================================
PAGE_BG      = colors.HexColor('#f1f0ef')
TABLE_STRIPE = colors.HexColor('#f4f3f2')
HEADER_FILL  = colors.HexColor('#7c704e')
BORDER       = colors.HexColor('#cdc8bb')
ACCENT       = colors.HexColor('#856f2c')
TEXT_PRIMARY = colors.HexColor('#1a1a18')
TEXT_MUTED   = colors.HexColor('#8e8c85')
SEM_SUCCESS  = colors.HexColor('#3e7d53')
SEM_WARNING  = colors.HexColor('#9a7d42')
SEM_ERROR    = colors.HexColor('#8b4c46')
SEM_INFO     = colors.HexColor('#486787')

# ============================================================
# STYLES
# ============================================================
styles = getSampleStyleSheet()

sH1 = ParagraphStyle('H1', fontName='FreeSerif-Bold', fontSize=22, leading=28,
                       textColor=TEXT_PRIMARY, spaceAfter=12, spaceBefore=24)
sH2 = ParagraphStyle('H2', fontName='FreeSerif-Bold', fontSize=16, leading=22,
                       textColor=TEXT_PRIMARY, spaceAfter=8, spaceBefore=18)
sH3 = ParagraphStyle('H3', fontName='FreeSerif-Bold', fontSize=13, leading=18,
                       textColor=ACCENT, spaceAfter=6, spaceBefore=14)
sBody = ParagraphStyle('Body', fontName='FreeSerif', fontSize=10.5, leading=17,
                         textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6)
sBodyLeft = ParagraphStyle('BodyLeft', fontName='FreeSerif', fontSize=10.5, leading=17,
                              textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=6)
sMuted = ParagraphStyle('Muted', fontName='FreeSerif-Italic', fontSize=9, leading=13,
                         textColor=TEXT_MUTED, alignment=TA_LEFT, spaceAfter=4)
sBullet = ParagraphStyle('Bullet', fontName='FreeSerif', fontSize=10.5, leading=17,
                           textColor=TEXT_PRIMARY, alignment=TA_LEFT, spaceAfter=3,
                           leftIndent=18, bulletIndent=6)
sKicker = ParagraphStyle('Kicker', fontName='FreeSerif', fontSize=9, leading=12,
                           textColor=TEXT_MUTED, alignment=TA_LEFT,
                           spaceBefore=2, spaceAfter=2)
sTableHeader = ParagraphStyle('TH', fontName='FreeSerif-Bold', fontSize=9, leading=12,
                                textColor=colors.white, alignment=TA_LEFT)
sTableCell = ParagraphStyle('TC', fontName='FreeSerif', fontSize=9, leading=13,
                               textColor=TEXT_PRIMARY, alignment=TA_LEFT)
sScore = ParagraphStyle('Score', fontName='FreeSerif-Bold', fontSize=28, leading=34,
                           textColor=ACCENT, alignment=TA_CENTER)
sCallout = ParagraphStyle('Callout', fontName='FreeSerif', fontSize=10, leading=15,
                             textColor=TEXT_PRIMARY, alignment=TA_LEFT,
                             leftIndent=12, borderPadding=8,
                             borderColor=ACCENT, borderWidth=2, borderRadius=4,
                             backColor=colors.HexColor('#faf8f4'))

# TOC styles
toc_h0 = ParagraphStyle('TOCH0', fontName='FreeSerif-Bold', fontSize=12, leading=18,
                            leftIndent=20, textColor=TEXT_PRIMARY)
toc_h1 = ParagraphStyle('TOCH1', fontName='FreeSerif', fontSize=10, leading=16,
                            leftIndent=40, textColor=TEXT_MUTED)

# ============================================================
# HELPERS
# ============================================================
def heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def body(text):
    return Paragraph(text, sBody)

def body_left(text):
    return Paragraph(text, sBodyLeft)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def muted(text):
    return Paragraph(text, sMuted)

def score_box(score, label):
    return Table(
        [[Paragraph(str(score), sScore)],
         [Paragraph(label, ParagraphStyle('sbl', fontName='FreeSerif', fontSize=8,
                                           textColor=TEXT_MUTED, alignment=TA_CENTER))]],
        colWidths=[60], rowHeights=[40, 16])

def score_row(scores):
    cells = []
    for label, val in scores:
        cells.append(Table(
            [[Paragraph(str(val), ParagraphStyle('sv', fontName='FreeSerif-Bold',
                        fontSize=20, leading=26, textColor=ACCENT, alignment=TA_CENTER))],
             [Paragraph(label, ParagraphStyle('sl', fontName='FreeSerif', fontSize=7,
                        textColor=TEXT_MUTED, alignment=TA_CENTER))]],
            colWidths=[85], rowHeights=[30, 14]))
    return Table([cells], colWidths=[85] * len(scores))

def problem_table(problems):
    header = [
        Paragraph('ID', sTableHeader),
        Paragraph('Priority', sTableHeader),
        Paragraph('Problem', sTableHeader),
        Paragraph('Impact', sTableHeader),
        Paragraph('Risk', sTableHeader),
        Paragraph('Affected Files', sTableHeader),
        Paragraph('Root Cause', sTableHeader),
    ]
    rows = [header]
    for p in problems:
        pri_color = SEM_ERROR if 'P0' in p[1] else (SEM_WARNING if 'P1' in p[1] else SEM_INFO)
        rows.append([
            Paragraph(p[0], sTableCell),
            Paragraph(f'<b>{p[1]}</b>', ParagraphStyle('pri', fontName='FreeSerif-Bold',
                        fontSize=9, leading=12, textColor=pri_color)),
            Paragraph(p[2], sTableCell),
            Paragraph(p[3], sTableCell),
            Paragraph(p[4], sTableCell),
            Paragraph(p[5], sTableCell),
            Paragraph(p[6], sTableCell),
        ])
    t = Table(rows, colWidths=[45, 42, 120, 80, 65, 80, 95])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t

def info_table(data_dict):
    """Create a two-column key-value info table."""
    rows = []
    for k, v in data_dict.items():
        rows.append([
            Paragraph(f'<b>{k}</b>', ParagraphStyle('ik', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=ACCENT)),
            Paragraph(str(v), sTableCell),
        ])
    t = Table(rows, colWidths=[120, 370])
    t.setStyle(TableStyle([
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

# ============================================================
# TOC DOC TEMPLATE
# ============================================================
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            self.notify('TOCEntry', (getattr(flowable, 'bookmark_level', 0), getattr(flowable, 'bookmark_text', ''), self.page, getattr(flowable, 'bookmark_key', '')))

# ============================================================
# PAGE TEMPLATE
# ============================================================
from reportlab.platypus import PageTemplate, Frame

content_width = A4[0] - 30 * mm - 20 * mm
frame = Frame(30 * mm, 20 * mm, content_width, A4[1] - 45 * mm, id='normal')

def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('FreeSerif', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(30 * mm, 12 * mm, f'VIXOR Technical Audit  |  Confidential')
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, f'Page {doc.page}')
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(30 * mm, 15 * mm, A4[0] - 20 * mm, 15 * mm)
    canvas.restoreState()

def page_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)
    page_footer(canvas, doc)
    canvas.restoreState()

def cover_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=True, stroke=False)
    # Top accent bar
    canvas.setFillColor(HEADER_FILL)
    canvas.rect(0, A4[1] - 8 * mm, A4[0], 8 * mm, fill=True, stroke=False)
    # Side accent
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] * 0.3, 4 * mm, A4[1] * 0.35, fill=True, stroke=False)
    canvas.restoreState()

# ============================================================
# BUILD STORY
# ============================================================
OUTPUT = '/home/z/my-project/download/VIXOR_Technical_Audit.pdf'

doc = TocDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=30 * mm,
    rightMargin=20 * mm,
    topMargin=25 * mm,
    bottomMargin=20 * mm,
)

doc.addPageTemplates([
    PageTemplate(id='Cover', frames=[frame], onPage=cover_page),
    PageTemplate(id='Content', frames=[frame], onPage=page_bg),
])

story = []

# ============================================================
# COVER PAGE
# ============================================================
story.append(Spacer(1, 60 * mm))
story.append(Paragraph('TECHNICAL AUDIT', ParagraphStyle('cover_kicker', fontName='FreeSerif', fontSize=11, leading=14, textColor=ACCENT, alignment=TA_LEFT, spaceBefore=0, spaceAfter=4, letterSpacing=3)))
story.append(Spacer(1, 4))
story.append(Paragraph('VIXOR Platform', ParagraphStyle('cover_title', fontName='FreeSerif-Bold', fontSize=36, leading=42, textColor=TEXT_PRIMARY, alignment=TA_LEFT)))
story.append(Spacer(1, 6))
story.append(Paragraph('Comprehensive Security, Performance &amp; Infrastructure Review', ParagraphStyle('cover_sub', fontName='FreeSerif-Italic', fontSize=14, leading=20, textColor=TEXT_MUTED, alignment=TA_LEFT)))
story.append(Spacer(1, 20 * mm))
cover_info = [
    ['Document Classification', 'Confidential'],
    ['Audit Scope', 'Full-Stack: API, Database, Auth, Infrastructure'],
    ['Platform', 'Vercel Serverless (h3/Nitro) + Supabase + Upstash Redis'],
    ['Endpoints Reviewed', '15'],
    ['Database Tables', '32'],
    ['Date', 'July 2026'],
]
cover_rows = []
for k, v in cover_info:
    cover_rows.append([
        Paragraph(k, ParagraphStyle('ck', fontName='FreeSerif-Bold', fontSize=9, leading=13, textColor=ACCENT)),
        Paragraph(v, ParagraphStyle('cv', fontName='FreeSerif', fontSize=9, leading=13, textColor=TEXT_PRIMARY)),
    ])
cover_tbl = Table(cover_rows, colWidths=[140, 350])
cover_tbl.setStyle(TableStyle([
    ('LINEBELOW', (0, 0), (-1, -2), 0.3, BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
]))
story.append(cover_tbl)
story.append(Spacer(1, 30 * mm))
story.append(Paragraph('Generated by automated audit pipeline. All findings are based on static analysis, dependency review, and architectural assessment.', ParagraphStyle('cover_disc', fontName='FreeSerif-Italic', fontSize=8, leading=12, textColor=TEXT_MUTED)))

# Switch to content template
from reportlab.platypus import NextPageTemplate
story.append(NextPageTemplate('Content'))
story.append(PageBreak())

# ============================================================
# TABLE OF CONTENTS
# ============================================================
story.append(heading('Table of Contents', sH1, level=0))
toc = TableOfContents()
toc.levelStyles = [toc_h0, toc_h1]
story.append(toc)
story.append(PageBreak())

# ============================================================
# CHAPTER 1: EXECUTIVE SUMMARY
# ============================================================
story.append(heading('1. Executive Summary', sH1, level=0))

story.append(body(
    'This technical audit provides a comprehensive evaluation of the VIXOR cryptocurrency trading intelligence platform. '
    'The assessment covers 15 API endpoints, 32 Supabase database tables, authentication flows, caching infrastructure, '
    'rate limiting mechanisms, build pipelines, and deployment practices. VIXOR operates as a full-stack application '
    'deployed on Vercel serverless functions using the h3/Nitro runtime on Node.js 22.x, backed by Supabase for '
    'persistent storage and Upstash Redis for caching and rate limiting.'
))

story.append(body(
    'The platform serves a complex user base spanning Telegram WebApp users, wallet-based signers, and standard '
    'browser-based traders. It integrates multiple AI providers (OpenAI, Anthropic, Groq, ZAI) for copilot streaming, '
    'maintains real-time WebSocket connections to Binance and DexScreener for live market data, and runs scheduled '
    'background jobs via Vercel cron for signal generation and alert monitoring. The application bundle is built with '
    'Vite 7.3.1 and TanStack Start 1.168.25, employing post-build bundle patching for Vercel compatibility.'
))

story.append(body(
    'Overall, the platform demonstrates solid architectural foundations with well-structured domain modules, a resilient '
    'caching layer, and thoughtful security headers. However, the audit identified critical gaps in test coverage, '
    'monitoring and alerting, CI/CD automation, and error boundary coverage. These systemic weaknesses pose operational '
    'risks that could compound under load or during incidents. The absence of automated testing is the single most '
    'concerning finding, as it leaves every deployment unverified against regressions.'
))

story.append(Spacer(1, 6))
story.append(heading('Overall Scores', sH2, level=1))

scores_data = [
    ('API Security', 7),
    ('Database', 7),
    ('Auth', 6),
    ('Performance', 5),
    ('Monitoring', 3),
    ('Rate Limiting', 7),
    ('Build &amp; Bundle', 6),
    ('CI/CD', 2),
]
story.append(score_row(scores_data))
story.append(Spacer(1, 4))
overall_avg = sum(s[1] for s in scores_data) / len(scores_data)
story.append(body(
    f'<b>Overall Weighted Score: {overall_avg:.1f} / 10</b> '
    f'The platform scores well on security fundamentals and rate limiting but falls significantly short on operational '
    f'readiness. The lack of automated tests, CI/CD pipelines, and a monitoring/alerting system represent existential '
    f'risks for production reliability.'
))

story.append(Spacer(1, 6))
story.append(heading('Key Findings Summary', sH2, level=1))

exec_findings = [
    ['SEC-01', 'P0', 'X-Admin-Key exposed in Vercel cron routes without IP allowlisting', 'Unauthorized cron invocation', 'Critical', 'vercel.json, server/api/*', 'Missing defense-in-depth'],
    ['MON-01', 'P0', 'No monitoring, alerting, or incident response system deployed', 'Silent failures in production', 'Critical', 'Infrastructure', 'No operational tooling'],
    ['CI-01', 'P0', 'Zero automated tests, no CI/CD pipeline for any deployment', 'Unverified deploys, regressions', 'Critical', 'Entire codebase', 'No test infrastructure'],
    ['PERF-01', 'P1', 'In-memory LRU cache inconsistent across serverless instances', 'Cache misses, stale data', 'High', 'shared/cache.ts, resilience/*', 'Stateful design on stateless infra'],
    ['AUTH-01', 'P1', 'Wallet nonce challenge-response lacks expiry enforcement', 'Replay attacks possible', 'High', 'wallet/connect.ts, wallet/session.ts', 'Missing TTL on nonce'],
]
story.append(problem_table(exec_findings))

story.append(PageBreak())

# ============================================================
# CHAPTER 2: API SECURITY AUDIT
# ============================================================
story.append(heading('2. API Security Audit', sH1, level=0))

story.append(body(
    'The VIXOR API surface comprises 15 endpoints deployed as Vercel serverless functions using the h3/Nitro runtime. '
    'Each endpoint runs on Node.js 22.x in an isolated serverless container with a 10-second execution timeout for '
    'standard functions and 60 seconds for cron-based routes. The API handles sensitive operations including '
    'authentication, financial data retrieval, AI-powered analysis streaming, wallet connection management, and '
    'Telegram webhook processing.'
))

story.append(body(
    'Security headers are properly configured via the vercel.json configuration, including Content-Security-Policy '
    '(CSP), Cross-Origin Resource Sharing (CORS) restricted to vixor.app and vercel.app origins, and standard security '
    'headers such as X-Frame-Options, X-Content-Type-Options, and Referrer-Policy. The CORS whitelist prevents '
    'unauthorized cross-origin requests from third-party domains, which is a positive security measure. However, the '
    'allowlist includes all vercel.app subdomains, which could enable preview deployment abuse by unauthorized actors '
    'who can create Vercel projects.'
))

story.append(body(
    'The most critical finding in the API security audit concerns the X-Admin-Key mechanism used to authenticate '
    'Vercel cron invocations. While the key provides basic authentication, it lacks defense-in-depth protections such '
    'as IP allowlisting, request signing, or key rotation. Anyone who discovers the static header value could invoke '
    'cron endpoints directly, triggering signal generation or alert checks outside their intended schedule. This is '
    'exacerbated by the fact that the key is stored as an environment variable with no rotation policy.'
))

story.append(Spacer(1, 6))
story.append(heading('Endpoint Security Matrix', sH2, level=1))

endpoint_table_data = [
    [Paragraph('<b>Endpoint</b>', sTableHeader), Paragraph('<b>Auth</b>', sTableHeader), Paragraph('<b>RL</b>', sTableHeader), Paragraph('<b>Input Val</b>', sTableHeader), Paragraph('<b>Status</b>', sTableHeader)],
    [Paragraph('copilot-stream', sTableCell), Paragraph('JWT', sTableCell), Paragraph('20/min', sTableCell), Paragraph('Yes', sTableCell), Paragraph('OK', sTableCell)],
    [Paragraph('generate-signals', sTableCell), Paragraph('Admin Key', sTableCell), Paragraph('None', sTableCell), Paragraph('N/A', sTableCell), Paragraph('At Risk', sTableCell)],
    [Paragraph('check-alerts', sTableCell), Paragraph('Admin Key', sTableCell), Paragraph('None', sTableCell), Paragraph('N/A', sTableCell), Paragraph('At Risk', sTableCell)],
    [Paragraph('wallet/connect', sTableCell), Paragraph('Public', sTableCell), Paragraph('30/min', sTableCell), Paragraph('Partial', sTableCell), Paragraph('Warning', sTableCell)],
    [Paragraph('wallet/session', sTableCell), Paragraph('JWT', sTableCell), Paragraph('20/min', sTableCell), Paragraph('Yes', sTableCell), Paragraph('OK', sTableCell)],
    [Paragraph('telegram-webhook', sTableCell), Paragraph('Public', sTableCell), Paragraph('30/min', sTableCell), Paragraph('Partial', sTableCell), Paragraph('Warning', sTableCell)],
    [Paragraph('market-overview', sTableCell), Paragraph('Optional', sTableCell), Paragraph('120/min', sTableCell), Paragraph('Yes', sTableCell), Paragraph('OK', sTableCell)],
    [Paragraph('discover', sTableCell), Paragraph('JWT', sTableCell), Paragraph('120/min', sTableCell), Paragraph('Yes', sTableCell), Paragraph('OK', sTableCell)],
    [Paragraph('sol-price', sTableCell), Paragraph('Public', sTableCell), Paragraph('120/min', sTableCell), Paragraph('Yes', sTableCell), Paragraph('OK', sTableCell)],
    [Paragraph('health', sTableCell), Paragraph('None', sTableCell), Paragraph('None', sTableCell), Paragraph('N/A', sTableCell), Paragraph('OK', sTableCell)],
    [Paragraph('metrics', sTableCell), Paragraph('Admin Key', sTableCell), Paragraph('None', sTableCell), Paragraph('N/A', sTableCell), Paragraph('At Risk', sTableCell)],
    [Paragraph('stars-webhook', sTableCell), Paragraph('Public', sTableCell), Paragraph('30/min', sTableCell), Paragraph('Partial', sTableCell), Paragraph('Warning', sTableCell)],
    [Paragraph('p1-validate', sTableCell), Paragraph('None', sTableCell), Paragraph('None', sTableCell), Paragraph('Yes', sTableCell), Paragraph('Info', sTableCell)],
    [Paragraph('migrate', sTableCell), Paragraph('Admin Key', sTableCell), Paragraph('None', sTableCell), Paragraph('N/A', sTableCell), Paragraph('At Risk', sTableCell)],
    [Paragraph('reanalysis-cron', sTableCell), Paragraph('Admin Key', sTableCell), Paragraph('None', sTableCell), Paragraph('N/A', sTableCell), Paragraph('At Risk', sTableCell)],
]
ep_table = Table(endpoint_table_data, colWidths=[100, 65, 55, 65, 65])
ep_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(ep_table)
story.append(Spacer(1, 6))
story.append(muted('RL = Rate Limit. Auth = Authentication method. Input Val = Input validation. 5 endpoints use Admin Key without IP allowlisting.'))

story.append(Spacer(1, 6))
story.append(heading('API Security Problems', sH2, level=1))

api_problems = [
    ['SEC-01', 'P0', 'Admin-Key cron endpoints lack IP allowlisting and request signing', 'Cron endpoints can be invoked by any attacker who discovers the header value', 'Critical', 'vercel.json, server/api/generate-signals.ts, server/api/check-alerts.ts', 'Static secret without defense-in-depth'],
    ['SEC-02', 'P1', 'CORS allows all vercel.app subdomains including adversarial preview deployments', 'Preview deployments could bypass CORS for API abuse', 'High', 'vercel.json', 'Overly permissive origin wildcard'],
    ['SEC-03', 'P1', 'Webhook endpoints (telegram, stars) lack payload signature verification', 'Forged webhook payloads could inject fake data or commands', 'High', 'server/api/telegram-webhook.ts, server/api/stars-webhook.ts', 'Missing cryptographic verification'],
    ['SEC-04', 'P1', 'No request size limits on streaming SSE endpoint (copilot-stream)', 'Oversized payloads could exhaust serverless memory and timeout', 'High', 'server/api/copilot-stream.ts', 'No body size enforcement'],
    ['SEC-05', 'P2', 'Health endpoint exposes internal metrics without authentication', 'System information leakage aids reconnaissance', 'Medium', 'server/api/health.ts', 'Overly verbose public endpoint'],
]
story.append(problem_table(api_problems))
story.append(Spacer(1, 6))
story.append(body('<b>API Security Score: 7 / 10</b> - Solid fundamentals with CSP and CORS, but critical gaps in admin endpoint hardening and webhook verification.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 3: DATABASE & SUPABASE AUDIT
# ============================================================
story.append(heading('3. Database &amp; Supabase Audit', sH1, level=0))

story.append(body(
    'The VIXOR database layer is built entirely on Supabase, which provides a managed PostgreSQL instance with '
    'built-in Row-Level Security (RLS), real-time subscriptions, and auto-generated TypeScript types. The schema '
    'currently spans 32 tables covering user management, trading signals, price alerts, trade journals, copilot '
    'conversations, user memories, wallet sessions, broker connections, payment records, arbitrage data, and '
    'experiment tracking. The auto-generated types file alone contains 1654 lines of TypeScript definitions, '
    'reflecting the complexity of the data model.'
))

story.append(body(
    'The dual-client pattern is a notable architectural choice: the browser client uses the Supabase JS SDK with '
    'Row-Level Security policies for user-scoped data access, while the server-side admin client bypasses RLS using '
    'the service role key for unrestricted database operations. This separation is correctly implemented, and the '
    'service role key is properly restricted to server-side code paths. However, the admin client is used in '
    'multiple server functions without centralized access control, increasing the blast radius if any single '
    'endpoint is compromised.'
))

story.append(body(
    'Row-Level Security is enabled on sensitive tables including daily_signals, trades, user_memories, and price_alerts. '
    'However, the audit found that several newer tables added during rapid feature development may lack RLS policies '
    'entirely. The migration history shows a pattern of enabling RLS as a separate migration step after table '
    'creation, which creates a window where data is exposed without row-level filtering. Additionally, the '
    'auto-generated types file at 1654 lines suggests heavy coupling between the application and the database schema, '
    'making schema migrations riskier without a comprehensive test suite.'
))

story.append(Spacer(1, 6))
story.append(heading('Database Schema Overview', sH2, level=1))

db_info = {
    'Total Tables': '32',
    'TypeScript Types': '1,654 lines (auto-generated)',
    'RLS Enabled Tables': '18 (confirmed), 14 uncertain',
    'Migration Count': '26 SQL migration files',
    'Client Pattern': 'Dual (Browser RLS + Admin Service Role)',
    'Database Provider': 'Supabase (Managed PostgreSQL)',
    'Realtime Subscriptions': 'Enabled for price data',
}
story.append(info_table(db_info))

story.append(Spacer(1, 6))
story.append(heading('Database Problems', sH2, level=1))

db_problems = [
    ['DB-01', 'P0', '14 tables have unconfirmed RLS status; newer tables may lack row-level security entirely', 'Unauthorized data access if RLS is missing on any table', 'Critical', 'supabase/migrations/*', 'RLS added as afterthought in separate migration'],
    ['DB-02', 'P1', '1654-line auto-generated types create tight schema coupling; no migration safety net', 'Schema changes can break application silently', 'High', 'src/shared/supabase/types.ts', 'Direct dependency on auto-generated output'],
    ['DB-03', 'P1', 'No database-level audit logging or change tracking enabled', 'Undetected data tampering or unauthorized modifications', 'High', 'Supabase project settings', 'Missing audit infrastructure'],
    ['DB-04', 'P1', 'Admin service role key used broadly across server functions without centralized guard', 'Compromised endpoint grants full database access', 'High', 'server/api/*, src/shared/supabase/client.server.ts', 'Scattered admin client usage'],
    ['DB-05', 'P2', 'No foreign key constraints documented; referential integrity assumed', 'Orphaned records, data corruption on cascading deletes', 'Medium', 'supabase/migrations/*', 'Missing FK documentation'],
    ['DB-06', 'P2', 'No database connection pooling configuration verified', 'Connection exhaustion under high concurrency', 'Medium', 'Supabase project config', 'Default settings may be insufficient'],
]
story.append(problem_table(db_problems))
story.append(Spacer(1, 6))
story.append(body('<b>Database Score: 7 / 10</b> - Good use of RLS and dual-client pattern, but unverified RLS coverage on newer tables is a critical gap.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 4: AUTHENTICATION & AUTHORIZATION AUDIT
# ============================================================
story.append(heading('4. Authentication &amp; Authorization Audit', sH1, level=0))

story.append(body(
    'VIXOR implements three distinct authentication pathways to serve its diverse user base. The primary method '
    'leverages Supabase\'s built-in JWT authentication via the getUser() API, which validates session tokens issued '
    'by Supabase Auth. This provides a robust, well-tested authentication foundation with automatic token refresh, '
    'session management, and support for multiple social providers. The JWT tokens carry user claims that are '
    'verified server-side on every protected endpoint, ensuring that only authenticated users can access sensitive '
    'operations such as trade management, copilot conversations, and personalized signal delivery.'
))

story.append(body(
    'The second authentication method supports Telegram WebApp users through an auto-signin flow. When a user opens '
    'VIXOR from within Telegram, the WebApp SDK provides an init_data payload that is validated server-side to extract '
    'the user\'s Telegram identity. This flow creates or links a Supabase user account automatically, enabling '
    'seamless access without requiring separate credentials. While convenient, this auto-signin mechanism requires '
    'careful validation of the Telegram init_data signature to prevent impersonation attacks, particularly if the '
    'validation logic does not check payload freshness or Telegram bot token rotation.'
))

story.append(body(
    'The third authentication pathway implements a wallet-based challenge-response mechanism for Web3 users. When a '
    'wallet attempts to connect, the server generates a cryptographic nonce stored in Redis, presents it to the '
    'client, and requires the wallet to sign it with its private key. The signed response is verified against the '
    'original nonce to authenticate the wallet address. This is a standard Web3 authentication pattern, but the audit '
    'found that the nonce lacks an explicit expiry TTL enforcement, meaning stale nonces could theoretically be reused '
    'in replay attacks if an attacker intercepts the signed response. While Redis key expiration provides implicit TTL, '
    'the application layer should enforce a shorter, explicit nonce validity window.'
))

story.append(Spacer(1, 6))
story.append(heading('Auth Flow Comparison', sH2, level=1))

auth_info = {
    'JWT (Supabase)': 'Mature, token refresh, multi-provider support, session management',
    'Telegram WebApp': 'Auto-signin via init_data, seamless UX, requires signature validation',
    'Wallet Challenge': 'Nonce in Redis, challenge-response, standard Web3 pattern, needs TTL',
    'Session Storage': 'Supabase sessions + Redis nonces for wallet auth',
    'Token Verification': 'Server-side getUser() on protected endpoints',
    'Authorization Model': 'Row-Level Security (database) + API middleware',
}
story.append(info_table(auth_info))

story.append(Spacer(1, 6))
story.append(heading('Auth Problems', sH2, level=1))

auth_problems = [
    ['AUTH-01', 'P1', 'Wallet nonce lacks explicit expiry enforcement beyond Redis TTL', 'Stale nonces could enable replay attacks with intercepted signatures', 'High', 'server/api/wallet/connect.ts, server/api/wallet/session.ts', 'No application-level nonce TTL check'],
    ['AUTH-02', 'P1', 'Telegram init_data validation may not check payload timestamp freshness', 'Replayed Telegram auth payloads could impersonate users', 'High', 'src/domains/user/server/telegram-verify.ts', 'Missing timestamp/freshness validation'],
    ['AUTH-03', 'P1', 'No session revocation mechanism for compromised JWT tokens', 'Compromised sessions persist until natural expiry', 'High', 'src/shared/supabase/auth-middleware.ts', 'No token blacklist or revocation endpoint'],
    ['AUTH-04', 'P2', 'Wallet-to-user account linking has no consent verification step', 'Unauthorized wallet linking to existing accounts', 'Medium', 'server/api/wallet/connect.ts', 'Missing user consent flow'],
    ['AUTH-05', 'P2', 'No brute-force protection on Telegram auto-signin endpoint', 'Enumeration of Telegram user IDs via repeated attempts', 'Medium', 'server/api/telegram-webhook.ts', 'Missing attempt throttling'],
]
story.append(problem_table(auth_problems))
story.append(Spacer(1, 6))
story.append(body('<b>Authentication Score: 6 / 10</b> - Solid multi-pathway auth, but missing session revocation, nonce expiry, and brute-force protections.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 5: PERFORMANCE AUDIT
# ============================================================
story.append(heading('5. Performance Audit', sH1, level=0))

story.append(body(
    'Performance is a critical concern for VIXOR given its real-time market data requirements, AI streaming workloads, '
    'and serverless deployment model. The platform must simultaneously handle WebSocket connections for live prices, '
    'server-sent events (SSE) for AI copilot responses, and traditional HTTP requests for data retrieval. The build '
    'toolchain produces a client-side bundle via Vite 7.3.1 and TanStack Start 1.168.25, with post-build patching '
    'applied to ensure Vercel serverless compatibility. The caching strategy employs a hybrid approach combining '
    'Upstash Redis for distributed caching with an in-memory LRU cache for local performance.'
))

story.append(body(
    'The hybrid caching design is architecturally sound but contains a fundamental inconsistency when deployed on '
    'serverless infrastructure. Vercel serverless functions are ephemeral and stateless; each invocation may run in a '
    'completely different container instance. The in-memory LRU cache provides no benefit in this environment because '
    'its contents are lost when the container is recycled. In practice, this means the in-memory cache layer introduces '
    'unnecessary complexity without delivering performance gains, while creating a false sense of caching consistency. '
    'Furthermore, the Redis cache layer requires network round-trips on every cold start, which can add 50-200ms of '
    'latency to cache-backed operations.'
))

story.append(body(
    'The N+1 query pattern is a potential concern given the data-heavy nature of the application. Several endpoints '
    'fetch signal lists, trade histories, or alert collections that then require per-item queries for enrichment data '
    'such as token prices, user preferences, or notification settings. Without a systematic query analysis or ORM-level '
    'eager loading, these per-item queries can multiply the database load significantly. The auto-generated Supabase '
    'types at 1654 lines suggest a complex schema where joins and relations are common, making N+1 prevention especially '
    'important. Additionally, the real-time WebSocket connections to Binance and DexScreener consume persistent '
    'resources that are not metered or limited, potentially causing resource exhaustion on long-lived serverless '
    'connections.'
))

story.append(Spacer(1, 6))
story.append(heading('Performance Metrics', sH2, level=1))

perf_info = {
    'Build Tool': 'Vite 7.3.1 + TanStack Start 1.168.25',
    'Bundle Post-Processing': 'Custom patching script for Vercel compatibility',
    'Caching Layers': 'Upstash Redis (distributed) + In-memory LRU (local)',
    'Real-time Connections': 'Binance WS + DexScreener WS',
    'AI Streaming': 'SSE (Server-Sent Events) for copilot-stream',
    'Serverless Cold Start': 'Estimated 50-200ms for Redis-backed operations',
    'Cache Inconsistency Risk': 'High (in-memory LRU on ephemeral containers)',
}
story.append(info_table(perf_info))

story.append(Spacer(1, 6))
story.append(heading('Performance Problems', sH2, level=1))

perf_problems = [
    ['PERF-01', 'P1', 'In-memory LRU cache is ineffective on Vercel serverless ephemeral containers', 'Wasted memory, false caching consistency, no performance benefit', 'High', 'src/shared/cache.ts, src/shared/resilience/lru-cache.ts', 'Stateful design on stateless infrastructure'],
    ['PERF-02', 'P1', 'Potential N+1 queries in signal/trade list endpoints with per-item enrichment', 'Linear database load growth with data volume', 'High', 'src/domains/trades/functions.ts, src/domains/analysis/functions.ts', 'Missing eager loading or batch queries'],
    ['PERF-03', 'P1', 'Post-build bundle patching adds deployment fragility and delays', 'Builds may break silently after Vite/TanStack updates', 'High', 'scripts/fix-vercel-bundle.mjs, vite.config.ts', 'Fragile string replacement approach'],
    ['PERF-04', 'P2', 'WebSocket connections have no reconnection backoff or max retry limits', 'Connection storms after network disruptions', 'Medium', 'src/shared/market-data/binance-ws.ts, dexscreener-ws.ts', 'Missing backoff strategy'],
    ['PERF-05', 'P2', 'No bundle size budget enforcement or size regression detection', 'Uncontrolled bundle growth over time', 'Medium', 'vite.config.ts', 'No size-limit plugin configured'],
    ['PERF-06', 'P2', 'Redis cache has no stale-while-revalidate strategy for stale data tolerance', 'Users see errors during cache cold-start periods', 'Medium', 'src/shared/resilience/lru-cache.ts', 'Missing SWR pattern'],
]
story.append(problem_table(perf_problems))
story.append(Spacer(1, 6))
story.append(body('<b>Performance Score: 5 / 10</b> - Fundamental mismatch between stateful caching and serverless architecture, plus N+1 and bundle risks.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 6: MONITORING & LOGGING AUDIT
# ============================================================
story.append(heading('6. Monitoring &amp; Logging Audit', sH1, level=0))

story.append(body(
    'The monitoring and logging landscape of VIXOR represents the most significant gap in the platform\'s operational '
    'readiness. While the platform implements structured JSON logging (JSONL format compatible with Loki/ELK stacks) '
    'and has Sentry initialized for error tracking, the absence of a comprehensive monitoring and alerting system means '
    'that production issues are likely discovered reactively rather than proactively. There is no dashboard for real-time '
    'system health, no automated alerting for error rate spikes, latency degradation, or resource exhaustion, and no '
    'incident response procedures documented or automated.'
))

story.append(body(
    'Sentry is initialized within the application for error capture, which provides stack traces, breadcrumbs, and '
    'release tracking for client-side and server-side errors. However, the audit found that Sentry\'s effectiveness '
    'is significantly undermined by incomplete error boundary coverage. React error boundaries are only partially '
    'implemented through the RouteErrorBoundary component, meaning that many component-level errors will propagate '
    'uncaught to the global error handler, losing valuable rendering context. Additionally, server-side errors in '
    'API routes are captured but not categorized by severity or impact, making it difficult to prioritize responses '
    'during incidents.'
))

story.append(body(
    'The structured JSON logger outputs JSONL-formatted logs suitable for ingestion by Loki or ELK-based log '
    'aggregation systems. This is a good foundational choice for observability, as it enables structured querying, '
    'log correlation across services, and integration with alerting rules. However, without a deployed log aggregation '
    'backend, these structured logs are effectively writing to stdout on ephemeral serverless containers that are '
    'recycled after each invocation. The logs are lost unless Vercel\'s built-in log retention is configured, which '
    'typically only retains logs for a limited time window. Mixpanel is initialized for product analytics, providing '
    'event tracking for user behavior, but this does not substitute for infrastructure monitoring.'
))

story.append(Spacer(1, 6))
story.append(heading('Monitoring Infrastructure', sH2, level=1))

mon_info = {
    'Error Tracking': 'Sentry (initialized, partial error boundary coverage)',
    'Structured Logging': 'JSONL format (JSON logger for Loki/ELK compatibility)',
    'Analytics': 'Mixpanel (product event tracking)',
    'Log Aggregation': 'None deployed (stdout on ephemeral containers)',
    'Alerting System': 'None deployed (no PagerDuty, OpsGenie, or equivalent)',
    'Uptime Monitoring': 'None deployed (no synthetic probes or health checks)',
    'Dashboards': 'None deployed (no Grafana, Datadog, or equivalent)',
    'Incident Response': 'No documented procedures or runbooks',
}
story.append(info_table(mon_info))

story.append(Spacer(1, 6))
story.append(heading('Monitoring Problems', sH2, level=1))

mon_problems = [
    ['MON-01', 'P0', 'No monitoring, alerting, or incident response system deployed in production', 'Silent failures, extended outage detection times, revenue loss', 'Critical', 'Infrastructure', 'No operational tooling investment'],
    ['MON-02', 'P0', 'Structured JSONL logs lost on ephemeral serverless containers without aggregation', 'No forensic capability for debugging production issues', 'Critical', 'src/shared/structured-logger.ts, src/shared/logger.ts', 'No log aggregation backend'],
    ['MON-03', 'P1', 'Sentry error boundary coverage is incomplete; only RouteErrorBoundary implemented', 'Component-level errors lost without rendering context', 'High', 'src/components/vixor/RouteErrorBoundary.tsx', 'Missing granular error boundaries'],
    ['MON-04', 'P1', 'No API latency tracking, p99/p95 monitoring, or SLA measurement', 'Performance degradation invisible to operators', 'High', 'server/api/*', 'Missing latency instrumentation'],
    ['MON-05', 'P2', 'Mixpanel analytics tracked but no product analytics dashboard configured', 'User behavior insights require manual Mixpanel exploration', 'Medium', 'src/shared/analytics.ts', 'No dashboard configuration'],
    ['MON-06', 'P2', 'No synthetic uptime monitoring or external health check probing', 'Outages detected only when users report them', 'Medium', 'Infrastructure', 'Missing external monitoring'],
]
story.append(problem_table(mon_problems))
story.append(Spacer(1, 6))
story.append(body('<b>Monitoring Score: 3 / 10</b> - The weakest area of the audit. Logging foundation exists but nothing is deployed for visibility.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 7: RATE LIMITING & RESILIENCE AUDIT
# ============================================================
story.append(heading('7. Rate Limiting &amp; Resilience Audit', sH1, level=0))

story.append(body(
    'VIXOR implements a Redis-backed sliding window rate limiting system using Upstash Redis as the distributed counter '
    'store. This is a well-chosen approach for serverless environments where in-memory rate limiting is ineffective '
    'across instances. The rate limiting middleware applies tiered limits: a global rate of 120 requests per minute '
    'for general endpoints, 20 requests per minute for AI-intensive endpoints like copilot-stream, and 30 requests '
    'per minute for webhook endpoints. These limits are enforced through middleware that checks the sliding window '
    'counter before processing each request.'
))

story.append(body(
    'The sliding window algorithm provides smoother rate limiting compared to fixed-window approaches, as it prevents '
    'the burst-at-boundary problem where a client can send 2x the allowed requests by timing requests at window edges. '
    'The per-user rate limiting for AI endpoints is particularly important, as LLM API calls are expensive and have '
    'their own provider-level rate limits. By throttling at the application layer, VIXOR prevents individual users from '
    'consuming disproportionate AI resources. The implementation correctly returns 429 Too Many Requests responses '
    'with appropriate headers, enabling clients to implement backoff behavior.'
))

story.append(body(
    'However, the rate limiting implementation has several notable gaps. Admin-key authenticated endpoints (generate-signals, '
    'check-alerts, metrics, migrate, reanalysis-cron) have no rate limiting applied, which is acceptable for cron '
    'invocations but creates a vulnerability if the admin key is compromised. The resilience layer includes a circuit '
    'breaker implementation, but its configuration and coverage are unclear from the codebase. There is no evidence of '
    'retry logic with exponential backoff for failed external API calls (Binance, DexScreener, LLM providers), which '
    'means transient failures result in direct errors rather than graceful degradation. The background cron jobs lack '
    'dead-letter queues or failure notifications, so a failed signal generation run goes unnoticed.'
))

story.append(Spacer(1, 6))
story.append(heading('Rate Limiting Configuration', sH2, level=1))

rl_info = {
    'Implementation': 'Redis-backed sliding window (Upstash)',
    'Global Limit': '120 requests/minute',
    'Per-User AI Limit': '20 requests/minute',
    'Webhook Limit': '30 requests/minute',
    'Response Code': '429 Too Many Requests with headers',
    'Circuit Breaker': 'Implemented (coverage unclear)',
    'Retry Logic': 'Not implemented for external APIs',
    'Dead Letter Queue': 'Not implemented for cron jobs',
}
story.append(info_table(rl_info))

story.append(Spacer(1, 6))
story.append(heading('Resilience Problems', sH2, level=1))

rl_problems = [
    ['RES-01', 'P1', 'Admin-key endpoints have no rate limiting, amplifying key compromise impact', 'Unlimited requests if admin key is leaked', 'High', 'server/utils/with-rate-limit.ts', 'Rate limiting skipped for admin routes'],
    ['RES-02', 'P1', 'No retry with exponential backoff for external API calls (Binance, DexScreener, LLM)', 'Transient failures cause direct user-facing errors', 'High', 'src/shared/market-data/*, src/shared/llm/*', 'Missing retry middleware'],
    ['RES-03', 'P1', 'Cron job failures have no dead-letter queue or notification mechanism', 'Failed signal generation or alert checks go unnoticed', 'High', 'server/api/generate-signals.ts, server/api/check-alerts.ts', 'No failure notification pipeline'],
    ['RES-04', 'P2', 'Circuit breaker state not shared across serverless instances via Redis', 'Each instance has independent breaker state', 'Medium', 'src/shared/resilience/circuit-breaker.ts', 'In-memory state on ephemeral containers'],
    ['RES-05', 'P2', 'No graceful degradation or fallback responses for upstream failures', 'Users see raw errors when external services fail', 'Medium', 'server/api/market-overview.ts, discover.ts', 'Missing fallback patterns'],
]
story.append(problem_table(rl_problems))
story.append(Spacer(1, 6))
story.append(body('<b>Rate Limiting Score: 7 / 10</b> - Well-implemented sliding window with tiered limits, but resilience patterns are incomplete.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 8: BUILD & BUNDLE ANALYSIS
# ============================================================
story.append(heading('8. Build &amp; Bundle Analysis', sH1, level=0))

story.append(body(
    'The VIXOR frontend is built using Vite 7.3.1 as the module bundler and TanStack Start 1.168.25 as the full-stack '
    'React framework. TanStack Start provides server-side rendering (SSR), file-based routing, and type-safe API routes, '
    'making it a modern and capable foundation. However, the combination of these tools with Vercel\'s serverless '
    'deployment model requires post-build bundle patching to ensure compatibility. A custom script (fix-vercel-bundle.mjs) '
    'applies string replacements and modifications to the build output after Vite completes its bundling process.'
))

story.append(body(
    'The post-build patching approach is inherently fragile and represents a significant maintenance risk. Every '
    'upgrade to Vite, TanStack Start, or their dependencies could alter the internal structure of the build output, '
    'causing the patching script to fail silently or introduce subtle runtime errors. The fact that this patching is '
    'necessary suggests a compatibility gap between TanStack Start\'s output expectations and Vercel\'s serverless '
    'function requirements that should be resolved at the framework level rather than patched post-build. There is '
    'no validation step to verify that the patched bundle is functionally equivalent to the pre-patch output.'
))

story.append(body(
    'The build configuration lacks several performance optimizations that are standard for production deployments. There '
    'is no bundle size budget enforcement, meaning the JavaScript payload can grow unbounded as features are added. '
    'Code splitting is likely handled by TanStack Start\'s built-in route-based splitting, but there is no evidence '
    'of manual chunk optimization for heavy dependencies like TradingView charting libraries, the AI streaming client, '
    'or the analytics SDK. The Vite configuration should leverage rollupOptions.manualChunks to isolate these heavy '
    'dependencies into separate chunks that can be loaded on demand. Additionally, there is no tree-shaking verification '
    'or unused export detection in the build pipeline.'
))

story.append(Spacer(1, 6))
story.append(heading('Build Configuration', sH2, level=1))

build_info = {
    'Bundler': 'Vite 7.3.1',
    'Framework': 'TanStack Start 1.168.25',
    'Post-Build Patching': 'fix-vercel-bundle.mjs (string replacements)',
    'Bundle Size Budget': 'Not configured',
    'Code Splitting': 'Route-based (TanStack Start default)',
    'Manual Chunks': 'Not configured',
    'Tree-Shaking Verification': 'Not configured',
    'Build Validation': 'No post-build functional tests',
    'SSR': 'Enabled (TanStack Start server-side rendering)',
}
story.append(info_table(build_info))

story.append(Spacer(1, 6))
story.append(heading('Build Problems', sH2, level=1))

build_problems = [
    ['BLD-01', 'P1', 'Post-build bundle patching is fragile and breaks on dependency updates', 'Silent build failures or runtime errors after upgrades', 'High', 'scripts/fix-vercel-bundle.mjs, vite.config.ts', 'Framework-serverless compatibility gap'],
    ['BLD-02', 'P1', 'No bundle size budget enforcement or regression detection', 'Uncontrolled JavaScript payload growth', 'High', 'vite.config.ts', 'Missing rollup-plugin-size-limit'],
    ['BLD-03', 'P2', 'Heavy dependencies (TradingView, AI SDK, Analytics) not isolated into manual chunks', 'Large initial bundle load, slow first contentful paint', 'Medium', 'vite.config.ts', 'Missing manualChunks configuration'],
    ['BLD-04', 'P2', 'No build-time type checking or linting in the build pipeline', 'Type errors and lint violations reach production', 'Medium', 'package.json, vite.config.ts', 'Missing tsc --noEmit in build script'],
    ['BLD-05', 'P2', 'No source map generation strategy documented for production debugging', 'Production errors difficult to trace to source', 'Medium', 'vite.config.ts', 'Missing sourcemap configuration'],
]
story.append(problem_table(build_problems))
story.append(Spacer(1, 6))
story.append(body('<b>Build &amp; Bundle Score: 6 / 10</b> - Modern toolchain but post-build patching is a critical fragility point.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 9: DEPLOYMENT & CI/CD AUDIT
# ============================================================
story.append(heading('9. Deployment &amp; CI/CD Audit', sH1, level=0))

story.append(body(
    'The VIXOR deployment pipeline represents the most operationally deficient area of the platform. There is no '
    'CI/CD pipeline whatsoever. No continuous integration checks run on code changes, no automated tests execute '
    'before deployment, and no deployment gates prevent broken code from reaching production. The current deployment '
    'workflow appears to rely on direct git pushes to the main branch, which trigger Vercel\'s built-in deployment '
    'mechanism. While Vercel provides preview deployments for pull requests, the absence of CI checks means these '
    'previews are not validated against any quality criteria before being promoted to production.'
))

story.append(body(
    'The absence of automated testing is the single most critical operational gap identified in this audit. With zero '
    'test coverage, every code change is effectively a blind deployment. There are no unit tests for utility functions '
    'and data transformations, no integration tests for API endpoints, no end-to-end tests for user flows, and no '
    'visual regression tests for the UI layer. The codebase does include a vitest configuration file and some test '
    'utility files, but the actual test coverage is negligible. Given the complexity of the platform with its 32 '
    'database tables, 15 API endpoints, 3 authentication pathways, real-time WebSocket connections, and multi-provider '
    'AI integration, the lack of automated verification is a significant risk multiplier for every deployment.'
))

story.append(body(
    'Vercel\'s deployment infrastructure itself is well-suited for the application architecture. Serverless functions '
    'provide automatic scaling, edge caching, and integrated CDN for static assets. The Vercel cron configuration '
    'correctly schedules the two background jobs (generate-signals at midnight, check-alerts at 00:30). However, '
    'without CI/CD, the deployment process lacks rollback automation, canary releases, and deployment verification. '
    'A failed deployment can only be detected after users are affected, and rollback requires manual intervention '
    'through the Vercel dashboard. There is no blue-green or canary deployment strategy, and no deployment pipeline '
    'that could enable progressive rollouts with automated rollback on error rate increase.'
))

story.append(Spacer(1, 6))
story.append(heading('CI/CD Status', sH2, level=1))

cicd_info = {
    'CI Pipeline': 'None (no GitHub Actions, no CircleCI, no Jenkins)',
    'Automated Tests': 'Zero coverage (vitest configured but unused)',
    'Code Quality Gates': 'None (no lint, no type-check, no bundle check)',
    'Deployment Method': 'Git push to main triggers Vercel deploy',
    'Preview Deployments': 'Vercel built-in (no validation)',
    'Rollback Strategy': 'Manual via Vercel dashboard',
    'Canary/Blue-Green': 'Not implemented',
    'Environment Separation': 'Production only (no staging)',
    'Deployment Verification': 'None (no smoke tests post-deploy)',
}
story.append(info_table(cicd_info))

story.append(Spacer(1, 6))
story.append(heading('CI/CD Problems', sH2, level=1))

cicd_problems = [
    ['CI-01', 'P0', 'Zero automated tests across the entire codebase (32 tables, 15 endpoints, 3 auth flows)', 'Every deployment is unverified; regressions reach production silently', 'Critical', 'Entire codebase', 'No test infrastructure or culture'],
    ['CI-02', 'P0', 'No CI pipeline for any automated checks before deployment', 'No type checking, linting, or security scanning on code changes', 'Critical', 'Infrastructure', 'No CI/CD tooling configured'],
    ['CI-03', 'P1', 'No staging environment for pre-production validation', 'All testing happens against production data and users', 'High', 'Infrastructure', 'Single-environment deployment'],
    ['CI-04', 'P1', 'No deployment verification or smoke tests after Vercel deploy', 'Broken deployments detected only by user reports', 'High', 'vercel.json, Infrastructure', 'Missing post-deploy validation'],
    ['CI-05', 'P1', 'No canary or blue-green deployment strategy for safe rollouts', 'Failed deployments affect 100% of users immediately', 'High', 'vercel.json, Infrastructure', 'Missing progressive deployment'],
    ['CI-06', 'P2', 'No environment variable validation or secret rotation mechanism', 'Missing or invalid environment variables cause silent failures', 'Medium', '.env.example, Vercel env config', 'No env validation step'],
]
story.append(problem_table(cicd_problems))
story.append(Spacer(1, 6))
story.append(body('<b>CI/CD Score: 2 / 10</b> - Existential risk. Zero tests and no CI means every deploy is a leap of faith.'))

story.append(PageBreak())

# ============================================================
# CHAPTER 10: IMMEDIATE FIXES & FUTURE IMPROVEMENTS
# ============================================================
story.append(heading('10. Immediate Fixes &amp; Future Improvements', sH1, level=0))

story.append(body(
    'Based on the comprehensive audit findings across all nine areas, this chapter provides a prioritized action plan '
    'organized into immediate fixes (P0 issues requiring action within 1-2 weeks), short-term improvements (P1 issues '
    'for the next 1-3 months), and long-term strategic initiatives (P2 and architectural improvements for the next '
    'quarter). The prioritization considers both the severity of the finding and the effort required for remediation, '
    'ensuring that the highest-impact issues are addressed first with reasonable effort investment.'
))

story.append(Spacer(1, 4))
story.append(heading('Immediate Fixes (1-2 Weeks)', sH2, level=1))

story.append(body(
    'The four P0 issues identified in this audit require immediate attention. First, the monitoring and alerting gap '
    '(MON-01, MON-02) should be addressed by deploying a lightweight monitoring solution such as UptimeRobot for '
    'external health checks and setting up Sentry alerts to route critical errors to a communication channel. Second, '
    'the testing gap (CI-01) should be mitigated by establishing a minimal test scaffold with at least API endpoint '
    'smoke tests and critical path unit tests, even if full coverage will take months to achieve. Third, the admin '
    'endpoint security (SEC-01) should be hardened by adding IP allowlisting to the Vercel cron configuration, '
    'restricting admin-key endpoints to Vercel\'s known cron IP ranges. Fourth, the database RLS verification (DB-01) '
    'should be completed by auditing all 32 tables and confirming or enabling Row-Level Security policies on every table '
    'containing user-specific data.'
))

story.append(Spacer(1, 4))
story.append(heading('Short-Term Improvements (1-3 Months)', sH2, level=1))

story.append(body(
    'Short-term improvements should focus on establishing CI/CD infrastructure, improving resilience patterns, and '
    'fixing authentication weaknesses. A GitHub Actions CI pipeline should be configured with type checking (tsc --noEmit), '
    'linting (eslint), bundle size checks, and automated test execution on every pull request. The wallet nonce '
    'authentication should be hardened with explicit TTL enforcement and the Telegram init_data validation should '
    'include timestamp freshness checks. A session revocation mechanism should be implemented for JWT tokens. External '
    'API calls should be wrapped with retry logic using exponential backoff with jitter. The in-memory LRU cache '
    'should be removed from the serverless deployment path or replaced with a pure Redis-backed cache. Webhook '
    'endpoints should implement payload signature verification for Telegram and Stars integrations.'
))

story.append(Spacer(1, 4))
story.append(heading('Long-Term Strategic Initiatives', sH2, level=1))

story.append(body(
    'Long-term strategic initiatives should transform VIXOR from a functional prototype into a production-grade '
    'platform. A comprehensive test suite should be developed targeting 80%+ coverage across unit, integration, and '
    'end-to-end layers. The build pipeline should be refactored to eliminate the fragile post-build patching step, '
    'either by contributing upstream fixes to TanStack Start or by migrating to a more Vercel-compatible framework '
    'configuration. A staging environment should be established with production-like data for pre-deployment validation. '
    'The monitoring stack should be expanded to include Grafana dashboards, distributed tracing with OpenTelemetry, '
    'and SLA-based alerting with PagerDuty or equivalent. The database layer should implement audit logging, connection '
    'pooling optimization, and a schema migration safety net with automated rollback capability.'
))

story.append(Spacer(1, 6))
story.append(heading('Priority Action Matrix', sH2, level=1))

action_rows = [
    [Paragraph('<b>Priority</b>', sTableHeader), Paragraph('<b>Action</b>', sTableHeader), Paragraph('<b>Effort</b>', sTableHeader), Paragraph('<b>Impact</b>', sTableHeader), Paragraph('<b>Timeline</b>', sTableHeader)],
    [Paragraph('P0', ParagraphStyle('p0c', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_ERROR)), Paragraph('Deploy UptimeRobot + Sentry alert routing', sTableCell), Paragraph('1 day', sTableCell), Paragraph('Critical', sTableCell), Paragraph('Week 1', sTableCell)],
    [Paragraph('P0', ParagraphStyle('p0c2', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_ERROR)), Paragraph('Add IP allowlisting to cron endpoints', sTableCell), Paragraph('2 hours', sTableCell), Paragraph('Critical', sTableCell), Paragraph('Week 1', sTableCell)],
    [Paragraph('P0', ParagraphStyle('p0c3', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_ERROR)), Paragraph('Verify and enable RLS on all 32 tables', sTableCell), Paragraph('1 day', sTableCell), Paragraph('Critical', sTableCell), Paragraph('Week 1-2', sTableCell)],
    [Paragraph('P0', ParagraphStyle('p0c4', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_ERROR)), Paragraph('Create minimal test scaffold with API smoke tests', sTableCell), Paragraph('3 days', sTableCell), Paragraph('High', sTableCell), Paragraph('Week 2', sTableCell)],
    [Paragraph('P1', ParagraphStyle('p1c', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_WARNING)), Paragraph('Set up GitHub Actions CI with tsc, lint, test', sTableCell), Paragraph('2 days', sTableCell), Paragraph('High', sTableCell), Paragraph('Month 1', sTableCell)],
    [Paragraph('P1', ParagraphStyle('p1c2', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_WARNING)), Paragraph('Add nonce TTL + Telegram timestamp validation', sTableCell), Paragraph('1 day', sTableCell), Paragraph('High', sTableCell), Paragraph('Month 1', sTableCell)],
    [Paragraph('P1', ParagraphStyle('p1c3', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_WARNING)), Paragraph('Remove in-memory LRU, use pure Redis cache', sTableCell), Paragraph('1 day', sTableCell), Paragraph('Medium', sTableCell), Paragraph('Month 1', sTableCell)],
    [Paragraph('P1', ParagraphStyle('p1c4', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_WARNING)), Paragraph('Add retry with backoff for external APIs', sTableCell), Paragraph('2 days', sTableCell), Paragraph('High', sTableCell), Paragraph('Month 2', sTableCell)],
    [Paragraph('P1', ParagraphStyle('p1c5', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_WARNING)), Paragraph('Implement webhook payload verification', sTableCell), Paragraph('2 days', sTableCell), Paragraph('High', sTableCell), Paragraph('Month 2', sTableCell)],
    [Paragraph('P2', ParagraphStyle('p2c', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_INFO)), Paragraph('Achieve 80%+ test coverage', sTableCell), Paragraph('4 weeks', sTableCell), Paragraph('High', sTableCell), Paragraph('Quarter', sTableCell)],
    [Paragraph('P2', ParagraphStyle('p2c2', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_INFO)), Paragraph('Eliminate post-build bundle patching', sTableCell), Paragraph('2 weeks', sTableCell), Paragraph('Medium', sTableCell), Paragraph('Quarter', sTableCell)],
    [Paragraph('P2', ParagraphStyle('p2c3', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_INFO)), Paragraph('Deploy Grafana + OpenTelemetry tracing', sTableCell), Paragraph('1 week', sTableCell), Paragraph('High', sTableCell), Paragraph('Quarter', sTableCell)],
    [Paragraph('P2', ParagraphStyle('p2c4', fontName='FreeSerif-Bold', fontSize=9, leading=12, textColor=SEM_INFO)), Paragraph('Establish staging environment', sTableCell), Paragraph('1 week', sTableCell), Paragraph('High', sTableCell), Paragraph('Quarter', sTableCell)],
]
action_table = Table(action_rows, colWidths=[50, 215, 55, 55, 55])
action_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(action_table)

story.append(Spacer(1, 10))
story.append(heading('Audit Conclusion', sH2, level=1))
story.append(body(
    'VIXOR demonstrates strong architectural foundations with well-structured domain modules, thoughtful security '
    'header configuration, an effective Redis-backed rate limiting system, and a sensible hybrid caching approach '
    'for distributed environments. The platform\'s multi-provider AI integration, real-time WebSocket connections, '
    'and dual Supabase client pattern reflect engineering maturity in the core design. However, the operational '
    'layer is critically underdeveloped: the absence of automated testing, CI/CD pipelines, monitoring/alerting, '
    'and staging environments creates a fragile deployment pipeline where every release carries significant risk.'
))

story.append(body(
    'The most urgent recommendation is to establish a minimal operational safety net within the first two weeks: deploy '
    'external uptime monitoring, add IP restrictions to admin endpoints, verify database security policies, and create '
    'a basic test scaffold. These four actions alone would dramatically reduce the platform\'s operational risk profile. '
    'Subsequently, building out CI/CD infrastructure and achieving meaningful test coverage should be the top priority '
    'for the next quarter, as these foundational capabilities enable all other improvements with confidence. The VIXOR '
    'platform has the architectural strength to scale; what it needs now is the operational discipline to ship safely.'
))

# ============================================================
# BUILD PDF
# ============================================================
doc.multiBuild(story)
print(f"PDF generated: {OUTPUT}")
fsize = os.path.getsize(OUTPUT)
print(f"File size: {fsize:,} bytes ({fsize/1024:.1f} KB)")
