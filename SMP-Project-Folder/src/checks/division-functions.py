"""A SUPPORTING FUNCTION BELONGS TO A COMPANY, AND READS BESIDE ITS UNITS (§391, §593).

REWRITTEN TO THE NEW RULE (§218, §593). Islam, on the simplification's final
test: *"in case of business units they get their own score and the functions
get their own score and we see both on the group"*, *"stay equal"*, *"yes same
for divisions"*. So a division no longer blends: its headline is its units'
alone, its functions read in a row of their own, each counted equally, and
there is no function weight on Setup. The group draws the same row. What
follows is the original §391 rationale, kept for the record.


Islam: *"I have a case for functions that belong to divisions and we will need
to see the performance in division view."* Settled in four answers and a
mockup drawn out of the running page: a division IS a company; a function
belongs to the group or to exactly one; it COUNTS in that company's score
("some divisions are only functions"); its weight is set on Setup (his A) — a
blank takes the average of the weights set, and with none set each function
counts as one equal member; execution counts it too ("execution is part of
the function why not?"); its CEO sees it and does not report on it.

What is asserted, and why each end matters (§94.2):

  - A COMPANY WITH NO FUNCTIONS IS BYTE-FOR-BYTE WHAT IT WAS. Asserted as
    AGREEMENT with the §68 formula (weightedOver) rather than as a number,
    and FIRST, before anything is placed — a build that rewired every company
    through the new mix would move every existing figure and pass everything
    about functions below (§113.8).
  - THE SHARES: sum to 100; a set weight is used as given; a blank takes the
    AVERAGE of the ones set; with none set each function is one equal member;
    the units keep their relative sizes. Each asserted against arithmetic this
    file does for itself (§94.8).
  - THE HEADLINE IS THE WEIGHTED SUM OF WHAT EACH MEMBER'S OWN PAGE SHOWS, and
    a function's card prints the same figure its own page does (§53.5).
  - A COMPANY OF FUNCTIONS ALONE is reachable and scored — `companiesReachable`
    asked for units, so it would otherwise be a company nobody can open (§61).
  - SETUP WRITES: the dialog's two controls PRESSED and the stored function
    read back (§96); moving a function drops its weight; a total over the
    whole is REFUSED and said, with nothing stored (§62).
  - RETIRING a company still holding a function is refused BY NAME.

THE STATE IS MADE (§255): no function belongs to a company in the demo.
Every probe degrades (§215). SMP_BUILT points it at another build (§276).
"""
import os, sys
from playwright.sync_api import sync_playwright

BUILT = os.environ.get("SMP_BUILT") or os.path.join(
    os.path.dirname(__file__), "..", "strategy-management-platform.html")
URL = "file://" + os.path.abspath(BUILT)

good = bad = 0
def ck(w, ok, x=""):
    global good, bad
    if ok: good += 1; print("  ok   " + w)
    else:  bad += 1;  print("  FAIL " + w + ("  -> " + str(x) if x != "" else ""))

def js(pg, expr, default=None):
    try: return pg.evaluate(expr)
    except Exception as e:
        print("  (probe died: " + str(e).splitlines()[0][:160] + ")")
        return default

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("SMP_CHROME") or None,
                          args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.tour.later','1');"
                       "sessionStorage.setItem('smp.welcome.done','1');"
                       "localStorage.setItem('smp.tour.done','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(800)

    have = js(pg, "typeof fnsReading === 'function' && typeof companyFnKeys === 'function'", False)
    ck("the division readers exist", have)
    ck("the blended mix is gone (§593)", js(pg, "typeof companyShares === 'undefined' && typeof companyMix === 'undefined'", False))

    print("\n§1  a division's own figures are its units', with or without functions")
    for ck_ in ("distribution", "b2c"):
        r = js(pg, """(function(c){ var k=companyUnitKeys(c);
          return [companyObjectives(c), weightedOver(k, unitObjectives),
                  companyRatio(c), weightedOver(k, unitRatio)]; })('%s')""" % ck_, [0,1,0,1])
        ck(ck_ + ": performance agrees with the §68 formula", r[0] == r[1], r)
        ck(ck_ + ": execution agrees with the §515.2 formula", r[2] == r[3], r)
    js(pg, "FUNCTIONS.finance.company='distribution'; FUNCTIONS.finance.coWeight=20;"
           "FUNCTIONS.it.company='distribution'; delete FUNCTIONS.it.coWeight;")
    r = js(pg, """(function(c){ var k=companyUnitKeys(c);
      return [companyObjectives(c), weightedOver(k, unitObjectives), companyRatio(c), weightedOver(k, unitRatio)]; })('distribution')""", [0,1,0,1])
    ck("placing functions in it does not move its units' figures", r[0] == r[1] and r[2] == r[3], r)

    print("\n§2  its functions read on their own, each counted equally")
    # computed here, not asked of the reader (§94.8): each function's own figure, averaged
    mine = js(pg, """(function(){ var p=[],e=[]; companyFnKeys('distribution').forEach(function(k){ var s=fnMemberScores(k);
        if(s.perf!=null)p.push(s.perf); if(s.exec!=null)e.push(s.exec); });
        var av=function(a){ return a.length? Math.round(a.reduce(function(x,y){return x+y},0)/a.length): null; };
        return [av(p), av(e), fnsReading(companyFnKeys('distribution')).perf, fnsReading(companyFnKeys('distribution')).exec]; })()""", [0,0,1,1])
    ck("functions' performance is the plain average of what each function shows", mine[0] == mine[2], mine)
    ck("functions' execution likewise", mine[1] == mine[3], mine)
    ck("a weight left from §391 changes nothing", js(pg, "(function(){ var a=fnsReading(['finance','it']).perf; FUNCTIONS.finance.coWeight=90; var b=fnsReading(['finance','it']).perf; return a===b; })()", False))

    print("\n§3  the division page draws both, apart")
    js(pg, "current='co:distribution'; paint()"); pg.wait_for_timeout(300)
    heads = js(pg, "[...document.querySelectorAll('#panel h2')].map(function(h){return h.textContent.trim()})", [])
    fw = js(pg, "labelWord('fnword','bu')", "?")  # §392: the client's word, asked of the page
    ck("a functions section is drawn", any(h.startswith(fw) for h in heads), heads)
    names = js(pg, "[...document.querySelectorAll('#panel .gname')].map(function(n){return n.textContent.trim()})", [])
    ck("both functions have a card", "Finance" in names and "IT" in names, names)
    cards = js(pg, """[...document.querySelectorAll('#panel .scores .card')].map(function(c){ var h=c.querySelector('h4,h3'), b=c.querySelector('.big'); return [h?h.textContent.trim():'', b?b.textContent.trim():''] })""", [])
    want = js(pg, "[companyObjectives('distribution'), fnsReading(companyFnKeys('distribution')).perf]", [None, None])
    uc = [c for c in cards if "Business" in c[0] or js(pg, "L('unitword','bu')", "Business units") in c[0]]
    fc = [c for c in cards if c[0].startswith(fw) and "performance" in c[0].lower()]
    ck("the units' card shows the units' figure", uc and str(want[0]) in uc[0][1], (uc, want))
    ck("the functions' card shows the functions' figure, beside it", fc and str(want[1]) in fc[0][1], (fc, want))

    print("\n§4  the group draws the functions' row too")
    js(pg, "current='group'; currentSub='performance'; paint()"); pg.wait_for_timeout(300)
    g = js(pg, """(function(){ var cs=[...document.querySelectorAll('#panel .scores .card')].map(function(c){ var h=c.querySelector('h4,h3'), b=c.querySelector('.big'); return [h?h.textContent.trim():'', b?b.textContent.trim():''] });
      return {cards:cs, want: fnsReading(boardFunctionKeys()), units: groupUnitsObjectives(), chips:[...document.querySelectorAll('.ustrip [data-go^="fn:"]')].length, fns: boardFunctionKeys().length}; })()""", {})
    gf = [c for c in (g.get("cards") or []) if c[0].startswith(fw) and "performance" in c[0].lower()]
    ck("the group shows the functions' performance on its own card", gf and str((g.get("want") or {}).get("perf")) in gf[0][1], g)
    gu = [c for c in (g.get("cards") or []) if "performance" in c[0].lower() and not c[0].startswith(fw) and "Group" not in c[0]]
    ck("…and the units' card still reads the units alone", gu and str(g.get("units")) in gu[0][1], (gu, g.get("units")))
    ck("…and each function is a place to look next", g.get("chips") and g["chips"] >= 2, g.get("chips"))

    print("\n§5  a company of functions alone")
    js(pg, "FUNCTIONS.care.company='b2c'; FUNCTIONS.marketing.company='b2c';")
    js(pg, "companyUnitKeys('b2c').forEach(function(k){ UNITS[k].__was = UNITS[k].company; UNITS[k].company = null; })")
    ck("it is reachable", js(pg, "companiesReachable().indexOf('b2c') > -1", False))
    js(pg, "current='co:b2c'; paint()"); pg.wait_for_timeout(300)
    txt = js(pg, "document.querySelector('#panel').innerText", "")
    ck("its page draws the functions and no units section", fw in txt and "holds nothing" not in txt and not js(pg, "[...document.querySelectorAll('#panel h2')].some(function(h){return h.textContent.trim().indexOf(L('unitword','bu'))===0})", True))
    js(pg, "UNIT_KEYS.forEach(function(k){ if ('__was' in UNITS[k]) { UNITS[k].company = UNITS[k].__was; delete UNITS[k].__was; } })")

    print("\n§6  Setup: where it belongs, and no weight")
    js(pg, "delete FUNCTIONS.hr.company; delete FUNCTIONS.hr.coWeight; current='setup'; currentSub='fns'; paint()")
    pg.wait_for_timeout(300)
    try:
        pg.click('[data-fnmenu="hr"]'); pg.wait_for_timeout(150)
        pg.click('[data-rowdlg="fns|hr"]'); pg.wait_for_timeout(300)
        ck("the dialog offers no weight any more (§593)", js(pg, "!document.querySelector('[data-fncow]')", False))
        pg.select_option('[data-fnco="hr"]', "distribution"); pg.wait_for_timeout(300)
        ck("choosing a company stores it", js(pg, "FUNCTIONS.hr.company", None) == "distribution")
        js(pg, "FUNCTIONS.hr.coWeight = 15")
        pg.select_option('[data-fnco="hr"]', ""); pg.wait_for_timeout(300)
        r = js(pg, "['company' in FUNCTIONS.hr, 'coWeight' in FUNCTIONS.hr]", [True, True])
        ck("back to the group deletes the company and any old weight", r == [False, False], r)
    except Exception as e:
        ck("the dialog could be driven", False, str(e).splitlines()[0][:160])

    print("\n§7  retiring a company that still holds a function")
    bl = js(pg, "companyRetireBlockers('distribution')", [])
    ck("the function is named in the way", "Finance" in bl, bl)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d passed, %d failed" % (good, bad))
sys.exit(1 if bad else 0)
