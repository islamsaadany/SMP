#!/usr/bin/env python3
"""§239 — YTD figures are measured against the part of the year that has passed.

Islam, of the reporting screen: *"the reporting of YTD is being compared with
the full year target without proration which is the wrong practice"*, and later,
of the tactics table: *"what is 45/50? what is this unit?"*

WHAT THIS GUARDS, and why each half needs its own assertion:

  · THE REVIEW POINT IS A MONTH. His cycles are customised by month ("we might
    be reporting till month 8 in the year"), and a quarter cannot say eight
    months. Before this there were TWO fields answering "how far are we" —
    `REVIEW.endsQuarter` (which the figures read) and `GROUP.asOfQuarter` (which
    the quarter pips read) — agreeing in the demo and disagreeing on any cycle
    not reported at its own end. Asserted as their AGREEMENT, never as a number.

  · PRORATE THE TARGET, NEVER THE RATIO. Dividing a score by the elapsed share
    is right for "more is better" and exactly backwards for "less is better",
    and the demo carries no such measure — so this MAKES one (§94.2) and asserts
    the value only the correct arithmetic produces.

  · WHICH ROWS MOVE. `Sum` adds up across the year and prorates; `Latest` is a
    rate at a point in time and must NOT. Both ends, or a build that prorated
    everything would satisfy every assertion about Sum.

  · THE STORED FIGURE DOES NOT MOVE. `progress` goes on holding the raw
    actual-against-the-annual-target ratio, because archives and closed cycles
    read it and because reward stays a year-end judgement (§239). A build that
    "fixed" this by overwriting `progress` would break every past cycle
    silently, so the raw value is asserted UNCHANGED beside the new score.

  · THE DECK AGREES WITH THE PAGE. Two surfaces onto one number is how they
    drift (§53.5), so the deck's figure is compared with the page's rather than
    with a literal — and every deck row is counted against its own header,
    because removing a column from a header and not from the row is the
    off-by-one this change could most easily ship.

Run:  SMP_CHROME=… python3 qa-run.py checks/ytd-proration.py
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

SRC = str(pathlib.Path(__file__).resolve().parent.parent / "strategy-management-platform.html")
FAILS = []

def ck(name, cond, detail=""):
    print(("  ok      " if cond else "  FAIL    ") + name + ("" if cond else "   -> %r" % (detail,)))
    if not cond: FAILS.append(name)

def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1500, "height": 950})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "localStorage.setItem('smp.tour.done','1')}catch(e){}")
        pg.goto("file://" + SRC); pg.wait_for_timeout(1400)
        pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")

        print("\n── 1 · one answer to \"how far through the year are we\" ──")
        r = pg.evaluate("""()=>({
          lab: reviewAsOfLabel(), months: elapsedMonths(), share: elapsedShare(),
          pips: [0,1,2,3].map(quarterPast), stored: REVIEW.to || null })""")
        # §298: REWRITTEN, NEVER LOOSENED (§218). This asserted the FALLBACK —
        # with no review point set, the cycle's own quarter end answered — which
        # was the safety argument §239.1 shipped on. There is no second field to
        # leave unset any more: the cycle's end IS the review point, so what is
        # asserted is that the two are the same month and that it is printed
        # the way the strip beside it prints `to` (four digits, or one line
        # would read "Jun 2026 ... reported as of Jun 26" and look like two
        # different months).
        ck("the review point is the month the cycle covers to",
           r["stored"] == "Jun 2026" and r["lab"] == "Jun 2026", r)
        ck("...which is six months of twelve", r["months"] == 6 and r["share"] == 0.5, r)
        # THE AGREEMENT, not the number: the pips and the figures must answer
        # from one place, which is the whole of what §239 repaired.
        ck("the quarter pips agree with it", r["pips"] == [True, True, False, False], r["pips"])

        print("\n── 2 · what prorates, and what must not ──")
        m = pg.evaluate("""()=>{
          var g=GROUP.keyObjectives;
          var sum=g.filter(x=>/^sum$/i.test(x.compile||""))[0];
          var lat=g.filter(x=>/^latest$/i.test(x.compile||""))[0];
          var pack=x=>({name:x.name, compile:x.compile, target:x.target, actual:x.actual,
                        stored:x.progress, score:measureScore(x), due:measureDueLabel(x)});
          return {sum:pack(sum), latest:pack(lat)};
        }""")
        s, l = m["sum"], m["latest"]
        ck("a Sum measure is measured against the share of its target due by now",
           s["due"] == "9B EGP" and s["score"] == 87, s)
        ck("...and the STORED figure is left exactly as it was",
           s["stored"] == 43, s)
        ck("a Latest measure is measured against the whole year, unchanged",
           l["score"] == l["stored"] == 78 and l["due"] == l["target"], l)

        print("\n── 3 · the target is prorated, not the ratio ──")
        # NOT IN THE DEMO, SO IT IS MADE (§94.2): a "less is better" measure
        # that adds up. Dividing the ratio would read 150 (capped); prorating
        # the target reads 125, and only the second is right.
        made = pg.evaluate("""()=>{
          var u=UNITS.mobile, p=u.items[0];
          var row={id:"CK-LE", name:"Spend to date", dir:"\\u2264", target:"100",
                   compile:"Sum", actual:"40", progress:null};
          p.measures.push(row);
          var out={score:measureScore(row), due:measureDueLabel(row)};
          p.measures.pop();
          return out;
        }""")
        ck("a \u2264 measure that adds up reads 125%, never the 150% a divided ratio gives",
           made["score"] == 125, made)
        ck("...because its target, not its score, is what was halved",
           made["due"] == "50", made)

        print("\n── 3b · nought on a \u2264 measure is the best answer, not an unscorable one ──")
        # §239.4: the arithmetic divides BY the actual on a "less is better"
        # row, so a guard against dividing by zero turned the BEST result in
        # the table into "Not scored" -- Islam's own "Data duplicate rate
        # \u2264 1%, 0%", which read 150% before §239 and stopped being scored
        # after it. Asserted for a prorating row and a rate alike.
        zero = pg.evaluate("""()=>({
          rate: measureScore({dir:"\u2264", target:"1%",  compile:"Latest", actual:"0%"}),
          sum:  measureScore({dir:"\u2264", target:"100", compile:"Sum",    actual:"0"}),
          overshot: measureScore({dir:"\u2264", target:"1%", compile:"Latest", actual:"4%"})
        })""")
        ck("zero against a \u2264 target reads the cap, on a rate", zero["rate"] == 150, zero)
        ck("...and on a row that prorates", zero["sum"] == 150, zero)
        ck("...while a real overshoot still scores badly", zero["overshot"] == 25, zero)

        print("\n── 4 · the tables say what they measure ──")
        pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(300)
        pg.click('[data-s="performance"]'); pg.wait_for_timeout(500)
        t = pg.evaluate("""()=>{
          var tabs=[...document.querySelectorAll('table')];
          var hdr=x=>x?[...x.querySelectorAll('thead th')].map(h=>h.textContent.trim()):null;
          var mt=tabs.find(x=>/Annual target/.test(x.textContent));
          /* §248 RENAMED "YTD delivery" TO "YTD actual", and both tables on
             this page now end in it -- so a search for a status word finds the
             wrong table or none at all (§51.11). The tactics table is the one
             whose head says Tactic: what it IS, rather than what one of its
             columns currently happens to be called. */
          var tt=tabs.find(x=>hdr(x) && hdr(x).indexOf('Tactic')>-1);
          return {m:hdr(mt), t:hdr(tt),
                  mCells:[...mt.querySelectorAll('tbody tr')].map(r=>r.querySelectorAll('td').length),
                  pairs:[...document.querySelectorAll('.pair i')].length};
        }""")
        ck("the measures table names the annual target and the YTD actual",
           t["m"] == ["#","Measure","Dir.","Annual target","Compile","YTD actual","Progress"], t["m"])
        ck("...and every row still fills it", set(t["mCells"]) == {7}, t["mCells"])
        # §248 gave this table an Outcome column and renamed its figure to match
        # the measures table above it -- "delivery" is wrong for a row measured
        # in stores. §239's own point survives: no Variance, and it ends in
        # Progress.
        ck("the tactics table drops Variance and ends in Progress",
           t["t"] == ["#","Tactic","Outcome","Owner","Collabs.","Quarters",
                      "Status","YTD actual","Progress"], t["t"])
        ck("the benchmark is drawn beside the figure, not in a column of its own",
           t["pairs"] > 0, t["pairs"])

        print("\n── 5 · the reporter's note reaches Performance ──")
        n = pg.evaluate("""()=>{
          var p=UNITS.mobile.items[0], m=p.measures[0], t=p.tactics[0];
          var km=m.note, kt=t.note;
          m.note="MEASURE-NOTE-HERE"; t.note="TACTIC-NOTE-HERE"; paint();
          var el=document.querySelector('#panel')||document.body;
          var out={m:/MEASURE-NOTE-HERE/.test(el.textContent), t:/TACTIC-NOTE-HERE/.test(el.textContent),
                   cols:[...document.querySelectorAll('table')]
                     .filter(x=>/Annual target/.test(x.textContent))
                     .map(x=>x.querySelectorAll('thead th').length)};
          m.note=km; t.note=kt; paint();
          return out;
        }""")
        ck("a measure's note shows", n["m"], n)
        ck("a tactic's note shows", n["t"], n)
        # UNDER THE NAME, NOT IN A NEW COLUMN -- these tables are already cut
        # off on a narrow pane (§158), so the note must cost no width.
        ck("...and neither adds a column", n["cols"] == [7], n["cols"])

        print("\n── 6 · the reporting screen ──")
        pg.click('[data-s="report"]'); pg.wait_for_timeout(600)
        rep = pg.evaluate("""()=>[...document.querySelectorAll('table')]
          .map(x=>[...x.querySelectorAll('thead th')].map(h=>h.textContent.trim()))
          .filter(h=>h.indexOf('Tactic')>-1)[0]""")
        ck("the tactic's benchmark is called YTD Target",
           rep and "YTD Target" in rep and "Due at" not in rep, rep)

        print("\n── 7 · the deck agrees with the page ──")
        pg.click('[data-s="performance"]'); pg.wait_for_timeout(400)
        pg.evaluate("""()=>{[...document.querySelectorAll('details')].forEach(d=>{
            var s=d.querySelector('summary'); if(s&&/Presentation/.test(s.textContent)) d.open=true;});}""")
        pg.wait_for_timeout(200)
        pg.click('[data-present]'); pg.wait_for_timeout(1600)
        d = pg.evaluate("""()=>{
          var bad=[];
          document.querySelectorAll('.dslide table').forEach(function(t){
            var n=t.querySelectorAll('thead th').length;
            [...t.querySelectorAll('tbody tr')].forEach(function(r){
              var c=0; r.querySelectorAll('td,th').forEach(function(x){ c+=(x.colSpan||1); });
              if (c!==n) bad.push({head:n, row:c});
            });
          });
          var heads=[...document.querySelectorAll('.dslide th')].map(h=>h.textContent.trim());
          return {slides:document.querySelectorAll('.dslide').length, bad:bad, heads:heads};
        }""")
        # PROVED TO HAVE SOMETHING TO LOOK AT FIRST: an assertion about absence
        # passes perfectly on an empty deck (§113.8).
        ck("the deck opened and has tables to check",
           d["slides"] > 10 and len(d["heads"]) > 20, (d["slides"], len(d["heads"])))
        ck("no deck row misses its own header count", not d["bad"], d["bad"][:3])
        ck("Direction is off every slide", "Dir." not in d["heads"],
           sorted(set(d["heads"]))[:14])
        ck("...and Compile was never on one", "Compile" not in d["heads"])
        pg.keyboard.press("Escape"); pg.wait_for_timeout(400)

        print("\n── 8 · the office sets the review point, and every score follows ──")
        pg.evaluate("()=>{current='setup'; currentSub='cycle'; paint();}")
        pg.wait_for_timeout(500)
        # §273 MOVED THE CONTROL AND NOT THE PROMISE. Islam: "keep the close
        # cycle inside the edit ... the pen should hold everything editable so
        # it's kept secured" — so the strip is a line you read and the picker
        # lives inside the pen with the name and the dates. These assertions
        # are REWRITTEN rather than deleted (§218): what §239 is about is that
        # the office can move the review point and every figure follows, and
        # that is asserted here exactly as before, through the door it now has.
        ck("the strip carries no control of its own any more (§273)",
           pg.evaluate("!document.querySelector('.fstrip-meta.asof .monthbtn')"))
        ck("...it carries the pen that holds one",
           pg.evaluate("!!document.querySelector('[data-editcycle]')"))
        before = pg.evaluate("()=>measureScore(GROUP.keyObjectives[0])")
        pg.click("[data-editcycle]"); pg.wait_for_timeout(400)
        # §298: THE REVIEW POINT IS THE CYCLE'S END, so the control pressed is
        # the `to` picker and not "the month button in the pen" — which is now
        # the FIRST of three and is Covers from. A selector that keeps working
        # while pointing at the wrong control is §51.11's own fault, and it
        # would have measured a build that never moved the review point at all.
        pg.click(".newcycle .tobtn"); pg.wait_for_timeout(300)
        ck("...which opens the platform's own month picker",
           pg.evaluate("!!document.querySelector('.monthpop [data-mpick]')"))
        pg.evaluate("""()=>{const b=[...document.querySelectorAll('.monthpop [data-mpick]')]
            .find(x=>x.textContent.trim()==='Aug'); if(b)b.click();}""")
        pg.wait_for_timeout(400)
        # REWRITTEN, NOT DELETED (§218). This asserted the opposite until
        # §273.4: §273 held the pick in a DRAFT until Save, and Islam took the
        # draft away — every field in the pen is bound and writes where every
        # other field in SMP writes, so the pick IS the cycle's on the press.
        # Asserted rather than dropped, because a build that quietly went back
        # to holding it would otherwise pass everything below.
        ck("the pick reaches the cycle on the press, with no Save to make",
           pg.evaluate("()=>REVIEW.to === 'Aug 2026'"),
           pg.evaluate("()=>REVIEW.to"))
        after = pg.evaluate("""()=>({stored:REVIEW.to||null, months:elapsedMonths(),
                                     rev:measureScore(GROUP.keyObjectives[0])})""")
        ck("the pick reaches the stored cycle", after["stored"] == "Aug 2026", after)
        ck("...eight months of twelve", after["months"] == 8, after)
        ck("...and the figures move with it, 87% against half a year to 65% against two thirds",
           before == 87 and after["rev"] == 65, (before, after["rev"]))
        # A CLEARED VALUE IS A DELETED KEY (§50.6), or an untouched cycle and one
        # set and cleared would differ and put a phantom change into every save.
        # EDIT IS A TOGGLE (§273.4), so it is pressed only if the pen is shut —
        # pressing it blind here closed the pen this section is standing in.
        if not pg.query_selector(".newcycle"):
            pg.click("[data-editcycle]"); pg.wait_for_timeout(400)
        pg.click(".newcycle .tobtn"); pg.wait_for_timeout(300)
        pg.evaluate("""()=>{var b=document.querySelector('.monthpop [data-mclear]'); if(b)b.click();}""")
        pg.wait_for_timeout(400)
        # REWRITTEN, NOT DELETED (§218, §298). This asserted that clearing the
        # month DELETED its key, which was right while the review point was a
        # field of its own riding `extra`: an absent key and an empty one had to
        # be byte-identical or every save carried a phantom change. `to` is a
        # real column and cannot be absent, so the question changes to the one
        # that now matters and is far more dangerous: with no end month, does
        # the platform quietly go back to measuring against a WHOLE YEAR?
        # It does not — the cycle's name is the fallback `cycleMonth()` has
        # always kept — and this is the assertion that says so.
        cleared = pg.evaluate("""()=>({to:REVIEW.to, months:elapsedMonths()})""")
        ck("clearing the end empties the box rather than storing a month nobody picked",
           cleared["to"] == "", cleared)
        ck("...and the year does NOT silently become whole — the name is the fallback",
           cleared["months"] == 6, cleared)
        pg.click(".newcycle .tobtn"); pg.wait_for_timeout(300)
        pg.evaluate("""()=>{const b=[...document.querySelectorAll('.monthpop [data-mpick]')]
            .find(x=>x.textContent.trim()==='Jun'); if(b)b.click();}""")
        pg.wait_for_timeout(400)

        print("\n── 9 · the review point knows its own year (§239.3) ──")
        # THE STATE THE DEMO CANNOT PRODUCE, so it is MADE (§94.2). Islam's own
        # cycle carries no four-digit year in its name or its dates, and
        # `cycleYear()` scrapes one out of exactly those — so it answered null,
        # the elapsed share answered null, and EVERYTHING fell back: measures
        # stopped prorating and every tactic read 100% again, with the month
        # sitting there plainly set. Two fields answering one question, which is
        # the fault §239.1 exists to have removed, committed by its own fix.
        # §298: REWRITTEN, NOT DELETED (§218). §239.3's fault was two fields
        # disagreeing about the YEAR — the review point carried its own and
        # `elapsedMonths()` threw it away and asked `cycleYear()`, which scrapes
        # a four-digit year out of the cycle's `to`, `name` and `due`. With the
        # review point BEING `to`, that particular disagreement is impossible by
        # construction, and asserting it as written would be an assertion that
        # can no longer fail (§113.8).
        #
        # WHAT CAN STILL FAIL IS THE SAME FAULT ONE STEP ALONG, and it is the
        # reason `reviewYear()` was rewritten: a `to` carrying a TWO-DIGIT year
        # is read perfectly by `monthsOf()` and is invisible to `cycleYear()`'s
        # four-digit regex. If anything on the measuring path went back to
        # asking `cycleYear()`, such a cycle would stop prorating entirely and
        # every tactic would read 100% again — §239.3 exactly, with the field
        # this section made load-bearing.
        shapes = pg.evaluate("""()=>{
          var keep = {name:REVIEW.name, from:REVIEW.from, to:REVIEW.to, due:REVIEW.due};
          var out = {};
          var probe = function(rv){
            Object.keys(rv).forEach(function(k){ REVIEW[k] = rv[k]; });
            return { year: cycleYear(), months: elapsedMonths(),
                     tactic: tacticPlanned(UNITS.mobile.items[0].tactics[0]),
                     rev: measureScore(GROUP.keyObjectives[0]) };
          };
          out.withYear = probe({name:"2026", from:"Jan 2026", to:"Aug 2026", due:"15 Jan 2027"});
          out.noYear   = probe({name:"Annual Plan", from:"Jan", to:"Aug 26", due:""});
          Object.keys(keep).forEach(function(k){ REVIEW[k] = keep[k]; });
          paint();
          return out;
        }""")
        w, n = shapes["withYear"], shapes["noYear"]
        ck("a cycle whose end carries a four-digit year prorates", w["months"] == 8 and w["tactic"] == 83, w)
        ck("...and the four-digit scrape really is blind to the other one", n["year"] is None, n)
        # ASSERTED AS THE AGREEMENT, never as a number: the two shapes must
        # answer identically, because the month is the same month.
        ck("a cycle whose end carries a two-digit year answers exactly the same",
           n == dict(w, year=None), (w, n))

        print("\n── 10 · the strip says what the month MEANS ──")
        # Islam could not tell whether the month he picked had taken effect.
        # The consequence is on the page now, so a review point that is not
        # working says so rather than being inferred from a table reading 100%.
        pg.evaluate("()=>{current='setup'; currentSub='cycle'; paint();}")
        pg.wait_for_timeout(300)
        said = pg.evaluate("""()=>{
          var read = function(){ var e=document.querySelector('.fstrip-meta.asof');
            return e ? e.textContent.replace(/\\s+/g,' ').trim() : null; };
          var keep = REVIEW.to;
          REVIEW.to = ""; paint(); var unset = read();
          REVIEW.to = "Aug 2026"; paint(); var set = read();
          REVIEW.to = keep;
          paint();
          return {unset:unset, set:set};
        }""")
        ck("with a month picked it says how much of the year has passed",
           "8 of 12 months" in said["set"], said["set"])
        # §298: and it still names WHERE the number came from when the cycle's
        # own end cannot be read — the fallback is the name now, and a strip
        # that printed a derived month as a chosen one would be a guess drawn
        # as a fact (§35).
        ck("...and with no end month it says so, and where the number came from",
           "6 of 12 months" in said["unset"] and "name" in said["unset"], said["unset"])
        # AND IT NEVER PRINTS "Missing" over something that is not owed
        # (§177, §214.4): with no month picked the platform still has an answer.
        ck("...without crying Missing over a working fallback",
           "Missing" not in said["unset"], said["unset"])

        print("\n── 9 · nothing threw ──")
        ck("no page errors at any point", not errs, errs[:3])
        b.close()

    print("\nytd-proration: " + ("all passed" if not FAILS
                                 else "%d FAILED -> %s" % (len(FAILS), FAILS)))
    sys.exit(1 if FAILS else 0)

main()
