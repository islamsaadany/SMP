"""YEARS 1 · 2 · 3 (§416, RHI step 6).

Islam's five answers on the mockup: "1. keep 2. carry over 3. Year 1.2026
4. this year only 5. ok". Each direction marks the years it runs in; a
direction that does not run this year stays on the Plan greyed and is not
asked for, not owed and not scored; the office moves the plan into the next
year with a yearly revision that archives what stood and carries the rest
over; targets stay this year's only. Off by default — a Plan details chip on
Getting started › Structure.

  1 · OFF IS WHAT IT WAS, with years STORED on a direction — no marks, no tag,
      and the unit's scores byte-identical (§113.8: an absence is only worth
      asserting over a build that has something to draw).
  2 · THE SWITCH is a chip, read back off the stored group (§96); pressed
      again the key is DELETED (§50.6).
  3 · ON: the not-running direction is greyed in the plan rail and says when
      it runs, its band wears the three marks with this year ringed, and its
      pane says why in words (§35).
  4 · NOT ASKED, NOT OWED, NOT SCORED — reportItems, the gap map and the unit's
      score all leave it out, asserted as AGREEMENT with the same readers over
      the running directions alone (§94.8), and the Reporting rail reads a dash.
  5 · THE PEN: the year buttons write the STORED direction; the last year
      cannot be taken; all three is stored as an absence.
  6 · THE YEARLY REVISION: the cycle pen names the three years, the button
      opens the platform's own dialog, and yes moves the plan to Year 2,
      archives what stood, and starts the direction that begins in Year 2.
  7 · THE DECK gives a not-running direction no slides of its own; THE PLAN
      DOWNLOAD names the years; THE WORKBOOK round-trips a Years column.

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

P2 = "UNITS.mobile.items[1]"
ON = "()=>{GROUP.structure={details:{years:true}};}"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1');localStorage.setItem('smp.rail.terse','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(900)

    ok("the readers exist", safe(pg, "()=>typeof runsNow + typeof startYearRevision") == "functionfunction")
    safe(pg, "()=>{delete GROUP.structure; delete GROUP.planYear;}")
    base = safe(pg, "()=>[unitPillars(UNITS.mobile), unitExec(UNITS.mobile), reportItems(UNITS.mobile).length]")
    safe(pg, "()=>{%s.years=[2,3];}" % P2)
    pid = safe(pg, "()=>%s.id" % P2)

    def go(sub="plan", ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; paint(); }"); pg.wait_for_timeout(250)
        if sub == "plan":
            click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
        else:
            click(pg, "[data-s='%s']" % sub)
        if ed: click(pg, "[data-page='plan']", 600)
    def count(sel): return safe(pg, "()=>document.querySelectorAll('#panel %s').length" % sel)

    print("\n1 · off is what it was, with years stored")
    go()
    ok("no marks, no tag, no line", (count(".yrbox"), count(".yrtag"), count(".yrline")) == (0, 0, 0),
       (count(".yrbox"), count(".yrtag"), count(".yrline")))
    ok("no row is greyed", count(".ritem.later") == 0)
    ok("the unit's scores and asks are byte-identical",
       safe(pg, "()=>[unitPillars(UNITS.mobile), unitExec(UNITS.mobile), reportItems(UNITS.mobile).length]") == base,
       [base, safe(pg, "()=>[unitPillars(UNITS.mobile), unitExec(UNITS.mobile), reportItems(UNITS.mobile).length]")])

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
    # §420: each layer has its own switch, in its plan section; the old
    # client-wide card is gone. Ticked on the business units' layer here.
    chip = safe(pg, "()=>{var c=document.querySelector('[data-stdetail=\"bu|years\"]'); var r=c&&c.closest('[data-stdetrow]'); return c?[c.getAttribute('aria-pressed'), r?r.textContent:'']:null}")
    ok("the business units' plan section carries a 'Years' row, not ticked", chip and chip[0] == "false" and "Years" in chip[1], chip)
    ok("the old client-wide Plan details card is gone", safe(pg, "()=>document.querySelector('[data-stdetail=\"years\"]')") is None)
    click(pg, '[data-stdetail="bu|years"]')
    ok("ticking it stores the switch on THAT layer (§420)",
       safe(pg, "()=>!!(GROUP.structure&&GROUP.structure.bu&&GROUP.structure.bu.details&&GROUP.structure.bu.details.years===true)") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    ok("…on no other layer, and not client-wide",
       safe(pg, "()=>['top','mid','fn'].every(function(x){var l=GROUP.structure[x];return !(l&&l.details&&('years' in l.details))}) && !(GROUP.structure.details&&('years' in GROUP.structure.details))") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    click(pg, '[data-stdetail="bu|years"]')
    ok("unticked it is stored OFF on that layer, so it stops following the client-wide switch",
       safe(pg, "()=>GROUP.structure.bu.details.years===false") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    safe(pg, "()=>{delete GROUP.structure}")
    safe(pg, ON)

    print("\n3 · on: greyed, marked, and said")
    go()
    later = safe(pg, "()=>[...document.querySelectorAll('#panel .ritem.later')].map(r=>r.dataset.urail + '|' + r.textContent)")
    ok("exactly one plan rail row is greyed, and it is that direction",
       later and len(later) == 1 and later[0].split("|")[1] == pid, later)
    ok("and it says when it runs, on a collapsed rail too", later and "Starts in Year 2" in later[0], later)
    ok("every row wears its years tag", count(".rail .yrtag") == safe(pg, "()=>UNITS.mobile.items.length"),
       count(".rail .yrtag"))
    click(pg, "[data-urail$='|%s']" % pid)
    marks = safe(pg, "()=>{var q=document.querySelector('#panel .pband .yrbox'); return q?[...q.querySelectorAll('i')].map(i=>i.className.trim()):null}")
    ok("its band wears three marks: 1 ringed and not lit, 2 and 3 lit", marks == ["now", "on", "on"], marks)
    line = safe(pg, "()=>(document.querySelector('#panel .yrline')||{}).textContent")
    ok("and its pane says why, in words", line and "Year 2 and Year 3" in line and "not scored" in line, line)

    print("\n4 · not asked, not owed, not scored")
    ask = safe(pg, "()=>reportItems(UNITS.mobile).filter(x=>x.pid===%s.id || (x.obj && %s.measures.concat(%s.tactics).indexOf(x.obj)>=0)).length" % (P2, P2, P2))
    ok("reportItems asks for none of its rows", ask == 0, ask)
    gp = safe(pg, "()=>Object.keys(gapMap('mobile')||{}).filter(k=>k==='p:'+%s.id).length" % P2)
    ok("the gap map owes nothing on it", gp == 0, gp)
    agree = safe(pg, "()=>{var u=UNITS.mobile; return unitPillars(u) === avg(u.items.filter(runsNow).map(pillarPerf))}")
    ok("the unit's score is the average over the running directions alone", agree is True)
    ok("which moved it (§113.8: agreement over a no-op proves nothing)",
       safe(pg, "()=>unitPillars(UNITS.mobile)") != base[0] or safe(pg, "()=>pillarPerf(%s)" % P2) is None)
    # a fresh visit: nobody has pressed a direction on this page (§416's
    # default pick is only overridden by a press)
    safe(pg, "()=>{ for (var k in RAIL) delete RAIL[k]; }")
    go("report")
    ok("the Reporting page is drawn", count(".rail .ritem") > 0, count(".rail .ritem"))
    rr = safe(pg, "()=>[...document.querySelectorAll('#panel .rail .ritem.later .rnum')].map(n=>n.textContent)")
    ok("the Reporting rail reads a dash for it", rr == ["—"], rr)
    op = safe(pg, "()=>(document.querySelector('#panel .rail .ritem.on')||{dataset:{}}).dataset.urail")
    ok("and the page does not open on it", op and not op.endswith("|" + pid), op)

    print("\n5 · the pen")
    go(ed=True); click(pg, "[data-urail$='|%s']" % pid)
    click(pg, "[data-pyear='mobile|%s|1']" % pid)
    ok("pressing Year 1 adds it to the STORED direction", safe(pg, "()=>JSON.stringify(%s.years||null)" % P2) == "null",
       safe(pg, "()=>JSON.stringify(%s.years||null)" % P2))
    ok("and all three is stored as an absence (§50.6)", safe(pg, "()=>'years' in %s" % P2) is False)
    click(pg, "[data-pyear='mobile|%s|1']" % pid); click(pg, "[data-pyear='mobile|%s|3']" % pid)
    ok("taking 1 and 3 leaves Year 2 alone", safe(pg, "()=>JSON.stringify(%s.years)" % P2) == "[2]",
       safe(pg, "()=>JSON.stringify(%s.years)" % P2))
    click(pg, "[data-pyear='mobile|%s|2']" % pid)
    ok("the last year cannot be taken", safe(pg, "()=>JSON.stringify(%s.years)" % P2) == "[2]")
    safe(pg, "()=>{%s.years=[2,3]; EDIT_PAGE={}; paint();}" % P2)

    print("\n6 · the yearly revision")
    safe(pg, "()=>{ current='setup'; currentSub='cycle'; paint(); }"); pg.wait_for_timeout(300)
    # §495: the years live with the plan period, which has its own pen now
    # (spec 064 §7) rather than sitting inside the cycle's — rewritten, the
    # same three claims asked of the pen they moved into (§218).
    if not pg.query_selector(".planblk-pen"): click(pg, "[data-editplan]", 500)
    ch = safe(pg, "()=>[...document.querySelectorAll('.planblk-pen .planyears .yrchip')].map(c=>c.textContent)")
    ok("the plan period's pen names the three years, this one marked now",
       ch and len(ch) == 3 and ch[0].startswith("Year 1.") and ch[0].endswith("now"), ch)
    a0 = safe(pg, "()=>ARCHIVES.length")
    click(pg, "[data-yearrev]", 400)
    ok("the button opens the platform's own dialog", count("") is not None and safe(pg, "()=>!!document.querySelector('#modal-b [data-yryes]')") is True)
    click(pg, "#modal-b [data-yryes]", 500)
    ok("yes moves the plan to Year 2", safe(pg, "()=>planYear()") == 2)
    ok("and archives what stood first", (safe(pg, "()=>ARCHIVES.length") or 0) > (a0 or 0), [a0, safe(pg, "()=>ARCHIVES.length")])
    ok("the direction that begins in Year 2 now runs", safe(pg, "()=>runsNow(%s)" % P2) is True)
    ok("and the button now offers Year 3", "Year 3" in (safe(pg, "()=>(document.querySelector('[data-yearrev]')||{}).textContent") or ""))
    safe(pg, "()=>{delete GROUP.planYear;}")

    print("\n7 · the deck, the plan download, the workbook")
    code = safe(pg, "()=>pillarCode(UNITS.mobile,1)")
    dk = safe(pg, "()=>deckHtmlFor('mobile')")
    ok("the review deck gives the not-running direction no title slide",
       dk and ("data-anchor=\"p%sd\"" % code) not in dk, code)
    ok("but the running one keeps its", dk and ("data-anchor=\"p%sd\"" % safe(pg, "()=>pillarCode(UNITS.mobile,0)")) in dk)
    px = safe(pg, "()=>pptxUnitSlides(UNITS.mobile,'M').join('')")
    ok("the plan download names the years", px and "Y2–3" in px)
    rt = safe(pg, """async ()=>{ try {
        var u = UNITS.mobile, wb = planWorkbook(u);
        var sh = wb.filter(x=>x.name==='Pillars')[0];
        var bytes = buildXlsx(wb);
        var sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
        applyPlanReplace(u, planFromWorkbook(u, sheets));
        return { last: sh.head[sh.head.length-1], y: JSON.stringify(u.items[1].years||null),
                 none: u.items.filter(p=>'years' in p).length };
      } catch(e){ return {err:String(e)}; } }""")
    ok("the Pillars sheet ends with a Years column", rt and rt.get("last") == "Years", rt)
    ok("a round trip brings Year 2 and 3 back", rt and rt.get("y") == "[2,3]", rt)
    ok("and no other direction gains a key", rt and rt.get("none") == 1, rt)
    safe(pg, "()=>{delete GROUP.structure; UNITS.mobile.items.forEach(p=>{delete p.years;});}")
    last = safe(pg, "()=>{var h=planWorkbook(UNITS.mobile).filter(x=>x.name==='Pillars')[0].head; return h[h.length-1]}")
    ok("off and none stored, the file carries no such column", last and last != "Years", last)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
