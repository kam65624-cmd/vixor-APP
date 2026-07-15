#!/usr/bin/env python3
"""
VIXOR Premium Redesign — Pass 2: remaining rgba in style={} contexts
Only processes inline style objects, NOT canvas API calls.
"""
import re
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FILES = [
    os.path.join("src", "routes", "_authenticated", "-analysis-id-component.tsx"),
    os.path.join("src", "routes", "_authenticated", "trade-desk.tsx"),
    os.path.join("src", "routes", "_authenticated", "analyze.tsx"),
    os.path.join("src", "routes", "_authenticated", "signals.tsx"),
    os.path.join("src", "routes", "_authenticated", "-token-symbol-component.tsx"),
    os.path.join("src", "routes", "_authenticated", "radar.tsx"),
]

# Additional rgba patterns not caught in pass 1
EXTRA_PATTERNS = [
    # Bullish additional opacities
    (r'"rgba\(34,211,166,0\.05\)"', '"color-mix(in srgb, var(--color-bullish) 5%, transparent)"'),
    (r'"rgba\(34,211,166,0\.06\)"', '"color-mix(in srgb, var(--color-bullish) 6%, transparent)"'),
    (r'"rgba\(34,211,166,0\.30\)"', '"color-mix(in srgb, var(--color-bullish) 30%, transparent)"'),
    (r'"rgba\(34,211,166,0\.50\)"', '"color-mix(in srgb, var(--color-bullish) 50%, transparent)"'),
    (r'"rgba\(34,211,166,0\.70\)"', '"color-mix(in srgb, var(--color-bullish) 70%, transparent)"'),
    (r'"rgba\(34,211,166,0\.80\)"', '"color-mix(in srgb, var(--color-bullish) 80%, transparent)"'),
    (r'"rgba\(34,211,166,0\.90\)"', '"color-mix(in srgb, var(--color-bullish) 90%, transparent)"'),
    (r'"rgba\(34,211,166,1\)"', '"var(--color-bullish)"'),
    
    # Bearish additional opacities
    (r'"rgba\(251,70,103,0\.05\)"', '"color-mix(in srgb, var(--color-bearish) 5%, transparent)"'),
    (r'"rgba\(251,70,103,0\.06\)"', '"color-mix(in srgb, var(--color-bearish) 6%, transparent)"'),
    (r'"rgba\(251,70,103,0\.30\)"', '"color-mix(in srgb, var(--color-bearish) 30%, transparent)"'),
    (r'"rgba\(251,70,103,0\.40\)"', '"color-mix(in srgb, var(--color-bearish) 40%, transparent)"'),
    (r'"rgba\(251,70,103,0\.50\)"', '"color-mix(in srgb, var(--color-bearish) 50%, transparent)"'),
    (r'"rgba\(251,70,103,0\.70\)"', '"color-mix(in srgb, var(--color-bearish) 70%, transparent)"'),
    (r'"rgba\(251,70,103,0\.80\)"', '"color-mix(in srgb, var(--color-bearish) 80%, transparent)"'),
    (r'"rgba\(251,70,103,0\.90\)"', '"color-mix(in srgb, var(--color-bearish) 90%, transparent)"'),
    (r'"rgba\(251,70,103,1\)"', '"var(--color-bearish)"'),
    
    # Neutral-wait additional opacities
    (r'"rgba\(245,166,35,0\.05\)"', '"color-mix(in srgb, var(--color-neutral-wait) 5%, transparent)"'),
    (r'"rgba\(245,166,35,0\.06\)"', '"color-mix(in srgb, var(--color-neutral-wait) 6%, transparent)"'),
    (r'"rgba\(245,166,35,0\.20\)"', '"color-mix(in srgb, var(--color-neutral-wait) 20%, transparent)"'),
    (r'"rgba\(245,166,35,0\.30\)"', '"color-mix(in srgb, var(--color-neutral-wait) 30%, transparent)"'),
    (r'"rgba\(245,166,35,0\.40\)"', '"color-mix(in srgb, var(--color-neutral-wait) 40%, transparent)"'),
    (r'"rgba\(245,166,35,0\.80\)"', '"color-mix(in srgb, var(--color-neutral-wait) 80%, transparent)"'),
    
    # Primary additional opacities  
    (r'"rgba\(99,102,241,0\.30\)"', '"color-mix(in srgb, var(--color-primary) 30%, transparent)"'),
    (r'"rgba\(99,102,241,0\.50\)"', '"color-mix(in srgb, var(--color-primary) 50%, transparent)"'),
    (r'"rgba\(99,102,241,0\.90\)"', '"color-mix(in srgb, var(--color-primary) 90%, transparent)"'),
    
    # White additional opacities
    (r'"rgba\(255,255,255,0\.80\)"', '"color-mix(in srgb, var(--color-foreground) 80%, transparent)"'),
    (r'"rgba\(255,255,255,0\.30\)"', '"color-mix(in srgb, var(--color-foreground) 30%, transparent)"'),
    (r'"rgba\(255,255,255,0\.40\)"', '"color-mix(in srgb, var(--color-foreground) 40%, transparent)"'),
    (r'"rgba\(255,255,255,0\.50\)"', '"color-mix(in srgb, var(--color-foreground) 50%, transparent)"'),
]

def skip_canvas_lines(lines):
    """Identify line numbers that contain canvas API calls (ctx.fillStyle, ctx.strokeStyle)."""
    canvas_lines = set()
    for i, line in enumerate(lines):
        if 'ctx.fillStyle' in line or 'ctx.strokeStyle' in line:
            canvas_lines.add(i)
            # Also skip the next line if it's a continuation
    return canvas_lines

def process_file(filepath):
    rel = os.path.relpath(filepath, BASE)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"  ⚠ {rel}: not found")
        return 0
    
    canvas_lines = skip_canvas_lines(lines)
    changes = 0
    new_lines = []
    
    for i, line in enumerate(lines):
        if i in canvas_lines:
            new_lines.append(line)
            continue
        
        original = line
        for pattern, replacement in EXTRA_PATTERNS:
            line = re.sub(pattern, replacement, line)
        if line != original:
            changes += 1
        new_lines.append(line)
    
    if changes > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"  ✅ {rel}: {changes} replacements (skipped canvas lines)")
    else:
        print(f"  ⏭ {rel}: no changes")
    
    return changes

def main():
    print("Pass 2: Deep rgba cleanup (skipping Canvas API contexts)")
    total = 0
    for f in FILES:
        total += process_file(os.path.join(BASE, f))
    print(f"\nTotal: {total} additional replacements")

if __name__ == "__main__":
    main()