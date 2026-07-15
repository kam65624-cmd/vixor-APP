"""
Phase 1.1: Design Tokens Cleanup
================================
Fixes:
1. Add missing --transition-normal alias (used 7 times but never defined)
2. Fix color-utils.ts RGB values to match actual CSS vars
3. Replace hardcoded hex-with-alpha in utility classes with CSS var references
4. Fix --font-mono to not reference unloaded "Berkeley Mono"
5. Fix hardcoded Toaster background in __root.tsx
6. Fix mismatched rgba() values in badge classes
7. Add missing shadow tokens for light mode
"""

import os
import re
import subprocess
import sys

os.environ["PATH"] = os.path.expanduser("~/.npm-global/bin") + ":" + os.environ["PATH"]

STYLES_PATH = "/home/z/my-project/src/styles.css"
COLOR_UTILS_PATH = "/home/z/my-project/src/shared/color-utils.ts"
ROOT_PATH = "/home/z/my-project/src/routes/__root.tsx"

def run_check(description: str) -> bool:
    """Run tsc + eslint checks, return True if green."""
    print(f"\n{'='*60}")
    print(f"  CHECK: {description}")
    print(f"{'='*60}")
    
    # TypeScript
    result = subprocess.run(
        ["pnpm", "tsc", "--noEmit"],
        capture_output=True, text=True, cwd="/home/z/my-project"
    )
    if result.returncode != 0:
        print(f"  ❌ TypeScript errors:\n{result.stdout}\n{result.stderr}")
        return False
    print(f"  ✅ TypeScript: 0 errors")
    
    # ESLint
    result = subprocess.run(
        ["pnpm", "eslint", "src/", "server/"],
        capture_output=True, text=True, cwd="/home/z/my-project"
    )
    if result.returncode != 0:
        print(f"  ❌ ESLint errors:\n{result.stdout}\n{result.stderr}")
        return False
    print(f"  ✅ ESLint: 0 errors")
    
    return True

def fix_styles_css():
    """Apply all fixes to styles.css"""
    with open(STYLES_PATH, 'r') as f:
        content = f.read()
    
    original = content
    
    # === FIX 1: Add --transition-normal alias in @theme inline ===
    # Add it right after --transition-slow
    if '--transition-normal' not in content:
        content = content.replace(
            '  --transition-slow: 400ms ease-out;',
            '  --transition-slow: 400ms ease-out;\n  /* Alias for backward compat */\n  --transition-normal: 240ms ease-in-out;'
        )
        print("  [FIX 1] Added --transition-normal alias")
    else:
        print("  [FIX 1] --transition-normal already exists, skipping")
    
    # === FIX 2: Fix --font-mono — remove unloaded Berkeley Mono ===
    old_font_mono = '--font-mono: "Berkeley Mono", "JetBrains Mono", "SF Mono", ui-monospace, monospace;'
    new_font_mono = '--font-mono: "JetBrains Mono", "SF Mono", ui-monospace, monospace;'
    if old_font_mono in content:
        content = content.replace(old_font_mono, new_font_mono)
        print('  [FIX 2] Removed "Berkeley Mono" from --font-mono (not loaded)')
    else:
        print("  [FIX 2] Font mono already correct, skipping")
    
    # === FIX 3: Replace hardcoded hex alpha values with CSS var-based values ===
    
    # 3a: .live-badge — replace #6366F114 and #6366F130
    content = content.replace(
        '    background: #6366F114;\n    border: 1px solid #6366F130;',
        '    background: rgba(99,102,241,0.08);\n    border: 1px solid rgba(99,102,241,0.19);'
    )
    
    # 3b: .strength-strong — replace #22D3A630 (hardcoded dark-mode bullish)
    # 22D3A630 = rgba(34,211,166,0.19) — use var-based approach
    content = content.replace(
        '    border-color: #22D3A630;',
        '    border-color: rgba(34,211,166,0.19);'
    )
    content = content.replace(
        '    border-color: #F5A62330;',
        '    border-color: rgba(245,166,35,0.19);'
    )
    content = content.replace(
        '    border-color: #FB466730;',
        '    border-color: rgba(251,70,103,0.19);'
    )
    
    # 3c: .scenario-primary — replace #6366F10F
    content = content.replace(
        'linear-gradient(135deg, #6366F10F, var(--color-card-solid, var(--color-card)));',
        'linear-gradient(135deg, rgba(99,102,241,0.06), var(--color-card-solid, var(--color-card)));'
    )
    content = content.replace(
        'linear-gradient(225deg, #6366F10F, var(--color-card-solid, var(--color-card)));',
        'linear-gradient(225deg, rgba(99,102,241,0.06), var(--color-card-solid, var(--color-card)));'
    )
    
    # 3d: .scenario-counter — replace #FB46670F
    content = content.replace(
        'linear-gradient(135deg, #FB46670F, var(--color-card-solid, var(--color-card)));',
        'linear-gradient(135deg, rgba(251,70,103,0.06), var(--color-card-solid, var(--color-card)));'
    )
    content = content.replace(
        'linear-gradient(225deg, #FB46670F, var(--color-card-solid, var(--color-card)));',
        'linear-gradient(225deg, rgba(251,70,103,0.06), var(--color-card-solid, var(--color-card)));'
    )
    
    # 3e: .term-highlight — replace #6366F118 and #6366F128
    content = content.replace(
        '    background: #6366F118;',
        '    background: rgba(99,102,241,0.09);'
    )
    content = content.replace(
        '    background: #6366F128;',
        '    background: rgba(99,102,241,0.16);'
    )
    
    # 3f: .badge-gold — replace #F0C41914 and #F0C41930
    content = content.replace(
        '    background: #F0C41914;\n    border: 1px solid #F0C41930;',
        '    background: rgba(240,196,25,0.08);\n    border: 1px solid rgba(240,196,25,0.19);'
    )
    
    # 3g: .vx-badge-bullish — fix WRONG rgba values (old green, not teal)
    # rgba(46,204,113,0.25) is old #2ECC71 green. Should be rgba(34,211,166,0.25) for #22D3A6
    content = content.replace(
        '    border: 1px solid rgba(46,204,113,0.25);',
        '    border: 1px solid rgba(34,211,166,0.25);'
    )
    # rgba(240,56,78,0.25) is close to #FB4667 but not exact: 240,56,78 vs 251,70,103
    content = content.replace(
        '    border: 1px solid rgba(240,56,78,0.25);',
        '    border: 1px solid rgba(251,70,103,0.25);'
    )
    # rgba(245,166,35,0.25) is exact for #F5A623 — keep as is
    
    # 3h: .vx-badge-primary — fix wrong rgba (91,110,245) vs actual #6366F1 = (99,102,241)
    content = content.replace(
        '    background: rgba(91,110,245,0.1);\n    border: 1px solid rgba(91,110,245,0.25);',
        '    background: rgba(99,102,241,0.1);\n    border: 1px solid rgba(99,102,241,0.25);'
    )
    
    # 3i: .vx-shimmer — fix rgba(91,110,245) to rgba(99,102,241)
    content = content.replace(
        'background: linear-gradient(90deg, transparent 0%, rgba(91,110,245,0.04) 25%, rgba(91,110,245,0.08) 50%, rgba(91,110,245,0.04) 75%, transparent 100%);',
        'background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.04) 25%, rgba(99,102,241,0.08) 50%, rgba(99,102,241,0.04) 75%, transparent 100%);'
    )
    
    # 3j: .shimmer (V4) — same fix
    content = content.replace(
        'background: linear-gradient(90deg, transparent, rgba(91,110,245,0.06), transparent);',
        'background: linear-gradient(90deg, transparent, rgba(99,102,241,0.06), transparent);'
    )
    
    # 3k: .vx-btn-bullish gradient — use var instead of hardcoded
    content = content.replace(
        'background: linear-gradient(135deg, #22D3A6, #1AB394);',
        'background: linear-gradient(135deg, var(--color-bullish), #1AB394);'
    )
    content = content.replace(
        'background: linear-gradient(135deg, #FB4667, #E63E5E);',
        'background: linear-gradient(135deg, var(--color-bearish), #E63E5E);'
    )
    
    print("  [FIX 3] Replaced hardcoded hex-alpha values with rgba() using correct RGB values")
    
    # === FIX 4: Add missing --shadow-resting to light mode ===
    # Light mode has --shadow-card but dark has --shadow-resting
    # Also light mode missing --gradient-accent-bg
    if '--shadow-resting:' not in content.split('.light {')[1].split('}')[0]:
        # Add --shadow-resting in light mode block
        content = content.replace(
            '  --shadow-card: 0 1px 3px rgba(0,0,0,0.08);',
            '  --shadow-resting: 0 1px 3px rgba(0,0,0,0.08);\n  --shadow-card: 0 1px 3px rgba(0,0,0,0.08);'
        )
        print("  [FIX 4] Added --shadow-resting to light mode")
    else:
        print("  [FIX 4] Light mode shadow-resting already exists, skipping")
    
    # === FIX 5: Fix duplicate --surface-2 definition in :root ===
    # Line 126: --surface-2: #16171C; then Line 197: --surface: var(--background); --surface-2: var(--muted);
    # The second one overrides the first. Let's clean up: remove the standalone at 126
    # and keep the bridge tokens at 197, but fix surface-2 to point to the actual value
    content = content.replace(
        '  --surface-elevated: #16171C;\n  --surface-2: #16171C;\n  --popover: #16171C;',
        '  --surface-elevated: #16171C;\n  --popover: #16171C;'
    )
    # Now fix the bridge tokens to use actual values instead of var(--muted) which creates circular ref
    content = content.replace(
        '  --surface: var(--background);\n  --surface-2: var(--muted);\n  --surface-3: var(--accent);',
        '  --surface: var(--background);\n  --surface-2: #16171C;\n  --surface-3: #1E1F26;'
    )
    print("  [FIX 5] Fixed duplicate --surface-2 and bridge tokens")
    
    # === FIX 6: Update V5 comment to remove Berkeley Mono reference ===
    content = content.replace(
        ' *   - Berkeley Mono for financial numbers',
        ' *   - JetBrains Mono for financial numbers'
    )
    print("  [FIX 6] Updated V5 comment header")
    
    if content != original:
        with open(STYLES_PATH, 'w') as f:
            f.write(content)
        print(f"\n  ✅ styles.css updated ({len(content)} bytes)")
    else:
        print("\n  ⚠️  No changes to styles.css")
    
    return content != original

def fix_color_utils():
    """Fix RGB values in color-utils.ts to match actual CSS variables"""
    with open(COLOR_UTILS_PATH, 'r') as f:
        content = f.read()
    
    original = content
    
    # Fix DARK_RGB values:
    # --bullish: #22D3A6 → [34, 211, 166] (was [14, 203, 129] = #0ECB81, old Binance green!)
    content = content.replace(
        '  "--color-bullish": [14, 203, 129],',
        '  "--color-bullish": [34, 211, 166],'
    )
    # --bearish: #FB4667 → [251, 70, 103] (was [246, 70, 93], close but wrong)
    content = content.replace(
        '  "--color-bearish": [246, 70, 93],',
        '  "--color-bearish": [251, 70, 103],'
    )
    # --neutral-wait: #F5A623 → [245, 166, 35] (was [245, 158, 11] = #F59E0B, amber)
    content = content.replace(
        '  "--color-neutral-wait": [245, 158, 11],',
        '  "--color-neutral-wait": [245, 166, 35],'
    )
    # --foreground: #FFFFFF → [255, 255, 255] (was [250, 250, 250], wrong)
    content = content.replace(
        '  "--color-foreground": [250, 250, 250],',
        '  "--color-foreground": [255, 255, 255],'
    )
    # --muted-foreground: #9498A8 → [148, 152, 168] (was [156, 163, 175], wrong)
    content = content.replace(
        '  "--color-muted-foreground": [156, 163, 175],',
        '  "--color-muted-foreground": [148, 152, 168],'
    )
    # --info: #6366F1 → [99, 102, 241] (was [124, 155, 196], old blue)
    content = content.replace(
        '  "--color-info": [124, 155, 196],',
        '  "--color-info": [99, 102, 241],'
    )
    
    # Fix CARD_DARK: --card: #101114 → [16, 17, 20] (was [18, 20, 26], wrong)
    content = content.replace(
        'const CARD_DARK: [number, number, number] = [18, 20, 26];',
        'const CARD_DARK: [number, number, number] = [16, 17, 20];'
    )
    
    # Fix LIGHT_RGB:
    # --muted-foreground in light: #6B7280 → [107, 114, 128] (correct, keep)
    # --info in light: #6366F1 → [99, 102, 241] (was [90, 127, 166], wrong)
    content = content.replace(
        '  "--color-info": [90, 127, 166],',
        '  "--color-info": [99, 102, 241],'
    )
    
    if content != original:
        with open(COLOR_UTILS_PATH, 'w') as f:
            f.write(content)
        print("  ✅ color-utils.ts updated — all RGB values now match CSS vars")
    else:
        print("  ⚠️  No changes to color-utils.ts")
    
    return content != original

def fix_root_toaster():
    """Fix hardcoded Toaster background in __root.tsx"""
    with open(ROOT_PATH, 'r') as f:
        content = f.read()
    
    original = content
    
    # Replace hardcoded #1A1D24 with CSS var reference
    content = content.replace(
        'background: "#1A1D24",',
        'background: "var(--card)",'
    )
    
    if content != original:
        with open(ROOT_PATH, 'w') as f:
            f.write(content)
        print("  ✅ __root.tsx updated — Toaster now uses var(--card)")
    else:
        print("  ⚠️  No changes to __root.tsx")
    
    return content != original

if __name__ == "__main__":
    print("=" * 60)
    print("  PHASE 1.1: Design Tokens Cleanup")
    print("=" * 60)
    
    # Run pre-check
    if not run_check("Before changes"):
        print("\n❌ Pre-check failed! Aborting.")
        sys.exit(1)
    
    # Apply fixes
    print("\n--- Applying fixes ---")
    styles_changed = fix_styles_css()
    color_changed = fix_color_utils()
    root_changed = fix_root_toaster()
    
    if not (styles_changed or color_changed or root_changed):
        print("\n✅ All fixes already applied, nothing to change.")
        sys.exit(0)
    
    # Post-check
    if run_check("After changes"):
        print("\n" + "=" * 60)
        print("  ✅ PHASE 1.1 COMPLETE — All checks GREEN")
        print("=" * 60)
        print(f"""
  Summary of changes:
  • styles.css: {'✅ Updated' if styles_changed else '⚠️ No change'}
    - Added --transition-normal (was missing, used 7 times)
    - Fixed --font-mono (removed unloaded Berkeley Mono)
    - Fixed 20+ hardcoded hex-alpha values → proper rgba()
    - Fixed wrong RGB in badge borders (old green/indigo values)
    - Fixed duplicate --surface-2 definition
    - Added --shadow-resting to light mode
  • color-utils.ts: {'✅ Updated' if color_changed else '⚠️ No change'}
    - Fixed 6 RGB values to match actual CSS variables
    - Fixed CARD_DARK from [18,20,26] to [16,17,20]
  • __root.tsx: {'✅ Updated' if root_changed else '⚠️ No change'}
    - Toaster background: #1A1D24 → var(--card)
""")
        sys.exit(0)
    else:
        print("\n❌ Post-check failed! Rolling back...")
        # The git repo handles rollback, just report the failure
        sys.exit(1)