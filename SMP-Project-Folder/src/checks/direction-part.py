"""What a direction owner sees of the plan — the half eye (§517).

Islam, of El Abd (business units off, directions with owners): *"when they
open they see the full plan … can we make in the roles and access in the plan
visibility to have 2 visibility buttons one for the full plan and one only for
their part"*, then *"1. keep foundation 2. directions only for now 3. agreed"*
and, of the mockup, *"ok for the half eye, build it"*.

It MAKES its state (§255): the worked example plans on its business units, so
the units are switched off and two directions are written, one owned by a
person MADE for the check whose only road to the company is that direction.

  1 · the table: the Part owner row's Group / Company cell carries the half eye
      beside the eye, and the legend explains it — nowhere else (§94.2).
  2 · the press: the half eye writes GROUP.dirScope, lights itself and shows
      the eye unlit; the eye pressed again DELETES the key (§50.6).
  3 · what they see with it on: their own direction on Plan, Reporting and
      Performance and NOT the other one; the Foundation kept; the SWOT gone.
  4 · BOTH ENDS: with it off the same person sees both directions, and with it
      on the office still sees both.

SMP_BUILT points it at another build (§276). Every probe degrades (§215).
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

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  PEOPLE.push({key:'t517', name:'Testcase Part Reader', unit:'group'});
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Testcase Part Reader',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Somebody Else Entirely',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  delete GROUP[SMPRules.DIR_SCOPE];
  return true}"""

def go(pg, sub, sec=None):
    js = "()=>{current='group'; currentSub='%s';%s paint(); return true}" % (sub, (" CURSEC.%s='%s';" % (sub, sec)) if sec else "")
    safe(pg, js); pg.wait_for_timeout(300)
def as_(pg, key):
    safe(pg, "()=>{switchViewer('%s'); return true}" % key); pg.wait_for_timeout(400)
RAIL = "()=>[...document.querySelectorAll('[data-urail]')].map(b=>b.dataset.urail)"
def cell(pg):
    return safe(pg, """()=>{var tr=[...document.querySelectorAll('.acgrid tbody tr')].find(t=>/Part owner/.test(t.textContent));
      if(!tr) return null; var td=tr.querySelectorAll('td.ac')[0];
      return {half: !!td.querySelector('[data-dirscope]'), halfOn: !!td.querySelector('[data-dirscope].on'),
              eyeOn: !!td.querySelector('.stbtn.on[data-acm$="|none"]') && td.querySelector('.stbtn').classList.contains('on'),
              order: [...td.querySelectorAll('.stbtn')].map(b=>b.dataset.dirscope?'half':(b.dataset.acm||'').split('|')[1])}}""")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    ck("the state is made", safe(pg, MAKE) is True)

    # ── 1. The table ─────────────────────────────────────────────────
    safe(pg, "()=>{var g=document.querySelector('[data-md=\"setup\"]'); if(g) g.click(); return true}"); pg.wait_for_timeout(300)
    safe(pg, "()=>{var a=document.querySelector('[data-setupgo=\"access\"]'); if(a) a.click(); return true}"); pg.wait_for_timeout(400)
    c = cell(pg) or {}
    ck("the Part owner's Group / Company cell carries the half eye", c.get("half") is True, c)
    ck("…straight after the eye", (c.get("order") or [None, None])[:2] in (["none", "half"], ["view", "half"]), c)
    n = safe(pg, "()=>document.querySelectorAll('.acgrid [data-dirscope]').length", -1)
    ck("…and in no other cell", n == 1, n)
    leg = safe(pg, "()=>(document.querySelector('.chart-legend')||{}).textContent||''", "")
    ck("the legend explains it", "their part only" in leg, leg[:200])

    # ── 2. The press ─────────────────────────────────────────────────
    try: pg.click(".acgrid [data-dirscope]"); pg.wait_for_timeout(300)
    except Exception: pass
    ck("pressing it writes their-part-only", safe(pg, "()=>GROUP[SMPRules.DIR_SCOPE]") == "part")
    c = cell(pg) or {}
    ck("…lights the half eye and shows the eye unlit", c.get("halfOn") is True and not c.get("eyeOn"), c)
    try: pg.click(".acgrid tbody tr:has(td.ac [data-dirscope]) td.ac .stbtn >> nth=0"); pg.wait_for_timeout(300)
    except Exception: pass
    ck("pressing the eye gives them the full plan again (the key is DELETED)",
       safe(pg, "()=>(SMPRules.DIR_SCOPE in GROUP)", True) is False)
    ck("…and the cell still reads 'may read'", safe(pg, "()=>grantFor('dirowner','a_group')") == "view")

    # ── 3. What they see with it on ──────────────────────────────────
    safe(pg, "()=>{GROUP[SMPRules.DIR_SCOPE]='part'; return true}")
    as_(pg, "t517")
    ck("the rule says they read their part only", safe(pg, "()=>dirPartOnly()") is True)
    go(pg, "strategy", "plan")
    r = safe(pg, RAIL, []) or []
    ck("Plan lists their own direction", any("group-P1" in x for x in r), r)
    ck("…and not the other one", not any("group-P2" in x for x in r), r)
    go(pg, "report")
    r = safe(pg, RAIL, []) or []
    ck("Reporting lists their own direction and not the other", any("group-P1" in x for x in r) and not any("group-P2" in x for x in r), r)
    go(pg, "perf")
    txt = safe(pg, "()=>document.getElementById('panel').textContent", "") or ""
    ck("Performance shows their direction and not the other", "Direction one" in txt and "Direction two" not in txt, txt[:200])
    secs = safe(pg, "()=>[...document.querySelectorAll('[data-sub2]')].map(b=>b.dataset.sub2)", []) or []
    ck("the Foundation is kept", "foundation" in secs or any("found" in s for s in secs), secs)
    ck("the SWOT is not offered", not any("swot" in s for s in secs), secs)

    # ── 4. Both ends ─────────────────────────────────────────────────
    safe(pg, "()=>{delete GROUP[SMPRules.DIR_SCOPE]; paint(); return true}")
    go(pg, "strategy", "plan")
    r = safe(pg, RAIL, []) or []
    ck("with it off the same person sees both directions", any("group-P1" in x for x in r) and any("group-P2" in x for x in r), r)
    safe(pg, "()=>{GROUP[SMPRules.DIR_SCOPE]='part'; return true}")
    as_(pg, "smo")
    go(pg, "strategy", "plan")
    r = safe(pg, RAIL, []) or []
    ck("with it on the office still sees both", any("group-P1" in x for x in r) and any("group-P2" in x for x in r), r)

    ck("no page errors", not errs, errs[:3])
    b.close()
print(("%d FAILED" % bad) if bad else "all good")
