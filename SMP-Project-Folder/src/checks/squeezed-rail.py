"""THE SQUEEZED RAIL READS ACROSS, AND THE DEMO BANNER SAYS ONE THING (§160).

TWO ASKS FROM ISLAM, MEASURED THE SAME WAY.

THE RAIL. Below 820px the split stacks and the rail is meant to become a
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

AND ABOVE 820 NOTHING MOVES (§94.2): the two-column rail is a vertical list and
must stay one, or a fix for a squeezed window would have rewritten the page
everybody actually uses.

THE BANNER. The filled demo's second line is gone. Asserted at BOTH ENDS: the
sentence is absent, and the first line — the one that says nothing is saved —
is still there, or a build that emptied the banner entirely would pass.

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
    sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw and sw.is_visible():
        sw.click(); pg.wait_for_timeout(430)
    el = pg.query_selector('#units [data-u="fn:finance"]')
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(560); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch()

    for w, stacked in ((800, True), (768, True), (900, False), (1440, False)):
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
    for w in (900, 800):
        pg = b.new_page(viewport={"width": w, "height": 800})
        pg.goto(url); pg.wait_for_timeout(650)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(300)
        open_unit(pg)
        heights[w] = pg.evaluate(RAIL)["h"]
        pg.close()
    ck("stacking makes the rail shorter, not taller",
       heights[800] < heights[900], heights)

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
gone_esc = "capability\\u2019s content and every reported figure is invented"
gone_lit = "capability’s content and every reported figure is invented"
ck("the invented-content line is gone from the demo banner",
   gone_esc not in raw and gone_lit not in raw)
# BOTH ENDS (§94.2): a build that deleted the whole banner would pass the line
# above. The sentence that stops somebody mistaking the demo for their own
# tenant has to survive.
# The built file carries the SOURCE's escape sequence, not the character it
# stands for: `Demo data \\u00b7 nothing here is saved.` Matching the rendered
# middot here finds nothing and calls a correct build broken — the same class
# of mistake as reading the wrong banner above, one layer down.
ck("...and the line saying nothing is saved is still there",
   "Demo data \\u00b7 nothing here is saved." in raw
   or "Demo data \u00b7 nothing here is saved." in raw)
ck("...and the Clear project banner is untouched",
   "Clear project" in raw and "what a new deployment looks like on" in raw)

print("squeezed-rail: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
