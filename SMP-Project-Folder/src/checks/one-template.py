"""Every box's presentation is one template, in one order (§565).

Spec 066 §5, agreed by Islam: *"one template for every box, built from its
sections in a fixed order: cover → Foundation → Analysis → Plan → results →
notes → Thank you"*. A unit's deck and a function's were two builders that
each wrote their own cover, closing block, notes and Thank you; they are one
template now (`deckOf`) with only the plan part differing.

TWO HALVES (§94.2). The ORDER, asked of every deck the worked example and an
El Abd-shaped company can draw: cover first, Thank you last, the dividers in
the template's order, notes immediately before Thank you, where-it-stands
after the Overall performance divider. And the SOURCE: the cover and the
Thank you are written once, so a new builder that writes its own is caught
here rather than drifting for a month. SMP_BUILT points it at another build.
"""
import os, re
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(HERE, "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1

RANK = {"sfound": 1, "swothead": 2, "fnsw": 2, "spillars": 3, "scaps": 3, "sprojects": 3, "sperf": 4}
ANCHORS = """(t)=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor(t);
  return [...d.querySelectorAll('.dslide')].map(s=>s.dataset.anchor||'')}"""
MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true, plan:{split:true}}};
  GROUP.swot = {s:['Brand'], w:['Cost'], o:['Exports'], t:['FX']};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', kind:'', theme:'', owner:'A',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100', compile:'Sum', actual:'80'}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Capability one', kind:'Capability', theme:'', owner:'B',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  paint(); return true}"""

def order_ok(a):
    if not a: return "no slides"
    if a[0] not in ("cover",): return "does not open on the cover: " + a[0]
    if a[-1] != "end": return "does not end on Thank you: " + a[-1]
    ranks = [RANK[x] for x in a if x in RANK]
    if ranks != sorted(ranks): return "dividers out of order: " + ",".join(x for x in a if x in RANK)
    if "notes" in a and a.index("notes") != len(a) - 2: return "notes not just before Thank you"
    if "stand" in a and "sperf" in a and a.index("stand") < a.index("sperf"): return "stands before its divider"
    return ""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)
    targets = pg.evaluate("()=>Object.keys(UNITS).concat(['group']).concat(Object.keys(FUNCTIONS).map(k=>'fn:'+k))")
    kinds = pg.evaluate("""()=>({pillars: Object.keys(UNITS).filter(k=>!unitWayOf(UNITS[k])).length,
      fnProjects: Object.keys(FUNCTIONS).filter(k=>!plansInPillars('fn:'+k) && !plansInObjectives('fn:'+k)).length,
      fnPillars: Object.keys(FUNCTIONS).filter(k=>plansInPillars('fn:'+k)).length})""")
    # Objectives-and-actions is the one way the worked example does not plan;
    # it goes through `projectsPlanPart` exactly as projects do.
    ck("the worked example holds a pillars unit, a projects function and a pillars function",
       all(kinds[k] > 0 for k in kinds), kinds)
    wrong = []
    for t in targets:
        a = pg.evaluate(ANCHORS, t); why = order_ok(a)
        if why: wrong.append((t, why))
    ck("every unit's and function's deck runs cover · Foundation · Analysis · plan · performance · notes · Thank you",
       not wrong, wrong[:4])
    pg.evaluate(MAKE); pg.wait_for_timeout(300)
    a = pg.evaluate(ANCHORS, "group")
    ck("…and a company that plans on its own, its directions and capabilities apart", not order_ok(a) and "scaps" in a, (order_ok(a), a))
    ck("no page errors", not errs, errs[:3])
    b.close()

# ── THE SOURCE: the slides around the plan are written once ──────────
src = open(os.path.join(HERE, "..", "present.js"), encoding="utf-8").read()
if os.environ.get("SMP_BUILT"):
    src = open(BUILT, encoding="utf-8").read()
ck("the Thank you slide is written in one place", len(re.findall(r'd-cover d-thanks', src)) == 1,
   len(re.findall(r'd-cover d-thanks', src)))
ck("the cover slide is written in one place", len(re.findall(r'anch\("cover", "After the cover"\)', src)) == 1,
   len(re.findall(r'anch\("cover", "After the cover"\)', src)))
ck("the notes slide is written in one place", len(re.findall(r'<h2>Notes and achievements</h2>', src)) == 1,
   len(re.findall(r'<h2>Notes and achievements</h2>', src)))
ck("the Overall performance divider is written in one place", len(re.findall(r'sectSlide\("sperf"', src)) == 1,
   len(re.findall(r'sectSlide\("sperf"', src)))

print("\n" + ("one-template: all passed" if not bad else "one-template: %d FAILED" % bad))
raise SystemExit(1 if bad else 0)
