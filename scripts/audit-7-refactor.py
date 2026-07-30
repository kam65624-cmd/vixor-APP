#!/usr/bin/env python3
"""VIXOR Refactor Plan PDF Generator - audit-7-refactor.py"""
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

# --- Helpers ---
def _make_heading(text, style, level):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text.replace('<b>', '').replace('</b>', '')
    p.bookmark_key = key
    return p

def H1(text, key=None):
    return _make_heading(text, sH1, 0)

def H2(text, key=None):
    return _make_heading(text, sH2, 1)

def H3(text, key=None):
    return _make_heading(text, sH3, 2)

def B(text):
    return Paragraph(text, sBody)

def BS(text):
    return Paragraph(text, sBodySm)

def bul(text):
    return Paragraph(f'<bullet>&bull;</bullet> {text}', sBullet)

def C(text, style=sCell):
    return Paragraph(text, style)

def CB(text):
    return Paragraph(text, sCellB)

def CW(text):
    return Paragraph(text, sCellW)

def CE(text):
    return Paragraph(text, sCellE)

def CS(text):
    return Paragraph(text, sCellS)

def CI(text):
    return Paragraph(text, sCellI)

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

def hr_line():
    t = Table([['']], colWidths=[W - 50*mm])
    t.setStyle(TableStyle([
        ('LINEBELOW', (0, 0), (-1, 0), 1, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
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
    canvas.drawString(30*mm, H - 10*mm, 'VIXOR Refactor Plan')
    canvas.drawRightString(W - 20*mm, H - 10*mm, 'Confidential')
    canvas.setFillColor(TEXT_MUTED)
    canvas.setFont('FreeSerif', 7)
    canvas.drawCentredString(W / 2, 10*mm, f'Page {doc.page}')
    canvas.restoreState()

def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAGE_BG)
    canvas.rect(0, 0, W, H, fill=True, stroke=False)
    canvas.setFillColor(HEADER_FILL)
    canvas.rect(0, H * 0.30, W, H * 0.45, fill=True, stroke=False)
    canvas.setFillColor(colors.white)
    canvas.setFont('FreeSerif-Bold', 42)
    canvas.drawCentredString(W / 2, H * 0.55, 'VIXOR')
    canvas.setFont('FreeSerif', 24)
    canvas.drawCentredString(W / 2, H * 0.49, 'Refactor Plan')
    canvas.setFont('FreeSerif-Italic', 12)
    canvas.drawCentredString(W / 2, H * 0.44, 'Comprehensive Sprint-by-Sprint Execution Guide')
    canvas.restoreState()

# =============================================================
# BUILD STORY
# =============================================================
story = []

# --- COVER ---
story.append(Spacer(1, H * 0.75))
cover_info = ParagraphStyle('ci', parent=ss['Normal'], fontName='FreeSerif', fontSize=11, leading=16, textColor=TEXT_PRIMARY, alignment=TA_CENTER)
story.append(Paragraph('Based on Six Comprehensive Audits', cover_info))
story.append(Spacer(1, 4*mm))
story.append(Paragraph('Architecture | Product | Domain | Component | UI/UX | Technical', cover_info))
story.append(Spacer(1, 8*mm))
cover_sm = ParagraphStyle('csm', parent=ss['Normal'], fontName='FreeSerif-Italic', fontSize=9, leading=13, textColor=TEXT_MUTED, alignment=TA_CENTER)
story.append(Paragraph('221 Total Problems Identified  |  6 Sprints  |  14 Weeks  |  42 Core Tasks', cover_sm))
story.append(Spacer(1, 3*mm))
story.append(Paragraph('Generated: July 2025', cover_sm))
story.append(PageBreak())

# --- TOC ---
toc = TableOfContents()
toc.levelStyles = [sTocH1, sTocH2, sTocH3]
toc_title = ParagraphStyle('TocTitle', parent=ss['Normal'], fontName='FreeSerif-Bold', fontSize=22, leading=28, textColor=TEXT_PRIMARY, spaceAfter=10*mm, spaceBefore=4*mm)
story.append(Paragraph('<b>Table of Contents</b>', toc_title))
story.append(Spacer(1, 4*mm))
story.append(toc)
story.append(PageBreak())

# ===================== SECTION 1: EXECUTIVE SUMMARY =====================
story.append(H1('<b>1. Executive Summary</b>'))
story.append(B(
    'This Refactor Plan consolidates findings from six independent audits conducted across the VIXOR codebase, covering Architecture, Product scope, Domain model, Component design, UI/UX patterns, and Technical infrastructure. '
    'Together these audits identified 221 distinct problems ranging from critical blockers that prevent production deployment to low-priority polish items. '
    'The audit team classified each problem by severity: P0 indicates an immediate blocker that must be resolved before any further development, P1 represents significant issues that degrade developer experience or user trust, and P2 covers improvements that enhance maintainability or user satisfaction. '
    'The plan addresses every finding through 42 core tasks organized into six time-boxed sprints spanning 14 weeks, ensuring a methodical and risk-managed approach to resolving technical debt while preserving business continuity.'
))
story.append(B(
    'The most urgent findings are architectural in nature. The project currently lacks any continuous integration or deployment pipeline, meaning every merge to the main branch is deployed manually without automated testing, linting, or quality gates. '
    'Furthermore, the test suite is entirely absent, with zero unit tests, integration tests, or end-to-end tests, leaving every code change unverified against regressions. '
    'On the product side, the application exposes 39 distinct routes for what should be an MVP product, indicating severe feature creep that dilutes engineering focus and overwhelms new users. '
    'The domain layer, while cleanly structured as a directed acyclic graph, contains 23 distinct domain modules with 43 identified problems, including three P0 issues that affect data integrity. '
    'Component-level audits revealed that the AppShell component alone spans 1,688 lines of code, and seven chart variants exist without a unified abstraction, creating maintenance nightmares and inconsistent user experiences.'
))
story.append(B(
    'UI/UX audits uncovered 47 problems, including two critical accessibility violations that could expose the project to legal compliance risk under WCAG 2.1 AA guidelines. '
    'Mobile responsiveness gaps exist across multiple pages, and weak empty states leave users confused when no data is available. '
    'Technical infrastructure audits confirmed the absence of monitoring, observability, API versioning, and a fragile build configuration that breaks under minor dependency changes. '
    'This plan prioritizes developer productivity infrastructure first, then moves to component consolidation, domain cleanup, UX improvements, and finally feature rationalization, ensuring each sprint builds upon the foundations laid by its predecessors.'
))

# --- Summary Stats Table ---
story.append(Spacer(1, 3*mm))
stats_headers = ['Audit Area', 'Total Problems', 'P0', 'P1', 'P2', 'Primary Risk']
stats_rows = [
    [C('Architecture'), C('38'), CE('2'), CW('8'), C('28'), C('No CI/CD, no tests')],
    [C('Product'), C('47'), CW('3'), C('18'), C('26'), C('39 routes for MVP')],
    [C('Domain'), C('43'), CE('3'), CW('22'), C('18'), C('3 P0 data integrity issues')],
    [C('Component'), C('18'), C('0'), CW('10'), C('8'), C('AppShell 1,688 LOC')],
    [C('UI/UX'), C('47'), CE('2'), C('15'), C('30'), C('Critical a11y violations')],
    [C('Technical'), C('28'), CE('2'), CW('12'), C('14'), C('No monitoring, no API versioning')],
    [CB('TOTAL'), CB('221'), CE('12'), CW('85'), C('124'), CB('')],
]
cw = [32*mm, 24*mm, 14*mm, 14*mm, 14*mm, 46*mm]
story.append(make_table(stats_headers, stats_rows, cw))
story.append(Paragraph('Table 1: Audit Findings Summary by Area and Severity', sCaption))

# ===================== SECTION 2: SPRINT OVERVIEW =====================
story.append(H1('<b>2. Sprint Overview</b>'))
story.append(B(
    'The refactor is organized into six sequential sprints, each with clear entry criteria, deliverables, and exit criteria. '
    'This phased approach minimizes risk by ensuring foundational infrastructure is in place before higher-level refactoring begins. '
    'Each sprint is designed to be independently valuable, meaning that even if the plan is paused after any sprint, the codebase is left in a better state than before. '
    'Sprint durations range from one week for the critical infrastructure sprint to four weeks for the feature rationalization sprint, reflecting the relative complexity and risk of each phase. '
    'Total estimated effort across all sprints is approximately 520 person-hours, which can be distributed across one to three engineers depending on team size and parallelization opportunities.'
))

sprint_headers = ['Sprint', 'Weeks', 'Focus Area', 'Tasks', 'Est. Hours', 'Key Deliverable']
sprint_rows = [
    [CB('Sprint 0'), C('1'), C('Critical Fixes'), C('8'), CB('60'), C('CI/CD pipeline, test runner, shadcn fix')],
    [CB('Sprint 1'), C('2\u20133'), C('Infrastructure'), C('7'), CB('90'), C('Monitoring, error boundaries, API versioning')],
    [CB('Sprint 2'), C('4\u20135'), C('Component Refactor'), C('8'), CB('95'), C('Chart consolidation, AppShell split')],
    [CB('Sprint 3'), C('6\u20137'), C('Domain Cleanup'), C('7'), CB('80'), C('Domain consolidation, dead code removal')],
    [CB('Sprint 4'), C('8\u201310'), C('UX Improvements'), C('6'), CB('85'), C('Accessibility, mobile, empty states')],
    [CB('Sprint 5'), C('11\u201314'), C('Feature Rationalization'), C('6'), CB('110'), C('39 routes reduced to 12 core routes')],
]
cw2 = [22*mm, 16*mm, 32*mm, 14*mm, 20*mm, 56*mm]
story.append(make_table(sprint_headers, sprint_rows, cw2))
story.append(Paragraph('Table 2: Sprint Timeline and Resource Allocation', sCaption))
story.append(B(
    'Sprint dependencies form a strict linear chain: Sprint 0 establishes the safety net of automated testing and CI/CD that all subsequent sprints rely on for verification. '
    'Sprint 1 builds observability infrastructure that enables data-driven decisions in later sprints. Sprint 2 consolidates components so that Sprint 3 domain cleanup operates against a stable UI layer. '
    'Sprint 4 UX improvements require the consolidated component layer from Sprint 2, and Sprint 5 feature reduction depends on knowing which domains are clean from Sprint 3. '
    'This dependency chain means parallelization between sprints is not recommended, though tasks within a sprint can often be parallelized across multiple engineers.'
))

# ===================== SECTION 3: SPRINT 0 =====================
story.append(H1('<b>3. Sprint 0: Critical Fixes (Week 1)</b>'))
story.append(B(
    'Sprint 0 addresses the two most critical architectural deficiencies that render all other work high-risk: the absence of a CI/CD pipeline and the complete lack of automated tests. '
    'Without these two foundations in place, every subsequent refactoring step carries the risk of introducing silent regressions that go undetected until production. '
    'This sprint also resolves the broken shadcn/ui path alias, which causes import errors and prevents proper component resolution, and removes unused dependencies that inflate bundle size and create confusion about the actual technology stack. '
    'The sprint is designed to be completed in a single week by a single senior engineer, though two engineers working in parallel on CI/CD and testing respectively could reduce this to four days.'
))
story.append(B(
    'The exit criteria for Sprint 0 are unambiguous and verifiable: every push to the main branch must trigger an automated pipeline that runs linting, type-checking, unit tests, and a build verification. '
    'The test runner must be operational with at least 10 smoke tests covering the most critical user flows. '
    'The shadcn/ui path alias must resolve correctly, and the dependency tree must contain zero unused packages. '
    'These criteria represent the minimum viable safety net that makes all subsequent sprints safe to execute.'
))

story.append(H2('<b>3.1 Sprint 0 Task Breakdown</b>'))
s0_headers = ['ID', 'Task', 'Priority', 'Deps', 'Hours', 'Difficulty', 'Affected Files', 'Expected Impact', 'Risk']
s0_rows = [
    [
        CB('S0-01'), C('Set up GitHub Actions CI pipeline with lint, type-check, build, and test stages'),
        CE('P0'), C('None'), C('12'), C('Medium'),
        C('.github/workflows/ci.yml, package.json'),
        C('Every PR validated automatically; broken builds caught before merge'),
        CW('Medium: Pipeline config may need iteration for monorepo support')
    ],
    [
        CB('S0-02'), C('Configure Vitest test runner with React Testing Library and path alias support'),
        CE('P0'), C('None'), C('8'), C('Medium'),
        C('vitest.config.ts, tsconfig.json, src/test-setup.ts'),
        C('Test infrastructure operational; developers can write and run tests locally'),
        CW('Medium: Path alias resolution in tests may require custom Vitest config')
    ],
    [
        CB('S0-03'), C('Write 10 critical smoke tests covering auth flow, dashboard load, and API connectivity'),
        CE('P0'), C('S0-02'), C('10'), C('Medium'),
        C('src/__tests__/auth.test.tsx, src/__tests__/dashboard.test.tsx'),
        C('Core user flows verified automatically; regression protection for critical paths'),
        CS('Low: Smoke tests are isolated and do not modify existing code')
    ],
    [
        CB('S0-04'), C('Fix broken shadcn/ui path alias in tsconfig and component imports'),
        CW('P1'), C('None'), C('6'), C('Easy'),
        C('tsconfig.json, components.json, src/components/ui/*.tsx'),
        C('All shadcn components resolve correctly; IDE autocompletion restored'),
        CS('Low: Straightforward path mapping fix with immediate verification')
    ],
    [
        CB('S0-05'), C('Audit and remove unused npm dependencies from package.json'),
        CW('P1'), C('None'), C('4'), C('Easy'),
        C('package.json, package-lock.json'),
        C('Reduced install time, smaller node_modules, clearer dependency graph'),
        CW('Medium: Some deps may be dynamically imported; removal needs grep verification')
    ],
    [
        CB('S0-06'), C('Set up Vercel deployment preview on every PR with automatic environment variables'),
        CW('P1'), C('S0-01'), C('6'), C('Easy'),
        C('vercel.json, .env.example, .github/workflows/ci.yml'),
        C('Stakeholders can review visual changes per PR; no more manual deploys'),
        CS('Low: Vercel integration is well-documented and mostly configuration')
    ],
    [
        CB('S0-07'), C('Add ESLint strict mode and enforce no-unused-vars, no-explicit-any rules'),
        CW('P1'), C('S0-01'), C('8'), C('Medium'),
        C('.eslintrc.js, src/**/*.ts, src/**/*.tsx'),
        C('Code quality enforced automatically; type safety improved across codebase'),
        CW('Medium: May surface many existing violations requiring批量 fixes')
    ],
    [
        CB('S0-08'), C('Configure Husky pre-commit hooks with lint-staged for format-on-commit'),
        C('P2'), C('S0-07'), C('6'), C('Easy'),
        C('.husky/pre-commit, .lintstagedrc.json, package.json'),
        C('Consistent code formatting enforced; no more style debates in code review'),
        CS('Low: Pure tooling addition with no impact on existing code behavior')
    ],
]
cw3 = [14*mm, 36*mm, 12*mm, 12*mm, 10*mm, 14*mm, 32*mm, 32*mm, 28*mm]
story.append(make_table(s0_headers, s0_rows, cw3))
story.append(Paragraph('Table 3: Sprint 0 Task Details (8 tasks, 60 hours estimated)', sCaption))

# ===================== SECTION 4: SPRINT 1 =====================
story.append(H1('<b>4. Sprint 1: Infrastructure (Weeks 2\u20133)</b>'))
story.append(B(
    'Sprint 1 builds the observability and reliability infrastructure that transforms VIXOR from a prototype into a production-ready application. '
    'The sprint introduces application monitoring through a structured logging framework, error boundary components that prevent cascading UI failures, and a comprehensive error tracking integration. '
    'API versioning is established to enable backward-compatible evolution of the backend interface, and rate limiting is tuned to protect against abuse while supporting legitimate usage patterns. '
    'This sprint also addresses the fragile build configuration by pinning dependency versions and adding build caching, reducing the frequency of broken builds caused by upstream changes.'
))
story.append(B(
    'The monitoring infrastructure introduced in this sprint serves a dual purpose: it provides immediate value by alerting the team to production errors in real time, and it creates the data foundation that informs prioritization decisions in later sprints. '
    'For example, error tracking data will reveal which components fail most frequently, guiding the component consolidation work in Sprint 2. '
    'Similarly, API usage patterns observed through monitoring will inform the route reduction decisions in Sprint 5. '
    'The sprint deliverables include a Grafana dashboard (or equivalent) showing key health metrics, error boundaries wrapping every major page, and a versioned API endpoint that existing clients can continue using without modification.'
))

story.append(H2('<b>4.1 Sprint 1 Task Breakdown</b>'))
s1_headers = s0_headers
s1_rows = [
    [
        CB('S1-01'), C('Integrate Sentry error tracking with source map upload and release tracking'),
        CE('P0'), C('S0-01'), C('12'), C('Medium'),
        C('next.config.mjs, src/lib/sentry.ts, src/app/layout.tsx'),
        C('All runtime errors captured with full stack traces and user context'),
        CW('Medium: Source map upload requires build pipeline coordination')
    ],
    [
        CB('S1-02'), C('Implement React error boundary components for page-level and widget-level fallbacks'),
        CW('P1'), C('None'), C('10'), C('Medium'),
        C('src/components/ErrorBoundary.tsx, src/app/**/page.tsx'),
        C('Cascading UI failures prevented; users see graceful fallback instead of blank pages'),
        CS('Low: Error boundaries are additive and do not modify existing component logic')
    ],
    [
        CB('S1-03'), C('Set up structured logging with pino or winston and log level configuration'),
        CW('P1'), C('None'), C('10'), C('Easy'),
        C('src/lib/logger.ts, src/middleware.ts, next.config.mjs'),
        C('All application events logged consistently; debugging time reduced significantly'),
        CS('Low: Logging is a cross-cutting concern with minimal integration risk')
    ],
    [
        CB('S1-04'), C('Implement API versioning with /api/v1/ prefix and deprecation headers'),
        CW('P1'), C('None'), C('12'), C('Hard'),
        C('src/app/api/v1/**/*.ts, src/lib/api-version.ts, src/middleware.ts'),
        C('API evolution enabled without breaking existing clients; clear migration path'),
        CW('Medium: All API routes must be migrated; requires careful routing configuration')
    ],
    [
        CB('S1-05'), C('Configure rate limiting middleware with per-user and per-IP tiers'),
        CW('P1'), C('None'), C('10'), C('Medium'),
        C('src/middleware.ts, src/lib/rate-limit.ts, src/app/api/**/*.ts'),
        C('API abuse prevented; fair usage enforced; backend stability improved'),
        CW('Medium: Rate limits must be calibrated to avoid blocking legitimate high-frequency users')
    ],
    [
        CB('S1-06'), C('Pin dependency versions and add lockfile verification to CI pipeline'),
        CW('P1'), C('S0-01'), C('8'), C('Easy'),
        C('package.json, package-lock.json, .github/workflows/ci.yml'),
        C('Build reproducibility guaranteed; no more surprise breakages from upstream updates'),
        CS('Low: Version pinning is a standard practice with well-understood tooling')
    ],
    [
        CB('S1-07'), C('Create health check endpoint (/api/health) with database and external service status'),
        C('P2'), C('S1-03'), C('8'), C('Easy'),
        C('src/app/api/health/route.ts, src/lib/health.ts'),
        C('Infrastructure monitoring enabled; automated alerting on service degradation'),
        CS('Low: Self-contained endpoint with minimal dependencies on existing code')
    ],
    [
        CB('S1-08'), C('Add performance monitoring with Web Vitals tracking and Core Web Vitals LCP/FID/CLS'),
        C('P2'), C('S1-01'), C('10'), C('Medium'),
        C('src/lib/web-vitals.ts, src/app/layout.tsx, src/components/ReportWebVitals.tsx'),
        C('Performance regressions detected automatically; UX degradation quantified'),
        CW('Medium: Web Vitals reporting requires careful threshold calibration')
    ],
]
story.append(make_table(s1_headers, s1_rows, cw3))
story.append(Paragraph('Table 4: Sprint 1 Task Details (8 tasks, 80 hours estimated)', sCaption))

# ===================== SECTION 5: SPRINT 2 =====================
story.append(H1('<b>5. Sprint 2: Component Refactoring (Weeks 4\u20135)</b>'))
story.append(B(
    'Sprint 2 tackles the most significant maintainability issues in the component layer. The AppShell component, at 1,688 lines of code, is a monolithic structure that handles navigation, sidebar state, theme switching, notification display, and responsive layout all within a single file. '
    'This component must be decomposed into focused sub-components with clear responsibilities, each independently testable and reusable. '
    'Simultaneously, seven chart variants scattered across the codebase must be consolidated into a unified ChartCard component that accepts a configuration prop to determine the visualization type. '
    'This consolidation eliminates hundreds of lines of duplicated rendering logic and ensures visual consistency across all data displays.'
))
story.append(B(
    'The sprint also introduces shared error and loading state components that replace the ad-hoc implementations currently scattered throughout the application. '
    'Currently, each page implements its own loading spinner and error message, leading to visual inconsistency and duplicated effort. '
    'By extracting these into shared components with standardized APIs, the team ensures that every page presents a cohesive experience during data fetching states. '
    'The component audit identified 18 problems, 10 of which are P1, meaning this sprint addresses the majority of component-level technical debt in a single focused effort. '
    'The risk in this sprint is primarily around regression: splitting the AppShell requires careful testing to ensure no navigation state is lost during the decomposition.'
))

story.append(H2('<b>5.1 Sprint 2 Task Breakdown</b>'))
s2_rows = [
    [
        CB('S2-01'), C('Decompose AppShell into Sidebar, TopBar, ThemeToggle, NotificationPanel sub-components'),
        CW('P1'), C('S0-03'), C('16'), C('Hard'),
        C('src/components/layout/AppShell.tsx, src/components/layout/Sidebar.tsx, src/components/layout/TopBar.tsx'),
        C('AppShell reduced from 1,688 to under 200 LOC; each sub-component independently testable'),
        CW('High: Navigation state management must be preserved; extensive manual QA required')
    ],
    [
        CB('S2-02'), C('Create unified ChartCard component with configurable chart type prop (line, bar, area, pie, scatter, candlestick, heatmap)'),
        CW('P1'), C('None'), C('16'), C('Hard'),
        C('src/components/charts/ChartCard.tsx, src/components/charts/configs/*.ts'),
        C('Seven chart variants replaced by one component; visual consistency guaranteed'),
        CW('High: Each chart type has unique data transform needs; thorough visual QA per type')
    ],
    [
        CB('S2-03'), C('Build shared LoadingState component with skeleton, spinner, and progress variants'),
        CW('P1'), C('None'), C('8'), C('Easy'),
        C('src/components/shared/LoadingState.tsx, src/components/shared/Skeleton.tsx'),
        C('Consistent loading UX across all pages; reduced per-page implementation effort'),
        CS('Low: New component with no impact on existing page logic until adopted')
    ],
    [
        CB('S2-04'), C('Build shared ErrorState component with retry action and error detail expansion'),
        CW('P1'), C('None'), C('8'), C('Easy'),
        C('src/components/shared/ErrorState.tsx, src/components/shared/RetryButton.tsx'),
        C('Consistent error UX; users always have a clear path to recovery'),
        CS('Low: Additive component that pages opt into during their own refactoring')
    ],
    [
        CB('S2-05'), C('Build shared EmptyState component with illustration, message, and CTA slot'),
        CW('P1'), C('None'), C('6'), C('Easy'),
        C('src/components/shared/EmptyState.tsx'),
        C('Empty data scenarios handled gracefully; users guided to next action'),
        CS('Low: Pure presentational component with no side effects')
    ],
    [
        CB('S2-06'), C('Migrate all pages to use shared LoadingState, ErrorState, and EmptyState'),
        C('P2'), C('S2-03, S2-04, S2-05'), C('12'), C('Medium'),
        C('src/app/**/page.tsx (all route pages)'),
        C('Visual consistency across entire application; reduced code duplication'),
        CW('Medium: Each page may have unique edge cases requiring custom handling')
    ],
    [
        CB('S2-07'), C('Extract duplicated hooks (useLocalStorage, useDebounce, useMediaQuery) into shared hooks directory'),
        CW('P1'), C('None'), C('8'), C('Easy'),
        C('src/hooks/useLocalStorage.ts, src/hooks/useDebounce.ts, src/hooks/useMediaQuery.ts'),
        C('Duplicated hook logic eliminated; single source of truth for each utility'),
        CS('Low: Hooks can be migrated incrementally one consumer at a time')
    ],
    [
        CB('S2-08'), C('Add component-level tests for AppShell sub-components and ChartCard with all variants'),
        C('P2'), C('S2-01, S2-02'), C('14'), C('Medium'),
        C('src/__tests__/layout/*.test.tsx, src/__tests__/charts/*.test.tsx'),
        C('Component regression protection; confidence in refactoring correctness'),
        CS('Low: Tests are isolated and serve as documentation for component behavior')
    ],
]
story.append(make_table(s0_headers, s2_rows, cw3))
story.append(Paragraph('Table 5: Sprint 2 Task Details (8 tasks, 88 hours estimated)', sCaption))

# ===================== SECTION 6: SPRINT 3 =====================
story.append(H1('<b>6. Sprint 3: Domain Cleanup (Weeks 6\u20137)</b>'))
story.append(B(
    'Sprint 3 addresses the domain model, which the domain audit identified as containing 43 problems across 23 domain modules. '
    'The most critical finding is three P0 issues that affect data integrity, including missing unique constraints on user-facing identifiers, inconsistent timestamp handling between client and server, and a race condition in the portfolio aggregation logic that can produce incorrect balance calculations. '
    'These P0 issues must be resolved before any domain consolidation work begins, as they represent correctness bugs that could lead to financial miscalculations in a trading application. '
    'The sprint also addresses the 22 P1 problems, which primarily involve inconsistent naming conventions across domains, missing input validation on domain operations, and redundant data transformations that should be pushed to the repository layer.'
))
story.append(B(
    'A significant portion of this sprint is dedicated to consolidating the discover domain, which the audit found to be fragmented across five separate modules that perform overlapping discovery and search operations. '
    'These modules will be merged into a single unified discovery domain with clear boundaries between search, filter, and recommendation responsibilities. '
    'Additionally, the dead copilot v1 code, which was superseded by copilot v2 but never removed, will be fully excised from the codebase. '
    'This dead code represents approximately 1,200 lines across 15 files and creates confusion for new developers who encounter references to the old copilot architecture. '
    'Domain-level tests will be introduced to verify the correctness of the consolidated domain logic and prevent regressions.'
))

story.append(H2('<b>6.1 Sprint 3 Task Breakdown</b>'))
s3_rows = [
    [
        CB('S3-01'), C('Fix P0 data integrity: add unique constraints on user identifiers and portfolio names'),
        CE('P0'), C('None'), C('8'), C('Medium'),
        C('prisma/schema.prisma, src/lib/db/migrations/*.sql'),
        C('Data integrity guaranteed; duplicate user/portfolio creation prevented at database level'),
        CW('Medium: Migration must handle existing duplicate data before constraint can be applied')
    ],
    [
        CB('S3-02'), C('Fix P0 timestamp consistency: unify client and server time handling to UTC with ISO 8601'),
        CE('P0'), C('None'), C('10'), C('Medium'),
        C('src/lib/datetime.ts, src/domains/**/*.ts, src/app/api/**/*.ts'),
        C('Timezone bugs eliminated; all timestamps display consistently regardless of user location'),
        CW('Medium: All date comparisons and display logic must be audited for timezone assumptions')
    ],
    [
        CB('S3-03'), C('Fix P0 race condition in portfolio aggregation with optimistic locking or serializable transactions'),
        CE('P0'), C('S3-01'), C('14'), C('Expert'),
        C('src/domains/portfolio/aggregation.ts, src/lib/db/transactions.ts'),
        C('Correct balance calculations guaranteed even under concurrent updates'),
        CE('High: Financial correctness is critical; requires extensive load testing')
    ],
    [
        CB('S3-04'), C('Consolidate 5 fragmented discover modules into a unified discovery domain'),
        CW('P1'), C('S3-01'), C('16'), C('Hard'),
        C('src/domains/discovery/**/*.ts, src/domains/discover-*.ts (remove)'),
        C('Domain boundaries clarified; 5 modules become 1 with clear responsibilities'),
        CW('High: Import paths change across codebase; requires full regression testing')
    ],
    [
        CB('S3-05'), C('Remove dead copilot v1 code (15 files, ~1,200 lines) and update all references to v2'),
        CW('P1'), C('None'), C('8'), C('Easy'),
        C('src/domains/copilot-v1/** (delete), src/domains/copilot/**/*.ts'),
        C('Dead code eliminated; no confusion between copilot versions for developers'),
        CS('Low: Dead code by definition has no runtime callers; removal is safe')
    ],
    [
        CB('S3-06'), C('Standardize domain naming conventions and add input validation to all domain operations'),
        CW('P1'), C('S3-04'), C('12'), C('Medium'),
        C('src/domains/**/*.ts, src/lib/validation/schemas.ts'),
        C('Consistent domain API; invalid inputs rejected early with clear error messages'),
        CW('Medium: Validation rules must be agreed upon with product team')
    ],
    [
        CB('S3-07'), C('Write domain-level unit tests for all 23 domain modules with minimum 80% branch coverage'),
        C('P2'), C('S3-04, S3-06'), C('16'), C('Medium'),
        C('src/__tests__/domains/**/*.test.ts'),
        C('Domain logic regression protection; confidence in business rule correctness'),
        CS('Low: Tests exercise existing behavior; no modifications to domain logic required')
    ],
]
story.append(make_table(s0_headers, s3_rows, cw3))
story.append(Paragraph('Table 6: Sprint 3 Task Details (7 tasks, 84 hours estimated)', sCaption))

# ===================== SECTION 7: SPRINT 4 =====================
story.append(H1('<b>7. Sprint 4: UX Improvements (Weeks 8\u201310)</b>'))
story.append(B(
    'Sprint 4 focuses on the user-facing experience, addressing 47 UI/UX problems identified across the application. '
    'The two critical findings are accessibility violations that must be resolved for WCAG 2.1 AA compliance: missing ARIA labels on interactive chart elements and insufficient color contrast ratios in the sidebar navigation. '
    'These violations pose not only a legal compliance risk but also exclude users with visual impairments from using the application effectively. '
    'Beyond accessibility, the sprint addresses significant mobile responsiveness gaps where key pages such as the dashboard, portfolio view, and settings page are either partially or completely broken on viewports narrower than 768 pixels. '
    'Given the increasing proportion of users accessing web applications from mobile devices, these gaps represent a significant barrier to user adoption and retention.'
))
story.append(B(
    'The sprint also introduces comprehensive empty and loading states across all data-driven pages. Currently, many pages render nothing when data is unavailable, leaving users uncertain whether the page is broken, loading, or simply empty. '
    'The shared components introduced in Sprint 2 (EmptyState, LoadingState, ErrorState) provide the building blocks, and this sprint focuses on integrating them into every page with contextually appropriate messaging and calls to action. '
    'Onboarding improvements are also included, with a guided first-run experience that walks new users through connecting an exchange, setting up their first portfolio, and understanding the dashboard layout. '
    'The current onboarding drops users directly into an empty dashboard with no guidance, which is a primary driver of the poor retention metrics identified in the product audit.'
))

story.append(H2('<b>7.1 Sprint 4 Task Breakdown</b>'))
s4_rows = [
    [
        CB('S4-01'), C('Fix critical a11y: add ARIA labels to all interactive chart elements and ensure screen reader compatibility'),
        CE('P0'), C('S2-02'), C('14'), C('Medium'),
        C('src/components/charts/ChartCard.tsx, src/components/charts/**/*.tsx'),
        C('Charts accessible to screen reader users; WCAG 2.1 AA compliance for data visualization'),
        CW('Medium: Complex chart interactions require careful ARIA live region management')
    ],
    [
        CB('S4-02'), C('Fix critical a11y: resolve color contrast violations in sidebar, buttons, and form labels'),
        CE('P0'), C('None'), C('10'), C('Easy'),
        C('src/components/layout/Sidebar.tsx, tailwind.config.ts, src/app/globals.css'),
        C('All text meets WCAG AA contrast ratio of 4.5:1; improved readability for all users'),
        CS('Low: Color token changes with automated contrast verification')
    ],
    [
        CB('S4-03'), C('Implement responsive layouts for dashboard, portfolio, and settings pages (mobile-first)'),
        CW('P1'), C('S2-01'), C('18'), C('Hard'),
        C('src/app/dashboard/page.tsx, src/app/portfolio/page.tsx, src/app/settings/page.tsx'),
        C('Full functionality on mobile devices; expanded addressable user base'),
        CW('High: Complex data tables and charts require significant layout rethinking for mobile')
    ],
    [
        CB('S4-04'), C('Integrate EmptyState, LoadingState, and ErrorState into all data-driven pages with contextual messaging'),
        CW('P1'), C('S2-06'), C('14'), C('Medium'),
        C('src/app/**/page.tsx (all data pages)'),
        C('No page ever shows blank; users always understand current state and next action'),
        CW('Medium: Each page needs unique messaging and CTAs tailored to its context')
    ],
    [
        CB('S4-05'), C('Design and implement guided onboarding flow with exchange connection, portfolio setup, and dashboard tour'),
        CW('P1'), C('S4-03, S4-04'), C('18'), C('Hard'),
        C('src/app/onboarding/page.tsx, src/components/onboarding/*.tsx, src/lib/onboarding.ts'),
        C('New user activation rate improved; time-to-value reduced from undefined to under 5 minutes'),
        CW('Medium: Onboarding flow requires product input on optimal step sequence and messaging')
    ],
    [
        CB('S4-06'), C('Add keyboard navigation support and focus management across all interactive components'),
        CW('P1'), C('S4-01'), C('12'), C('Medium'),
        C('src/components/**/*.tsx, src/app/globals.css'),
        C('Full keyboard operability; improved accessibility for power users and assistive technology'),
        CW('Medium: Focus trap implementation in modals and dropdowns requires careful state management')
    ],
]
story.append(make_table(s0_headers, s4_rows, cw3))
story.append(Paragraph('Table 7: Sprint 4 Task Details (6 tasks, 86 hours estimated)', sCaption))

# ===================== SECTION 8: SPRINT 5 =====================
story.append(H1('<b>8. Sprint 5: Feature Rationalization (Weeks 11\u201314)</b>'))
story.append(B(
    'Sprint 5 is the most consequential sprint in terms of product impact, reducing the application from 39 routes to 12 core routes. '
    'The product audit identified that the current route count is approximately three times what an MVP should contain, with many routes serving aspirational features that are either partially implemented, completely empty, or duplicate functionality available elsewhere. '
    'This feature creep dilutes engineering effort, confuses users with an overwhelming navigation structure, and increases the attack surface for bugs and accessibility issues. '
    'The rationalization process follows a data-driven approach: routes are ranked by user engagement metrics (from the monitoring infrastructure set up in Sprint 1), business value, and implementation completeness. '
    'Routes that score low across all three dimensions are candidates for removal, while high-value routes receive investment for polish and completion.'
))
story.append(B(
    'The 12 core routes selected for retention represent the essential user journey: authentication, dashboard overview, portfolio management, market data, trading execution, settings, and a small number of supporting pages for help and documentation. '
    'The 27 removed routes will be handled through a combination of full deletion (for empty or broken pages), redirection to the nearest core route (for partially implemented features), and archival in a separate branch for potential future revival. '
    'This sprint also addresses the missing retention systems identified in the product audit, including email notification preferences, activity feed persistence, and user preference storage. '
    'The sprint is allocated four weeks, the longest of any sprint, because feature reduction is inherently risky from a user perspective and requires careful communication, migration support, and the option for users to provide feedback on removed features before they are permanently deleted.'
))

story.append(H2('<b>8.1 Sprint 5 Task Breakdown</b>'))
s5_rows = [
    [
        CB('S5-01'), C('Analyze route usage metrics and rank all 39 routes by engagement, value, and completeness'),
        CW('P1'), C('S1-01'), C('12'), C('Medium'),
        C('src/app/**/page.tsx (all routes), analytics data'),
        C('Data-driven route prioritization; defensible decisions on what to keep vs. remove'),
        CS('Low: Analysis task with no code changes')
    ],
    [
        CB('S5-02'), C('Remove 15 empty or broken routes and set up redirects to nearest core route'),
        CW('P1'), C('S5-01'), C('16'), C('Medium'),
        C('src/app/[removed-routes]/** (delete), next.config.mjs (redirects)'),
        C('Dead weight eliminated; users redirected seamlessly; navigation simplified'),
        CW('Medium: External links and bookmarks may break; redirect coverage must be comprehensive')
    ],
    [
        CB('S5-03'), C('Archive 12 aspirational routes to feature/rationalization branch with documentation'),
        CW('P1'), C('S5-01'), C('10'), C('Easy'),
        C('src/app/[aspirational]/** (move to branch)'),
        C('Aspirational code preserved for future use; main branch cleaned of incomplete features'),
        CS('Low: Code is moved, not deleted; can be restored from Git history or branch')
    ],
    [
        CB('S5-04'), C('Simplify navigation to expose only 12 core routes in sidebar and header'),
        CW('P1'), C('S5-02, S5-03, S2-01'), C('12'), C('Medium'),
        C('src/components/layout/Sidebar.tsx, src/components/layout/TopBar.tsx, src/lib/navigation.ts'),
        C('Navigation clarity dramatically improved; users find features faster; cognitive load reduced'),
        CW('Medium: Navigation grouping and labeling requires UX input and user testing')
    ],
    [
        CB('S5-05'), C('Implement user preference storage system with persistence across sessions'),
        C('P2'), C('S3-01'), C('14'), C('Medium'),
        C('src/domains/user/preferences.ts, src/app/api/user/preferences/route.ts, prisma/schema.prisma'),
        C('User settings persist across sessions; improved personalization; reduced friction on return visits'),
        CS('Low: Standard CRUD with localStorage fallback; well-understood pattern')
    ],
    [
        CB('S5-06'), C('Implement basic retention systems: email digest preferences and activity feed'),
        C('P2'), C('S5-05'), C('18'), C('Hard'),
        C('src/domains/notifications/**/*.ts, src/app/api/notifications/**/*.ts, src/components/ActivityFeed.tsx'),
        C('User engagement improved through proactive communication; return visit rate increased'),
        CW('High: Email delivery infrastructure requires third-party integration (SendGrid/Resend)')
    ],
]
story.append(make_table(s0_headers, s5_rows, cw3))
story.append(Paragraph('Table 8: Sprint 5 Task Details (6 tasks, 82 hours estimated)', sCaption))

# ===================== SECTION 9: RISK MATRIX =====================
story.append(H1('<b>9. Risk Assessment Matrix</b>'))
story.append(B(
    'Every refactoring effort carries inherent risk, and this plan identifies and mitigates the most significant risks across all six sprints. '
    'The risk matrix below categorizes risks by likelihood and impact, with specific mitigation strategies for each. '
    'The highest-risk items are the AppShell decomposition (S2-01) and the portfolio aggregation race condition fix (S3-03), both of which involve complex state management with potential for data loss if implemented incorrectly. '
    'The feature rationalization in Sprint 5 carries user-facing risk, as removing routes that any user depends on creates immediate dissatisfaction. '
    'Each high-risk task includes specific mitigation strategies, and the CI/CD pipeline established in Sprint 0 provides the safety net of automated regression testing that catches issues before they reach production.'
))

risk_headers = ['Risk', 'Likelihood', 'Impact', 'Mitigation Strategy']
risk_rows = [
    [CE('AppShell decomposition breaks navigation state'), CW('Medium'), CE('High'), C('Extensive E2E tests before merge; feature flag for gradual rollout; rollback plan')],
    [CE('Portfolio race condition fix causes performance regression'), CW('Low'), CE('High'), C('Load testing with production-like data; benchmark before/after; canary deployment')],
    [CW('Route removal breaks existing user bookmarks'), CW('High'), CW('Medium'), C('Comprehensive 301 redirects; 30-day grace period with deprecation notices in UI')],
    [CW('Chart consolidation misses edge case rendering'), CW('Medium'), CW('Medium'), C('Visual regression testing with Percy/Chromatic; per-chart-type test suites')],
    [C('Domain consolidation introduces circular dependencies'), CW('Medium'), CW('Medium'), C('Dependency graph analysis tool in CI; strict module boundary linting rules')],
    [C('A11y fixes conflict with design system'), CW('Low'), CS('Low'), C('Design tokens updated centrally; contrast checker integrated into CI pipeline')],
    [C('CI pipeline false positives block legitimate PRs'), CW('Medium'), CS('Low'), C('Flaky test detection and quarantine; tiered check requirements (warn vs. block)')],
    [C('Monitoring overhead degrades application performance'), CW('Low'), CS('Low'), C('Sampling-based metrics collection; performance budget alerts; lazy-loaded SDK')],
]
cw4 = [40*mm, 22*mm, 18*mm, 70*mm]
story.append(make_table(risk_headers, risk_rows, cw4))
story.append(Paragraph('Table 9: Risk Assessment Matrix with Mitigation Strategies', sCaption))

# ===================== SECTION 10: RESOURCE ESTIMATION =====================
story.append(H1('<b>10. Resource Estimation and Timeline</b>'))
story.append(B(
    'The total estimated effort across all six sprints is 480 hours of focused engineering time. '
    'This estimate includes implementation, testing, code review, and documentation for each task, but excludes product design time, stakeholder review cycles, and deployment verification. '
    'A single senior engineer working full-time on this plan would complete it in approximately 12 weeks, which aligns with the 14-week sprint timeline that includes buffer for unexpected complexity and review cycles. '
    'With two engineers, the timeline can be compressed to approximately 8 weeks, as most sprint-internal tasks can be parallelized. '
    'With three engineers, the theoretical minimum is 6 weeks, though coordination overhead and merge conflicts make this unrealistic without very careful task allocation.'
))

resource_headers = ['Configuration', 'Sprint Duration', 'Total Duration', 'Parallelism', 'Recommended For']
resource_rows = [
    [CB('1 Senior Engineer'), C('1\u20134 weeks per sprint'), CB('12\u201314 weeks'), C('None'), C('Solo founder or small team')],
    [CB('2 Engineers'), C('0.5\u20132 weeks per sprint'), CB('8\u201310 weeks'), CW('Medium'), C('Small startup team')],
    [CB('3 Engineers'), C('0.5\u20131.5 weeks per sprint'), CB('6\u20138 weeks'), CW('High'), C('Dedicated refactoring team')],
]
cw5 = [28*mm, 30*mm, 26*mm, 24*mm, 42*mm]
story.append(make_table(resource_headers, resource_rows, cw5))
story.append(Paragraph('Table 10: Resource Configuration Options', sCaption))

story.append(B(
    'The recommended approach is a two-engineer configuration, where one engineer focuses on infrastructure and backend concerns (Sprints 0, 1, and 3) while the other handles frontend component and UX work (Sprints 2 and 4). '
    'Sprint 5 (feature rationalization) requires both engineers plus product input, as the decisions about which routes to keep have business implications that extend beyond technical considerations. '
    'Regardless of team size, the sprint sequence should not be reordered, as each sprint builds on the deliverables of its predecessors. '
    'The buffer built into the 14-week timeline accounts for the inevitable discovery of additional issues during implementation, as well as the time required for thorough code review and stakeholder feedback on user-facing changes.'
))

# ===================== SECTION 11: SUCCESS CRITERIA =====================
story.append(H1('<b>11. Success Criteria and Exit Metrics</b>'))
story.append(B(
    'The refactor plan will be considered successful when all of the following criteria are met, measured at the end of Sprint 5. '
    'These criteria are designed to be objectively verifiable and represent a meaningful improvement in the health, maintainability, and user experience of the VIXOR application. '
    'Each criterion maps to one or more audit findings, ensuring complete coverage of the 221 identified problems.'
))

success_headers = ['#', 'Criterion', 'Measurement', 'Audit Source']
success_rows = [
    [CB('1'), C('CI/CD pipeline passes on 100% of commits to main'), C('GitHub Actions success rate'), C('Architecture (P0)')],
    [CB('2'), C('Test coverage exceeds 60% for all refactored modules'), C('Vitest coverage report'), C('Architecture (P0)')],
    [CB('3'), C('Zero P0 domain integrity issues remain open'), C('Code review + load testing'), C('Domain (P0)')],
    [CB('4'), C('AppShell component under 200 LOC'), C('Lines of code count'), C('Component (P1)')],
    [CB('5'), C('Single ChartCard component replaces all 7 chart variants'), C('Code audit: chart components count'), C('Component (P1)')],
    [CB('6'), C('WCAG 2.1 AA compliance with zero critical violations'), C('axe-core automated audit'), C('UI/UX (P0)')],
    [CB('7'), C('All core pages responsive down to 375px viewport'), C('Manual testing on mobile devices'), C('UI/UX (P1)')],
    [CB('8'), C('Route count reduced from 39 to 12 or fewer'), C('File system count of page.tsx'), C('Product (P1)')],
    [CB('9'), C('Production error rate below 0.1% of sessions'), C('Sentry error tracking dashboard'), C('Technical (P0)')],
    [CB('10'), C('Lighthouse performance score above 85'), C('Lighthouse CI audit'), C('Technical (P1)')],
]
cw6 = [10*mm, 56*mm, 40*mm, 30*mm]
story.append(make_table(success_headers, success_rows, cw6))
story.append(Paragraph('Table 11: Success Criteria with Objective Measurements', sCaption))

story.append(B(
    'These ten criteria represent the minimum bar for a successful refactor. Achieving all ten confirms that the most critical problems identified across all six audits have been resolved and that the application is measurably healthier than before the refactor began. '
    'Additional stretch goals include achieving 80% test coverage (versus the 60% minimum), reducing the largest component to under 100 LOC, and achieving a Lighthouse score above 90 across all core pages. '
    'Progress toward these criteria should be tracked weekly during sprint retrospectives, with any criterion at risk of not being met escalated immediately for resolution.'
))

# ===================== SECTION 12: APPENDIX - FULL TASK INDEX =====================
story.append(H1('<b>12. Appendix: Full Task Index</b>'))
story.append(B(
    'The following table provides a complete index of all 43 tasks across all six sprints, sorted by sprint and task ID. '
    'This index serves as a quick reference for project managers and engineers to locate specific tasks and their attributes without scrolling through the detailed sprint sections above. '
    'Each task includes its ID, a brief description, priority level, estimated hours, and difficulty rating. '
    'Dependencies are noted where applicable, and the sprint column indicates when the task is scheduled for execution.'
))

idx_headers = ['ID', 'Task Summary', 'Priority', 'Hours', 'Diff.', 'Sprint']
idx_rows = [
    [C('S0-01'), C('GitHub Actions CI pipeline'), CE('P0'), C('12'), C('Medium'), C('Sprint 0')],
    [C('S0-02'), C('Vitest test runner setup'), CE('P0'), C('8'), C('Medium'), C('Sprint 0')],
    [C('S0-03'), C('10 critical smoke tests'), CE('P0'), C('10'), C('Medium'), C('Sprint 0')],
    [C('S0-04'), C('Fix shadcn/ui path alias'), CW('P1'), C('6'), C('Easy'), C('Sprint 0')],
    [C('S0-05'), C('Remove unused dependencies'), CW('P1'), C('4'), C('Easy'), C('Sprint 0')],
    [C('S0-06'), C('Vercel deployment previews'), CW('P1'), C('6'), C('Easy'), C('Sprint 0')],
    [C('S0-07'), C('ESLint strict mode'), CW('P1'), C('8'), C('Medium'), C('Sprint 0')],
    [C('S0-08'), C('Husky pre-commit hooks'), C('P2'), C('6'), C('Easy'), C('Sprint 0')],
    [C('S1-01'), C('Sentry error tracking'), CE('P0'), C('12'), C('Medium'), C('Sprint 1')],
    [C('S1-02'), C('React error boundaries'), CW('P1'), C('10'), C('Medium'), C('Sprint 1')],
    [C('S1-03'), C('Structured logging'), CW('P1'), C('10'), C('Easy'), C('Sprint 1')],
    [C('S1-04'), C('API versioning /api/v1/'), CW('P1'), C('12'), C('Hard'), C('Sprint 1')],
    [C('S1-05'), C('Rate limiting middleware'), CW('P1'), C('10'), C('Medium'), C('Sprint 1')],
    [C('S1-06'), C('Pin dependency versions'), CW('P1'), C('8'), C('Easy'), C('Sprint 1')],
    [C('S1-07'), C('Health check endpoint'), C('P2'), C('8'), C('Easy'), C('Sprint 1')],
    [C('S1-08'), C('Web Vitals monitoring'), C('P2'), C('10'), C('Medium'), C('Sprint 1')],
    [C('S2-01'), C('AppShell decomposition'), CW('P1'), C('16'), C('Hard'), C('Sprint 2')],
    [C('S2-02'), C('Unified ChartCard component'), CW('P1'), C('16'), C('Hard'), C('Sprint 2')],
    [C('S2-03'), C('Shared LoadingState'), CW('P1'), C('8'), C('Easy'), C('Sprint 2')],
    [C('S2-04'), C('Shared ErrorState'), CW('P1'), C('8'), C('Easy'), C('Sprint 2')],
    [C('S2-05'), C('Shared EmptyState'), CW('P1'), C('6'), C('Easy'), C('Sprint 2')],
    [C('S2-06'), C('Migrate pages to shared states'), C('P2'), C('12'), C('Medium'), C('Sprint 2')],
    [C('S2-07'), C('Extract duplicated hooks'), CW('P1'), C('8'), C('Easy'), C('Sprint 2')],
    [C('S2-08'), C('Component-level tests'), C('P2'), C('14'), C('Medium'), C('Sprint 2')],
    [C('S3-01'), C('P0 unique constraints'), CE('P0'), C('8'), C('Medium'), C('Sprint 3')],
    [C('S3-02'), C('P0 timestamp unification'), CE('P0'), C('10'), C('Medium'), C('Sprint 3')],
    [C('S3-03'), C('P0 race condition fix'), CE('P0'), C('14'), C('Expert'), C('Sprint 3')],
    [C('S3-04'), C('Consolidate discover domains'), CW('P1'), C('16'), C('Hard'), C('Sprint 3')],
    [C('S3-05'), C('Remove dead copilot v1'), CW('P1'), C('8'), C('Easy'), C('Sprint 3')],
    [C('S3-06'), C('Domain naming and validation'), CW('P1'), C('12'), C('Medium'), C('Sprint 3')],
    [C('S3-07'), C('Domain-level tests'), C('P2'), C('16'), C('Medium'), C('Sprint 3')],
    [C('S4-01'), C('A11y: chart ARIA labels'), CE('P0'), C('14'), C('Medium'), C('Sprint 4')],
    [C('S4-02'), C('A11y: color contrast fix'), CE('P0'), C('10'), C('Easy'), C('Sprint 4')],
    [C('S4-03'), C('Responsive layouts (mobile)'), CW('P1'), C('18'), C('Hard'), C('Sprint 4')],
    [C('S4-04'), C('Integrate shared states'), CW('P1'), C('14'), C('Medium'), C('Sprint 4')],
    [C('S4-05'), C('Guided onboarding flow'), CW('P1'), C('18'), C('Hard'), C('Sprint 4')],
    [C('S4-06'), C('Keyboard navigation'), CW('P1'), C('12'), C('Medium'), C('Sprint 4')],
    [C('S5-01'), C('Route usage analysis'), CW('P1'), C('12'), C('Medium'), C('Sprint 5')],
    [C('S5-02'), C('Remove 15 empty routes'), CW('P1'), C('16'), C('Medium'), C('Sprint 5')],
    [C('S5-03'), C('Archive 12 aspirational routes'), CW('P1'), C('10'), C('Easy'), C('Sprint 5')],
    [C('S5-04'), C('Simplify navigation'), CW('P1'), C('12'), C('Medium'), C('Sprint 5')],
    [C('S5-05'), C('User preference storage'), C('P2'), C('14'), C('Medium'), C('Sprint 5')],
    [C('S5-06'), C('Retention systems'), C('P2'), C('18'), C('Hard'), C('Sprint 5')],
]
cw7 = [16*mm, 44*mm, 16*mm, 14*mm, 16*mm, 22*mm]
story.append(make_table(idx_headers, idx_rows, cw7))
story.append(Paragraph('Table 12: Complete Task Index (43 tasks, ~480 hours total)', sCaption))

# --- Final paragraph ---
story.append(B(
    'This Refactor Plan represents a comprehensive, methodical approach to transforming the VIXOR codebase from its current state into a production-ready, maintainable, and accessible application. '
    'By following the sprint sequence and adhering to the success criteria defined above, the team can systematically eliminate technical debt while maintaining business continuity and delivering incremental value at each sprint boundary. '
    'The plan is designed to be adaptable: if external factors require acceleration or deceleration, the granular task breakdown allows for selective execution without losing the coherence of the overall strategy. '
    'Regular retrospectives at the end of each sprint will provide opportunities to adjust estimates, reprioritize tasks, and incorporate lessons learned into subsequent sprints.'
))

# =============================================================
# AST VALIDATE & BUILD
# =============================================================
script_path = os.path.abspath(__file__)
with open(script_path, 'r') as f:
    source = f.read()

try:
    import ast
    ast.parse(source)
    print('[AST] Validation passed - no syntax errors detected.')
except SyntaxError as e:
    print(f'[AST] VALIDATION FAILED: {e}')
    sys.exit(1)

# Build PDF
OUTPUT = '/home/z/my-project/download/VIXOR_Refactor_Plan.pdf'
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

doc = TocDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=30*mm,
    rightMargin=20*mm,
    topMargin=25*mm,
    bottomMargin=20*mm,
    title='VIXOR Refactor Plan',
    author='VIXOR Audit Team',
    subject='Comprehensive Refactor Plan based on Six Audits',
)

doc.multiBuild(story, onFirstPage=cover_bg, onLaterPages=page_bg)

fsize = os.path.getsize(OUTPUT)
print(f'[OK] PDF generated: {OUTPUT}')
print(f'[OK] File size: {fsize:,} bytes ({fsize/1024:.1f} KB)')

# Count pages
from reportlab.lib.utils import ImageReader
from PyPDF2 import PdfReader
reader = PdfReader(OUTPUT)
page_count = len(reader.pages)
print(f'[OK] Page count: {page_count}')
