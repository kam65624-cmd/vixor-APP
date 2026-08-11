#!/usr/bin/env python3
"""
VIXOR Architecture V2 - Open-Source Research & Migration Strategy
Generates a comprehensive PDF report with 5 deliverables.
"""

import json
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import pt, mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.colors import HexColor

# Register fonts
pdfmetrics.registerFont(TTFont('NotoSansSC', '/usr/share/fonts/truetype/chinese/NotoSansSC[wght].ttf', subfontIndex=0))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansBold', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSansMono', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

FONT = 'NotoSansSC'
FONT_BOLD = 'DejaVuSansBold'
FONT_MONO = 'DejaVuSansMono'

# Colors
C_BG = HexColor('#0a0a0f')
C_TEXT = HexColor('#e0e0e0')
C_ACCENT = HexColor('#6366f1')
C_RED = HexColor('#ef4444')
C_ORANGE = HexColor('#f97316')
C_BLUE = HexColor('#3b82f6')
C_GREEN = HexColor('#22c55e')
C_GRAY = HexColor('#6b7280')
C_DARK = HexColor('#1a1a2e')
C_HEADER_BG = HexColor('#1e1e3a')
C_ROW_EVEN = HexColor('#141428')
C_ROW_ODD = HexColor('#1a1a30')

W, H = A4
MARGIN_L = 50 * pt
MARGIN_R = 50 * pt
MARGIN_T = 40 * pt
MARGIN_B = 40 * pt

PRIORITY_COLORS = {
    'P0': C_RED,
    'P1': C_ORANGE,
    'P2': C_BLUE,
    'P3': C_GREEN,
}

RISK_COLORS = {
    'High': C_RED,
    'Medium': C_ORANGE,
    'Low': C_GREEN,
}

# ============================================================
# STYLES
# ============================================================
styles = getSampleStyleSheet()

def make_style(name, **kw):
    defaults = dict(fontName=FONT, fontSize=10, leading=14, textColor=C_TEXT, alignment=TA_LEFT)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

s_title = make_style('VTitle', fontSize=28, leading=34, textColor=colors.white, alignment=TA_CENTER, spaceAfter=6*pt)
s_subtitle = make_style('VSubtitle', fontSize=14, leading=18, textColor=C_ACCENT, alignment=TA_CENTER, spaceAfter=12*pt)
s_h1 = make_style('VH1', fontSize=20, leading=26, textColor=colors.white, spaceBefore=18*pt, spaceAfter=10*pt, fontName=FONT_BOLD)
s_h2 = make_style('VH2', fontSize=15, leading=20, textColor=C_ACCENT, spaceBefore=14*pt, spaceAfter=8*pt, fontName=FONT_BOLD)
s_h3 = make_style('VH3', fontSize=12, leading=16, textColor=HexColor('#a5b4fc'), spaceBefore=10*pt, spaceAfter=6*pt, fontName=FONT_BOLD)
s_body = make_style('VBody', fontSize=9.5, leading=13.5, alignment=TA_JUSTIFY, spaceAfter=4*pt)
s_body_sm = make_style('VBodySm', fontSize=8, leading=11, alignment=TA_JUSTIFY, spaceAfter=3*pt)
s_table_header = make_style('VTH', fontSize=7.5, leading=10, textColor=colors.white, fontName=FONT_BOLD)
s_table_cell = make_style('VTC', fontSize=7, leading=9.5, textColor=C_TEXT)
s_table_cell_sm = make_style('VTCSm', fontSize=6.5, leading=9, textColor=C_TEXT)
s_code = make_style('VCode', fontSize=7.5, leading=10, fontName=FONT_MONO, textColor=HexColor('#a5f3fc'), backColor=HexColor('#0f172a'))
s_bullet = make_style('VBullet', fontSize=9, leading=13, leftIndent=20, bulletIndent=8, spaceAfter=2*pt)
s_toc_h1 = make_style('TOCH1', fontSize=12, leading=18, textColor=colors.white, fontName=FONT_BOLD, leftIndent=10)
s_toc_h2 = make_style('TOCH2', fontSize=10, leading=16, textColor=C_ACCENT, leftIndent=30)
s_footer = make_style('VFooter', fontSize=7, leading=9, textColor=C_GRAY, alignment=TA_CENTER)
s_cover_detail = make_style('VCoverDetail', fontSize=10, leading=14, textColor=C_GRAY, alignment=TA_CENTER)
s_section_intro = make_style('VSectionIntro', fontSize=10, leading=14, textColor=HexColor('#94a3b8'), spaceAfter=8*pt, fontName=FONT_BOLD)

# ============================================================
# HELPERS
# ============================================================
def P(text, style=None):
    if style is None:
        style = s_body
    return Paragraph(text, style)


def H1(text):
    return Paragraph(text, s_h1)


def H2(text):
    return Paragraph(text, s_h2)


def H3(text):
    return Paragraph(text, s_h3)


def Bullet(text):
    return Paragraph(text, s_bullet)


def Code(text):
    return Paragraph(text, s_code)


def Sp(h=6):
    return Spacer(1, h * pt)


def HR():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor('#2a2a4a'), spaceAfter=8*pt, spaceBefore=8*pt)


def priority_p(text):
    p = text.strip().upper()
    for k in PRIORITY_COLORS:
        if k in p:
            c = PRIORITY_COLORS[k]
            return Paragraph(f'<font color="{c.hexval()}">{text}</font>', s_table_cell)
    return Paragraph(text, s_table_cell)


def risk_p(text):
    r = text.strip()
    c = RISK_COLORS.get(r, C_TEXT)
    return Paragraph(f'<font color="{c.hexval()}">{text}</font>', s_table_cell)


def cell(text, style=None):
    return Paragraph(str(text), style or s_table_cell)


def cell_sm(text):
    return Paragraph(str(text), s_table_cell_sm)


def make_table(headers, rows, col_widths=None):
    header_row = [Paragraph(h, s_table_header) for h in headers]
    data = [header_row]
    for row in rows:
        data.append(row)

    if col_widths is None:
        avail = W - MARGIN_L - MARGIN_R
        col_widths = [avail / len(headers)] * len(headers)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), C_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
        ('FONTSIZE', (0, 0), (-1, 0), 7.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#2a2a4a')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]
    for i in range(1, len(data)):
        bg = C_ROW_EVEN if i % 2 == 0 else C_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))

    t.setStyle(TableStyle(style_cmds))
    return t


class DarkPageTemplate:
    def __init__(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(C_BG)
        canvas.rect(0, 0, W, H, fill=True, stroke=False)
        canvas.setFont(FONT, 7)
        canvas.setFillColor(C_GRAY)
        canvas.drawCentredString(W / 2, 20 * pt, f"VIXOR Architecture V2 -- Confidential")
        canvas.drawRightString(W - MARGIN_R, H - 25 * pt, f"Page {doc.page}")
        canvas.restoreState()


def on_page(canvas, doc):
    DarkPageTemplate(canvas, doc)


def on_first_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(C_BG)
    canvas.rect(0, 0, W, H, fill=True, stroke=False)
    # Decorative accent line
    canvas.setStrokeColor(C_ACCENT)
    canvas.setLineWidth(2)
    canvas.line(MARGIN_L, H * 0.42, W - MARGIN_R, H * 0.42)
    canvas.restoreState()


# ============================================================
# LOAD SEARCH DATA
# ============================================================
SEARCH_FILES = [
    'search-trading-signals.json', 'search-exchange-libs.json', 'search-indicators.json',
    'search-trading-ui.json', 'search-backtest.json', 'search-ai-agents.json',
    'search-token-intel.json', 'search-market-data.json', 'search-events-cqrs.json',
    'search-charting.json', 'search-order-mgmt.json', 'search-risk-mgmt.json',
    'search-premium-ui.json', 'search-trading-bots.json', 'search-mfe-mae.json',
    'search-strategy-opt.json', 'search-data-grid.json', 'search-tv-alt.json',
    'search-nautilus.json', 'search-xstate.json', 'search-mastra.json',
    'search-tardis.json', 'search-token-api.json', 'search-talib.json',
    'search-dxcharts.json', 'search-sol-tokens.json', 'search-langfuse.json',
]

search_data = {}
SCRIPTS_DIR = '/home/z/my-project/scripts'
for fname in SEARCH_FILES:
    fpath = os.path.join(SCRIPTS_DIR, fname)
    if os.path.exists(fpath):
        with open(fpath) as f:
            search_data[fname] = json.load(f)


# ============================================================
# DOCUMENT
# ============================================================
OUTPUT_PATH = '/home/z/my-project/download/VIXOR_Architecture_V2_Research.pdf'

doc = SimpleDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=MARGIN_L,
    rightMargin=MARGIN_R,
    topMargin=MARGIN_T,
    bottomMargin=MARGIN_B,
    title='VIXOR Architecture V2 - Open-Source Research & Migration Strategy',
    author='VIXOR Engineering',
)

story = []

# ============================================================
# TITLE PAGE
# ============================================================
story.append(Sp(120))
story.append(P("VIXOR Architecture V2", s_title))
story.append(Sp(8))
story.append(P("Open-Source Research &amp; Migration Strategy", s_subtitle))
story.append(Sp(30))
story.append(P("A comprehensive analysis of 27 search categories across trading infrastructure,", s_cover_detail))
story.append(P("AI agent frameworks, charting systems, and data pipelines with integration", s_cover_detail))
story.append(P("recommendations mapped to the VIXOR codebase (23 domains, 37 pages, 47 DB tables).", s_cover_detail))
story.append(Sp(40))
story.append(P("Platform: TanStack Start + React + Supabase + Upstash Redis", s_cover_detail))
story.append(P("Classification: Confidential -- Internal Engineering Document", s_cover_detail))
story.append(Sp(20))
story.append(P("5 Deliverables: Deep Research | Integration Matrix | Architecture V2 | Page Architecture | Migration Strategy", s_cover_detail))
story.append(PageBreak())

# ============================================================
# TABLE OF CONTENTS
# ============================================================
story.append(H1("Table of Contents"))
story.append(Sp(8))

toc_entries = [
    ("Deliverable 01 -- VIXOR Open-Source Deep Research", 0),
    ("  1. Trading / Signals / Strategy Engines", 1),
    ("  2. Market Data / Exchange Integration", 1),
    ("  3. Token Intelligence / On-Chain Data", 1),
    ("  4. Analytics / Backtesting / Research", 1),
    ("  5. Charting / Drawing Tools", 1),
    ("  6. Frontend / Dashboard / UI Systems", 1),
    ("  7. AI / Agent Frameworks", 1),
    ("  8. State Machines / Event-Driven Architecture", 1),
    ("  9. Risk Management / Position Sizing", 1),
    ("  10. Data Grids / Tables", 1),
    ("  11. Technical Indicators Libraries", 1),
    ("Deliverable 02 -- VIXOR Open-Source Integration Matrix", 0),
    ("  VIXOR-Proprietary: Do Not Outsource", 1),
    ("  Integration Matrix Table", 1),
    ("Deliverable 03 -- VIXOR Architecture V2", 0),
    ("  Layer-by-Layer Analysis", 1),
    ("Deliverable 04 -- VIXOR Page Architecture V2", 0),
    ("  Current Page Analysis (37 pages)", 1),
    ("  Consolidation Recommendations", 1),
    ("  Final Page Map V2", 1),
    ("Deliverable 05 -- VIXOR Migration Strategy", 0),
    ("  Phase 1: Dependencies", 1),
    ("  Phase 2: Data Layer", 1),
    ("  Phase 3: Signal Engine", 1),
    ("  Phase 4: MOXI AI", 1),
    ("  Phase 5: UX", 1),
    ("  Phase 6: Final Product", 1),
]

for entry, level in toc_entries:
    st = s_toc_h1 if level == 0 else s_toc_h2
    story.append(P(entry, st))

story.append(PageBreak())

# ============================================================
# DELIVERABLE 01: OPEN-SOURCE DEEP RESEARCH
# ============================================================
story.append(H1("DELIVERABLE 01 -- VIXOR Open-Source Deep Research"))
story.append(Sp(4))
story.append(P(
    "This section catalogs the top open-source projects discovered across 27 search categories. "
    "For each category, we list the most relevant projects, their GitHub URLs, approximate star counts, "
    "licensing where available, and the specific problem they solve. Projects are evaluated for "
    "relevance to VIXOR's stack (TypeScript/React/Supabase) and use case (trading intelligence platform)."
))
story.append(Sp(6))

avail = W - MARGIN_L - MARGIN_R

# Category 1: Trading / Signals / Strategy Engines
story.append(H2("1. Trading / Signals / Strategy Engines"))
story.append(P(
    "This category covers open-source platforms and frameworks for generating trading signals, "
    "building strategy engines, and running systematic trading. VIXOR already has a custom signal "
    "pipeline (transition-engine.ts, daily_signals, analyses) and MOXI AI agents."
))
story.append(Sp(4))

cat1_data = [
    [cell("CCXT"), cell("ccxt/ccxt"), cell("~35k stars"), cell("MIT"),
     cell("Unified API for 100+ crypto exchanges. Handles order placement, market data, and WebSocket streams. Already in VIXOR dependencies.")],
    [cell("Freqtrade"), cell("freqtrade/freqtrade"), cell("~30k stars"), cell("MIT"),
     cell("Python crypto trading bot with backtesting, strategy optimization via hyperopt, and live trading. Telegram integration.")],
    [cell("Hummingbot"), cell("hummingbot/hummingbot"), cell("~8k stars"), cell("Apache-2.0"),
     cell("Market making and arbitrage strategies for CEX/DEX. Agentic trading with strategy templates.")],
    [cell("NautilusTrader"), cell("nautechsystems/nautilus_trader"), cell("~4k stars"), cell("Apache-2.0"),
     cell("Production-grade Rust-core engine for multi-asset trading. Deterministic backtesting, nanosecond timestamps.")],
    [cell("NextTrade"), cell("TypeScript"), cell("N/A"), cell("N/A"),
     cell("TS-based algorithmic trading platform for creating, testing, optimizing, and deploying strategies.")],
    [cell("QuantConnect"), cell("quantconnect/lean"), cell("~10k stars"), cell("Apache-2.0"),
     cell("C# algorithmic trading engine with multi-asset support, event-driven backtesting, and live deployment.")],
    [cell("Jesse"), cell("jesse-trading/jesse"), cell("~8k stars"), cell("MIT"),
     cell("Python trading framework with clean API, backtesting, and strategy optimization.")],
    [cell("GeneTrader"), cell("imsatoshi/GeneTrader"), cell("N/A"), cell("N/A"),
     cell("Genetic algorithm optimization for trading strategy parameters and pair selection.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat1_data,
    [55, 95, 55, 50, avail - 255]
))
story.append(Sp(8))

# Category 2: Market Data / Exchange Integration
story.append(H2("2. Market Data / Exchange Integration"))
story.append(P(
    "VIXOR currently uses CCXT for exchange abstraction plus custom adapters (Binance WS, DexScreener WS/REST, "
    "TwelveData, Finnhub, Alchemy, Helius). This category evaluates whether the current approach is optimal."
))
story.append(Sp(4))

cat2_data = [
    [cell("CCXT"), cell("ccxt/ccxt"), cell("~35k"), cell("MIT"),
     cell("Already in VIXOR. Unified API for 100+ exchanges. Handles rate limiting, WebSocket, order management.")],
    [cell("Tardis.dev"), cell("tardis-dev/tardis-node"), cell("~2k"), cell("MIT"),
     cell("Tick-level historical and real-time crypto market data with normalized format. Order book reconstruction.")],
    [cell("CoinAPI"), cell("coinapi/coinapi"), cell("N/A"), cell("Commercial"),
     cell("Multi-exchange real-time crypto data via single WebSocket. Trades, quotes, order books, OHLCV.")],
    [cell("Twelve Data"), cell("(API service)"), cell("N/A"), cell("Commercial"),
     cell("Real-time stock, forex, crypto data. Already used in VIXOR for price feeds.")],
    [cell("Finnhub"), cell("(API service)"), cell("N/A"), cell("Commercial"),
     cell("Stock and crypto market data with WebSocket. Already used in VIXOR.")],
]
story.append(make_table(
    ["Project", "Source", "Stars", "License", "Problem Solved"],
    cat2_data,
    [55, 95, 45, 55, avail - 250]
))
story.append(Sp(8))

# Category 3: Token Intelligence / On-Chain Data
story.append(H2("3. Token Intelligence / On-Chain Data"))
story.append(P(
    "VIXOR has a multi-stage discovery pipeline scoring tokens across DexScreener, Birdeye, LunarCrush, "
    "and Helius. This category examines OSS tools for token intelligence."
))
story.append(Sp(4))

cat3_data = [
    [cell("TokenSight AI"), cell("mrarindam/TokenSight-Ai"), cell("N/A"), cell("N/A"),
     cell("Real-time on-chain intelligence for Solana tokens. Aggregates Helius, DexScreener, Birdeye. Similar to VIXOR discovery.")],
    [cell("Birdeye API"), cell("(API service)"), cell("N/A"), cell("Commercial"),
     cell("Solana-first market data. Token prices, OHLCV, DEX activity, holder analytics. Already used in VIXOR.")],
    [cell("DexScreener"), cell("(API service)"), cell("N/A"), cell("Free/Commercial"),
     cell("Cross-chain DEX data, real-time prices, trading pairs. Already used in VIXOR via WS and REST.")],
    [cell("CoinGecko DEX API"), cell("(API service)"), cell("N/A"), cell("Commercial"),
     cell("Standardized on-chain market data across Ethereum, Solana, BNB Chain.")],
    [cell("Moralis"), cell("moralisio/moralis"), cell("~5k"), cell("MIT"),
     cell("Web3 data platform with DEX on-chain data, NFT, DeFi APIs.")],
    [cell("Solana Token List"), cell("solana-labs/token-list"), cell("~500"), cell("Apache-2.0"),
     cell("Community-maintained Solana token metadata registry.")],
]
story.append(make_table(
    ["Project", "Source", "Stars", "License", "Problem Solved"],
    cat3_data,
    [70, 100, 40, 65, avail - 275]
))
story.append(Sp(8))

# Category 4: Analytics / Backtesting / Research
story.append(H2("4. Analytics / Backtesting / Research"))
story.append(P(
    "VIXOR has a custom candle-by-candle backtest simulator computing Sharpe, Sortino, and drawdown. "
    "This category evaluates mature OSS backtesting frameworks."
))
story.append(Sp(4))

cat4_data = [
    [cell("NautilusTrader"), cell("nautechsystems/nautilus_trader"), cell("~4k"), cell("Apache-2.0"),
     cell("Rust-core, deterministic backtesting with nanosecond timestamps. Shared engine for research and live.")],
    [cell("Backtrader"), cell("mementum/backtrader"), cell("~14k"), cell("MIT"),
     cell("Python event-driven backtesting with multiple data feeds, order management, and indicators.")],
    [cell("backtest-kit"), cell("backtest-kit"), cell("N/A"), cell("N/A"),
     cell("TypeScript engine for backtesting crypto/forex/DEX strategies. Code you test is code you ship.")],
    [cell("QuantConnect/Lean"), cell("quantconnect/lean"), cell("~10k"), cell("Apache-2.0"),
     cell("C# multi-asset backtesting with realistic fill models and slippage simulation.")],
    [cell("Zipline"), cell("quantopian/zipline"), cell("~18k"), cell("Apache-2.0"),
     cell("Python event-driven backtesting with MFE/MAE support (per-issue #189). No longer actively maintained.")],
    [cell("Freqtrade"), cell("freqtrade/freqtrade"), cell("~30k"), cell("MIT"),
     cell("Python backtesting with hyperopt optimization, strategy export, and dry-run/live modes.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat4_data,
    [70, 105, 40, 60, avail - 275]
))
story.append(Sp(8))

# Category 5: Charting / Drawing Tools
story.append(H2("5. Charting / Drawing Tools"))
story.append(P(
    "VIXOR uses Lightweight Charts v5.2.0 from TradingView. This category evaluates alternatives and "
    "extensions for drawing tools, technical overlays, and advanced charting features."
))
story.append(Sp(4))

cat5_data = [
    [cell("Lightweight Charts"), cell("tradingview/lightweight-charts"), cell("~9k"), cell("Apache-2.0"),
     cell("45KB financial charting library. Already in VIXOR. Fast, no dependencies. Lacks built-in drawing tools.")],
    [cell("DXcharts Lite"), cell("devexperts/dxcharts-lite"), cell("~500"), cell("MIT"),
     cell("Open-source financial charts with more chart types (candlestick, bar, Kagi, Renko, P&F). Based on Lightweight Charts.")],
    [cell("TradingView Charting Lib"), cell("tradingview/charting_library"), cell("N/A"), cell("Commercial"),
     cell("Full-featured charting with drawing tools, indicators, multi-pane. Requires license for commercial use.")],
    [cell("Pipsend Charts"), cell("pipsend/charts"), cell("N/A"), cell("N/A"),
     cell("Extension of Lightweight Charts adding 10 pre-built indicators (SMA, EMA, RSI, MACD, etc.).")],
    [cell("Apache ECharts"), cell("apache/echarts"), cell("~62k"), cell("Apache-2.0"),
     cell("General-purpose charting with financial series. Heavy but powerful for dashboards.")],
    [cell("SciChart SciTrader"), cell("scichart"), cell("N/A"), cell("Commercial"),
     cell("High-performance charts with TradingView-like features for big data applications.")],
    [cell("LightningChart JS"), cell("lightningchart"), cell("N/A"), cell("Commercial"),
     cell("Advanced charting with candlestick, Kagi, Renko, Point & Figure. High performance for large datasets.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat5_data,
    [70, 100, 40, 60, avail - 270]
))
story.append(Sp(8))

# Category 6: Frontend / Dashboard / UI Systems
story.append(H2("6. Frontend / Dashboard / UI Systems"))
story.append(P(
    "VIXOR uses TanStack Start + React + shadcn/ui (46 components) + Tailwind CSS + Zustand + TanStack Query + "
    "TanStack Virtual. This is a strong, modern stack. This category evaluates whether alternative UI systems "
    "warrant consideration."
))
story.append(Sp(4))

cat6_data = [
    [cell("shadcn/ui"), cell("shadcn-ui/ui"), cell("~80k"), cell("MIT"),
     cell("Already in VIXOR. Copy-paste component library with Radix primitives. 46 components in use.")],
    [cell("Material UI (MUI)"), cell("mui/material-ui"), cell("~95k"), cell("MIT"),
     cell("Enterprise-grade React UI. Heavier than shadcn. Good for tables, forms, data-dense UIs.")],
    [cell("Ant Design"), cell("ant-design/ant-design"), cell("~93k"), cell("MIT"),
     cell("Enterprise React UI with comprehensive table, form, and layout components.")],
    [cell("TailAdmin"), cell("tailadmin/tailadmin"), cell("N/A"), cell("Commercial"),
     cell("Tailwind CSS admin dashboard template. Open-source version available.")],
    [cell("Refine"), cell("refinedev/refine"), cell("~28k"), cell("MIT"),
     cell("React framework for admin panels with data providers, auth, and routing.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat6_data,
    [70, 100, 40, 60, avail - 270]
))
story.append(Sp(8))

# Category 7: AI / Agent Frameworks
story.append(H2("7. AI / Agent Frameworks"))
story.append(P(
    "VIXOR has custom MOXI AI with 4 agents (Analyst, Governor, Hunter, Coach) and a persona system. "
    "This category evaluates TypeScript-native AI agent frameworks that could provide infrastructure."
))
story.append(Sp(4))

cat7_data = [
    [cell("Mastra"), cell("mastra-ai/mastra"), cell("~10k"), cell("MIT"),
     cell("TypeScript-first agent framework with agents, workflows, memory, MCP, tool calling, and evals.")],
    [cell("Vercel AI SDK"), cell("vercel/ai"), cell("~20k"), cell("Apache-2.0"),
     cell("Streaming chat and tool-calling UIs for Next.js/React. Lightweight, composable.")],
    [cell("OpenAI Agents SDK"), cell("openai/openai-agents-python"), cell("~27k"), cell("MIT"),
     cell("Python framework for building agents with tool use, handoffs, and guardrails.")],
    [cell("VoltAgent"), cell("voltagent"), cell("N/A"), cell("N/A"),
     cell("Observability-first TypeScript AI agent framework with unified APIs, tools, and memory.")],
    [cell("LangChain"), cell("langchain-ai/langchain"), cell("~100k"), cell("MIT"),
     cell("Most popular LLM framework. Chains, agents, memory, tools. Python-first with TS port.")],
    [cell("Langfuse"), cell("langfuse/langfuse"), cell("~12k"), cell("MIT"),
     cell("Open-source LLM observability. Tracing, monitoring, cost tracking, evaluation, prompt management.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat7_data,
    [70, 115, 40, 60, avail - 285]
))
story.append(Sp(8))

# Category 8: State Machines / Event-Driven Architecture
story.append(H2("8. State Machines / Event-Driven Architecture"))
story.append(P(
    "VIXOR has a custom transition-engine.ts (pure TypeScript state machine) and events/orchestrator.ts "
    "(typed event bus, no persistence wired). This category evaluates OSS state machine and CQRS tools."
))
story.append(Sp(4))

cat8_data = [
    [cell("XState"), cell("statelyai/xstate"), cell("~27k"), cell("MIT"),
     cell("TypeScript state machines and statecharts. Visual tooling, type-safe transitions, actor model.")],
    [cell("KurrentDB"), cell("kurrentdb/kurrentdb"), cell("~5k"), cell("SSPL"),
     cell("Event-sourced database. Stores events immutably, supports projections and subscriptions.")],
    [cell("EventStoreDB"), cell("EventStore/EventStoreDB"), cell("~5k"), cell("SSPL"),
     cell("Event-sourced database for event-driven architectures. Previous name of KurrentDB.")],
    [cell("Awesome CQRS/ES"), cell("leandrocp/awesome-cqrs-event-sourcing"), cell("~2k"), cell("N/A"),
     cell("Curated list of CQRS and Event Sourcing libraries and patterns. Reference material.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat8_data,
    [70, 120, 40, 50, avail - 280]
))
story.append(Sp(8))

# Category 9: Risk Management / Position Sizing
story.append(H2("9. Risk Management / Position Sizing"))
story.append(P(
    "VIXOR has a custom risk-governor with synchronous advisory rules (pure math). This category evaluates "
    "OSS risk management libraries and frameworks."
))
story.append(Sp(4))

cat9_data = [
    [cell("Open Source Risk"), cell("opensourcerisk"), cell("~500"), cell("LGPL-3.0"),
     cell("End-to-end open source risk analytics for financial institutions. Pricing, risk analysis, benchmarking.")],
    [cell("nautilus-risk"), cell("nautechsystems"), cell("~4k"), cell("Apache-2.0"),
     cell("Rust risk management crate. Pre-trade order validation, position sizing, trading controls.")],
    [cell("TradingView SIZE"), cell("tradingview.com"), cell("N/A"), cell("N/A"),
     cell("Pine Script indicator for position sizing, margin, and risk/reward calculation.")],
]
story.append(make_table(
    ["Project", "Source", "Stars", "License", "Problem Solved"],
    cat9_data,
    [70, 100, 40, 60, avail - 270]
))
story.append(Sp(8))

# Category 10: Data Grids / Tables
story.append(H2("10. Data Grids / Tables"))
story.append(P(
    "VIXOR uses TanStack Virtual for virtualization. This category evaluates data grid libraries that "
    "combine virtualization with sorting, filtering, and real-time updates for financial data."
))
story.append(Sp(4))

cat10_data = [
    [cell("TanStack Table"), cell("tanstack/table"), cell("~25k"), cell("MIT"),
     cell("Headless table library. Already implicitly used in VIXOR ecosystem. Sorting, filtering, grouping.")],
    [cell("TanStack Virtual"), cell("tanstack/virtual"), cell("~17k"), cell("MIT"),
     cell("Virtualization for large lists/tables. Already in VIXOR. Handles 100k+ rows efficiently.")],
    [cell("RevoGrid"), cell("revolist/revogrid"), cell("~2k"), cell("MIT"),
     cell("Enterprise-grade data grid with virtual scrolling, filtering, real-time updates, and themes.")],
    [cell("AG Grid"), cell("ag-grid/ag-grid"), cell("~13k"), cell("MIT/Comm"),
     cell("Most full-featured data grid. Enterprise features behind commercial license. Heavy bundle.")],
    [cell("MUI X DataGrid"), cell("mui/x"), cell("~5k"), cell("MIT"),
     cell("Material UI data grid with virtualization, filtering, sorting, editing.")],
    [cell("SVAR DataGrid"), cell("svar"), cell("N/A"), cell("MIT"),
     cell("Open-source React data grid focused on real-time updates and high performance.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat10_data,
    [70, 95, 45, 55, avail - 265]
))
story.append(Sp(8))

# Category 11: Technical Indicators Libraries
story.append(H2("11. Technical Indicators Libraries"))
story.append(P(
    "VIXOR likely has custom indicator calculations. This category evaluates OSS TypeScript/JavaScript "
    "libraries for technical analysis indicators."
))
story.append(Sp(4))

cat11_data = [
    [cell("technicalindicators"), cell("anandanand84/technicalindicators"), cell("~4k"), cell("MIT"),
     cell("TypeScript technical indicators (SMA, EMA, RSI, MACD, Bollinger, etc.). Runs in browser and Node.")],
    [cell("trading-signals"), cell("bnason/trading-signals"), cell("~500"), cell("Apache-2.0"),
     cell("TypeScript implementation of common technical indicators with streaming support.")],
    [cell("fast-technical-indicators"), cell("npm/fast-technical-indicators"), cell("N/A"), cell("MIT"),
     cell("Zero-dependency, 100% API-compatible drop-in for technicalindicators with better performance.")],
    [cell("node-talib"), cell("oransel/node-talib"), cell("~300"), cell("MIT"),
     cell("Node.js wrapper around TA-LIB C library. 100+ indicators. Requires native compilation.")],
    [cell("talib-binding"), cell("npm/talib-binding"), cell("N/A"), cell("MIT"),
     cell("Synchronous TA-Lib bindings for Node.js. 200+ indicators including ADX, MACD, RSI.")],
]
story.append(make_table(
    ["Project", "GitHub Repo", "Stars", "License", "Problem Solved"],
    cat11_data,
    [80, 100, 40, 50, avail - 270]
))
story.append(PageBreak())

# ============================================================
# DELIVERABLE 02: INTEGRATION MATRIX
# ============================================================
story.append(H1("DELIVERABLE 02 -- VIXOR Open-Source Integration Matrix"))
story.append(Sp(4))
story.append(P(
    "This is the most critical deliverable. Each OSS project is analyzed against the ACTUAL VIXOR codebase "
    "with brutal honesty about what should be integrated, adapted, referenced, or kept as-is. "
    "Projects that duplicate existing VIXOR capabilities are flagged. VIXOR-proprietary logic is protected."
))
story.append(Sp(6))

story.append(H2("VIXOR-Proprietary: Do Not Outsource to OSS"))
story.append(P(
    "The following capabilities are core VIXOR intellectual property and competitive advantage. "
    "They should NEVER be replaced with open-source alternatives:"
))
story.append(Sp(4))

proprietary_items = [
    "MOXI Agent Logic -- The 4-agent persona system (Analyst, Governor, Hunter, Coach) with custom prompts, "
    "decision trees, and inter-agent communication is VIXOR's core AI differentiator.",
    "Signal Decision Logic -- The transition-engine.ts state machine that governs how signals move through "
    "analysis states is proprietary trading intelligence.",
    "VIXOR Intelligence/Opportunity Ranking -- The multi-stage scoring across DexScreener, Birdeye, LunarCrush, "
    "Helius with custom weighting is a competitive moat.",
    "User Context/Memory -- How VIXOR remembers user preferences, trading history, and personalizes output "
    "is user-specific IP.",
    "Trading Workflow Decisions -- The orchestration of when to alert, when to analyze, when to execute "
    "is business logic that should not be outsourced.",
    "VIXOR Design System -- The 46 shadcn components with custom theming, layout patterns, and dark-mode "
    "financial UI is branded.",
]
for item in proprietary_items:
    story.append(Bullet(f"<b>{item.split(' -- ')[0]}</b> -- {item.split(' -- ', 1)[1]}"))
story.append(Sp(8))

story.append(H2("Integration Matrix"))
story.append(Sp(4))

# Matrix data: [name, category, what_solves, vixor_current, problem_current, oss_solution, recommendation, replace_keep, integration_method, risk, priority, impact]
matrix_rows = [
    [cell_sm("CCXT"), cell_sm("market-data"), cell_sm("Unified exchange API for 100+ exchanges"),
     cell_sm("ccxt ^4.5.64 in deps. ccxt-generic-adapter.ts + 4 custom adapters (binance, bybit, okx, exness)"),
     cell_sm("Custom adapters duplicate CCXT built-in support. Binance, Bybit, OKX all have first-class CCXT implementations."),
     cell_sm("CCXT already provides exchange adapters, WebSocket, rate limiting for Binance/Bybit/OKX"),
     cell_sm("Keep"),
     cell_sm("Keep"),
     cell_sm("Already integrated"),
     risk_p("Low"),
     priority_p("P1"),
     cell_sm("Consolidate binance-adapter.ts, bybit-adapter.ts, okx-adapter.ts into ccxt-generic-adapter.ts. Remove 3 files.")],

    [cell_sm("Lightweight Charts"), cell_sm("charting"), cell_sm("Financial charting with candlesticks, line, area"),
     cell_sm("lightweight-charts ^5.2.0 in deps. Used across chart components."),
     cell_sm("Missing drawing tools, no built-in indicators overlay, no multi-pane support."),
     cell_sm("45KB chart engine with excellent performance. Pipsend Charts adds indicators. DXcharts Lite adds chart types."),
     cell_sm("Adapter"),
     cell_sm("Keep + Extend"),
     cell_sm("npm: pipsend/charts or DXcharts Lite as overlay"),
     risk_p("Low"),
     priority_p("P2"),
     cell_sm("Add indicator overlays (SMA, EMA, RSI, MACD) via pipsend/charts. Affects chart domain components.")],

    [cell_sm("technicalindicators"), cell_sm("indicators"), cell_sm("30+ TS technical indicators"),
     cell_sm("Likely custom indicator math in signal/analysis domains."),
     cell_sm("Reinventing well-tested indicator math. Maintenance burden for RSI, MACD, Bollinger, etc."),
     cell_sm("Battle-tested TS library with SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, etc."),
     cell_sm("Direct Integration"),
     cell_sm("Replace custom math"),
     cell_sm("npm: technicalindicators"),
     risk_p("Low"),
     priority_p("P1"),
     cell_sm("Replace any inline indicator calculations. Affects signal and analysis domains.")],

    [cell_sm("XState"), cell_sm("state-machine"), cell_sm("Type-safe state machines with visual tooling"),
     cell_sm("Custom transition-engine.ts (pure TS state machine)"),
     cell_sm("Custom engine lacks visual debugging, no state persistence, no actor model, manual type safety."),
     cell_sm("Industry-standard TS state machines with Stately visualizer, type-safe transitions, actor model."),
     cell_sm("Architecture Reference"),
     cell_sm("Keep"),
     cell_sm("Reference only"),
     risk_p("Medium"),
     priority_p("P3"),
     cell_sm("Study XState patterns for V2 transition engine. Do NOT replace current engine -- it works.")],

    [cell_sm("Mastra"), cell_sm("ai-framework"), cell_sm("TS agent framework with memory, tools, workflows"),
     cell_sm("Custom MOXI AI: 4 agents with persona system. No formal framework."),
     cell_sm("MOXI has no persistent memory, no tool registry, no workflow orchestration, no observability."),
     cell_sm("Provides agent memory, tool registry, workflow engine, MCP integration, evals."),
     cell_sm("Architecture Reference"),
     cell_sm("Keep + Reference"),
     cell_sm("Reference only -- MOXI is proprietary"),
     risk_p("High"),
     priority_p("P2"),
     cell_sm("Adopt Mastra's memory and tool patterns for MOXI V2. Do NOT use Mastra directly for agent logic.")],

    [cell_sm("Langfuse"), cell_sm("ai-observability"), cell_sm("LLM tracing, cost monitoring, evaluation"),
     cell_sm("No LLM observability. MOXI agent calls are untraced."),
     cell_sm("Cannot debug MOXI agent decisions. No cost tracking. No prompt versioning. No eval framework."),
     cell_sm("Open-source LLM observability: tracing, cost tracking, prompt management, evaluation."),
     cell_sm("Direct Integration"),
     cell_sm("Add"),
     cell_sm("Self-hosted Langfuse + npm SDK"),
     risk_p("Low"),
     priority_p("P0"),
     cell_sm("Instrument all MOXI agent calls. Affects AI domain, cron endpoints, analysis flows.")],

    [cell_sm("Tardis.dev"), cell_sm("market-data"), cell_sm("Tick-level historical market data"),
     cell_sm("No historical tick data. Backtest uses candle-by-candle with daily candles."),
     cell_sm("Cannot backtest with tick-level precision. No historical order book reconstruction."),
     cell_sm("Tick-level historical data with normalized format across exchanges."),
     cell_sm("Adapter"),
     cell_sm("Add"),
     cell_sm("API adapter + data pipeline"),
     risk_p("Medium"),
     priority_p("P2"),
     cell_sm("Add historical data pipeline for backtest V2. Affects backtest domain, research tables.")],

    [cell_sm("NautilusTrader"), cell_sm("backtesting"), cell_sm("Production-grade Rust backtesting engine"),
     cell_sm("Custom candle-by-candle simulator in TS with Sharpe/Sortino/drawdown."),
     cell_sm("TS backtest is slow for large datasets. No tick-level simulation. No order book modeling."),
     cell_sm("Rust-core engine with deterministic backtesting, nanosecond timestamps."),
     cell_sm("Architecture Reference"),
     cell_sm("Keep"),
     cell_sm("Reference only"),
     risk_p("High"),
     priority_p("P3"),
     cell_sm("Study Nautilus architecture for V2 backtest. Keep TS implementation for stack consistency.")],

    [cell_sm("Freqtrade"), cell_sm("trading-bot"), cell_sm("Python crypto trading bot"),
     cell_sm("VIXOR is not a trading bot. It is a trading intelligence platform."),
     cell_sm("N/A -- different product category"),
     cell_sm("Bot for automated trading. Not applicable to VIXOR's intelligence-first approach."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("No integration. Different product category entirely.")],

    [cell_sm("Hummingbot"), cell_sm("trading-bot"), cell_sm("Market making and arbitrage"),
     cell_sm("VIXOR does not do market making or arbitrage."),
     cell_sm("N/A -- different product category"),
     cell_sm("CEX/DEX market making strategies. Not applicable."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("No integration.")],

    [cell_sm("TanStack Table"), cell_sm("data-grid"), cell_sm("Headless table with sorting, filtering"),
     cell_sm("TanStack Virtual in deps. Likely custom table implementations."),
     cell_sm("Custom tables lack sorting, filtering, column resizing features that TanStack Table provides."),
     cell_sm("Headless table logic. Combine with TanStack Virtual for full-featured data grids."),
     cell_sm("Direct Integration"),
     cell_sm("Add"),
     cell_sm("npm: @tanstack/react-table"),
     risk_p("Low"),
     priority_p("P1"),
     cell_sm("Add to signals, trackers, discovery tables. Affects multiple pages and VIXOR components.")],

    [cell_sm("DXcharts Lite"), cell_sm("charting"), cell_sm("Extended financial chart types"),
     cell_sm("Lightweight Charts v5.2.0 for basic candlestick/line."),
     cell_sm("No Kagi, Renko, Point & Figure, or advanced chart types."),
     cell_sm("Built on Lightweight Charts. Adds chart types with same API pattern."),
     cell_sm("Adapter"),
     cell_sm("Evaluate"),
     cell_sm("npm: @devexperts/dxcharts-lite"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("Evaluate for advanced chart types. Low priority -- most users want candlesticks.")],

    [cell_sm("TokenSight AI"), cell_sm("token-intel"), cell_sm("Solana on-chain token intelligence"),
     cell_sm("Custom discovery with multi-stage scoring (DexScreener, Birdeye, LunarCrush, Helius)."),
     cell_sm("Custom discovery is VIXOR-proprietary scoring. Not a problem to solve with OSS."),
     cell_sm("Similar Solana token aggregation but without VIXOR's intelligence layer."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("VIXOR discovery scoring is proprietary. Do not replace with OSS.")],

    [cell_sm("VoltAgent"), cell_sm("ai-framework"), cell_sm("Observability-first TS agent framework"),
     cell_sm("MOXI has no observability."),
     cell_sm("Same category as Mastra. Less mature. Langfuse handles observability better."),
     cell_sm("TypeScript agent framework with built-in observability."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("Langfuse covers observability. Mastra covers architecture reference. VoltAgent is redundant.")],

    [cell_sm("Vercel AI SDK"), cell_sm("ai-framework"), cell_sm("Streaming chat UI primitives"),
     cell_sm("MOXI agent calls likely use direct fetch to LLM APIs."),
     cell_sm("No streaming UI primitives for agent responses. Manual WebSocket/HTTP handling."),
     cell_sm("useChat, useCompletion hooks for streaming LLM responses in React."),
     cell_sm("UX Reference"),
     cell_sm("Evaluate"),
     cell_sm("Reference only"),
     risk_p("Medium"),
     priority_p("P2"),
     cell_sm("Evaluate for MOXI chat UI streaming. Could improve agent response UX significantly.")],

    [cell_sm("Open Source Risk"), cell_sm("risk"), cell_sm("Complex risk analytics"),
     cell_sm("Custom risk-governor: synchronous advisory rules, pure math."),
     cell_sm("VIXOR risk is position-sizing focused, not institutional derivative pricing."),
     cell_sm("Institutional-grade risk analytics for derivatives. Different use case."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("VIXOR's pure math risk is correct for its scope. OSS Risk is for institutional derivatives.")],

    [cell_sm("nautilus-risk"), cell_sm("risk"), cell_sm("Rust pre-trade validation"),
     cell_sm("Custom risk-governor in TS."),
     cell_sm("Adding a Rust dependency for risk checks breaks the TS-only stack."),
     cell_sm("Pre-trade order validation, position sizing in Rust."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("Wrong language. VIXOR is TypeScript-first.")],

    [cell_sm("RevoGrid"), cell_sm("data-grid"), cell_sm("Enterprise data grid with real-time"),
     cell_sm("TanStack Virtual + custom tables."),
     cell_sm("RevoGrid is a full grid solution. TanStack Table + Virtual is more flexible."),
     cell_sm("All-in-one data grid with virtual scrolling, filtering, themes."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("TanStack Table + Virtual is already in the ecosystem. No need for RevoGrid.")],

    [cell_sm("fast-technical-indicators"), cell_sm("indicators"), cell_sm("Zero-dep indicator library"),
     cell_sm("See technicalindicators above."),
     cell_sm("Drop-in replacement for technicalindicators with better perf. If adopting indicators, consider this."),
     cell_sm("API-compatible with technicalindicators, zero dependencies, higher performance."),
     cell_sm("Direct Integration"),
     cell_sm("Alternative"),
     cell_sm("npm: fast-technical-indicators"),
     risk_p("Low"),
     priority_p("P2"),
     cell_sm("Use instead of technicalindicators if both are evaluated. Zero-dep is better.")],

    [cell_sm("KurrentDB"), cell_sm("event-sourcing"), cell_sm("Event-sourced database"),
     cell_sm("events/orchestrator.ts (typed event bus, no persistence wired)."),
     cell_sm("Events are ephemeral. No event persistence means no replay, no audit trail, no debugging."),
     cell_sm("Immutable event storage with projections and subscriptions."),
     cell_sm("Architecture Reference"),
     cell_sm("Keep"),
     cell_sm("Reference only"),
     risk_p("High"),
     priority_p("P2"),
     cell_sm("Add event persistence to Supabase event log table. Study Kurrent patterns. Do NOT add a new database.")],

    [cell_sm("MUI / Ant Design"), cell_sm("ui-system"), cell_sm("Enterprise React UI libraries"),
     cell_sm("shadcn/ui with 46 components + Tailwind CSS."),
     cell_sm("N/A -- shadcn/ui is the right choice for VIXOR's design system."),
     cell_sm("Comprehensive UI components but heavier, less customizable than shadcn."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("VIXOR design system is branded. shadcn/ui is the correct foundation.")],

    [cell_sm("AG Grid"), cell_sm("data-grid"), cell_sm("Full-featured data grid"),
     cell_sm("TanStack Virtual + custom tables."),
     cell_sm("AG Grid enterprise features require commercial license. Heavy bundle size."),
     cell_sm("Most full-featured grid but MIT version is limited."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("License and bundle concerns. TanStack is sufficient.")],

    [cell_sm("node-talib"), cell_sm("indicators"), cell_sm("TA-LIB C bindings for Node.js"),
     cell_sm("See technicalindicators above."),
     cell_sm("Requires native compilation. Breaks in serverless (Vercel) environments."),
     cell_sm("100+ indicators via C library. Fast but native dependency."),
     cell_sm("Do Not Use"),
     cell_sm("N/A"),
     cell_sm("N/A"),
     risk_p("High"),
     priority_p("P3"),
     cell_sm("Native compilation breaks Vercel deployment. Use pure TS library instead.")],

    [cell_sm("backtest-kit"), cell_sm("backtesting"), cell_sm("TS backtesting engine"),
     cell_sm("Custom candle-by-candle TS backtest with Sharpe/Sortino/drawdown."),
     cell_sm("backtest-kit is TS-native. Could be an alternative to custom implementation."),
     cell_sm("TypeScript backtesting where code you test is code you ship."),
     cell_sm("Architecture Reference"),
     cell_sm("Keep"),
     cell_sm("Reference only"),
     risk_p("Medium"),
     priority_p("P3"),
     cell_sm("Study for patterns. Custom backtest is tailored to VIXOR's signal pipeline.")],

    [cell_sm("GeneTrader"), cell_sm("strategy-opt"), cell_sm("GA optimization for strategy params"),
     cell_sm("No strategy optimization framework."),
     cell_sm("VIXOR does not currently optimize strategy parameters programmatically."),
     cell_sm("Genetic algorithm for parameter optimization and pair selection."),
     cell_sm("Architecture Reference"),
     cell_sm("Keep"),
     cell_sm("Reference only"),
     risk_p("Low"),
     priority_p("P3"),
     cell_sm("Future consideration for strategy optimization. Not needed now.")],
]

story.append(make_table(
    ["Repo", "Cat", "What it Solves", "VIXOR Current", "Problem", "OSS Solution",
     "Rec", "R/K/A", "Method", "Risk", "Pri", "Impact"],
    matrix_rows,
    [38, 32, 55, 60, 55, 55, 35, 35, 38, 25, 20, 72]
))
story.append(Sp(6))
story.append(P(
    "<b>Legend:</b> Rec = Recommendation | R/K/A = Replace/Keep/Adapt | Pri = Priority | "
    "Cat = Category | Method = Integration Method"
, s_body_sm))
story.append(PageBreak())

# ============================================================
# DELIVERABLE 03: ARCHITECTURE V2
# ============================================================
story.append(H1("DELIVERABLE 03 -- VIXOR Architecture V2"))
story.append(Sp(4))
story.append(P(
    "The proposed V2 architecture organizes VIXOR into 11 layers, each clearly delineating what VIXOR owns, "
    "what OSS provides, and what external providers supply. This creates clear boundaries for maintenance, "
    "testing, and future evolution."
))
story.append(Sp(8))

# Architecture diagram as a code block
arch_diagram = """
+---------------------------------------------------+
|  Frontend (React/TanStack)                        |
|  - 37 pages, 41 VIXOR components, 46 shadcn       |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Application Layer                                |
|  - Routes, pages, hooks, layout, navigation       |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  API Layer                                        |
|  - Server functions, cron endpoints, webhooks     |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Domain Layer (23 domains)                        |
|  - Signal, Analysis, Discovery, Backtest, Risk,   |
|    Watchlist, Portfolio, Settings, MOXI, ...      |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  AI/Agent Layer (MOXI + Tool Registry)            |
|  - 4 Agents: Analyst, Governor, Hunter, Coach     |
|  - Tool registry, prompt management, memory       |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Signal/Decision Engine                           |
|  - Transition engine, analysis flow, scoring      |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Event Layer                                      |
|  - Orchestrator, persistence, audit trail         |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Data Normalization                               |
|  - Price resolver, exchange adapters, CCXT        |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Market Data                                      |
|  - Binance WS, DexScreener, TwelveData, Finnhub   |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Token Intelligence                               |
|  - Discovery clients: DexScreener, Birdeye,       |
|    LunarCrush, Helius                              |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Research/Analytics                               |
|  - Backtest, experiment, strategy optimization     |
+---------------------------------------------------+
                      |
+---------------------------------------------------+
|  Database/Cache                                   |
|  - Supabase (47 tables), Upstash Redis            |
+---------------------------------------------------+
"""
story.append(Code(arch_diagram.replace('<', '&lt;').replace('>', '&gt;')))
story.append(Sp(10))

# Layer analysis
story.append(H2("Layer-by-Layer Analysis"))
story.append(Sp(4))

layers = [
    (
        "Layer 1: Frontend (React/TanStack)",
        "VIXOR owns:",
        [
            "All 41 VIXOR components (branded, domain-specific)",
            "All 37 page layouts and compositions",
            "Navigation structure and routing logic",
            "Custom hooks for domain logic",
        ],
        "OSS provides:",
        [
            "shadcn/ui (46 components) -- base primitives",
            "Tailwind CSS -- styling system",
            "TanStack Virtual -- list/table virtualization",
            "TanStack Query -- server state management",
            "Zustand -- client state management",
            "Lightweight Charts -- financial charting",
        ],
        "External provider:",
        [
            "None -- frontend is fully self-contained",
        ],
    ),
    (
        "Layer 2: Application Layer",
        "VIXOR owns:",
        [
            "Route definitions and page mappings",
            "Layout components and navigation",
            "Application-level hooks (auth, theme, etc.)",
            "Error boundaries and loading states",
        ],
        "OSS provides:",
        [
            "TanStack Start -- SSR framework",
            "TanStack Router -- routing",
        ],
        "External provider:",
        [
            "Vercel -- deployment and edge functions",
        ],
    ),
    (
        "Layer 3: API Layer",
        "VIXOR owns:",
        [
            "Server functions (data mutations, queries)",
            "Cron job definitions and scheduling logic",
            "Webhook handlers",
            "API input validation and auth middleware",
        ],
        "OSS provides:",
        [
            "TanStack Start server functions -- API routing",
            "Zod -- schema validation",
        ],
        "External provider:",
        [
            "Vercel Cron -- job scheduling",
            "Supabase Auth -- authentication",
        ],
    ),
    (
        "Layer 4: Domain Layer (23 domains)",
        "VIXOR owns:",
        [
            "All 23 domain modules (signal, analysis, discovery, backtest, risk, watchlist, portfolio, settings, mxi, etc.)",
            "Domain logic, business rules, validation",
            "Domain event definitions",
            "Cross-domain orchestration",
        ],
        "OSS provides:",
        [
            "technicalindicators -- for indicator calculations within signal/analysis domains",
        ],
        "External provider:",
        [
            "OpenAI / Anthropic / Google -- LLM inference for AI domains",
            "Langfuse -- agent observability (self-hosted)",
        ],
    ),
    (
        "Layer 5: AI/Agent Layer (MOXI)",
        "VIXOR owns:",
        [
            "4 MOXI agents: Analyst, Governor, Hunter, Coach",
            "Persona system and agent prompts",
            "Inter-agent communication protocol",
            "Tool definitions and execution logic",
            "Agent memory (user context, conversation history)",
        ],
        "OSS provides:",
        [
            "Langfuse -- tracing, cost tracking, evaluation (self-hosted)",
            "Vercel AI SDK -- streaming response primitives (evaluate)",
        ],
        "External provider:",
        [
            "OpenAI API -- GPT-4/GPT-4o inference",
            