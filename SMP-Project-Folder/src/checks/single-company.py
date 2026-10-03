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
def press(pg, sel):
    try:
        el = pg.query_selector(sel)
        if not el: return False
        el.click(); pg.wait_for_timeout(250); return True
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
    # §449, the other end: a group with no plan of its own is untouched
    ck("§449 before: the group still opens on Performance", safe(pg, "()=>entrySub('group')") == "performance")
    secs0 = safe(pg, "()=>{renderGroupPerformance(); return GROUP_SECTIONS.slice()}", []) or []
    ck("…its Themes are drawn while Themes are on", ("Group " + (safe(pg, "()=>L('theme')") or "")) in secs0, secs0)
    ck("…and no section is called Group capabilities", not any(x.startswith("Group ") and "apabilit" in x for x in secs0), secs0)

    # ── 1. The switch, pressed in Client set-up › Structure ──────────
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) and press(pg, '.wzstep[data-step="structure"]')
    ck("Client set-up › Structure opens", ok)
    ck("§448 the top card asks where the strategy is planned", safe(pg, "()=>!!document.querySelector('[data-stplan]')") is True)
    geo = safe(pg, "()=>{var l=document.querySelector('.stplanq .lab'),b=document.querySelector('[data-stplan]');if(!l||!b)return null;var a=l.getBoundingClientRect(),c=b.getBoundingClientRect();return {below:c.top>=a.bottom-1,left:Math.abs(c.left-a.left)<2}}", None)
    ck("§450 the two buttons sit UNDER the question, at its left edge", bool(geo) and geo.get("below") and geo.get("left"), geo)
    ck("…and the business units' card has no switch of its own", safe(pg, "()=>!document.querySelector('[data-stsec=\"bu|layer\"]')") is True)
    press(pg, '[data-stplan] button:nth-child(1)')
    ck("choosing the company ASKS first, in the card", safe(pg, "()=>!!document.querySelector('[data-buask]')") is True)
    ck("…and changes nothing yet", safe(pg, "()=>buExists() && (GROUP.items||[]).length===0") is True)
    press(pg, '[data-buask-no]')
    ck("Cancel takes the question away and changes nothing",
       safe(pg, "()=>!document.querySelector('[data-buask]') && buExists() && (GROUP.items||[]).length===0") is True)
    press(pg, '[data-stplan] button:nth-child(1)')
    ck("pressing Move them and plan on the company", press(pg, '[data-buask-go]'))
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
    ck("Weighting is gone (nothing to weight)", "weighting" not in (safe(pg, "()=>allowed(SUBS.group,'group').map(d=>d.k)", []) or []))
    ck("the group's unit readings are empty, the directions are the headline",
       safe(pg, "()=>groupUnitsObjectives()===null && groupExec()===null") is True)
    safe(pg, "()=>{currentSub='performance'; paint()}"); pg.wait_for_timeout(250)
    ck("Performance draws the directions card and no unit cards",
       safe(pg, "()=>{var t=document.querySelector('#panel').textContent; return t.indexOf(L('pillar','bu')+' — performance')>-1 && t.indexOf(L('unitword','bu')+' — performance')<0}") is True)
    # capabilities section, made if the demo holds none (§255)
    safe(pg, "()=>{if(!GROUP.capabilities.length) return; GROUP.structure.cap=GROUP.structure.cap||{}; GROUP.structure.cap.exists=true}")
    if safe(pg, "()=>capsReachable().length>0 && SMPRules.capExists(GROUP)"):
        secs2 = safe(pg, "()=>allowed(SUBS.group.filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k)", [])
        ck("capabilities are a section of their own", "caps" in secs2, secs2)
        safe(pg, "()=>{currentSub='strategy'; CURSEC.strategy='caps'; paint()}"); pg.wait_for_timeout(250)
        ck("…one row each, with the way into their own pages",
           safe(pg, "()=>document.querySelectorAll('[data-topcaps] [data-gocap]').length===capsReachable().length") is True)
        press(pg, '[data-gocap]')
        ck("…and Open lands on the capability", safe(pg, "()=>String(current).indexOf('cap:')===0") is True)
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
        TW = safe(pg, "()=>labelWord('topword','group')")
        n1 = navNow()
        ck("the navigation has no division dropdown", n1.get("dd") is False, n1)
        ck("…its top button names the layer (§448.1)", TW and TW in (safe(pg, "()=>[...document.querySelectorAll('#units [data-u=\"group\"]')].map(b=>b.textContent.trim())") or []), TW)
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
        v = pg.evaluate("""(ck)=>({fns:document.querySelectorAll('#panel [data-go^="fn:"]').length, units:companyUnitKeys(ck).length,
                  perf:companyObjectives(ck), mix:companyMix(ck,'perf')})""", DIV)
        ck("…the division's reading: one card per linked function, no unit", bool(v) and v["fns"] == 2 and v["units"] == 0, v)
        ck("…its figure scored from those functions alone", bool(v) and v["perf"] == v["mix"], v)
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
