"""THE CARET BELONGS TO THE DISCLOSURE, NOT TO THE CLASS (§287).

Islam, of the closed Reporting cycle strip: *"what is the arrow function here
beside the open new cycle?"* It has none. `.fstrip-head::after` was written as a
bare class selector beside a rotate rule that IS scoped to `details.fstrip`, so
the mark saying *this folds* was drawn on every `.fstrip-head` in the product
while the mark saying *it is open* was drawn on only the one that folds.

Three surfaces wear that class and two of them are a plain `<div>` — Setup ›
Reporting cycle and the group's Focus board strip — so both drew a disclosure
triangle for a disclosure that does not exist: pointing at nothing, never
rotating, doing nothing when pressed (§96's family; §94.15, a control with no
audience is furniture).

WHAT IS ASSERTED, AND WHY IT IS BOTH ENDS (§94.2):

  1 · THE TWO PLAIN STRIPS CARRY NO CARET — open cycle and closed, because the
      strip is rebuilt in each state.

  2 · THE REAL PANEL STILL CARRIES ONE, AND IT STILL ROTATES. A check that only
      asserted the absence would pass on a build that deleted the rule outright,
      which is exactly what the first build of this fix did: the panel's head IS
      the `<summary>`, so `summary .fstrip-head` matched nothing and the caret
      came off the one place it belongs.

  3 · MEASURED AS PAINT, NEVER AS A SELECTOR (§94.8, §145.14): `::after` has no
      box of its own, so the computed `content` and `transform` are asked of the
      element — a build that kept the class and lost the rule reads `none`.

The focus panel is drawn only for a unit that HAS focus marks, so the unit is
found at runtime rather than named (§94.2) — and the sub-page key is
`performance`, not `perf`, which cost the first run of this file its panel
entirely (§50.6: a probe that names the wrong page measures whatever page it
lands on).
"""
import os
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = "file://" + os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    """A throw is a failure, never the end of the run (§215)."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                                   # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


def after(pg, sel):
    return js(pg, """(s) => {
      const el = document.querySelector(s);
      if (!el) return {none:true};
      const a = getComputedStyle(el, '::after');
      return {content:a.content, transform:a.transform};
    }""", sel)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(900)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(320)

    # ── 1 · the two plain strips carry nothing ───────────────────────
    print("\n── 1 · a strip that does not fold draws no caret ──")
    js(pg, "() => { current='setup'; currentSub='cycle'; paint(); }")
    pg.wait_for_timeout(380)
    a = after(pg, ".fstrip-head")
    ok("the cycle strip is there to measure", a.get("none") is not True, a)
    ok("...and carries no caret while the cycle is open", a.get("content") == "none", a)
    js(pg, "() => { REVIEW.state='closed'; paint(); }"); pg.wait_for_timeout(320)
    a = after(pg, ".fstrip-head")
    ok("...and none once it is closed either", a.get("content") == "none", a)
    js(pg, "() => { REVIEW.state='open'; paint(); }"); pg.wait_for_timeout(260)

    js(pg, "() => { current='group'; currentSub='focus'; paint(); }")
    pg.wait_for_timeout(420)
    g = after(pg, ".fstrip:not(details) > .fstrip-head")
    ok("the Focus board's strip is there", g.get("none") is not True, g)
    ok("...and carries no caret either", g.get("content") == "none", g)

    # ── 2 · the real disclosure keeps its caret, and it turns ────────
    print("\n── 2 · the panel that DOES fold keeps its caret (§94.2) ──")
    # FOUND, NOT NAMED: the panel is drawn only for a unit carrying focus
    # marks, and which units do is the seed's business, not this file's.
    unit = js(pg, "() => UNIT_KEYS.filter(k => unitFocus(UNITS[k]).length)[0] || null")
    ok("some unit has focus marks to draw it with", bool(unit), unit)
    if unit:
        # `performance`, never `perf` — the wrong key renders another page and
        # every assertion below then measures whatever it landed on (§50.6).
        js(pg, "(k) => { current=k; currentSub='performance'; paint(); }", unit)
        pg.wait_for_timeout(520)
        sel = "details.fstrip > summary.fstrip-head"
        d = pg.query_selector(sel)
        ok("the focus panel is drawn", bool(d), unit)
        shut = after(pg, sel)
        ok("it carries the caret", shut.get("content") == '"▸"', shut)
        ok("...pointing right while shut", shut.get("transform") in ("none", None), shut)
        if d:
            d.click(); pg.wait_for_timeout(420)
            op = after(pg, "details.fstrip[open] > summary.fstrip-head")
            ok("opening it turns the caret", op.get("transform") not in ("none", None), op)
            ok("...and the caret is still drawn while open",
               op.get("content") == '"▸"', op)

    ok("no page error anywhere in the run", not errs, errs[:3])
    b.close()

print("\n" + ("ALL GREEN" if not fails else str(len(fails)) + " FAILED"))
for f in fails:
    print("  · " + f)
