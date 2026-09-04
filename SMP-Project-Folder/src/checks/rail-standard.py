"""One item still gets the rail, on both sides of the switch (§130.2).

Islam, of a function whose capability holds a single project: "keep the rail
there to keep the standard view even with 1 capability either in the strategy
or the performance or reporting", and, asked whether that was functions only:
"units and functions".

WHAT IT ASSERTS IS THE AGREEMENT, NEVER THE NUMBER (§53.5, §94.14). Two
capabilities stacked on one page must lay out the same way — same rail, same
left edge for the pane — and a unit's pillars must behave like a capability's
projects, because a unit and a function are the same product and the whole
fault was that they were fine DIFFERENTLY. Nothing here says a rail is 212px
wide, so changing the gutters keeps this green and removing the rail does not.

IT MAKES THE STATE IT MEASURES (§94.2). No unit in the demo has a single
pillar, so a check that only walked what is there would never once have
exercised the side of this Islam did not report — the one-pillar unit is built
in the browser, painted, and measured.

AND THE EMPTY CASE IS ASSERTED FROM THE OTHER END. "One thing to list" and
"nothing to list" are different questions: a subject with no items must still
say what would fill it (§61) rather than draw an empty rail.

Run: SMP_CHROME=... python3 qa-run.py checks/rail-standard.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails = []
errs = []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def side(pg, key):
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if el and el.is_visible():
        return
    sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw:
        sw.click(); pg.wait_for_timeout(250)


def go(pg, key, sub=None):
    side(pg, key)
    pg.click('#units [data-u="%s"]' % key); pg.wait_for_timeout(350)
    if sub:
        el = pg.query_selector('#secrow-in [data-sub2="%s"]' % sub)
        assert el and el.is_visible(), "no section called " + sub
        el.click(); pg.wait_for_timeout(350)


def tab(pg, word):
    for b in pg.query_selector_all("#subtabs button"):
        if b.inner_text().strip().lower().startswith(word):
            b.click(); pg.wait_for_timeout(350); return True
    return False


def panes(pg):
    """Every pane on the page, with whether it has a rail beside it and where
    its own left edge falls."""
    return pg.evaluate("""()=>[...document.querySelectorAll('.pane')].map(p=>{
      const sp=p.parentElement.classList.contains('split') ? p.parentElement : null;
      const rail=sp ? sp.querySelector(':scope > .rail') : null;
      return {railed:!!rail, left:Math.round(p.getBoundingClientRect().left),
              head:rail ? rail.querySelector('.rhead').textContent.replace(/\\s+/g,' ').trim() : null,
              rows:rail ? rail.querySelectorAll('.ritem').length : 0};});""")


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.goto(URL); pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)

    # ── 1 · a function whose capabilities hold two projects and one ─────
    print("\n1 · Marketing — two capabilities, two counts")
    for sub, label in (("proj", "Strategy › Projects"), (None, "Performance")):
        go(pg, "fn:marketing", sub)
        if sub is None:
            ck("Performance opens", tab(pg, "performance"))
        got = panes(pg)
        ck("%s: both capabilities are drawn" % label, len(got) == 2, got)
        ck("%s: both have a rail" % label, all(g["railed"] for g in got), got)
        ck("%s: the one-project rail lists its one project" % label,
           sorted(g["rows"] for g in got) == [1, 2], got)
        ck("%s: both panes start at the same x" % label,
           len(set(g["left"] for g in got)) == 1, got)

    print("\n2 · Marketing — Reporting")
    go(pg, "fn:marketing")
    tab(pg, "performance")
    rep = pg.query_selector('[data-s=report]')
    ck("there is a way into reporting", rep is not None)
    if rep:
        rep.click(); pg.wait_for_timeout(450)
        got = panes(pg)
        ck("Reporting: both have a rail", got and all(g["railed"] for g in got), got)
        ck("Reporting: both panes start at the same x",
           got and len(set(g["left"] for g in got)) == 1, got)
        back = pg.query_selector("[data-repcancel]")
        if back:
            back.click(); pg.wait_for_timeout(300)

    # ── 3 · the other side of the switch: a unit with one pillar ────────
    print("\n3 · a unit with one pillar (made, because the demo has none)")
    ck("no unit in the demo has one pillar, so it has to be made",
       pg.evaluate("()=>Object.values(UNITS).every(u=>(u.items||[]).length!==1)"))
    pg.evaluate("""()=>{const u=UNITS.nigeria; u.__items=u.items.slice();
      u.items=u.items.slice(0,1); paint();}""")
    pg.wait_for_timeout(400)
    for sub, label in (("plan", "Plan"), (None, "Performance")):
        go(pg, "nigeria", sub)
        if sub is None:
            tab(pg, "performance")
        got = panes(pg)
        ck("unit %s: one pillar still gets the rail" % label,
           len(got) == 1 and got[0]["railed"], got)
        ck("unit %s: the rail lists its one pillar" % label,
           got and got[0]["rows"] == 1, got)
    go(pg, "nigeria")
    tab(pg, "performance")
    rep = pg.query_selector('[data-s=report]')
    if rep:
        rep.click(); pg.wait_for_timeout(450)
        got = panes(pg)
        ck("unit Reporting: one pillar still gets the rail",
           got and got[0]["railed"], got)
        back = pg.query_selector("[data-repcancel]")
        if back:
            back.click(); pg.wait_for_timeout(300)

    # ── 4 · a unit and a function agree about the same count ────────────
    print("\n4 · the two sides agree")
    go(pg, "nigeria", "plan")
    unit = panes(pg)[0]
    go(pg, "fn:marketing", "proj")
    ones = [g for g in panes(pg) if g["rows"] == 1]
    ck("the one-project capability has a rail to compare against", bool(ones), panes(pg))
    if ones:
        ck("a one-item unit and a one-item capability are laid out the same way",
           unit["railed"] == ones[0]["railed"], {"unit": unit, "capability": ones[0]})

    # ── 5 · nothing to list is still a different question ───────────────
    print("\n5 · nothing to list")
    pg.evaluate("""()=>{const u=UNITS.nigeria; u.items=[]; paint();}""")
    pg.wait_for_timeout(400)
    go(pg, "nigeria", "plan")
    ck("an empty unit draws no rail",
       pg.eval_on_selector_all(".rail", "e=>e.length") == 0)
    ck("and says what would fill it (§61)",
       "no " in pg.inner_text("#panel").lower() and
       "import" in pg.inner_text("#panel").lower(),
       pg.inner_text("#panel")[:120])
    pg.evaluate("""()=>{const u=UNITS.nigeria; u.items=u.__items; delete u.__items; paint();}""")
    pg.wait_for_timeout(300)

    ck("no console errors anywhere in this walk", not errs, errs[:4])
    b.close()

print("\n" + ("FAILED: " + ", ".join(fails) if fails else "all rail-standard checks passed"))
raise SystemExit(1 if fails else 0)
