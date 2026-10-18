"""A ROW OF TABS ANSWERS THE ARROWS (§543).

Usability audit, heuristic 7: "no keyboard route between destinations, tabs or
sections". The product draws EIGHT `role="tablist"` groups — the destinations,
the tab row, the section row, the chat queue, the Copilot side, the knowledge
base, the Setup rail — and not one bound an arrow key.

WHICH IS §536 AGAIN, ONE CONTROL OVER. `role="tablist"` is a promise that Left
and Right walk the row and Home and End reach its ends. The row was always
operable, because the tabs are real buttons; it simply did not behave the way
its own markup said.

What is asserted, and why each end matters (§94.2):

  - THE ARROWS WALK THE ROW, and Home and End reach its ends, and the walk
    WRAPS — the same answer §536's list gives, because two controls in one
    product that disagree about where a list ends is worse than either answer;
  - THEY MOVE FOCUS AND DO NOT PICK. This is the decision the product needed
    rather than the one the pattern defaults to: these tabs are DESTINATIONS,
    and picking on arrow would walk somebody through five whole pages while
    they looked for the sixth. Asserted by arrowing along a live row and
    requiring the page NOT to have changed;
  - ENTER STILL PICKS, which is what the change must not cost;
  - THE TAB PATH IS UNCHANGED, and this is asserted rather than left to be
    noticed: the textbook pattern would rove `tabindex` so Tab stops once per
    row, which takes away a route that works today. A build that quietly did
    it would pass every other assertion here;
  - ONE HANDLER AND NOT EIGHT (§53.5), proved over the built file: `role="tab"`
    appears in six files and the key handling in exactly one;
  - and a row it has never heard of answers too, because the handler is
    delegated — the check BUILDS a tablist the product does not contain and
    arrows along it;
  - AND EVERY TAB SAYS WHETHER IT IS THE CURRENT ONE from its first draw. The
    chat queue's three carried that in a class alone until somebody pressed
    one, so a screen reader learned which tab was current only after the
    person had chosen it.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os, re
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:110]}

print("\n§1 · one handler, not eight")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
ck("the product still draws its rows as tablists", code.count('role="tablist"') >= 6,
   code.count('role="tablist"'))
# The walk is written once. A second copy is the one that drifts the day the
# wrap changes.
ck("the arrows are answered in exactly one place",
   len(re.findall(r"ArrowLeft: -1, ArrowRight: 1", code)) == 1,
   len(re.findall(r"ArrowLeft: -1, ArrowRight: 1", code)))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1700)

    print("\n§2 · the arrows walk a row the product itself drew")
    real = ev(pg, """() => {
      const lists = Array.from(document.querySelectorAll('[role="tablist"]'))
        .filter(l => Array.from(l.querySelectorAll('[role="tab"]'))
                          .filter(t => t.offsetParent !== null).length >= 2);
      if (!lists.length) return { none: true };
      const tabs = Array.from(lists[0].querySelectorAll('[role="tab"]'))
                        .filter(t => t.offsetParent !== null);
      tabs[0].focus();
      return { n: tabs.length, id: lists[0].id || lists[0].className,
               at: document.activeElement === tabs[0],
               words: tabs.map(t => t.textContent.trim().slice(0, 18)) };
    }""", {})
    ck("(fixture) a real row of tabs has focus on its first tab",
       real.get("at") and (real.get("n") or 0) >= 2, real)
    where = lambda: ev(pg, """() => {
      const a = document.activeElement;
      return a && a.getAttribute && a.getAttribute('role') === 'tab'
        ? a.textContent.trim().slice(0, 18) : null;
    }""", None)
    first = where()
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120)
    second = where()
    ck("Right moves to the next tab", second is not None and second != first, (first, second))
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(120)
    ck("...and Left comes back", where() == first, (where(), first))
    pg.keyboard.press("End"); pg.wait_for_timeout(120)
    last = where()
    ck("End reaches the last", last == (real.get("words") or [None])[-1], (last, real.get("words")))
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120)
    ck("...and Right from the last WRAPS, as §536's list does",
       where() == first, (where(), first))
    pg.keyboard.press("Home"); pg.wait_for_timeout(120)
    ck("Home reaches the first", where() == first, where())

    print("\n§3 · they move focus and do NOT pick — the decision this product needed")
    before = ev(pg, """() => ({
      sel: Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'))
                .map(t => t.textContent.trim().slice(0,18)).join('|'),
      body: document.body.innerHTML.length
    })""", {})
    pg.keyboard.press("ArrowRight"); pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(400)
    after = ev(pg, """() => ({
      sel: Array.from(document.querySelectorAll('[role="tab"][aria-selected="true"]'))
                .map(t => t.textContent.trim().slice(0,18)).join('|'),
      body: document.body.innerHTML.length
    })""", {})
    ck("arrowing twice changes WHICH TAB IS SELECTED not at all",
       before.get("sel") == after.get("sel"), (before.get("sel"), after.get("sel")))
    ck("...so nobody is walked through pages looking for one",
       before.get("body") == after.get("body"), (before.get("body"), after.get("body")))
    ck("...and focus did move while they were not picked",
       where() is not None and where() != first, where())

    print("\n§4 · the Tab path is unchanged — the part of the pattern NOT taken")
    rove = ev(pg, """() => {
      const t = Array.from(document.querySelectorAll('[role="tab"]'))
                     .filter(x => x.offsetParent !== null);
      return { total: t.length,
               rovedOut: t.filter(x => x.getAttribute('tabindex') === '-1').length };
    }""", {})
    ck("no tab was taken out of the Tab path",
       (rove.get("total") or 0) > 0 and rove.get("rovedOut") == 0, rove)

    print("\n§5 · and a row it has never heard of answers too")
    made = ev(pg, """() => {
      const old = document.getElementById('tkfix'); if (old) old.remove();
      const w = document.createElement('div');
      w.id = 'tkfix';
      w.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99';
      w.innerHTML = '<div role="tablist">' +
        ['One','Two','Three'].map((t,i) =>
          '<button type="button" role="tab" id="tk' + i + '" aria-selected="' +
          (i === 0) + '">' + t + '</button>').join('') + '</div>';
      document.body.appendChild(w);
      document.getElementById('tk0').focus();
      return document.activeElement.id;
    }""", "")
    ck("(fixture) a tablist this build has never seen", made == "tk0", made)
    who = lambda: ev(pg, "() => document.activeElement.id", "")
    picked = []
    pg.expose_function  # (no-op: kept explicit that nothing is stubbed)
    ev(pg, """() => { document.getElementById('tkfix')
        .addEventListener('click', e => { window.__tkpick = e.target.id; }); }""")
    # THE WHOLE PATH AT ONCE, because each step asserted alone can pass for the
    # wrong reason: on a build with no handler nothing moves, so "Down wrapped
    # to the first" is true of a row that never left it. Written after running
    # this against the build before and watching that assertion pass (§113.8).
    path = []
    for k in ("ArrowRight", "End", "ArrowDown"):
        pg.keyboard.press(k); pg.wait_for_timeout(100)
        path.append(who())
    ck("Right walks it, End reaches its last, and Down wraps to its first",
       path == ["tk1", "tk2", "tk0"], path)
    ck("...and nothing was picked along the way",
       ev(pg, "() => window.__tkpick || null", "x") is None,
       ev(pg, "() => window.__tkpick || null", "x"))
    pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
    ck("ENTER still picks, which this must not cost",
       ev(pg, "() => window.__tkpick || null", None) == "tk0",
       ev(pg, "() => window.__tkpick || null", None))
    ev(pg, "() => { const w = document.getElementById('tkfix'); if (w) w.remove(); delete window.__tkpick; }")

    print("\n§6 · and every tab says whether it is the current one")
    said = ev(pg, """() => {
      const t = Array.from(document.querySelectorAll('[role="tab"]'));
      return { total: t.length, mute: t.filter(x => !x.hasAttribute('aria-selected')).length };
    }""", {})
    ck("no tab is drawn without saying whether it is selected",
       (said.get("total") or 0) > 0 and said.get("mute") == 0, said)
    # The chat queue's three carried it in a class alone until somebody pressed one.
    ck("...including the chat queue's, from its FIRST draw",
       'data-chtab="waiting" role="tab" aria-selected="true"' in code, "not in the build")

    print("\n§7 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
