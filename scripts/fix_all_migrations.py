#!/usr/bin/env python3
"""Make ALL migration files fully idempotent."""
import re, os

migrations_dir = 'supabase/migrations'
files = sorted(os.listdir(migrations_dir))
files = [f for f in files if f.endswith('.sql')]

for fname in files:
    path = os.path.join(migrations_dir, fname)
    with open(path) as f:
        content = f.read()
    
    original = content
    
    # 1. CREATE TABLE → CREATE TABLE IF NOT EXISTS (if not already)
    content = re.sub(
        r'CREATE TABLE (\w+)',
        lambda m: f'CREATE TABLE IF NOT EXISTS {m.group(1)}' if 'IF NOT EXISTS' not in m.group(0) else m.group(0),
        content
    )
    
    # 2. CREATE INDEX → CREATE INDEX IF NOT EXISTS (if not already, skip unique constraints)
    content = re.sub(
        r'CREATE (UNIQUE )?INDEX (\w+)',
        lambda m: f'CREATE {m.group(1) or ""}INDEX IF NOT EXISTS {m.group(2)}' if 'IF NOT EXISTS' not in m.group(0) else m.group(0),
        content
    )
    
    # 3. ALTER TABLE ... ADD COLUMN → ALTER TABLE ... ADD COLUMN IF NOT EXISTS
    content = re.sub(
        r'(ALTER TABLE \w+ ADD COLUMN) (\w+)',
        r'\1 IF NOT EXISTS \2',
        content
    )
    
    # 4. CREATE TRIGGER → DROP TRIGGER IF EXISTS + CREATE TRIGGER
    # Only if there's no DROP TRIGGER before it
    lines = content.split('\n')
    new_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('CREATE TRIGGER ') and 'CREATE OR REPLACE TRIGGER' not in stripped:
            # Get the trigger name and table
            match = re.match(r'CREATE TRIGGER (\S+)', stripped)
            if match:
                trigger_name = match.group(1)
                # Find the ON table clause
                on_match = re.search(r'ON (\w+)', stripped)
                if on_match:
                    table = on_match.group(1)
                    indent = len(line) - len(line.lstrip())
                    indent_str = ' ' * indent
                    # Check if there's already a DROP TRIGGER in the next few lines above
                    preceding = '\n'.join(new_lines[-3:]) if len(new_lines) >= 3 else '\n'.join(new_lines)
                    if f'DROP TRIGGER IF EXISTS {trigger_name}' not in preceding:
                        new_lines.append(f'{indent_str}DROP TRIGGER IF EXISTS {trigger_name} ON {table};')
        new_lines.append(line)
    content = '\n'.join(new_lines)
    
    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"Fixed: {fname}")
    else:
        print(f"OK: {fname}")
