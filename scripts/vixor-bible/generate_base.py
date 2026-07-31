"""
VIXOR Engineering Bible — Base HTML Template Generator
Creates professional Arabic RTL PDF documents with VIXOR dark theme.
"""

import os

OUTPUT_DIR = "/home/z/my-project/download/vixor-bible"


def generate_vixor_html(title: str, subtitle: str, doc_id: str, chapters: list[dict], footer_text: str = "VIXOR Engineering Bible") -> str:
    """
    Generate a complete VIXOR-branded Arabic RTL HTML document.

    chapters: list of {"tag": str, "title": str, "content": str}
    content can contain: <p>, <h3>, <ul><li>, <table>, <div class="callout">, <div class="card-grid"><div class="info-card">
    """

    chapters_html = ""
    for ch in chapters:
        chapters_html += f"""
        <div class="chapter-header">
            <div class="section-tag">{ch['tag']}</div>
            <div class="section-title">{ch['title']}</div>
            <div class="divider"></div>
        </div>
        {ch['content']}
        """

    toc_html = generate_toc_html(chapters)

    html = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
@page {{
    size: 210mm 297mm;
    margin: 0;
}}
:root {{
    --bg-base: #08090C;
    --bg-card: #101114;
    --bg-elevated: #16171C;
    --bg-code: #1A1B21;
    --primary: #6366F1;
    --primary-glow: #818CF8;
    --bullish: #22D3A6;
    --bearish: #FB4667;
    --amber: #F5A623;
    --gold: #F0C419;
    --text-primary: #F0F0F2;
    --text-secondary: #9498A8;
    --text-muted: #565A66;
    --border: rgba(255,255,255,0.08);
    --border-subtle: rgba(255,255,255,0.04);
    --font-ar: 'Noto Sans Arabic', 'Inter', sans-serif;
    --font-en: 'Inter', 'Noto Sans Arabic', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
}}
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{
    margin: 0;
    padding: 0;
    width: 100%;
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-ar);
    font-size: 11pt;
    line-height: 1.75;
    direction: rtl;
    -webkit-font-smoothing: antialiased;
}}
@media screen {{
    html {{ height: auto; display: flex; justify-content: center; background: #222; }}
    body {{ max-width: 210mm; margin: 20px auto; box-shadow: 0 0 60px rgba(0,0,0,0.5); }}
}}

/* ===== COVER ===== */
.cover {{
    width: 100%;
    height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    break-after: page;
    background: var(--bg-base);
    padding: 60px 50px;
}}
.cover::before {{
    content: '';
    position: absolute;
    top: -120px;
    right: -120px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    border-radius: 50%;
}}
.cover::after {{
    content: '';
    position: absolute;
    bottom: -80px;
    left: -80px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(34,211,166,0.1) 0%, transparent 70%);
    border-radius: 50%;
}}
.cover-badge {{
    display: inline-block;
    padding: 8px 24px;
    border: 1px solid var(--primary);
    border-radius: 100px;
    color: var(--primary-glow);
    font-family: var(--font-en);
    font-size: 10pt;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 32px;
    position: relative;
    z-index: 1;
}}
.cover-doc-id {{
    font-family: var(--font-mono);
    font-size: 9pt;
    color: var(--text-muted);
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
}}
.cover-title {{
    font-size: 32pt;
    font-weight: 800;
    line-height: 1.3;
    color: var(--text-primary);
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
}}
.cover-subtitle {{
    font-size: 13pt;
    color: var(--text-secondary);
    max-width: 500px;
    line-height: 1.7;
    margin-bottom: 40px;
    position: relative;
    z-index: 1;
}}
.cover-line {{
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--bullish));
    border-radius: 2px;
    margin-bottom: 24px;
    position: relative;
    z-index: 1;
}}
.cover-footer {{
    position: absolute;
    bottom: 40px;
    left: 0;
    right: 0;
    text-align: center;
    font-family: var(--font-en);
    font-size: 8pt;
    color: var(--text-muted);
    letter-spacing: 1px;
}}

/* ===== TABLE OF CONTENTS ===== */
.toc {{
    padding: 50px 60px 40px 60px;
    break-after: page;
}}
.toc-title {{
    font-size: 18pt;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 28px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
}}
.toc-item {{
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-subtle);
    font-size: 10.5pt;
}}
.toc-item-tag {{
    color: var(--primary-glow);
    font-family: var(--font-mono);
    font-size: 8.5pt;
    margin-left: 10px;
    flex-shrink: 0;
}}
.toc-item-title {{
    color: var(--text-primary);
    flex-grow: 1;
}}

/* ===== MAIN CONTENT ===== */
.main-content {{
    padding: 40px 60px 50px 60px;
}}
.chapter-header {{
    break-after: avoid;
    break-inside: avoid;
    margin-top: 28px;
}}
.section-tag {{
    font-family: var(--font-mono);
    font-size: 8.5pt;
    color: var(--primary-glow);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 6px;
}}
.section-title {{
    font-size: 18pt;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: 8px;
}}
.divider {{
    width: 40px;
    height: 2px;
    background: var(--primary);
    border-radius: 1px;
    margin-bottom: 20px;
}}

/* ===== BODY TEXT ===== */
.body-text {{
    font-size: 11pt;
    color: var(--text-secondary);
    line-height: 1.8;
    margin-bottom: 14px;
    text-align: justify;
}}
.body-text strong {{
    color: var(--text-primary);
    font-weight: 600;
}}
.body-text code {{
    font-family: var(--font-mono);
    font-size: 9.5pt;
    background: var(--bg-code);
    padding: 2px 7px;
    border-radius: 4px;
    color: var(--primary-glow);
    direction: ltr;
    display: inline-block;
}}

/* ===== SUBSECTION ===== */
.subsection {{
    margin-top: 22px;
    margin-bottom: 12px;
}}
.subsection-title {{
    font-size: 13pt;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 10px;
    padding-right: 12px;
    border-right: 3px solid var(--primary);
}}

/* ===== CALLOUT ===== */
.callout {{
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-right: 3px solid var(--primary);
    border-radius: 8px;
    padding: 16px 20px;
    margin: 16px 0;
    break-inside: avoid;
}}
.callout-warn {{
    border-right-color: var(--amber);
}}
.callout-danger {{
    border-right-color: var(--bearish);
}}
.callout-success {{
    border-right-color: var(--bullish);
}}
.callout-title {{
    font-size: 10pt;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 6px;
}}
.callout-body {{
    font-size: 10pt;
    color: var(--text-secondary);
    line-height: 1.7;
}}

/* ===== CARDS ===== */
.card-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 16px 0;
}}
.info-card {{
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
    break-inside: avoid;
}}
.info-card-title {{
    font-size: 10.5pt;
    font-weight: 600;
    color: var(--primary-glow);
    margin-bottom: 6px;
}}
.info-card-body {{
    font-size: 10pt;
    color: var(--text-secondary);
    line-height: 1.7;
}}

/* ===== TABLES ===== */
.vixor-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 10pt;
    break-inside: avoid;
}}
.vixor-table thead th {{
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 600;
    padding: 10px 14px;
    text-align: right;
    border-bottom: 2px solid var(--primary);
    font-size: 9.5pt;
}}
.vixor-table tbody td {{
    padding: 9px 14px;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text-secondary);
    vertical-align: top;
}}
.vixor-table tbody tr:hover {{
    background: var(--bg-card);
}}
.vixor-table code {{
    font-family: var(--font-mono);
    font-size: 9pt;
    background: var(--bg-code);
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--primary-glow);
    direction: ltr;
    display: inline-block;
}}

/* ===== LISTS ===== */
.vixor-list {{
    padding-right: 20px;
    margin: 10px 0 14px 0;
}}
.vixor-list li {{
    font-size: 10.5pt;
    color: var(--text-secondary);
    line-height: 1.75;
    margin-bottom: 6px;
}}
.vixor-list li strong {{
    color: var(--text-primary);
}}
.vixor-list li code {{
    font-family: var(--font-mono);
    font-size: 9pt;
    background: var(--bg-code);
    padding: 1px 5px;
    border-radius: 3px;
    color: var(--primary-glow);
    direction: ltr;
    display: inline-block;
}}

/* ===== NUMBERED LIST ===== */
.vixor-ol {{
    padding-right: 20px;
    margin: 10px 0 14px 0;
    counter-reset: item;
    list-style: none;
}}
.vixor-ol li {{
    font-size: 10.5pt;
    color: var(--text-secondary);
    line-height: 1.75;
    margin-bottom: 6px;
    counter-increment: item;
    position: relative;
    padding-right: 28px;
}}
.vixor-ol li::before {{
    content: counter(item);
    position: absolute;
    right: 0;
    color: var(--primary-glow);
    font-family: var(--font-mono);
    font-size: 9pt;
    font-weight: 600;
}}

/* ===== CODE BLOCK ===== */
.code-block {{
    background: var(--bg-code);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 18px;
    margin: 14px 0;
    font-family: var(--font-mono);
    font-size: 9pt;
    color: var(--text-secondary);
    line-height: 1.7;
    direction: ltr;
    text-align: left;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    break-inside: avoid;
}}

/* ===== ENDING PAGE ===== */
.ending {{
    width: 100%;
    height: 297mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    break-before: page;
    overflow: hidden;
    background: var(--bg-base);
    position: relative;
}}
.ending-text {{
    font-size: 14pt;
    color: var(--text-muted);
    font-weight: 400;
}}
.ending-brand {{
    font-family: var(--font-en);
    font-size: 11pt;
    color: var(--primary-glow);
    margin-top: 12px;
    font-weight: 600;
}}

/* ===== FOOTER ===== */
.page-footer {{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-family: var(--font-en);
    font-size: 7pt;
    color: var(--text-muted);
    padding: 8px 0;
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-base);
}}

/* Print adjustments */
@media print {{
    .page-footer {{ display: none; }}
}}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
    <div class="cover-doc-id">{doc_id}</div>
    <div class="cover-badge">VIXOR ENGINEERING BIBLE</div>
    <div class="cover-line"></div>
    <div class="cover-title">{title}</div>
    <div class="cover-subtitle">{subtitle}</div>
    <div class="cover-line"></div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
    <div class="toc-title">جدول المحتويات</div>
    {toc_html}
</div>

<!-- MAIN CONTENT -->
<div class="main-content">
{chapters_html}
</div>

<!-- ENDING -->
<div class="ending">
    <div class="ending-text">وثيقة رسمية لمنظومة فيكسور الهندسية</div>
    <div class="ending-brand">VIXOR — AI-Powered Trading Terminal</div>
</div>

<div class="page-footer">{footer_text} — سري وخاص</div>

</body>
</html>"""

    return html


def generate_toc_html(chapters: list[dict]) -> str:
    items = ""
    for ch in chapters:
        items += f"""
        <div class="toc-item">
            <span class="toc-item-title">{ch['title']}</span>
            <span class="toc-item-tag">{ch['tag']}</span>
        </div>"""
    return items


def save_html(html: str, filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def convert_to_pdf(html_path: str, pdf_filename: str, skill_dir: str):
    import shutil, subprocess, tempfile
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    # Copy script as .cjs to avoid ESM conflict with project's type:module
    cjs_path = os.path.join(tempfile.gettempdir(), 'vixor_html2pdf.cjs')
    shutil.copy2(os.path.join(skill_dir, 'scripts', 'html2pdf-next.js'), cjs_path)
    # Ensure pagedjs is available in /tmp
    tmp_pkg = os.path.join(tempfile.gettempdir(), 'package.json')
    if not os.path.exists(os.path.join(tempfile.gettempdir(), 'node_modules', 'pagedjs')):
        os.system(f'cd {tempfile.gettempdir()} && npm init -y --type=commonjs > /dev/null 2>&1 && npm install pagedjs pdf-lib 2>&1 | tail -2')
    env = os.environ.copy()
    env['PLAYWRIGHT_PATH'] = os.path.join(os.path.dirname(skill_dir), '..', 'node_modules', 'playwright')
    env['NODE_PATH'] = os.path.join(tempfile.gettempdir(), 'node_modules') + ':' + os.path.join(os.path.dirname(skill_dir), '..', 'node_modules')
    result = subprocess.run(
        ['node', cjs_path, html_path, '--output', pdf_path, '--width', '210mm', '--height', '297mm', '--nopaged'],
        cwd=tempfile.gettempdir(),
        capture_output=True, text=True, timeout=300, env=env
    )
    if result.stdout:
        print(result.stdout)
    if result.returncode != 0 and result.stderr:
        print(result.stderr, file=__import__('sys').stderr)
    return pdf_path
