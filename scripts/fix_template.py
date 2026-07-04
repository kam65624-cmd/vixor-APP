#!/usr/bin/env python3
"""Fix generate_report.py - replace ), in HTML template strings"""
import sys

src = '/home/z/my-project/scripts/generate_report.py'
dst = '/home/z/my-project/scripts/generate_report.py.fixed'

CHUNK = 65536  # bytes per chunk

with open(src, 'rb') as f:
    all_data = f.read()

result = bytearray(len(all_data) + CHUNK)
pos = 0
while pos < len(all_data):
    end = min(pos + CHUNK, len(all_data))
    chunk = all_data[pos:end]
    chunk = chunk.replace(b'\n),', b'\n],')
    result.extend(chunk)
    pos = end

with open(dst, 'wb') as f:
    f.write(result)

print(f'Processed {len(all_data)} bytes, wrote {len(result)} bytes')