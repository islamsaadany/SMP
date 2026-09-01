"""ENTER COMMITS A ONE-LINE PROSE BOX (§229).

   §189's own decision text has said since the day it was written: *"Enter is
   not a newline here. These are titles, not notes — a plan row's name is one
   line of prose however long it is, and the tables, the deck and both
   workbooks all print it as one. Enter blurs, which is what commits the
   value (§35)."* And no code ever carried it out — measured during §226's
   audit: pressing Enter in a growing box inserted a line break, on the plan's
   titles and on the function's objectives alike, so a stray newline could ride
   a name into the workbook and the deck. §104.8's family: a comment describing
   an intention the code never had, invisible because nothing compares the two.

   WHAT IS ASSERTED, both ends (§94.2):

     1. Enter in a `textarea.fld.grow` (a plan title; a function objective)
        inserts NO newline, moves focus OFF the box, and the value is
        COMMITTED to the data — because blur is what commits (§35).
     2. Enter in a plain `rows="2"` area (a definition) still inserts a
        newline: a definition is a paragraph and must keep its key.

   Proved able to fail by running against the pre-§229 build, where every
   grow-box assertion goes red (the newline arrives, focus stays).
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1200)

    def press_enter_in(sel):
        el = pg.query_selector(sel)
        if el is None:
            return None
        el.click()
        pg.keyboard.press("End")
        pg.keyboard.press("Enter")
        pg.wait_for_timeout(150)
        return pg.evaluate("""(sel) => {
          const el = document.querySelector(sel);
          return { newline: el.value.includes('\\n'),
                   stillFocused: document.activeElement === el,
                   value: el.value };
        }""", sel)

    print("\n-- 1 · a plan title (the §189 box the rule was written about)")
    pg.evaluate("""() => { VIEWER = PEOPLE.filter(p=>p.role==='super')[0].key;
      leaveModes(); current='mobile'; currentSub='strategy'; CURSEC.strategy='plan';
      EDIT_PAGE.plan=true; paint(); }""")
    pg.wait_for_timeout(700)
    before = pg.evaluate("() => UNITS.mobile.items[0].name")
    r = press_enter_in(".pane textarea.fld.grow")
    ck("Enter puts no newline into the title", r and not r["newline"], r)
    ck("...and moves focus off the box (blur is what commits, §35)",
       r and not r["stillFocused"], r)
    after = pg.evaluate("() => UNITS.mobile.items[0].name")
    ck("...and the value is committed clean", after == before and "\n" not in after,
       {"before": before, "after": after})

    print("\n-- 2 · a function objective (§226's box, same rule)")
    pg.evaluate("""() => {
      const k = Object.keys(FUNCTIONS).filter(k=>String(FUNCTIONS[k].format)==='pillars')[0];
      FUNCTIONS[k].keyObjectives = [{ id:'fn-KO1', name:'A name', dir:'\\u2265',
        target:'', compile:'Latest', weight:null }];
      window.__fk = k; leaveModes();
      current='fn:'+k; currentSub='fnstrat'; CURSEC.fnstrat='found';
      EDIT_PAGE.capfoundation=true; paint(); }""")
    pg.wait_for_timeout(600)
    r2 = press_enter_in(".koband tbody textarea.fld.grow")
    ck("Enter puts no newline into the objective", r2 and not r2["newline"], r2)
    ck("...and blurs it", r2 and not r2["stillFocused"], r2)
    stored = pg.evaluate("() => FUNCTIONS[window.__fk].keyObjectives[0].name")
    ck("...and the stored name carries none", "\n" not in stored, repr(stored))

    print("\n-- 3 · a definition keeps its paragraph key (the other end)")
    r3 = press_enter_in('#panel .clause textarea[rows="2"]')
    ck("Enter in a rows-2 area still makes a paragraph", r3 and r3["newline"], r3)
    ck("...and does not blur it", r3 and r3["stillFocused"], r3)

    ck("no console errors anywhere in the run", not errs, errs)
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall ok")
sys.exit(1 if bad else 0)
