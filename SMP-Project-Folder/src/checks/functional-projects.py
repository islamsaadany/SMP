#!/usr/bin/env python3
"""§322 · A FUNCTION'S PROJECTS ARE ITS OWN (spec 046, stage 1)

Islam: *"capability is something Strategic ... the problem with having the
capability hidden in the functional plans is confusing for the whole
structure"*, and of his own tenant, *"they caapbilities in raya trade are not
capabilities they are just projecst under functions."*

BOTH ENDS, EVERY TIME (§94.2) — and §330 MOVED WHICH TWO ENDS THEY ARE.
Stage 1 measured the function with a box and again after the dissolve, and a
box then drew a navy band over the function's own four pages. Stage 2 made a
capability a DESTINATION of its own, so those pages draw the function's work
and nothing else whatever boxes exist beside it. The assertions are inverted
rather than dropped (§218): with a box made under Finance the function's pages
are asserted UNTOUCHED and the box's own pages asserted to hold what left, and
after the dissolve the rows are asserted home with their ids. A build that
brought the band back fails the first half; one that lost the projects
altogether fails the second.

WHAT IS ASSERTED IS AGREEMENT, NEVER A LITERAL (§94.8): the Overview a
function with no box draws is the one a function that plans in PILLARS already
draws, which is §213's decision finally true of both sides — so the two are
compared with each other rather than against a list of headings that a later
wording change would falsify.

AND EVERY PRESS IS READ BACK OFF THE STORED PLAN (§96): a control wired to
nothing renders perfectly.

Run it through the container's Chromium wrapper:
  SMP_CHROME=... python3 qa-run.py checks/functional-projects.py
SMP_BUILT points it at another build (§276: a broken build is made from the
SOURCES, because §238's hashed CSP silences an edited built file).
"""
import os, pathlib, sys
from playwright.sync_api import sync_playwright

BUILT = pathlib.Path(os.environ.get(
    "SMP_BUILT", "strategy-management-platform.html")).resolve()

passed = failed = 0
def ok(cond, msg, got=""):
    global passed, failed
    if cond:
        passed += 1; print("  ok  " + msg)
    else:
        failed += 1; print("  FAIL " + msg + ("  (" + str(got) + ")" if got != "" else ""))

def ev(pg, js, arg=None):
    """Every probe degrades rather than dying (§215): a check that throws
       reports fewer failures than there are, which reads as a weaker
       falsification than it is."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"__err": str(e)[:160]}

def go_fn(pg, key):
    """§330: PRESS THE SIDE, NEVER THE CONTROL. With a capability in the tenant
       the switch has three sides and is a group of buttons rather than one
       button that toggles — so cycling it does nothing at all and this check
       hung for thirty seconds on a build behaving exactly as decided (§214.3).
       `[data-fold="fns"]` addresses the Functions side in BOTH shapes, and is
       absent exactly when Functions is already lit."""
    pg.evaluate("()=>{const b=document.querySelector('#units [data-fold=\"fns\"]');"
                " if (b) b.click();}")
    pg.wait_for_timeout(220)
    pg.click('#units button[data-u="fn:%s"]' % key); pg.wait_for_timeout(500)

def page(pg, tab, sec=None):
    try:
        pg.click('#subtabs button[data-s="%s"]' % tab); pg.wait_for_timeout(380)
        if sec:
            pg.click('#secrow-in [data-sub2="%s"]' % sec); pg.wait_for_timeout(420)
        return True
    except Exception:
        return False

SHAPE = """() => ({
  bands: document.querySelectorAll('.capline').length,
  keys: [...document.querySelectorAll('.clause')].map(d => (d.querySelector('dt')||{}).textContent),
  rail: ((document.querySelector('.rhead')||{}).textContent || '').trim(),
  heads: [...document.querySelectorAll('#panel h2')].map(h => h.textContent.trim())
})"""

def main():
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1500, "height": 900})
        pg.on("pageerror", lambda e: errs.append("PAGEERROR " + str(e)[:120]))
        pg.add_init_script("try{localStorage.setItem('smp.tour','never');"
                           "sessionStorage.setItem('smp.welcome','seen')}catch(e){}")
        pg.goto("file://" + str(BUILT)); pg.wait_for_timeout(900)

        # ── 1 · the state this file measures, and that it is worth measuring ──
        # THE CHECK MAKES ITS OWN BOXES (§255, §329). Until the worked example
        # was finished it shipped eight, and this file leaned on them — so it
        # went seven red the day the demo stopped carrying one, on a build
        # behaving exactly as decided (§214.3, for the seventh time). What it
        # builds is the EXACT INVERSE of the dissolve, which makes the file a
        # ROUND TRIP rather than a before-and-after: section 4 puts every one
        # of them back, and section 9 asserts the function ends byte-identical
        # to where it started. That is strictly stronger than what it replaced.
        #
        # THE FIXTURE IS DATA AND NEVER BEHAVIOUR (§100.3): it moves rows into
        # a container and the PRODUCT decides what to draw over them, so a
        # build that stopped drawing the band would still fail section 2.
        print("\n1 · the boxes this file needs, made rather than waited for")
        start = ev(pg, """() => ({
          fin: (FUNCTIONS.finance.projects||[]).map(p=>p.id),
          mkt: (FUNCTIONS.marketing.projects||[]).map(p=>p.id),
          def: FUNCTIONS.finance.def || '',
          kos: (FUNCTIONS.finance.keyObjectives||[]).map(m=>m.id),
          finCodes: (FUNCTIONS.finance.projects||[])
                      .map(p=>projCode('fn:finance', p)),
          demo: (GROUP.capabilities||[]).map(c=>c.id)
        })""")
        # THE FIGURES ARE READ BEFORE ANYTHING MOVES, so the assertion after the
        # dissolve is about the rows this file moved rather than about whatever
        # the demo happens to ship (§94.8).
        figs_before = ev(pg, """()=>{const o={};
          (FUNCTIONS.finance.projects||[]).forEach(p=>{(p.milestones||[]).forEach(m=>{
            o[m.id]=(m.status||'')+'|'+(m.pct==null?'':m.pct);});});
          return o;}""")
        # §330: A PARTIAL WRAP, AND FROM THE END. Stage 1 took every project
        # into the box, which left the function with nothing — so "the pages are
        # untouched" would have been asserted over an empty page and passed on a
        # build drawing nothing at all (§113.8). Taking ONE leaves the function
        # holding work of its own beside a box holding work of its own, which is
        # the shape stage 2 is about. From the END because the dissolve pushes
        # what it moves onto the end of the function's list, so a round trip
        # that takes from the front comes home in a different ORDER and section
        # 9 would report a reordering as a loss.
        made = ev(pg, """() => {
          const wrap = (fk, name, take) => {
            const f = FUNCTIONS[fk];
            const id = 'probe-' + fk + '-' + (GROUP.capabilities.length + 1);
            const ps = (f.projects || []).splice((f.projects || []).length - take, take);
            ps.forEach(p => { p.capId = id; });
            GROUP.capabilities.push({ id: id, fn: fk, name: name,
              def: f.def || '', keyObjectives: (f.keyObjectives || []).slice(),
              projects: ps });
            f.def = ''; f.keyObjectives = [];
            return { id: id, name: name, fn: fk,
                     projects: ps.map(p => p.id) };
          };
          const out = [wrap('finance', 'Financial Infrastructure', 1),
                       wrap('marketing', 'Brand Positioning', 1)];
          paint();
          return out;
        }""")
        ok(isinstance(made, list) and len(made) == 2, "two boxes made", made)
        MADE = [m["id"] for m in made] if isinstance(made, list) else []
        BOXED = made[0]["projects"] if isinstance(made, list) and made else []
        st = ev(pg, "()=>({caps:GROUP.capabilities.length,"
                    " fin:capsOfFunction('finance').length,"
                    " mkt:capsOfFunction('marketing').length,"
                    " finOwn:fnOwnProjects('finance').length,"
                    " pillars:fnPlansInPillars(FUNCTIONS.merchandising)})")
        ok(st.get("caps", 0) == len(start.get("demo") or []) + 2,
           "the tenant now holds its own boxes and the two this file made", st)
        ok(st.get("fin") == 1 and st.get("finOwn") == len(start.get("fin") or []) - 1,
           "Finance carries ONE box and still owns the rest of its projects — "
           "a function and a capability side by side, which is the shape", st)
        ok(st.get("pillars") is True, "and Merchandising plans in pillars, as the control", st)
        # AND THE DEMO ITSELF HOLDS ONE (§329, §330). Stage 1 dissolved all
        # eight; stage 2 kept exactly one as the real capability, so this is the
        # number and not "none" — asserted here rather than left as an absence,
        # because a build that started shipping boxes again would satisfy every
        # other assertion in this file.
        ok(len(start.get("demo") or []) == 1 and start.get("fin") and start.get("mkt"),
           "…and before they were made the tenant held ONE box and the "
           "functions owned their projects outright", start)

        # ── 2 · WITH a box beside it, the FUNCTION's pages are its own ────────
        # §330 INVERTS STAGE 1'S ASSERTION RATHER THAN DROPPING IT (§218). A box
        # under Finance used to paint a navy band across these four pages and
        # put its projects on them; it is a destination of its own now, so what
        # must be true here is that the function's pages carry no band at all
        # and still hold the function's OWN work. Both halves are asserted,
        # because "no band" is an absence and an absence passes perfectly on a
        # build that draws nothing (§113.8).
        print("\n2 · with a box beside it, the function's four pages are its own")
        go_fn(pg, "finance")
        before = {}
        for tab, sec in [("fnstrat", "found"), ("fnstrat", "proj"),
                         ("fnperf", None), ("report", None)]:
            if not page(pg, tab, sec):
                ok(False, "reach %s/%s" % (tab, sec or "")); continue
            before[tab + "/" + (sec or "")] = ev(pg, SHAPE)
        for k, v in before.items():
            ok(v.get("bands") == 0, "no band on " + k + " — the box is a page "
               "of its own now", v.get("bands"))
        ok(before.get("fnstrat/found", {}).get("keys", [])[:2] == ["Function", "Led by"],
           "and the Overview still names the FUNCTION, not the box",
           before.get("fnstrat/found", {}).get("keys"))
        own_now = ids_now = ev(pg, "()=>fnProjects('finance').map(p=>p.id)")
        ok(own_now == [i for i in (start.get("fin") or []) if i not in BOXED],
           "the function's own list holds its projects and not the boxed one",
           [own_now, BOXED])
        # AND THE PAGE, NOT ONLY THE LIST. Everything above is an absence or a
        # read of the DATA, and both pass on a build whose Projects page draws
        # the box's work beside the function's — which is exactly what the
        # falsification here does (§113.8, found by running it). The bands
        # drawn are the codes the function owns and nothing else.
        if page(pg, "fnstrat", "proj"):
            drawn = ev(pg, "()=>[...document.querySelectorAll('#panel .pband-code')]"
                           ".map(e=>e.textContent.trim())")
            want = ev(pg, "()=>fnProjects('finance')"
                          ".map(p=>projCode('fn:finance',p))")
            # ONE BAND PER HOLDER, because the rail picks one project at a
            # time (§130.2) — so the assertion is that every code the page
            # draws is one of the function's, never that it draws them all.
            # On a build whose Projects page draws the box beside the function
            # a second band appears carrying the BOX's numbering (measured:
            # ['FIN01', 'FI01']), which is what this catches.
            ok(isinstance(drawn, list) and drawn
               and all(c in (want or []) for c in drawn),
               "and every project band the page draws is the function's own",
               [drawn, want])
            rail = ev(pg, "()=>[...document.querySelectorAll('.rail [data-rail]')]"
                          ".map(b=>b.dataset.rail)")
            ok(isinstance(rail, list) and rail == (ids_now or []),
               "and its rail lists exactly the function's own projects",
               [rail, ids_now])

        # AND THE BOX HOLDS WHAT LEFT, on its own destination (§330). Without
        # this the projects could have gone nowhere and every assertion above
        # would still pass.
        box = ev(pg, "(id)=>{const c = capById(id); return c ? "
                     "{n:(c.projects||[]).length, ids:(c.projects||[]).map(p=>p.id)}"
                     " : {none:true};}", MADE[0] if MADE else "")
        ok(not box.get("none") and box.get("ids") == BOXED,
           "and the box holds exactly what left the function", [box, BOXED])
        # REACHED THROUGH THE NAVIGATION, never by reading the DOM while
        # another side is lit: the destinations are drawn one side at a time,
        # so asking for the button with Functions showing answers "not there"
        # on a build that draws it perfectly (§51.11's shape, in a probe).
        pg.evaluate("()=>{const b=document.querySelector('#units [data-fold=\"caps\"]');"
                    " if (b) b.click();}")
        pg.wait_for_timeout(260)
        dest = ev(pg, "(id)=>!!document.querySelector('#units [data-u=\"cap:'+id+'\"]')",
                  MADE[0] if MADE else "")
        ok(dest is True, "…and is reachable as a destination of its own", dest)
        go_fn(pg, "finance")

        codes_before = start.get("finCodes")
        ids_before = start.get("fin")

        # ── 3 · a PILLARS function's Overview, the shape to agree with ────────
        print("\n3 · what a function that plans in pillars already draws")
        go_fn(pg, "merchandising")
        page(pg, "fnstrat", "found")
        pillars_ov = ev(pg, SHAPE)
        ok(pillars_ov.get("bands") == 0, "it draws no band", pillars_ov.get("bands"))
        ok(pillars_ov.get("keys", [])[:2] == ["Function", "Led by"],
           "and its Overview names the FUNCTION", pillars_ov.get("keys"))

        # ── 4 · the dissolve, through the product's own control ───────────────
        print("\n4 · the dissolve — the product's own, never a hand-moved graph")
        # ONLY WHAT THIS FILE MADE (§330). `dissolveAllCapabilities()` is the
        # one-off that moves a whole tenant, and running it here would take the
        # demo's own capability with it — so section 9's round trip would report
        # a box the worked example ships as a project the function gained.
        # `dissolveCapability` is the same act one box at a time and is what
        # that loop calls, so nothing about the machinery under test is dodged
        # (§53.5); the whole-tenant door is asserted below on its own terms.
        done = ev(pg, "(ids)=>ids.map(id=>{const c=capById(id);"
                      " const n=c?(c.projects||[]).length:0;"
                      " return dissolveCapability(id) ? (c.name+'/'+n) : null;})", MADE)
        ok(isinstance(done, list) and len(done) == len(MADE)
           and all(x for x in done), "every box this file made is dissolved", done)
        left = ev(pg, "()=>({caps:GROUP.capabilities.length,"
                      " fin:fnOwnProjects('finance').length,"
                      " mkt:fnOwnProjects('marketing').length,"
                      " arch:(ARCHIVES||[]).length})")
        ok(left.get("caps") == len(start.get("demo") or []),
           "the boxes this file made are gone and the demo's own is untouched",
           [left, start.get("demo")])
        ok(left.get("fin") == len(ids_before or []),
           "Finance holds its projects directly", left)
        ok(left.get("mkt") == len(start.get("mkt") or []),
           "and Marketing's come home beside the ones it kept — the dissolve "
           "pushes onto the list rather than replacing it", left)
        ok(ev(pg, "()=>fnOwnProjects('finance').map(p=>p.id)") == ids_before,
           "every project keeps its id (§232, §316)",
           [ev(pg, "()=>fnOwnProjects('finance').map(p=>p.id)"), ids_before])
        ok(ev(pg, "()=>fnOwnProjects('finance')"
                  ".map(p=>projCode('fn:finance',p))") == codes_before,
           "and its CODE — the promise the dialog makes in words", codes_before)
        ok(ev(pg, """()=>{const o={};
             fnOwnProjects('finance').forEach(p=>{(p.milestones||[]).forEach(m=>{o[m.id]=(m.status||'')+'|'+(m.pct==null?'':m.pct);});});
             return o;}""") == figs_before,
           "and every reported figure is still against the row it was entered on")

        # ── 5 · WITHOUT the box: no band anywhere, and the shared Overview ────
        print("\n5 · with the box gone, the work is on the function's own pages")
        ev(pg, "()=>paint()"); pg.wait_for_timeout(400)
        go_fn(pg, "finance")
        after = {}
        for tab, sec in [("fnstrat", "found"), ("fnstrat", "proj"),
                         ("fnperf", None), ("report", None)]:
            if not page(pg, tab, sec):
                ok(False, "reach %s/%s" % (tab, sec or "")); continue
            after[tab + "/" + (sec or "")] = ev(pg, SHAPE)
        for k, v in after.items():
            ok(v.get("bands") == 0, "no band on " + k, v.get("bands"))
        ok(after.get("fnstrat/found", {}).get("keys") == pillars_ov.get("keys"),
           "and the Overview AGREES with the pillars format's, key for key (§213)",
           [after.get("fnstrat/found", {}).get("keys"), pillars_ov.get("keys")])
        ok(after.get("fnstrat/found", {}).get("heads") == pillars_ov.get("heads"),
           "cards and all", [after.get("fnstrat/found", {}).get("heads"),
                             pillars_ov.get("heads")])
        ok((after.get("fnstrat/proj", {}).get("rail") or "").startswith("Projects"),
           "and the rail leads with the projects",
           after.get("fnstrat/proj", {}).get("rail"))
        # AND THE PROJECTS ARE ACTUALLY ON THE PAGE (§113.8). Every "no band"
        # above is an ABSENCE, and an absence passes perfectly on a build that
        # draws nothing at all — which is what a page still asking only for
        # capabilities does once there are none. So the rail is asserted to
        # list the codes the data holds, on each page that carries one.
        for tab, sec in [("fnstrat", "proj"), ("fnperf", None), ("report", None)]:
            if not page(pg, tab, sec):
                ok(False, "reach %s/%s again" % (tab, sec or "")); continue
            shown = ev(pg, "()=>[...document.querySelectorAll('.rrow .rcode,"
                           " .rrow .rail-code, .rrow code')].map(x=>x.textContent.trim())")
            got = shown if isinstance(shown, list) and shown else ev(
                pg, "()=>(document.querySelector('#panel')||{}).innerText||''")
            hit = all((c in (got if isinstance(got, str) else " ".join(got)))
                      for c in (codes_before or []))
            ok(bool(codes_before) and hit,
               "the projects are DRAWN on %s/%s, not merely un-banded"
               % (tab, sec or ""), got if isinstance(got, list) else str(got)[:90])

        # ── 6 · it can be WRITTEN, which is the half a reader would fake ──────
        print("\n6 · a function with no box can be added to (§50.6, §61)")
        page(pg, "fnstrat", "proj")
        n0 = ev(pg, "()=>fnOwnProjects('finance').length")
        made = ev(pg, """()=>{const h = holderByIdWritable('fn:finance');
          const p = addProject(h); paint();
          return p ? {id:p.id, n:fnOwnProjects('finance').length} : null;}""")
        ok(isinstance(made, dict) and made.get("n") == (n0 or 0) + 1,
           "a project added to the function lands in the STORED plan", made)
        ko = ev(pg, """()=>{const h = fnKoHolderWritable('finance');
          const before = h.keyObjectives.length;
          const hh = koHolderById('fn:finance');
          if (!hh) return {err:'no holder'};
          hh.list.push({id:'probe-KO', name:'Probe'});
          return {before:before, after:(FUNCTIONS.finance.keyObjectives||[]).length};}""")
        ok(isinstance(ko, dict) and ko.get("after") == (ko.get("before") or 0) + 1,
           "and a key objective written through the page's own holder does too", ko)
        ev(pg, "()=>{FUNCTIONS.finance.keyObjectives = (FUNCTIONS.finance.keyObjectives||[])"
               ".filter(m=>m.id!=='probe-KO'); FUNCTIONS.finance.projects.pop(); paint();}")

        # ── 7 · the deck names what it holds ──────────────────────────────────
        print("\n7 · the deck")
        deck = ev(pg, """()=>{const h = deckHtmlFor ? deckHtmlFor('fn:finance') : null;
          if (h == null) return {err:'no deckHtmlFor'};
          const d = document.createElement('div'); d.innerHTML = h;
          return { sub: (d.querySelector('.coversub')||{}).textContent || '',
                   covers: d.querySelectorAll('.d-cover').length,
                   labs: [...d.querySelectorAll('.seclab')].map(x=>x.textContent.trim()) };}""")
        ok("Capability review" not in (deck.get("sub") or ""),
           "its cover does not call a function's own work a capability review",
           deck.get("sub"))
        ok(not [x for x in (deck.get("labs") or []) if x.startswith("Capability")],
           "and no slide is headed Capability", deck.get("labs"))

        # ── 8 · the workbook can still address it (§22) ───────────────────────
        print("\n8 · the plan can still be taken away and brought back (§22)")
        subs = ev(pg, "()=>projectSubjectNames()")
        ok(isinstance(subs, list) and "Finance" in subs,
           "the Read me's dropdown offers the function by name", subs)
        wb = ev(pg, "()=>{const w = impPlanWorkbookFor('fn:finance');"
                    " return w ? w.map(s=>s.name) : null;}")
        ok(isinstance(wb, list) and "Projects" in wb,
           "and a projects workbook is built for it", wb)

        # ── 9 · the round trip closes (§329) ─────────────────────────────────
        # Section 1 wrapped the functions' own projects in boxes and section 4
        # dissolved them again, so the end state must be the state the worked
        # example ships. Asserted as the ids, the definition and the objective
        # ids together: a dissolve that moved the rows and dropped the
        # definition satisfies every id assertion above (§94.2).
        print("\n9 · and the round trip closes where it started")
        end = ev(pg, """() => ({
          fin: (FUNCTIONS.finance.projects||[]).map(p=>p.id),
          mkt: (FUNCTIONS.marketing.projects||[]).map(p=>p.id),
          def: FUNCTIONS.finance.def || '',
          kos: (FUNCTIONS.finance.keyObjectives||[]).map(m=>m.id)
        })""")
        ok(end.get("fin") == start.get("fin") and end.get("mkt") == start.get("mkt")
           and end.get("def") == start.get("def") and end.get("kos") == start.get("kos"),
           "every project, the definition and the objectives are "
           "back exactly where the demo ships them", [start, end])

        b.close()
    ok(not errs, "no page error anywhere in the run", errs[:3])
    print("\n%d passed, %d failed" % (passed, failed))
    return 1 if failed else 0

sys.exit(main())
