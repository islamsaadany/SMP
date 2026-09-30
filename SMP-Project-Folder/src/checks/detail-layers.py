"""Each layer has its own extra-detail switches (§420).

Islam, 2026-09-29: "every layer or area like units and functions should have
their separate options and switches." The four RHI details — a direction's
overview, several outcomes per tactic, a tactic's requirements, years 1·2·3 —
are switched per layer on Client set-up › Structure, in each layer's plan section, and
the three that add a part carry its own one/many name per layer.

BOTH ENDS every time (§94.2): a unit asked "on" is asked beside a pillars
function asked "off" in the same run, or a build that ignores the layer
passes every "it is on" assertion. The client-wide switch §413 stored is the
FALLBACK for a layer not set on its own, so nothing a client already turned
on moves — asserted. The controls are PRESSED (§70) and the stored graph read
back (§96); the state is MADE (§255). SMP_BUILT points it at another build.
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
CHROME = os.environ.get("SMP_CHROME") or None
fails = []
def ck(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: fails.append(name)
def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt       # §215: degrade, never die
def press(pg, sel):
    try:
        pg.click(sel, timeout=4000); pg.wait_for_timeout(200); return True
    except Exception:
        return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    unit = safe(pg, "()=>activeKeys().filter(k=>UNITS[k].items.some(p=>(p.tactics||[]).length))[0]")
    fk = safe(pg, "()=>Object.keys(FUNCTIONS).filter(k=>fnPlansInPillars(FUNCTIONS[k]) && fnItems(FUNCTIONS[k]).some(p=>(p.tactics||[]).length))[0]")
    ck("the worked example has a unit and a pillars function with tactics", bool(unit) and bool(fk), [unit, fk])
    UT = "UNITS['%s'].items.filter(p=>(p.tactics||[]).length)[0].tactics[0]" % unit
    FT = "fnItems(FUNCTIONS['%s']).filter(p=>(p.tactics||[]).length)[0].tactics[0]" % fk

    print("\n1 · the rule answers per layer")
    safe(pg, "()=>{GROUP.structure={bu:{details:{requirements:true}}}}")
    ck("units on", safe(pg, "()=>requirementsOn('%s')" % unit) is True)
    ck("…and a pillars function off in the same state", safe(pg, "()=>requirementsOn('fn:%s')" % fk) is False)
    ck("a unit's tactic resolves to its unit", safe(pg, "()=>requirementsOn(%s)" % UT) is True)
    ck("a function's tactic resolves to its function", safe(pg, "()=>requirementsOn(%s)" % FT) is False)
    ck("the unit's box is drawn with the pen", bool(safe(pg, "()=>reqsCell(%s, true)" % UT)))
    ck("…and the function's is not", safe(pg, "()=>reqsCell(%s, true)" % FT) == "")

    print("\n2 · the client-wide switch is the fallback — nothing a client turned on moves")
    safe(pg, "()=>{GROUP.structure={details:{requirements:true}}}")
    ck("client-wide on reaches both layers",
       safe(pg, "()=>requirementsOn('%s') && requirementsOn('fn:%s')" % (unit, fk)) is True)
    safe(pg, "()=>{GROUP.structure={details:{requirements:true}, fn:{details:{requirements:false}}}}")
    ck("a layer set OFF on its own wins over it", safe(pg, "()=>requirementsOn('fn:%s')" % fk) is False)
    ck("…while the unit still follows it", safe(pg, "()=>requirementsOn('%s')" % unit) is True)
    safe(pg, "()=>{GROUP.structure={details:{years:true}, bu:{details:{years:false}}}}")
    ck("the yearly revision is drawn while ANY layer marks years", safe(pg, "()=>yearsAnyOn()") is True)
    safe(pg, "()=>{GROUP.structure={bu:{details:{years:false}}}}")
    ck("…and not when none does", safe(pg, "()=>yearsAnyOn()") is False)

    print("\n3 · a layer's own name reaches the page")
    safe(pg, "()=>{GROUP.structure={bu:{details:{requirements:true, outcomes:true}, words:{requirement:{many:'Needs'}, tacoutcome:{one:'Result'}}}, fn:{details:{requirements:true}}}}")
    ck("the unit's box says the unit's word", "Needs" in (safe(pg, "()=>reqsCell(%s, true)" % UT) or ""))
    ck("…and the function's the platform's", "Requirements" in (safe(pg, "()=>reqsCell(%s, true)" % FT) or ""))
    ck("the tactic outcome takes its name where several outcomes is on",
       safe(pg, "()=>detailWord('outcomes','one',%s)" % UT) == "Result")
    ck("…and stays 'Outcome' where it is off", safe(pg, "()=>detailWord('outcomes','one',%s)" % FT) == "Outcome")

    print("\n4 · the Structure step: the rows, pressed")
    safe(pg, "()=>{delete GROUP.structure}")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) \
        and press(pg, '.wzstep[data-step="structure"]')
    ck("the set-up flow's Structure step opens", ok)
    rows = safe(pg, "()=>[...document.querySelectorAll('[data-stdetrow]')].map(r=>r.dataset.stdetrow)", [])
    ck("every layer shown carries all four rows",
       all(("%s|%s" % (k, d)) in rows for k in ("top", "bu", "fn") for d in ("overview", "outcomes", "requirements", "years")), rows)
    ck("no old client-wide card", safe(pg, "()=>document.querySelectorAll('[data-stdetail]:not([data-stdetail*=\"|\"])').length") == 0)
    ck("an off row says so and draws no name box",
       safe(pg, "()=>{var r=document.querySelector('[data-stdetrow=\"fn|requirements\"]');return r?[r.textContent.indexOf('Off for')>=0, r.querySelectorAll('input').length]:null}") == [True, 0])
    press(pg, '[data-stdetail="fn|requirements"]')
    ck("ticking the functions' row stores it on the functions' layer",
       safe(pg, "()=>GROUP.structure.fn.details.requirements===true") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    ck("…and the units' layer is untouched", safe(pg, "()=>!(GROUP.structure.bu&&GROUP.structure.bu.details&&'requirements' in GROUP.structure.bu.details)") is True)
    ck("the row now carries its two name boxes",
       safe(pg, "()=>document.querySelectorAll('[data-stdetrow=\"fn|requirements\"] input[data-stlw=\"fn|requirement|one\"], [data-stdetrow=\"fn|requirements\"] input[data-stlw=\"fn|requirement|many\"]').length") == 2)
    try:
        pg.fill('[data-stlw="fn|requirement|many"]', "Enablers"); pg.keyboard.press("Tab"); pg.wait_for_timeout(250)
    except Exception: pass
    ck("a name typed there is stored on that layer",
       safe(pg, "()=>GROUP.structure.fn.words.requirement.many") == "Enablers", safe(pg, "()=>JSON.stringify(GROUP.structure.fn)"))
    ck("…and reaches the function's tactic", "Enablers" in (safe(pg, "()=>reqsCell(%s, true)" % FT) or ""))
    ck("years carries no names", safe(pg, "()=>{var r=document.querySelector('[data-stdetrow=\"bu|years\"]');return r?r.querySelectorAll('input').length:-1}") == 0)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not fails else "\n%d FAILED" % len(fails))
sys.exit(1 if fails else 0)
