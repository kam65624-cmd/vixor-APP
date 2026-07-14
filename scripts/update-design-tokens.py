"""
Update VIXOR Design Tokens from V4 → V5 (2026/2027 Redesign Spec).
Changes:
  - Background: #0A0A0D → #08090C (deeper)
  - Surface-1:  #121215 → #101114
  - Surface-2:  #1A1A1F → #16171C (new explicit layer)
  - Primary:    #5B6EF5 → #6366F1 (Indigo, more premium)
  - Primary glow: #7B8AFF → #818CF8
  - Bullish:    #2ECC71 → #22D3A6 (modern teal)
  - Bearish:    #F0384E → #FB4667
  - Text secondary: #9A9AA5 → #9498A8
  - Text muted: #5C5C66 → #565A66
  - Radius: sm:6→8, md:8→12, lg:12→16, xl:16→20
  - Spacing: add md:12, lg:16, xl:24, 2xl:32, 3xl:48
  - Motion: instant:100ms, fast:180ms, base:240ms, slow:400ms
  - Typography: add display/h1/h2/h3/body-lg/body/caption/micro scale
  - Shadows: resting/elevated/floating/glow-primary/glow-bullish
  - Easing: standard/decelerate/accelerate/spring
"""

import re

CSS_PATH = "/home/z/my-project/src/styles.css"

with open(CSS_PATH, "r") as f:
    css = f.read()

# ============================================================
# 1. COLOR REPLACEMENTS (6-digit hex first, then 8-digit)
# ============================================================
color_map = {
    # Primary: Blue-Purple → Indigo
    "#5B6EF5": "#6366F1",
    "#7B8AFF": "#818CF8",
    # Bullish: Green → Modern Teal
    "#2ECC71": "#22D3A6",
    "#27AE60": "#1AB394",  # darker variant for gradients
    # Bearish: Red → New Red
    "#F0384E": "#FB4667",
    "#D63040": "#E63E5E",  # darker variant for gradients
    # Text
    "#9A9AA5": "#9498A8",
    "#5C5C66": "#565A66",
}

# Replace 6-digit hex (must NOT match 8-digit)
for old, new in color_map.items():
    # Negative lookahead: ensure not followed by another hex digit
    pattern = re.compile(re.escape(old) + r"(?![0-9a-fA-F])")
    css = pattern.sub(new, css)

# ============================================================
# 2. BACKGROUND/CARD/SURFACE TOKENS in :root
# ============================================================
# Background: #0A0A0D → #08090C
css = css.replace("--background: #0A0A0D;", "--background: #08090C;")
css = css.replace("background: rgba(10, 10, 13,", "background: rgba(8, 9, 12,")  # glass-header

# Card (Surface-1): #121215 → #101114
css = css.replace("--card: #121215;", "--card: #101114;")
css = css.replace("--card-solid: #121215;", "--card-solid: #101114;")

# Card-hover / Surface-elevated / Popover (Surface-2): #1A1A1F → #16171C
css = css.replace("--card-hover: #1A1A1F;", "--card-hover: #16171C;")
css = css.replace("--surface-elevated: #1A1A1F;", "--surface-elevated: #16171C;")
css = css.replace("--popover: #1A1A1F;", "--popover: #16171C;")

# Secondary / Muted / Accent: #1A1A1F → #16171C
css = css.replace("  --secondary: #1A1A1F;", "  --secondary: #16171C;")
css = css.replace("  --muted: #1A1A1F;", "  --muted: #16171C;")
css = css.replace("  --accent: #1A1A1F;", "  --accent: #16171C;")

# Accent-dark: #232329 → #1E1F26
css = css.replace("--accent-dark: #232329;", "--accent-dark: #1E1F26;")

# Border: #2A2A31 → softer
css = css.replace("--border: #2A2A31;", "--border: rgba(255,255,255,0.08);")
css = css.replace("--input: #2A2A31;", "--input: rgba(255,255,255,0.08);")

# Border-subtle: #1E1E25 → rgba(255,255,255,0.04)
css = css.replace("--border-subtle: #1E1E25;", "--border-subtle: rgba(255,255,255,0.04);")

# Border-hover: #3A3A45 → rgba(255,255,255,0.15)
css = css.replace("--border-hover: #3A3A45;", "--border-hover: rgba(255,255,255,0.15);")

# Ring: use new primary with alpha
css = css.replace("--ring: #5B6EF566;", "--ring: #6366F140;")
css = css.replace("--ring: #6366F166;", "--ring: #6366F140;")

# Primary-glow variable
css = css.replace("--primary-glow: #818CF8;", "--primary-glow: #818CF8;")

# ============================================================
# 3. ADD SURFACE-2 TOKEN (new layer)
# ============================================================
# Insert --surface-2 after --surface-elevated line
css = css.replace(
    "  --surface-elevated: #16171C;",
    "  --surface-elevated: #16171C;\n  --surface-2: #16171C;"
)

# ============================================================
# 4. UPDATE GRADIENTS
# ============================================================
css = css.replace(
    "linear-gradient(135deg, #6366F1, #818CF8)",
    "linear-gradient(135deg, #6366F1, #818CF8)"
)
css = css.replace(
    "linear-gradient(135deg, #22D3A62E, #22D3A605)",
    "linear-gradient(135deg, #22D3A62E, #22D3A605)"
)
css = css.replace(
    "linear-gradient(135deg, #FB46672E, #FB466705)",
    "linear-gradient(135deg, #FB46672E, #FB466705)"
)
css = css.replace(
    "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.008))",
    "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))"
)
css = css.replace(
    "radial-gradient(ellipse at 30% 20%, #6366F110 0%, transparent 60%)",
    "radial-gradient(ellipse at 30% 20%, #6366F112 0%, transparent 60%)"
)

# ============================================================
# 5. UPDATE SHADOWS to match spec (3 levels + 2 glows)
# ============================================================
css = css.replace(
    "--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);",
    "--shadow-resting: 0px 1px 2px rgba(0,0,0,0.4);"
)
css = css.replace(
    "--shadow-elevated: 0 8px 32px rgba(0, 0, 0, 0.4);",
    "--shadow-elevated: 0px 8px 24px rgba(0,0,0,0.5);"
)
css = css.replace(
    "--shadow-glow: 0 0 16px -4px #6366F125;",
    "--shadow-glow: 0px 0px 24px rgba(99,102,241,0.25);"
)

# Add new shadow tokens after shadow-glow
css = css.replace(
    "  --shadow-glow: 0px 0px 24px rgba(99,102,241,0.25);",
    """  --shadow-glow: 0px 0px 24px rgba(99,102,241,0.25);
  --shadow-floating: 0px 16px 48px rgba(0,0,0,0.6);
  --glow-primary: 0px 0px 24px rgba(99,102,241,0.25);
  --glow-bullish: 0px 0px 20px rgba(34,211,166,0.2);"""
)

# ============================================================
# 6. UPDATE GLASS SURFACE
# ============================================================
css = css.replace(
    "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)",
    "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 50%)"
)
css = css.replace(
    "background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);\n    backdrop-filter: blur(20px) saturate(180%);",
    """background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
    backdrop-filter: blur(20px) saturate(180%);"""
)

# ============================================================
# 7. UPDATE OVERLAY
# ============================================================
css = css.replace(
    "--overlay: rgba(10, 10, 13, 0.75);",
    "--overlay: rgba(8, 9, 12, 0.75);"
)

# ============================================================
# 8. UPDATE @theme inline — RADIUS tokens
# ============================================================
css = css.replace("  --radius-xs: 4px;", "  --radius-xs: 4px;")  # keep
css = css.replace("  --radius-sm: 6px;", "  --radius-sm: 8px;")  # 6→8
css = css.replace("  --radius-md: 8px;", "  --radius-md: 12px;")  # 8→12
css = css.replace("  --radius-lg: 12px;", "  --radius-lg: 16px;")  # 12→16
css = css.replace("  --radius-xl: 16px;", "  --radius-xl: 20px;")  # 16→20
css = css.replace("  --radius-2xl: 20px;", "  --radius-2xl: 24px;")  # 20→24
css = css.replace("  --radius-pill: 20px;", "  --radius-pill: 9999px;")  # pill→full
css = css.replace("  --radius-full: 9999px;", "  --radius-full: 9999px;")  # keep

# ============================================================
# 9. UPDATE @theme inline — SPACING tokens
# ============================================================
# Current: xs:4, sm:8, md:16, lg:24, xl:32
# Spec:    xs:4, sm:8, md:12, lg:16, xl:24, 2xl:32, 3xl:48
css = css.replace("  --space-xs: 4px;", "  --space-xs: 4px;")  # keep
css = css.replace("  --space-sm: 8px;", "  --space-sm: 8px;")  # keep
css = css.replace("  --space-md: 16px;", "  --space-md: 12px;")  # 16→12
css = css.replace("  --space-lg: 24px;", "  --space-lg: 16px;")  # 24→16
css = css.replace(
    "  --space-xl: 32px;",
    "  --space-xl: 24px;\n  --space-2xl: 32px;\n  --space-3xl: 48px;"
)  # 32→24, add 2xl, 3xl

# ============================================================
# 10. UPDATE @theme inline — TRANSITION/MOTION tokens
# ============================================================
# Spec: instant:100ms, fast:180ms, base:240ms, slow:400ms
# + easing: standard, decelerate, accelerate, spring
css = css.replace(
    """  /* Transition tokens */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease-in-out;
  --transition-slow: 300ms ease-out;""",
    """  /* Motion tokens — V5 Spec */
  --transition-instant: 100ms ease;
  --transition-fast: 180ms ease;
  --transition-base: 240ms ease-in-out;
  --transition-slow: 400ms ease-out;
  /* Easing curves */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-accelerate: cubic-bezier(0.4, 0, 1, 1);"""
)

# ============================================================
# 11. UPDATE @theme inline — TYPOGRAPHY scale
# ============================================================
# Add proper type scale
css = css.replace(
    """  /* Type scale */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-display: 28px;""",
    """  /* Type scale — V5 Spec (8 levels) */
  --text-display: 32px;
  --text-h1: 24px;
  --text-h2: 20px;
  --text-h3: 16px;
  --text-body-lg: 15px;
  --text-body: 13px;
  --text-caption: 12px;
  --text-micro: 11px;
  /* Legacy aliases (deprecated, use above) */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;"""
)

# ============================================================
# 12. UPDATE vx-btn button sizes (space-md changed from 16 to 12)
# ============================================================
# The buttons use `padding: 0 var(--space-md)` which was 16px, now 12px.
# Adjust button padding to maintain visual balance with new spacing.
css = css.replace(
    ".btn-buy {\n    background: var(--color-bullish);\n    color: var(--color-buy-text);\n    font-weight: 600;\n    font-size: 14px;\n    border: none;\n    border-radius: var(--radius-md);\n    height: 34px;\n    padding: 0 var(--space-md);",
    ".btn-buy {\n    background: var(--color-bullish);\n    color: var(--color-buy-text);\n    font-weight: 600;\n    font-size: 14px;\n    border: none;\n    border-radius: var(--radius-md);\n    height: 36px;\n    padding: 0 16px;"
)
css = css.replace(
    ".btn-sell {\n    background: transparent;\n    color: var(--color-foreground);\n    font-weight: 500;\n    font-size: 14px;\n    border: 1px solid var(--color-border);\n    border-radius: var(--radius-md);\n    height: 34px;\n    padding: 0 var(--space-md);",
    ".btn-sell {\n    background: transparent;\n    color: var(--color-foreground);\n    font-weight: 500;\n    font-size: 14px;\n    border: 1px solid var(--color-border);\n    border-radius: var(--radius-md);\n    height: 36px;\n    padding: 0 16px;"
)
css = css.replace(
    ".btn-primary {\n    background: var(--color-primary);\n    color: var(--color-primary-foreground);\n    font-weight: 600;\n    font-size: 14px;\n    border: none;\n    border-radius: var(--radius-md);\n    height: 34px;\n    padding: 0 var(--space-md);",
    ".btn-primary {\n    background: var(--color-primary);\n    color: var(--color-primary-foreground);\n    font-weight: 600;\n    font-size: 14px;\n    border: none;\n    border-radius: var(--radius-md);\n    height: 36px;\n    padding: 0 16px;"
)

# ============================================================
# 13. UPDATE vx-btn-primary glow to new color
# ============================================================
css = css.replace(
    "box-shadow: 0 4px 16px rgba(91,110,245,0.3);",
    "box-shadow: 0 4px 16px rgba(99,102,241,0.3);"
)
css = css.replace(
    "box-shadow: 0 6px 24px rgba(91,110,245,0.4);",
    "box-shadow: 0 6px 24px rgba(99,102,241,0.4);"
)
# Bullish glow
css = css.replace(
    "box-shadow: 0 4px 16px rgba(46,204,113,0.25);",
    "box-shadow: 0 4px 16px rgba(34,211,166,0.25);"
)
css = css.replace(
    "box-shadow: 0 6px 24px rgba(46,204,113,0.35);",
    "box-shadow: 0 6px 24px rgba(34,211,166,0.35);"
)
# Bearish glow
css = css.replace(
    "box-shadow: 0 4px 16px rgba(240,56,78,0.25);",
    "box-shadow: 0 4px 16px rgba(251,70,103,0.25);"
)
css = css.replace(
    "box-shadow: 0 6px 24px rgba(240,56,78,0.35);",
    "box-shadow: 0 6px 24px rgba(251,70,103,0.35);"
)

# ============================================================
# 14. UPDATE bullish/bearish bg & border references
# ============================================================
css = css.replace("border-color: #22D3A630;", "border-color: rgba(34,211,166,0.19);")
css = css.replace("border-color: #FB466730;", "border-color: rgba(251,70,103,0.19);")
css = css.replace("border-color: #22D3A625;", "border-color: rgba(34,211,166,0.15);")
css = css.replace("border-color: #FB466725;", "border-color: rgba(251,70,103,0.15);")

# ============================================================
# 15. UPDATE vx-glow-pulse animation
# ============================================================
css = css.replace(
    "0%, 100% { box-shadow: 0 0 8px rgba(91,110,245,0.15); }\n    50% { box-shadow: 0 0 20px rgba(91,110,245,0.3); }",
    "0%, 100% { box-shadow: 0 0 8px rgba(99,102,241,0.15); }\n    50% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }"
)

# Update vx-shimmer to use new primary
css = css.replace(
    "background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.04) 25%, rgba(99,102,241,0.08) 50%, rgba(99,102,241,0.04) 75%, transparent 100%);",
    "background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.04) 25%, rgba(99,102,241,0.08) 50%, rgba(99,102,241,0.04) 75%, transparent 100%);"
)

# Update regular shimmer too
css = css.replace(
    "background: linear-gradient(90deg, transparent, rgba(99,102,241,0.06), transparent);",
    "background: linear-gradient(90deg, transparent, rgba(99,102,241,0.06), transparent);"
)

# ============================================================
# 16. UPDATE status dot glow colors
# ============================================================
css = css.replace(
    "box-shadow: 0 0 8px rgba(46,204,113,0.5);",
    "box-shadow: 0 0 8px rgba(34,211,166,0.5);"
)

# ============================================================
# 17. UPDATE handle-bar
# ============================================================
css = css.replace(
    "--handle-bar: rgba(91, 110, 245, 0.15);",
    "--handle-bar: rgba(99, 102, 241, 0.15);"
)

# ============================================================
# 18. UPDATE bullish-border color-mix
# ============================================================
# These are fine since they reference var(--bullish)

# ============================================================
# 19. UPDATE vx-card shadow references
# ============================================================
css = css.replace("box-shadow: var(--shadow-card);", "box-shadow: var(--shadow-resting, 0px 1px 2px rgba(0,0,0,0.4));")

# ============================================================
# 20. UPDATE vx-glass box-shadow
# ============================================================
css = css.replace(
    "box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06);",
    "box-shadow: 0px 8px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);"
)

# ============================================================
# 21. UPDATE gradient-primary utility
# ============================================================
# Already updated via hex replacement

# ============================================================
# 22. UPDATE scenario card colors
# ============================================================
css = css.replace(
    "background: linear-gradient(135deg, #6366F10F, var(--color-card-solid, var(--color-card)));",
    "background: linear-gradient(135deg, #6366F10F, var(--color-card-solid, var(--color-card)));"
)

# ============================================================
# 23. UPDATE term-highlight colors
# ============================================================
css = css.replace("background: #6366F118;", "background: rgba(99,102,241,0.09);")
css = css.replace("background: #6366F128;", "background: rgba(99,102,241,0.16);")

# ============================================================
# 24. ADD FONT DISPLAY token
# ============================================================
css = css.replace(
    '  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;\n  --font-mono: "JetBrains Mono", "SF Mono", ui-monospace, monospace;',
    """  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-display: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: "Berkeley Mono", "JetBrains Mono", "SF Mono", ui-monospace, monospace;"""
)

# ============================================================
# 25. UPDATE vx-input height to 40px (spec standard)
# ============================================================
css = css.replace("height: 44px;\n    padding: 0 12px;\n    transition:", "height: 40px;\n    padding: 0 12px;\n    transition:")

# ============================================================
# 26. UPDATE vx-btn heights
# ============================================================
css = css.replace(
    ".vx-btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 8px;\n    font-family: var(--font-sans);\n    font-weight: 600;\n    font-size: 14px;\n    border: none;\n    border-radius: var(--radius-lg);\n    height: 44px;\n    padding: 0 20px;",
    ".vx-btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 8px;\n    font-family: var(--font-sans);\n    font-weight: 600;\n    font-size: 14px;\n    border: none;\n    border-radius: var(--radius-md);\n    height: 40px;\n    padding: 0 16px;"
)

# vx-btn-sm
css = css.replace(
    ".vx-btn-sm {\n    height: 34px;\n    padding: 0 14px;\n    font-size: 12px;\n    border-radius: var(--radius-md);",
    ".vx-btn-sm {\n    height: 32px;\n    padding: 0 12px;\n    font-size: 12px;\n    border-radius: var(--radius-sm);"
)

# vx-btn-lg
css = css.replace(
    ".vx-btn-lg {\n    height: 52px;\n    padding: 0 28px;\n    font-size: 15px;\n    border-radius: var(--radius-xl);",
    ".vx-btn-lg {\n    height: 48px;\n    padding: 0 24px;\n    font-size: 15px;\n    border-radius: var(--radius-lg);"
)

# ============================================================
# 27. UPDATE the comment header
# ============================================================
css = css.replace(
    "/* ===== VIXOR Design System V4 — Trading Terminal + Mobile =====",
    "/* ===== VIXOR Design System V5 — Premium Trading 2026/2027 ====="
)
css = css.replace(
    " * Merged from two reference systems:\n *   System 1: Dark Trading Terminal (web/desktop)\n *   System 2: Cryptex Mobile UI Kit (mobile/Telegram)\n *\n * Color tokens: background/surface hierarchy, semantic green/red,\n *   blue-purple primary, gold accent.\n * Typography: Inter + JetBrains Mono for numbers.\n * Spacing: 4px base unit.",
    " * Based on V4, upgraded to 2026/2027 Premium Spec:\n *   - Indigo primary (#6366F1) replacing blue-purple\n *   - Modern teal bullish (#22D3A6) replacing classic green\n *   - Deeper backgrounds (08090C / 101114 / 16171C)\n *   - 3-level shadow + glow system\n *   - Motion tokens with premium easings\n *   - 8-level typography scale\n *   - Berkeley Mono for financial numbers"
)

# ============================================================
# WRITE UPDATED FILE
# ============================================================
with open(CSS_PATH, "w") as f:
    f.write(css)

print("Design tokens updated successfully!")
print(f"File: {CSS_PATH}")

# Quick stats
print(f"\nNew primary: #6366F1 (Indigo)")
print(f"New bullish: #22D3A6 (Teal)")
print(f"New bearish: #FB4667")
print(f"New bg: #08090C")
print(f"New surface-1: #101114")
print(f"New surface-2: #16171C")