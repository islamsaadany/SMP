"""The pillar rail selects by the pillar's row id, never its code (§393).

Islam, from a client's plan: "when I click on the E5 I can't click E3 and E2
only E1". Four of five pillars there carried an EMPTY stored code (a pillar
added with the pen is minted `code: ""`), the rail keyed on that code, so all
four lit at once and pressing any of them opened the first.

The state is MADE (§255): the worked example's pillars all carry codes, so
nothing here would fail on it. Three shapes, on a unit, since that is where
it was reported:
  - codes blanked on three pillars (his tenant)
  - two pillars sharing one non-empty code (an upload can do that)
  - pillars added through addPillar(), the real way the blank arrives
Each is walked on every page that draws the rail: Plan, Performance and
Reporting. For every row pressed, exactly ONE row is lit, it is the row that
was pressed, and the pane shows that pillar — both ends, so a build that
lights nothing fails as surely as one that lights everything (§94.2).

SMP_BUILT points it at another build (§334.13). Every probe degrades (§215).
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
F = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
bad = 0

def ck(label, cond, detail=""):
    global bad
    if cond: print("  ok   " + label)
    else:
        bad += 1; print("  FAIL " + label + ("  -> " + str(detail) if detail != "" else ""))

def ev(pg, js, arg=None):
    try: return pg.evaluate(js, arg)
    except Exception as e: return {"__err": str(e)[:200]}

SETUPS = {
  "blank codes (his tenant)": """()=>{ var u=UNITS.mobile;
      u.items.forEach(function(p,i){ if(i!==1) p.code=''; }); return u.items.length; }""",
  "two pillars share a code": """()=>{ var u=UNITS.mobile;
      u.items[2].code = u.items[0].code; return u.items.length; }""",
  "pillars added with the pen": """()=>{ var u=UNITS.mobile;
      var a=addPillar(u); a.name='Added pillar A';
      var b=addPillar(u); b.name='Added pillar B'; return u.items.length; }""",
}

PAGES = [("plan", "strategy", "plan"), ("performance", "performance", None),
         ("reporting", "report", None)]

WALK = """(a)=>{
  var u = UNITS.mobile, out = [];
  for (var i = 0; i < u.items.length; i++) {
    var btns = [].slice.call(document.querySelectorAll('.rail [data-urail^="mobile|"]'));
    if (btns.length !== u.items.length) return {rows: btns.length, want: u.items.length};
    btns[i].click();
    var now = [].slice.call(document.querySelectorAll('.rail [data-urail^="mobile|"]'));
    var lit = now.map(function(b,j){ return b.classList.contains('on') ? j : -1; })
                 .filter(function(j){ return j >= 0; });
    var name = u.items[i].name || '';
    var pane = document.querySelector('#panel .pane');
    var txt = pane ? pane.textContent : '';
    out.push({i: i, lit: lit, shows: name ? txt.indexOf(name) >= 0 : null});
  }
  return out; }"""

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    for label, setup in SETUPS.items():
        for page, sub, sec in PAGES:
            pg = b.new_page(viewport={"width": 1440, "height": 900})
            pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                               "sessionStorage.setItem('smp.tour.later','1');"
                               "localStorage.setItem('smp.tour.never','1')}catch(e){}")
            errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto("file://" + os.path.abspath(F)); pg.wait_for_timeout(700)
            n = ev(pg, setup)
            ev(pg, """(a)=>{ current='mobile'; currentSub=a[0];
                 if (a[1]) CURSEC[a[0]] = a[1];
                 if (a[0]==='report' && typeof REPORTING!=='undefined') REPORTING='mobile';
                 paint(); }""", [sub, sec])
            pg.wait_for_timeout(300)
            print("\n── %s · %s ──" % (label, page))
            # Three rail builders, one per page: prove each was the one drawn,
            # or all three sections measure the Plan's rail (§50.6).
            where = ev(pg, """()=>({sub: currentSub,
                 rep: !!document.querySelector('.repchrome'),
                 plan: !!document.querySelector('#panel .pane .measures, #panel .pane table')})""")
            want = {"plan": "strategy", "performance": "performance", "reporting": "report"}[page]
            ck("the page drawn is " + page,
               isinstance(where, dict) and where.get("sub") == want and
               (where.get("rep") if page == "reporting" else not where.get("rep")), where)
            res = ev(pg, WALK)
            if isinstance(res, dict):
                ck("the rail draws one row per pillar", False, res); pg.close(); continue
            ck("the rail draws one row per pillar", len(res) == n, len(res))
            ck("pressing each row lights exactly that row",
               all(r["lit"] == [r["i"]] for r in res), [r["lit"] for r in res])
            ck("...and the pane shows that pillar",
               all(r["shows"] is not False for r in res),
               [r["i"] for r in res if r["shows"] is False])
            ck("no page error", not errs, errs[:2])
            pg.close()
    b.close()

print("\n" + ("all pillar-rail checks passed" if not bad else "%d FAILED" % bad))
sys.exit(1 if bad else 0)
