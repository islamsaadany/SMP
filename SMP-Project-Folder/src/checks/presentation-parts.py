"""A PART OF THE RUNNING ORDER THAT IS NOT A BOX (§553).

Islam, of the presentation: *"we choose to present the foundation and then
the swot if needed and then every direction and capability in the sequence
selected and then the functions in the sequence selected as well"* — so the
company's own Foundation and its SWOT are parts you PLACE, and the review
can open on them instead of ending on them.

WHAT IS ASSERTED, AND WHY EACH:

· OFFERED, NOT PLACED. The danger of this change is that it moves every
  tenant's review by arriving in the DEFAULT order — the first draft did
  exactly that, because `masterOrder` falls back to the whole list of
  subjects. So the two lists are asserted apart: placeable includes it, the
  default does not, and nothing is stored until somebody places it (§50.6).

· THE ROUND TRIP RESTORES THE ABSENCE. Placing it writes a flow; taking it
  out again must DELETE the key rather than store a copy of the default,
  or tomorrow's new unit never joins the flow of a tenant that never chose
  one.

· AGREEMENT, NEVER A LITERAL (§94.8). The part's Foundation slide is
  asserted to be the SAME slide the company's own deck draws, compared in
  the same run — so a client whose Foundation says something else stays
  green, and a build that grew a second description of it does not.

· "IF NEEDED" IS HALF THE SENTENCE. A part that would draw nothing is not
  offered at all (§45.2, §61), and BOTH ENDS are made here: the SWOT off,
  then switched on.

It MAKES its state (§255); SMP_BUILT points it at another build (§276).
"""
import os, sys, json
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
bad = 0
def ck(name, ok, x=""):
    global bad
    print(("  ok    " if ok else "  FAIL  ") + name + ("" if ok else "  — %s" % (x,)))
    if not ok: bad += 1
def ev(pg, js, d=None, a=None):
    try: return pg.evaluate(js, a) if a is not None else pg.evaluate(js)
    except Exception as e: return d if d is not None else {"threw": str(e)[:90]}

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto("file://" + os.path.abspath(BUILT)); pg.wait_for_timeout(900)

    print("1 · a section part is a target like any other")
    ck("`sec:` parses as its own kind, not as a business unit",
       ev(pg, "()=>SMPRules.boxRef('sec:found').kind") == "sec",
       ev(pg, "()=>SMPRules.boxRef('sec:found').kind"))
    ck("…and it is named by what it is",
       "Foundation" in (ev(pg, "()=>placeLabel('sec:found')", "") or ""),
       ev(pg, "()=>placeLabel('sec:found')"))

    print("\n2 · OFFERED, NOT PLACED — the half that would move every tenant")
    ck("the Foundation is placeable",
       "sec:found" in (ev(pg, "()=>masterSubjects()", []) or []))
    ck("…and is NOT in the order a tenant that chose nothing gets",
       "sec:found" not in (ev(pg, "()=>masterDefault()", []) or []))
    ck("…so the running order does not have it",
       "sec:found" not in (ev(pg, "()=>masterOrder()", []) or []))
    ck("…and nothing is stored", ev(pg, "()=>!!GROUP[SMPRules.MASTER_FLOW]") is False)
    before = ev(pg, "()=>masterOrder()", [])

    print("\n3 · placing it, and taking it out again")
    ev(pg, "()=>{var o = masterOrder().slice(); o.unshift('sec:found'); masterWrite(o);}")
    ck("placing it puts it first", (ev(pg, "()=>masterOrder()", []) or [])[:1] == ["sec:found"],
       ev(pg, "()=>masterOrder().slice(0,2)"))
    ck("…and the choice is stored", ev(pg, "()=>!!GROUP[SMPRules.MASTER_FLOW]") is True)
    ev(pg, "()=>masterWrite(masterDefault().slice())")
    ck("taking it out gives back the order it had",
       ev(pg, "()=>masterOrder()", []) == before, [ev(pg, "()=>masterOrder()"), before])
    ck("…and DELETES the key rather than storing a copy of the default (§50.6)",
       ev(pg, "()=>!!GROUP[SMPRules.MASTER_FLOW]") is False)

    print("\n4 · what it presents is the company's own Foundation, not a second one")
    n = ev(pg, """()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('sec:found');
      return [...d.querySelectorAll('.dslide')].map(s=>s.getAttribute('data-anchor'));}""", [])
    # §557, rewritten to the deck model (§218): the part is the company's
    # whole Foundation — Who we are, the aim and the values, each where the
    # structure has it on and it is written — read off the company's OWN
    # deck between its divider and the next one, never off a list (§94.8).
    want = ev(pg, """()=>{var d=document.createElement('div'); d.innerHTML=deckHtmlFor('group');
      var a=[...d.querySelectorAll('.dslide')].map(s=>s.getAttribute('data-anchor'));
      var i=a.indexOf('sfound'); if(i<0) return null; var out=[];
      for(var j=i+1;j<a.length && !/^s(found|wot|pillars|caps|projects|perf)|^swothead$/.test(a[j]);j++) out.push(a[j]);
      return out;}""")
    ck("it is a cover, the company's whole Foundation and a Thank you (§557)",
       bool(want) and n == ["cover"] + want + ["end"] and "aim" in n, [n, want])
    ck("…and the Foundation slide AGREES with the company review's own (§94.8)",
       ev(pg, """()=>{var a=document.createElement('div'), b=document.createElement('div');
         a.innerHTML = deckHtmlFor('sec:found');
         b.innerHTML = companyFoundationSlides(topAsUnit()).join('');
         var pick = x => [...x.querySelectorAll('.dslide')]
            .filter(s=>s.getAttribute('data-anchor')==='aim')
            .map(s=>s.textContent.replace(/\\s+/g,' ').trim())[0] || '';
         return pick(a) === pick(b) && pick(a).length > 20;}""") is True)

    print("\n5 · “if needed”: a part with nothing in it is not offered (BOTH ENDS)")
    ck("(fixture) the company's SWOT is off, so the part is not offered",
       "sec:swot" not in (ev(pg, "()=>masterSubjects()", []) or []),
       ev(pg, "()=>masterSubjects().filter(t=>t.indexOf('sec:')===0)"))
    made = ev(pg, """()=>{
      var st = JSON.parse(JSON.stringify(SMPRules.structureOf(GROUP) || {}));
      /* From the EFFECTIVE list, not an empty one: with no stored answer the
         top layer reads every part ON, and starting from [] switched the
         aim and the objectives off while switching the SWOT on — invisible
         until §557 made the deck follow the structure. */
      st.top = st.top || {}; st.top.on = (st.top.on || SMPRules.STRUCT_COMPONENTS.slice()).concat(['swot']);
      GROUP.structure = st;
      GROUP.swot = { s:['A real strength'], w:['A real weakness'], o:[], t:[] };
      return compOn('group','swot');}""")
    ck("switching the company's SWOT on", made is True, made)
    ck("…now it IS offered", "sec:swot" in (ev(pg, "()=>masterSubjects()", []) or []),
       ev(pg, "()=>masterSubjects().filter(t=>t.indexOf('sec:')===0)"))
    ck("…and it draws something", ev(pg, """()=>{var d=document.createElement('div');
       d.innerHTML=deckHtmlFor('sec:swot'); return d.querySelectorAll('.dslide').length;}""", 0) >= 3)
    ck("…and it is still not in the default order",
       "sec:swot" not in (ev(pg, "()=>masterDefault()", []) or []))

    print("\n6 · the picker shows it as a section, with its name and its length")
    ev(pg, "()=>masterOpen()"); pg.wait_for_timeout(600)
    ck("the dialog opens", ev(pg, "()=>!!document.getElementById('modal-b')") is True)
    ck("…it offers the part", "sec:found" in (ev(pg,
       "()=>[...document.querySelectorAll('[data-mftick]')].map(b=>b.dataset.mftick)", []) or []))
    row = ev(pg, """()=>{var r=[...document.querySelectorAll('tr')]
       .find(x=>/Foundation/.test(x.textContent)); return r? r.textContent.replace(/\\s+/g,' ').trim():'';}""", "")
    ck("…calls it a SECTION, not a business unit", "SECTION" in row, row[:70])
    ck("…and says how many slides it is", any(c.isdigit() for c in row), row[:70])

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\nall good" if not bad else "\n%d FAILED" % bad)
sys.exit(1 if bad else 0)
