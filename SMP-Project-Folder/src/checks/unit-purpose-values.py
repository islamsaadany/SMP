"""A UNIT'S PURPOSE AND CORE VALUES: STRUCTURE DECIDES, AND ON MEANS OWED (§474).

§473 built both as optional boxes; §474 reverses that at Islam's word
(*"yes for all proceed"*): a box is drawn exactly when Client set-up ›
Structure carries that part for this unit, pen open or not; switched on and
empty it reads Missing and is counted like the aspiration; switched off it is
not drawn and not counted, and whatever is stored stays stored (§404).

BOTH ENDS EVERY TIME (§94.2): off draws nothing AND counts nothing even with
text stored; on draws both AND counts both while empty. Every press is read
back from the DATA (§96): the Purpose writes `mission`, a value is added,
named and defined, removing the last DELETES the key (§50.6), an emptied
Purpose deletes its key too, and the count follows what is written.
"""
import os, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
BUILT = os.environ.get("SMP_BUILT") or str(ROOT / "SMP-Project-Folder/src/strategy-management-platform.html")
URL = "file://" + BUILT
bad, errs = 0, []


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


SEE = """() => ({
  pur: !!document.querySelector('.upurpose'), val: !!document.querySelector('.uvalues'),
  tags: document.querySelectorAll('.optag').length,
  missing: [...document.querySelectorAll('.upurpose .missing, .uvalues .missing')].length,
  add: !!document.querySelector('[data-uvaladd]'),
  mission: UNITS.mobile.mission, values: UNITS.mobile.values,
  hasMission: 'mission' in UNITS.mobile, hasValues: 'values' in UNITS.mobile,
  owed: SMPRules.gapMissing('unit', UNITS.mobile, unitGapOff(UNITS.mobile)),
  readVals: [...document.querySelectorAll('.uvalues .valcard summary')].map((s) => s.textContent),
  readPur: (document.querySelector('.upurpose .statement') || {}).textContent || ''
})"""

SET = """([sel, v]) => { const e = document.querySelector(sel); e.value = v;
  e.dispatchEvent(new Event('change', { bubbles: true })); }"""

# Structure for business units: everything §404.5 ships a new client with,
# with or without the two parts under test.
BASE = ["brief", "aspiration", "keyobj", "pillar", "swot"]
STRUCT = """(on) => { GROUP.structure = { bu: { on: on } }; paint(); }"""

with sync_playwright() as pw:
    ex = os.environ.get("SMP_CHROME") or None
    br = pw.chromium.launch(executable_path=ex) if ex else pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_function("() => typeof paint === 'function' && typeof UNITS === 'object'")
    pg.evaluate("() => { UNITS.mobile.aspiration = UNITS.mobile.aspiration || 'An aspiration'; "
                "delete UNITS.mobile.mission; delete UNITS.mobile.values; "
                "current='mobile'; currentSub='found'; EDIT_PAGE['foundation']=false; paint(); }")

    # ── UNSAID: a client whose Structure was never saved (every live tenant
    # today) sees neither box and owes neither — what it saw before §473.
    pg.evaluate("() => { delete GROUP.structure; paint(); }")
    r = pg.evaluate(SEE)
    ck("a client that never saved its Structure draws neither box", not r["pur"] and not r["val"], r)
    ck("...and owes neither", "mission" not in r["owed"] and "values" not in r["owed"], r["owed"])

    # ── OFF: nothing drawn, nothing owed — even with text stored.
    pg.evaluate(STRUCT, BASE)
    r = pg.evaluate(SEE)
    ck("switched off in Structure, reading mode draws neither box", not r["pur"] and not r["val"], r)
    ck("...and neither is owed", "mission" not in r["owed"] and "values" not in r["owed"], r["owed"])
    pg.evaluate("() => { EDIT_PAGE['foundation']=true; paint(); }")
    r = pg.evaluate(SEE)
    ck("...nor with the pen open", not r["pur"] and not r["val"], r)
    pg.evaluate("() => { UNITS.mobile.mission = 'Kept while off'; "
                "UNITS.mobile.values = [{name:'Kept', def:''}]; EDIT_PAGE['foundation']=false; paint(); }")
    r = pg.evaluate(SEE)
    ck("off hides what is stored and keeps it", not r["pur"] and not r["val"] and
       r["mission"] == "Kept while off" and r["values"] == [{"name": "Kept", "def": ""}], r)
    pg.evaluate("() => { delete UNITS.mobile.mission; delete UNITS.mobile.values; paint(); }")

    # ── ON and EMPTY: both drawn, both Missing, both owed, no Optional anywhere.
    pg.evaluate(STRUCT, BASE + ["purpose", "values"])
    r = pg.evaluate(SEE)
    ck("switched on, reading mode draws both boxes though empty", r["pur"] and r["val"], r)
    ck("...each reading Missing", r["missing"] == 2, r)
    ck("...and both are owed, like the aspiration", "mission" in r["owed"] and "values" in r["owed"], r["owed"])
    ck("nothing is marked Optional", r["tags"] == 0, r["tags"])
    ck("the Foundation's count includes both", pg.evaluate(
        "() => (gapMap('mobile', true).find(e => e.key === 'found') || {}).count >= 2"))

    pg.evaluate("() => { EDIT_PAGE['foundation']=true; paint(); }")
    r = pg.evaluate(SEE)
    ck("the pen draws both, with no Optional tag", r["pur"] and r["val"] and r["add"] and r["tags"] == 0, r)

    pg.evaluate(SET, [".upurpose textarea", "To connect every Egyptian to what matters."])
    r = pg.evaluate(SEE)
    ck("the Purpose box writes the unit's purpose", r["mission"] == "To connect every Egyptian to what matters.", r["mission"])
    ck("...and it is no longer owed", "mission" not in r["owed"], r["owed"])

    pg.click("[data-uvaladd]")
    r = pg.evaluate(SEE)
    ck("+ Add a value adds one row to the data", isinstance(r["values"], list) and len(r["values"]) == 1, r["values"])
    pg.evaluate(SET, [".uvrow input", "Customer first"])
    pg.evaluate(SET, [".uvrow textarea", "Every decision starts with the customer."])
    r = pg.evaluate(SEE)
    ck("the value's name and meaning are stored", r["values"] == [{"name": "Customer first", "def": "Every decision starts with the customer."}], r["values"])
    ck("...and an author's write carries no pending mark", "pend" not in pg.evaluate("() => UNITS.mobile") or
       "values" not in (pg.evaluate("() => UNITS.mobile.pend") or {}))
    ck("with both written, nothing is owed", "mission" not in r["owed"] and "values" not in r["owed"], r["owed"])

    pg.evaluate("() => { EDIT_PAGE['foundation']=false; paint(); }")
    r = pg.evaluate(SEE)
    ck("reading mode shows what was written", r["pur"] and "connect every Egyptian" in r["readPur"] and
       r["readVals"] == ["Customer first"] and r["missing"] == 0, r)

    pg.evaluate("() => { EDIT_PAGE['foundation']=true; paint(); }")
    pg.click('[data-uvalrm="mobile|0"]')
    r = pg.evaluate(SEE)
    ck("removing the last value deletes the key (§50.6)", not r["hasValues"], r["values"])
    pg.evaluate(SET, [".upurpose textarea", "  "])
    r = pg.evaluate(SEE)
    ck("an emptied Purpose deletes its key", not r["hasMission"], r["mission"])
    pg.evaluate("() => { EDIT_PAGE['foundation']=false; paint(); }")
    r = pg.evaluate(SEE)
    ck("...and reading mode says Missing again on both", r["pur"] and r["val"] and r["missing"] == 2, r)

    # ── A FILLER CLOSES BOTH, AND EACH WRITE IS PENDING (§145).
    fill = pg.evaluate("""() => {
      const keep = { authoring: window.authoring, filling: window.filling };
      window.authoring = () => false;
      window.filling = (p) => p === 'foundation';
      EDIT_PAGE['foundation'] = true; paint();
      const out = { box: !!document.querySelector('.upurpose textarea.gapfld'),
                    add: !!document.querySelector('[data-uvaladd]') };
      window.authoring = keep.authoring; window.filling = keep.filling;
      return out; }""")
    ck("in fill mode the Purpose and the Core Values both open to a filler", fill["box"] and fill["add"], fill)
    pg.evaluate("() => { delete UNITS.mobile.pend; delete GROUP.structure; EDIT_PAGE['foundation']=false; paint(); }")
    ck("no page errors", not errs, errs)
    br.close()

print("all good" if not bad else "%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
