#!/usr/bin/env python3
"""VIXOR Comprehensive Technical Audit Report - PDF Generator"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm, inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, Image, HRFlowable, ListFlowable, ListItem
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY

# ─── Font Registration ───────────────────────────────────────────────────────
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('NotoSerifSC', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
pdfmetrics.registerFont(TTFont('NotoSansSC', f'{FONT_DIR}/truetype/chinese/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSansSC-Bold', f'{FONT_DIR}/truetype/chinese/LiberationSans-Regular.ttf'))
registerFontFamily('NotoSansSC', normal='NotoSansSC', bold='NotoSansSC-Bold')
pdfmetrics.registerFont(TTFont('Inter', f'{FONT_DIR}/truetype/liberation/LiberationSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Inter-Bold', f'{FONT_DIR}/truetype/liberation/LiberationSans-Bold.ttf'))
registerFontFamily('Inter', normal='Inter', bold='Inter-Bold')

# ─── Cascade Palette ────────────────────────────────────────────────────────
PAGE_BG       = colors.HexColor('#f4f5f5')
SECTION_BG    = colors.HexColor('#f0f1f2')
CARD_BG       = colors.HexColor('#e8eaeb')
TABLE_STRIPE  = colors.HexColor('#ebeded')
HEADER_FILL   = colors.HexColor('#32454e')
COVER_BLOCK   = colors.HexColor('#566a74')
BORDER        = colors.HexColor('#acbdc5')
ICON          = colors.HexColor('#4b86a4')
ACCENT        = colors.HexColor('#1f6c92')
ACCENT_2      = colors.HexColor('#c23a50')
TEXT_PRIMARY   = colors.HexColor('#131515')
TEXT_MUTED     = colors.HexColor('#747b7e')
SEM_SUCCESS   = colors.HexColor('#529067')
SEM_WARNING   = colors.HexColor('#8c7443')
SEM_ERROR     = colors.HexColor('#a25b54')
SEM_INFO      = colors.HexColor('#507aa4')

# ─── Output ─────────────────────────────────────────────────────────────────
OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'VIXOR_Technical_Audit_Report.pdf')
COVER_IMG = '/home/z/my-project/scripts/vixor-audit-cover.png'

# ─── Styles ─────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

s_h1 = ParagraphStyle('H1', fontName='NotoSansSC-Bold', fontSize=18, leading=24,
    textColor=TEXT_PRIMARY, spaceBefore=20, spaceAfter=10, keepWithNext=True)
s_h2 = ParagraphStyle('H2', fontName='NotoSansSC-Bold', fontSize=14, leading=19,
    textColor=ACCENT, spaceBefore=16, spaceAfter=8, keepWithNext=True)
s_h3 = ParagraphStyle('H3', fontName='NotoSansSC-Bold', fontSize=11, leading=15,
    textColor=TEXT_PRIMARY, spaceBefore=12, spaceAfter=6, keepWithNext=True)
s_body = ParagraphStyle('Body', fontName='NotoSansSC', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=6, wordWrap='CJK')
s_body_small = ParagraphStyle('BodySmall', fontName='NotoSansSC', fontSize=8.5, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=4, wordWrap='CJK')
s_code = ParagraphStyle('Code', fontName='Inter', fontSize=7.5, leading=10,
    textColor=colors.HexColor('#1a1a2e'), backColor=colors.HexColor('#f5f5f5'),
    borderWidth=0.5, borderColor=BORDER, borderPadding=6, spaceAfter=6,
    leftIndent=12, rightIndent=12, wordWrap='CJK')
s_caption = ParagraphStyle('Caption', fontName='NotoSansSC', fontSize=8, leading=11,
    textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=10)
s_bullet = ParagraphStyle('Bullet', fontName='NotoSansSC', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, leftIndent=18, bulletIndent=6, spaceAfter=3, wordWrap='CJK')
s_crit = ParagraphStyle('Critical', fontName='NotoSansSC-Bold', fontSize=9.5, leading=14,
    textColor=SEM_ERROR, leftIndent=18, bulletIndent=6, spaceAfter=3, wordWrap='CJK')
s_high = ParagraphStyle('High', fontName='NotoSansSC-Bold', fontSize=9.5, leading=14,
    textColor=colors.HexColor('#c27030'), leftIndent=18, bulletIndent=6, spaceAfter=3, wordWrap='CJK')
s_med = ParagraphStyle('Med', fontName='NotoSansSC', fontSize=9.5, leading=14,
    textColor=SEM_WARNING, leftIndent=18, bulletIndent=6, spaceAfter=3, wordWrap='CJK')

# ─── TOC Styles ─────────────────────────────────────────────────────────────
toc_h0 = ParagraphStyle('TOC0', fontName='NotoSansSC-Bold', fontSize=11, leading=18,
    leftIndent=0, textColor=TEXT_PRIMARY)
toc_h1 = ParagraphStyle('TOC1', fontName='NotoSansSC', fontSize=9.5, leading=16,
    leftIndent=20, textColor=TEXT_MUTED)

# ─── Helper Functions ───────────────────────────────────────────────────────
def heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def hr():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceBefore=8, spaceAfter=8)

def severity_table(data_rows):
    """Build a severity-styled issue table."""
    header = [
        Paragraph('<b>#</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=8, textColor=colors.white, alignment=TA_CENTER)),
        Paragraph('<b>File</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=8, textColor=colors.white)),
        Paragraph('<b>Severity</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=8, textColor=colors.white, alignment=TA_CENTER)),
        Paragraph('<b>Issue</b>', ParagraphStyle('th', fontName='NotoSansSC-Bold', fontSize=8, textColor=colors.white)),
    ]
    cell_s = ParagraphStyle('tc', fontName='NotoSansSC', fontSize=8, leading=11, wordWrap='CJK')
    rows = [header]
    for i, (fname, sev, issue) in enumerate(data_rows, 1):
        sev_color = {
            'CRITICAL': SEM_ERROR, 'HIGH': colors.HexColor('#c27030'),
            'MEDIUM': SEM_WARNING, 'LOW': TEXT_MUTED, 'INFO': TEXT_MUTED
        }.get(sev, TEXT_MUTED)
        rows.append([
            Paragraph(str(i), ParagraphStyle('tn', fontName='Inter', fontSize=8, alignment=TA_CENTER)),
            Paragraph(fname, cell_s),
            Paragraph(f'<b>{sev}</b>', ParagraphStyle('ts', fontName='NotoSansSC-Bold', fontSize=8, textColor=sev_color, alignment=TA_CENTER)),
            Paragraph(issue, cell_s),
        ])
    avail = A4[0] - 72 - 72
    t = Table(rows, colWidths=[avail*0.06, avail*0.22, avail*0.14, avail*0.58], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    return t

def code_block(text):
    return Paragraph(text.replace('\n', '<br/>').replace(' ', '&nbsp;'), s_code)

def bullet(text, style=s_bullet):
    return Paragraph(f'<bullet>&bull;</bullet>{text}', style)

# ─── TocDocTemplate ────────────────────────────────────────────────────────
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ─── Page Number Footer ────────────────────────────────────────────────────
def add_page_number(canvas, doc):
    if doc.page <= 2:
        return
    canvas.saveState()
    canvas.setFont('Inter', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawCentredString(A4[0]/2, 25, f'{doc.page - 2}')
    canvas.restoreState()

# ─── Build Story ────────────────────────────────────────────────────────────
story = []

# Page 1: Cover image
if os.path.exists(COVER_IMG):
    from reportlab.lib.utils import ImageReader
    ir = ImageReader(COVER_IMG)
    img_w, img_h = ir.getSize()
    frame_w = A4[0] - 72 - 72
    frame_h = A4[1] - 60 - 60
    ratio = min(frame_w / img_w, frame_h / img_h)
    cover_img = Image(COVER_IMG, width=img_w * ratio, height=img_h * ratio)
    cover_img.hAlign = 'CENTER'
    story.append(cover_img)
    story.append(PageBreak())

# Page 2: Table of Contents
toc = TableOfContents()
toc.levelStyles = [toc_h0, toc_h1]
story.append(Paragraph('Table of Contents', ParagraphStyle('TOCTitle', fontName='NotoSansSC-Bold',
    fontSize=20, leading=28, textColor=TEXT_PRIMARY, spaceBefore=40, spaceAfter=20)))
story.append(hr())
story.append(toc)
story.append(PageBreak())

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 1: Executive Summary
# ══════════════════════════════════════════════════════════════════════════
story.append(heading('1. Executive Summary', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'This report provides a comprehensive technical audit of the VIXOR crypto trading dashboard application, '
    'a React/TanStack Start based Telegram Web App. The audit was triggered by user-reported issues across 13 categories '
    'identified from application screenshots, covering UI inconsistencies, mock data usage, missing real-time data, '
    'broken analysis pipelines, and security vulnerabilities. Three files were previously modified in attempted fixes, '
    'and this report verifies the current state of those changes while cataloging all remaining and newly discovered issues.',
    s_body))
story.append(Paragraph(
    'The VIXOR application is built on a modern stack including React, TanStack Start, TanStack Query, Binance WebSocket '
    'for real-time crypto prices, TwelveData for forex/commodity data, OpenRouter AI for chart analysis, and Supabase '
    'for persistence. The design system uses a dark theme with primary color #6366F1 (indigo), bullish #22D3A6 (green), '
    'bearish #FB4667 (red), and gold #F0C419 accents. The app targets Telegram Web App deployment, which imposes specific '
    'constraints on viewport size and navigation patterns.',
    s_body))
story.append(Paragraph(
    'The audit found that while 3 backend fixes were successfully applied and persisted in the codebase, they address only '
    'a small fraction of the overall problem surface. The three verified fixes are: (1) LINK/USDT added to AssetRegistry, '
    '(2) useLivePrices changed from .get() to .find() for resilience, and (3) OpenRouter model ID corrected with local '
    'fallback engine. However, 5 CRITICAL issues, 3 HIGH issues, 7 MEDIUM issues, and numerous LOW/INFO issues remain '
    'unaddressed across the application, spanning mock data in production pages, security vulnerabilities in authentication '
    'middleware, data leak between users, and broken UI components.',
    s_body))

# Summary stats table
story.append(Spacer(1, 10))
stats_data = [
    [Paragraph('<b>Metric</b>', ParagraphStyle('sh', fontName='NotoSansSC-Bold', fontSize=9, textColor=colors.white)),
     Paragraph('<b>Value</b>', ParagraphStyle('sh', fontName='NotoSansSC-Bold', fontSize=9, textColor=colors.white, alignment=TA_CENTER))],
    [Paragraph('Files Verified as Fixed', s_body), Paragraph('3 of 3', ParagraphStyle('sc', fontName='NotoSansSC-Bold', fontSize=9, alignment=TA_CENTER, textColor=SEM_SUCCESS))],
    [Paragraph('Total Issues Found', s_body), Paragraph('20+', ParagraphStyle('sc', fontName='NotoSansSC-Bold', fontSize=9, alignment=TA_CENTER, textColor=SEM_ERROR))],
    [Paragraph('Critical Issues', s_body), Paragraph('5', ParagraphStyle('sc', fontName='NotoSansSC-Bold', fontSize=9, alignment=TA_CENTER, textColor=SEM_ERROR))],
    [Paragraph('High Severity', s_body), Paragraph('3', ParagraphStyle('sc', fontName='NotoSansSC-Bold', fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#c27030')))],
    [Paragraph('Medium Severity', s_body), Paragraph('7+', ParagraphStyle('sc', fontName='NotoSansSC-Bold', fontSize=9, alignment=TA_CENTER, textColor=SEM_WARNING))],
    [Paragraph('13 Original Categories Resolved', s_body), Paragraph('0 of 13', ParagraphStyle('sc', fontName='NotoSansSC-Bold', fontSize=9, alignment=TA_CENTER, textColor=SEM_ERROR))],
]
avail = A4[0] - 72 - 72
stats_t = Table(stats_data, colWidths=[avail*0.7, avail*0.3])
stats_t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(stats_t)
story.append(Paragraph('Table 1: Audit Summary Statistics', s_caption))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 2: Fix Verification - The 3 Modified Files
# ══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(heading('2. Fix Verification - Modified Files Analysis', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'Three files were modified across three fix commits: <b>8c859bd</b> (AssetRegistry + useLivePrices), '
    '<b>b6076e6</b> (OpenRouter model ID), and <b>a6e1fe2</b> (local fallback engine). A fourth file, '
    '<b>download/openrouter_free_models.json</b>, was a data lookup file, not a source code fix. '
    'This section provides a detailed verification of each fix, confirming what was actually applied '
    'versus what the user suspected might have been lost.',
    s_body))

# Fix 1: AssetRegistry
story.append(heading('2.1 AssetRegistry (types.ts) - VERIFIED FIXED', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/shared/asset-registry/types.ts</font><br/>'
    '<b>Commit:</b> 8c859bd<br/>'
    '<b>Status:</b> <font color="#529067"><b>FIXED AND PERSISTED</b></font>',
    s_body))
story.append(Paragraph(
    'The LINK/USDT asset entry has been successfully added to the ASSETS array at lines 347-364. The entry includes '
    'complete symbol mappings for Binance (LINKUSDT), TwelveData (LINK/USDT), and TradingView (BINANCE:LINKUSDT), '
    'along with proper configuration parameters including pipSize of 0.01, 2 decimal places, volatility of 0.03, '
    'typicalRange of 0.04, and a basePrice of 18. The asset is correctly marked as active and popular with priority 8, '
    'ensuring it appears in quick-select lists and signal generation.',
    s_body))
story.append(Paragraph(
    'Additionally, a new <font face="Inter">.find(pair)</font> method was added to the AssetRegistryClass at line 693, '
    'which returns <font face="Inter">AssetDefinition | undefined</font> instead of throwing an error like the existing '
    '<font face="Inter">.get(pair)</font> method. This provides a safe lookup path for callers that need to handle '
    'unknown pairs gracefully without try/catch blocks. The <font face="Inter">.get()</font> method at line 686 '
    'still throws <font face="Inter">Error("[AssetRegistry] Unknown pair: ...")</font> for strict validation scenarios.',
    s_body))

# Fix 2: useLivePrices
story.append(heading('2.2 useLivePrices Hook - VERIFIED FIXED', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/shared/market-data/use-live-prices.ts</font><br/>'
    '<b>Commit:</b> 8c859bd<br/>'
    '<b>Status:</b> <font color="#529067"><b>FIXED AND PERSISTED</b></font>',
    s_body))
story.append(Paragraph(
    'The critical crash bug has been fixed. At line 77, the code now uses <font face="Inter">AssetRegistry.find(pair)</font> '
    'instead of the previous <font face="Inter">AssetRegistry.get(pair)</font>. The <font face="Inter">.find()</font> method '
    'returns undefined for unknown pairs instead of throwing an exception. At line 78, the code gracefully skips unknown pairs '
    'with <font face="Inter">if (!asset) continue;</font>, preventing the entire price feed from crashing when an '
    'unregistered pair (like LINK/USDT before the fix) is requested.',
    s_body))
story.append(Paragraph(
    'The same pattern is applied consistently at line 156 and line 193, where <font face="Inter">AssetRegistry.find()</font> '
    'is used with proper undefined checks. The fix is architecturally correct: it makes the hook resilient to registry '
    'gaps without silently hiding errors. Unknown pairs are simply excluded from the live price feed rather than crashing '
    'the entire application.',
    s_body))

# Fix 3: run-analysis
story.append(heading('2.3 Analysis Runner - VERIFIED FIXED', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/domains/analysis/server/run-analysis.ts</font><br/>'
    '<b>Commits:</b> b6076e6 + a6e1fe2<br/>'
    '<b>Status:</b> <font color="#529067"><b>BOTH FIXES PERSISTED</b></font>',
    s_body))
story.append(Paragraph(
    'Two fixes were applied to this file and both are confirmed present. First, at line 226, the OpenRouter model ID was '
    'changed from the invalid <font face="Inter">google/gemini-2.0-flash-lite-preview-02-05:free</font> to '
    '<font face="Inter">google/gemma-4-31b-it:free</font>, read from <font face="Inter">process.env.OPENROUTER_MODEL</font> '
    'with the new model as the default fallback. This ensures the analysis pipeline uses a valid, accessible free model '
    'from OpenRouter.',
    s_body))
story.append(Paragraph(
    'Second, a comprehensive fallback mechanism was added. At lines 180-190, when no OPENROUTER_API_KEY environment '
    'variable is set, the system immediately falls back to the local analysis engine via '
    '<font face="Inter">runLocalAnalysisFallback()</font> instead of crashing. Additionally, at lines 307-319, a try/catch '
    'block wraps the entire OpenRouter API call, so if the API request fails (network error, rate limit, invalid response), '
    'the system gracefully degrades to the local engine. The local fallback at lines 326-408 includes its own error handling: '
    'if even the local engine fails, it generates a synthetic fallback result using <font face="Inter">generateFallbackResult()</font>. '
    'This creates a three-tier resilience: OpenRouter API, local analysis engine, synthetic fallback.',
    s_body))

# Fix 4: openrouter_free_models.json
story.append(heading('2.4 Fourth File: openrouter_free_models.json', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">download/openrouter_free_models.json</font><br/>'
    '<b>Commit:</b> b6076e6<br/>'
    '<b>Status:</b> <font color="#747b7e">Data file (not source code)</font>',
    s_body))
story.append(Paragraph(
    'This file is a JSON data dump of available free models from the OpenRouter API, used as a reference during the model '
    'ID fix investigation. It is not a source code file and contains no application logic. It was generated during debugging '
    'to identify valid free model IDs. This file has no impact on the application runtime and does not require verification '
    'as a "fix". It is included here for completeness of the audit trail only.',
    s_body))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 3: Complete Issue Taxonomy
# ══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(heading('3. Complete Issue Taxonomy', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'This chapter catalogs all issues discovered during the comprehensive codebase scan, organized by severity. '
    'Each issue includes the exact file path, line number where applicable, a description of the problem, and the '
    'potential impact on the application. The issues span security vulnerabilities, data integrity problems, mock data '
    'in production, architectural concerns, and UI/UX deficiencies.',
    s_body))

# 3.1 Critical
story.append(heading('3.1 Critical Issues (Fix Immediately)', s_h2, 1))
story.append(severity_table([
    ('swap-component.tsx (L12-25)', 'CRITICAL', 'Entire swap page uses hardcoded static prices for 12 tokens. PRICES object contains fake values (SOL: 145.23) that never update. Users see fabricated data as if real.'),
    ('swap-component.tsx (L50-63)', 'CRITICAL', 'MOCK_BALANCES uses fake wallet balances (SOL: 42.5, USDT: 3200.0). No real wallet connection exists. Users could mistake this for real trading.'),
    ('swap-component.tsx (L73-90)', 'CRITICAL', 'useMockWallet() hook returns a hardcoded address (7xKXtg2...). No real Solana wallet integration (Phantom, Solflare).'),
    ('swap-component.tsx (L103-158)', 'CRITICAL', 'getSwapHistory() returns hardcoded fake swap history with fabricated dates and amounts. History is stored in localStorage only.'),
    ('shared/data/index.ts (L318-323)', 'CRITICAL', 'getWatchlistData fetches ALL watchlist_items WITHOUT user_id filter. Every user sees every other user\'s watchlist items - data leak between users.'),
]))
story.append(Paragraph('Table 2: Critical Issues', s_caption))

story.append(Paragraph(
    'The swap component issue is the most severe: the entire page presents itself as a functional DEX swap interface '
    'with token selection, amount input, and transaction history, but every piece of data is fabricated. There is no '
    'Jupiter DEX integration, no real wallet connection via Solana wallet adapters, and no real transaction execution. '
    'A user could attempt to "swap" tokens, see a "successful" transaction in their history, and believe the trade was '
    'executed when nothing actually happened on-chain.',
    s_body))
story.append(Paragraph(
    'The watchlist data leak is equally critical from a security perspective. The <font face="Inter">getWatchlistData</font> '
    'function queries the <font face="Inter">watchlist_items</font> table without any user_id filter or JOIN to the '
    '<font face="Inter">watchlists</font> table. The comment in the code acknowledges this: "watchlist_items doesn\'t have '
    'user_id - join via watchlists" but NO join is actually performed. This means User A can see User B\'s private '
    'watchlist, including any tokens they are monitoring for trading signals.',
    s_body))

# 3.2 High
story.append(heading('3.2 High Severity Issues', s_h2, 1))
story.append(severity_table([
    ('server/api/_security.ts (L95-99)', 'HIGH', 'requireAuth() only checks for "Bearer " prefix - never validates the actual JWT token. Any string starting with "Bearer " passes authentication. Complete auth bypass.'),
    ('components/vixor/EquityChart.tsx (L85)', 'HIGH', 'Static SVG gradient ID "equityGradient" - if multiple EquityChart instances render on the same page, they share the same gradient ID causing color override.'),
    ('shared/data/index.ts (L1317-1326)', 'HIGH', 'scanArbitrage() returns empty mock response. The entire arbitrage feature is a stub returning {opportunities: [], mode: "mock"}. Arbitrage page shows nothing functional.'),
]))
story.append(Paragraph('Table 3: High Severity Issues', s_caption))

story.append(Paragraph(
    'The authentication bypass in <font face="Inter">_security.ts</font> is a serious security vulnerability. The '
    '<font face="Inter">requireAuth</font> function at line 95-99 checks only that the Authorization header starts '
    'with "Bearer " and returns true without ever validating the token against Supabase JWT or any other verification '
    'mechanism. This means any unauthenticated request with the header <font face="Inter">Authorization: Bearer anything</font> '
    'will pass authentication. All API routes that rely on this middleware are effectively unprotected.',
    s_body))

# 3.3 Medium
story.append(heading('3.3 Medium Severity Issues', s_h2, 1))
story.append(severity_table([
    ('discover-forex-data.ts (L91)', 'MEDIUM', 'Server function has NO requireSupabaseAuth middleware - forex discover data is publicly accessible to unauthenticated users.'),
    ('routes/_authenticated/index.tsx (L1190)', 'MEDIUM', 'getHomeMarketData server function has no auth middleware - market data endpoint is unauthenticated.'),
    ('analysis-id-component.tsx (L138-142)', 'MEDIUM', 'Analysis polls at 3-second intervals when status is "processing". If analysis gets stuck, this polls indefinitely with no timeout mechanism.'),
    ('server/api/_security.ts (L54-77)', 'MEDIUM', 'In-memory rate limiting (Map) does not work across serverless instances (Vercel). Each function invocation gets its own Map, defeating rate limits.'),
    ('routes/_authenticated/discover.tsx (L1455)', 'MEDIUM', 'Text "Mock data" rendered in forex tab UI even though forex data is now live. Stale comment misleads users.'),
    ('routes/_authenticated/index.tsx (L1247)', 'MEDIUM', 'btcDominance is hardcoded to 0 - never actually fetched. Comment admits this limitation.'),
    ('routes/_authenticated/swap-component.tsx (L180)', 'MEDIUM', 'formatAmount uses PRICES[symbol] to determine decimals. For tokens not in the hardcoded PRICES map, comparison returns undefined causing potential NaN.'),
]))
story.append(Paragraph('Table 4: Medium Severity Issues', s_caption))

# 3.4 Low/Info
story.append(heading('3.4 Low and Informational Issues', s_h2, 1))
story.append(severity_table([
    ('index.tsx (L281, 427, 613)', 'LOW', 'Multiple "as any" type assertions to bypass router type-checking. Weakens TypeScript safety.'),
    ('index.tsx (L1232-1239)', 'LOW', 'Binance API response typed as "any" - no runtime validation of API response shape.'),
    ('signals.tsx (L276-277)', 'LOW', 'Sound plays for ALL new signals on first load. Refetch with re-sort could trigger false "new signal" sounds.'),
    ('HunterScoreCard.tsx (L124-125)', 'LOW', 'useEffect runs mutation on mount with empty deps + eslint-disable. Stale data if props change.'),
    ('TradingViewTickerTape.tsx (L30-37)', 'LOW', 'Hardcoded default symbol list (6 symbols baked in). Cannot be customized without prop override.'),
    ('binance-ws.ts (L272-274)', 'INFO', 'symbolToPair uses lastIndexOf("USDT") - for symbols like "BSUSDT" would split incorrectly.'),
    ('server/api/_security.ts (L88-93)', 'INFO', 'ADMIN_API_KEY has no .env.example entry. May be unset, making admin routes inaccessible.'),
]))
story.append(Paragraph('Table 5: Low and Informational Issues', s_caption))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 4: 13 Issue Categories Mapping
# ══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(heading('4. Original 13 Issue Categories - Status Mapping', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'The user originally reported issues across 13 categories based on application screenshots. This section maps '
    'each original category to its current status, identifying which specific code files and lines are responsible, '
    'and what KIMI K3 needs to fix. None of the 13 categories have been fully resolved by the 3 backend fixes.',
    s_body))

cat_data = [
    [Paragraph('<b>#</b>', ParagraphStyle('ch', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=colors.white, alignment=TA_CENTER)),
     Paragraph('<b>Category</b>', ParagraphStyle('ch', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=colors.white)),
     Paragraph('<b>Status</b>', ParagraphStyle('ch', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=colors.white, alignment=TA_CENTER)),
     Paragraph('<b>Root Cause / Key Files</b>', ParagraphStyle('ch', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=colors.white))],
    [Paragraph('1', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Top Bar Inconsistencies', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('Inconsistent layout/spacing across navbar. Check AppShell and layout components.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('2', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Static/Dead Widgets on Home', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('btcDominance hardcoded to 0 (index.tsx L1247). Some widgets may still use static data.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('3', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Mock Data in Production', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('swap-component.tsx is entirely mock. scanArbitrage returns mock. "Mock data" text visible in discover.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('4', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('No Real Charts', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('TradingViewMiniChart uses external iframe embed. No native charting library integration.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('5', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Unprofessional Analysis UI', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('Analysis result display needs review. Check analysis-id-component.tsx for layout issues.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('6', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Wrong Analysis Results', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>PARTIAL</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_WARNING, alignment=TA_CENTER)),
     Paragraph('Model ID fixed (gemma-4-31b-it:free). But model quality may still produce inaccurate SMC analysis.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('7', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Mock Analysis Output', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>PARTIAL</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_WARNING, alignment=TA_CENTER)),
     Paragraph('Local fallback engine exists but generates synthetic data, not real analysis. Fallback = mock.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('8', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Wrong AI Copilot Approach', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('MOXI should be an AI brain/agent, not a chat copilot. Architecture needs fundamental redesign.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('9', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Broken Discover Page', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>PARTIAL</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_WARNING, alignment=TA_CENTER)),
     Paragraph('Crypto discover works (DexScreener). Forex works (TwelveData). "Mock data" label still visible.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('10', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Forex Crash', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>FIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_SUCCESS, alignment=TA_CENTER)),
     Paragraph('Forex data now fetched via TwelveData API. discover-forex-data.ts has Promise.allSettled error handling.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('11', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Broken Token Detail Pages', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('token-symbol-component.tsx needs review. Holder/transaction data missing for Solana tokens.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('12', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Missing Holder/Transaction Data', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('No on-chain data integration for Solana token holders or transaction history. Need Helius/RPC integration.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
    [Paragraph('13', ParagraphStyle('cn', fontName='Inter', fontSize=7.5, alignment=TA_CENTER)),
     Paragraph('Empty Token Pages', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK')),
     Paragraph('<b>UNFIXED</b>', ParagraphStyle('cs2', fontName='NotoSansSC-Bold', fontSize=7.5, textColor=SEM_ERROR, alignment=TA_CENTER)),
     Paragraph('Tokens without DexScreener/Binance data show empty pages. Need fallback UI for unknown tokens.', ParagraphStyle('cc', fontName='NotoSansSC', fontSize=7.5, leading=10, wordWrap='CJK'))],
]
cat_t = Table(cat_data, colWidths=[avail*0.05, avail*0.20, avail*0.11, avail*0.64], repeatRows=1)
cat_t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ('GRID', (0, 0), (-1, -1), 0.3, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(cat_t)
story.append(Paragraph('Table 6: Original 13 Issue Categories Status', s_caption))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 5: Security Vulnerabilities
# ══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(heading('5. Security Vulnerabilities', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'Beyond the functional bugs and UI issues, the audit identified several security vulnerabilities that could '
    'compromise user data, allow unauthorized access, or mislead users about the state of their transactions. '
    'These vulnerabilities require immediate attention before any public deployment or user onboarding.',
    s_body))

story.append(heading('5.1 Authentication Bypass', s_h2, 1))
story.append(Paragraph(
    'The <font face="Inter">requireAuth</font> function in <font face="Inter">server/api/_security.ts</font> (line 95-99) '
    'implements a completely ineffective authentication check. It only verifies that the Authorization header contains '
    'the string "Bearer " as a prefix, without ever validating the actual token against Supabase\'s JWT verification '
    'endpoint or decoding the JWT payload. Any HTTP client can bypass authentication by including the header '
    '<font face="Inter">Authorization: Bearer x</font> in their requests. This means all API routes protected by this '
    'middleware are effectively public, including any route that uses <font face="Inter">requireAuth</font> as a guard.',
    s_body))
story.append(Paragraph(
    'The fix requires implementing proper JWT verification: extract the token after "Bearer ", decode it using the '
    'Supabase JWT secret (from SUPABASE_JWT_SECRET env var), verify the signature and expiration, and extract the '
    'user_id from the payload. This should be a reusable middleware function that attaches the verified user '
    'information to the request context for downstream handlers to use.',
    s_body))

story.append(heading('5.2 Cross-User Data Leak', s_h2, 1))
story.append(Paragraph(
    'The <font face="Inter">getWatchlistData</font> function in <font face="Inter">src/shared/data/index.ts</font> '
    '(lines 318-323) performs a query on the <font face="Inter">watchlist_items</font> table without any user_id '
    'filter. The code comment explicitly acknowledges that "watchlist_items doesn\'t have user_id - join via watchlists" '
    'but no JOIN operation is actually performed. This means every authenticated user receives ALL watchlist items '
    'from ALL users in the system. In a multi-tenant Telegram bot scenario, this is a critical data leak that '
    'violates user privacy and could expose trading strategies.',
    s_body))

story.append(heading('5.3 Missing Auth Middleware on Endpoints', s_h2, 1))
story.append(Paragraph(
    'Two server functions lack authentication middleware entirely. The <font face="Inter">getHomeMarketData</font> '
    'function in the home page route and the <font face="Inter">getLiveForexDiscoverData</font> function in '
    '<font face="Inter">discover-forex-data.ts</font> are both created with plain <font face="Inter">createServerFn</font> '
    'without <font face="Inter">requireSupabaseAuth</font> middleware. While market data may seem non-sensitive, '
    'unauthenticated access allows enumeration of all traded pairs, their prices, and trading volumes, which could be '
    'used for competitive intelligence or rate limit abuse.',
    s_body))

story.append(heading('5.4 Ineffective Rate Limiting', s_h2, 1))
story.append(Paragraph(
    'The rate limiting implementation in <font face="Inter">_security.ts</font> (lines 54-77) uses an in-memory '
    '<font face="Inter">Map</font> to track request counts per IP. This approach is fundamentally broken in serverless '
    'environments like Vercel, where each function invocation runs in an isolated container with its own memory space. '
    'The Map is created fresh on every cold start, meaning rate limits reset constantly and provide no actual protection '
    'against abuse. A proper solution requires an external rate limiting store (Redis, Upstash, or Supabase) that '
    'persists across function invocations.',
    s_body))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 6: Architecture Issues
# ══════════════════════════════════════════════════════════════════════════
story.append(heading('6. Architecture and Design Issues', s_h1, 0))
story.append(hr())

story.append(heading('6.1 Swap Component - Complete Simulation', s_h2, 1))
story.append(Paragraph(
    'The swap component at <font face="Inter">src/routes/_authenticated/swap-component.tsx</font> represents the most '
    'significant architecture issue in the application. The entire page - prices, balances, wallet connection, swap '
    'execution, and transaction history - is a pure simulation with no backend integration whatsoever. The component '
    'maintains 12 hardcoded token prices in a <font face="Inter">PRICES</font> constant (line 12-25), fake wallet '
    'balances in <font face="Inter">MOCK_BALANCES</font> (line 50-63), a hardcoded Solana address in '
    '<font face="Inter">useMockWallet()</font> (line 73-90), and fabricated swap history in <font face="Inter">getSwapHistory()</font> '
    '(line 103-158). The swap history is persisted to localStorage only, meaning it is lost when the user clears '
    'their browser data.',
    s_body))
story.append(Paragraph(
    'This is particularly dangerous because the UI is designed to look like a real DEX swap interface. Users of a '
    'Telegram trading bot would naturally assume that the swap feature executes real on-chain transactions. The '
    'absence of any "DEMO" or "SIMULATION" disclaimer in the UI makes this a deceptive user experience. KIMI K3 '
    'should either: (a) implement real Jupiter DEX integration with proper wallet adapters, or (b) clearly label '
    'the entire page as a simulation/demo with visible disclaimers on every action.',
    s_body))

story.append(heading('6.2 Mock Data Proliferation', s_h2, 1))
story.append(Paragraph(
    'Beyond the swap component, mock and stub data exists in several other parts of the codebase. The '
    '<font face="Inter">scanArbitrage</font> function returns a hardcoded empty response with '
    '<font face="Inter">mode: "mock"</font>. The arbitrage engine has mock DEX clients in '
    '<font face="Inter">src/domains/arbitrage/mock/</font>. A dummy trading adapter exists at '
    '<font face="Inter">src/domains/trading/gateway/adapters/dummy-adapter.ts</font>. While some of these may be '
    'intentional development scaffolding, they should be clearly separated from production code and never exposed '
    'to users. The "Mock data" text string still visible in the discover page\'s forex tab (line 1455) suggests '
    'incomplete cleanup from a previous development phase.',
    s_body))

story.append(heading('6.3 Analysis Pipeline Fragility', s_h2, 1))
story.append(Paragraph(
    'While the three-tier fallback (OpenRouter API, local engine, synthetic result) is now in place, the analysis '
    'pipeline has architectural weaknesses. The local engine (<font face="Inter">runLocalAnalysis</font>) generates '
    'analysis based on mathematical indicators without real market context, and the synthetic fallback '
    '(<font face="Inter">generateFallbackResult</font>) produces entirely fabricated entry/stop-loss/take-profit '
    'levels. Neither of these should be presented to users as real trading signals. The UI should clearly indicate '
    'when results come from the fallback engine versus the AI model, and ideally disable trade execution for '
    'synthetic results.',
    s_body))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 7: KIMI K3 Actionable Prompts
# ══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(heading('7. Actionable Prompts for KIMI K3', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'This chapter provides precise, actionable prompts that KIMI K3 can directly use to fix each issue. Each prompt '
    'includes the exact file path, the specific line(s) to modify, the current broken code, and the expected fix. '
    'These prompts are designed to be copy-pasted into KIMI K3 with minimal context required, enabling efficient '
    'parallel fixing of independent issues.',
    s_body))

story.append(heading('7.1 CRITICAL: Fix Authentication Bypass', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/server/api/_security.ts</font><br/>'
    '<b>Lines:</b> 95-99<br/>'
    '<b>Current Code:</b>',
    s_body))
story.append(code_block(
    'function requireAuth(req: Request): boolean {\n'
    '  const auth = req.headers.get("authorization");\n'
    '  if (!auth?.startsWith("Bearer ")) return false;\n'
    '  return true;  // BUG: never validates the actual token\n'
    '}'
))
story.append(Paragraph(
    '<b>Required Fix:</b> Import Supabase\'s JWT verification. Extract the token, verify the signature using '
    'SUPABASE_JWT_SECRET, check expiration, and return the decoded user_id. Return false for invalid/expired tokens. '
    'Ensure all API routes that use requireAuth actually receive and use the verified user identity.',
    s_body))

story.append(heading('7.2 CRITICAL: Fix Watchlist Data Leak', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/shared/data/index.ts</font><br/>'
    '<b>Lines:</b> 318-323<br/>'
    '<b>Required Fix:</b> Add a JOIN between watchlist_items and watchlists tables, filtering by the authenticated '
    'user\'s ID. The query should be: SELECT watchlist_items.* FROM watchlist_items JOIN watchlists ON '
    'watchlist_items.watchlist_id = watchlists.id WHERE watchlists.user_id = :userId ORDER BY added_at DESC. '
    'Import and use requireSupabaseAuth middleware to get the current user ID.',
    s_body))

story.append(heading('7.3 CRITICAL: Fix or Disable Swap Component', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/routes/_authenticated/swap-component.tsx</font><br/>'
    '<b>Required Fix (Option A - Real Integration):</b> Replace all mock data with real Jupiter DEX API calls. '
    'Integrate @solana/wallet-adapter for real wallet connections. Use Jupiter\'s quote API for real-time pricing '
    'and swap API for transaction execution. Store swap history in Supabase, not localStorage.<br/><br/>'
    '<b>Required Fix (Option B - Safe Demo):</b> If real integration is not ready, add prominent "DEMO MODE" banners '
    'to the page header, disable the swap execution button, and add a visible disclaimer: "This is a simulation. '
    'No real transactions are executed." Remove fake wallet address and show "Connect Wallet" as disabled.',
    s_body))

story.append(heading('7.4 HIGH: Fix EquityChart Gradient ID Collision', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/components/vixor/EquityChart.tsx</font><br/>'
    '<b>Line:</b> 85<br/>'
    '<b>Current Code:</b> <font face="Inter">&lt;linearGradient id="equityGradient"&gt;</font><br/>'
    '<b>Required Fix:</b> Generate a unique gradient ID using React.useId() or a prop-based suffix. Example: '
    '<font face="Inter">id={`equityGradient-${pair}-${timeframe}`}</font> or use <font face="Inter">useId()</font> '
    'hook to create a unique identifier per component instance.',
    s_body))

story.append(heading('7.5 HIGH: Fix scanArbitrage Stub', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/shared/data/index.ts</font><br/>'
    '<b>Lines:</b> 1317-1326<br/>'
    '<b>Required Fix:</b> Either implement real arbitrage scanning using the existing arbitrage engine in '
    '<font face="Inter">src/domains/arbitrage/</font>, or remove the arbitrage feature from the UI entirely. '
    'If keeping it, connect scanArbitrage to the real engine that fetches prices from multiple DEXs (Jupiter, '
    'Raydium) and calculates profit opportunities. If removing, show a "Coming Soon" placeholder in the UI.',
    s_body))

story.append(heading('7.6 MEDIUM: Remove "Mock Data" Label from Discover', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/routes/_authenticated/discover.tsx</font><br/>'
    '<b>Line:</b> 1455<br/>'
    '<b>Required Fix:</b> Remove the hardcoded "Mock data" text string from the forex tab UI. Since forex data '
    'is now live via TwelveData API (fetched through discover-forex-data.ts with Promise.allSettled error handling), '
    'this label is stale and misleading. Replace with proper loading/empty states consistent with the crypto tab.',
    s_body))

story.append(heading('7.7 MEDIUM: Add Auth Middleware to Server Functions', s_h2, 1))
story.append(Paragraph(
    '<b>Files:</b> <font face="Inter">src/routes/_authenticated/index.tsx</font> (getHomeMarketData), '
    '<font face="Inter">src/routes/_authenticated/discover-forex-data.ts</font> (getLiveForexDiscoverData)<br/>'
    '<b>Required Fix:</b> Add <font face="Inter">.middleware([requireSupabaseAuth])</font> to both server functions. '
    'Import requireSupabaseAuth from the auth middleware module. This ensures only authenticated Telegram users '
    'can access market data endpoints.',
    s_body))

story.append(heading('7.8 MEDIUM: Add Analysis Polling Timeout', s_h2, 1))
story.append(Paragraph(
    '<b>File:</b> <font face="Inter">src/routes/_authenticated/analysis-id-component.tsx</font><br/>'
    '<b>Lines:</b> 138-142<br/>'
    '<b>Required Fix:</b> Add a maximum polling duration (e.g., 5 minutes). Track the start time when polling begins, '
    'and if the analysis is still in "processing" status after 5 minutes, stop polling and show a "Analysis timed out" '
    'error state with a retry button. This prevents infinite polling loops when the analysis backend gets stuck.',
    s_body))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 8: Architecture Recommendations
# ══════════════════════════════════════════════════════════════════════════
story.append(PageBreak())
story.append(heading('8. Architecture Recommendations for Clean Structure', s_h1, 0))
story.append(hr())

story.append(heading('8.1 Remove All Mock Data from Production Paths', s_h2, 1))
story.append(Paragraph(
    'The most impactful architectural improvement is to establish a clear boundary between development scaffolding and '
    'production code. All mock data, stub functions, and simulation components should be either moved to a dedicated '
    '<font face="Inter">src/mocks/</font> directory with explicit import guards, or removed entirely. Any component '
    'that renders mock data should check an environment flag (e.g., <font face="Inter">VIXOR_DEMO_MODE=true</font>) '
    'and display clear visual indicators when operating in demo mode. This prevents the current situation where '
    'production users cannot distinguish between real and fake data.',
    s_body))

story.append(heading('8.2 Centralize Authentication Middleware', s_h2, 1))
story.append(Paragraph(
    'Create a single, robust authentication middleware module that handles JWT verification, user extraction, and '
    'role-based access control. All server functions should use this centralized middleware instead of implementing '
    'ad-hoc auth checks. The middleware should be applied at the route level in TanStack Start\'s file-based routing '
    'system, ensuring that no endpoint can accidentally be left unprotected. Rate limiting should be implemented using '
    'an external store (Upstash Redis is free tier compatible) rather than in-memory Maps.',
    s_body))

story.append(heading('8.3 Implement Proper Error Boundaries and Fallbacks', s_h2, 1))
story.append(Paragraph(
    'The application needs React error boundaries at the route level to catch rendering errors gracefully instead '
    'of showing blank screens. Each major route should have an error boundary that displays a user-friendly error '
    'message with a retry button. API calls should have standardized error handling that distinguishes between network '
    'errors, authentication errors, rate limit errors, and data errors, showing appropriate UI for each case. The '
    'current approach of silently failing (e.g., empty catch blocks in useLivePrices) should be replaced with visible '
    'error indicators that help users understand what went wrong.',
    s_body))

story.append(heading('8.4 Data Layer Consolidation', s_h2, 1))
story.append(Paragraph(
    'The data access layer in <font face="Inter">src/shared/data/index.ts</font> is a large monolithic file that '
    'mixes concerns from multiple domains (watchlist, trades, arbitrage, signals, analysis). This should be '
    'decomposed into domain-specific data access modules under each domain directory (e.g., '
    '<font face="Inter">src/domains/watchlist/data.ts</font>, <font face="Inter">src/domains/trades/data.ts</font>). '
    'Each module should export only the functions relevant to its domain, and each should include proper type '
    'validation (using Zod schemas) on both inputs and outputs to prevent data integrity issues.',
    s_body))

# ══════════════════════════════════════════════════════════════════════════
# CHAPTER 9: Build and CI Notes
# ══════════════════════════════════════════════════════════════════════════
story.append(heading('9. Build and CI Notes for KIMI K3', s_h1, 0))
story.append(hr())
story.append(Paragraph(
    'When making changes to the VIXOR codebase, KIMI K3 must ensure all modifications pass the project\'s build and '
    'CI pipeline. The build command is <font face="Inter">pnpm run build</font>, and the CI runs '
    '<font face="Inter">pnpm eslint src/ server/</font> followed by <font face="Inter">pnpm tsc --noEmit</font>. '
    'Any introduced TypeScript errors or ESLint violations will block the build. Below are critical notes for safe '
    'code modification.',
    s_body))

story.append(bullet('<b>pnpm PATH:</b> Every bash command must include <font face="Inter">export PATH="$HOME/.npm-global/bin:$PATH"</font> before running pnpm commands, as pnpm is installed in a custom location.'))
story.append(bullet('<b>Design Tokens:</b> Dark background <font face="Inter">#08090C</font>, primary <font face="Inter">#6366F1</font>, bullish <font face="Inter">#22D3A6</font>, bearish <font face="Inter">#FB4667</font>, gold <font face="Inter">#F0C419</font>. Do not introduce new colors without updating the design token system.'))
story.append(bullet('<b>AssetRegistry:</b> Always add new trading pairs to <font face="Inter">src/shared/asset-registry/types.ts</font> first. Never hardcode pair names or Binance symbols in component code.'))
story.append(bullet('<b>useLivePrices:</b> Always use <font face="Inter">AssetRegistry.find()</font> (not <font face="Inter">.get()</font>) for user-facing lookups where unknown pairs should be handled gracefully.'))
story.append(bullet('<b>Server Functions:</b> Always wrap with <font face="Inter">.middleware([requireSupabaseAuth])</font> for authenticated endpoints. Use <font face="Inter">createServerFn</font> with proper method specification.'))
story.append(bullet('<b>API Responses:</b> Validate all external API responses with Zod schemas before using the data. Never cast API responses to <font face="Inter">any</font> type.'))
story.append(bullet('<b>Environment Variables:</b> Available keys include SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, TELEGRAM_BOT_TOKEN, TWELVEDATA_API_KEY, FINNHUB_API_KEY, OPENROUTER_API_KEY, CRON_SECRET. Never commit real keys to source control.'))

# ─── Build PDF ─────────────────────────────────────────────────────────────
doc = TocDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=72,
    rightMargin=72,
    topMargin=60,
    bottomMargin=60,
    title='VIXOR Technical Audit Report',
    author='Z.ai',
    subject='Comprehensive Code Review and Issue Taxonomy for KIMI K3',
)
doc.multiBuild(story, onLaterPages=add_page_number, onFirstPage=lambda c, d: None)

print(f'PDF generated: {OUTPUT_PATH}')
print(f'Size: {os.path.getsize(OUTPUT_PATH) / 1024:.1f} KB')