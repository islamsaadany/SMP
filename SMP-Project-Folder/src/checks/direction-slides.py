"""A direction's own slides, from the direction (§561).

Islam: *"Slides edition should happen from the direction or the capability
part"* — the Master presentation stays a management area, and the office had
no way into one direction's slides at all. Then, on the mockup: *"keep the
slides button for the smo only … and keep add a final slide to the master
presentation"*.

It MAKES its state (§255): the company plans its own directions, the business
units off. BOTH ENDS (§94.2): the office gets the button and it opens that
direction and not another; the slide added there is the direction's and shows
in the Master presentation; the direction's own owner and somebody who owns
nothing get no button; the master keeps its final-slide add. SMP_BUILT points
it at another build (§276).
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
    except Exception as e: return dflt

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Hazem Roushdy', custodian:'Hossam Farid',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Somebody Else',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  current='group'; currentSub='performance'; paint(); return true}"""

PICK = """(id)=>{var b=document.querySelector('[data-urail$="|'+id+'"]'); if(b) b.click(); return !!b}"""
BTN = "()=>{var b=document.querySelector('.pane > .pband [data-dirslides]'); return b ? b.dataset.dirslides : null}"

def as_(pg, key):
    safe(pg, "()=>{switchViewer('%s'); current='group'; currentSub='performance'; paint(); return true}" % key); pg.wait_for_timeout(400)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)
    office = safe(pg, "()=>(PEOPLE.find(p=>SMPRules.mayMasterPresent(world(), p))||{}).key")
    ck("the worked example has somebody in the office", bool(office), office)
    as_(pg, office)
    safe(pg, MAKE); pg.wait_for_timeout(400)

    # ── 1. The office: the button on the direction, opening that direction ─
    safe(pg, PICK.replace("(id)=>", "()=>").replace("+id+", "+'group-P2'+")); pg.wait_for_timeout(300)
    ck("the office sees Slides on the direction it is looking at", safe(pg, BTN) == "group-P2", safe(pg, BTN))
    safe(pg, PICK.replace("(id)=>", "()=>").replace("+id+", "+'group-P1'+")); pg.wait_for_timeout(300)
    ck("…and it follows the rail to the next direction", safe(pg, BTN) == "group-P1", safe(pg, BTN))
    try: pg.click(".pane > .pband [data-dirslides]"); pg.wait_for_timeout(700)
    except Exception as e: pass
    st = safe(pg, "()=>({on:document.getElementById('slideroot').classList.contains('on'), t:SLED.target, flow:!!SLED.flow, add:!!document.querySelector('[data-sladd]')})") or {}
    ck("pressing it opens THAT direction's own slides, not the master", st.get("on") and st.get("t") == "dir:group-P1" and not st.get("flow"), st)
    ck("…where a slide can be added", st.get("add") is True, st)

    # ── 2. What is added there is the direction's, and the master shows it ─
    try: pg.click("[data-sladd]"); pg.wait_for_timeout(600)
    except Exception: pass
    ps = safe(pg, "()=>((REVIEW.slides||{})['dir:group-P1']||[]).map(s=>s.id)") or []
    ck("the slide added is kept on the direction", len(ps) == 1, ps)
    safe(pg, "()=>{slidesClose(); return true}"); pg.wait_for_timeout(300)
    safe(pg, "()=>{slidesOpenFlow(masterOrder()); return true}"); pg.wait_for_timeout(900)
    inm = safe(pg, "()=>SLED.all.filter(e=>e.dataset.subject==='dir:group-P1').map(e=>e.dataset.ps||'')") or []
    ck("…and the Master presentation shows it in that direction's part", bool(ps) and ps[0] in inm, inm)
    ck("the Master presentation keeps its own final-slide add",
       "final slide" in (safe(pg, "()=>(document.querySelector('[data-sladd]')||{}).textContent||''") or "").lower(),
       safe(pg, "()=>(document.querySelector('[data-sladd]')||{}).textContent"))
    safe(pg, "()=>{slidesClose(); return true}"); pg.wait_for_timeout(300)

    # ── 3. The office only: the owner and somebody else get no button ───
    owner = safe(pg, "()=>(PEOPLE.find(p=>p.name==='Hazem Roushdy')||{}).key")
    if owner:
        as_(pg, owner)
        safe(pg, PICK.replace("(id)=>", "()=>").replace("+id+", "+'group-P1'+")); pg.wait_for_timeout(300)
        ck("the direction's own owner gets no Slides button (the office only)", safe(pg, BTN) is None, safe(pg, BTN))
        ck("…though their own slides stay theirs to open", safe(pg, "()=>canSpeakFor('dir:group-P1')") is True)
    other = safe(pg, "()=>(PEOPLE.find(p=>p.key && !SMPRules.mayMasterPresent(world(), p) && !SMPRules.ownsTopPillar(world(), p))||{}).key")
    if other:
        as_(pg, other)
        ck("somebody who owns nothing gets no Slides button", safe(pg, BTN) is None, safe(pg, BTN))

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("PASS" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
