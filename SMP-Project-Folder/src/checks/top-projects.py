"""The company plans in projects (§466).

Islam: *"agreed, build stage 3"* — the company's own plan (the Directions card)
may be planned in projects instead of pillars, on three decisions: pillars
already written are hidden and kept when it switches, and come back when it
switches back; a company project's named owner enters its figures and the
office submits; and on Performance the projects take the place of the
directions' score.

It MAKES its state (§255): no client plans its top layer in projects, so every
assertion here would pass on a build that lost the feature. Both ends
throughout (§94.2): the owner reports their own project AND is refused the
next one, the office submits AND the owner cannot, the projects card is drawn
AND the pillars card is not, the pillars come back AND the projects are kept.

SMP_BUILT points it at another build (falsified from the SOURCES, §276).
"""
import os
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
        el.click(); pg.wait_for_timeout(300); return True
    except Exception: return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    secs = lambda: safe(pg, "()=>allowed(allowed(SUBS.group,'group').filter(d=>d.k==='strategy')[0].sections(),'group').map(d=>d.k+':'+d.label)", []) or []
    tabs = lambda: safe(pg, "()=>allowed(SUBS.group,'group').map(d=>d.k)", []) or []

    # ── 1. A company planning in pillars, with one direction written ──
    safe(pg, """()=>{GROUP.structure={top:{on:SMPRules.STRUCT_COMPONENTS.slice(),temple:true}};
      GROUP.items=[{id:'group-P1',code:'EA01',name:'Grow the core',sub:'',kind:'',theme:'',owner:'',
        measures:[{id:'group-P1-M1',name:'Revenue',dir:'>=',target:'100',compile:'Latest',actual:'80'}],tactics:[]}];
      current='group'; currentSub='strategy'; CURSEC.strategy='plan'; paint()}""")
    pg.wait_for_timeout(300)
    ck("pillars by default: the way is pillars", safe(pg, "()=>topWay()") == "pillars")
    ck("…and the plan section is there", any(s.startswith("plan:") for s in secs()), secs())

    # ── 2. The switch warns, then hides and keeps ─────────────────────
    safe(pg, "()=>switchPlanWay('top','group','projects')"); pg.wait_for_timeout(300)
    msg = safe(pg, "()=>{var m=document.getElementById('modal-b'); return m?m.innerText:''}", "") or ""
    ck("switching with a direction written asks first", "hidden and kept" in msg, msg[:200])
    ck("…and nothing has moved before the answer", safe(pg, "()=>topWay()") == "pillars")
    press(pg, "#modal-b [data-rmyes]")
    ck("Yes: the company plans in projects", safe(pg, "()=>topWay()") == "projects")
    ck("…stored on the structure", safe(pg, "()=>GROUP.structure.top.plan.way") == "projects")
    ck("…and the direction is kept, not deleted", safe(pg, "()=>GROUP.items.length") == 1)
    plan = [s for s in secs() if s.startswith("plan:")]
    # With business units the section keeps its "Plan" name; alone, the
    # company's plan takes the projects word, never the pillars one.
    want_lab = safe(pg, "()=>SMPRules.planTitle(GROUP,'group','projects') || (buExists() ? 'Plan' : labelWord('project','bu'))")
    ck("the plan section is called by its projects title", plan == ["plan:" + str(want_lab)], (plan, want_lab))
    safe(pg, "()=>{GROUP.structure.bu={exists:false}}")
    plan2 = [s for s in secs() if s.startswith("plan:")]
    ck("…and alone, by the projects word rather than the pillars one",
       plan2 == ["plan:" + (safe(pg, "()=>labelWord('project','bu')") or "")], plan2)
    safe(pg, "()=>{delete GROUP.structure.bu}")
    ck("with no project yet there is no Reporting tab", "report" not in tabs(), tabs())
    ck("…and the hidden direction scores nothing: no direction card on Performance",
       safe(pg, "()=>{current='group';currentSub='performance';paint();return [...document.querySelectorAll('#panel .card-head, #panel h3, #panel .ttl')].map(x=>x.textContent).join('|')}", "").lower().count("own plan") == 0)

    # ── 3. The office adds projects with the pen ──────────────────────
    safe(pg, "()=>{current='group'; currentSub='strategy'; CURSEC.strategy='plan'; EDIT_PAGE.plan=true; paint()}"); pg.wait_for_timeout(300)
    ok = press(pg, "#panel [data-rowadd='project|u:group']")
    ck("the empty plan offers Add a project, and it adds one", ok and safe(pg, "()=>GROUP.topProjects.length") == 1)
    press(pg, "#panel [data-rowadd='project|u:group']")
    safe(pg, """()=>{var a=GROUP.topProjects;
      a[0].name='Open new stores'; a[0].owner='Testcase Project Owner';
      a[0].outcomes=[{id:a[0].id+'-O1',name:'Revenue',dir:'>=',target:'100',actual:'50',progress:50}];
      a[1].name='Digital channel'; a[1].owner='Somebody Else Entirely';
      a[1].outcomes=[{id:a[1].id+'-O1',name:'Share',dir:'>=',target:'10',actual:'10',progress:100}];
      PEOPLE.push({key:'t463',name:'Testcase Project Owner',unit:'group'});
      EDIT_PAGE.plan=false; paint();}""")
    ck("with a project the Reporting tab appears", "report" in tabs(), tabs())

    # ── 4. Who reports what ───────────────────────────────────────────
    gate = "()=>{var a=GROUP.topProjects; return [canReportFnProject('u:group',a[0]),canReportFnProject('u:group',a[1]),canReportFnWhole('u:group'),canSpeakFor('group')]}"
    ck("the office reports both projects and submits", safe(pg, gate) == [True, True, True, True], safe(pg, gate))
    safe(pg, "()=>switchViewer('t463')"); pg.wait_for_timeout(300)
    g = safe(pg, gate)
    ck("the named owner reports their own project", bool(g) and g[0] is True, g)
    ck("…and is refused the other project", bool(g) and g[1] is False, g)
    ck("…and does not submit the company's report", bool(g) and g[2] is False and g[3] is False, g)
    safe(pg, "()=>{current='group'; currentSub='report'; paint()}"); pg.wait_for_timeout(300)
    ck("their Reporting page draws without an error", not errs, errs)
    safe(pg, "()=>switchViewer('smo')"); pg.wait_for_timeout(300)

    # ── 5. Performance: the projects take the directions' place ───────
    safe(pg, "()=>{current='group'; currentSub='performance'; paint()}"); pg.wait_for_timeout(300)
    want = safe(pg, "()=>{var v=capPerf(unitOwnHolder('group')); return v==null?null:Math.round(v)}")
    txt = safe(pg, "()=>document.getElementById('panel').innerText", "") or ""
    pw = safe(pg, "()=>labelWord('project','bu')") or ""
    ck("a projects card is drawn", (pw + " — performance").lower() in txt.lower() or (pw + " — performance").lower() in txt.lower(), txt[:300])
    ck("…carrying the projects' own average", want is not None and (str(want) + "%") in txt, want)
    ck("…and it is not the hidden direction's 80%", want != 80, want)

    # ── 6. The set-up flow's Directions card says how it plans ────────
    ok = press(pg, '[data-md="setup"]') and (press(pg, '.ritem[data-setupgo="start"]') or press(pg, '[data-setupgo="start"]')) and press(pg, '.wzstep[data-step="structure"]')
    ck("the Directions card carries a plans-in choice", ok and safe(pg, "()=>{var s=document.querySelector('[data-stcard=\"dir\"] select[data-wztopway]'); return s?s.value:null}") == "projects")
    try: pg.select_option('[data-stcard="dir"] select[data-wztopway]', "pillars", timeout=3000)
    except Exception: pass
    pg.wait_for_timeout(300)
    press(pg, "#modal-b [data-rmyes]")
    ck("switching back from the card: pillars", safe(pg, "()=>topWay()") == "pillars")
    ck("…the direction comes back", safe(pg, "()=>GROUP.items.length") == 1)
    ck("…and the projects are kept", safe(pg, "()=>GROUP.topProjects.length") == 2)
    ck("…and the way is stored as an absence", safe(pg, "()=>!(GROUP.structure.top.plan && GROUP.structure.top.plan.way)") is True)
    ck("no page error anywhere", not errs, errs)
    b.close()
print("all good" if not bad else "%d FAILED" % bad)
