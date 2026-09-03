"""§255 — a reported note is named as one.

   Islam, from his own Performance page: *"the perofmrance is showing hte
   notes under the tactic name. what is this issue?"*, and then the
   correction that fixed the scope: *"notes is not in the desciption, notes
   is something relevant to the reporting and appears in performance as a
   separate element. so it needs to be there so we can't drop."*

   THE CLAIM THIS FILE HOLDS IS NOT THAT A CLASS IS PRESENT. It is that the
   two greys in that cell can be told apart, that the one which is named is
   the REPORTED one, and — the promise made when he chose this over a column
   of its own — that it costs the table no width at any width the table fits
   today.

   THE STATE HAS TO BE MADE (§94.2). Not one tactic in the shipped plan
   carries a note, so every assertion below would pass on a build that had
   lost the feature entirely: there would be nothing to look at either way.
   That is also why nobody caught this here — it is visible only on a tenant
   that has reported."""
import os, re, pathlib, sys
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent / "strategy-management-platform.html"
SWEEP = HERE.parents[2] / "scripts/contrast-sweep.py"
CHROME = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

FAILS = []
def ck(msg, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + msg + ("" if cond else "   " + str(detail)))
    if not cond: FAILS.append(msg)

# Islam's own two rows, and a third carrying NO note — the state §61 is about:
# a row with nothing reported must draw no key at all, and a check made only
# of rows that HAVE notes cannot see a build that labels everything.
ROWS = [
  {"name": "Build Unified Dashboard",
   "description": "Dashboards covering sales, stock, margin, availability and display",
   "note": "Successfully built an offline Power BI dashboard covering sales, stock, "
           "margin, availability, and display, the next action will be enabling "
           "automated data refresh through the Transformation team."},
  {"name": "Build Automated Ordering System",
   "description": "Have a fully automated ordering system for replenishment and forecasting",
   "note": "In cooperation with Mostafa Shaarawy we engaged with Relex, Robusta, CDT "
           "and UP to create the tool. The proposals came in above budget."},
  {"name": "Nothing reported here yet",
   "description": "A tactic carrying a description and no note at all",
   "note": ""},
]

SEED = """(rows)=>{
  var p = UNITS.mobile.items[0];
  var bt = JSON.parse(JSON.stringify(p.tactics[0]));
  p.tactics = rows.map(function(r){
    var t = JSON.parse(JSON.stringify(bt));
    t.name = r.name; t.description = r.description;
    if (r.note) t.note = r.note; else delete t.note;
    return t; });
  /* THE MEASURE SIDE STACKS THE SAME TWO GREYS the moment a row carries a
     horizon as well as a note — nought in the demo, so it is made here or it
     goes unmeasured on the table directly above the one he reported. */
  var bm = JSON.parse(JSON.stringify(p.measures[0]));
  var m1 = JSON.parse(JSON.stringify(bm)), m2 = JSON.parse(JSON.stringify(bm));
  m1.name = "Reported measure"; m1.horizon = "Q4 2026";
  m1.note = "Held back by the data refresh; expected to close in Q4.";
  m2.name = "Unreported measure"; m2.horizon = "Q4 2026"; delete m2.note;
  p.measures = [m1, m2];
  paint();
  return { tactics: p.tactics.length, measures: p.measures.length }; }"""

# Both tables are read the same way, so the check cannot describe one of them
# in terms the other does not have (§53.5): find the table by a column it
# owns, then read every name cell as {name, greys, keyed}.
READ = """(colName)=>{
  var t = null;
  document.querySelectorAll('table').forEach(function(x){
    if (t) return;
    var h = x.querySelector('thead tr'); if (!h) return;
    var n = Array.from(h.children).map(function(c){ return c.textContent.trim(); });
    if (n.indexOf(colName) > -1 && n.indexOf('Progress') > -1) t = x; });
  if (!t) return null;
  var box = t.closest('.scroll') || t.parentElement;
  return {
    over: Math.round(t.scrollWidth - box.clientWidth),
    nameCol: Math.round(t.querySelector('thead tr').children[1].getBoundingClientRect().width),
    rows: Array.from(t.querySelectorAll('tbody tr')).map(function(tr){
      var cell = tr.children[1];
      if (!cell) return null;
      var note = cell.querySelector('.repnote');
      var key  = cell.querySelector('.repnote .repkey');
      return {
        name: (cell.querySelector('b') || cell).firstChild
                ? (cell.querySelector('b') ? cell.querySelector('b').textContent.trim()
                                           : cell.firstChild.textContent.trim()) : '',
        plainGreys: cell.querySelectorAll('.why').length,
        hasNote: !!note,
        key: key ? key.textContent.trim() : null,
        /* the note's own text WITHOUT the key, so a build that leaked the
           key into the stored value fails rather than reading fine */
        noteText: note ? note.textContent.replace(/^Reported/, '').trim() : null,
        keyDrawn: key ? Math.round(key.getBoundingClientRect().width) : 0,
        indent: note ? Math.round(note.getBoundingClientRect().left -
                                  cell.getBoundingClientRect().left) : 0 };
    }).filter(Boolean) }; }"""

def open_perf(pg):
    pg.goto("file://" + str(SRC)); pg.wait_for_timeout(1300)
    pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")
    pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(500)
    pg.click('#subtabs button[data-s="performance"]'); pg.wait_for_timeout(800)
    made = pg.evaluate(SEED, ROWS); pg.wait_for_timeout(500)
    return made

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--allow-file-access-from-files"])
    pg = b.new_page(viewport={"width": 1600, "height": 1200})
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.done','1')}catch(e){}")

    print("\n1 · the note is named, and the description is not")
    made = open_perf(pg)
    ck("the state was made — three tactics, two measures",
       made == {"tactics": 3, "measures": 2}, made)

    tac = pg.evaluate(READ, "Tactic")
    ck("the tactics table is on the page", tac and len(tac["rows"]) == 3, tac and len(tac["rows"]))
    reported = [r for r in tac["rows"] if r["hasNote"]]
    quiet = [r for r in tac["rows"] if not r["hasNote"]]
    ck("the two reported rows carry a named note, the third carries none",
       len(reported) == 2 and len(quiet) == 1, [len(reported), len(quiet)])
    ck("the key reads Reported on both", [r["key"] for r in reported] == ["Reported"] * 2,
       [r["key"] for r in reported])
    # THE HALF THAT MATTERS: the description must stay a PLAIN grey. A build
    # that named both would satisfy "the note is named" perfectly and close
    # nothing at all — the two would still be indistinguishable.
    ck("every row still has exactly one plain grey — the description",
       [r["plainGreys"] for r in tac["rows"]] == [1, 1, 1],
       [r["plainGreys"] for r in tac["rows"]])
    ck("the row with nothing reported draws no key (§61)",
       quiet and quiet[0]["key"] is None and quiet[0]["plainGreys"] == 1, quiet)
    # ── `all([])` IS TRUE, AND THAT IS §113.8 (found by falsifying this file:
    #    on the pre-§255 build these three went GREEN over an empty list —
    #    an assertion preserved by the thing it measures VANISHING). Each one
    #    now requires the two rows to be there before it says anything.
    # A LABEL THAT IS IN THE MARKUP AND NOT ON THE SCREEN IS NOT A LABEL
    # (§70, §185): ask for its box, not for its text.
    ck("the key is DRAWN, not merely present",
       len(reported) == 2 and all(r["keyDrawn"] > 20 for r in reported),
       [r["keyDrawn"] for r in reported])
    ck("the note is set apart sideways from the description",
       len(reported) == 2 and all(r["indent"] >= 8 for r in reported),
       [r["indent"] for r in reported])
    ck("the key never leaks into the note's own words",
       len(reported) == 2 and
       all((r["noteText"] or "").startswith(("Successfully", "In cooperation"))
           for r in reported),
       [(r["noteText"] or "")[:24] for r in reported])
    ck("no page error", not errs, errs[:2])

    print("\n2 · the key measures table answers the same way (§53.5)")
    mea = pg.evaluate(READ, "Measure")
    ck("the key measures table is on the page", mea and len(mea["rows"]) == 2,
       mea and len(mea["rows"]))
    # ASSERTED AS AGREEMENT, NEVER AS A LITERAL (§94.8): a deliberate change
    # to the wording later moves both tables and stays green; a change to one
    # of them does not. The two tables sit on one screen — a note named in the
    # lower one and unnamed in the upper one is the drift §226 cost a day.
    mrep = [r for r in mea["rows"] if r["hasNote"]]
    ck("a reported measure carries a named note",
       len(mrep) == 1 and mrep[0]["key"] is not None, mea["rows"])
    # NEVER INDEX INTO A LIST THE BUILD UNDER TEST DECIDES THE LENGTH OF
    # (§215): the first version wrote `reported[0]["key"]` and DIED here on
    # the pre-§255 build — so the run reported four failures where there are
    # eight, and a suite counting FAIL lines would have undercounted a
    # thoroughly broken build.
    mkey = mrep[0]["key"] if mrep else None
    tkey = reported[0]["key"] if reported else None
    ck("both tables use the same word for it",
       mkey is not None and mkey == tkey, [mkey, tkey])
    ck("a measure's horizon stays a plain grey beside it",
       bool(mrep) and mrep[0]["plainGreys"] == 1, mrep and mrep[0]["plainGreys"])
    mquiet = [r for r in mea["rows"] if not r["hasNote"]]
    ck("the unreported measure draws no key",
       len(mquiet) == 1 and mquiet[0]["key"] is None, mea["rows"])

    print("\n3 · it costs the table no width (the promise he chose on)")
    # THE PROMISE, NOT A PIXEL COUNT. Option 3 was refused because it started
    # cutting the table off at 1280; this asserts the thing that was claimed
    # in its place, at the widths that fit before the change.
    for w in (1920, 1600, 1440, 1280):
        pg.set_viewport_size({"width": w, "height": 1200}); pg.wait_for_timeout(420)
        t = pg.evaluate(READ, "Tactic")
        ck("%dpx — the tactics table still fits its pane" % w, t["over"] <= 0,
           "%+dpx over" % t["over"])
    pg.set_viewport_size({"width": 1600, "height": 1200}); pg.wait_for_timeout(400)

    print("\n4 · the key is readable, in both themes")
    if not SWEEP.exists():
        ck("the sweep's own measurement was found", False, SWEEP)
    else:
        m = re.search(r'JS = r"""(.*?)"""', SWEEP.read_text(), re.S)
        # READ OUT OF THE SWEEP, NEVER COPIED (§95): a second contrast
        # function is a second definition of "readable" (§53.5).
        ck("the sweep's own measurement was read", bool(m), SWEEP)
        if m:
            for theme in ("light", "dark"):
                pg.evaluate("(t)=>document.documentElement.setAttribute('data-theme',t)", theme)
                pg.wait_for_timeout(350)
                # The sweep walks whole pages rather than exposing a per-node
                # call, so the ratio is taken the way it takes it: read the
                # computed ink and the ground behind it and compare. The
                # transparency test is on the ALPHA, never on the spelling of
                # 'rgba(0, 0, 0, 0)' — §108's own false alarm, where a string
                # comparison measured everything against black.
                r = pg.evaluate("""()=>{
                  function lum(c){
                    var p = c.match(/[\\d.]+/g).slice(0,3).map(function(v){
                      v = v/255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
                    return .2126*p[0] + .7152*p[1] + .0722*p[2]; }
                  function ground(el){
                    for (var n = el; n; n = n.parentElement) {
                      var bg = getComputedStyle(n).backgroundColor;
                      if (bg && !/rgba\\(\\s*0,\\s*0,\\s*0,\\s*0\\s*\\)/.test(bg) &&
                          !/^rgba\\(.*,\\s*0\\)$/.test(bg)) return bg; }
                    return 'rgb(255,255,255)'; }
                  var el = document.querySelector('.repnote .repkey');
                  if (!el) return null;
                  var a = lum(getComputedStyle(el).color), b = lum(ground(el));
                  var hi = Math.max(a,b), lo = Math.min(a,b);
                  return Math.round(((hi + .05) / (lo + .05)) * 100) / 100; }""")
                ck("%s — the key clears 4.5:1" % theme, r is not None and r >= 4.5, r)
            pg.evaluate("()=>document.documentElement.removeAttribute('data-theme')")

    print("\n5 · a supporting function answers the same way (§53.5)")
    # A UNIT AND A FUNCTION ARE THE SAME PRODUCT, and walking both is not
    # testing both (§53.5): a pillars function draws these two tables through
    # the very same builders, so it gets this for free — which is a claim, and
    # a claim is worth exactly what measuring it is worth. Asserted as
    # AGREEMENT with the unit's own answer, never as a literal, so a later
    # change to the wording moves both and stays green.
    fpg = b.new_page(viewport={"width": 1600, "height": 1200})
    ferrs = []; fpg.on("pageerror", lambda e: ferrs.append(str(e)))
    fpg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                        "localStorage.setItem('smp.tour.done','1')}catch(e){}")
    fpg.goto("file://" + str(SRC)); fpg.wait_for_timeout(1300)
    fpg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")
    sw = fpg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw: sw.click(); fpg.wait_for_timeout(300)
    pill = fpg.evaluate("()=>Object.keys(FUNCTIONS)"
                        ".filter(function(k){return FUNCTIONS[k].format==='pillars';})[0]")
    ck("the demo carries a function that plans in pillars", bool(pill), pill)
    if pill:
        fpg.click('#units [data-u="fn:%s"]' % pill); fpg.wait_for_timeout(600)
        # ITS TABS ARE NOT A UNIT'S (§59): fnperf, never performance. Matched
        # by the NAME the navigation shows, and by its prefix, because that
        # tab wears a status after it (§93.7).
        for k, t in fpg.eval_on_selector_all(
                "#subtabs button", "es=>es.map(e=>[e.dataset.s, e.textContent.trim()])"):
            if t.lower().startswith("performance"):
                fpg.click('#subtabs button[data-s="%s"]' % k); fpg.wait_for_timeout(700)
                break
        made = fpg.evaluate("""(k)=>{
          var p = (FUNCTIONS[k].items || [])[0];
          if (!p || !p.tactics.length || !p.measures.length) return null;
          var t = JSON.parse(JSON.stringify(p.tactics[0]));
          t.name = "Function tactic"; t.description = "The plan's own words";
          t.note = "What the function reported this cycle";
          p.tactics = [t];
          var m = JSON.parse(JSON.stringify(p.measures[0]));
          m.name = "Function measure"; m.horizon = "Q4 2026"; m.note = "A measure note";
          p.measures = [m];
          paint(); return true; }""", pill)
        ck("the function's state was made", made is True, made)
        ftac = fpg.evaluate(READ, "Tactic")
        frep = [r for r in (ftac["rows"] if ftac else []) if r["hasNote"]]
        ck("the function's note is named too",
           len(frep) == 1 and frep[0]["keyDrawn"] > 20, ftac and ftac["rows"])
        ck("and with the SAME word the unit uses",
           bool(frep) and frep[0]["key"] == tkey, [frep and frep[0]["key"], tkey])
        ck("its description is still a single plain grey",
           bool(frep) and frep[0]["plainGreys"] == 1, frep and frep[0]["plainGreys"])
        ck("the function's tactics table still fits its pane",
           ftac and ftac["over"] <= 0, ftac and ftac["over"])
        ck("no page error on the function side", not ferrs, ferrs[:2])
    fpg.close()

    b.close()

print("\n%d failed" % len(FAILS))
for f in FAILS: print("  - " + f)
sys.exit(1 if FAILS else 0)
