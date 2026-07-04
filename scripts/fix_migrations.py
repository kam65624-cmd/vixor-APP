#!/usr/bin/env python3
"""Make SQL migration files idempotent by adding DROP IF EXISTS before CREATE POLICY."""
import re, os

migrations_dir = 'supabase/migrations'
files_to_fix = [
    '20260609140000_add_price_alerts.sql',
    '20260609140001_add_daily_signals.sql',
    '20260610000000_add_trading_notes.sql',
    '20260610010000_add_trades.sql',
    '20260610020000_add_copilot_chats.sql',
    '20260610030000_add_daily_loop.sql',
    '20260611000000_enable_rls_daily_signals.sql',
    '20260612000000_add_domain_events.sql',
    '20260612010000_add_user_memories.sql',
]

for fname in files_to_fix:
    path = os.path.join(migrations_dir, fname)
    with open(path) as f:
        content = f.read()

    # Find all CREATE POLICY statements and add DROP IF EXISTS before them
    # Pattern: CREATE POLICY "name" ON table ...
    def add_drop_before_create(match):
        indent = match.group(1) or ''
        return f"{indent}DROP POLICY IF EXISTS {match.group(2)} ON {match.group(3)};\n{indent}CREATE POLICY {match.group(2)} ON {match.group(3)}"

    new_content = re.sub(
        r'^(\s*)CREATE POLICY ("[^"]+"|\S+) ON (\S+)',
        add_drop_before_create,
        content,
        flags=re.MULTILINE
    )

    # Also wrap in DO $$ blocks for policies that have complex USING clauses
    # (multi-line policies are harder to fix, but DROP + CREATE should work)

    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f"Fixed: {fname}")
    else:
        print(f"No changes: {fname}")
