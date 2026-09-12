"""THE SQUEEZED RAIL READS ACROSS, AND THE DEMO BANNER SAYS ONE THING (§162).

TWO ASKS FROM ISLAM, MEASURED THE SAME WAY.

THE RAIL. Below 1200px the split stacks and the rail is meant to become a
horizontal strip — `display:flex; overflow-x:auto` has said so since the
stacked rail was written. It never did: reordering later wrapped the rows in a
`.sortable` div, so the rail laid out its ONE child in a row and the pillars
went on stacking inside it. Four rows where one was intended, and 255px of a
squeezed window spent on a list of four. §51.11's family — the markup moved and
the rule silently stopped meaning what it said.

WHAT IS ASSERTED IS THE PROMISE, NOT THE MECHANISM (§94.8): the items share one
row, the rail is shorter than the stack it replaces, and it can be scrolled to
reach the last one — never "it is display:flex", which a later refactor could
satisfy while stacking again.

BOTH SIDES OF THE SWITCH (§53.5): a unit's pillars and a supporting function's
projects are one component and drift apart when only one is measured.

AND ABOVE 1200 NOTHING MOVES (§94.2): the two-column rail is a vertical list and
must stay one, or a fix for a squeezed window would have rewritten the page
everybody actually uses.

THE BANNER OUTLIVED ITS SUBJECT (§324.10). §162 took one sentence out of the
demo banner and this asserted BOTH ENDS of that — the sentence gone, and the
one saying nothing is saved still there — which was right, and then §313.8
deleted DEMO MODE ENTIRELY. So there is no banner: the removal assertion
passes because everything is gone, and the two that guarded it fail. §113.8
from both sides at once, in one block.

REWRITTEN, NEVER DELETED (§218). What is asserted now is the decision that
holds: demo mode is gone, so every sentence it carried is gone, and the button
and the mode test that drew them are gone too. §162's own removal survives
inside a stricter claim rather than a looser one.

Run: SMP_CHROME=... python3 qa-run.py checks/squeezed-rail.py
"""
import pathlib
from playwright.sync_api import sync_playwright

url = "file://" + str(pathlib.Path("strategy-management-platform.html").resolve())
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


RAIL = """() => {
  var ra = document.querySelector('.rail');
  if (!ra) return {norail: true};
  var its = [].map.call(ra.querySelectorAll('.ritem'), function(b){
    var q = b.getBoundingClientRect();
    return {left: Math.round(q.left), top: Math.round(q.top), w: Math.round(q.width)};
  });
  var tops = {}; its.forEach(function(i){ tops[i.top] = 1; });
  return {n: its.length, rows: Object.keys(tops).length,
          h: Math.round(ra.getBoundingClientRect().height),
          canScroll: Math.round(ra.scrollWidth - ra.clientWidth),
          lastRight: its.length ? Math.round(its[its.length-1].left + its[its.length-1].w) : 0,
          railRight: Math.round(ra.getBoundingClientRect().right)};
}"""


def open_unit(pg):
    el = pg.query_selector('#units [data-u="mobile"]')
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(500); return True
    return False


def open_fn(pg):
    # §330.17: press the SIDE, never "the other one" (three sides once a
    # capability exists, and `.nsw:not(.on)` then matches two).
    sw = pg.query_selector('#units [data-fold="fns"]')
    if sw and sw.is_visible():
        sw.click(); pg.wait_for_timeout(430)
    el = pg.query_selector('#units [data-u="fn:finance"]')
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(560); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch()

    for w, stacked in ((800, True), (768, True), (1100, True),
                       (1300, False), (1440, False)):
        pg = b.new_page(viewport={"width": w, "height": 800})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(680)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)

        for side, opener in (("unit", lambda: open_unit(pg)), ("function", lambda: open_fn(pg))):
            if not opener():
                ck("%d · %s reached" % (w, side), False)
                continue
            r = pg.evaluate(RAIL)
            if r.get("norail"):
                ck("%d · %s has a rail" % (w, side), False, r)
                continue
            ck("%d · %s · the rail holds more than one item" % (w, side), r["n"] > 1, r)
            if stacked:
                ck("%d · %s · they read across, on ONE row" % (w, side), r["rows"] == 1, r)
                # A strip nobody can reach the end of is not a strip (§108.5's
                # rule): either every item is already on screen, or the box
                # scrolls to the ones that are not.
                reachable = r["lastRight"] <= r["railRight"] + 1 or r["canScroll"] > 0
                ck("%d · %s · the last item can be reached" % (w, side), reachable, r)
            else:
                ck("%d · %s · a wide window keeps the vertical list" % (w, side),
                   r["rows"] == r["n"], r)
        if errs:
            ck("%d · no page errors" % w, False, errs[:2])
        pg.close()

    # The stacked rail must be SHORTER than the stack it replaced, or nothing
    # was won — asserted as a relationship, not a number.
    heights = {}
    for w in (1300, 800):
        pg = b.new_page(viewport={"width": w, "height": 800})
        pg.goto(url); pg.wait_for_timeout(650)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(300)
        open_unit(pg)
        heights[w] = pg.evaluate(RAIL)["h"]
        pg.close()
    ck("stacking makes the rail shorter, not taller",
       heights[800] < heights[1300], heights)

    b.close()

# ── THE DEMO BANNER, READ FROM THE BUILT FILE AND NOT FROM A BROWSER.
# The first version of this asked the page for `#banner` and read
# "Prototype · group shape…" — the BAKED strip, because `sync.js` only rewrites
# that element in demo mode over HTTP and there is no server behind a file://
# page (§94.11). It reported the removal as a failure while the removal was
# correct. The two sentences are close enough in wording to make that mistake
# easy, which is exactly why the built file is asked instead: the demo branch
# is a string in the source and can be read without a browser at all.
raw = pathlib.Path("strategy-management-platform.html").read_text(errors="ignore")
# THE BUILT FILE HOLDS THE SOURCE'S ESCAPE, NOT THE CHARACTER — and the first
# version of this assertion wrote `"capability\u2019s ..."` in Python, which
# resolves to the apostrophe, so BOTH clauses tested the rendered form, the
# file holds `capability\\u2019s`, and the assertion passed on the very build
# it was written to reject (§94.5). Both forms are tested now, and the check
# was re-run against that build to watch it fail.
# THE BUILT FILE HOLDS THE SOURCE'S ESCAPE, NOT THE CHARACTER, so every phrase
# is asked in both forms — the first version of this wrote the apostrophe in
# Python and so tested the rendered form twice, passing on the very build it
# was written to reject (§94.5).
def absent(*phrases):
    return all(p not in raw for p in phrases)

ck("the invented-content line is gone from the demo banner",
   absent("capability\\u2019s content and every reported figure is invented",
          "capability’s content and every reported figure is invented"))
# §313.8 TOOK THE WHOLE THING, so the rest of the banner has to be gone too: a
# build still drawing "nothing here is saved" is one that kept half a feature
# whose switch no longer exists.
ck("...and so is the rest of it, because demo mode went with it (§313.8)",
   absent("Demo data \\u00b7 nothing here is saved.",
          "Demo data · nothing here is saved.",
          "what a new deployment looks like on"))
# AND THE DOOR IS GONE, NOT ONLY THE WORDS (§24): the button and the mode test
# that drew them are what make this a removal rather than a hidden feature.
# ASKED AS A DECLARATION, NEVER AS THE NAME — `isDemoMode()` appears twice in
# the built file and both are COMMENTS recording that it was deleted, so a
# bare-name search fails on a build that is right (§93's family: a phrase in
# prose is not the thing the prose is about).
ck("...and neither the Demo data button nor a demo-mode test is in the product",
   absent(">Demo data<", "function isDemoMode", "var isDemoMode"))

print("squeezed-rail: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
