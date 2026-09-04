"""A REFRESH STAYS WHERE YOU ARE (§173).

Islam: *"on refresh don't take me to another page, the refresh stays on the
same page I'm at."*

§94.6 decided where a SESSION opens — where the person works — and that
decision is untouched here. What it never covered is a RELOAD, which is a
different event: press F5 on Setup › Roles & access and the platform put you
back on your own unit's Plan, because a fresh `current` is null and null means
"ask the landing rule".

WHAT IS ASSERTED IS THE PAIR, and asserting only half of it would be worse
than asserting neither (§113.8):

  * a refresh lands on the destination, tab AND section you were on;
  * a NEW session still lands where §94.6 says, so the old rule is intact;
  * a remembered place that this viewer can no longer reach is DROPPED rather
    than followed into an empty frame;
  * and nothing about a MODE comes back — edit is a decision about the thing
    being edited, not a lamp that survives a reload (§63.1).

Run: SMP_CHROME=... python3 qa-run.py checks/stay-put.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def where(pg):
    return pg.evaluate("()=>[current, currentSub, CURSEC[currentSub] || null]")


def land(pg):
    pg.goto(URL, wait_until="networkidle")
    pg.wait_for_timeout(2100)


with sync_playwright() as p:
    b = p.chromium.launch()

    # ── 1 · WHERE A SESSION OPENS, WHICH IS §94.6 AND MUST NOT MOVE ──────
    print("\n1 · where a session opens")
    ctx = b.new_context(viewport={"width": 1500, "height": 950})
    pg = ctx.new_page()
    pg.on("pageerror", lambda e: errs.append(str(e)))
    land(pg)
    entry = where(pg)
    ck("a session opens somewhere real", bool(entry[0]) and bool(entry[1]), entry)

    # ── 2 · A REFRESH ON A SETUP PAGE ────────────────────────────────────
    print("\n2 · a refresh on a Setup page")
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(500)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"access\"]').click()")
    pg.wait_for_timeout(900)
    was = where(pg)
    ck("...and Roles & access is open", was[1] == "access", was)
    pg.reload()
    pg.wait_for_timeout(2400)
    ck("the refresh stays put", where(pg) == was, "%s -> %s" % (was, where(pg)))

    # ── 3 · A REFRESH ON A UNIT PAGE KEEPS THE SECTION TOO ───────────────
    # THE SECTION IS THE HALF A DESTINATION-ONLY MEMORY WOULD LOSE: a unit's
    # Strategy tab holds Foundation, Analysis and Plan, and coming back to the
    # first of three is still coming back to the wrong page.
    print("\n3 · a refresh on a unit page")
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('[data-u]')]
        .find(x=>x.dataset.u==='mobile'); if(b) b.click();}""")
    pg.wait_for_timeout(900)
    secs = pg.eval_on_selector_all("[data-sub2]", "n=>n.map(x=>x.dataset.sub2)")
    if len(secs) > 1:
        pg.evaluate("""(k)=>{const b=[...document.querySelectorAll('[data-sub2]')]
            .find(x=>x.dataset.sub2===k); if(b) b.click();}""", secs[-1])
        pg.wait_for_timeout(800)
    was = where(pg)
    ck("...and a unit page with a section is open",
       was[0] == "mobile" and bool(was[2]), was)
    pg.reload()
    pg.wait_for_timeout(2400)
    ck("the refresh keeps the destination, the tab AND the section",
       where(pg) == was, "%s -> %s" % (was, where(pg)))

    # ── 4 · A MODE DOES NOT COME BACK (§63.1) ────────────────────────────
    print("\n4 · a mode is not a place")
    pg.evaluate("()=>{ REPORTING = 'mobile'; paint(); }")
    pg.wait_for_timeout(600)
    ck("...a mode is on", pg.evaluate("()=>REPORTING") == "mobile")
    pg.reload()
    pg.wait_for_timeout(2400)
    ck("the refresh does not put you back inside it",
       pg.evaluate("()=>REPORTING") in (None, ""), pg.evaluate("()=>REPORTING"))
    ctx.close()

    # ── 5 · A NEW SESSION IS UNCHANGED, WHICH IS §94.6 ───────────────────
    # A NEW CONTEXT IS A NEW sessionStorage, which is the whole scope of the
    # feature: remembering in localStorage would have quietly reversed §94.6
    # for every returning person, and nobody asked for that.
    print("\n5 · a new session still opens where you work")
    ctx2 = b.new_context(viewport={"width": 1500, "height": 950})
    pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: errs.append(str(e)))
    land(pg2)
    ck("§94.6's landing rule is intact", where(pg2) == entry,
       "%s -> %s" % (entry, where(pg2)))

    # ── 6 · A PLACE THAT CANNOT BE REACHED IS DROPPED ────────────────────
    # Not followed into an empty frame: a role revoked between two loads is
    # exactly the case `entryDest()` already checks for, and the remembered
    # place has to be checked the same way.
    print("\n6 · a remembered place that no longer exists")
    pg2.evaluate("""()=>{ try { sessionStorage.setItem('smp.where',
        JSON.stringify({d:'unit-that-never-was', s:'strategy', c:'plan'})); } catch(e){} }""")
    pg2.reload()
    pg2.wait_for_timeout(2400)
    ck("it falls back to the landing rule rather than opening nothing",
       where(pg2) == entry, "%s -> %s" % (entry, where(pg2)))
    ck("...and the page actually rendered",
       pg2.eval_on_selector("#panel", "e=>e.textContent.trim().length") > 40)
    ctx2.close()
    b.close()

print("\npage errors: %d" % len(errs))
for e in errs[:4]:
    print("   " + e)
print(("\nFAILURES: %d" % bad) if (bad or errs) else "\nall clear")
raise SystemExit(1 if (bad or errs) else 0)
