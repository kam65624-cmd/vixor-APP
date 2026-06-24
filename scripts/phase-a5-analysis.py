#!/usr/bin/env python3
"""Phase A5: Replace hardcoded colors in analysis.$id.tsx with design tokens."""
import re

filepath = '/home/z/my-project/src/routes/_authenticated/analysis.$id.tsx'

with open(filepath) as f:
    content = f.read()

original = content

# ── Solid hex colors ──
replacements = {
    '#059669': 'var(--color-bullish)',
    '#000000': 'oklch(0 0 0)',
}

for old, new in replacements.items():
    content = content.replace(f'"{old}"', f'"{new}"')

# ── RGBA patterns ──
# rgba(16,185,129,0.XX) → bullish
# rgba(239,68,68,0.XX) → bearish
# rgba(245,158,11,0.XX) → neutral-wait
# rgba(6,182,212,0.XX) → info
# rgba(26,26,26,0.XX) → dark surface
# rgba(255,255,255,0.XX) → foreground
# rgba(0,0,0,0.XX) → pure black

def rgba_to_color_mix(match):
    """Convert rgba(r,g,b,a) to color-mix or oklch."""
    r, g, b, a = match.group(1), match.group(2), match.group(3), match.group(4)
    r, g, b = int(r), int(g), int(b)
    
    # Remove leading zeros from alpha
    a_clean = a.lstrip('0').lstrip('.') or '0'
    if not a_clean:
        a_clean = '0'
    try:
        a_pct = round(float(a) * 100)
    except:
        return match.group(0)
    
    # Map colors
    if (r, g, b) == (16, 185, 129):
        var_name = 'bullish'
    elif (r, g, b) == (239, 68, 68):
        var_name = 'bearish'
    elif (r, g, b) == (245, 158, 11):
        var_name = 'neutral-wait'
    elif (r, g, b) == (6, 182, 212):
        var_name = 'info'
    elif (r, g, b) == (26, 26, 26):
        return f'color-mix(in oklab, var(--color-card) {a_pct}%, oklch(0 0 0))'
    elif (r, g, b) == (255, 255, 255):
        return f'color-mix(in oklab, var(--color-foreground) {a_pct}%, transparent)'
    elif (r, g, b) == (0, 0, 0):
        return f'oklch(0 0 0 / {a} )'.replace('0.', '.').replace('0.0 ', '0 ').replace('..', '.')
        # Simplify: just use oklch alpha
        # Actually let's use a cleaner format
    else:
        return match.group(0)  # Unknown, keep original
    
    return f'color-mix(in oklab, var(--color-{var_name}) {a_pct}%, transparent)'

def rgba_black(match):
    """Handle rgba(0,0,0,a) separately."""
    a = match.group(1)
    return f'oklch(0 0 0 / {a})'

# First pass: handle rgba(0,0,0,...) 
content = re.sub(
    r'rgba\(0,\s*0,\s*0,\s*([\d.]+)\)',
    rgba_black,
    content
)

# Second pass: handle all other rgba patterns
content = re.sub(
    r'rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)',
    rgba_to_color_mix,
    content
)

# ── Fix gradient strings that use ${var(...)} pattern ──
# The original had template literals like: `linear-gradient(..., rgba(...), ${var(--color-card)}, ...)`
# After replacement, the rgba parts are now color-mix which is fine.

# ── Count remaining hardcoded colors ──
remaining_hex = len(re.findall(r'#[0-9a-fA-F]{3,8}(?![^\s]*data:)', content))
remaining_rgba = len(re.findall(r'rgba\(', content))

print(f"Hex colors remaining: {remaining_hex}")
print(f"RGBA colors remaining: {remaining_rgba}")
print(f"Total chars changed: {sum(1 for a,b in zip(original, content) if a != b)}")

with open(filepath, 'w') as f:
    f.write(content)
print("Done!")