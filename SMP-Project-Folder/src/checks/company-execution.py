"""The company's own plan reads execution beside performance (§602).

Islam: *"the directions needs to have performance and execution and the
functions as well"*. The functions had both (§593); the company's own
directions — or projects — had only performance. Now each gets its
execution card beside it, read by the very rule a unit's or a function's
page reads (`unitRatio` over the company's directions, `capExec` over its
projects), and the cards stack in pairs under the objectives' column.

BOTH ENDS (§94.2): no company plan → no card (every client without one is
unchanged); directions → the card, matching `unitRatio`; projects → the
card, matching `capExec`; units off → the functions sit under the
directions; a figure past 100 keeps its bar inside the card.
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

PILLARS = """()=>{
  GROUP.structure = Object.assign({}, GROUP.structure || {});
  GROUP.structure.top = Object.assign({}, GROUP.structure.top || {}, {plan:{way:'pillars'}});
  /* two of a unit's own reported pillars, re-keyed as the company's —
     real tactics with real quarters, so execution has something to read */
  var k=UNIT_KEYS.find(k=>itemsNow(UNITS[k]).some(it=>pillarRatio(it)!=null));
  var its=itemsNow(UNITS[k]).filter(it=>pillarRatio(it)!=null).slice(0,2);
  GROUP.items = JSON.parse(JSON.stringify(its).split('"' + k + '-').join('"group-'));
  paint(); return true}"""

READ = """()=>{ current='group'; currentSub='performance'; paint();
  var b=document.querySelector('button[data-sec="0"]'); if(b) b.click();
  var cards=[...document.querySelectorAll('.scores .card')].filter(c=>!c.closest('.pane'));
  var heads=cards.map(c=>c.querySelector('h3').textContent.replace(/\\s+/g,' ').trim());
  var big=function(i){ var t=cards[i]&&cards[i].querySelector('.big'); return t?t.textContent.replace(/[^0-9]/g,''):null; };
  var exI=heads.findIndex(h=>/execution/i.test(h) && (h.indexOf(L('pillar','bu'))>=0 || h.indexOf(L('project','bu'))>=0) && h.indexOf(L('unitword','bu'))<0);
  var fills=[...document.querySelectorAll('.scores .card .fill')].map(f=>parseFloat(f.style.width));
  var rows=[...document.querySelectorAll('.scores')].filter(x=>!x.closest('.pane'));
  var fnRow=rows.find(r=>r.textContent.indexOf(L('fnword','bu'))>=0);
  return { heads:heads, exI:exI, ex:big(exI), plan:topHasPlan(), way:topWay(), units:SMPRules.buExists(GROUP),
    want: topWay()==='projects' ? (unitOwnHolder('group')?capExec(unitOwnHolder('group')).pct:null) : unitRatio(topAsUnit()),
    maxFill: fills.length?Math.max.apply(null,fills):0,
    fnGaps: fnRow?fnRow.querySelectorAll('.scores-gap').length:-1, rowsN: rows.length }}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width":1460,"height":1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)

    a = pg.evaluate(READ)
    ck("the worked example has no company plan of its own", not a["plan"], a)
    ck("…so no company execution card is drawn", a["exI"] < 0, a["heads"])

    pg.evaluate(PILLARS); pg.wait_for_timeout(200)
    d = pg.evaluate(READ)
    L_PL = pg.evaluate("()=>L('pillar')")
    ck("the company now plans in directions, beside its units", d["plan"] and d["way"] == "pillars" and d["units"], d)
    ck("the directions' execution card is drawn", d["exI"] >= 0, d["heads"])
    ck("…reading the same figure a unit's execution card reads", d["want"] is not None and d["ex"] == str(d["want"]), (d["ex"], d["want"]))
    ck("…right after the directions' performance card", d["exI"] > 0 and L_PL in d["heads"][d["exI"] - 1] and "execution" not in d["heads"][d["exI"] - 1].lower(), d["heads"])
    ck("with units and a company plan the units' pair starts its own row", d["rowsN"] >= 3, d["rowsN"])
    ck("…and the functions sit under them, one column in", d["fnGaps"] == 1, d["fnGaps"])
    ck("no bar runs past its card", d["maxFill"] <= 100, d["maxFill"])

    pg.evaluate("()=>{GROUP.structure.bu=Object.assign({},GROUP.structure.bu||{},{exists:false}); return true}")
    o = pg.evaluate(READ)
    ck("units off: the directions still read performance and execution", o["exI"] >= 0 and not o["units"], o["heads"])
    ck("…and the functions sit under the directions' two", o["fnGaps"] == 1, o["fnGaps"])

    pg.evaluate("""()=>{GROUP.structure.bu.exists=true; GROUP.structure.top.plan={way:'projects'};
      /* a function's own projects, re-keyed as the company's — real milestones */
      var c=(GROUP.capabilities||[]).find(c=>(c.projects||[]).some(p=>(p.milestones||[]).length));
      GROUP.topProjects=JSON.parse(JSON.stringify(c.projects.slice(0,2)));
      paint(); return true}""")
    q = pg.evaluate(READ)
    ck("the company now plans in projects", q["way"] == "projects" and q["plan"], q)
    ck("a company planning in projects reads their execution too", q["exI"] >= 0, q["heads"])
    ck("…the same figure a function's projects read",
       q["ex"] == ("" if q["want"] is None else str(q["want"])), (q["ex"], q["want"]))
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("company-execution: all passed" if not bad else "company-execution: %d FAILED" % bad))
raise SystemExit(1 if bad else 0)
