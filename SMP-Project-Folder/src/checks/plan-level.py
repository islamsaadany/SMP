"""Where the plan lives: the Structure cards, and the capabilities (§465, §544.13).

Islam, approving design-mockups/structure-plan-level/2026-10-02_plan-level-v2.html:
*"ok build it"*. §544.4 took the where-planned question away — each level
says on its own card whether it plans, and both can be on — so the units'
layer carries an On/Off like the functions'; the top card keeps its first and
second sections and its plan becomes a Directions card.

§544.13 TOOK THE SECOND QUESTION AWAY TOO, and this check is rewritten to the
rule rather than loosened (§218). §465 gave the capabilities two cards — in
the company plan, or a layer of their own — and the office chose between
them. Asked plainly where a capability appears, Islam answered *"inside its
owner's plan, with the directions"*, and who one can belong to, *"the company
only"*. So there is one card, its switch is §428's *does this client have
capabilities*, and the order at the top level is: top, directions,
capabilities.

BOTH ENDS (§94.2): the worked example (planned on the units, nothing chosen)
reads as the rule says with NOTHING STORED — the capabilities in the company
plan, no side in the navigation — and the units moving either way moves none
of it. It MAKES its state (§255); SMP_BUILT points it at another build
(§276). Every probe degrades (§215).
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
def answer(pg):
    # §621: a press that changes who may do what, or would hide something
    # written, asks first in the floating box. This file is about what the
    # press DOES, so it answers the box; checks/ask-and-apply.py is about the
    # box itself (that it opens, says the impact, and that Keep changes nothing).
    try:
        if pg.query_selector(".askbox .askyes"):
            pg.click(".askbox .askyes"); pg.wait_for_timeout(250)
    except Exception:
        pass

def press(pg, sel):
    try:
        el = pg.query_selector(sel)
        if not el: return False
        el.click(); pg.wait_for_timeout(250); answer(pg); return True
    except Exception: return False

TAGS = "()=>[...document.querySelectorAll('.stcard')].map(c=>c.getAttribute('data-stcard')||'-')"
CAPSIDE = "()=>(navSides()||[]).some(s=>s.fold==='caps')"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    print("0 · the worked example, untouched")
    # §544.13 REVERSES ALL THREE OF THESE, and the reversal is the point
    # (§218). They used to read: the capabilities are a layer, with their own
    # side, and nothing of them on the company's Strategy tab. A capability
    # is the company's now, so each flips — and each flips WITH NOTHING
    # STORED, which is the whole of the change.
    ck("capabilities exist and are in the company's plan",
       safe(pg, "()=>SMPRules.capExists(GROUP) && SMPRules.capAtTop(GROUP)") is True)
    ck("…with no side of their own in the navigation", safe(pg, CAPSIDE) is False)
    ck("…and they are on the company's Strategy tab",
       safe(pg, "()=>topCapsOn()===true && topExtrasOn()===true") is True)
    ck("…with nothing stored to make it so", safe(pg, "()=>!('structure' in GROUP)") is True)

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
    # §544.13: THREE CARDS, NOT FOUR. The fourth was the capabilities as a
    # layer of their own, and there is no such thing now.
    ck("the top level brings its three cards in the agreed order",
       tags == ["-", "dir", "cap"], tags)
    ck("each card's name is its shaded header, and no switch carries a label of its own",
       safe(pg, "()=>{var c=[...document.querySelectorAll('.stcard')]; return c.length===3 && c.every(x=>x.firstElementChild.classList.contains('sthd') && !!x.firstElementChild.querySelector('.tag')) && ![...document.querySelectorAll('.stcard .lab')].some(l=>/This client has|plans its own|Part of the/.test(l.textContent))}") is True)
    # §544: the pair went with the stack. On the panel the top level's
    # cards are one column — the Directions card directly under the top
    # card, the capabilities under that — so what was "side by side at the
    # same height" is asserted as "in this order, each below the last".
    ck("the top level's cards are one column, in order",
       safe(pg, "()=>{var q=s=>document.querySelector(s).getBoundingClientRect();"
                "var t=q('.stcard'),d=q('[data-stcard=\"dir\"]'),c=q('[data-stcard=\"cap\"]');"
                "return !document.querySelector('.shpanel .stpair') && d.top>=t.bottom-1 && c.top>=d.bottom-1}") is True)
    ck("the third layer's card is the units' row, not the top's",
       lvl("bu") and safe(pg, TAGS, []) == ["bu"] and lvl("top") is True)
    ck("the Directions card is off", safe(pg, "()=>!!document.querySelector('[data-stcard=\"dir\"] .sthid')") is True)
    # §544.13: THE WHERE-SWITCH IS GONE. What the capabilities card carries
    # is §428's whether-switch, which the layer card used to hold — one
    # switch, reading On, with the client's record behind it.
    ck("the capabilities card offers no choice of where they live",
       safe(pg, "()=>!document.querySelector('[data-stsec=\"cap|top\"]')") is True)
    ck("…its switch is the one that asks whether this client has any, and it reads On",
       safe(pg, "()=>{var a=document.querySelector('[data-stcard=\"cap\"] .stonoff button[aria-pressed=true]');"
                "return !!a && a.textContent==='On' && !!document.querySelector('[data-stcard=\"cap\"] [data-stsec=\"cap|plan\"]')}") is True)
    ck("…and there is no layer card behind it", safe(pg, "()=>!document.querySelector('[data-stcard=\"caplayer\"]')") is True)
    ck("nothing is stored yet", safe(pg, "()=>!('structure' in GROUP)") is True)

    print("2 · the capabilities switched off, and back on")
    # §544.13 REPLACES THIS SECTION ENTIRELY (§218). It used to press the
    # capabilities from the layer into the company plan and back, and assert
    # the settings, the navigation and the Strategy tab following each press.
    # There is nowhere to press them to. What the one switch does instead is
    # §428's question — does this client have capabilities at all — and BOTH
    # ENDS of that are asserted here, because the section it replaces is the
    # one that proved the card's switch does anything at all (§61).
    ck("pressing the capabilities Off", press(pg, '[data-stcard="cap"] .stonoff button:nth-child(2)'))
    ck("…stores that this client has none", safe(pg, "()=>GROUP.structure.cap.exists") is False,
       safe(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.cap)"))
    ck("…and no place is stored beside it — there is no place to store",
       safe(pg, "()=>!('at' in (GROUP.structure.cap||{}))") is True,
       safe(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.cap)"))
    ck("…the company's Strategy tab loses them", safe(pg, "()=>topCapsOn()===false") is True)
    ck("…and they do NOT reappear in the navigation instead", safe(pg, CAPSIDE) is False)
    ck("…the card says what it keeps", safe(pg, "()=>!!document.querySelector('[data-stcard=\"cap\"] .sthid')") is True)
    ck("pressing them On again", press(pg, '[data-stcard="cap"] .stonoff button:nth-child(1)'))
    ck("…and the company's Strategy tab has them back, their side still absent",
       safe(pg, "()=>topCapsOn()===true") is True and safe(pg, CAPSIDE) is False)

    print("3 · the units switched off, on their own card (§544.4)")
    ck("switching the units off", lvl("bu") and press(pg, '[data-stsec="bu|layer"] button:nth-child(2)'))
    # §544.5 REVERSED WHAT THIS ASSERTED AND §544.13 FINISHED IT (§218).
    # Islam first: *"switching units off is not relevant to the capabilities
    # … what's the relation?"*, then, when §544.5 answered that with a
    # default the office could override: *"It's not about switching units
    # off. Leave the capability completely alone … It's about fixing the
    # whole structure."* None is the answer, with nothing to override: the
    # capabilities are the company's, so the units move nothing about them.
    ck("…and the capabilities DO NOT follow: they are the company's either way",
       safe(pg, "()=>!buExists() && SMPRules.capAtTop(GROUP)===true") is True,
       safe(pg, "()=>[buExists(), SMPRules.capAtTop(GROUP)]"))
    ck("…they are still on the company's Strategy tab", safe(pg, "()=>topCapsOn()===true") is True)
    ck("…and still have no side on the row", safe(pg, CAPSIDE) is False)
    lvl("top")
    tags = safe(pg, TAGS, [])
    ck("the same three on the top, with no fourth card appearing",
       tags == ["-", "dir", "cap"], tags)
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
    ck("the capabilities are untouched by the units' switch",
       safe(pg, "()=>[SMPRules.capAtTop(GROUP), topCapsOn(), navSides().some(s=>s.fold==='caps')]", []) == [True, True, False],
       safe(pg, "()=>[SMPRules.capAtTop(GROUP), topCapsOn(), navSides().some(s=>s.fold==='caps')]"))

    print("4 · and switched back on")
    ck("switching them on again", lvl("bu") and press(pg, '[data-stsec="bu|layer"] button:nth-child(1)'))
    ck("…the units are back and the capabilities never moved",
       safe(pg, "()=>buExists() && SMPRules.capAtTop(GROUP) && topCapsOn()") is True and safe(pg, CAPSIDE) is False)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % bad)
raise SystemExit(1 if bad else 0)
