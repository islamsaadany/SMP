#!/usr/bin/env python3
"""Prove the CLAUDE.md slimming pass lost nothing (§531).

CLAUDE.full.md is the archive of what CLAUDE.md used to be. Every section
number and every heading in it must still be reachable: verbatim or as an index
line in the new CLAUDE.md, or as a section of
SMP-Project-Folder/DECISIONS-AND-LOGIC-v3.22.md.

Exit code is non-zero on any unreachable item (§328.8), and the failure names
each one. Run it before editing CLAUDE.md or the decisions file.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FULL = ROOT / 'CLAUDE.full.md'
NEW = ROOT / 'CLAUDE.md'
DEC = ROOT / 'SMP-Project-Folder' / 'DECISIONS-AND-LOGIC-v3.22.md'

SECTION = re.compile(r'(?:§|&sect;)\s*(\d+(?:\.\d+)*)')
HEADING = re.compile(r'^(#{1,6})\s+(.*\S)\s*$')


def read(p):
    return p.read_text(encoding='utf-8', errors='replace')


_CACHE = {}


def lines_of(text):
    if text not in _CACHE:
        _CACHE[text] = text.split('\n')
    return _CACHE[text]


def fenced_lines(text):
    """Line numbers (1-indexed) that sit inside a ``` fence."""
    inside, out, open_at = False, set(), 0
    for n, line in enumerate(text.split('\n'), 1):
        if line.startswith('```'):
            inside = not inside
            open_at = n
            continue
        if inside:
            out.add(n)
    return out


def headings(text, skip_fenced=True):
    """Real markdown headings, i.e. not '#' comments inside a bash fence."""
    fenced = fenced_lines(text) if skip_fenced else set()
    found = []
    for n, line in enumerate(text.split('\n'), 1):
        if n in fenced:
            continue
        m = HEADING.match(line)
        if m:
            found.append((n, m.group(1), m.group(2)))
    return found


def main():
    full, new, dec = read(FULL), read(NEW), read(DEC)
    failures = []

    # ---- 1. every § number in the archive is reachable -------------------
    refs = set(SECTION.findall(full))
    dec_heads = {m.group(1) for m in
                 re.finditer(r'^#{1,6}\s+(?:§|&sect;)?\s*(\d+(?:\.\d+)*)\b',
                             dec, re.M)}
    dec_mentions = set(SECTION.findall(dec))
    new_refs = set(SECTION.findall(new))
    unreachable = sorted(refs - dec_heads - dec_mentions - new_refs,
                         key=lambda s: [int(x) for x in s.split('.')])
    print(f'section numbers in {FULL.name}: {len(refs)}')
    print(f'  with a heading in {DEC.name}: {len(refs & dec_heads)}')
    print(f'  reachable via that file\'s prose: {len(refs & dec_mentions)}')
    print(f'  present in {NEW.name}: {len(refs & new_refs)}')
    print(f'  unreachable: {len(unreachable)}')
    if unreachable:
        failures.append(('section numbers', unreachable))

    # ---- 2. every heading in the archive is reachable ---------------------
    arch_heads = headings(full)
    new_text_heads = {t for _, _, t in headings(new)}
    missing_heads = []
    for n, hashes, title in arch_heads:
        if title in new_text_heads:
            continue
        # a heading the slimming pass renamed is reachable if its words are
        # still in the new file, or it is a decisions-file section
        if title in new or title in dec:
            continue
        missing_heads.append(f'{FULL.name}:{n} {hashes} {title}')
    print(f'headings in {FULL.name}: {len(arch_heads)}')
    print(f'  unreachable: {len(missing_heads)}')
    if missing_heads:
        failures.append(('headings', missing_heads))

    # ---- 3. every build command survives ---------------------------------
    cmd = re.compile(r'^\s*((?:DATABASE_URL\w*=|SMP_\w+=|cd |node |python3 |npm |npx )'
                     r'[^#`]*)')
    arch_cmds = set()
    for n in sorted(fenced_lines(full)):
        line = full.split('\n')[n - 1]
        m = cmd.match(line)
        if m:
            arch_cmds.add(m.group(1).strip())
    missing_cmds = sorted(c for c in arch_cmds if c not in new)
    print(f'build commands in {FULL.name} fences: {len(arch_cmds)}')
    print(f'  missing from {NEW.name}: {len(missing_cmds)}')
    if missing_cmds:
        failures.append(('build commands', missing_cmds))

    lines = lines_of(full)

    # ---- 3b. standalone notes inside the fences survive verbatim ---------
    # A comment at column 0 in a bash fence is a note of its own, not a
    # continuation of the command above it, so nothing attaches it to a
    # command and an index pass drops it silently (§531 found one: PILLOW).
    fl = fenced_lines(full)
    orphan_lines = [n for n in sorted(fl) if lines_of(full)[n - 1].startswith('#')]
    blocks, cur = [], []
    for n in orphan_lines:
        if cur and n == cur[-1] + 1:
            cur.append(n)
        else:
            if cur:
                blocks.append(cur)
            cur = [n]
    if cur:
        blocks.append(cur)
    missing_notes = []
    for b in blocks:
        body = lines_of(full)[b[0] - 1:b[-1]]
        if not all(line in new for line in body):
            missing_notes.append(f'{FULL.name}:{b[0]}-{b[-1]} '
                                 f'{body[0].lstrip("# ")[:60]}')
    print(f'standalone notes inside fences: {len(blocks)}')
    print(f'  not carried verbatim: {len(missing_notes)}')
    if missing_notes:
        failures.append(('standalone notes', missing_notes))

    # ---- 4. the index is as long as the thing it indexes ------------------
    repo_bullets = sum(1 for i in range(1016, 8517) if lines[i].startswith('- **'))
    changelog = sum(1 for i in range(11114, len(lines))
                    if re.match(r'^\*(Last Updated|Earlier):', lines[i]))
    nlines = new.split('\n')
    try:
        a = next(i for i, l in enumerate(nlines)
                 if l.startswith('#### Repository — decision index'))
        b = next(i for i, l in enumerate(nlines)
                 if l.startswith('## Changelog index'))
        is_idx = re.compile(r'^- .*→ (?:§|v?\d|full:)')
        repo_idx = sum(1 for l in nlines[a:b] if is_idx.match(l))
        cl_idx = sum(1 for l in nlines[b:] if is_idx.match(l))
    except StopIteration:
        repo_idx = cl_idx = -1
    print(f'repository decisions {repo_bullets} -> index lines {repo_idx}')
    print(f'changelog entries    {changelog} -> index lines {cl_idx}')
    if repo_idx != repo_bullets:
        failures.append(('repository index length',
                         [f'{repo_bullets} decisions, {repo_idx} index lines']))
    if cl_idx != changelog:
        failures.append(('changelog index length',
                         [f'{changelog} entries, {cl_idx} index lines']))

    # ---- 5. the index lines obey the 100-character cap --------------------
    over = []
    for i, l in enumerate(nlines, 1):
        if l.startswith('- ') and '→' in l and len(l) > 100:
            over.append(f'{NEW.name}:{i} ({len(l)} chars)')
    print(f'index lines over 100 characters: {len(over)}')
    if over:
        failures.append(('index line cap', over))

    print()
    if failures:
        print('FAILED')
        for what, items in failures:
            print(f'\n{what} — {len(items)} unreachable:')
            for it in items:
                print(f'  {it}')
        return 1
    print('PASSED — nothing in the archive is unreachable')
    return 0


if __name__ == '__main__':
    sys.exit(main())
