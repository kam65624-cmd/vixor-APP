#!/usr/bin/env python3
"""VIXOR Domain Audit PDF Generator — covers all 23 domains."""

import sys, os, hashlib, platform, re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (Paragraph, Spacer, Table, TableStyle,
                                 PageBreak, SimpleDocTemplate)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──────────────────────────────────────────────────────
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

# ── Colors ────────────────────────────────────────────────────────────────
PAGE_BG      = '#f1f0ef'
TABLE_STRIPE = '#f4f3f2'
HEADER_FILL  = '#7c704e'
BORDER       = '#cdc8bb'
ACCENT       = '#856f2c'
TEXT_PRIMARY  = '#1a1a18'
TEXT_MUTED    = '#8e8c85'
SEM_SUCCESS  = '#3e7d53'
SEM_WARNING  = '#9a7d42'
SEM_ERROR    = '#8b4c46'
SEM_INFO     = '#486787'

class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            self.notify('TOCEntry', (
                getattr(flowable, 'bookmark_level', 0),
                getattr(flowable, 'bookmark_text', ''),
                self.page,
                getattr(flowable, 'bookmark_key', ''),
            ))

# ── Styles ────────────────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
LM, RM, TM, BM = 30*mm, 20*mm, 25*mm, 20*mm

def _c(hex_color):
    r = int(hex_color[1:3],16); g = int(hex_color[3:5],16); b = int(hex_color[5:7],16)
    return colors.Color(r/255, g/255, b/255)

C_PAGE_BG = _c(PAGE_BG)
C_STRIPE  = _c(TABLE_STRIPE)
C_HEADER  = _c(HEADER_FILL)
C_BORDER  = _c(BORDER)
C_ACCENT  = _c(ACCENT)
C_PRIMARY = _c(TEXT_PRIMARY)
C_MUTED   = _c(TEXT_MUTED)
C_SUCCESS = _c(SEM_SUCCESS)
C_WARNING = _c(SEM_WARNING)
C_ERROR   = _c(SEM_ERROR)
C_INFO    = _c(SEM_INFO)

def build_styles():
    s = {}
    s['title'] = ParagraphStyle('Title', fontName='FreeSerif-Bold', fontSize=28,
        leading=34, textColor=C_PRIMARY, alignment=TA_CENTER, spaceAfter=6*mm)
    s['subtitle'] = ParagraphStyle('Subtitle', fontName='FreeSerif-Italic', fontSize=13,
        leading=18, textColor=C_MUTED, alignment=TA_CENTER, spaceAfter=8*mm)
    s['h1'] = ParagraphStyle('H1', fontName='FreeSerif-Bold', fontSize=20,
        leading=26, textColor=C_ACCENT, spaceBefore=10*mm, spaceAfter=4*mm,
        borderWidth=0, borderPadding=0)
    s['h2'] = ParagraphStyle('H2', fontName='FreeSerif-Bold', fontSize=15,
        leading=20, textColor=C_HEADER, spaceBefore=6*mm, spaceAfter=3*mm)
    s['h3'] = ParagraphStyle('H3', fontName='FreeSerif-Bold', fontSize=12,
        leading=16, textColor=C_PRIMARY, spaceBefore=4*mm, spaceAfter=2*mm)
    s['body'] = ParagraphStyle('Body', fontName='FreeSerif', fontSize=10,
        leading=15, textColor=C_PRIMARY, alignment=TA_JUSTIFY, spaceAfter=3*mm)
    s['muted'] = ParagraphStyle('Muted', fontName='FreeSerif-Italic', fontSize=9,
        leading=13, textColor=C_MUTED, alignment=TA_LEFT, spaceAfter=2*mm)
    s['table_header'] = ParagraphStyle('TH', fontName='FreeSerif-Bold', fontSize=8.5,
        leading=11, textColor=colors.white, alignment=TA_CENTER)
    s['table_cell'] = ParagraphStyle('TC', fontName='FreeSerif', fontSize=8,
        leading=11, textColor=C_PRIMARY, alignment=TA_LEFT)
    s['table_cell_center'] = ParagraphStyle('TCC', fontName='FreeSerif', fontSize=8,
        leading=11, textColor=C_PRIMARY, alignment=TA_CENTER)
    s['score_big'] = ParagraphStyle('ScoreBig', fontName='FreeSerif-Bold', fontSize=22,
        leading=28, textColor=C_ACCENT, alignment=TA_CENTER)
    s['toc_h1'] = ParagraphStyle('TOCH1', fontName='FreeSerif-Bold', fontSize=12,
        leading=18, leftIndent=0, textColor=C_HEADER)
    s['toc_h2'] = ParagraphStyle('TOCH2', fontName='FreeSerif', fontSize=10,
        leading=16, leftIndent=12, textColor=C_PRIMARY)
    return s

STY = build_styles()

# ── Helper Flowables ───────────────────────────────────────────────────────

class H1(Paragraph):
    def __init__(self, text, key=''):
        super().__init__(text, STY['h1'])
        self.bookmark_name = True
        self.bookmark_level = 0
        self.bookmark_text = text.replace('<b>','').replace('</b>','')
        self.bookmark_key = key or text

class H2(Paragraph):
    def __init__(self, text, key=''):
        super().__init__(text, STY['h2'])
        self.bookmark_name = True
        self.bookmark_level = 1
        self.bookmark_text = text.replace('<b>','').replace('</b>','')
        self.bookmark_key = key or text

class H3(Paragraph):
    def __init__(self, text):
        super().__init__(text, STY['h3'])

def muted(text):
    return Paragraph(text, STY['muted'])

def body(text):
    return Paragraph(text, STY['body'])

def score_box(score, label=''):
    if score >= 7:
        clr = C_SUCCESS; clr_hex = SEM_SUCCESS
    elif score >= 5:
        clr = C_WARNING; clr_hex = SEM_WARNING
    else:
        clr = C_ERROR; clr_hex = SEM_ERROR
    inner = f'<font color="{clr_hex}" size="22"><b>{score}/10</b></font>'
    if label:
        inner += f'<br/><font size="9" color="{SEM_INFO}">{label}</font>'
    tbl = Table([[Paragraph(inner, STY['score_big'])]],
                colWidths=[50*mm], rowHeights=[18*mm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), _c('#f8f7f5')),
        ('BOX', (0,0), (-1,-1), 0.5, clr),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3*mm),
    ]))
    return tbl

def problem_table(problems):
    hdr = ['ID','Priority','Problem','Impact','Risk','Affected Files','Root Cause']
    hdr_row = [Paragraph(h, STY['table_header']) for h in hdr]
    data = [hdr_row]
    for p in problems:
        row = [
            Paragraph(p[0], STY['table_cell_center']),
            Paragraph(p[1], STY['table_cell_center']),
            Paragraph(p[2], STY['table_cell']),
            Paragraph(p[3], STY['table_cell']),
            Paragraph(p[4], STY['table_cell_center']),
            Paragraph(p[5], STY['table_cell']),
            Paragraph(p[6], STY['table_cell']),
        ]
        data.append(row)
    col_w = [10*mm, 14*mm, 30*mm, 22*mm, 12*mm, 28*mm, 28*mm]
    tbl = Table(data, colWidths=col_w, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0,0), (-1,0), C_HEADER),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.4, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 2*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 2*mm),
    ]
    for i in range(1, len(data)):
        bg = C_STRIPE if i % 2 == 0 else colors.white
        style_cmds.append(('BACKGROUND', (0,i), (-1,i), bg))
        pri = problems[i-1][1]
        if 'P0' in pri:
            style_cmds.append(('BACKGROUND', (1,i), (1,i), _c(SEM_ERROR)))
            style_cmds.append(('TEXTCOLOR', (1,i), (1,i), colors.white))
        elif 'P1' in pri:
            style_cmds.append(('BACKGROUND', (1,i), (1,i), _c(SEM_WARNING)))
            style_cmds.append(('TEXTCOLOR', (1,i), (1,i), colors.white))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

def info_table(pairs):
    data = []
    for k, v in pairs:
        data.append([
            Paragraph(f'<b>{k}</b>', STY['table_cell']),
            Paragraph(str(v), STY['table_cell']),
        ])
    tbl = Table(data, colWidths=[40*mm, 106*mm])
    style_cmds = [
        ('GRID', (0,0), (-1,-1), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 1.5*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 2*mm),
        ('BACKGROUND', (0,0), (0,-1), _c('#f8f7f5')),
    ]
    for i in range(len(data)):
        bg = C_STRIPE if i % 2 == 0 else colors.white
        style_cmds.append(('BACKGROUND', (1,i), (1,i), bg))
    tbl.setStyle(TableStyle(style_cmds))
    return tbl

# ── Domain Data ────────────────────────────────────────────────────────────

DOMAINS = [
    {
        'name': 'analysis',
        'files': 22,
        'purpose': (
            'The analysis domain serves as the core technical analysis engine for the entire VIXOR platform, '
            'providing candle-by-candle analysis with a rich set of indicators, pattern detection mechanisms, '
            'Smart Money Concepts (SMC), regime detection, and risk-reward calculations. It is the intellectual '
            'heart of the system, transforming raw OHLCV data into actionable trading signals. The domain is '
            'designed to operate both server-side for full analysis pipelines and is consumed by multiple '
            'downstream domains including copilot, debate, experiment, and trading. Its architecture is modular '
            'with clear separation between core candle utilities, indicator computation, pattern recognition, '
            'regime classification, and risk assessment layers.'
        ),
        'file_list': (
            'engine/engine.ts, engine/core/candle-utils.ts, engine/core/types.ts, '
            'engine/core/market-structure.ts, engine/indicators/index.ts, engine/patterns/harmonic-patterns.ts, '
            'engine/patterns/candlestick-patterns.ts, engine/patterns/chart-formations.ts, '
            'engine/smc/liquidity.ts, engine/smc/fair-value-gaps.ts, engine/smc/order-blocks.ts, '
            'engine/smc/bos-choch.ts, engine/regime/indicator-math.ts, engine/regime/regime-detector.ts, '
            'engine/regime/strategy-scorer.ts, engine/risk/risk-reward.ts, server/run-analysis.ts, '
            'server/market-snapshot.ts, functions.ts, types.ts, reanalysis.ts, __tests__/e2e-analysis.test.ts'
        ),
        'dependencies': (
            'Imports from: backtest (static), chart-intelligence (static), market (static), '
            'chart-truth (dynamic), debate (dynamic). Imported by: copilot, debate, experiment, trading '
            '(all dynamic or type-only).'
        ),
        'coupling': 'Moderate — static imports to backtest, chart-intelligence, and market; dynamic imports to chart-truth and debate keep optional paths decoupled. However, the sheer number of downstream consumers (7+) means any API change here has wide blast radius.',
        'cohesion': 'High — the engine subdirectories (core, indicators, patterns, smc, regime, risk) each encapsulate a single analytical concern. File organization mirrors the conceptual model of technical analysis.',
        'score': 7,
        'problems': [
            ['D-A01','P1','E2E test is sole coverage','Engine has 22 files but only 1 e2e test; unit tests for individual modules are absent','Medium','engine/**/*, __tests__/e2e-analysis.test.ts','No unit test strategy; complex indicator math untested'],
            ['D-A02','P2','Reanalysis module lacks rate limiting','Reanalysis can be triggered repeatedly without throttling, risking API abuse','Low','reanalysis.ts','No debounce or cooldown mechanism implemented'],
            ['D-A03','P1','Pattern detectors share no base class','Harmonic, candlestick, and chart formation detectors implement different interfaces','Medium','engine/patterns/*.ts','Organic growth without interface extraction'],
            ['D-A04','P2','SMC modules tightly coupled to candle type','BOS/CHOCH, order blocks, and FVGs all depend on engine/core/types.ts Candle shape','Low','engine/smc/*.ts','Shared type not abstracted behind interface'],
        ],
        'recommendations': (
            'Add unit tests for every indicator and pattern detector — target 80% branch coverage for engine/core and engine/indicators. '
            'Extract a PatternDetector interface that all three pattern modules implement, enabling consistent scoring and composition. '
            'Consider extracting the SMC subsystem into its own sub-domain (analysis/smc/) with a clean public API to reduce cognitive load. '
            'Add rate limiting to the reanalysis pipeline with a minimum 60-second cooldown between re-runs for the same token. '
            'Document the analysis pipeline stages and their data flow in an architecture decision record (ADR).'
        ),
    },
    {
        'name': 'arbitrage',
        'files': 25,
        'purpose': (
            'The arbitrage domain implements a comprehensive cross-exchange arbitrage detection and execution engine, '
            'ported from an external axiom-arbitrage-trading-bot codebase. It supports three distinct arbitrage strategies: '
            'cross-DEX arbitrage (same token across different decentralized exchanges), triangular arbitrage (three-token '
            'price loops within a single exchange), and CEX-DEX arbitrage (exploiting price differences between centralized '
            'and decentralized venues). The engine operates in dry-run mode by default for safety, with a risk management '
            'layer that includes circuit breakers and configurable thresholds. Exchange integrations cover Jupiter and Axiom, '
            'with a token registry for pair resolution.'
        ),
        'file_list': (
            'engine.ts, executor.ts, price-feed.ts, risk.ts, config.ts, constants.ts, types.ts, '
            'math.ts, logger.ts, token-registry.ts, strategies/base.ts, strategies/index.ts, '
            'strategies/cross-dex.ts, strategies/cex-dex.ts, strategies/triangular.ts, '
            'exchanges/jupiter.ts, exchanges/jupiter.client.ts, exchanges/axiom.ts, '
            'exchanges/axiom.client.ts, exchanges/index.ts, exchanges/types.ts, '
            'mock/dex-clients.ts, mock/quote-simulator.ts, '
            'tests/config.test.ts, tests/strategies.test.ts, tests/risk.test.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf domain). Imported by: None. Fully self-contained with its own mock layer.'
        ),
        'coupling': 'Very Low — this is a leaf domain with zero cross-domain dependencies. It includes its own mock infrastructure for testing. The only external coupling is via exchange API clients (Jupiter, Axiom).',
        'cohesion': 'High — all files serve the singular purpose of finding and executing arbitrage opportunities. The strategies/, exchanges/, and mock/ subdirectories are well-organized.',
        'score': 8,
        'problems': [
            ['D-AR01','P2','Dual exchange files per provider','jupiter.ts + jupiter.client.ts and axiom.ts + axiom.client.ts create confusion about which to import','Low','exchanges/jupiter.ts, exchanges/axiom.ts','Port from axiom-bot retained two-file pattern'],
            ['D-AR02','P2','No integration tests with real quotes','Tests use mocks; no tests validate against live or recorded exchange responses','Medium','tests/*.test.ts, mock/*.ts','Exchange rate limits make live testing difficult'],
            ['D-AR03','P1','Token registry not persisted','Token registry is rebuilt in-memory on each startup, causing cold-start delays','Medium','token-registry.ts','No database or cache backing store'],
        ],
        'recommendations': (
            'Merge each exchange provider pair (jupiter.ts + jupiter.client.ts) into a single file with clear exported sections. '
            'Add recorded fixture tests using saved exchange responses to increase confidence without hitting rate limits. '
            'Persist the token registry to a lightweight SQLite or Supabase table to eliminate cold-start latency. '
            'Add a health-check endpoint that verifies exchange connectivity on startup. '
            'Consider adding a fourth strategy for flash-loan-based arbitrage to expand opportunity detection.'
        ),
    },
    {
        'name': 'backtest',
        'files': 8,
        'purpose': (
            'The backtest domain provides VIXOR with an in-house candle-by-candle strategy simulation engine. Unlike third-party '
            'backtesting libraries, this engine was built specifically for the platform and supports position state machines with '
            'protective stops, trailing stops, and multi-timeframe analysis. The simulator walks through historical candle data, '
            'applying strategy entry/exit logic while tracking positions, computing performance metrics including Sharpe ratio, '
            'Sortino ratio, maximum drawdown, and CAGR. The candle-path module optimizes data packing for performance during '
            'long backtest runs. This domain is a critical dependency for the experiment domain and the strategy domain.'
        ),
        'file_list': (
            'engine/simulator.ts, engine/state-machine.ts, engine/metrics.ts, '
            'engine/candle-path.ts, engine/types.ts, engine/index.ts, '
            'functions.ts, engine/simulator.test.ts'
        ),
        'dependencies': (
            'Imports from: market (static). Imported by: analysis, experiment, strategy (3 domains).'
        ),
        'coupling': 'Low — depends only on market for price data. Exports are used by 3 domains but mostly for types and the compileStrategy utility. Clean one-directional flow.',
        'cohesion': 'Very High — every file contributes to the single purpose of strategy simulation. The engine/ subdirectory is a self-contained unit.',
        'score': 8,
        'problems': [
            ['D-BT01','P1','Single test file for 8-module domain','Only simulator.test.ts exists; state-machine, metrics, candle-path untested','Medium','engine/simulator.test.ts','Rapid development left testing gaps'],
            ['D-BT02','P2','No slippage or fee modeling','Simulator assumes zero slippage and zero fees, inflating backtest returns','High','engine/simulator.ts, engine/types.ts','Simplified first version never enhanced'],
            ['D-BT03','P2','Candle-path optimization unbenchmarked','No benchmarks prove candle-path actually improves performance','Low','engine/candle-path.ts','Optimization added without measurement'],
        ],
        'recommendations': (
            'Add slippage and commission modeling to the simulator with configurable parameters (fixed, percentage, or volume-based). '
            'Write unit tests for state-machine transitions and metrics calculations — these are deterministic and easy to test. '
            'Benchmark candle-path with a before/after comparison using a 10,000-candle dataset. '
            'Add walk-forward analysis support to prevent overfitting in strategy optimization. '
            'Export a clear public API from index.ts documenting which functions are stable vs. internal.'
        ),
    },
    {
        'name': 'broker',
        'files': 3,
        'purpose': (
            'The broker domain manages external broker connection configurations and credentials, allowing VIXOR users '
            'to link their trading accounts. It provides server functions for creating, listing, and deleting broker connections, '
            'storing encrypted credentials securely. This is a foundational domain for the broader trading infrastructure, '
            'bridging the gap between VIXOR analytics and actual trade execution through external brokers. The domain is '
            'deliberately small and focused, handling only the CRUD aspect of broker connection management rather than '
            'the actual order routing, which lives in the trading/gateway subdomain.'
        ),
        'file_list': 'functions.ts, index.ts, types.ts',
        'dependencies': (
            'Imports from: None (leaf domain). Imported by: None currently, but designed to feed trading/gateway.'
        ),
        'coupling': 'None — fully isolated leaf domain with no cross-domain imports or consumers yet.',
        'cohesion': 'Very High — all 3 files serve the single purpose of broker connection CRUD. Minimal and focused.',
        'score': 7,
        'problems': [
            ['D-BR01','P1','No integration with trading/gateway','Broker connections stored but not consumed by exchange adapters in trading/gateway','High','functions.ts, trading/gateway/adapters/*.ts','Domains built separately without integration plan'],
            ['D-BR02','P2','Credential encryption not verified','No tests confirm that stored credentials are properly encrypted at rest','Medium','functions.ts','Encryption implementation not validated'],
            ['D-BR03','P2','No broker health check','No mechanism to verify stored broker credentials are still valid','Low','functions.ts','Health validation not implemented'],
        ],
        'recommendations': (
            'Build a bridge service that connects broker credentials to the trading/gateway adapter system, enabling users to '
            'select a stored broker when placing trades. Add end-to-end tests that verify credential encryption round-trips. '
            'Implement a periodic health check that attempts a read-only API call to each stored broker connection. '
            'Add support for OAuth-based broker authentication in addition to API key/secret pairs. '
            'Consider adding a connection audit log to track when credentials were last used or verified.'
        ),
    },
    {
        'name': 'chart-intelligence',
        'files': 5,
        'purpose': (
            'The chart-intelligence domain ensures that VIXOR analysis is grounded in real market data rather than AI-hallucinated '
            'values. It operates in two primary modes: session mode, which extracts structured chart data from the TradingView widget '
            'via JavaScript bridge, and vision mode, which uses image analysis to extract candle patterns from screenshots. This domain '
            'is a critical trust layer in the system, providing confidence scores that downstream consumers (analysis, chart-truth, copilot) '
            'use to weight their decisions. The chart-session module manages TradingView widget lifecycle, while chart-vision implements '
            'the image-to-data extraction pipeline. Chart-validation provides confidence thresholds and chart-context defines the shared '
            'data contract.'
        ),
        'file_list': (
            'chart-context.ts, chart-vision.ts, chart-validation.ts, chart-session.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: analysis (static), chart-truth (static), copilot (dynamic).'
        ),
        'coupling': 'Low — leaf domain with no incoming dependencies. Exports are consumed by 3 domains but via clean type imports.',
        'cohesion': 'Very High — all 5 files revolve around the single concept of ensuring data integrity for chart analysis.',
        'score': 8,
        'problems': [
            ['D-CI01','P1','Vision mode accuracy unmeasured','No quantitative benchmarks for chart-vision extraction accuracy','Medium','chart-vision.ts','Vision pipeline lacks evaluation dataset'],
            ['D-CI02','P2','No fallback when session mode fails','If TradingView widget fails to initialize, no graceful degradation path exists','Medium','chart-session.ts','Error handling returns failure without alternative'],
        ],
        'recommendations': (
            'Create a labeled dataset of 100+ chart images with ground-truth OHLCV values and measure extraction accuracy. '
            'Implement a fallback chain: session mode > cached last-known data > user manual entry, so analysis never fully blocks. '
            'Add WebSocket-based real-time data validation that cross-checks extracted prices against live feeds. '
            'Consider adding support for multi-timeframe chart context extraction from a single image.'
        ),
    },
    {
        'name': 'chart-truth',
        'files': 5,
        'purpose': (
            'The chart-truth domain provides a post-extraction validation layer that cross-references chart-intelligence output '
            'against real-time market prices. It computes a truth score that quantifies how closely the vision-extracted or session-extracted '
            'data matches actual market conditions. This domain runs after chart-intelligence validation and before the main analysis pipeline, '
            'serving as a quality gate. Critically, it is designed to never block analysis — it only warns when data quality is suspect, '
            'allowing the system to remain operational even with imperfect data. The market-truth service orchestrates the validation, '
            'truth-score engine computes the numerical score, and price-reconciler attempts to correct minor discrepancies.'
        ),
        'file_list': (
            'market-truth.service.ts, truth-score.engine.ts, price-reconciler.ts, types.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: chart-intelligence (static), market (static). Imported by: analysis (dynamic).'
        ),
        'coupling': 'Low — depends on two leaf domains (chart-intelligence, market). Only consumed by analysis via dynamic import.',
        'cohesion': 'Very High — every file contributes to the singular mission of data truth verification.',
        'score': 8,
        'problems': [
            ['D-CT01','P2','Truth score thresholds hardcoded','No configuration for adjusting truth score sensitivity per asset class','Low','truth-score.engine.ts','Thresholds defined as constants not config'],
            ['D-CT02','P2','Price reconciler limited to linear adjustments','Only simple linear interpolation for price correction; no multi-source averaging','Low','price-reconciler.ts','Simple implementation for MVP'],
        ],
        'recommendations': (
            'Make truth score thresholds configurable per asset class (crypto vs. forex vs. equities have different volatility profiles). '
            'Enhance the price reconciler to support weighted multi-source averaging when multiple price feeds are available. '
            'Add a truth score history table to track data quality trends over time, enabling detection of systematic issues. '
            'Consider exposing truth scores in the UI so users can see the confidence level of their analysis.'
        ),
    },
    {
        'name': 'copilot',
        'files': 17,
        'purpose': (
            'The copilot domain is VIXOR conversational AI layer, implementing a multi-agent chat system that serves as the primary '
            'user interface for intelligent trading assistance. It features two generations of AI agents: the original four agents '
            '(market_analyst, risk_manager, news_analyst, strategy_builder) and the newer VIXOR AI agents (coach for pre-trade sentiment, '
            'analyst for behavioral reports, governor for risk decisions, hunter for smart money signals). The agent orchestrator manages '
            'parallel agent execution and consensus building. Conversations are persisted to Supabase, and a decision store records '
            'key AI-driven decisions with feedback loops for continuous improvement. This is the most user-facing domain and has the '
            'broadest set of type imports from other domains.'
        ),
        'file_list': (
            'functions.ts, types.ts, index.ts, conversations.ts, '
            'server/agents.ts, server/agent-orchestrator.ts, server/copilot-agent.ts, '
            'server/coach.agent.ts, server/analyst.agent.ts, server/governor.agent.ts, '
            'server/hunter.agent.ts, server/decision-store.ts, server/feedback.ts'
        ),
        'dependencies': (
            'Imports from: analysis (static types), trading (static types), user (static types), watchlist (static types), '
            'market (static types), chart-intelligence (dynamic). Imported by: None.'
        ),
        'coupling': 'High — imports types from 5 domains and dynamically loads chart-intelligence. As the top of the dependency graph, it aggregates data from across the entire system. Any domain API change potentially breaks copilot.',
        'cohesion': 'Moderate — the agent system is cohesive, but the domain mixes concerns: conversation CRUD, agent execution, decision persistence, and feedback collection could be better separated.',
        'score': 6,
        'problems': [
            ['D-CO01','P0','Duplicate agent definitions','AgentId and AgentDefinition defined identically in both types.ts and server/agents.ts','High','types.ts, server/agents.ts','Organic growth without DRY enforcement'],
            ['D-CO02','P1','Two generations of agents coexist','Original 4 agents and new 4 agents serve overlapping purposes, causing confusion','Medium','server/agents.ts, server/*.agent.ts','Migration incomplete; old agents not deprecated'],
            ['D-CO03','P1','No agent performance metrics','No tracking of response quality, latency, or consensus accuracy per agent','Medium','server/agent-orchestrator.ts, server/feedback.ts','Observability not prioritized'],
            ['D-CO04','P2','Decision store lacks analytics','Decisions stored but no aggregation or trend analysis exposed','Low','server/decision-store.ts','Storage-first approach without query layer'],
            ['D-CO05','P1','Conversation history unbounded','No pagination or pruning strategy for long conversation threads','Medium','conversations.ts','MVP left growth limits unaddressed'],
        ],
        'recommendations': (
            'Eliminate duplicate type definitions by consolidating all agent types into types.ts and importing from there. '
            'Complete the agent migration by deprecating the original 4 agents and redirecting their use cases to the new VIXOR AI agents. '
            'Add per-agent performance dashboards tracking latency, consensus participation rate, and user satisfaction scores. '
            'Implement conversation pruning with a configurable max-turns policy and summarize-then-continue pattern. '
            'Extract decision analytics into a dedicated service with aggregated reporting. '
            'Consider splitting this domain into copilot/core, copilot/agents, and copilot/conversations.'
        ),
    },
    {
        'name': 'daily-loop',
        'files': 3,
        'purpose': (
            'The daily-loop domain implements a structured daily trading routine system that guides traders through morning '
            'preparation, active session tracking (London, New York, Asian sessions), and end-of-day review. It maintains a '
            'daily state machine for each user, tracking which session phases have been completed. The domain also includes '
            'streak tracking that rewards consistent daily engagement, gamifying the trading discipline process. This is a '
            'behavioral domain designed to build good trading habits through structured daily workflows and positive reinforcement '
            'mechanisms. The market bias field allows users to record their daily directional assessment, building a journal of '
            'accuracy over time.'
        ),
        'file_list': 'functions.ts, types.ts, index.ts',
        'dependencies': (
            'Imports from: None (leaf). Imported by: None.'
        ),
        'coupling': 'None — fully isolated leaf domain.',
        'cohesion': 'Very High — all 3 files serve the daily trading routine concept exclusively.',
        'score': 8,
        'problems': [
            ['D-DL01','P2','Streak calculation not timezone-aware','Streak breaks based on server time, not user local time','Medium','functions.ts','No user timezone preference stored'],
            ['D-DL02','P2','No session overlap handling','London/NY overlap period not treated as a distinct session phase','Low','types.ts, functions.ts','Session model simplified for MVP'],
        ],
        'recommendations': (
            'Store user timezone preferences and compute streak boundaries based on their local midnight. '
            'Add a distinct overlap session type for the London/NY overlap (13:00-17:00 UTC) which is often the most volatile period. '
            'Consider adding a weekly review summary that aggregates daily-loop completion rates. '
            'Add push notification reminders for incomplete daily-loop phases based on session open times.'
        ),
    },
    {
        'name': 'debate',
        'files': 7,
        'purpose': (
            'The debate domain implements a multi-agent cross-validation system where four specialized AI agents (Analyst, Strategist, '
            'RiskGuard, and Contrarian) evaluate analysis results from different perspectives and vote on whether to approve, modify, '
            'or reject a trading signal. The RiskGuard agent holds the highest authority and can veto any signal regardless of other votes. '
            'This opt-in feature, enabled via ENABLE_DEBATE_ENGINE=true, provides an additional safety layer between signal generation and '
            'trade execution. The weighted voting system combines agent perspectives into a final consensus with confidence scores. The '
            'Contrarian agent deliberately argues against the primary analysis, ensuring that bullish biases are challenged.'
        ),
        'file_list': (
            'engine/debate.engine.ts, agents/analyst.agent.ts, agents/strategist.agent.ts, '
            'agents/risk-guard.agent.ts, agents/contrarian.agent.ts, types.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: analysis (static, type only). Imported by: analysis (dynamic).'
        ),
        'coupling': 'Very Low — depends only on analysis types. The circular dynamic import (analysis loads debate, debate imports analysis types) is safe because it is await-based.',
        'cohesion': 'Very High — every file contributes to the debate/validation concept. Clean agent/engine separation.',
        'score': 8,
        'problems': [
            ['D-DB01','P2','No agent specialization tests','Cannot verify that each agent actually provides a distinct perspective','Medium','agents/*.agent.ts','LLM-based agents hard to unit test'],
            ['D-DB02','P2','Voting weights not configurable','RiskGuard veto power and agent weights are hardcoded','Low','engine/debate.engine.ts','Configuration not exposed to users'],
        ],
        'recommendations': (
            'Create recorded LLM response fixtures for each agent to verify they produce differentiated perspectives. '
            'Make voting weights configurable via user preferences or a strategy-level configuration object. '
            'Add debate history logging to track how often signals are modified or rejected and by which agent. '
            'Consider adding a fifth agent (Sentiment Agent) that incorporates social media sentiment data.'
        ),
    },
    {
        'name': 'discover',
        'files': 19,
        'purpose': (
            'The discover domain (combining discovery/ with discover/) is VIXOR token discovery engine, designed to surface '
            'early-stage tokens before they gain mainstream attention. It implements a multi-stage scoring pipeline that filters '
            'new trading pairs, analyzes liquidity depth, evaluates smart money activity, measures social velocity, and combines '
            'all signals into a composite discovery score. The domain integrates with six external data providers — DexScreener, Birdeye, '
            'Helius, LunarCrush, Mobula, and Twitter — each accessed through dedicated client modules. This makes it the most '
            'externally-connected domain in the system. The scoring algorithm balances multiple factors to reduce false positives while '
            'maintaining high recall for genuine early opportunities.'
        ),
        'file_list': (
            'discovery/scoring.ts, discovery/types.ts, discovery/server.ts, discovery/config.ts, '
            'discovery/constants.ts, discovery/functions.ts, discovery/index.ts, '
            'discovery/clients/dexscreener.client.ts, discovery/clients/birdeye.client.ts, '
            'discovery/clients/helius.client.ts, discovery/clients/lunarcrush.client.ts, '
            'discovery/clients/mobula.client.ts, discovery/clients/twitter.client.ts, '
            'discovery/clients/index.ts, discovery/tests/config.test.ts, discovery/tests/scoring.test.ts, '
            'discover/dexscreener-client.ts, discover/discover-crypto-data.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: None. Fully self-contained.'
        ),
        'coupling': 'Very Low — leaf domain with no cross-domain dependencies. However, it has high external coupling to 6 API providers, making it sensitive to external API changes.',
        'cohesion': 'Moderate — the discovery/ subdomain is well-organized, but the legacy discover/ directory duplicates some functionality (DexScreener client), reducing overall cohesion.',
        'score': 5,
        'problems': [
            ['D-DS01','P0','Duplicate discover directories','discover/ and discovery/ both exist with overlapping DexScreener clients','High','discover/*.ts, discovery/clients/dexscreener.client.ts','Legacy directory not cleaned up during rename'],
            ['D-DS02','P1','Six external clients with no circuit breakers','If any external API goes down, discovery scoring degrades silently','Medium','discovery/clients/*.ts','No resilience pattern implemented'],
            ['D-DS03','P1','Scoring weights not user-configurable','Composite score weights are hardcoded in constants','Medium','discovery/constants.ts, discovery/scoring.ts','No user preference system for weights'],
            ['D-DS04','P2','No deduplication across providers','Same token can appear multiple times from different data sources','Medium','discovery/scoring.ts','Dedup logic not implemented in pipeline'],
            ['D-DS05','P2','Rate limiting only in constants','Rate limits defined but not enforced at runtime','High','discovery/constants.ts, discovery/clients/*.ts','Constants defined but no middleware enforces them'],
        ],
        'recommendations': (
            'CRITICAL: Consolidate discover/ into discovery/ by migrating any unique logic and removing duplicates. This is the '
            'highest priority cleanup task for this domain. Add circuit breakers to each external client using the shared resilience '
            'module. Make scoring weights configurable through user preferences stored in Supabase. Implement token deduplication '
            'using a canonical address normalization step early in the pipeline. Enforce rate limits at the client level using '
            'the existing shared rate-limiter utility. Add a provider health dashboard to monitor API availability.'
        ),
    },
    {
        'name': 'experiment',
        'files': 5,
        'purpose': (
            'The experiment domain implements evolutionary strategy optimization through multi-generational backtesting with '
            'LLM-guided mutations. It takes a base trading strategy and evolves it over multiple generations, using AI to suggest '
            'parameter modifications based on the results of previous generations. Each generation runs a full backtest, and the '
            'best-performing variants are selected for further mutation. This creates a Darwinian optimization loop that can discover '
            'non-obvious parameter combinations. The prompts module provides structured templates for LLM interactions, ensuring '
            'consistent and reproducible mutation suggestions. The evolution engine manages selection pressure, mutation rates, and '
            'convergence detection to prevent infinite loops or premature convergence.'
        ),
        'file_list': 'evolution.ts, runner.ts, prompts.ts, functions.ts, index.ts',
        'dependencies': (
            'Imports from: analysis (static), backtest (static), market (static), strategy (static). Imported by: None.'
        ),
        'coupling': 'Moderate — depends on 4 domains but only for their core functions (runAnalysis, runBacktest, etc.). As a terminal node, it does not create downstream coupling.',
        'cohesion': 'High — all files serve the evolutionary optimization concept. Clean separation between evolution logic, execution running, and LLM prompt engineering.',
        'score': 7,
        'problems': [
            ['D-EX01','P1','No convergence detection','Evolution loop could run indefinitely without stopping criteria','High','evolution.ts, runner.ts','Stopping conditions not implemented'],
            ['D-EX02','P1','LLM mutation cost unbounded','Each generation consumes LLM tokens with no budget limit','High','prompts.ts, runner.ts','No cost tracking or token budget'],
            ['D-EX03','P2','Single-point strategy seeding','Always starts from one base strategy rather than a diverse population','Medium','evolution.ts','Population diversity not prioritized'],
        ],
        'recommendations': (
            'Implement convergence detection based on fitness score stagnation (e.g., stop if best score has not improved for 3 generations). '
            'Add a configurable LLM token budget with per-generation allocation and total spend limits. '
            'Support multi-strategy seeding to maintain population diversity and avoid local optima. '
            'Add experiment result persistence to compare optimization runs over time. '
            'Consider adding a visualization of the fitness landscape across generations.'
        ),
    },
    {
        'name': 'market',
        'files': 7,
        'purpose': (
            'The market domain is VIXOR foundational data layer, responsible for fetching and normalizing external market data. '
            'It provides price data from Binance and TwelveData, news aggregation, economic calendar events, OHLCV kline data, '
            'ETF information, and fundamental data. As the most depended-upon domain in the system (imported by 7 other domains), '
            'it serves as the single source of truth for all market data. The price-fetcher module handles real-time and historical '
            'price retrieval with caching, while the news and economic-calendar modules provide context for trading decisions. '
            'This domain is a leaf with no incoming dependencies, making it the ideal starting point for any data flow analysis.'
        ),
        'file_list': (
            'functions.ts, types.ts, index.ts, server/price-fetcher.ts, '
            'server/news.ts, server/economic-calendar.ts, server/twelvedata.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: analysis, backtest, chart-truth, copilot, debate, experiment, trading (7 domains).'
        ),
        'coupling': 'High outgoing coupling — exported by 7 domains. Any breaking change to its API has system-wide impact. However, incoming coupling is zero.',
        'cohesion': 'High — all files serve market data retrieval. Clear separation by data type (prices, news, calendar, klines).',
        'score': 7,
        'problems': [
            ['D-MK01','P1','No data freshness indicator','Consumers cannot tell how stale cached market data is','Medium','server/price-fetcher.ts, types.ts','No timestamp propagation in response types'],
            ['D-MK02','P2','Dual price sources without failover','Binance and TwelveData used but no automatic failover if one fails','High','server/price-fetcher.ts, server/twelvedata.ts','Failover logic not implemented'],
            ['D-MK03','P2','News module basic','News aggregation lacks sentiment analysis or source reliability scoring','Low','server/news.ts','MVP implementation for news'],
        ],
        'recommendations': (
            'Add a DataFreshness metadata field to all market data responses indicating source timestamp and cache age. '
            'Implement automatic failover between Binance and TwelveData with configurable preference order. '
            'Enhance the news module with basic sentiment scoring and source reliability ratings. '
            'Add a unified caching layer with configurable TTL per data type. '
            'Consider adding a WebSocket-based real-time price push system to reduce polling overhead.'
        ),
    },
    {
        'name': 'moxi',
        'files': 8,
        'purpose': (
            'The moxi domain implements VIXOR AI persona system, providing customizable AI trading assistants with distinct '
            'personalities and expertise areas. Unlike the copilot domain which provides a fixed set of agents, moxi allows users '
            'to create and configure their own AI personas with custom prompts, tool access, and behavioral parameters. The persona '
            'module defines the persona data model and persistence, while the context-engine manages conversation context and memory. '
            'The tools module maps available tools to persona capabilities, and the notification-hub handles async notifications from '
            'personas. The prompt module provides template-based prompt construction with variable substitution. This domain represents '
            'VIXOR approach to personalization, letting traders build AI assistants tailored to their specific trading style.'
        ),
        'file_list': (
            'persona.ts, context-engine.ts, tools.ts, notification-hub.ts, '
            'prompt.ts, functions.ts, types.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: None currently.'
        ),
        'coupling': 'None — fully isolated leaf domain with no cross-domain connections yet.',
        'cohesion': 'High — all files contribute to the AI persona concept. Clear separation between persona definition, context management, and tool mapping.',
        'score': 6,
        'problems': [
            ['D-MX01','P1','Not integrated with copilot','Moxi personas exist but are not accessible through the copilot chat interface','High','persona.ts, copilot/server/agent-orchestrator.ts','Domains developed in parallel without integration'],
            ['D-MX02','P2','Context engine has no memory limits','Conversation context can grow unbounded, consuming LLM tokens','Medium','context-engine.ts','No sliding window or summarization'],
            ['D-MX03','P2','Tool access not enforced','Persona tool configuration exists but runtime enforcement is incomplete','Medium','tools.ts, persona.ts','Policy enforcement gap'],
            ['D-MX04','P2','No persona templates','Users must build personas from scratch; no starter templates provided','Low','persona.ts','Template system not implemented'],
        ],
        'recommendations': (
            'Integrate moxi personas as selectable profiles in the copilot chat interface, allowing users to switch between '
            'personas mid-conversation. Implement a sliding window context manager with configurable token budgets and automatic '
            'summarization for older context. Enforce tool access policies at runtime using a capability-based security model. '
            'Provide 5-10 starter persona templates (Day Trader, Swing Trader, Risk Manager, etc.) that users can customize. '
            'Add persona performance analytics to track which personas produce the best trading outcomes.'
        ),
    },
    {
        'name': 'notes',
        'files': 3,
        'purpose': (
            'The notes domain provides a simple CRUD-based trading journal note system, allowing users to record thoughts, '
            'observations, and emotional states (mood tracking) alongside their trading activity. Notes can be filtered by trading '
            'pair or associated with a specific analysis run, creating a link between emotional state and trading performance. '
            'The mood field enables sentiment tracking over time, helping traders identify emotional patterns that affect their '
            'decision-making. This is a deliberately small domain that maps to a single database table pattern, following the '
            'VIXOR convention of keeping simple CRUD domains lightweight and focused.'
        ),
        'file_list': 'functions.ts, types.ts, index.ts',
        'dependencies': (
            'Imports from: None (leaf). Imported by: None.'
        ),
        'coupling': 'None — fully isolated leaf domain.',
        'cohesion': 'Very High — minimal domain with perfect single-responsibility alignment.',
        'score': 9,
        'problems': [
            ['D-NT01','P2','No note search or full-text indexing','Users cannot search across their journal notes','Low','functions.ts','Basic CRUD only, no search feature'],
        ],
        'recommendations': (
            'Add full-text search across notes using Supabase text search or PostgreSQL tsvector. '
            'Consider adding tag support for better note categorization beyond pair/analysis association. '
            'Add a weekly mood summary chart to help traders visualize emotional patterns.'
        ),
    },
    {
        'name': 'paper-trading',
        'files': 5,
        'purpose': (
            'The paper-trading domain enables risk-free strategy testing by simulating trades with virtual capital. Unlike the '
            'backtest domain which operates on historical data, paper-trading runs in real-time against live market conditions. '
            'The paper engine processes simulated orders, tracks virtual portfolio positions, and maintains a trade ledger of all '
            'paper trades executed. The trade ledger module provides a detailed audit trail of entries, exits, and PnL calculations, '
            'allowing users to evaluate strategy performance without financial risk. This domain bridges the gap between backtesting '
            'and live trading, providing a crucial validation step in the strategy deployment pipeline.'
        ),
        'file_list': (
            'engine/paper.engine.ts, ledger/trade-ledger.ts, functions.ts, types.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: None explicitly, but likely depends on market for live prices. Imported by: None.'
        ),
        'coupling': 'Low — no declared cross-domain dependencies, though likely needs market prices at runtime.',
        'cohesion': 'High — all files serve the paper trading simulation concept.',
        'score': 7,
        'problems': [
            ['D-PT01','P1','No shared code with backtest engine','Paper engine and backtest engine have duplicated position/trade logic','Medium','engine/paper.engine.ts, backtest/engine/simulator.ts','Engines built independently without code sharing'],
            ['D-PT02','P2','No reset or snapshot functionality','Cannot reset paper trading account or take snapshots at milestones','Low','functions.ts, engine/paper.engine.ts','Feature not yet implemented'],
            ['D-PT03','P2','No performance comparison with backtest','Cannot compare paper trading results against backtest projections','Medium','engine/paper.engine.ts','No cross-domain analytics pipeline'],
        ],
        'recommendations': (
            'Extract shared position management and PnL calculation logic into a common module usable by both backtest and paper-trading. '
            'Add account reset and milestone snapshot features to the paper trading engine. '
            'Build a comparison dashboard that overlays paper trading results with backtest projections for the same strategy. '
            'Add realistic slippage modeling to paper trades based on historical order book data.'
        ),
    },
    {
        'name': 'risk-governor',
        'files': 4,
        'purpose': (
            'The risk-governor domain provides a centralized risk management layer for VIXOR, implementing configurable risk rules '
            'that govern trading behavior. The governor engine evaluates proposed trades against a set of risk rules (position sizing '
            'limits, drawdown limits, daily loss limits) and can approve, reject, or modify trade parameters. This domain acts as '
            'a safety net that sits between signal generation and trade execution, ensuring that no single trade or series of trades '
            'can cause catastrophic portfolio damage. The risk rules module provides a declarative configuration system where risk '
            'parameters can be adjusted without code changes. This domain complements the debate domain risk-guard agent by providing '
            'a programmatic (non-LLM) risk assessment path.'
        ),
        'file_list': (
            'engine/governor.engine.ts, rules/risk-rules.ts, types.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: None currently (planned integration with trading).'
        ),
        'coupling': 'None — fully isolated leaf domain designed for future integration.',
        'cohesion': 'Very High — every file contributes to risk governance. Clean engine/rules separation.',
        'score': 7,
        'problems': [
            ['D-RG01','P0','Not integrated with trading pipeline','Risk governor exists but is not called before trade execution','High','engine/governor.engine.ts, trading/functions.ts','Built as standalone module without wiring'],
            ['D-RG02','P2','Limited rule types','Only basic position size and drawdown rules; no correlation or concentration rules','Medium','rules/risk-rules.ts','MVP scope limited to essential rules'],
        ],
        'recommendations': (
            'CRITICAL: Wire the risk governor into the trading execution pipeline so every trade passes through risk assessment. '
            'Add portfolio correlation rules to prevent over-concentration in correlated assets. '
            'Implement dynamic position sizing based on account equity and volatility. '
            'Add a risk dashboard showing current rule status and recent governance decisions. '
            'Consider making the governor configurable per-strategy rather than globally.'
        ),
    },
    {
        'name': 'signal-tracking',
        'files': 3,
        'purpose': (
            'The signal-tracking domain monitors the lifecycle of trading signals generated by the analysis pipeline. It tracks '
            'each signal from generation through to its outcome (take-profit hit, stop-loss hit, expired, or still active). The domain '
            'periodically evaluates signal status by comparing current prices against signal targets, and sends notifications when '
            'a signal status changes. This provides users with automated monitoring of their analysis-based trade ideas without requiring '
            'manual price checking. The signal status state machine is simple but effective: pending, active, tp_hit, sl_hit, expired. '
            'This domain is a leaf with no dependencies, making it easy to test and maintain independently.'
        ),
        'file_list': 'functions.ts, types.ts, index.ts',
        'dependencies': (
            'Imports from: None (leaf). Imported by: None.'
        ),
        'coupling': 'None — fully isolated leaf domain.',
        'cohesion': 'Very High — minimal domain with perfect alignment to signal lifecycle management.',
        'score': 8,
        'problems': [
            ['D-ST01','P2','Status evaluation not event-driven','Signal status checked via polling rather than price event triggers','Medium','functions.ts','No WebSocket integration for real-time updates'],
            ['D-ST02','P2','No signal performance analytics','Cannot analyze historical signal accuracy or average time-to-resolution','Low','functions.ts, types.ts','Analytics layer not built'],
        ],
        'recommendations': (
            'Migrate from polling to event-driven status evaluation using the shared market-data WebSocket system. '
            'Add signal performance analytics tracking hit rate, average time to TP/SL, and accuracy by timeframe/pair. '
            'Consider adding partial fill tracking for signals that reach intermediate profit targets.'
        ),
    },
    {
        'name': 'strategy',
        'files': 6,
        'purpose': (
            'The strategy domain provides the runtime compilation and execution environment for user-defined trading strategies. '
            'Strategies are written in a scripting language and compiled into executable functions within a sandboxed StrategyContext. '
            'The script-runtime module handles parsing, compilation, and safe execution, while indicator-params provides a structured '
            'system for defining and validating indicator parameters. The runtime types define the contract between strategy code and '
            'the execution engine, ensuring that strategies can only access approved APIs (indicators, orders, position queries). This '
            'sandboxing approach prevents user strategies from accessing system resources or making network calls, maintaining '
            'security while enabling flexible strategy expression.'
        ),
        'file_list': (
            'runtime/script-runtime.ts, runtime/indicator-params.ts, runtime/types.ts, '
            'runtime/index.ts, runtime/script-runtime.test.ts, index.ts'
        ),
        'dependencies': (
            'Imports from: backtest (static, types only). Imported by: experiment (static).'
        ),
        'coupling': 'Very Low — depends only on backtest types. Clean one-directional flow to experiment.',
        'cohesion': 'Very High — all files serve the strategy compilation and execution concept.',
        'score': 8,
        'problems': [
            ['D-SR01','P1','Sandbox escape risk','Script runtime must be thoroughly audited for code injection vectors','High','runtime/script-runtime.ts','Custom scripting language needs security review'],
            ['D-SR02','P2','Limited indicator library','Only basic indicators available in StrategyContext','Medium','runtime/script-runtime.ts, runtime/indicator-params.ts','Indicator coverage incomplete'],
        ],
        'recommendations': (
            'Conduct a formal security audit of the script-runtime sandbox, focusing on prototype pollution, infinite loops, and memory exhaustion. '
            'Expand the indicator library to cover all indicators available in the analysis engine. '
            'Add strategy versioning and rollback support. Consider supporting a subset of TypeScript/JavaScript as the strategy '
            'language instead of a custom DSL, reducing maintenance burden.'
        ),
    },
    {
        'name': 'trades',
        'files': 3,
        'purpose': (
            'The trades domain manages the trade journal, recording individual trade outcomes including entry/exit prices, PnL, '
            'and R-multiples. It provides performance statistics aggregation and equity curve data points, enabling traders to '
            'visualize their account growth over time. This domain is distinct from trading (which handles live trade operations) '
            'and paper-trading (which handles simulated trades). Trades focuses purely on historical trade record keeping and '
            'performance analytics. The equity curve tracking allows users to identify periods of outperformance and '
            'underperformance, correlating them with market conditions or personal factors.'
        ),
        'file_list': 'functions.ts, types.ts, index.ts',
        'dependencies': (
            'Imports from: None (leaf). Imported by: None.'
        ),
        'coupling': 'None — fully isolated leaf domain.',
        'cohesion': 'Very High — minimal domain with perfect single-responsibility alignment.',
        'score': 9,
        'problems': [
            ['D-TR01','P2','No trade import/export','Cannot import trades from external brokers or export for tax reporting','Low','functions.ts','Import/export not implemented'],
        ],
        'recommendations': (
            'Add CSV import/export for trades to support broker migration and tax reporting workflows. '
            'Consider adding automatic trade journaling by integrating with the trading gateway execution confirmations. '
            'Add trade tagging for better categorization in performance analysis.'
        ),
    },
    {
        'name': 'trading',
        'files': 12,
        'purpose': (
            'The trading domain manages the operational aspects of trading: price alerts, daily signal generation, user strategy '
            'management, and exchange connectivity. It contains the agent-gateway subdomain which provides a unified abstraction '
            'layer over multiple exchanges (Binance, Bybit, OKX) through a generic adapter pattern. The gateway allows VIXOR to '
            'route orders to different exchanges without changing the calling code. Exchange adapters implement a common interface '
            'for order placement, cancellation, and position querying. The alert-checker module provides background monitoring of '
            'price conditions, triggering notifications when user-defined thresholds are breached. This domain is the bridge between '
            'VIXOR analytics and actual market execution.'
        ),
        'file_list': (
            'functions.ts, types.ts, index.ts, server/alert-checker.ts, '
            'gateway/functions.ts, gateway/types.ts, gateway/index.ts, gateway/agent-gateway.ts, '
            'gateway/adapters/index.ts, gateway/adapters/binance-adapter.ts, '
            'gateway/adapters/bybit-adapter.ts, gateway/adapters/okx-adapter.ts, '
            'gateway/adapters/ccxt-generic-adapter.ts, gateway/adapters/exness-adapter.ts, '
            'gateway/adapters/dummy-adapter.ts'
        ),
        'dependencies': (
            'Imports from: market (static), analysis (dynamic). Imported by: copilot (static, types only).'
        ),
        'coupling': 'Moderate — depends on market for prices and analysis for signals. The gateway subdomain has its own internal coupling pattern.',
        'cohesion': 'Moderate — the domain mixes two distinct concerns: alert/signal management and exchange gateway execution. These could be separate domains.',
        'score': 6,
        'problems': [
            ['D-TG01','P1','Mixed concerns in single domain','Alerts/signals and exchange gateway are conceptually distinct operations','Medium','functions.ts, gateway/*','Single domain grew to encompass two concerns'],
            ['D-TG02','P1','No adapter health monitoring','Exchange adapter failures are not detected or reported proactively','High','gateway/adapters/*.ts, gateway/agent-gateway.ts','No health check or circuit breaker pattern'],
            ['D-TG03','P1','Risk governor not wired in','Risk-governor domain exists but trades bypass it','High','gateway/agent-gateway.ts, risk-governor/engine/governor.engine.ts','Integration gap between domains'],
            ['D-TG04','P2','CCXT adapter incomplete','ccxt-generic-adapter.ts likely has limited exchange coverage','Medium','gateway/adapters/ccxt-generic-adapter.ts','Generic adapter not fully implemented'],
            ['D-TG05','P2','Alert checker is polling-based','Alert checking uses periodic polling instead of price event streams','Medium','server/alert-checker.ts','No WebSocket integration for alerts'],
        ],
        'recommendations': (
            'Extract the gateway/ subdomain into a standalone execution domain to separate concerns. Wire the risk-governor into the '
            'gateway order flow as a mandatory pre-execution check. Add health monitoring with automatic adapter disabling on repeated '
            'failures. Complete the CCXT generic adapter to support 50+ exchanges through the CCXT library. Migrate alert checking to '
            'event-driven architecture using WebSocket price streams. Add order retry logic with exponential backoff for transient failures.'
        ),
    },
    {
        'name': 'user',
        'files': 5,
        'purpose': (
            'The user domain manages user profiles, authentication (via Telegram), points/billing, premium subscriptions, '
            'referrals, and notification preferences. It handles the complete user lifecycle from Telegram-based sign-in through '
            'premium subscription management. The Telegram verification module validates init data from the Telegram auth flow, '
            'ensuring secure authentication without passwords. The points system tracks usage credits and billing, while the referral '
            'system incentivizes user acquisition through a reward mechanism. This domain is foundational — it provides the user context '
            'that copilot and other domains need to personalize their behavior.'
        ),
        'file_list': (
            'functions.ts, types.ts, index.ts, server/telegram-verify.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: copilot (static, types only).'
        ),
        'coupling': 'Very Low — leaf domain. Only consumed by copilot for user type information.',
        'cohesion': 'High — all files serve user management. Telegram verification is appropriately placed as a server sub-module.',
        'score': 8,
        'problems': [
            ['D-US01','P2','Single auth provider','Only Telegram auth supported; no email/password or OAuth alternatives','Medium','functions.ts, server/telegram-verify.ts','Telegram-only auth limits user acquisition'],
            ['D-US02','P2','Points system lacks audit trail','Points transactions logged but no detailed audit trail for disputes','Low','functions.ts','Basic transaction logging without audit detail'],
        ],
        'recommendations': (
            'Add email/password authentication as an alternative to Telegram for users who prefer traditional auth. '
            'Implement a detailed points transaction audit trail with dispute resolution support. '
            'Add Google/GitHub OAuth for developer users. Consider adding 2FA support for premium accounts. '
            'Add user activity logging for security monitoring and compliance.'
        ),
    },
    {
        'name': 'wallet',
        'files': 14,
        'purpose': (
            'The wallet domain provides Web3 wallet connectivity for VIXOR, supporting MetaMask, Phantom, and WalletConnect '
            'protocols. It is the only domain that contains both client-side React components and server-side code. The adapter '
            'subdirectory provides React UI components (WalletProvider, WalletConnectButton, WalletProviderSelector) that manage '
            'the wallet connection lifecycle. The adapters subdirectory provides low-level adapter libraries for each wallet type. '
            'Session management uses a challenge-response authentication pattern with EVM chain configuration. The server module '
            'handles signature verification and session creation. The domain supports multiple EVM chains with configurable RPC '
            'endpoints and chain-specific parameters.'
        ),
        'file_list': (
            'functions.ts, server.ts, config.ts, types.ts, index.ts, '
            'adapter/index.ts, adapter/WalletProvider.tsx, adapter/WalletConnectButton.tsx, '
            'adapter/WalletProviderSelector.tsx, adapters/index.ts, '
            'adapters/metamask-adapter.ts, adapters/phantom-adapter.ts, '
            'adapters/walletconnect-adapter.ts, adapters/telegram-adapter.ts, '
            'tests/session.test.ts, tests/config.test.ts'
        ),
        'dependencies': (
            'Imports from: None (leaf). Imported by: None.'
        ),
        'coupling': 'None — fully isolated leaf domain. However, it bridges client and server boundaries, which is a unique coupling pattern.',
        'cohesion': 'Moderate — mixing React components with server-side code reduces cohesion. The adapter/ and adapters/ naming is confusing.',
        'score': 6,
        'problems': [
            ['D-WL01','P1','Confusing adapter/adapters naming','adapter/ has React components, adapters/ has wallet libraries; naming collision','High','adapter/*.tsx, adapters/*.ts','Parallel naming creates developer confusion'],
            ['D-WL02','P1','Only client+server domain','Mixing React components and server code violates domain boundary conventions','Medium','adapter/*.tsx, server.ts','Unique pattern not shared by other domains'],
            ['D-WL03','P2','No Solana native support','Phantom adapter exists but Solana-specific functionality is limited','Medium','adapters/phantom-adapter.ts','EVM-focused implementation'],
            ['D-WL04','P2','Session management complex','Challenge-response pattern has multiple failure modes not well documented','Medium','server.ts, config.ts','Auth flow lacks error recovery documentation'],
        ],
        'recommendations': (
            'Rename adapter/ to components/ and adapters/ to providers/ to eliminate naming collision. '
            'Consider moving React components to the shared component library and keeping only server-side code in the domain. '
            'Add full Solana support to the Phantom adapter including transaction signing and token operations. '
            'Document all session failure modes and implement proper error recovery flows. '
            'Add a wallet balance aggregation service that combines balances across connected chains.'
        ),
    },
    {
        'name': 'watchlist',
        'files': 3,
        'purpose': (
            'The watchlist domain provides user watchlist management with CRUD operations, reordering support, and multiple '
            'named watchlists. Users can create custom lists of trading pairs they want to monitor, organize them into named '
            'groups (e.g., "DeFi Blue Chips", "Meme Coins", "Forex Majors"), and reorder items within each list. This is a '
            'foundational utility domain that feeds into the copilot for context-aware recommendations and the UI for dashboard '
            'customization. The domain follows the standard VIXOR 3-file pattern for simple CRUD domains, keeping the implementation '
            'lean and focused on its single responsibility of list management.'
        ),
        'file_list': 'functions.ts, types.ts, index.ts',
        'dependencies': (
            'Imports from: None (leaf). Imported by: copilot (static, types only).'
        ),
        'coupling': 'Very Low — leaf domain, only consumed by copilot for type information.',
        'cohesion': 'Very High — perfect single-responsibility alignment with minimal code surface.',
        'score': 9,
        'problems': [
            ['D-WA01','P2','No watchlist sharing','Users cannot share watchlists or import from other users','Low','functions.ts','Social features not implemented'],
        ],
        'recommendations': (
            'Add watchlist sharing via public links or direct user-to-user sharing. '
            'Implement watchlist templates for common trading themes (e.g., "Top 100 Crypto"). '
            'Add bulk import from CSV or text input for rapid watchlist population.'
        ),
    },
]

# ── Refactor Plan ──────────────────────────────────────────────────────────

REFACTOR_PLAN = [
    ('Phase 1: Critical Fixes', '16h', [
        'Consolidate discover/ into discovery/ (2h)',
        'Wire risk-governor into trading gateway (3h)',
        'Merge copilot duplicate agent definitions (1h)',
        'Add failover to market price-fetcher (2h)',
        'Integrate moxi personas with copilot (3h)',
        'Implement rate limiting in discovery clients (2h)',
        'Rename wallet adapter/adapters directories (1h)',
        'Add circuit breakers to exchange adapters (2h)',
    ]),
    ('Phase 2: Testing & Quality', '24h', [
        'Add unit tests for analysis engine (8h)',
        'Add tests for backtest state-machine and metrics (4h)',
        'Security audit strategy sandbox runtime (4h)',
        'Add slippage/fee modeling to backtest (3h)',
        'Create chart-vision accuracy benchmarks (3h)',
        'Add broker credential encryption tests (2h)',
    ]),
    ('Phase 3: Architecture', '20h', [
        'Extract trading/gateway into execution domain (4h)',
        'Extract shared position logic from backtest/paper-trading (3h)',
        'Split copilot into copilot/core, copilot/agents, copilot/conversations (5h)',
        'Add convergence detection to experiment (3h)',
        'Implement event-driven signal tracking (2h)',
        'Move wallet React components to shared UI (3h)',
    ]),
    ('Phase 4: Feature Completion', '16h', [
        'Add email/password auth to user domain (4h)',
        'Build persona templates for moxi (3h)',
        'Add multi-source averaging to price reconciler (2h)',
        'Implement trade import/export (2h)',
        'Add watchlist sharing (2h)',
        'Build provider health dashboard for discovery (3h)',
    ]),
    ('Phase 5: Observability', '12h', [
        'Add per-agent performance metrics to copilot (3h)',
        'Build debate history analytics (2h)',
        'Add data freshness indicators to market (2h)',
        'Create domain-level health check endpoints (3h)',
        'Build cross-domain dependency visualization (2h)',
    ]),
]

# ── PDF Build ──────────────────────────────────────────────────────────────

def build_pdf():
    output = '/home/z/my-project/download/VIXOR_Domain_Audit.pdf'
    os.makedirs(os.path.dirname(output), exist_ok=True)

    doc = TocDocTemplate(
        output, pagesize=A4,
        leftMargin=LM, rightMargin=RM, topMargin=TM, bottomMargin=BM,
        title='VIXOR Domain Audit', author='VIXOR Engineering',
        subject='Comprehensive domain-by-domain audit',
    )

    story = []
    avail_w = PAGE_W - LM - RM

    # ── Cover ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 35*mm))
    story.append(Paragraph('VIXOR', ParagraphStyle('CoverV', fontName='FreeSerif-Bold',
        fontSize=48, leading=54, textColor=C_ACCENT, alignment=TA_CENTER)))
    story.append(Paragraph('Domain Audit Report', ParagraphStyle('CoverSub', fontName='FreeSerif',
        fontSize=22, leading=28, textColor=C_PRIMARY, alignment=TA_CENTER, spaceAfter=8*mm)))
    story.append(Spacer(1, 5*mm))
    cover_line = Table([['']], colWidths=[60*mm], rowHeights=[0.8*mm])
    cover_line.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_ACCENT),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(cover_line)
    story.append(Spacer(1, 8*mm))
    story.append(Paragraph(
        'Comprehensive audit of all 23 VIXOR domains: purpose, architecture, '
        'dependencies, coupling analysis, cohesion assessment, scoring, '
        'identified problems, and actionable recommendations.',
        ParagraphStyle('CoverDesc', fontName='FreeSerif-Italic', fontSize=11,
            leading=16, textColor=C_MUTED, alignment=TA_CENTER, spaceAfter=4*mm)))
    story.append(Spacer(1, 12*mm))
    total_problems = sum(len(d['problems']) for d in DOMAINS)
    avg_score = sum(d['score'] for d in DOMAINS) / len(DOMAINS)
    story.append(Paragraph(
        f'23 Domains &nbsp;|&nbsp; {total_problems} Problems Identified &nbsp;|&nbsp; '
        f'Average Score: {avg_score:.1f}/10 &nbsp;|&nbsp; 88 Hours Refactor Plan',
        ParagraphStyle('CoverStats', fontName='DejaVuSans', fontSize=9,
            leading=13, textColor=C_INFO, alignment=TA_CENTER)))
    story.append(Spacer(1, 20*mm))
    story.append(Paragraph(
        'Generated by automated audit pipeline',
        ParagraphStyle('CoverFoot', fontName='FreeSerif-Italic', fontSize=9,
            leading=12, textColor=C_MUTED, alignment=TA_CENTER)))
    story.append(PageBreak())

    # ── TOC ─────────────────────────────────────────────────────────────
    story.append(H1('Table of Contents'))
    toc = TableOfContents()
    toc.levelStyles = [STY['toc_h1'], STY['toc_h2']]
    story.append(toc)
    story.append(PageBreak())

    # ── Executive Summary ───────────────────────────────────────────────
    story.append(H1('Executive Summary'))
    story.append(body(
        'This report presents a comprehensive domain-by-domain audit of the VIXOR trading platform, '
        'covering all 23 domains that comprise the system architecture. VIXOR is a sophisticated AI-powered '
        'trading platform that combines technical analysis, multi-agent AI systems, cross-exchange arbitrage, '
        'and Web3 wallet connectivity into a unified experience. The platform follows a domain-driven design '
        'philosophy with clear domain boundaries and a dependency graph that forms a clean Directed Acyclic Graph (DAG) '
        'with no circular dependencies.'
    ))
    story.append(body(
        'The audit evaluated each domain across six dimensions: purpose clarity, file organization, dependency health, '
        'coupling risk, internal cohesion, and overall quality score. A total of {total_problems} problems were identified '
        'across all domains, classified into three priority levels: P0 (critical, requiring immediate action), '
        'P1 (significant, requiring attention within the current sprint), and P2 (minor, suitable for backlog). '
        'The average domain quality score is {avg_score:.1f}/10, indicating a solid architectural foundation with '
        'specific areas requiring focused improvement.'.format(total_problems=total_problems, avg_score=avg_score)
    ))
    story.append(body(
        'Key findings include: the discovery domain has a critical duplicate directory issue that must be resolved; '
        'the risk-governor domain is built but not yet wired into the trading pipeline; the copilot domain has '
        'duplicate agent definitions and two coexisting agent generations that need consolidation; and the trading '
        'domain mixes exchange gateway concerns with alert/signal management. On the positive side, 13 of 23 domains '
        'are leaf domains with zero cross-domain dependencies, demonstrating excellent architectural isolation. '
        'The market domain, despite being the most depended-upon, maintains clean interfaces and zero incoming coupling.'
    ))
    story.append(body(
        'The refactor plan outlined in this report spans 88 hours across 5 phases, prioritizing critical fixes first, '
        'then testing and quality improvements, architectural restructuring, feature completion, and finally '
        'observability enhancements. Following this plan will raise the average domain score from {avg_score:.1f} to an '
        'estimated 8.5+, significantly improving maintainability, reliability, and developer experience.'.format(avg_score=avg_score)
    ))
    story.append(PageBreak())

    # ── Domain Sections ─────────────────────────────────────────────────
    for i, d in enumerate(DOMAINS):
        story.append(H1(f'Domain {i+1}: {d["name"]}'))
        story.append(muted(f'Files: {d["files"]} | Score: {d["score"]}/10 | Problems: {len(d["problems"])}'))
        story.append(Spacer(1, 2*mm))

        # Score box
        score_label = 'High Quality' if d['score'] >= 8 else ('Needs Work' if d['score'] >= 6 else 'At Risk')
        story.append(score_box(d['score'], score_label))
        story.append(Spacer(1, 4*mm))

        # Purpose
        story.append(H2('Purpose'))
        story.append(body(d['purpose']))

        # Files
        story.append(H2('Files'))
        story.append(muted(d['file_list']))

        # Dependencies
        story.append(H2('Dependencies'))
        story.append(body(d['dependencies']))

        # Coupling
        story.append(H2('Coupling Analysis'))
        story.append(body(d['coupling']))

        # Cohesion
        story.append(H2('Cohesion Analysis'))
        story.append(body(d['cohesion']))

        # Problems
        if d['problems']:
            story.append(H2('Identified Problems'))
            story.append(body(
                f'The following {len(d["problems"])} problems were identified in the {d["name"]} domain. '
                'Each problem is classified by priority (P0 = critical, P1 = significant, P2 = minor), '
                'with assessed impact, risk level, affected files, and root cause analysis.'
            ))
            story.append(problem_table(d['problems']))
            story.append(Spacer(1, 3*mm))

        # Recommendations
        story.append(H2('Recommendations'))
        story.append(body(d['recommendations']))

        story.append(PageBreak())

    # ── Domain Score Summary ────────────────────────────────────────────
    story.append(H1('Domain Score Summary'))
    story.append(body(
        'The following table provides a consolidated view of all 23 domain quality scores, ranked from highest to lowest. '
        'Scores are calculated based on purpose clarity, file organization, dependency health, coupling risk, and internal '
        'cohesion. Domains scoring 8+ are considered high quality with minimal intervention needed. Domains scoring 6-7 '
        'have notable issues that should be addressed in the near term. Domains scoring below 6 require immediate attention '
        'and significant refactoring effort.'
    ))

    sorted_domains = sorted(DOMAINS, key=lambda x: x['score'], reverse=True)
    summary_hdr = [
        Paragraph('<b>Rank</b>', STY['table_header']),
        Paragraph('<b>Domain</b>', STY['table_header']),
        Paragraph('<b>Files</b>', STY['table_header']),
        Paragraph('<b>Score</b>', STY['table_header']),
        Paragraph('<b>Problems</b>', STY['table_header']),
        Paragraph('<b>P0</b>', STY['table_header']),
        Paragraph('<b>P1</b>', STY['table_header']),
        Paragraph('<b>P2</b>', STY['table_header']),
        Paragraph('<b>Assessment</b>', STY['table_header']),
    ]
    summary_data = [summary_hdr]
    for rank, d in enumerate(sorted_domains, 1):
        p0 = sum(1 for p in d['problems'] if 'P0' in p[1])
        p1 = sum(1 for p in d['problems'] if 'P1' in p[1])
        p2 = sum(1 for p in d['problems'] if 'P2' in p[1])
        assessment = 'Excellent' if d['score'] >= 8 else ('Good' if d['score'] >= 7 else ('Fair' if d['score'] >= 6 else 'Needs Work'))
        clr_hex = SEM_SUCCESS if d['score'] >= 8 else (SEM_WARNING if d['score'] >= 6 else SEM_ERROR)
        score_cell = Paragraph(f'<font color="{clr_hex}"><b>{d["score"]}</b></font>', STY['table_cell_center'])
        summary_data.append([
            Paragraph(str(rank), STY['table_cell_center']),
            Paragraph(f'<b>{d["name"]}</b>', STY['table_cell']),
            Paragraph(str(d['files']), STY['table_cell_center']),
            score_cell,
            Paragraph(str(len(d['problems'])), STY['table_cell_center']),
            Paragraph(str(p0), STY['table_cell_center']),
            Paragraph(str(p1), STY['table_cell_center']),
            Paragraph(str(p2), STY['table_cell_center']),
            Paragraph(assessment, STY['table_cell']),
        ])

    summary_col_w = [10*mm, 28*mm, 12*mm, 14*mm, 14*mm, 10*mm, 10*mm, 10*mm, 28*mm]
    summary_tbl = Table(summary_data, colWidths=summary_col_w, repeatRows=1)
    summary_style = [
        ('BACKGROUND', (0,0), (-1,0), C_HEADER),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.4, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2*mm),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2*mm),
        ('LEFTPADDING', (0,0), (-1,-1), 1.5*mm),
        ('RIGHTPADDING', (0,0), (-1,-1), 1.5*mm),
    ]
    for idx in range(1, len(summary_data)):
        bg = C_STRIPE if idx % 2 == 0 else colors.white
        summary_style.append(('BACKGROUND', (0,idx), (-1,idx), bg))
    summary_tbl.setStyle(TableStyle(summary_style))
    story.append(summary_tbl)
    story.append(Spacer(1, 4*mm))

    # Summary stats
    p0_total = sum(1 for d in DOMAINS for p in d['problems'] if 'P0' in p[1])
    p1_total = sum(1 for d in DOMAINS for p in d['problems'] if 'P1' in p[1])
    p2_total = sum(1 for d in DOMAINS for p in d['problems'] if 'P2' in p[1])
    story.append(info_table([
        ('Total Domains', '23'),
        ('Total Files', str(sum(d['files'] for d in DOMAINS))),
        ('Average Score', f'{avg_score:.1f}/10'),
        ('Total Problems', str(total_problems)),
        ('P0 (Critical)', str(p0_total)),
        ('P1 (Significant)', str(p1_total)),
        ('P2 (Minor)', str(p2_total)),
        ('Leaf Domains', '13 (56% — excellent isolation)'),
        ('Circular Dependencies', '0 (clean DAG confirmed)'),
    ]))
    story.append(PageBreak())

    # ── Refactor Plan ───────────────────────────────────────────────────
    story.append(H1('Refactor Plan'))
    story.append(body(
        'The following refactor plan addresses all identified problems in priority order, organized into five phases. '
        'Each phase builds upon the previous one, ensuring that critical fixes are resolved before architectural changes. '
        'Total estimated effort is 88 hours, which can be distributed across multiple sprints. Phase 1 focuses on '
        'critical fixes that address P0 problems and high-risk P1 issues. Phase 2 establishes testing foundations. '
        'Phase 3 undertakes the architectural improvements that require the most careful planning. Phase 4 completes '
        'feature gaps identified during the audit. Phase 5 adds observability infrastructure for long-term maintenance.'
    ))

    for phase_name, hours, tasks in REFACTOR_PLAN:
        story.append(H2(f'{phase_name} ({hours})'))
        task_data = [[Paragraph('<b>#</b>', STY['table_header']),
                      Paragraph('<b>Task</b>', STY['table_header']),
                      Paragraph('<b>Hours</b>', STY['table_header'])]]
        for ti, task in enumerate(tasks, 1):
            m = re.match(r'^(.+?)\((\d+h)\)$', task)
            if m:
                task_name, task_hours = m.group(1).strip(), m.group(2)
            else:
                task_name, task_hours = task, '—'
            task_data.append([
                Paragraph(str(ti), STY['table_cell_center']),
                Paragraph(task_name, STY['table_cell']),
                Paragraph(task_hours, STY['table_cell_center']),
            ])
        task_tbl = Table(task_data, colWidths=[10*mm, 110*mm, 20*mm], repeatRows=1)
        task_style = [
            ('BACKGROUND', (0,0), (-1,0), C_HEADER),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('GRID', (0,0), (-1,-1), 0.4, C_BORDER),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2*mm),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2*mm),
        ]
        for ti in range(1, len(task_data)):
            bg = C_STRIPE if ti % 2 == 0 else colors.white
            task_style.append(('BACKGROUND', (0,ti), (-1,ti), bg))
        task_tbl.setStyle(TableStyle(task_style))
        story.append(task_tbl)
        story.append(Spacer(1, 3*mm))

    story.append(Spacer(1, 5*mm))
    story.append(info_table([
        ('Phase 1: Critical Fixes', '16 hours'),
        ('Phase 2: Testing & Quality', '24 hours'),
        ('Phase 3: Architecture', '20 hours'),
        ('Phase 4: Feature Completion', '16 hours'),
        ('Phase 5: Observability', '12 hours'),
        ('Total Estimated Effort', '88 hours'),
    ]))
    story.append(PageBreak())

    # ── Appendix: Methodology ───────────────────────────────────────────
    story.append(H1('Appendix: Audit Methodology'))
    story.append(body(
        'This audit was conducted using a systematic domain-by-domain analysis methodology. Each domain was evaluated '
        'across six dimensions: purpose clarity (does the domain have a well-defined, singular responsibility?), file '
        'organization (are files logically grouped and named consistently?), dependency health (are dependencies minimal '
        'and well-directed?), coupling risk (what is the blast radius of changes to this domain?), internal cohesion '
        '(do all files within the domain contribute to the same concern?), and overall quality (a composite score from 1-10).'
    ))
    story.append(body(
        'The dependency graph was validated by parsing all import statements across domain boundaries, confirming that no '
        'circular dependencies exist. Dynamic imports (await import()) were tracked separately from static imports, as they '
        'represent opt-in dependencies that do not create hard coupling. The domain README.md provided the initial mapping, '
        'which was verified against the actual file system structure. Problem classification follows a three-tier system: P0 '
        'problems are critical issues that affect data integrity, security, or system correctness; P1 problems are significant '
        'issues that impact maintainability, reliability, or developer productivity; P2 problems are minor improvements that '
        'would enhance the domain but are not urgent.'
    ))
    story.append(body(
        'Score assignment uses a calibrated rubric: domains scoring 9-10 are exemplary with near-zero issues; 7-8 are solid '
        'with minor improvements needed; 5-6 are functional but have notable structural concerns; 3-4 are problematic and require '
        'significant refactoring; 1-2 are critically flawed. The average score of {avg_score:.1f}/10 places VIXOR in the '
        '"solid with minor improvements needed" category, which is strong for a platform of this complexity and age. The '
        'absence of any domain scoring below 5 confirms that no domain requires complete rewriting.'.format(avg_score=avg_score)
    ))
    story.append(body(
        'This audit should be repeated quarterly as the platform evolves, with particular attention to domains undergoing '
        'active development. The refactor plan provides a concrete roadmap, but priorities should be reassessed based on '
        'business needs and team capacity. The domain architecture is fundamentally sound, and with focused effort on the '
        'identified problem areas, VIXOR can achieve a consistently high-quality codebase across all 23 domains.'
    ))

    # ── Build ────────────────────────────────────────────────────────────
    def on_page(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_PAGE_BG)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    size = os.path.getsize(output)
    print(f'PDF generated: {output}')
    print(f'File size: {size:,} bytes ({size/1024:.1f} KB)')


if __name__ == '__main__':
    build_pdf()
