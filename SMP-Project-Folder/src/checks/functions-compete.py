"""A function may carry How we compete, if the office ticks it (§608).

Spec 064 §3.1 offered the section on the top layer and the business units
only — written into the code. Islam, on the fixed rules that should be
settings: *"proceed with the settings"*. So a function is offered it too,
OFF until the office ticks it on the functions' card, and off hides and
keeps, exactly as on a unit.

BOTH ENDS (§94.2): untouched, no function has the section, the tab or the
slide; ticked, a projects function and a pillars function both draw the
section after their S&W and before the plan, the pen writes the function's
own record, and the deck carries one slide; off hides both and keeps the
words. A capability is never offered it. Pressed where it can be (§70), the
stored graph read back (§96). SMP_BUILT points it at another build (§276).
"""
import os, sys
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
fails = []
def ck(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)[:300]))
    if not ok: fails.append(name)
def js(pg, code, arg=None, dflt=None):
    try: return pg.evaluate(code, arg) if arg is not None else pg.evaluate(code)
    except Exception as e: return dflt
def press(pg, sel):
    try: pg.click(sel, timeout=4000); pg.wait_for_timeout(250); return True
    except Exception: return False

GO = """(a)=>{ leaveModes && leaveModes(); current=a.t; currentSub=a.tab; CURSEC[a.tab]=a.s; paint(); return true; }"""
SECS = """(t)=>(SUBS.fn.filter(x=>x.k==='fnstrat')[0].sections(t)||[]).filter(s=>!s.when||s.when(t)).map(s=>s.k)"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(900)
    js(pg, "()=>{var s=document.getElementById('asWho'); if(s){s.value='smo'; s.dispatchEvent(new Event('change'))}}"); pg.wait_for_timeout(300)

    pf = js(pg, "()=>FUNCTION_KEYS.find(k=>fnPlansInProjects ? fnPlansInProjects(FUNCTIONS[k]) : FUNCTIONS[k].format==='projects')")
    lf = js(pg, "()=>FUNCTION_KEYS.find(k=>fnPlansInPillars(FUNCTIONS[k]))")
    ck("found a projects function and a pillars function", bool(pf) and bool(lf), [pf, lf])
    T = "fn:" + str(pf)

    print("\n1 · untouched, nothing")
    ck("off on every function", js(pg, "()=>FUNCTION_KEYS.every(k=>!compOn('fn:'+k,SMPRules.COMPETE))") is True)
    ck("…no section on its Strategy tab", "compete" not in (js(pg, SECS, T) or ["compete"]))
    ck("…and no slide", "d-compete" not in (js(pg, "(t)=>deckHtmlFor(t)", T) or "d-compete"))
    ck("a capability is never offered it", js(pg, "()=>SMPRules.compOffered('cap:x',SMPRules.COMPETE)") is False)

    print("\n2 · ticked on the functions' card, pressed")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) \
        and press(pg, '.wzstep[data-step="shape"]') and press(pg, '[data-shlvl="fn"]')
    ck("the functions' card opens", ok)
    press(pg, '[data-stsec="fn|compete"] button:nth-child(1)')
    ck("pressing On stores it on the functions' layer",
       "compete" in (js(pg, "()=>((GROUP.structure||{}).fn||{}).on||[]") or []), js(pg, "()=>JSON.stringify((GROUP.structure||{}).fn)"))
    ck("…every function now carries it, the units untouched",
       js(pg, "()=>[FUNCTION_KEYS.every(k=>compOn('fn:'+k,SMPRules.COMPETE)), activeKeys().some(k=>compOn(k,SMPRules.COMPETE))]") == [True, False])

    print("\n3 · the section, after the S&W and before the plan")
    js(pg, "()=>{var l=GROUP.structure.fn; if(l.on.indexOf('swot')<0) l.on.push('swot'); paint();}")
    for k in (pf, lf):
        secs = js(pg, SECS, "fn:" + k) or []
        ck("%s's sections run …swot, compete, then the plan" % k,
           "compete" in secs and secs.index("compete") == secs.index("swot") + 1 and secs[-1] != "compete", secs)

    print("\n4 · the pen writes the function's own record")
    js(pg, GO, {"t": T, "tab": "fnstrat", "s": "compete"})
    ck("empty, it says so in read mode", "Nothing written yet" in (js(pg, "()=>{var c=document.querySelector('#panel .cmp');return c?c.textContent:''}") or ""))
    press(pg, "#secrow-in .secpen")
    ck("the pen draws the picker and + Add a value",
       js(pg, "()=>[!!document.querySelector('#panel select.cmpdisc'), !!document.querySelector('#panel [data-cmpadd]')]") == [True, True])
    try:
        pg.select_option("#panel select.cmpdisc", "bts"); pg.wait_for_timeout(200)
    except Exception as e:
        ck("picking a discipline", False, e)
    press(pg, "#panel [data-cmpadd]")
    try:
        t = pg.query_selector_all("#panel td.cmpval input.fld")[0]
        t.fill("Answers in a day"); t.evaluate("e=>e.blur()"); pg.wait_for_timeout(200)
    except Exception as e:
        ck("typing the value", False, e)
    rec = js(pg, "(k)=>JSON.stringify(FUNCTIONS[k].compete||null)", pf) or ""
    ck("the discipline and the value reach FUNCTIONS[…].compete", '"discipline":"bts"' in rec and "Answers in a day" in rec, rec)
    ck("…and no unit was written", js(pg, "()=>activeKeys().every(k=>!UNITS[k].compete)") is True)
    press(pg, "#secrow-in .secpen")

    print("\n5 · the deck")
    deck = js(pg, "(t)=>deckHtmlFor(t)", T) or ""
    ck("one How we compete slide on the function's deck", deck.count('class="dslide d-compete"') == 1, deck.count("d-compete"))
    ck("…carrying what was written", "Answers in a day" in deck and "Best Total Solution" in deck)
    ck("a function with nothing written gets no slide (§253)", "d-compete" not in (js(pg, "(t)=>deckHtmlFor(t)", "fn:" + str(lf)) or "d-compete"))

    print("\n6 · off hides and keeps")
    js(pg, "()=>{var l=GROUP.structure.fn; l.on=l.on.filter(c=>c!=='compete'); paint();}")
    ck("off, the section is gone", "compete" not in (js(pg, SECS, T) or ["compete"]))
    ck("…and so is the slide", "d-compete" not in (js(pg, "(t)=>deckHtmlFor(t)", T) or "d-compete"))
    ck("…and the value is still stored", js(pg, "(k)=>FUNCTIONS[k].compete.values[0].title", pf) == "Answers in a day")

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not fails else "\n%d FAILED" % len(fails))
sys.exit(1 if fails else 0)
