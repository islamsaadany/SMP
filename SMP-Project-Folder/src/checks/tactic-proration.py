#!/usr/bin/env python3
"""§250 — a tactic's outcome is measured against the part of ITS OWN WINDOW that
has passed, not the part of the year.

Islam, of a tactic running Q2 and Q3: *"that's a 6 months project from april
till september .. now we are reporting till august so the proration how should
it be calculated? because it's different than the proration of the measurs that
prorate across the year."*

He is right, and the platform only did half of it. §239 gave `tacticPlanned()`
the tactic's own months, so the "% delivered" column already read 5 of 6 = 83%
at August. But §248's OUTCOME — the tactic's own target, unit and compile rule —
is shaped as a measure and went straight through `measureDue()`, which prorates
by the YEAR. Measured on the pre-§250 build, at a review point of August, with a
Sum outcome of target 12 and an actual of 7:

    every window shape from Q1-only to Q1-Q4  ->  due 8, score 88%

One number for ten different windows: a column that cannot vary, which is
exactly the fault §239.1 found between the cycle's end quarter and the pips,
one part over.

WHAT THIS GUARDS, and why each half needs its own assertion:

  · THE SHARE IS THE TACTIC'S OWN MONTHS. Asserted as AGREEMENT with a month
    count this file works out for itself (§94.8), never against a literal, so a
    later change to the review point stays green and a build that went back to
    the year does not.

  · IT IS AN EXACT FRACTION, NOT THE ROUNDED PER CENT. The first draft of this
    change took the share from `tacticPlanned()`, which rounds to a whole per
    cent — and that moved a WHOLE-YEAR tactic from 88% to 87% and made a target
    of 12 read `9.96`. A rule that changes a whole-year tactic is not the rule
    that was agreed, so both are asserted: the exact due, and the whole-year
    tactic being byte-identical to the year's own answer.

  · ONLY `Sum` PRORATES. Latest is a rate at a point in time and Average is
    already normalised (§239). Both ends, or a build that prorated everything
    would satisfy every assertion about Sum.

  · A TACTIC WITH NO QUARTERS FALLS BACK TO THE YEAR. It has no window, and
    refusing to score it would empty the column for a plan that never filled its
    timelines in.

  · THE SCREEN, NOT ONLY THE FUNCTION. A rule the page does not read is a rule
    nobody meets (§96), so the benchmark is read off the Performance pane and
    the Reporting pane after driving the real controls.

  · A TACTIC THAT HAS NOT STARTED IS NOT ASKED, and must never show a target of
    nothing. Its share is 0, so the naive build prints `0` where the page has
    always said "Not yet due".

Run:  SMP_CHROME=… python3 qa-run.py checks/tactic-proration.py
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

SRC = str(pathlib.Path(__file__).resolve().parent.parent / "strategy-management-platform.html")
FAILS = []


def ck(name, cond, detail=""):
    print(("  ok      " if cond else "  FAIL    ") + name + ("" if cond else "   -> %r" % (detail,)))
    if not cond:
        FAILS.append(name)


# The months a tactic's window holds, and how many of them have passed at a
# given review month — worked out HERE so the product's answer is compared with
# something, rather than with itself.
def months_of(qs):
    return [q * 3 + k for q in range(4) if (q + 1) in qs for k in range(3)]


def share_of(qs, as_of_month_index):
    ms = months_of(qs)
    if not ms:
        return None
    return len([m for m in ms if m <= as_of_month_index]) / len(ms)


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None)
        pg = b.new_page(viewport={"width": 1500, "height": 950})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "localStorage.setItem('smp.tour.done','1')}catch(e){}")
        pg.goto("file://" + SRC)
        pg.wait_for_timeout(1400)
        pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")

        # ── 0 · the rule exists at all ────────────────────────────────────────
        # REPORTED, NEVER CRASHED ON (§192): a check that dies on a missing
        # function reports one failure and hides every other answer it had.
        print("\n── 0 · there is one function answering \"how far through THIS tactic\" ──")
        has = pg.evaluate("()=>typeof tacticShare === 'function'")
        ck("tacticShare() exists", has, has)
        if not has:
            print("\n  (the rule is absent — every assertion below is reported "
                  "against the build as it stands)")

        # ── 1 · the share is the tactic's own window ──────────────────────────
        print("\n── 1 · the share is the tactic's own months, not the year's ──")
        # August: the month being reported IN counts as passed, exactly as the
        # year's own share does (8/12, never 7/12). Index 7, zero-based.
        AUG = 7
        r = pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          const Q = (...qs) => { const t={id:"ck",name:"ck"}; qs.forEach(q=>t["q"+q]=true); return t; };
          const s = t => (typeof tacticShare === 'function') ? tacticShare(t) : null;
          const shapes = [[1],[2],[3],[4],[1,2],[2,3],[3,4],[1,2,3],[2,3,4],[1,2,3,4]];
          const out = {};
          shapes.forEach(qs => { out[qs.join("+")] = { share: s(Q(...qs)),
                                                       planned: tacticPlanned(Q(...qs)) }; });
          return { shapes: out, year: elapsedShare(), months: elapsedMonths(),
                   noQ: s({id:"z"}) };
        }""")
        shapes = [[1], [2], [3], [4], [1, 2], [2, 3], [3, 4], [1, 2, 3], [2, 3, 4], [1, 2, 3, 4]]
        bad = []
        for qs in shapes:
            key = "+".join(map(str, qs))
            want = share_of(qs, AUG)
            got = r["shapes"][key]["share"]
            if got is None or abs(got - want) > 1e-9:
                bad.append((key, want, got))
        ck("every window's share is its own elapsed months over its own months", not bad, bad)
        ck("the year is still 8 of 12 at August",
           r["months"] == 8 and abs(r["year"] - 8 / 12) < 1e-9, (r["months"], r["year"]))
        ck("Islam's case: a Q2+Q3 tactic at August is 5 of its 6 months",
           r["shapes"]["2+3"]["share"] is not None
           and abs(r["shapes"]["2+3"]["share"] - 5 / 6) < 1e-9, r["shapes"]["2+3"])
        # §239's own column must not move: the per cent is the share ROUNDED,
        # one function with the other derived from it, never two.
        pbad = [(k, v) for k, v in r["shapes"].items()
                if v["share"] is not None and v["planned"] != round(v["share"] * 100)]
        ck("the \"% delivered\" column is that same share, rounded", not pbad, pbad)
        ck("...so a Q2+Q3 tactic still reads 83%", r["shapes"]["2+3"]["planned"] == 83,
           r["shapes"]["2+3"])
        ck("a tactic with no quarters has no window and falls back to the year",
           r["noQ"] is None or abs(r["noQ"] - r["year"]) < 1e-9, r["noQ"])

        # ── 2 · the outcome's target is prorated by that share ────────────────
        print("\n── 2 · an outcome is measured against its tactic's window ──")
        o = pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          const Q = (...qs) => { const t={id:"ck",name:"ck",outcome:"Stores fitted",
              outDir:"\\u2265", outTarget:"12", outCompile:"Sum", outActual:"7"};
            qs.forEach(q=>t["q"+q]=true); return t; };
          const shapes = [[1],[2],[3],[4],[1,2],[2,3],[3,4],[1,2,3],[2,3,4],[1,2,3,4]];
          const out = {};
          shapes.forEach(qs => { const t=Q(...qs);
            out[qs.join("+")] = { score: tacticOutcomeScore(t), bench: tacticBenchmark(t) }; });
          return out;
        }""")
        # AGREEMENT, not a table of literals: due = the annual target x the
        # tactic's own share, and the score is 7 against that.
        wrong = []
        for qs in shapes:
            key = "+".join(map(str, qs))
            sh = share_of(qs, AUG)
            due = 12 * sh
            want_bench = None if due == 0 else str(round(due * 100) / 100).rstrip("0").rstrip(".")
            want_score = None if not due else max(0, min(150, round(7 / due * 100)))
            got = o[key]
            if got["score"] != want_score:
                wrong.append((key, "score", want_score, got["score"]))
            if want_bench is not None and got["bench"] not in (want_bench, want_bench + ".0"):
                wrong.append((key, "bench", want_bench, got["bench"]))
        ck("every window scores against its own prorated target", not wrong, wrong)
        # THE ONE NUMBER HE CONFIRMED, written out: a build computing this from
        # a constant would satisfy the agreement above and fail here.
        ck("Islam's case: target 12 over Apr-Sep reads 10 at August",
           o["2+3"]["bench"] in ("10", "10.0"), o["2+3"])
        ck("...and 7 against it scores 70%", o["2+3"]["score"] == 70, o["2+3"])
        # THE ROUNDING TRAP, and the whole reason this is an exact fraction:
        # 12 x 83/100 is 9.96, and a whole-year tactic drops a point.
        ck("the due is not taken through the rounded per cent (9.96)",
           o["2+3"]["bench"] not in ("9.96", "9.96%"), o["2+3"])
        ck("a WHOLE-YEAR tactic is left exactly where it was",
           o["1+2+3+4"]["score"] == 88 and o["1+2+3+4"]["bench"] in ("8", "8.0"),
           o["1+2+3+4"])

        # ── 2b · the share is never a stray argument ─────────────────────────
        # THE DEFECT THIS CHANGE NEARLY SHIPPED. `measureScore` gained an
        # optional share, and `Array.map` hands its callback the INDEX as a
        # second argument -- so `pillarPerf`'s `.map(measureScore)` prorated the
        # first measure of every pillar by 0 (unscorable), the second by the
        # whole year and the third by TWICE it. Measured against the shipped
        # build it moved real figures: one pillar 100 -> not scored, another
        # 83 -> 65. Wrong only for the `Sum` rows, so a spot check would miss it.
        #
        # Asserted as AGREEMENT (§94.8): a pillar's performance is the average
        # of its own measures' scores, each asked one at a time. A build that
        # leaked the index disagrees the moment a pillar holds two Sum rows.
        print("\n── 2b · a pillar's score is its measures', asked one at a time ──")
        pp = pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          var bad = [], sums = 0, seen = 0, carried = 0;
          /* §254: THE STATE IS MADE, NOT WAITED FOR. This asserted that the
             demo HELD a handed-over pillar, which it did until §253.2 cut the
             Retail -> Merchandising pointer at Islam's instruction — so a
             deliberate decision read as a regression (§214.3, and the rule is
             earned by now: a check that names a fact about the demo's DATA
             breaks the day somebody changes that data on purpose).

             REWRITTEN, NOT DELETED (§218). What it exists to prove is that the
             exclusion WORKS, so it makes one: the first pillar of the first
             unit is handed to a pillars function for the length of this probe
             and put back afterwards. That is stronger than the old assertion,
             because it holds whatever the demo happens to ship. */
          var fnKey = Object.keys(FUNCTIONS).filter(function(f){
            return FUNCTIONS[f].active !== false && fnPlansInPillars(FUNCTIONS[f]);
          })[0];
          var lent = fnKey ? UNITS[Object.keys(UNITS)[0]].items[0] : null;
          var hadBy = lent ? lent.by : undefined;
          if (lent) lent.by = fnKey;
          Object.keys(UNITS).forEach(function(k){
            (UNITS[k].items || []).forEach(function(p, i){
              /* A HANDED-OVER PILLAR IS SCORED BY THE FUNCTION THAT CARRIES IT,
                 never by its own measures (`viaCarrier`) -- Retail Stores has
                 one, and comparing it with its own empty measure list would
                 report a correct build as broken. */
              if (pillarCarrier(p)) { carried++; return; }
              var rows = scorableMeasures(p);
              sums += rows.filter(function(m){ return /^sum$/i.test(m.compile||""); }).length;
              var one = rows.map(function(m){ return measureScore(m); });
              var want = one.length
                ? Math.round(one.reduce(function(a,b){ return a+b; },0)/one.length) : null;
              var got = pillarPerf(p);
              seen++;
              if (got !== want) bad.push([k, i, want, got]);
            });
          });
          if (lent) { if (hadBy === undefined) delete lent.by; else lent.by = hadBy; }
          return { bad: bad, sums: sums, seen: seen, carried: carried,
                   madeOne: !!lent, putBack: !lent || lent.by === hadBy };
        }""")
        ck("there are Sum measures to get wrong", pp["sums"] > 0, pp["sums"])
        ck("...and pillars to check", pp["seen"] > 10, pp["seen"])
        ck("...and a handed-over pillar was MADE to exercise the exclusion",
           pp["madeOne"] is True, pp)
        ck("...and it was set aside, not counted as agreeing",
           pp["carried"] > 0, pp["carried"])
        ck("...and the pillar was put back (§94.2)", pp["putBack"] is True, pp)
        ck("every pillar's performance is its own measures' average", not pp["bad"], pp["bad"])

        # ── 3 · which compile rules move ──────────────────────────────────────
        print("\n── 3 · only a Sum outcome prorates ──")
        c = pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          const mk = compile => ({ id:"ck", name:"ck", q2:true, q3:true, outcome:"x",
              outDir:"\\u2265", outTarget:"12", outCompile:compile, outActual:"7" });
          const out = {};
          ["Sum","Latest","Average",""].forEach(c2 => { const t=mk(c2);
            out[c2||"(none)"] = { score: tacticOutcomeScore(t), bench: tacticBenchmark(t) }; });
          return out;
        }""")
        ck("Sum is measured against the part of the window that has passed",
           c["Sum"]["bench"] in ("10", "10.0"), c["Sum"])
        ck("Latest is measured against the whole target", c["Latest"]["bench"] == "12", c["Latest"])
        ck("Average is measured against the whole target", c["Average"]["bench"] == "12", c["Average"])
        ck("an outcome with no compile rule is measured against the whole target",
           c["(none)"]["bench"] == "12", c["(none)"])

        # ── 4 · the direction, the cap and the nought rule all survive ────────
        print("\n── 4 · direction, cap and nought, on the window's share ──")
        d = pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          const mk = (dir, target, actual) => ({ id:"ck", name:"ck", q2:true, q3:true,
              outcome:"x", outDir:dir, outTarget:target, outCompile:"Sum", outActual:actual });
          return {
            le60:  { s: tacticOutcomeScore(mk("\\u2264","120","60")),  b: tacticBenchmark(mk("\\u2264","120","60")) },
            le100: { s: tacticOutcomeScore(mk("\\u2264","120","100")), b: tacticBenchmark(mk("\\u2264","120","100")) },
            le0:   { s: tacticOutcomeScore(mk("\\u2264","120","0")) },
            over:  { s: tacticOutcomeScore(mk("\\u2265","12","40")) }
          };
        }""")
        ck("a ≤ outcome has its ALLOWANCE prorated, not its score",
           d["le60"]["b"] == "100", d["le60"])
        ck("...so spending exactly the allowance reads 100%", d["le100"]["s"] == 100, d["le100"])
        ck("nought against a ≤ outcome is still the best answer (§239.4)",
           d["le0"]["s"] == 150, d["le0"])
        ck("an overshoot still caps at 150", d["over"]["s"] == 150, d["over"])

        # ── 5 · the unit survives the proration ───────────────────────────────
        print("\n── 5 · the target keeps its unit (§199.4) ──")
        u = pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          const mk = tg => ({ id:"ck", name:"ck", q2:true, q3:true, outcome:"x",
              outDir:"\\u2265", outTarget:tg, outCompile:"Sum", outActual:"5" });
          const out={}; ["18B EGP","90%","6 #","1.6M USD"].forEach(tg=>{ out[tg]=tacticBenchmark(mk(tg)); });
          return out;
        }""")
        ck("a scaled currency reads as one token", u["18B EGP"] == "15B EGP", u)
        ck("a per cent keeps its sign", u["90%"] == "75%", u)
        ck("a count keeps its hash", u["6 #"] == "5 #", u)
        ck("dollars keep their scale", u["1.6M USD"] == "1.33M USD", u)

        # ── 6 · the SCREEN reads it, on both panes ───────────────────────────
        # A rule the page does not ask for is a rule nobody meets (§96). The
        # demo carries no outcome at all, so the state is MADE (§94.2).
        print("\n── 6 · the panes read the same answer ──")
        pg.evaluate("""()=>{
          REVIEW.asOfMonth = "Aug 26";
          var t = UNITS.mobile.items[0].tactics[0];
          window.__keep = JSON.stringify(t);
          t.q1=false; t.q2=true; t.q3=true; t.q4=false;
          t.outcome="CK stores fitted"; t.outDir="\\u2265"; t.outTarget="12 #";
          t.outCompile="Sum"; t.outActual="7";
          t.actual = 40;
        }""")
        pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(300)
        pg.click('[data-s="performance"]'); pg.wait_for_timeout(600)
        perf = pg.evaluate("""()=>{
          var rows=[...document.querySelectorAll('tbody tr')]
            .filter(r=>/CK stores fitted/.test(r.textContent));
          if(!rows.length) return {found:false};
          var r=rows[0], pair=r.querySelector('.pair');
          return { found:true, pair: pair ? pair.textContent.trim() : null,
                   text: r.textContent.replace(/\\s+/g," ").trim() };
        }""")
        ck("the tactic is on the Performance pane", perf.get("found"), perf)
        ck("...and its figure is shown against the window's target, not the year's",
           bool(perf.get("pair")) and "10" in perf["pair"] and "8 #" not in perf["pair"], perf)

        pg.click('[data-s="report"]'); pg.wait_for_timeout(700)
        rep = pg.evaluate("""()=>{
          var rows=[...document.querySelectorAll('tbody tr')]
            .filter(r=>/CK stores fitted/.test(r.textContent));
          if(!rows.length) return {found:false};
          var tds=[...rows[0].querySelectorAll('td')].map(x=>x.textContent.trim());
          return { found:true, cells:tds,
                   ytd: tds.filter(x=>/^10\\s*#/.test(x)),
                   year: tds.filter(x=>/^8\\s*#/.test(x)) };
        }""")
        ck("the tactic is on the Reporting pane", rep.get("found"), rep)
        ck("...and its YTD Target is the window's, never the year's",
           bool(rep.get("ytd")) and not rep.get("year"), rep)
        ck("...and it says what that is a part of", any("of 12 #" in c for c in rep.get("cells", [])),
           rep.get("cells"))

        # ── 7 · a tactic that has not started shows no target of nothing ──────
        print("\n── 7 · not yet due stays not yet due ──")
        nd = pg.evaluate("""()=>{
          var t = UNITS.mobile.items[0].tactics[0];
          t.q1=false; t.q2=false; t.q3=false; t.q4=true;   /* Oct-Dec, at August */
          paint();
          var rows=[...document.querySelectorAll('tbody tr')]
            .filter(r=>/CK stores fitted/.test(r.textContent));
          var txt = rows.length ? rows[0].textContent.replace(/\\s+/g," ").trim() : "";
          var out = { due: tacticDue(t), txt: txt,
                      zero: /(^|[^0-9])0\\s*#/.test(txt) };
          return out;
        }""")
        ck("a Q4 tactic is not due at August", nd["due"] is False, nd)
        ck("...and the page never offers it a target of nothing", not nd["zero"], nd)
        ck("...it says it is outside this cycle", "Not asked" in nd["txt"] or "Not yet due" in nd["txt"], nd)

        pg.evaluate("""()=>{ var p=UNITS.mobile.items[0];
          p.tactics[0] = JSON.parse(window.__keep); paint(); }""")

        print("\n── 8 · nothing threw ──")
        ck("no page errors", not errs, errs)
        b.close()

    print("\n%d checked, %d FAILED" % (0, len(FAILS)) if False else
          "\n%s" % ("ALL PASSED" if not FAILS else "%d FAILED: %s" % (len(FAILS), FAILS)))
    sys.exit(1 if FAILS else 0)


main()
