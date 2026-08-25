"""THE OBJECTIVES EDITOR WAS DRAWN AND CONNECTED TO NOTHING (§96).

Islam, on a unit's Foundation with the pen open: *"I can't remove objectives."*

Measured before the fix: **20 inputs, 0 wired; 4 Remove buttons, 0 wired; the
Add button, 0 wired.** Every control in that table was decoration.

WHY NOTHING CAUGHT IT. Every existing check of this page asks whether the pen
is there and whether fields appear — `strategy-office.py` counts controls and
`qa.py` walks the page — and all of that was TRUE the whole time. The markup of
a bound field and an unbound one differs by one absent attribute, and the page
renders, reports no error, and accepts every keystroke before discarding it.

So this asks the only question that separates them: **does pressing the control
change the data?** Add, remove, rename, and both dropdowns, on a unit's
Foundation AND on the group's — the two callers of the same table, and the
group's has been wired the whole time, which is exactly why the unit's silence
went unheard.
"""
import pathlib, re
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
URL = "file://" + str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


READ = """(where) => {
  const t = [...document.querySelectorAll("table")].find(
    (x) => x.textContent.includes("Compile"));
  if (!t) return null;
  const inp = [...t.querySelectorAll("input,select")];
  const list = where === "group" ? GROUP.keyObjectives : UNITS.mobile.keyObjectives;
  return {
    rows: t.querySelectorAll("tbody tr").length,
    inputs: inp.length,
    /* A BOUND FIELD AND AN UNBOUND ONE DIFFER BY ONE ATTRIBUTE. This is the
       measurement the fault hid behind for as long as the page existed. */
    wired: inp.filter((i) => i.dataset.fld !== undefined).length,
    rm: t.querySelectorAll("[data-korm]").length,
    add: document.querySelectorAll("[data-koadd]").length,
    names: list.map((m) => m.name),
    ids: list.map((m) => m.id),
    compiles: list.map((m) => m.compile)
  };
}"""

BAND = """() => {
  const t = [...document.querySelectorAll("table")].find(
    (x) => x.textContent.includes("Compile"));
  const grid = document.querySelector(".fgrid");
  const band = t.closest(".koband");
  return { inGrid: !!grid && grid.contains(t), band: !!band,
           table: Math.round(t.getBoundingClientRect().width),
           page: Math.round(grid.getBoundingClientRect().width) };
}"""

READBACK = """() => {
  const g = document.querySelector(".fgrid");
  const h = [...document.querySelectorAll(".boxlab")].find(
    (x) => /objective/i.test(x.textContent));
  return !!h && !!g && g.contains(h) && !!h.closest(".card");
}"""

SET_FIRST_NAME = """(v) => {
  const t = [...document.querySelectorAll("table")].find(
    (x) => x.textContent.includes("Compile"));
  const i = t.querySelector("tbody tr input");
  i.value = v; i.dispatchEvent(new Event("change", { bubbles: true }));
}"""

SET_COMPILE = """(v) => {
  const t = [...document.querySelectorAll("table")].find(
    (x) => x.textContent.includes("Compile"));
  const s = [...t.querySelectorAll("tbody tr:first-child select")].pop();
  s.value = v; s.dispatchEvent(new Event("change", { bubbles: true }));
}"""


def side(pg, where, label):
    """Both callers of the same table, because only one of them worked."""
    print("── " + label)
    if where == "group":
        # The group's tab key is `foundation`; a unit's is `found` (shell.html's
        # two page lists). Named here rather than guessed, because a sub key
        # that does not exist renders the LANDING page and every measurement
        # below would then be of a screen this check never opened (§50.6).
        pg.evaluate("() => { current='group'; currentSub='foundation'; "
                    "EDIT_PAGE['foundation']=true; paint(); }")
    else:
        pg.evaluate("() => { current='mobile'; currentSub='found'; "
                    "EDIT_PAGE['foundation']=true; paint(); }")
    pg.wait_for_timeout(500)
    r = pg.evaluate(READ, where)
    if not r:
        ck(label + ": the objectives table is there", False)
        return
    ck("every field is bound to something",
       r["inputs"] > 0 and r["wired"] == r["inputs"], r)
    ck("every row has a Remove", r["rm"] == r["rows"], r)
    ck("and there is one Add", r["add"] == 1, r["add"])

    # RENAME — the fault in its quietest form: it looked accepted before.
    pg.evaluate(SET_FIRST_NAME, "Renamed by the check")
    pg.wait_for_timeout(250)
    r2 = pg.evaluate(READ, where)
    ck("typing a name reaches the data",
       r2["names"][0] == "Renamed by the check", r2["names"][:2])

    # A DROPDOWN IS A FIELD TOO — koEdit built its own `<select>` tags, which is
    # how it ended up building unbound ones.
    pg.evaluate(SET_COMPILE, "Average")
    pg.wait_for_timeout(250)
    ck("choosing a compile rule reaches the data",
       pg.evaluate(READ, where)["compiles"][0] == "Average")

    # ADD
    n = r2["rows"]
    pg.click("[data-koadd]")
    pg.wait_for_timeout(400)
    r3 = pg.evaluate(READ, where)
    ck("Add appends a row", r3["rows"] == n + 1, (n, r3["rows"]))
    ck("and every id is still distinct",
       len(set(r3["ids"])) == len(r3["ids"]), r3["ids"])

    # REMOVE the middle one. It carries a target, so it asks — and the answer
    # being yes is part of the contract.
    pg.once("dialog", lambda d: d.accept())
    pg.click('[data-korm="0|1"]')
    pg.wait_for_timeout(500)
    r4 = pg.evaluate(READ, where)
    ck("Remove takes the row out", r4["rows"] == r3["rows"] - 1, (r3["rows"], r4["rows"]))
    ck("and takes the right one",
       r4["names"] == [x for i, x in enumerate(r3["names"]) if i != 1], r4["names"])
    # THE ID COLLISION §96.2 IS ABOUT: remove the middle, then add.
    pg.click("[data-koadd]")
    pg.wait_for_timeout(400)
    r5 = pg.evaluate(READ, where)
    ck("removing the middle then adding does not mint a duplicate id",
       len(set(r5["ids"])) == len(r5["ids"]), r5["ids"])

    # ── THE TABLE GETS THE WINDOW WHILE IT IS BEING WRITTEN (§96.6) ──
    # Asserted as a RELATIONSHIP, never as a number: the table is out of the
    # two-column grid and as wide as the page it sits on. A later change to the
    # gutters or the grid ratio keeps this green; putting the table back inside
    # a column does not (§53.5, §94.14).
    w = pg.evaluate(BAND)
    ck("editing takes the table out of the two-column grid", not w["inGrid"], w)
    ck("into a band of its own", w["band"], w)
    ck("as wide as the page it sits on", w["table"] > w["page"] * 0.9, w)

    # AND READING MODE IS UNCHANGED — a fix to an editor that alters the page
    # everybody else looks at is a different change from the one asked for.
    pg.evaluate("() => { EDIT_PAGE['foundation']=false; paint(); }")
    pg.wait_for_timeout(350)
    ck("with the pen closed there is no editor left",
       pg.evaluate("() => !document.querySelector('[data-korm],[data-koadd]')"))
    ck("and no band either", pg.evaluate("() => !document.querySelector('.koband')"))
    # BOTH ENDS: the objectives go back inside the aspiration, which is where
    # they belong when somebody is reading rather than writing.
    ck("the objectives read inside the aspiration card", pg.evaluate(READBACK))


with sync_playwright() as pw:
    br = pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(1500)
    side(pg, "mobile", "a unit's Foundation")
    side(pg, "group", "the group's Foundation")
    br.close()

# ── THE NUMBER EXCEL WROTE AT FULL PRECISION (§96.3) ──────────────────
# Read out of the source rather than reimplemented, so a change to the rule
# cannot pass here while failing in the product (§67).
print("── the xlsx reader")
src = (ROOT / "SMP-Project-Folder/src/xlsx.js").read_text()
m = re.search(r"function shortestNum\(raw\)\{.*?\n\}", src, re.S)
ck("shortestNum is in xlsx.js", m is not None)
if m:
    import subprocess, json
    cases = ["9.6999999999999993", "9.7", "3.8", "0.1", "100",
             "1234567890123456789012", "-0.0000001", "0.30000000000000004",
             "abc", ""]
    out = subprocess.run(
        ["node", "-e", m.group(0) + ";console.log(JSON.stringify(" +
         json.dumps(cases) + ".map(shortestNum)))"],
        capture_output=True, text=True)
    got = json.loads(out.stdout or "[]")
    want = ["9.7", "9.7", "3.8", "0.1", "100",
            "1234567890123456789012", "-0.0000001", "0.30000000000000004",
            "abc", ""]
    for c, g, w in zip(cases, got, want):
        ck(("%-24s -> %s" % (repr(c), repr(g))), g == w, "wanted " + repr(w))

print("  " + ("ERRORS: " + "; ".join(errs[:3]) if errs else "no console errors"))
if errs:
    bad += 1
print("foundation-objectives " + ("ALL GREEN" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
