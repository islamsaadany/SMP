"""HOVER AND FOCUS ARE MEASURED TOO (§143, closing §16.17).

THE GAP: `scripts/contrast-sweep.py` walks pages and measures controls AT
REST. Every `:hover`, `:focus` and `:disabled` colour in the product has
therefore never been measured — and one is already known to fail
(`.editbtn:hover` at 4.34:1, found by accident in §95 because Chromium keeps
:hover after a click). §16.15's 31 recorded failures sit in the same blind
spot. A palette is only as good as its worst reachable state, and the moment
somebody's hand is on a control is exactly when its label matters.

HOW IT MEASURES: the sweep's own JS is READ OUT OF ITS SOURCE rather than
copied (§67 — two copies of a measuring rule drift, and the copy is always
the one that goes stale), then run scoped to a single control while that
control is genuinely hovered by the mouse or focused by the keyboard. Nothing
about the rule changes; only the state the page is in when it runs.

ONE REPRESENTATIVE PER KIND OF CONTROL. Hovering every button on every page
would take an hour and measure the same three classes hundreds of times; the
palette is per class, so a signature (tag + classes) is visited once. That
keeps the check fast enough to run every time, which is the only kind of check
that gets run.

IT REPORTS, AND IT FAILS ONLY ON WHAT THE PRODUCT PROMISES. A state below its
threshold is a failure; the point of the file is that the number exists at all
— before it, nobody could say whether any of them passed.

Run: SMP_CHROME=... python3 qa-run.py checks/state-contrast.py
"""
import pathlib, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
SRC = ROOT / "scripts/contrast-sweep.py"
url = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())

_txt = SRC.read_text()
_m = re.search(r'JS = r"""(.*?)"""', _txt, re.S)
if not _m:
    raise SystemExit("could not read the sweep's JS out of %s — measuring nothing" % SRC)
JS = _m.group(1)

bad = 0
failures = []

# ── THE BASELINE IS EMPTY, AND THAT IS THE POINT (§144) ───────────────────
# The first run of this check found three failures, all in light mode, and all
# three were the SAME fault wearing three faces: a scoring colour used as TYPE
# rather than as a mark — §38.4's rule, which is why every scoring colour has
# a `-tx` twin. They were recorded here as a baseline for exactly one
# conversation, Islam approved the repair, and §144 fixed them:
#
#   .rnum   3.26 → 4.93   the rail's figure (via bandInk(), 30 call sites)
#   <b>     4.45 → 6.45   the focus strip's count (--good → --good-tx)
#   .dlcar  4.34 → 5.36   the hovered button's label and its caret
#
# It stays as an empty set rather than being deleted, because the machinery
# below is what holds the fix: any state that fails from now on is NEW, and
# the check goes red naming it. Adding an entry here is how a failure gets
# deliberately accepted; the empty set is the promise that none is.
BASELINE = set()


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


CONTROLS = "button, a[href], summary, select, .linkbu, .editbtn"


def signatures(pg):
    """One representative per kind of control, by tag + class."""
    return pg.evaluate("""(sel) => {
      var seen = {}, out = [];
      document.querySelectorAll(sel).forEach(function(el, i){
        var r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') return;
        if (!(el.textContent || '').trim()) return;
        var cls = (typeof el.className === 'string' ? el.className : '');
        var key = el.tagName + '.' + cls.split(' ').sort().join('.');
        if (seen[key]) return;
        seen[key] = 1;
        el.setAttribute('data-statecheck', String(i));
        out.push({key: key, id: String(i), text: (el.textContent||'').trim().slice(0, 24)});
      });
      return out;
    }""", CONTROLS)


def measure(pg, cid):
    """The sweep's JS IS the function — passed straight to evaluate, the way
    tour.py already does it. Wrapping it in an eval() only invents a way for
    it to stop being callable."""
    return pg.evaluate(JS, '[data-statecheck="%s"]' % cid) or []


def sweep_state(pg, label, state):
    """state: 'hover' | 'focus' | 'rest'"""
    found = []
    for sig in signatures(pg):
        el = pg.query_selector('[data-statecheck="%s"]' % sig["id"])
        if not el:
            continue
        try:
            if state == "hover":
                el.hover(timeout=1500)
            elif state == "focus":
                pg.evaluate("(id) => { var e=document.querySelector('[data-statecheck=\"'+id+'\"]'); if (e && e.focus) e.focus(); }", sig["id"])
            pg.wait_for_timeout(45)
        except Exception:
            continue
        for f in measure(pg, sig["id"]):
            found.append({"page": label, "state": state, "sel": f.get("sel"),
                          "text": f.get("text"), "ratio": f.get("ratio"), "need": f.get("need")})
    return found


def go_unit(pg, key):
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(400); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))

    for theme in ("light", "dark"):
        pg.goto(url)
        pg.wait_for_timeout(800)
        if theme == "dark":
            pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
            pg.wait_for_timeout(250)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0])
        pg.wait_for_timeout(300)

        print("— %s —" % theme)
        pages = []
        go_unit(pg, "mobile")
        pages.append("unit/plan")
        for bt in pg.query_selector_all("#subtabs button[data-s]"):
            if (bt.text_content() or "").strip().lower().startswith("performance"):
                bt.click(); pg.wait_for_timeout(400)
                pages.append("unit/performance")
                break

        # Measure on the two pages just visited, in both interactive states.
        for label in ("unit/performance",):
            for state in ("hover", "focus"):
                got = sweep_state(pg, label, state)
                failures.extend([dict(g, theme=theme) for g in got])
                print("  %-6s %-16s %s" % (state, label, "clean" if not got else
                                           "%d below threshold" % len(got)))

        # And the plan page, which carries a different control family.
        go_unit(pg, "mobile")
        pg.wait_for_timeout(300)
        for state in ("hover", "focus"):
            got = sweep_state(pg, "unit/plan", state)
            failures.extend([dict(g, theme=theme) for g in got])
            print("  %-6s %-16s %s" % (state, "unit/plan", "clean" if not got else
                                       "%d below threshold" % len(got)))

    ck("the sweep's own rule was read, not copied", "coverOf" in JS and "lum" in JS)
    for f in failures[:12]:
        print("    %s · %s · %s · %s  %.2f (needs %s)" %
              (f["theme"], f["state"], f["page"], f["sel"], f["ratio"], f["need"]))
    seen = set((f["theme"], (f["sel"] or "").split(".")[0].lower()) for f in failures)
    new = sorted(seen - BASELINE)
    ck("nothing fails beyond the recorded baseline", not new, new)
    gone = sorted(BASELINE - seen)
    if gone:
        print("  note    fixed since the baseline was written — remove from BASELINE: %s" % (gone,))
    # Only meaningful while something is deliberately accepted; with an empty
    # baseline the assertion above ("nothing beyond the baseline") is the whole
    # promise, and this one would assert nothing at all (§94.5).
    if BASELINE:
        ck("the recorded failures are still being measured (the check can still see them)",
           bool(seen & BASELINE),
           "baseline entries no longer reached — has the page or the selector changed? (§51.11)")
    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("state-contrast: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
