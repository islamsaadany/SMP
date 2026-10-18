"""Where the plan lives: the Structure cards, and capabilities in one place (§465).

Islam, approving design-mockups/structure-plan-level/2026-10-02_plan-level-v2.html:
*"ok build it"*. §544.4 took the where-planned question away — each level
says on its own card whether it plans, and both can be on — so the units'
layer carries an On/Off like the functions'; the top card keeps its first
and second sections and its plan becomes a
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
    # §544 REWRITES WHERE THESE CARDS ARE, NEVER WHAT THEY HOLD (§218). The
    # Structure step's stack of seven is the shape screen's panel, one card
    # at a time: press a level in the tree and its card opens. So the claims
    # about the STACK's order and pairing are claims about the TREE's order
    # and about which cards each level brings — and every claim below about
    # what a card holds is unchanged and still asserted.
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) and press(pg, '.wzstep[data-step="shape"]')
    ck("the shape screen opens", ok)
    def lvl(k):
        return press(pg, '[data-shlvl="%s"]' % k)
    rows = safe(pg, "()=>[...document.querySelectorAll('[data-shlvl]')].map(b=>b.dataset.shlvl)", [])
    ck("the tree's rows are the top, the units' layer, the units, the functions",
       rows == ["top", "bu@g", "bu", "fn"], rows)
    ck("the top level's card opens", lvl("top"))
    # §544.4: the either/or is gone; the units' own card answers it.
    ck("the top card asks no where-planned question",
       safe(pg, "()=>!document.querySelector('[data-stplan]')") is True)
    tags = safe(pg, TAGS, [])
    # §465: the top level brings its own card, its Directions and the
    # capabilities, in that order — the three that are one question.
    ck("the top level brings its three cards in the agreed order",
       tags == ["-", "dir", "capco", "cap"], tags)
    ck("each card's name is its shaded header, and no switch carries a label of its own",
       safe(pg, "()=>{var c=[...document.querySelectorAll('.stcard')]; return c.length===4 && c.every(x=>x.firstElementChild.classList.contains('sthd') && !!x.firstElementChild.querySelector('.tag')) && ![...document.querySelectorAll('.stcard .lab')].some(l=>/This client has|plans its own|Part of the/.test(l.textContent))}") is True)
    # §544: the pair went with the stack. On the panel the top level's
    # cards are one column — the Directions card directly under the top
    # card, the capabilities under that — so what was "side by side at the
    # same height" is asserted as "in this order, each below the last".
    ck("the top level's cards are one column, in order",
       safe(pg, "()=>{var q=s=>document.querySelector(s).getBoundingClientRect();"
                "var t=q('.stcard'),d=q('[data-stcard=\"dir\"]'),c=q('[data-stcard=\"capco\"]');"
                "return !document.querySelector('.shpanel .stpair') && d.top>=t.bottom-1 && c.top>=d.bottom-1}") is True)
    ck("the third layer's card is the units' row, not the top's",
       lvl("bu") and safe(pg, TAGS, []) == ["bu"] and lvl("top") is True)
    ck("the Directions card is off", safe(pg, "()=>!!document.querySelector('[data-stcard=\"dir\"] .sthid')") is True)
    ck("the company-plan capabilities card is off and the layer card is live",
       safe(pg, "()=>{var a=document.querySelector('[data-stsec=\"cap|top\"] button[aria-pressed=true]'); return !!a && a.textContent==='Off' && !!document.querySelector('[data-stcard=\"cap\"] [data-stsec=\"cap|layer\"]')}") is True)
    ck("nothing is stored yet", safe(pg, "()=>!('structure' in GROUP)") is True)

    print("2 · capabilities moved into the company plan")
    ck("pressing On on the company-plan card", press(pg, '[data-stsec="cap|top"] button:nth-child(1)'))
    ck("…stores the place and keeps them on", safe(pg, "()=>GROUP.structure.cap.at==='top' && GROUP.structure.cap.exists===true") is True,
       safe(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.cap)"))
    tags = safe(pg, TAGS, [])
    ck("…the settings move to the third card and the layer card is greyed",
       tags[2:3] == ["cap"] and tags[3:4] == ["caplayer"], tags)
    ck("…and inside the company plan they show only their plan section",
       safe(pg, "()=>document.querySelectorAll('[data-stcard=\"cap\"] .stsecs > .stsec').length===1 && !document.querySelector('[data-stcard=\"cap\"] [data-stsec=\"cap|found\"]')") is True)
    ck("…its switch held off and unpressable", safe(pg, LAYERHELD) is True)
    ck("…the navigation loses the capabilities side", safe(pg, CAPSIDE) is False)
    ck("…and the company's Strategy tab gains them", safe(pg, "()=>topCapsOn()===true && topExtrasOn()===true") is True)
    ck("pressing it Off", press(pg, '[data-stsec="cap|top"] button:nth-child(2)'))
    ck("…removes the place (an absence again)", safe(pg, "()=>!('at' in GROUP.structure.cap)") is True)
    ck("…and the layer and its side come back", safe(pg, CAPSIDE) is True and safe(pg, TAGS, [])[3:4] == ["cap"])

    print("3 · the units switched off, on their own card (§544.4)")
    ck("switching the units off", lvl("bu") and press(pg, '[data-stsec="bu|layer"] button:nth-child(2)'))
    ck("…and the capabilities follow into the company plan",
       safe(pg, "()=>!buExists() && SMPRules.capAtTop(GROUP)") is True)
    lvl("top")
    tags = safe(pg, TAGS, [])
    ck("the same three on the top, the capabilities in the plan and the layer greyed",
       tags == ["-", "dir", "cap", "caplayer"], tags)
    ck("…the layer card unpressable", safe(pg, LAYERHELD) is True)
    ck("the units card shows its own switch, live, reading Off",
       lvl("bu") and safe(pg, "()=>{var c=document.querySelector('[data-stcard=\"bu\"]'); var b=[...c.querySelectorAll('.stonoff button')]; return b.length===2 && b.every(x=>!x.disabled) && b[1].getAttribute('aria-pressed')==='true'}") is True)
    lvl("top")
    # §544.4 REVERSES THIS, and the reversal is the point (§218). The old
    # button switched the company's directions on behind you, because it had
    # just copied the units' plans there. Switching the units off copies
    # nothing now, so it switches nothing on either: the company's plan is
    # the company card's own answer, and it is still Off.
    ck("the company's directions are NOT switched on behind you",
       safe(pg, "()=>!!document.querySelector('[data-stcard=\"dir\"] .sthid') && !document.querySelector('[data-stway=\"top|pillars\"]')") is True)
    ck("…and switching them on is the company card's own press",
       press(pg, '[data-stsec="top|plan"] button:nth-child(1)') and
       safe(pg, "()=>!document.querySelector('[data-stcard=\"dir\"] .sthid') && !!document.querySelector('[data-stway=\"top|pillars\"]')") is True)
    press(pg, '[data-stsec="top|plan"] button:nth-child(2)')
    ck("no capabilities side in the navigation", safe(pg, CAPSIDE) is False)

    print("4 · and switched back on")
    ck("switching them on again", lvl("bu") and press(pg, '[data-stsec="bu|layer"] button:nth-child(1)'))
    ck("…the capabilities are a layer again, their side back", safe(pg, "()=>buExists() && !SMPRules.capAtTop(GROUP)") is True and safe(pg, CAPSIDE) is True)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
