#!/usr/bin/env python3
"""§557 — NO TWO FUNCTIONS IN THE PLATFORM SHARE A NAME.

build.py concatenates every script into one page, so two `function x(` in
two files are one function: whichever comes later silently replaces the
other everywhere. §557 added a `foundationBody` to the deck and the
company's Strategy page — which had its own `foundationBody` — rendered as
the company's key alone, with no error anywhere. `structure.py` caught it
by luck. This catches the whole class, at the source.

It reads build.py's own list of scripts, so a file added there is covered.
"""
import os, re, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.dirname(HERE)
build = open(os.path.join(SRC, "build.py"), encoding="utf-8").read()
names = sorted(set(re.findall(r'["\']([A-Za-z0-9_./-]+\.(?:js|html))["\']', build)))
# The built page is build.py's OUTPUT, named in it too — never a source.
files = [f for f in names if os.path.isfile(os.path.join(SRC, f))
         and not os.path.basename(f).startswith("strategy-management-platform")]
if not files:
    print("no-twin-functions: could not read build.py's list of scripts"); sys.exit(1)
seen = collections.defaultdict(list)
for f in files:
    for m in re.finditer(r"^function ([A-Za-z0-9_$]+)\s*\(", open(os.path.join(SRC, f), encoding="utf-8").read(), re.M):
        seen[m.group(1)].append(f)
twins = {k: v for k, v in seen.items() if len(v) > 1}
print("  read %d scripts, %d top-level functions" % (len(files), len(seen)))
for k, v in sorted(twins.items()): print("  FAIL %s is defined in %s" % (k, ", ".join(v)))
print("no-twin-functions: " + ("%d FAILED" % len(twins) if twins else "all passed"))
sys.exit(1 if twins else 0)
