"""A direction's own deck, the company's short review, and who presents
what (§481).

Islam, on the round-2 mockup (design-mockups/direction-decks/): one short
company flow — the foundation, the analysis, the directions & capabilities,
then their performance; NO Present per direction in the menu; the Master
presentation arranges directions, capabilities and functions with the company
last; a direction's owner presses Present and sees only their own slides, and
may add picture slides to their direction.

It MAKES its state (§255) — the worked example plans on its business units —
and asserts BOTH ENDS (§94.2): the owner gets their direction and not the one
beside it, somebody who owns nothing gets no menu, and with the units ON the
group's deck is the full deck it always was. SMP_BUILT points it at another
build (§276).
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
  GROUP.swot = {s:['Brand'], w:['Cost'], o:['Exports'], t:['FX']};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Hazem Roushdy', custodian:'Hossam Farid',
     measures:[{id:'group-P1-M1', name:'Revenue', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:''}], tactics:[]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Somebody Else',
     measures:[{id:'group-P2-M1', name:'Share', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  paint(); return true}"""

HEADS = """(t)=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor(t);
  return [...d.querySelectorAll('.dslide')].map(s=>((s.querySelector('h1,h2')||{}).textContent||'').trim())}"""

def menu(pg):
    safe(pg, "()=>{current='group'; currentSub='performance'; paint(); return true}"); pg.wait_for_timeout(300)
    return safe(pg, """()=>{var m=[...document.querySelectorAll('.dlmenu')].find(x=>x.querySelector('[data-present],[data-deckpdf],[data-master]')); if(!m) return null;
      return [...m.querySelectorAll('[role=menuitem]')].map(b=>({t:b.childNodes[0].textContent.trim(),
        present:b.dataset.present||null, pdf:b.dataset.deckpdf||null, pic:b.dataset.pickey||null, master:!!b.dataset.master}))}""")

def as_(pg, key):
    safe(pg, "()=>{switchViewer('%s'); return true}" % key); pg.wait_for_timeout(400)

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(800)

    # ── 0. The control: with the units ON the group deck is the full deck ─
    ck("units on: the company review is not on", safe(pg, "()=>companyReviewOn()") is False)
    ck("units on: the company carries no presentation menu of its own", menu(pg) is None, menu(pg))

    ck("the state is made", safe(pg, MAKE) is True)
    ck("units off: the company review is on", safe(pg, "()=>companyReviewOn()") is True)

    # ── 1. The company review is one short flow ───────────────────────
    heads = safe(pg, "()=>(%s)('group')" % HEADS, []) or []
    order = ["Foundation", "Analysis", "where we stand", "stands", "Thank you"]
    pos = [next((i for i, h in enumerate(heads) if k in h), -1) for k in order]
    ck("the review runs foundation, analysis, directions, performance, thank you",
       all(x >= 0 for x in pos) and pos == sorted(pos), heads)
    ck("…and it is short — no per-direction measure slides", not any("Key measures" in h for h in heads), heads)
    ck("…seven slides at most for any number of directions", len(heads) <= 7, heads)

    # ── 2. A direction's own deck ─────────────────────────────────────
    d1 = safe(pg, "()=>(%s)('dir:group-P1')" % HEADS, []) or []
    ck("a direction's deck opens on its own cover and ends on Thank you",
       d1[:1] == ["Direction one"] and d1[-1:] == ["Thank you"], d1)
    ck("…and carries that direction's slides and no other", any("Key measures" in h for h in d1) and not any("Direction two" in h for h in d1), d1)
    who = safe(pg, "()=>{var d=document.createElement('div');d.innerHTML=deckHtmlFor('dir:group-P1');var e=d.querySelector('.dwho');return e?e.textContent:''}")
    ck("…its cover names who presents it", "Hazem Roushdy" in (who or "") and "Hossam Farid" in (who or ""), who)

    # ── 3. The master flow: directions, capabilities, functions, company last
    ms = safe(pg, "()=>masterSubjects()", []) or []
    ck("the master flow leads with the directions and ends on the company",
       ms[:2] == ["dir:group-P1", "dir:group-P2"] and ms[-1:] == ["group"], ms)
    kinds = safe(pg, "()=>masterSubjects().map(t=>masterKind(t).replace(/<[^>]+>/g,''))", []) or []
    ck("…each kind named in the picker", "DIR" in kinds and kinds[-1] == "CO", kinds)

    # ── 4. The office's menu ──────────────────────────────────────────
    m = menu(pg) or []
    ck("the office presents the whole company", any(x["t"] == "Present the whole company" and x["present"] == "group" for x in m), m)
    ck("…and no Present per direction", not any((x["present"] or "").startswith("dir:") for x in m), m)
    ck("…and keeps the Master presentation", any(x["master"] for x in m), m)

    # ── 5. The owner's menu: their slides only, no names ──────────────
    key = safe(pg, "()=>(PEOPLE.find(p=>p.name==='Hazem Roushdy')||{}).key")
    as_(pg, key)
    m = menu(pg) or []
    ck("the owner's Present opens their direction only", any(x["t"] == "Present" and x["present"] == "dir:group-P1" for x in m), m)
    ck("…the PDF is the same deck", any(x["pdf"] == "dir:group-P1" for x in m), m)
    ck("…Manage slides is their direction's, named by nothing", any(x["pic"] == "group-P1" and x["t"] == "Manage slides" for x in m), m)
    ck("…and nothing of the company's", not any(x["present"] == "group" or x["master"] for x in m), m)
    ck("canSpeakFor: their direction yes", safe(pg, "()=>canSpeakFor('dir:group-P1')") is True)
    ck("canSpeakFor: the direction beside it no", safe(pg, "()=>canSpeakFor('dir:group-P2')") is False)

    # ── 6. Somebody who owns no direction gets no menu ────────────────
    other = safe(pg, "()=>(PEOPLE.find(p=>p.key && !SMPRules.mayReportTop(world(), p) && !SMPRules.ownsTopPillar(world(), p))||{}).key")
    as_(pg, other)
    ck("somebody who owns no direction gets no Presentation menu", menu(pg) is None, (other, menu(pg)))

    # ── 7. The owner's slide reaches the deck ─────────────────────────
    as_(pg, key)
    put = safe(pg, """()=>{REVIEW.slides=Object.assign({},REVIEW.slides);
      REVIEW.slides['dir:group-P1']=[{id:'s1',title:'Site visit',at:'end',layout:'1',pics:[{src:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='}]}];
      var d=document.createElement('div'); d.innerHTML=deckBuild('dir:group-P1');
      return [...d.querySelectorAll('.dslide')].map(s=>((s.querySelector('h1,h2')||{}).textContent||'').trim())}""", []) or []
    ck("a picture slide added to the direction is in its deck", "Site visit" in put, put)

    ck("no page errors", not errs, errs[:3])
    b.close()
print(("%d FAILED" % bad) if bad else "all good")
