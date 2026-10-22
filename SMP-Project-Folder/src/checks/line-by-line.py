"""Line by line, and where the two readings come from (§575, §576).

Islam: *"give me an option … to present box by box like line by line in the
tables and number by number in the numbers slides"* — asked: the switch in
the slide view beside Columns, the office's and the company's; the key
measures, categories and tactics tables, the projects' slides and "Where it
stands", NOT the objectives or the SWOT; ← taking back one line at a time.
And *"for the overall performance slide with the final 2 numbers we need to
give a detail below the 2 numbers to show where the numbers are coming
from"* — the lines themselves, under each reading.

It MAKES its state (§255): El Abd's shape, the company planning its own
directions. BOTH ENDS (§94.2): off, a step is a slide; on, a step is a line;
the office gets the switch and a unit's custodian does not; the PDF, the
editor's rail and the guided tour's example are never built. SMP_BUILT points
it at another build (§276).
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

MAKE = """()=>{
  var src=UNITS.mobile.items;
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = ['Maximizing Current Stores','New Store Expansion'].map(function(n,i){
    var p=JSON.parse(JSON.stringify(src[i])), id='group-P'+(i+1);
    p.id=id; p.name=n; p.code=''; p.owner='Owner '+(i+1); p.sub=''; p.theme=''; p.kind='';
    (p.measures||[]).forEach(function(m,k){ m.id=id+'-M'+(k+1); });
    (p.tactics||[]).forEach(function(t,k){ t.id=id+'-T'+(k+1); });
    return p; });
  current='group'; currentSub='performance'; paint(); return true}"""

VIS = """()=>{var s=DECK.slides[DECK.i]; return {i:DECK.i, split:s.dataset.split||'', head:s.classList.contains('d-head'),
  cont:!!s.dataset.cont, bn:s.dataset.bn==null?null:+s.dataset.bn,
  shown:[...s.querySelectorAll('tbody > tr, .headgrid > .headcell, .pcards > *')].filter(r=>!r.classList.contains('bhide')).length,
  all:[...s.querySelectorAll('tbody > tr, .headgrid > .headcell, .pcards > *')].length}}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    safe(pg, "()=>{switchViewer('%s'); return true}" % office); pg.wait_for_timeout(300)
    safe(pg, MAKE); pg.wait_for_timeout(300)

    # ── 1. The switch: in the slide view, the office's, the company's ──────
    safe(pg, "()=>{slidesOpen('dir','group-P1'); return true}"); pg.wait_for_timeout(700)
    btn = "#slideroot [data-slbuild]"
    ck("the slide view has a Line by line switch beside Columns, for the office",
       safe(pg, "()=>{var b=document.querySelector('%s'); return !!b && !b.hidden && b.previousElementSibling.id==='slcols'}" % btn) is True)
    ck("…off until it is pressed, and stored as nothing", safe(pg, "()=>!('slideBuild' in GROUP) && document.querySelector('%s').getAttribute('aria-pressed')==='false'" % btn) is True)
    safe(pg, "()=>{document.querySelector('%s').click(); return true}" % btn); pg.wait_for_timeout(300)
    ck("pressing it turns it on: the company's, stored as true, the button pressed",
       safe(pg, "()=>GROUP.slideBuild===true && document.querySelector('%s').getAttribute('aria-pressed')==='true'" % btn) is True)
    safe(pg, "()=>{document.querySelector('%s').click(); return true}" % btn); pg.wait_for_timeout(300)
    ck("…and again turns it off, leaving nothing stored", safe(pg, "()=>!('slideBuild' in GROUP)") is True)
    rail = safe(pg, "()=>{GROUP.slideBuild=true; slidesPaint(); return document.querySelectorAll('#slideroot .bhide, #slideroot .building').length}")
    ck("the editor's own slides are never built — every line is there to arrange", rail == 0, rail)
    safe(pg, "()=>{slidesClose(); return true}"); pg.wait_for_timeout(300)

    # ── 2. Off: a step is a slide, as it always was ───────────────────────
    safe(pg, "()=>{delete GROUP.slideBuild; openDeckFor('dir:group-P1'); return true}"); pg.wait_for_timeout(700)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(300)
    v = safe(pg, VIS) or {}
    ck("off, the next press brings the key measures slide whole", v.get("split", "").endswith("M") and v.get("shown") == v.get("all") and v.get("bn") is None, v)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(300)
    ck("…and the next one the tactics slide", (safe(pg, VIS) or {}).get("split", "").endswith("T"))
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)

    # ── 3. On: a step is a line ───────────────────────────────────────────
    safe(pg, "()=>{GROUP.slideBuild=true; openDeckFor('dir:group-P1'); return true}"); pg.wait_for_timeout(700)
    walk = []
    for k in range(40):
        walk.append(safe(pg, VIS) or {})
        last = walk[-1]
        if last.get("i") == safe(pg, "()=>DECK.slides.length-1"): break
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120)
    m = [x for x in walk if x.get("split", "").endswith("M")]
    ck("on, the key measures slide arrives with its headings alone, then one row per press",
       [x["shown"] for x in m] == list(range(0, m[0]["all"] + 1)) if m else False, [x.get("shown") for x in m])
    t = [x for x in walk if x.get("split", "").endswith("T") and not x.get("cont")]
    ck("…the tactics slide the same", t and [x["shown"] for x in t] == list(range(0, t[0]["all"] + 1)), [x.get("shown") for x in t])
    c = [x for x in walk if x.get("cont")]
    ck("…and a table continued on the next slide builds again from its first row",
       c and c[0]["shown"] == 0 and c[-1]["shown"] == c[0]["all"], [x.get("shown") for x in c])
    h = [x for x in walk if x.get("head")]
    ck("\"Where it stands\" comes in one reading at a time", [x["shown"] for x in h] == [0, 1, 2], [x.get("shown") for x in h])
    ck("the cover and Thank you, which have no lines, are one press each",
       len([x for x in walk if x.get("all") == 0]) == 2 and walk[-1].get("bn") is None, [x.get("i") for x in walk if x.get("all") == 0])
    # back: one line at a time, then the slide before whole, then its lines
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(150)
    b1 = safe(pg, VIS) or {}
    pg.keyboard.press("ArrowLeft"); pg.wait_for_timeout(150)
    b2 = safe(pg, VIS) or {}
    ck("← from the last slide goes back to \"Where it stands\", whole", b1.get("head") and b1.get("shown") == 2, b1)
    ck("…and the next ← takes its last reading away", b2.get("head") and b2.get("shown") == 1, b2)
    safe(pg, "()=>{deckShow(1); return true}"); pg.wait_for_timeout(150)
    v = safe(pg, VIS) or {}
    ck("a jump (the dots, Home, End) lands on a whole slide", v.get("shown") == v.get("all") and v.get("bn") is None, v)
    # a tactic's lines: one unit per numbered row, and every row in one
    g = safe(pg, """()=>{var s=DECK.slides.find(x=>/T$/.test(x.dataset.split||'')); var u=deckBuildUnits(s);
      return {units:u.length, idx:s.querySelectorAll('tbody > tr td.idx').length, rows:s.querySelectorAll('tbody > tr').length,
              covered:u.reduce((a,x)=>a+x.length,0)}}""") or {}
    ck("a line is a tactic: one per numbered row, its outcome lines riding with it",
       g.get("units") == g.get("idx") and g.get("covered") == g.get("rows"), g)
    # paper: every line
    safe(pg, "()=>{var s=DECK.slides.find(x=>/M$/.test(x.dataset.split||'')); deckShow(DECK.slides.indexOf(s)); deckBuildShow(s,1); return true}")
    pg.emulate_media(media="print"); pg.wait_for_timeout(200)
    hid = safe(pg, "()=>[...document.querySelectorAll('#deckroot .bhide')].filter(e=>+getComputedStyle(e).opacity<1).length")
    pg.emulate_media(media="screen")
    ck("on paper every line is there", hid == 0, hid)
    safe(pg, "()=>{closeDeck(); return true}"); pg.wait_for_timeout(200)

    # ── 4. Not the objectives or the SWOT; the projects yes ────────────────
    obj = safe(pg, """()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('mobile');
      return [...d.querySelectorAll('.dslide')].filter(s=>s.classList.contains('d-swot')||/Key Objectives|What we are aiming/.test((s.querySelector('h2')||{}).textContent||''))
        .map(s=>deckBuildUnits(s).length)}""") or []
    ck("a unit's objectives and SWOT slides never build (Islam: objectives & SWOT no)",
       len(obj) >= 5 and all(n == 0 for n in obj), obj)
    prj = safe(pg, """()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('fn:finance');
      return [...d.querySelectorAll('.dslide')].filter(s=>/D$|M$/.test(s.dataset.split||'')||s.querySelector('.pcards,table.dirs'))
        .map(s=>deckBuildUnits(s).length)}""") or []
    ck("a function's projects slides do — the cards, the deliverables, the milestones, where they stand (Islam: projects yes)",
       len(prj) >= 4 and all(n > 0 for n in prj), prj)

    # ── 5. The guided tour's example is never built ──────────────────────
    safe(pg, "()=>{exampleTourOpen(); return true}"); pg.wait_for_timeout(700)
    ck("with the switch on, the guided tour's example still steps by its own stops",
       safe(pg, "()=>deckBuildOn()===false && document.querySelectorAll('#deckroot .bhide').length===0 && !!DTOUR") is True)
    safe(pg, "()=>{closeDeck(); delete GROUP.slideBuild; return true}"); pg.wait_for_timeout(200)

    # ── 6. Where the two readings come from (§575) ────────────────────────
    d = safe(pg, """()=>{var x=dirPillar('dir:group-P1'), p=x.p; var box=document.createElement('div'); box.innerHTML=deckHtmlFor('dir:group-P1');
      var s=box.querySelector('.d-head'); var cells=s.querySelectorAll('.headcell');
      var km=[...cells[0].querySelectorAll('.headdetail li:not(.hdmore):not(.hdnote)')].map(li=>[li.querySelector('.hdn').textContent, li.querySelector('.hdf').textContent]);
      var ex=[...cells[1].querySelectorAll('.headdetail li:not(.hdmore):not(.hdnote)')].map(li=>li.querySelector('.hdn').textContent);
      return {km:km, want:scorableMeasures(p).map(m=>[m.name, measureScore(m)+'%']),
              ex:ex, wantEx:reportedTactics(p).map(t=>t.name),
              note:(cells[1].querySelector('.hdnote')||{}).textContent||'',
              notDue:SMPRules.shown(p.tactics).length-dueTactics(p).length,
              avg:avg(scorableMeasures(p).map(m=>measureScore(m))), perf:pillarPerf(p)}}""") or {}
    ck("under Key measures, each key measure with its own figure — the lines the reading averages",
       d.get("km") == d.get("want") and d.get("avg") == d.get("perf"), d)
    ck("under Execution, each tactic it counts", d.get("ex") == d.get("wantEx"), d)
    ck("…and what it leaves out, said", (d.get("notDue", 0) == 0) or ("Not counted: %d not due" % d["notDue"]) in d.get("note", ""), d.get("note"))
    many = safe(pg, """()=>{var p=dirPillar('dir:group-P1').p; var base=p.measures[0];
      for (var k=0;k<4;k++){ var m=JSON.parse(JSON.stringify(base)); m.id='extra-'+k; m.name='Extra '+k; p.measures.push(m); }
      var box=document.createElement('div'); box.innerHTML=deckHtmlFor('dir:group-P1');
      var c=box.querySelector('.d-head .headcell'); return {lines:c.querySelectorAll('.headdetail li:not(.hdmore):not(.hdnote)').length,
        more:(c.querySelector('.hdmore')||{}).textContent||'', n:scorableMeasures(p).length}}""") or {}
    ck("a long list shows five and says how many more", many.get("lines") == 5 and many.get("more") == "and %d more" % (many.get("n", 0) - 5), many)
    unit = safe(pg, "()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('mobile'); return d.querySelectorAll('.d-head .headdetail').length}")
    ck("the detail is a direction's: a unit's \"Where the unit stands\" is as it was", unit == 0, unit)
    fit = safe(pg, """()=>{openDeckFor('dir:group-P2'); var s=DECK.slides.find(x=>x.classList.contains('d-head')); deckShow(DECK.slides.indexOf(s));
      return s.scrollHeight<=s.clientHeight+1}""")
    ck("with the detail, \"Where it stands\" still fits its slide", fit is True, fit)
    safe(pg, "()=>{closeDeck(); return true}")

    # ── 7. Not the office: no switch ──────────────────────────────────────
    cust = safe(pg, "()=>{var u=Object.keys(UNITS)[0]; var r=(typeof unitRoles!=='undefined')?null:null; return (PEOPLE.find(p=>!SMPRules.mayMasterPresent(world(), p) && personRoles(p).some(r=>r.role==='custodian'))||{}).key}")
    if cust:
        safe(pg, "()=>{switchViewer('%s'); paint(); return true}" % cust); pg.wait_for_timeout(400)
        safe(pg, "()=>{var u=Object.keys(UNITS).find(k=>canSpeakFor(k)); if(u) slidesOpen('unit', u); return true}"); pg.wait_for_timeout(600)
        ck("somebody outside the office does not get the switch",
           safe(pg, "()=>{var r=document.getElementById('slideroot'); var b=r.querySelector('[data-slbuild]'); return !r.classList.contains('on') || !b || b.hidden}") is True)

    ck("no page errors", not errs, errs[:3])
    b.close()
print("FAILED" if bad else "all green", bad)
raise SystemExit(1 if bad else 0)
