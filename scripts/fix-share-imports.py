#!/usr/bin/env python3
import glob
import os

# Find the actual file
matches = glob.glob('src/routes/_authenticated/analysis.*id.tsx')
if not matches:
    print("ERROR: File not found")
    exit(1)

path = matches[0]
print(f"Found: {path}")

with open(path, 'r') as f:
    lines = f.readlines()

# Find the line with PageLayout import
insert_idx = None
for i, line in enumerate(lines):
    if 'PageLayout' in line and 'import' in line and 'vixor/PageLayout' in line:
        insert_idx = i + 1
        break

if insert_idx is None:
    print("ERROR: Could not find PageLayout import line")
    exit(1)

# Check if share imports already exist
content = ''.join(lines)
if 'from "@/shared/share"' in content:
    print("Share imports already exist!")
    exit(0)

# Insert after the PageLayout import line
new_lines = [
    'import { shareOnX, shareOnTelegram } from "@/shared/share";\n',
    'import type { ShareableSignal } from "@/shared/share";\n',
]

lines = lines[:insert_idx] + new_lines + lines[insert_idx:]

with open(path, 'w') as f:
    f.writelines(lines)

print(f"Inserted share imports after line {insert_idx}")