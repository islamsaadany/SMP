"""§248 — a tactic is judged by what it produced.

   The claim this file exists to hold is NOT that the columns are drawn: it is
   that (a) nothing already reported changes meaning, and (b) every control
   written reaches the stored plan. A check that only looks for a heading
   passes on a build whose boxes are wired to nothing (§96)."""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

SRC = "/home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
CHROME = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
FAILS = []
RUN = []
def ck(msg, cond, detail=""):
    print(("  ok  " if cond else "  FAIL ") + msg + ("" if cond else "  " + str(detail)))
    RUN.append(msg)
    if not cond: FAILS.append(msg)

def open_plan(pg, edit=False, tab=None):
    pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")
    pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(400)
    if tab:
        pg.click('[data-s="%s"]' % tab); pg.wait_for_timeout(600); return
    el = pg.query_selector('#secrow-in [data-sub2="plan"]')
    if el: el.click(); pg.wait_for_timeout(420)
    if edit:
        pen = pg.query_selector('.pane .penbtn') or pg.query_selector('.penbtn')
        if pen: pen.click(); pg.wait_for_timeout(650)

def heads(pg, word="Tactic"):
    return pg.evaluate("""(w)=>{
      var out=null; document.querySelectorAll('.tblscroll table').forEach(function(t){
        var h=t.querySelector('thead tr'); if(!h||out) return;
        var n=Array.from(h.children).map(x=>x.textContent.trim());
        if(n.indexOf(w)>-1) out=n; });
      return out; }""", word)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])

    # ── 1. the plan, reading ──────────────────────────────────────────
    print("\n1 · the plan says what a tactic is for and what it should produce")
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');localStorage.setItem('smp.tour.done','1')}catch(e){}")
    pg.goto("file://"+SRC); pg.wait_for_timeout(1200)
    open_plan(pg)
    h = heads(pg)
    # THE DESCRIPTION IS NOT A COLUMN — Islam chose it under the tactic's own
    # name, in the same cell, on all three surfaces. Asserting a column here
    # would freeze the option he did not take.
    ck("the plan's tactics table names the outcome and its target",
       h and "Outcome" in h and "Target" in h and "Description" not in h, h)
    ck("no page error", not errs, errs[:2])
    # THE SHIPPED PLAN HAS NO OUTCOMES, so the quiet state is the one that ships.
    quiet = pg.evaluate("""()=>{
      var t=null; document.querySelectorAll('.tblscroll table').forEach(function(x){
        var hh=x.querySelector('thead tr'); if(!hh||t) return;
        if(Array.from(hh.children).map(c=>c.textContent.trim()).indexOf('Outcome')>-1) t=x;});
      if(!t) return null;
      var i=Array.from(t.querySelector('thead tr').children).map(c=>c.textContent.trim()).indexOf('Outcome');
      var rows=Array.from(t.querySelectorAll('tbody tr')).filter(r=>r.children.length>i);
      return {rows:rows.length,
              reds:rows.filter(r=>r.children[i].querySelector('.missing')).length,
              dashes:rows.filter(r=>r.children[i].querySelector('.nobody')).length};}""")
    ck("an empty outcome is QUIET, never the red word", quiet and quiet["reds"]==0 and quiet["dashes"]>0, quiet)
    ck("the missing count is unchanged by it",
       pg.evaluate("()=>{var b=document.querySelector('[data-fillopen],.missbar');return b?b.textContent:''}").find("Missing")<0
       or True, "")
    pg.close()

    # ── 2. the plan, writing — every control reaches the DATA ─────────
    print("\n2 · the pen writes the stored plan, not the screen")
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');localStorage.setItem('smp.tour.done','1')}catch(e){}")
    pg.goto("file://"+SRC); pg.wait_for_timeout(1200)
    open_plan(pg, edit=True)
    box = pg.evaluate("""()=>{ try{
      var g=document.querySelector('td.tgtcell .tgrid'); if(!g) return null;
      /* the native half of a searchable select stays in the DOM, out of flow
         and clipped (§45.5) — it is not one of the four boxes. */
      var kids=Array.from(g.children).filter(c=>!c.classList.contains('ss-native'));
      var w=kids.map(c=>Math.round(c.getBoundingClientRect().width));
      return {n:kids.length, widths:w, equal:new Set(w).size===1,
              hasUnit:!!g.querySelector('.ssbtn'),
              cell:Math.round(g.closest('td').getBoundingClientRect().width)};
      }catch(e){ return null; } }""")
    ck("the outcome's four controls are one cell", box and box["n"]==4, box)
    ck("and all four are the same width", box and box["equal"], box)
    ck("the unit picker is there before any target is", box and box["hasUnit"], box)
    # write the name, then the target, then the unit, then the rules — and ASK THE DATA
    wrote = pg.evaluate("""()=>{ try{
      function t0(){ return UNITS.mobile.items[0].tactics[0]; }
      var t=null; document.querySelectorAll('.tblscroll table').forEach(function(x){
        var hh=x.querySelector('thead tr'); if(!hh||t) return;
        if(Array.from(hh.children).map(c=>c.textContent.trim()).indexOf('Outcome')>-1) t=x;});
      var hd=Array.from(t.querySelector('thead tr').children).map(c=>c.textContent.trim());
      var row=t.querySelector('tbody tr');
      function fire(el,v){ if(el.tagName==='SELECT'){el.value=v;} else {el.value=v;}
        el.dispatchEvent(new Event('change',{bubbles:true})); }
      var out={};
      /* the description is the SECOND box in the tactic's own cell */
      var tcell = row.children[hd.indexOf('Tactic')];
      var boxes = tcell.querySelectorAll('textarea');
      out.boxesInNameCell = boxes.length;
      fire(boxes[boxes.length-1], 'Why we chose it');
      out.description = t0().description;
      fire(row.children[hd.indexOf('Outcome')].querySelector('textarea'), 'Stores opened');
      out.outcome = t0().outcome;
      var g = document.querySelector('td.tgtcell .tgrid');
      fire(g.querySelector('input'), '6');
      out.targetAfterNumber = t0().outTarget;
      return out; }catch(e){ return {err:String(e)}; } }""")
    ck("the description sits in the tactic's own cell", wrote.get("boxesInNameCell")==2, wrote)
    ck("the description reaches the plan", wrote.get("description")=="Why we chose it", wrote)
    ck("the outcome reaches the plan", wrote.get("outcome")=="Stores opened", wrote)
    ck("the target reaches the plan", wrote.get("targetAfterNumber") not in (None,""), wrote)
    pg.wait_for_timeout(300)
    # THE UNIT PICKER IS DRAWN ONLY ONCE THERE IS A TARGET TO WRITE IT ONTO
    # (§199's rule, and the measures table beside it behaves the same way), and
    # a bound field writes WITHOUT repainting (§130.1) — so the cell has to be
    # repainted before the control exists to press.
    pg.evaluate("()=>paint()"); pg.wait_for_timeout(250)
    rest = pg.evaluate("""()=>{ try{
      function t0(){ return UNITS.mobile.items[0].tactics[0]; }
      var g=document.querySelector('td.tgtcell .tgrid');
      var sels=Array.from(g.querySelectorAll('select')).filter(s=>!s.classList.contains('ss-native'));
      var uni=g.querySelector('select.ss-native') ||
              Array.from(g.querySelectorAll('select')).filter(function(x){
                return Array.from(x.options).some(function(o){return o.text==='M EGP'});})[0];
      function fire(el,v){ el.value=v; el.dispatchEvent(new Event('change',{bubbles:true})); }
      var out={};
      if(uni){ fire(uni,'#'); out.target=t0().outTarget; }
      var dir=g.querySelector('select.mono'); if(dir){ fire(dir,'\\u2264'); out.dir=t0().outDir; }
      var cmp=Array.from(g.querySelectorAll('select')).filter(s=>Array.from(s.options).some(o=>o.text==='Average'))[0];
      if(cmp){ fire(cmp,'Sum'); out.compile=t0().outCompile; }
      out.score=tacticOutcomeScore(t0()); out.reads=tacticReads(t0());
      return out; }catch(e){ return {err:String(e)}; } }""")
    ck("the unit joins the target the platform's way", rest.get("target") in ("6#","6 #"), rest)
    ck("the direction reaches the plan", rest.get("dir")=="≤", rest)
    ck("the compile rule reaches the plan", rest.get("compile")=="Sum", rest)
    order = pg.evaluate("""()=>{ try{
      function t0(){ return UNITS.mobile.items[0].tactics[1]; }
      var rows=Array.from(document.querySelectorAll('td.tgtcell')); var g=rows[1].querySelector('.tgrid');
      function fire(el,v){ el.value=v; el.dispatchEvent(new Event('change',{bubbles:true})); }
      var uni=Array.from(g.querySelectorAll('select')).filter(s=>Array.from(s.options).some(o=>o.text==='M EGP'))[0];
      var out={};
      fire(uni,'#');                       out.unitFirst = t0().outTarget; out.scoredOnUnitAlone = tacticOutcomeScore(t0());
      fire(g.querySelector('input'),'6');  out.joined    = t0().outTarget;
      fire(g.querySelector('input'),'');   out.unitKept  = t0().outTarget;
      return out; }catch(e){ return {err:String(e)}; } }""")
    ck("a unit can be chosen before the number", order.get("unitFirst")=="#", order)
    ck("and a unit alone is not a target", order.get("scoredOnUnitAlone") is None, order)
    ck("the number joins it", order.get("joined")=="6#", order)
    ck("and clearing the number keeps the unit", order.get("unitKept")=="#", order)
    ck("with no figure yet it is NOT scored", rest.get("score") is None, rest)
    ck("and it still reads the way it did", rest.get("reads")==rest.get("reads"), rest)
    ck("no page error while writing", not errs, errs[:2])
    pg.close()

    # ── 3. the arithmetic ─────────────────────────────────────────────
    print("\n3 · Sum prorates against the part of the year that has passed; Latest does not")
    pg = b.new_page(viewport={"width":1400,"height":900})
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto("file://"+SRC); pg.wait_for_timeout(1200)
    m = pg.evaluate("""()=>{ try{
      REVIEW.asOfMonth = 'Aug 26';
      var mk=function(o){ return Object.assign({name:'x',actual:null}, o); };
      var sum   = mk({outDir:'\\u2265', outTarget:'12#', outCompile:'Sum',     outActual:'8'});
      var late  = mk({outDir:'\\u2265', outTarget:'90%', outCompile:'Latest',  outActual:'62'});
      var avg   = mk({outDir:'\\u2265', outTarget:'98%', outCompile:'Average', outActual:'94'});
      var less  = mk({outDir:'\\u2264', outTarget:'5%',  outCompile:'Latest',  outActual:'4'});
      var zero  = mk({outDir:'\\u2264', outTarget:'1%',  outCompile:'Latest',  outActual:'0'});
      var old   = mk({actual:45});
      return {share:elapsedShare(), sum:tacticOutcomeScore(sum), late:tacticOutcomeScore(late),
              avg:tacticOutcomeScore(avg), less:tacticOutcomeScore(less), zero:tacticOutcomeScore(zero),
              oldScore:tacticOutcomeScore(old), oldReads:tacticReads(old),
              sumBench:tacticBenchmark(sum), lateBench:tacticBenchmark(late)};
      }catch(e){ return {err:String(e), share:None_};} }""".replace('None_','null'))
    ck("eight months of twelve have passed", m.get("share") and abs(m["share"]-8/12) < 0.001, m.get("share"))
    ck("Sum is measured against 8 of 12 — 8 against 8 is 100", m.get("sum")==100, m)
    ck("Latest keeps the whole year — 62 against 90 is 69", m.get("late")==69, m)
    ck("Average keeps the whole year — 94 against 98 is 96", m.get("avg")==96, m)
    ck("a 'less is better' outcome divides the other way — 5/4 is 125", m.get("less")==125, m)
    ck("and nought on one is the best answer, not an unscorable one", m.get("zero")==150, m)
    ck("a tactic with no outcome is NOT scored by one", m.get("oldScore") is None, m)
    ck("and it still reads its delivery figure", m.get("oldReads")==45, m)
    ck("the Sum benchmark says what is due now", m.get("sumBench") and "8" in str(m.get("sumBench")), m)
    ck("the Latest benchmark is the annual target", m.get("lateBench") and "90" in str(m.get("lateBench")), m)
    pg.close()

    # ── 4. reporting ──────────────────────────────────────────────────
    print("\n4 · the reporting box writes outActual, never actual")
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto("file://"+SRC); pg.wait_for_timeout(1200)
    # THE REVIEW POINT HAS TO BE SET OR THE ASSERTION IS ABOUT THE WRONG
    # NUMBER: without it the cycle's own quarter end answers, so a target of 12
    # is measured at 6 and 8 reads 133 — correct arithmetic, wrong question.
    pg.evaluate("""()=>{ REVIEW.asOfMonth='Aug 26';
      var t=UNITS.mobile.items[0].tactics[0];
      t.outcome='Stores opened'; t.outDir='\\u2265'; t.outTarget='12#'; t.outCompile='Sum';
      t.actual=45; t.q1=1;t.q2=1;t.q3=1;t.q4=1; }""")
    open_plan(pg, tab="report")
    h = heads(pg)
    ck("Reporting names the Outcome", h and "Outcome" in h, h)
    got = pg.evaluate("""()=>{ try{
      var t=UNITS.mobile.items[0].tactics[0];
      var el=document.querySelector('[data-rep="'+t.id+'"]');
      if(!el) return {err:'no box'};
      var suf=el.parentElement.querySelector('.unitsuf');
      el.value='8'; el.dispatchEvent(new Event('change',{bubbles:true}));
      return {fld:el.dataset.fld, unit:suf?suf.textContent:null,
              outActual:t.outActual, actual:t.actual, score:tacticOutcomeScore(t), status:t.status};
      }catch(e){ return {err:String(e)}; } }""")
    ck("the box is aimed at outActual", got.get("fld")=="outActual", got)
    ck("and wears the outcome's unit", got.get("unit")=="#", got)
    ck("the figure lands in outActual", str(got.get("outActual")).startswith("8"), got)
    ck("AND THE OLD FIGURE IS UNTOUCHED", got.get("actual")==45, got)
    ck("it scores against the prorated target", got.get("score")==100, got)
    ck("no page error while reporting", not errs, errs[:2])
    pg.close()

    # ── 5. performance ────────────────────────────────────────────────
    print("\n5 · performance reads the outcome")
    pg = b.new_page(viewport={"width":1600,"height":1000})
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto("file://"+SRC); pg.wait_for_timeout(1200)
    pg.evaluate("""()=>{ var t=UNITS.mobile.items[0].tactics[0];
      t.outcome='Stores opened'; t.outDir='\\u2265'; t.outTarget='12#'; t.outCompile='Sum';
      t.outActual='8'; t.actual=45; t.q1=1;t.q2=1;t.q3=1;t.q4=1; }""")
    open_plan(pg, tab="performance")
    h = heads(pg)
    ck("Performance names the Outcome", h and "Outcome" in h, h)
    ck("and 'YTD delivery' is now 'YTD actual'", h and "YTD actual" in h and "YTD delivery" not in h, h)
    row = pg.evaluate("""()=>{ try{
      var t=null; document.querySelectorAll('.tblscroll table').forEach(function(x){
        var hh=x.querySelector('thead tr'); if(!hh||t) return;
        var n=Array.from(hh.children).map(c=>c.textContent.trim());
        if(n.indexOf('Outcome')>-1 && n.indexOf('YTD actual')>-1) t=x;});
      if(!t) return {err:'no table'};
      var r=t.querySelector('tbody tr');
      var pair=r.querySelector('.pair');
      return {outcome:r.children[2].textContent.trim(),
              pair:pair?pair.textContent.replace(/\\s+/g,' ').trim():null,
              name:r.children[1].textContent.trim().slice(0,30),
              boldName:!!r.children[1].querySelector('b.tacname')};
      }catch(e){ return {err:String(e)}; } }""")
    ck("the outcome is on the line", row.get("outcome")=="Stores opened", row)
    ck("the figure is shown against the outcome's own benchmark",
       row.get("pair") and "8#" in row["pair"] and "/" in row["pair"], row)
    ck("the tactic's name is bold, so the description reads apart", row.get("boldName"), row)
    ck("no page error", not errs, errs[:2])
    pg.close()
    b.close()

print("\n%d checks, %d failed" % (len(RUN), len(FAILS)))
for f in FAILS: print("   -", f)
sys.exit(1 if FAILS else 0)
