#!/usr/bin/env python3
"""Phase A2 extended: Replace THEME.* in ALL files that import it, remove import statements."""
import re
import glob

THEME_MAP = {
    "THEME.bg": "var(--color-background)",
    "THEME.surface": "var(--color-card)",
    "THEME.surfaceAlt": "var(--color-card-hover)",
    "THEME.headerBg": "var(--color-background)",
    "THEME.tabBarBg": "var(--color-muted)",
    "THEME.rowHover": "color-mix(in oklab, var(--color-foreground) 3%, transparent)",
    "THEME.rowHoverStrong": "color-mix(in oklab, var(--color-foreground) 6%, transparent)",
    "THEME.border": "var(--color-border)",
    "THEME.borderLight": "color-mix(in oklab, var(--color-foreground) 4%, transparent)",
    "THEME.borderAccent": "color-mix(in oklab, var(--color-primary) 15%, transparent)",
    "THEME.text": "var(--color-foreground)",
    "THEME.textSecondary": "var(--color-muted-foreground)",
    "THEME.textMuted": "var(--color-muted-foreground)",
    "THEME.textFaint": "color-mix(in oklab, var(--color-foreground) 25%, transparent)",
    "THEME.green": "var(--color-bullish)",
    "THEME.red": "var(--color-bearish)",
    "THEME.accent": "var(--color-primary)",
    "THEME.accentDeep": "var(--color-bullish)",
    "THEME.amber": "var(--color-neutral-wait)",
    "THEME.purple": "var(--color-info)",
    "THEME.pink": "var(--color-bearish)",
    "THEME.cyan": "var(--color-info)",
    "THEME.orange": "var(--color-neutral-wait)",
}

base = '/home/z/my-project/src'

# Find all files with THEME references
files = []
for pattern in ['routes/_authenticated/*.tsx', 'domains/wallet/*.tsx']:
    files.extend(glob.glob(f'{base}/{pattern}'))

# Also check components
for f in glob.glob(f'{base}/components/vixor/*.tsx'):
    if 'PageLayout' not in f:
        files.append(f)

total_theme_remaining = 0

for filepath in sorted(files):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if 'THEME' not in content:
        continue
    
    original = content
    
    # Replace THEME.xxx references (longest keys first)
    sorted_keys = sorted(THEME_MAP.items(), key=lambda x: -len(x[0]))
    for theme_key, css_var in sorted_keys:
        content = content.replace(theme_key, css_var)
    
    # Handle ${THEME.xxx}18 patterns (hex alpha appended)
    content = re.sub(
        r'\$\{var\(--color-primary\)\}18',
        'color-mix(in oklab, var(--color-primary) 10%, transparent)',
        content
    )
    content = re.sub(
        r'\$\{var\(--color-bullish\)\}18',
        'color-mix(in oklab, var(--color-bullish) 10%, transparent)',
        content
    )
    content = re.sub(
        r'\$\{var\(--color-bearish\)\}18',
        'color-mix(in oklab, var(--color-bearish) 10%, transparent)',
        content
    )
    content = re.sub(
        r'\$\{var\(--color-neutral-wait\)\}18',
        'color-mix(in oklab, var(--color-neutral-wait) 10%, transparent)',
        content
    )
    content = re.sub(
        r'\$\{var\(--color-info\)\}18',
        'color-mix(in oklab, var(--color-info) 10%, transparent)',
        content
    )
    # Also handle 15 suffix
    content = re.sub(
        r'\$\{var\(--color-primary\)\}15',
        'color-mix(in oklab, var(--color-primary) 8%, transparent)',
        content
    )
    content = re.sub(
        r'\$\{var\(--color-bullish\)\}15',
        'color-mix(in oklab, var(--color-bullish) 8%, transparent)',
        content
    )
    
    # Remove THEME import lines
    # Pattern: import { ..., THEME, ... } from "@/components/vixor/PageLayout";
    # Or: import { THEME } from ...
    content = re.sub(
        r',\s*THEME\s*,',
        ', ',
        content
    )
    content = re.sub(
        r',\s*THEME\s*}',
        ' }',
        content
    )
    content = re.sub(
        r'\{THEME,\s*',
        '{ ',
        content
    )
    content = re.sub(
        r'import\s*\{?\s*THEME\s*\}?\s*from\s*["\'][^"\']+["\'];\s*\n',
        '',
        content
    )
    
    # Also remove unused PageLayout imports if only THEME was imported
    # Pattern: import { EmptyState, ... } from "@/components/vixor/PageLayout";
    # Keep those since they use other exports
    
    changes = original != content
    remaining = len(re.findall(r'\bTHEME\b', content))
    total_theme_remaining += remaining
    
    if changes:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  {'✅' if remaining == 0 else '⚠️'} {filepath.split('src/')[1]} ({remaining} THEME refs remaining)")

print(f"\nTotal remaining THEME refs: {total_theme_remaining}")