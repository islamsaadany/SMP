#!/usr/bin/env python3
"""Splice the shared blocks into every Portfolio drawing that asks for them.

Spec 056 §5.2. Several drawings read one plan and work out one set of figures
from it, and a hand-kept copy of either is the fault this spec is about — so
both are MECHANICAL:

    ROWS    `_rows.js`    the plan itself
    DERIVE  `_derive.js`  the sums taken off it

    python3 design-mockups/portfolio/sync-rows.py          # write
    python3 design-mockups/portfolio/sync-rows.py --check  # fail if stale

A file opts in by carrying a block's two markers, so a fifth drawing joins by
adding them and nothing is listed by hand (§214.3 — a typed list outlives the
decision that made it). The script REFUSES rather than guessing: a file with
one marker and not its pair, markers the wrong way round, or a run that matched
no drawing at all is each a failure with a name (§54.5 — an empty run that
prints nothing is not a pass).
"""
import glob
import io
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BLOCKS = [("ROWS", "_rows.js"), ("DERIVE", "_derive.js")]

def main():
    check = "--check" in sys.argv
    seen, stale, counts = 0, [], {}

    for path in sorted(glob.glob(os.path.join(HERE, "*.html"))):
        s = original = io.open(path, encoding="utf-8").read()
        name = os.path.basename(path)
        took = []

        for tag, src in BLOCKS:
            opn, shut = "/* %s:start */" % tag, "/* %s:end */" % tag
            a, b = s.count(opn), s.count(shut)
            if a == 0 and b == 0:
                continue
            if a != 1 or b != 1:
                sys.exit("%s: %s expected one of each marker, found %d open and %d close"
                         % (name, tag, a, b))
            i, j = s.index(opn), s.index(shut)
            if j < i:
                sys.exit("%s: the %s markers are the wrong way round" % (name, tag))
            body = io.open(os.path.join(HERE, src), encoding="utf-8").read().rstrip("\n")
            s = s[:i + len(opn)] + "\n" + body + "\n" + s[j:]
            took.append(tag)
            counts[tag] = counts.get(tag, 0) + 1

        if not took:
            continue
        seen += 1
        if s == original:
            print("  in step   %-42s %s" % (name, "+".join(took)))
            continue
        stale.append(name)
        if check:
            print("  STALE     %-42s %s" % (name, "+".join(took)))
        else:
            io.open(path, "w", encoding="utf-8").write(s)
            print("  written   %-42s %s" % (name, "+".join(took)))

    if not seen:
        sys.exit("no drawing carries a marker — that is a fault, not an empty run")
    for tag, _ in BLOCKS:
        if not counts.get(tag):
            sys.exit("no drawing carries the %s block — it would go stale unseen" % tag)
    if check and stale:
        sys.exit("%d of %d drawing(s) are behind their source" % (len(stale), seen))
    print("%d drawing(s) read one plan (%s)."
          % (seen, ", ".join("%s in %d" % (t, counts[t]) for t, _ in BLOCKS)))

main()
