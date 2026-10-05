"""How we compete, in the plan (spec 064 §3.1, §3.4; §492).

A section after the SWOT, switched on per layer on Client set-up > Structure,
offered on the top layer and the business units only. Off hides and keeps.
The table is the discipline across the top, then Value / How / Measure, one
column per value.

BOTH ENDS every time (§94.2): untouched it is OFF (no existing client moves),
on for the units it is drawn for a unit and NOT for a function; the controls
are PRESSED (§70) and the stored graph read back (§96); turning it off again
keeps every value. SMP_BUILT points it at another build (§276).
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
CHROME = os.environ.get("SMP_CHROME") or None
fails = []
def ck(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)[:300]))
    if not ok: fails.append(name)
def safe(pg, js, arg=None, dflt=None):
    try: return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception: return dflt       # §215: degrade, never die
def press(pg, sel):
    try:
        pg.click(sel, timeout=4000); pg.wait_for_timeout(250); return True
    except Exception:
        return False

GO = """(a)=>{ leaveModes && leaveModes(); current=a.t; currentSub=a.tab; CURSEC[a.tab]=a.s; paint(); return true; }"""
SECS = """(t)=>(SUBS.unit.filter(x=>x.k==='strategy')[0].sections(t)||[]).filter(s=>!s.when||s.when(t)).map(s=>s.k)"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(900)

    unit = safe(pg, "()=>activeKeys().filter(k=>unitFormat(UNITS[k])==='pillars')[0]")
    fk = safe(pg, "()=>FUNCTION_KEYS[0]")
    ck("found a unit and a function", bool(unit) and bool(fk), [unit, fk])

    print("\n1 · the rule, both ends")
    ck("untouched, it is off for the unit and the top", safe(pg, "(u)=>[compOn(u,SMPRules.COMPETE), compOn('group',SMPRules.COMPETE)]", unit) == [False, False])
    ck("offered on the top and a unit, never a function or a company",
       safe(pg, "(a)=>['group',a.u,'fn:'+a.f,'co:x'].map(t=>SMPRules.compOffered(t,SMPRules.COMPETE))", {"u": unit, "f": fk}) == [True, True, False, False])
    ck("untouched, the unit's Strategy tab has no such section", "compete" not in (safe(pg, SECS, unit) or []))

    print("\n2 · the Structure step: pressed")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) \
        and press(pg, '.wzstep[data-step="structure"]')
    ck("the set-up flow's Structure step opens", ok)
    ck("the top and the units carry a How we compete switch",
       all(safe(pg, "(k)=>!!document.querySelector('[data-stsec=\"'+k+'|compete\"]')", k) for k in ("top", "bu")))
    ck("…the functions do not", safe(pg, "()=>!!document.querySelector('[data-stsec=\"fn|compete\"]')") is False)
    ck("off, it says nothing is lost",
       "Nothing entered is lost" in (safe(pg, "()=>{var s=document.querySelector('[data-stcompete=\"bu\"]');return s?s.textContent:''}") or ""))
    press(pg, '[data-stsec="bu|compete"] button:nth-child(1)')
    ck("pressing On stores it on the units' layer",
       "compete" in (safe(pg, "()=>((GROUP.structure||{}).bu||{}).on||[]") or []), safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    ck("…and the units are on while the top stays off",
       safe(pg, "(u)=>[compOn(u,SMPRules.COMPETE), compOn('group',SMPRules.COMPETE)]", unit) == [True, False])

    print("\n3 · the section, after the SWOT and before the plan")
    secs = safe(pg, SECS, unit) or []
    ck("the unit's sections run …swot, compete, plan…",
       "compete" in secs and secs.index("compete") == secs.index("swot") + 1, secs)
    safe(pg, GO, {"t": unit, "tab": "strategy", "s": "compete"})
    ck("empty, it says so in read mode", "Nothing written yet" in (safe(pg, "()=>document.querySelector('#panel .cmp').textContent") or ""))

    print("\n4 · the office writes it with the pen")
    press(pg, "#secrow-in .secpen")
    ck("the pen draws the discipline picker and + Add a value",
       safe(pg, "()=>[!!document.querySelector('#panel select.cmpdisc'), !!document.querySelector('#panel [data-cmpadd]')]") == [True, True])
    try:
        pg.select_option("#panel select.cmpdisc", "btc"); pg.wait_for_timeout(200)
    except Exception as e:
        ck("picking a discipline", False, e)
    ck("the discipline reaches the stored unit", safe(pg, "(u)=>(UNITS[u].compete||{}).discipline", unit) == "btc")
    press(pg, "#panel [data-cmpadd]"); press(pg, "#panel [data-cmpadd]")
    ck("two presses add two value columns", safe(pg, "(u)=>((UNITS[u].compete||{}).values||[]).length", unit) == 2)
    try:
        t = pg.query_selector_all("#panel td.cmpval input.fld")[0]
        t.fill("Hassle-free"); t.evaluate("e=>e.blur()"); pg.wait_for_timeout(200)
        h = pg.query_selector_all("#panel textarea.cmpbox")[0]
        h.fill("- One visit\n- Clear prices\n"); h.evaluate("e=>e.blur()"); pg.wait_for_timeout(200)
        m = pg.query_selector_all("#panel textarea.cmpbox")[2]
        m.fill("Complaints under 2%"); m.evaluate("e=>e.blur()"); pg.wait_for_timeout(200)
    except Exception as e:
        ck("typing into the cells", False, e)
    v = safe(pg, "(u)=>JSON.stringify(UNITS[u].compete.values[0])", unit) or ""
    ck("a title, How bullets (marks stripped) and a Measure reach the stored value",
       v == '{"title":"Hassle-free","how":["One visit","Clear prices"],"measure":["Complaints under 2%"]}', v)
    safe(pg, "()=>{window.confirm=()=>true}")
    press(pg, '#panel [data-cmprm$="|1"]')
    ck("x removes the empty second value", safe(pg, "(u)=>UNITS[u].compete.values.length", unit) == 1)
    press(pg, "#secrow-in .secpen")
    rd = safe(pg, "()=>{var c=document.querySelector('#panel .cmp');return c?c.textContent:''}") or ""
    ck("read mode draws the table: discipline, value and bullets",
       all(s in rd for s in ("Best Total Cost", "Hassle-free", "One visit", "Complaints under 2%")), rd)
    ck("the discipline spans the value columns, as on the slide",
       safe(pg, "()=>document.querySelector('#panel .cmptab th.cmpd').colSpan") == 1)

    print("\n5 · the deck")
    deck = safe(pg, "(u)=>deckHtmlFor(u)", unit) or ""
    ck("one How we compete slide, anchored", deck.count('class="dslide d-compete"') == 1 and 'data-anchor="compete"' in deck)
    ck("…placed after the SWOT", deck.find("d-compete") > deck.rfind("d-swot "), [deck.find("d-compete"), deck.rfind("d-swot ")])
    other = safe(pg, "(u)=>activeKeys().filter(k=>k!==u && unitFormat(UNITS[k])==='pillars')[0]", unit)
    ck("a unit with nothing written gets no slide (§253)", "d-compete" not in (safe(pg, "(k)=>deckHtmlFor(k)", other) or "x"))

    print("\n6 · off hides and keeps")
    safe(pg, "()=>{var l=GROUP.structure.bu; l.on=l.on.filter(c=>c!=='compete'); paint();}")
    ck("off, the section is gone", "compete" not in (safe(pg, SECS, unit) or ["compete"]))
    ck("…and so is the slide", "d-compete" not in (safe(pg, "(u)=>deckHtmlFor(u)", unit) or "d-compete"))
    ck("…and the value is still stored", safe(pg, "(u)=>UNITS[u].compete.values[0].title", unit) == "Hassle-free")
    safe(pg, "(u)=>{var w=UNITS[u].compete; w.values=[]; delete w.discipline; competeTidy(u);}", unit)
    ck("an emptied record is deleted, not kept empty (§50.6)", safe(pg, "(u)=>'compete' in UNITS[u]", unit) is False)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not fails else "\n%d FAILED" % len(fails))
sys.exit(1 if fails else 0)
