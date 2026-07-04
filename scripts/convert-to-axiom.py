#!/usr/bin/env python3
"""Convert shadcn CSS tokens to Axiom dark terminal hardcoded values."""

import re
import sys

def convert_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # Order matters - do longer/more-specific patterns first
    
    # Background tokens
    content = content.replace('bg-background', 'bg-[#0A0E1A]')
    content = content.replace('bg-card-hover', 'bg-[#1a2234]')
    content = content.replace('bg-card', 'bg-[#111827]')
    
    # Bearish/Bullish tokens
    content = content.replace('bg-bearish/20', 'bg-red-500/20')
    content = content.replace('bg-bearish/10', 'bg-red-500/10')
    content = content.replace('text-bearish', 'text-red-400')
    content = content.replace('border-bearish', 'border-red-500')
    content = content.replace('bg-bullish', 'bg-emerald-500/15')
    content = content.replace('text-bullish', 'text-emerald-400')
    content = content.replace('border-bullish', 'border-emerald-500')
    
    # Primary with opacity
    content = content.replace('bg-primary/15', 'bg-[#3B82F6]/15')
    content = content.replace('bg-primary/10', 'bg-[#3B82F6]/10')
    content = content.replace('bg-primary/5', 'bg-[#3B82F6]/5')
    content = content.replace('border-primary/50', 'border-[#3B82F6]/50')
    content = content.replace('border-primary/40', 'border-[#3B82F6]/40')
    content = content.replace('border-primary/30', 'border-[#3B82F6]/30')
    content = content.replace('border-primary/20', 'border-[#3B82F6]/20')
    content = content.replace('border-primary/15', 'border-[#3B82F6]/15')
    content = content.replace('text-primary-foreground', 'text-white')
    
    # Standalone primary (be careful - text-primary vs bg-primary)
    content = content.replace('ring-primary/30', 'ring-[#3B82F6]/30')
    
    # text-primary (color)
    content = re.sub(r'text-primary(?![\-])', 'text-[#3B82F6]', content)
    
    # bg-primary (background) - not already matched
    content = re.sub(r'bg-primary(?![\/\-])', 'bg-[#3B82F6]', content)
    
    # Foreground
    content = content.replace('text-foreground', 'text-white')
    
    # Muted foreground
    content = content.replace('text-muted-foreground', 'text-gray-400')
    
    # Border
    content = content.replace('border-border', 'border-[#1E293B]')
    
    # Scrollbar
    content = content.replace('scrollbar-thumb-muted', 'scrollbar-thumb-gray-600')
    
    # Gradient/glow
    content = content.replace('gradient-primary', 'bg-gradient-to-r from-[#3B82F6] to-[#2563EB]')
    content = content.replace('glow-primary', '')
    
    # vixor-card class -> inline style equivalent
    # Keep vixor-card as a class since it's defined in CSS
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Converted {filepath}: {len(original)} -> {len(content)} bytes")
        return True
    else:
        print(f"No changes needed for {filepath}")
        return False

if __name__ == '__main__':
    files = [
        '/home/z/my-project/src/routes/_authenticated/copilot.tsx',
        '/home/z/my-project/src/routes/_authenticated/analysis.$id.tsx',
    ]
    
    changed = 0
    for f in files:
        if convert_file(f):
            changed += 1
    
    print(f"\n{changed}/{len(files)} files converted")
