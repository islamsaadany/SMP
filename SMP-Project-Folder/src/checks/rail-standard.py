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


# PRESS THE SIDE YOU WANT, NEVER "the other one" (§330.17). The
# navigation switch is two sides on a tenant with no capability and THREE
# once there is one, and `.nsw:not(.on)` then matches two buttons — so
# this pressed whichever unlit side came first, which is Capabilities, and
# the function it was about was never drawn. `[data-fold="<side>"]` is
# absent exactly when that side is already lit, which is why the press is
# guarded rather than asserted, and it is right on BOTH shapes.
def side(pg, key):
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if el and el.is_visible():
        return
    want = "caps" if key.startswith("cap:") else "fns" if key.startswith("fn:") else "units"
    sw = pg.query_selector('#units [data-fold="%s"]' % want)
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

    # ── 1 · two HOLDERS, one project and several ────────────────────────
    # §330: they are two PAGES now, not two panes on one page — a capability is
    # a destination of its own and a function's pages draw only the function's
    # own work. §130.2's rule is untouched, and it is the rule this file is
    # about: ONE item still gets the rail. What moved is where the one-item
    # case lives, so the assertion follows it (§218, never loosened).
    CAP = pg.evaluate("()=>(GROUP.capabilities[0]||{}).id || ''")
    FNK = pg.evaluate("()=>'fn:' + FUNCTION_KEYS.filter(k=>fnOwnProjects(k).length > 1)[0]")
    ck("the demo holds a capability and a function with work of its own",
       bool(CAP) and not FNK.endswith("undefined"), {"cap": CAP, "fn": FNK})
    print("\n1 · a function's own work and a capability — one pane each, each railed")
    lefts = {}
    for key, sub, label in ((FNK, "proj", "the function's own"),
                            ("cap:" + CAP, "proj", "the capability's"),
                            (FNK, None, "the function's own, Performance"),
                            ("cap:" + CAP, None, "the capability's, Performance")):
        go(pg, key, sub)
        if sub is None:
            ck("%s: Performance opens" % label, tab(pg, "performance"))
        got = panes(pg)
        ck("%s: one pane is drawn" % label, len(got) == 1, got)
        ck("%s: it has a rail" % label, bool(got) and got[0]["railed"], got)
        ck("%s: the rail lists every project it holds" % label,
           bool(got) and got[0]["rows"] >= 1, got)
        if got: lefts.setdefault(sub or "perf", []).append(got[0]["left"])
    # THE TWO SIDES AGREE, which is what this file has always asserted — and is
    # now a comparison between two PAGES rather than two panes (§53.5, A15).
    for where, xs in lefts.items():
        ck("both holders' panes start at the same x (%s)" % where,
           len(set(xs)) == 1, xs)

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
    # §330: the one-item holder is the CAPABILITY's own page now, not a second
    # pane on the function's (§218 — the comparison is the point and it follows
    # the subject).
    go(pg, "cap:" + CAP, "proj")
    ones = [g for g in panes(pg) if g["rows"] == 1]
    ck("the one-project holder has a rail to compare against", bool(ones), panes(pg))
    if ones:
        ck("a one-item unit and a one-item holder are laid out the same way",
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
