#!/usr/bin/env python3
"""Add missing share imports to analysis.$id.tsx"""
path = 'src/routes/_authenticated/analysis.$id.tsx'
with open(path, 'r') as f:
    content = f.read()

old = 'import { PageLayout, ScrollArea, Badge, ProgressBar } from "@/components/vixor/PageLayout";'
new = '''import { PageLayout, ScrollArea, Badge, ProgressBar } from "@/components/vixor/PageLayout";
import { shareOnX, shareOnTelegram } from "@/shared/share";
import type { ShareableSignal } from "@/shared/share";'''

if old in content:
    content = content.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(content)
    print("Added share imports!")
else:
    print("Target string not found, checking if imports already exist...")
    if 'shareOnX' in content:
        print("Share imports already exist")
    else:
        print("ERROR: Cannot find insertion point")
        # Print surrounding lines for debug
        for i, line in enumerate(content.split('\n'), 1):
            if 'PageLayout' in line and 'import' in line:
                print(f"  Line {i}: {repr(line)}")