#!/usr/bin/env python3
"""§276 — a count is owed in whole ones.

Islam: *"we need a compilation type that prorate to integrs only .. if we have
a target of 2 shops to open in the year so in the 8th month that proration asks
for 1.3 stores which is not feasible but it should prorate for the closest
integer maybe of the lowest"* — then, of the name and the rounding: *"Count is
good"*, *"agreed"* (rounded DOWN, with nothing owed in the early months).

WHAT THIS GUARDS, and why each half needs its own assertion:

  · ONE LIST. The compile rule was spelled seven times across the pen, the
    plan builder and the workbook, so every picker is asserted to offer EXACTLY
    the shared list — a build that added Count to six of seven passes every
    "Count is offered" assertion written against the one it reached.

  · COUNT PRORATES AND SUM STILL DOES; LATEST AND AVERAGE STILL DO NOT. Both
    ends, or a build that prorated everything satisfies every assertion about
    Count.

  · ROUNDED DOWN, AS AGREEMENT WITH ARITHMETIC THE CHECK DOES ITSELF, swept
    across all twelve months — including the months where the raw product
    lands a hair under a whole number (7 × 3/12 is 1.7499999999999998), which
    is where a floor taken carelessly owes one fewer.

  · NOTHING DUE YET IS NOT "NOT SCORED" (§35): a count with nothing owed
    leaves every average AND the page says why, in the tactics' own not-yet-due
    pill — and a row that genuinely cannot be scored still reads Not scored,
    or a build that renamed the pill everywhere would pass.

  · THE DEMO IS UNMOVED. 0 of its rows carry Count, and for every row in it
    the new "does this prorate" answers exactly what the old Sum-only test
    did, so no stored score can have moved. The state is MADE (§94.2).

  · THE WORKBOOK ACCEPTS THE WORD AND REFUSES A WRONG ONE BY NAMING ALL FOUR.

Run:  SMP_CHROME=… python3 qa-run.py checks/count-compile.py
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

# SMP_BUILT points the check at another build — how it was proved able to
# fail (§94.5) against a copy with the floor taken out, while the sweep was
# reading the real one.
SRC = os.environ.get("SMP_BUILT") or str(pathlib.Path(__file__).resolve().parent.parent / "strategy-management-platform.html")
FAILS = []

def ck(name, cond, detail=""):
    print(("  ok      " if cond else "  FAIL    ") + name + ("" if cond else "   -> %r" % (detail,)))
    if not cond: FAILS.append(name)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1500, "height": 2400})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "localStorage.setItem('smp.tour.done','1')}catch(e){}")
        pg.goto("file://" + SRC); pg.wait_for_timeout(1400)
        pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")

        # EVERY PROBE DEGRADES (§215): a build without the new names must
        # report, not die.
        have = pg.evaluate("""()=>({
          list: typeof SMPRules.COMPILES !== 'undefined',
          pro: typeof SMPRules.prorates === 'function',
          whole: typeof SMPRules.wholeUnits === 'function',
          ndy: typeof nothingDueYet === 'function'})""")
        ck("the shared list and its three readers exist", all(have.values()), have)
        if not all(have.values()):
            print("\ncount-compile: cannot continue without them"); sys.exit(1)

        print("\n── 1 · one list, and what on it prorates ──")
        r = pg.evaluate("""()=>({
          list: SMPRules.COMPILES,
          pro: SMPRules.COMPILES.map(c=>SMPRules.prorates(c)),
          whole: SMPRules.COMPILES.map(c=>SMPRules.wholeUnits(c)),
          lower: SMPRules.prorates('count') && SMPRules.wholeUnits(' COUNT ')})""")
        ck("the list is Sum · Count · Latest · Average",
           r["list"] == ["Sum", "Count", "Latest", "Average"], r["list"])
        ck("Sum and Count prorate, Latest and Average do not",
           r["pro"] == [True, True, False, False], r["pro"])
        ck("only Count is in whole units", r["whole"] == [False, True, False, False], r["whole"])
        ck("...read whatever the case, as a stored value may arrive", r["lower"], r)

        print("\n── 2 · Islam's own example, made (§94.2) ──")
        ex = pg.evaluate("""()=>{
          var keep = REVIEW.asOfMonth; REVIEW.asOfMonth = "Aug 26";
          var mk = c => ({name:"Shops opened", dir:"\\u2265", target:"2 #", compile:c, actual:"1"});
          var out = {months: elapsedMonths(),
            count:{due:measureDue(mk("Count")), lab:measureDueLabel(mk("Count")), score:measureScore(mk("Count"))},
            sum:  {due:measureDue(mk("Sum")),   lab:measureDueLabel(mk("Sum")),   score:measureScore(mk("Sum"))}};
          if (keep === undefined) delete REVIEW.asOfMonth; else REVIEW.asOfMonth = keep;
          return out;
        }""")
        ck("the review point is month 8", ex["months"] == 8, ex)
        ck("2 shops by Count owe ONE at month 8, and one opened reads 100%",
           ex["count"]["due"] == 1 and ex["count"]["score"] == 100, ex["count"])
        ck("...and the benchmark is written in the target's own unit",
           ex["count"]["lab"] == "1 #", ex["count"])
        ck("the same row by Sum still owes 1.33 and reads 75% — Sum is untouched",
           abs(ex["sum"]["due"] - 4/3) < 1e-9 and ex["sum"]["score"] == 75
           and ex["sum"]["lab"] == "1.33 #", ex["sum"])

        print("\n── 3 · rounded down, every month of the year ──")
        # The agreement, not a table of literals: the check floors for itself.
        MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        sweep = pg.evaluate("""(months)=>{
          var keep = REVIEW.asOfMonth, out = {};
          [2, 3, 7, 12].forEach(function(t){
            out[t] = months.map(function(mo){
              REVIEW.asOfMonth = mo + " 26";
              return measureDue({dir:"\\u2265", target:String(t), compile:"Count", actual:""});
            });
          });
          if (keep === undefined) delete REVIEW.asOfMonth; else REVIEW.asOfMonth = keep;
          return out;
        }""", MONTHS)
        import math
        for t in (2, 3, 7, 12):
            want = [math.floor(t * m / 12 + 1e-9) for m in range(1, 13)]
            ck("a target of %d owes floor(target × months/12) at every month" % t,
               sweep[str(t)] == want, {"got": sweep[str(t)], "want": want})
        ck("...so 2 shops owe nothing until June, one from June, two in December",
           sweep["2"] == [0,0,0,0,0,1,1,1,1,1,1,2], sweep["2"])
        ck("...and 7 at March owes 1, where a careless floor of 1.7499999999999998 is still 1 "
           "but 3 at April owes exactly 1, never 0", sweep["7"][2] == 1 and sweep["3"][3] == 1, sweep)

        print("\n── 4 · nothing due yet is not 'not scored' ──")
        nd = pg.evaluate("""()=>{
          var keep = REVIEW.asOfMonth; REVIEW.asOfMonth = "Apr 26";
          var row = {dir:"\\u2265", target:"2 #", compile:"Count", actual:"1"};
          var none = {dir:"\\u2265", target:"2 #", compile:"Count", actual:""};
          var lat = {dir:"\\u2265", target:"2 #", compile:"Latest", actual:""};
          var out = {due:measureDue(row), score:measureScore(row), lab:measureDueLabel(row),
                     ndy:nothingDueYet(row), ndyNone:nothingDueYet(none),
                     latNdy:nothingDueYet(lat), latScore:measureScore(lat),
                     yn:nothingDueYet({dir:"\\u2265", target:"Y/N", compile:"Count", actual:""})};
          if (keep === undefined) delete REVIEW.asOfMonth; else REVIEW.asOfMonth = keep;
          return out;
        }""")
        ck("at April 2 shops owe nought", nd["due"] == 0, nd)
        ck("...the row leaves every average (null, never 0 or 150)", nd["score"] is None, nd)
        ck("...and no benchmark is printed — '/ 0 #' is not a benchmark", nd["lab"] is None, nd)
        ck("...and the row says nothing is due yet, figure or no figure",
           nd["ndy"] and nd["ndyNone"], nd)
        ck("a Latest row with no figure is NOT 'nothing due yet' — it is unscored",
           not nd["latNdy"] and nd["latScore"] is None, nd)
        ck("a yes/no target never claims it", not nd["yn"], nd)

        # ON THE PAGE: the pill, both ends. Made on Mobile's first pillar and
        # put back (§113.8).
        pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(300)
        pg.click('[data-s="performance"]'); pg.wait_for_timeout(500)
        pills = pg.evaluate("""()=>{
          var keep = REVIEW.asOfMonth; REVIEW.asOfMonth = "Apr 26";
          var p = UNITS.mobile.items[0];
          var a = {id:"CK-CNT", name:"Shops opened (check)", dir:"\\u2265", target:"2 #", compile:"Count", actual:"1"};
          var b = {id:"CK-LAT", name:"Rate (check)", dir:"\\u2265", target:"2 #", compile:"Latest", actual:""};
          p.measures.push(a); p.measures.push(b); paint();
          var row = n => [...document.querySelectorAll('tr')].find(r => r.textContent.indexOf(n) > -1);
          var ra = row("Shops opened (check)"), rb = row("Rate (check)");
          var out = {a: ra ? ra.textContent : null, b: rb ? rb.textContent : null,
                     aPill: ra ? (ra.querySelector('.pill') || {}).className : null,
                     bPill: rb ? (rb.querySelector('.pill') || {}).className : null};
          p.measures.pop(); p.measures.pop();
          if (keep === undefined) delete REVIEW.asOfMonth; else REVIEW.asOfMonth = keep;
          paint();
          return out;
        }""")
        ck("the Performance page says 'Nothing due yet' on the count",
           pills["a"] is not None and "Nothing due yet" in pills["a"] and "Not scored" not in pills["a"], pills)
        ck("...in the tactics' own not-yet-due pill, never the alarm one",
           pills["aPill"] == "pill kind", pills)
        ck("...and the unscored Latest row beside it still reads Not scored",
           pills["b"] is not None and "Not scored" in pills["b"] and pills["bPill"] == "pill none", pills)
        ck("...and neither row is left behind", pg.evaluate(
           "()=>!document.body.textContent.match(/\\(check\\)/)"))

        print("\n── 5 · the demo is unmoved ──")
        demo = pg.evaluate("""()=>{
          var rows = [];
          Object.keys(UNITS).forEach(k => (UNITS[k].items||[]).forEach(p => (p.measures||[]).forEach(m => rows.push(m))));
          (GROUP.keyObjectives||[]).forEach(m => rows.push(m));
          Object.keys(UNITS).forEach(k => (UNITS[k].keyObjectives||[]).forEach(m => rows.push(m)));
          var counts = rows.filter(m => SMPRules.wholeUnits(m.compile)).length;
          var agree = rows.every(m => SMPRules.prorates(m.compile) === (String(m.compile||"").toLowerCase() === "sum"));
          return {n: rows.length, counts: counts, agree: agree};
        }""")
        ck("no demo row carries Count (%d rows read)" % demo["n"], demo["counts"] == 0, demo)
        ck("...and for every one of them 'prorates' answers exactly what the Sum-only test did",
           demo["agree"], demo)

        print("\n── 6 · every picker offers the one list, and choosing writes ──")
        # Plan is a SECTION of Strategy, not a tab (§101's own lesson) — and
        # the tab is pressed from script: at this viewport a real pointer
        # press on it lands on the band pinned over it and times out.
        # THE VIEWER IS SWITCHED BEFORE NAVIGATING, never after: a switch
        # re-lands on the remembered page (§173, §237), so a select made after
        # reaching the plan puts the page straight back on Performance.
        if pg.evaluate("()=>document.querySelector('#asWho').value") != "smo":
            pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)
        pg.evaluate("()=>document.querySelector('[data-s=\"strategy\"]').click()"); pg.wait_for_timeout(400)
        pg.evaluate("()=>{var b=document.querySelector('[data-sub2=\"plan\"]'); if(b) b.click();}"); pg.wait_for_timeout(400)
        pen = pg.query_selector('.pane .paneact .penbtn[data-page="plan"]')
        ck("the plan pen is there", bool(pen))
        if pen:
            pen.click(); pg.wait_for_timeout(500)
        pick = pg.evaluate("""()=>{
          var L = SMPRules.COMPILES;
          var sels = [...document.querySelectorAll('.pane select')]
            .filter(s => [...s.options].some(o => o.value === "Sum"));
          var lists = sels.map(s => [...s.options].map(o => o.value));
          var okAll = lists.length && lists.every(l => JSON.stringify(l) === JSON.stringify(L)
                                                   || JSON.stringify(l) === JSON.stringify([""].concat(L)));
          var m = UNITS.mobile.items[0].measures[0], before = m.compile;
          var sel = sels.find(s => !s.disabled);
          if (!sel) return {n: lists.length, okAll: false, lists: lists, wrote: null, back: false, none: true};
          sel.value = "Count"; sel.dispatchEvent(new Event('change', {bubbles:true}));
          var wrote = m.compile;
          sel.value = before; sel.dispatchEvent(new Event('change', {bubbles:true}));
          return {n: lists.length, okAll: !!okAll, lists: lists.slice(0,3), wrote: wrote, back: m.compile === before};
        }""")
        ck("%d compile pickers on the open plan, every one offering exactly the shared list" % pick["n"],
           pick["n"] >= 2 and pick["okAll"], pick["lists"])
        ck("choosing Count WRITES the row", pick["wrote"] == "Count", pick)
        ck("...and was put back", pick["back"], pick)
        # The builder's segmented control reads the same list.
        bld = pg.evaluate("""()=>{
          if (typeof bformDef !== 'function') return {none:true};
          var d = bformDef('measure', {}); var f = (d.fields||[]).find(x => x.k === 'compile');
          return f ? f.opts.map(o => o[0]) : {nofield:true};
        }""")
        ck("the plan builder's compile control offers the same list",
           bld == ["Sum", "Count", "Latest", "Average"], bld)

        print("\n── 7 · the workbook accepts the word and refuses a wrong one by name ──")
        wb = pg.evaluate("""()=>{
          var u = UNITS.mobile;
          var mk = c => [{id:"1", type:"PILLAR", name:"P"},
                         {id:"2", type:"MEASURE", parent_id:"1", name:"M", direction:"\\u2265", target:"2", compile:c}];
          var okRows = mk("Count"), badRows = mk("Foo");
          var good = validatePlan(u, okRows), bad = validatePlan(u, badRows);
          var msgs = p => (p && p.problems ? p.problems : (Array.isArray(p) ? p : [])).map(x => x.msg || String(x));
          return {good: msgs(good).filter(m => /compile/.test(m)), bad: msgs(bad).filter(m => /compile/.test(m)),
                  lists: (typeof COMPILES !== 'undefined') ? COMPILES : null};
        }""")
        ck("Count passes the upload's compile check", wb["good"] == [], wb)
        ck("a made-up rule is refused, naming all four",
           len(wb["bad"]) == 1 and "Sum, Count, Latest or Average" in wb["bad"][0], wb)
        ck("the workbook's validation list IS the shared list",
           wb["lists"] == ["Sum", "Count", "Latest", "Average"], wb)

        print("\n── 8 · nothing threw ──")
        ck("no page errors at any point", not errs, errs[:3])
        b.close()

    print("\ncount-compile: " + ("all passed" if not FAILS
                                  else "%d FAILED -> %s" % (len(FAILS), FAILS)))
    sys.exit(1 if FAILS else 0)

main()
