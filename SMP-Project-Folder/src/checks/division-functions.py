"""A SUPPORTING FUNCTION BELONGS TO A COMPANY, AND COUNTS IN IT (§382).

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

    have = js(pg, "typeof companyShares === 'function' && typeof companyFnKeys === 'function'", False)
    ck("the division readers exist", have)

    print("\n§1  a company with no functions compiles exactly as before")
    for ck_ in ("distribution", "b2c"):
        r = js(pg, """(function(c){ var k=companyUnitKeys(c);
          return [companyObjectives(c), weightedOver(k, unitObjectives),
                  companyRatio(c), ratioOf(weightedOver(k, unitExec), weightedOver(k, unitPlan))]; })('%s')""" % ck_, [0,1,0,1])
        ck(ck_ + ": performance agrees with the §68 formula", r[0] == r[1], r)
        ck(ck_ + ": execution agrees with the §68 formula", r[2] == r[3], r)

    print("\n§2  mixed: one weight set, one blank")
    js(pg, "FUNCTIONS.finance.company='distribution'; FUNCTIONS.finance.coWeight=20;"
           "FUNCTIONS.it.company='distribution'; delete FUNCTIONS.it.coWeight;")
    sh = js(pg, "companyShares('distribution')", [])
    tot = sum(s["w"] for s in sh) if sh else 0
    ck("the shares add to 100", abs(tot - 100) < 1e-6, tot)
    fin = [s for s in sh if s.get("fn") == "finance"]
    it  = [s for s in sh if s.get("fn") == "it"]
    ck("a set weight is used as given", fin and abs(fin[0]["w"] - 20) < 1e-9, fin)
    ck("a blank takes the average of the weights set", it and abs(it[0]["w"] - 20) < 1e-9, it)
    uw = js(pg, "companyUnitKeys('distribution').map(function(k){return [k, UNITS[k].weight]})", [])
    us = {s["unit"]: s["w"] for s in sh if s.get("unit")}
    ok = bool(uw) and len(us) == len(uw) and all(
        abs(us[k] / 60 - w / sum(x[1] for x in uw)) < 1e-9 for k, w in uw)
    ck("the units share what is left by their group weights", ok, (us, uw))
    mine = js(pg, """(function(){ var acc=0,tot=0; companyShares('distribution').forEach(function(s){
        var v = s.unit ? unitObjectives(UNITS[s.unit]) : fnMemberScores(s.fn).perf;
        if (v==null) return; acc+=v*s.w; tot+=s.w; }); return [Math.round(acc/tot), companyObjectives('distribution')]; })()""", [0,1])
    ck("the headline is the weighted sum of what each member shows", mine[0] == mine[1], mine)
    ex = js(pg, """(function(){ var acc=0,tot=0; companyShares('distribution').forEach(function(s){
        var v = s.unit ? unitRatio(UNITS[s.unit]) : fnMemberScores(s.fn).exec;
        if (v==null) return; acc+=v*s.w; tot+=s.w; }); return [Math.round(acc/tot), companyRatio('distribution')]; })()""", [0,1])
    ck("execution counts the functions too, with the same weights", ex[0] == ex[1], ex)

    print("\n§3  mixed: no weight set")
    js(pg, "FUNCTIONS.care.company='b2c'; FUNCTIONS.marketing.company='b2c';")
    sh = js(pg, "companyShares('b2c')", [])
    n = js(pg, "companyUnitKeys('b2c').length + companyFnKeys('b2c').length", 0)
    fw = [s["w"] for s in sh if s.get("fn")]
    ck("each function counts as one equal member", len(fw) == 2 and all(abs(w - 100 / n) < 1e-9 for w in fw), (fw, n))

    print("\n§4  the company page draws its functions")
    js(pg, "current='co:distribution'; paint()"); pg.wait_for_timeout(300)
    heads = js(pg, "[...document.querySelectorAll('#panel h2')].map(function(h){return h.textContent.trim()})", [])
    fw = js(pg, "labelWord('fnword','bu')", "?")  # §383: the client's word, asked of the page
    ck("a Supporting functions section is drawn", any(h.startswith(fw) for h in heads), heads)
    names = js(pg, "[...document.querySelectorAll('#panel .gname')].map(function(n){return n.textContent.trim()})", [])
    ck("both functions have a card", "Finance" in names and "IT" in names, names)
    big = js(pg, "(document.querySelector('#panel .scores .big')||{}).textContent", "")
    want = js(pg, "companyObjectives('distribution')", None)
    ck("the headline card shows the company's figure", big and str(want) in big, (big, want))

    print("\n§5  a company of functions alone")
    js(pg, "companyUnitKeys('b2c').forEach(function(k){ UNITS[k].__was = UNITS[k].company; UNITS[k].company = null; })")
    ck("it is reachable", js(pg, "companiesReachable().indexOf('b2c') > -1", False))
    sh = js(pg, "companyShares('b2c')", [])
    ck("its functions share the whole", sh and abs(sum(s["w"] for s in sh) - 100) < 1e-6 and all(s.get("fn") for s in sh), sh)
    js(pg, "current='co:b2c'; paint()"); pg.wait_for_timeout(300)
    txt = js(pg, "document.querySelector('#panel').innerText", "")
    ck("its page draws the functions and no units section", fw in txt and "holds nothing" not in txt)
    js(pg, "UNIT_KEYS.forEach(function(k){ if ('__was' in UNITS[k]) { UNITS[k].company = UNITS[k].__was; delete UNITS[k].__was; } })")

    print("\n§6  Setup writes through the dialog")
    js(pg, "delete FUNCTIONS.hr.company; delete FUNCTIONS.hr.coWeight; current='setup'; currentSub='fns'; paint()")
    pg.wait_for_timeout(300)
    try:
        pg.click('[data-fnmenu="hr"]'); pg.wait_for_timeout(150)
        pg.click('[data-rowdlg="fns|hr"]'); pg.wait_for_timeout(300)
        pg.select_option('[data-fnco="hr"]', "distribution"); pg.wait_for_timeout(300)
        ck("choosing a company stores it", js(pg, "FUNCTIONS.hr.company", None) == "distribution")
        pg.fill('[data-fncow="hr"]', "90"); pg.locator('[data-fncow="hr"]').blur(); pg.wait_for_timeout(300)
        ck("a total over 100 is refused, nothing stored", js(pg, "FUNCTIONS.hr.coWeight", 0) is None)
        said = js(pg, "(document.querySelector('.modal .missing')||{}).textContent || ''", "")
        ck("and the refusal is said beside the box", "more than the whole" in said, said)
        pg.fill('[data-fncow="hr"]', "15"); pg.locator('[data-fncow="hr"]').blur(); pg.wait_for_timeout(300)
        ck("a weight within the whole is stored", js(pg, "FUNCTIONS.hr.coWeight", None) == 15)
        pg.select_option('[data-fnco="hr"]', ""); pg.wait_for_timeout(300)
        r = js(pg, "['company' in FUNCTIONS.hr, 'coWeight' in FUNCTIONS.hr]", [True, True])
        ck("back to the group deletes both keys", r == [False, False], r)
    except Exception as e:
        ck("the dialog could be driven", False, str(e).splitlines()[0][:160])

    print("\n§7  retiring a company that still holds a function")
    bl = js(pg, "companyRetireBlockers('distribution')", [])
    ck("the function is named in the way", "Finance" in bl, bl)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d passed, %d failed" % (good, bad))
sys.exit(1 if bad else 0)
