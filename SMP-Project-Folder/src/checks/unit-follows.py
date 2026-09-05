#!/usr/bin/env python3
"""§277 — a reported figure follows the target's unit.

Islam, from his Performance page: *"the YTD is showing 2% from 2# I don't know
where this error is happening."* The reporting box collects a bare number and
the platform stamps it with the target's unit at that moment; the office then
changed the target from % to #, and the figure kept its old stamp.

WHAT THIS GUARDS, and why each half needs its own assertion:

  · THE STORY, THROUGH THE REAL CONTROLS, ON BOTH SURFACES (§53.5): a tactic's
    outcome and a key measure, each reported against a % target through the
    Reporting page's own box, each switched to # through the pen's own unit
    picker, and each read back from the DATA and from the Performance page.

  · A PERSON'S OWN UNIT IS NOT REWRITTEN (§243): a figure typed as "2 B EGP"
    against a target in M EGP stays exactly that after the unit changes.

  · THE FIRST UNIT IS NOT A CHANGE (§201.2): a bare figure against a bare
    target is left bare when the target gains its first unit, because that
    is the filler's act and a filler may not write a reported figure.

  · Y/N IS NEITHER SIDE (§257): a figure is untouched when a row becomes
    yes/no, and untouched again when it leaves.

  · A UNIT CLEARED IS NOT A UNIT CHANGED: removing the target's unit leaves
    the figure in the unit it was reported in (found by unit-before-number.py
    going red on the first build).

  · THE SEPARATOR IS THE TARGET'S OWN: a switch to a spaced or a tight unit
    writes the figure the way the target is written.

Run:  SMP_CHROME=… python3 qa-run.py checks/unit-follows.py
"""
import os, sys, pathlib
from playwright.sync_api import sync_playwright

# SMP_BUILT points the check at another build — how it is proved able to fail
# (§94.5) from rebuilt sources, never an edited built file (§238's hashed CSP).
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

        have = pg.evaluate("()=>typeof actualFollowsUnit === 'function'")
        ck("the one follower exists", have)
        if not have:
            print("\nunit-follows: cannot continue without it"); sys.exit(1)

        # THE VIEWER FIRST, THEN THE PLACE (§173, §237): a switch re-lands on
        # the remembered page.
        if pg.evaluate("()=>document.querySelector('#asWho').value") != "smo":
            pg.select_option("#asWho", "smo"); pg.wait_for_timeout(300)
        pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(400)

        # THE STATE IS MADE (§94.2): the demo has no outcome reported in a
        # unit its target has since left. Mobile's first tactic gets an
        # outcome in %, its first measure a % target; both are put back at
        # the end (§113.8).
        pg.evaluate("""()=>{
          window.__keep = JSON.stringify({t: UNITS.mobile.items[0].tactics[0], m: UNITS.mobile.items[0].measures[0], as: REVIEW.asOfMonth || null});
          REVIEW.asOfMonth = "Aug 26";
          var t = UNITS.mobile.items[0].tactics[0];
          t.outcome = "Store program successful application (check)";
          t.outTarget = "3%"; t.outDir = "\\u2265"; t.outCompile = "Sum"; delete t.outActual;
          t.q1 = true; t.q2 = true; t.q3 = true; t.q4 = true;
          var m = UNITS.mobile.items[0].measures[0];
          m.target = "3%"; m.compile = "Sum"; m.actual = "";
          paint();
        }""")

        print("\n── 1 · reported through the Reporting page's own box, in % ──")
        pg.evaluate("()=>document.querySelector('[data-s=\"report\"]').click()"); pg.wait_for_timeout(500)
        rep = pg.evaluate("""()=>{
          var t = UNITS.mobile.items[0].tactics[0], m = UNITS.mobile.items[0].measures[0];
          var bt = document.querySelector('[data-rep="' + t.id + '"][data-fld="outActual"]');
          var bm = document.querySelector('[data-rep="' + m.id + '"][data-fld="actual"]');
          if (!bt || !bm) return {none: true, bt: !!bt, bm: !!bm};
          var suf = e => (e.parentNode.querySelector('.unitsuf') || {}).textContent || "";
          var out = {sufT: suf(bt), sufM: suf(bm)};
          bt.value = "2"; bt.dispatchEvent(new Event('change', {bubbles: true}));
          bm = document.querySelector('[data-rep="' + m.id + '"][data-fld="actual"]');
          bm.value = "2"; bm.dispatchEvent(new Event('change', {bubbles: true}));
          out.outActual = t.outActual; out.actual = m.actual;
          return out;
        }""")
        ck("both boxes carry the % suffix", not rep.get("none") and rep["sufT"] == "%" and rep["sufM"] == "%", rep)
        ck("the platform stamps the typed 2 with % on both rows",
           rep.get("outActual") == "2%" and rep.get("actual") == "2%", rep)

        print("\n── 2 · the office switches the unit to #, through the pen's own pickers ──")
        pg.evaluate("()=>document.querySelector('[data-s=\"strategy\"]').click()"); pg.wait_for_timeout(400)
        pg.evaluate("()=>{var b=document.querySelector('[data-sub2=\"plan\"]'); if(b) b.click();}"); pg.wait_for_timeout(400)
        pen = pg.query_selector('#secrow-in .secpen[data-page="plan"]')
        ck("the plan pen is there", bool(pen))
        if pen:
            pen.click(); pg.wait_for_timeout(500)
        sw = pg.evaluate("""()=>{
          var t = UNITS.mobile.items[0].tactics[0], m = UNITS.mobile.items[0].measures[0];
          /* the unit pickers are the selects whose lists carry "B EGP"; the
             measure's is in the measures table, the outcome's in the tactic's
             four-box block. Found by the row each sits in. */
          var sels = [...document.querySelectorAll('.pane select')].filter(s => [...s.options].some(o => o.value === "B EGP") && !s.disabled);
          var rowOf = s => s.closest('tr');
          var selM = sels.find(s => rowOf(s) && rowOf(s).textContent.indexOf(m.name) > -1);
          var selT = sels.find(s => rowOf(s) && rowOf(s).textContent.indexOf(t.name) > -1);
          if (!selM || !selT) return {none: true, n: sels.length, m: !!selM, t: !!selT};
          selM.value = "#"; selM.dispatchEvent(new Event('change', {bubbles: true}));
          selT = [...document.querySelectorAll('.pane select')].filter(s => [...s.options].some(o => o.value === "B EGP") && !s.disabled)
                   .find(s => rowOf(s) && rowOf(s).textContent.indexOf(t.name) > -1);
          selT.value = "#"; selT.dispatchEvent(new Event('change', {bubbles: true}));
          return {mTarget: m.target, mActual: m.actual, tTarget: t.outTarget, tActual: t.outActual};
        }""")
        ck("both pickers were found and pressed", not sw.get("none"), sw)
        ck("the measure's target is 3# and its figure followed to 2#",
           sw.get("mTarget") == "3#" and sw.get("mActual") == "2#", sw)
        ck("the outcome's target is 3# and its figure followed to 2#",
           sw.get("tTarget") == "3#" and sw.get("tActual") == "2#", sw)

        print("\n── 3 · the Performance page reads the figure in the target's unit ──")
        # A tab change leaves the pen's mode on its own (§63), so the pen is
        # not pressed shut — its button is a different control while open.
        pg.evaluate("()=>document.querySelector('[data-s=\"performance\"]').click()"); pg.wait_for_timeout(500)
        perf = pg.evaluate("""()=>{
          var t = UNITS.mobile.items[0].tactics[0], m = UNITS.mobile.items[0].measures[0];
          var row = n => [...document.querySelectorAll('tr')].find(r => r.textContent.indexOf(n) > -1);
          var pair = r => r ? [...r.querySelectorAll('.pair')].map(x => x.textContent.replace(/\\s+/g, ' ').trim()) : null;
          return {t: pair(row(t.name)), m: pair(row(m.name)),
                  tScore: tacticProgress(t), mScore: measureScore(m)};
        }""")
        ck("the tactic's YTD cell reads 2# against its benchmark, never 2%",
           perf["t"] and perf["t"][0].startswith("2#") and "2%" not in perf["t"][0], perf)
        ck("the measure's YTD cell reads 2# too", perf["m"] and perf["m"][0].startswith("2#") and "2%" not in perf["m"][0], perf)
        ck("the scores are what the figures always were (the arithmetic never read the unit)",
           perf["tScore"] == 100 and perf["mScore"] == 100, perf)

        print("\n── 4 · what must NOT follow ──")
        no = pg.evaluate("""()=>{
          var m = UNITS.mobile.items[0].measures[0], out = {};
          m.target = "3M EGP"; m.actual = "2 B EGP"; setTargetUnit(m, "K USD");
          out.typed = m.actual;
          m.target = "3"; m.actual = "2"; setTargetUnit(m, "%");
          out.first = m.actual;
          m.target = "3%"; m.actual = "2%"; setTargetUnit(m, "Y/N");
          out.toYN = m.actual; setTargetUnit(m, "#"); out.fromYN = m.actual;
          m.target = "3%"; m.actual = ""; setTargetUnit(m, "#"); out.empty = m.actual;
          m.target = "3%"; m.actual = "2%"; setTargetUnit(m, ""); out.cleared = m.actual;
          m.target = "3%"; m.actual = "2%"; setTargetUnit(m, "M EGP"); out.spaced = m.actual;
          m.target = "3%"; m.actual = "2%"; setTargetUnit(m, "EGP"); out.word = m.actual;
          return out;
        }""")
        ck("a figure typed with its own unit is left exactly as typed", no["typed"] == "2 B EGP", no)
        ck("a bare figure is left bare when the target gains its FIRST unit", no["first"] == "2", no)
        ck("becoming yes/no leaves the figure alone, and leaving yes/no does too",
           no["toYN"] == "2%" and no["fromYN"] == "2%", no)
        ck("an empty figure stays empty", no["empty"] == "", no)
        # Found by unit-before-number.py going red: a unit CLEARED is a stamp
        # taken away, not a stamp changed (§50.6's byte-identical row).
        ck("a unit cleared leaves the figure in the unit it was reported in", no["cleared"] == "2%", no)
        ck("the separator is the target's own — tight for M EGP, spaced for EGP",
           no["spaced"] == "2M EGP" and no["word"] == "2 EGP", no)

        print("\n── 5 · put back ──")
        back = pg.evaluate("""()=>{
          var k = JSON.parse(window.__keep);
          var u = UNITS.mobile.items[0];
          u.tactics[0] = k.t; u.measures[0] = k.m;
          if (k.as == null) delete REVIEW.asOfMonth; else REVIEW.asOfMonth = k.as;
          paint();
          return !document.body.textContent.match(/\\(check\\)/);
        }""")
        ck("the made state is gone", back)

        print("\n── 6 · nothing threw ──")
        ck("no page errors at any point", not errs, errs[:3])
        b.close()

    print("\nunit-follows: " + ("all passed" if not FAILS
                                 else "%d FAILED -> %s" % (len(FAILS), FAILS)))
    sys.exit(1 if FAILS else 0)

main()
