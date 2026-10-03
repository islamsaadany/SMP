"""The cycle board's company lines (§470).

Islam, of Setup › Reporting cycle on a client planned on the company: *"A.
separate row B. ok C. projects too"*, then *"1. reporting line 2. agreed,
build it"*. With the business units off, the single company row becomes a
block: the company's own objectives on a row of their own, then one line per
direction (or per project), each naming who reports it.

Both ends throughout (§94.2):
  * a client WITH business units (the worked example) draws no line and every
    unit row it drew before — only the first header word moved;
  * the lines are SLICES of the company's own count, asserted as an AGREEMENT
    with `askedItems()` (§94.8) — never as literals;
  * a line with nobody named says "None yet", a line saved as a draft says so,
    a submitted company says so on every line;
  * projects mode draws one line per project and no direction lines;
  * the company objectives are asked on the company Reporting page with the
    units off, a figure typed there reaches the stored plan (§96), and with
    the units on they are not asked at all.

It MAKES its state (§255). SMP_BUILT points it at another build (§276).
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
    except Exception: return dflt

BOARD = """()=>{current='setup'; currentSub='cycle'; paint();
  var t=[...document.querySelectorAll('#panel table')].filter(t=>t.querySelector('thead') && /Reporting/.test(t.querySelector('thead').textContent))[0];
  if (!t) return null;
  return {head:t.querySelector('thead th').textContent.trim(),
    lines:[...t.querySelectorAll('tr[data-line]')].map(r=>[...r.cells].map(c=>c.textContent.trim())),
    nobody:[...t.querySelectorAll('tr[data-line] td.nobody')].map(c=>[c.textContent.trim(), getComputedStyle(c).color]),
    attn:getComputedStyle(document.documentElement).getPropertyValue('--attn-tx').trim(),
    bands:[...t.querySelectorAll('tr.dxband')].map(r=>r.textContent.trim()),
    rows:t.querySelectorAll('tbody tr').length}}"""

def rgb(hexs):
    h = hexs.lstrip("#"); return "rgb(%d, %d, %d)" % tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    # ── 1. Raya: units on, nothing moves but the first word ───────────
    r = safe(pg, BOARD) or {}
    ck("the first column is the Reporting line", r.get("head") == "Reporting line", r.get("head"))
    ck("with business units there is no company line", r.get("lines") == [], r.get("lines"))
    want = safe(pg, "()=>boardUnitTargets().length + boardFunctionTargets().length + (typeof boardCapTargets==='function'?boardCapTargets().length:0)")
    ck("…and every subject still has its row", (r.get("rows") or 0) - len(r.get("bands") or []) >= (want or 99), (r.get("rows"), r.get("bands"), want))
    ck("the company objectives are not asked of a client with units",
       safe(pg, "()=>askedItems(unitLike('group')).filter(x=>x.kind==='objective').length") == 0)

    # ── 2. The units off: a block of lines ────────────────────────────
    safe(pg, """()=>{GROUP.structure=GROUP.structure||{}; GROUP.structure.bu={exists:false}; buFoldIntoTop();
      GROUP.items[0].owner=''; GROUP.items[0].custodian='';
      REVIEW.done=REVIEW.done||{}; REVIEW.done[GROUP.items[1].id]={by:'smo',at:'x'};
      if (REVIEW.submitted) delete REVIEW.submitted.group; paint()}""")
    r = safe(pg, BOARD) or {}
    lines = r.get("lines") or []
    nItems = safe(pg, "()=>unitLike('group').items.filter(runsNow).length")
    ck("one line for the objectives and one per running direction", len(lines) == 1 + (nItems or -9), (len(lines), nItems))
    ck("the first line is the company's objectives", lines and lines[0][0].endswith("objectives"), lines[:1])
    ck("a band names the directions and how many report",
       any(str(nItems) + " reporting" in x for x in (r.get("bands") or [])), r.get("bands"))
    agree = safe(pg, """()=>{var u=unitLike('group'), a=askedItems(u);
      return u.items.filter(runsNow).map(function(p){var m=a.filter(x=>x.cid===p.id && x.kind!=='objective');
        return m.filter(rowAnswered).length+'/'+m.length})}""") or []
    ck("each direction's progress is its own slice of the company's items", [l[2] for l in lines[1:]] == agree, ([l[2] for l in lines[1:]][:5], agree[:5]))
    tot = safe(pg, "()=>{var a=askedItems(unitLike('group')); return [a.filter(rowAnswered).length, a.length]}") or [0, 0]
    def frac(s): x, y = s.split("/"); return int(x), int(y)
    sums = [sum(frac(l[2])[0] for l in lines), sum(frac(l[2])[1] for l in lines)]
    ck("…and the lines add up to the company's own count", sums == tot, (sums, tot))
    ck("the objectives line counts objectives and nothing else",
       lines and lines[0][3] != "—" and lines[0][4] == "—", lines[:1])
    ck("a direction nobody is named on says None yet", lines[1][1] == "None yet" if len(lines) > 1 else False, lines[1:2])
    nb = r.get("nobody") or []
    ck("…in the warning ink", nb and nb[0][1] == rgb(r.get("attn") or "#000000"), (nb, r.get("attn")))
    ck("a named direction says who", len(lines) > 2 and lines[2][1] not in ("", "None yet"), lines[2:3])
    ck("a direction saved as a draft says Draft saved", len(lines) > 2 and lines[2][-1] == "Draft saved", lines[2:3])
    hd = safe(pg, "()=>cycleTotals().units")
    safe(pg, "()=>{REVIEW.submitted=REVIEW.submitted||{}; REVIEW.submitted.group={by:'smo',at:'x'}}")
    r2 = safe(pg, BOARD) or {}
    ck("a submitted company says Submitted on every line", all(l[-1] == "Submitted" for l in (r2.get("lines") or [[""]])), [l[-1] for l in (r2.get("lines") or [])][:4])
    ck("…and the headline counts the company once", safe(pg, "()=>cycleTotals().units") == hd)
    safe(pg, "()=>{delete REVIEW.submitted.group; paint()}")

    # ── 3. The company objectives are entered on its Reporting page ───
    n = safe(pg, "()=>askedItems(unitLike('group')).filter(x=>x.kind==='objective').length")
    ck("with the units off the company objectives are asked", (n or 0) > 0 and n == len([k for k in safe(pg, "()=>SMPRules.shown(GROUP.keyObjectives).map(k=>k.id)") or []]), n)
    kid = safe(pg, "()=>SMPRules.shown(GROUP.keyObjectives)[0].id")
    safe(pg, "()=>{current='group'; currentSub='report'; paint()}"); pg.wait_for_timeout(300)
    box = pg.query_selector('#panel input[data-rep="%s"]' % kid)
    ck("the company Reporting page draws a box for the objective", box is not None)
    if box:
        try:
            box.fill("4321"); box.press("Tab"); pg.wait_for_timeout(300)
        except Exception: pass
    got = safe(pg, "()=>String(SMPRules.shown(GROUP.keyObjectives)[0].actual||'')", "")
    ck("…and a figure typed there reaches the stored objective", "4321" in got, got)

    # ── 4. Projects mode: one line per project ────────────────────────
    safe(pg, """()=>{GROUP.structure.top=GROUP.structure.top||{}; GROUP.structure.top.plan={way:'projects'};
      GROUP.topProjects=[
        {id:'gp1',name:'Open new stores',owner:'',custodian:'',deliverables:[],milestones:[],
          outcomes:[{id:'gp1-O1',name:'Revenue',dir:'>=',target:'100',actual:'50',progress:50}]},
        {id:'gp2',name:'Digital channel',owner:'Somebody Named',deliverables:[],milestones:[],
          outcomes:[{id:'gp2-O1',name:'Share',dir:'>=',target:'10'}]}]; paint()}""")
    r = safe(pg, BOARD) or {}
    lines = r.get("lines") or []
    ck("projects mode: the objectives line and one line per project", len(lines) == 3, [l[:3] for l in lines])
    ck("…under a projects band", any("2 reporting" in x for x in (r.get("bands") or [])), r.get("bands"))
    ck("…a project with nobody named says None yet", len(lines) > 1 and lines[1][1] == "None yet", lines[1:2])
    ck("…a named project says who", len(lines) > 2 and lines[2][1] == "Somebody Named", lines[2:3])
    ck("…and each project counts its own outcome", [l[2] for l in lines[1:]] == ["1/1", "0/1"], [l[2] for l in lines[1:]])

    ck("no page error anywhere", not errs, errs)
    b.close()
print("all good" if not bad else "%d FAILED" % bad)
