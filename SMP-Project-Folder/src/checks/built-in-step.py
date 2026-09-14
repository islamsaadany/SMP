#!/usr/bin/env python3
"""§349 — THE SHIPPED FILE IS IN STEP WITH THE SOURCES IT IS BUILT FROM.

`SMP-Project-Folder/strategy-management-platform-vX.Y.html` is not written by
hand. `build.py` assembles it from `src/`, and CLAUDE.md has said since the
project folder arrived that the two must be BYTE-IDENTICAL — *if it is not,
something is out of step*. That rule was written down and nothing ever checked
it, so it held for as long as everybody remembered the `cp`.

WHICH IS EXACTLY HOW IT BROKE. §346 edited the sources, regenerated the copies
the Next app serves, and did not rebuild this one: the committed file was 1,722
bytes and 56 lines behind its own sources, a whole round of work missing from
the file somebody would open with no internet. Nothing was broken by it that
day, which is the point — the fault is silent by construction, because a stale
built file RENDERS PERFECTLY. It is simply the product as it was last week.

§329 is this same trap one directory over and closed it for `smp-app/public/`;
this is the frozen half, and it needed its own file rather than a line in that
one: a different artefact, a different builder (`python3 build.py`, not four
node generators), and — the part that decides it — a different AUDIENCE. The
person who edits a frozen source runs the frozen suite, so the guard belongs
where they will meet it.

NOT A SECOND BUILDER (§53.5). It runs the real `build.py` and compares. A
change to how the file is assembled stays green; a source edited without a
rebuild goes red, which is the fault and the only one.

THE SUBJECT IS DERIVED, NEVER TYPED. The shipped file is found through `git
ls-files`, so a version bump needs no edit here — and TWO of them, or none, is
its own failure said in words rather than a crash or a silent pass (§54.5).

THE TREE IS PUT BACK (§94.2). `build.py` overwrites `src/strategy-management-
platform.html`, which git does not track and every check reads; its bytes are
held and restored in a `finally`, pass, fail or throw. Nothing tracked is
written by this file at all — it reports, it does not repair, because a check
that quietly fixes what it measures has told nobody (§329).

AND STALE IS NOT THE SAME ANSWER AS MID-EDIT (§123). A session that has just
changed a source and not yet rebuilt is legitimately red here and wants to be
told *rebuild and copy*; a clean tree that is red means the fault above, and
wants somebody to look at what was left behind. Both are failures and they are
not the same errand, so the file says which.

NO BROWSER AND NO DATABASE — it is a comparison of bytes, so it runs anywhere
and costs a second.

Run: python3 checks/built-in-step.py     (from src/, or through qa-run.py)
"""
import os, subprocess, sys, difflib

HERE = os.path.dirname(os.path.abspath(__file__))
SRC  = os.path.dirname(HERE)                    # SMP-Project-Folder/src
ROOT = os.path.dirname(os.path.dirname(SRC))    # the repository
OUT  = os.path.join(SRC, "strategy-management-platform.html")

bad = 0
def ok(label, cond, detail=""):
    global bad
    if cond:
        print("  ok      " + label)
    else:
        bad += 1
        print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))

def git(*args):
    return subprocess.run(["git"] + list(args), cwd=ROOT,
                          capture_output=True, text=True).stdout


print("── 1 · there is exactly one shipped file, and git knows it")
tracked = [l for l in git("ls-files",
           "SMP-Project-Folder/strategy-management-platform-v*.html").split("\n") if l.strip()]
ok("git tracks exactly one shipped platform file",
   len(tracked) == 1, tracked or "none found")
if len(tracked) != 1:
    # Without a single subject there is nothing to compare, and guessing which
    # one is meant is how a check starts measuring the wrong file (§50.6).
    print("\n%d FAILED" % bad)
    sys.exit(1)

SHIPPED = os.path.join(ROOT, tracked[0])
shipped = open(SHIPPED, "rb").read()


print("\n── 2 · the sources build")
held = open(OUT, "rb").read() if os.path.exists(OUT) else None
try:
    r = subprocess.run([sys.executable, "build.py"], cwd=SRC,
                       capture_output=True, text=True)
    ok("build.py ran and its own parse check passed",
       r.returncode == 0, (r.stderr or r.stdout or "").strip()[-300:])
    if r.returncode != 0:
        print("\n%d FAILED" % bad)
        sys.exit(1)
    fresh = open(OUT, "rb").read()

    print("\n── 3 · and what it produces is what is shipped")
    same = fresh == shipped
    ok("the shipped file is byte-identical to the build", same,
       "" if same else "built %d bytes, shipped %d" % (len(fresh), len(shipped)))

    if not same:
        # WHICH FAILURE IS IT. A dirty source tree and a clean one are two
        # different errands and only one of them is somebody else's mistake.
        # ONLY WHAT THE BUILD ACTUALLY READS COUNTS AS "mid-edit". `checks/`
        # is the suite, not the product — build.py concatenates nothing from
        # it — so a new or edited check leaves the built file untouched and
        # must not be read as an explanation for a stale one. The first run of
        # this file got that wrong on ITSELF: an untracked check made a clean
        # tree report "your edits are not built yet", which is the wrong errand
        # told confidently (§123, §124).
        dirty = [l for l in git("status", "--porcelain",
                                "SMP-Project-Folder/src").split("\n")
                 if l.strip() and "/checks/" not in l]
        a = fresh.decode("utf-8", "replace").splitlines()
        b = shipped.decode("utf-8", "replace").splitlines()
        diff = [d for d in difflib.unified_diff(b, a, "shipped", "built", n=0)
                if d[:1] in "+-" and d[:3] not in ("---", "+++")]
        print("\n     %d lines differ. The first few, shipped (-) against built (+):"
              % len(diff))
        for d in diff[:6]:
            print("       " + d[:150])
        if dirty:
            print("\n     You have %d uncommitted source file(s). If those edits are"
                  " yours,\n     the answer is to rebuild and copy:" % len(dirty))
        else:
            print("\n     The source tree is clean, so the committed built file is"
                  " behind the\n     committed sources — a rebuild was missed. To put"
                  " it right:")
        print("       cd SMP-Project-Folder/src && python3 build.py \\\n"
              "         && cp strategy-management-platform.html ../%s"
              % os.path.basename(SHIPPED))
finally:
    # Put back whatever was there, whatever happened above (§94.2).
    if held is not None:
        open(OUT, "wb").write(held)
    elif os.path.exists(OUT):
        os.remove(OUT)

print("\n" + ("all good" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
