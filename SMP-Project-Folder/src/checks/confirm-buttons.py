#!/usr/bin/env python3
"""
THE "ARE YOU SURE" RULES, HELD (§724). Islam, from a picture of a delete
dialog: the title asks with the verb and the thing in it, the body says what
really happens, Cancel on the left, the act on the right in its own words,
red only when it destroys, and never the browser's own box.

Read off the SOURCES, no browser and no database: every <button> in the
frozen sources, the two modules that ask (Notes, Tracker) and the Processes
module's pages.

  1. No button says "Yes, …", "No", "OK" or "Okay" — the act is the word.
  2. Where a Cancel-word sits beside one other button, Cancel comes FIRST
     in the markup, which with no row-reverse anywhere is the left.
  3. A button whose words are Restore / Reinstate, or plain Close, is never
     drawn red: `class="danger"` may not be the literal class in front of
     them. (Close THE CYCLE stays red on Islam's word — §724: "keep the
     cycle buttons red".)
  4. The Processes module's pages call no window.confirm / prompt / alert.

Usage:  python3 checks/confirm-buttons.py [REPO_ROOT]
        (REPO_ROOT defaults to the repository this file sits in; pointing it
        at a copy of the "before" sources is how it is proved able to fail.)
Exits non-zero on any red (§328.8).
"""
import os, re, sys, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(ROOT, "SMP-Project-Folder", "src")
FILES = sorted(glob.glob(os.path.join(SRC, "*.js")) + [os.path.join(SRC, "shell.html")]) + [
    os.path.join(ROOT, "smp-app", "modules", "notes", "page.ts"),
    os.path.join(ROOT, "smp-app", "modules", "tracker", "page.ts"),
]
FFP = os.path.join(ROOT, "smp-app", "app", "(ffp)")

BTN = re.compile(r"<button([^>]*)>(.*?)</button>", re.S)
CANCEL = re.compile(r"^(Cancel|Keep( it| editing| building| as it was| the tour|)|Not now|Not yet|Leave it|Never mind|Go back)$", re.I)
BANNED = re.compile(r"^(Yes\b.*|No|OK|Okay|Ok|Sure)$", re.I)
NEVER_RED = re.compile(r"^(Restore|Reinstate)\b|^Close$")

def words(html):
    t = re.sub(r"<[^>]+>", "", html)
    t = re.sub(r"'\s*\+\s*|\\u2014|&[a-z]+;", " ", t)
    return re.sub(r"\s+", " ", t).strip()

red, ok = [], 0
def ck(cond, what, where):
    global ok
    if cond: ok += 1
    else: red.append(f"{what}  @ {where}")

def is_code_comment(src, pos):
    """True when `pos` is inside a /* … */ or // comment — prose about buttons, not buttons."""
    before = src[:pos]
    o, c = before.rfind("/*"), before.rfind("*/")
    if o > c: return True
    line = before[before.rfind("\n") + 1:]
    return "//" in line

for f in FILES:
    if not os.path.exists(f):
        red.append(f"missing source {f}"); continue
    s = open(f, encoding="utf-8", errors="replace").read()
    rel = os.path.relpath(f, ROOT)
    ms = [m for m in BTN.finditer(s) if not is_code_comment(s, m.start())]
    for i, m in enumerate(ms):
        attrs, txt = m.group(1), words(m.group(2))
        line = s.count("\n", 0, m.start()) + 1
        where = f"{rel}:{line}"
        if not txt: continue
        # 1. the act is the word
        ck(not BANNED.match(txt), f'button says "{txt}" — the act is the word, never Yes/No/OK', where)
        # 3. restore / reinstate / close are never red
        if NEVER_RED.match(txt):
            ck('class="danger"' not in attrs and "danger " not in attrs and ' danger"' not in attrs,
               f'"{txt}" drawn red — red is for what destroys', where)
        # 2. cancel first, where it sits beside one other button
        if CANCEL.match(txt):
            # a neighbour is a button in the SAME row: close by, with no box closed between
            def beside(a, b):
                gap = s[a.end():b.start()]
                return len(gap) < 220 and "</div>" not in gap and "</span>" not in gap and "</p>" not in gap
            prev = ms[i - 1] if i and beside(ms[i - 1], m) else None
            nxt = ms[i + 1] if i + 1 < len(ms) and beside(m, ms[i + 1]) else None
            pw = words(prev.group(2)) if prev else ""
            nw = words(nxt.group(2)) if nxt else ""
            # a PAIR: this cancel and exactly one neighbour, itself not a cancel-word.
            # A row of three or more is a list of choices, not a question, and
            # its "Never mind" may sit where the list ends.
            two = prev and not nxt and not (i >= 2 and beside(ms[i - 2], prev))
            if two and pw and not CANCEL.match(pw):
                ck(False, f'"{pw}" sits before "{txt}" — Cancel goes first, the act last', where)
            elif nxt and (not prev or CANCEL.match(pw) or not pw):
                ok += 1

# 4. the Processes module asks through its own dialog
for f in sorted(glob.glob(os.path.join(FFP, "**", "*.tsx"), recursive=True)):
    s = open(f, encoding="utf-8", errors="replace").read()
    for m in re.finditer(r"window\.(confirm|prompt|alert)\(", s):
        if not is_code_comment(s, m.start()):
            red.append(f"window.{m.group(1)}() — the browser's box can be silenced for good  @ {os.path.relpath(f, ROOT)}:{s.count(chr(10), 0, m.start()) + 1}")
ck(os.path.exists(os.path.join(FFP, "[slug]", "processes", "(shell)", "confirm-dialog.tsx")),
   "the Processes module's own confirm dialog exists", "smp-app/app/(ffp)/[slug]/processes/(shell)/confirm-dialog.tsx")

for r in red: print("  FAIL ", r)
print(f"{ok} ok, {len(red)} failed" if red else f"all good — {ok} checks, {len(FILES)} files")
sys.exit(1 if red else 0)
