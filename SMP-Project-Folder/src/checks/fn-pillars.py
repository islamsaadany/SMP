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

    print("\n── 2b · and no explanatory line above either (§214.3)")
    # Islam: "remove the line that's talking about the Retail aspiration … I
    # will think later how to edit it." Asserted as an ABSENCE, so it cannot
    # creep back unnoticed — and by the PARENT'S NAME rather than by the
    # wording, which is precisely what he has not settled (§94.8).
    for t, what in ((T, "pillars"), (TC, "projects")):
        open_at(pg, t)
        top = pg.evaluate("()=>{const s=document.querySelector('#panel > p.sub');"
                          "return s?s.textContent.trim():null}")
        ok("the " + what + " function's Overview opens on no prose line", top is None, top)
        parent = pg.evaluate("(k)=>{const f=FUNCTIONS[k];return f.under&&UNITS[f.under]?UNITS[f.under].name:null}",
                             t[3:])
        if parent:
            ok("...and nothing on it names the parent unit",
               parent not in (pg.evaluate("()=>document.querySelector('#panel').textContent") or ""),
               parent)
    # ...and the PLAN page lost it too, which is where it was first put.
    pg.evaluate("(t)=>{ current=t; currentSub='fnstrat'; CURSEC.fnstrat='proj'; paint(); }", T)
    pg.wait_for_timeout(450)
    ok("...and the Plan page opens on no prose line either",
       pg.evaluate("()=>{const s=document.querySelector('#panel > p.sub');"
                   "return s?s.textContent.trim():null}") is None,
       pg.evaluate("()=>{const s=document.querySelector('#panel > p.sub');return s?s.textContent.trim():null}"))

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

    print("\n── 5b · the Overview owes NOTHING (§214.4, reversing §214)")
    # Islam: "for the functions that plan with pillars remove the elements of
    # the overview from the missing items." §214 made the definition
    # mandatory; this takes it back — on BOTH formats, because the capability
    # side only ever counted it to keep the two Overviews one page (§53.5).
    # §94.2: MAKE the empty state — every demo capability has a definition.
    pg.evaluate("""(a)=>{ delete FUNCTIONS[a.fk].def;
      const c=capsOfFunction(a.cap)[0]; if (c) c.def='';
      EDIT_PAGE.capfoundation=false; paint(); }""", {"fk": fk, "cap": cap})
    pg.wait_for_timeout(400)
    for t, what in ((T, "pillars"), (TC, "projects")):
        e = pg.evaluate("(t)=>{const x=gapMap(t).filter(y=>y.key==='ov')[0];return x?x.count:None}"
                        .replace("None", "null"), t)
        ok("a blank definition counts NOTHING on the " + what + " function", e == 0, e)
        open_at(pg, t)
        ok("...and the page draws no red word", 
           pg.evaluate("()=>document.querySelectorAll('#panel .missing').length") == 0,
           pg.evaluate("()=>[...document.querySelectorAll('#panel .missing')].map(x=>x.textContent)"))
        # §223: NO COUNT, BUT STILL A DOOR. §214.4 asserted the bar was absent
        # entirely, and that was the fault Hala met on CX: fill mode is
        # entered from that bar, so a page whose only blanks are optional
        # offered no way in and the Definition sat as an em-dash she could
        # not touch. The bar is drawn now with no red number and no chips —
        # it is the way in and nothing else.
        # §224.2 REVERSES §223 FOR THIS ONE FIELD at Islam's direction:
        # *"remove the definition of the functions overview from the filling
        # … the SMO will do it."* §223's rule is untouched and still opens the
        # door wherever something IS fillable; the definition simply stopped
        # being one, so a page whose only blank is the definition offers no
        # bar at all — which is the state §214.4 described and §223 corrected
        # for the wrong reason. Asserted as the absence, with the server's
        # agreement asserted below, or the screen and the save drift (§205).
        # THE CLAIM IS ABOUT THE DEFINITION, NOT ABOUT THE BAR. The key
        # objectives on this same page are still fillable (§214.2 left them
        # so), so the door legitimately appears for THEM — asserting its
        # absence would be asserting that the objectives stopped being
        # fillable too, which nobody asked for. What must be true is that
        # entering fill mode opens no control over the DEFINITION itself.
        # §228.2: ASKED OF THE PERSON THE CELL IS CLOSED TO. The original
        # assertion pressed the door as the SMO and passed only while the
        # page HAD no door — §227's fillable collaborators gave it one, the
        # door opened the office's own pen, and a control over the
        # definition there is §224.2 working ("the SMO will do it"), not
        # failing. The person the definition must stay shut to is a FILLER,
        # so the question is put to one: the function's custodian, their
        # Strategy cell set to fill for the measurement and put back after.
        who = pg.evaluate("(t)=>FUNCTIONS[t.slice(3)].custodian || null", t)
        made_cust = False
        if not who:
            # Finance ships without a custodian, so the state is MADE (§94.2):
            # somebody with no seat role, appointed for the measurement and
            # removed after — a super's view would author, not fill.
            who = pg.evaluate("""(t)=>{ const p=PEOPLE.filter(x=>personActive(x)
                && !x.role)[0]; if (!p) return null;
              FUNCTIONS[t.slice(3)].custodian = p.key; return p.key; }""", t)
            made_cust = bool(who)
        if who:
            had = pg.evaluate("()=>ACCESS.custodian && ACCESS.custodian.a_fn_own_strat")
            pg.evaluate("""()=>{ ACCESS.custodian = Object.assign({},
                ACCESS.custodian, { a_fn_own_strat: "fill" }); }""")
            pg.select_option("#asWho", who); pg.wait_for_timeout(400)
            open_at(pg, t)
            pg.evaluate("()=>{ const d=document.querySelector('[data-fillcta]'); if(d) d.click(); }")
            pg.wait_for_timeout(400)
            defc = pg.evaluate("""()=>{
              const rows=[...document.querySelectorAll('#panel *')].filter(
                e=>e.children.length===0 && /^Definition$/.test((e.textContent||'').trim()));
              if(!rows.length) return {noRow:true};
              const cell=rows[0].nextElementSibling;
              return { has: !!cell,
                       controls: cell ? cell.querySelectorAll('input,textarea,select,button').length : -1,
                       text: cell ? (cell.textContent||'').trim().slice(0,40) : null };}""")
            ok("...and fill mode opens no control over the definition to a FILLER (§224.2)",
               defc.get("controls") == 0, defc)
            pg.evaluate("""()=>{const d=document.querySelector('.fdone'); if(d) d.click();}""")
            pg.evaluate("""(v)=>{ if (v == null) delete ACCESS.custodian.a_fn_own_strat;
                else ACCESS.custodian.a_fn_own_strat = v; }""", had)
            if made_cust:
                pg.evaluate("(t)=>{ delete FUNCTIONS[t.slice(3)].custodian; }", t)
            pg.select_option("#asWho", "smo"); pg.wait_for_timeout(400)
        else:
            ok("...a custodian exists to ask the filler question of", False, t)
    # BUT IT IS STILL FILLABLE, or §205's fault repeats: the box opens, the
    # person types, and the save refuses what the screen offered.
    ok("the definition is NOT fillable, on both sides (§224.2, §205)",
       pg.evaluate("()=>(SMPRules.GAP_FILLABLE.cap||[]).indexOf('def')") == -1,
       pg.evaluate("()=>SMPRules.GAP_FILLABLE.cap"))
    open_at(pg, T, pen=True)
    d = pg.query_selector_all("#panel dd textarea, #panel dd input")
    ok("...and the box opens behind the pen", len(d) >= 1, len(d))
    if d:
        d[-1].click(); d[-1].fill("What this function is.")
        pg.evaluate("()=>document.activeElement.blur()"); pg.wait_for_timeout(420)
        ok("...and writing it reaches the STORED function",
           pg.evaluate("(k)=>FUNCTIONS[k].def", fk) == "What this function is.",
           pg.evaluate("(k)=>FUNCTIONS[k].def", fk))
    ok("...and a UNIT still counts its own objectives (§53.5: untouched)",
       pg.evaluate("""()=>{ const u=UNITS[UNIT_KEYS[0]];
         const had=u.keyObjectives[0].target; u.keyObjectives[0].target='';
         const n=gapMap(UNIT_KEYS[0]).filter(e=>e.key==='ko')[0].count;
         u.keyObjectives[0].target=had; return n; }""") >= 1)

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
    # §233 added the Hidden column to every row sheet, the unit's included —
    # a deliberate decision, so the literal moved with it (§214.3's lesson:
    # a check written against the last shape has to move when the shape is
    # chosen again; what §213 guarded — no Weight, a 3-year target — holds).
    ok("a UNIT's Objectives sheet is exactly what it was, plus §233's Hidden",
       wb["unitObj"] == ["Objective", "Group", "Direction", "3-year target",
                         "This year target", "Unit", "Compile", "Hidden"], wb["unitObj"])
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
