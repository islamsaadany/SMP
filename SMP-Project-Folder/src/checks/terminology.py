"""ONE WORD PER THING, IN TWO FORMS (§392).

Islam set every description and default in chat, then chose two boxes per row
over one: a word for ONE ("Project", a column heading) and a word for MANY
("Projects", a page heading, the navigation). There is no longer a group word
and a business-unit word: one word shows at the group, in every business unit
and in every function.

What is asserted, and why each end matters (§94.2):

  - THE THIRTEEN ROWS, in his order, with his descriptions and defaults,
    asserted against the shipped list (LABEL_DEFAULTS) rather than typed out
    a second time here, except the order and count, which are his decision.
  - THE PAGE: two boxes per row, the default beside them, Reset drawn EXACTLY
    where a row differs (both ends — a Reset on every row satisfies "it is
    there"), pressing it puts both words back, and emptying a box does the
    same for that box. Every write read back off LABELS (§96).
  - ONE WORD EVERYWHERE: the aspiration's word for one is the heading on the
    group's Foundation AND a unit's, and it is the SAME word (the old build
    said Vision on one and Winning Aspiration on the other).
  - THE NEW ROWS ARE READ: the division word names the Setup rail entry, the
    page heading and the unit dialog's field; the capability word heads the
    group's cross-cutting capabilities; the supporting-function word heads the
    Functions page.
  - THE NAVIGATION: on the default words the switch keeps its short "Units";
    a client word replaces it.
  - A SHARED WORD SHOUTS, and only then.

THE STATE IS MADE and nothing is left behind (§94.2). Every probe degrades
(§215). SMP_BUILT points it at another build (§276).
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

ORDER = ["theme", "pillar", "capability", "keyobj", "aspiration", "purpose", "values",
         "measure", "tactic", "unitword", "division", "fnword", "project"]

def setup_labels(pg):
    js(pg, "current='setup'; currentSub='labels'; paint()"); pg.wait_for_timeout(250)

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

    have = js(pg, "typeof L1 === 'function' && typeof LABEL_DEFAULTS !== 'undefined'", False)
    ck("the word for one and the shipped defaults exist", have)

    print("\n§1  thirteen rows, in the agreed order")
    keys = js(pg, "LABELS.entries.map(function(e){return e.key})", [])
    ck("the rows are the thirteen, in order", keys == ORDER, keys)
    miss = js(pg, """LABELS.entries.filter(function(e){ return !e.note || !e.group || !e.bu || e.bu==='\\u2014' }).map(function(e){return e.key})""", ["?"])
    ck("every row has a description, a word for one and a word for many", miss == [], miss)
    d = js(pg, "LABEL_DEFAULTS.filter(function(x){return x.key==='division'})[0]", {})
    ck("the division layer defaults to Division / Divisions", d == {"key": "division", "one": "Division", "many": "Divisions"}, d)

    print("\n§2  the page")
    setup_labels(pg)
    rows = js(pg, "document.querySelectorAll('table.lbltable tbody tr').length", 0)
    ck("the page draws one row per word", rows == 13, rows)
    boxes = js(pg, "[...document.querySelectorAll('table.lbltable tbody tr')].map(function(r){return r.querySelectorAll('input.lbl').length})", [])
    ck("each row has two boxes", boxes and all(n == 2 for n in boxes), boxes)
    resets = js(pg, "document.querySelectorAll('[data-lblreset]').length", -1)
    ck("on the defaults no row offers Reset", resets == 0, resets)
    i = ORDER.index("division")
    pg.fill('input.lbl[data-lbl="%d"][data-scope="bu"]' % i, "Sectors")
    pg.press('input.lbl[data-lbl="%d"][data-scope="bu"]' % i, "Tab"); pg.wait_for_timeout(200)
    pg.fill('input.lbl[data-lbl="%d"][data-scope="group"]' % i, "Sector")
    pg.press('input.lbl[data-lbl="%d"][data-scope="group"]' % i, "Tab"); pg.wait_for_timeout(200)
    e = js(pg, "LABELS.entries[%d]" % i, {})
    ck("typing writes both words", e.get("group") == "Sector" and e.get("bu") == "Sectors", e)
    rr = js(pg, "[...document.querySelectorAll('[data-lblreset]')].map(function(b){return +b.dataset.lblreset})", [])
    ck("Reset appears on that row and only that row", rr == [i], rr)

    print("\n§3  the new words are read")
    rail = js(pg, "[...document.querySelectorAll('[data-setupgo]')].map(function(b){return b.textContent.trim()})", [])
    ck("the Setup rail names the division page in the client's word", any("Sectors" in t for t in rail), rail)
    ck("and no longer says Companies", bool(rail) and not any("Companies" in t for t in rail), rail)
    js(pg, "current='setup'; currentSub='companies'; paint()"); pg.wait_for_timeout(250)
    h = js(pg, "(document.querySelector('#panel h1, #panel .setuphead') || {}).textContent || ''", "")
    ck("the page's own heading is the client's word", "Sectors" in h, h)
    th = js(pg, "[...document.querySelectorAll('#panel thead th')].map(function(t){return t.textContent.trim()})", [])
    ck("the table names one of them in the word for one", "Sector" in th, th)
    uhtml = js(pg, "(function(){ current='setup'; currentSub='units'; paint(); return document.querySelector('#panel thead').textContent })()", "")
    ck("the business units table's column says the word for one", "Sector" in uhtml, uhtml[:200])

    js(pg, "LABELS.entries[%d].group='Capacity'; LABELS.entries[%d].bu='Capacities'" % (ORDER.index("capability"), ORDER.index("capability")))
    gf = js(pg, "renderTemple()", "") or ""
    ck("the group's cross-cutting capabilities take the capability word", "Capacities" in gf and "Group capabilities" not in gf, gf[:0])
    js(pg, "LABELS.entries[%d].bu='Enablers'" % ORDER.index("fnword"))
    js(pg, "current='setup'; currentSub='fns'; paint()"); pg.wait_for_timeout(250)
    h = js(pg, "(document.querySelector('#panel .setuphead') || {}).textContent || ''", "")
    ck("the functions page heading is the supporting-function word", "Enablers" in h, h)

    print("\n§4  one word at the group and in a unit")
    js(pg, "LABELS.entries[%d].group='Ambition'" % ORDER.index("aspiration"))
    g = js(pg, "renderGroupFoundation()", "") or ""
    u = js(pg, "renderUnitFoundation(UNITS.mobile)", "") or ""
    ck("the group's Foundation heads the aspiration with the word for one", "Ambition" in g, "")
    ck("a unit's Foundation uses the same word", "Ambition" in u, "")
    ck("and neither says Vision", "Vision" not in g and "Vision" not in u, "")

    print("\n§5  the navigation")
    js(pg, "LABELS.entries=JSON.parse(JSON.stringify(LABEL_DEFAULTS.map(function(d,i){var e=LABELS.entries[i];e.group=d.one;e.bu=d.many;return e})));current='mobile';paint()")
    pg.wait_for_timeout(250)
    nav = js(pg, "[...document.querySelectorAll('[data-fold]')].map(function(b){return b.textContent.trim()})", [])
    ck("on the defaults the switch keeps its short word", any(t == "Units" for t in nav), nav)
    js(pg, "LABELS.entries[%d].bu='Brands'; paint()" % ORDER.index("unitword")); pg.wait_for_timeout(250)
    nav = js(pg, "[...document.querySelectorAll('[data-fold]')].map(function(b){return b.textContent.trim()})", [])
    ck("a client's word replaces it", any(t == "Brands" for t in nav) and not any(t == "Units" for t in nav), nav)

    print("\n§6  Reset, an emptied box, and a shared word")
    setup_labels(pg)
    j = ORDER.index("unitword")
    pg.click('[data-lblreset="%d"]' % j); pg.wait_for_timeout(200)
    e = js(pg, "LABELS.entries[%d]" % j, {})
    ck("Reset puts both words back", e.get("group") == "Business unit" and e.get("bu") == "Business units", e)
    k = ORDER.index("tactic")
    pg.fill('input.lbl[data-lbl="%d"][data-scope="bu"]' % k, "")
    pg.press('input.lbl[data-lbl="%d"][data-scope="bu"]' % k, "Tab"); pg.wait_for_timeout(200)
    ck("an emptied box goes back to the default", js(pg, "LABELS.entries[%d].bu" % k, "") == "Tactics")
    warn0 = js(pg, "!!document.querySelector('#panel .bad-note')", True)
    ck("no warning while every word is its own", not warn0)
    pg.fill('input.lbl[data-lbl="%d"][data-scope="bu"]' % k, "Pillars")
    pg.press('input.lbl[data-lbl="%d"][data-scope="bu"]' % k, "Tab"); pg.wait_for_timeout(200)
    warn1 = js(pg, "(document.querySelector('#panel .bad-note')||{}).textContent||''", "")
    ck("two things sharing a word are named", "Pillars" in warn1, warn1)

    ck("no page errors", not errs, errs[:3])
    b.close()

print("\n%d passed, %d failed" % (good, bad))
sys.exit(1 if bad else 0)
