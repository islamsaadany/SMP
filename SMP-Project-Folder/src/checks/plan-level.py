"""Where the plan lives: the Structure cards, and capabilities in one place (§465).

Islam, approving design-mockups/structure-plan-level/2026-10-02_plan-level-v2.html:
*"ok build it"*. The where-planned question reads Company level | Units level;
the top card keeps its first and second sections and its plan becomes a
Directions card; capabilities get a card in the company plan beside it and
keep the separate-layer card last, ONE of the two live at a time. The order is
the same at both levels: top, directions, capabilities, second layer, units,
functions, capabilities as a layer.

BOTH ENDS (§94.2): the worked example (planned on the units, nothing chosen)
must read exactly as before — directions off, capabilities a layer with their
side in the navigation, nothing on the company's Strategy tab — and only a
press moves them. It MAKES its state (§255); SMP_BUILT points it at another
build (§276). Every probe degrades (§215).
"""
import os, json
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception: return dflt
def press(pg, sel):
    try:
        el = pg.query_selector(sel)
        if not el: return False
        el.click(); pg.wait_for_timeout(250); return True
    except Exception: return False

TAGS = "()=>[...document.querySelectorAll('.stcard')].map(c=>c.getAttribute('data-stcard')||'-')"
CAPSIDE = "()=>(navSides()||[]).some(s=>s.fold==='caps')"
LAYERHELD = """()=>{var c=document.querySelector('[data-stcard="caplayer"]'); if(!c) return false;
  var b=[...c.querySelectorAll('.stonoff button')]; return b.length>0 && b.every(x=>x.disabled) && !c.querySelector('[data-stsec="cap|layer"]')}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    print("0 · the worked example, untouched")
    ck("capabilities exist and are a layer", safe(pg, "()=>SMPRules.capExists(GROUP) && !SMPRules.capAtTop(GROUP)") is True)
    ck("…with their own side in the navigation", safe(pg, CAPSIDE) is True)
    ck("…and nothing on the company's Strategy tab", safe(pg, "()=>topCapsOn()===false && topExtrasOn()===false") is True)

    print("1 · the cards, units level")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) and press(pg, '.wzstep[data-step="structure"]')
    ck("the Structure step opens", ok)
    ck("the question reads Company level | Units level",
       safe(pg, "()=>[...document.querySelectorAll('[data-stplan] button')].map(b=>b.textContent).join('|')") == "Company level|Units level")
    tags = safe(pg, TAGS, [])
    # §467: Functions come before the third layer, and the bottom pair is the
    # third layer and independent capabilities (Islam's agreed order).
    ck("seven cards in the agreed order", tags == ["-", "dir", "capco", "-", "-", "bu", "cap"], tags)
    ck("each card's name is its shaded header, and no switch carries a label of its own",
       safe(pg, "()=>{var c=[...document.querySelectorAll('.stcard')]; return c.length===7 && c.every(x=>x.firstElementChild.classList.contains('sthd') && !!x.firstElementChild.querySelector('.tag')) && ![...document.querySelectorAll('.stcard .lab')].some(l=>/This client has|plans its own|Part of the/.test(l.textContent))}") is True)
    ck("the company's pillars and capabilities share one row",
       safe(pg, "()=>{var d=document.querySelector('[data-stcard=\"dir\"]'),c=document.querySelector('[data-stcard=\"capco\"]'); return d.parentNode.classList.contains('stpair') && d.parentNode===c.parentNode && Math.abs(d.getBoundingClientRect().top-c.getBoundingClientRect().top)<1}") is True)
    ck("the third layer, being on, is stacked rather than paired",
       safe(pg, "()=>!document.querySelector('[data-stcard=\"bu\"]').parentNode.classList.contains('stpair')") is True)
    ck("the Directions card is off", safe(pg, "()=>!!document.querySelector('[data-stcard=\"dir\"] .sthid')") is True)
    ck("the company-plan capabilities card is off and the layer card is live",
       safe(pg, "()=>{var a=document.querySelector('[data-stsec=\"cap|top\"] button[aria-pressed=true]'); return !!a && a.textContent==='Off' && !!document.querySelector('[data-stcard=\"cap\"] [data-stsec=\"cap|layer\"]')}") is True)
    ck("nothing is stored yet", safe(pg, "()=>!('structure' in GROUP)") is True)

    print("2 · capabilities moved into the company plan")
    ck("pressing On on the company-plan card", press(pg, '[data-stsec="cap|top"] button:nth-child(1)'))
    ck("…stores the place and keeps them on", safe(pg, "()=>GROUP.structure.cap.at==='top' && GROUP.structure.cap.exists===true") is True,
       safe(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.cap)"))
    tags = safe(pg, TAGS, [])
    ck("…the settings move to card 3 and card 7 is greyed", tags[2:3] == ["cap"] and tags[6:7] == ["caplayer"], tags)
    ck("…and inside the company plan they show only their plan section",
       safe(pg, "()=>document.querySelectorAll('[data-stcard=\"cap\"] .stsecs > .stsec').length===1 && !document.querySelector('[data-stcard=\"cap\"] [data-stsec=\"cap|found\"]')") is True)
    ck("…its switch held off and unpressable", safe(pg, LAYERHELD) is True)
    ck("…the navigation loses the capabilities side", safe(pg, CAPSIDE) is False)
    ck("…and the company's Strategy tab gains them", safe(pg, "()=>topCapsOn()===true && topExtrasOn()===true") is True)
    ck("pressing it Off", press(pg, '[data-stsec="cap|top"] button:nth-child(2)'))
    ck("…removes the place (an absence again)", safe(pg, "()=>!('at' in GROUP.structure.cap)") is True)
    ck("…and the layer and its side come back", safe(pg, CAPSIDE) is True and safe(pg, TAGS, [])[6:7] == ["cap"])

    print("3 · company level")
    press(pg, '[data-stplan] button:nth-child(1)')
    ck("choosing Company level asks first", press(pg, '[data-buask-go]'))
    ck("…and lands on it", safe(pg, "()=>!buExists() && SMPRules.capAtTop(GROUP)") is True)
    tags = safe(pg, TAGS, [])
    ck("the same seven, card 3 holding the capabilities and card 7 greyed", tags == ["-", "dir", "cap", "-", "-", "bu", "caplayer"], tags)
    ck("…the bottom two, both off, share one row",
       safe(pg, "()=>{var a=document.querySelector('[data-stcard=\"bu\"]'),b=document.querySelector('[data-stcard=\"caplayer\"]'); return a.parentNode.classList.contains('stpair') && a.parentNode===b.parentNode}") is True)
    ck("…card 7 unpressable", safe(pg, LAYERHELD) is True)
    ck("the units card shows its switch held off",
       safe(pg, "()=>{var c=document.querySelector('[data-stcard=\"bu\"]'); var b=[...c.querySelectorAll('.stonoff button')]; return b.length===2 && b.every(x=>x.disabled) && b[1].getAttribute('aria-pressed')==='true'}") is True)
    ck("the directions are switched on by the fold", safe(pg, "()=>!document.querySelector('[data-stcard=\"dir\"] .sthid') && !!document.querySelector('[data-stway=\"top|pillars\"]')") is True)
    ck("no capabilities side in the navigation", safe(pg, CAPSIDE) is False)

    print("4 · back to units level")
    ck("choosing Units level", press(pg, '[data-stplan] button:nth-child(2)'))
    ck("…the capabilities are a layer again, their side back", safe(pg, "()=>buExists() && !SMPRules.capAtTop(GROUP)") is True and safe(pg, CAPSIDE) is True)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
