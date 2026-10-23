"""A client that plans at both levels presents both (§588).

Stage 4 lets a client have business units AND a company that plans its own
directions or capabilities (§544, "both can be on"). The Master presentation
offers the company's own plan first among the units (§428) — and labelled it
a business unit on such a client (Wander Development). And a box shown
apart that holds only capabilities is called by that word on every slide,
the closing one included.

BOTH ENDS (§94.2): offered once where the company plans; not offered where
it does not; labelled as the company; the slide words follow the kind held.
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

BOTH = """()=>{
  GROUP.structure = Object.assign({}, GROUP.structure || {});
  GROUP.structure.top = Object.assign({}, GROUP.structure.top || {}, {plan:{way:'pillars', split:true}});
  GROUP.items = [
    {id:'group-P1', code:'C1', name:'Data and dashboards', kind:'Capability', theme:'', owner:'',
     measures:[{id:'group-P1-M1', name:'Reports live', dir:'\\u2265', target:'10', compile:'Sum', actual:'6'}], tactics:[]},
    {id:'group-P2', code:'C2', name:'Talent programme', kind:'Capability', theme:'', owner:'',
     measures:[{id:'group-P2-M1', name:'Hires', dir:'\\u2265', target:'5', compile:'Sum', actual:'2'}], tactics:[]}];
  delete GROUP.masterFlow; paint(); return true}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page()
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)

    before = pg.evaluate("()=>({units:SMPRules.buExists(GROUP), plans:topHasPlan(), order:masterOrder()})")
    ck("the worked example has units and no company plan of its own", before["units"] and not before["plans"], before)
    ck("…so the company's own plan is not offered", "group" not in before["order"], before["order"][-3:])

    pg.evaluate(BOTH); pg.wait_for_timeout(300)
    r = pg.evaluate("""()=>({units:SMPRules.buExists(GROUP), plans:topHasPlan(), all:masterSubjects(), order:masterOrder(), kind:masterKindWord('group')})""")
    ck("units and the company both planning", r["units"] and r["plans"], r)
    ck("the company's own plan is offered in the Master presentation", "group" in r["all"], r["all"][-3:])
    ck("…once, not twice", r["all"].count("group") == 1, r["all"])
    ck("…labelled as the company, not as a business unit", r["kind"] == "CO", r["kind"])
    opened = pg.evaluate("()=>{slidesOpenFlow(masterOrder()); var n=SLED.all.filter(e=>e.dataset.subject==='group').length; slidesClose(); return n}")
    ck("pressing Go draws the company's slides in the flow", opened and opened > 0, opened)

    st = pg.evaluate("""()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('group'); var s=d.querySelector('[data-anchor=stand]'); return s?s.textContent:''}""")
    ck("a company of capabilities only stands as Capabilities", "Capabilities performance" in st and "2 Capabilities" in st and "Pillars" not in st, st[:160])
    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("both-levels: all passed" if not bad else "both-levels: %d FAILED" % bad))
raise SystemExit(1 if bad else 0)
