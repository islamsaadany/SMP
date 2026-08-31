"""A FUNCTION THAT PLANS IN PILLARS IS A UNIT'S SHAPE AND A FUNCTION'S WORDS
   (§211, §212).

   Islam, on Consumer Finance and Merchandising:
     · *"they have a missing item banner in the foundation"* — over a page
       whose entire content was one sentence saying "open Plan to see it",
       with a red button that opened nothing;
     · *"pressing on the CON01 22 it doesn't take me to the pillars it's stuck
       in the overview"*;
     · and then, on the fix: *"maintain the overview and the plan sub tabs but
       in the overview if it's empty, it's empty and if we need to add
       something, you find the button to add something."*

   §211.2 removed the Overview outright on the premise that this format can
   never hold a foundation. THE PREMISE WAS WRONG — measured against the wrong
   field name — and §212 reverses it: `fnAsUnit()` carries an aspiration, an
   end in mind, clauses, a SWOT and key objectives, `fnWriteBack()` writes all
   five, and an uploaded plan puts them there. THE PAGE was what was broken,
   never the tab.

   WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM AND NOT THE LAYOUT (§94.8):

     1. Both sections, always, whatever the data holds — so a tab cannot appear
        and disappear as rows arrive (§45.2).
     2. An EMPTY Overview can be filled: the Add controls are there behind the
        pen, and pressing them is read back FROM THE STORED FUNCTION, never
        from the screen. This is Islam's whole question — *how would they add
        anything* — and the screen answering it is not the same as the data
        accepting it (§96).
     3. THE ASPIRATION LANDS. `fnAsUnit()` returns a fresh object, so
        `u.aspiration = v` — the same setter a unit uses — wrote to something
        thrown away one paint later. It fails silently and in the safe-looking
        direction: the field takes the words, the page redraws, they are gone.
     4. Nothing is pushed onto a SHARED FROZEN EMPTY (§50.6) — asserted by
        looking at the other functions after the add.
     5. The foundation gap is counted again AND its chip lands on the Overview;
        a pillar's chip lands on the PLAN. The old fault set a section key the
        page does not have, so assert the LANDING, never the key.
     6. The bar survives a single visible section — reachable whenever a grant
        hides one of the two.
     7. A capability function and a UNIT are untouched, or a build that changed
        every subject would satisfy the rest (§113.8, §53.5).

   §94.2 THROUGHOUT: the demo's pillars function holds no foundation and owes
   nothing on its pillars, so every state measured here is MADE.
"""
import os, sys
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


def press_add(pg, word):
    for x in pg.query_selector_all("#panel .addrow button"):
        if word in x.text_content():
            x.click(); pg.wait_for_timeout(450); return True
    return False


def sections(pg, target):
    """What the shell would actually offer for this subject."""
    return pg.evaluate("""(t)=>{
      const d=(SUBS.fn||[]).filter(x=>x.k==='fnstrat')[0];
      if (!d || !d.sections) return [];
      return d.sections(t.slice(3)).map(s=>({k:s.k,label:s.label,ac:s.ac})); }""", target)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
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
    has = pg.evaluate("(k)=>typeof fnOverviewHas==='function' ? !fnOverviewHas(k) : 'no predicate'", fk)
    ok("...and its foundation starts EMPTY, so the empty case is the real one",
       has is True, has)

    print("\n── 1 · both sections, whatever the data holds")
    secs = sections(pg, T)
    ok("two sections", len(secs) == 2, secs)
    ok("...the Overview first", bool(secs) and secs[0]["k"] == "found", secs)
    ok("...the plan section keyed `proj` and LABELLED Plan (§59)",
       len(secs) > 1 and secs[1]["k"] == "proj" and secs[1]["label"] == "Plan", secs)
    ok("...and the Overview gated on the FUNCTION's key, never the unit's (§211)",
       bool(secs) and secs[0]["ac"] == "k_found", secs)

    pg.evaluate("(t)=>{ current=t; currentSub='fnstrat'; CURSEC.fnstrat='found'; paint(); }", T)
    pg.wait_for_timeout(500)
    drawn = pg.evaluate("()=>[...document.querySelectorAll('#secrow-in [data-sub2]')]"
                        ".map(b=>b.textContent.trim())")
    ok("both are drawn as tabs", drawn == ["Overview", "Plan"], drawn)

    print("\n── 2 · an empty Overview says where the strategy lives")
    line = pg.evaluate("()=>{const s=document.querySelector('#panel p.sub');return s?s.textContent.trim():null}")
    parent = pg.evaluate("(k)=>{const f=FUNCTIONS[k];return f.under&&UNITS[f.under]?UNITS[f.under].name:null}", fk)
    ok("the line is there", bool(line), line)
    ok("...and names the parent it plans under", bool(line) and (not parent or parent in line), line)
    ok("...and does NOT yet claim anything is held here",
       bool(line) and "as well as" not in line, line)

    print("\n── 3 · and it can be filled (Islam's question)")
    pg.evaluate("()=>{ EDIT_PAGE.foundation = true; paint(); }")
    pg.wait_for_timeout(500)
    ok("the pen opens this page for the office",
       pg.evaluate("()=>!!authoring('foundation','k_found')"))
    adds = pg.evaluate("()=>[...document.querySelectorAll('#panel .addrow button')].map(b=>b.textContent.trim())")
    ok("...there is a way to add a first line", any("line" in a for a in adds), adds)
    ok("...and a first objective", any("bjective" in a for a in adds), adds)

    others_before = pg.evaluate("""(k)=>Object.keys(FUNCTIONS).filter(x=>x!==k)
      .filter(x=>(FUNCTIONS[x].clauses||[]).length||(FUNCTIONS[x].keyObjectives||[]).length).length""", fk)
    ok("pressing '+ Add a line' works", press_add(pg, "line"))
    ok("pressing '+ Add an objective' works", press_add(pg, "bjective"))
    # ASK THE DATA, never the screen (§96): a control wired to nothing renders
    # identically and discards every press.
    stored = pg.evaluate("(k)=>({clauses:(FUNCTIONS[k].clauses||[]).length,"
                         "kos:(FUNCTIONS[k].keyObjectives||[]).length})", fk)
    ok("...and the STORED function grew a clause", stored["clauses"] >= 1, stored)
    ok("...and a STORED key objective", stored["kos"] >= 1, stored)
    others_after = pg.evaluate("""(k)=>Object.keys(FUNCTIONS).filter(x=>x!==k)
      .filter(x=>(FUNCTIONS[x].clauses||[]).length||(FUNCTIONS[x].keyObjectives||[]).length).length""", fk)
    ok("...and nothing landed on a SHARED frozen empty (§50.6)",
       others_after == others_before, {"before": others_before, "after": others_after})

    print("\n── 4 · the aspiration LANDS (the fresh-view trap, §61)")
    box = pg.query_selector_all("#panel .hoverpen textarea, #panel .hoverpen input")
    ok("the aspiration card holds its two fields", len(box) >= 2, len(box))
    if len(box) >= 2:
        for i, el in enumerate(box[:2]):
            el.click(); el.fill("PROBE%d" % i)
            pg.evaluate("()=>document.activeElement.blur()"); pg.wait_for_timeout(350)
        got = pg.evaluate("(k)=>({asp:FUNCTIONS[k].aspiration, eim:FUNCTIONS[k].endInMind})", fk)
        ok("the typed aspiration reached the STORED function", got["asp"] == "PROBE0", got)
        ok("...and so did the end in mind", got["eim"] == "PROBE1", got)
        ok("...and the reading view hands the same value back",
           pg.evaluate("(t)=>unitLike(t).aspiration", T) == "PROBE0")

    now_line = pg.evaluate("()=>{const s=document.querySelector('#panel p.sub');"
                           "return s?s.textContent.trim():''}") or ""
    ok("now the line admits what is held here", "as well as" in now_line, now_line)

    print("\n── 5 · the count is real again, and every chip LANDS")
    pg.evaluate("""(a)=>{ const f=FUNCTIONS[a.k];
      f.aspiration=''; f.endInMind='';                   /* a real foundation gap */
      const u=unitLikeWritable('fn:'+a.k);
      if ((u.items||[]).length>1 && (u.items[1].measures||[])[0])
        u.items[1].measures[0].target='';                /* and one on a pillar */
      EDIT_PAGE.foundation=false; CURSEC.fnstrat='found'; paint(); }""", {"k": fk})
    pg.wait_for_timeout(500)
    keys = pg.evaluate("(t)=>gapMap(t).map(e=>e.key)", T)
    ok("the foundation is counted again", "found" in keys, keys)
    ok("...and the objectives half with it", "ko" in keys, keys)
    bar = pg.evaluate("()=>{const m=document.querySelector('.missbar');return m?m.textContent.trim():null}")
    ok("the missing bar is drawn", bool(bar), bar)

    chips = pg.query_selector_all(".missbar .mchip")
    ok("it offers a chip per owing place", len(chips) >= 2, len(chips))
    landed = []
    for i in range(len(chips)):
        row = pg.query_selector_all(".missbar .mchip")
        if i >= len(row):
            break
        name = row[i].text_content().strip()
        row[i].click(); pg.wait_for_timeout(650)
        landed.append((name, pg.evaluate("()=>CURSEC.fnstrat"),
                       pg.evaluate("()=>document.querySelectorAll('#panel .gapwalk').length")))
    have = [s["k"] for s in secs]
    ok("every chip lands on a section that EXISTS",
       bool(landed) and all(l[1] in have for l in landed), {"landed": landed, "sections": have})
    ok("...and each opens something to type in",
       bool(landed) and all(l[2] > 0 for l in landed), landed)
    ok("...the Foundation chip on the Overview",
       any(l[0].startswith("Foundation") and l[1] == "found" for l in landed), landed)
    ok("...and a pillar's on the Plan, never the Overview",
       any(not l[0].startswith("Foundation") and not l[0].startswith("Objective")
           and l[1] == "proj" for l in landed), landed)

    print("\n── 6 · the bar rides the row, not the section count")
    solo = pg.evaluate("""()=>({tabs:document.querySelectorAll('#secrow-in [data-sub2]').length,
                               bar:!!document.querySelector('.missbar'),
                               hidden:document.getElementById('secrow').hidden})""")
    ok("with two sections the row shows both and the bar",
       solo["tabs"] == 2 and solo["bar"] and not solo["hidden"], solo)
    # A grant that hides one section leaves ONE, and the bar must survive it —
    # §211.2 proved that gate exists by nearly losing the fill button to it.
    src = pg.evaluate("()=>document.documentElement.innerHTML").replace("&gt;", ">")
    ok("...and the row is not gated on section COUNT alone",
       "secs.length > 1 || missHTML" in src,
       "a `> 1` gate takes the count and the fill button away from a narrowed grant")

    print("\n── 7 · a capability function is untouched (§113.8)")
    pg.evaluate("(k)=>{ current='fn:'+k; currentSub='fnstrat'; CURSEC.fnstrat='found'; paint(); }", cap)
    pg.wait_for_timeout(450)
    tabs = pg.evaluate("()=>[...document.querySelectorAll('#secrow-in [data-sub2]')].map(b=>b.textContent.trim())")
    ok("it keeps both its sections", len(tabs) == 2, tabs)
    ok("...labelled Projects, not Plan", "Projects" in tabs, tabs)
    ok("...and its Overview is still counted",
       "ov" in pg.evaluate("(k)=>gapMap('fn:'+k).map(e=>e.key)", cap))

    print("\n── 8 · and a UNIT is untouched (§53.5, both sides of the switch)")
    pg.evaluate("()=>{ current=UNIT_KEYS[0]; currentSub='strategy'; CURSEC.strategy='found';"
                " EDIT_PAGE.foundation=true; paint(); }")
    pg.wait_for_timeout(500)
    ub = pg.query_selector_all("#panel .hoverpen textarea, #panel .hoverpen input")
    ok("a unit's foundation still opens for editing", len(ub) >= 2, len(ub))
    if ub:
        ub[0].click(); ub[0].fill("UNIT PROBE")
        pg.evaluate("()=>document.activeElement.blur()"); pg.wait_for_timeout(350)
        ok("...and its aspiration still writes to the UNIT",
           pg.evaluate("()=>UNITS[UNIT_KEYS[0]].aspiration") == "UNIT PROBE",
           pg.evaluate("()=>UNITS[UNIT_KEYS[0]].aspiration"))

    print("\n── nothing threw")
    ok("no page error at any point", not errs, errs)
    b.close()

print("\n" + ("%d FAILED" % len(fails) if fails else "all good"))
sys.exit(1 if fails else 0)
