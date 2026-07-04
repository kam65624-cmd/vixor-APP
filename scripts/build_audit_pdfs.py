"""
Generate two PDFs for Mahmoud:
1. VIXOR Current State Audit (Arabic) - from audit/vixor_current_state.md
2. QuantDinger Technical Inventory (English) - from audit/quantdinger_inventory.md
3. VIXOR × QuantDinger Integration Strategy (Arabic) - from download/VIXOR_QuantDinger_Integration_Strategy.md

Uses ReportLab with Amiri font for Arabic + DejaVu Sans for English.
Arabic text is shaped using arabic_reshaper + python-bidi for proper RTL display.
"""
import os
import re
import sys
from pathlib import Path

# Try to import Arabic shaping libs - they're optional
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    HAS_ARABIC = True
except ImportError:
    print("Installing arabic-reshaper and python-bidi...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "arabic-reshaper", "python-bidi"])
    import arabic_reshaper
    from bidi.algorithm import get_display
    HAS_ARABIC = True

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, ListFlowable, ListItem,
    HRFlowable, Image, Preformatted, NextPageTemplate, PageTemplate, Frame
)
from reportlab.platypus.flowables import Flowable
from reportlab.pdfgen import canvas

# ===================== FONT REGISTRATION =====================

ARABIC_FONT_DIR = "/home/z/my-project/fonts/arabic"
ENGLISH_FONT_DIR = "/usr/share/fonts/truetype/dejavu"
MONO_FONT_DIR = "/usr/share/fonts/truetype/dejavu"

# Arabic fonts
pdfmetrics.registerFont(TTFont("Amiri", os.path.join(ARABIC_FONT_DIR, "Amiri-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Amiri-Bold", os.path.join(ARABIC_FONT_DIR, "Amiri-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Amiri-Italic", os.path.join(ARABIC_FONT_DIR, "Amiri-Italic.ttf")))

# English fonts
pdfmetrics.registerFont(TTFont("DejaVu", os.path.join(ENGLISH_FONT_DIR, "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", os.path.join(ENGLISH_FONT_DIR, "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Italic", os.path.join(ENGLISH_FONT_DIR, "DejaVuSansMono-Oblique.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Mono", os.path.join(MONO_FONT_DIR, "DejaVuSansMono.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Mono-Bold", os.path.join(MONO_FONT_DIR, "DejaVuSansMono-Bold.ttf")))

from reportlab.pdfbase.pdfmetrics import registerFontFamily
registerFontFamily("Amiri", normal="Amiri", bold="Amiri-Bold", italic="Amiri-Italic", boldItalic="Amiri-Bold")
registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu-Italic", boldItalic="DejaVu-Bold")
registerFontFamily("DejaVu-Mono", normal="DejaVu-Mono", bold="DejaVu-Mono-Bold")

# ===================== COLOR PALETTE =====================

# Bloomberg-inspired dark accent palette
C_PRIMARY = HexColor("#0F172A")      # Dark slate
C_ACCENT = HexColor("#10B981")       # Emerald green
C_ACCENT_DARK = HexColor("#047857")
C_BEARISH = HexColor("#EF4444")      # Red
C_WARN = HexColor("#F59E0B")         # Amber
C_INFO = HexColor("#3B82F6")         # Blue
C_BG_LIGHT = HexColor("#F8FAFC")
C_BG_TABLE = HexColor("#F1F5F9")
C_BG_TABLE_ALT = HexColor("#E2E8F0")
C_BORDER = HexColor("#CBD5E1")
C_TEXT = HexColor("#0F172A")
C_TEXT_MUTED = HexColor("#475569")

# ===================== HELPER FUNCTIONS =====================

ARABIC_CHARS_RE = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]')

def is_arabic_text(text: str) -> bool:
    """Detect if text contains Arabic characters."""
    if not text:
        return False
    return bool(ARABIC_CHARS_RE.search(text))

def shape_arabic(text: str) -> str:
    """Reshape and apply BiDi to Arabic text for proper RTL display."""
    if not text:
        return text
    # Only shape if there are Arabic chars
    if not is_arabic_text(text):
        return text
    reshaped = arabic_reshaper.reshape(text)
    return get_display(reshaped)

def escape_xml(text: str) -> str:
    """Escape XML special chars for ReportLab Paragraph."""
    if not text:
        return ""
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    return text

def process_inline(text: str, is_arabic: bool) -> str:
    """Process inline markdown: bold, code, links. Returns ReportLab markup."""
    if not text:
        return ""
    # Escape first
    text = escape_xml(text)
    
    # Inline code: `code` -> <font name="DejaVu-Mono">code</font>
    # Use placeholder to avoid clashes with bold/italic processing
    code_blocks = []
    def code_repl(m):
        code_blocks.append(m.group(1))
        return f'\x00CODE{len(code_blocks)-1}\x00'
    text = re.sub(r'`([^`]+)`', code_repl, text)
    
    # Bold: **text** or __text__
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'__([^_]+)__', r'<b>\1</b>', text)
    
    # Italic: *text* or _text_
    # Careful: only single * or _ (not ** or __)
    text = re.sub(r'(?<!\*)\*([^*\n]+)\*(?!\*)', r'<i>\1</i>', text)
    text = re.sub(r'(?<!_)_([^_\n]+)_(?!_)', r'<i>\1</i>', text)
    
    # Links: [text](url) -> <link href="url">text</link>
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<link href="\2" color="#3B82F6"><u>\1</u></link>', text)
    
    # Restore code blocks (after italic/bold to avoid mangling)
    def code_restore(m):
        idx = int(m.group(1))
        return f'<font name="DejaVu-Mono" color="#DC2626">{code_blocks[idx]}</font>'
    text = re.sub(r'\x00CODE(\d+)\x00', code_restore, text)
    
    # Now shape Arabic if needed
    # But we have HTML tags now - we need to shape only the text portions, not the tags
    # Split by tags, shape text parts, rejoin
    parts = re.split(r'(<[^>]+>)', text)
    if is_arabic:
        shaped_parts = []
        for part in parts:
            if part.startswith('<'):
                shaped_parts.append(part)
            else:
                # Shape Arabic substrings within this part
                # Split by non-Arabic word boundaries
                subparts = re.split(r'(\s+)', part)
                for sp in subparts:
                    if is_arabic_text(sp):
                        shaped_parts.append(shape_arabic(sp))
                    else:
                        shaped_parts.append(sp)
        text = ''.join(shaped_parts)
    
    return text

# ===================== STYLES =====================

def make_styles(is_arabic: bool):
    """Build paragraph styles for the document."""
    base_font = "Amiri" if is_arabic else "DejaVu"
    bold_font = "Amiri-Bold" if is_arabic else "DejaVu-Bold"
    mono_font = "DejaVu-Mono"
    align = TA_RIGHT if is_arabic else TA_LEFT
    
    styles = {}
    
    styles['Title'] = ParagraphStyle(
        name='Title',
        fontName=bold_font,
        fontSize=26,
        leading=34,
        alignment=TA_CENTER,
        textColor=C_PRIMARY,
        spaceBefore=0,
        spaceAfter=12,
    )
    
    styles['Subtitle'] = ParagraphStyle(
        name='Subtitle',
        fontName=base_font,
        fontSize=14,
        leading=20,
        alignment=TA_CENTER,
        textColor=C_TEXT_MUTED,
        spaceAfter=24,
    )
    
    styles['H1'] = ParagraphStyle(
        name='H1',
        fontName=bold_font,
        fontSize=20,
        leading=28,
        alignment=align,
        textColor=C_PRIMARY,
        spaceBefore=24,
        spaceAfter=12,
        borderPadding=4,
        leftIndent=0 if not is_arabic else 0,
        rightIndent=0 if not is_arabic else 0,
    )
    
    styles['H2'] = ParagraphStyle(
        name='H2',
        fontName=bold_font,
        fontSize=16,
        leading=22,
        alignment=align,
        textColor=C_ACCENT_DARK,
        spaceBefore=18,
        spaceAfter=8,
    )
    
    styles['H3'] = ParagraphStyle(
        name='H3',
        fontName=bold_font,
        fontSize=13,
        leading=18,
        alignment=align,
        textColor=C_TEXT,
        spaceBefore=14,
        spaceAfter=6,
    )
    
    styles['H4'] = ParagraphStyle(
        name='H4',
        fontName=bold_font,
        fontSize=11,
        leading=16,
        alignment=align,
        textColor=C_INFO,
        spaceBefore=10,
        spaceAfter=4,
    )
    
    styles['Body'] = ParagraphStyle(
        name='Body',
        fontName=base_font,
        fontSize=10,
        leading=15,
        alignment=align,
        textColor=C_TEXT,
        spaceBefore=0,
        spaceAfter=6,
        firstLineIndent=0,
    )
    
    styles['BodyJustify'] = ParagraphStyle(
        name='BodyJustify',
        fontName=base_font,
        fontSize=10,
        leading=15,
        alignment=align,  # use left/right not justify for Arabic
        textColor=C_TEXT,
        spaceBefore=0,
        spaceAfter=6,
    )
    
    styles['Bullet'] = ParagraphStyle(
        name='Bullet',
        fontName=base_font,
        fontSize=10,
        leading=14,
        alignment=align,
        textColor=C_TEXT,
        spaceBefore=2,
        spaceAfter=2,
        leftIndent=20 if not is_arabic else 0,
        rightIndent=0 if not is_arabic else 20,
        bulletIndent=8 if not is_arabic else 0,
    )
    
    styles['Code'] = ParagraphStyle(
        name='Code',
        fontName=mono_font,
        fontSize=8,
        leading=11,
        alignment=TA_LEFT,
        textColor=C_PRIMARY,
        backColor=C_BG_LIGHT,
        borderColor=C_BORDER,
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=8,
        leftIndent=8,
        rightIndent=8,
    )
    
    styles['Quote'] = ParagraphStyle(
        name='Quote',
        fontName=base_font,
        fontSize=10,
        leading=14,
        alignment=align,
        textColor=C_TEXT_MUTED,
        leftIndent=16 if not is_arabic else 0,
        rightIndent=0 if not is_arabic else 16,
        spaceBefore=6,
        spaceAfter=6,
        fontStyle='italic',
    )
    
    styles['TableCell'] = ParagraphStyle(
        name='TableCell',
        fontName=base_font,
        fontSize=9,
        leading=12,
        alignment=align,
        textColor=C_TEXT,
    )
    
    styles['TableHeader'] = ParagraphStyle(
        name='TableHeader',
        fontName=bold_font,
        fontSize=9,
        leading=12,
        alignment=TA_CENTER,
        textColor=white,
    )
    
    styles['CoverTitle'] = ParagraphStyle(
        name='CoverTitle',
        fontName=bold_font,
        fontSize=32,
        leading=40,
        alignment=TA_CENTER,
        textColor=white,
        spaceAfter=12,
    )
    
    styles['CoverSubtitle'] = ParagraphStyle(
        name='CoverSubtitle',
        fontName=base_font,
        fontSize=14,
        leading=20,
        alignment=TA_CENTER,
        textColor=HexColor("#94A3B8"),
        spaceAfter=24,
    )
    
    styles['CoverFooter'] = ParagraphStyle(
        name='CoverFooter',
        fontName=base_font,
        fontSize=10,
        leading=14,
        alignment=TA_CENTER,
        textColor=HexColor("#94A3B8"),
    )
    
    return styles

# ===================== COVER PAGE =====================

def draw_cover_background(canv, doc, accent_color=C_ACCENT):
    """Draw full-page dark cover background directly on canvas."""
    width, height = A4
    # Dark background
    canv.setFillColor(C_PRIMARY)
    canv.rect(0, 0, width, height, fill=1, stroke=0)
    # Top accent bar
    canv.setFillColor(accent_color)
    canv.rect(0, height - 8*mm, width, 8*mm, fill=1, stroke=0)
    # Side accent line
    canv.setFillColor(accent_color)
    canv.rect(0, 0, 4*mm, height, fill=1, stroke=0)
    # Decorative dots / grid pattern at bottom
    canv.setFillColor(HexColor("#1E293B"))
    for x in range(0, int(width), 12):
        for y in range(0, 60, 12):
            canv.circle(x + 6, y + 6, 1, fill=1, stroke=0)
    # Top-right corner accent
    canv.setFillColor(accent_color)
    canv.circle(width - 20*mm, height - 20*mm, 3, fill=1, stroke=0)

def build_cover_content(title: str, subtitle: str, footer: str, is_arabic: bool, styles):
    """Build cover page text content (without background, which is drawn on canvas)."""
    elements = []
    elements.append(Spacer(1, 80*mm))
    # Title - white on dark
    title_shaped = shape_arabic(title) if is_arabic else title
    elements.append(Paragraph(f'<font color="white">{escape_xml(title_shaped)}</font>', styles['CoverTitle']))
    # Subtitle - light gray on dark
    elements.append(Spacer(1, 8*mm))
    sub_shaped = shape_arabic(subtitle) if is_arabic else subtitle
    elements.append(Paragraph(f'<font color="#94A3B8">{escape_xml(sub_shaped)}</font>', styles['CoverSubtitle']))
    elements.append(Spacer(1, 100*mm))
    # Footer
    foot_shaped = shape_arabic(footer) if is_arabic else footer
    elements.append(Paragraph(f'<font color="#94A3B8">{escape_xml(foot_shaped)}</font>', styles['CoverFooter']))
    elements.append(PageBreak())
    return elements

# ===================== MARKDOWN PARSER =====================

def parse_markdown_to_flowables(md_text: str, is_arabic: bool, styles):
    """Parse markdown text into ReportLab flowables."""
    flowables = []
    lines = md_text.split('\n')
    i = 0
    in_code_block = False
    code_buffer = []
    code_lang = ""
    
    while i < len(lines):
        line = lines[i]
        line_no_newline = line.rstrip('\n')
        
        # Code block fence
        if line_no_newline.strip().startswith('```'):
            if in_code_block:
                # End code block
                code_text = '\n'.join(code_buffer)
                if code_text.strip():
                    # Escape XML in code
                    code_escaped = escape_xml(code_text)
                    # Split into lines for proper wrapping
                    flowables.append(Preformatted(code_escaped, styles['Code']))
                code_buffer = []
                in_code_block = False
                i += 1
                continue
            else:
                # Start code block
                in_code_block = True
                code_lang = line_no_newline.strip()[3:].strip()
                code_buffer = []
                i += 1
                continue
        
        if in_code_block:
            code_buffer.append(line_no_newline)
            i += 1
            continue
        
        # Horizontal rule
        if re.match(r'^---+\s*$', line_no_newline) or re.match(r'^\*\*\*+\s*$', line_no_newline):
            flowables.append(Spacer(1, 4))
            flowables.append(HRFlowable(
                width="100%", thickness=0.5, color=C_BORDER,
                spaceBefore=4, spaceAfter=8
            ))
            i += 1
            continue
        
        # Empty line
        if not line_no_newline.strip():
            flowables.append(Spacer(1, 4))
            i += 1
            continue
        
        # Headings
        m = re.match(r'^(#{1,6})\s+(.*)$', line_no_newline)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            processed = process_inline(text, is_arabic)
            style_key = f'H{min(level, 4)}'
            flowables.append(Paragraph(processed, styles[style_key]))
            # Add a thin underline for H1 and H2
            if level <= 2:
                flowables.append(HRFlowable(
                    width="100%", thickness=0.5, color=C_ACCENT if level == 1 else C_BORDER,
                    spaceBefore=2, spaceAfter=8
                ))
            i += 1
            continue
        
        # Blockquote
        if line_no_newline.strip().startswith('>'):
            quote_text = line_no_newline.strip()[1:].strip()
            processed = process_inline(quote_text, is_arabic)
            flowables.append(Paragraph(processed, styles['Quote']))
            i += 1
            continue
        
        # Table detection: line with | and next line with |---|
        if '|' in line_no_newline and i + 1 < len(lines) and re.match(r'^[\s|:-]+$', lines[i+1]) and '|' in lines[i+1]:
            # Parse table
            table_lines = [line_no_newline]
            i += 1
            table_lines.append(lines[i])  # separator
            i += 1
            while i < len(lines) and '|' in lines[i] and lines[i].strip():
                table_lines.append(lines[i].rstrip('\n'))
                i += 1
            
            # Parse table structure
            rows = []
            for tl in table_lines:
                # Skip separator
                if re.match(r'^[\s|:-]+$', tl):
                    continue
                # Split by | and strip
                cells = [c.strip() for c in tl.split('|')]
                # Remove empty first/last from leading/trailing |
                if cells and cells[0] == '':
                    cells = cells[1:]
                if cells and cells[-1] == '':
                    cells = cells[:-1]
                rows.append(cells)
            
            if rows:
                # Build table
                header = rows[0]
                body_rows = rows[1:]
                
                # Wrap each cell in a Paragraph for proper wrapping
                table_data = []
                # Header
                header_cells = []
                for cell in header:
                    cell_processed = process_inline(cell, is_arabic)
                    header_cells.append(Paragraph(cell_processed, styles['TableHeader']))
                table_data.append(header_cells)
                
                # Body
                for row in body_rows:
                    row_cells = []
                    for cell in row:
                        cell_processed = process_inline(cell, is_arabic)
                        row_cells.append(Paragraph(cell_processed, styles['TableCell']))
                    # Pad if needed
                    while len(row_cells) < len(header):
                        row_cells.append(Paragraph('', styles['TableCell']))
                    table_data.append(row_cells)
                
                # Calculate column widths
                page_width = A4[0] - 2 * 20*mm
                num_cols = len(header)
                col_width = page_width / num_cols
                col_widths = [col_width] * num_cols
                
                # Build table
                tbl = Table(table_data, colWidths=col_widths, repeatRows=1)
                tbl.setStyle(TableStyle([
                    # Header
                    ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
                    ('TEXTCOLOR', (0, 0), (-1, 0), white),
                    ('FONTNAME', (0, 0), (-1, 0), 'DejaVu-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 9),
                    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TOPPADDING', (0, 0), (-1, 0), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
                    # Body alternating
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_BG_LIGHT, white]),
                    ('FONTNAME', (0, 1), (-1, -1), 'DejaVu'),
                    ('FONTSIZE', (0, 1), (-1, -1), 9),
                    ('TEXTCOLOR', (0, 1), (-1, -1), C_TEXT),
                    # Borders
                    ('GRID', (0, 0), (-1, -1), 0.25, C_BORDER),
                    ('LEFTPADDING', (0, 0), (-1, -1), 4),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 1), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
                ]))
                flowables.append(tbl)
                flowables.append(Spacer(1, 6))
            continue
        
        # Bullet list items (-, *, +)
        m = re.match(r'^(\s*)([-*+])\s+(.*)$', line_no_newline)
        if m:
            indent = len(m.group(1))
            bullet_char = m.group(2)
            text = m.group(3).strip()
            processed = process_inline(text, is_arabic)
            # Build bullet with appropriate indent
            indent_level = indent // 2
            bullet_style = ParagraphStyle(
                name=f'Bullet{indent_level}',
                parent=styles['Bullet'],
                leftIndent=(20 + 16 * indent_level) if not is_arabic else 0,
                rightIndent=0 if not is_arabic else (20 + 16 * indent_level),
                bulletIndent=(8 + 16 * indent_level) if not is_arabic else 0,
                bulletFontName='DejaVu',
                bulletFontSize=10,
            )
            # Use • for first level, ◦ for second, ▪ for third
            bullet_glyph = '•' if indent_level == 0 else ('◦' if indent_level == 1 else '▪')
            if is_arabic:
                # For Arabic, bullet on the right
                bullet_para = Paragraph(
                    f'<font color="#10B981">{bullet_glyph}</font>&nbsp;&nbsp;{processed}',
                    bullet_style
                )
            else:
                bullet_para = Paragraph(
                    f'{processed}',
                    bullet_style,
                    bulletText=bullet_glyph
                )
            flowables.append(bullet_para)
            i += 1
            continue
        
        # Numbered list items (1., 2., etc.)
        m = re.match(r'^(\s*)(\d+)\.\s+(.*)$', line_no_newline)
        if m:
            indent = len(m.group(1))
            num = m.group(2)
            text = m.group(3).strip()
            processed = process_inline(text, is_arabic)
            indent_level = indent // 2
            num_style = ParagraphStyle(
                name=f'Num{indent_level}',
                parent=styles['Bullet'],
                leftIndent=(24 + 16 * indent_level) if not is_arabic else 0,
                rightIndent=0 if not is_arabic else (24 + 16 * indent_level),
                bulletIndent=(8 + 16 * indent_level) if not is_arabic else 0,
            )
            if is_arabic:
                num_para = Paragraph(
                    f'<font color="#10B981"><b>{num}.</b></font>&nbsp;&nbsp;{processed}',
                    num_style
                )
            else:
                num_para = Paragraph(
                    processed,
                    num_style,
                    bulletText=f'{num}.'
                )
            flowables.append(num_para)
            i += 1
            continue
        
        # Regular paragraph (collect consecutive non-empty, non-special lines)
        para_lines = [line_no_newline]
        j = i + 1
        while j < len(lines):
            next_line = lines[j].rstrip('\n')
            if (not next_line.strip() or
                re.match(r'^#{1,6}\s', next_line) or
                re.match(r'^[-*+]\s', next_line) or
                re.match(r'^\d+\.\s', next_line) or
                next_line.strip().startswith('>') or
                next_line.strip().startswith('```') or
                re.match(r'^---+\s*$', next_line) or
                ('|' in next_line and j + 1 < len(lines) and re.match(r'^[\s|:-]+$', lines[j+1]))):
                break
            para_lines.append(next_line)
            j += 1
        
        para_text = ' '.join(para_lines).strip()
        if para_text:
            processed = process_inline(para_text, is_arabic)
            flowables.append(Paragraph(processed, styles['Body']))
        
        i = j
    
    # Flush any remaining code block
    if in_code_block and code_buffer:
        code_text = '\n'.join(code_buffer)
        if code_text.strip():
            code_escaped = escape_xml(code_text)
            flowables.append(Preformatted(code_escaped, styles['Code']))
    
    return flowables

# ===================== PAGE TEMPLATE =====================

def make_page_decorator(title: str, is_arabic: bool):
    """Create onPage callback for header/footer."""
    def on_page(canv, doc):
        canv.saveState()
        # Page number at bottom
        page_num = canv.getPageNumber()
        if page_num > 1:  # Skip cover
            # Footer
            canv.setFont('DejaVu', 8)
            canv.setFillColor(C_TEXT_MUTED)
            if is_arabic:
                # Page number on left for Arabic RTL
                canv.drawRightString(A4[0] - 20*mm, 10*mm, str(page_num))
                canv.drawString(20*mm, 10*mm, shape_arabic(title) if is_arabic else title)
            else:
                canv.drawRightString(A4[0] - 20*mm, 10*mm, f"{title}  |  Page {page_num}")
            
            # Top thin accent line
            canv.setStrokeColor(C_ACCENT)
            canv.setLineWidth(0.5)
            canv.line(20*mm, A4[1] - 15*mm, A4[0] - 20*mm, A4[1] - 15*mm)
        canv.restoreState()
    return on_page

# ===================== MAIN BUILDERS =====================

def build_pdf(md_path: str, output_path: str, title: str, subtitle: str, 
              footer: str, is_arabic: bool):
    """Build a single PDF from markdown source."""
    print(f"\n{'='*60}")
    print(f"Building PDF: {output_path}")
    print(f"Source: {md_path}")
    print(f"Language: {'Arabic (RTL)' if is_arabic else 'English (LTR)'}")
    print(f"{'='*60}")
    
    # Read markdown
    with open(md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()
    
    # Setup styles
    styles = make_styles(is_arabic)
    
    # Create document with custom page templates
    page_w, page_h = A4
    # Cover frame: full page with light padding
    frame_cover = Frame(20*mm, 18*mm, page_w - 40*mm, page_h - 40*mm, id='cover',
                        leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0)
    # Content frame: standard margins
    frame_normal = Frame(20*mm, 18*mm, page_w - 40*mm, page_h - 40*mm, id='normal',
                         leftPadding=0, rightPadding=0,
                         topPadding=0, bottomPadding=0)
    
    # Cover page: dark background, no header/footer
    def on_cover_page(canv, doc):
        draw_cover_background(canv, doc)
    
    # Content page: light background, header/footer
    def on_content_page(canv, doc):
        canv.saveState()
        page_num = canv.getPageNumber()
        # Footer
        canv.setFont('DejaVu', 8)
        canv.setFillColor(C_TEXT_MUTED)
        if is_arabic:
            canv.drawRightString(page_w - 20*mm, 10*mm, str(page_num))
            title_shaped = shape_arabic(title) if is_arabic else title
            canv.drawString(20*mm, 10*mm, title_shaped)
        else:
            canv.drawRightString(page_w - 20*mm, 10*mm, f"{title}  |  Page {page_num}")
        
        # Top thin accent line
        canv.setStrokeColor(C_ACCENT)
        canv.setLineWidth(0.5)
        canv.line(20*mm, page_h - 15*mm, page_w - 20*mm, page_h - 15*mm)
        canv.restoreState()
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=20*mm,
        rightMargin=20*mm,
        topMargin=22*mm,
        bottomMargin=18*mm,
        title=title,
        author="VIXOR Master V2",
        subject=subtitle,
        creator="Z.ai",
    )
    
    doc.addPageTemplates([
        PageTemplate(id='Cover', frames=[frame_cover], onPage=on_cover_page),
        PageTemplate(id='Content', frames=[frame_normal], onPage=on_content_page),
    ])
    
    # Build flowables
    flowables = []
    
    # Cover content (background drawn on canvas)
    flowables.extend(build_cover_content(title, subtitle, footer, is_arabic, styles))
    
    # Switch to content template for the rest
    flowables.append(NextPageTemplate('Content'))
    
    # Parse markdown content
    content_flowables = parse_markdown_to_flowables(md_text, is_arabic, styles)
    flowables.extend(content_flowables)
    
    # Build
    doc.build(flowables)
    
    # Get file size
    size_kb = os.path.getsize(output_path) / 1024
    print(f"✓ Generated: {output_path}")
    print(f"  Size: {size_kb:.1f} KB")
    
    return output_path

# ===================== ENTRY POINT =====================

if __name__ == "__main__":
    base = "/home/z/my-project"
    
    # PDF 1: VIXOR Current State Audit (Arabic)
    build_pdf(
        md_path=f"{base}/audit/vixor_current_state.md",
        output_path=f"{base}/download/VIXOR_Current_State_Audit.pdf",
        title="VIXOR MASTER V2 — تدقيق الحالة الحالية",
        subtitle="تقييم شامل لجاهزية التطبيق ونقاط الفشل",
        footer="VIXOR MASTER V2  •  تقرير تدقيق  •  2026-06-18",
        is_arabic=True,
    )
    
    # PDF 2: QuantDinger Technical Inventory (English)
    build_pdf(
        md_path=f"{base}/audit/quantdinger_inventory.md",
        output_path=f"{base}/download/QuantDinger_Technical_Inventory.pdf",
        title="QuantDinger — Technical Inventory",
        subtitle="Comprehensive Module-by-Module Analysis for VIXOR Reuse Decision",
        footer="QuantDinger Inventory  •  Reuse Assessment  •  2026-06-18",
        is_arabic=False,
    )
    
    # PDF 3: Integration Strategy (Arabic)
    build_pdf(
        md_path=f"{base}/download/VIXOR_QuantDinger_Integration_Strategy.md",
        output_path=f"{base}/download/VIXOR_QuantDinger_Integration_Strategy.pdf",
        title="VIXOR × QuantDinger — استراتيجية التكامل",
        subtitle="خطة Build vs Reuse vs Keep لـ 31 ميزة على 4 مراحل",
        footer="استراتيجية التكامل  •  VIXOR × QuantDinger  •  2026-06-18",
        is_arabic=True,
    )
    
    print(f"\n{'='*60}")
    print(f"✓ All 3 PDFs generated successfully in /home/z/my-project/download/")
    print(f"{'='*60}")
