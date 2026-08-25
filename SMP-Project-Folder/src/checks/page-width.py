"""THE PAGE IS AS WIDE AS THE BAR ABOVE IT (§94.13).

Islam: "the page is wide but the section below the navigation part is compact
with a lot of padding on the right and left not utilizing the screen width —
let's make it fit always."

WHAT IS ASSERTED IS THE ALIGNMENT, NOT A NUMBER. The fault was never that 1180
was the wrong figure; it was that the destination row had been let past the cap
(`.units-in.folded { max-width:none }`, "a navigation bar is chrome, not
content") while the page under it had not — so the row ran edge to edge at
1655px above a page sitting at 1132px, centred. Two containers that used to
agree stopped agreeing.

So this measures that the navigation, the tab row and the page START AND END at
the same x, and it deliberately does not care what that x is: a later change to
the gutters keeps it green, and a cap reintroduced on one of them does not.
That is §53.5's rule — assert that two things AGREE, never what the number is.

Swept across four widths and every kind of page, because §27.1's lesson is that
a layout verified at the width that passes is not verified.
"""
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
WIDTHS = [1920, 1670, 1280, 1000]
errs, bad = [], 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


PAGES = [
    ("the group",        """() => { current='group'; currentSub='performance'; paint(); }"""),
    ("a unit's Plan",    """() => { current=UNIT_KEYS[0]; currentSub='strategy';
                                    CURSEC.strategy='plan'; paint(); }"""),
    ("a unit's Performance", """() => { currentSub='performance'; paint(); }"""),
    ("a function's Projects", """() => {
        const fk=FUNCTION_KEYS.filter(k=>fnShows(k)&&capsOfFunction(k).length)[0];
        current='fn:'+fk; currentSub='fnstrat'; CURSEC.fnstrat='proj'; paint(); }"""),
    ("Setup (railed)",   """() => { current='setup'; currentSub='people'; paint(); }"""),
]

BOXES = """() => {
  const box = (s) => { const e = document.querySelector(s); if (!e) return null;
    const b = e.getBoundingClientRect();
    /* A hidden row has a zero-width box and is not a disagreement — Setup has
       no tab row at all (§46.1), and asserting against it would be measuring
       a thing the page is right not to draw. */
    if (b.width < 1) return null;
    return { left: Math.round(b.left), right: Math.round(b.right) }; };
  return {
    units: box("nav.units .units-in"),
    tabs:  box(".tabs-in"),
    wrap:  box(".wrap"),
    /* THE PAGE MUST NOT SCROLL SIDEWAYS. Removing a cap is exactly the change
       that can push something past the window, and §27.2 records what that
       costs: a horizontal scroll drags every sticky element with it. */
    hScroll: document.documentElement.scrollWidth > innerWidth + 1,
    /* And the window is actually being used, rather than the cap having been
       replaced by a slightly bigger one. */
    used: (function () { const e = document.querySelector(".wrap");
      return e ? Math.round(e.getBoundingClientRect().width / innerWidth * 100) : 0; })()
  };
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    for W in WIDTHS:
        print("\n── %dpx" % W)
        pg = b.new_page(viewport={"width": W, "height": 900})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL)
        pg.wait_for_timeout(1400)
        for name, js in PAGES:
            pg.evaluate(js)
            pg.wait_for_timeout(450)
            v = pg.evaluate(BOXES)
            if not v["units"] or not v["wrap"]:
                ck("%s draws a navigation row and a page" % name, False, v)
                continue
            u, wr, tb = v["units"], v["wrap"], v["tabs"]
            ck("%s — the page starts where the navigation does" % name,
               u["left"] == wr["left"], "nav %s vs page %s" % (u["left"], wr["left"]))
            ck("...and ends where it does",
               u["right"] == wr["right"], "nav %s vs page %s" % (u["right"], wr["right"]))
            if tb:
                ck("...and the tab row agrees with both",
                   tb["left"] == u["left"] and tb["right"] == u["right"],
                   "tabs %s vs nav %s" % (tb, u))
            ck("...with no sideways scroll", v["hScroll"] is False, v)
            # 90% is a floor, not a target: it clears the 24px gutters at every
            # width swept and fails a cap of any kind reintroduced above 1000px.
            ck("...and the window is actually used (%d%%)" % v["used"], v["used"] >= 90, v["used"])
        pg.close()

    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad == 0 and not errs else "%d FAILED" % bad)
    b.close()
raise SystemExit(1 if bad or errs else 0)
