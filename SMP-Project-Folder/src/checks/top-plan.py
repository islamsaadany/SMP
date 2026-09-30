"""The top layer's own plan, and capabilities as a card of their own (§428).

Islam, of the mockup design-mockups/top-layer-plan/: *"ok for all, build it"*.

The top layer (the group, in the client's own word) gains the unit's Strategy
tab — Foundation · SWOT · Plan — a plan of pillars, key measures and tactics
that only the SMO team writes, an orange Reporting tab that the office and the
group CEO report through, a card of its own on Performance kept apart from
every existing number, a first row on the cycle board, and slides of its own.
The Structure step gains a fifth card for capabilities and loses the three
"Carries capabilities" ticks.

It MAKES its state (§255): no client holds a top-layer plan, so every
assertion here would pass on a build that lost the feature. Both ends
throughout (§94.2): nothing is drawn before a plan exists, somebody who is not
the office cannot author it, a unit head cannot report it, and every figure
on the group's Performance page that existed before is asserted unmoved.

SMP_BUILT points it at another build (falsified from the SOURCES, §276).
"""
import os, sys
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
    tabs = lambda: safe(pg, "()=>allowed(SUBS.group, 'group').map(d=>d.k)", []) or []
    gsecs = lambda: safe(pg, "()=>allowed(SUBS.group[0].sections(), 'group').map(d=>d.k)", []) or []

    # ── 0. §428.2: unsaid, the group page is what it was before §428 ──
    # Islam: "what people might see different for the group should start in
    # the structuring page off so they shouldn't see it". BOTH ENDS: with the
    # Structure step never saved the tab is Foundation, AFTER Performance, and
    # holds Foundation alone; section 1 then MAKES the other state (§255).
    u0 = tabs()
    ck("§428.2: unsaid, the tabs are the ones before §428, in that order",
       u0[:5] == ["performance", "strategy", "focus", "temple", "weighting"], u0)
    ck("…the tab is called by the Foundation's own name, not Strategy",
       safe(pg, "()=>allowed(SUBS.group,'group').filter(d=>d.k==='strategy')[0].label===SMPRules.foundTitle(GROUP,'group')") is True)
    ck("…and holds Foundation alone, so no section row is drawn",
       safe(pg, "()=>allowed(allowed(SUBS.group,'group').filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k).join(',')") == "found")
    safe(pg, "()=>{GROUP.structure={top:{on:SMPRules.STRUCT_COMPONENTS.slice(),temple:true}};}")

    # ── 1. Nothing stored: the tabs, and nothing to report ────────────
    t0 = tabs()
    ck("the top layer's tabs lead with Strategy", t0[:1] == ["strategy"], t0)
    ck("…and the old Foundation tab is gone (it lives inside Strategy)", "foundation" not in t0, t0)
    ck("…Strategy holds Foundation, SWOT and Plan", gsecs() == ["found", "swot", "plan"], gsecs())
    ck("…Performance, Focus, Temple and Weighting stay",
       all(k in t0 for k in ["performance", "focus", "temple", "weighting"]), t0)
    ck("with no plan of its own there is no Reporting tab", "report" not in t0, t0)
    ck("…and no row on the cycle board", "group" not in (safe(pg, "()=>boardUnitTargets()", []) or []))
    safe(pg, "()=>{current='group'; currentSub='performance'; paint()}"); pg.wait_for_timeout(250)
    perf0 = safe(pg, "()=>[groupKeyObjectives(), groupUnitsObjectives()].map(x=>x==null?null:Math.round(x*100)/100)", [])
    ck("nothing is stored until a pillar is added", safe(pg, "()=>!('items' in GROUP) && !('swot' in GROUP)") is True)

    # ── 2. The empty plan, and the one route out of it ────────────────
    safe(pg, "()=>{current='group'; currentSub='strategy'; CURSEC.strategy='plan'; paint()}"); pg.wait_for_timeout(250)
    ck("the empty plan offers adding the first pillar",
       safe(pg, "()=>!!document.querySelector('#panel .bempty [data-rowadd=\"pillar|group\"]')") is True)
    ck("…and not the builder or the workbook, which cannot address the top layer",
       safe(pg, "()=>!document.querySelector('#panel .bempty [data-buildplan]') && !/Import/.test(document.querySelector('#panel .bempty').innerText)") is True)
    ck("pressing it adds the first pillar to the group's own row", press(pg, '[data-rowadd="pillar|group"]')
       and safe(pg, "()=>GROUP.items.length===1 && GROUP.items[0].id==='group-P1'") is True,
       safe(pg, "()=>JSON.stringify(GROUP.items)"))
    ck("…with its code from the top layer's own letters",
       safe(pg, "()=>pillarCode(topAsUnit(), 0)", "") == "GR01", safe(pg, "()=>pillarCode(topAsUnit(), 0)"))
    ck("the section line carries the one pen", press(pg, "button.secpen"))
    ck("…and the pen opens the add controls for a measure and a tactic",
       press(pg, '[data-rowadd="measure|group|0"]') and press(pg, '[data-rowadd="tactic|group|0"]')
       and safe(pg, "()=>GROUP.items[0].measures.length===1 && GROUP.items[0].tactics.length===1") is True,
       safe(pg, "()=>[...document.querySelectorAll('[data-rowadd]')].map(b=>b.dataset.rowadd)"))
    safe(pg, """()=>{var p=GROUP.items[0]; p.name='Grow the group';
       var m=p.measures[0]; m.name='Group revenue'; m.target='100 M EGP'; m.dir='>='; m.compile='Sum';
       var t=p.tactics[0]; t.name='Open the hub'; t.q1=t.q2=t.q3=t.q4=true; t.owner='Group CEO'; paint()}""")
    ck("the pillars are not the Temple's themes (the Temple reads none of them)",
       safe(pg, "()=>!/Grow the group/.test(renderTemple())") is True)

    # ── 3. Who holds the pen ──────────────────────────────────────────
    ck("the office may author it", safe(pg, "()=>mayAuthor('u_plan','group')") is True)
    safe(pg, "()=>switchViewer('ceo')"); pg.wait_for_timeout(300)
    ck("the group CEO may not", safe(pg, "()=>mayAuthor('u_plan','group')") is False)
    ck("…but reports it", safe(pg, "()=>canReport('group')") is True)
    head = "mobhead"
    if True:
        safe(pg, "()=>switchViewer('%s')" % head); pg.wait_for_timeout(300)
        ck("a unit head neither authors nor reports it",
           safe(pg, "()=>[mayAuthor('u_plan','group'), canReport('group')]") == [False, False],
           safe(pg, "()=>[mayAuthor('u_plan','group'), canReport('group')]"))
    safe(pg, "()=>switchViewer(PEOPLE.find(p=>p.role==='super').key)"); pg.wait_for_timeout(300)

    # ── 4. Reporting, Performance, board, deck ────────────────────────
    t1 = tabs()
    ck("with a plan the orange Reporting tab is last of the group's own", "report" in t1, t1)
    safe(pg, "()=>{current='group'; currentSub='report'; paint()}"); pg.wait_for_timeout(250)
    rep = safe(pg, "()=>document.querySelector('#panel').innerText", "") or ""
    ck("Reporting asks the pillar's measure and tactic", "Group revenue" in rep and "Open the hub" in rep, rep[:300])
    ck("…and not the Foundation's objectives", "KEY OBJECTIVES" not in rep.upper().split("PILLARS")[0], rep[:200])
    safe(pg, "()=>{currentSub='performance'; paint()}"); pg.wait_for_timeout(250)
    ck("Performance carries the own-plan card", "OWN PLAN" in (safe(pg, "()=>document.querySelector('#panel').innerText", "") or "").upper())
    perf1 = safe(pg, "()=>[groupKeyObjectives(), groupUnitsObjectives()].map(x=>x==null?null:Math.round(x*100)/100)", [])
    ck("…and every existing figure is unmoved", perf0 == perf1, [perf0, perf1])
    board = safe(pg, "()=>boardUnitTargets()", []) or []
    ck("the cycle board's first row is the top layer", board[:1] == ["group"], board[:3])
    ck("…reported by the SMO team", safe(pg, "()=>boardWho('group')", "") == "SMO team", safe(pg, "()=>boardWho('group')"))
    heads = safe(pg, "()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('group'); return [...d.querySelectorAll('.dslide')].map(s=>((s.querySelector('h2,h1')||{}).textContent||''))}", []) or []
    ck("the deck carries the SWOT and, per pillar, key measures and tactics",
       any("SWOT" in h for h in heads) and any("GR01" in h and "Key measures" in h for h in heads)
       and any("GR01" in h and "Tactics" in h for h in heads), heads[:14])

    # ── 5. The Capabilities card ──────────────────────────────────────
    safe(pg, "()=>{delete GROUP.structure;}")
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]'))
    ck("the set-up flow opens on Structure", ok and press(pg, '.wzstep[data-step="structure"]'))
    ck("a fifth card is the capabilities'", safe(pg, "()=>!!document.querySelector('[data-stcard=\"cap\"]')") is True)
    ck("…whose plan names pillars and projects only",
       safe(pg, "()=>[...document.querySelectorAll('[data-stway^=\"cap|\"]')].map(x=>x.dataset.stway.split('|')[1]).sort().join(',')") == "pillars,projects")
    ck("…and nothing is stored while it only holds the functions' answers",
       safe(pg, "()=>!GROUP.structure || !GROUP.structure.cap") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    ck("while it is On the Temple draws the capability base",
       'class="stylobate"' in (safe(pg, "()=>renderTemple()", "") or ""))
    ck("pressing Off on it", press(pg, '[data-stsec="cap|layer"] button:nth-child(2)'))
    ck("…stores that this client has none", safe(pg, "()=>SMPRules.capExists(GROUP)") is False,
       safe(pg, "()=>JSON.stringify(GROUP.structure&&GROUP.structure.cap)"))
    ck("…and the Temple draws no capability base",
       'class="stylobate"' not in (safe(pg, "()=>renderTemple()", "x stylobate") or "class=\"stylobate\""))

    ck("no page errors", not errs, errs[:3])
    b.close()
print("%d FAILED" % bad if bad else "all good")
sys.exit(1 if bad else 0)
