"""SETUP › PLANNING & REPORTING CYCLE (§495, spec 064 §7).

The page that replaces Setup › Reporting cycle. What is asserted:

  1 · THE PAGE IS NAMED FOR BOTH and the PLAN PERIOD is its first block, with
      its own Edit — asserted as an ORDER (the block before the cycle) rather
      than as a pixel (§94.8).
  2 · EDIT OPENS THE PERIOD'S OWN PEN, and the cycle's pen no longer holds it.
  3 · A SET PERIOD DRAWS A TIMELINE whose lit months are EXACTLY the period —
      asserted as agreement with planFrom()/planTo(), never a typed count.
  4 · A CYCLE RUNNING PAST THE PERIOD IS FLAGGED, and one inside it is not —
      both ends (§94.2), through the same cyclePastPlan() the strip asks.
  5 · TACTICS OUTSIDE A SHORTENED PERIOD ARE FLAGGED, NEVER DELETED: the count
      agrees with tacticsOutsidePlan(), and every tactic's quarters are
      byte-identical before and after the period is shortened.

The state is MADE (§255): the worked example holds no plan period. Every probe
degrades rather than throwing (§215).
"""
import os, json
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(HERE), "strategy-management-platform.html")
URL = "file://" + BUILT
fails = []


def ok(what, cond, got=None):
    if cond:
        print("  ok   " + what)
    else:
        fails.append(what)
        print("  FAIL " + what + ("" if got is None else "   got: " + repr(got)))


def js(pg, fn, *a):
    try:
        return pg.evaluate(fn, *a)
    except Exception as e:
        return {"__err": str(e)[:160]}


QUARTERS = """()=>{ const o={}; Object.keys(UNITS).forEach(k=>(UNITS[k].items||[]).forEach(p=>
  (p.tactics||[]).forEach((t,i)=>{ o[k+'|'+(p.code||p.id)+'|'+i]=[t.q1,t.q2,t.q3,t.q4].map(x=>+x||0).join(''); })));
  return JSON.stringify(o); }"""

with sync_playwright() as p:
    br = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
    pg = br.new_page(viewport={"width": 1440, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(1400)
    js(pg, "()=>{ delete GROUP[SMPRules.PLAN_FROM]; delete GROUP[SMPRules.PLAN_TO]; current='setup'; currentSub='cycle'; paint(); }")
    pg.wait_for_timeout(400)

    print("\n── 1 · the page, and the plan period first ──")
    t = js(pg, "()=>{ const h=document.querySelector('.setuphead'); return h?h.textContent:''; }")
    ok("the page is called Planning & reporting cycle", isinstance(t, str) and "Planning & reporting cycle" in t, t)
    o = js(pg, """()=>{ const b=document.querySelector('[data-plan-block]'); const c=document.querySelector('[data-editcycle]');
      if(!b) return {none:true};
      return { first: !c || !!(b.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING),
               edit: !!b.querySelector('[data-editplan]'),
               unset: /Not set/.test(b.textContent) }; }""")
    ok("the plan period block is drawn", o.get("none") is not True, o)
    ok("...before the reporting cycle", o.get("first") is True, o)
    ok("...with its own Edit", o.get("edit") is True, o)
    ok("with no period it says Not set", o.get("unset") is True, o)
    ok("and draws no timeline while there is no period",
       js(pg, "()=>!document.querySelector('[data-plan-timeline]')") is True)

    print("\n── 2 · Edit opens the period's own pen ──")
    b = pg.query_selector("[data-editplan]")
    if b: b.click(); pg.wait_for_timeout(400)
    pen = js(pg, """()=>{ const p=document.querySelector('[data-plan-block] .planblk-pen');
      return { open: !!p, pickers: p ? p.querySelectorAll('.monthbtn').length : 0,
               word: (document.querySelector('[data-editplan]')||{}).textContent || '' }; }""")
    ok("the pen opens inside the block", pen.get("open") is True, pen)
    ok("holding the two month pickers", pen.get("pickers") == 2, pen)
    ok("and the button says Done editing", "Done" in pen.get("word", ""), pen)
    cb = pg.query_selector("[data-editcycle]")
    if cb: cb.click(); pg.wait_for_timeout(400)
    ok("the cycle's pen does not hold the period",
       js(pg, "()=>{ const c=document.querySelector('.newcycle'); return !c || !c.querySelector('.planper'); }") is True)
    js(pg, "()=>{ CYCLEEDIT=null; PLANEDIT=null; paint(); }"); pg.wait_for_timeout(250)

    print("\n── 3 · the timeline is the period ──")
    js(pg, "()=>{ REVIEW.from='Jul 2026'; REVIEW.to='Sep 2026'; GROUP[SMPRules.PLAN_FROM]='Jul 2026'; GROUP[SMPRules.PLAN_TO]='Dec 2026'; paint(); }")
    pg.wait_for_timeout(300)
    tl = js(pg, """()=>{ const t=document.querySelector('[data-plan-timeline]'); if(!t) return {none:true};
      const lit=[...t.querySelectorAll('.pptl-m.inp')].map(e=>e.title);
      return { lit: lit, want: planLength(), first: lit[0], last: lit[lit.length-1],
               from: SMPRules.monthLabel(planFrom()), to: SMPRules.monthLabel(planTo()) }; }""")
    ok("a timeline is drawn once a period is set", tl.get("none") is not True, tl)
    ok("its lit months are exactly the plan's length", len(tl.get("lit") or []) == tl.get("want"), tl)
    ok("...from the plan's first month to its last",
       tl.get("first") == tl.get("from") and tl.get("last") == tl.get("to"), tl)

    print("\n── 4 · a cycle past the period is flagged, one inside it is not ──")
    ok("a cycle inside the period carries no flag",
       js(pg, "()=>!document.querySelector('[data-cyc-past]') && cyclePastPlan()===false") is True)
    js(pg, "()=>{ REVIEW.to='Feb 2027'; paint(); }"); pg.wait_for_timeout(250)
    ok("a cycle running past the period is flagged",
       js(pg, "()=>!!document.querySelector('[data-cyc-past]') && cyclePastPlan()===true") is True)
    ok("...and the timeline marks the months past it",
       js(pg, "()=>document.querySelectorAll('[data-plan-timeline] .pptl-m.past').length") == 2)
    js(pg, "()=>{ REVIEW.to='Sep 2026'; paint(); }"); pg.wait_for_timeout(250)

    print("\n── 5 · tactics outside a shortened period: flagged, never deleted ──")
    before = js(pg, QUARTERS)
    js(pg, "()=>{ GROUP[SMPRules.PLAN_FROM]='Jul 2026'; GROUP[SMPRules.PLAN_TO]='Sep 2026'; paint(); }")
    pg.wait_for_timeout(300)
    fl = js(pg, """()=>{ const f=document.querySelector('[data-plan-outside]');
      return { drawn: !!f, n: tacticsOutsidePlan(), text: f ? f.textContent : '' }; }""")
    ok("some tactics fall outside Jul–Sep", (fl.get("n") or 0) > 0, fl)
    ok("the flag is drawn and names the count",
       fl.get("drawn") is True and str(fl.get("n")) in fl.get("text", ""), fl)
    ok("every tactic's quarters are untouched", js(pg, QUARTERS) == before)
    js(pg, "()=>{ GROUP[SMPRules.PLAN_FROM]='Jan 2026'; GROUP[SMPRules.PLAN_TO]='Dec 2026'; paint(); }")
    pg.wait_for_timeout(250)
    ok("a full-year period flags nothing",
       js(pg, "()=>!document.querySelector('[data-plan-outside]') && tacticsOutsidePlan()===0") is True)

    ok("no page error anywhere in the run", not errs, errs[:3])
    br.close()

print("\nall plan-cycle-page checks passed" if not fails else "\n%d FAILED" % len(fails))
raise SystemExit(1 if fails else 0)
