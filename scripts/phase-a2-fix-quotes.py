#!/usr/bin/env python3
"""Fix: Wrap var(...) in quotes for JS string context."""
import re, glob

THEME_MAP = {
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

# Also fix: unquoted var() that are already in the files (from previous bad run)
# Pattern: = var(--xxx) or : var(--xxx) where var() should be a string
VAR_FIXES = {
    'var(--color-background)': '"var(--color-background)"',
    'var(--color-card)': '"var(--color-card)"',
    'var(--color-card-hover)': '"var(--color-card-hover)"',
    'var(--color-muted)': '"var(--color-muted)"',
    'var(--color-foreground)': '"var(--color-foreground)"',
    'var(--color-border)': '"var(--color-border)"',
    'var(--color-bullish)': '"var(--color-bullish)"',
    'var(--color-bearish)': '"var(--color-bearish)"',
    'var(--color-primary)': '"var(--color-primary)"',
    'var(--color-neutral-wait)': '"var(--color-neutral-wait)"',
    'var(--color-info)': '"var(--color-info)"',
    'var(--color-muted-foreground)': '"var(--color-muted-foreground)"',
    'color-mix(in oklab, var(--color-foreground) 3%, transparent)': '"color-mix(in oklab, var(--color-foreground) 3%, transparent)"',
    'color-mix(in oklab, var(--color-foreground) 6%, transparent)': '"color-mix(in oklab, var(--color-foreground) 6%, transparent)"',
    'color-mix(in oklab, var(--color-foreground) 4%, transparent)': '"color-mix(in oklab, var(--color-foreground) 4%, transparent)"',
    'color-mix(in oklab, var(--color-foreground) 25%, transparent)': '"color-mix(in oklab, var(--color-foreground) 25%, transparent)"',
    'color-mix(in oklab, var(--color-primary) 15%, transparent)': '"color-mix(in oklab, var(--color-primary) 15%, transparent)"',
}

base = '/home/z/my-project/src'
files = glob.glob(f'{base}/routes/_authenticated/*.tsx')
files.append(f'{base}/components/vixor/PageLayout.tsx')

total_fixed = 0

for filepath in sorted(set(files)):
    with open(filepath) as f:
        content = f.read()
    
    if 'var(--color-' not in content and 'THEME.' not in content:
        continue
    
    original = content
    
    # First: fix any remaining THEME references
    for theme_key, css_var in sorted(THEME_MAP.items(), key=lambda x: -len(x[0])):
        content = content.replace(theme_key, css_var)
    
    # Second: fix unquoted var() in JS context
    # We need to be smart: only replace var() that are NOT already inside a string
    # A var() is unquoted if it appears after = or : followed by space, and NOT inside "..."
    
    # Simple approach: replace common unquoted patterns in style objects
    # Pattern: background: var(--color-card) → background: "var(--color-card)"
    # But NOT: already quoted "var(--color-card)"
    
    for unquoted, quoted in sorted(VAR_FIXES.items(), key=lambda x: -len(x[0])):
        # Skip if the unquoted version IS inside quotes already
        # Replace: : unquoted, or = unquoted, where not preceded by "
        # This is tricky with regex, let's use a simpler approach
        
        # Replace occurrences that are NOT inside a string (i.e., preceded by : or = and NOT by ")
        # Use negative lookbehind for "
        pattern = re.compile(r'(?<!")' + re.escape(unquoted) + r'(?!"|\})')
        
        # But we also need to not match inside already-quoted strings
        # A pragmatic approach: just check if the var() is preceded by " 
        # If not, wrap it
        
        # Even simpler: replace all unquoted with quoted, then fix double-quoted
        pass
    
    # Pragmatic approach: find all lines with unquoted var(-- and fix them
    lines = content.split('\n')
    fixed_lines = []
    for line in lines:
        # If line has var(--color- or color-mix( that's NOT inside a string
        # We detect "inside a string" by checking if it's preceded by "
        # Simple heuristic: count quotes before var( on the line
        
        # Actually, let's use a different approach:
        # Find bare var(--color-xxx) or color-mix(...) not wrapped in quotes
        # Replace them with quoted versions
        
        # Pattern: = var(-- or : var(-- where NOT preceded by "
        line = re.sub(
            r'(?<=[=:]\s)(?!")((?:var\(--color-[\w-]+\)|color-mix\(in oklab, var\(--color-[\w-]+\)[^)]+\)))',
            lambda m: f'"{m.group(1)}"' if not m.group(0).startswith('"') else m.group(0),
            line
        )
        fixed_lines.append(line)
    
    content = '\n'.join(fixed_lines)
    
    # Handle ${var(...)}18 patterns (template literal with hex alpha)
    for var_name in ['primary', 'bullish', 'bearish', 'neutral-wait', 'info']:
        content = content.replace(
            f'${{var(--color-{var_name})}}18',
            f'color-mix(in oklab, var(--color-{var_name}) 10%, transparent)'
        )
        content = content.replace(
            f'${{var(--color-{var_name})}}15',
            f'color-mix(in oklab, var(--color-{var_name}) 8%, transparent)'
        )
        content = content.replace(
            f'${{var(--color-{var_name})}}10',
            f'color-mix(in oklab, var(--color-{var_name}) 6%, transparent)'
        )
        content = content.replace(
            f'${{var(--color-{var_name})}}30',
            f'color-mix(in oklab, var(--color-{var_name}) 19%, transparent)'
        )
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        total_fixed += 1

print(f"Fixed {total_fixed} files")