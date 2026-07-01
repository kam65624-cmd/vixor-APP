#!/usr/bin/env python3
"""
VIXOR Nocturne — Page Inventory PDF Generator
Produces a comprehensive multi-page PDF: cover, TOC, design system reference,
36-page detailed inventory, and shared-components appendix.
"""

import json
import sys
import os
import re
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem,
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas
from reportlab.lib.fonts import addMapping

# ── Paths ────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "page_data.json")
OUTPUT_PATH = os.path.join(os.path.dirname(SCRIPT_DIR), "download", "VIXOR_Nocturne_Page_Inventory.pdf")

# ── Nocturne Design Tokens ──────────────────────────────────────────────
BG = HexColor("#0B0D10")
CARD = HexColor("#101317")
CARD_HOVER = HexColor("#16181C")
PRIMARY = HexColor("#7C9BC4")
PRIMARY_GLOW = HexColor("#9FB6D6")
BULLISH = HexColor("#0ECB81")
BEARISH = HexColor("#F6465D")
NEUTRAL_WAIT = HexColor("#F59E0B")
BORDER = HexColor("#1E232A")
BORDER_SUBTLE = HexColor("#1A1D22")
TEXT_PRIMARY = HexColor("#FAFAFA")
TEXT_MUTED = HexColor("#9CA3AF")
TEXT_TERTIARY = HexColor("#6B7280")
INFO = HexColor("#7C9BC4")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm


# ── Custom Flowables ─────────────────────────────────────────────────────

class ColorSwatch(Flowable):
    """Inline color swatch with label."""
    def __init__(self, color_hex, label, width=14, height=14):
        Flowable.__init__(self)
        self.color = HexColor(color_hex)
        self.label = label
        self.swatch_w = width
        self.swatch_h = height
        self.width = width + 4
        self.height = height

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self.swatch_w, self.swatch_h, 3, fill=1, stroke=0)


class SectionDivider(Flowable):
    """0.5px gradient-style divider."""
    def __init__(self, width=None, color=None):
        Flowable.__init__(self)
        self.line_w = width or (PAGE_W - 2 * MARGIN)
        self.line_color = color or BORDER
        self.width = self.line_w
        self.height = 2

    def draw(self):
        self.canv.setStrokeColor(self.line_color)
        self.canv.setLineWidth(0.5)
        self.canv.line(0, 1, self.line_w, 1)


# ── Page Background ─────────────────────────────────────────────────────

def draw_page_bg(canvas_obj, doc):
    """Draw Nocturne dark background on every page."""
    canvas_obj.saveState()
    canvas_obj.setFillColor(BG)
    canvas_obj.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Subtle grid
    canvas_obj.setStrokeColor(HexColor("#1A1D22"))
    canvas_obj.setLineWidth(0.3)
    grid_size = 40
    for x in range(0, int(PAGE_W), grid_size):
        canvas_obj.setStrokeAlpha(0.15)
        canvas_obj.line(x, 0, x, PAGE_H)
    for y in range(0, int(PAGE_H), grid_size):
        canvas_obj.setStrokeAlpha(0.15)
        canvas_obj.line(0, y, PAGE_W, y)
    canvas_obj.restoreState()


def draw_cover_bg(canvas_obj, doc):
    """Enhanced cover page background with accent glow."""
    canvas_obj.saveState()
    canvas_obj.setFillColor(BG)
    canvas_obj.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Accent glow ellipse
    canvas_obj.setFillColor(Color(0.486, 0.608, 0.769, 0.08))  # #7C9BC4 at 8%
    canvas_obj.ellipse(
        PAGE_W * 0.1, PAGE_H * 0.5, PAGE_W * 0.7, PAGE_H * 0.95,
        fill=1, stroke=0
    )
    # Grid
    canvas_obj.setStrokeColor(HexColor("#1A1D22"))
    canvas_obj.setLineWidth(0.3)
    canvas_obj.setStrokeAlpha(0.1)
    grid_size = 40
    for x in range(0, int(PAGE_W), grid_size):
        canvas_obj.line(x, 0, x, PAGE_H)
    for y in range(0, int(PAGE_H), grid_size):
        canvas_obj.line(0, y, PAGE_W, y)
    canvas_obj.restoreState()


# ── Styles ───────────────────────────────────────────────────────────────

def make_styles():
    s = {}
    s["cover_title"] = ParagraphStyle(
        "CoverTitle", fontName="Helvetica-Bold", fontSize=36,
        textColor=TEXT_PRIMARY, alignment=TA_CENTER, leading=44,
        spaceAfter=6 * mm
    )
    s["cover_sub"] = ParagraphStyle(
        "CoverSub", fontName="Helvetica", fontSize=14,
        textColor=TEXT_MUTED, alignment=TA_CENTER, leading=20,
        spaceAfter=4 * mm
    )
    s["cover_meta"] = ParagraphStyle(
        "CoverMeta", fontName="Helvetica", fontSize=10,
        textColor=TEXT_TERTIARY, alignment=TA_CENTER, leading=14,
    )
    s["h1"] = ParagraphStyle(
        "H1", fontName="Helvetica-Bold", fontSize=22,
        textColor=TEXT_PRIMARY, leading=28, spaceBefore=8 * mm, spaceAfter=4 * mm
    )
    s["h2"] = ParagraphStyle(
        "H2", fontName="Helvetica-Bold", fontSize=16,
        textColor=PRIMARY, leading=22, spaceBefore=6 * mm, spaceAfter=3 * mm
    )
    s["h3"] = ParagraphStyle(
        "H3", fontName="Helvetica-Bold", fontSize=13,
        textColor=TEXT_PRIMARY, leading=18, spaceBefore=4 * mm, spaceAfter=2 * mm
    )
    s["body"] = ParagraphStyle(
        "Body", fontName="Helvetica", fontSize=9.5,
        textColor=TEXT_MUTED, leading=14, spaceAfter=2 * mm,
        alignment=TA_JUSTIFY
    )
    s["body_dense"] = ParagraphStyle(
        "BodyDense", fontName="Helvetica", fontSize=8.5,
        textColor=TEXT_MUTED, leading=12, spaceAfter=1.5 * mm,
        alignment=TA_JUSTIFY
    )
    s["label"] = ParagraphStyle(
        "Label", fontName="Helvetica-Bold", fontSize=8,
        textColor=PRIMARY, leading=11, spaceAfter=1 * mm
    )
    s["value"] = ParagraphStyle(
        "Value", fontName="Helvetica", fontSize=9,
        textColor=TEXT_PRIMARY, leading=13, spaceAfter=1.5 * mm
    )
    s["mono"] = ParagraphStyle(
        "Mono", fontName="Courier", fontSize=8,
        textColor=PRIMARY_GLOW, leading=11, spaceAfter=1 * mm,
        backColor=HexColor("#7C9BC410"), borderPadding=3
    )
    s["toc_entry"] = ParagraphStyle(
        "TOCEntry", fontName="Helvetica", fontSize=10,
        textColor=TEXT_MUTED, leading=16, leftIndent=10
    )
    s["toc_cat"] = ParagraphStyle(
        "TOCCat", fontName="Helvetica-Bold", fontSize=11,
        textColor=TEXT_PRIMARY, leading=18, leftIndent=0, spaceBefore=3 * mm
    )
    s["page_num"] = ParagraphStyle(
        "PageNum", fontName="Helvetica", fontSize=8,
        textColor=TEXT_TERTIARY, alignment=TA_RIGHT
    )
    s["footer"] = ParagraphStyle(
        "Footer", fontName="Helvetica", fontSize=7,
        textColor=TEXT_TERTIARY, alignment=TA_CENTER
    )
    s["badge_bullish"] = ParagraphStyle(
        "BadgeBullish", fontName="Helvetica-Bold", fontSize=7,
        textColor=BULLISH, leading=10, alignment=TA_CENTER
    )
    s["badge_bearish"] = ParagraphStyle(
        "BadgeBearish", fontName="Helvetica-Bold", fontSize=7,
        textColor=BEARISH, leading=10, alignment=TA_CENTER
    )
    s["badge_wait"] = ParagraphStyle(
        "BadgeWait", fontName="Helvetica-Bold", fontSize=7,
        textColor=NEUTRAL_WAIT, leading=10, alignment=TA_CENTER
    )
    s["badge_primary"] = ParagraphStyle(
        "BadgePrimary", fontName="Helvetica-Bold", fontSize=7,
        textColor=PRIMARY, leading=10, alignment=TA_CENTER
    )
    return s


# ── Helper Functions ─────────────────────────────────────────────────────

def field_table(label, value, styles, col_widths=None):
    """Create a label-value row table."""
    if col_widths is None:
        col_widths = [35 * mm, PAGE_W - 2 * MARGIN - 35 * mm]
    lbl = Paragraph(f"<b>{label}</b>", styles["label"])
    val = Paragraph(value.replace("\n", "<br/>"), styles["value"]) if isinstance(value, str) else value
    t = Table([[lbl, val]], colWidths=col_widths)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    return t


def density_badge(density, styles):
    """Color-coded density badge."""
    d = density.lower().strip()
    if "very high" in d:
        return Paragraph("● DENSITY: VERY HIGH", styles["badge_bearish"])
    elif "high" in d:
        return Paragraph("● DENSITY: HIGH", styles["badge_wait"])
    elif "medium" in d:
        return Paragraph("● DENSITY: MEDIUM", styles["badge_primary"])
    elif "low" in d:
        return Paragraph("● DENSITY: LOW", styles["badge_bullish"])
    return Paragraph(f"● DENSITY: {d}", styles["badge_primary"])


def token_table(tokens_dict, styles):
    """Create design token tables organized by category."""
    elements = []
    for category, tokens in tokens_dict.items():
        elements.append(Paragraph(category.replace("_", " ").title(), styles["h3"]))
        rows = []
        for prop, value in tokens.items():
            # Extract a clean hex color for swatch (only from pure hex values, not gradients)
            hex_color = None
            val_str = str(value)
            # Use regex to find hex colors that are standalone (7 or 9 chars after #)
            hex_matches = re.findall(r'#([0-9A-Fa-f]{6})\b', val_str)
            if hex_matches:
                hex_color = '#' + hex_matches[0]
            swatch_str = ""
            if hex_color:
                swatch_str = f'<font color="{hex_color}">■</font> '
            prop_p = Paragraph(f'<font name="Courier" size="7.5">{prop}</font>', styles["value"])
            # Escape any < > & in value to avoid XML parsing issues
            safe_value = val_str.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            val_p = Paragraph(f'{swatch_str}<font name="Courier" size="7.5">{safe_value}</font>', styles["mono"])
            rows.append([prop_p, val_p])

        if rows:
            col_w = [50 * mm, PAGE_W - 2 * MARGIN - 50 * mm]
            t = Table(rows, colWidths=col_w)
            t.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor("#0D0F12"), HexColor("#101317")]),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, BORDER_SUBTLE),
            ]))
            elements.append(t)
        elements.append(Spacer(1, 3 * mm))
    return elements


# ── Page Builders ────────────────────────────────────────────────────────

def build_cover(data, styles):
    """Build cover page elements."""
    elements = []
    total = data["meta"]["total_pages"]
    elements.append(Spacer(1, 60 * mm))
    elements.append(Paragraph("VIXOR NOCTURNE", styles["cover_title"]))
    elements.append(Paragraph("Page Inventory", ParagraphStyle(
        "CoverSub2", fontName="Helvetica", fontSize=18,
        textColor=PRIMARY, alignment=TA_CENTER, leading=24, spaceAfter=8 * mm
    )))
    elements.append(SectionDivider(color=PRIMARY))
    elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph(
        f"Complete inventory of {total} application pages<br/>"
        f"Design System V3 — Dark-Glass Aesthetic<br/>"
        f"Framework: TanStack Router + React + Tailwind CSS 4 + shadcn/ui",
        styles["cover_sub"]
    ))
    elements.append(Spacer(1, 20 * mm))

    # Color swatches row
    swatch_data = [
        ("#0B0D10", "Background"),
        ("rgba(255,255,255,0.025)", "Card"),
        ("#7C9BC4", "Primary"),
        ("#0ECB81", "Bullish"),
        ("#F6465D", "Bearish"),
    ]
    swatch_cells = []
    for color_hex, label in swatch_data:
        if color_hex.startswith("rgba"):
            display_hex = "#1A1D22"  # approximate
        else:
            display_hex = color_hex
        cell = Paragraph(
            f'<font color="{display_hex}">■</font> <font size="8" color="#9CA3AF">{label}</font><br/>'
            f'<font name="Courier" size="6.5" color="#6B7280">{color_hex}</font>',
            ParagraphStyle("swatch", alignment=TA_CENTER, leading=11, fontSize=8)
        )
        swatch_cells.append(cell)

    sw = (PAGE_W - 2 * MARGIN) / len(swatch_cells)
    t = Table([swatch_cells], colWidths=[sw] * len(swatch_cells))
    t.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#101317")),
        ("ROUNDEDCORNERS", [6, 6, 6, 6]),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
    ]))
    elements.append(t)

    elements.append(Spacer(1, 30 * mm))
    now = datetime.now().strftime("%B %d, %Y")
    elements.append(Paragraph(
        f"Generated: {now}  •  Version {data['meta']['version']}  •  Last Updated: {data['meta']['last_updated']}",
        styles["cover_meta"]
    ))
    elements.append(PageBreak())
    return elements


def build_toc(data, styles):
    """Build Table of Contents organized by category."""
    elements = []
    elements.append(Paragraph("Table of Contents", styles["h1"]))
    elements.append(SectionDivider(color=PRIMARY))
    elements.append(Spacer(1, 4 * mm))

    page_num = 3  # Cover=1, TOC starts conceptually at 2, content at 3
    for category, pages in data["categories"].items():
        elements.append(Paragraph(f"{category} ({len(pages)} pages)", styles["toc_cat"]))
        for page in pages:
            route, title, *_ = page
            elements.append(Paragraph(
                f'<font color="#6B7280">{'─' * 3}</font>  '
                f'<font color="#FAFAFA"><b>{title}</b></font>  '
                f'<font color="#6B7280" size="8">{route}</font>',
                styles["toc_entry"]
            ))
            page_num += 1

    elements.append(Spacer(1, 6 * mm))
    elements.append(Paragraph("Appendix", styles["toc_cat"]))
    elements.append(Paragraph(
        '<font color="#6B7280">───</font>  Shared Components Inventory',
        styles["toc_entry"]
    ))
    elements.append(PageBreak())
    return elements


def build_design_system(data, styles):
    """Build Design System Quick Reference section."""
    elements = []
    elements.append(Paragraph("Design System Quick Reference", styles["h1"]))
    elements.append(Paragraph(
        "All Nocturne V3 CSS custom properties used across the application. "
        "Colors are sourced from the VIXOR logo (primary navy), Binance trading semantics (bullish/bearish), "
        "and a carefully calibrated dark-glass surface system.",
        styles["body"]
    ))
    elements.append(SectionDivider(color=PRIMARY))
    elements.append(Spacer(1, 3 * mm))

    # Utility Classes
    elements.append(Paragraph("Utility Classes", styles["h2"]))
    utility_classes = [
        ("glass-card", "Glass card with 0.5px border, blur, gradient-glass bg"),
        ("glass-header", "Glass header with blur(16px), saturate(160%)"),
        ("vixor-card", "Solid bg card with shadow-card, 0.5px border"),
        ("nocturne-bg", "Background with accent glow, grid, and base color"),
        ("btn-buy", "Bullish bg, buy-text color, buy-pulse-glow animation"),
        ("btn-sell", "Transparent bg, border, hover border-color transition"),
        ("live-badge", "Pill badge with live-dot-pulse animation"),
        ("terminal-card", "Solid card with 0.5px border, radius-lg"),
        ("terminal-card-accent", "Terminal card with 2px primary left border"),
        ("data-grid", "1px gap grid with border-subtle bg"),
        ("strength-strong/moderate/weak", "Bullish/neutral-wait/bearish colored indicators"),
        ("scenario-primary/alternative/counter", "Left-border accent cards for analysis scenarios"),
        ("text-mono", "JetBrains Mono, tabular-nums for financial data"),
        ("shimmer", "Skeleton loading animation with foreground 8% gradient"),
        ("card-stagger", "Staggered card-enter animation (60ms delays)"),
        ("row-press", "Active state scale(0.985) + bg change for table rows"),
    ]
    for cls_name, desc in utility_classes:
        elements.append(field_table(f".{cls_name}", desc, styles))
    elements.append(Spacer(1, 2 * mm))

    # Animation Keyframes
    elements.append(Paragraph("Animation Keyframes", styles["h2"]))
    animations = [
        ("pulse-dot", "1.8s ease-in-out infinite — scale/opacity pulse"),
        ("shimmer", "1.6s linear infinite — background-position 200% slide"),
        ("buy-pulse-glow", "2.2s ease-in-out infinite — box-shadow 0→16px→0"),
        ("live-dot-pulse", "1.6s ease-in-out infinite — scale 1→0.7→1"),
        ("card-enter", "0.45s ease-out — translateY(6px)→0, opacity 0→1"),
        ("glow-drift", "Slow — translate + scale oscillation"),
        ("line-draw", "stroke-dashoffset 1000→0 for SVG paths"),
        ("vixor-pulse", "1s — opacity 1→0.4, scale 1→0.85"),
        ("spin", "360° rotation for loading"),
    ]
    for anim_name, desc in animations:
        elements.append(field_table(f"@keyframes {anim_name}", desc, styles))
    elements.append(Spacer(1, 2 * mm))

    # Design Tokens
    elements.append(Paragraph("CSS Custom Properties (Design Tokens)", styles["h2"]))
    elements.extend(token_table(data["design_tokens"], styles))

    elements.append(PageBreak())
    return elements


def build_page_inventory(data, styles):
    """Build detailed page inventory for all 36 pages."""
    elements = []
    elements.append(Paragraph("Page Inventory", styles["h1"]))
    elements.append(Paragraph(
        "Detailed inventory of all 36 application pages. Each entry documents route, purpose, "
        "data sources, key UI elements, interactions, information density, and design notes.",
        styles["body"]
    ))
    elements.append(SectionDivider(color=PRIMARY))
    elements.append(Spacer(1, 3 * mm))

    for category, pages in data["categories"].items():
        elements.append(Paragraph(category, styles["h2"]))
        for page in pages:
            route, title, purpose, data_src, ui, interactions, density, notes = page
            # Page card
            elements.append(Spacer(1, 2 * mm))
            # Title row with route
            elements.append(Paragraph(
                f'<font size="14" color="#FAFAFA"><b>{title}</b></font>'
                f'<font size="8" color="#6B7280">  {route}</font>',
                styles["h3"]
            ))
            # Density badge
            elements.append(density_badge(density, styles))
            elements.append(Spacer(1, 1.5 * mm))

            # Fields
            elements.append(field_table("Purpose", purpose, styles))
            elements.append(field_table("Data Sources", data_src, styles))
            elements.append(field_table("Key UI Elements", ui, styles))
            elements.append(field_table("Interactions", interactions, styles))
            elements.append(field_table("Design Notes", notes, styles))
            elements.append(SectionDivider(color=BORDER_SUBTLE))

        elements.append(Spacer(1, 2 * mm))

    elements.append(PageBreak())
    return elements


def build_appendix(data, styles):
    """Build Shared Components appendix."""
    elements = []
    elements.append(Paragraph("Appendix: Shared Components", styles["h1"]))
    elements.append(Paragraph(
        "Inventory of all shared VIXOR Nocturne components used across the application. "
        "These components are located in /src/components/vixor/ and provide consistent "
        "terminal-style UI patterns.",
        styles["body"]
    ))
    elements.append(SectionDivider(color=PRIMARY))
    elements.append(Spacer(1, 3 * mm))

    components = data.get("shared_components", [])
    for comp in components:
        name, desc, usage, sub_components = comp
        elements.append(Paragraph(
            f'<font size="12" color="#FAFAFA"><b>{name}</b></font>',
            styles["h3"]
        ))
        elements.append(field_table("Description", desc, styles))
        elements.append(field_table("Used By", usage, styles))
        elements.append(field_table("Sub-patterns", sub_components, styles))
        elements.append(SectionDivider(color=BORDER_SUBTLE))
        elements.append(Spacer(1, 1 * mm))

    # Stitch Integration Note
    elements.append(Spacer(1, 5 * mm))
    elements.append(Paragraph("Stitch Integration Protocol", styles["h2"]))
    elements.append(Paragraph(
        "When the user sends Stitch-generated code for any page, integrate it into the route file by "
        "keeping the server function imports and data layer intact. The Stitch code should replace only "
        "the component rendering logic within the existing route file structure. Ensure all CSS custom "
        "properties and Nocturne design tokens are preserved.",
        styles["body"]
    ))

    return elements


# ── Main ─────────────────────────────────────────────────────────────────

def main():
    # Load data
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Data file not found: {DATA_PATH}", file=sys.stderr)
        sys.exit(1)

    with open(DATA_PATH, "r") as f:
        data = json.load(f)

    # Verify all page tuples have exactly 8 elements
    total_pages = 0
    for cat, pages in data["categories"].items():
        for i, page in enumerate(pages):
            if len(page) != 8:
                print(f"ERROR: Page tuple in '{cat}' index {i} has {len(page)} elements, expected 8: {page[:2]}", file=sys.stderr)
                sys.exit(1)
            total_pages += 1

    print(f"Verified: {total_pages} pages, all with 8-element tuples")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    # Create PDF
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN,
        title="VIXOR Nocturne — Page Inventory",
        author="VIXOR",
        subject=f"Complete inventory of {total_pages} pages",
    )

    styles = make_styles()

    # Build content
    elements = []
    elements.extend(build_cover(data, styles))
    elements.extend(build_toc(data, styles))
    elements.extend(build_design_system(data, styles))
    elements.extend(build_page_inventory(data, styles))
    elements.extend(build_appendix(data, styles))

    # Build with page templates
    doc.build(
        elements,
        onFirstPage=draw_cover_bg,
        onLaterPages=draw_page_bg,
    )

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f"SUCCESS: PDF generated at {OUTPUT_PATH}")
    print(f"  Size: {file_size / 1024:.1f} KB")
    print(f"  Pages: {total_pages} page inventory entries")
    print(f"  Categories: {len(data['categories'])}")
    print(f"  Shared Components: {len(data.get('shared_components', []))}")


if __name__ == "__main__":
    main()