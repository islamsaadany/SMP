"""SEVERAL OUTCOMES PER TACTIC (§414).

Islam, of the mockup: "approved, build it". A tactic may carry more than one
outcome; each is scored against its own target and the tactic reads as their
average. Off by default — a Plan details switch on Getting started ›
Structure — so every existing client opens exactly as before.

  1 · OFF IS WHAT IT WAS, with an extra STORED — no sub-line on Plan,
      Performance, Reporting or the deck, and the tactic's score is the
      first outcome's alone (§113.8: "nothing is drawn" is true of a build
      with nothing to draw).
  2 · THE SWITCH is a chip on the Structure step, read back off the stored
      group (§96); pressed again the key is DELETED (§50.6).
  3 · ON, THE PLAN: an O2 line under the tactic, the shared cells spanning
      it, the line wearing its tactic's stripe (and the next tactic keeping
      its own), and the pen's "+ Add an outcome", its box and its × all
      WRITE the stored tactic.
  4 · ON, REPORTING: a box per outcome, and a figure typed into O2's reaches
      the stored `outActs`; the tactic is not scored until both have one,
      then it is the rounded average — asserted as AGREEMENT with the two
      outcome scores, never a literal (§94.8).
  5 · ON, PERFORMANCE: each line its own figure, Progress "average of 2".
  6 · THE DECK: the O2 line follows its tactic, and the fit pass moves the
      group whole.
  7 · MISSING: an extra with no target is a gap the office's count sees.
  8 · THE WORKBOOK: an Outcomes sheet that round-trips, and a line whose
      tactic cannot be matched is refused by name.

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

T = "UNITS.mobile.items[0].tactics[0]"
SEED = "()=>{var t=%s; t.outs=[{id:'O2', outDir:'\\u2265', outcome:'SKU master data complete', outTarget:'95%%'}]; delete t.outActs;}" % T

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(900)

    ok("the readers exist", safe(pg, "()=>typeof tacticOutcomes") == "function")
    ok("the tactic is measured by its first outcome", safe(pg, "()=>!!outcomeOf(%s)" % T) is True)
    before = safe(pg, "()=>tacticOutcomeScore(%s)" % T)
    safe(pg, "()=>{delete GROUP.structure;}"); safe(pg, SEED)

    def go(sec=None, ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; paint(); }"); pg.wait_for_timeout(250)
        if sec == "plan":
            click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
            if ed: click(pg, "[data-page='plan']", 600)
        elif sec: click(pg, "[data-s='%s']" % sec, 600)
    def count(sel): return safe(pg, "()=>document.querySelectorAll('#panel %s').length" % sel)

    print("\n1 · off is what it was, with an extra stored")
    go("plan"); ok("no outcome line on Plan", count("tr.osub") == 0, count("tr.osub"))
    go("plan", True); ok("none behind the pen, and no Add", count("tr.osub") == 0 and count("[data-outadd]") == 0)
    go("performance"); ok("none on Performance", count("tr.osub") == 0)
    go("report"); ok("none on Reporting", count("tr.osub") == 0)
    ok("none on the deck", safe(pg, "()=>deckHtmlFor('mobile').indexOf('osub')") == -1)
    ok("the tactic still scores on its first outcome alone",
       safe(pg, "()=>tacticOutcomeScore(%s)" % T) == before, [before, safe(pg, "()=>tacticOutcomeScore(%s)" % T)])

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
    chip = safe(pg, "()=>{var c=document.querySelector('[data-stdetail=\"outcomes\"]'); return c?[c.getAttribute('aria-pressed'), c.textContent]:null}")
    ok("it carries a 'Several outcomes per tactic' chip, not pressed",
       chip and chip[0] == "false" and "Several outcomes" in chip[1], chip)
    click(pg, '[data-stdetail="outcomes"]')
    ok("pressing it stores the switch",
       safe(pg, "()=>!!(GROUP.structure&&GROUP.structure.details&&GROUP.structure.details.outcomes===true)") is True)
    click(pg, '[data-stdetail="outcomes"]')
    ok("pressed again it is DELETED (§50.6)", safe(pg, "()=>!('structure' in GROUP)") is True,
       safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    safe(pg, "()=>{GROUP.structure={details:{outcomes:true}};}")

    print("\n3 · on, the Plan")
    # a second tactic with an extra, so one lead sits on a white row and one on a striped row (§113.8)
    safe(pg, "()=>{UNITS.mobile.items[0].tactics[1].outs=[{id:'O2', outcome:'Second', outTarget:'5%'}];}")
    go("plan")
    st = safe(pg, """()=>{var bg=e=>getComputedStyle(e).backgroundColor;
      return [...document.querySelectorAll('#panel tr.osub')].map(s=>{var l=s.previousElementSibling; while(l&&/osub/.test(l.className)) l=l.previousElementSibling;
        return [bg(s.children[0]), bg(l.children[2])];})}""")
    ok("every outcome line wears its own tactic's ground, on a white row and a striped one",
       st and len(st) >= 2 and len(set(x[1] for x in st)) == 2 and all(x[0] == x[1] for x in st), st)
    safe(pg, "()=>{delete UNITS.mobile.items[0].tactics[1].outs;}")
    go("plan")
    r = safe(pg, """()=>{var s=document.querySelector('#panel tr.osub'); if(!s) return null; var lead=s.previousElementSibling;
      var nx=s.nextElementSibling; while(nx && /opad/.test(nx.className)) nx=nx.nextElementSibling;
      var bg=e=>getComputedStyle(e).backgroundColor;
      return {tag:(s.querySelector('.otag')||{}).textContent, name:s.textContent.indexOf('SKU master data')>=0,
        span:lead.querySelector('td.idx').rowSpan, o1:(lead.querySelector('.otag')||{}).textContent,
        same:bg(s.children[0])===bg(lead.children[2]),   /* never the frozen pair, which paints its own ground (§73.2) */
        nextDiffers: nx ? bg(nx.children[2])!==bg(lead.children[2]) : null}}""")
    ok("an O2 line is drawn under the tactic", r and r["tag"] == "O2" and r["name"], r)
    if r:
        ok("the shared cells span it", r["span"] == 2, r)
        ok("the first outcome is tagged O1", r["o1"] == "O1", r)
        ok("the line wears its tactic's stripe", r["same"] is True, r)
        ok("and the next tactic keeps its own", r["nextDiffers"] is True, r)
    go("plan", True)
    ok("the pen offers + Add an outcome", count("[data-outadd]") >= 1, count("[data-outadd]"))
    click(pg, "#panel [data-outadd]", 500)
    ok("pressing it adds O3 to the stored tactic", safe(pg, "()=>%s.outs.map(x=>x.id).join(',')" % T) == "O2,O3",
       safe(pg, "()=>JSON.stringify(%s.outs)" % T))
    try:
        box = pg.locator("#panel tr.osub").nth(1).locator("textarea, input").first
        box.fill("Stores re-fitted"); box.blur(); pg.wait_for_timeout(300)
    except Exception as e: print("   (typing failed: %s)" % str(e)[:100])
    ok("a name typed on O3's line reaches the stored outcome",
       safe(pg, "()=>(%s.outs[1]||{}).outcome" % T) == "Stores re-fitted", safe(pg, "()=>JSON.stringify(%s.outs)" % T))
    click(pg, "#panel [data-outoff$='|O3']", 500)
    ok("its × removes it", safe(pg, "()=>%s.outs.map(x=>x.id).join(',')" % T) == "O2")

    print("\n4 · on, Reporting")
    go("report")
    box = safe(pg, "()=>!!document.querySelector('#panel input[data-fld=\"outActs:O2\"]')")
    ok("O2 has a box of its own", box is True, box)
    ok("the tactic is not scored until every outcome has a figure",
       safe(pg, "()=>{var t=%s; return tacticOutcomeScore(t)===null || (t.outActual==null||t.outActual==='')}" % T) is True)
    try:
        i = pg.locator('#panel input[data-fld="outActs:O2"]')
        i.fill("88"); i.blur(); pg.wait_for_timeout(400)
    except Exception as e: print("   (typing failed: %s)" % str(e)[:100])
    ok("the figure reaches the stored outActs", safe(pg, "()=>(%s.outActs||{}).O2" % T) in ("88%", "88"),
       safe(pg, "()=>JSON.stringify(%s.outActs)" % T))
    safe(pg, "()=>{var t=%s; if(t.outActual==null||t.outActual==='') t.outActual=String(splitTarget(t.outTarget).value||'1')+(splitTarget(t.outTarget).unit||'');}" % T)
    agree = safe(pg, """()=>{var t=%s, l=tacticOutcomes(t), s=l.map(x=>oneOutcomeScore(t,x.o));
      return {n:l.length, parts:s, score:tacticOutcomeScore(t), avg:Math.round(s.reduce((a,b)=>a+b,0)/s.length)}}""" % T)
    ok("with both reported the tactic is the rounded average of the two",
       agree and agree["n"] == 2 and agree["score"] == agree["avg"], agree)

    print("\n5 · on, Performance")
    go("performance")
    pr = safe(pg, "()=>{var a=document.querySelector('#panel .oavg'); return a?a.textContent:null}")
    ok("Progress says it is an average of 2", pr and "average of 2" in pr.lower(), pr)
    ok("each line carries its own score", count("tr.osub .oscore") >= 1, count("tr.osub .oscore"))

    print("\n6 · the deck")
    dk = safe(pg, """()=>{var h=document.createElement('div'); h.innerHTML=deckHtmlFor('mobile');
      var s=h.querySelector('tr.osub'); if(!s) return null; var lead=s.previousElementSibling;
      return {tag:(s.querySelector('.otag')||{}).textContent, span:lead.querySelector('td.idx').rowSpan,
        avg:!!lead.querySelector('.oavg')}}""")
    ok("the deck draws the O2 line under its tactic", dk and dk["tag"] == "O2" and dk["span"] == 2, dk)
    ok("and its Progress says average", dk and dk["avg"] is True, dk)
    fit = safe(pg, """()=>{var d=document.createElement('div'); d.className='deck'; d.style.cssText='position:fixed;left:0;top:0;width:1600px;height:900px';
      var rows=''; for(var i=0;i<40;i++) rows+='<tr><td rowspan=2>T'+i+'</td><td>a</td></tr><tr class="osub"><td>b</td></tr><tr class="opad" hidden></tr>';
      d.innerHTML='<section class="dslide" data-split="X"><h2>x</h2><table class="zebra"><tbody>'+rows+'</tbody></table></section>';
      document.body.appendChild(d); deckFitPass(d);
      var tbs=[...d.querySelectorAll('tbody')], bad=0;
      tbs.forEach(tb=>{ var r=tb.rows[0]; if(r && /osub|opad/.test(r.className)) bad++; });
      var n=tbs.length; d.remove(); return {slides:n, bad:bad};}""")
    ok("the fit pass split the long table", fit and fit["slides"] > 1, fit)
    ok("and no slide starts with an outcome line torn from its tactic", fit and fit["bad"] == 0, fit)

    print("\n7 · missing")
    g0 = safe(pg, "()=>gapTotalAll('mobile')")
    safe(pg, "()=>{%s.outs.push({id:'O3', outcome:'Unset'});}" % T)
    g1 = safe(pg, "()=>gapTotalAll('mobile')")
    ok("an extra with no target is one more gap for the office", g0 is not None and g1 == g0 + 1, [g0, g1])
    safe(pg, "()=>{%s.outs=%s.outs.filter(x=>x.id!=='O3');}" % (T, T))

    print("\n8 · the workbook")
    rt = safe(pg, """async ()=>{ try {
        var u = UNITS.mobile, wb = planWorkbook(u);
        var sh = wb.filter(x=>x.name==='Outcomes')[0];
        var bytes = buildXlsx(wb);
        var sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
        applyPlanReplace(u, planFromWorkbook(u, sheets));
        var t = u.items[0].tactics[0];
        return { head: sh ? sh.head : null, outs: JSON.stringify(t.outs||null), none: u.items[0].tactics.slice(1).filter(x=>'outs' in x).length };
      } catch(e){ return {err:String(e)}; } }""")
    ok("the plan file carries an Outcomes sheet", rt and rt.get("head") and rt["head"][:3] == ["Pillar", "Tactic", "Outcome"], rt)
    ok("a round trip brings O2 back whole",
       rt and rt.get("outs") == '[{"id":"O2","outDir":"≥","outcome":"SKU master data complete","outTarget":"95%"}]', rt)
    ok("and a tactic with one outcome gains no key", rt and rt.get("none") == 0, rt)
    orph = safe(pg, """()=>{var rows=[{type:'OUTORPHAN', name:'No such tactic'}];
      return validatePlan(UNITS.mobile, rows).problems.map(x=>x.msg).join(' | ')}""")
    ok("an outcome whose tactic cannot be matched is refused by name", orph and "could not be matched" in orph, orph)
    safe(pg, "()=>{delete GROUP.structure; UNITS.mobile.items.forEach(p=>p.tactics.forEach(t=>{delete t.outs; delete t.outActs;}));}")
    names0 = safe(pg, "()=>planWorkbook(UNITS.mobile).map(x=>x.name).indexOf('Outcomes')")
    ok("off and none stored, the file carries no Outcomes sheet", names0 == -1, names0)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
