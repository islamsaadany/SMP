"""EVERY SUBJECT THAT REPORTS IS ON THE CYCLE BOARD (§244).

Islam, told that a function planning in pillars appears nowhere on the board:
*"put them on the unit half."*

It was filtered off BOTH halves. The function half asks for capabilities, which
a pillars function has none of by construction (§59); the unit half read
`activeKeys()`, which is units. So Consumer Finance could be a week late and
the page the office watches would have no row for it — §105's own argument
("a submission the SMO cannot see anywhere is half a feature") with one format
left out.

WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM RATHER THAN THE LAYOUT (§94.8):

  1 · EVERY SUBJECT THE CYCLE CAN ASK IS ON THE BOARD. Asserted as the
      AGREEMENT between "who may be asked to report" and "who has a row",
      never as a row count — so adding a unit or a function tomorrow keeps
      this green and losing one does not.

  2 · A PILLARS FUNCTION IS ON THE UNIT HALF, above the band, because its
      three counts ARE a unit's three counts (§105.2: the two halves may not
      share a heading when they name different things — and here they name
      the same things).

  3 · ITS COUNTS ARE ITS OWN REPORTING PAGE'S. Asserted as agreement with
      `reportedCount(unitLike(t))`, which is what its Reporting page draws
      from, so the board cannot say one thing while the page says another
      (§53.5 — the two halves of this very board drifted once already,
      §105.4).

  4 · THE HEADLINE COUNTS IT EXACTLY ONCE. Not twice (it must not also be on
      the function half) and not never (§108.1's miscount, where `sub` and
      `none` had grown and the divisor had not).

  5 · THE NAME DISAMBIGUATES WHERE IT MUST. This tenant has a unit called Care
      AND a function called Care; `placeLabel()` already answers that and
      nothing new is invented here (§65, §93.12). Asserted on the CLASH rather
      than on a literal, so a tenant without one is not forced to carry a
      suffix nobody needs.

  6 · AND THE ROWS STAY ONE LINE (§88).
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


def js(pg, expr, arg=None):
    """A throw is a failure, never the end of the run (§215): this file is
    proved by running it against a build that lacks what it measures."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                        # noqa: BLE001
        return {"threw": str(e).strip().split("\n")[0]}


BOARD = """() => {
  const box = document.createElement("div");
  box.id = "boardprobe";
  box.innerHTML = renderCycle();
  document.body.appendChild(box);
  const t = [...box.querySelectorAll("table")].find(x =>
    [...x.querySelectorAll("thead th")].some(h => /Measures/i.test(h.textContent)));
  if (!t) { box.remove(); return { err: "no board" }; }
  const rows = [...t.querySelectorAll("tbody tr")];
  const band = rows.findIndex(r => r.className.indexOf("dxband") > -1);
  const cut = band < 0 ? rows.length : band;
  const name = r => r.children[0].textContent.trim();
  const read = r => ({
    name: name(r),
    done: r.children[2].textContent.trim(),
    obj: r.children[3].textContent.trim(),
    mea: r.children[4].textContent.trim(),
    tac: r.children[5].textContent.trim(),
    state: r.children[7].textContent.trim(),
    lines: r.getBoundingClientRect().height
  });
  const body = rows.filter(r => r.children.length > 3);
  const out = {
    unitHalf: rows.slice(0, cut).filter(r => r.children.length > 3).map(read),
    fnHalf:   rows.slice(cut).filter(r => r.children.length > 3).map(read),
    tallest:  Math.max.apply(null, body.map(r => r.getBoundingClientRect().height)),
    totals:   cycleTotals()
  };
  box.remove();
  return out;
}"""


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    print("\n── the fixture")
    fx = js(pg, """() => ({
      pillarsFns: Object.keys(FUNCTIONS).filter(k => fnShows(k) && fnPlansInPillars(FUNCTIONS[k]))
                        .map(k => "fn:" + k),
      projectFns: Object.keys(FUNCTIONS).filter(k => fnShows(k) && !fnPlansInPillars(FUNCTIONS[k])
                        && capsOfFunction(k).length).map(k => "fn:" + k),
      units: activeKeys(),
      clash: UNIT_KEYS.filter(k => Object.keys(FUNCTIONS)
                .some(f => navName(FUNCTIONS[f]) === navName(UNITS[k]))).map(k => navName(UNITS[k]))
    })""")
    ok("the demo carries a function that plans in pillars",
       len(fx.get("pillarsFns") or []) > 0, fx.get("pillarsFns"))
    ok("...and functions that plan in projects, so both shapes are on trial",
       len(fx.get("projectFns") or []) > 0, fx.get("projectFns"))
    if not (fx.get("pillarsFns") and fx.get("projectFns")):
        b.close(); sys.exit(1)

    board = js(pg, BOARD)
    if board.get("err") or board.get("threw"):
        ok("the board renders at all", False, board); b.close(); sys.exit(1)
    unit_names = [r["name"] for r in board["unitHalf"]]
    fn_names = [r["name"] for r in board["fnHalf"]]

    # ── 1 · nobody who reports is missing ───────────────────────────────────
    print("\n── 1 · every subject the cycle can ask has a row")
    want = js(pg, """() => {
      const t = activeKeys().concat(Object.keys(FUNCTIONS)
        .filter(k => fnShows(k) && (fnPlansInPillars(FUNCTIONS[k]) || capsOfFunction(k).length))
        .map(k => "fn:" + k));
      return t.map(x => placeLabel(x));
    }""")
    missing = [w for w in (want or []) if w not in unit_names + fn_names]
    ok("no subject that can be asked to report is missing from the board",
       missing == [], {"missing": missing, "rows": unit_names + fn_names})
    ok("...and there are enough rows for that to mean something (§113.8)",
       len(unit_names + fn_names) >= len(want or []) > 3, len(unit_names + fn_names))

    # ── 2 · on the UNIT half ────────────────────────────────────────────────
    print("\n── 2 · a pillars function sits on the unit half, not the function one")
    for t in fx["pillarsFns"]:
        lab = js(pg, "(t)=>placeLabel(t)", t)
        ok(lab + " is on the unit half", lab in unit_names, unit_names)
        ok("...and NOT on the function half as well", lab not in fn_names, fn_names)

    # ── 3 · its counts are its own reporting page's ─────────────────────────
    print("\n── 3 · the row agrees with the page it summarises (§53.5)")
    for t in fx["pillarsFns"]:
        lab = js(pg, "(t)=>placeLabel(t)", t)
        page = js(pg, """(t)=>{ const u = unitLike(t); const c = reportedCount(u);
          return { done: c.done + "/" + c.total, state: unitState(u).label }; }""", t)
        row = [r for r in board["unitHalf"] if r["name"] == lab]
        ok(lab + " — the board's figure is the page's",
           bool(row) and row[0]["done"] == page.get("done"),
           {"board": row[0]["done"] if row else None, "page": page.get("done")})
        ok("...and so is the state", bool(row) and row[0]["state"] == page.get("state"),
           {"board": row[0]["state"] if row else None, "page": page.get("state")})
        ok("...and its three counts are not empty, or the row says nothing",
           bool(row) and row[0]["obj"] != "0/0" or (bool(row) and row[0]["tac"] != "0/0"),
           row[0] if row else None)

    # ── 4 · counted once in the headline ────────────────────────────────────
    print("\n── 4 · the headline counts it exactly once")
    n_rows = len(unit_names) + len(fn_names)
    ok("`units` in the totals is the number of rows on the board",
       board["totals"]["units"] == n_rows,
       {"totals": board["totals"]["units"], "rows": n_rows})
    ok("...and submitted + not started + in progress adds up to it",
       board["totals"]["sub"] + board["totals"]["none"] + board["totals"]["progress"]
       == board["totals"]["units"], board["totals"])

    # ── 5 · the name says which is which where it must ──────────────────────
    print("\n── 5 · a name shared by a unit and a function is disambiguated")
    if fx.get("clash"):
        for nm in fx["clash"]:
            ok("'" + nm + "' is a unit AND a function in this tenant, so it is the real case",
               True)
            ok("...the function's row says so", (nm + " (function)") in unit_names + fn_names,
               unit_names + fn_names)
            ok("...and the unit's row does not", nm in unit_names, unit_names)
    else:
        ok("no unit and function share a name here — nothing to disambiguate", True)

    # ── 6 · §88 ─────────────────────────────────────────────────────────────
    print("\n── 6 · and the rows are still one line each (§88)")
    ok("no row on the board is taller than a single line",
       (board.get("tallest") or 99) < 56, board.get("tallest"))

    ok("no page errors throughout", not errs, errs[:3])
    b.close()

print("\n%d failed" % len(fails))
for f in fails:
    print("  FAIL  " + f)
sys.exit(1 if fails else 0)
