"""A TACTIC NAMES THE KEY MEASURES IT SUPPORTS (§767).

Islam: link the tactics to the key measures, regardless of the outcomes, as a
mapping. Signed off on mockup A2 (design-mockups/tactic-key-measures/
2026-11-16_a2-numbers.html): under a tactic one line of the MEASURES' NUMBERS
("Supports KM 1 KM 2"), under a measure the count of tactics behind it with
their numbers, the full name on hover, a folded legend under the tactics
table, and in the pen a tick list of the pillar's own measures. Stored as
`supports` — measure ids — on the tactic, riding `tactics.extra`; never
scored, never counted as missing.

  1 · NOTHING STORED, NOTHING DRAWN: no line, no count, no legend on a plan
      nobody has mapped (§113.8) — and the pen offers a tick per measure on
      every tactic, none ticked.
  2 · STORED, READ MODE: the line under the tactic carries the numbers, each
      tag's hover is the measure's name; the count under a measure names its
      tactics; a measure with none says so; the legend lists every measure;
      no column moves.
  3 · THE PEN: the ticks read the stored list; a tick stores the id; the last
      untick DELETES the key (§50.6).
  4 · NOT AN OBLIGATION: the gap count and the tactic's score unmoved.
  5 · THE NUMBER IS THE PLACE: a measure moved up carries its tactic's tag
      with it; renumbering keeps the pointer; removing a measure forgets it.
  6 · THE DECK and PERFORMANCE carry the line; the workbook's Tactics sheet
      gains a Key measures column by NAME that round-trips, and a number in
      that cell is read too; with nothing stored the column is absent.

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

P = "UNITS.mobile.items[0]"

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(900)

    ok("the readers exist", safe(pg, "()=>[supportsIds,setSupports,supportsOf,supportedBy,mappingOn,remapSupports,forgetSupport].every(f=>typeof f==='function')") is True)
    safe(pg, "()=>{delete GROUP.structure;}")
    g0 = safe(pg, "()=>gapTotalAll('mobile')"); s0 = safe(pg, "()=>tacticOutcomeScore(%s.tactics[0])" % P)
    ids = safe(pg, "()=>%s.measures.map(m=>m.id)" % P)
    ok("Mobile's first pillar has four measures with ids", ids and len(ids) == 4 and all(ids), ids)

    def go(ed=False):
        safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; paint(); }"); pg.wait_for_timeout(250)
        click(pg, "[data-s='strategy']"); click(pg, "[data-sub2='plan']")
        if ed: click(pg, "[data-page='plan']", 600)
    def count(sel): return safe(pg, "()=>document.querySelectorAll('#panel %s').length" % sel)
    def cols(): return safe(pg, """()=>{var t=[...document.querySelectorAll('#panel table')].filter(x=>x.querySelector('.tacname'))[0];
      return t ? [...t.querySelectorAll('thead th')].map(th=>Math.round(th.getBoundingClientRect().width)) : null}""")

    print("\n1 · nothing stored, nothing drawn")
    go()
    ok("no Supports line, no count, no legend", count(".kmnums") == 0 and count(".kmcount") == 0 and count(".kmlegend") == 0,
       [count(".kmnums"), count(".kmcount"), count(".kmlegend")])
    w0 = cols()
    go(True)
    nt = safe(pg, "()=>%s.tactics.length" % P)
    pk = safe(pg, """()=>{var p=[...document.querySelectorAll('#panel .kmpick')]; var first=p[0];
      return {n:p.length, ticks:first?first.querySelectorAll('input[type=checkbox]').length:0,
              on:[...document.querySelectorAll('#panel .kmpick input:checked')].length,
              names:first?[...first.querySelectorAll('.kmname')].map(x=>x.textContent):[]}}""")
    ok("the pen offers a tick list on every tactic of the first pillar, one tick per measure, none ticked",
       pk and pk["n"] >= nt and pk["ticks"] == 4 and pk["on"] == 0, pk)
    ok("…naming the measures in the table's order", pk and pk["names"] == safe(pg, "()=>%s.measures.map(m=>m.name)" % P), pk and pk["names"])

    print("\n2 · stored, read mode")
    safe(pg, "()=>{var p=%s; p.tactics[0].supports=[p.measures[0].id, p.measures[1].id]; p.tactics[1].supports=[p.measures[1].id];}" % P)
    go()
    ln = safe(pg, """()=>[...document.querySelectorAll('#panel .kmnums')].map(x=>({
      cell:!!x.closest('td') && !!x.closest('td').querySelector('.tacname'), key:(x.querySelector('.repkey')||{textContent:null}).textContent,
      tags:[...x.querySelectorAll('.kmtag')].map(t=>[t.textContent, t.getAttribute('data-name')])}))""")
    ok("two tactics carry a line of tags, in their own cell under the name, with no word before them", ln and len(ln) == 2 and all(x["cell"] and x["key"] is None for x in ln), ln)
    mn = safe(pg, "()=>%s.measures.map(m=>m.name)" % P)
    ok("the first says KM 1 and KM 2, each tag's hover being the measure's name",
       ln and ln[0]["tags"] == [["KM 1", mn[0]], ["KM 2", mn[1]]], ln and ln[0]["tags"])
    ok("the second says KM 2 alone", ln and ln[1]["tags"] == [["KM 2", mn[1]]], ln and ln[1]["tags"])
    # §767.1: the name shows the moment the pointer arrives — read with no wait at all
    try:
        pg.locator("#panel .kmnums .kmtag").first.hover()
        tp = safe(pg, "()=>{var t=document.querySelector('.kmtip'); return t?[t.classList.contains('on'), t.textContent, getComputedStyle(t).display]:null}")
        pg.mouse.move(5, 5)
        tp2 = safe(pg, "()=>{var t=document.querySelector('.kmtip'); return t?t.classList.contains('on'):null}")
    except Exception as e: tp = "ERR " + str(e)[:80]; tp2 = None
    ok("hovering a tag shows the measure's name at once, in the platform's own label", tp and tp[0] is True and tp[1] == mn[0] and tp[2] == "block", tp)
    ok("and it goes when the pointer leaves", tp2 is False, tp2)
    ok("no browser tooltip is left on the tag to appear late", safe(pg, "()=>[...document.querySelectorAll('#panel .kmtag')].every(t=>!t.hasAttribute('title'))") is True)
    ct = safe(pg, """()=>[...document.querySelectorAll('#panel .kmcount')].map(x=>({none:x.classList.contains('none'), text:x.textContent.trim(),
      tags:[...x.querySelectorAll('.kmtag')].map(t=>t.textContent)}))""")
    ok("every measure of the pillar carries a count line", ct and len(ct) == 4, ct)
    ok("measure 1 names T1, measure 2 names T1 and T2, and no count is written before them",
       ct and ct[0]["tags"] == ["T1"] and ct[1]["tags"] == ["T1", "T2"] and ct[1]["text"] == "T1T2", ct)
    ok("measures 3 and 4 say no tactic supports them yet", ct and ct[2]["none"] and ct[3]["none"] and "supports it yet" in ct[2]["text"], ct)
    lg = safe(pg, """()=>{var l=document.querySelector('#panel .kmlegend'); return l?{open:l.open, rows:[...l.querySelectorAll('.kmrows > span:nth-child(even)')].map(x=>x.textContent)}:null}""")
    ok("one legend, folded, listing all four measures in order", lg and not lg["open"] and lg["rows"] == mn, lg)
    ok("no other pillar draws a count or legend", count(".kmlegend") == 1, count(".kmlegend"))
    ok("no column moves", w0 and cols() == w0, [w0, cols()])

    print("\n3 · the pen")
    go(True)
    tk = safe(pg, """()=>[...document.querySelectorAll('#panel .kmpick')].slice(0,3).map(p=>[...p.querySelectorAll('input')].map(i=>i.checked))""")
    ok("the ticks read the stored list", tk == [[True, True, False, False], [False, True, False, False], [False, False, False, False]], tk)
    # §767.2: a closed box, one line, showing the chosen tags; it opens to the ticks
    dd = safe(pg, """()=>[...document.querySelectorAll('#panel .kmpick')].slice(0,3).map(p=>{var d=p.querySelector('details.kmdrop');
      return d?[d.open, [...d.querySelectorAll('.kmsum .kmtag')].map(x=>x.textContent), !!d.querySelector('.kmsum .kmnone')]:null})""")
    ok("each tactic's list is a closed box showing its chosen tags, or 'Pick' when none",
       dd == [[False, ["KM 1", "KM 2"], False], [False, ["KM 2"], False], [False, [], True]], dd)
    h0 = safe(pg, "()=>document.querySelectorAll('#panel .kmpick')[2].getBoundingClientRect().height")
    try:
        pg.locator("#panel .kmpick").nth(2).locator("summary").click(); pg.wait_for_timeout(200)
        opened = safe(pg, "()=>document.querySelectorAll('#panel .kmdrop')[2].open")
        h1 = safe(pg, "()=>document.querySelectorAll('#panel .kmpick')[2].getBoundingClientRect().height")
        pg.locator("#panel .kmpick").nth(2).locator("input").nth(2).click(); pg.wait_for_timeout(300)
        v1 = safe(pg, "()=>JSON.stringify(%s.tactics[2].supports||null)" % P)
        s1 = safe(pg, "()=>[...document.querySelectorAll('#panel .kmdrop')[2].querySelectorAll('.kmsum .kmtag')].map(x=>x.textContent)")
        pg.locator("#panel .kmpick").nth(2).locator("input").nth(2).click(); pg.wait_for_timeout(300)
        v2 = safe(pg, "()=>'supports' in %s.tactics[2]" % P)
        s2 = safe(pg, "()=>!!document.querySelectorAll('#panel .kmdrop')[2].querySelector('.kmsum .kmnone')")
        pg.click("h1, body", position={"x": 5, "y": 5}); pg.wait_for_timeout(200)
        closed = safe(pg, "()=>document.querySelectorAll('#panel .kmdrop')[2].open")
    except Exception as e: v1 = "ERR " + str(e)[:100]; v2 = None; opened = h1 = s1 = s2 = closed = None
    ok("pressing the box opens the ticks under it, and the row grows only then", opened is True and h0 and h1 and h1 > h0 + 60, [h0, h1, opened])
    ok("a tick stores the measure's id on the tactic", v1 == '["%s"]' % ids[2], v1)
    ok("…and the closed line shows the tag at once", s1 == ["KM 3"], s1)
    ok("the last untick DELETES the key (§50.6)", v2 is False, v2)
    ok("…and the line says Pick again", s2 is True, s2)
    ok("a click elsewhere closes the box", closed is False, closed)

    print("\n4 · not an obligation")
    ok("the gap count is unmoved", safe(pg, "()=>gapTotalAll('mobile')") == g0, [g0, safe(pg, "()=>gapTotalAll('mobile')")])
    ok("and so is the tactic's score", safe(pg, "()=>tacticOutcomeScore(%s.tactics[0])" % P) == s0)

    print("\n5 · the number is the place")
    mv = safe(pg, """()=>{var p=%s; var m=p.measures.splice(1,1)[0]; p.measures.unshift(m);
      var s=supportsOf(p.tactics[1], p); var r=[s.length, s[0]&&s[0].n, s[0]&&s[0].m===m];
      p.measures.shift(); p.measures.splice(1,0,m); return r}""" % P)
    ok("measure 2 moved to the top: its tactic's tag reads KM 1 and still names it", mv == [1, 1, True], mv)
    rn = safe(pg, """()=>{var p=%s; var keep=JSON.stringify(p.measures.map(m=>m.id).concat(p.tactics.map(t=>t.id)));
      var m=p.measures.splice(1,1)[0]; p.measures.unshift(m); renumberUnit(UNITS.mobile);
      var s=supportsOf(p.tactics[1], p); var r=[s.length, s[0]&&s[0].m===m, p.tactics[1].supports[0]===m.id];
      p.measures.shift(); p.measures.splice(1,0,m); renumberUnit(UNITS.mobile);
      return r.concat([JSON.stringify(p.measures.map(m=>m.id).concat(p.tactics.map(t=>t.id)))===keep])}""" % P)
    ok("renumbered after the move, the pointer follows the measure's new id; put back, the ids are what they were", rn == [1, True, True, True], rn)
    fg = safe(pg, """()=>{var p=%s; var m=p.measures[0]; forgetSupport(m.id);
      var r=JSON.stringify(p.tactics[0].supports); p.tactics[0].supports=[p.measures[0].id, p.measures[1].id]; return r}""" % P)
    ok("a measure forgotten leaves its tactic pointing only at the other", fg == '["%s"]' % ids[1], fg)

    print("\n6 · the deck, Performance and the workbook")
    dk = safe(pg, "()=>{var h=deckHtmlFor('mobile'); return [h.indexOf('<span class=\"dsub\">KM 1  \\u00b7  KM 2</span>'), h.indexOf('<span class=\"dsub\">KM 2</span>')]}")
    ok("the review deck carries the line under both tactics", dk and all(x >= 0 for x in dk), dk)
    PLAN = """()=>{var out=[]; [].forEach.call(planDeckBox('mobile').querySelectorAll('.dslide'), function(sl){ out=out.concat(deckSlidePptx(sl,'Mobile',null)); }); return out}"""
    px = safe(pg, "()=>{var s=(" + PLAN + ")().join(''); return [s.indexOf('KM 1'), s.indexOf('KM 2')]}")
    ok("and so does the plan download", px and all(x >= 0 for x in px), px)
    safe(pg, "()=>{ current='mobile'; EDIT_PAGE={}; REPORTING=null; paint(); }"); pg.wait_for_timeout(250)
    click(pg, "[data-s='performance']", 600)
    pf = safe(pg, """()=>[...document.querySelectorAll('#panel .kmnums')].map(x=>[...x.querySelectorAll('.kmtag')].map(t=>t.textContent))""")
    ok("Performance carries the same two lines", pf and pf[:2] == [["KM 1", "KM 2"], ["KM 2"]], pf)
    rt = safe(pg, """async ()=>{ try {
        var u = UNITS.mobile, wb = planWorkbook(u), p = u.items[0];
        var sh = wb.filter(x=>x.name==='Tactics')[0], ci = sh.head.indexOf('Key measures');
        var cell = sh.rows[0][ci], cell2 = sh.rows[1][ci];
        var bytes = buildXlsx(wb);
        var sheets = await readXlsx(bytes.buffer ? bytes.buffer : bytes);
        applyPlanReplace(u, planFromWorkbook(u, sheets));
        p = u.items[0];
        return { ci: ci, cell: cell, cell2: cell2,
                 back: JSON.stringify(supportsOf(p.tactics[0], p).map(x=>x.n)), back2: JSON.stringify(supportsOf(p.tactics[1], p).map(x=>x.n)),
                 none: u.items.reduce((n,q)=>n+q.tactics.filter(t=>'supports' in t).length,0) };
      } catch(e){ return {err:String(e)}; } }""")
    ok("the Tactics sheet carries a Key measures column", rt and rt.get("ci", -1) >= 0, rt)
    ok("…holding the measures' NAMES, several '|'-separated", rt and rt.get("cell") == mn[0] + " | " + mn[1] and rt.get("cell2") == mn[1], rt)
    ok("a round trip brings both tactics' lists back", rt and rt.get("back") == "[1,2]" and rt.get("back2") == "[2]", rt)
    ok("and no other tactic gains a key", rt and rt.get("none") == 2, rt)
    nm = safe(pg, """()=>{var u=UNITS.mobile, p=u.items[0]; var names=p.measures.map(m=>m.name);
      var a=kmMatch('2 | KM 4 | '+names[0].toUpperCase()+' | nowhere', names); return [a.hit, a.miss]}""")
    ok("a number, 'KM 4' and a name in another case are read; a stranger is named back (§96.2)", nm == [[1, 3, 0], ["nowhere"]], nm)
    vp = safe(pg, """()=>{var rows=[{type:'PILLAR',id:'x-P1',name:'P'},{type:'MEASURE',id:'x-P1-M1',parent_id:'x-P1',name:'Alpha'},
      {type:'TACTIC',id:'x-P1-T1',parent_id:'x-P1',name:'T',kms:'Alpha | Beta',q1:'1',q2:'0',q3:'0',q4:'0'}];
      var v=validatePlan(UNITS.mobile, rows); return (v.problems||v).filter(x=>/key measure/.test(x.msg)).map(x=>x.msg)}""")
    ok("the file check says which key measure is not on the Measures sheet", vp and len(vp) == 1 and '"Beta"' in vp[0], vp)
    safe(pg, "()=>{UNITS.mobile.items.forEach(p=>p.tactics.forEach(t=>{delete t.supports;}));}")
    hd = safe(pg, "()=>planWorkbook(UNITS.mobile).filter(x=>x.name==='Tactics')[0].head.indexOf('Key measures')")
    ok("nothing stored, the file carries no such column", hd == -1, hd)
    b.close()

ok("no page errors", not errs, errs[:3])
print("\n%d FAILED" % len(fails) if fails else "\nall good")
