"""How many slides each subject may add, and one word for its slides (§562).

Islam: *"a direction owner can add max of 2 slides and the units owner can
add 4 max"*, agreed on: a capability a direction's size, a function a unit's,
the company's closing slides 4, counted per subject whoever adds. And: *"for
the direction owner he can get slides only to manage and present from
inside"* — the press that opens a subject's own slides reads Slides.

BOTH ENDS (§94.2): the add goes in up to the limit and is refused past it,
with the reason; somebody who cannot edit still reads Present; an owner of
two directions gets a line for each, and each opens its own. It MAKES its
company state (§255). SMP_BUILT points it at another build (§276).
"""
import os
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, detail=""):
    global bad
    print(("  ok   " if ok else "  FAIL ") + name + ("" if ok else "  — " + str(detail)))
    if not ok: bad += 1
def safe(pg, js, arg=None, dflt=None):
    try: return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e: return dflt

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Hazem Roushdy',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Hazem Roushdy',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  paint(); return true}"""
MENU = """(a)=>{switchViewer(a[0]); current=a[1]; currentSub=a[2]; paint();
  var m=[...document.querySelectorAll('.dlmenu')].find(x=>x.querySelector('[data-present],[data-deckpdf],[data-master]')); if(!m) return null;
  return [...m.querySelectorAll('[data-present]')].map(b=>({t:b.childNodes[0].textContent.trim(), p:b.dataset.present}))}"""
FILL = """(n)=>{var out=[]; for(var i=0;i<n;i++){ var b=document.querySelector('[data-sladd]'); if(!b) break; b.click();
  out.push([pslidesOf(SLED.target).length, (document.querySelector('.picerr')||{}).textContent||'']); } return out}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)

    # ── 1. The numbers, written once ─────────────────────────────────
    got = safe(pg, "()=>['dir:x','cap:x','mobile','fn:finance','group'].map(t=>SMPRules.slidesMax(t))")
    ck("2 for a direction or capability, 4 for a unit, a function, the company", got == [2, 2, 4, 4, 4], got)

    # ── 2. A unit: four go in, the fifth is refused with the reason ──
    safe(pg, "()=>{switchViewer('smo'); slidesOpen('unit','mobile'); return true}"); pg.wait_for_timeout(400)
    f = safe(pg, FILL, 5) or []
    ck("a unit takes four slides", [x[0] for x in f[:4]] == [1, 2, 3, 4], f)
    ck("…and refuses a fifth, saying why", len(f) == 5 and f[4][0] == 4 and "limit" in f[4][1], f[4:] if len(f) > 4 else f)
    ck("the add says how many of the four are used",
       "4 of 4" in (safe(pg, "()=>(document.querySelector('.sl-add .picsub')||{}).textContent") or ""),
       safe(pg, "()=>(document.querySelector('.sl-add .picsub')||{}).textContent"))
    safe(pg, "()=>{slidesClose(); return true}")

    # ── 3. The word: Slides where it lands on the slides, else Present ─
    m = safe(pg, MENU, ["mobhead", "mobile", "performance"]) or []
    ck("a unit's head reads Slides", any(x["t"] == "Slides" and x["p"] == "mobile" for x in m), m)
    fm = safe(pg, """()=>{switchViewer('fn_fin'); var d=document.createElement('div'); d.innerHTML=presentMenu('fn','finance');
      return [...d.querySelectorAll('[data-present]')].map(b=>({t:b.childNodes[0].textContent.trim(), p:b.dataset.present}))}""") or []
    ck("a function's head reads Slides", any(x["t"] == "Slides" and x["p"] == "fn:finance" for x in fm), fm)
    nobody = safe(pg, "()=>(PEOPLE.find(p=>{var v=VIEWER; switchViewer(p.key); var ok=!canSpeakFor('mobile'); switchViewer(v); return ok && p.key})||{}).key")
    if nobody:
        m = safe(pg, MENU, [nobody, "mobile", "performance"]) or []
        ck("somebody who cannot edit Mobile still reads Present (straight to the room)",
           all(x["t"] == "Present" for x in m) if m else True, m)

    # ── 4. A direction: two go in, the third is refused ──────────────
    safe(pg, "()=>{switchViewer('smo'); return true}"); safe(pg, MAKE); pg.wait_for_timeout(300)
    safe(pg, "()=>{slidesOpen('dir','group-P1'); return true}"); pg.wait_for_timeout(400)
    f = safe(pg, FILL, 3) or []
    ck("a direction takes two slides, even from the office", [x[0] for x in f[:2]] == [1, 2], f)
    ck("…and refuses a third, saying why", len(f) == 3 and f[2][0] == 2 and "limit" in f[2][1], f)
    safe(pg, "()=>{slidesClose(); return true}")
    ck("a refused add leaves no empty slides behind on a subject with none",
       safe(pg, "()=>{slidesOpen('dir','group-P2'); var r=!((REVIEW.slides||{})['dir:group-P2']); slidesClose(); return r}") is True)

    # ── 5. An owner of two directions: a line each, each opening its own
    key = safe(pg, "()=>(PEOPLE.find(p=>p.name==='Hazem Roushdy')||{}).key")
    m = safe(pg, MENU, [key, "group", "performance"]) or []
    ck("an owner of two directions gets a Slides line for each",
       [x["p"] for x in m] == ["dir:group-P1", "dir:group-P2"] and all(x["t"].startswith("Slides") for x in m), m)
    try:
        pg.evaluate("()=>{var d=[...document.querySelectorAll('.dlmenu')].find(x=>x.querySelector('[data-present]')); d.open=true}")
        pg.click("[data-present='dir:group-P2']"); pg.wait_for_timeout(500)
    except Exception: pass
    st = safe(pg, "()=>[document.getElementById('slideroot').classList.contains('on'), SLED.target, !!document.querySelector('[data-sladd]')]")
    ck("…and the second opens that direction's own slides, where the owner can add", st == [True, "dir:group-P2", True], st)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("slide-limits: all passed" if not bad else "slide-limits: %d FAILED" % bad))
raise SystemExit(1 if bad else 0)
