#!/usr/bin/env python3
"""
PROD-3: Clean up all console.log/warn/error/info/debug calls in src/
- console.error → log.error  (with appropriate message + context)
- console.warn  → log.warn   (with appropriate message + context)
- console.log/info/debug → REMOVE entirely
"""

import os
import re
import sys
from pathlib import Path

SRC_DIR = "/home/z/my-project/src"
EXCLUDED = {"src/shared/structured-logger.ts", "src/server.ts"}
LOG_IMPORT = 'import { log } from "@/shared/structured-logger";'
LOG_IMPORT_RE = re.compile(
    r'import\s*\{\s*log\s*\}\s*from\s*["\']@/shared/structured-logger["\']'
)

REMOVE_METHODS = frozenset({"log", "info", "debug"})
CONVERT_METHODS = frozenset({"error", "warn"})


# ═══════════════════════════════════════════════════════════════════════════
# Low-level helpers: comment detection, paren matching, arg splitting
# ═══════════════════════════════════════════════════════════════════════════

def find_comment_ranges(content: str) -> list[tuple[int, int]]:
    """Return [(start, end), ...] for all // and /* */ comments."""
    ranges: list[tuple[int, int]] = []
    i = 0
    in_str = None  # None | '"' | "'" | '`'
    template_depth = 0

    while i < len(content):
        ch = content[i]

        # ---- inside a template literal ----
        if in_str == "`":
            if ch == "\\" and i + 1 < len(content):
                i += 2
                continue
            if ch == "$" and i + 1 < len(content) and content[i + 1] == "{":
                template_depth += 1
                i += 2
                continue
            if ch == "}" and template_depth > 0:
                template_depth -= 1
                i += 1
                continue
            if ch == "`" and template_depth == 0:
                in_str = None
                i += 1
                continue
            i += 1
            continue

        # ---- inside a regular string ----
        if in_str:
            if ch == "\\" and i + 1 < len(content):
                i += 2
                continue
            if ch == in_str:
                in_str = None
            i += 1
            continue

        # ---- start of a string literal ----
        if ch in ('"', "'", "`"):
            in_str = ch
            i += 1
            continue

        # ---- single-line comment ----
        if ch == "/" and i + 1 < len(content) and content[i + 1] == "/":
            end = content.find("\n", i)
            if end == -1:
                end = len(content)
            ranges.append((i, end))
            i = end
            continue

        # ---- block comment ----
        if ch == "/" and i + 1 < len(content) and content[i + 1] == "*":
            end = content.find("*/", i + 2)
            if end == -1:
                end = len(content)
            else:
                end += 2
            ranges.append((i, end))
            i = end
            continue

        i += 1

    return ranges


def in_any_range(pos: int, ranges: list[tuple[int, int]]) -> bool:
    for s, e in ranges:
        if s <= pos < e:
            return True
    return False


def find_matching_paren(content: str, open_pos: int) -> int:
    """Return index of the matching ')' for the '(' at open_pos, or -1."""
    depth = 0
    i = open_pos
    in_str = None
    template_depth = 0

    while i < len(content):
        ch = content[i]

        if in_str == "`":
            if ch == "\\" and i + 1 < len(content):
                i += 2
                continue
            if ch == "$" and i + 1 < len(content) and content[i + 1] == "{":
                template_depth += 1
                i += 2
                continue
            if ch == "}" and template_depth > 0:
                template_depth -= 1
                i += 1
                continue
            if ch == "`" and template_depth == 0:
                in_str = None
                i += 1
                continue
            i += 1
            continue

        if in_str:
            if ch == "\\" and i + 1 < len(content):
                i += 2
                continue
            if ch == in_str:
                in_str = None
            i += 1
            continue

        if ch in ('"', "'", "`"):
            in_str = ch
            i += 1
            continue

        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                return i
        i += 1

    return -1


def split_args(text: str) -> list[str]:
    """Split comma-separated arguments respecting parens/strings/templates."""
    args: list[str] = []
    depth = 0
    current: list[str] = []
    in_str = None
    template_depth = 0

    i = 0
    while i < len(text):
        ch = text[i]

        if in_str == "`":
            if ch == "\\" and i + 1 < len(text):
                current.append(text[i : i + 2])
                i += 2
                continue
            if ch == "$" and i + 1 < len(text) and text[i + 1] == "{":
                template_depth += 1
                current.append("${")
                i += 2
                continue
            if ch == "}" and template_depth > 0:
                template_depth -= 1
                current.append("}")
                i += 1
                continue
            if ch == "`" and template_depth == 0:
                in_str = None
                current.append("`")
                i += 1
                continue
            current.append(ch)
            i += 1
            continue

        if in_str:
            if ch == "\\" and i + 1 < len(text):
                current.append(text[i : i + 2])
                i += 2
                continue
            if ch == in_str:
                in_str = None
            current.append(ch)
            i += 1
            continue

        if ch in ('"', "'", "`"):
            in_str = ch
            current.append(ch)
            i += 1
            continue

        if ch == "(" or ch == "[" or ch == "{":
            depth += 1
            current.append(ch)
            i += 1
            continue
        if ch in (")", "]", "}"):
            depth -= 1
            current.append(ch)
            i += 1
            continue

        if ch == "," and depth == 0:
            args.append("".join(current).strip())
            current = []
            i += 1
            continue

        current.append(ch)
        i += 1

    remainder = "".join(current).strip()
    if remainder:
        args.append(remainder)

    return args


# ═══════════════════════════════════════════════════════════════════════════
# Message / context builders
# ═══════════════════════════════════════════════════════════════════════════

def clean_message(arg: str, has_extra: bool) -> str:
    """Strip [Prefix] and trailing colon from a string/template arg."""
    s = arg.strip()

    if s.startswith("`") and s.endswith("`"):
        inner = s[1:-1]
        # Strip leading [Prefix] (static text before any ${)
        inner = re.sub(r"^\[([^\]]+)\]\s*", "", inner, count=1)
        if has_extra:
            inner = re.sub(r"\s*:\s*$", "", inner)
        return f"`{inner}`"

    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        quote = s[0]
        inner = s[1:-1]
        inner = re.sub(r"^\[([^\]]+)\]\s*", "", inner, count=1)
        if has_extra:
            inner = re.sub(r"\s*:\s*$", "", inner)
        return f"{quote}{inner}{quote}"

    # Fallback: not a recognizable string literal
    return s


def derive_key(arg: str) -> str:
    """Derive a context key from an argument expression."""
    a = arg.strip()
    # Property access: error.message → "message", info.componentStack → "componentStack"
    if "." in a and "(" not in a and "`" not in a and '"' not in a and "'" not in a:
        parts = a.split(".")
        # If the last part is a simple identifier, use it
        last = parts[-1].strip()
        if re.match(r"^[a-zA-Z_$][a-zA-Z0-9_$]*$", last):
            return last
        return "detail"
    # Simple variable
    m = re.match(r"^([a-zA-Z_$][a-zA-Z0-9_$]*)$", a)
    if m:
        name = m.group(1)
        if name in ("error", "err", "e", "throwable", "exception"):
            return "error"
        return name
    # Ternary / complex expression
    return "error"


def build_ctx(args: list[str]) -> str:
    """Build a { key: value, ... } context string from extra arguments."""
    if not args:
        return ""

    if len(args) == 1:
        a = args[0].strip()
        key = derive_key(a)
        # Check if we can use shorthand
        simple = re.match(r"^([a-zA-Z_$][a-zA-Z0-9_$]*)$", a)
        if simple and simple.group(1) == key:
            return f"{{ {key} }}"
        return f"{{ {key}: {a} }}"

    parts = []
    for a in args:
        a = a.strip()
        key = derive_key(a)
        simple = re.match(r"^([a-zA-Z_$][a-zA-Z0-9_$]*)$", a)
        if simple and simple.group(1) == key:
            parts.append(key)
        else:
            parts.append(f"{key}: {a}")
    return "{ " + ", ".join(parts) + " }"


def convert_call(method: str, args_text: str) -> str:
    """Convert a console.error/warn call to log.error/warn string."""
    args = split_args(args_text)
    if not args:
        return f'log.{method}("")'

    first = args[0].strip()
    is_string_like = bool(first) and first[0] in ('"', "'", "`")

    if is_string_like:
        msg = clean_message(first, len(args) > 1)
        if len(args) == 1:
            return f"log.{method}({msg})"
        ctx = build_ctx(args[1:])
        return f"log.{method}({msg}, {ctx})"
    else:
        # First arg is not a string literal (e.g. a variable like `prefix`)
        if len(args) == 1:
            return f"log.{method}({first})"
        # Put remaining args in context, keep first as message
        ctx = build_ctx(args[1:])
        return f"log.{method}({first}, {ctx})"


# ═══════════════════════════════════════════════════════════════════════════
# Import handling
# ═══════════════════════════════════════════════════════════════════════════

def has_log_import(content: str) -> bool:
    return bool(LOG_IMPORT_RE.search(content))


def add_log_import(content: str) -> str:
    """Insert the log import after the last top-level import statement."""
    lines = content.split("\n")
    last_import_line_idx = -1
    in_import = False

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith("import "):
            in_import = True
            if ";" in line:
                in_import = False
                last_import_line_idx = i
        elif in_import:
            if ";" in line:
                in_import = False
                last_import_line_idx = i

    if last_import_line_idx == -1:
        return LOG_IMPORT + "\n" + content

    # Compute character position right after the last import line's newline
    insert_pos = sum(len(lines[j]) + 1 for j in range(last_import_line_idx + 1))
    return content[:insert_pos] + LOG_IMPORT + "\n" + content[insert_pos:]


# ═══════════════════════════════════════════════════════════════════════════
# Main file processor
# ═══════════════════════════════════════════════════════════════════════════

def process_file(filepath: str) -> dict | None:
    """Process a single file. Returns {"removed": N, "converted": N} or None."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    comment_ranges = find_comment_ranges(content)

    # Find all console.xxx( calls
    console_re = re.compile(r"console\.(log|warn|error|info|debug)\s*\(")
    matches = [
        m for m in console_re.finditer(content)
        if not in_any_range(m.start(), comment_ranges)
    ]

    if not matches:
        return None

    removed = 0
    converted = 0
    needs_import = False

    # Process in reverse order so earlier positions remain valid
    for match in reversed(matches):
        method = match.group(1)

        # Find the opening paren
        paren_pos = content.index("(", match.start())
        close_pos = find_matching_paren(content, paren_pos)
        if close_pos == -1:
            print(f"  WARNING: unmatched paren in {filepath} at line ~{content[:match.start()].count(chr(10))+1}")
            continue

        # Determine the extent of the call (including optional semicolon)
        call_end = close_pos + 1
        while call_end < len(content) and content[call_end] in (" ", "\t"):
            call_end += 1
        if call_end < len(content) and content[call_end] == ";":
            call_end += 1

        # Determine the line range the call spans
        line_start = content.rfind("\n", 0, match.start()) + 1
        line_end_tmp = content.find("\n", call_end - 1)
        if line_end_tmp == -1:
            line_end = len(content)
        else:
            line_end = line_end_tmp + 1  # include the \n

        # Check what's before the console call on the same line
        before_on_line = content[line_start:match.start()].strip()
        is_if_body = bool(
            re.match(r"^(if\s*\(.*\)\s*|else\s+if\s*\(.*\)\s*|else\s+)$", before_on_line)
        )

        if method in REMOVE_METHODS:
            # ── REMOVE ──────────────────────────────────────────────────────
            removed += 1
            # If the console call is the only thing on these lines (plus optional
            # if/else guard), remove the entire line(s).
            line_text = content[line_start:line_end].strip()
            # Reconstruct what's on the line(s) without the console call
            # For single-line: "if (x) console.log(...);"  or just "console.log(...);"
            # For multi-line: the console call spans multiple lines
            if is_if_body or _is_only_console_on_lines(content, line_start, line_end, match.start(), call_end):
                # Remove entire line(s)
                content = content[:line_start] + content[line_end:]
            else:
                # Console call is part of a larger expression — remove just the call text
                content = content[:match.start()] + content[call_end:]

        elif method in CONVERT_METHODS:
            # ── CONVERT ─────────────────────────────────────────────────────
            args_text = content[paren_pos + 1 : close_pos]
            try:
                replacement = convert_call(method, args_text)
            except Exception as exc:
                print(f"  WARNING: conversion failed in {filepath}: {exc}")
                continue

            converted += 1
            needs_import = True
            # Replace just the console.xxx(...) part (preserve surrounding if/else)
            content = content[: match.start()] + replacement + content[call_end:]

    # Clean up excessive blank lines (3+ → 2)
    content = re.sub(r"\n{3,}", "\n\n", content)

    # Ensure trailing newline
    if not content.endswith("\n"):
        content += "\n"

    # Add import if we converted any calls
    if needs_import and not has_log_import(content):
        content = add_log_import(content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    return {"removed": removed, "converted": converted}


def _is_only_console_on_lines(
    content: str, line_start: int, line_end: int, call_start: int, call_end: int
) -> bool:
    """Check if the console call is the only statement on the given lines."""
    # Get the text of the line(s), excluding the console call itself
    before = content[line_start:call_start].strip()
    after_raw = content[call_end:line_end].rstrip("\n").strip()

    # "before" might be empty or have a comment after removing the call
    # "after" might be empty or just a closing paren/semicolon

    # If there's meaningful code before or after, it's not the only statement
    # But trailing commas, semicolons, closing parens/brackets are ok
    if before and not re.match(
        r"^(if\s*\(.*\)\s*|else\s+if\s*\(.*\)\s*|else\s*)$", before
    ):
        return False
    if after_raw and after_raw not in ("", ")", ")", ",") and not re.match(r"^[)\],;]*$", after_raw):
        return False
    return True


# ═══════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════

def main():
    total_files = 0
    total_removed = 0
    total_converted = 0
    modified_files: list[str] = []

    for root, _dirs, files in os.walk(SRC_DIR):
        for fname in sorted(files):
            if not (fname.endswith(".ts") or fname.endswith(".tsx")):
                continue

            filepath = os.path.join(root, fname)
            rel = os.path.relpath(filepath, "/home/z/my-project")

            # Skip excluded files
            if rel in EXCLUDED:
                continue
            if fname.endswith(".test.ts") or fname.endswith(".test.tsx"):
                continue

            result = process_file(filepath)
            if result:
                total_files += 1
                total_removed += result["removed"]
                total_converted += result["converted"]
                modified_files.append(rel)

    print("=" * 70)
    print("PROD-3: Console cleanup complete")
    print("=" * 70)
    print(f"  Files modified : {total_files}")
    print(f"  Calls removed  : {total_removed}  (console.log / info / debug)")
    print(f"  Calls converted: {total_converted}  (console.error → log.error, console.warn → log.warn)")
    print()
    print("Modified files:")
    for f in sorted(modified_files):
        print(f"  - {f}")
    print()


if __name__ == "__main__":
    main()