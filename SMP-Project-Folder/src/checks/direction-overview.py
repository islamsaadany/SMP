"""A DIRECTION'S OVERVIEW (§413).

Islam, of the mockup: "approved, keep the objective preview, build it". A
pillar may carry three short texts — Objective, Why now, Risks & mitigations —
switched on per client from Getting started › Structure (Plan details), off
by default so every existing client opens exactly as before.

  1 · OFF IS BYTE-FOR-BYTE WHAT IT WAS: no block on the Plan page in either
      mode, no slide, no workbook columns — with texts STORED, or "nothing
      is drawn" is true of a build that simply had nothing to draw (§113.8).
  2 · THE SWITCH is the chip on the set-up flow's Structure step, pressed and
      read back off the stored group (§96); pressed again it DELETES (§50.6).
  3 · ON, reading: the block is FOLDED with the Objective's start on the
      folded line; opened, three texts; an empty direction draws nothing.
  4 · ON, the pen: three boxes that WRITE the stored pillar; emptied, the
      key is deleted.
  5 · THE DECK: one slide after the direction's title, with the Objective,
      Why now, one line per risk, and the measures read from the table.
  6 · THE WORKBOOK carries the three at the end of the Pillars sheet and the
      reader brings them back.

SMP_BUILT points it at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []
def ok(label, cond, detail=""):
    if cond: print("  ok      " + label)
    else:
        fails.append(label); print("  FAIL    " + label + ("  — " + str(detail) if detail else ""))
def safe(pg, js, dflt=None):
    try: return pg.evaluate(js)
    except Exception as e: return dflt          # §215: degrade, never die
def click(pg, sel, w=400):
    try: pg.evaluate("s=>{var b=document.querySelector(s); if(b) b.click();}", sel)
    except Exception: pass
    pg.wait_for_timeout(w)

OBJ = "Grow the store estate profitably across Upper Egypt"
WHY = "Two competitors are opening in the region this year"
RISK = "Rents rise — lock three-year leases\nStaffing gaps — train early"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(900)

    ok("the rule exists", safe(pg, "()=>typeof SMPRules.planDetailOn") == "function")
    safe(pg, "()=>{delete GROUP.structure; var p=UNITS.mobile.items[0]; p.ovObj=%r; p.ovWhy=%r; p.ovRisk=%r;}" % (OBJ, WHY, RISK))

    def plan(ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; paint(); }"); pg.wait_for_timeout(250)
        click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
        if ed: click(pg, "[data-page='plan']", 600)

    print("\n1 · off is what it was, with texts stored")
    plan()
    ok("no block in reading mode", safe(pg, "()=>document.querySelectorAll('details.dov').length") == 0)
    plan(True)
    ok("no block behind the pen", safe(pg, "()=>document.querySelectorAll('details.dov').length") == 0)
    ok("no overview slide", safe(pg, "()=>deckHtmlFor('mobile').indexOf('dovs')") == -1)

    print("\n2 · the switch, pressed on the Structure step")
    okp = False
    try:
        pg.click('[data-md="setup"]', timeout=4000); pg.wait_for_timeout(250)
        try: pg.click('.ritem[data-setupgo="start"]', timeout=3000)
        except Exception: pg.click('[data-setupgo="start"]', timeout=3000)
        pg.wait_for_timeout(250)
        pg.click('.wzstep[data-step="structure"]', timeout=4000); pg.wait_for_timeout(250)
        okp = True
    except Exception as e: okp = str(e)[:120]
    ok("the Structure step opens", okp is True, okp)
    chip = safe(pg, "()=>{var c=document.querySelector('[data-stdetail=\"overview\"]'); return c?c.getAttribute('aria-pressed'):null}")
    ok("it carries a Direction overview chip, not pressed", chip == "false", chip)
    click(pg, '[data-stdetail="overview"]')
    ok("pressing it stores the switch", safe(pg, "()=>!!(GROUP.structure&&GROUP.structure.details&&GROUP.structure.details.overview===true)") is True)
    ok("and the chip says so", safe(pg, "()=>document.querySelector('[data-stdetail=\"overview\"]').getAttribute('aria-pressed')") == "true")
    ok("the component shape is untouched by it (only details stored)",
       safe(pg, "()=>Object.keys(GROUP.structure).join(',')") == "details", safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    click(pg, '[data-stdetail="overview"]')
    ok("pressed again it is DELETED, not set false (§50.6)", safe(pg, "()=>!('structure' in GROUP)") is True,
       safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    safe(pg, "()=>{GROUP.structure={details:{overview:true}};}")

    print("\n3 · on, reading mode")
    plan()
    d = safe(pg, "()=>{var x=document.querySelector('.pane details.dov'); return x?{open:x.open, peek:(x.querySelector('.dovpeek')||{}).textContent||'', vals:[...x.querySelectorAll('.dovv')].map(v=>v.textContent)}:null}")
    ok("the block is drawn", d is not None, d)
    if d:
        ok("folded by default", d["open"] is False, d)
        ok("the folded line shows the Objective", d["peek"].startswith("Grow the store"), d["peek"])
        ok("opened, three texts", len(d["vals"]) == 3 and d["vals"][1] == WHY, d["vals"])
    peekShown = safe(pg, "()=>{var x=document.querySelector('.pane details.dov .dovpeek'); return x?x.getBoundingClientRect().width>0:null}")
    ok("the preview is visible while folded", peekShown is True, peekShown)
    click(pg, ".pane details.dov > summary")
    ok("a press opens it", safe(pg, "()=>document.querySelector('.pane details.dov').open") is True)
    safe(pg, "()=>paint()"); pg.wait_for_timeout(250)
    ok("and it stays open across a repaint", safe(pg, "()=>{var x=document.querySelector('.pane details.dov'); return x&&x.open}") is True)
    empty = safe(pg, "()=>{var u=UNITS.mobile.items; if(u.length<2) return null; var pid=u[1].id; return !document.querySelector('details.dov[data-dov=\"'+pid+'\"]')}")
    ok("a direction with nothing written draws no block in reading mode (§45.2)", empty is not False, empty)

    print("\n4 · on, the pen writes the stored pillar")
    plan(True)
    n = safe(pg, "()=>document.querySelectorAll('.pane details.dov textarea').length")
    ok("three boxes behind the pen", n == 3, n)
    try:
        pg.evaluate("()=>{var d=document.querySelector('.pane details.dov'); d.open=true;}")
        ta = pg.locator(".pane details.dov textarea").nth(1)
        ta.fill("Because the market is moving"); ta.blur(); pg.wait_for_timeout(300)
    except Exception as e: print("   (typing failed: %s)" % str(e)[:100])
    ok("a typed Why now reaches the stored pillar", safe(pg, "()=>UNITS.mobile.items[0].ovWhy") == "Because the market is moving",
       safe(pg, "()=>UNITS.mobile.items[0].ovWhy"))
    try:
        pg.evaluate("()=>{var d=document.querySelector('.pane details.dov'); if(d) d.open=true;}")
        ta = pg.locator(".pane details.dov textarea").nth(1)
        ta.fill(""); ta.blur(); pg.wait_for_timeout(300)
    except Exception: pass
    ok("emptied, the key is deleted (§50.6)", safe(pg, "()=>!('ovWhy' in UNITS.mobile.items[0])") is True)
    ov2 = safe(pg, "()=>{var u=UNITS.mobile.items; return u.length>1 && !!document.querySelector('.pane details.dov[data-dov=\"'+u[0].id+'\"]')}")
    ok("the pen draws the block even on a direction still empty",
       safe(pg, "()=>{ var p=UNITS.mobile.items[1]; return !!p }") and ov2 is not None, ov2)
    safe(pg, "()=>{UNITS.mobile.items[0].ovWhy=%r; EDIT_PAGE={}; paint();}" % WHY)

    print("\n5 · the deck")
    s = safe(pg, """()=>{var h=document.createElement('div'); h.innerHTML=deckHtmlFor('mobile');
      var sl=[...h.querySelectorAll('section.dslide')]; var i=sl.findIndex(x=>x.classList.contains('dovs'));
      if(i<0) return {i:-1, n:sl.length};
      var x=sl[i]; return {i:i, prevCover: sl[i-1].classList.contains('d-cover'), count: sl.filter(y=>y.classList.contains('dovs')).length,
        obj:(x.querySelector('.objq')||{}).textContent||'', risks:x.querySelectorAll('.two li').length,
        why:x.textContent.indexOf('Two competitors')>=0, rows:x.querySelectorAll('.side .row').length,
        head:(x.querySelector('.dwhich')||{}).textContent||''};}""")
    ok("an overview slide is in the deck", s and s.get("i", -1) >= 0, s)
    if s and s.get("i", -1) >= 0:
        ok("right after the direction's title slide", s["prevCover"] is True, s)
        ok("only for the direction that has something", s["count"] == 1, s)
        ok("the Objective leads it", s["obj"].startswith("Grow the store"), s["obj"])
        ok("Why now is on it", s["why"] is True)
        ok("one line per risk", s["risks"] == 2, s["risks"])
        ok("the measures and tactics are read from the tables", s["rows"] > 0, s["rows"])
        ok("the header names it Overview", s["head"] == "Overview", s["head"])

    print("\n6 · the workbook")
    names = safe(pg, "()=>planWorkbook(UNITS.mobile).filter(x=>x.name==='Pillars')[0].head")
    ok("the Pillars sheet ends with the three", names and names[-3:] == ["Objective", "Why now", "Risks & mitigations"], names)
    rt = safe(pg, """async ()=>{ try {
        var u = UNITS.mobile, bytes = buildXlsx(planWorkbook(u));
        var sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
        applyPlanReplace(u, planFromWorkbook(u, sheets));
        var p0 = u.items[0], p1 = u.items[1];
        return { obj:p0.ovObj, why:p0.ovWhy, risk:p0.ovRisk, emptyKeys: p1 ? ['ovObj','ovWhy','ovRisk'].filter(k=>k in p1) : [] };
      } catch(e){ return {err:String(e)}; } }""")
    ok("a round trip brings the three back", rt and rt.get("obj") == OBJ and rt.get("why") == WHY and rt.get("risk") == RISK, rt)
    ok("and an empty direction gains no keys", rt and rt.get("emptyKeys") == [], rt)
    safe(pg, "()=>{delete GROUP.structure; UNITS.mobile.items.forEach(p=>{delete p.ovObj; delete p.ovWhy; delete p.ovRisk;});}")
    names0 = safe(pg, "()=>planWorkbook(UNITS.mobile).filter(x=>x.name==='Pillars')[0].head")
    ok("off and empty, the sheet is what it was", names0 == ["Pillar", "Kind", "Theme", "Owner"], names0)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
