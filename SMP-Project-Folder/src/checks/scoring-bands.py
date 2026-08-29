"""THE SCORING BANDS ARE THE TENANT'S TO SET (§167).

Islam: *"for the bands make it editable in the scoring bands table in the setup
.. to remove or add levels and set the values and colors."*

The table already let the office rename a band and move a floor. What it could
not do is change how MANY there are, or what colour one wears — so a tenant who
wanted four levels, or wanted the middle one orange rather than amber, had to
ask for a build.

WHAT IS ASSERTED IS THE DATA, NEVER THE MARKUP (§96): every control is PRESSED
and `BANDS.bands` is read back afterwards, because a field drawn and wired to
nothing looks identical and discards every keystroke — which is exactly the
fault §96 found in the objectives editor, on a table of the same shape.

AND BOTH ENDS EACH TIME (§94.2): the controls must be absent in read mode and
absent for somebody without the grant, or a build that drew them for everybody
would pass every assertion below.

Run: SMP_CHROME=... python3 qa-run.py checks/scoring-bands.py
"""
import pathlib
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

bad = 0
errs = []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def bands(pg):
    return pg.evaluate("()=>JSON.parse(JSON.stringify(BANDS.bands))")


# THE ROWS ARE THIS TABLE'S OWN, not every `.cfg tbody tr` on the page — the
# Scoring bands page holds a second table, and the first version of this
# selector reported four rows for three bands. The table says which it is.
ROWS = "table.bandtbl tbody tr"


def open_bands(pg):
    pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
    pg.wait_for_timeout(500)
    pg.evaluate("()=>document.querySelector('[data-setupgo=\"bands\"]').click()")
    pg.wait_for_timeout(900)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 950})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(2200)
    open_bands(pg)

    # ── 1 · READ MODE OFFERS NOTHING ─────────────────────────────────────
    print("\n1 · reading the scale")
    start = bands(pg)
    ck("the shipped scale is three levels", len(start) == 3, start)
    ck("one row per level", pg.eval_on_selector_all(ROWS, "n=>n.length") == len(start))
    ck("no colour picker while reading", pg.eval_on_selector_all(".bcol", "n=>n.length") == 0)
    ck("no way to remove one while reading",
       pg.eval_on_selector_all("[data-bdel]", "n=>n.length") == 0)
    ck("no way to add one while reading",
       pg.eval_on_selector_all("[data-badd]", "n=>n.length") == 0)
    ck("...but the colour is still shown",
       pg.eval_on_selector_all(".cfg .swatch", "n=>n.length") >= len(start))

    # ── 2 · THE PEN OPENS ALL THREE ──────────────────────────────────────
    print("\n2 · the pen")
    pg.evaluate("()=>document.querySelector('[data-edit=\"bands\"]').click()")
    pg.wait_for_timeout(700)
    n = len(start)
    ck("five colours offered on every level",
       pg.eval_on_selector_all(".bcol", "n=>n.length") == 5 * n,
       pg.eval_on_selector_all(".bcol", "n=>n.length"))
    ck("a remove on every level", pg.eval_on_selector_all("[data-bdel]", "n=>n.length") == n)
    ck("one way to add", pg.eval_on_selector_all("[data-badd]", "n=>n.length") == 1)
    # PRESSED FOR, NOT COUNTED (§70, §93.4): the register's own history is
    # controls that were present, enabled and landing under something else.
    hit = pg.evaluate("""()=>{const e=document.querySelector('[data-badd]');
      const r=e.getBoundingClientRect();
      const h=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2);
      return h && (h===e || e.contains(h)) ? 'add' : (h ? h.tagName : 'nothing');}""")
    ck("a click at Add's centre reaches Add", hit == "add", hit)

    # ── 3 · ADDING A LEVEL ───────────────────────────────────────────────
    print("\n3 · adding a level")
    pg.evaluate("()=>document.querySelector('[data-badd]').click()")
    pg.wait_for_timeout(600)
    after = bands(pg)
    ck("the scale grew by one", len(after) == n + 1, after)
    ck("the new level sits above the bottom one, not at an end",
       after[-1]["label"] == start[-1]["label"] and after[-2]["label"] != start[-2]["label"],
       [x["label"] for x in after])
    # DESCENDING BY ARITHMETIC, NOT BY HOPING SOMEBODY TYPES IN ORDER: two
    # bands at the same floor put a figure in both, which is the one thing the
    # page already refuses to save.
    ck("the floors still descend",
       all(after[i]["floor"] < after[i - 1]["floor"] for i in range(1, len(after))),
       [x["floor"] for x in after])
    ck("the bottom level still starts at 0", after[-1]["floor"] == 0, after[-1])
    ck("it took a colour nothing else was wearing",
       len({x["key"] for x in after}) == len(after), [x["key"] for x in after])

    # ── 4 · THE COLOUR IS THE KEY ────────────────────────────────────────
    print("\n4 · setting a colour")
    i = len(after) - 2
    pg.evaluate("(i)=>document.querySelector('[data-bcol=\"'+i+'|bad\"]').click()", i)
    pg.wait_for_timeout(600)
    got = bands(pg)
    ck("picking red writes the level's key", got[i]["key"] == "bad", got[i])
    ck("...and the pill it appears as follows",
       pg.eval_on_selector_all(ROWS + " .pill", "n=>n.map(x=>x.className)")[i] == "pill bad")
    ck("...and exactly one swatch is lit on that row",
       pg.eval_on_selector_all(ROWS, """n=>{
         const c=n[n.length-2].querySelectorAll('.bcol.on');
         return [...c].map(x=>x.getAttribute('data-bcol'));}""") == ["%d|bad" % i])
    # Put it back, so section 5's rename is measured on a level that still
    # carries its minted colour rather than on one this section changed.
    pg.evaluate("(i)=>document.querySelector('[data-bcol=\"'+i+'|warn\"]').click()", i)
    pg.wait_for_timeout(500)

    # ── 5 · THE NAME AND THE FLOOR ───────────────────────────────────────
    print("\n5 · naming it and placing it")
    pg.fill(ROWS + ":nth-child(%d) input.blabel" % (i + 1), "Slipping")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(500)
    pg.fill(ROWS + ":nth-child(%d) input.bfloor" % (i + 1), "45")
    pg.keyboard.press("Tab")
    pg.wait_for_timeout(500)
    got = bands(pg)
    ck("the name is stored", got[i]["label"] == "Slipping", got[i])
    ck("the floor is stored", got[i]["floor"] == 45, got[i])
    rng = pg.eval_on_selector_all(ROWS + " td:nth-child(3)", "n=>n.map(x=>x.textContent.trim())")
    ck("the range beside it is live", rng[i].startswith("45%"), rng)
    # AND THE ONE UNDER IT MOVED WITH IT: a floor is the boundary between two
    # levels, so setting it has to change both sides or the page is showing a
    # range the scale does not have.
    ck("...and the range under it moved with it", rng[i + 1].endswith("to 44%"), rng)
    ck("the pill says the new name",
       pg.eval_on_selector_all(ROWS + " .pill",
                               "n=>n.map(x=>x.textContent.trim())")[i] == "Slipping")

    # ── 6 · REMOVING ONE ─────────────────────────────────────────────────
    print("\n6 · removing a level")
    pg.evaluate("(i)=>document.querySelector('[data-bdel=\"'+i+'\"]').click()", i)
    pg.wait_for_timeout(600)
    got = bands(pg)
    ck("the level is gone", len(got) == n and all(x["label"] != "Slipping" for x in got), got)
    ck("nothing else moved", [x["label"] for x in got] == [x["label"] for x in start], got)

    # A SCALE NEEDS TWO, AND THE REASON IS SAID (§59). Removing down to two
    # must leave a floor of 0 behind whatever ends up last, or a figure of 12
    # would belong to no band at all.
    pg.evaluate("()=>document.querySelector('[data-bdel=\"1\"]').click()")
    pg.wait_for_timeout(600)
    two = bands(pg)
    ck("two levels left", len(two) == 2, two)
    ck("the bottom one still starts at 0", two[-1]["floor"] == 0, two)
    ck("...and the remove is withdrawn, not left to fail",
       pg.eval_on_selector_all("[data-bdel]", "n=>n.length") == 0)
    ck("...with the reason on the page",
       "at least two" in pg.eval_on_selector("#panel", "e=>e.innerHTML"))

    # ── 7 · THE TWO STALE NOTES ARE GONE, THE WARNING IS NOT ─────────────
    # BOTH ENDS (§90): a removal is the easiest thing to half-do, and the note
    # that matters sits in the same block as the two that went.
    print("\n7 · what the page says")
    txt = pg.eval_on_selector("#panel", "e=>e.textContent")
    ck("the note citing a file that is not in this product is gone",
       "scoring.ts" not in txt)
    ck("the note naming thresholds the product no longer ships is gone",
       "70 and 50 match" not in txt)
    ck("...but the warning that a change rewrites history stays",
       "rewrites history" in txt)

    # ── 8 · WITHOUT THE GRANT, NOTHING AT ALL ────────────────────────────
    # MEASURED RATHER THAN ASSUMED: `c_bands` is only ever `edit` or `none` in
    # this tenant — one person holds it and thirty-two do not — so there is no
    # read-only reader to check the controls are withheld FROM. The absence
    # that exists is the whole page, and that is what is asserted (§94.2: the
    # question is whether the thing is drawn where it would otherwise be).
    print("\n8 · somebody who may not set the scale")
    who = pg.evaluate("""()=>{
      const keep = VIEWER;
      let found = null, grants = {};
      for (const p of PEOPLE) {
        if (p.active === false) continue;
        VIEWER = p.key;
        const g = grant("c_bands") || "none";
        grants[g] = (grants[g] || 0) + 1;
        if (g !== "edit" && !found) found = p.key;
      }
      VIEWER = keep; paint();
      return {who: found, grants: grants}; }""")
    ck("the scale is one person's to set, not everybody's",
       who["grants"].get("edit", 0) >= 1 and who["who"] is not None, who["grants"])
    if who["who"]:
        pg.evaluate("(k)=>{ VIEWER = k; leaveModes(); paint(); }", who["who"])
        pg.wait_for_timeout(600)
        pg.evaluate("()=>document.querySelector('[data-md=\"setup\"]').click()")
        pg.wait_for_timeout(700)
        ck("the page is not in their rail at all",
           pg.eval_on_selector_all('[data-setupgo="bands"]', "n=>n.length") == 0)
        ck("no colour picker anywhere", pg.eval_on_selector_all(".bcol", "n=>n.length") == 0)
        ck("and no way to add or remove a level",
           pg.eval_on_selector_all("[data-badd],[data-bdel]", "n=>n.length") == 0)
    b.close()

print("\nconsole errors: %d" % len(errs))
for e in errs[:5]:
    print("   " + e)
print(("\nFAILURES: %d" % bad) if (bad or errs) else "\nall clear")
raise SystemExit(1 if (bad or errs) else 0)
