"""VIXOR Architecture Audit - Professional PDF Report"""
import sys, os, hashlib, platform

PDF_SKILL_DIR = os.environ.get('PDF_SKILL_DIR', './skills/pdf')
_scripts = os.path.join(PDF_SKILL_DIR, 'scripts')
if _scripts not in sys.path:
    sys.path.insert(0, _scripts)

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.units import mm, cm, inch
from reportlab.lib import colors
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether,
    SimpleDocTemplate, HRFlowable
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
import re

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
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
                    italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

# ============================================================
# CASCADE PALETTE
# ============================================================
PAGE_BG      = colors.HexColor('#f1f0ef')
SECTION_BG   = colors.HexColor('#ebeae8')
CARD_BG      = colors.HexColor('#ebeae7')
TABLE_STRIPE = colors.HexColor('#f4f3f2')
HEADER_FILL  = colors.HexColor('#7c704e')
COVER_BLOCK  = colors.HexColor('#6c6141')
BORDER       = colors.HexColor('#cdc8bb')
ICON         = colors.HexColor('#9e8c56')
ACCENT       = colors.HexColor('#856f2c')
ACCENT_2     = colors.HexColor('#7355cc')
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

def score_row(scores):
    cells = []
    for label, val in scores:
        cells.append(Table(
            [[Paragraph(str(val), ParagraphStyle('sv', fontName='FreeSerif-Bold',
                        fontSize=20, leading=26, textColor=ACCENT, alignment=TA_CENTER))],
             [Paragraph(label, ParagraphStyle('sl', fontName='FreeSerif', fontSize=7,
                        textColor=TEXT_MUTED, alignment=TA_CENTER))]],
            colWidths=[85], rowHeights=[30, 14]))
    return Table([cells], colWidths=[85]*len(scores))

# ============================================================
# DOCUMENT TEMPLATE WITH TOC
# ============================================================
class TocDocTemplate(SimpleDocTemplate):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ============================================================
# PAGE TEMPLATE
# ============================================================
from reportlab.platypus import PageTemplate, Frame
from reportlab.lib.units import mm

content_width = A4[0] - 50*mm - 20*mm
frame = Frame(50*mm, 25*mm, content_width, A4[1] - 50*mm, id='normal')

def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('FreeSerif', 7)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(50*mm, 15*mm, 'VIXOR Architecture Audit')
    canvas.drawRightString(A4[0] - 20*mm, 15*mm, f'Page {doc.page}')
    canvas.restoreState()

def cover_footer(canvas, doc):
    pass

tpl = PageTemplate(id='cover', frames=[frame], onPage=cover_footer)
tpl_body = PageTemplate(id='body', frames=[frame], onPage=page_footer)

# ============================================================
# BUILD STORY
# ============================================================
story = []

# TOC
toc = TableOfContents()
toc.levelStyles = [toc_h0, toc_h1]
story.append(Paragraph('Table of Contents', sH1))
story.append(Spacer(1, 8))
story.append(toc)
story.append(PageBreak())

# ============================================================
# CHAPTER 1: EXECUTIVE SUMMARY
# ============================================================
story.append(heading('1. Executive Summary', sH1, 0))
story.append(body(
    'VIXOR is a Solana-focused cryptocurrency trading terminal built as a full-stack React application. '
    'The architecture employs a domain-driven design (DDD) approach with 23 distinct domain modules, '
    'a shared infrastructure layer, and a TanStack Start framework providing SSR and server functions. '
    'The application integrates multiple external APIs for market data, AI-powered analysis through '
    'Vercel AI SDK with multiple LLM providers, and Web3 wallet connectivity for both EVM and Solana chains. '
    'The backend is deployed on Vercel serverless functions with Upstash Redis for rate limiting and caching.'
))
story.append(body(
    'The overall architecture demonstrates a mature understanding of domain separation and clean module boundaries. '
    'The dependency graph between domains forms a clean directed acyclic graph (DAG) with no circular dependencies. '
    'However, several significant issues were identified across the codebase: a non-existent CI/CD pipeline despite '
    'production deployment, a broken shadcn/ui configuration path, 3 duplicated hook modules, an unconfigured '
    'Storybook installation, missing test infrastructure, and several unused or underutilized dependencies. '
    'The application scores 5.8 out of 10 overall, reflecting strong domain architecture undermined by '
    'infrastructure gaps and missing development tooling.'
))

# Overall score box
story.append(Spacer(1, 12))
score_data = [
    ('Architecture', '6.2'), ('Strengths', '7.5'), ('Weaknesses', '4.1'),
    ('Tech Debt', '5.0'), ('Scalability', '5.5'), ('Maintainability', '5.3'),
    ('Enterprise Ready', '3.8'), ('Clean Arch', '5.8'),
]
story.append(score_row(score_data))
story.append(Spacer(1, 12))

story.append(heading('Key Findings Summary', sH2, 1))
story.append(bullet('<b>23 P0/P1 issues</b> identified across architecture, infrastructure, and configuration layers'))
story.append(bullet('<b>Zero CI/CD</b> pipeline exists despite production deployment on Vercel'))
story.append(bullet('<b>Zero test coverage</b> -- vitest is configured but no test runner script exists'))
story.append(bullet('<b>Strong domain architecture</b> -- clean DAG, no circular dependencies, well-separated concerns'))
story.append(bullet('<b>455 source files</b> remaining after Phase 1 cleanup (34 dead files removed)'))
story.append(bullet('<b>39 authenticated routes</b> -- potential over-scoping for MVP stage'))
story.append(bullet('<b>57 production dependencies</b> -- several potentially unused (pagedjs, oakscriptjs, sentiment)'))

# ============================================================
# CHAPTER 2: PROJECT ROOT ANALYSIS
# ============================================================
story.append(PageBreak())
story.append(heading('2. Project Root Analysis', sH1, 0))
story.append(body(
    'The project root contains the expected configuration files for a modern TypeScript/Vite project, '
    'along with several artifacts that indicate incomplete housekeeping. The presence of multiple lock files '
    '(pnpm-lock.yaml, bun.lock, package-lock.json) suggests the project has been used across different package '
    'managers without cleanup. Three accidentally created files exist in the root: <b>--timeout</b> (CLI typo artifact), '
    '<b>README (2).md</b>, and <b>components (2).json</b> (duplicates of existing files). Three SQL migration files '
    'also sit in the root directory instead of the supabase/migrations/ folder where they belong.'
))
story.append(body(
    'The vercel.json configuration is well-structured, specifying Node.js 22.x runtime, build command with '
    '4GB memory allocation, and two cron jobs for daily signal generation (midnight UTC) and alert checking '
    '(00:30 UTC). The pnpm-workspace.yaml exists but the project does not appear to use workspace features, '
    'suggesting it was scaffolded from a monorepo template without removal. Multiple phase report markdown files '
    '(PHASE_A_REPORT.md, PHASE_B_REPORT.md, etc.) in the root suggest ongoing audit work that should be '
    'consolidated into a dedicated documentation directory.'
))

story.append(heading('Root Artifacts Requiring Cleanup', sH2, 1))
root_problems = [
    ['ARCH-001', 'P2', 'Multiple lock files', 'Confusion about package manager', 'Low', 'pnpm-lock.yaml, bun.lock, package-lock.json', 'Scaffolded from template, never cleaned'],
    ['ARCH-002', 'P2', 'Accidental root files', 'Unprofessional repo appearance', 'Low', '--timeout, README (2).md, components (2).json', 'CLI typos and copy-paste errors'],
    ['ARCH-003', 'P2', 'Misplaced SQL files', 'Schema confusion', 'Low', '3x root-level .sql files', 'Migration files moved incorrectly'],
    ['ARCH-004', 'P2', 'Root-level reports', 'Cluttered repository root', 'Low', 'PHASE_*.md, DATA_LAYER_REPORT.md, VIXOR_UI_AUDIT.md', 'Audit artifacts not organized'],
]
story.append(problem_table(root_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 4/10 -- Functional but messy root directory'))

# ============================================================
# CHAPTER 3: SRC STRUCTURE
# ============================================================
story.append(PageBreak())
story.append(heading('3. Source Code Structure', sH1, 0))
story.append(body(
    'The src/ directory follows a well-organized structure with clear separation between routes, domains, '
    'shared infrastructure, and components. The top-level entry points (start.ts, server.ts, router.tsx) '
    'correctly bootstrap the TanStack Start application with SSR support, middleware configuration, and '
    'error handling. The styles.css file contains the complete VIXOR Design System V5 implemented using '
    'Tailwind CSS v4 with CSS-first configuration (no separate tailwind.config.js), defining theme tokens for '
    'colors, radius, spacing, motion, and typography including Inter for UI, JetBrains Mono for financial data, '
    'and Amiri for Arabic text support.'
))
story.append(body(
    'The src/lib/ directory no longer exists after Phase 1 cleanup, which removed 34 dead re-export shims. '
    'However, the shadcn/ui components.json still references @/lib/utils as the utility path, which now '
    'resolves incorrectly. All utilities have been migrated to src/shared/utils.ts, but the configuration '
    'has not been updated to reflect this. This is a P1 issue because it creates confusion for developers '
    'adding new shadcn components, who would expect to find utils at the aliased path.'
))

structure_problems = [
    ['ARCH-005', 'P1', 'Broken shadcn/ui alias', 'New component generation fails', 'Medium', 'components.json', 'utils.ts deleted, alias not updated'],
    ['ARCH-006', 'P1', 'Duplicated hooks (3)', 'Maintenance confusion', 'Medium', 'src/hooks/ vs src/shared/hooks/', 'Incomplete migration'],
    ['ARCH-007', 'P2', 'src/integrations/ mirrors shared/', 'Dual source of truth for Supabase', 'Medium', 'src/integrations/supabase/', 'Legacy directory not cleaned up'],
]
story.append(Spacer(1, 8))
story.append(problem_table(structure_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 7/10 -- Well-organized with minor migration leftovers'))

# ============================================================
# CHAPTER 4: DOMAINS ANALYSIS
# ============================================================
story.append(PageBreak())
story.append(heading('4. Domain Architecture', sH1, 0))
story.append(body(
    'The domain layer is the strongest aspect of the VIXOR architecture. The project implements 23 domain modules '
    'following domain-driven design principles. Each domain encapsulates its business logic, types, and server '
    'functions independently. The dependency graph forms a clean directed acyclic graph (DAG) with the market '
    'domain serving as the foundational leaf node, flowing up through analysis, strategy, and trading to the '
    'copilot domain at the top. This hierarchy correctly reflects the business logic dependencies.'
))
story.append(body(
    'The independent domains (discovery, arbitrage, wallet, daily-loop, notes, signal-tracking, trades, user, '
    'watchlist, moxi, broker) have zero cross-domain dependencies, demonstrating excellent cohesion. The AI-related '
    'domains (copilot, debate, moxi) form a natural cluster with the trading domain serving as the integration point '
    'between AI intelligence and market operations. The analysis domain (22 files) is the largest and most complex, '
    'containing sub-engines for indicators, pattern detection, SMC concepts, regime detection, and risk-reward calculations.'
))

story.append(heading('Domain Dependency Graph', sH2, 1))
story.append(body(
    'The dependency graph is a clean DAG from market (leaf) through backtest, analysis, and chart-intelligence, '
    'converging at the trading domain, with copilot at the apex. No circular dependencies exist. This is a strong '
    'indicator of mature architectural decision-making and disciplined module boundaries.'
))

story.append(heading('Domain Issues', sH2, 1))
domain_problems = [
    ['ARCH-008', 'P1', 'discover/ has 2 separate domains', 'Confusion about which to use', 'Medium', 'domains/discover/ (2 dirs)', 'Scaffolding artifact, not consolidated'],
    ['ARCH-009', 'P2', 'copilot/ has 2 agent generations', 'Code bloat, unclear which is active', 'Low', 'copilot/agents/ vs copilot/ai-v4/', 'Legacy + new code coexist'],
    ['ARCH-010', 'P1', 'No domain-level tests', 'Regressions undetected', 'High', 'All domains except arbitrage', 'Tests never written'],
    ['ARCH-011', 'P2', 'experiment/ depends on LLM for mutations', 'Non-deterministic backtests', 'Medium', 'domains/experiment/', 'Architectural coupling to AI availability'],
]
story.append(problem_table(domain_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 8/10 -- Excellent DAG, minor consolidation needed'))

# ============================================================
# CHAPTER 5: COMPONENTS ANALYSIS
# ============================================================
story.append(PageBreak())
story.append(heading('5. Components Architecture', sH1, 0))
story.append(body(
    'The component layer is split into two clear categories: vixor/ (38 application-specific components) and '
    'ui/ (42 shadcn/ui primitives). The shadcn/ui components follow the standard new-york style with lucide icons, '
    'providing a consistent and accessible base layer. The application components include 5 TradingView chart '
    'variants (full, mini, technical analysis, ticker tape, and DEX-specific), which represent a significant '
    'investment in charting functionality. The MoxiAvatar, CoachOverlay, HunterScoreCard, GovernorRiskPanel, and '
    'AnalystReportPanel components implement the multi-agent AI interface.'
))
story.append(body(
    'The AgentResponseLayout component was recently introduced to deduplicate AI response rendering across agents. '
    'Storybook stories exist for 8 components (EmptyState, LiveDot, MiniSparkline, PaginationBar, ExpandableWidget, '
    'PageLayout, RouteLoading, atoms), demonstrating intent for component documentation. However, the Storybook '
    'infrastructure itself is not configured -- the .storybook/ directory is missing despite 5 Storybook packages '
    'being installed as dev dependencies. This means the 8 story files are currently dead code.'
))

comp_problems = [
    ['ARCH-012', 'P1', 'Storybook installed but not configured', '8 story files are dead code', 'Medium', '.storybook/ (missing)', 'Stories written before infra setup'],
    ['ARCH-013', 'P1', '5 TradingView chart variants', 'Maintenance burden, potential duplication', 'Medium', 'TradingView*.tsx (5 files)', 'Incremental addition without refactoring'],
    ['ARCH-014', 'P2', 'No component catalog/documentation', 'Onboarding friction for new devs', 'Low', 'All components', 'No Storybook or Docz running'],
]
story.append(problem_table(comp_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 6/10 -- Good base, chart variants need consolidation'))

# ============================================================
# CHAPTER 6: SERVICES & PROVIDERS
# ============================================================
story.append(PageBreak())
story.append(heading('6. Services, Providers, and State Management', sH1, 0))
story.append(body(
    'The application employs a pragmatic state management approach combining TanStack React Query for server state, '
    'React Context for global UI state, and local useState/useReducer for component-level state. React Query is '
    'configured with conservative defaults (staleTime: 30s, refetchOnWindowFocus: false, retry: 1) that prevent '
    'infinite re-render loops, which was a known issue (React #310) addressed by the use-render-guard hook. '
    'Zustand is installed (v5.0.14) but used in only one file (virtual-list.tsx), making it an unnecessary dependency.'
))
story.append(body(
    'Four custom React Contexts are active: QueryClientProvider (TanStack), I18nProvider (EN/AR with RTL support), '
    'WalletProvider (Web3 wallet management), and GlobalErrorBoundary (inline class component). The I18nProvider '
    'supports English and Arabic with lazy-loaded translations and localStorage persistence for language preference. '
    'The WalletProvider handles MetaMask, Phantom, WalletConnect, and Telegram wallet connections with challenge-response '
    'authentication using nonce storage in Redis. The event system (VixorEvents) provides a typed in-process event bus '
    'with 20+ event types and optional persistence to Supabase.'
))

state_problems = [
    ['ARCH-015', 'P2', 'Zustand installed but barely used', 'Unnecessary dependency (48KB)', 'Low', 'package.json, virtual-list.tsx', 'Added for one use case, not adopted broadly'],
    ['ARCH-016', 'P1', 'No global error monitoring in UI', 'Silent failures in production', 'High', 'Root layout, all pages', 'Sentry init exists but no error boundary coverage'],
    ['ARCH-017', 'P2', 'Event bus persistence is optional', 'Event data loss when disabled', 'Medium', 'shared/events/', 'Feature flag controlled, not default'],
]
story.append(problem_table(state_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 6/10 -- Pragmatic but missing monitoring and error coverage'))

# ============================================================
# CHAPTER 7: ROUTING ANALYSIS
# ============================================================
story.append(PageBreak())
story.append(heading('7. Routing Architecture', sH1, 0))
story.append(body(
    'The routing system uses TanStack Router with file-based routing (v1.170.15), providing type-safe route '
    'definitions and automatic code generation via routeTree.gen.ts. The application defines 39 authenticated routes '
    'under the _authenticated/ layout group, which is protected by a beforeLoad guard that validates the Supabase '
    'session and falls back to Telegram auto-signin. The auth route (/auth) uses SSR disabled (ssr: false) to support '
    'Telegram WebApp SDK initialization, which requires client-side-only rendering.'
))
story.append(body(
    'The route structure follows a flat pattern with pathless layout components (-component.tsx files) for complex pages '
    'like copilot, daily-loop, swap, and token detail. The root layout (__root.tsx) chains providers in the correct order: '
    'QueryClientProvider, I18nProvider, WalletProvider, GlobalErrorBoundary, AppShell, and Outlet. This provider chain '
    'ensures that all authenticated pages have access to server state, internationalization, wallet functionality, and error handling. '
    'However, 39 routes for a product still in MVP stage suggests potential over-scoping -- many of these pages (yield, curves, '
    'arbitrage, backtest, experiments, perpetuals, predictions, communities) appear to be aspirational features that may not '
    'have complete implementations behind them.'
))

route_problems = [
    ['ARCH-018', 'P1', '39 routes for MVP-stage product', 'Diluted development focus', 'High', 'src/routes/_authenticated/', 'Feature creep -- too many pages too early'],
    ['ARCH-019', 'P2', 'No route-level code splitting config', 'Large initial bundle', 'Medium', 'vite.config.ts, all routes', 'TanStack Start defaults may not be optimal'],
    ['ARCH-020', 'P2', 'No 404/redirect for invalid routes', 'Poor UX for deep links', 'Low', 'router.tsx', 'No catch-all route defined'],
]
story.append(problem_table(route_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 5/10 -- Too many routes, potential feature creep'))

# ============================================================
# CHAPTER 8: SHARED LAYER
# ============================================================
story.append(PageBreak())
story.append(heading('8. Shared Infrastructure Layer', sH1, 0))
story.append(body(
    'The shared layer (src/shared/) is the cross-cutting infrastructure backbone of the application. It contains 60+ files '
    'organized into clear modules: Supabase clients (browser + server), resilience patterns (Redis rate limiter, circuit '
    'breaker, LRU cache), LLM routing (multi-provider support for OpenAI, Anthropic, Groq, ZAI), event system, tool registry, '
    'memory store, notification channels, market data clients, i18n, hooks, utilities, and more. This layer demonstrates '
    'excellent infrastructure thinking with proper separation of concerns.'
))
story.append(body(
    'The resilience module is particularly well-designed, implementing a Redis-backed sliding window rate limiter with '
    'in-memory fallback, a circuit breaker pattern, and an LRU cache -- all critical for a production trading application '
    'that interfaces with multiple external APIs. The LLM router supports 4 providers (OpenAI, Anthropic, Groq, ZAI) with '
    'automatic provider detection and fallback. The tool registry implements a plugin architecture where tools can be '
    'registered, discovered, and executed with permission checking, enabling the AI copilot to safely interact with '
    'trading functions. The market data module provides multi-source price resolution with WebSocket clients for real-time '
    'data from Binance and DexScreener.'
))
story.append(body(
    'However, several issues exist in the shared layer. The Supabase integration is duplicated between src/shared/supabase/ '
    'and src/integrations/supabase/ (legacy directory). The credential vault and crypto utilities exist but their usage '
    'across the codebase should be audited. The notification system supports 4 channels (in-app, Telegram, email, webhook) '
    'but the email channel implementation needs verification. Three hooks are duplicated between src/hooks/ and '
    'src/shared/hooks/ (use-mobile, use-render-guard, use-stable-server-fn), indicating an incomplete migration.'
))

shared_problems = [
    ['ARCH-021', 'P1', 'Supabase integration duplicated', 'Dual source of truth', 'Medium', 'src/integrations/ vs src/shared/supabase/', 'Legacy directory not removed after migration'],
    ['ARCH-022', 'P2', '3 hooks duplicated across directories', 'Bug fixes must be applied twice', 'Medium', 'use-mobile, use-render-guard, use-stable-server-fn', 'Migration from hooks/ to shared/hooks/ incomplete'],
    ['ARCH-023', 'P1', 'No shared error handling pattern', 'Inconsistent error UX across pages', 'High', 'All routes and domains', 'Each page handles errors differently'],
]
story.append(problem_table(shared_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 7/10 -- Strong infrastructure with duplication issues'))

# ============================================================
# CHAPTER 9: BACKEND / SERVER
# ============================================================
story.append(PageBreak())
story.append(heading('9. Backend and Server Architecture', sH1, 0))
story.append(body(
    'The backend uses Nitro (v3.0.260603-beta) as the server engine, deployed on Vercel serverless functions with '
    'Node.js 22.x runtime. API endpoints are defined in server/api/ using h3 defineEventHandler with a consistent '
    'pattern: withRateLimit wrapper, handlePreflight for CORS, and either authenticateRequest (JWT) or admin key '
    'validation for authorization. The security layer (server/api/_security.ts) implements proper CORS whitelisting, '
    'JWT authentication via Supabase getUser(), and admin authentication via X-Admin-Key header.'
))
story.append(body(
    'The server exposes 15 API endpoints covering health checks, metrics, cron jobs (signal generation, alert checking, '
    'reanalysis), admin operations (migrate, validate), AI streaming (copilot-stream), public market data (discover, '
    'sol-price, market-overview), webhook receivers (Telegram, Stars), and wallet management (connect, session). '
    'Rate limiting is consistently applied with Redis-backed sliding windows and proper X-RateLimit headers. The copilot-stream '
    'endpoint implements SSE (Server-Sent Events) for real-time AI response streaming with both global (120/min) and '
    'per-user (20/min) rate limits.'
))

server_problems = [
    ['ARCH-024', 'P0', 'No CI/CD pipeline', 'Deployments rely solely on Vercel auto-deploy', 'Critical', '.github/workflows/ (missing)', 'Never set up GitHub Actions'],
    ['ARCH-025', 'P0', 'No test runner script', 'Zero tests executed in CI or locally', 'Critical', 'package.json (no test script)', 'vitest configured but not wired'],
    ['ARCH-026', 'P1', 'Nitro beta version', 'Potential instability in production', 'Medium', 'package.json (nitro 3.0.260603-beta)', 'Bleeding-edge version for features'],
    ['ARCH-027', 'P1', 'No API versioning', 'Breaking changes affect all clients', 'Medium', 'All server/api/ endpoints', 'No /v1/ prefix or versioning strategy'],
    ['ARCH-028', 'P2', 'No request validation schema', 'Malformed requests cause unhandled errors', 'Medium', 'All endpoints except wallet', 'Zod installed but not used for API validation'],
]
story.append(problem_table(server_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 5/10 -- Good security, missing CI/CD and testing'))

# ============================================================
# CHAPTER 10: SUPABASE
# ============================================================
story.append(PageBreak())
story.append(heading('10. Supabase Integration', sH1, 0))
story.append(body(
    'Supabase serves as the primary database and authentication provider. The database schema comprises 32 tables '
    'covering trading operations (analyses, trades, daily_signals, price_alerts), AI features (copilot_conversations, '
    'copilot_messages, agent_audit_log, agent_jobs), user management (profiles, user_settings, user_memories, '
    'user_strategies, user_streaks), gamification (credit_points, points_balances, points_transactions, point_packs, '
    'premium_plans, premium_subscriptions, referrals), and system tables (notifications, payments, domain_events, '
    'vixor_decisions, experiment_generations, experiments). The auto-generated TypeScript types file is 1,654 lines, '
    'providing full type safety for database operations.'
))
story.append(body(
    'The dual-client pattern is well-implemented: a browser client with lazy singleton initialization and Proxy-based '
    'graceful degradation (getSupabaseOrNull vs getSupabaseOrThrow), and a server admin client using the service role '
    'key that bypasses Row Level Security. Auth is handled through a TanStack Start middleware (attachSupabaseAuth) that '
    'automatically injects the authenticated user context into server functions. The migration system includes 23 SQL '
    'migration files and a runtime migration checker accessible via the /api/migrate endpoint.'
))

supabase_problems = [
    ['ARCH-029', 'P1', 'No RLS audit documentation', 'Security holes may exist unnoticed', 'High', 'supabase/migrations/', 'RLS policies not reviewed or documented'],
    ['ARCH-030', 'P2', 'Admin client bypasses RLS entirely', 'Server-side must be trusted completely', 'Medium', 'shared/supabase/client.server.ts', 'By design but needs strict code review'],
]
story.append(problem_table(supabase_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 7/10 -- Solid integration, needs RLS audit'))

# ============================================================
# CHAPTER 11: BUILD SYSTEM
# ============================================================
story.append(PageBreak())
story.append(heading('11. Build System and Dependencies', sH1, 0))
story.append(body(
    'The build system uses Vite (v7.3.1) with TanStack Start (v1.168.25) and Nitro (v3.0.260603-beta) as the full-stack '
    'framework. React 19.2.0 is the UI framework, TypeScript 5.8 provides type checking, and Tailwind CSS v4 handles styling '
    'with LightningCSS as the CSS transformer. The build pipeline includes a post-build script (fix-vercel-bundle.mjs) that '
    'patches the Vercel bundle for compatibility -- a sign that the framework combination has rough edges in production deployment.'
))
story.append(body(
    'The dependency footprint is large: 57 production packages and 18 dev dependencies. Several production dependencies '
    'appear to be unused or underutilized: pagedjs (PDF page layout, 0 imports found), oakscriptjs (TradingView scripting, '
    'minimal usage), sentiment (NLP analysis, not actively used in production code), and Zustand (state management, used once). '
    'The CCXT library (crypto exchange trading) is correctly externalized from the client bundle via Vite Rollup configuration. '
    'Security headers are properly configured in vite.config.ts including CSP, X-Content-Type-Options, Referrer-Policy, and '
    'Permissions-Policy, with the CSP whitelist covering all required external domains (TradingView, Telegram, Supabase, Binance, etc.).'
))

dep_problems = [
    ['ARCH-031', 'P1', 'Unused dependencies (4+)', 'Increased bundle size and attack surface', 'Medium', 'pagedjs, oakscriptjs, sentiment, zustand', 'Added for features that were not completed'],
    ['ARCH-032', 'P1', 'Post-build bundle patching', 'Fragile deployment, breaks on framework updates', 'High', 'scripts/fix-vercel-bundle.mjs', 'Workaround for TanStack Start + Vercel incompatibility'],
    ['ARCH-033', 'P2', 'No bundle size budget enforcement', 'Bundle can grow without warning', 'Medium', 'vite.config.ts', 'chunkSizeWarningLimit exists but no CI enforcement'],
]
story.append(problem_table(dep_problems))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 5/10 -- Works but fragile, dependency bloat'))

# ============================================================
# CHAPTER 12: CI/CD AND STORYBOOK
# ============================================================
story.append(PageBreak())
story.append(heading('12. CI/CD and Development Tooling', sH1, 0))
story.append(body(
    'This is the weakest area of the VIXOR architecture. There is no CI/CD pipeline whatsoever. The .github/workflows/ directory '
    'does not exist. All deployments rely entirely on Vercel auto-deploy from the main branch, meaning every push to main '
    'triggers a production deployment with zero automated quality gates. There are no automated tests, no lint checks, '
    'no type checking, no security scanning, and no performance benchmarks running on each deployment. This is a '
    'critical gap for a financial application handling real user data and trading operations.'
))
story.append(body(
    'Storybook is installed with 5 packages (@chromatic-com/storybook, @storybook/addon-docs, @storybook/react-vite, '
    'plus 2 more) but the .storybook/ configuration directory is missing. Eight story files exist in src/components/vixor/ '
    'but they are effectively dead code since Storybook cannot run without configuration. The vitest test framework is '
    'configured (vitest.config.ts) with Node environment, fork pool, and path aliases, but there is no test script in '
    'package.json, meaning tests cannot be run with a simple npm command. Only 3 test files exist in the entire codebase: '
    'runner.test.ts (safe-exec), and 2 test files in the arbitrage domain.'
))

story.append(heading('Immediate Refactor Tasks', sH2, 1))
immediate_tasks = [
    ['ARCH-034', 'P0', 'Create GitHub Actions CI pipeline', 'Unblocks all quality gates', 'Critical', '.github/workflows/', 'No CI was ever created'],
    ['ARCH-035', 'P0', 'Add test script to package.json', 'Unblocks test execution', 'Critical', 'package.json', 'vitest configured but not wired'],
    ['ARCH-036', 'P0', 'Configure Storybook', 'Unlocks 8 existing stories', 'High', '.storybook/', 'Stories written before config'],
    ['ARCH-037', 'P1', 'Update components.json utils path', 'Fixes shadcn/ui integration', 'Medium', 'components.json', 'lib/ deleted in Phase 1'],
    ['ARCH-038', 'P1', 'Remove unused dependencies', 'Reduces bundle and attack surface', 'Medium', 'package.json', 'pagedjs, oakscriptjs, sentiment, zustand'],
]
story.append(problem_table(immediate_tasks))
story.append(Spacer(1, 6))
story.append(muted('Section Score: 2/10 -- Critical infrastructure gap'))

# ============================================================
# CHAPTER 13: DEPENDENCY GRAPH
# ============================================================
story.append(PageBreak())
story.append(heading('13. Dependency Graph Analysis', sH1, 0))
story.append(body(
    'The inter-module dependency graph was analyzed across all 23 domains and the shared layer. The graph is a clean '
    'directed acyclic graph (DAG) with no circular dependencies. The market domain is the most depended-upon module, '
    'serving as the foundation for analysis, backtest, chart-intelligence, and chart-truth. The trading domain sits at '
    'the convergence point, depending on market, analysis, and strategy. The copilot domain is at the apex, depending '
    'on trading, user, and watchlist. This hierarchy correctly mirrors the business logic flow: raw market data flows '
    'up through analysis and strategy, into trading operations, and finally into AI-assisted decision making.'
))
story.append(body(
    'The independent domains (12 of 23) demonstrate excellent separation of concerns. These domains have zero cross-domain '
    'dependencies and can be developed, tested, and deployed independently. The AI cluster (copilot, debate, moxi) forms '
    'a natural grouping around the AI intelligence layer. One area of concern is the experiment domain depending on LLM '
    'for strategy mutations -- this creates a non-deterministic dependency that could affect backtest reliability. The discover '
    'domain exists in two separate directories (domains/discover/ with 16 files and domains/discover/ simpler with 3 files), '
    'which is a consolidation opportunity.'
))
story.append(muted('Section Score: 8/10 -- Clean DAG, excellent modularity'))

# ============================================================
# CHAPTER 14: FINAL ASSESSMENT
# ============================================================
story.append(PageBreak())
story.append(heading('14. Final Assessment', sH1, 0))
story.append(heading('Architecture Score Breakdown', sH2, 1))
final_scores = [
    ['Project Root', '4.0', 'Functional but cluttered with artifacts'],
    ['Source Structure', '7.0', 'Well-organized, minor migration gaps'],
    ['Domain Architecture', '8.0', 'Excellent DAG, no circular deps'],
    ['Components', '6.0', 'Good base, chart variants need work'],
    ['Services/State', '6.0', 'Pragmatic, missing monitoring'],
    ['Routing', '5.0', 'Too many routes for MVP stage'],
    ['Shared Layer', '7.0', 'Strong infra, duplication issues'],
    ['Backend/Server', '5.0', 'Good security, no CI/CD'],
    ['Supabase', '7.0', 'Solid integration, needs RLS audit'],
    ['Build System', '5.0', 'Works but fragile, dep bloat'],
    ['CI/CD Tooling', '2.0', 'Critical gap -- nothing automated'],
    ['Dependency Graph', '8.0', 'Clean DAG, excellent modularity'],
]
fs_header = [
    Paragraph('Area', sTableHeader),
    Paragraph('Score', sTableHeader),
    Paragraph('Notes', sTableHeader),
]
fs_rows = [fs_header]
for area, score, notes in final_scores:
    val = float(score)
    clr = SEM_SUCCESS if val >= 7 else (SEM_WARNING if val >= 5 else SEM_ERROR)
    fs_rows.append([
        Paragraph(f'<b>{area}</b>', sTableCell),
        Paragraph(f'<b>{score}/10</b>', ParagraphStyle('fs', fontName='FreeSerif-Bold',
                    fontSize=9, leading=12, textColor=clr, alignment=TA_CENTER)),
        Paragraph(notes, sTableCell),
    ])
fs_table = Table(fs_rows, colWidths=[100, 60, 310])
fs_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, TABLE_STRIPE]),
    ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(fs_table)
story.append(Spacer(1, 16))

story.append(heading('Overall Architecture Score', sH2, 1))
story.append(Paragraph('<b>5.8 / 10</b>', ParagraphStyle('overall', fontName='FreeSerif-Bold',
    fontSize=36, leading=44, textColor=ACCENT, alignment=TA_CENTER, spaceAfter=12)))
story.append(body(
    'VIXOR demonstrates strong domain architecture with excellent module boundaries and a clean dependency graph. '
    'The shared infrastructure layer is well-designed with proper resilience patterns (rate limiting, circuit breaking, caching). '
    'However, the architecture is significantly undermined by the complete absence of CI/CD pipelines, test infrastructure, '
    'and development tooling (Storybook). The build system relies on a fragile post-build patching step, and the dependency '
    'footprint includes several unused packages. For a financial application handling real user data, these infrastructure '
    'gaps represent serious risks that should be addressed before scaling the user base.'
))

story.append(heading('Top Strengths', sH2, 1))
story.append(bullet('Clean domain-driven architecture with 23 well-separated modules'))
story.append(bullet('Zero circular dependencies in the domain graph'))
story.append(bullet('Comprehensive security layer (JWT auth, rate limiting, CORS, CSP headers)'))
story.append(bullet('Multi-provider LLM routing with fallback support'))
story.append(bullet('Resilient shared infrastructure (Redis rate limiter, circuit breaker, LRU cache)'))
story.append(bullet('Proper Supabase dual-client pattern (browser + admin)'))

story.append(heading('Top Weaknesses', sH2, 1))
story.append(bullet('Zero CI/CD pipeline -- no automated quality gates on deployment'))
story.append(bullet('Zero test coverage -- vitest configured but not executable'))
story.append(bullet('Storybook installed (5 packages) but never configured'))
story.append(bullet('39 routes for an MVP-stage product -- potential feature creep'))
story.append(bullet('Post-build bundle patching for Vercel compatibility -- fragile'))
story.append(bullet('Several unused production dependencies increasing bundle size'))

# ============================================================
# BUILD PDF
# ============================================================
output_path = '/home/z/my-project/download/VIXOR_Architecture_Audit.pdf'

from reportlab.platypus import PageTemplate, Frame

content_w = A4[0] - 55*mm - 20*mm
frame_body = Frame(55*mm, 25*mm, content_w, A4[1] - 55*mm, id='body_frame')

doc = TocDocTemplate(
    output_path,
    pagesize=A4,
    leftMargin=55*mm, rightMargin=20*mm,
    topMargin=30*mm, bottomMargin=25*mm,
    title='VIXOR Architecture Audit',
    author='Z.ai',
    subject='Comprehensive Architecture Review of VIXOR Trading Terminal',
)

tpl = PageTemplate(id='body', frames=[frame_body], onPage=page_footer)
doc.addPageTemplates([tpl])

try:
    doc.multiBuild(story)
    print(f'PDF generated: {output_path}')
    size = os.path.getsize(output_path)
    print(f'File size: {size:,} bytes ({size/1024:.1f} KB)')
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
