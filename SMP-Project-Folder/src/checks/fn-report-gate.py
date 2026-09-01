"""A SUPPORTING FUNCTION'S REPORT IS ASKED FOR, AND ITS OBJECTIVES CAN BE
   ANSWERED (§236).

   Islam, from a live client session: *"for the functions planning in pillars
   the key objectives reporting wasn't done and the button of submit to smo
   was allowed and the input there wasn't saved."* Three faults wearing one
   coat, and this file is the falsification of each.

     1 · THE SUBMIT GATE WAS BLIND TO THE WHOLE PLAN. `submitBlockers()` asked
         by PREFIX — every `fn:` target went to the capability counters — and
         a function that plans in pillars has no capabilities, so the gate
         looked at an empty list, found nothing owed, and opened the button.
         Measured on the pre-§236 build with every figure stripped:

             the reporting page   0 of 10 entered
             the submit gate      0 of  0 — nothing in the way
             a unit, same state   0 of 41 — "41 figures still to enter"

         It was never only the count: the ROWS come from the same list, so the
         note rule (§105) and the In-progress rule (§104.10) had never once run
         on this format either.

     2 · A KEY OBJECTIVE ADDED TO A FUNCTION HAD NO ID, so the reporting box
         carried the string "undefined", `findById()` matched nothing, and the
         figure was discarded without a word. The unit's own Add has minted one
         since §96.4; this control never did — and it serves a CAPABILITY too,
         so both formats were affected.

     3 · AND THE ROWS ALREADY IN A CLIENT'S DATABASE stay unanswerable until
         something heals them — which is MIGRATION 039 and deliberately not
         the browser. Minting a missing id on hydration was written first and
         reverted: `lastSaved` is taken after that, so the id joins the save
         BASELINE and never travels, while every later row edit is addressed
         at it — and `applyChanges()` refuses a row id the stored graph does
         not hold, failing the whole save and taking unrelated work with it.
         §191's answer to the same fault on the group's six objectives.
         Proved by `scripts/test-ko-ids.js` against a real Postgres.

   WHAT IS ASSERTED, AND WHY IT IS THE PROBLEM RATHER THAN THE NUMBER (§94.8):

     · The gate AGREES WITH THE REPORTING PAGE, on every shape — never a
       literal count, so the demo's plan can change and this stays green
       (§53.5). Both ends: it refuses when figures are owed AND clears when
       they are not, or a build that refused everything would pass.
     · Every control is PRESSED and the answer read back from the STORED
       function, never from the screen (§96: a control wired to nothing
       renders identically).
     · Nothing mints an id in the browser, asserted as an absence — the heal
       is the migration, and a second one here would be the failing save
       described above.

   §94.2 THROUGHOUT: the demo's pillars function holds no objectives at all and
   is fully reported, so every state measured here is MADE.
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


def js(pg, expr, arg=None):
    """A THROW IS A FAILURE, NEVER THE END OF THE RUN (§215).

    Run against a build that lacks something this file measures — which is
    exactly how it is proved able to fail — an unguarded evaluate kills the
    process at the first trial and the failure count reads ZERO. That is a
    falsification that looks like a pass. Anything that throws comes back as a
    value the assertions can still read."""
    try:
        return pg.evaluate(expr, arg) if arg is not None else pg.evaluate(expr)
    except Exception as e:                      # noqa: BLE001 - reported, not raised
        return {"threw": str(e).strip().split("\n")[0]}


STRIP = """(t)=>{
  const u = plansInPillars(t) ? unitLike(t) : null;
  if (!u) return false;
  u.keyObjectives.forEach(m => { m.actual=""; m.progress=null; m.note=""; });
  u.items.forEach(p => {
    p.measures.forEach(m => { m.actual=""; m.progress=null; m.note=""; });
    p.tactics.forEach(x => { x.actual=null; x.status="Not started"; x.note=""; });
  });
  return true;
}"""

FILL = """(t)=>{
  const u = plansInPillars(t) ? unitLike(t) : null;
  if (!u) return false;
  u.keyObjectives.forEach(m => { m.actual = m.target || "100"; m.progress = 100; });
  u.items.forEach(p => {
    p.measures.forEach(m => { m.actual = m.target || "100"; m.progress = 100; });
    p.tactics.forEach(x => { x.actual = 100; x.status = "Done"; });
  });
  return true;
}"""


with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME"))
    pg = b.new_page(viewport={"width": 1400, "height": 1000})
    # §167.2: the welcome overlay covers the viewport and eats every click.
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "sessionStorage.setItem('smp.tour.later','1');}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + FILE)
    pg.wait_for_timeout(900)

    print("\n── the fixture")
    fk = pg.evaluate("()=>Object.keys(FUNCTIONS).filter(k=>fnPlansInPillars(FUNCTIONS[k]))[0]")
    cap = pg.evaluate("()=>Object.keys(FUNCTIONS).filter(k=>!fnPlansInPillars(FUNCTIONS[k])"
                      "&&capsOfFunction(k).length)[0]")
    unit = pg.evaluate("()=>UNIT_KEYS.filter(k=>UNITS[k].active&&UNITS[k].items.length)[0]")
    T, TC = "fn:" + (fk or ""), "fn:" + (cap or "")
    ok("a function that plans in pillars", bool(fk), fk)
    ok("...one that plans in projects, to hold the other shape still", bool(cap), cap)
    ok("...and a business unit, which is the behaviour being matched", bool(unit), unit)
    if not (fk and cap and unit):
        b.close(); sys.exit(1)

    # ── 1 · THE GATE AGREES WITH THE PAGE, ON EVERY SHAPE ────────────────────
    # The reporting page draws from one list and the Submit button asked
    # another. Asserted as their AGREEMENT rather than as a count, which is the
    # form that survives somebody editing the demo plan (§94.8) — and asked of
    # the PRODUCT's own two functions, never of the helper added to fix this,
    # or the trial would only ever describe the new code to itself.
    # MEASURED WITH THE FIGURES STRIPPED, or it passes on the broken build
    # (§94.2): the demo's pillars function ships fully reported, and with
    # nothing owed a gate that counts NOTHING agrees with a page that counts
    # ten. The one state that separates them is the empty one.
    print("\n── 1 · what the gate counts is what the page counts")
    for label, t in (("the pillars function", T), ("the unit", unit),
                     ("the projects function", TC)):
        js(pg, STRIP, t)
        got = js(pg, """(t)=>{
          const page = plansInPillars(t) ? reportedCount(unitLike(t))
                                         : fnReportedCount(String(t).slice(3));
          return { gateTotal: submitBlockers(t).owed + page.done,
                   pageTotal: page.total, done: page.done };
        }""", t)
        ok(label + " — the gate counts every row the page asks for",
           got.get("gateTotal") == got.get("pageTotal"), got)
        ok("...and it is not empty, so the agreement means something (§113.8)",
           (got.get("pageTotal") or 0) > 0, got)

    # ── 2 · BOTH ENDS OF THE REFUSAL ────────────────────────────────────────
    # A gate that refuses everything satisfies "it refuses when figures are
    # owed"; only the clearing half separates a fix from a lock (§94.5).
    print("\n── 2 · it refuses when figures are owed, and clears when they are not")
    for label, t in (("the pillars function", T), ("the unit", unit)):
        ok(label + " — the state is MADE, not found (§94.2)",
           js(pg, STRIP, t) is True)
        owed = js(pg, "(t)=>submitBlockers(t).owed", t)
        why = js(pg, "(t)=>submitRefusal(t)", t)
        ok(label + " with nothing entered — Submit is refused", owed > 0, owed)
        ok("...and the refusal says how many", "still to enter" in (why or ""), why)
        js(pg, FILL, t)
        ok(label + " fully entered — nothing is owed",
           js(pg, "(t)=>submitBlockers(t).owed", t) == 0)

    print("\n── 3 · and the note rule reaches this format too (§105)")
    # The rows come from the same list the count does, so a gate blind to the
    # plan was blind to every rule that reads a row — not only to the total.
    pg.evaluate("""(t)=>{
      const u = unitLike(t);
      const m = u.items[0].measures[0];
      m.actual = "1"; m.target = "100"; m.progress = 5; m.note = "";
    }""", T)
    notes = js(pg, "(t)=>submitBlockers(t).notes.length", T)
    ok("a figure off track with no note blocks the pillars function's Submit",
       notes > 0, notes)
    ok("...and the refusal names it",
       "note" in str(js(pg, "(t)=>submitRefusal(t)", T) or ""))

    # ── 4 · ADDING AN OBJECTIVE, THROUGH THE REAL CONTROL ───────────────────
    print("\n── 4 · an objective added on the Overview can be reported against")
    pg.goto("file://" + FILE); pg.wait_for_timeout(900)
    for label, t in (("the pillars function", T), ("the projects function", TC)):
        before = js(pg, """(t)=>{
          const h = koHolderById(t.indexOf('fn:')===0 && plansInPillars(t)
                    ? t : capsOfFunction(String(t).slice(3))[0].id);
          return (h.list||[]).length; }""", t)
        pg.evaluate("""(a)=>{ current=a.t; currentSub='fnstrat'; CURSEC.fnstrat='found';
                              EDIT_PAGE.capfoundation=true; paint(); }""", {"t": t})
        pg.wait_for_timeout(500)
        btn = pg.query_selector("#panel [data-capkoadd]")
        ok(label + " — the Add control is on the page and can be pressed",
           btn is not None and btn.is_visible())
        if not btn:
            continue
        btn.click(); pg.wait_for_timeout(500)
        got = js(pg, """(a)=>{
          const key = a.t.indexOf('fn:')===0 && plansInPillars(a.t)
                    ? a.t : capsOfFunction(String(a.t).slice(3))[0].id;
          const list = koHolderById(key).list || [];
          const row = list[list.length-1];
          return { n:list.length, id:(row && row.id) === undefined ? null : row.id,
                   dupes: list.filter(x=>x && x.id===(row&&row.id)).length }; }""",
          {"t": t})
        ok("...a row was added", got.get("n") == (before + 1 if isinstance(before, int) else -1), got)
        ok("...and it carries an id, which is what the figure is found by",
           bool(got.get("id")), got)
        # `id` in the condition on purpose: without it, a build minting NO id
        # counts one row holding `undefined` and passes (§113.8).
        ok("...an id nothing else holds (§191, §96.2)",
           bool(got.get("id")) and got.get("dupes") == 1, got)

    # ── 5 · AND THE FIGURE TYPED AGAINST IT LANDS IN THE STORED FUNCTION ────
    # §96: an input wired to nothing looks identical. The answer is read out of
    # FUNCTIONS[...], never off the screen that drew it.
    print("\n── 5 · and typing into it reaches the stored function")
    pg.evaluate("""(a)=>{
      const u = unitLikeWritable(a.t);
      u.keyObjectives[u.keyObjectives.length-1].name = "Answerable objective";
      u.keyObjectives[u.keyObjectives.length-1].target = "90";
    }""", {"t": T})
    # §222: Reporting is a TAB, so the mode is being ON it — set once in
    # paint() and never per render, which is why `currentSub` has to say so.
    pg.evaluate("""(a)=>{ current=a.t; currentSub='report'; REPORTING=a.t; paint(); }""",
                {"t": T})
    pg.wait_for_timeout(700)
    landed = js(pg, """(a)=>{
      const rows = reportItems(unitLike(a.t)).filter(x=>x.kind==='objective');
      const row  = rows[rows.length-1];
      if (!row) return {err:'no objective row'};
      const el = document.querySelector('#panel [data-rep="'+row.id+'"]');
      if (!el) return {err:'no box for it', id:row.id};
      el.value = "88";
      el.dispatchEvent(new Event('change', {bubbles:true}));
      const stored = FUNCTIONS[a.t.slice(3)].keyObjectives
                       .filter(m=>m.id===row.id)[0];
      return { id:row.id, boxId:el.dataset.rep, stored: stored && stored.actual };
    }""", {"t": T})
    ok("the reporting box names the row rather than the word 'undefined'",
       landed.get("boxId") not in (None, "undefined"), landed)
    ok("...and the figure typed into it is in the stored function",
       str(landed.get("stored") or "").find("88") == 0, landed)

    # ── 6 · THE ROWS ALREADY STORED ARE HEALED BY A MIGRATION, NOT HERE ────
    # Deliberately not asserted in this file, and the reason is the finding:
    # minting a missing id in the browser puts it in the save BASELINE, so it
    # never travels, while every later row edit is addressed AT it — and
    # `applyChanges()` refuses a row id the stored graph does not hold, failing
    # the WHOLE save. The heal is migration 039, proved against a real Postgres
    # by `scripts/test-ko-ids.js` (15 assertions, including that it can fail).
    # What IS asserted here is that nothing mints one on the client:
    ok("nothing heals ids in the browser — that belongs to migration 039",
       js(pg, "()=>typeof settleKoIds") == "undefined",
       js(pg, "()=>typeof settleKoIds"))

    ok("no page errors throughout", not errs, errs[:3])
    b.close()

print("\n%d failed" % len(fails))
for f in fails:
    print("  FAIL  " + f)
sys.exit(1 if fails else 0)
