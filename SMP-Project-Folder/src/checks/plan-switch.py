"""The plan section switches, and the extra details split in two (§422).

Islam, 2026-09-29: "for the top level make the plan section on and off as
well and same for the BUs and functions", and of Off, "yes": hidden on that
layer's pages, nothing written is lost, and a unit or function with its plan
off has nothing to report — its Reporting tab and plan slides go and it
leaves the scores. And the extra details split into general (the overview,
its three areas each with a name box, and the years shown as Year 1·2·3) and
tactics (several outcomes, requirements).

BOTH ENDS every time (§94.2): the business units switched off beside a
pillars function left on, in one run, or a build that ignores the layer passes
every "it is off" assertion. The controls are PRESSED (§70) and the stored
graph read back (§96); nothing written is lost is asserted by counting the
pillars before and after. SMP_BUILT points it at another build.
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
    except Exception: return dflt       # §215: degrade, never die
def press(pg, sel):
    try:
        pg.click(sel, timeout=4000); pg.wait_for_timeout(250); return True
    except Exception:
        return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    unit = safe(pg, "()=>activeKeys().filter(k=>UNITS[k].items.length && unitFormat(UNITS[k])==='pillars')[0]")
    fk = safe(pg, "()=>Object.keys(FUNCTIONS).filter(k=>fnPlansInPillars(FUNCTIONS[k]) && fnItems(FUNCTIONS[k]).length)[0]")
    ck("the worked example has a pillars unit and a pillars function", bool(unit) and bool(fk), [unit, fk])
    before = safe(pg, "()=>UNITS['%s'].items.length" % unit)

    print("\n1 · the rule, both ends")
    ck("untouched, every layer's plan is on",
       safe(pg, "()=>['group','co:','%s','fn:%s'].every(t=>planOn(t))" % (unit, fk)) is True)
    safe(pg, "()=>{GROUP.structure={bu:{plan:{on:false}}}}")
    ck("units off", safe(pg, "()=>planOn('%s')" % unit) is False)
    ck("…and the function beside them still on", safe(pg, "()=>planOn('fn:%s')" % fk) is True)

    print("\n2 · off means nothing to report and nothing scored")
    ck("the unit is asked for nothing", safe(pg, "()=>reportItems(UNITS['%s']).length" % unit) == 0)
    ck("it owes no submission", safe(pg, "()=>reportPending('%s')" % unit) is False)
    ck("it has no row on the cycle board", unit not in (safe(pg, "()=>boardUnitTargets()", []) or []))
    ck("its pillars and execution score nothing",
       safe(pg, "()=>[unitPillars(UNITS['%s']), unitExec(UNITS['%s'])]" % (unit, unit)) == [None, None])
    ck("…while the function is still asked", safe(pg, "()=>fnReportItems('fn:%s').length + reportItems(unitLike('fn:%s')).length" % (fk, fk), 0) > 0)
    ck("…and still on the board", ("fn:" + fk) in (safe(pg, "()=>boardFunctionTargets()", []) or []))
    ck("nothing written is lost", safe(pg, "()=>UNITS['%s'].items.length" % unit) == before)

    print("\n3 · the pages and the slides")
    ck("the unit's Plan section is not offered", safe(pg, "()=>allowed([{k:'plan',ac:'u_plan',when:function(t){return planOn(t)}}], '%s').length" % unit) == 0)
    perf = safe(pg, "()=>renderUnitPerformance(UNITS['%s'])" % unit) or ""
    ck("its Performance page says the plan is off", "data-planoff" in perf)
    ck("…and draws no execution card", "Execution performance" not in perf)
    deck = safe(pg, "()=>String(deckSlides(UNITS['%s']))" % unit) or ""
    ck("its deck has no plan slides", 'data-anchor="spillars"' not in deck and 'data-anchor="pillars"' not in deck, deck[:200])
    fdeck = safe(pg, "()=>String(deckSlides(unitLike('fn:%s')))" % fk) or ""
    ck("…while the function's deck keeps them", 'data-anchor="pillars"' in fdeck)
    safe(pg, "()=>{delete GROUP.structure}")
    ck("switched back on, the unit is asked again", safe(pg, "()=>reportItems(UNITS['%s']).length" % unit) > 0)

    print("\n4 · the Structure step: the switch and the split, pressed")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) \
        and press(pg, '.wzstep[data-step="structure"]')
    ck("the set-up flow's Structure step opens", ok)
    ck("every layer's plan section carries an On/Off",
       all(safe(pg, "()=>!!document.querySelector('[data-stsec=\"%s|plan\"]')" % k) for k in ("top", "bu", "fn")))
    ck("no plan section says Always on", safe(pg, "()=>[...document.querySelectorAll('.stfixed')].some(e=>/Always on/.test(e.textContent))") is False)
    groups = safe(pg, "()=>[...document.querySelectorAll('[data-stdetg^=\"bu|\"]')].map(g=>g.dataset.stdetg)", [])
    ck("the units' extra details come in two groups, general then tactics", groups == ["bu|general", "bu|tactics"], groups)
    ck("general holds the overview and the years",
       safe(pg, "()=>[...document.querySelectorAll('[data-stdetg=\"bu|general\"] [data-stdetail]')].map(e=>e.dataset.stdetail)") == ["bu|overview", "bu|years"])
    ck("tactics holds several outcomes and requirements",
       safe(pg, "()=>[...document.querySelectorAll('[data-stdetg=\"bu|tactics\"] [data-stdetail]')].map(e=>e.dataset.stdetail)") == ["bu|outcomes", "bu|requirements"])
    press(pg, '[data-stdetail="bu|overview"]')
    ck("with the overview on, its three areas each carry one name box",
       safe(pg, "()=>['ovobj','ovwhy','ovrisk'].every(a=>document.querySelectorAll('[data-stlw=\"bu|'+a+'|one\"]').length===1)") is True)
    try:
        pg.fill('[data-stlw="bu|ovwhy|one"]', "Why this matters"); pg.keyboard.press("Tab"); pg.wait_for_timeout(250)
    except Exception: pass
    ck("a name typed there is stored on the units' layer",
       safe(pg, "()=>GROUP.structure.bu.words.ovwhy.one") == "Why this matters", safe(pg, "()=>JSON.stringify(GROUP.structure.bu)"))
    ck("…and reaches a unit's overview", "Why this matters" in (safe(pg, "()=>{var it=UNITS['%s'].items[0];it.ovWhy=it.ovWhy||'x';return dirOverview(it, false)}" % unit) or ""))
    ck("…but not a function's", "Why now" in (safe(pg, "()=>{GROUP.structure.fn={details:{overview:true}};var it=fnItems(FUNCTIONS['%s'])[0];it.ovWhy=it.ovWhy||'x';return dirOverview(it, false)}" % fk) or ""))
    press(pg, '[data-stdetail="bu|years"]')
    ck("the years are shown as Year 1 · 2 · 3, with no name box",
       safe(pg, "()=>{var r=document.querySelector('[data-stdetrow=\"bu|years\"]');return r?[[...r.querySelectorAll('.styr')].map(e=>e.textContent).join(','), r.querySelectorAll('input').length]:null}") == ["Year 1,Year 2,Year 3", 0])
    press(pg, '[data-stsec="bu|plan"] button:nth-child(2)')
    ck("pressing Off stores it on the units' layer", safe(pg, "()=>GROUP.structure.bu.plan.on") is False)
    ck("…and the section says what Off means",
       "nothing to report" in (safe(pg, "()=>{var b=document.querySelector('[data-stsec=\"bu|plan\"]');return b?b.closest('.stsec').textContent:''}") or ""))
    press(pg, '[data-stsec="bu|plan"] button:nth-child(1)')
    ck("On again deletes the switch rather than storing true", safe(pg, "()=>!(GROUP.structure.bu && GROUP.structure.bu.plan && 'on' in GROUP.structure.bu.plan)") is True)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not fails else "\n%d FAILED" % len(fails))
sys.exit(1 if fails else 0)
