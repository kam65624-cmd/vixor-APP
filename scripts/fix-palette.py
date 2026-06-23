#!/usr/bin/env python3
"""
DexScreener Palette Migration Script
Replaces ALL old navy/blue color tokens with the unified DexScreener dark palette.
"""
import os, re, glob

SRC = "/home/z/my-project/src"

# ── Ordered replacements (longest/most-specific first to avoid partial matches) ──
# Each tuple: (pattern, replacement)
# Using raw strings so \b works for word boundaries where needed

REPLACEMENTS = [
    # CSS rgba patterns (most specific first)
    ("rgba(96, 165, 250,",   "rgba(52, 211, 153,"),
    ("rgba(96,165,250,",     "rgba(52,211,153,"),
    ("rgba(59, 130, 246,",   "rgba(16, 185, 129,"),
    ("rgba(59,130,246,",     "rgba(16,185,129,"),

    # Background colors (most specific first to avoid #0A0E1A catching #0A)
    ("#08090C",   "#121212"),
    ("#0D1117",   "#121212"),
    ("#0A0E1A",   "#121212"),
    ("#0f1424",   "#121212"),
    ("#0F1424",   "#121212"),
    ("#070B14",   "#0E0E0E"),

    # Surface colors
    ("#111827",   "#1A1A1A"),
    ("#1a2234",   "#1E1E1E"),
    ("#1A2234",   "#1E1E1E"),
    ("#131829",   "#1E1E1E"),
    ("#162032",   "#1E1E1E"),
    ("#1C2A45",   "#1E1E1E"),
    ("#161b2e",   "#1E1E1E"),

    # Accent colors — blue → emerald green
    ("#2563EB",   "#059669"),
    ("#3B82F6",   "#10B981"),
    ("#60A5FA",   "#34D399"),

    # Border color
    ("#1E293B",   "#2A2A2A"),

    # Text colors
    ("#C9D1E0",   "#9CA3AF"),
    ("#F0F4FC",   "#FFFFFF"),
    ("#7B8BA8",   "#9CA3AF"),
    ("#4A5568",   "#6B7280"),
]

# Files to SKIP (keep purple/pink semantic colors as-is in these contexts)
SKIP_FILES = set()

# Counters
total_files = 0
total_replacements = 0

def process_file(filepath):
    global total_replacements
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except (UnicodeDecodeError, PermissionError):
        return 0

    original = content
    for old, new in REPLACEMENTS:
        content = content.replace(old, new)

    if content != original:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        # Count how many replacements were made
        count = sum(1 for old, _ in REPLACEMENTS if original.count(old) > 0)
        diffs = sum(original.count(old) for old, _ in REPLACEMENTS)
        return diffs
    return 0

# Walk all files in src/
for root, dirs, files in os.walk(SRC):
    # Skip node_modules
    dirs[:] = [d for d in dirs if d not in ("node_modules", ".next", ".vercel")]
    for fname in files:
        if fname.endswith((".tsx", ".ts", ".css", ".html", ".json")):
            fpath = os.path.join(root, fname)
            if fpath in SKIP_FILES:
                continue
            changes = process_file(fpath)
            if changes > 0:
                total_files += 1
                total_replacements += changes
                rel = os.path.relpath(fpath, SRC)
                print(f"  ✅ {rel}: {changes} replacements")

print(f"\n{'='*60}")
print(f"DONE: {total_files} files changed, {total_replacements} total replacements")
print(f"{'='*60}")