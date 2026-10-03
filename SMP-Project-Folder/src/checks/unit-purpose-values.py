"""A UNIT'S PURPOSE AND CORE VALUES, BOTH OPTIONAL (§473).

Islam: *"purpose needs to be there as optional box in the unit foundation"*,
then *"add core values as optional box"*.

OPTIONAL MEANS TWO THINGS AND BOTH ARE ASSERTED (§94.2): with nothing written,
reading mode draws neither box at all, while the pen draws both, each marked
Optional; and neither is ever a counted gap. Every press is read back from the
DATA (§96): the Purpose writes `mission`, a value is added, named and defined,
removing the last one DELETES the key (§50.6), and an emptied Purpose deletes
its key too. Reading mode then shows what was written.
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
  tags: [...document.querySelectorAll('.upurpose .optag, .uvalues .optag')].map((t) => t.textContent),
  add: !!document.querySelector('[data-uvaladd]'),
  mission: UNITS.mobile.mission, values: UNITS.mobile.values,
  hasMission: 'mission' in UNITS.mobile, hasValues: 'values' in UNITS.mobile,
  readVals: [...document.querySelectorAll('.uvalues .valcard summary')].map((s) => s.textContent),
  readPur: (document.querySelector('.upurpose .statement') || {}).textContent || ''
})"""

SET = """([sel, v]) => { const e = document.querySelector(sel); e.value = v;
  e.dispatchEvent(new Event('change', { bubbles: true })); }"""

with sync_playwright() as pw:
    ex = os.environ.get("SMP_CHROME") or None
    br = pw.chromium.launch(executable_path=ex) if ex else pw.chromium.launch()
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_function("() => typeof paint === 'function' && typeof UNITS === 'object'")
    pg.evaluate("() => { delete UNITS.mobile.mission; delete UNITS.mobile.values; "
                "current='mobile'; currentSub='found'; EDIT_PAGE['foundation']=false; paint(); }")
    r = pg.evaluate(SEE)
    ck("with nothing written, reading mode draws neither box", not r["pur"] and not r["val"], r)
    ck("...and neither is a counted gap", pg.evaluate(
        "() => !JSON.stringify(gapMap ? gapMap('mobile') : {}).match(/mission|values/)"))

    pg.evaluate("() => { EDIT_PAGE['foundation']=true; paint(); }")
    r = pg.evaluate(SEE)
    ck("the pen draws both, each marked Optional", r["pur"] and r["val"] and r["tags"] == ["Optional", "Optional"] and r["add"], r)

    pg.evaluate(SET, [".upurpose textarea, .upurpose input", "To connect every Egyptian to what matters."])
    r = pg.evaluate(SEE)
    ck("the Purpose box writes the unit's purpose", r["mission"] == "To connect every Egyptian to what matters.", r["mission"])

    pg.click("[data-uvaladd]")
    r = pg.evaluate(SEE)
    ck("+ Add a value adds one row to the data", isinstance(r["values"], list) and len(r["values"]) == 1, r["values"])
    pg.evaluate(SET, [".uvrow input", "Customer first"])
    pg.evaluate(SET, [".uvrow textarea", "Every decision starts with the customer."])
    r = pg.evaluate(SEE)
    ck("the value's name and meaning are stored", r["values"] == [{"name": "Customer first", "def": "Every decision starts with the customer."}], r["values"])

    pg.evaluate("() => { EDIT_PAGE['foundation']=false; paint(); }")
    r = pg.evaluate(SEE)
    ck("reading mode shows what was written", r["pur"] and "connect every Egyptian" in r["readPur"] and r["readVals"] == ["Customer first"], r)

    pg.evaluate("() => { EDIT_PAGE['foundation']=true; paint(); }")
    pg.click('[data-uvalrm="mobile|0"]')
    r = pg.evaluate(SEE)
    ck("removing the last value deletes the key (§50.6)", not r["hasValues"], r["values"])
    pg.evaluate(SET, [".upurpose textarea, .upurpose input", "  "])
    r = pg.evaluate(SEE)
    ck("an emptied Purpose deletes its key", not r["hasMission"], r["mission"])
    pg.evaluate("() => { EDIT_PAGE['foundation']=false; paint(); }")
    r = pg.evaluate(SEE)
    ck("...and reading mode is back to neither box", not r["pur"] and not r["val"], r)
    ck("no page errors", not errs, errs)
    br.close()

print("all good" if not bad else "%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
