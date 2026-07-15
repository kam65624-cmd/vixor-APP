"""
Phase 2: Bulk normalize all route + component files.
Fixes ~346 hardcoded token violations across 35 files.
"""
import os
import re
import subprocess
import sys

os.environ["PATH"] = os.path.expanduser("~/.npm-global/bin") + ":" + os.environ["PATH"]

SRC = "/home/z/my-project/src"

# Collect all .tsx files to process
FILES = []
for root, dirs, files in os.walk(SRC):
    for f in files:
        if f.endswith(".tsx"):
            FILES.append(os.path.join(root, f))

total_changes = 0

def replace_in_file(filepath: str, patterns: list[tuple[str, str]]) -> int:
    """Apply multiple (old, new) replacements to a file. Return count of changes."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old, new in patterns:
        content = content.replace(old, new)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        # Count how many patterns actually changed
        changed = sum(1 for old, _ in patterns if old in original and old not in content)
        return changed
    return 0

# ── 1. Font family replacements (highest count, safest) ──
FONT_PATTERNS = [
    # Multi-font → var (longest first to avoid partial matches)
    ("fontFamily: \"'Inter', system-ui, -apple-system, sans-serif\"", 'fontFamily: "var(--font-sans)"'),
    ("fontFamily: '-apple-system, BlinkMacSystemFont, \"Inter\", \"Segoe UI\", Roboto, sans-serif'", 'fontFamily: "var(--font-sans)"'),
    ("fontFamily: \"'Inter', system-ui, sans-serif\"", 'fontFamily: "var(--font-sans)"'),
    ("fontFamily: \"'JetBrains Mono', ui-monospace, monospace\"", 'fontFamily: "var(--font-mono)"'),
    ("fontFamily: \"'JetBrains Mono', monospace\"", 'fontFamily: "var(--font-mono)"'),
    # Conditional mono pattern
    ("fontFamily: mono ? \"'JetBrains Mono', ui-monospace, monospace\" : undefined", 'fontFamily: mono ? "var(--font-mono)" : undefined'),
    # SVG font attributes
    ("fontFamily=\"'Inter', system-ui, sans-serif\"", 'fontFamily="var(--font-sans)"'),
    ("fontFamily=\"'JetBrains Mono', monospace\"", 'fontFamily="var(--font-mono)"'),
]

# ── 2. Hex color replacements ──
HEX_PATTERNS = [
    # Old Binance colors
    ('"#0ECB81"', '"var(--color-bullish)"'),
    ("'#0ECB81'", "'var(--color-bullish)'"),
    ('"#F6465D"', '"var(--color-bearish)"'),
    ("'#F6465D'", "'var(--color-bearish)'"),
    # Binance yellow → gold token
    ('"#F0B90B"', '"var(--color-gold)"'),
    ("'#F0B90B'", "'var(--color-gold)'"),
    ('"#F0B90B22"', '"color-mix(in srgb, var(--color-gold) 13%, transparent)"'),
    # Hardcoded dark backgrounds
    ('backgroundColor: "#0B0D10"', 'backgroundColor: "var(--color-background)"'),
    ('color: "#0B0D10"', 'color: "var(--color-background)"'),
    ('border: "1px solid #2A2D37"', 'border: "1px solid var(--color-border)"'),
    ('#7C9BC4', 'var(--color-primary)'),
    # Offline red in __root.tsx
    ('background: "rgba(246,70,93,0.12)"', 'background: "var(--bearish-bg)"'),
]

# ── 3. RGBA value corrections (fix wrong RGB to correct RGB) ──
# These fix the actual RGB numbers to match the CSS variables
RGBA_PATTERNS = [
    # Bullish: old Binance green [14,203,129] → V5 teal [34,211,166]
    ("rgba(14, 203, 129,", "rgba(34, 211, 166,"),
    ("rgba(14,203,129,", "rgba(34,211,166,"),
    # Bearish: wrong [246,70,93] → correct [251,70,103]
    ("rgba(246, 70, 93,", "rgba(251, 70, 103,"),
    ("rgba(246,70,93,", "rgba(251,70,103,"),
    # Primary/info: old blue [124,155,196] → V5 indigo [99,102,241]
    ("rgba(124, 155, 196,", "rgba(99, 102, 241,"),
    ("rgba(124,155,196,", "rgba(99,102,241,"),
    # Wrong primary [91,110,245] → correct [99,102,241]
    ("rgba(91,110,245,", "rgba(99,102,241,"),
    # Neutral-wait: wrong amber [245,158,11] → correct [245,166,35]
    ("rgba(245,158,11,", "rgba(245,166,35,"),
    # Red-500 [248,113,113] → correct bearish [251,70,103]
    ("rgba(248,113,113,", "rgba(251,70,103,"),
    # Offline banner specific (already fixed in AppShell but check elsewhere)
    ("rgba(248, 113, 113,", "rgba(251, 70, 103,"),
]

# ── 4. Generic Tailwind class replacements ──
TW_PATTERNS = [
    ('bg-red-500/10', 'bg-bearish/10'),
    ('bg-red-500', 'bg-bearish'),
    ('border-red-500/40', 'border-bearish/40'),
    ('border-red-500', 'border-bearish'),
    ('[&>div]:bg-red-500', '[&>div]:bg-bearish'),
    ('text-red-500', 'text-bearish'),
    ('bg-emerald-500/40', 'bg-bullish/40'),
    ('border-emerald-500/40', 'border-bullish/40'),
    ('bg-white/5', 'bg-muted'),
]

ALL_PATTERNS = FONT_PATTERNS + HEX_PATTERNS + RGBA_PATTERNS + TW_PATTERNS

def run_ci():
    """Run tsc + eslint, return True if green."""
    r = subprocess.run(["pnpm", "tsc", "--noEmit"], capture_output=True, text=True, cwd="/home/z/my-project")
    if r.returncode != 0:
        print(f"  ❌ TypeScript: {r.stdout[:500]}")
        return False
    r = subprocess.run(["pnpm", "eslint", "src/", "server/"], capture_output=True, text=True, cwd="/home/z/my-project")
    if r.returncode != 0:
        print(f"  ❌ ESLint:\n{r.stdout}")
        return False
    return True

# ── Pre-check ──
print("Pre-check CI...", end=" ")
if not run_ci():
    print("FAILED. Aborting.")
    sys.exit(1)
print("GREEN ✅")

# ── Apply ──
print(f"\nProcessing {len(FILES)} .tsx files...")
for filepath in sorted(FILES):
    changes = replace_in_file(filepath, ALL_PATTERNS)
    if changes > 0:
        rel = os.path.relpath(filepath, "/home/z/my-project")
        print(f"  ✏️  {rel}: {changes} pattern(s) replaced")
        total_changes += 1

print(f"\nFiles modified: {total_changes}")

# ── Post-check ──
print("\nPost-check CI...", end=" ")
if not run_ci():
    print("FAILED!")
    sys.exit(1)
print("GREEN ✅")

print(f"""
═══════════════════════════════════════
  ✅ PHASE 2 BULK FIX COMPLETE
═══════════════════════════════════════
  Files modified: {total_changes}
  Pattern categories: fonts, hex, rgba, tailwind
  CI: GREEN
═══════════════════════════════════════
""")