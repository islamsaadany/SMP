#!/usr/bin/env python3
"""A supporting function's S&W (§399).

Islam: *"We need to add Strengths and weakness for the supporting functions"*,
then *"like the tabs of the BUs"* and *"make it S&W"*.

What is asserted, both ends each time (§94.2):
  1. Every function, whichever way it plans, has an S&W section between its
     Overview and its plan — and a business unit's SWOT still has four boxes.
  2. The S&W page draws exactly two boxes, Strengths and Weaknesses.
  3. The office's Edit on the section row opens it; + Add and the field WRITE
     the stored function (§96), and × removes the line.
  4. Somebody the rule refuses gets no Add and no fields.
  5. The deck carries one S&W slide when there is something on it, and none
     when both lists are empty (§253).
  6. Both workbooks carry an S&W sheet and read it back (§22).

Every probe degrades rather than dying (§215). SMP_BUILT points it at another
build (§276).
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)
bad = []

def ck(ok, what, detail=None):
    print(("  ok    " if ok else "  FAIL  ") + what + ("" if ok or detail is None else "  -> %r" % (detail,)))
    if not ok: bad.append(what)

def js(pg, src, arg=None):
    try: return pg.evaluate(src, arg)
    except Exception as e: return {"__error": str(e)[:200]}

GO = """(a)=>{ leaveModes && leaveModes(); current=a.t; currentSub=a.tab; CURSEC[a.tab]=a.s; paint(); return true; }"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(1200)

    print("1. every function has S&W between Overview and its plan")
    secs = js(pg, """()=>FUNCTION_KEYS.map(k=>[k, (SUBS.fn.filter(x=>x.k==='fnstrat')[0].sections('fn:'+k)||[]).map(s=>s.k+'/'+s.label)])""")
    ck(isinstance(secs, list) and len(secs) > 1, "functions found", secs)
    for k, ss in (secs if isinstance(secs, list) else []):
        ck(len(ss) >= 3 and ss[0].startswith("found/") and ss[1] == "swot/S&W",
           "%s: Overview, S&W, then its plan" % k, ss)
    formats = js(pg, "()=>Array.from(new Set(FUNCTION_KEYS.map(k=>fnFormat(FUNCTIONS[k]))))")
    ck(isinstance(formats, list) and "pillars" in formats and "projects" in formats,
       "both a pillars and a projects function are among them", formats)
    usec = js(pg, """()=>SUBS.unit.filter(x=>x.k==='strategy')[0].sections('mobile').map(s=>s.k)""")
    ck(isinstance(usec, list) and "swot" in usec, "a unit still has its SWOT section", usec)

    print("2. two boxes on a function, four on a unit")
    js(pg, "()=>{ FUNCTIONS.finance.swot = {s:['Fast close'], w:['Manual budgeting']}; }")
    js(pg, GO, {"t": "fn:finance", "tab": "fnstrat", "s": "swot"})
    boxes = js(pg, "()=>Array.from(document.querySelectorAll('#panel .swot section h3')).map(h=>h.textContent)")
    ck(boxes == ["Strengths", "Weaknesses"], "finance draws Strengths and Weaknesses only", boxes)
    txt = js(pg, "()=>document.querySelector('#panel .swot').innerText")
    ck(isinstance(txt, str) and "Fast close" in txt and "Manual budgeting" in txt, "and reads the stored lines", txt)
    js(pg, GO, {"t": "mobile", "tab": "strategy", "s": "swot"})
    ub = js(pg, "()=>document.querySelectorAll('#panel .swot section').length")
    ck(ub == 4, "a unit's SWOT is still four boxes", ub)

    print("3. the office edits it from the section row")
    js(pg, GO, {"t": "fn:hr", "tab": "fnstrat", "s": "swot"})
    had = js(pg, "()=>JSON.stringify(FUNCTIONS.hr.swot||null)")
    try:
        pg.click("#secrow-in .secpen", timeout=3000); pg.wait_for_timeout(300)
        pg.click('#panel [data-swadd="fn:hr|s"]', timeout=3000); pg.wait_for_timeout(300)
        f = pg.query_selector('#panel section.s textarea.fld')
        f.fill("Payroll never late"); f.evaluate("e=>e.blur()"); pg.wait_for_timeout(300)
    except Exception as e:
        ck(False, "pressing Edit, + Add and typing", str(e)[:160])
    got = js(pg, "()=>(FUNCTIONS.hr.swot||{}).s")
    ck(got == ["Payroll never late"], "the line reaches the stored function (it held %s)" % had, got)
    try:
        pg.click('#panel [data-swadd="fn:hr|w"]', timeout=3000); pg.wait_for_timeout(300)
        pg.click('#panel [data-swrm="fn:hr|w|0"]', timeout=3000); pg.wait_for_timeout(300)
    except Exception as e:
        ck(False, "pressing + Add then x on Weaknesses", str(e)[:160])
    ck(js(pg, "()=>(FUNCTIONS.hr.swot||{}).w") == [], "x removes the line")
    ck(js(pg, "()=>(FUNCTIONS.hr.swot||{}).s") == ["Payroll never late"], "and leaves Strengths alone")

    print("4. somebody the rule refuses cannot write it")
    who = js(pg, """()=>{ var p = PEOPLE.filter(x=>x.active!==false && !SMPRules.mayAuthorPage(world(), x, 'k_found', 'fn:hr'))[0];
                          return p ? p.key : null; }""")
    if isinstance(who, str):
        js(pg, "(k)=>{ switchViewer(k); }", who); pg.wait_for_timeout(500)
        js(pg, GO, {"t": "fn:hr", "tab": "fnstrat", "s": "swot"})
        r = js(pg, "()=>({add:document.querySelectorAll('#panel [data-swadd]').length, fld:document.querySelectorAll('#panel .swot textarea').length, pen:document.querySelectorAll('#secrow-in .secpen').length})")
        ck(isinstance(r, dict) and r.get("add") == 0 and r.get("fld") == 0, "%s sees no Add and no fields" % who, r)
        ck(js(pg, "()=>document.querySelectorAll('#panel .swot section').length") == 2, "but still reads the two boxes")
        js(pg, "()=>switchViewer('smo')"); pg.wait_for_timeout(500)
    else:
        ck(False, "found somebody the rule refuses", who)

    print("5. the deck")
    d = js(pg, """()=>{ FUNCTIONS.finance.swot = {s:['Fast close'], w:['Manual budgeting']};
                        var a = deckHtmlFor('fn:finance');
                        FUNCTIONS.finance.swot = {s:['  '], w:[]};
                        var b = deckHtmlFor('fn:finance');
                        FUNCTIONS.merchandising.swot = {s:['Buyers'], w:['Slow rotation'], o:['x'], t:['y']};
                        var c = deckHtmlFor('fn:merchandising');
                        var u = deckHtmlFor('mobile');
                        return {a:(a.match(/d-fnsw/g)||[]).length, afast:a.indexOf('Fast close')>-1,
                                b:(b.match(/d-fnsw/g)||[]).length,
                                c:(c.match(/d-fnsw/g)||[]).length, cOpp:(c.match(/d-swot/g)||[]).length,
                                u:(u.match(/d-fnsw/g)||[]).length, uswot:(u.match(/d-swot/g)||[]).length}; }""")
    ck(isinstance(d, dict) and d.get("a") == 1 and d.get("afast"), "a projects function with S&W gets one slide", d)
    ck(isinstance(d, dict) and d.get("b") == 0, "whitespace alone is not a slide", d)
    ck(isinstance(d, dict) and d.get("c") == 1 and d.get("cOpp") == 0, "a pillars function gets one S&W slide and no SWOT slides", d)
    ck(isinstance(d, dict) and d.get("u") == 0 and d.get("uswot") == 4, "a unit's deck is unchanged", d)

    print("6. the workbooks carry it and read it back")
    w = js(pg, """()=>{ FUNCTIONS.finance.swot = {s:['Fast close','Clean audit'], w:['Manual budgeting']};
        var toRows = function(sh){ return [sh.head].concat(sh.rows); };
        var wb = capPlanWorkbook(fnOwnHolder('finance'));
        var sw = wb.filter(s=>s.name==='S&W')[0];
        var sheets = {}; wb.forEach(s=>{ if (s.head) sheets[s.name] = toRows(s); });
        var rows = capPlanFromWorkbook(fnOwnHolder('finance'), sheets);
        var blank = capPlanWorkbook(blankCapShape(), {fmt:'projects', only:true}).map(s=>s.name);
        var cap = GROUP.capabilities[0];
        var capwb = cap ? capPlanWorkbook(cap).map(s=>s.name) : [];
        FUNCTIONS.merchandising.swot = {s:['Buyers'], w:['Slow rotation'], o:[], t:[]};
        var pw = planWorkbook ? null : null;
        return { sheet: sw ? sw.rows : null,
                 read: rows.filter(r=>r.type==='STRENGTH'||r.type==='WEAKNESS').map(r=>r.type+':'+r.name),
                 blank: blank.indexOf('S&W')>-1, cap: capwb.indexOf('S&W')>-1 }; }""")
    ck(isinstance(w, dict) and w.get("sheet") == [["Strength","Fast close"],["Strength","Clean audit"],["Weakness","Manual budgeting"]],
       "a function's own file carries its S&W", w)
    ck(isinstance(w, dict) and w.get("read") == ["STRENGTH:Fast close","STRENGTH:Clean audit","WEAKNESS:Manual budgeting"],
       "and reads it back", w)
    ck(isinstance(w, dict) and w.get("blank"), "the blank projects template carries the sheet", w)
    ck(isinstance(w, dict) and not w.get("cap"), "a capability's own file does not", w)
    a = js(pg, """()=>{ var c = fnOwnHolderWritable('finance');
        FUNCTIONS.finance.swot = {s:['old'], w:['old'], o:[], t:[]};
        applyCapPlanReplace(c, [{type:'STRENGTH', name:'New S'}, {type:'WEAKNESS', name:'New W'}]);
        var after = JSON.stringify(FUNCTIONS.finance.swot);
        FUNCTIONS.finance.swot = {s:['kept'], w:['kept'], o:[], t:[]};
        applyCapPlanReplace(fnOwnHolderWritable('finance'), []);
        return {after: after, old: JSON.stringify(FUNCTIONS.finance.swot)}; }""")
    ck(isinstance(a, dict) and '"s":["New S"]' in a.get("after","") and '"w":["New W"]' in a.get("after",""),
       "an upload carrying S&W replaces it", a)
    ck(isinstance(a, dict) and '"s":["kept"]' in a.get("old",""), "an older file without the sheet leaves it alone", a)

    ck(not errs, "no page errors", errs[:3])
    b.close()

print("\n%d FAILED" % len(bad) if bad else "\nall good")
sys.exit(1 if bad else 0)
