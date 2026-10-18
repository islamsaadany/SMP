"""GOING TO A PLACE (§547).

Usability audit, heuristic 7, last piece. Alt+G opens a list of every place
you can reach, you type a few letters, and Enter takes you there.

A KEY PER DESTINATION IS NOT POSSIBLE — the places are each tenant's own
units, capabilities, functions and divisions, so there is nothing fixed to
bind. That is why this shape rather than a row of keys.

What is asserted, and why each end matters (§94.2):

  - THE LIST IS THE NAVIGATION'S OWN BUTTONS, not a second idea of what the
    places are. Asserted by comparing the list against the page's own
    `[data-u]` buttons — a build that kept its own list would drift from them
    silently, which is the fault this shape exists to avoid (§53.5);
  - THE LABELS ARE CLEAN. The count badge sits inside the same button, so
    reading it whole gives "Distribution3 business units". Asserted as a
    shape, because the first draft of this product's own label-reading got it
    wrong the same way;
  - IT OPENS ON WHERE YOU ARE, so Alt+G then Escape costs nothing;
  - PICKING ACTUALLY MOVES YOU, end to end: type, Enter, and the navigation's
    current place must have CHANGED to the one picked. This is the assertion
    that cannot be satisfied by a list that merely looks right;
  - AND IT PRESSES THE REAL BUTTON rather than routing on its own, so
    everything a normal click does happens. Asserted by watching the actual
    destination button receive the click;
  - ESCAPE CLOSES IT AND TAKES THE PLUMBING WITH IT — a host left standing
    would accumulate one per press;
  - THE PLUMBING IS INERT. The select and the button `searchsel` builds are
    not controls: out of the tab order and out of the accessibility tree.
    §536 records what a hidden select with its furniture left on did to this
    product — every page became a keyboard trap on its first control;
  - NOTHING FIRES WHILE SOMEBODY IS TYPING;
  - and the keys inside are §536's, arriving with the list rather than being
    written again: the search narrows, the arrows walk what is left.

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

def ev(pg, js, dflt=None, arg=None):
    """AND IT TAKES ITS ARGUMENT, which the first draft of this helper did not.

    It accepted one and called `pg.evaluate(js)` without it, so the page saw
    `undefined` where a name was meant to be — and the assertion that watches
    the real button get pressed attached its listener to nothing and reported
    the PRODUCT broken. Traced by hand: the right button was being clicked all
    along. This project has made the same mistake once before, in
    `restore-a-person`'s own `who()` (§255's family): a helper that silently
    drops what it is handed turns a check into a thing that measures nothing
    and says FAIL."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e: return dflt if dflt is not None else {"err": str(e)[:110]}

print("\n§1 · it is the list searchsel already builds, not a second one")
src = open(os.path.abspath(BUILT), encoding="utf-8").read()
code = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
code = re.sub(r"(?m)^\s*//.*$", " ", code)
ck("the go-to opens through searchsel's own entry", "SEARCHSEL.openOn(sel)" in code)
ck("...and searchsel gained ONE opt-in rather than a second popup",
   code.count('dataset.ssAlways !== "1"') == 1, code.count('dataset.ssAlways !== "1"'))
ck("Alt+G is matched on the physical key, like §546's three", '"KeyG"' in code)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1700)

    print("\n§2 · the list is the navigation's own buttons")
    said = ev(pg, "() => (typeof GOTO === 'object' && GOTO.places) ? GOTO.places() : null", None)
    real = ev(pg, """() => Array.from(document.querySelectorAll('[data-u]'))
        .filter(b => b.offsetParent !== null && !b.closest('#gotohost'))
        .map(b => { const f = b.firstChild;
          return String((f && f.nodeType === 3 ? f.textContent : b.textContent) || '')
            .replace(/\\s+/g, ' ').trim(); })
        .filter(Boolean)""", [])
    ck("there is a go-to list at all", isinstance(said, list) and len(said) > 1, said)
    ck("...and it IS the nav's buttons, name for name", said == real, (said, real))
    ck("...with no count badge run into a name",
       isinstance(said, list) and not any(re.search(r"\d\s*(business unit|unit)", s or "") for s in said),
       said)

    print("\n§3 · Alt+G opens it, on where you are")
    pg.keyboard.press("Alt+KeyG"); pg.wait_for_timeout(500)
    st = ev(pg, """() => {
      const pop = document.querySelector('.sspop');
      const q = pop ? pop.querySelector('.sssearch') : null;
      const on = pop ? pop.querySelector('.ssrow.on') : null;
      const navNow = document.querySelector('#units [aria-selected="true"], #units [aria-current="true"]');
      return { open: !!pop, focusInBox: !!(q && document.activeElement === q),
               rows: pop ? pop.querySelectorAll('.ssrow').length : 0,
               marked: on ? on.textContent.trim() : null,
               navNow: navNow ? String(navNow.firstChild.textContent).trim() : null };
    }""", {})
    ck("the list opens", st.get("open"), st)
    ck("...with the cursor in the search box, ready to type", st.get("focusInBox"), st)
    ck("...showing every place", st.get("rows") == len(real), (st.get("rows"), len(real)))
    ck("...and marked on WHERE YOU ARE, so Alt+G then Escape costs nothing",
       st.get("marked") and st.get("marked") == st.get("navNow"), st)

    print("\n§4 · Escape closes it and takes the plumbing with it")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(400)
    ck("the list is gone",
       ev(pg, "() => !document.querySelector('.sspop')", False) is True)
    ck("...and so is its host, rather than one accumulating per press",
       ev(pg, "() => !document.getElementById('gotohost')", False) is True)

    print("\n§5 · typing narrows it, and picking actually MOVES you")
    before = st.get("navNow")
    pg.keyboard.press("Alt+KeyG"); pg.wait_for_timeout(450)
    # Pick a place that is NOT the current one, found from the list itself.
    other = [s for s in real if s != before]
    target = other[-1] if other else None
    ck("(fixture) there is somewhere else to go", bool(target), (before, real))
    pg.fill(".sspop .sssearch", (target or "")[:6]); pg.wait_for_timeout(350)
    vis = ev(pg, """() => Array.from(document.querySelectorAll('.sspop .ssrow'))
        .filter(r => !r.hidden).map(r => r.textContent.trim())""", [])
    ck("the search narrows the list", bool(vis) and len(vis) < len(real), vis)
    ck("...to the place asked for", target in (vis or []), (target, vis))
    # WATCH THE REAL BUTTON: it must be the nav's own that is pressed.
    ev(pg, """(t) => { window.__gpress = null;
      Array.from(document.querySelectorAll('[data-u]')).forEach(b => {
        const f = b.firstChild;
        const n = String((f && f.nodeType === 3 ? f.textContent : b.textContent) || '').replace(/\\s+/g,' ').trim();
        if (n === t) b.addEventListener('click', () => { window.__gpress = n; }, { once: true });
      }); }""", None, target)
    pg.keyboard.press("Enter"); pg.wait_for_timeout(900)
    end = ev(pg, """() => {
      const t = document.querySelector('#units [aria-selected="true"], #units [aria-current="true"]');
      return { navNow: t ? String(t.firstChild.textContent).trim() : null,
               pressed: window.__gpress,
               host: !!document.getElementById('gotohost'),
               pop: !!document.querySelector('.sspop') };
    }""", {})
    ck("it pressed the navigation's REAL button, not a route of its own",
       end.get("pressed") == target, end)
    ck("...and you are now there", end.get("navNow") == target, (before, end.get("navNow"), target))
    ck("...with the list and its host both gone",
       end.get("host") is False and end.get("pop") is False, end)

    print("\n§6 · the plumbing is not a control")
    ev(pg, "() => GOTO.open()"); pg.wait_for_timeout(400)
    inert = ev(pg, """() => {
      const h = document.getElementById('gotohost');
      if (!h) return { no: true };
      const s = h.querySelector('select'), b = h.querySelector('button');
      return { sel: s ? { tab: s.tabIndex, hidden: s.getAttribute('aria-hidden') } : null,
               btn: b ? { tab: b.tabIndex, hidden: b.getAttribute('aria-hidden') } : null };
    }""", {})
    ck("the select is out of the tab order and the reading order",
       (inert.get("sel") or {}).get("tab") == -1 and (inert.get("sel") or {}).get("hidden") == "true", inert)
    ck("...and so is the button built for it (§536's keyboard trap)",
       (inert.get("btn") or {}).get("tab") == -1 and (inert.get("btn") or {}).get("hidden") == "true", inert)
    ev(pg, "() => GOTO.close()"); pg.wait_for_timeout(200)

    print("\n§7 · and nothing fires while somebody is typing")
    ev(pg, """() => {
      const w = document.createElement('div'); w.id = 'gtfix';
      w.innerHTML = '<textarea id="gt-note"></textarea>';
      document.body.appendChild(w);
      document.getElementById('gt-note').focus();
    }""")
    pg.keyboard.press("Alt+KeyG"); pg.wait_for_timeout(350)
    quiet = ev(pg, """() => ({ pop: !!document.querySelector('.sspop'),
                               on: document.activeElement.id })""", {})
    ck("Alt+G in a note opens nothing", quiet.get("pop") is False, quiet)
    ck("...and the cursor stays where it was", quiet.get("on") == "gt-note", quiet)
    ev(pg, "() => { const w = document.getElementById('gtfix'); if (w) w.remove(); }")

    print("\n§8 · and the build is quiet")
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d failure(s)" % bad)
raise SystemExit(1 if bad else 0)
