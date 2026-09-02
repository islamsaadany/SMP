"""ARRANGE COMES BACK, AND BOTH ENDS ARE ASSERTED (§101).

§94.2's rule is the whole reason this file exists: a check that only looks for
something PRESENT cannot see a control that should not be drawn. Every earlier
plan-edit check ran as the SMO, so none of them would ever have noticed that a
unit head had no way to reorder — and none would notice now if the arrange
button were drawn for the office as well, beside a pen that already does it.

So each viewer is asked for BOTH: the control that should be there, and the one
that should not.

AND THE SCREEN IS COMPARED WITH THE RULE. `lib/rules.js` is inlined into the
platform, so the page and the server answer from one function — but only if the
page actually asks it. The old `canArrange` asked `mayAuthor`, which is a
different question, and that mismatch is what shipped §94.3's silent refusals.
Asking both here is what makes a future divergence loud.

    python3 checks/plan-arrange.py      (or via qa-run.py in the cloud image)
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
FILE = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
import os
EXE = os.environ.get("SMP_CHROME") or None
bad = 0


def ck(what, ok, extra=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + what +
          (("  — " + str(extra)) if not ok and extra else ""))


def go(pg, who, target, tab, sec):
    pg.evaluate("([k,t])=>{ VIEWER=k; current=t; ARRANGE=false; paint(); }", [who, target])
    pg.wait_for_timeout(450)
    pg.evaluate("(t)=>{const b=[...document.querySelectorAll('[data-s]')]"
                ".find(x=>x.dataset.s===t); if(b)b.click();}", tab)
    pg.wait_for_timeout(400)
    pg.evaluate("(s)=>{const r=[...document.querySelectorAll('[data-sub2]')]"
                ".find(x=>x.dataset.sub2===s); if(r)r.click();}", sec)
    pg.wait_for_timeout(600)


def state(pg):
    return pg.evaluate("""()=>{
        const a=document.querySelector('.arrpen');
        let hit=null;
        if(a){ const q=a.getBoundingClientRect();
               const e=document.elementFromPoint(q.left+q.width/2, q.top+q.height/2);
               hit = e ? (e.closest('.arrpen') ? 'arrpen' : e.tagName) : 'nothing'; }
        return { arrange: !!a,
                 /* §248: the pen left the pane corner for the section line,
                    and the arrows deliberately did not — they belong beside
                    the rail they reorder, and their holder never has a pen. */
                 pen: !!document.querySelector('#secrow-in .secpen'),
                 pressable: hit,
                 grips: document.querySelectorAll('.grip').length,
                 rule: SMPRules.mayArrange(world(), viewer(), TARGET) }; }""")


with sync_playwright() as p:
    b = p.chromium.launch(**({"executable_path": EXE} if EXE else {}))
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" else None)
    pg.goto(FILE, wait_until="load")
    pg.wait_for_timeout(2500)

    # ── 1 · A UNIT'S PLAN ────────────────────────────────────────────────
    print("\n1 · a unit's Plan pane")
    for who, want_arr, want_pen in [("smo", False, True), ("mobhead", True, False),
                                    ("own_mob", True, False), ("dir", False, False),
                                    ("ceo", False, False)]:
        go(pg, who, "mobile", "strategy", "plan")
        s = state(pg)
        ck("%s: arrange %s" % (who, "drawn" if want_arr else "NOT drawn"),
           s["arrange"] == want_arr, s)
        # THE OFFICE MUST NOT GET BOTH. §94.15 removed the last Arrange button
        # because everyone who could arrange already had a pen; that argument
        # still holds for exactly the people who have one.
        ck("%s: pen %s" % (who, "drawn" if want_pen else "NOT drawn"),
           s["pen"] == want_pen, s)
        ck("%s: the screen agrees with the shared rule" % who,
           s["rule"] == (want_arr or want_pen), s)
        if want_arr:
            ck("%s: and it is PRESSABLE, not merely present" % who,
               s["pressable"] == "arrpen", s)

    # ── 2 · PRESSING IT PRODUCES THE HANDLES ─────────────────────────────
    # Asserted because a button that enters a mode which draws nothing is the
    # §96 fault: every control present, wired to nothing, and the page renders.
    print("\n2 · pressing it")
    go(pg, "mobhead", "mobile", "strategy", "plan")
    before = state(pg)["grips"]
    pg.click(".arrpen")
    pg.wait_for_timeout(500)
    after = state(pg)
    ck("no handles before, handles after (%d -> %d)" % (before, after["grips"]),
       before == 0 and after["grips"] > 0, (before, after["grips"]))
    ck("and the button says it is on", pg.eval_on_selector_all(".arrpen.on", "n=>n.length") == 1)
    pg.click(".arrpen")
    pg.wait_for_timeout(400)
    ck("pressing again puts the handles away",
       pg.eval_on_selector_all(".grip", "n=>n.length") == 0)

    # ── 3 · A SUPPORTING FUNCTION'S PROJECTS PANE ────────────────────────
    # Islam, asked whether it reaches here: "same for supporting functions
    # projects pane." A function has no BU owner, so its holder is its head —
    # and §53.5's rule is that the two sides must not drift apart in silence.
    print("\n3 · a supporting function's Projects pane")
    for who, want_arr, want_pen in [("smo", False, True), ("fn_fin", True, False)]:
        go(pg, who, "fn:finance", "fnstrat", "proj")
        s = state(pg)
        ck("%s: arrange %s" % (who, "drawn" if want_arr else "NOT drawn"),
           s["arrange"] == want_arr, s)
        ck("%s: pen %s" % (who, "drawn" if want_pen else "NOT drawn"),
           s["pen"] == want_pen, s)

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("ALL CLEAR" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
