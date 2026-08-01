"""VIXOR Engineering Bible - Document 11: Master Execution Bible (كتاب التنفيذ الرئيسي)
The executive director document that ties all 18 engineering documents together.
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from generate_base import generate_vixor_html, save_html, convert_to_pdf, OUTPUT_DIR


def bl(items):
    return '<ul class="vixor-list">\n' + '\n'.join(f'    <li>{i}</li>' for i in items) + '\n</ul>'

def ol(items):
    return '<ol class="vixor-ol">\n' + '\n'.join(f'    <li>{i}</li>' for i in items) + '\n</ol>'

def p(t):
    return f'<p class="body-text">{t}</p>'

def s(t):
    return f'<div class="subsection"><div class="subsection-title">{t}</div></div>'

def co(ct, ti, bo):
    c = f" callout-{ct}" if ct else ""
    return f'<div class="callout{c}"><div class="callout-title">{ti}</div><div class="callout-body">{bo}</div></div>'

def cb(t):
    return f'<div class="code-block">{t}</div>'

def cg(cards):
    inner = "".join(f'<div class="info-card"><div class="info-card-title">{a}</div><div class="info-card-body">{b}</div></div>' for a,b in cards)
    return f'<div class="card-grid">{inner}</div>'

def dt(rows):
    h = '<table class="vixor-table"><thead><tr><th>الرقم</th><th>اسم الوثيقة</th><th>النوع</th><th>تعتمد على</th><th>تغذي</th></tr></thead><tbody>\n'
    for r in rows:
        h += f'<tr><td><code>{r[0]}</code></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td></tr>\n'
    return h + '</tbody></table>'

def tm(rows):
    h = '<table class="vixor-table"><thead><tr><th>رقم المشكلة</th><th>المشكلة</th><th>المراجعة</th><th>القرار</th><th>السبرنت</th><th>الملفات</th></tr></thead><tbody>\n'
    for r in rows:
        h += f'<tr><td><code>{r[0]}</code></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td><code>{r[5]}</code></td></tr>\n'
    return h + '</tbody></table>'

def sf(rows):
    h = '<table class="vixor-table"><thead><tr><th>السبرنت</th><th>المهمة</th><th>مسار الملف</th><th>الأسطر</th><th>الحالة</th></tr></thead><tbody>\n'
    for r in rows:
        h += f'<tr><td>{r[0]}</td><td>{r[1]}</td><td><code>{r[2]}</code></td><td>{r[3]}</td><td>{r[4]}</td></tr>\n'
    return h + '</tbody></table>'


# ─── CHAPTERS ───

# Placeholder — will be replaced by builder
chapters = []


if __name__ == "__main__":
    html = generate_vixor_html(
        title="كتاب التنفيذ الرئيسي",
        subtitle="المدير التنفيذي لمنظومة وثائق فيكسور الهندسية",
        doc_id="DOC-11",
        chapters=chapters,
    )
    html_path = save_html(html, "11-master-execution.html")
    print(f"HTML saved: {html_path}")
    pdf_path = convert_to_pdf(html_path, "11-master-execution.pdf", skill_dir="/home/z/my-project/skills/pdf")
    print(f"PDF saved: {pdf_path}")
