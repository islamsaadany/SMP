"""A SUPPORTING FUNCTION'S OVERVIEW IS A SUPPORTING FUNCTION'S OVERVIEW,
   WHICHEVER WAY IT PLANS (§211, §212, §213).

   The road here, because two of the three sections were wrong and the record
   of why is the useful part:

     · §211 — Islam: *"pressing on the CON01 22 it doesn't take me to the
       pillars it's stuck in the overview"*. `gapMap()` handed this format a
       UNIT's section word and a UNIT's access key.
     · §211.2 — removed the Overview outright, on a probe of a field name
       that does not exist on a unit either. The premise was false.
     · §212 — put it back with a UNIT's foundation page behind it.
     · §213 — Islam: *"the function will never have an aspiration, will never
       have a foundation, but they will have maybe key objectives"* — so it
       takes the CAPABILITY function's Overview, which is the neighbour it
       actually resembles.

   WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM AND NOT THE LAYOUT (§94.8):

     1. The two FUNCTION formats draw the same two cards. Asserted as
        AGREEMENT between them, never as a literal list of headings, so a
        later change to both stays green and a change to one does not (§53.5 —
        the drift that cost §211 a day).
     2. A function's Overview holds NO aspiration, NO who-we-are and NO SWOT.
        Asserted as absences on the CARDS, because the explanatory line above
        the page mentions all three by name (§113.8 in reverse: a text search
        would pass on a build that still drew them).
     3. Everything on it WRITES: the definition, adding an objective, removing
        one — each read back from the STORED function, never from the screen
        (§96: a control wired to nothing renders identically).
     4. Nothing lands on the SHARED FROZEN EMPTY (§50.6) — checked by looking
        at the OTHER functions after the add.
     5. The count names an Overview for BOTH formats, from the same field list.
     6. The workbook stops asking a function for a strategy it does not author,
        and A UNIT'S WORKBOOK IS UNTOUCHED — every sheet, every column. Islam:
        *"we should not change anything about the unit, careful about this."*
     7. A weight set on a function survives the round trip, and the 3-year
        target a unit uses is still read on a unit's file.
     8. A unit's Foundation page is byte-for-byte the page it always was.

   §94.2 THROUGHOUT: the demo's pillars function holds no objectives at all, so
   every state measured here is MADE.
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


def open_at(pg, target, pen=False):
    pg.evaluate("(a)=>{ current=a.t; currentSub='fnstrat'; CURSEC.fnstrat='found';"
                " EDIT_PAGE.capfoundation=a.pen; paint(); }", {"t": target, "pen": pen})
    pg.wait_for_timeout(500)


def cards(pg):
    return {
        "headings": pg.evaluate("()=>[...document.querySelectorAll('#panel h2')].map(h=>h.textContent.trim())"),
        "labels": pg.evaluate("()=>[...document.querySelectorAll('#panel dt')].map(d=>d.textContent.trim())"),
    }


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
                      "&&capsOfFunction(k).length&&capsOfFunction(k)[0].keyObjectives.length)[0]")
    T, TC = "fn:" + (fk or ""), "fn:" + (cap or "")

    print("\n── the fixture")
    ok("a function that plans in pillars", bool(fk), fk)
    ok("...and one that plans in projects, WITH objectives to compare against", bool(cap), cap)
    if not fk or not cap:
        b.close(); sys.exit(1)
    ok("...and the pillars one starts with none, so the empty case is the real one",
       pg.evaluate("(k)=>!(FUNCTIONS[k].keyObjectives||[]).length", fk))

    print("\n── 1 · both sections, on both formats")
    for t, what in ((T, "pillars"), (TC, "projects")):
        secs = pg.evaluate("""(t)=>{
          const d=(SUBS.fn||[]).filter(x=>x.k==='fnstrat')[0];
          return d.sections(t.slice(3)).map(s=>s.k+'/'+s.ac); }""", t)
        ok("the " + what + " function has Overview + plan, both on the function's keys",
           secs == ["found/k_found", "proj/k_proj"], secs)

    print("\n── 2 · and they draw the SAME two cards (§53.5, asserted as agreement)")
    open_at(pg, T);  a = cards(pg)
    open_at(pg, TC); c = cards(pg)
    ok("the same card headings", a["headings"] == c["headings"], {"pillars": a, "projects": c})
    ok("...two of them", len(a["headings"]) == 2, a["headings"])
    ok("the same NUMBER of labelled facts", len(a["labels"]) and
       len(a["labels"]) == len(c["labels"]), {"pillars": a["labels"], "projects": c["labels"]})
    ok("...and both end on the Definition",
       bool(a["labels"]) and a["labels"][-1] == c["labels"][-1] == "Definition",
       {"pillars": a["labels"], "projects": c["labels"]})
    ok("...the pillars one naming the FUNCTION", a["labels"][:1] == ["Function"], a["labels"])
    ok("...the projects one naming the CAPABILITY", c["labels"][:1] == ["Capability"], c["labels"])

    print("\n── 3 · no aspiration, no who-we-are, no SWOT on either")
    for t, what in ((T, "pillars"), (TC, "projects")):
        open_at(pg, t)
        # On the CARDS, not in the page text: the line above the page names all
        # three by name, so a text search would pass on a build that still drew
        # the cards (§113.8 from the other side).
        h = pg.evaluate("()=>[...document.querySelectorAll('#panel h2,#panel h3')].map(x=>x.textContent.trim().toLowerCase())")
        ok("the " + what + " function draws no aspiration/foundation/SWOT card",
           not any(w in " ".join(h) for w in ("aspiration", "who we are", "strength", "weakness")), h)

    print("\n── 4 · everything on it writes (§96 — ask the DATA)")
    open_at(pg, T, pen=True)
    ok("the pen opens it", pg.evaluate("()=>!!authoring('capfoundation','k_found')"))
    d = pg.query_selector_all("#panel dd textarea, #panel dd input")
    ok("the definition is a field", len(d) >= 1, len(d))
    if d:
        d[-1].click(); d[-1].fill("Runs the range.")
        pg.evaluate("()=>document.activeElement.blur()"); pg.wait_for_timeout(400)
        ok("...and it writes to the STORED function",
           pg.evaluate("(k)=>FUNCTIONS[k].def", fk) == "Runs the range.",
           pg.evaluate("(k)=>FUNCTIONS[k].def", fk))

    cols = pg.evaluate("()=>{const t=document.querySelector('#panel table thead tr');"
                       "return t?[...t.children].map(x=>x.textContent.trim()):null}")
    open_at(pg, TC, pen=True)
    ccols = pg.evaluate("()=>{const t=document.querySelector('#panel table thead tr');"
                        "return t?[...t.children].map(x=>x.textContent.trim()):null}")
    ok("the objectives editor has the SAME columns on both formats", cols == ccols,
       {"pillars": cols, "projects": ccols})
    ok("...including a Weight, which is what a function's objectives carry",
       bool(cols) and any("Weight" in x for x in cols), cols)

    open_at(pg, T, pen=True)
    before_others = pg.evaluate("""(k)=>Object.keys(FUNCTIONS).filter(x=>x!==k)
      .filter(x=>(FUNCTIONS[x].keyObjectives||[]).length).length""", fk)
    added = False
    for x in pg.query_selector_all("#panel .addrow button"):
        if "bjective" in x.text_content():
            x.click(); pg.wait_for_timeout(450); added = True; break
    ok("'+ Add an objective' is offered and pressed", added)
    ok("...and the STORED function grew one",
       pg.evaluate("(k)=>(FUNCTIONS[k].keyObjectives||[]).length", fk) == 1,
       pg.evaluate("(k)=>(FUNCTIONS[k].keyObjectives||[]).length", fk))
    ok("...and nothing landed on a SHARED frozen empty (§50.6)",
       pg.evaluate("""(k)=>Object.keys(FUNCTIONS).filter(x=>x!==k)
         .filter(x=>(FUNCTIONS[x].keyObjectives||[]).length).length""", fk) == before_others,
       before_others)

    print("\n── 5 · the count names an Overview on BOTH formats")
    pg.evaluate("""(k)=>{ const w=fnWritable(k);
      w.keyObjectives[0].name='Range productivity'; w.keyObjectives[0].target='';
      w.keyObjectives[0].weight=null; fnWriteBack(k, w);
      EDIT_PAGE.capfoundation=false; paint(); }""", fk)
    pg.wait_for_timeout(400)
    m = pg.evaluate("(t)=>gapMap(t).map(e=>e.key)", T)
    mc = pg.evaluate("(t)=>gapMap(t).map(e=>e.key)", TC)
    ok("the pillars function's map names `ov`", "ov" in m, m)
    ok("...as the projects function's does", "ov" in mc, mc)
    # §214.2: AN OBJECTIVE OWING EVERYTHING COUNTS NOTHING. Islam: "the key
    # objectives should not count as missing in the functions in general."
    # Asserted BOTH WAYS, because a build that stopped counting the whole
    # Overview would satisfy the first half alone (§113.8).
    ok("...and an objective owing a target and a weight counts NOTHING",
       pg.evaluate("(t)=>gapMap(t).filter(e=>e.key==='ov')[0].count", T) == 0,
       pg.evaluate("(t)=>gapMap(t).filter(e=>e.key==='ov')[0].count", T))
    ok("...but they are still FILLABLE (§205: counted and fillable are two questions)",
       pg.evaluate("()=>(SMPRules.GAP_FILLABLE.capko||[]).length") == 4,
       pg.evaluate("()=>SMPRules.GAP_FILLABLE.capko"))
    ok("...and the page prints no red word over them",
       pg.evaluate("()=>document.querySelectorAll('#panel .orow .missing').length") == 0,
       pg.evaluate("()=>[...document.querySelectorAll('#panel .orow')].map(r=>r.textContent.trim())"))
    ok("...while a UNIT still counts its own objectives (§53.5: untouched)",
       pg.evaluate("""()=>{ const u=UNITS[UNIT_KEYS[0]];
         const had=u.keyObjectives[0].target; u.keyObjectives[0].target='';
         const n=gapMap(UNIT_KEYS[0]).filter(e=>e.key==='ko')[0].count;
         u.keyObjectives[0].target=had; return n; }""") >= 1)
    ok("...and no Foundation half survives on a function",
       "found" not in m and "ko" not in m, m)

    print("\n── 5b · the Overview is MANDATORY (§214)")
    # §94.2: MAKE the blank definition — every demo capability has one.
    pg.evaluate("""(a)=>{ delete FUNCTIONS[a.fk].def;
      const c=capsOfFunction(a.cap)[0]; if (c) c.def='';
      EDIT_PAGE.capfoundation=false; paint(); }""", {"fk": fk, "cap": cap})
    pg.wait_for_timeout(400)
    for t, what in ((T, "pillars"), (TC, "projects")):
        n = pg.evaluate("(t)=>{const e=gapMap(t).filter(x=>x.key==='ov')[0];return e?e.count:null}", t)
        ok("a blank definition is counted as missing on the " + what + " function",
           n is not None and n >= 1, n)
    open_at(pg, T)
    last = pg.evaluate("()=>{const d=[...document.querySelectorAll('#panel dd')].pop();"
                       "return d?d.textContent.trim():''}")
    ok("...the page prints the word", "Missing" in last, last)
    chip = pg.query_selector(".missbar .mchip")
    ok("...the band offers a chip for it", chip is not None,
       pg.evaluate("()=>{const m=document.querySelector('.missbar');return m?m.textContent:null}"))
    if chip:
        chip.click(); pg.wait_for_timeout(650)
        ok("...which lands on the Overview",
           pg.evaluate("()=>CURSEC.fnstrat") == "found", pg.evaluate("()=>CURSEC.fnstrat"))
        # §61: a counted gap must open something somebody can type in.
        f = pg.query_selector("#panel .gapwalk")
        ok("...with a field under the cursor", f is not None)
        if f:
            was = pg.evaluate("(t)=>gapMap(t).filter(x=>x.key==='ov')[0].count", T)
            f.click(); f.fill("What this function is.")
            pg.evaluate("()=>document.activeElement.blur()"); pg.wait_for_timeout(450)
            ok("...and typing it reaches the STORED function",
               pg.evaluate("(k)=>FUNCTIONS[k].def", fk) == "What this function is.",
               pg.evaluate("(k)=>FUNCTIONS[k].def", fk))
            now = pg.evaluate("(t)=>gapMap(t).filter(x=>x.key==='ov')[0].count", T)
            # THE DELTA, NEVER THE TOTAL (§94.8). §5 left an objective owing a
            # target and a weight, which the Overview also counts — asserting 0
            # here measured those rather than the definition, and reported a
            # working fill as broken.
            ok("...and the Overview owes exactly one thing less",
               now == was - 1, {"before": was, "after": now})

    print("\n── 6 · the workbook stops asking, and a UNIT'S IS UNTOUCHED")
    wb = pg.evaluate("""(t)=>{
      const shape=(u)=>planWorkbook(u).map(s=>({name:s.name,head:s.head}));
      const f=shape(unitLike(t)), u=shape(UNITS[UNIT_KEYS[0]]);
      return {fn:f.map(s=>s.name), unit:u.map(s=>s.name),
              fnObj:(f.filter(s=>s.name==='Objectives')[0]||{}).head,
              unitObj:(u.filter(s=>s.name==='Objectives')[0]||{}).head}; }""", T)
    for gone in ("Foundation", "Aspiration", "SWOT"):
        ok("a function's file has no " + gone + " sheet", gone not in wb["fn"], wb["fn"])
        ok("...and a UNIT's still does", gone in wb["unit"], wb["unit"])
    ok("a function's Objectives sheet asks for a Weight",
       any("Weight" in h for h in wb["fnObj"]), wb["fnObj"])
    ok("...and not a 3-year target", not any("3-year" in h for h in wb["fnObj"]), wb["fnObj"])
    ok("a UNIT's Objectives sheet is exactly what it was",
       wb["unitObj"] == ["Objective", "Group", "Direction", "3-year target",
                         "This year target", "Unit", "Compile"], wb["unitObj"])
    ok("...and a unit keeps every sheet it had",
       wb["unit"] == ["Read me", "Foundation", "Aspiration", "Objectives", "SWOT",
                      "Pillars", "Measures", "Tactics"], wb["unit"])

    print("\n── 7 · a weight survives the round trip")
    trip = pg.evaluate("""(t)=>{
      const w=fnWritable(t.slice(3));
      w.keyObjectives[0].target='1.2'; w.keyObjectives[0].weight=60;
      fnWriteBack(t.slice(3), w);
      const u=unitLike(t), sheets={};
      planWorkbook(u).forEach(s=>{ sheets[s.name]=[s.head].concat(s.rows||[]); });
      /* planFromWorkbook returns a FLAT array of rows, not {rows} — the first
         version of this asked for `.rows`, got [], and reported a working
         round trip as broken. */
      const d=planFromWorkbook(u, sheets);
      const ns=(Array.isArray(d)?d:(d.rows||[])).filter(r=>r.type==='NORTHSTAR');
      return ns.map(r=>({n:r.name, w:r.weight, v:r.value})); }""", T)
    ok("the objective comes back", len(trip) == 1, trip)
    ok("...carrying its weight", trip and str(trip[0]["w"]) == "60", trip)
    ok("...and its target", trip and trip[0]["v"] == "1.2", trip)

    print("\n── 8 · a UNIT's Foundation is the page it always was")
    pg.evaluate("()=>{ current=UNIT_KEYS[0]; currentSub='strategy'; CURSEC.strategy='found';"
                " EDIT_PAGE.foundation=false; paint(); }")
    pg.wait_for_timeout(450)
    uh = pg.evaluate("()=>[...document.querySelectorAll('#panel h2')].map(h=>h.textContent.trim())")
    ok("it still leads with Who we are and its aspiration",
       "Who we are" in uh and any("spiration" in h for h in uh), uh)
    pg.evaluate("()=>{ EDIT_PAGE.foundation=true; paint(); }")
    pg.wait_for_timeout(450)
    ub = pg.query_selector_all("#panel .hoverpen textarea, #panel .hoverpen input")
    ok("...and still opens for editing", len(ub) >= 2, len(ub))
    if ub:
        ub[0].click(); ub[0].fill("UNIT PROBE")
        pg.evaluate("()=>document.activeElement.blur()"); pg.wait_for_timeout(350)
        ok("...writing to the UNIT",
           pg.evaluate("()=>UNITS[UNIT_KEYS[0]].aspiration") == "UNIT PROBE",
           pg.evaluate("()=>UNITS[UNIT_KEYS[0]].aspiration"))

    print("\n── nothing threw")
    ok("no page error at any point", not errs, errs)
    b.close()

print("\n" + ("%d FAILED" % len(fails) if fails else "all good"))
sys.exit(1 if fails else 0)
