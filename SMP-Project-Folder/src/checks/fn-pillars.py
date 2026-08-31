"""A FUNCTION THAT PLANS IN PILLARS IS A UNIT'S SHAPE AND A FUNCTION'S WORDS
   (§211, §211.2).

   Islam, on Consumer Finance and Merchandising:
     · *"they have a missing item banner in the foundation"* — over a page
       whose entire content was one sentence saying "open Plan to see it",
       with a red button that opened nothing.
     · *"pressing on the CON01 22 it doesn't take me to the pillars it's stuck
       in the overview"*.

   Both come from the same place: `gapMap()` walks this format through
   `unitLike()` — right, and §59's whole point — and then handed out a UNIT's
   words for the things the two shapes do not share.

   WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM RATHER THAN THE LAYOUT (§94.8):

     1. No gap is counted for a foundation the subject does not have. Asked of
        the DATA, not of the banner: `FUNCTIONS[x].foundation` is absent and
        `unitLikeWritable()` returns null for it, so a count against it is a
        promise nothing can keep (§61).
     2. Every place the band names is reachable, and pressing its chip lands on
        that pillar with a fillable field under the cursor. The old build set a
        section key the page does not have and the renderer fell back to its
        first — assert the LANDING, never the key.
     3. The bar survives a single section. §211.2 left this format with one
        section, and the row was gated on `> 1`, which would have taken the
        count AND the fill button away from a function that genuinely owes
        targets — §61 by the road the same change was closing.
     4. One section draws NO tab button (§68: a row of one says nothing).
     5. A CAPABILITY function is untouched — both its sections, still there.
        A build that dropped the Overview everywhere would satisfy every
        assertion above (§113.8).

   §94.2 THROUGHOUT: the demo's pillars function owes nothing on its pillars,
   so every state this measures is MADE. Run against the previous build it
   fails from its first section.
"""
import os, sys, json
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(os.path.dirname(HERE), "strategy-management-platform.html")
fails = []


def ok(label, cond, detail=""):
    if cond:
        print("  ok      " + label)
    else:
        fails.append(label)
        print("  FAIL    " + label + ("  — " + str(detail) if detail != "" else ""))


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1400, "height": 800})
    # §167.2: the welcome overlay covers the viewport and eats every click.
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    fk = pg.evaluate("()=>Object.keys(FUNCTIONS).filter(k=>String(FUNCTIONS[k].format)==='pillars')[0]")
    cap = pg.evaluate("()=>Object.keys(FUNCTIONS).filter(k=>String(FUNCTIONS[k].format)!=='pillars'"
                      "&&capsOfFunction(k).length)[0]")
    T = "fn:" + (fk or "")

    print("\n── the fixture")
    ok("the demo holds a function that plans in pillars", bool(fk), fk)
    ok("...and one that does not, to compare against", bool(cap), cap)
    if not fk or not cap:
        b.close(); sys.exit(1)

    print("\n── 1 · no foundation is counted that the subject cannot hold")
    shape = pg.evaluate("""(fk)=>({
      raw: FUNCTIONS[fk].foundation === undefined || FUNCTIONS[fk].foundation === null,
      view: !(unitLike('fn:'+fk) || {}).foundation,
      writable: !(unitLikeWritable('fn:'+fk) || {}).foundation
    })""", fk)
    ok("it holds no foundation of its own", shape["raw"] and shape["view"], json.dumps(shape))
    ok("...and none can be written to it either", shape["writable"],
       "unitLikeWritable() returns one, so the gap WOULD be fillable")
    keys = pg.evaluate("(t)=>gapMap(t).map(e=>e.key)", T)
    ok("so the gap map names no Foundation", "found" not in keys, keys)
    ok("...and no Objectives (§129: they have no authoring surface anywhere)",
       "ko" not in keys, keys)

    print("\n── 2 · the band names a real place, and the chip goes there")
    # §94.2: MAKE the gap, on the SECOND pillar so the landing has to move.
    made = pg.evaluate("""(t)=>{ const u=unitLikeWritable(t);
      if ((u.items||[]).length < 2) return null;
      const m=(u.items[1].measures||[])[0]; if(!m) return null;
      const had=m.target; m.target=''; return {had:had, code:u.items[1].code}; }""", T)
    ok("a gap can be made on its second pillar", bool(made), made)
    pg.evaluate("(t)=>{ current=t; currentSub='fnstrat'; paint(); }", T)
    pg.wait_for_timeout(400)

    total = pg.evaluate("(t)=>gapTotal(t)", T)
    ok("the total counts exactly the gap that was made", total == 1, total)

    bar = pg.evaluate("()=>{const m=document.querySelector('.missbar');return m?m.textContent.trim():null}")
    ok("the missing bar is drawn", bool(bar), bar)
    ok("...and it names the PILLAR, not a foundation",
       bool(bar) and "Foundation" not in bar, bar)

    chip = pg.query_selector(".missbar .mchip")
    ok("the band offers a chip to press", chip is not None)
    if chip:
        before = pg.evaluate("()=>({sec:CURSEC.fnstrat, rail:JSON.stringify(RAIL)})")
        chip.click()
        pg.wait_for_timeout(700)
        after = pg.evaluate("()=>({sec:CURSEC.fnstrat, rail:JSON.stringify(RAIL)})")
        secs_have = pg.evaluate("""(t)=>{
          const d=(SUBS.fn||[]).filter(x=>x.k==='fnstrat')[0];
          return d && d.sections ? d.sections(t.slice(3)).map(s=>s.k) : []; }""", T)
        ok("...pressing it leaves the page on a section that EXISTS",
           after["sec"] in secs_have, {"landed": after["sec"], "sections": secs_have})
        ok("...and selects the pillar the chip named",
           made and made["code"] and made["code"] in after["rail"],
           {"before": before["rail"], "after": after["rail"]})
        ok("...and a fillable field is on the page",
           pg.evaluate("()=>document.querySelectorAll('#panel .gapwalk').length") > 0)

    print("\n── 3 · the bar survives a single section")
    n_secs = pg.evaluate("""(t)=>{
      const d=(SUBS.fn||[]).filter(x=>x.k==='fnstrat')[0];
      return d.sections(t.slice(3)).length; }""", T)
    ok("this format has exactly one section", n_secs == 1, n_secs)
    ok("...and the row is still shown, because it carries the bar",
       pg.evaluate("()=>!document.getElementById('secrow').hidden"))
    ok("...with NO tab button on it (§68: a row of one says nothing)",
       pg.evaluate("()=>document.querySelectorAll('#secrow-in [data-sub2]').length") == 0,
       pg.evaluate("()=>[...document.querySelectorAll('#secrow-in [data-sub2]')].map(b=>b.textContent)"))

    print("\n── 4 · and it disappears when nothing is owed")
    pg.evaluate("""(a)=>{ const u=unitLikeWritable(a.t);
      u.items[1].measures[0].target = a.had; paint(); }""", {"t": T, "had": made["had"]})
    pg.wait_for_timeout(400)
    ok("nothing is owed now", pg.evaluate("(t)=>gapTotal(t)", T) == 0)
    ok("...so no bar is drawn", pg.evaluate("()=>!document.querySelector('.missbar')"))
    ok("...and the row is hidden with it",
       pg.evaluate("()=>document.getElementById('secrow').hidden"))

    print("\n── 5 · where the foundation lives is still SAID")
    said = pg.evaluate("()=>document.querySelector('#panel').textContent.trim()")
    parent = pg.evaluate("(fk)=>{const f=FUNCTIONS[fk];return f.under&&UNITS[f.under]?UNITS[f.under].name:null}", fk)
    ok("the Plan names where the foundation actually is",
       "foundation is" in said and (not parent or parent in said), said[:120])

    print("\n── 6 · a capability function is untouched (§113.8)")
    pg.evaluate("(k)=>{ current='fn:'+k; currentSub='fnstrat'; paint(); }", cap)
    pg.wait_for_timeout(400)
    tabs = pg.evaluate("()=>[...document.querySelectorAll('#secrow-in [data-sub2]')].map(b=>b.textContent.trim())")
    ok("it keeps BOTH its sections", len(tabs) == 2, tabs)
    ok("...one of which is the Overview", "Overview" in tabs, tabs)
    capkeys = pg.evaluate("(k)=>gapMap('fn:'+k).map(e=>e.key)", cap)
    ok("...and its Overview is still counted", "ov" in capkeys, capkeys)

    print("\n── 7 · the tour drops a step this format cannot show (§107)")
    tour = pg.evaluate("""(a)=>{
      const r={};
      ['custodian','owner'].forEach(s=>{
        try{ const st=TOUR.stepsFor ? TOUR.stepsFor(s,'fn:'+a.fk) : null;
             r[s] = st ? st.map(x=>x.sec) : 'no accessor'; }
        catch(e){ r[s]='ERR'; }
      });
      return r; }""", {"fk": fk})
    if any(v in ("no accessor", "ERR") for v in tour.values()):
        # The tour keeps its steps private; assert the reachability instead,
        # which is the property that matters (§94.8).
        print("  note    the tour exposes no step list; asserting reachability instead")
        ok("no tour step could point at an Overview here",
           pg.evaluate("(t)=>{const d=(SUBS.fn||[]).filter(x=>x.k==='fnstrat')[0];"
                       "return d.sections(t.slice(3)).every(s=>s.k!=='found')}", T))
    else:
        for s, secs in tour.items():
            ok("the " + s + " story names no Overview section here",
               "found" not in (secs or []), secs)

    print("\n── nothing threw")
    ok("no page error at any point", not errs, errs)
    b.close()

print("\n" + ("%d FAILED" % len(fails) if fails else "all good"))
sys.exit(1 if fails else 0)
