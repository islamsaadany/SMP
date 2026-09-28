"""Each layer's three sections, as the pages read them (§412).

Islam, of the Structure step: every layer has three sections — the first
(Foundation or Overview), the SWOT and the plan — and for each one the client
says whether it is there, what it is called, which parts it holds and what each
part is called, set per layer; the second layer and the supporting functions
can be switched off as a whole. Signed off from
design-mockups/structure-sections/2026-09-28_sections-per-layer.html.

This is the PAGES' half; checks/structure.py is the step's. Every assertion is
made at BOTH ENDS (§94.2): the state before the change is measured in the same
run, and a unit and a function are measured side by side (§53.5, A15), because
a name set for one layer must not reach the other. The state is MADE (§255):
the worked example stores no structure. SMP_BUILT points it at another build.
"""
import os, sys, json
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

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    unit = safe(pg, "()=>activeKeys()[0]")
    fk = safe(pg, "()=>FUNCTION_KEYS.filter(k=>fnShows(k))[0]")
    ck("the worked example has a unit and a shown function", bool(unit) and bool(fk), [unit, fk])
    ck("…and stores no structure (§255: the state is made here)",
       safe(pg, "()=>!SMPRules.structureOf(GROUP)") is True)

    def usecs():
        return safe(pg, "()=>allowed(SUBS.unit[0].sections(UNITS['%s']),'%s').map(d=>d.k+':'+(typeof d.label==='function'?d.label():d.label))" % (unit, unit), [])
    def fsecs():
        return safe(pg, "()=>allowed(SUBS.fn[0].sections('fn:%s'),'fn:%s').map(d=>d.k+':'+(typeof d.label==='function'?d.label():d.label))" % (fk, fk), [])
    def setS(obj):
        safe(pg, "()=>{GROUP.structure=%s; paint();}" % json.dumps(obj))
    def clear():
        safe(pg, "()=>{delete GROUP.structure; paint();}")
    def word(target, key):
        return safe(pg, "()=>{var t=TARGET,s=TARGET_SETUP; TARGET=%s; TARGET_SETUP=false; var w=labelWord('%s','bu'); TARGET=t; TARGET_SETUP=s; return w}" % (json.dumps(target), key))

    u0, f0 = usecs(), fsecs()
    ck("unstored: a unit has Foundation, SWOT and Plan", [x.split(":")[0] for x in u0 if x.split(":")[0] in ("found", "swot", "plan")] == ["found", "swot", "plan"], u0)
    ck("unstored: a function has its sections", len(f0) >= 2, f0)
    ck("unstored: the unit's first section is called Foundation", "found:Foundation" in u0, u0)

    # ── 1. The first section off hides the tab on that layer only ─────
    setS({"bu": {"found": {"on": False}}})
    u1, f1 = usecs(), fsecs()
    ck("first section off at the business units: the unit's Foundation goes", not any(x.startswith("found:") for x in u1), u1)
    ck("…its SWOT and Plan stay", any(x.startswith("swot:") for x in u1) and any(x.startswith("plan:") for x in u1), u1)
    ck("…and a function's sections are untouched", f1 == f0, [f0, f1])
    clear()

    # ── 2. Titles, per layer ─────────────────────────────────────────
    setS({"bu": {"found": {"title": "Who we are"}, "swot": {"title": "Our position"}, "plan": {"pillars": "Roadmap"}}})
    u2, f2 = usecs(), fsecs()
    ck("the unit's first section wears its layer's title", "found:Who we are" in u2, u2)
    ck("…the SWOT section too", "swot:Our position" in u2, u2)
    ck("…and the plan section, for the way the unit plans", "plan:Roadmap" in u2, u2)
    ck("…while the function's titles are what they were", f2 == f0, [f0, f2])
    clear()
    ck("cleared, the unit reads as before", usecs() == u0, usecs())

    # ── 3. SWOT boxes ────────────────────────────────────────────────
    def quads():
        return safe(pg, "()=>SMPRules.swotQuads(GROUP,'%s')" % unit)
    ck("unstored: a unit's SWOT has four boxes", quads() == ["s", "w", "o", "t"], quads())
    ck("unstored: a function's has two (S&W, §399)", safe(pg, "()=>SMPRules.swotQuads(GROUP,'fn:%s')" % fk) == ["s", "w"])
    setS({"bu": {"swot": {"quads": ["s", "w"]}}})
    ck("strengths and weaknesses only: the unit's SWOT keeps two boxes", quads() == ["s", "w"], quads())
    html = safe(pg, "()=>{var t=TARGET; TARGET='%s'; var h=renderUnitAnalysis(UNITS['%s']); TARGET=t; return typeof h==='string'?h:(h&&h.outerHTML)||''}" % (unit, unit), "") or ""
    ck("…and the page draws exactly those two", ("Strengths" in html and "Weaknesses" in html and "Opportunities" not in html and "Threats" not in html), html[:200])
    clear()

    # ── 4. Names are the LAYER's ─────────────────────────────────────
    base = word(unit, "pillar")
    ck("unstored: a unit and a function read the same pillar word", word("fn:" + fk, "pillar") == base, [base, word("fn:" + fk, "pillar")])
    setS({"bu": {"words": {"pillar": {"many": "Themes"}}}, "fn": {"words": {"pillar": {"many": "Streams"}}}})
    ck("the business units' layer names its pillars", word(unit, "pillar") == "Themes", word(unit, "pillar"))
    ck("…and the functions' layer its own", word("fn:" + fk, "pillar") == "Streams", word("fn:" + fk, "pillar"))
    ck("…while the group keeps the client's word", word("group", "pillar") == base, word("group", "pillar"))
    ck("…and Setup keeps the client's word, never a layer's", safe(pg, "()=>{var s=TARGET_SETUP,t=TARGET; TARGET='%s'; TARGET_SETUP=true; var w=labelWord('pillar','bu'); TARGET_SETUP=s; TARGET=t; return w}" % unit) == base)
    setS({"bu": {"words": {"deliverable": {"many": "Outputs"}}}})
    ck("a part with no Terminology row is named too (deliverables)", word(unit, "deliverable") == "Outputs", word(unit, "deliverable"))
    ck("…and unnamed it reads its own default", word("fn:" + fk, "deliverable") == "Deliverables", word("fn:" + fk, "deliverable"))
    clear()

    # ── 5. A layer switched off ──────────────────────────────────────
    shown0 = safe(pg, "()=>FUNCTION_KEYS.filter(k=>fnShows(k)).length", 0)
    ck("unstored: supporting functions are shown", shown0 > 0, shown0)
    setS({"fn": {"exists": False}})
    ck("the functions' layer off: none is shown", safe(pg, "()=>FUNCTION_KEYS.filter(k=>fnShows(k)).length", -1) == 0)
    ck("…and nothing is deleted", safe(pg, "()=>FUNCTION_KEYS.length", 0) > 0)
    clear()
    ck("back on, every one is shown again", safe(pg, "()=>FUNCTION_KEYS.filter(k=>fnShows(k)).length", 0) == shown0)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%s" % ("all good" if not fails else "%d FAILED" % len(fails)))
sys.exit(1 if fails else 0)
