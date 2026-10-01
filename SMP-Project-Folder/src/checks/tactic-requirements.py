"""A TACTIC'S REQUIREMENTS (§415, RHI step 5).

Islam, of the mockup: "B, plan download only, build it". A tactic may list
what it needs (people, budget, a sign-off), one short line per item, drawn
UNDER the tactic's name on the Plan page and carried by the plan download —
never by the review deck, never scored, never counted as missing. Off by
default — a Plan details chip on Getting started › Structure.

  1 · OFF IS WHAT IT WAS, with requirements STORED — nothing drawn on the
      Plan in either mode (§113.8: "nothing is drawn" is only worth saying
      over a build that has something to draw).
  2 · THE SWITCH is a chip, read back off the stored group (§96); pressed
      again the key is DELETED (§50.6).
  3 · ON, READ MODE: the list under the tactic's name, a tactic with none
      drawing nothing (§15.1), and the table's columns unchanged (B's whole
      argument: no column goes narrower).
  4 · ON, THE PEN: a box on every tactic, even an empty one (§61), carrying no
      `.grow` so Enter is a newline; typed lines reach the STORED tactic
      trimmed and without blanks, and emptied the key is deleted.
  5 · NOT AN OBLIGATION: the gap count and the tactic's score unmoved.
  6 · THE REVIEW DECK does not carry it; THE PLAN DOWNLOAD does, and a
      slide holding requirements holds fewer rows.
  7 · THE WORKBOOK: a Requirements column at the end that round-trips, and
      none at all when off with nothing stored.

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
SEED = "()=>{%s.reqs=['Two data analysts','Budget sign-off from Finance'];}" % T

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(900)

    ok("the readers exist", safe(pg, "()=>typeof reqsOf + typeof requirementsOn") == "functionfunction")
    safe(pg, "()=>{delete GROUP.structure;}")
    g0 = safe(pg, "()=>gapTotalAll('mobile')"); s0 = safe(pg, "()=>tacticOutcomeScore(%s)" % T)
    safe(pg, SEED)

    def go(ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; paint(); }"); pg.wait_for_timeout(250)
        click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
        if ed: click(pg, "[data-page='plan']", 600)
    def count(sel): return safe(pg, "()=>document.querySelectorAll('#panel %s').length" % sel)
    def cols(): return safe(pg, """()=>{var t=[...document.querySelectorAll('#panel table')].filter(x=>x.querySelector('.tacname'))[0];
      return t ? [...t.querySelectorAll('thead th')].map(th=>Math.round(th.getBoundingClientRect().width)) : null}""")

    print("\n1 · off is what it was, with requirements stored")
    go(); ok("nothing under the name in read mode", count(".reqnote") == 0, count(".reqnote"))
    w_off = cols()
    go(True); ok("and no box behind the pen", count(".reqbox") == 0, count(".reqbox"))

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
    chip = safe(pg, "()=>{var c=document.querySelector('[data-stdetail=\"bu|requirements\"]'); var r=c&&c.closest('[data-stdetrow]'); return c?[c.getAttribute('aria-pressed'), r?r.textContent:'']:null}")
    ok("the business units' plan section carries a 'Requirements' row, not ticked", chip and chip[0] == "false" and "Requirements" in chip[1], chip)
    ok("the old client-wide Plan details card is gone", safe(pg, "()=>document.querySelector('[data-stdetail=\"requirements\"]')") is None)
    click(pg, '[data-stdetail="bu|requirements"]')
    ok("ticking it stores the switch on THAT layer (§420)",
       safe(pg, "()=>!!(GROUP.structure&&GROUP.structure.bu&&GROUP.structure.bu.details&&GROUP.structure.bu.details.requirements===true)") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    ok("…on no other layer, and not client-wide",
       safe(pg, "()=>['top','mid','fn'].every(function(x){var l=GROUP.structure[x];return !(l&&l.details&&('requirements' in l.details))}) && !(GROUP.structure.details&&('requirements' in GROUP.structure.details))") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    click(pg, '[data-stdetail="bu|requirements"]')
    ok("unticked it is stored OFF on that layer, so it stops following the client-wide switch",
       safe(pg, "()=>GROUP.structure.bu.details.requirements===false") is True, safe(pg, "()=>JSON.stringify(GROUP.structure)"))
    safe(pg, "()=>{delete GROUP.structure}")
    safe(pg, "()=>{GROUP.structure={details:{requirements:true}};}")

    print("\n3 · on, read mode")
    go()
    r = safe(pg, """()=>{var n=[...document.querySelectorAll('#panel .reqnote')];
      return n.map(x=>({cell:!!x.closest('td') && !!x.closest('td').querySelector('.tacname'),
        key:(x.querySelector('.repkey')||{}).textContent, items:[...x.querySelectorAll('li')].map(l=>l.textContent)}))}""")
    ok("exactly one list is drawn, in the tactic's own cell under its name",
       r and len(r) == 1 and r[0]["cell"] and r[0]["key"] == "Requirements", r)
    ok("carrying both items, in order", r and r[0]["items"] == ["Two data analysts", "Budget sign-off from Finance"], r)
    ok("no column moves (B: nothing goes narrower)", w_off and cols() == w_off, [w_off, cols()])

    print("\n4 · on, the pen")
    go(True)
    nt = safe(pg, "()=>UNITS.mobile.items[0].tactics.filter(t=>!SMPRules.isHidden(t)).length")
    bx = safe(pg, "()=>[...document.querySelectorAll('#panel .reqbox textarea')].map(t=>[t.value, t.classList.contains('grow')])")
    ok("a box on every tactic, the empty ones included (§61)", bx and len(bx) == nt, [len(bx or []), nt])
    ok("the first holds one line per item", bx and bx[0][0] == "Two data analysts\nBudget sign-off from Finance", bx and bx[0])
    ok("and none is a one-line .grow box, so Enter is a newline", bx and not any(x[1] for x in bx), bx)
    try:
        box = pg.locator("#panel .reqbox textarea").nth(1)
        box.click(); box.press("End")
        box.type("Legal review"); box.press("Enter"); box.type("  "); box.press("Enter"); box.type(" Vendor shortlist ")
        v = box.input_value()
        pg.click("h1, body", position={"x": 5, "y": 5}); pg.wait_for_timeout(400)
    except Exception as e: v = "ERR " + str(e)[:100]
    ok("Enter made new lines in the box rather than committing", v.count("\n") >= 2, repr(v))
    ok("typed lines reach the STORED tactic trimmed, blanks dropped",
       safe(pg, "()=>JSON.stringify(UNITS.mobile.items[0].tactics[1].reqs||null)") == '["Legal review","Vendor shortlist"]',
       safe(pg, "()=>JSON.stringify(UNITS.mobile.items[0].tactics[1].reqs||null)"))
    safe(pg, "()=>{ var i=[...document.querySelectorAll('#panel .reqbox textarea')][1]; i.value='  \\n '; i.dispatchEvent(new Event('change',{bubbles:true})); }")
    pg.wait_for_timeout(300)
    ok("emptied, the key is DELETED (§50.6)", safe(pg, "()=>'reqs' in UNITS.mobile.items[0].tactics[1]") is False)

    print("\n5 · not an obligation")
    ok("the gap count is unmoved by requirements", safe(pg, "()=>gapTotalAll('mobile')") == g0, [g0, safe(pg, "()=>gapTotalAll('mobile')")])
    ok("and so is the tactic's score", safe(pg, "()=>tacticOutcomeScore(%s)" % T) == s0)

    print("\n6 · the review deck and the plan download")
    dk = safe(pg, "()=>{var h=deckHtmlFor('mobile'); return [h.indexOf('Requirements'), h.indexOf('Two data analysts')]}")
    ok("the review deck carries neither the key nor an item", dk == [-1, -1], dk)
    px = safe(pg, "()=>{var s=pptxUnitSlides(UNITS.mobile, 'Mobile').join(''); return [s.indexOf('Requirements:'), s.indexOf('Two data analysts'), s.indexOf('Budget sign-off from Finance')]}")
    ok("the plan download carries both items under the tactic", px and all(x >= 0 for x in px), px)
    # the pillar holds 5 tactics, which fit any slide — so it is made 12 long,
    # or "at most 7" is true of a build that never shortened anything (§113.8)
    rows = safe(pg, """()=>{var p=UNITS.mobile.items[0], keep=p.tactics.slice();
      for(var i=0;i<7;i++) p.tactics.push({id:'tmp'+i, name:'Extra tactic '+i, owner:'x', q1:1});
      var s=pptxUnitSlides(UNITS.mobile,'M'); p.tactics=keep;
      var ss=s.filter(x=>x.indexOf('Extra tactic')>=0 || x.indexOf('Two data analysts')>=0);
      return ss.map(sl=>(sl.match(/<a:tr /g)||[]).length - 1)}""")
    ok("a pillar of 12 tactics with requirements splits 7 + 5", rows == [7, 5], rows)
    safe(pg, "()=>{delete GROUP.structure;}")
    ok("off, the plan download carries no requirements", safe(pg, "()=>pptxUnitSlides(UNITS.mobile,'M').join('').indexOf('Requirements:')") == -1)
    safe(pg, "()=>{GROUP.structure={details:{requirements:true}};}")

    print("\n7 · the workbook")
    rt = safe(pg, """async ()=>{ try {
        var u = UNITS.mobile, wb = planWorkbook(u);
        var sh = wb.filter(x=>x.name==='Tactics')[0];
        var bytes = buildXlsx(wb);
        var sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
        applyPlanReplace(u, planFromWorkbook(u, sheets));
        return { last: sh.head[sh.head.length-1], reqs: JSON.stringify(u.items[0].tactics[0].reqs||null),
                 none: u.items.reduce((n,p)=>n+p.tactics.filter(t=>'reqs' in t).length,0) };
      } catch(e){ return {err:String(e)}; } }""")
    ok("the Tactics sheet ends with a Requirements column", rt and rt.get("last") == "Requirements", rt)
    ok("a round trip brings both items back", rt and rt.get("reqs") == '["Two data analysts","Budget sign-off from Finance"]', rt)
    ok("and no other tactic gains a key", rt and rt.get("none") == 1, rt)
    safe(pg, "()=>{delete GROUP.structure; UNITS.mobile.items.forEach(p=>p.tactics.forEach(t=>{delete t.reqs;}));}")
    last = safe(pg, "()=>{var h=planWorkbook(UNITS.mobile).filter(x=>x.name==='Tactics')[0].head; return h[h.length-1]}")
    ok("off and none stored, the file carries no such column", last and last != "Requirements", last)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
