#!/usr/bin/env python3
"""Splice `_rows.js` into every Portfolio drawing that asks for it.

Spec 056 §5.2. Three drawings read one plan, and three hand-kept copies of an
array is the fault this spec is about — so the copy is MECHANICAL and the
script REFUSES rather than guessing: a file carrying one marker and not the
other, or a marker pair in the wrong order, is a failure with a name.

    python3 design-mockups/portfolio/sync-rows.py          # write
    python3 design-mockups/portfolio/sync-rows.py --check  # fail if stale

A file opts in by carrying the two markers; nothing is listed by hand here, so
a fourth drawing joins by adding them (§214.3 — a typed list outlives the
decision that made it).
"""
import glob
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "_rows.js")
OPEN, SHUT = "/* ROWS:start */", "/* ROWS:end */"

def main():
    check = "--check" in sys.argv
    body = io.open(SRC, encoding="utf-8").read().rstrip("\n")
    seen, stale = 0, []

    for path in sorted(glob.glob(os.path.join(HERE, "*.html"))):
        s = io.open(path, encoding="utf-8").read()
        a, b = s.count(OPEN), s.count(SHUT)
        if a == 0 and b == 0:
            continue
        name = os.path.basename(path)
        if a != 1 or b != 1:
            sys.exit("%s: expected one of each marker, found %d open and %d close" % (name, a, b))
        i, j = s.index(OPEN), s.index(SHUT)
        if j < i:
            sys.exit("%s: the markers are the wrong way round" % name)
        seen += 1
        out = s[:i + len(OPEN)] + "\n" + body + "\n" + s[j:]
        if out == s:
            print("  in step   %s" % name)
            continue
        stale.append(name)
        if check:
            print("  STALE     %s" % name)
        else:
            io.open(path, "w", encoding="utf-8").write(out)
            print("  written   %s" % name)

    if not seen:
        sys.exit("no drawing carries the markers — that is a fault, not an empty run")
    if check and stale:
        sys.exit("%d of %d drawing(s) are behind _rows.js" % (len(stale), seen))
    print("%d drawing(s) read one plan." % seen)

main()
