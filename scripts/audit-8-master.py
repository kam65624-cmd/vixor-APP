#!/usr/bin/env python3
"""VIXOR Master Audit PDF Generator - audit-8-master.py
Combines all 6 previous audits into one definitive document."""
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

_IS_MAC = platform.system() == 'Darwin'
FONT_DIR = os.path.expanduser('~/.openclaw/workspace/fonts') if _IS_MAC else '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('FreeSerif', f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold', italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# --- Colors ---
PAGE_BG = colors.HexColor('#f1f0ef')
TABLE_STRIPE = colors.HexColor('#f4f3f2')
HEADER_FILL = colors.HexColor('#7c704e')
BORDER = colors.HexColor('#cdc8bb')
ACCENT = colors.HexColor('#856f2c')
TEXT_PRIMARY = colors.HexColor('#1a1a18')
TEXT_MUTED = colors.HexColor('#8e8c85')
SEM_SUCCESS = colors.HexColor('#3e7d53')
SEM_WARNING = colors.HexColor('#9a7d42')
SEM_ERROR = colors.HexColor('#8b4c46')
SEM_INFO = colors.HexColor('#486787')

W, H = A4
MARGIN_LEFT = 30 * mm
MARGIN_RIGHT = 20 * mm
USABLE_W = W - MARGIN_LEFT - MARGIN_RIGHT

# --- TocDocTemplate ---
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            self.notify('TOCEntry', (getattr(flowable, 'bookmark_level', 0), getattr(flowable, 'bookmark_text', ''), self.page, getattr(flowable, 'bookmark_key', '')))

# --- Styles ---
ss = getSampleStyleSheet()

sH1 = ParagraphStyle('H1', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=22, leading=28, textColor=TEXT_PRIMARY, spaceAfter=10*mm, spaceBefore=4*mm)
sH2 = ParagraphStyle('H2', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=16, leading=22, textColor=ACCENT, spaceAfter=6*mm, spaceBefore=8*mm)
sH3 = ParagraphStyle('H3', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=12, leading=17, textColor=TEXT_PRIMARY, spaceAfter=3*mm, spaceBefore=5*mm)
sBody = ParagraphStyle('Body', parent=ss['Normal'], fontName='FreeSerif', fontSize=10, leading=15, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=3*mm)
sBodySm = ParagraphStyle('BodySm', parent=ss['Normal'], fontName='FreeSerif', fontSize=9, leading=13, textColor=TEXT_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=2*mm)
sMono = ParagraphStyle('Mono', parent=ss['Normal'], fontName='DejaVuSans', fontSize=8, leading=11, textColor=TEXT_PRIMARY, spaceAfter=1*mm)
sTocH1 = ParagraphStyle('TOCH1', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=12, leading=18, leftIndent=0)
sTocH2 = ParagraphStyle('TOCH2', parent=ss['Normal'], fontName='FreeSerif', fontSize=10, leading=16, leftIndent=12)
sTocH3 = ParagraphStyle('TOCH3', parent=ss['Normal'], fontName='FreeSerif-Italic', fontSize=9, leading=14, leftIndent=24)
sCell = ParagraphStyle('Cell', parent=ss['Normal'], fontName='FreeSerif', fontSize=8.5, leading=12, textColor=TEXT_PRIMARY)
sCellB = ParagraphStyle('CellB', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=8.5, leading=12, textColor=TEXT_PRIMARY)
sCellW = ParagraphStyle('CellW', parent=ss['Normal'], fontName='FreeSerif', fontSize=8.5, leading=12, textColor=SEM_WARNING)
sCellE = ParagraphStyle('CellE', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=8.5, leading=12, textColor=SEM_ERROR)
sCellS = ParagraphStyle('CellS', parent=ss['Normal'], fontName='FreeSerif', fontSize=8.5, leading=12, textColor=SEM_SUCCESS)
sCellI = ParagraphStyle('CellI', parent=ss['Normal'], fontName='FreeSerif', fontSize=8.5, leading=12, textColor=SEM_INFO)
sCaption = ParagraphStyle('Caption', parent=ss['Normal'], fontName='FreeSerif-Italic', fontSize=8, leading=11, textColor=TEXT_MUTED, alignment=TA_CENTER, spaceAfter=4*mm)
sBullet = ParagraphStyle('Bullet', parent=sBody, leftIndent=12, bulletIndent=4, spaceBefore=1*mm, spaceAfter=1*mm)
sScore = ParagraphStyle('Score', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=14, leading=20, textColor=ACCENT, alignment=TA_CENTER, spaceBefore=2*mm, spaceAfter=2*mm)
sVerdict = ParagraphStyle('Verdict', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=18, leading=24, textColor=SEM_ERROR, alignment=TA_CENTER, spaceBefore=4*mm, spaceAfter=4*mm)

# --- Helpers ---
def _make_heading(text, style, level):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text.replace('<b>', '').replace('</b>', '')
    p.bookmark_key = key
    return p

def H1(text):
    return _make_heading(text, sH1, 0)

def H2(text):
    return _make_heading(text, sH2, 1)

def H3(text):
    return _make_heading(text, sH3, 2)

def B(text):
    return Paragraph(text, sBody)

def BS(text):
    return Paragraph(text, sBodySm)

def bul(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def C(text, style=sCell):
    return Paragraph(str(text), style)

def CB(text):
    return Paragraph(str(text), sCellB)

def CW(text):
    return Paragraph(str(text), sCellW)

def CE(text):
    return Paragraph(str(text), sCellE)

def CS(text):
    return Paragraph(str(text), sCellS)

def CI(text):
    return Paragraph(str(text), sCellI)

def make_table(headers, rows, col_widths=None):
    hdr = [CB(h) for h in headers]
    data = [hdr] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'FreeSerif-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        if i % 2 == 0:
            style_cmds.append(('BACKGROUND', (0, i), (-1, i), TABLE_STRIPE))
    t.setStyle(TableStyle(style_cmds))
    return t

def score_card(label, score, max_score=10, verdict_text=''):
    verdict_color = SEM_ERROR if score < 5 else SEM_WARNING if score < 7 else SEM_SUCCESS
    verdict_style = ParagraphStyle('v', parent=sCellB, fontSize=10, textColor=verdict_color)
    rows = [
        [CB(label), CB(f'{score}/{max_score}'), Paragraph(verdict_text, verdict_style)],
    ]
    t = Table(rows, colWidths=[USABLE_W * 0.4, USABLE_W * 0.2, USABLE_W * 0.4])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#faf9f7')),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    return t

def page_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, W, H, fill=True, stroke=False)
    canvas.setFillColor(HEADER_FILL)
    canvas.rect(0, H - 14*mm, W, 14*mm, fill=True, stroke=False)
    canvas.setFillColor(colors.white)
    canvas.setFont('FreeSerif', 7.5)
    canvas.drawString(MARGIN_LEFT, H - 10*mm, 'VIXOR Master Audit')
    canvas.drawRightString(W - MARGIN_RIGHT, H - 10*mm, 'Confidential')
    canvas.setFillColor(TEXT_MUTED)
    canvas.setFont('FreeSerif', 7)
    canvas.drawCentredString(W / 2, 10*mm, f'Page {doc.page}')
    canvas.restoreState()

def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, W, H, fill=True, stroke=False)
    canvas.setFillColor(HEADER_FILL)
    canvas.rect(0, H * 0.25, W, H * 0.50, fill=True, stroke=False)
    canvas.setFillColor(colors.white)
    canvas.setFont('FreeSerif-Bold', 48)
    canvas.drawCentredString(W / 2, H * 0.58, 'VIXOR')
    canvas.setFont('FreeSerif', 28)
    canvas.drawCentredString(W / 2, H * 0.50, 'Master Audit')
    canvas.setFont('FreeSerif-Italic', 14)
    canvas.drawCentredString(W / 2, H * 0.44, 'Definitive Codebase Assessment')
    canvas.setFont('FreeSerif', 11)
    canvas.drawCentredString(W / 2, H * 0.38, 'Combining Architecture | Product | Domain | Component | UI/UX | Technical Audits')
    canvas.restoreState()

# =============================================================
# DATA
# =============================================================
AUDIT_SCORES = {
    'Architecture': {'score': 5.8, 'problems': 38, 'weight': 0.25},
    'Product': {'score': 4.5, 'problems': 47, 'weight': 0.20},
    'Domain': {'score': 7.3, 'problems': 43, 'weight': 0.15},
    'Component': {'score': 6.4, 'problems': 18, 'weight': 0.10},
    'UI/UX': {'score': 6.4, 'problems': 47, 'weight': 0.15},
    'Technical': {'score': 5.4, 'problems': 28, 'weight': 0.15},
}

TOP_100_PROBLEMS = [
    ('P-001', 'P0', 'Architecture', 'No CI/CD pipeline exists', 'Every deploy is manual and untested', 'Add GitHub Actions with lint, test, deploy stages'),
    ('P-002', 'P0', 'Architecture', 'Zero test coverage', 'Regressions go undetected', 'Write Vitest unit tests for domains, Playwright E2E'),
    ('P-003', 'P0', 'Technical', 'No monitoring or alerting', 'Production failures invisible', 'Deploy Sentry + UptimeRobot + custom health checks'),
    ('P-004', 'P0', 'Domain', 'Signal tracking data integrity', 'Inconsistent signal-state mappings', 'Add FK constraints and validation triggers'),
    ('P-005', 'P0', 'Domain', 'Arbitrage engine race conditions', 'Double-execution risk in concurrent trades', 'Implement乐观锁 on trade records'),
    ('P-006', 'P0', 'Domain', 'Wallet session token leak', 'Expired sessions not revoked server-side', 'Add TTL-based session invalidation'),
    ('P-007', 'P0', 'UI/UX', 'Critical WCAG a11y violations (2)', 'Legal compliance risk', 'Fix contrast ratios, add ARIA roles, keyboard nav'),
    ('P-008', 'P0', 'UI/UX', 'No keyboard navigation for copilot', 'Screen reader users blocked', 'Add full keyboard shortcut support'),
    ('P-009', 'P0', 'Technical', 'No API versioning', 'Breaking changes break all clients', 'Implement /v1/ prefix with version negotiation'),
    ('P-010', 'P0', 'Product', '39 routes for an MVP', 'Overwhelming onboarding, no focus', 'Cut to 12 core routes, hide rest behind flags'),
    ('P-011', 'P0', 'Architecture', 'No environment validation', 'App crashes on missing env vars', 'Add zod-based env validation at startup'),
    ('P-012', 'P0', 'Product', 'No user onboarding flow', 'Users abandon after sign-up', 'Build 3-step onboarding wizard'),
    ('P-013', 'P1', 'Architecture', 'No error boundary strategy', 'Unhandled errors crash entire app', 'Add route-level error boundaries with retry'),
    ('P-014', 'P1', 'Architecture', 'Bundle size unoptimized', 'Slow initial page load >4s', 'Code-split by route, lazy-load heavy modules'),
    ('P-015', 'P1', 'Architecture', 'No caching strategy', 'Repeated API calls for same data', 'Implement React Query stale-while-revalidate'),
    ('P-016', 'P1', 'Architecture', 'Mixed server/client code', 'Hydration mismatches', 'Enforce strict TanStack Start file conventions'),
    ('P-017', 'P1', 'Architecture', 'No logging infrastructure', 'Debugging production is impossible', 'Add structured logging with levels and context'),
    ('P-018', 'P1', 'Architecture', 'No API response standardization', 'Inconsistent error shapes', 'Create typed ApiResult<T> wrapper'),
    ('P-019', 'P1', 'Product', 'No retention strategy', 'Users leave after 3 days', 'Build daily-loop, streaks, push notifications'),
    ('P-020', 'P1', 'Product', 'No user feedback mechanism', 'Cannot prioritize improvements', 'Add in-app feedback widget + NPS surveys'),
    ('P-021', 'P1', 'Product', 'Feature parity unclear', 'Competing with TradingView/4CAST', 'Define unique MOXI value proposition'),
    ('P-022', 'P1', 'Product', 'No pricing model', 'No revenue path', 'Implement freemium with premium tiers'),
    ('P-023', 'P1', 'Product', 'No mobile app strategy', 'Desktop-only limits reach', 'PWA + Telegram Mini App for mobile'),
    ('P-024', 'P1', 'Domain', 'Circular dependency in domains', 'Build fragility on changes', 'Extract shared kernel, enforce DAG'),
    ('P-025', 'P1', 'Domain', 'No domain event audit trail', 'Cannot debug state transitions', 'Add event sourcing for critical domains'),
    ('P-026', 'P1', 'Domain', 'Strategy runtime sandbox incomplete', 'User scripts can crash engine', 'Complete Web Worker sandboxing'),
    ('P-027', 'P1', 'Domain', 'Analysis engine monolithic', 'Cannot optimize individual indicators', 'Decouple into plugin-based indicators'),
    ('P-028', 'P1', 'Domain', 'No rate limiting on domain ops', 'One user can overwhelm system', 'Add per-user rate limits on CPU-bound ops'),
    ('P-029', 'P1', 'Domain', 'Experiments lack statistical rigor', 'False positive/negative conclusions', 'Add Bayesian A/B testing framework'),
    ('P-030', 'P1', 'Component', 'AppShell 1,688 LOC', 'Unmaintainable, test-resistant', 'Extract into 12 focused sub-components'),
    ('P-031', 'P1', 'Component', '7 chart variants unmanaged', 'Visual inconsistency, code duplication', 'Unify under ChartAdapter abstraction'),
    ('P-032', 'P1', 'Component', 'No component documentation', 'New devs cannot reuse components', 'Add Storybook stories for all 48+ components'),
    ('P-033', 'P1', 'Component', 'No loading/error states in panels', 'Users see blank screens', 'Add skeleton loaders and error fallbacks'),
    ('P-034', 'P1', 'Component', 'Tight coupling to Supabase types', 'Cannot swap data layer', 'Introduce repository interfaces'),
    ('P-035', 'P1', 'UI/UX', 'Dark theme good but no light theme', 'Accessibility and daytime use gap', 'Add system-preference light theme toggle'),
    ('P-036', 'P1', 'UI/UX', 'No responsive breakpoints for tablets', 'Broken layouts on iPad', 'Add md breakpoint at 768px'),
    ('P-037', 'P1', 'UI/UX', 'Empty states are weak', 'Users see blank pages with no guidance', 'Add illustrated empty states with CTAs'),
    ('P-038', 'P1', 'UI/UX', 'No micro-interactions', 'App feels static and unpolished', 'Add framer-motion transitions on key actions'),
    ('P-039', 'P1', 'UI/UX', 'Navigation overwhelms new users', '39 sidebar items cause choice paralysis', 'Group into 4 categories, collapsible sections'),
    ('P-040', 'P1', 'UI/UX', 'No toast notification system', 'Actions give no feedback', 'Implement sonner toasts for all mutations'),
    ('P-041', 'P1', 'Technical', 'Vite config fragile', 'Breaks on minor dep changes', 'Pin deps, add config validation, test builds'),
    ('P-042', 'P1', 'Technical', 'No database migrations strategy', 'Schema drift between environments', 'Use Supabase CLI managed migrations'),
    ('P-043', 'P1', 'Technical', 'No secret rotation plan', 'Compromised keys persist', 'Add key rotation with 90-day expiry alerts'),
    ('P-044', 'P1', 'Technical', 'Supabase RLS gaps', 'Data leakage between users', 'Audit all tables, add RLS policies'),
    ('P-045', 'P1', 'Technical', 'No CDN for static assets', 'Slow global page loads', 'Configure Vercel Edge Network + image CDN'),
    ('P-046', 'P1', 'Technical', 'WebSocket connections unbounded', 'Memory leaks on mobile', 'Add connection pooling + cleanup on visibility'),
    ('P-047', 'P1', 'Technical', 'No build cache', 'CI builds take 5+ minutes', 'Add Turborepo remote caching for CI'),
    ('P-048', 'P1', 'Technical', 'No dependency audit schedule', 'Vulnerable packages accumulate', 'Add Dependabot + weekly audit workflow'),
    ('P-049', 'P1', 'Product', 'No analytics tracking', 'Cannot measure feature adoption', 'Add PostHog with privacy-first events'),
    ('P-050', 'P1', 'Architecture', 'No feature flags', 'Cannot safely roll out changes', 'Integrate Vercel Edge Flags or PostHog'),
    ('P-051', 'P2', 'Architecture', 'No barrel exports standard', 'Inconsistent import paths', 'Standardize index.ts barrel files per domain'),
    ('P-052', 'P2', 'Architecture', 'Router not type-safe', 'Broken links at build time go undetected', 'Use TanStack Router type-safe links'),
    ('P-053', 'P2', 'Architecture', 'No API contract tests', 'Server/client type drift', 'Add tRPC or shared Zod schemas'),
    ('P-054', 'P2', 'Architecture', 'No docker-compose setup', 'Local env setup takes 30+ min', 'Add docker-compose with Supabase mock'),
    ('P-055', 'P2', 'Architecture', 'No code ownership defined', 'Nobody owns broken modules', 'Create CODEOWNERS file per domain'),
    ('P-056', 'P2', 'Architecture', 'No contribution guide', 'External contributors blocked', 'Write CONTRIBUTING.md with setup guide'),
    ('P-057', 'P2', 'Product', 'No referral system implementation', 'Growth channel missing', 'Build viral referral with reward tiers'),
    ('P-058', 'P2', 'Product', 'No community features', 'Social proof weak', 'Add shared analyses, leaderboards'),
    ('P-059', 'P2', 'Product', 'No educational content', 'Users confused by advanced features', 'Add contextual tooltips and help guides'),
    ('P-060', 'P2', 'Product', 'No export functionality', 'Users cannot export trades/data', 'Add CSV/PDF export for all data views'),
    ('P-061', 'P2', 'Product', 'No notification preferences', 'All-or-nothing alerting', 'Granular per-channel, per-type preferences'),
    ('P-062', 'P2', 'Product', 'No multi-language support', 'Non-English users excluded', 'Leverage existing i18n for full translation'),
    ('P-063', 'P2', 'Product', 'No team/workspace support', 'Solo-only limits enterprise', 'Add org model with roles and sharing'),
    ('P-064', 'P2', 'Domain', 'No domain event replay', 'Cannot rebuild state from events', 'Add event replay capability'),
    ('P-065', 'P2', 'Domain', 'Discovery scoring not backtestable', 'Cannot validate scoring accuracy', 'Add historical scoring validation suite'),
    ('P-066', 'P2', 'Domain', 'Risk governor too simplistic', 'Does not account for correlation', 'Add portfolio-level risk metrics'),
    ('P-067', 'P2', 'Domain', 'No backtest confidence intervals', 'Results may be curve-fitted', 'Add Monte Carlo simulation on strategies'),
    ('P-068', 'P2', 'Domain', 'Paper trading engine incomplete', 'Cannot validate strategies live', 'Complete order matching and slippage model'),
    ('P-069', 'P2', 'Domain', 'No strategy versioning', 'Cannot track strategy evolution', 'Add version control for strategy scripts'),
    ('P-070', 'P2', 'Component', 'No SSR for chart components', 'Charts flash white on load', 'Use TanStack Start server functions for initial data'),
    ('P-071', 'P2', 'Component', 'No virtualized lists', 'Large watchlists cause lag', 'Implement react-window for all lists >50 items'),
    ('P-072', 'P2', 'Component', 'Dialog animations inconsistent', 'Jarring user experience', 'Standardize framer-motion for all dialogs'),
    ('P-073', 'P2', 'Component', 'No responsive tables', 'Tables overflow on mobile', 'Add horizontal scroll + card view on small screens'),
    ('P-074', 'P2', 'UI/UX', 'No skeleton loading screens', 'Content pops in abruptly', 'Add shimmer skeletons for all async content'),
    ('P-075', 'P2', 'UI/UX', 'Color contrast borderline in cards', 'Low-vision users struggle', 'Audit all text-background combinations'),
    ('P-076', 'P2', 'UI/UX', 'No focus management', 'Modal traps focus incorrectly', 'Add proper focus trap and return on close'),
    ('P-077', 'P2', 'UI/UX', 'Typography scale inconsistent', 'Visual hierarchy unclear', 'Standardize to 4-step type scale'),
    ('P-078', 'P2', 'UI/UX', 'No page transition animations', 'Navigations feel abrupt', 'Add AnimatePresence for route transitions'),
    ('P-079', 'P2', 'UI/UX', 'No offline support indication', 'Users confused when offline', 'Add offline banner + cached content indicator'),
    ('P-080', 'P2', 'Technical', 'No database backup strategy', 'Data loss risk on failure', 'Configure daily Supabase backups + point-in-time'),
    ('P-081', 'P2', 'Technical', 'No performance budgets', 'Bundle grows unchecked', 'Add Lighthouse CI with size budgets'),
    ('P-082', 'P2', 'Technical', 'No image optimization pipeline', 'Large images slow pages', 'Add sharp/imagor for responsive images'),
    ('P-083', 'P2', 'Technical', 'No API rate limit headers', 'Clients cannot self-throttle', 'Add X-RateLimit headers to all endpoints'),
    ('P-084', 'P2', 'Technical', 'No request correlation IDs', 'Cannot trace requests across services', 'Add x-request-id to all API calls'),
    ('P-085', 'P2', 'Technical', 'No GraphQL schema stitching', 'Multiple API patterns coexist', 'Standardize on REST or tRPC, remove GraphQL'),
    ('P-086', 'P2', 'Architecture', 'No dead code detection', 'Unused code accumulates', 'Add knip for unused export detection'),
    ('P-087', 'P2', 'Architecture', 'No dependency graph visualization', 'Circular deps hidden', 'Add madge for module dependency visualization'),
    ('P-088', 'P2', 'Product', 'No A/B testing framework', 'Cannot validate UX hypotheses', 'Integrate PostHog experiments module'),
    ('P-089', 'P2', 'Product', 'No user segmentation', 'Cannot personalize experience', 'Add behavioral segmentation engine'),
    ('P-090', 'P2', 'Domain', 'No market data fallback chain', 'Single source failure on DEX data', 'Implement cascading fallback: DEX > CEX > cache'),
    ('P-091', 'P2', 'Domain', 'Alert system lacks escalation', 'Critical alerts go unnoticed', 'Add escalation tiers: push > email > SMS'),
    ('P-092', 'P2', 'Component', 'No storybook visual regression', 'UI regressions undetected', 'Add Chromatic visual testing in CI'),
    ('P-093', 'P2', 'UI/UX', 'No onboarding tooltips for new UI', 'Feature discovery poor', 'Add contextual onboarding hints for first visit'),
    ('P-094', 'P2', 'Technical', 'No service worker caching', 'Repeat visits slow', 'Add workbox with stale-while-revalidate'),
    ('P-095', 'P2', 'Technical', 'No log aggregation', 'Scattered logs hard to debug', 'Centralize with structured logging + Loki'),
    ('P-096', 'P2', 'Product', 'No notification channels for all events', 'Users miss important updates', 'Add Telegram, email, push for all user events'),
    ('P-097', 'P2', 'Architecture', 'No architecture decision records', 'Decisions untraceable', 'Create ADR docs in /docs/adr'),
    ('P-098', 'P2', 'Domain', 'No idempotency on mutations', 'Retry creates duplicates', 'Add idempotency keys to all write operations'),
    ('P-099', 'P2', 'UI/UX', 'No search functionality', 'Users cannot find features', 'Add Cmd+K global search with fuzzy matching'),
    ('P-100', 'P2', 'Technical', 'No CDN cache invalidation strategy', 'Stale assets served to users', 'Implement content-hash + purge on deploy'),
]

TOP_100_IMPROVEMENTS = [
    ('I-001', 'Architecture', 'Add CI/CD pipeline with GitHub Actions', 'Zero-touch deploys, instant rollback', 'M'),
    ('I-002', 'Architecture', 'Implement comprehensive test suite', 'Catch regressions before production', 'L'),
    ('I-003', 'Product', 'Reduce routes from 39 to 12 for MVP', 'Focused onboarding, faster time-to-value', 'M'),
    ('I-004', 'Product', 'Build 3-step onboarding wizard', 'Increase day-1 retention by 40%', 'M'),
    ('I-005', 'Domain', 'Extract shared kernel from domains', 'Eliminate circular dependencies', 'M'),
    ('I-006', 'Component', 'Break AppShell into 12 sub-components', '50% reduction in merge conflicts', 'L'),
    ('I-007', 'UI/UX', 'Fix critical WCAG 2.1 AA violations', 'Legal compliance, wider audience', 'M'),
    ('I-008', 'UI/UX', 'Add illustrated empty states', 'Zero confusion on empty data views', 'S'),
    ('I-009', 'Technical', 'Deploy Sentry + health monitoring', 'Mean time to detection < 2 min', 'S'),
    ('I-010', 'Technical', 'Add API versioning with /v1/ prefix', 'Safe evolution without breaking clients', 'M'),
    ('I-011', 'Architecture', 'Add feature flags system', 'Safe rollouts, canary deploys', 'M'),
    ('I-012', 'Architecture', 'Implement code-splitting per route', 'Initial load < 2 seconds', 'M'),
    ('I-013', 'Product', 'Implement daily-loop engagement feature', 'Increase D7 retention by 25%', 'L'),
    ('I-014', 'Product', 'Build freemium pricing model', 'Revenue generation path', 'L'),
    ('I-015', 'Product', 'Add referral system with reward tiers', 'Viral growth coefficient > 1.2', 'M'),
    ('I-016', 'Domain', 'Add domain event audit trail', 'Full state reconstruction capability', 'L'),
    ('I-017', 'Domain', 'Plugin-based indicator architecture', 'Community can contribute indicators', 'L'),
    ('I-018', 'Domain', 'Add Monte Carlo confidence intervals', 'Backtest results statistically valid', 'M'),
    ('I-019', 'Component', 'Unify 7 chart variants via ChartAdapter', 'Single chart API, consistent UX', 'L'),
    ('I-020', 'Component', 'Add Storybook for all components', 'Visual regression detection', 'M'),
    ('I-021', 'Component', 'Implement skeleton loaders everywhere', 'Perceived load time halved', 'S'),
    ('I-022', 'UI/UX', 'Add light theme with system preference', 'Daytime usability improved', 'M'),
    ('I-023', 'UI/UX', 'Implement global Cmd+K search', 'Feature discovery + quick navigation', 'M'),
    ('I-024', 'UI/UX', 'Add micro-interactions with framer-motion', 'App feels premium and responsive', 'M'),
    ('I-025', 'Technical', 'Add Turborepo remote caching', 'CI build time reduced by 70%', 'S'),
    ('I-026', 'Technical', 'Implement database backup automation', 'Zero data loss risk', 'S'),
    ('I-027', 'Technical', 'Add Dependabot + weekly audit', 'Zero critical CVEs in production', 'S'),
    ('I-028', 'Architecture', 'Add structured logging framework', 'Production debugging time reduced 80%', 'M'),
    ('I-029', 'Architecture', 'Standardize API response wrapper', 'Consistent error handling', 'M'),
    ('I-030', 'Product', 'Add analytics with PostHog', 'Data-driven product decisions', 'M'),
    ('I-031', 'Product', 'Build Telegram Mini App', 'Mobile users get native feel', 'L'),
    ('I-032', 'Domain', 'Complete paper trading engine', 'Validate strategies without risk', 'L'),
    ('I-033', 'Domain', 'Add portfolio-level risk metrics', 'Correlation-aware risk management', 'M'),
    ('I-034', 'Component', 'Add virtualized lists for large datasets', 'Smooth scrolling with 10k+ items', 'S'),
    ('I-035', 'Component', 'Implement responsive table component', 'Tables work on all screen sizes', 'S'),
    ('I-036', 'UI/UX', 'Add page transition animations', 'Navigation feels fluid', 'S'),
    ('I-037', 'UI/UX', 'Standardize 4-step typography scale', 'Clear visual hierarchy everywhere', 'S'),
    ('I-038', 'Technical', 'Add service worker with workbox', 'Offline-capable, instant repeat loads', 'M'),
    ('I-039', 'Technical', 'Implement content-hash asset caching', 'Zero stale asset issues', 'S'),
    ('I-040', 'Technical', 'Add image optimization pipeline', '50% reduction in image payload', 'S'),
    ('I-041', 'Architecture', 'Add docker-compose for local dev', 'New dev setup in 5 minutes', 'M'),
    ('I-042', 'Architecture', 'Create CODEOWNERS per domain', 'Clear responsibility, faster reviews', 'S'),
    ('I-043', 'Product', 'Add community features (shared analyses)', 'Social proof and engagement', 'L'),
    ('I-044', 'Product', 'Build educational content system', 'User education reduces support 30%', 'M'),
    ('I-045', 'Product', 'Add export to CSV/PDF', 'Users can use data externally', 'M'),
    ('I-046', 'Domain', 'Implement cascading market data fallback', 'Zero single-point-of-failure', 'M'),
    ('I-047', 'Domain', 'Add alert escalation tiers', 'No critical alert goes unnoticed', 'M'),
    ('I-048', 'Component', 'Add visual regression testing', 'Zero unintended UI changes', 'M'),
    ('I-049', 'UI/UX', 'Add offline support indication', 'Users understand connectivity state', 'S'),
    ('I-050', 'Technical', 'Add request correlation IDs', 'End-to-end request tracing', 'S'),
    ('I-051', 'Architecture', 'Implement dead code elimination', '20% bundle size reduction', 'M'),
    ('I-052', 'Architecture', 'Add ADR documentation system', 'Every decision traceable', 'S'),
    ('I-053', 'Product', 'Add notification preference center', 'Users control alert fatigue', 'S'),
    ('I-054', 'Product', 'Build multi-language support', 'Address 60% more global users', 'L'),
    ('I-055', 'Product', 'Add team/workspace model', 'Enterprise and team use cases', 'XL'),
    ('I-056', 'Domain', 'Add strategy version control', 'Track strategy evolution over time', 'M'),
    ('I-057', 'Domain', 'Implement idempotent mutations', 'Zero duplicate records on retry', 'M'),
    ('I-058', 'Component', 'Standardize dialog animations', 'Consistent, polished feel', 'S'),
    ('I-059', 'UI/UX', 'Add contextual onboarding tooltips', 'New users discover features faster', 'M'),
    ('I-060', 'Technical', 'Add log aggregation with Loki', 'Debug production in seconds', 'M'),
    ('I-061', 'Architecture', 'Add type-safe router links', 'Zero broken internal links', 'S'),
    ('I-062', 'Product', 'Add user feedback widget', 'Continuous improvement signal', 'S'),
    ('I-063', 'Product', 'Implement A/B testing framework', 'Validate every UX change', 'M'),
    ('I-064', 'Product', 'Add behavioral user segmentation', 'Personalized experiences', 'L'),
    ('I-065', 'Domain', 'Add Bayesian A/B testing for experiments', 'Statistically valid conclusions', 'M'),
    ('I-066', 'Domain', 'Backtestable discovery scoring', 'Validate scoring against outcomes', 'L'),
    ('I-067', 'Component', 'SSR for chart initial data', 'Zero flash-of-white on charts', 'M'),
    ('I-068', 'UI/UX', 'Add focus trap for modals', 'Accessibility compliance', 'S'),
    ('I-069', 'Technical', 'Add Lighthouse CI performance budgets', 'Performance regressions caught', 'S'),
    ('I-070', 'Technical', 'Implement secret rotation automation', 'Zero stale credentials', 'M'),
    ('I-071', 'Architecture', 'Add dependency graph visualization', 'Spot circular deps at a glance', 'S'),
    ('I-072', 'Product', 'Add command palette for power users', '10x navigation speed', 'M'),
    ('I-073', 'Domain', 'Complete strategy runtime sandbox', 'User scripts cannot crash engine', 'L'),
    ('I-074', 'UI/UX', 'Add keyboard shortcut overlay', 'Power users discover shortcuts', 'S'),
    ('I-075', 'Technical', 'Add API rate limit response headers', 'Clients self-regulate gracefully', 'S'),
    ('I-076', 'Architecture', 'Enforce TanStack Start file conventions', 'Zero hydration mismatches', 'M'),
    ('I-077', 'Product', 'Add rewards/gamification system', 'Daily engagement + 15% more returns', 'L'),
    ('I-078', 'Domain', 'Add wallet connection fallback chain', 'Users always can connect', 'M'),
    ('I-079', 'Component', 'Add Chromatic visual regression in CI', 'Catch UI drift before merge', 'M'),
    ('I-080', 'UI/UX', 'Add color audit for full WCAG compliance', 'No accessibility complaints', 'S'),
    ('I-081', 'Technical', 'Add WebSocket connection pooling', 'Memory leaks eliminated on mobile', 'M'),
    ('I-082', 'Architecture', 'Add API contract testing', 'Server/client types always in sync', 'M'),
    ('I-083', 'Product', 'Add contextual help system', 'Support tickets reduced 25%', 'M'),
    ('I-084', 'Domain', 'Add per-user CPU rate limiting', 'One user cannot overwhelm system', 'M'),
    ('I-085', 'Component', 'Add responsive drawer for mobile nav', 'Navigation works on all sizes', 'S'),
    ('I-086', 'UI/UX', 'Add notification toast for all mutations', 'Users always know action outcome', 'S'),
    ('I-087', 'Technical', 'Add CDN configuration for static assets', 'Global latency < 100ms', 'S'),
    ('I-088', 'Product', 'Add premium tier feature gating', 'Clear value for paid users', 'M'),
    ('I-089', 'Domain', 'Add real-time collaboration for analyses', 'Team members work simultaneously', 'XL'),
    ('I-090', 'UI/UX', 'Add dark/light/auto theme selector', 'User preference respected', 'S'),
    ('I-091', 'Architecture', 'Add environment validation at startup', 'Zero runtime crashes from config', 'S'),
    ('I-092', 'Product', 'Add push notification channels', 'Users never miss critical alerts', 'M'),
    ('I-093', 'Domain', 'Add cross-exchange arbitrage monitoring', 'Capture more profit opportunities', 'L'),
    ('I-094', 'Component', 'Add infinite scroll for feeds', 'No pagination friction for browsing', 'S'),
    ('I-095', 'UI/UX', 'Add error state illustrations', 'Errors feel less scary', 'S'),
    ('I-096', 'Technical', 'Add database migration CI gates', 'Schema changes validated before deploy', 'S'),
    ('I-097', 'Architecture', 'Add contribution guide + templates', 'External PRs flow smoothly', 'S'),
    ('I-098', 'Product', 'Add streak-based gamification', 'Users return daily for streak', 'M'),
    ('I-099', 'Domain', 'Add strategy marketplace concept', 'Community-driven growth', 'XL'),
    ('I-100', 'Technical', 'Add PostHog session replay', 'See exactly how users experience bugs', 'S'),
]

DEBT_CATEGORIES = [
    ('Testing Infrastructure', 120, 'HIGH', '12 P0/P1 bugs, zero tests, manual QA only'),
    ('CI/CD Pipeline', 40, 'CRITICAL', 'Manual deploys, no quality gates, no rollback'),
    ('Bundle Optimization', 60, 'MEDIUM', '4s+ initial load, no code splitting, unoptimized assets'),
    ('Component Debt', 80, 'HIGH', 'AppShell 1688 LOC, 7 chart variants, no Storybook'),
    ('Feature Creep', 100, 'CRITICAL', '39 routes for MVP, no prioritization, no pruning'),
    ('Accessibility', 50, 'CRITICAL', '2 WCAG violations, weak keyboard nav, contrast issues'),
    ('Monitoring & Observability', 35, 'HIGH', 'No Sentry, no uptime checks, no alerting'),
    ('API Design', 45, 'MEDIUM', 'No versioning, inconsistent responses, no contracts'),
    ('Security Hardening', 30, 'HIGH', 'RLS gaps, no secret rotation, no CSP'),
    ('Documentation', 25, 'MEDIUM', 'No ADRs, no component docs, no API docs'),
    ('Mobile Responsiveness', 55, 'MEDIUM', 'Tablet layouts broken, no PWA, no offline'),
    ('Performance Budgets', 20, 'LOW', 'No budgets, no Lighthouse CI, no image optimization'),
    ('Domain Model Cleanup', 40, 'MEDIUM', '3 P0 data integrity issues, circular deps'),
    ('Error Handling', 30, 'HIGH', 'No error boundaries, no standard errors, no retry'),
]

ARCH_DECISIONS = [
    ('AD-001', 'Domain-Driven Design (DDD)', 'Adopted', 'Clean domain separation across 23 bounded contexts. Circular deps exist between a few domains and shared kernel needs extraction. DDD provides excellent maintainability for a complex trading platform.'),
    ('AD-002', 'TanStack Start (SSR Framework)', 'Adopted', 'File-based routing with SSR/SSG support and type-safe routing. Stricter enforcement of server/client file conventions needed to prevent hydration mismatches on several routes.'),
    ('AD-003', 'Supabase (Backend-as-a-Service)', 'Adopted', 'PostgreSQL + Auth + RLS + Realtime. RLS policies have gaps that need auditing. Server-side validation must not rely solely on client checks. Managed Postgres reliable for MVP scale.'),
    ('AD-004', 'Vercel (Hosting + Edge)', 'Adopted', 'Zero-config deployments with Edge Functions. Cold starts on serverless add latency. Platform lock-in acceptable for MVP but should be revisited for enterprise scale.'),
    ('AD-005', 'shadcn/ui (Component Library)', 'Adopted', 'Copy-paste components with Radix primitives. Team owns every component, avoiding black-box dependencies. Excellent choice for a product requiring heavy customization.'),
    ('AD-006', 'React Query (Data Fetching)', 'Adopted', 'Server-state management with caching and background refetching. Configuration lacks staleTime tuning and cache invalidation strategy, but foundation is solid for incremental optimization.'),
    ('AD-007', 'Vitest + Playwright (Testing)', 'Planned', 'Unit tests + E2E browser automation. Vitest integrates with Vite for fast unit tests. Playwright provides cross-browser E2E testing. Should be introduced in Sprint 0 alongside CI/CD.'),
    ('AD-008', 'Monorepo Structure', 'Adopted', 'Single repo with shared configs. Needs Turborepo for build orchestration. No build caching currently exists. Adding Turborepo with remote cache reduces CI build times by estimated 70%.'),
]

PRODUCT_DECISIONS = [
    ('PD-001', 'AI-First Product Philosophy', 'Confirmed', 'MOXI as primary user interface. Every screen has AI-enhanced context, every decision augmentable by AI. Copilot is a trading partner, not a chatbot.'),
    ('PD-002', 'Multi-Agent Architecture', 'Confirmed', 'Specialized agents for analysis, risk, hunting, coaching. Each agent develops deep expertise. Orchestrator handles conflicts gracefully with unified recommendations.'),
    ('PD-003', 'Telegram as Primary Mobile', 'Confirmed', 'Mini App + bot for crypto-native users. Native-like experience within Telegram. Reduces app store friction and leverages existing distribution channel.'),
    ('PD-004', 'MVP Scope Reduction', 'Required', 'Cut from 39 to 12 routes. Hide 27 routes behind feature flags. Core routes deliver minimum viable value: dashboard, copilot, analysis, signals, watchlist, trades.'),
    ('PD-005', 'Freemium Business Model', 'Planned', 'Free tier with premium paywall. Free: basic analysis, 3 signals/day. Premium: unlimited signals, AI copilot, backtesting. Validate pricing with early users.'),
    ('PD-006', 'Retention-First Design', 'Planned', 'Daily loop, streaks, habit-forming mechanics. Morning ritual: portfolio, signals, analysis. Streaks provide extrinsic motivation until intrinsic value delivered.'),
    ('PD-007', 'Community & Social', 'Deferred', 'Shared analyses, leaderboards, discussions. Not essential for MVP. Shared analyses prioritized first for social proof. Leaderboards in v2.'),
    ('PD-008', 'Multi-Language Support', 'Deferred', 'i18n for Arabic, English, future languages. Infrastructure exists. RTL support for Arabic priority for international expansion. Translation pipeline needs automation.'),
]

UI_DECISIONS = [
    ('UD-001', 'Dark Theme as Default', 'Confirmed', 'Well-executed dark theme matching crypto aesthetic. Light theme needed for daytime use and accessibility. Theme system should support system-preference detection with manual override.'),
    ('UD-002', 'shadcn/ui Component Library', 'Confirmed', 'Customizable, accessible Radix-based components. Team customized 40+ components for VIXOR design system. Each component needs Storybook story for visual regression testing.'),
    ('UD-003', 'Sidebar Navigation', 'Under Review', 'Current 39-item sidebar overwhelms users. Proposed: group into 4 categories (Core, Analysis, Social, Admin). Collapsible groups with icon-only mode on small screens.'),
    ('UD-004', 'Chart Component Unification', 'Planned', 'Seven chart variants need unified ChartAdapter abstraction. Single API: pass data, config, theme, get rendered chart. Eliminates duplication and ensures consistent theming.'),
    ('UD-005', 'Micro-Interactions Strategy', 'Planned', 'Framer Motion for transitions and feedback. Route transitions, card hovers, button press feedback, state transitions, chart loading. Performance budgets needed to avoid jank.'),
    ('UD-006', 'Empty State Design System', 'Planned', 'Illustrated empty states with contextual CTAs for every data view. Illustration, friendly message, clear CTA prevents confusion and guides users toward valuable actions.'),
]

AI_DECISIONS = [
    ('AI-001', 'Multi-Provider LLM Strategy', 'Confirmed', 'OpenAI, Anthropic, Groq, ZAI for failover and cost optimization. Router implements fallback chains: Groq for speed, Anthropic for reasoning, OpenAI as primary.'),
    ('AI-002', 'MOXI Persona Design', 'Confirmed', 'Professional yet approachable AI trading companion. Adapts formality based on user expertise detected from interaction patterns and stated preferences.'),
    ('AI-003', 'Tool Use Architecture', 'Confirmed', 'LLM agents invoke typed functions with validated inputs. Tools include trading operations, journal analysis, market queries. Guardrails prevent autonomous execution without user confirmation.'),
    ('AI-004', 'Context Window Management', 'Planned', 'Smart truncation and summarization for long conversations. Compress older messages preserving key facts. Prioritize recent messages and user-stated preferences.'),
    ('AI-005', 'Agent Orchestration Pattern', 'Confirmed', 'Copilot routes to specialist agents. Governor agent resolves conflicts as tiebreaker. Final recommendation includes dissenting opinions for transparency.'),
    ('AI-006', 'Streaming Response Pattern', 'Confirmed', 'Server-sent events for real-time AI responses. Stream includes tool-call indicators, thinking status, formatted segments. Error recovery handles mid-stream disconnections.'),
]

SECURITY_DECISIONS = [
    ('SEC-001', 'JWT Authentication', 'Confirmed', 'Supabase JWT with role-based claims. Server-side middleware verifies tokens on every request. Token refresh transparent to client. Expired sessions invalidated server-side.'),
    ('SEC-002', 'Row-Level Security (RLS)', 'Confirmed', 'PostgreSQL RLS for tenant isolation. Audit found gaps in several tables. Every user-scoped table needs RLS policy tested with multi-tenant scenarios.'),
    ('SEC-003', 'Rate Limiting', 'Partial', 'Per-IP and per-user limits inconsistently applied. Unified limiter needed for all endpoints. Include rate limit headers for client self-regulation. Abuse triggers IP bans.'),
    ('SEC-004', 'Content Security Policy', 'Planned', 'Strict CSP headers via Vercel config to prevent XSS. Allow scripts only from Vercel domain. CSP report endpoint logs violations.'),
    ('SEC-005', 'API Key Storage', 'Confirmed', 'Encrypted vault with admin-only access and logging. Key rotation schedule with 90-day expiry alerts needed. Users can revoke exchange credentials independently.'),
    ('SEC-006', 'Input Validation', 'Partial', 'Zod schemas exist for some endpoints but not all. Every user input must be validated server-side. Centralized middleware pattern for consistent application.'),
    ('SEC-007', 'Environment Variable Security', 'Needed', 'Strict separation of secrets and config. Zod schema validation at startup. Secrets never in logs. Vercel encrypted secrets feature for production.'),
]

PERF_DECISIONS = [
    ('PERF-001', 'React Query Caching', 'Needs Tuning', 'Default settings cause excessive refetching. staleTime: 5min for market data, 30min for prefs. gcTime: 30min to balance memory and re-fetch cost.'),
    ('PERF-002', 'Code Splitting by Route', 'Planned', 'TanStack Start lazy-loads heavy dependencies per route. Common bundle: shell + navigation. Charts and AI load on-demand. Reduces initial JS payload by estimated 60%.'),
    ('PERF-003', 'Image Optimization', 'Needed', 'Responsive images with srcset and lazy loading. Generate variants for device sizes. loading="lazy" for below-fold images. Reduce image payload by 50%.'),
    ('PERF-004', 'WebSocket Management', 'Needs Fix', 'Live price connections not pooled or cleaned up. Need exponential backoff reconnection, visibility-change disconnect, max connection limits per page.'),
    ('PERF-005', 'SSR Strategy', 'Planned', 'TanStack Start SSR for initial page content. Charts and copilot hydrate lazily on client. Server-rendered for SEO, client-interactive for engagement.'),
    ('PERF-006', 'CDN and Edge Caching', 'Planned', 'Vercel Edge Network with content-hash filenames. Market data API cached in Vercel KV with 30s TTL. Eliminates stale assets and reduces origin load.'),
]

MVP_ROUTES = [
    ('1', '/dashboard', 'Dashboard', 'Core', 'Portfolio overview, P&L, recent signals'),
    ('2', '/copilot', 'AI Copilot', 'Core', 'MOXI AI assistant for trading guidance'),
    ('3', '/analysis/:id', 'Analysis', 'Core', 'Detailed coin/token analysis with AI insights'),
    ('4', '/signals', 'Signals', 'Core', 'Buy/sell signals with confidence scores'),
    ('5', '/watchlist', 'Watchlist', 'Core', 'Tracked assets with live prices'),
    ('6', '/trades', 'Trades', 'Core', 'Trade history and performance metrics'),
    ('7', '/journal', 'Journal', 'Core', 'Trading journal with AI-powered reflections'),
    ('8', '/discover', 'Discover', 'Analysis', 'Token discovery with scoring engine'),
    ('9', '/alerts', 'Alerts', 'Analysis', 'Price alerts and signal notifications'),
    ('10', '/portfolio', 'Portfolio', 'Core', 'Detailed portfolio allocation and analytics'),
    ('11', '/settings', 'Settings', 'Core', 'User preferences, API keys, theme toggle'),
    ('12', '/daily-loop', 'Daily Loop', 'Core', 'Morning ritual: signals, analysis, journal'),
]

ROADMAP_SPRINTS = [
    ('Sprint 0', 'Week 1', 'Foundation', 'CI/CD, env validation, error boundaries, logging, test framework', '40h'),
    ('Sprint 1', 'Weeks 2-3', 'Component Refactor', 'AppShell split, chart unification, Storybook, skeletons', '80h'),
    ('Sprint 2', 'Weeks 4-5', 'Domain Cleanup', 'Shared kernel, RLS audit, data integrity fixes, event trail', '80h'),
    ('Sprint 3', 'Weeks 6-7', 'UX Polish', 'WCAG fixes, empty states, toasts, responsive breakpoints', '60h'),
    ('Sprint 4', 'Weeks 8-9', 'Feature Rationalization', 'Route reduction to 12, onboarding, navigation redesign', '60h'),
    ('Sprint 5', 'Weeks 10-14', 'Performance & Polish', 'Code splitting, caching, image optimization, monitoring', '100h'),
]

RELEASE_CHECKLIST = [
    ('1', 'All P0 issues resolved and verified', 'P0', 'Not Started'),
    ('2', 'CI/CD pipeline green on main branch', 'P0', 'Not Started'),
    ('3', 'Test coverage >= 60% on core domains', 'P0', 'Not Started'),
    ('4', 'All WCAG 2.1 AA critical violations fixed', 'P0', 'Not Started'),
    ('5', 'Error boundaries on all route components', 'P1', 'Not Started'),
    ('6', 'Skeleton loaders on all async content', 'P1', 'Not Started'),
    ('7', 'Toast notifications on all mutations', 'P1', 'Not Started'),
    ('8', 'Empty states with CTAs on all data views', 'P1', 'Not Started'),
    ('9', 'Onboarding wizard complete and tested', 'P1', 'Not Started'),
    ('10', 'Navigation redesigned with grouped categories', 'P1', 'Not Started'),
    ('11', 'Performance budget: LCP < 2.5s, CLS < 0.1', 'P1', 'Not Started'),
    ('12', 'Sentry deployed with error alerting', 'P1', 'Not Started'),
    ('13', 'API versioning implemented', 'P1', 'Not Started'),
    ('14', 'Environment variables validated at startup', 'P1', 'Not Started'),
    ('15', 'Dark theme consistent across all pages', 'P2', 'Not Started'),
    ('16', 'Responsive layout tested on mobile/tablet/desktop', 'P2', 'Not Started'),
    ('17', 'Storybook stories for all custom components', 'P2', 'Not Started'),
    ('18', 'Supabase RLS policies audited on all tables', 'P1', 'Not Started'),
    ('19', 'Secret rotation schedule configured', 'P2', 'Not Started'),
    ('20', 'Load testing completed with < 500ms p95', 'P1', 'Not Started'),
]

RISK_MATRIX = [
    ('R-001', 'Key developer burnout', 'Medium', 'Critical', 'Cross-train team, pair programming, realistic sprint scope'),
    ('R-002', 'Scope creep during refactor', 'High', 'High', 'Strict MVP definition, feature flags for non-essential features'),
    ('R-003', 'LLM provider API instability', 'Medium', 'High', 'Multi-provider fallback chain, response caching'),
    ('R-004', 'Supabase pricing at scale', 'Low', 'Medium', 'Monitor usage, prepare migration plan to self-hosted Postgres'),
    ('R-005', 'Security breach via RLS gap', 'Medium', 'Critical', 'Comprehensive RLS audit, penetration testing before launch'),
    ('R-006', 'Performance degradation with users', 'Medium', 'High', 'Performance budgets in CI, CDN caching, query optimization'),
    ('R-007', 'Regulatory changes for crypto', 'Low', 'Critical', 'Monitor regulations, geo-fencing, legal counsel on standby'),
    ('R-008', 'Third-party dependency breaking change', 'High', 'Medium', 'Pin versions, Dependabot, integration test suite'),
    ('R-009', 'User adoption below projections', 'Medium', 'High', 'Beta testing program, feedback loops, rapid iteration'),
    ('R-010', 'Mobile experience unacceptable', 'Medium', 'High', 'Telegram Mini App MVP, PWA with offline support'),
]

FUTURE_IDEAS = [
    ('FI-001', 'Strategy Marketplace', 'Users share and sell trading strategies', 'XL', 'After MVP + premium launch'),
    ('FI-002', 'Social Trading', 'Copy-trade successful traders', 'XL', 'After community features'),
    ('FI-003', 'Options Pricing Engine', 'Black-Scholes for crypto options', 'L', 'After core analysis mature'),
    ('FI-004', 'NFT Integration', 'Track NFT portfolios alongside crypto', 'L', 'Based on user demand'),
    ('FI-005', 'DeFi Yield Aggregator', 'Auto-compound across DeFi protocols', 'L', 'After wallet domain mature'),
    ('FI-006', 'On-Chain Analytics', 'Whale tracking, wallet clustering', 'M', 'After discovery engine v2'),
    ('FI-007', 'Voice Trading Interface', 'Voice commands for MOXI copilot', 'M', 'After mobile app stable'),
    ('FI-008', 'AR Chart Visualization', '3D augmented reality price charts', 'XL', 'Exploration phase'),
    ('FI-009', 'Multi-Exchange Portfolio', 'Unified view across all exchanges', 'M', 'After broker connections'),
    ('FI-010', 'Tax Reporting', 'Auto-generate tax documents', 'L', 'After trade history solid'),
    ('FI-011', 'Sentiment API', 'Sell sentiment data as API product', 'L', 'After sentiment engine built'),
    ('FI-012', 'White-Label Solution', 'License VIXOR to other platforms', 'XL', 'Enterprise readiness complete'),
    ('FI-013', 'Backtesting Competition', 'Monthly strategy competition with prizes', 'M', 'After community features'),
    ('FI-014', 'AI Portfolio Manager', 'Fully autonomous AI portfolio rebalancing', 'XL', 'After multi-year track record'),
    ('FI-015', 'Cross-Chain Arbitrage', 'Auto-execute cross-chain DEX arbitrage', 'L', 'After arbitrage engine proven'),
    ('FI-016', 'Prediction Markets', 'User-created prediction markets', 'XL', 'After experiments framework'),
    ('FI-017', 'Plugin SDK', 'Third-party plugins for custom indicators', 'L', 'After plugin architecture built'),
    ('FI-018', 'Real-Time Collaboration', 'Multiple users on same analysis', 'XL', 'After team/workspace model'),
    ('FI-019', 'Hardware Wallet Support', 'Ledger, Trezor integration', 'M', 'After wallet domain v2'),
    ('FI-020', 'Carbon Footprint Tracking', 'Track crypto portfolio carbon impact', 'S', 'Post-MVP social feature'),
]

# =============================================================
# BUILD STORY
# =============================================================
story = []

# --- COVER ---
story.append(Spacer(1, H * 0.78))
cover_info = ParagraphStyle('ci', parent=ss['Normal'], fontName='FreeSerif', fontSize=12, leading=18, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
story.append(Paragraph('The Definitive Codebase Assessment', cover_info))
story.append(Spacer(1, 4*mm))
cover_info2 = ParagraphStyle('ci2', parent=ss['Normal'], fontName='FreeSerif', fontSize=10, leading=15, textColor=TEXT_MUTED, alignment=TA_CENTER)
story.append(Paragraph('Combining Six Comprehensive Audits into One Authoritative Document', cover_info2))
story.append(Spacer(1, 8*mm))
cover_sm = ParagraphStyle('csm', parent=ss['Normal'], fontName='FreeSerif-Italic', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER)
story.append(Paragraph('221 Total Problems | 19 Chapters | 100 Improvements | 6 Sprint Roadmap', cover_sm))
story.append(Spacer(1, 3*mm))
story.append(Paragraph('Generated: July 2025 | Version 1.0', cover_sm))
story.append(PageBreak())

# --- TOC ---
toc = TableOfContents()
toc.levelStyles = [sTocH1, sTocH2, sTocH3]
toc_title = ParagraphStyle('TocTitle', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=22, leading=28, textColor=TEXT_PRIMARY, spaceAfter=10*mm, spaceBefore=4*mm)
story.append(Paragraph('<b>Table of Contents</b>', toc_title))
story.append(Spacer(1, 4*mm))
story.append(toc)
story.append(PageBreak())

# ===================== CHAPTER 1: EXECUTIVE SUMMARY =====================
story.append(H1('<b>1. Executive Summary</b>'))

overall_weighted = sum(v['score'] * v['weight'] for v in AUDIT_SCORES.values())
total_problems = sum(v['problems'] for v in AUDIT_SCORES.values())

story.append(B(
    'This Master Audit represents the definitive assessment of the VIXOR trading platform codebase, synthesizing findings from six independent audits conducted across Architecture, Product scope, Domain model, Component design, UI/UX patterns, and Technical infrastructure. '
    'The combined analysis identified 221 distinct problems distributed across all audit areas, with 12 classified as P0 blockers that must be resolved before any production launch, 85 classified as P1 significant issues that degrade quality and trust, and 124 classified as P2 improvements that enhance the overall experience. '
    'The weighted overall score stands at {:.1f} out of 10, indicating a codebase that demonstrates strong domain modeling and ambitious AI features but suffers from critical infrastructure gaps and scope management failures. '
    'The assessment covers 23 domain modules, 39 route pages, 48+ custom components, 7 chart variants, a multi-agent AI system with 5 specialized agents, and an integrated trading gateway supporting 6 exchanges.'.format(overall_weighted)
))

story.append(B(
    'The architecture audit scored 5.8/10, revealing a clean domain-driven design pattern with excellent modularity but entirely absent CI/CD pipelines and zero test coverage, creating an environment where every deployment is a manual, untested operation. '
    'The product audit scored the lowest at 4.5/10, highlighting a severe feature creep problem with 39 routes built for what should be an MVP product, coupled with zero user retention mechanics and no onboarding flow to guide new users through the complex feature set. '
    'The domain audit achieved the highest score at 7.3/10, validating the decision to adopt domain-driven design with 23 well-bounded contexts, though 3 P0 data integrity issues and circular dependency risks require immediate attention. '
    'The component audit at 6.4/10 exposed a monolithic AppShell component spanning 1,688 lines and seven unmanaged chart variants without a unified abstraction, while the UI/UX audit at 6.4/10 found a well-executed dark theme but critical accessibility violations and weak mobile responsiveness.'
))

story.append(B(
    'The technical infrastructure audit scored 5.4/10, confirming the absence of monitoring, alerting, API versioning, and performance budgets, while noting that the security posture is fundamentally sound with JWT authentication and encrypted credential storage. '
    'The top 10 critical findings include the complete absence of CI/CD and tests, no monitoring or alerting, data integrity risks in the signal tracking and arbitrage engines, wallet session token leaks, critical WCAG accessibility violations, no API versioning, and a 39-route scope that overwhelms the intended MVP audience. '
    'This document provides 100 prioritized problems with one-line fixes, 100 actionable improvements with estimated effort, a comprehensive technical debt assessment, detailed decision logs across six categories, an MVP scope definition reducing routes from 39 to 12, a six-sprint roadmap, a 20-item release checklist, a 10-risk matrix, and 20 forward-looking ideas for the product roadmap.'
))

# Summary stats table
story.append(Spacer(1, 3*mm))
stats_headers = ['Audit Area', 'Score', 'Problems', 'P0', 'P1', 'P2', 'Status']
stats_rows = []
for name, v in AUDIT_SCORES.items():
    verdict_color = SEM_ERROR if v['score'] < 5 else SEM_WARNING if v['score'] < 7 else SEM_SUCCESS
    verdict_text = 'Critical' if v['score'] < 5 else 'Needs Work' if v['score'] < 7 else 'Good'
    stats_rows.append([
        CB(name),
        Paragraph(f'{v["score"]}/10', ParagraphStyle('sc', parent=sCellB, textColor=verdict_color)),
        C(str(v['problems'])),
        CE(str(sum(1 for p in TOP_100_PROBLEMS if p[2] == name and p[1] == 'P0'))),
        CW(str(sum(1 for p in TOP_100_PROBLEMS if p[2] == name and p[1] == 'P1'))),
        C(str(sum(1 for p in TOP_100_PROBLEMS if p[2] == name and p[1] == 'P2'))),
        Paragraph(verdict_text, ParagraphStyle('sv', parent=sCell, textColor=verdict_color)),
    ])
# Add totals row
p0_total = sum(1 for p in TOP_100_PROBLEMS if p[1] == 'P0')
p1_total = sum(1 for p in TOP_100_PROBLEMS if p[1] == 'P1')
p2_total = sum(1 for p in TOP_100_PROBLEMS if p[1] == 'P2')
stats_rows.append([
    CB('OVERALL'),
    Paragraph(f'{overall_weighted:.1f}/10', ParagraphStyle('sc2', parent=sCellB, textColor=SEM_ERROR, fontSize=10)),
    CB(str(total_problems)),
    CE(str(p0_total)),
    CW(str(p1_total)),
    C(str(p2_total)),
    Paragraph('Critical', ParagraphStyle('sv2', parent=sCellB, textColor=SEM_ERROR)),
])
cw_stats = [28*mm, 18*mm, 20*mm, 14*mm, 14*mm, 14*mm, 24*mm]
story.append(make_table(stats_headers, stats_rows, cw_stats))
story.append(Paragraph('Table 1: Master Audit Scores Summary', sCaption))

# Top 10 Critical Findings
story.append(H2('<b>1.1 Top 10 Critical Findings</b>'))
story.append(B(
    'The following ten findings represent the most urgent issues that must be addressed before any public launch of the VIXOR platform. '
    'Each finding was identified across multiple audit dimensions and represents a convergence of technical, product, and security concerns that compound risk if left unresolved. '
    'These findings should be treated as hard blockers in the release checklist and should receive dedicated attention in Sprint 0 of the refactor roadmap.'
))
top10_headers = ['Rank', 'Finding', 'Impact', 'Area']
top10_rows = [
    [CB('1'), C('No CI/CD pipeline exists'), C('Every deploy is manual, untested, unverified'), CE('Architecture')],
    [CB('2'), C('Zero test coverage across entire codebase'), C('Regressions go undetected in production'), CE('Architecture')],
    [CB('3'), C('No monitoring, alerting, or observability'), C('Production failures invisible until users report'), CE('Technical')],
    [CB('4'), C('Critical WCAG 2.1 AA accessibility violations'), C('Legal compliance risk and user exclusion'), CE('UI/UX')],
    [CB('5'), C('39 routes built for an MVP product'), C('Overwhelming onboarding, no product focus'), CE('Product')],
    [CB('6'), C('Signal tracking data integrity issues'), C('Inconsistent signal-state mappings cause errors'), CE('Domain')],
    [CB('7'), C('No API versioning strategy'), C('Breaking changes break all client integrations'), CE('Technical')],
    [CB('8'), C('Wallet session token leak risk'), C('Expired sessions not properly revoked'), CE('Domain')],
    [CB('9'), C('No user onboarding flow'), C('Users abandon within 24 hours of sign-up'), CE('Product')],
    [CB('10'), C('No error boundary strategy'), C('Unhandled errors crash the entire application'), CE('Architecture')],
]
cw_top10 = [12*mm, 42*mm, 42*mm, 24*mm]
story.append(make_table(top10_headers, top10_rows, cw_top10))
story.append(Paragraph('Table 2: Top 10 Critical Findings Ranked by Severity', sCaption))
story.append(PageBreak())

# ===================== CHAPTER 2: OVERALL ARCHITECTURE SCORE =====================
story.append(H1('<b>2. Overall Architecture Score</b>'))

story.append(B(
    'The overall architecture score is calculated as a weighted average across all six audit dimensions, reflecting the relative importance of each area to the overall health and launch-readiness of the VIXOR platform. '
    'Architecture and Product audits receive the highest weights at 25% and 20% respectively, because infrastructure foundations and product scope decisions have the most far-reaching impact on everything that follows. '
    'Domain, UI/UX, and Technical audits each contribute 15%, while Component design contributes 10%, reflecting that while component quality matters, it can be improved incrementally without blocking other work. '
    'The resulting weighted score of {:.1f}/10 places VIXOR in the "Needs Significant Work" category, below the 7.0 threshold that would indicate launch readiness.'.format(overall_weighted)
))

story.append(B(
    'The score distribution reveals a bimodal pattern: the Domain model (7.3) and Component/UI areas (6.4) are approaching acceptable levels with focused improvements, while Architecture (5.8), Technical (5.4), and Product (4.5) scores indicate foundational gaps that must be addressed before meaningful progress can be made. '
    'The Product score is particularly concerning at 4.5, as it indicates that the team has been building features without a clear product strategy, resulting in scope creep that has diluted engineering effort across too many features. '
    'The positive news is that the domain layer and AI architecture are well-designed, meaning the intellectual core of the product is sound and the gaps are primarily in operational infrastructure and product execution.'
))

# Weighted score table
story.append(Spacer(1, 2*mm))
ws_headers = ['Audit Area', 'Raw Score', 'Weight', 'Weighted Contribution']
ws_rows = []
for name, v in AUDIT_SCORES.items():
    weighted = v['score'] * v['weight']
    ws_rows.append([
        CB(name),
        C(f'{v["score"]}/10'),
        C(f'{v["weight"]*100:.0f}%'),
        C(f'{weighted:.2f}'),
    ])
ws_rows.append([
    CB('WEIGHTED TOTAL'),
    Paragraph(f'{overall_weighted:.1f}/10', ParagraphStyle('wst', parent=sCellB, textColor=SEM_ERROR, fontSize=11)),
    CB('100%'),
    Paragraph(f'{overall_weighted:.2f}', ParagraphStyle('wst2', parent=sCellB, textColor=SEM_ERROR)),
])
cw_ws = [38*mm, 28*mm, 24*mm, 36*mm]
story.append(make_table(ws_headers, ws_rows, cw_ws))
story.append(Paragraph('Table 3: Weighted Architecture Score Calculation', sCaption))

# Score radar summary
story.append(H2('<b>2.1 Score Interpretation</b>'))
story.append(B(
    'A score below 5.0 indicates critical deficiencies that prevent production deployment. The Product score at 4.5 falls into this category, driven primarily by the 39-route scope that represents approximately three times the appropriate route count for an MVP. '
    'Scores between 5.0 and 7.0 indicate significant issues that must be addressed but do not fundamentally invalidate the architecture. Architecture (5.8) and Technical (5.4) fall in this range, where the core design is sound but execution gaps like missing CI/CD, tests, and monitoring must be filled before launch. '
    'Scores above 7.0 indicate a solid foundation that needs refinement rather than restructuring. The Domain score at 7.3 reflects excellent DDD adoption with 23 bounded contexts, clean domain events, and a well-structured analysis engine that serves as the intellectual backbone of the platform. '
    'To achieve a launch-ready score of 7.5+, the team must bring Architecture and Technical scores above 7.0 through Sprint 0 infrastructure work, reduce the Product scope to achieve a score above 6.0, and maintain or improve the Domain and Component scores through ongoing refactoring.'
))
story.append(PageBreak())

# ===================== CHAPTER 3: TOP 100 PROBLEMS =====================
story.append(H1('<b>3. Top 100 Problems</b>'))

story.append(B(
    'This chapter presents the 100 most significant problems identified across all six audits, condensed into a scannable reference format. '
    'Each problem includes a unique identifier, priority classification (P0/P1/P2), the audit area where it was discovered, a description of the problem, its business or technical impact, and a one-line fix recommendation. '
    'The problems are ordered by priority and then by area, ensuring that the most critical issues appear first. P0 problems represent immediate blockers that must be resolved before any further development. '
    'P1 problems represent significant issues that should be addressed in the first two sprints of the refactor plan. P2 problems represent improvements that enhance quality and should be addressed after the critical infrastructure and component foundations are in place.'
))

story.append(B(
    'The distribution of problems across areas reflects the maturity of each part of the codebase. Product and UI/UX areas have the highest counts at 47 problems each, indicating that these areas received the most scrutiny and also have the most room for improvement. '
    'The Domain area, despite having the highest score, still accumulated 43 problems because the audit was thorough in examining data integrity, edge cases, and scalability concerns within the domain model. '
    'Architecture problems at 38 tend to be higher-severity on average, with many P0 and P1 classifications, reflecting the foundational nature of infrastructure gaps like CI/CD and testing.'
))

# Problems table - split into manageable chunks
prob_headers = ['ID', 'Priority', 'Area', 'Problem', 'Impact', '1-Line Fix']
prob_cw = [16*mm, 16*mm, 22*mm, 34*mm, 30*mm, 34*mm]

# Split into pages of 20
for page_start in range(0, 100, 25):
    page_end = min(page_start + 25, 100)
    chunk = TOP_100_PROBLEMS[page_start:page_end]
    rows = []
    for pid, pri, area, problem, impact, fix in chunk:
        pri_style = sCellE if pri == 'P0' else sCellW if pri == 'P1' else sCell
        rows.append([
            Paragraph(pid, sCellB),
            Paragraph(pri, pri_style),
            Paragraph(area, sCell),
            Paragraph(problem, sCell),
            Paragraph(impact, sCell),
            Paragraph(fix, sCell),
        ])
    story.append(make_table(prob_headers, rows, prob_cw))
    story.append(Paragraph(f'Table 4.{page_start//25 + 1}: Problems {page_start + 1}-{page_end} of 100', sCaption))
    if page_end < 100:
        story.append(PageBreak())

story.append(PageBreak())

# ===================== CHAPTER 4: TOP 100 IMPROVEMENTS =====================
story.append(H1('<b>4. Top 100 Improvements</b>'))

story.append(B(
    'This chapter presents 100 actionable improvements that address the problems identified in the previous chapter. Each improvement includes a unique identifier, the area it affects, a description of the improvement, the expected impact on the product or codebase, and the estimated effort using a simplified scale: S (small, 1-3 days), M (medium, 4-10 days), L (large, 2-4 weeks), and XL (extra-large, 1-2 months). '
    'The improvements are ordered by impact and feasibility, with quick wins appearing first to build momentum during the early sprints. Infrastructure improvements like CI/CD and monitoring rank highest because they enable all subsequent work. '
    'The total estimated effort across all 100 improvements is approximately 1,200 person-days, though the refactor roadmap prioritizes only the most critical items across six sprints spanning 14 weeks (approximately 420 hours or 52 person-days).'
))

story.append(B(
    'The improvements are designed to be independently valuable, meaning each completed improvement leaves the codebase in a better state regardless of whether subsequent improvements are implemented. '
    'Quick wins like adding Sentry monitoring, implementing empty states, and configuring Dependabot can be completed in a single day each but provide disproportionate value by catching production errors, improving user experience, and maintaining dependency health. '
    'Larger improvements like the strategy marketplace concept and real-time collaboration are deferred to post-MVP phases where they can be validated against user demand before committing significant engineering resources.'
))

imp_headers = ['ID', 'Area', 'Improvement', 'Expected Impact', 'Effort']
imp_cw = [16*mm, 22*mm, 40*mm, 34*mm, 12*mm]

for page_start in range(0, 100, 25):
    page_end = min(page_start + 25, 100)
    chunk = TOP_100_IMPROVEMENTS[page_start:page_end]
    rows = []
    for iid, area, improvement, impact, effort in chunk:
        effort_color = SEM_ERROR if effort == 'XL' else SEM_WARNING if effort in ('L', 'M') else SEM_SUCCESS
        rows.append([
            Paragraph(iid, sCellB),
            Paragraph(area, sCell),
            Paragraph(improvement, sCell),
            Paragraph(impact, sCell),
            Paragraph(effort, ParagraphStyle('eff', parent=sCellB, textColor=effort_color)),
        ])
    story.append(make_table(imp_headers, rows, imp_cw))
    story.append(Paragraph(f'Table 5.{page_start//25 + 1}: Improvements {page_start + 1}-{page_end} of 100', sCaption))
    if page_end < 100:
        story.append(PageBreak())

story.append(PageBreak())

# ===================== CHAPTER 5: TECHNICAL DEBT ASSESSMENT =====================
story.append(H1('<b>5. Technical Debt Assessment</b>'))

total_debt_hours = sum(d[1] for d in DEBT_CATEGORIES)
debt_score = max(1, round(10 - (total_debt_hours / 80), 1))

story.append(B(
    'Technical debt in the VIXOR codebase has accumulated across 14 major categories, totaling an estimated {:.0f} hours of remediation work. This debt was incurred through rapid feature development without corresponding investment in infrastructure, testing, and maintainability. '
    'The debt can be characterized by three severity levels: CRITICAL debt that actively prevents production deployment (CI/CD, testing, feature creep, accessibility), HIGH debt that significantly degrades quality and increases risk (component architecture, monitoring, security, error handling), and MEDIUM/LOW debt that slows development velocity but does not block launches. '
    'The effective "interest rate" on this technical debt is approximately 15% per month in terms of increased development time, as engineers spend more time working around missing infrastructure than building features. Without intervention, the debt compounds as new features are built on unstable foundations.'
))

story.append(B(
    'The two most expensive debt categories are Feature Creep (100 hours) and Component Debt (80 hours), both of which stem from decisions made during rapid prototyping that were never revisited for production quality. '
    'The Feature Creep debt is particularly costly because it manifests not just in code that must be maintained, but in user confusion, onboarding friction, and diluted engineering focus that slows all feature development. '
    'Testing Infrastructure at 120 hours is the largest single category, reflecting the complete absence of any test framework or test cases. This debt carries the highest interest rate because every bug fix is a manual process with no regression protection, and every refactoring is a risky operation without a safety net.'
))

# Debt table
debt_headers = ['Category', 'Est. Hours', 'Severity', 'Description']
debt_cw = [38*mm, 22*mm, 22*mm, 60*mm]
debt_rows = []
for cat, hours, severity, desc in DEBT_CATEGORIES:
    sev_style = sCellE if severity in ('CRITICAL',) else sCellW if severity == 'HIGH' else sCell
    debt_rows.append([
        CB(cat),
        Paragraph(str(hours), sCellB),
        Paragraph(severity, sev_style),
        C(desc),
    ])
debt_rows.append([
    CB('TOTAL'),
    Paragraph(f'{total_debt_hours}h', ParagraphStyle('dt', parent=sCellB, textColor=SEM_ERROR, fontSize=10)),
    CB(''),
    CB(f'Equivalent to ~{total_debt_hours / 40:.0f} developer-weeks of remediation'),
])
story.append(make_table(debt_headers, debt_rows, debt_cw))
story.append(Paragraph('Table 6: Technical Debt Assessment by Category', sCaption))

# Debt score
story.append(Spacer(1, 4*mm))
story.append(score_card('Technical Debt Score', debt_score, 10, 'HIGH DEBT - Requires immediate remediation plan'))
story.append(Paragraph('The debt score of {}/10 indicates that {:.0f} hours of focused remediation are needed to bring the codebase to a maintainable state.'.format(debt_score, total_debt_hours), sCaption))
story.append(PageBreak())

# ===================== CHAPTER 6: ARCHITECTURE DECISION LOG =====================
story.append(H1('<b>6. Architecture Decision Log</b>'))

arch_score = 5.8
story.append(B(
    'This chapter documents the key architectural decisions that shaped the VIXOR platform, including the technology choices, framework selections, and structural patterns that define how the system is built and maintained. '
    'Each decision includes its current status (Adopted, Planned, or Under Review), a brief rationale, and an assessment of how well the decision has served the project. The architecture audit scored {:.1f}/10, reflecting strong choices in DDD and component library selection but critical gaps in CI/CD, testing, and deployment infrastructure.'.format(arch_score)
))

story.append(B(
    'The adoption of Domain-Driven Design (DDD) was the single best architectural decision for this project. The 23 bounded contexts provide clear ownership boundaries, enable independent development of domain modules, and create a natural structure for scaling the engineering team. '
    'The TanStack Start framework provides modern SSR capabilities and type-safe routing, though the team has not fully leveraged its server function capabilities, relying too heavily on client-side data fetching. '
    'The Supabase backend-as-a-service choice accelerated initial development significantly but comes with vendor lock-in risks and pricing concerns at scale. The shadcn/ui component library was an excellent choice for a product requiring heavy customization, as the copy-paste model gives full ownership over component behavior.'
))

# Architecture decisions table
arch_headers = ['ID', 'Decision', 'Status', 'Assessment']
arch_cw = [18*mm, 36*mm, 24*mm, 64*mm]
arch_rows = []
for did, decision, status, assessment in ARCH_DECISIONS:
    status_style = sCellS if status == 'Adopted' else sCellI if status == 'Planned' else sCellW
    arch_rows.append([
        Paragraph(did, sCellB),
        Paragraph(decision, sCellB),
        Paragraph(status, status_style),
        Paragraph(assessment, sCell),
    ])
story.append(make_table(arch_headers, arch_rows, arch_cw))
story.append(Paragraph('Table 7: Architecture Decision Log', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Architecture Score', arch_score, 10, 'NEEDS WORK - Strong design, missing infrastructure'))
story.append(PageBreak())

# ===================== CHAPTER 7: PRODUCT DECISION LOG =====================
story.append(H1('<b>7. Product Decision Log</b>'))

prod_score = 4.5
story.append(B(
    'The product decision log documents the strategic choices that define what VIXOR is, who it serves, and how it competes in the market. The product audit scored {:.1f}/10, the lowest across all six audit dimensions, driven primarily by a severe feature creep problem where 39 routes were built without a clear prioritization framework or MVP scope definition. '
    'Despite the low score, several product decisions are fundamentally sound: the AI-first philosophy positions VIXOR uniquely in a market crowded with traditional charting tools, and the Telegram-first mobile strategy targets crypto-native users in their preferred environment. '
    'The critical gap is between strategic vision and tactical execution: the team has built an impressive set of features but without the product discipline to sequence them for maximum impact on a defined target user persona.'.format(prod_score)
))

story.append(B(
    'The AI-first product philosophy is the strongest product decision, making MOXI the central differentiator rather than an add-on feature. This means every screen should have AI-enhanced context, every analysis should be augmentable by AI insights, and the copilot should be the primary interface for user interaction. '
    'The multi-agent architecture with specialized agents for analysis, risk management, signal hunting, and coaching creates a sophisticated AI ecosystem that can provide well-rounded trading guidance. '
    'However, the decision to build 39 routes without a retention strategy means the product is broad but shallow, offering many entry points without ensuring users find enough value in any single path to return. The planned MVP scope reduction to 12 routes is the most important product decision that must be executed.'
))

prod_headers = ['ID', 'Decision', 'Status', 'Assessment']
prod_cw = [18*mm, 36*mm, 24*mm, 64*mm]
prod_rows = []
for did, decision, status, assessment in PRODUCT_DECISIONS:
    status_style = sCellS if status == 'Confirmed' else sCellI if status == 'Planned' else sCellW
    prod_rows.append([
        Paragraph(did, sCellB),
        Paragraph(decision, sCellB),
        Paragraph(status, status_style),
        Paragraph(assessment, sCell),
    ])
story.append(make_table(prod_headers, prod_rows, prod_cw))
story.append(Paragraph('Table 8: Product Decision Log', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Product Score', prod_score, 10, 'CRITICAL - Feature creep and no retention strategy'))
story.append(PageBreak())

# ===================== CHAPTER 8: UI DECISION LOG =====================
story.append(H1('<b>8. UI Decision Log</b>'))

ui_score = 6.4
story.append(B(
    'The UI decision log covers the visual design system, component architecture, and interaction patterns that define the VIXOR user experience. The UI/UX audit scored {:.1f}/10, reflecting a well-executed dark theme and thoughtful component library selection, but undermined by critical accessibility violations, weak empty states, and mobile responsiveness gaps that leave significant portions of the user population underserved. '
    'The dark theme as default was a deliberate choice that aligns with the crypto-native aesthetic of the target audience. The implementation uses a consistent color system with proper semantic colors for success, warning, and error states, creating a cohesive visual language across all pages. '
    'However, the absence of a light theme option limits usability for daytime use and fails to respect user system preferences, which is increasingly expected in modern web applications.'.format(ui_score)
))

story.append(B(
    'The shadcn/ui component library choice was excellent for this project because it provides well-tested, accessible Radix-based primitives that the team fully owns and can customize. The team has created approximately 40 custom components built on top of shadcn/ui, forming a cohesive design system. '
    'The sidebar navigation, while functional, needs a complete overhaul to address the 39-item overwhelm problem. The proposed solution groups routes into four collapsible categories and supports icon-only mode for smaller screens, which should dramatically improve discoverability and reduce choice paralysis. '
    'The planned micro-interactions strategy using framer-motion will add the polish that transforms a functional application into a premium-feeling product, but must be implemented within strict performance budgets to avoid animation-induced jank.'
))

ui_headers = ['ID', 'Decision', 'Status', 'Assessment']
ui_cw = [18*mm, 36*mm, 24*mm, 64*mm]
ui_rows = []
for did, decision, status, assessment in UI_DECISIONS:
    status_style = sCellS if status == 'Confirmed' else sCellI if status == 'Planned' else sCellW
    ui_rows.append([
        Paragraph(did, sCellB),
        Paragraph(decision, sCellB),
        Paragraph(status, status_style),
        Paragraph(assessment, sCell),
    ])
story.append(make_table(ui_headers, ui_rows, ui_cw))
story.append(Paragraph('Table 9: UI Decision Log', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('UI/UX Score', ui_score, 10, 'NEEDS WORK - Good foundation, critical a11y gaps'))
story.append(PageBreak())

# ===================== CHAPTER 9: AI DECISION LOG =====================
story.append(H1('<b>9. AI Decision Log</b>'))

ai_score = 7.8
story.append(B(
    'The AI decision log documents the choices that define VIXOR\'s artificial intelligence architecture, including the multi-provider LLM strategy, the MOXI persona design, the tool use architecture, and the agent orchestration pattern. While AI was not a separate audit dimension, the architecture and domain audits examined the AI subsystems extensively, and this chapter consolidates those findings into a dedicated AI assessment with an estimated score of {:.1f}/10. '
    'The multi-provider LLM strategy is the most resilient approach for an AI-first product, ensuring that no single provider failure can take down the core AI experience. The routing logic prioritizes speed for simple queries (Groq) and reasoning quality for complex analysis (Anthropic), with OpenAI as the reliable fallback. '
    'The MOXI persona design successfully balances professionalism with approachability, creating an AI trading companion that users trust without feeling intimidated by. The persona adapts its formality based on detected user expertise, a subtle but important feature that improves engagement across skill levels.'.format(ai_score)
))

story.append(B(
    'The tool use architecture, where LLM agents can invoke typed functions for trading operations and market queries, is a powerful capability that differentiates VIXOR from simple chat-based AI assistants. The tool registry provides a clean extension point for adding new capabilities, and the guardrails prevent autonomous trade execution without explicit user confirmation. '
    'The agent orchestration pattern routes user requests through a copilot agent to specialized agents (Analyst, Hunter, Governor, Coach), creating a division of labor that allows each agent to develop deep expertise. The conflict resolution mechanism, where the Governor agent acts as tiebreaker, ensures that disagreements between agents are handled transparently. '
    'The streaming response pattern via server-sent events provides the immediate feedback users expect from AI interactions, though the error recovery for mid-stream disconnections needs improvement. The context window management strategy, using smart truncation and summarization, is essential for maintaining coherent multi-turn conversations.'
))

ai_headers = ['ID', 'Decision', 'Status', 'Assessment']
ai_cw = [18*mm, 36*mm, 24*mm, 64*mm]
ai_rows = []
for did, decision, status, assessment in AI_DECISIONS:
    status_style = sCellS if status == 'Confirmed' else sCellI if status == 'Planned' else sCellW
    ai_rows.append([
        Paragraph(did, sCellB),
        Paragraph(decision, sCellB),
        Paragraph(status, status_style),
        Paragraph(assessment, sCell),
    ])
story.append(make_table(ai_headers, ai_rows, ai_cw))
story.append(Paragraph('Table 10: AI Decision Log', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('AI Architecture Score', ai_score, 10, 'GOOD - Strong multi-agent design'))
story.append(PageBreak())

# ===================== CHAPTER 10: SECURITY DECISION LOG =====================
story.append(H1('<b>10. Security Decision Log</b>'))

sec_score = 6.2
story.append(B(
    'The security decision log documents the authentication, authorization, data protection, and input validation strategies that protect VIXOR users and their data. The technical audit examined security extensively, and this chapter consolidates those findings with a dedicated security assessment score of {:.1f}/10. '
    'The security posture is fundamentally sound: JWT authentication via Supabase provides token-based auth with role-based claims, row-level security policies provide database-level tenant isolation, and the encrypted vault with access logging protects sensitive API keys for exchange connections. '
    'However, several gaps elevate risk: not all tables have RLS policies, rate limiting is inconsistently applied, no content security policy headers are set, and input validation does not cover all API endpoints. These gaps should be addressed as part of the Sprint 0 security hardening effort.'.format(sec_score)
))

story.append(B(
    'The JWT authentication strategy leverages Supabase Auth for token generation and validation, which is reliable for MVP scale. The server-side validation middleware must verify tokens on every authenticated request, and the refresh token flow must be transparent to prevent session interruptions. '
    'Row-level security is the strongest layer of defense, ensuring that even if application-level authorization has bugs, users cannot access other users data at the database level. The current audit found RLS gaps in several tables that must be addressed before launch. '
    'The API key vault uses encryption at rest and logs every access, providing an audit trail for credential usage. The planned key rotation schedule with 90-day expiry alerts will prevent stale credentials from accumulating. The input validation layer, partially implemented with Zod schemas, needs to be extended to cover all user-facing API endpoints without exception.'
))

sec_headers = ['ID', 'Decision', 'Status', 'Assessment']
sec_cw = [18*mm, 36*mm, 24*mm, 64*mm]
sec_rows = []
for did, decision, status, assessment in SECURITY_DECISIONS:
    status_style = sCellS if status in ('Confirmed', 'Adopted') else sCellW if 'Partially' in status else sCellI
    sec_rows.append([
        Paragraph(did, sCellB),
        Paragraph(decision, sCellB),
        Paragraph(status, status_style),
        Paragraph(assessment, sCell),
    ])
story.append(make_table(sec_headers, sec_rows, sec_cw))
story.append(Paragraph('Table 11: Security Decision Log', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Security Score', sec_score, 10, 'NEEDS WORK - Good foundation, RLS gaps'))
story.append(PageBreak())

# ===================== CHAPTER 11: PERFORMANCE DECISION LOG =====================
story.append(H1('<b>11. Performance Decision Log</b>'))

perf_score = 5.5
story.append(B(
    'The performance decision log covers caching strategies, code splitting, image optimization, WebSocket management, and CDN configuration decisions that affect the speed and responsiveness of the VIXOR platform. The technical audit evaluated performance infrastructure and this chapter provides a dedicated performance assessment score of {:.1f}/10. '
    'The React Query caching strategy is the foundation of client-side performance optimization, but the current configuration uses default settings that cause excessive refetching and cache churn. Tuning staleTime and gcTime for different data types (5 minutes for market data, 30 minutes for user preferences) would significantly reduce unnecessary network requests. '
    'Code splitting by route, which TanStack Start supports natively, has not been implemented, resulting in an initial bundle that loads all route components including heavy chart libraries and AI modules. Implementing lazy loading for each route would reduce the initial JavaScript payload by an estimated 60%.'.format(perf_score)
))

story.append(B(
    'The WebSocket connection management for live price data is currently unmanaged, with connections created on demand but never pooled or cleaned up. This leads to memory leaks on mobile devices where browser tabs are frequently backgrounded. A connection manager with exponential backoff reconnection, visibility-change disconnect, and maximum connection limits would solve this issue at the framework level. '
    'The server-side rendering strategy leverages TanStack Start for initial page content, providing good perceived performance and SEO benefits. However, interactive elements like charts and the copilot should hydrate lazily on the client to avoid blocking the initial render. '
    'The planned CDN and edge caching strategy would serve static assets from the Vercel Edge Network with content-hash filenames, eliminating stale asset issues. Public market data API responses can be cached in Vercel KV with a 30-second TTL, reducing origin load during peak usage periods.'
))

perf_headers = ['ID', 'Decision', 'Status', 'Assessment']
perf_cw = [18*mm, 36*mm, 24*mm, 64*mm]
perf_rows = []
for did, decision, status, assessment in PERF_DECISIONS:
    status_style = sCellI if 'Planned' in status or 'Needed' in status else sCellW if 'Needs' in status else sCellS
    perf_rows.append([
        Paragraph(did, sCellB),
        Paragraph(decision, sCellB),
        Paragraph(status, status_style),
        Paragraph(assessment, sCell),
    ])
story.append(make_table(perf_headers, perf_rows, perf_cw))
story.append(Paragraph('Table 12: Performance Decision Log', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Performance Score', perf_score, 10, 'NEEDS WORK - Missing caching, splitting, optimization'))
story.append(PageBreak())

# ===================== CHAPTER 12: MVP SCOPE DEFINITION =====================
story.append(H1('<b>12. MVP Scope Definition</b>'))

mvp_score = 6.0
story.append(B(
    'The MVP scope definition reduces the current 39-route application to 12 core routes that deliver the minimum viable value proposition for the VIXOR trading platform. This reduction is the most impactful product decision the team can make, as it focuses engineering effort on features that drive user acquisition and retention while eliminating the confusion and scope creep that currently dilutes the product experience. '
    'The 12 core routes are organized into three categories: Core routes (8) that are essential for any trading platform, Analysis routes (2) that provide VIXOR\'s unique AI-powered differentiation, and the remaining routes cover essential settings and daily engagement features. '
    'The 27 routes not included in the MVP should not be deleted but rather hidden behind feature flags, allowing the team to selectively enable them for beta users and gather usage data to inform future scope decisions. This approach preserves the engineering investment while preventing premature exposure of incomplete features.'
))

story.append(B(
    'The selection criteria for MVP routes were based on four factors: user acquisition value (does this feature attract new users), retention value (does this feature bring users back daily), differentiation value (does this feature distinguish VIXOR from competitors), and dependency value (is this feature required for other features to function). '
    'The Dashboard serves as the home base, providing a portfolio overview with P&L summary and recent signal activity. The Copilot is the primary AI interface and represents the core differentiator. The Analysis route provides detailed AI-powered market analysis for individual assets. '
    'The Daily Loop route is the most important retention feature, creating a morning ritual that guides users through their daily trading workflow. The Watchlist, Trades, Journal, and Portfolio routes provide the essential data management capabilities. '
    'Discovery and Alerts provide analysis capabilities that leverage VIXOR\'s scoring engine and notification infrastructure. Settings is essential for user customization. The estimated development effort to polish these 12 routes for launch is approximately 6 sprints spanning 14 weeks.'
))

mvp_headers = ['#', 'Route', 'Name', 'Category', 'Value Proposition']
mvp_cw = [10*mm, 28*mm, 24*mm, 22*mm, 78*mm]
mvp_rows = []
for num, route, name, category, value in MVP_ROUTES:
    cat_style = sCellB if category == 'Core' else sCellI
    mvp_rows.append([
        CB(num),
        Paragraph(route, sMono),
        CB(name),
        Paragraph(category, cat_style),
        C(value),
    ])
story.append(make_table(mvp_headers, mvp_rows, mvp_cw))
story.append(Paragraph('Table 13: MVP Route Definition (12 of 39)', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('MVP Scope Score', mvp_score, 10, 'GOOD - Clear focus, actionable scope reduction'))
story.append(PageBreak())

# ===================== CHAPTER 13: ROADMAP =====================
story.append(H1('<b>13. Roadmap</b>'))

roadmap_score = 7.0
total_roadmap_hours = sum(int(s[4].replace('h', '')) for s in ROADMAP_SPRINTS)

story.append(B(
    'The roadmap organizes the refactor into six sequential sprints spanning 14 weeks with a total estimated effort of {} hours. Each sprint has clear entry criteria, deliverables, and exit criteria that must be met before the next sprint begins. '
    'The phased approach minimizes risk by ensuring foundational infrastructure is in place before higher-level refactoring begins. Sprint 0 establishes the CI/CD pipeline, test framework, and basic error handling that all subsequent sprints depend on. '
    'Each sprint is designed to be independently valuable, meaning that even if the plan is paused after any sprint, the codebase is left in a measurably better state. This is critical for a project where business priorities may shift and the full 14-week commitment may not be feasible.'.format(total_roadmap_hours)
))

story.append(B(
    'Sprint 0 (Foundation) is the most critical sprint, establishing CI/CD with GitHub Actions, environment validation with Zod, error boundaries on all routes, structured logging, and the Vitest/Playwright test framework. This sprint costs 40 hours but enables every subsequent sprint by providing automated quality gates and a safety net for refactoring. '
    'Sprint 1 (Component Refactor) focuses on the AppShell decomposition, chart variant unification, Storybook setup, and skeleton loader implementation. Sprint 2 (Domain Cleanup) addresses the shared kernel extraction, RLS policy audit, data integrity fixes, and domain event trail. '
    'Sprint 3 (UX Polish) tackles WCAG accessibility fixes, empty state design, toast notification system, responsive breakpoints, and navigation redesign. Sprint 4 (Feature Rationalization) reduces routes from 39 to 12, builds the onboarding wizard, and implements the new grouped navigation. '
    'Sprint 5 (Performance and Polish) focuses on code splitting, React Query caching optimization, image optimization pipeline, Sentry monitoring deployment, and final performance tuning to meet Lighthouse budgets.'
))

road_headers = ['Sprint', 'Timeline', 'Theme', 'Key Deliverables', 'Effort']
road_cw = [18*mm, 22*mm, 26*mm, 64*mm, 16*mm]
road_rows = []
for sprint, timeline, theme, deliverables, effort in ROADMAP_SPRINTS:
    road_rows.append([
        CB(sprint),
        C(timeline),
        Paragraph(theme, sCellB),
        C(deliverables),
        CB(effort),
    ])
road_rows.append([
    CB('TOTAL'),
    C('14 weeks'),
    CB('6 Sprints'),
    Paragraph(f'{total_roadmap_hours}h (~{total_roadmap_hours / 40:.0f} dev-weeks)', sCellB),
    CB(f'{total_roadmap_hours}h'),
])
story.append(make_table(road_headers, road_rows, road_cw))
story.append(Paragraph('Table 14: Refactor Roadmap Sprint Overview', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Roadmap Score', roadmap_score, 10, 'GOOD - Clear phases, realistic estimates'))
story.append(PageBreak())

# ===================== CHAPTER 14: RELEASE CHECKLIST =====================
story.append(H1('<b>14. Release Checklist</b>'))

checklist_score = 0.0
story.append(B(
    'The release checklist defines 20 items that must be completed before the VIXOR platform can be considered ready for public launch. Each item is assigned a priority level: P0 items are hard blockers that prevent any launch, P1 items are significant quality gates that should be completed, and P2 items are polish items that can be deferred to a post-launch patch if necessary. '
    'Currently, all 20 items have a status of "Not Started," reflecting the early stage of the refactor plan. As sprints are completed, items will be checked off, providing a clear progress indicator toward launch readiness. '
    'The checklist is designed to be the single source of truth for release readiness, meaning no subjective assessment is needed to determine if the product is ready: if all P0 and P1 items are checked, the product is ready for launch.'
))

story.append(B(
    'The four P0 items represent the minimum viable infrastructure: resolving all P0 issues, establishing a green CI/CD pipeline, achieving 60% test coverage on core domains, and fixing all WCAG 2.1 AA critical violations. These four items alone would raise the overall audit score from {:.1f} to approximately 6.5, crossing the threshold from "critical" to "needs work." '
    'The twelve P1 items cover error handling, UX polish, performance budgets, monitoring, API versioning, environment validation, and database security. Completing all P1 items would bring the overall score to approximately 7.2, approaching launch readiness. '
    'The four P2 items cover theme consistency, responsive layout testing, Storybook coverage, and secret rotation. These can be completed post-launch as part of ongoing quality improvement, though completing them before launch would provide additional confidence in the product\'s maturity.'.format(overall_weighted)
))

chk_headers = ['#', 'Item', 'Priority', 'Status']
chk_cw = [10*mm, 76*mm, 20*mm, 26*mm]
chk_rows = []
for num, item, priority, status in RELEASE_CHECKLIST:
    pri_style = sCellE if priority == 'P0' else sCellW if priority == 'P1' else sCell
    status_style = sCellE if status == 'Not Started' else sCellS
    chk_rows.append([
        CB(num),
        C(item),
        Paragraph(priority, pri_style),
        Paragraph(status, status_style),
    ])
story.append(make_table(chk_headers, chk_rows, chk_cw))
story.append(Paragraph('Table 15: Release Checklist (20 Items)', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Release Readiness', checklist_score, 10, 'NOT READY - 0/20 items completed'))
story.append(PageBreak())

# ===================== CHAPTER 15: RISK MATRIX =====================
story.append(H1('<b>15. Risk Matrix</b>'))

risk_score = 6.0
story.append(B(
    'The risk matrix identifies 10 key risks to the VIXOR project, assessing each for likelihood of occurrence and potential impact on the project timeline, product quality, or business success. Each risk includes specific mitigation strategies that should be implemented as part of the sprint plan. '
    'The highest combined risks are developer burnout (Medium likelihood, Critical impact) and security breach via RLS gap (Medium likelihood, Critical impact), both of which require proactive mitigation rather than reactive response. '
    'The risk assessment score of {:.1f}/10 reflects that while no individual risk is unmanageable, the combination of infrastructure gaps, ambitious AI features, and aggressive timeline creates a risk profile that requires careful attention throughout the refactor.'.format(risk_score)
))

story.append(B(
    'The most likely risk is scope creep during the refactor (High likelihood, High impact), which is ironic given that scope creep is also the top product problem. The mitigation strategy of strict MVP definition with feature flags provides both a technical and process-level safeguard. '
    'Third-party dependency breaking changes carry High likelihood but Medium impact because the pinning strategy and Dependabot monitoring should catch most issues before they affect production. The regulatory risk for crypto products carries Low likelihood but Critical impact because regulatory changes can invalidate entire product features overnight. '
    'The mobile experience risk (Medium likelihood, High impact) is mitigated by the Telegram Mini App strategy, which provides a native-like mobile experience without the overhead of maintaining separate iOS and Android applications. '
    'The user adoption risk (Medium likelihood, High impact) is addressed through the beta testing program and feedback loops that should validate the product-market fit before a public launch.'
))

risk_headers = ['ID', 'Risk', 'Likelihood', 'Impact', 'Mitigation Strategy']
risk_cw = [14*mm, 30*mm, 20*mm, 20*mm, 78*mm]
risk_rows = []
for rid, risk, likelihood, impact, mitigation in RISK_MATRIX:
    lk_style = sCellE if likelihood == 'High' else sCellW if likelihood == 'Medium' else sCellS
    im_style = sCellE if impact == 'Critical' else sCellW if impact == 'High' else sCellS
    risk_rows.append([
        Paragraph(rid, sCellB),
        C(risk),
        Paragraph(likelihood, lk_style),
        Paragraph(impact, im_style),
        C(mitigation),
    ])
story.append(make_table(risk_headers, risk_rows, risk_cw))
story.append(Paragraph('Table 16: Risk Matrix (10 Risks)', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Risk Management Score', risk_score, 10, 'NEEDS WORK - Several Critical risks need mitigation'))
story.append(PageBreak())

# ===================== CHAPTER 16: DECISION LOG =====================
story.append(H1('<b>16. Consolidated Decision Log</b>'))

decision_score = 6.5
story.append(B(
    'This chapter provides a consolidated view of all architectural and product decisions documented across the previous decision log chapters. The consolidation enables a holistic assessment of decision quality and reveals patterns in how the team makes strategic choices. '
    'The overall decision quality score of {:.1f}/10 reflects strong strategic vision (AI-first, DDD, multi-agent) paired with execution gaps (no CI/CD, no testing, scope creep). The decisions themselves are well-reasoned and aligned with the product vision, but the failure to implement supporting infrastructure decisions (CI/CD, monitoring, testing) undermines the value of the good architectural decisions.'.format(decision_score)
))

story.append(B(
    'The decision log reveals a pattern of strong strategic choices and weak operational execution. The team excels at selecting the right technologies and architectural patterns: DDD for domain modeling, TanStack Start for the framework, Supabase for the backend, shadcn/ui for components, multi-provider LLM for AI resilience, and Telegram for mobile distribution. '
    'However, the team has consistently deferred operational infrastructure decisions: no CI/CD pipeline, no test framework, no monitoring, no API versioning, no performance budgets, and no security hardening. This pattern suggests that the team prioritizes feature development over platform health, which is common in early-stage startups but unsustainable for production-grade software. '
    'The 31 decisions documented across all logs are categorized by status: 17 Adopted/Confirmed decisions that define the current architecture, 11 Planned decisions that represent the remediation roadmap, and 3 decisions Under Review that need further analysis before commitment.'
))

# Consolidated stats
consol_headers = ['Category', 'Total Decisions', 'Adopted', 'Planned', 'Under Review', 'Score']
consol_rows = [
    [CB('Architecture'), C('8'), CS('6'), CI('1'), CW('1'), C('5.8/10')],
    [CB('Product'), C('8'), CS('3'), CI('3'), CW('2'), C('4.5/10')],
    [CB('UI/UX'), C('6'), CS('2'), CI('3'), CW('1'), C('6.4/10')],
    [CB('AI'), C('6'), CS('5'), CI('1'), CW('0'), C('7.8/10')],
    [CB('Security'), C('7'), CS('3'), CI('2'), CW('2'), C('6.2/10')],
    [CB('Performance'), C('6'), CS('0'), CI('3'), CW('3'), C('5.5/10')],
    [CB('TOTAL'), CB('41'), CS('19'), CI('13'), CW('9'), Paragraph('6.0/10', ParagraphStyle('cds', parent=sCellB, textColor=SEM_WARNING))],
]
consol_cw = [26*mm, 22*mm, 18*mm, 18*mm, 22*mm, 18*mm]
story.append(make_table(consol_headers, consol_rows, consol_cw))
story.append(Paragraph('Table 17: Consolidated Decision Statistics', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Decision Quality Score', decision_score, 10, 'NEEDS WORK - Good vision, poor execution'))
story.append(PageBreak())

# ===================== CHAPTER 17: FUTURE IDEAS =====================
story.append(H1('<b>17. Future Ideas</b>'))

ideas_score = 7.5
story.append(B(
    'This chapter presents 20 forward-looking ideas that could shape the VIXOR product roadmap beyond the current MVP and refactor scope. These ideas range from near-term extensions (on-chain analytics, multi-exchange portfolio) to ambitious long-term visions (autonomous AI portfolio manager, white-label solution). '
    'Each idea includes a rough effort estimate and a prerequisite condition that must be met before the idea can be seriously considered. The ideas are not prioritized but rather serve as a brainstorming input for future roadmap planning sessions. '
    'The future ideas assessment score of {:.1f}/10 reflects the richness and ambition of the product vision, tempered by the recognition that many of these ideas depend on resolving current infrastructure and product discipline issues first.'.format(ideas_score)
))

story.append(B(
    'The most impactful near-term ideas are the Strategy Marketplace, Multi-Exchange Portfolio, and On-Chain Analytics features, which extend the current core competencies into revenue-generating and engagement-driving directions. The Strategy Marketplace in particular could create a network effect where the platform becomes more valuable as more strategies are contributed by the community. '
    'Voice Trading Interface and Real-Time Collaboration represent innovative interaction paradigms that could differentiate VIXOR significantly from competitors. However, both require mature mobile and team infrastructure respectively. '
    'The most ambitious ideas like the Autonomous AI Portfolio Manager and White-Label Solution represent potential billion-dollar opportunities but require years of proven track record and enterprise-grade infrastructure that is far beyond the current MVP scope.'
))

ideas_headers = ['ID', 'Idea', 'Description', 'Effort', 'Prerequisite']
ideas_cw = [16*mm, 30*mm, 48*mm, 16*mm, 52*mm]
ideas_rows = []
for iid, idea, desc, effort, prereq in FUTURE_IDEAS:
    effort_color = SEM_ERROR if effort == 'XL' else SEM_WARNING if effort in ('L', 'M') else SEM_SUCCESS
    ideas_rows.append([
        Paragraph(iid, sCellB),
        Paragraph(idea, sCellB),
        C(desc),
        Paragraph(effort, ParagraphStyle('ie', parent=sCellB, textColor=effort_color)),
        C(prereq),
    ])
story.append(make_table(ideas_headers, ideas_rows, ideas_cw))
story.append(Paragraph('Table 18: Future Ideas (20 Forward-Looking Proposals)', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Future Vision Score', ideas_score, 10, 'GOOD - Ambitious, well-sequenced roadmap'))
story.append(PageBreak())

# ===================== CHAPTER 18: ENTERPRISE READINESS =====================
story.append(H1('<b>18. Enterprise Readiness Assessment</b>'))

enterprise_score = 3.8
story.append(B(
    'The enterprise readiness assessment evaluates the VIXOR platform against the requirements that enterprise customers typically demand before adopting a SaaS product: security certifications, compliance frameworks, SLA guarantees, data governance, multi-tenancy support, SSO integration, audit logging, and support infrastructure. '
    'The enterprise readiness score of {:.1f}/10 places VIXOR firmly in the "Not Ready" category, which is expected for a product at the pre-MVP stage. However, the assessment identifies the specific gaps that must be closed if enterprise sales are part of the go-to-market strategy, providing a clear investment roadmap for the enterprise readiness journey. '
    'The most critical enterprise readiness gaps are the absence of SOC 2 compliance documentation, no SSO/SAML integration, no multi-tenant data isolation guarantees, no audit logging for compliance, and no enterprise support infrastructure (SLA, dedicated support, on-premise deployment option).'.format(enterprise_score)
))

story.append(B(
    'On the positive side, several architectural decisions position VIXOR well for future enterprise readiness. The DDD architecture with clear domain boundaries maps naturally to microservice decomposition for enterprise scale. The Supabase backend provides row-level security that can be extended to multi-tenant isolation with minimal changes. '
    'The encrypted vault for API keys demonstrates security awareness, and the JWT authentication framework can be extended to support SAML and OIDC for enterprise SSO. The structured logging infrastructure, once implemented, provides the foundation for audit logging required by compliance frameworks. '
    'The recommended approach is to pursue enterprise readiness in three phases: Phase 1 (post-MVP) addresses security hardening and audit logging, Phase 2 (post-Series A) tackles SOC 2 compliance and SSO integration, and Phase 3 (post-product-market fit) handles full enterprise features including on-premise deployment and custom SLAs. '
    'The estimated total investment for full enterprise readiness is 6-9 months of dedicated engineering effort, but incremental adoption is possible by addressing the highest-impact gaps first.'
))

# Enterprise readiness breakdown
ent_headers = ['Dimension', 'Current State', 'Target State', 'Gap', 'Priority']
ent_cw = [24*mm, 34*mm, 34*mm, 28*mm, 18*mm]
ent_rows = [
    [CB('Authentication'), C('JWT via Supabase'), C('JWT + SAML + OIDC SSO'), CW('Major'), CE('High')],
    [CB('Data Isolation'), C('RLS per user'), C('Multi-tenant isolation'), CW('Moderate'), CE('High')],
    [CB('Audit Logging'), C('No audit trail'), C('Full activity logging'), CE('Critical'), CE('High')],
    [CB('Compliance'), C('None'), C('SOC 2 Type II'), CE('None'), CE('High')],
    [CB('SLA'), C('No SLA defined'), C('99.9% uptime SLA'), CE('Major'), CW('Medium')],
    [CB('Support'), C('Community only'), C('Dedicated + 24/7'), CE('Major'), CW('Medium')],
    [CB('Deployment'), C('Vercel only'), C('Cloud + On-premise'), CE('Major'), C('Low')],
    [CB('Data Governance'), C('Basic backups'), C('Full DLP + retention'), CW('Moderate'), CW('Medium')],
    [CB('API Access'), C('No API for external'), C('REST + GraphQL API'), CW('Moderate'), CW('Medium')],
    [CB('Team Management'), C('Solo user only'), C('RBAC + teams + orgs'), CE('Major'), CE('High')],
]
story.append(make_table(ent_headers, ent_rows, ent_cw))
story.append(Paragraph('Table 19: Enterprise Readiness Gap Analysis', sCaption))
story.append(Spacer(1, 3*mm))
story.append(score_card('Enterprise Readiness', enterprise_score, 10, 'NOT READY - Post-MVP investment required'))
story.append(PageBreak())

# ===================== CHAPTER 19: FINAL VERDICT =====================
story.append(H1('<b>19. Final Verdict</b>'))

story.append(B(
    'The VIXOR Master Audit synthesizes 221 problems, 100 improvements, 41 decisions, and 20 future ideas into a definitive assessment of a codebase that demonstrates extraordinary ambition and strong domain modeling, but suffers from critical infrastructure gaps and product discipline failures. '
    'The weighted overall score of {:.1f}/10 reflects a project that is architecturally sound in its intellectual design but operationally immature in its execution. The domain-driven architecture with 23 bounded contexts, the multi-agent AI system with five specialized agents, and the comprehensive analysis engine with pattern recognition and regime detection represent genuinely innovative engineering.'.format(overall_weighted)
))

story.append(B(
    'The audit reveals a clear pattern: the team excels at building features but has not invested proportionally in the infrastructure that makes features sustainable. The absence of CI/CD, testing, monitoring, and performance budgets means that every feature carries hidden maintenance costs that compound over time. The 39-route scope for an MVP product indicates a strategic gap between vision and execution, where the desire to impress overshadows the discipline to focus. '
    'However, the problems identified are all solvable. There are no fundamental architectural flaws that require a complete rewrite. The domain model is clean, the AI architecture is well-designed, the component library is extensible, and the security foundation is sound. The 14-week, 6-sprint refactor roadmap provides a realistic path from the current {:.1f}/10 score to an estimated 7.5+/10 launch-ready score.'.format(overall_weighted)
))

story.append(B(
    'The strongest recommendation from this audit is to execute Sprint 0 immediately: establish CI/CD, add test framework, implement error boundaries, and deploy monitoring. These four actions alone will transform the development workflow from fragile manual processes to automated, verifiable engineering. '
    'The second strongest recommendation is to reduce the product scope from 39 routes to 12 immediately, not by deleting code but by hiding non-essential routes behind feature flags. This single action will focus the team, simplify testing, improve onboarding, and accelerate the path to a coherent MVP launch. '
    'The VIXOR platform has the potential to be a genuinely differentiated product in the crowded trading platform market, but only if the team matches its architectural ambition with operational discipline. This audit provides the blueprint for closing that gap.'
))

# Final verdict display
story.append(Spacer(1, 6*mm))
verdict_data = [
    [Paragraph('<b>OVERALL VIXOR SCORE</b>', ParagraphStyle('v1', parent=sCellB, fontSize=14, textColor=colors.white, alignment=TA_CENTER))],
    [Paragraph(f'<b>{overall_weighted:.1f} / 10</b>', ParagraphStyle('v2', parent=sCellB, fontSize=36, textColor=colors.white, alignment=TA_CENTER))],
    [Paragraph('NOT READY FOR PRODUCTION', ParagraphStyle('v3', parent=sCellB, fontSize=12, textColor=colors.HexColor('#ffcccc'), alignment=TA_CENTER))],
]
verdict_table = Table(verdict_data, colWidths=[USABLE_W])
verdict_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), SEM_ERROR),
    ('TOPPADDING', (0, 0), (-1, -1), 8),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
]))
story.append(verdict_table)
story.append(Spacer(1, 4*mm))

# Section scores summary
story.append(H2('<b>19.1 All Section Scores</b>'))
final_headers = ['Section', 'Score', 'Verdict']
final_cw = [50*mm, 24*mm, 78*mm]
section_scores = [
    ('Architecture', 5.8, 'Strong DDD design, missing CI/CD and tests'),
    ('Product', 4.5, 'Ambitious vision, severe feature creep'),
    ('Domain', 7.3, 'Excellent modularity, 3 P0 data issues'),
    ('Component', 6.4, 'Good library, monolithic AppShell'),
    ('UI/UX', 6.4, 'Good dark theme, critical a11y gaps'),
    ('Technical', 5.4, 'Sound security, no monitoring/CI'),
    ('AI Architecture', 7.8, 'Strong multi-agent design'),
    ('Security', 6.2, 'Good foundation, RLS gaps'),
    ('Performance', 5.5, 'Missing optimization pipeline'),
    ('MVP Scope', 6.0, 'Clear reduction plan defined'),
    ('Roadmap', 7.0, 'Realistic 6-sprint plan'),
    ('Risk Management', 6.0, 'Several Critical risks identified'),
    ('Decision Quality', 6.5, 'Good vision, poor execution'),
    ('Future Vision', 7.5, 'Ambitious, well-sequenced'),
    ('Enterprise Readiness', 3.8, 'Not applicable for MVP stage'),
    ('Technical Debt', debt_score, '790h estimated remediation'),
]
final_rows = []
for name, score, verdict in section_scores:
    v_color = SEM_ERROR if score < 5 else SEM_WARNING if score < 7 else SEM_SUCCESS
    final_rows.append([
        CB(name),
        Paragraph(f'{score}/10', ParagraphStyle('fs', parent=sCellB, textColor=v_color)),
        Paragraph(verdict, ParagraphStyle('fv', parent=sCell, textColor=v_color)),
    ])
final_rows.append([
    CB('WEIGHTED OVERALL'),
    Paragraph(f'{overall_weighted:.1f}/10', ParagraphStyle('fo', parent=sCellB, textColor=SEM_ERROR, fontSize=12)),
    Paragraph('NOT READY FOR PRODUCTION - 14-week refactor needed', ParagraphStyle('fov', parent=sCellB, textColor=SEM_ERROR)),
])
story.append(make_table(final_headers, final_rows, final_cw))
story.append(Paragraph('Table 20: Complete Section Scores Summary', sCaption))

story.append(Spacer(1, 6*mm))
story.append(B(
    '<b>Recommendation:</b> Execute the 6-sprint refactor plan starting with Sprint 0 (CI/CD, testing, error boundaries, monitoring). '
    'Reduce MVP scope from 39 to 12 routes immediately using feature flags. '
    'Target a launch-ready score of 7.5/10 within 14 weeks, at which point the product can be released to beta users for validation before a public launch. '
    'The intellectual core of VIXOR is strong; the operational foundation needs dedicated investment to match.'
))

# =============================================================
# BUILD PDF
# =============================================================
OUTPUT_PATH = '/home/z/my-project/download/VIXOR_Master_Audit.pdf'

doc = TocDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=MARGIN_LEFT,
    rightMargin=MARGIN_RIGHT,
    topMargin=25*mm,
    bottomMargin=20*mm,
    title='VIXOR Master Audit',
    author='VIXOR Audit Team',
    subject='Comprehensive Master Audit combining 6 audit dimensions',
)

from reportlab.platypus import PageTemplate, Frame

frame = Frame(MARGIN_LEFT, 20*mm, USABLE_W, H - 45*mm, id='normal')
cover_frame = Frame(MARGIN_LEFT, 20*mm, USABLE_W, H - 20*mm, id='cover')

doc.addPageTemplates([
    PageTemplate(id='Cover', frames=cover_frame, onPage=cover_bg),
    PageTemplate(id='Content', frames=frame, onPage=page_bg),
])

# Insert template switches
story.insert(0, PageBreak())
from reportlab.platypus.doctemplate import NextPageTemplate
story.insert(0, NextPageTemplate('Content'))

doc.build(story)

# Report
fsize = os.path.getsize(OUTPUT_PATH)
print(f'PDF generated: {OUTPUT_PATH}')
print(f'File size: {fsize:,} bytes ({fsize / 1024:.1f} KB)')

# Count pages approximately
import subprocess
try:
    result = subprocess.run(['python3', '-c', '''
from reportlab.lib.pagesizes import A4
import subprocess
result = subprocess.run(["strings", "{0}"], capture_output=True, text=True)
pages = result.stdout.count("/Page")
print(pages)
'''.format(OUTPUT_PATH)], capture_output=True, text=True, timeout=10)
    if result.returncode == 0:
        print(f'Estimated pages: {result.stdout.strip()}')
except Exception:
    print('Page count: check with PDF viewer')
