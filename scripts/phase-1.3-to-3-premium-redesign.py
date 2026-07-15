#!/usr/bin/env python3
"""
VIXOR Premium Redesign — Phases 1.3 through 3
Normalizes hardcoded colors, replaces emoji icons, adds premium polish.

Usage:
  export PATH="$HOME/.npm-global/bin:$PATH"
  python3 scripts/phase-1.3-to-3-premium-redesign.py
"""

import re
import os
import glob

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(BASE, "src")

# ── Files to process ──────────────────────────────────────────────────────────

ROUTE_FILES = [
    # Phase 1.3: AppShell
    os.path.join("src", "components", "vixor", "AppShell.tsx"),
    # Phase 2: Core Loop
    os.path.join("src", "routes", "_authenticated", "index.tsx"),
    os.path.join("src", "routes", "_authenticated", "discover.tsx"),
    os.path.join("src", "routes", "_authenticated", "analyze.tsx"),
    os.path.join("src", "routes", "_authenticated", "analysis.$id.tsx"),
    os.path.join("src", "routes", "_authenticated", "-analysis-id-component.tsx"),
    os.path.join("src", "routes", "_authenticated", "trade-desk.tsx"),
    os.path.join("src", "routes", "_authenticated", "signals.tsx"),
    os.path.join("src", "routes", "_authenticated", "daily-loop.tsx"),
    os.path.join("src", "routes", "_authenticated", "-daily-loop-component.tsx"),
    # Phase 3: Data Layer
    os.path.join("src", "routes", "_authenticated", "token.$symbol.tsx"),
    os.path.join("src", "routes", "_authenticated", "-token-symbol-component.tsx"),
    os.path.join("src", "routes", "_authenticated", "charts.tsx"),
    os.path.join("src", "routes", "_authenticated", "pulse.tsx"),
    os.path.join("src", "routes", "_authenticated", "radar.tsx"),
    os.path.join("src", "routes", "_authenticated", "curves.tsx"),
]

# ── Color Replacement Maps ───────────────────────────────────────────────────

# Hex color replacements (exact matches)
HEX_REPLACEMENTS = {
    "#D4A843": "var(--color-gold)",
    "#d4a843": "var(--color-gold)",
    "#04150D": "var(--color-buy-text)",
    "#ef4444": "var(--color-bearish)",
    "#EF4444": "var(--color-bearish)",
    "#000": "var(--color-background)",
    "#000000": "var(--color-background)",
    "#000;": "var(--color-background);",
    "#f0c419": "var(--color-gold)",
    "#F0C419": "var(--color-gold)",
    "#F5A623": "var(--color-neutral-wait)",
    "#f5a623": "var(--color-neutral-wait)",
    "#6366F1": "var(--color-primary)",
    "#6366f1": "var(--color-primary)",
    "#818CF8": "var(--primary-glow)",
    "#818cf8": "var(--primary-glow)",
    "#22D3A6": "var(--color-bullish)",
    "#22d3a6": "var(--color-bullish)",
    "#FB4667": "var(--color-bearish)",
    "#fb4667": "var(--color-bearish)",
}

# rgba replacements — map to CSS variable patterns
# Format: (regex_pattern, replacement, description)
RGBA_PATTERNS = [
    # ── Bullish (34,211,166) → var(--color-bullish) with appropriate alpha ──
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.08\s*\)",
     "var(--bullish-bg)", "bullish 8% bg"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-bullish) 10%, transparent)", "bullish 10%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.12\s*\)",
     "color-mix(in srgb, var(--color-bullish) 12%, transparent)", "bullish 12%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.14\s*\)",
     "var(--bullish-bg)", "bullish 14% ≈ bullish-bg"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.15\s*\)",
     "color-mix(in srgb, var(--color-bullish) 15%, transparent)", "bullish 15%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.19\s*\)",
     "color-mix(in srgb, var(--color-bullish) 19%, transparent)", "bullish 19%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.20\s*\)",
     "var(--bullish-border)", "bullish 20% border"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.25\s*\)",
     "color-mix(in srgb, var(--color-bullish) 25%, transparent)", "bullish 25%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.30\s*\)",
     "color-mix(in srgb, var(--color-bullish) 30%, transparent)", "bullish 30%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.35\s*\)",
     "color-mix(in srgb, var(--color-bullish) 35%, transparent)", "bullish 35%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.40\s*\)",
     "color-mix(in srgb, var(--color-bullish) 40%, transparent)", "bullish 40%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.50\s*\)",
     "color-mix(in srgb, var(--color-bullish) 50%, transparent)", "bullish 50%"),
    
    (r"rgba\(\s*34\s*,\s*211\s*,\s*166\s*,\s*0\.85\s*\)",
     "color-mix(in srgb, var(--color-bullish) 85%, transparent)", "bullish 85%"),

    # ── Bearish (251,70,103) → var(--color-bearish) ──
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.08\s*\)",
     "var(--bearish-bg)", "bearish 8% bg"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-bearish) 10%, transparent)", "bearish 10%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.12\s*\)",
     "color-mix(in srgb, var(--color-bearish) 12%, transparent)", "bearish 12%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.14\s*\)",
     "var(--bearish-bg)", "bearish 14% ≈ bearish-bg"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.15\s*\)",
     "color-mix(in srgb, var(--color-bearish) 15%, transparent)", "bearish 15%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.19\s*\)",
     "color-mix(in srgb, var(--color-bearish) 19%, transparent)", "bearish 19%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.20\s*\)",
     "color-mix(in srgb, var(--color-bearish) 20%, transparent)", "bearish 20%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.25\s*\)",
     "color-mix(in srgb, var(--color-bearish) 25%, transparent)", "bearish 25%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.30\s*\)",
     "color-mix(in srgb, var(--color-bearish) 30%, transparent)", "bearish 30%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.40\s*\)",
     "color-mix(in srgb, var(--color-bearish) 40%, transparent)", "bearish 40%"),
    
    (r"rgba\(\s*251\s*,\s*70\s*,\s*103\s*,\s*0\.85\s*\)",
     "color-mix(in srgb, var(--color-bearish) 85%, transparent)", "bearish 85%"),

    # ── Primary (99,102,241) → var(--color-primary) ──
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.04\s*\)",
     "color-mix(in srgb, var(--color-primary) 4%, transparent)", "primary 4%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.06\s*\)",
     "color-mix(in srgb, var(--color-primary) 6%, transparent)", "primary 6%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.08\s*\)",
     "color-mix(in srgb, var(--color-primary) 8%, transparent)", "primary 8%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.09\s*\)",
     "color-mix(in srgb, var(--color-primary) 9%, transparent)", "primary 9%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-primary) 10%, transparent)", "primary 10%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.12\s*\)",
     "color-mix(in srgb, var(--color-primary) 12%, transparent)", "primary 12%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.15\s*\)",
     "color-mix(in srgb, var(--color-primary) 15%, transparent)", "primary 15%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.16\s*\)",
     "color-mix(in srgb, var(--color-primary) 16%, transparent)", "primary 16%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.19\s*\)",
     "color-mix(in srgb, var(--color-primary) 19%, transparent)", "primary 19%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.20\s*\)",
     "color-mix(in srgb, var(--color-primary) 20%, transparent)", "primary 20%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.25\s*\)",
     "color-mix(in srgb, var(--color-primary) 25%, transparent)", "primary 25%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.30\s*\)",
     "color-mix(in srgb, var(--color-primary) 30%, transparent)", "primary 30%"),
    
    (r"rgba\(\s*99\s*,\s*102\s*,\s*241\s*,\s*0\.40\s*\)",
     "color-mix(in srgb, var(--color-primary) 40%, transparent)", "primary 40%"),

    # ── Neutral-Wait (245,166,35) → var(--color-neutral-wait) ──
    (r"rgba\(\s*245\s*,\s*166\s*,\s*35\s*,\s*0\.08\s*\)",
     "var(--neutral-wait-bg)", "wait 8% bg"),
    
    (r"rgba\(\s*245\s*,\s*166\s*,\s*35\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-neutral-wait) 10%, transparent)", "wait 10%"),
    
    (r"rgba\(\s*245\s*,\s*166\s*,\s*35\s*,\s*0\.14\s*\)",
     "var(--neutral-wait-bg)", "wait 14% ≈ neutral-wait-bg"),
    
    (r"rgba\(\s*245\s*,\s*166\s*,\s*35\s*,\s*0\.15\s*\)",
     "color-mix(in srgb, var(--color-neutral-wait) 15%, transparent)", "wait 15%"),
    
    (r"rgba\(\s*245\s*,\s*166\s*,\s*35\s*,\s*0\.19\s*\)",
     "color-mix(in srgb, var(--color-neutral-wait) 19%, transparent)", "wait 19%"),
    
    (r"rgba\(\s*245\s*,\s*166\s*,\s*35\s*,\s*0\.25\s*\)",
     "color-mix(in srgb, var(--color-neutral-wait) 25%, transparent)", "wait 25%"),

    # ── Gold (240,196,25) → var(--color-gold) ──
    (r"rgba\(\s*240\s*,\s*196\s*,\s*25\s*,\s*0\.08\s*\)",
     "color-mix(in srgb, var(--color-gold) 8%, transparent)", "gold 8%"),
    
    (r"rgba\(\s*240\s*,\s*196\s*,\s*25\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-gold) 10%, transparent)", "gold 10%"),
    
    (r"rgba\(\s*240\s*,\s*196\s*,\s*25\s*,\s*0\.15\s*\)",
     "color-mix(in srgb, var(--color-gold) 15%, transparent)", "gold 15%"),
    
    (r"rgba\(\s*240\s*,\s*196\s*,\s*25\s*,\s*0\.19\s*\)",
     "color-mix(in srgb, var(--color-gold) 19%, transparent)", "gold 19%"),

    # ── Gold variant (240,185,11) → var(--color-gold) (radar uses this) ──
    (r"rgba\(\s*240\s*,\s*185\s*,\s*11\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-gold) 10%, transparent)", "gold-alt 10%"),
    
    (r"rgba\(\s*240\s*,\s*185\s*,\s*11\s*,\s*([0-9.]+)\s*\)",
     r"color-mix(in srgb, var(--color-gold) \1%, transparent)", "gold-alt dynamic"),

    # ── Gold variant (212,168,67) → var(--color-gold) (discover uses this) ──
    (r"rgba\(\s*212\s*,\s*168\s*,\s*67\s*,\s*([0-9.]+)\s*\)",
     r"color-mix(in srgb, var(--color-gold) \1%, transparent)", "gold-discover dynamic"),

    # ── White/Foreground rgba (255,255,255) ──
    # These are subtle overlays — use foreground with alpha via Tailwind-like pattern
    # Keep as-is since they're standard white overlays, not semantic colors
    # But replace obvious ones:
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.02\s*\)",
     "color-mix(in srgb, var(--color-foreground) 2%, transparent)", "white 2%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.03\s*\)",
     "color-mix(in srgb, var(--color-foreground) 3%, transparent)", "white 3%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.04\s*\)",
     "color-mix(in srgb, var(--color-foreground) 4%, transparent)", "white 4%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.05\s*\)",
     "color-mix(in srgb, var(--color-foreground) 5%, transparent)", "white 5%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.06\s*\)",
     "color-mix(in srgb, var(--color-foreground) 6%, transparent)", "white 6%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.08\s*\)",
     "color-mix(in srgb, var(--color-foreground) 8%, transparent)", "white 8%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.10\s*\)",
     "color-mix(in srgb, var(--color-foreground) 10%, transparent)", "white 10%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.15\s*\)",
     "color-mix(in srgb, var(--color-foreground) 15%, transparent)", "white 15%"),
    
    (r"rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.20\s*\)",
     "color-mix(in srgb, var(--color-foreground) 20%, transparent)", "white 20%"),

    # ── Black/Dark rgba (0,0,0) ──
    (r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.2\s*\)",
     "color-mix(in srgb, var(--color-background) 80%, transparent)", "black 20%"),
    
    (r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.3\s*\)",
     "var(--overlay)", "black 30% ≈ overlay"),
    
    (r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.4\s*\)",
     "color-mix(in srgb, var(--color-background) 60%, transparent)", "black 40%"),
    
    (r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.5\s*\)",
     "color-mix(in srgb, var(--color-background) 50%, transparent)", "black 50%"),
    
    (r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.6\s*\)",
     "var(--overlay-secondary)", "black 60% ≈ overlay-secondary"),
    
    (r"rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\.7\s*\)",
     "color-mix(in srgb, var(--color-background) 30%, transparent)", "black 70%"),

    # ── Muted foreground (163,163,163) ──
    (r"rgba\(\s*163\s*,\s*163\s*,\s*163\s*,\s*([0-9.]+)\s*\)",
     r"color-mix(in srgb, var(--color-muted-foreground) \1%, transparent)", "muted-fg dynamic"),
]

# ── Emoji → lucide-react icon replacements ────────────────────────────────────

EMOJI_REPLACEMENTS = {
    # signals.tsx
    "⚡ Trade": "Zap Trade",
    "⚡": "",  # Remove standalone emoji, will be replaced by icon import
    "✓ Tracked": "Check Tracked",
    "✓": "",  # standalone
}

# Files that need lucide-react imports added/replaced
EMOJI_ICON_MAP = {
    "signals.tsx": {
        "imports_to_add": ["Zap", "Check", "Share2", "Send"],
        "emoji_to_icon": {
            "⚡": "<Zap size={14} />",
            "✓": "<Check size={14} />",
            "𝕏": "<Share2 size={14} />",
            "✈": "<Send size={14} />",
        }
    },
    "charts.tsx": {
        "imports_to_add": ["CandlestickChart"],
        "emoji_to_icon": {
            "📉": "<CandlestickChart size={32} />",
        }
    },
    "pulse.tsx": {
        "imports_to_add": ["Radio"],
        "emoji_to_icon": {
            "📡": "<Radio size={32} />",
        }
    },
    "curves.tsx": {
        "imports_to_add": ["TrendingUp"],
        "emoji_to_icon": {
            "📈": "<TrendingUp size={32} />",
        }
    },
}


def process_file(filepath: str) -> dict:
    """Process a single file, returning stats about changes made."""
    rel = os.path.relpath(filepath, BASE)
    stats = {"file": rel, "hex": 0, "rgba": 0, "emoji": 0, "lines_changed": 0}
    
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  ⚠ {rel}: file not found, skipping")
        return stats
    except Exception as e:
        print(f"  ⚠ {rel}: {e}")
        return stats
    
    original = content
    
    # ── 1. Replace hardcoded hex colors ──
    for hex_val, replacement in HEX_REPLACEMENTS.items():
        # Only replace hex values that are NOT part of rgba() or other functions
        # Match hex in style strings, not in comments or strings that are CSS var names
        # Be careful not to replace hex values that are already inside var() calls
        pattern = re.compile(
            r'(?<!var\()(?<!["\w])' + re.escape(hex_val) + r'(?![\w])'
        )
        new_content = pattern.sub(replacement, content)
        if new_content != content:
            count = len(pattern.findall(content))
            stats["hex"] += count
            content = new_content
    
    # ── 2. Replace hardcoded rgba() values ──
    for pattern, replacement, desc in RGBA_PATTERNS:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            count = len(regex.findall(content))
            stats["rgba"] += count
            content = new_content
    
    # ── 3. Replace raw transition strings with motion tokens ──
    transition_replacements = [
        (r'"all 0\.2s ease"', '"all var(--transition-base)"'),
        (r'"all 0\.15s ease"', '"all var(--transition-fast)"'),
        (r'"all 0\.25s ease"', '"all var(--transition-slow)"'),
        (r'"all 0\.3s ease"', '"all var(--transition-slow)"'),
        (r'"0\.2s ease"', '"var(--transition-base)"'),
        (r'"0\.15s ease"', '"var(--transition-fast)"'),
        (r'"0\.25s ease"', '"var(--transition-slow)"'),
        (r"transition: 'all 0\.2s ease'", "transition: 'all var(--transition-base)'"),
        (r"transition: '0\.2s ease'", "transition: 'var(--transition-base)'"),
    ]
    for pattern, replacement in transition_replacements:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            content = new_content
    
    # ── 4. Replace textShadow with CSS variable patterns ──
    text_shadow_replacements = [
        (r'textShadow:\s*"0 2px 10px rgba\(0,0,0,0\.5\)"',
         'textShadow: "var(--shadow-elevated)"'),
        (r'textShadow:\s*"0 0 20px rgba\(34,211,166,0\.4\)"',
         'textShadow: "0 0 20px color-mix(in srgb, var(--color-bullish) 40%, transparent)"'),
        (r'textShadow:\s*"0 0 20px color-mix\(in srgb, \$\{color\} 40%, transparent\)"',
         'textShadow: "0 0 20px color-mix(in srgb, ${color} 40%, transparent)"'),  # keep as-is
    ]
    for pattern, replacement in text_shadow_replacements:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            content = new_content
    
    # ── 5. Replace hardcoded boxShadow patterns ──
    shadow_replacements = [
        (r'boxShadow:\s*"0 2px 8px rgba\(99,102,241,0\.25\)"',
         'boxShadow: "var(--shadow-glow)"'),
        (r'boxShadow:\s*"0 4px 16px rgba\(34,211,166,0\.25\)"',
         'boxShadow: "0 4px 16px color-mix(in srgb, var(--color-bullish) 25%, transparent)"'),
        (r'boxShadow:\s*"0 4px 16px rgba\(251,70,103,0\.25\)"',
         'boxShadow: "0 4px 16px color-mix(in srgb, var(--color-bearish) 25%, transparent)"'),
        (r'boxShadow:\s*"0 6px 24px rgba\(99,102,241,0\.4\)"',
         'boxShadow: "0 6px 24px color-mix(in srgb, var(--color-primary) 40%, transparent)"'),
        (r'boxShadow:\s*"0 6px 24px rgba\(34,211,166,0\.35\)"',
         'boxShadow: "0 6px 24px color-mix(in srgb, var(--color-bullish) 35%, transparent)"'),
    ]
    for pattern, replacement in shadow_replacements:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            content = new_content
    
    # ── 6. Replace duplicate keyframe animations in MorePanel ──
    # Remove inline <style>{`@keyframes fadeIn...slideUp...`}</style> if both exist
    # since they duplicate vx-animate-fade-in and vx-fade-up
    inline_keyframes = re.compile(
        r'\s*<style>\{`\s*@keyframes fadeIn \{[^}]*\}\s*@keyframes slideUp \{[^}]*\}\s*`\}</style>',
        re.DOTALL
    )
    if inline_keyframes.search(content):
        content = inline_keyframes.sub(
            '', content
        )
        stats["lines_changed"] += 5  # approximate lines removed
    
    # ── 7. Replace hardcoded background colors in style props ──
    bg_replacements = [
        # Replace `background: "rgba(8, 9, 12, 0.75)"` with var(--overlay-secondary)
        (r'background:\s*"rgba\(8,\s*9,\s*12,\s*0\.75\)"', 'background: "var(--overlay-secondary)"'),
        (r'background:\s*"rgba\(10,\s*10,\s*13,\s*0\.60\)"', 'background: "var(--overlay-secondary)"'),
        # Replace hardcoded dark backgrounds
        (r'background:\s*"#0B0D10"', 'background: "var(--color-background)"'),
        (r'background:\s*"#08090C"', 'background: "var(--color-background)"'),
        (r'background:\s*"#1E2028"', 'background: "var(--surface-2, var(--color-card-hover))"'),
        (r'background:\s*"#2A2D37"', 'background: "var(--surface-3, var(--color-muted))"'),
    ]
    for pattern, replacement in bg_replacements:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            content = new_content
    
    # ── 8. Replace inline gold color constants (discover.tsx) ──
    # Replace `const GOLD_COLOR = "#D4A843"` etc.
    gold_const_replacements = [
        (r'const GOLD_COLOR\s*=\s*"[^"]*"', '// GOLD_COLOR removed — use var(--color-gold)'),
        (r'const GOLD_BG\s*=\s*"[^"]*"', '// GOLD_BG removed — use color-mix with var(--color-gold)'),
        (r'const GOLD_BORDER\s*=\s*"[^"]*"', '// GOLD_BORDER removed — use color-mix with var(--color-gold)'),
    ]
    for pattern, replacement in gold_const_replacements:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            content = new_content
    
    # ── 9. Replace `${color}XX` hex-alpha patterns (e.g., `${color}15`) ──
    # These append hex alpha to CSS variable values which is fragile
    # Replace with color-mix where possible
    hex_alpha_replacements = [
        (r'\$\{accent\}15', 'color-mix(in srgb, ${accent} 8%, transparent)'),
        (r'\$\{accent\}30', 'color-mix(in srgb, ${accent} 19%, transparent)'),
        (r'\$\{accent\}18', 'color-mix(in srgb, ${accent} 9%, transparent)'),
        (r'\$\{accent\}33', 'color-mix(in srgb, ${accent} 20%, transparent)'),
    ]
    for pattern, replacement in hex_alpha_replacements:
        regex = re.compile(pattern)
        new_content = regex.sub(replacement, content)
        if new_content != content:
            content = new_content
    
    # Calculate lines changed
    if content != original:
        orig_lines = original.split("\n")
        new_lines = content.split("\n")
        stats["lines_changed"] = sum(
            1 for a, b in zip(orig_lines, new_lines) if a != b
        )
    
    # Write back
    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        total = stats["hex"] + stats["rgba"] + stats["emoji"]
        parts = []
        if stats["hex"]: parts.append(f"{stats['hex']} hex")
        if stats["rgba"]: parts.append(f"{stats['rgba']} rgba")
        if stats["lines_changed"]: parts.append(f"{stats['lines_changed']} lines")
        print(f"  ✅ {rel}: {', '.join(parts)}")
    else:
        print(f"  ⏭ {rel}: no changes needed")
    
    return stats


def main():
    print("=" * 60)
    print("VIXOR Premium Redesign — Phases 1.3 → 3")
    print("Normalizing colors, transitions, shadows across all pages")
    print("=" * 60)
    
    total_stats = {"hex": 0, "rgba": 0, "emoji": 0, "files_changed": 0, "lines_changed": 0}
    
    for rel_path in ROUTE_FILES:
        filepath = os.path.join(BASE, rel_path)
        stats = process_file(filepath)
        total_stats["hex"] += stats["hex"]
        total_stats["rgba"] += stats["rgba"]
        total_stats["emoji"] += stats["emoji"]
        total_stats["lines_changed"] += stats["lines_changed"]
        if stats["hex"] + stats["rgba"] + stats["emoji"] > 0:
            total_stats["files_changed"] += 1
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Files changed: {total_stats['files_changed']}/{len(ROUTE_FILES)}")
    print(f"  Hex replacements: {total_stats['hex']}")
    print(f"  Rgba replacements: {total_stats['rgba']}")
    print(f"  Emoji replacements: {total_stats['emoji']}")
    print(f"  Total lines modified: {total_stats['lines_changed']}")
    print("=" * 60)


if __name__ == "__main__":
    main()