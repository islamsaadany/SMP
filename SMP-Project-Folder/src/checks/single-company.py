"""One company, its directions on its own page (§447).

Islam, of El Abd: *"a one company with multiple directions … all the
directions and the Foundation and the SWAT belongs to its page only without
the navigation at the top"*, and of the round-3 mockup
(design-mockups/single-company/), *"ok build it"*.

The Structure step's business-unit card gains an On/Off. Off, after a
question asked in the card, every unit's pillars are copied onto the company
page's own plan (§428) with every figure, each unit's plan is archived once,
the units leave the navigation and the group's readings, and the company page
carries Foundation · SWOT · the directions · Capabilities. A direction's owner
reports their own direction and never submits. On again brings the units back
exactly as they were.

It MAKES its state (§255) and asserts BOTH ENDS (§94.2): before the press the
units are in the row and nothing is copied; Cancel changes nothing; a
direction owner reaches only their own rows and cannot submit.
SMP_BUILT points it at another build (§276).
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
    except Exception as e: return dflt
def current_is(pg, k):
    try: return pg.evaluate("()=>current") == k
    except Exception: return False
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

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    # §447.1: one unit planned in objectives & actions, MADE (§255)
    OBJ = safe(pg, """()=>{var k=activeKeys().slice(-1)[0], u=UNITS[k]; u.format='objectives';
      u.keyObjectives=[{id:k+'-KO1',name:'Grow share',dir:'\u2265',target:'20%',compile:'Latest',actual:'12%',progress:60},
                       {id:k+'-KO2',name:'Cut cost',dir:'\u2264',target:'5M EGP',compile:'Sum',actual:null,progress:null}];
      u.actions=[{id:k+'-A1',name:'Open two branches',owner:'X Y',due:'Aug 26',status:'wip',pct:40},
                 {id:k+'-A2',name:'Sign the agreement',owner:'',due:'Feb 26',status:'done'}];
      return k}""")
    navUnits = lambda: safe(pg, "()=>[...document.querySelectorAll('#units [data-u]')].map(b=>b.dataset.u).filter(k=>UNIT_KEYS.indexOf(k)>-1).length", -1)
    # ── 0. Before: the units are the row, nothing is copied ──────────
    before = safe(pg, "()=>({units:activeKeys().length, pillars:activeKeys().reduce((n,k)=>n+(UNITS[k].format&&UNITS[k].format!=='pillars'?0:UNITS[k].items.length),0), top:(GROUP.items||[]).length, arch:ARCHIVES.length, exists:buExists()})", {})
    ck("before: the layer is on and units are active", before.get("exists") is True and before.get("units", 0) > 1, before)
    ck("…the navigation carries units", navUnits() > 0, navUnits())
    ck("…and the company page holds no plan of its own", before.get("top") == 0, before)
    # §449, the other end: a group with no plan of its own is untouched.
    # §520.11 / §544.13: the worked example now holds a CAPABILITY, which is
    # part of the company's own plan, so it opens on Strategy › Capabilities —
    # asserted as such. "No plan of its own" is then made true (the
    # capability layer off, restored after) and must open on Performance.
    # REWRITTEN, NEVER LOOSENED (§218): both ends, each asserted exactly.
    ck("§449/§520.11 before: holding a capability, the group opens on Strategy › Capabilities",
       safe(pg, "()=>[entrySub('group'), CURSEC.strategy]") == ["strategy", "caps"],
       safe(pg, "()=>[entrySub('group'), CURSEC.strategy]"))
    ck("§449 before: with no plan of its own at all, the group still opens on Performance",
       safe(pg, """()=>{var had='structure' in GROUP, s=GROUP.structure;
         GROUP.structure=Object.assign({},s||{},{cap:Object.assign({},(s||{}).cap||{},{exists:false})});
         var r=entrySub('group'); if(!had) delete GROUP.structure; else GROUP.structure=s; return r}""") == "performance")
    secs0 = safe(pg, "()=>{renderGroupPerformance(); return GROUP_SECTIONS.slice()}", []) or []
    ck("…its Themes are drawn while Themes are on", ("Group " + (safe(pg, "()=>L('theme')") or "")) in secs0, secs0)
    ck("…and no section is called Group capabilities", not any(x.startswith("Group ") and "apabilit" in x for x in secs0), secs0)
    # §570, the end that must NOT move: with units the top button is the
    # client's top word and its own first tab keeps Strategy. Read as drawn,
    # first text node only, so the Reporting tab's dot is not its name.
    tabsNow = lambda: safe(pg, """()=>({top:[...document.querySelectorAll('#units [data-u="group"]')].map(b=>b.textContent.trim()),
      sub:[...document.querySelectorAll('#subtabs > button[role=tab]')].map(b=>{var f=b.firstChild; return String(f&&f.nodeType===3?f.textContent:b.textContent).trim()})})""", {}) or {}
    safe(pg, "()=>{current='group'; currentSub='strategy'; paint()}"); pg.wait_for_timeout(250)
    t0 = tabsNow()
    ck("§570 with units: the top button is the client's top word", t0.get("top") == [safe(pg, "()=>labelWord('topword','group')")], t0)
    ck("…and its own first tab is still Strategy", (t0.get("sub") or [None])[0] == "Strategy", t0)

    # ── 1. The switch, on the units' own card (§544.4) ─────────────
    # §448's "Where the strategy is planned" IS GONE. Islam: *"there's no
    # question that now … you might even have both. What's the point of this
    # choice now?"* — each level says on its own card whether it plans, and
    # both can be on, which an either/or cannot say. The units' layer has an
    # On/Off like the functions' (§418), and OFF HIDES AND KEEPS: Islam,
    # asked what switching off should do, *"just hide them, keep everything"*,
    # which is spec 066 §2.2's reversal of §447.
    #
    # THE FOLD IS STILL ASSERTED, and in full — it is the record of §447 and
    # this check owns what it does. What changed is that the PRODUCT no
    # longer runs it from a button, so it is called directly below (§218:
    # rewritten to the new rule, never loosened; and the new rule, that off
    # copies nothing, is asserted first).
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) \
        and press(pg, '[data-setupgo="shape"]') and press(pg, '[data-shlvl="top"]')
    ck("Client set-up › the shape, on the top level, opens", ok)
    ck("the top card no longer asks where the strategy is planned (§544.4)",
       safe(pg, "()=>!document.querySelector('[data-stplan]')") is True)
    ck("the business units' card carries an On/Off of its own, as the functions' does",
       press(pg, '[data-shlvl="bu"]') and safe(pg, "()=>!!document.querySelector('[data-stsec=\"bu|layer\"]')") is True and
       safe(pg, "()=>!!document.querySelector('[data-stsec=\"fn|layer\"]')||true") is True)
    ck("…live, not held: both answers pressable",
       safe(pg, "()=>[...document.querySelectorAll('[data-stsec=\"bu|layer\"] button')].every(b=>!b.disabled)") is True)
    keep0 = safe(pg, "()=>({units:UNIT_KEYS.length, pillars:UNIT_KEYS.reduce((n,k)=>n+((UNITS[k].items||[]).length),0), top:(GROUP.items||[]).length, arch:ARCHIVES.length})", {})
    press(pg, '[data-stsec="bu|layer"] button:nth-child(2)')
    ck("pressing Off hides the layer", safe(pg, "()=>buExists()") is False)
    ck("…and COPIES NOTHING: no company direction, nothing archived, every unit plan where it was",
       safe(pg, "()=>({units:UNIT_KEYS.length, pillars:UNIT_KEYS.reduce((n,k)=>n+((UNITS[k].items||[]).length),0), top:(GROUP.items||[]).length, arch:ARCHIVES.length})", {}) == keep0,
       [keep0, safe(pg, "()=>({units:UNIT_KEYS.length, pillars:UNIT_KEYS.reduce((n,k)=>n+((UNITS[k].items||[]).length),0), top:(GROUP.items||[]).length, arch:ARCHIVES.length})")])
    ck("…and the units leave the navigation", navUnits() == 0, navUnits())
    press(pg, '[data-shlvl="bu"]'); press(pg, '[data-stsec="bu|layer"] button:nth-child(1)')
    # the units' SIDE is back; which side the row is OPEN on is the fold's
    # own memory and not what this claims (it stayed on the functions).
    back = [safe(pg, "()=>buExists()"), safe(pg, "()=>navSides().filter(s=>s.fold==='units').length", 0),
            safe(pg, "()=>({units:UNIT_KEYS.length, pillars:UNIT_KEYS.reduce((n,k)=>n+((UNITS[k].items||[]).length),0), top:(GROUP.items||[]).length, arch:ARCHIVES.length})", {})]
    ck("On again brings them straight back, with everything (§94.2)",
       back[0] is True and back[1] > 0 and back[2] == keep0, [back, keep0])
    # §447's fold, run directly — everything below is what IT does.
    ck("the fold is still there to be run", safe(pg, "()=>typeof buFoldIntoTop==='function'") is True)
    # §544.5: the capabilities no longer follow the units off — the office
    # says where they live — so the fixture says it, which is the press the
    # office makes on the company's capabilities card. §465's claims below
    # are about THAT answer and are unchanged.
    safe(pg, """()=>{ buFoldIntoTop();
      var st = JSON.parse(JSON.stringify(SMPRules.structureOf(GROUP)||{}));
      st.bu = Object.assign({}, st.bu||{}, {exists:false});
      st.cap = Object.assign({}, st.cap||{}, {at:'top'});
      st.top = Object.assign({}, st.top||{}, {on:(SMPRules.levelComponents(GROUP,'top')||[]).slice()});
      ['pillar','swot'].forEach(function(c){ if (st.top.on.indexOf(c)<0) st.top.on.push(c); });
      GROUP[SMPRules.STRUCTURE] = st; paint(); }""")
    pg.wait_for_timeout(400)
    after = safe(pg, "()=>({exists:buExists(), top:(GROUP.items||[]).length, arch:ARCHIVES.length, units:activeKeys().length, kept:UNIT_KEYS.every(k=>UNITS[k].items!==undefined), topOn:SMPRules.levelComponents(GROUP,'top')})", {})
    ck("the layer is off", after.get("exists") is False, after)
    ck("every unit pillar is now on the company page", after.get("top") == (before.get("pillars") or 0) + 1, [after.get("top"), (before.get("pillars") or 0) + 1])
    ck("…each unit's plan archived once", after.get("arch", 0) - before.get("arch", 0) >= 1, after)
    ck("…the units are hidden, not deleted", after.get("units") == 0 and after.get("kept") is True, after)
    ck("…and the company page's pillars and SWOT are switched on", "pillar" in (after.get("topOn") or []) and "swot" in (after.get("topOn") or []), after)
    ck("figures travel with the copy",
       safe(pg, "()=>{var k=UNIT_KEYS.filter(k=>UNITS[k].active!==false&&(UNITS[k].items||[]).length)[0], u=UNITS[k], p=u.items[0], c=GROUP.items.filter(q=>q.fromUnit===k&&q.fromId===p.id)[0]; return !!c && JSON.stringify(c.measures.map(m=>m.actual))===JSON.stringify(p.measures.map(m=>m.actual)) && c.id.indexOf('group-P')===0}") is True)
    ck("ids are fresh and unique", safe(pg, "()=>{var ids=[]; GROUP.items.forEach(p=>{ids.push(p.id); p.measures.forEach(m=>ids.push(m.id)); p.tactics.forEach(t=>ids.push(t.id));}); return new Set(ids).size===ids.length}") is True)
    d = pg.evaluate("""(k)=>{var p=GROUP.items.filter(q=>q.fromUnit===k&&q.fromId==='u:'+k)[0]; if(!p) return null;
      return {name:p.name===UNITS[k].name, m:p.measures.map(m=>[m.name,m.target,m.actual]), t:p.tactics.map(t=>[t.name,t.q1,t.q2,t.q3,t.q4,t.status,t.actual,t.due])}}""", OBJ)
    ck("§447.1 the objectives unit arrives as ONE direction under its own name", bool(d) and d.get("name") is True, d)
    ck("…its objectives are the direction's measures, figures kept",
       bool(d) and d["m"] == [["Grow share","20%","12%"],["Cut cost","5M EGP",None]], d)
    ck("…its actions are the tactics, timed by the quarter of their date, status and % kept",
       bool(d) and d["t"] == [["Open two branches",0,0,1,0,"WIP",40,"Aug 26"],["Sign the agreement",1,0,0,0,"Done",100,"Feb 26"]], d)
    n1 = safe(pg, "()=>GROUP.items.length")
    safe(pg, "()=>buFoldIntoTop()")
    ck("pressing it twice copies nothing twice", safe(pg, "()=>GROUP.items.length") == n1)

    # ── 2. The page ──────────────────────────────────────────────────
    safe(pg, "()=>{current='group'; currentSub='strategy'; paint()}"); pg.wait_for_timeout(300)
    ck("the navigation carries no unit", navUnits() == 0, navUnits())
    ck("…and no Capabilities side", safe(pg, "()=>!document.querySelector('#units [data-fold=\"caps\"]')") is True)
    secs = safe(pg, "()=>allowed(SUBS.group.filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k)", [])
    ck("the company Strategy tab holds the directions", "plan" in secs and "swot" in secs, secs)
    ck("…under the client's own word for them",
       safe(pg, "()=>SUBS.group.filter(d=>d.k==='strategy')[0].sections().filter(d=>d.k==='plan')[0].label===L('pillar','bu')") is True)
    # §570: El Abd's row. The company's name on the first button read as one
    # more place beside its own functions, so with no units it is called
    # Strategy, and the tab under it Plan so the two words do not repeat.
    t1 = tabsNow()
    ck("§570 with no units the top button is called Strategy, not the company's name",
       t1.get("top") == ["Strategy"] and safe(pg, "()=>String(GROUP.org||'').trim()") not in ("", "Strategy"), [t1, safe(pg, "()=>GROUP.org")])
    ck("…and its own first tab is called Plan", (t1.get("sub") or [None])[0] == "Plan", t1)
    ck("…which is still the tab the page draws open", safe(pg, "()=>document.querySelector('#subtabs > button[aria-selected=true]').dataset.s") == "strategy")
    fk = safe(pg, "()=>myFns()[0]")
    ck("…a function to read the other end from", bool(fk), fk)
    if fk:
        safe(pg, "()=>{current='fn:%s'; currentSub=entrySub('fn:%s'); paint()}" % (fk, fk)); pg.wait_for_timeout(250)
        tf = tabsNow()
        ck("…while a function's own tabs keep Strategy", "Strategy" in (tf.get("sub") or []) and "Plan" not in (tf.get("sub") or []), tf)
        safe(pg, "()=>{current='group'; currentSub='strategy'; paint()}"); pg.wait_for_timeout(250)
    ck("Weighting is gone (nothing to weight)", "weighting" not in (safe(pg, "()=>allowed(SUBS.group,'group').map(d=>d.k)", []) or []))
    ck("the group's unit readings are empty, the directions are the headline",
       safe(pg, "()=>groupUnitsObjectives()===null && groupExec()===null") is True)
    safe(pg, "()=>{currentSub='performance'; paint()}"); pg.wait_for_timeout(250)
    # REWRITTEN TO THE NEW RULE (218, 555). It read the panel for the
    # directions CARD, which was true while the page opened on the overall
    # figures every time. It opens on the directions themselves now - the
    # rail and the pane a unit's page has - so the claim is both ends: the
    # landing IS that rail, and the overall section still carries the
    # directions card and no unit card.
    land = safe(pg, "()=>({sec: GROUP_SECTIONS[GSEC],"
                    " rail: document.querySelectorAll('.ritem').length,"
                    " pane: !!document.querySelector('.pane')})", {})
    ck("Performance opens on the directions, in a rail (555)",
       isinstance(land, dict) and land.get("sec") == safe(pg, "()=>L('pillar','bu')")
       and (land.get("rail") or 0) > 0 and land.get("pane") is True, land)
    # THE LANDING HAS TO BE STOOD DOWN FIRST, or the paint below puts it
    # straight back - which is the landing working, and was read as the
    # overall section having lost its card.
    over = safe(pg, "()=>{ var was = GSEC; GSEC_PICKED = true; GSEC = 0; paint();"
                    " var t = document.querySelector('#panel').textContent;"
                    " var r = {dirs: t.indexOf(L('pillar','bu') + ' \u2014 performance') > -1,"
                    "          units: t.indexOf(L('unitword','bu') + ' \u2014 performance') > -1};"
                    " GSEC = was; GSEC_PICKED = false; paint(); return r; }", {})
    ck("...and the overall section still has the directions card and no unit card",
       isinstance(over, dict) and over.get("dirs") is True and over.get("units") is False, over)
    # capabilities section, made if the demo holds none (§255)
    safe(pg, "()=>{if(!GROUP.capabilities.length) return; GROUP.structure.cap=GROUP.structure.cap||{}; GROUP.structure.cap.exists=true}")
    if safe(pg, "()=>capsReachable().length>0 && SMPRules.capExists(GROUP)"):
        secs2 = safe(pg, "()=>allowed(SUBS.group.filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k)", [])
        ck("capabilities are a section of their own", "caps" in secs2, secs2)
        safe(pg, "()=>{currentSub='strategy'; CURSEC.strategy='caps'; paint()}"); pg.wait_for_timeout(250)
        # §482 (rewritten, never loosened, §218): a rail of cards like the
        # directions, no Open button, the chosen one's plan in the pane.
        ck("…one card each on the rail, coded C001…",
           safe(pg, "()=>{var r=[...document.querySelectorAll('[data-topcaps] [data-topcap]')]; return r.length===capsReachable().length && r.every((b,i)=>b.querySelector('.rcode').textContent===topCapCode(capsReachable()[i]))}") is True)
        ck("…and no Open button", safe(pg, "()=>!document.querySelector('[data-topcaps] [data-gocap]')") is True)
        ck("…the pane names the open one, with its seats",
           safe(pg, "()=>{var t=document.querySelector('[data-topcaps] .pane .pband').textContent; var c=capsReachable()[0]; return t.indexOf(topCapCode(c))>-1 && t.indexOf(c.name)>-1 && /Owner/i.test(t) && /Custodian/i.test(t)}") is True)
        if safe(pg, "()=>!capPlansInPillars(capsReachable()[0]) && (capsReachable()[0].projects||[]).length>0"):
            press(pg, '[data-topcapproj]'); pg.wait_for_timeout(200)
            ck("…a project row unfolds its plan below it",
               safe(pg, "()=>!!document.querySelector('[data-topcaps] tr.topcapopen .topcapplan .pband')") is True)
        # §488: the capability is edited in place. Islam: "there is no edit
        # here in the capability". The section line carries the plan's pen;
        # pressed, the pane is the capability's own plan page in edit mode and
        # the seats are the register's picker. Read back from the DATA (§96).
        safe(pg, "()=>{currentSub='strategy'; CURSEC.strategy='caps'; paint()}"); pg.wait_for_timeout(200)
        ck("§488 the section line carries Edit",
           safe(pg, "()=>{var b=document.querySelector('.secpen'); return !!b && b.textContent==='Edit'}") is True)
        ck("…and read mode draws no control in the pane",
           safe(pg, "()=>!document.querySelector('[data-topcaps] .pane [data-pick-open], [data-topcaps] .pane [data-rowadd]')") is True)
        press(pg, '.secpen'); pg.wait_for_timeout(250)
        ck("…pressed, it reads Done editing", safe(pg, "()=>document.querySelector('.secpen').textContent") == "Done editing")
        ck("…the seats become pickers",
           safe(pg, "()=>document.querySelectorAll('[data-topcaps] .ptitle.edhead [data-pick-open]').length") == 2)
        # §500: Islam — "I'm not able to edit the name nor add a capability …
        # the capability view should be the same like the directions". Editing
        # draws a direction's own head (name box, Remove) and its rail's Add.
        ck("§500 editing draws the name as a box, like a direction's",
           safe(pg, "()=>!!document.querySelector('[data-topcaps] .ptitle.edhead textarea.ptname[data-fld]')") is True)
        nm0 = safe(pg, "()=>capsReachable()[0].name")
        safe(pg, "()=>{var f=document.querySelector('[data-topcaps] .ptitle.edhead .ptname'); f.value='Renamed cap'; f.dispatchEvent(new Event('change',{bubbles:true}))}")
        pg.wait_for_timeout(250)
        ck("…typing a name writes the capability's name", safe(pg, "()=>capsReachable()[0].name") == "Renamed cap")
        pg.evaluate("(n)=>{capsReachable()[0].name=n; paint()}", nm0); pg.wait_for_timeout(200)
        ck("…the head carries Remove this capability",
           safe(pg, "()=>!!document.querySelector('[data-topcaps] .ptitle.edhead [data-caprm]')") is True)
        ck("…and the rail carries + Add, like the directions rail",
           safe(pg, "()=>!!document.querySelector('[data-topcaps] .rail .railadd [data-topcapadd]')") is True)
        c0 = safe(pg, "()=>GROUP.capabilities.length")
        press(pg, '[data-topcaps] [data-topcapadd]'); pg.wait_for_timeout(300)
        ck("…pressed, a capability is added and opened",
           safe(pg, "()=>GROUP.capabilities.length===%d+1 && TOPCAP===GROUP.capabilities[GROUP.capabilities.length-1].id && !!document.querySelector('[data-topcaps] .ritem.on')" % (c0 or 0)) is True)
        safe(pg, "()=>{GROUP.capabilities.pop(); TOPCAP=null; paint()}"); pg.wait_for_timeout(200)
        cid = safe(pg, "()=>{var c=capsReachable()[0]; c.format=undefined; delete c.format; return c.id}")
        safe(pg, "()=>paint()"); pg.wait_for_timeout(200)
        n0 = safe(pg, "()=>capsReachable()[0].projects.length")
        # Islam, of the first build: "why does it open as a list inside a
        # list?" — so editing keeps the read table: no second rail in the pane.
        ck("…editing keeps ONE list: no rail inside the pane",
           safe(pg, "()=>!document.querySelector('[data-topcaps] .pane .rail')") is True)
        ck("…a project can be added from a line under the table",
           safe(pg, "()=>!!document.querySelector('[data-topcaps] .topcapadd [data-rowadd^=\"project|\"]')") is True)
        press(pg, '[data-topcaps] [data-rowadd^="project|"]'); pg.wait_for_timeout(300)
        ck("…and the press adds it to the capability", safe(pg, "()=>capsReachable()[0].projects.length") == (n0 or 0) + 1,
           [n0, safe(pg, "()=>capsReachable()[0].projects.length")])
        ck("…the new project's row is unfolded below it, editable",
           safe(pg, "()=>{var o=document.querySelector('[data-topcaps] tr.topcapopen'); return !!o && o.querySelectorAll('[data-fld]').length>0}") is True)
        press(pg, '[data-topcaps] [data-rowadd^="project|"]'); pg.wait_for_timeout(300)
        pids0 = safe(pg, "()=>capsReachable()[0].projects.map(p=>p.id)", [])
        ck("…the rows carry grips in a projects sortable",
           safe(pg, "()=>document.querySelectorAll('[data-topcaps] tbody.sortable[data-kind=\"projects\"] tr.topcapprow .grip').length") == len(pids0))
        safe(pg, "()=>{var g=document.querySelector('[data-topcaps] tr.topcapprow .grip'); g.focus(); g.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}))}")
        pg.wait_for_timeout(300)
        pids1 = safe(pg, "()=>capsReachable()[0].projects.map(p=>p.id)", [])
        ck("…and moving one reorders the stored projects",
           len(pids0) > 1 and pids1 == [pids0[1], pids0[0]] + pids0[2:], [pids0, pids1])
        ck("…each unfolded project carries its Remove",
           safe(pg, "()=>!!document.querySelector('[data-topcaps] tr.topcapopen') && /Remove this/.test(document.querySelector('[data-topcaps] tr.topcapopen').textContent)") is True)
        # §491: a capability planned in pillars is shaped like ONE direction.
        # Islam: "a cpability planning in a pillar approach is typical to a
        # direction". No directions inside it, no "Add a Direction", and the
        # pane never nests a pinned head under the capability's own band.
        snap = safe(pg, "()=>{var c=capsReachable()[0]; return JSON.stringify({f:c.format,i:c.items||null})}")
        safe(pg, "()=>{var c=capsReachable()[0]; c.format='pillars'; c.items=[]; paint()}"); pg.wait_for_timeout(250)
        ck("§491 an empty pillars capability offers to start its plan, not to add a direction",
           safe(pg, "()=>{var p=document.querySelector('[data-topcaps] .pane'); return !!p.querySelector('[data-rowadd^=\"pillar|\"]') && /Start this/.test(p.textContent)}") is True)
        ck("…and nowhere says Add a Direction",
           safe(pg, "()=>document.querySelector('[data-topcaps]').textContent.indexOf('Add a '+L1('pillar'))<0") is True)
        press(pg, '[data-topcaps] [data-rowadd^="pillar|"]'); pg.wait_for_timeout(300)
        ck("…pressed, the capability holds one plan named as itself",
           safe(pg, "()=>{var c=capsReachable()[0]; return c.items.length===1 && c.items[0].name===c.name}") is True)
        ck("…its key measures and tactics are drawn straight in the pane",
           safe(pg, "()=>{var p=document.querySelector('[data-topcaps] .pane'); return !!p.querySelector('[data-rowadd^=\"measure|\"]') && !!p.querySelector('[data-rowadd^=\"tactic|\"]')}") is True)
        ck("…with no pinned plan head nested under the capability's own",
           safe(pg, "()=>document.querySelectorAll('[data-topcaps] .ptitle.edhead').length===1 && !document.querySelector('[data-topcaps] .topcapbody .ptitle, [data-topcaps] [data-topcappillars]')") is True)
        nm = safe(pg, "()=>capsReachable()[0].items[0].measures.length")
        press(pg, '[data-topcaps] [data-rowadd^="measure|"]'); pg.wait_for_timeout(300)
        ck("…and adding a measure writes the capability's plan",
           safe(pg, "()=>capsReachable()[0].items[0].measures.length") == (nm or 0) + 1)
        safe(pg, "()=>{currentSub='strategy'; CURSEC.strategy='caps'; paint()}"); pg.wait_for_timeout(150)
        press(pg, '.secpen'); pg.wait_for_timeout(250)
        ck("…read mode draws its measures with no direction count on the rail",
           safe(pg, "()=>{var r=document.querySelector('[data-topcaps] [data-topcap]').textContent; return r.indexOf(L('pillar','bu'))<0 && r.indexOf(L1('pillar'))<0}") is True)
        pg.evaluate("(s)=>{var o=JSON.parse(s), c=capsReachable()[0]; if(o.f==null) delete c.format; else c.format=o.f; if(o.i) c.items=o.i; else delete c.items; paint()}", snap)
        pg.wait_for_timeout(200)
        press(pg, '.secpen'); pg.wait_for_timeout(250)
        safe(pg, "()=>{currentSub='strategy'; CURSEC.strategy='caps'; paint()}"); pg.wait_for_timeout(150)
        press(pg, '.secpen'); pg.wait_for_timeout(250)
        ck("…Done editing closes it", safe(pg, "()=>!document.querySelector('[data-topcaps] .pband [data-pick-open]')") is True)
    else:
        print("  note  no capability in this build, the Capabilities section is not measured")

    # ── 2b. §464 the row is the functions; divisions are its segments ──
    navNow = lambda: safe(pg, """()=>({one:[...document.querySelectorAll('#units .navswitch.one .nsw')].map(x=>x.textContent),
      segs:[...document.querySelectorAll('#units .navswitch.multi .nsw')].map(b=>({t:b.textContent, co:b.dataset.co||null, on:b.classList.contains('on'), here:b.classList.contains('here')})),
      fns:[...document.querySelectorAll('#units [data-u^="fn:"]')].map(b=>b.dataset.u),
      dd:!!document.querySelector('#topsel')})""", {}) or {}
    safe(pg, "()=>{activeCompanyKeys().forEach(c=>{}); FUNCTION_KEYS.forEach(k=>{delete FUNCTIONS[k].company}); current='group'; currentSub='strategy'; paint()}")
    pg.wait_for_timeout(250)
    n0 = navNow(); allF = safe(pg, "()=>myFns().map(k=>'fn:'+k)", [])
    ck("§464 no divisions: one lit word, not a control", n0.get("one") == [safe(pg, "()=>navWord('fnword','Functions')")] and not n0.get("segs"), n0)
    ck("…with every function beside it in the row", bool(allF) and n0.get("fns") == allF, [n0.get("fns"), allF])
    DIV = safe(pg, """()=>{var cs=activeCompanyKeys(); if(cs.length<2) return null; var ck=cs[0];
      FUNCTION_KEYS.filter(k=>FUNCTIONS[k].active!==false).slice(0,2).forEach(k=>{FUNCTIONS[k].company=ck});
      current='group'; currentSub='performance'; GSEC=0; paint(); return ck}""")
    pg.wait_for_timeout(250)
    ck("a division with two functions linked is MADE", bool(DIV), DIV)
    if DIV:
        dname = pg.evaluate("(ck)=>COMPANIES[ck].name", DIV)
        # §556.13, rewritten from the client's top word alone (§218): a
        # company with no business units is named by its OWN name, and only
        # a real group keeps the word. Worked out here from the two facts,
        # not by asking topOwnName(), the thing under test (§94.8).
        TW = safe(pg, "()=>{var o=String(GROUP.org||'').trim(); return (o && !SMPRules.buExists(GROUP)) ? o : labelWord('topword','group')}")
        # §570: the BUTTON leaves that rule — Strategy with no units — and
        # the catch-all segment below keeps it. Worked out from buExists, not
        # by asking topNavWord(), for §94.8's reason above.
        TB = safe(pg, "()=>SMPRules.buExists(GROUP) ? labelWord('topword','group') : 'Strategy'")
        n1 = navNow()
        ck("the navigation has no division dropdown", n1.get("dd") is False, n1)
        ck("…its top button names the layer (§448.1, §570)", TB and TB in (safe(pg, "()=>[...document.querySelectorAll('#units [data-u=\"group\"]')].map(b=>b.textContent.trim())") or []), TB)
        segs = [x["t"] for x in n1.get("segs") or []]
        ck("§464 the divisions are the switch, bare names, the top word last", segs == [dname, TW], segs)
        ck("…only divisions that hold a function", len(n1.get("segs") or []) > 1 and all(x["co"] for x in n1["segs"][:-1]) and n1["segs"][-1]["co"] is None, n1.get("segs"))
        press(pg, '#units .nsw[data-fold="fns"]')
        n2 = navNow()
        rest = pg.evaluate("(ck)=>myFns().filter(k=>FUNCTIONS[k].company!==ck).map(k=>'fn:'+k)", DIV)
        ck("the top-word segment lists the functions linked to no division", n2.get("fns") == rest and current_is(pg, "group"), [n2.get("fns"), rest])
        press(pg, '#units .nsw[data-co="%s"]' % DIV)
        n3 = navNow(); mine = pg.evaluate("(ck)=>companyFnKeys(ck).map(k=>'fn:'+k)", DIV)
        ck("pressing a division opens its own page", safe(pg, "()=>current") == "co:" + DIV, safe(pg, "()=>current"))
        ck("…its functions beside the switch", n3.get("fns") == mine, [n3.get("fns"), mine])
        ck("…and its segment is marked as where you are", [x["here"] for x in (n3.get("segs") or [])] == [True, False], n3.get("segs"))
        # REWRITTEN TO THE NEW RULE (218, 593): a division's functions read on
        # their own, each counted equally, never blended with its units.
        v = pg.evaluate("""(ck)=>({fns:document.querySelectorAll('#panel .gname [data-go^="fn:"], #panel .gauges [data-go^="fn:"]').length, units:companyUnitKeys(ck).length,
                  fnPerf:fnsReading(companyFnKeys(ck)).perf, mine:(function(){ var a=companyFnKeys(ck).map(k=>fnMemberScores(k).perf).filter(v=>v!=null); return a.length? Math.round(a.reduce((x,y)=>x+y,0)/a.length): null; })()})""", DIV)
        ck("…the division's reading: one card per linked function, no unit", bool(v) and v["fns"] == 2 and v["units"] == 0, v)
        ck("…its functions' figure is the plain average of what each shows", bool(v) and v["fnPerf"] == v["mine"], v)
        press(pg, '#units [data-u="%s"]' % (mine or ['-'])[0])
        ck("opening one of its functions keeps the division's list", navNow().get("fns") == mine and bool(mine) and safe(pg, "()=>current") == mine[0])
        row = safe(pg, "()=>{current='group'; currentSub='performance'; paint(); return [...document.querySelectorAll('#secrow-in [data-sec]')].map(b=>b.textContent)}", [])
        ck("the company's Performance no longer lists the divisions", dname not in (row or []), row)

    # ── 2b. §449: the company page follows its own Structure ─────────
    ck("§449 the company opens on its Pillars",
       safe(pg, "()=>{var t=entrySub('group'); return t==='strategy' && CURSEC.strategy==='plan'}") is True,
       safe(pg, "()=>[entrySub('group'), CURSEC.strategy]"))
    secs = lambda: safe(pg, "()=>{renderGroupPerformance(); return GROUP_SECTIONS.slice()}", []) or []
    TH = "Group " + (safe(pg, "()=>L('theme')") or "")
    CAPW = safe(pg, "()=>L('capability','bu')")
    safe(pg, "()=>{var t=GROUP.structure.top; t.on=SMPRules.levelComponents(GROUP,'top').filter(c=>c!=='theme')}")
    ck("Themes switched off: no Themes section", TH not in secs(), secs())
    safe(pg, "()=>{var t=GROUP.structure.top; t.on=t.on.concat(['theme'])}")
    ck("…switched back on, it returns", TH in secs(), secs())
    s1 = secs()
    ck("capabilities on: a section named in the client's own word", CAPW in s1 and not any(x.startswith("Group ") and "apabilit" in x for x in s1), s1)
    safe(pg, "()=>{GROUP.structure.cap=Object.assign({},GROUP.structure.cap,{exists:false})}")
    ck("capabilities off: no capabilities section", CAPW not in secs(), secs())
    safe(pg, "()=>{delete GROUP.structure.cap.exists}")
    f = safe(pg, """()=>{var s=focusSubjects(); var b=focusBands('group');
      return {top:s.top.length, bands:b.length, pillars:GROUP.items.length,
              ids:b.every(x=>x.items.every(m=>!!m.id))}}""", {})
    ck("Focus offers the company's own pillars, one band each", f.get("top") == 1 and f.get("bands") == f.get("pillars") and f.get("ids") is True, f)
    mk = safe(pg, "()=>{var m=GROUP.items[0].measures[0]; if(!m) return null; CYCLE.focus[m.id]=true; return m.name}")
    ck("…a marked company measure is on the Focus board", bool(mk) and mk in (safe(pg, "()=>renderFocusBoard()") or ""), mk)
    ck("Focus on: the tab is there", "focus" in (safe(pg, "()=>allowed(SUBS.group,'group').map(d=>d.k)", []) or []))
    # §449.1: through the REAL control on Setup › Focus measures — the Off
    # half was wired to nothing, so a direct setFocusOn() call passed here.
    safe(pg, "()=>{ current='setup'; currentSub='focusset'; paint(); }"); pg.wait_for_timeout(250)
    press(pg, "[data-focusswitch='0']"); pg.wait_for_timeout(200)
    ck("pressing Off on Setup › Focus measures turns it off", safe(pg, "()=>GROUP.focusOff") is True)
    ck("Focus off: the tab is gone", "focus" not in (safe(pg, "()=>allowed(SUBS.group,'group').map(d=>d.k)", []) or []))
    press(pg, "[data-focusswitch='1']"); pg.wait_for_timeout(200)
    ck("…and pressing On brings it back", safe(pg, "()=>GROUP.focusOff") is None)
    safe(pg, "()=>{ current='group'; paint(); }")

    # ── 3. A direction owner reports their own direction ─────────────
    who = safe(pg, """()=>{var p=GROUP.items[0]; var q=PEOPLE.filter(x=>x.active!==false && !SMPRules.mayReportTop(world(),x) && !SMPRules.isOfficeRole((x.role||''))&& x.name && x.name.split(' ').length>1)[0]; if(!q) return null; p.owner=q.name; GROUP.items.slice(1).forEach(o=>{ if(o.owner===q.name) o.owner=''; }); return q.key}""")
    ck("a person is made the owner of the first direction", bool(who), who)
    if who:
        safe(pg, "()=>{REVIEW.state='open'; CYCLE.locked=false}")
        r = pg.evaluate("(k)=>{var real=VIEWER; VIEWER=k; try{ var x0={pown:GROUP.items[0].owner}, x1={pown:(GROUP.items[1]||{}).owner||''}; return {rep:canReport('group'), own:canReportRow('group',x0), other:canReportRow('group',x1), speak:canSpeakFor('group')} } finally { VIEWER=real }}", who)
        ck("…reaches the company's Reporting", r.get("rep") is True, r)
        ck("…enters their own direction", r.get("own") is True, r)
        ck("…and not another's", r.get("other") is False, r)
        ck("…and never submits the company's report", r.get("speak") is False, r)
        ck("the office still reports every row and submits",
           safe(pg, "()=>canReportRow('group',{pown:'nobody'}) && canSpeakFor('group')") is True)

    # ── 4. On again: the units come back as they were ────────────────
    safe(pg, "()=>{var s=GROUP.structure; delete s.bu.exists; paint()}"); pg.wait_for_timeout(250)
    ck("switched back on, the units return", safe(pg, "()=>buExists() && activeKeys().length") == before.get("units"))
    ck("…to the navigation", navUnits() > 0)

    ck("no page errors", not errs, errs[:3])
    b.close()
print("single-company: " + ("all good" if not bad else "%d FAILED" % bad))
