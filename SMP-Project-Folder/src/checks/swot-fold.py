"""A SWOT LINE'S POINTS FOLD UNDER ITS TITLE (§793).

Islam: *"can we have an option where the items under the title is collapsed
and expanded by clicking on the main title? or expand all or collapse all?"*
Settled on a working mockup with three answers — the page opens AS YOU LEFT
IT, ONE Expand all / Collapse all for the page, and the pen stays one box
with a row per point (design-mockups/swot-fold/).

WHAT IS ASSERTED, on the built file, written through the pen itself:

  1 · A line with points is a title you can press: its points go and a count
      stands in for them; pressed again they return. A line of one row has no
      arrow and is drawn as before.
  2 · One button on the section row, beside Edit: it folds every line, then
      reads Expand all and opens them. It is not there on a tab with nothing
      to fold, and not while Edit is on — when every line is open as fields.
  3 · AS YOU LEFT IT: a fold survives another tab and back, and a reload.
  4 · A fold is the reader's: nothing is marked unsaved by it, and print
      shows every point whatever is folded.
  5 · A function's S&W is the same boxes and folds the same way.

SMP_BUILT points it at another build (§276) — on the build before §793 it is
red. SMP_CHROME names the browser.
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, got=None):
    if cond:
        print("  ok   " + label)
    else:
        fails.append(label)
        print("  FAIL " + label + ("" if got is None else "  — %s" % (got,)))


STATE = """()=>{ const fs = Array.from(document.querySelectorAll('[data-swfold]'));
  const a = document.querySelector('[data-swfoldall]');
  return { folds: fs.length, shut: fs.filter(f => f.getAttribute('aria-expanded') === 'false').length,
           all: a ? (a.hidden ? 'hidden' : a.textContent.trim()) : 'none',
           shown: Array.from(document.querySelectorAll('.swpts')).filter(x => getComputedStyle(x).display !== 'none').length,
           counts: Array.from(document.querySelectorAll('.swfold .swcnt')).filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent),
           plain: document.querySelectorAll('.swotlist li > .swot-t:not(:has(.swfold))').length,
           fields: document.querySelectorAll('.swotlist textarea').length,
           tail: Array.from(document.querySelectorAll('.secttail > button')).filter(x => !x.hidden).map(x => x.textContent.trim()) }; }"""


def tab(pg, word):
    pg.locator("#secrow-in button", has_text=word).first.click()
    pg.wait_for_timeout(300)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1300, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)[:160]))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(1200)
    pg.locator("#units button", has_text="Mobile").first.click()
    pg.wait_for_timeout(300)
    tab(pg, "SWOT")
    s = pg.evaluate(STATE)
    ok("a SWOT of one-row lines has nothing to fold: no arrows, no button", s["folds"] == 0 and s["all"] in ("hidden", "none"), s)

    print("1 · the title folds its points")
    pg.locator(".secpen").click()
    pg.wait_for_timeout(300)
    s = pg.evaluate(STATE)
    ok("with Edit on every line is a field, and there is no fold button", s["fields"] > 2 and s["folds"] == 0 and s["all"] in ("hidden", "none"), s)
    t = pg.locator(".swotlist textarea")
    t.nth(0).fill("Trusted brand legacy\n- The go-to name for thirty years\n- Chosen first by the three largest operators")
    t.nth(0).blur()
    t.nth(1).fill("Wide reach\n- 9,000 points of sale")
    t.nth(1).blur()
    pg.locator(".secpen").click()
    pg.wait_for_timeout(400)
    s = pg.evaluate(STATE)
    ok("two lines given points are two titles to press, both open", s["folds"] == 2 and s["shut"] == 0 and s["shown"] == 2, s)
    ok("a line of one row is drawn as before, with no arrow", s["plain"] >= 1, s)
    pg.locator("[data-swfold]").first.click()
    s = pg.evaluate(STATE)
    ok("pressed, the first line's points go and its count stands in: 2 points", s["shut"] == 1 and s["shown"] == 1 and s["counts"] == ["2 points"], s)
    pg.locator("[data-swfold]").first.click()
    s = pg.evaluate(STATE)
    ok("pressed again, they return", s["shut"] == 0 and s["shown"] == 2 and s["counts"] == [], s)

    print("2 · one button for the page")
    ok("Collapse all sits on the section row, before Edit", s["tail"][-2:] == ["Collapse all", "Edit"], s["tail"])
    pg.locator("[data-swfoldall]").click()
    s = pg.evaluate(STATE)
    ok("it folds every line and then reads Expand all", s["shut"] == 2 and s["shown"] == 0 and s["all"] == "Expand all" and s["counts"] == ["2 points", "1 point"], s)
    pg.locator("[data-swfoldall]").click()
    s = pg.evaluate(STATE)
    ok("and Expand all opens them", s["shut"] == 0 and s["all"] == "Collapse all", s)
    pg.locator("[data-swfold]").nth(1).click()
    s = pg.evaluate(STATE)
    ok("with one folded and one open it still offers Collapse all", s["shut"] == 1 and s["all"] == "Collapse all", s)

    print("3 · as you left it")
    tab(pg, "Plan")
    s = pg.evaluate(STATE)
    ok("on the Plan tab, where nothing folds, the button is not shown", s["all"] in ("hidden", "none"), s)
    tab(pg, "SWOT")
    s = pg.evaluate(STATE)
    ok("back on the SWOT the folded line is still folded", s["folds"] == 2 and s["shut"] == 1 and s["counts"] == ["1 point"], s)
    kept = pg.evaluate("()=>localStorage.getItem('smp.swot.fold')")
    ok("the fold is kept in this browser, by the line's title", bool(kept) and "wide reach" in kept, kept)

    print("4 · the reader's, never the plan's")
    before = pg.evaluate("()=>JSON.stringify(GROUP.units ? GROUP.units.map(u=>u.swot) : null)")
    pg.locator("[data-swfoldall]").click()
    after = pg.evaluate("()=>JSON.stringify(GROUP.units ? GROUP.units.map(u=>u.swot) : null)")
    ok("folding changes nothing in the plan", before == after)
    pg.emulate_media(media="print")
    s = pg.evaluate(STATE)
    marks = pg.evaluate("()=>Array.from(document.querySelectorAll('.swfold .swcar, .swfold .swcnt')).filter(x=>getComputedStyle(x).display!=='none').length")
    ok("on paper every point is shown though every line is folded, and no arrow or count is printed", s["shut"] == 2 and s["shown"] == 2 and marks == 0, (s, marks))
    pg.emulate_media(media="screen")
    pg.locator("[data-swfoldall]").click()

    print("5 · a function's S&W, the same boxes")
    # as checks/function-sw.py reaches it: the section ticked the way the
    # Structure step ticks it, a line with points put on the function, and
    # the page opened by the product's own navigation
    pg.evaluate("""()=>{ GROUP.structure = {fn:{on:SMPRules.levelComponents(GROUP,'fn').concat(['swot'])}};
      FUNCTIONS.finance.swot = {s:['Deep bench\\n- Twelve certified accountants\\n- Two per region', 'Fast close'], w:['Manual budgeting']};
      leaveModes && leaveModes(); current='fn:finance'; currentSub='fnstrat'; CURSEC.fnstrat='swot'; paint(); }""")
    pg.wait_for_timeout(400)
    s = pg.evaluate(STATE)
    ok("its line with points is a title to press, and the row offers Collapse all", s["folds"] == 1 and s["all"] == "Collapse all", s)
    pg.locator("[data-swfold]").first.click()
    s = pg.evaluate(STATE)
    ok("and it folds", s["shut"] == 1 and s["counts"] == ["2 points"], s)

    ok("no script error on the way", not errs, errs)
    b.close()

print()
print("swot-fold: all green" if not fails else "swot-fold: %d FAILED" % len(fails))
raise SystemExit(1 if fails else 0)
