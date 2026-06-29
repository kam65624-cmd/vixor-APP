#!/usr/bin/env python3
"""Fix BackHeader to accept share props and fix scope issues."""
import re

path = 'src/routes/_authenticated/analysis.$id.tsx'
with open(path, 'r') as f:
    content = f.read()

# 1. Update BackHeader calls to pass share props
content = content.replace('<BackHeader />', '<BackHeader shareOpen={shareOpen} setShareOpen={setShareOpen} isComplete={isComplete} handleShareX={handleShareX} handleShareTelegram={handleShareTelegram} />')

# 2. Update BackHeader function signature to accept props
old_backheader = 'function BackHeader() {'
new_backheader = '''function BackHeader({ shareOpen, setShareOpen, isComplete, handleShareX, handleShareTelegram }: {
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  isComplete: boolean;
  handleShareX: () => void;
  handleShareTelegram: () => void;
}) {'''
content = content.replace(old_backheader, new_backheader, 1)

with open(path, 'w') as f:
    f.write(content)

print("Fixed BackHeader props")