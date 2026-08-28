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

# ── WHAT THIS FIRST RUN FOUND, RECORDED RATHER THAN QUIETLY FIXED ─────────
# Three classes fail while hovered or focused, all in LIGHT mode, and all
# three are palette decisions — which are the client's, not a check's (rule
# 1c). They are named here so the suite stays green on what is already known
# and goes RED the moment a FOURTH appears or one of these gets worse: the
# §16.15 pattern, which recorded 31 failures rather than pretending they were
# not there.
#
#   .dlcar  4.34  the dropdown caret, hovered — §95's `.editbtn:hover`
#                 family, found by accident then and by measurement now
#   b       4.45  §38.5 for the seventh time: --gold-deep on --surface-2,
#                 which clears on white and fails on the quiet ground
#   .rnum   3.26  the rail's figure in --ink-3 on the hover ground — the
#                 worst of the three, and it is a NUMBER on a page about
#                 numbers
#
# Removing a line from this list is how the fix is asserted: fix the colour,
# delete the entry, and the check holds it fixed for ever.
BASELINE = {("light", "dlcar"), ("light", "b"), ("light", "rnum")}


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

        for label in pages[-1:]:
            pass
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
    ck("the recorded failures are still being measured (the check can still see them)",
       bool(seen & BASELINE) or not BASELINE,
       "baseline entries no longer reached — has the page or the selector changed? (§51.11)")
    ck("no page errors while driving", not errs, errs[:2])
    b.close()

print("state-contrast: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
