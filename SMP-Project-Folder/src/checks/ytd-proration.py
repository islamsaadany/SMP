#!/usr/bin/env python3
"""§235 — YTD figures are measured against the part of the year that has passed.

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
    read it and because reward stays a year-end judgement (§235). A build that
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
          pips: [0,1,2,3].map(quarterPast), stored: REVIEW.asOfMonth || null })""")
        ck("an unset review point falls back to the cycle's own quarter end",
           r["stored"] is None and r["lab"] == "Jun 26", r)
        ck("...which is six months of twelve", r["months"] == 6 and r["share"] == 0.5, r)
        # THE AGREEMENT, not the number: the pips and the figures must answer
        # from one place, which is the whole of what §235 repaired.
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

        print("\n── 4 · the tables say what they measure ──")
        pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(300)
        pg.click('[data-s="performance"]'); pg.wait_for_timeout(500)
        t = pg.evaluate("""()=>{
          var tabs=[...document.querySelectorAll('table')];
          var hdr=x=>x?[...x.querySelectorAll('thead th')].map(h=>h.textContent.trim()):null;
          var mt=tabs.find(x=>/Annual target/.test(x.textContent));
          var tt=tabs.find(x=>/YTD delivery/.test(x.textContent));
          return {m:hdr(mt), t:hdr(tt),
                  mCells:[...mt.querySelectorAll('tbody tr')].map(r=>r.querySelectorAll('td').length),
                  pairs:[...document.querySelectorAll('.pair i')].length};
        }""")
        ck("the measures table names the annual target and the YTD actual",
           t["m"] == ["#","Measure","Dir.","Annual target","Compile","YTD actual","Progress"], t["m"])
        ck("...and every row still fills it", set(t["mCells"]) == {7}, t["mCells"])
        ck("the tactics table drops Variance and ends in Progress",
           t["t"] == ["#","Tactic","Owner","Collabs.","Quarters","Status","YTD delivery","Progress"], t["t"])
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
        ck("the cycle strip carries the control",
           pg.evaluate("!!document.querySelector('.fstrip-meta.asof .monthbtn')"))
        before = pg.evaluate("()=>measureScore(GROUP.keyObjectives[0])")
        pg.click(".fstrip-meta.asof .monthbtn"); pg.wait_for_timeout(300)
        ck("...which opens the platform's own month picker",
           pg.evaluate("!!document.querySelector('.monthpop [data-mpick]')"))
        pg.evaluate("""()=>{const b=[...document.querySelectorAll('.monthpop [data-mpick]')]
            .find(x=>x.textContent.trim()==='Aug'); if(b)b.click();}""")
        pg.wait_for_timeout(500)
        after = pg.evaluate("""()=>({stored:REVIEW.asOfMonth||null, months:elapsedMonths(),
                                     rev:measureScore(GROUP.keyObjectives[0])})""")
        ck("the pick reaches the stored cycle", after["stored"] == "Aug 26", after)
        ck("...eight months of twelve", after["months"] == 8, after)
        ck("...and the figures move with it, 87% against half a year to 65% against two thirds",
           before == 87 and after["rev"] == 65, (before, after["rev"]))
        # A CLEARED VALUE IS A DELETED KEY (§50.6), or an untouched cycle and one
        # set and cleared would differ and put a phantom change into every save.
        pg.click(".fstrip-meta.asof .monthbtn"); pg.wait_for_timeout(300)
        pg.evaluate("""()=>{var b=document.querySelector('.monthpop [data-mclear]'); if(b)b.click();}""")
        pg.wait_for_timeout(400)
        ck("clearing it deletes the key rather than storing an empty one",
           pg.evaluate("()=>!('asOfMonth' in REVIEW)"),
           pg.evaluate("()=>REVIEW.asOfMonth"))

        print("\n── 9 · nothing threw ──")
        ck("no page errors at any point", not errs, errs[:3])
        b.close()

    print("\nytd-proration: " + ("all passed" if not FAILS
                                 else "%d FAILED -> %s" % (len(FAILS), FAILS)))
    sys.exit(1 if FAILS else 0)

main()
