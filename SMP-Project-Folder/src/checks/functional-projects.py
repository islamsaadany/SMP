#!/usr/bin/env python3
"""§322 · A FUNCTION'S PROJECTS ARE ITS OWN (spec 046, stage 1)

Islam: *"capability is something Strategic ... the problem with having the
capability hidden in the functional plans is confusing for the whole
structure"*, and of his own tenant, *"they caapbilities in raya trade are not
capabilities they are just projecst under functions."*

BOTH ENDS, EVERY TIME (§94.2). The demo still carries capabilities, so each
section measures the function WITH its box and then again after the product's
own dissolve — a build that deleted the band outright, or one that never drew
it, satisfies exactly half of this file and fails the other.

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
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                     "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions":
            break
        pg.click("#units .navswitch"); pg.wait_for_timeout(180)
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
          kos: (FUNCTIONS.finance.keyObjectives||[]).map(m=>m.id)
        })""")
        made = ev(pg, """() => {
          const wrap = (fk, name, take) => {
            const f = FUNCTIONS[fk];
            const id = 'probe-' + fk + '-' + (GROUP.capabilities.length + 1);
            const ps = (f.projects || []).splice(0, take);
            ps.forEach(p => { p.capId = id; });
            GROUP.capabilities.push({ id: id, fn: fk, name: name,
              def: f.def || '', keyObjectives: (f.keyObjectives || []).slice(),
              projects: ps });
            f.def = ''; f.keyObjectives = [];
            return name;
          };
          const out = [wrap('finance', 'Financial Infrastructure', 99),
                       wrap('marketing', 'Brand Positioning', 2),
                       wrap('marketing', 'Product Mindset', 99)];
          paint();
          return out;
        }""")
        ok(isinstance(made, list) and len(made) == 3, "three boxes made", made)
        st = ev(pg, "()=>({caps:GROUP.capabilities.length,"
                    " fin:capsOfFunction('finance').length,"
                    " mkt:capsOfFunction('marketing').length,"
                    " pillars:fnPlansInPillars(FUNCTIONS.merchandising)})")
        ok(st.get("caps", 0) > 0, "the worked example now holds capabilities", st)
        ok(st.get("fin") == 1 and st.get("mkt") == 2,
           "Finance carries one and Marketing two — one box and several", st)
        ok(st.get("pillars") is True, "and Merchandising plans in pillars, as the control", st)
        # AND THE DEMO ITSELF HOLDS NONE (§329), asserted here rather than left
        # as an absence somewhere else: it is the whole of what stage 1 promised
        # and could not show, and a build that started shipping boxes again
        # would satisfy every other assertion in this file.
        ok(start.get("fin") and start.get("mkt"),
           "…and before they were made the functions owned their projects "
           "outright — the worked example carries no box", start)

        # ── 2 · WITH the box: the band is drawn on all four pages ─────────────
        print("\n2 · with a box, the band is drawn — all four pages")
        go_fn(pg, "finance")
        before = {}
        for tab, sec in [("fnstrat", "found"), ("fnstrat", "proj"),
                         ("fnperf", None), ("report", None)]:
            if not page(pg, tab, sec):
                ok(False, "reach %s/%s" % (tab, sec or "")); continue
            before[tab + "/" + (sec or "")] = ev(pg, SHAPE)
        for k, v in before.items():
            ok(v.get("bands") == 1, "the band is drawn on " + k, v.get("bands"))
        ok(before.get("fnstrat/found", {}).get("keys", [])[:2] == ["Capability", "Carried by"],
           "and the Overview names the capability",
           before.get("fnstrat/found", {}).get("keys"))

        codes_before = ev(pg, "()=>fnProjects('finance').map(p=>projCode('finance',p))")
        figs_before = ev(pg, """()=>{const o={};
          fnProjects('finance').forEach(p=>{(p.milestones||[]).forEach(m=>{o[m.id]=(m.status||'')+'|'+(m.pct==null?'':m.pct);});});
          return o;}""")
        ids_before = ev(pg, "()=>fnProjects('finance').map(p=>p.id)")

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
        done = ev(pg, "()=>dissolveAllCapabilities().map(x=>x.name+'/'+x.projects)")
        ok(isinstance(done, list) and len(done) == st.get("caps"),
           "every box is dissolved", done)
        left = ev(pg, "()=>({caps:GROUP.capabilities.length,"
                      " fin:fnOwnProjects('finance').length,"
                      " mkt:fnOwnProjects('marketing').length,"
                      " arch:(ARCHIVES||[]).length})")
        ok(left.get("caps") == 0, "no capability is left", left)
        ok(left.get("fin") == len(ids_before or []),
           "Finance holds its projects directly", left)
        ok(left.get("mkt") == 3,
           "and two boxes on ONE function both land — the second does not "
           "throw the first away", left)
        ok(ev(pg, "()=>fnProjects('finance').map(p=>p.id)") == ids_before,
           "every project keeps its id (§232, §316)")
        ok(ev(pg, "()=>fnProjects('finance').map(p=>projCode('finance',p))") == codes_before,
           "and its CODE — the promise the dialog makes in words", codes_before)
        ok(ev(pg, """()=>{const o={};
             fnProjects('finance').forEach(p=>{(p.milestones||[]).forEach(m=>{o[m.id]=(m.status||'')+'|'+(m.pct==null?'':m.pct);});});
             return o;}""") == figs_before,
           "and every reported figure is still against the row it was entered on")

        # ── 5 · WITHOUT the box: no band anywhere, and the shared Overview ────
        print("\n5 · with no box, the band is gone — all four pages")
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
        ok(end == start, "every project, the definition and the objectives are "
                         "back exactly where the demo ships them", [start, end])

        b.close()
    ok(not errs, "no page error anywhere in the run", errs[:3])
    print("\n%d passed, %d failed" % (passed, failed))
    return 1 if failed else 0

sys.exit(main())
