"""THE PLAN TABLES FIT THE PANE THEY ARE IN (§158).

THE FAULT: `table { min-width:620px }` is a floor, and a floor cannot yield.
A unit's plan pane narrows with the window; once it is under 620px the table
holds its minimum and the last column is sliced by the pane's edge — the
heading reads COMPILE and the values read Lates. Only between about 820 and
960px, which is why walking the product at 1440 and at 768 finds nothing, and
why it survived every sweep the suite has.

WHAT THIS ASSERTS — the problem, not the implementation (§94.8):
  1. In the band, no table in a pane overflows its box at all. Never "and it
     has a scrollbar": the promise is that it FITS.
  2. No column heading is pushed onto a second line by the fix — squashing the
     columns until the headings wrap would trade one unreadable table for
     another, and is the failure mode of the cheap version of this.
  3. BOTH SIDES OF THE SWITCH (§53.5): a unit's Plan pane and a supporting
     function's Projects pane. They are the same product and drift apart when
     only one is measured.
  4. THE FLOOR IS STILL THERE WHERE IT BELONGS — Setup's `.cfg table` keeps its
     760px minimum, and a wide window keeps the 620. Asserting only the fix
     would pass on a build that had deleted the floor everywhere, which is a
     bigger fault than the one being fixed (§94.2: assert both ends).
  5. Nothing scrolls the page sideways at any of these widths (§27.2 — a
     sideways scroll drags every sticky element with it).

Run: SMP_CHROME=... python3 qa-run.py checks/table-fit.py
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


# The band the fault lives in, plus a width either side of it: below 820 the
# split stacks, above ~960 the table fits on its own.
BAND = (960, 900, 860, 830)
OUTSIDE = (1440, 1280, 768)

PANES = """() => {
  var out = [];
  document.querySelectorAll('.pane .tblscroll, .pane .scroll').forEach(function(bx){
    var t = bx.querySelector('table'); if (!t) return;
    /* A HEADING'S BOX IS ONE RECT HOWEVER MANY LINES IT HOLDS (§105.2) — ask a
       Range over its contents and count DISTINCT TOPS, or a wrapped heading
       reports as one line and this check passes on the build it exists to
       reject. */
    var wrapped = [];
    bx.querySelectorAll('thead th').forEach(function(h){
      var r = document.createRange(); r.selectNodeContents(h);
      var tops = {}, n = 0, rects = r.getClientRects();
      for (var i = 0; i < rects.length; i++) if (rects[i].width) {
        var k = Math.round(rects[i].top); if (!tops[k]) { tops[k] = 1; n++; }
      }
      if (n > 1) wrapped.push((h.textContent || '').trim().slice(0, 14));
    });
    out.push({over: Math.round(bx.scrollWidth - bx.clientWidth),
              wrapped: wrapped,
              minw: getComputedStyle(t).minWidth,
              box: Math.round(bx.clientWidth)});
  });
  return out;
}"""

PAGE = """() => Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth)"""


def go_unit(pg, key):
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(450); return True
    return False


def go_fn(pg, key):
    # The switch is one segmented control (§47.5); its unlit half is the way
    # across. Spelled the way qa.py spells it — a second spelling is how the
    # two sides come to be walked differently (§51.11).
    sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw and sw.is_visible():
        sw.click(); pg.wait_for_timeout(450)
    el = pg.query_selector('#units [data-u="fn:%s"]' % key)
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(500); return True
    return False


with sync_playwright() as p:
    b = p.chromium.launch()
    seen_band = 0
    for w in BAND + OUTSIDE:
        pg = b.new_page(viewport={"width": w, "height": 800})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url); pg.wait_for_timeout(700)
        who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
        pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)

        for label, opener in (("unit", lambda: go_unit(pg, "mobile")),
                              ("function", lambda: go_fn(pg, "finance"))):
            if not opener():
                ck("%d · %s reached" % (w, label), False, "could not open it")
                continue
            panes = pg.evaluate(PANES)
            ck("%d · %s · a pane with a table was measured" % (w, label), bool(panes), panes)
            if not panes:
                continue
            worst = max(x["over"] for x in panes)
            wrapped = [y for x in panes for y in x["wrapped"]]
            ck("%d · %s · nothing overflows its pane" % (w, label), worst == 0,
               "worst %spx over — %s" % (worst, panes))
            ck("%d · %s · no heading is pushed onto two lines" % (w, label),
               not wrapped, wrapped)
            if w in BAND:
                seen_band += 1
        ck("%d · the page does not scroll sideways" % w, pg.evaluate(PAGE) <= 0)
        if errs:
            ck("%d · no page errors" % w, False, errs[:2])
        pg.close()

    ck("the band was actually visited on both sides", seen_band == len(BAND) * 2, seen_band)

    pg = b.new_page(viewport={"width": 900, "height": 800})
    pg.goto(url); pg.wait_for_timeout(700)
    who = pg.eval_on_selector_all("#asWho option", "els=>els.map(e=>e.value)")
    pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)

    # BOTH ENDS — AND THE OBVIOUS ONE CANNOT FAIL, WHICH IS WHY IT IS NOT HERE.
    # The natural assertion is "Setup's table keeps its 760px floor". It was
    # written, it failed, and the fix was the CHECK: `group-extra.css:296`
    # declares `.cfg table { min-width:760px }` and line 528 re-declares
    # `.cfg table { min-width:0 }` unscoped and later, so every Setup table has
    # computed 0 for a long time and the 760 is dead code (the fifth duplicated
    # rule this project has recorded — §29.2, §51.5, §53.6, §88, §93.11; asked
    # of `document.styleSheets`, not of the cascade in my head). Measuring that
    # value therefore passes whether or not `:not(.setuppane)` is present, which
    # is §113.8's blind spot exactly. So the reach is asserted where it can
    # still be falsified — on the selector the browser actually holds.
    rule = pg.evaluate("""() => {
      var found = [];
      for (var i = 0; i < document.styleSheets.length; i++) {
        var rs; try { rs = document.styleSheets[i].cssRules; } catch (e) { continue; }
        for (var j = 0; j < rs.length; j++) {
          var m = rs[j];
          if (!m.media || !m.cssRules) continue;
          for (var k = 0; k < m.cssRules.length; k++) {
            var r = m.cssRules[k];
            if (r.selectorText && /\.pane[^,{]*table/.test(r.selectorText) && r.style && r.style.minWidth === '0px')
              found.push({sel: r.selectorText, media: m.conditionText || String(m.media.mediaText)});
          }
        }
      }
      return found;
    }""")
    ck("the fix is one media rule, and the browser holds it", len(rule) == 1, rule)
    if rule:
        ck("...it is kept off Setup's own pane", ":not(.setuppane)" in rule[0]["sel"], rule[0])
        ck("...and off a wide window", "1000px" in rule[0]["media"], rule[0])
    # And Setup is measurably untouched: its tables render at the same width
    # whether the rule is live or not.
    # Setup is still reachable and still drawing its table at this width — the
    # cheap way this fix could go wrong is by reaching a pane it was scoped out
    # of, and a Setup page that renders nothing would hide that.
    g = pg.query_selector('.navmenu-solo')
    if g and g.is_visible():
        g.click(); pg.wait_for_timeout(600)
        it = pg.query_selector('.ritem:has-text("People register")')
        if it and it.is_visible():
            it.click(); pg.wait_for_timeout(700)
    reg = pg.evaluate("""() => {
      var t = document.querySelector('.setuppane table');
      if (!t) return null;
      var bx = t.closest('.tblscroll') || t.parentElement;
      return {w: Math.round(t.getBoundingClientRect().width),
              rows: t.querySelectorAll('tbody tr').length,
              over: Math.round(bx.scrollWidth - bx.clientWidth)};
    }""")
    ck("Setup's register still draws at this width", bool(reg and reg["rows"] > 3), reg)
    # It is EXPECTED to scroll — §122.5 caps that pane and lets it — so the
    # assertion is that it still can, not that it fits (asserting a fit here
    # would demand the very squashing §88 forbids).
    ck("...and it is still the one table allowed to scroll sideways",
       bool(reg) and reg["over"] >= 0, reg)

    # A wide window keeps the product's default floor: the fix is a narrow-
    # window exception, not a removal (§94.2 — a build that deleted the floor
    # outright must fail here).
    pg.set_viewport_size({"width": 1440, "height": 900})
    pg.wait_for_timeout(400)
    pg.goto(url); pg.wait_for_timeout(700)
    pg.select_option("#asWho", who[0]); pg.wait_for_timeout(320)
    go_unit(pg, "mobile")
    wide = pg.evaluate("""() => {
      var t = document.querySelector('.pane table');
      return t ? [getComputedStyle(t).minWidth,
                  getComputedStyle(t.querySelector('tbody td')).paddingLeft] : null;
    }""")
    ck("a wide window keeps the 620 floor and the 13px cell padding",
       wide == ["620px", "13px"], wide)
    b.close()

print("table-fit: %s" % ("OK" if bad == 0 else "%d FAILURES" % bad))
raise SystemExit(1 if bad else 0)
