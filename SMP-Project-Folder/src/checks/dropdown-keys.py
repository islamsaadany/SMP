"""THE SEARCHABLE DROPDOWN ANSWERS THE KEYS ITS MARKUP PROMISES (§536).

Usability audit, heuristic 4(b). `searchsel.js` builds every long list in the
product as `role="option"` rows inside a `role="listbox"` — which is a promise
about arrow keys — and bound Escape and Enter and nothing else. It was always
OPERABLE, because the rows are real buttons and Tab reaches them, so nobody
was locked out; it simply did not behave the way its own declaration said, and
a screen reader announcing a listbox tells somebody to press the keys that did
nothing.

THE AUDIT WAS WRONG ON ONE POINT and this file records it: it said "no
arrows, no Enter-to-pick, no Home/End". Enter-to-pick was there, and had been
since before the audit was written. What was missing is the arrows and
Home/End.

What is asserted, and why each end matters (§94.2):

  - the arrows MARK a row rather than moving focus, and the search box keeps
    focus — the point of this control is typing three letters and then
    picking, and focus walked into the list would send the next three letters
    nowhere;
  - the mark is reachable by a screen reader, through `aria-activedescendant`
    on the box pointing at the row's own id;
  - Down from nowhere lands on the first row and Up from nowhere on the last,
    and both wrap;
  - Home and End go to the ends of what is SHOWING, not of the whole list;
  - the arrows walk only the rows a search has left, which is the one thing
    an index-based walk gets wrong;
  - a search that hides the marked row DROPS the mark, so Enter falls back to
    "the first row still showing" exactly as it did before any of this;
  - and Enter still picks, which is the behaviour this change must not cost.

SMP_BUILT points it at another build, so it can be run against the build
before (§276: a broken build is made from the SOURCES).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

def ev(pg, js, arg=None, dflt=None):
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return dflt if dflt is not None else {"err": str(e)[:90]}

# THE CHECK MAKES ITS OWN LIST (§255). Every long list in the product sits
# behind a page and a grant; this is the control itself, wired by its own
# `wire()`, with options whose order and words the assertions can rely on.
FIXTURE = """() => {
  const old = document.getElementById('kbfix');
  if (old) old.remove();
  const wrap = document.createElement('div');
  wrap.id = 'kbfix';
  wrap.style.cssText = 'position:fixed;left:20px;top:20px;z-index:99';
  const sel = document.createElement('select');
  sel.id = 'kbsel';
  ['Alpha','Beta','Gamma','Delta','Epsilon','Zeta','Eta'].forEach(t => {
    const o = document.createElement('option'); o.value = t.toLowerCase(); o.text = t;
    sel.appendChild(o);
  });
  wrap.appendChild(sel);
  document.body.appendChild(wrap);
  SEARCHSEL.wire();
  const btn = wrap.querySelector('button.ssbtn') || wrap.querySelector('button');
  if (btn) btn.click();
  return { opened: !!document.querySelector('.sspop') };
}"""

def state(pg):
    return ev(pg, """() => {
      const pop = document.querySelector('.sspop');
      const q = pop ? pop.querySelector('.sssearch') : null;
      const at = pop ? pop.querySelector('.ssrow.ssrow-at') : null;
      return { open: !!pop,
               focusInBox: !!(q && document.activeElement === q),
               at: at ? at.textContent.trim() : null,
               points: q ? q.getAttribute('aria-activedescendant') : null,
               atId: at ? at.id : null,
               marked: pop ? pop.querySelectorAll('.ssrow.ssrow-at').length : -1 };
    }""", None, {"open": False})

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1500)

    print("\n§1 · the list opens and the search box has focus")
    made = ev(pg, FIXTURE)
    pg.wait_for_timeout(300)
    ck("(fixture) a seven-row list is open", made.get("opened"), made)
    pg.eval_on_selector(".sspop .sssearch", "e => e.focus()"); pg.wait_for_timeout(150)
    st = state(pg)
    ck("the box has focus", st.get("focusInBox"), st)
    ck("...and nothing is marked yet", st.get("at") is None, st)

    print("\n§2 · Down walks the list, and the box keeps focus")
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(120)
    st = state(pg)
    ck("Down from nowhere lands on the first row", st.get("at") == "Alpha", st)
    ck("...FOCUS STAYS IN THE BOX, so the next letters still land there",
       st.get("focusInBox"), st)
    ck("...and a screen reader is pointed at it",
       st.get("points") and st.get("points") == st.get("atId"), st)
    pg.keyboard.press("ArrowDown"); pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(120)
    ck("...Down again moves on", state(pg).get("at") == "Gamma", state(pg))
    ck("...and only one row is ever marked", state(pg).get("marked") == 1, state(pg))
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(120)
    ck("Up goes back", state(pg).get("at") == "Beta", state(pg))

    print("\n§3 · the ends, and the wrap")
    pg.keyboard.press("End"); pg.wait_for_timeout(120)
    ck("End goes to the last", state(pg).get("at") == "Eta", state(pg))
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(120)
    ck("...Down from the last wraps to the first", state(pg).get("at") == "Alpha", state(pg))
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(120)
    ck("...and Up from the first wraps to the last", state(pg).get("at") == "Eta", state(pg))
    pg.keyboard.press("Home"); pg.wait_for_timeout(120)
    ck("Home goes to the first", state(pg).get("at") == "Alpha", state(pg))

    print("\n§4 · the arrows walk what the SEARCH has left")
    pg.fill(".sspop .sssearch", "a"); pg.wait_for_timeout(200)
    # Alpha, Gamma, Delta contain "a"; Beta does too; Epsilon does not.
    vis = ev(pg, """() => Array.from(document.querySelectorAll('.sspop .ssrow'))
        .filter(r => !r.hidden).map(r => r.textContent.trim())""", None, [])
    ck("(fixture) the search narrowed the list", "Epsilon" not in vis and len(vis) > 1, vis)
    pg.keyboard.press("End"); pg.wait_for_timeout(120)
    ck("End lands on the last SHOWING row, not the list's last",
       state(pg).get("at") == vis[-1], (state(pg).get("at"), vis))
    pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(120)
    ck("...and the wrap stays inside what is showing",
       state(pg).get("at") == vis[0], (state(pg).get("at"), vis))

    print("\n§5 · a search that hides the marked row drops the mark")
    pg.fill(".sspop .sssearch", "eps"); pg.wait_for_timeout(200)
    st = state(pg)
    ck("nothing is marked once the marked row is gone", st.get("at") is None, st)
    ck("...and the box is not left pointing at it",
       not st.get("points"), st)

    print("\n§6 · Enter still picks, marked or not")
    pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    ck("with no mark, Enter takes the first row still showing",
       ev(pg, "() => document.getElementById('kbsel').value", None, "") == "epsilon",
       ev(pg, "() => document.getElementById('kbsel').value", None, ""))
    ev(pg, FIXTURE); pg.wait_for_timeout(300)
    pg.eval_on_selector(".sspop .sssearch", "e => e.focus()"); pg.wait_for_timeout(120)
    pg.keyboard.press("ArrowDown"); pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(120)
    ck("(fixture) the second row is marked", state(pg).get("at") == "Beta", state(pg))
    pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    ck("...and Enter takes THAT one, not the first",
       ev(pg, "() => document.getElementById('kbsel').value", None, "") == "beta",
       ev(pg, "() => document.getElementById('kbsel').value", None, ""))

    print("\n§7 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    ev(pg, "() => { const w = document.getElementById('kbfix'); if (w) w.remove(); }")
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
