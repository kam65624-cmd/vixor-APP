#!/usr/bin/env python3
"""
VIXOR Workflow Agent Report — Full Project Audit & Execution Plan
Generates a comprehensive PDF report with cover, TOC, and detailed task breakdown.
"""

import os, sys, hashlib
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, Image,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Setup ─────────────────────────────────────────────────────────
FONT_DIR = '/usr/share/fonts'

# Use DejaVu and FreeSerif (verified TTF fonts)
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerifBold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerifItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerifBold', italic='FreeSerifItalic')

pdfmetrics.registerFont(TTFont('FreeSans', f'{FONT_DIR}/truetype/freefont/FreeSans.ttf'))
pdfmetrics.registerFont(TTFont('FreeSansBold', f'{FONT_DIR}/truetype/freefont/FreeSansBold.ttf'))
registerFontFamily('FreeSans', normal='FreeSans', bold='FreeSansBold')

pdfmetrics.registerFont(TTFont('DejaVuMono', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuMonoBold', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono-Bold.ttf'))
registerFontFamily('DejaVuMono', normal='DejaVuMono', bold='DejaVuMonoBold')

pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', f'{FONT_DIR}/truetype/dejavu/DejaVuSans-Bold.ttf'))
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSansBold')

# ━━ Cascade Palette (auto-generated) ━━
PAGE_BG       = colors.HexColor('#0e0d0c')
SECTION_BG    = colors.HexColor('#252421')
CARD_BG       = colors.HexColor('#1b1a18')
TABLE_STRIPE  = colors.HexColor('#1b1a17')
HEADER_FILL   = colors.HexColor('#403b2b')
COVER_BLOCK   = colors.HexColor('#343023')
BORDER        = colors.HexColor('#595137')
ICON          = colors.HexColor('#bfb38f')
ACCENT        = colors.HexColor('#e3c468')
ACCENT_2      = colors.HexColor('#6bb0c7')
TEXT_PRIMARY   = colors.HexColor('#f2f2f1')
TEXT_MUTED     = colors.HexColor('#8e8c85')
SEM_SUCCESS   = colors.HexColor('#65ba81')
SEM_WARNING   = colors.HexColor('#b49a65')
SEM_ERROR     = colors.HexColor('#b2726c')
SEM_INFO      = colors.HexColor('#7293b4')

# ── Styles ─────────────────────────────────────────────────────────────
W = A4[0] - 50*mm - 20*mm  # usable width

sH1 = ParagraphStyle('H1', fontName='FreeSansBold', fontSize=18, leading=24, textColor=ACCENT, spaceAfter=6, spaceBefore=18, alignment=TA_LEFT)
sH2 = ParagraphStyle('H2', fontName='FreeSansBold', fontSize=14, leading=19, textColor=TEXT_PRIMARY, spaceAfter=4, spaceBefore=14, alignment=TA_LEFT)
sH3 = ParagraphStyle('H3', fontName='FreeSansBold', fontSize=11.5, leading=16, textColor=ICON, spaceAfter=3, spaceBefore=10, alignment=TA_LEFT)
sBody = ParagraphStyle('Body', fontName='FreeSerif', fontSize=10, leading=16, textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_JUSTIFY)
sBodyLeft = ParagraphStyle('BodyLeft', fontName='FreeSerif', fontSize=10, leading=16, textColor=TEXT_PRIMARY, spaceAfter=6, alignment=TA_LEFT)
sMono = ParagraphStyle('Mono', fontName='DejaVuMono', fontSize=8.5, leading=13, textColor=ACCENT_2, spaceAfter=4, alignment=TA_LEFT)
sMuted = ParagraphStyle('Muted', fontName='FreeSerifItalic', fontSize=9, leading=13, textColor=TEXT_MUTED, spaceAfter=4, alignment=TA_LEFT)
sKicker = ParagraphStyle('Kicker', fontName='FreeSans', fontSize=8.5, leading=11, textColor=ACCENT, spaceAfter=2, alignment=TA_LEFT)
sBullet = ParagraphStyle('Bullet', fontName='FreeSerif', fontSize=10, leading=16, textColor=TEXT_PRIMARY, spaceAfter=3, alignment=TA_LEFT, leftIndent=14, bulletIndent=0)
sTableHead = ParagraphStyle('TH', fontName='FreeSansBold', fontSize=8.5, leading=12, textColor=colors.white, alignment=TA_LEFT)
sTableCell = ParagraphStyle('TC', fontName='FreeSerif', fontSize=8.5, leading=12, textColor=TEXT_PRIMARY, alignment=TA_LEFT)
sTableCellM = ParagraphStyle('TCM', fontName='DejaVuMono', fontSize=8, leading=12, textColor=TEXT_PRIMARY, alignment=TA_LEFT)

# ── TOC Styles ──
toc_level0 = ParagraphStyle('TOC0', fontName='FreeSansBold', fontSize=11, leading=18, textColor=ACCENT, leftIndent=0)
toc_level1 = ParagraphStyle('TOC1', fontName='FreeSerif', fontSize=10, leading=16, textColor=TEXT_PRIMARY, leftIndent=18)

# ── Helpers ─────────────────────────────────────────────────────────────
def h1(text, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', sH1)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def h2(text, level=1):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', sH2)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

def h3(text):
    return Paragraph(text, sH3)

def body(text):
    return Paragraph(text, sBody)

def mono(text):
    return Paragraph(text, sMono)

def muted(text):
    return Paragraph(text, sMuted)

def kicker(text):
    return Paragraph(text, sKicker)

def bullet(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def spacer(h=6):
    return Spacer(1, h*mm)

def divider():
    return HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=8, spaceBefore=8)

def make_table(headers, rows, col_widths=None):
    cw = col_widths or [W/len(headers)]*len(headers)
    hdr = [Paragraph(h, sTableHead) for h in headers]
    data = [hdr]
    for row in rows:
        data.append([Paragraph(str(c), sTableCell) if not isinstance(c, Paragraph) else c for c in row])
    t = Table(data, colWidths=cw, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def severity_tag(level):
    colors_map = {'CRITICAL': SEM_ERROR, 'HIGH': SEM_WARNING, 'MEDIUM': SEM_INFO, 'LOW': TEXT_MUTED}
    c = colors_map.get(level, TEXT_MUTED)
    return Paragraph(f'<font color="#{c.hexval()[2:]}">{level}</font>', sTableCell)

def mono_cell(text):
    return Paragraph(text, sTableCellM)

# ── TOC DocTemplate ─────────────────────────────────────────────────────
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ── Page background callback ────────────────────────────────────────────
def page_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    # Footer
    canvas.setFont('DejaVuMono', 7)
    canvas.setFillColor(TEXT_MUTED)
    if doc.page > 1:  # Skip page number on cover
        canvas.drawString(25*mm, 12*mm, 'VIXOR Workflow Agent Report')
        canvas.drawRightString(A4[0] - 25*mm, 12*mm, f'Page {doc.page - 1}')
    # Accent line at top
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.5)
    canvas.line(25*mm, A4[1] - 18*mm, A4[0] - 25*mm, A4[1] - 18*mm)
    canvas.restoreState()

def first_page_bg(canvas, doc):
    pass  # Cover has its own background

# ── Build Document ──────────────────────────────────────────────────────
OUTPUT = '/home/z/my-project/download/VIXOR_Workflow_Agent_Report.pdf'
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

doc = TocDocTemplate(
    OUTPUT, pagesize=A4,
    leftMargin=25*mm, rightMargin=20*mm,
    topMargin=22*mm, bottomMargin=20*mm,
    title='VIXOR Workflow Agent Report',
    author='Vixor Project Agent',
    subject='Full project audit and execution plan to completion',
)

story = []

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# COVER PAGE (manual ReportLab cover — no Playwright needed for text-only)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(Spacer(1, 60*mm))
story.append(Paragraph('VIXOR', ParagraphStyle('CoverTitle', fontName='FreeSansBold', fontSize=42, leading=48, textColor=ACCENT, alignment=TA_LEFT)))
story.append(Spacer(1, 4*mm))
story.append(Paragraph('Workflow Agent Report', ParagraphStyle('CoverSub', fontName='FreeSans', fontSize=22, leading=28, textColor=TEXT_PRIMARY, alignment=TA_LEFT)))
story.append(Spacer(1, 8*mm))
story.append(HRFlowable(width='40%', thickness=2, color=ACCENT, spaceAfter=8, spaceBefore=0, hAlign='LEFT'))
story.append(Paragraph('Full Project Audit and Execution Plan', ParagraphStyle('CoverDesc', fontName='FreeSerifItalic', fontSize=12, leading=18, textColor=TEXT_MUTED, alignment=TA_LEFT)))
story.append(Paragraph('From current state to production-ready (300+ daily users)', ParagraphStyle('CoverDesc2', fontName='FreeSerifItalic', fontSize=11, leading=16, textColor=TEXT_MUTED, alignment=TA_LEFT)))
story.append(Spacer(1, 30*mm))
story.append(Paragraph('Repository: kam65624-cmd/vixor-APP', ParagraphStyle('CoverMeta', fontName='DejaVuMono', fontSize=9, leading=14, textColor=ICON, alignment=TA_LEFT)))
story.append(Paragraph('Production: vixor-app.vercel.app', ParagraphStyle('CoverMeta2', fontName='DejaVuMono', fontSize=9, leading=14, textColor=ICON, alignment=TA_LEFT)))
story.append(Paragraph('Date: 2026-06-30', ParagraphStyle('CoverMeta3', fontName='DejaVuMono', fontSize=9, leading=14, textColor=TEXT_MUTED, alignment=TA_LEFT)))
story.append(Paragraph('Classification: Confidential', ParagraphStyle('CoverMeta4', fontName='DejaVuMono', fontSize=9, leading=14, textColor=SEM_ERROR, alignment=TA_LEFT)))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TABLE OF CONTENTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
toc = TableOfContents()
toc.levelStyles = [toc_level0, toc_level1]
story.append(Paragraph('Table of Contents', ParagraphStyle('TOCTitle', fontName='FreeSansBold', fontSize=20, leading=26, textColor=ACCENT, spaceAfter=12)))
story.append(toc)
story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 1: EXECUTIVE SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('1. Executive Summary'))
story.append(body(
    'This report presents a comprehensive audit of the VIXOR trading platform and a complete execution plan '
    'to bring the application from its current state to a production-ready product capable of serving 300+ daily users. '
    'The audit was conducted with full file-system access to the entire codebase (363 TypeScript files across 16 domains, '
    '92 runtime libraries), and covers four critical areas: the broken chart analysis pipeline, the UI/UX design system '
    'overhaul, production hardening, and remaining technical debt.'
))
story.append(body(
    'The most critical finding is that the chart analysis feature is broken due to the VLM vision step failing silently on Vercel '
    'serverless functions. The z-ai-web-dev-sdk VLM call (chart-vision.ts) likely times out or encounters an import issue in the '
    'serverless environment, causing the entire analysis pipeline to produce no useful output for users. Additionally, the UI '
    'suffers from an inconsistent design system with multiple empty stub pages that degrade the user experience. The current '
    'dark theme uses a flat oklch palette that lacks visual hierarchy and fails to create the professional trading terminal '
    'aesthetic required for a product used by active traders.'
))
story.append(body(
    'The execution plan is organized into four sequential phases, each with clear tasks, file-level specificity, acceptance criteria, '
    'and estimated effort. Phase 1 (Critical Fix) addresses the chart analysis bug immediately. Phase 2 (Design System Overhaul) '
    'replaces the current CSS custom properties and redesigns all empty pages. Phase 3 (Production Hardening) prepares the app for '
    '300+ daily users. Phase 4 (Technical Debt) cleans up the remaining issues identified during this audit.'
))

story.append(spacer(4))
story.append(h2('1.1 Key Metrics'))
story.append(make_table(
    ['Metric', 'Value', 'Status'],
    [
        ['Total TS files', '363', 'Active'],
        ['Domain modules', '16', 'Active'],
        ['Runtime libs', '92', 'Active'],
        ['Route pages', '35', 'Active'],
        ['Empty stub pages', '2', 'Need replacement'],
        ['Pages with mock data', '~12', 'Need real data'],
        ['Chart analysis', 'BROKEN', 'Critical fix needed'],
        ['Design system', 'Flat/dull', 'Full overhaul needed'],
        ['Vercel deployment', 'GitHub auto-deploy', 'Working'],
        ['Supabase RLS', 'All tables', 'Configured'],
    ],
    col_widths=[W*0.35, W*0.30, W*0.35],
))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 2: CHART ANALYSIS BUG DIAGNOSIS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('2. Chart Analysis Bug Diagnosis'))
story.append(kicker('CRITICAL - User-reported: analysis not working'))
story.append(body(
    'The chart analysis pipeline is the core feature of VIXOR. When a user uploads a chart screenshot, the system should extract '
    'the trading pair and price from the image using a VLM (Vision Language Model), then run the local SMC/ICT analysis engine '
    'on real OHLCV data to produce a comprehensive technical analysis. The user reports this entire flow is broken: uploads do '
    'not produce results, or the analysis hangs indefinitely.'
))

story.append(h2('2.1 Pipeline Architecture'))
story.append(body(
    'The analysis pipeline has five stages: (1) Chart Vision - extract context from the uploaded image using z-ai VLM; '
    '(2) Validate - soft validation of the extracted context; (3) Truth Validation - compare vision price against real market data; '
    '(4) Local Engine - run SMC/ICT analysis on real OHLCV data; (5) Build Result - compose the final AnalysisResult. The pipeline '
    'is designed to be fault-tolerant: if the VLM fails, the engine still runs on the user-selected pair. If real OHLCV data is '
    'unavailable, the engine uses synthetic data as a fallback. Theoretically, the pipeline should always produce a result.'
))

story.append(h2('2.2 Root Cause Analysis'))
story.append(body(
    'After auditing all files in the pipeline, the most likely root causes are as follows. The VLM call in chart-vision.ts '
    '(line 74) uses zai.chat.completions.createVision() with the glm-4.6v model. This call requires the z-ai-web-dev-sdk to '
    'be properly initialized on the server. While the SDK is installed in node_modules, Vercel serverless functions have a '
    'limited execution context. The dynamic import (line 33: const ZAI = await import("z-ai-web-dev-sdk")) may fail silently if the '
    'SDK binary or native dependencies are not bundled correctly for the serverless environment. The error is caught on line 144 '
    'and logged as a warning, but the analysis continues with null chartContext, meaning no symbol is detected from the image.'
))

story.append(h3('2.2.1 Suspected Issues (ranked by likelihood)'))
story.append(make_table(
    ['#', 'Issue', 'Severity', 'File', 'Evidence'],
    [
        ['1', 'VLM SDK timeout on Vercel serverless', 'CRITICAL', 'chart-vision.ts:33-86', 'Dynamic import + VLM call likely exceeds 10s Vercel function timeout'],
        ['2', 'VLM model glm-4.6v unavailable or slow', 'HIGH', 'chart-vision.ts:76', 'Model name hardcoded; no fallback model configured'],
        ['3', 'createAnalysis server fn timeout', 'HIGH', 'functions.ts:28-316', 'Full pipeline runs in one server function; VLM + OHLCV fetch + engine = easily > 10s'],
        ['4', 'TWELVEDATA_API_KEY not set in Vercel env', 'MEDIUM', 'price-fetcher.ts:548', 'TwelveData klines return [] if no API key; engine falls to synthetic data'],
        ['5', 'Image too large for base64 round-trip', 'LOW', 'functions.ts:37-38', '8MB max enforced on client, but large images may cause memory issues server-side'],
    ],
    col_widths=[W*0.04, W*0.28, W*0.10, W*0.28, W*0.30],
))

story.append(h2('2.3 Fix Plan'))
story.append(body(
    'The fix requires a multi-pronged approach. First, the VLM vision step must be made non-blocking and moved to a separate '
    'serverless function or executed with a longer timeout. Second, the main createAnalysis server function needs its Vercel '
    'function timeout increased from the default 10s to at least 30s (configurable in vercel.json). Third, a fallback model '
    'should be configured so that if glm-4.6v fails, the system tries a secondary model before falling back to skipping vision '
    'entirely. Fourth, the quickAnalyze path (which skips the image entirely) should be tested independently to confirm '
    'the local SMC/ICT engine itself works correctly on real OHLCV data.'
))

story.append(h3('2.3.1 Task Breakdown'))
story.append(make_table(
    ['Task ID', 'Description', 'Files', 'Effort'],
    [
        ['FIX-1', 'Increase Vercel function timeout to 30s for analysis routes', 'vercel.json', '5 min'],
        ['FIX-2', 'Add error boundary logging around VLM import and call', 'chart-vision.ts', '15 min'],
        ['FIX-3', 'Add fallback VLM model configuration', 'chart-vision.ts', '20 min'],
        ['FIX-4', 'Test quickAnalyze path independently (no image)', 'functions.ts, engine.ts', '15 min'],
        ['FIX-5', 'Verify TWELVEDATA_API_KEY is set in Vercel env vars', 'Vercel Dashboard', '5 min'],
        ['FIX-6', 'Add end-to-end analysis test with real data', 'New test file', '30 min'],
    ],
    col_widths=[W*0.10, W*0.42, W*0.28, W*0.10],
))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 3: UI/UX DESIGN SYSTEM OVERHAUL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('3. UI/UX Design System Overhaul'))
story.append(kicker('User feedback: current design is unacceptable'))
story.append(body(
    'The current design system uses a flat oklch color palette defined in styles.css with minimal visual hierarchy. The user '
    'describes the app as looking like a "dead ruin" with a "stinking design system." The primary issues are: (1) the dark theme '
    'uses flat, low-contrast colors that lack depth and visual interest; (2) multiple pages are empty stubs that show nothing '
    'but a generic coming-soon message; (3) the layout is monotonous with no visual variation between pages; (4) the overall '
    'aesthetic does not match the professional trading terminal feel that users expect from a platform handling real money.'
))

story.append(h2('3.1 Current Design System Audit'))
story.append(body(
    'The current CSS custom property system in styles.css defines 50+ tokens organized into semantic layers (background, foreground, card, '
    'primary, trading colors). The color space is oklch (OKLAB), which is modern but creates very flat, desaturated colors. The primary '
    'green (#10B981) is mapped to oklch(0.72 0.17 162) which appears as a medium-brightness emerald with minimal vibrancy. The '
    'background colors are extremely dark (oklch luminance 0.16-0.24) with almost no perceptible difference between card, muted, '
    'and accent surfaces. This creates a "flat wall" effect where nothing stands out.'
))

story.append(h3('3.1.1 Design System Problems Found'))
story.append(make_table(
    ['Problem', 'Current State', 'Impact', 'Fix'],
    [
        ['Flat color palette', 'oklch with L=0.16-0.24 range', 'No visual depth, pages look dead', 'Add subtle gradients, increase L range to 0.10-0.30'],
        ['No accent gradients', 'Solid color fills everywhere', 'Boring, monotonous UI', 'Add gradient backgrounds to key surfaces'],
        ['Inconsistent spacing', 'Mixed inline styles + CSS vars', 'Layout feels uneven', 'Standardize spacing scale (4/8/12/16/24/32px)'],
        ['Empty stub pages', '2 pages (arbitrage, activity-web3)', 'Users see dead-end pages', 'Replace with meaningful content or hide from nav'],
        ['No loading states', 'Generic spinner only', 'Perceived slowness', 'Add skeleton loaders, progress indicators'],
        ['No micro-interactions', 'No hover/press feedback', 'App feels static', 'Add transition animations on cards/buttons'],
        ['Typography scale', 'Only 2 weights used in practice', 'No visual hierarchy', 'Implement 4-level type scale (Display/H1/H2/Body)'],
        ['Experience styles unused', 'bullx/axiom/opensea tokens exist', 'Dead code, confusion', 'Remove or integrate into main theme'],
    ],
    col_widths=[W*0.16, W*0.22, W*0.24, W*0.38],
))

story.append(h2('3.2 Page-by-Page Audit'))
story.append(body(
    'All 35 route pages were audited for completeness, design quality, and user value. The pages fall into four categories: '
    'fully functional (8 pages), functional but with mock/empty data (12 pages), partial stubs (2 pages), and heavily '
    'implemented feature pages (13 pages). The following table summarizes each page and the work needed.'
))

story.append(make_table(
    ['Page', 'Lines', 'Status', 'Work Needed'],
    [
        ['analyze.tsx', '484', 'Functional', 'Redesign upload UI, add progress feedback'],
        ['analysis.$id.tsx', '2061', 'Functional', 'Redesign result card layout, add print-friendly view'],
        ['signals.tsx', '320', 'Functional', 'Add filter/sort, improve card design'],
        ['charts.tsx', '18', 'Stub', 'REBUILD: embed TradingView widget with pair selector'],
        ['journal.tsx', '552', 'Functional', 'Redesign entry cards, add rich text editor'],
        ['daily-loop.tsx', '1671', 'Feature', 'Reduce inline styles, use PageLayout components'],
        ['copilot.tsx', '2054', 'Feature', 'Redesign chat UI, add suggested prompts'],
        ['index.tsx', '493', 'Dashboard', 'Redesign dashboard widgets, add market overview'],
        ['discover.tsx', '476', 'Data pages', 'Improve token cards, add search/filter'],
        ['perpetuals.tsx', '236', 'Data pages', 'Redesign position cards'],
        ['whale.tsx', '167', 'Data pages', 'Improve trade list, add pair filter'],
        ['alpha.tsx', '279', 'Data pages', 'Improve feed cards, add tab filters'],
        ['predictions.tsx', '211', 'Data pages', 'Add accuracy trend chart'],
        ['curves.tsx', '189', 'Data pages', 'Improve accumulation bars'],
        ['yield.tsx', '199', 'Data pages', 'Improve yield cards'],
        ['communities.tsx', '315', 'Data pages', 'Improve strategy cards'],
        ['pnl.tsx', '244', 'Data pages', 'Add PnL chart visualization'],
        ['backtest.tsx', '619', 'Feature', 'Add parameter input form'],
        ['experiments.tsx', '726', 'Feature', 'Improve experiment cards'],
        ['arbitrage.tsx', '17', 'EMPTY STUB', 'REBUILD or HIDE from navigation'],
        ['activity-web3.tsx', '18', 'EMPTY STUB', 'REBUILD or HIDE from navigation'],
        ['trade-desk.tsx', '606', 'Feature', 'Improve layout, add quick actions'],
        ['profile.tsx', '431', 'Feature', 'Redesign profile header, add stats'],
        ['settings.tsx', '481', 'Feature', 'Group settings into sections'],
        ['premium.tsx', '248', 'Feature', 'Redesign pricing cards'],
        ['rewards.tsx', '584', 'Feature', 'Improve reward cards'],
        ['referral.tsx', '320', 'Feature', 'Redesign referral flow'],
        ['vision.tsx', '191', 'Data pages', 'Improve analysis list'],
        ['pulse.tsx', '211', 'Data pages', 'Improve market pulse widgets'],
        ['trackers.tsx', '285', 'Feature', 'Improve tracker cards'],
        ['bags.tsx', '297', 'Feature', 'Improve bag cards'],
        ['token.$symbol.tsx', '209', 'Data pages', 'Improve token detail view'],
        ['wallet-web3.tsx', '257', 'Feature', 'Redesign wallet connect flow'],
        ['notifications.tsx', '222', 'Data pages', 'Improve notification cards'],
        ['admin/api-keys.tsx', '64', 'Admin', 'Redesign admin panel'],
    ],
    col_widths=[W*0.22, W*0.08, W*0.14, W*0.56],
))

story.append(h2('3.3 New Design System Specification'))
story.append(body(
    'The new design system will be built on three pillars: (1) a refined color palette with increased contrast and subtle '
    'gradients that create depth without sacrificing the dark terminal aesthetic; (2) a consistent spacing and typography '
    'scale that creates visual rhythm across all pages; (3) a component library of reusable patterns (stat cards, data rows, '
    'empty states, loading skeletons) that ensure every page looks cohesive and professional. The target aesthetic is a '
    'modern trading terminal inspired by Bloomberg Terminal, DexScreener, and BullX, but with VIXOR unique identity.'
))

story.append(h3('3.3.1 Color Palette Direction'))
story.append(body(
    'Background range: primary surface at L=0.12 (very dark blue-black), card surface at L=0.16, elevated surface at L=0.20. '
    'This creates a clear 3-level depth hierarchy. Accent color: a vibrant emerald green with higher chroma (C=0.20) for primary '
    'actions and bullish signals. Trading semantics: green for bullish (slightly warmer), red for bearish (slightly cooler), '
    'amber for neutral/wait. Border colors: very subtle (L=0.25, C=0.02) to define structure without visual noise. Text: primary '
    'at L=0.95 for maximum readability, secondary at L=0.65 for labels and metadata, tertiary at L=0.45 for disabled states.'
))

story.append(h3('3.3.2 Task Breakdown'))
story.append(make_table(
    ['Task ID', 'Description', 'Files', 'Effort'],
    [
        ['UI-1', 'Rewrite CSS custom properties with new palette', 'styles.css', '2 hrs'],
        ['UI-2', 'Create reusable gradient utility classes', 'styles.css', '30 min'],
        ['UI-3', 'Redesign PageLayout component (header, tabs, spacing)', 'PageLayout.tsx', '3 hrs'],
        ['UI-4', 'Redesign EmptyState component (illustrations, CTAs)', 'EmptyState.tsx', '1 hr'],
        ['UI-5', 'Create SkeletonLoader component', 'New component', '1 hr'],
        ['UI-6', 'Add hover/press micro-interactions to DataRow', 'PageLayout.tsx', '30 min'],
        ['UI-7', 'Redesign charts.tsx with TradingView embed', 'charts.tsx', '2 hrs'],
        ['UI-8', 'Hide or rebuild arbitrage.tsx stub page', 'arbitrage.tsx, AppShell.tsx', '30 min'],
        ['UI-9', 'Hide or rebuild activity-web3.tsx stub page', 'activity-web3.tsx, AppShell.tsx', '30 min'],
        ['UI-10', 'Redesign analyze.tsx upload experience', 'analyze.tsx', '2 hrs'],
        ['UI-11', 'Redesign analysis result page', 'analysis.$id.tsx', '3 hrs'],
        ['UI-12', 'Redesign dashboard (index.tsx) widgets', 'index.tsx', '3 hrs'],
        ['UI-13', 'Improve all data page card designs', '12 route files', '4 hrs'],
        ['UI-14', 'Remove unused experience/styles system', 'experience/styles/', '30 min'],
        ['UI-15', 'Add responsive desktop layout for lg screens', 'Multiple files', '2 hrs'],
    ],
    col_widths=[W*0.08, W*0.44, W*0.30, W*0.10],
))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 4: PRODUCTION HARDENING (300+ Daily Users)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('4. Production Hardening'))
story.append(kicker('Target: 300+ daily active users'))
story.append(body(
    'To support 300+ daily users, the application needs several infrastructure and code-level improvements. The current '
    'architecture is sound (TanStack Start + Vercel Serverless + Supabase + Upstash Redis), but there are gaps in rate limiting, '
    'error handling, caching strategy, and bundle optimization that must be addressed before scaling. This chapter covers '
    'all production readiness tasks organized by priority.'
))

story.append(h2('4.1 Serverless Function Optimization'))
story.append(body(
    'Vercel serverless functions have a default timeout of 10 seconds for Hobby plans and can be configured up to 60 seconds on Pro. '
    'The analysis pipeline currently runs everything in a single server function call (VLM extraction + OHLCV fetching + SMC/ICT engine '
    '+ DB write), which can easily exceed 10 seconds. This must be split into a multi-step approach: (1) immediate DB insert with "processing" '
    'status; (2) background processing via Vercel cron or a separate async function; (3) client polls for completion. Additionally, '
    'the Binance WebSocket singleton (binance-ws.ts) manages client-side real-time prices for signal monitoring, but the server-side '
    'price fetching lacks connection pooling for TwelveData API calls, which could become a bottleneck at scale.'
))

story.append(h2('4.2 Rate Limiting and Abuse Prevention'))
story.append(body(
    'The application has an Upstash Redis rate limiter (redis-rate-limiter.ts) and a circuit breaker (circuit-breaker.ts), but the rate '
    'limiter wrapper is not consistently applied to all server functions. The createAnalysis function, in particular, costs 10 points '
    'per invocation and should be rate-limited to prevent abuse. The current implementation checks points balance but does not '
    'limit request frequency. A comprehensive rate limiting strategy should be applied: 10 requests/minute for analysis, 60 requests/minute '
    'for general queries, and 5 requests/minute for write operations.'
))

story.append(h2('4.3 Task Breakdown'))
story.append(make_table(
    ['Task ID', 'Description', 'Files', 'Effort'],
    [
        ['PROD-1', 'Increase analysis server function timeout to 30s', 'vercel.json', '10 min'],
        ['PROD-2', 'Implement rate limiter wrapper for all server functions', 'New middleware', '2 hrs'],
        ['PROD-3', 'Add connection pooling for TwelveData API', 'price-fetcher.ts', '1 hr'],
        ['PROD-4', 'Implement analysis queue with polling (split long ops)', 'functions.ts, analyze.tsx', '3 hrs'],
        ['PROD-5', 'Add Redis cache warming on deployment', 'cache.ts', '30 min'],
        ['PROD-6', 'Optimize client bundle - remove dead imports', 'Multiple files', '2 hrs'],
        ['PROD-7', 'Implement unified error handler for all server functions', 'New middleware', '1.5 hrs'],
        ['PROD-8', 'Add structured logging (replace console.log)', 'structured-logger.ts', '2 hrs'],
        ['PROD-9', 'Fix sol-price API endpoint (currently broken)', 'AppShell.tsx, route', '30 min'],
        ['PROD-10', 'Add health check endpoint for monitoring', 'New route', '30 min'],
        ['PROD-11', 'Configure Vercel monitoring and alerting', 'Vercel Dashboard', '30 min'],
        ['PROD-12', 'Optimize image upload (compression before send)', 'analyze.tsx', '1 hr'],
    ],
    col_widths=[W*0.09, W*0.41, W*0.30, W*0.10],
))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 5: TECHNICAL DEBT CLEANUP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('5. Technical Debt Cleanup'))
story.append(kicker('Lower priority but necessary for long-term maintainability'))
story.append(body(
    'Beyond the critical fixes and the design overhaul, the codebase has accumulated technical debt that should be addressed '
    'to ensure long-term maintainability and developer productivity. This includes type safety issues (9 any types that should '
    'be properly typed), dead dependencies that inflate the bundle size, excessive console.log statements that leak information '
    'in production, and some PII exposure risks in webhook handlers and copilot stream responses.'
))

story.append(h2('5.1 Type Safety'))
story.append(body(
    'The codebase has at least 9 explicit any type usages that should be replaced with proper TypeScript types. The most concerning '
    'are in the analysis functions (functions.ts lines 227-228, 238-241, 249-250, 287-288, 364-365) where Supabase query results are cast to any. '
    'These should use the generated Supabase types from src/shared/supabase/types.ts. The route files (whale.tsx, perpetuals.tsx, '
    'curves.tsx, predictions.tsx) use any for server response data, which should be typed with proper interfaces.'
))

story.append(h2('5.2 Dead Code and Dependencies'))
story.append(body(
    'The experience/styles/ directory contains three complete design token sets (bullx, axiom, opensea) that are exported but never '
    'imported by any route or component. The WorkspaceSwitcher component references them, but the workspace switching feature '
    'does not appear to be active in the current UI. These should be removed or integrated. Additionally, the LLM provider '
    'system (src/shared/llm/) contains providers for Anthropic, OpenAI, Groq, and z-ai, but the analysis pipeline explicitly does not '
    'use any external LLM. These providers are only used by the Copilot and Debate features, which should be verified as active '
    'before keeping the code.'
))

story.append(h2('5.3 Task Breakdown'))
story.append(make_table(
    ['Task ID', 'Description', 'Files', 'Effort'],
    [
        ['DEBT-1', 'Replace 9 any types with proper TS types', 'functions.ts, route files', '2 hrs'],
        ['DEBT-2', 'Remove unused experience/styles system', 'experience/styles/', '30 min'],
        ['DEBT-3', 'Remove excessive console.log statements', 'Multiple files', '1 hr'],
        ['DEBT-4', 'Fix PII exposure in stars-webhook', 'webhook handler', '30 min'],
        ['DEBT-5', 'Fix copilot-stream potential leak', 'copilot stream handler', '30 min'],
        ['DEBT-6', 'Audit and clean dead dependencies', 'package.json', '1 hr'],
        ['DEBT-7', 'Add JSDoc comments to all domain functions', 'domains/', '3 hrs'],
    ],
    col_widths=[W*0.09, W*0.41, W*0.30, W*0.10],
))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 6: EXECUTION TIMELINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('6. Execution Timeline'))
story.append(body(
    'The following timeline shows when each phase begins and ends, with clear milestones. The total estimated effort is '
    'approximately 40-50 hours of focused development work, spread across the four phases. Phase 1 is the highest priority '
    'and begins immediately. Phase 2 (the UI/UX overhaul that the user specifically asked about) begins as soon as the chart '
    'analysis is confirmed working.'
))

story.append(make_table(
    ['Phase', 'Start', 'Duration', 'Key Milestone', 'Status'],
    [
        ['Phase 1: Critical Fix', 'Immediate', '2 hours', 'Chart analysis produces results', 'PENDING'],
        ['Phase 2: Design System', 'After Phase 1', '20 hours', 'All pages use new design system', 'PENDING'],
        ['Phase 3: Production', 'During Phase 2', '12 hours', 'Rate limiting + error handling ready', 'PENDING'],
        ['Phase 4: Tech Debt', 'After Phase 3', '8 hours', 'Zero any types, clean console', 'PENDING'],
    ],
    col_widths=[W*0.22, W*0.15, W*0.13, W*0.35, W*0.12],
))

story.append(spacer(6))
story.append(h2('6.1 Phase 1 Detail: Chart Analysis Fix (IMMEDIATE)'))
story.append(body(
    'This phase starts NOW. The tasks are ordered by impact and speed. FIX-1 (increase timeout) and FIX-2 (error boundary logging) '
    'are the fastest changes that will provide immediate diagnostic value. Once deployed, we can check Vercel function logs to '
    'see exactly where the VLM call fails. FIX-4 (test quickAnalyze independently) will confirm whether the local SMC/ICT engine '
    'works at all on Vercel. If quickAnalyze works but createAnalysis does not, the issue is confirmed to be in the VLM/image '
    'handling path, not in the analysis engine itself.'
))

story.append(h2('6.2 Phase 2 Detail: Design System Overhaul'))
story.append(body(
    'This is the phase the user specifically asked about ("هنبداء ده امتي" = "When do we start?"). It begins immediately after '
    'Phase 1 is confirmed complete. The work is divided into three waves: Wave A (UI-1 through UI-6) rebuilds the foundation '
    '(CSS tokens, PageLayout, EmptyState, SkeletonLoader, micro-interactions). Wave B (UI-7 through UI-12) redesigns the '
    'highest-traffic pages (charts, analyze, analysis result, dashboard). Wave C (UI-13 through UI-15) polishes all remaining '
    'data pages and adds responsive desktop layout. Each wave ends with a deploy to production so the user can see progress '
    'incrementally.'
))

story.append(h2('6.3 Phase 3-4: Production + Tech Debt'))
story.append(body(
    'Phase 3 and Phase 4 can run in parallel with the later waves of Phase 2. Production hardening tasks (PROD-1 through PROD-12) '
    'are mostly independent of UI work and can be done simultaneously. Technical debt cleanup (DEBT-1 through DEBT-7) is the '
    'lowest priority but should be completed before the application is marketed to the 300+ user target audience. The combined '
    'timeline for Phases 2-4 is approximately 30-40 hours of development, which can be compressed by parallelizing UI work '
    'with production and debt tasks.'
))

story.append(PageBreak())

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CHAPTER 7: COMPLETE TASK REGISTRY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story.append(h1('7. Complete Task Registry'))
story.append(body(
    'This is the master list of all tasks across all phases. Each task has a unique ID, clear description, specific files to modify, '
    'estimated effort, and acceptance criteria. No additional tasks should be needed to bring the project from its current state '
    'to production-ready. This registry is the single source of truth for all remaining work.'
))

all_tasks = [
    ['FIX-1', 'Increase Vercel function timeout to 30s', 'vercel.json', '10 min', 'Analysis functions do not timeout'],
    ['FIX-2', 'Add error boundary logging around VLM import', 'chart-vision.ts', '15 min', 'VLM errors logged with full stack trace'],
    ['FIX-3', 'Add fallback VLM model configuration', 'chart-vision.ts', '20 min', 'Secondary model tried on primary failure'],
    ['FIX-4', 'Test quickAnalyze path independently', 'functions.ts', '15 min', 'quickAnalyze returns valid result on Vercel'],
    ['FIX-5', 'Verify TWELVEDATA_API_KEY in Vercel env', 'Vercel Dashboard', '5 min', 'Real OHLCV data used for forex pairs'],
    ['FIX-6', 'Add end-to-end analysis test', 'New test file', '30 min', 'Test passes with real data'],
    ['UI-1', 'Rewrite CSS custom properties', 'styles.css', '2 hrs', 'New palette visible on all pages'],
    ['UI-2', 'Create gradient utility classes', 'styles.css', '30 min', 'Gradients render correctly'],
    ['UI-3', 'Redesign PageLayout component', 'PageLayout.tsx', '3 hrs', 'All pages use new layout'],
    ['UI-4', 'Redesign EmptyState component', 'EmptyState.tsx', '1 hr', 'Empty states show helpful content'],
    ['UI-5', 'Create SkeletonLoader component', 'New component', '1 hr', 'Skeleton shown during loading'],
    ['UI-6', 'Add micro-interactions to DataRow', 'PageLayout.tsx', '30 min', 'Hover/press animations work'],
    ['UI-7', 'Redesign charts page', 'charts.tsx', '2 hrs', 'TradingView chart embedded with pair selector'],
    ['UI-8', 'Hide arbitrage stub from nav', 'AppShell.tsx', '30 min', 'Arbitrage not visible in sidebar'],
    ['UI-9', 'Hide activity-web3 stub from nav', 'AppShell.tsx', '30 min', 'Activity not visible in sidebar'],
    ['UI-10', 'Redesign analyze upload experience', 'analyze.tsx', '2 hrs', 'Upload flow is smooth and intuitive'],
    ['UI-11', 'Redesign analysis result page', 'analysis.$id.tsx', '3 hrs', 'Result cards are readable and shareable'],
    ['UI-12', 'Redesign dashboard widgets', 'index.tsx', '3 hrs', 'Dashboard shows actionable data'],
    ['UI-13', 'Improve data page card designs', '12 route files', '4 hrs', 'All data pages consistent'],
    ['UI-14', 'Remove unused experience/styles', 'experience/styles/', '30 min', 'No dead code in bundle'],
    ['UI-15', 'Add responsive desktop layout', 'Multiple files', '2 hrs', 'Lg screens use 2-3 column grids'],
    ['PROD-1', 'Increase analysis timeout', 'vercel.json', '10 min', 'Done (merged with FIX-1)'],
    ['PROD-2', 'Implement rate limiter wrapper', 'New middleware', '2 hrs', 'All server functions rate-limited'],
    ['PROD-3', 'Add TwelveData connection pooling', 'price-fetcher.ts', '1 hr', 'No connection errors under load'],
    ['PROD-4', 'Implement analysis queue with polling', 'functions.ts', '3 hrs', 'Analysis completes without timeout'],
    ['PROD-5', 'Add Redis cache warming', 'cache.ts', '30 min', 'Cache warmed on cold start'],
    ['PROD-6', 'Optimize client bundle', 'Multiple files', '2 hrs', 'Bundle size reduced by 20%+'],
    ['PROD-7', 'Unified error handler', 'New middleware', '1.5 hrs', 'All errors return structured JSON'],
    ['PROD-8', 'Structured logging', 'structured-logger.ts', '2 hrs', 'No console.log in production'],
    ['PROD-9', 'Fix sol-price endpoint', 'AppShell.tsx', '30 min', 'SOL price shows in header'],
    ['PROD-10', 'Health check endpoint', 'New route', '30 min', '/api/health returns 200'],
    ['PROD-11', 'Configure Vercel monitoring', 'Vercel Dashboard', '30 min', 'Alerts configured'],
    ['PROD-12', 'Optimize image upload', 'analyze.tsx', '1 hr', 'Images compressed before upload'],
    ['DEBT-1', 'Replace 9 any types', 'functions.ts, routes', '2 hrs', 'Zero any types in codebase'],
    ['DEBT-2', 'Remove unused experience/styles', 'experience/styles/', '30 min', 'No dead design tokens'],
    ['DEBT-3', 'Remove excessive console.log', 'Multiple files', '1 hr', 'Production logs are clean'],
    ['DEBT-4', 'Fix PII exposure in webhook', 'webhook handler', '30 min', 'No PII in logs'],
    ['DEBT-5', 'Fix copilot-stream leak', 'copilot stream', '30 min', 'No data leak in stream'],
    ['DEBT-6', 'Audit dead dependencies', 'package.json', '1 hr', 'All deps are used'],
    ['DEBT-7', 'Add JSDoc to domain functions', 'domains/', '3 hrs', 'All public functions documented'],
]

story.append(make_table(
    ['ID', 'Task', 'Files', 'Effort', 'Acceptance Criteria'],
    all_tasks,
    col_widths=[W*0.08, W*0.30, W*0.20, W*0.08, W*0.34],
))

# ── Build ───────────────────────────────────────────────────────────────
from reportlab.platypus import PageTemplate, Frame

frame = Frame(25*mm, 20*mm, A4[0] - 45*mm, A4[1] - 42*mm, id='normal')
tpl = PageTemplate(id='main', frames=[frame], onPage=page_bg)
tpl_first = PageTemplate(id='first', frames=[frame], onPage=first_page_bg)

doc.addPageTemplates([tpl_first, tpl])

# Insert template switch after cover
from reportlab.platypus.doctemplate import NextPageTemplate
story.insert(story.index([s for s in story if isinstance(s, PageBreak)][0]), NextPageTemplate('main'))

doc.multiBuild(story)
print(f'Report generated: {OUTPUT}')
