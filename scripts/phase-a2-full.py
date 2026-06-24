#!/usr/bin/env python3
"""Phase A2: Replace THEME.* with QUOTED CSS vars across ALL files.
Also handles AppShell hex and Tailwind overrides."""
import re, glob

THEME_TO_CSS = {
    "THEME.bg": '"var(--color-background)"',
    "THEME.surface": '"var(--color-card)"',
    "THEME.surfaceAlt": '"var(--color-card-hover)"',
    "THEME.headerBg": '"var(--color-background)"',
    "THEME.tabBarBg": '"var(--color-muted)"',
    "THEME.rowHover": '"color-mix(in oklab, var(--color-foreground) 3%, transparent)"',
    "THEME.rowHoverStrong": '"color-mix(in oklab, var(--color-foreground) 6%, transparent)"',
    "THEME.border": '"var(--color-border)"',
    "THEME.borderLight": '"color-mix(in oklab, var(--color-foreground) 4%, transparent)"',
    "THEME.borderAccent": '"color-mix(in oklab, var(--color-primary) 15%, transparent)"',
    "THEME.text": '"var(--color-foreground)"',
    "THEME.textSecondary": '"var(--color-muted-foreground)"',
    "THEME.textMuted": '"var(--color-muted-foreground)"',
    "THEME.textFaint": '"color-mix(in oklab, var(--color-foreground) 25%, transparent)"',
    "THEME.green": '"var(--color-bullish)"',
    "THEME.red": '"var(--color-bearish)"',
    "THEME.accent": '"var(--color-primary)"',
    "THEME.accentDeep": '"var(--color-bullish)"',
    "THEME.amber": '"var(--color-neutral-wait)"',
    "THEME.purple": '"var(--color-info)"',
    "THEME.pink": '"var(--color-bearish)"',
    "THEME.cyan": '"var(--color-info)"',
    "THEME.orange": '"var(--color-neutral-wait)"',
}

# Alpha suffix patterns: ${THEME.xxx}18 → color-mix(...)
ALPHA_SUFFIXES = {
    '18': '10%', '15': '8%', '10': '6%', '30': '19%',
}

base = '/home/z/my-project/src'
modified_count = 0

def process_file(filepath, is_pagelayout=False):
    global modified_count
    with open(filepath) as f:
        content = f.read()
    
    if 'THEME' not in content and '#' not in content:
        # Check for AppShell hex too
        pass
    
    original = content
    
    if not is_pagelayout:
        # Replace THEME.xxx → quoted CSS var (longest first)
        for key, val in sorted(THEME_TO_CSS.items(), key=lambda x: -len(x[0])):
            content = content.replace(key, val)
        
        # Handle ${THEME.xxx}YY patterns
        for theme_key, css_base in [
            ('THEME.accent', 'primary'),
            ('THEME.accentDeep', 'bullish'),
            ('THEME.green', 'bullish'),
            ('THEME.red', 'bearish'),
            ('THEME.amber', 'neutral-wait'),
            ('THEME.purple', 'info'),
            ('THEME.cyan', 'info'),
            ('THEME.pink', 'bearish'),
        ]:
            for suffix, pct in ALPHA_SUFFIXES.items():
                content = content.replace(
                    f'${{{{theme_key}}}}{suffix}',
                    f'color-mix(in oklab, var(--color-{css_base}) {pct}, transparent)'
                )
                # Also handle already-replaced: ${"var(--color-xxx)"}YY
                content = content.replace(
                    '${' + 'var(--color-' + css_base + ')' + '}' + suffix,
                    'color-mix(in oklab, var(--color-' + css_base + ') ' + pct + ', transparent)'
                )
                content = content.replace(
                    '${' + '"var(--color-' + css_base + ')"' + '}' + suffix,
                    'color-mix(in oklab, var(--color-' + css_base + ') ' + pct + ', transparent)'
                )
        
        # Remove THEME from import statements
        content = re.sub(r',\s*THEME\s*,', ', ', content)
        content = re.sub(r',\s*THEME\s*}', ' }', content)
        content = re.sub(r'\{THEME,\s*', '{ ', content)
        content = re.sub(r'import\s*\{?\s*THEME\s*\}?\s*from\s*["\'][^"\']+["\'];\s*\n', '', content)
        content = content.replace(', ,', ',').replace('{,', '{')
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        modified_count += 1
        remaining = len(re.findall(r'\bTHEME\.\w', content))
        print(f'  {"✅" if remaining == 0 else "⚠️"} {filepath.split("src/")[1]} ({remaining} THEME refs)')

# Process all route files
for f in sorted(glob.glob(f'{base}/routes/_authenticated/*.tsx')):
    process_file(f)
for f in sorted(glob.glob(f'{base}/routes/_authenticated/**/*.tsx', recursive=True)):
    process_file(f)

# Process AppShell
process_file(f'{base}/components/vixor/AppShell.tsx')

# Process HunterScoreCard, CoachOverlay, GovernorRiskPanel, AnalystReportPanel
TAILWIND_MAP = {
    'text-emerald-400': 'text-bullish',
    'text-emerald-500': 'text-bullish',
    'text-emerald-300': 'text-bullish',
    'text-red-400': 'text-bearish',
    'text-red-500': 'text-bearish',
    'text-red-300': 'text-bearish',
    'text-amber-400': 'text-neutral-wait',
    'text-amber-500': 'text-neutral-wait',
    'text-amber-300': 'text-neutral-wait',
    'text-blue-400': 'text-info',
    'text-blue-500': 'text-info',
    'border-emerald-500/30': 'border-bullish/30',
    'border-red-500/30': 'border-bearish/30',
    'border-amber-500/30': 'border-neutral-wait/30',
    'hover:bg-emerald-500/10': 'hover:bg-bullish/10',
    'hover:bg-red-500/10': 'hover:bg-bearish/10',
    'hover:bg-amber-500/10': 'hover:bg-neutral-wait/10',
    'hover:text-emerald-300': 'hover:text-bullish',
    'hover:text-red-300': 'hover:text-bearish',
    'hover:text-amber-300': 'hover:text-neutral-wait',
}

for f in [
    f'{base}/components/vixor/HunterScoreCard.tsx',
    f'{base}/components/vixor/CoachOverlay.tsx',
    f'{base}/components/vixor/GovernorRiskPanel.tsx',
    f'{base}/components/vixor/AnalystReportPanel.tsx',
]:
    with open(f) as fh:
        c = fh.read()
    orig = c
    for old, new in sorted(TAILWIND_MAP.items(), key=lambda x: -len(x[0])):
        c = c.replace(old, new)
    if c != orig:
        with open(f, 'w') as fh:
            fh.write(c)
        modified_count += 1
        print(f'  ✅ components/vixor/{f.split("/")[-1]} (Tailwind replaced)')

# Process AppShell hex colors
with open(f'{base}/components/vixor/AppShell.tsx') as fh:
    c = fh.read()
orig = c

APPSHELL_HEX = {
    '"#121212"': '"var(--color-background)"',
    '"#1A1A1A"': '"var(--color-card)"',
    '"#FFFFFF"': '"var(--color-foreground)"',
    '"#9CA3AF"': '"var(--color-muted-foreground)"',
    '"#6B7280"': '"var(--color-muted-foreground)"',
    '"#34D399"': '"var(--color-primary)"',
    '"#10B981"': '"var(--color-bullish)"',
    '"#059669"': '"var(--color-bullish)"',
    '"#22C55E"': '"var(--color-bullish)"',
    '"#EF4444"': '"var(--color-bearish)"',
}
for old, new in sorted(APPSHELL_HEX.items(), key=lambda x: -len(x[0])):
    c = c.replace(old, new)

# Gradient
c = c.replace('"linear-gradient(135deg, #059669, #10B981)"', '"var(--gradient-primary)"')
# SOL price ternary
c = c.replace('(solChange ?? 0) >= 0 ? "#22C55E" : "#EF4444"', '(solChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"')

if c != orig:
    with open(f'{base}/components/vixor/AppShell.tsx', 'w') as fh:
        fh.write(c)
    modified_count += 1
    remaining = len(re.findall(r'#[0-9a-fA-F]{3,8}', c))
    # Filter out data URIs
    data_uri_hex = re.findall(r'data:[^"]*#[0-9a-fA-F]+', c)
    print(f'  ✅ AppShell.tsx ({remaining - len(data_uri_hex)} hex colors remaining)')

print(f'\nTotal files modified: {modified_count}')