#!/usr/bin/env python3
"""A supporting function's S&W waits for the office (§423).

Islam, 2026-09-29: *"yes build it"* — for a client that has never saved a
Structure (Raya Trade), the functions' S&W (§399) stays off until the office
ticks the functions' SWOT on the Structure step. Hidden, never deleted.

BOTH ENDS (§94.2): with nothing saved, no function draws the section, the
tab or the slide AND a business unit keeps its SWOT (or a build that hid
every SWOT passes); what was written on a function is still stored; the
Structure step shows the functions' SWOT as Off and a first press anywhere
on the step does NOT switch it on as a side effect; pressing its On brings
the section and the slide back with the lines intact. Every probe degrades
(§215). SMP_BUILT points it at another build (§276).
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
bad = []
def ck(ok, what, detail=None):
    print(("  ok    " if ok else "  FAIL  ") + what + ("" if ok or detail is None else "  -> %r" % (detail,)))
    if not ok: bad.append(what)
def js(pg, src, arg=None):
    try: return pg.evaluate(src, arg)
    except Exception as e: return {"__error": str(e)[:200]}
def press(pg, sel):
    try: pg.click(sel, timeout=4000); pg.wait_for_timeout(250); return True
    except Exception: return False

SECS = """()=>FUNCTION_KEYS.map(k=>[k,allowed(SUBS.fn.filter(x=>x.k==='fnstrat')[0].sections('fn:'+k)||[],'fn:'+k).map(s=>s.k)])"""
SLIDES = """()=>FUNCTION_KEYS.map(k=>String(deckHtmlFor('fn:'+k)).indexOf('Strengths')>=0)"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)

    print("1. nothing saved: the functions' S&W is off, a unit's SWOT is not")
    ck(js(pg, "()=>SMPRules.structureOf(GROUP)") is None, "the worked example has saved no Structure")
    js(pg, "()=>{ FUNCTION_KEYS.forEach(k=>{ FUNCTIONS[k].swot = {s:['Kept '+k], w:['Weak '+k]}; }); paint(); }")
    secs = js(pg, SECS)
    ck(isinstance(secs, list) and len(secs) > 1 and all("swot" not in ss for _, ss in secs),
       "no function offers an S&W section", secs)
    ck(isinstance(secs, list) and all(len(ss) >= 2 for _, ss in secs), "…while each still has its Overview and plan", secs)
    ck(js(pg, "()=>allowed(SUBS.unit.filter(x=>x.k==='strategy')[0].sections('mobile'),'mobile').map(s=>s.k).indexOf('swot')>=0") is True,
       "a business unit keeps its SWOT")
    sl = js(pg, SLIDES)
    ck(isinstance(sl, list) and not any(sl), "no function's deck carries an S&W slide", sl)
    ck(js(pg, "()=>FUNCTION_KEYS.every(k=>FUNCTIONS[k].swot.s[0]==='Kept '+k)") is True, "what was written is still stored")

    print("2. the Structure step agrees, and a press elsewhere does not switch it on")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) \
        and press(pg, '.wzstep[data-step="structure"]')
    ck(ok, "the Structure step opens")
    on = lambda: js(pg, "()=>{var b=document.querySelector('[data-stsec=\"fn|swot\"]');var x=b&&b.querySelector('[aria-pressed=\"true\"]');return x?x.textContent.trim():null}")
    ck(on() == "Off", "the functions' SWOT reads Off", on())
    press(pg, '[data-stsec="bu|plan"] button:nth-child(2)')
    ck(js(pg, "()=>!!GROUP.structure && (GROUP.structure.fn.on||[]).indexOf('swot')<0") is True,
       "a first press on another switch leaves the functions' S&W off", js(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.fn)"))
    press(pg, '[data-stsec="bu|plan"] button:nth-child(1)')
    press(pg, '[data-stsec="fn|swot"] button:nth-child(1)')
    ck(js(pg, "()=>(GROUP.structure.fn.on||[]).indexOf('swot')>=0") is True, "pressing On stores it on the functions' layer")

    print("3. on, it comes back whole")
    secs = js(pg, SECS)
    ck(isinstance(secs, list) and all("swot" in ss for _, ss in secs), "every function offers S&W again", secs)
    sl = js(pg, SLIDES)
    ck(isinstance(sl, list) and all(sl), "every function's deck carries its S&W slide", sl)
    ck(js(pg, "()=>FUNCTION_KEYS.every(k=>FUNCTIONS[k].swot.s[0]==='Kept '+k)") is True, "…with the lines that were there")

    ck(not errs, "no page errors", errs[:3])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % len(bad))
sys.exit(1 if bad else 0)
