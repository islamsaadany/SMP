"""The plan download is the presentation's own slides without figures (§564).

Islam, on the mockup: *"proceed"* — spec 066 §5, *"the plan download is the
same template without the reported figures — never a second builder"*. It
had its own builder, which drifted from the deck and made NO FILE AT ALL for
a company whose plan is the company's own (El Abd: `UNITS["group"]`).

BOTH ENDS (§94.2): what the plan keeps (the deck's slides, in the deck's
order; every direction; the targets) and what it drops (every reported
figure, the Overall performance part, the tallies). It MAKES the company
state (§255). SMP_BUILT points it at another build (§276).
"""
import os, io, re, base64, zipfile
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

FILE = r"""(t)=>{ const b = buildPlanPptx(t); let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s); }"""
def slides_text(b64):
    z = zipfile.ZipFile(io.BytesIO(base64.b64decode(b64)))
    names = sorted([n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml$", n)],
                   key=lambda n: int(re.findall(r"\d+", n)[0]))
    # §573: a paragraph's runs are joined as PowerPoint shows them, and the
    # paragraphs with a space -- a figure's unit is a run of its own now.
    return [" ".join("".join(re.findall(r"<a:t>([^<]*)</a:t>", p))
                     for p in re.findall(r"<a:p>.*?</a:p>", z.read(n).decode("utf-8"), re.S))
            for n in names]

MAKE = """()=>{
  GROUP.structure = {bu:{exists:false}, top:{on:SMPRules.STRUCT_COMPONENTS.slice(), temple:true}};
  GROUP.items = [
    {id:'group-P1', code:'EA01', name:'Direction one', sub:'', kind:'', theme:'', owner:'Hazem Roushdy',
     measures:[{id:'group-P1-M1', name:'Revenue line', dir:'\\u2265', target:'100 M EGP', compile:'Sum', actual:'87 M EGP'}],
     tactics:[{id:'group-P1-T1', name:'Open stores', owner:'Hazem Roushdy', q1:1, actual:'40'}]},
    {id:'group-P2', code:'EA02', name:'Direction two', sub:'', kind:'', theme:'', owner:'Somebody Else',
     measures:[{id:'group-P2-M1', name:'Share line', dir:'\\u2265', target:'10%', compile:'Latest', actual:''}], tactics:[]}];
  paint(); return true}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(1200)

    # ── 1. A unit: the deck's own slides, in its order, without figures ─
    f = safe(pg, FILE, "mobile")
    ck("Mobile's plan downloads", isinstance(f, str), f)
    if isinstance(f, str):
        tx = slides_text(f)
        allt = " ".join(tx)
        deck = safe(pg, """()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('mobile');
          return [...d.querySelectorAll('.dslide')].map(s=>s.dataset.anchor||'')}""") or []
        plan = safe(pg, "()=>[...planDeckBox('mobile').querySelectorAll('.dslide')].map(s=>s.dataset.anchor||'')") or []
        ck("every plan slide is a slide of the presentation, in the same order",
           bool(plan) and [a for a in deck if a in plan] == plan, (plan[:8], deck[:8]))
        ck("…the cover, Foundation and Thank you are kept", plan[:1] == ["cover"] and "sfound" in plan and plan[-1:] == ["end"], plan)
        ck("…the Overall performance part is not", not any(a in plan for a in ["sperf", "stand", "pillars", "notes", "objectives"]), plan)
        ck("the cover says it is the plan", "Strategy plan" in tx[0] and "no reported figures" in tx[0], tx[0][:120])
        ck("no figure column survives", not any(w in allt for w in ["YTD actual", "Progress ", " Actual "]), None)
        for figure in ["2.7B", "48%", "3,180"]:
            ck("no reported figure leaks in (" + figure + ")", figure not in allt)
        ck("a target is still there", "6.2B EGP" in allt or "6.2B" in allt)
        ck("DECK_PLAN is off again once the file is made", safe(pg, "()=>DECK_PLAN") is False)
        ck("the presentation itself still carries its figures",
           "YTD actual" in (safe(pg, "()=>deckHtmlFor('mobile')") or ""))

    # ── 2. A company whose plan is its own: it downloads at all ────────
    safe(pg, MAKE); pg.wait_for_timeout(300)
    g = safe(pg, FILE, "group")
    ck("the company's own plan downloads (it made no file before)", isinstance(g, str), g)
    if isinstance(g, str):
        allg = " ".join(slides_text(g))
        ck("…every direction is in it, with its measures and tactics",
           all(w in allg for w in ["Direction one", "Direction two", "Revenue line", "Share line", "Open stores"]), allg[:300])
        ck("…with its target and without what was reported", "100M EGP" in allg and "87" not in allg, allg[:400])
        ck("…and no Overall performance part", "Overall performance" not in allg and "where we stand" not in allg.lower(), None)
    ck("the file is named for the company", "Strategy plan.pptx" in (safe(pg, "()=>planPptxName('group')") or "")
       and "undefined" not in (safe(pg, "()=>planPptxName('group')") or "undefined"), safe(pg, "()=>planPptxName('group')"))

    # ── 3. A function that plans in projects ───────────────────────────
    fn = safe(pg, FILE, "fn:marketing")
    ck("a function's plan downloads", isinstance(fn, str), fn)
    if isinstance(fn, str):
        allf = " ".join(slides_text(fn))
        ck("…its milestones say no tally", "completed" not in allf, None)
        ck("…and no status or progress column", not re.search(r"\bStatus\b", allf), None)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n" + ("plan-download: all passed" if not bad else "plan-download: %d FAILED" % bad))
raise SystemExit(1 if bad else 0)
