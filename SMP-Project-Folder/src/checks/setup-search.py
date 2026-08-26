"""Setup · the rail's search (§108.13).

WHAT IS WORTH ASSERTING HERE IS MOSTLY NOT "IT FILTERS". A box that narrows a
list is the easy half and the half that fails loudly. The three that fail
QUIETLY, and that this file exists for:

1. **Typing must never repaint** (§35, §45.5). A repaint replaces the input
   being typed into, and the symptom is a caret that jumps or a word that
   vanishes — intermittent, blamed on the keyboard, and invisible to any check
   that only reads the filtered list afterwards. Asserted by watching the
   input's own identity across keystrokes, and by typing into it and reading
   the value back.

2. **An unrelated repaint must not silently un-filter.** The Overview's three
   fetches each end in `paint()` and answer about a second after the page
   opens, which is exactly when somebody is typing. A filter that quietly
   reset then would leave somebody reading the whole list believing it was
   their results.

3. **A match inside a FOLDED group must be findable.** Folded items used to be
   omitted from the DOM entirely, so a filter could never reveal them —
   and the failure is silent: the search simply reports nothing found, which
   looks exactly like "no such setting" (§108.14).

Run: SMP_CHROME=... python3 qa-run.py checks/setup-search.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())
fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def shown(pg):
    return pg.eval_on_selector_all(
        ".setuprail .ritem",
        "e=>e.filter(x=>!x.hidden && x.offsetParent!==null).map(x=>x.dataset.setupgo)")


def type_q(pg, q):
    inp = pg.query_selector("[data-railq]")
    inp.click()
    pg.keyboard.press("Control+A")
    pg.keyboard.press("Delete")
    if q:
        pg.type("[data-railq]", q, delay=18)
    pg.wait_for_timeout(220)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)
    pg.query_selector(".navmenu-btn").click()
    pg.wait_for_timeout(600)

    print("\n── 1 · the box is there, and above the list it filters ──")
    ck("the rail has a search box", pg.query_selector("[data-railq]") is not None)
    ck("it is OUTSIDE the scrolling list (§108.5 caps that list)",
       pg.evaluate("()=>{const q=document.querySelector('[data-railq]');"
                   "return !document.querySelector('.setuprail .raillist').contains(q);}"))
    everything = shown(pg)
    ck("with no query, the rail shows the unfiltered list", len(everything) >= 15, len(everything))

    print("\n── 2 · a keyword finds a page whose NAME does not contain it ──")
    # The whole reason keywords exist: these words appear on no label.
    for word, want in [("logo", "brand"), ("password", "people"), ("upload", "import"),
                       ("threshold", "bands"), ("permissions", "access"),
                       ("vocabulary", "labels"), ("reply-to", "comms")]:
        type_q(pg, word)
        got = shown(pg)
        ck("'%s' finds %s" % (word, want), want in got, got)

    print("\n── 3 · every word must match, in any order ──")
    type_q(pg, "reset password")
    a = shown(pg)
    type_q(pg, "password reset")
    bb = shown(pg)
    ck("'reset password' and 'password reset' are the same errand", a == bb and "people" in a,
       (a, bb))
    type_q(pg, "logo password")
    ck("two words from different pages narrow to nothing", shown(pg) == [], shown(pg))
    ck("and the rail SAYS so rather than emptying silently",
       pg.eval_on_selector("[data-railnone]", "e=>!e.hidden && e.textContent.trim()"))

    print("\n── 4 · a match inside a FOLDED group is still found (§108.14) ──")
    type_q(pg, "")
    # Fold the group that holds Branding, then search for it.
    pg.evaluate("""()=>{const h=document.querySelector('.rgroup[data-railgrp=\\"look\\"]');
                   if(h && !h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(300)
    ck("the group is folded and its rows are hidden",
       "brand" not in shown(pg), shown(pg))
    type_q(pg, "logo")
    ck("searching still reveals the folded match", "brand" in shown(pg), shown(pg))
    ck("and its group heading is shown with it",
       pg.eval_on_selector('.rgroup[data-railgrp="look"]', "e=>!e.hidden"))

    print("\n── 5 · clearing puts the rail back exactly as it was found ──")
    type_q(pg, "")
    ck("the folded group is folded again, not left open",
       "brand" not in shown(pg), shown(pg))
    ck("everything else is back", len(shown(pg)) == len(everything) - 2,
       (len(shown(pg)), len(everything)))
    # Put it back for the blocks below.
    pg.evaluate("""()=>{const h=document.querySelector('.rgroup[data-railgrp=\\"look\\"]');
                   if(h && h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(250)

    print("\n── 6 · TYPING NEVER REPAINTS (§35) ──")
    # The input must be the SAME NODE before and after a keystroke: a repaint
    # would replace it, which is what throws away a half-typed word.
    pg.evaluate("()=>{document.querySelector('[data-railq]').dataset.same='1';}")
    type_q(pg, "pass")
    ck("the input survived the keystrokes (it was never replaced)",
       pg.eval_on_selector("[data-railq]", "e=>e.dataset.same") == "1")
    ck("and holds what was typed", pg.eval_on_selector("[data-railq]", "e=>e.value") == "pass")
    ck("the rail did filter", shown(pg) == ["people"], shown(pg))

    print("\n── 7 · an unrelated repaint keeps the query AND the filter ──")
    pg.evaluate("()=>paint()")
    pg.wait_for_timeout(300)
    ck("the query survives a repaint",
       pg.eval_on_selector("[data-railq]", "e=>e.value") == "pass")
    ck("and so does the filtering", shown(pg) == ["people"], shown(pg))

    print("\n── 8 · Escape and the × clear it, and only it ──")
    pg.query_selector("[data-railq]").click()
    pg.keyboard.press("Escape")
    pg.wait_for_timeout(250)
    ck("Escape clears the query", pg.eval_on_selector("[data-railq]", "e=>e.value") == "")
    ck("Escape did not close the rail", pg.query_selector(".setuprail .raillist") is not None)
    ck("the whole list is back", len(shown(pg)) == len(everything), len(shown(pg)))
    type_q(pg, "logo")
    ck("the clear button appears only with a query",
       pg.eval_on_selector("[data-railqx]", "e=>!e.hidden"))
    pg.query_selector("[data-railqx]").click()
    pg.wait_for_timeout(250)
    ck("pressing it clears", pg.eval_on_selector("[data-railq]", "e=>e.value") == "")
    ck("and it hides itself again", pg.eval_on_selector("[data-railqx]", "e=>e.hidden"))

    print("\n── 9 · arriving is the end of the errand ──")
    type_q(pg, "logo")
    pg.query_selector('.setuprail .ritem[data-setupgo="brand"]').click()
    pg.wait_for_timeout(500)
    ck("the page opened", pg.eval_on_selector("#panel .setupttl", "e=>e.textContent.trim()")
       == "Branding")
    ck("and the rail is no longer filtered",
       pg.eval_on_selector("[data-railq]", "e=>e.value") == "" and
       len(shown(pg)) == len(everything), (len(shown(pg)), len(everything)))

    b.close()

print("\nconsole errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-search: all assertions passed")
