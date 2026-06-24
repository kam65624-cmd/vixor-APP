#!/usr/bin/env python3
"""Phase A2: Unify 4 color systems to CSS variables only.
Replaces THEME constant usages in PageLayout.tsx and inline hex in AppShell.tsx.
"""
import re
import sys

# ── THEME to CSS var mapping ──
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

# ── AppShell hex to CSS var mapping ──
APPSHELL_HEX_MAP = {
    "#121212": "var(--color-background)",
    "#1A1A1A": "var(--color-card)",
    "#FFFFFF": "var(--color-foreground)",
    "#9CA3AF": "var(--color-muted-foreground)",
    "#6B7280": "var(--color-muted-foreground)",
    "#34D399": "var(--color-primary)",
    "#10B981": "var(--color-bullish)",
    "#059669": "var(--color-bullish)",
    "#22C55E": "var(--color-bullish)",
    "#EF4444": "var(--color-bearish)",
}

def replace_theme_in_pagelayout(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace THEME.xxx references (longest keys first to avoid partial matches)
    sorted_keys = sorted(THEME_MAP.keys(), key=len, reverse=True)
    
    for theme_key, css_var in THEME_MAP.items():
        # Replace THEME.xxx (not part of a longer word)
        # Handle: THEME.xxx, THEME.xxx}
        content = content.replace(theme_key, css_var)
    
    # Handle special pattern: `${THEME.accent}15` → `color-mix(in oklab, var(--color-primary) 15%, transparent)`
    # These are hex+alpha patterns like "#34D39915"
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
    content = re.sub(
        r'\$\{var\(--color-bearish\)\}15',
        'color-mix(in oklab, var(--color-bearish) 8%, transparent)',
        content
    )
    content = re.sub(
        r'\$\{var\(--color-neutral-wait\)\}15',
        'color-mix(in oklab, var(--color-neutral-wait) 8%, transparent)',
        content
    )
    
    # Count changes
    changes = sum(1 for a, b in zip(original, content) if a != b)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    # Count remaining THEME references (should be only the definition)
    remaining = len(re.findall(r'\bTHEME\b', content))
    return changes, remaining

def replace_hex_in_appshell(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace inline hex colors in style={{}} and SVG attributes
    for hex_val, css_var in sorted(APPSHELL_HEX_MAP.items(), key=lambda x: -len(x[0])):
        # In style props: "#XXXXXX" → 'var(--xxx)'
        # Need to be careful to only replace color values, not data URIs etc.
        # Replace in style strings
        content = re.sub(
            rf'"({hex_val})"',
            lambda m: f'"{css_var}"' if _is_color_context(content, m.start()) else m.group(0),
            content
        )
        # Also handle: stroke="#XXXXXX" → stroke="var(--xxx)"
        # and: fill="#XXXXXX" → fill="var(--xxx)"
    
    # Specific replacements for gradients
    content = content.replace(
        '"linear-gradient(135deg, #059669, #10B981)"',
        '"var(--gradient-primary)"'
    )
    
    # Replace SOL price color: (solChange >= 0) ? "#22C55E" : "#EF4444"
    content = content.replace(
        '(solChange ?? 0) >= 0 ? "#22C55E" : "#EF4444"',
        '(solChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"'
    )
    
    # Count remaining hex colors (excluding data URIs and comments)
    hex_pattern = r'#(?:[0-9a-fA-F]{3}){1,2}\b'
    remaining_hex = re.findall(hex_pattern, content)
    # Filter out known non-color hex (like in data URIs)
    color_hexes = [h for h in remaining_hex if not _in_data_uri(content, h)]
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    return len(color_hexes)

def _is_color_context(content, pos):
    """Check if position is likely in a style/color context."""
    # Look backwards for style, color, background, stroke, fill keywords
    before = content[max(0, pos-100):pos]
    return any(kw in before for kw in ['style', 'color', 'background', 'stroke', 'fill', 'border'])

def _in_data_uri(content, hex_val):
    """Check if hex is inside a data URI."""
    idx = 0
    while True:
        idx = content.find(hex_val, idx)
        if idx == -1:
            return False
        before = content[max(0, idx-50):idx]
        if 'data:' in before or 'image/' in before:
            return True
        idx += 1

def replace_tailwind_in_components(files):
    """Replace Tailwind color overrides with CSS var-based classes."""
    tailwind_map = {
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
    
    total_replacements = 0
    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        for tw_class, var_class in sorted(tailwind_map.items(), key=lambda x: -len(x[0])):
            content = content.replace(tw_class, var_class)
        
        changes = sum(1 for a, b in zip(original, content) if a != b)
        total_replacements += changes
        
        with open(filepath, 'w') as f:
            f.write(content)
    
    return total_replacements

if __name__ == '__main__':
    import os
    base = '/home/z/my-project/src'
    
    # A2.1: PageLayout.tsx
    print("=== PageLayout.tsx ===")
    changes, remaining = replace_theme_in_pagelayout(f'{base}/components/vixor/PageLayout.tsx')
    print(f"  Replacements made: ~{changes} chars changed")
    print(f"  Remaining THEME refs: {remaining}")
    
    # A2.2: AppShell.tsx
    print("\n=== AppShell.tsx ===")
    hex_count = replace_hex_in_appshell(f'{base}/components/vixor/AppShell.tsx')
    print(f"  Remaining hex colors: {hex_count}")
    
    # A2.3: Tailwind overrides
    print("\n=== Tailwind overrides ===")
    component_files = [
        f'{base}/components/vixor/HunterScoreCard.tsx',
        f'{base}/components/vixor/CoachOverlay.tsx',
        f'{base}/components/vixor/GovernorRiskPanel.tsx',
        f'{base}/components/vixor/AnalystReportPanel.tsx',
    ]
    tw_changes = replace_tailwind_in_components(component_files)
    print(f"  Replacements made: ~{tw_changes} chars changed")
    
    print("\nDone!")