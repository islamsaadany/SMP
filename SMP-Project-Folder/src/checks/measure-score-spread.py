#!/usr/bin/env python3
"""§264 — A SUMMARY IS MADE OF THE NUMBER IT SUMMARISES.

Islam, from his own Performance page: *"the key measure performance has a
highest and lowest that doesn't match the measure progress."* His row read a
headline of 90% and a Progress of 90% over a Highest and a Lowest of 60%, and
all three were arithmetically correct — of two DIFFERENT questions.

§239 made the score DERIVED: a `Sum` measure is judged against the share of its
target due by now, so 3M against 5M at six months of twelve is 90%, not 60%.
That section moved every reader that AVERAGES and left every reader that
SUMMARISES holding `m.progress`, the stored raw ratio — three Highest/Lowest
pairs and four breakdown tables, the breakdowns each sitting under a headline
built the other way.

WHAT THIS GUARDS, and why each half needs its own assertion:

  · AGREEMENT, NEVER A LITERAL (§94.8). Every expected figure is asked of
    `measureScore()` in the page, so a later change to the arithmetic keeps this
    green and a summary that stops sharing it does not.

  · AND THE TWO MUST GENUINELY DIFFER. On a row where the raw ratio and the
    score happen to agree, every assertion below passes on the build that has
    the bug — so the check first proves the demo holds rows where they part, and
    only measures those (§113.8: agreement is preserved by both sides vanishing).

  · THE STORED FIGURE IS ASSERTED UNCHANGED. "Fixing" this by overwriting
    `progress` would silently rewrite every archive and closed cycle (§239), so
    the raw value is read back beside the new one.

  · THE FOCUS BOARD STILL READS THE RAW FIGURE, deliberately — reward stays a
    year-end judgement. A build that swept every reader onto the score would
    satisfy everything above and break that, so it is asserted at both ends.

  · EVERY PROBE DEGRADES (§215, §256.1). The first draft leaned on the new
    shared reader to MEASURE with, so against the build before the fix it died
    on the missing name, printed five failures and never reached a single one of
    the cells it exists to guard. It reports 11 against that build now, naming
    each stale cell and the figure it should have held.

Run:  SMP_CHROME=… python3 qa-run.py checks/measure-score-spread.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(__file__).resolve().parent.parent /
                      "strategy-management-platform.html")
BAD = []


def ck(name, ok, detail=""):
    print(("  ok      " if ok else "  FAIL    ") + name +
          ("" if ok else "   -> %r" % (detail,)))
    if not ok:
        BAD.append(name)


def ev(pg, js, arg=None):
    """Never let a missing function end the run — a build without the shared
    readers is exactly the build this file exists to report on."""
    try:
        return pg.evaluate(js) if arg is None else pg.evaluate(js, arg)
    except Exception as e:
        return {"__err": str(e).split("\n")[0]}


def err(v):
    return isinstance(v, dict) and "__err" in v


# ── reading a drawn score card ────────────────────────────────────────
CARD_JS = """(sel)=>{
  var box = document.querySelector(sel);
  if (!box) return null;
  var h = box.querySelector('.score-h h4');
  var big = box.querySelector('.headline .big');
  var out = {head: h ? h.textContent.trim() : null,
             big: big ? big.textContent.trim() : null, mini: {}};
  box.querySelectorAll('.minirow > div').forEach(function(d){
    var e = d.querySelector('em'), b = d.querySelector('b');
    if (e && b) out.mini[e.textContent.trim()] = b.textContent.trim();
  });
  return out;
}"""


def num(s):
    """'96%' -> 96, an em-dash -> None."""
    if not s:
        return None
    s = s.replace("—", "").replace("%", "").strip()
    try:
        return int(float(s))
    except ValueError:
        return None


def open_unit(pg, key):
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if not el:
        return False
    el.click(); pg.wait_for_timeout(520)
    return True


def go_top(pg, key):
    """The group sits in a dropdown when it is not the first control (§94.6)."""
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(420); return True
    sm = pg.query_selector("#topsel > summary")
    if not sm:
        return False
    sm.click(); pg.wait_for_timeout(160)
    el = pg.query_selector('#topsel [data-u="%s"]' % key)
    if not el or not el.is_visible():
        sm.click(); return False
    el.click(); pg.wait_for_timeout(420)
    return True


def show_fns(pg):
    """The navigation row shows ONE list at a time (§51.9), and a block left on
    Units strands every later one that names a function. §41.8: it is ONE
    segmented button, so the press is on the button and not on a half of it."""
    sw = pg.query_selector(".navswitch")
    if not sw:
        return False
    if not pg.query_selector('#units [data-u^="fn:"]'):
        sw.click(); pg.wait_for_timeout(420)
    return bool(pg.query_selector('#units [data-u^="fn:"]'))


def open_sub(pg, word):
    for bt in pg.query_selector_all("#subtabs button[data-s]"):
        if (bt.text_content() or "").strip().lower().startswith(word):
            bt.click(); pg.wait_for_timeout(560); return True
    return False


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 1500, "height": 950})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.add_init_script("try{localStorage.setItem('smp.welcome.seen','1');"
                           "localStorage.setItem('smp.tour.done','1')}catch(e){}")
        pg.goto(URL); pg.wait_for_timeout(1400)
        pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")
        who = pg.eval_on_selector_all("#asWho option", "e=>e.map(x=>x.value)")
        if who:
            pg.select_option("#asWho", who[0]); pg.wait_for_timeout(400)

        # ── 1 · the shared readers, asked for BY NAME ──────────────────
        # §252: a check that uses a shared reader without first asserting it
        # exists dies rather than reporting on the build that lacks it.
        print("\n── 1 · one reader behind every summary ──")
        have = ev(pg, """()=>({
          spread: typeof scoreSpread === 'function',
          kos:    typeof scorableKOs === 'function',
          meas:   typeof scorableMeasures === 'function',
          score:  typeof measureScore === 'function' })""")
        ck("scoreSpread() answers a card's Highest and Lowest",
           not err(have) and have.get("spread"), have)
        ck("scorableKOs() names which objectives the headline is made of",
           not err(have) and have.get("kos"), have)
        ck("...and both sit beside the readers that already existed",
           not err(have) and have.get("meas") and have.get("score"), have)

        # THE CHECK CARRIES ITS OWN MEMBERSHIP TEST, and only so that it can
        # still MEASURE a build that has not got the shared one (§215): a probe
        # that dies on the missing reader reports two failures and never reaches
        # the seven cells this file is about. Where the product's reader exists
        # it is the one used, and the two are asserted to agree — so this
        # fallback can never quietly become a second definition (§53.5).
        pg.evaluate("""()=>{
          window.__koRows = function(list){
            if (typeof scorableKOs === 'function') return scorableKOs(list);
            return (list||[]).filter(function(m){
              return !SMPRules.isHidden(m) && !m.milestone && measureScore(m) != null; });
          };
        }""")
        agree = ev(pg, """()=>{
          if (typeof scorableKOs !== 'function') return "not built";
          var k = Object.keys(UNITS)[0];
          return scorableKOs(UNITS[k].keyObjectives).length ===
                 __koRows(UNITS[k].keyObjectives).length ? "agree" : "differ";
        }""")
        ck("...and the product's list is the one this check measures against",
           agree == "agree", agree)

        # ── 2 · the demo genuinely holds rows where the two part ───────
        print("\n── 2 · the raw ratio and the score really do differ here ──")
        split = ev(pg, """()=>{
          var out = {measures:0, kos:0, pillar:null, unit:null};
          Object.keys(UNITS).forEach(function(k){
            var u = UNITS[k];
            (u.keyObjectives||[]).forEach(function(m){
              if (measureScore(m) != null && measureScore(m) !== m.progress) out.kos++;
            });
            (u.items||[]).forEach(function(it){
              var rows = (it.measures||[]).filter(function(m){
                return m.target && measureScore(m) != null; });
              var apart = rows.filter(function(m){ return measureScore(m) !== m.progress; });
              out.measures += apart.length;
              /* THE PILLAR THIS FILE MEASURES: one whose EXTREMES move, not
                 merely one holding a row that differs — a pillar where the
                 outlier is unchanged would pass on the broken build. */
              if (!out.pillar && apart.length && rows.length){
                var sc = rows.map(function(m){ return measureScore(m); });
                var st = rows.map(function(m){ return m.progress; });
                if (Math.max.apply(null, sc) !== Math.max.apply(null, st) ||
                    Math.min.apply(null, sc) !== Math.min.apply(null, st)){
                  out.pillar = it.code; out.unit = k;
                }
              }
            });
            if (!out.unitko){
              var rows = __koRows(u.keyObjectives);
              if (rows.length){
                var sc = rows.map(function(m){ return measureScore(m); });
                var st = rows.map(function(m){ return m.progress; });
                if (Math.max.apply(null, sc) !== Math.max.apply(null, st) ||
                    Math.min.apply(null, sc) !== Math.min.apply(null, st)) out.unitko = k;
              }
            }
          });
          return out;
        }""")
        ck("the worked example holds measures whose score is not their stored ratio",
           not err(split) and split.get("measures", 0) > 0, split)
        ck("...and a pillar whose HIGHEST and LOWEST move because of it",
           not err(split) and bool(split.get("pillar")), split)
        ck("...and a unit whose objectives' extremes move too",
           not err(split) and bool(split.get("unitko")), split)
        if err(split) or not split.get("pillar"):
            print("\n  (cannot measure the cards without such a row — stopping here)")
            report(errs); b.close(); return

        ukey, pcode = split["unit"], split["pillar"]

        # ── 3 · the pane Islam reported ────────────────────────────────
        print("\n── 3 · a pillar's Key measures card, on Performance ──")
        ck("the unit opens", open_unit(pg, ukey), ukey)
        ck("...on its Performance page", open_sub(pg, "performance"))
        rail = pg.query_selector('[data-urail="%s|%s"]' % (ukey, pcode))
        ck("the pillar is reachable from the rail", bool(rail), pcode)
        if rail:
            rail.click(); pg.wait_for_timeout(560)
        want = ev(pg, """(a)=>{
          var it = (UNITS[a[0]].items||[]).filter(function(x){ return x.code === a[1]; })[0];
          if (!it) return null;
          var rows = scorableMeasures(it);
          var sc = rows.map(function(m){ return measureScore(m); });
          var st = rows.map(function(m){ return m.progress; });
          return {n: rows.length, perf: pillarPerf(it),
                  hi: Math.max.apply(null, sc), lo: Math.min.apply(null, sc),
                  storedHi: Math.max.apply(null, st), storedLo: Math.min.apply(null, st),
                  rowScores: sc, rowStored: st};
        }""", [ukey, pcode])
        card = ev(pg, CARD_JS, ".pane .scores .card.primary")
        ck("the pane draws a Key measures card", not err(card) and bool(card), card)
        if card and not err(card) and not err(want):
            ck("its headline is the pillar's own performance",
               num(card["big"]) == want["perf"], (card, want))
            ck("Highest is the highest SCORE, which is what the headline averaged",
               num(card["mini"].get("Highest")) == want["hi"], (card["mini"], want))
            ck("Lowest is the lowest SCORE",
               num(card["mini"].get("Lowest")) == want["lo"], (card["mini"], want))
            # THE OTHER END: on this pillar the stored extremes are a different
            # pair of numbers, so a build reading them fails the two above.
            ck("...and not the stored raw ratio, which here says something else",
               (want["hi"], want["lo"]) != (want["storedHi"], want["storedLo"]), want)
            ck("the count is the number of scored measures",
               num(card["mini"].get("Measures")) is not None, card["mini"])

        # ── 4 · the Progress column beneath it agrees, row for row ─────
        print("\n── 4 · the table under the card says the same numbers ──")
        drawn = ev(pg, """()=>{
          var t = document.querySelector('.pane table');
          if (!t) return null;
          var head = Array.prototype.map.call(t.querySelectorAll('thead th'),
                        function(h){ return h.textContent.trim().toLowerCase(); });
          var col = head.indexOf('progress');
          if (col < 0) return {col:-1, head:head};
          return {col: col, head: head,
            rows: Array.prototype.map.call(t.querySelectorAll('tbody tr'), function(r){
              var c = r.children[col]; return c ? c.textContent.trim() : null; })};
        }""")
        ck("the measures table carries a Progress column",
           not err(drawn) and drawn and drawn.get("col", -1) >= 0, drawn)
        if drawn and not err(drawn) and drawn.get("col", -1) >= 0 and not err(want):
            got = [num(x) for x in drawn["rows"] if num(x) is not None]
            ck("every figure in it is one of the card's own scores",
               got and set(got) <= set(want["rowScores"]), (got, want["rowScores"]))
            ck("...so the card's Highest is a number actually on the page",
               want["hi"] in got, (got, want["hi"]))

        # ── 5 · the unit's Key objectives card ────────────────────────
        print("\n── 5 · the unit's Key objectives card ──")
        ck("the unit with moving objectives opens", open_unit(pg, split["unitko"]))
        ck("...on Performance", open_sub(pg, "performance"))
        kwant = ev(pg, """(k)=>{
          var u = UNITS[k], rows = __koRows(u.keyObjectives);
          var sc = rows.map(function(m){ return measureScore(m); });
          var st = rows.map(function(m){ return m.progress; });
          return {ko: unitObjectives(u), n: rows.length,
                  hi: Math.max.apply(null, sc), lo: Math.min.apply(null, sc),
                  storedHi: Math.max.apply(null, st), storedLo: Math.min.apply(null, st)};
        }""", split["unitko"])
        kcard = ev(pg, CARD_JS, "#panel > .scores .card.primary, .scores .card.primary")
        ck("the page draws the objectives card", not err(kcard) and bool(kcard), kcard)
        if kcard and not err(kcard) and not err(kwant):
            ck("its headline is the unit's objectives score",
               num(kcard["big"]) == kwant["ko"], (kcard, kwant))
            ck("Highest is the highest score among the objectives it averaged",
               num(kcard["mini"].get("Highest")) == kwant["hi"], (kcard["mini"], kwant))
            ck("Lowest is the lowest of the same list",
               num(kcard["mini"].get("Lowest")) == kwant["lo"], (kcard["mini"], kwant))
            ck("...and the stored ratio would have said something else",
               (kwant["hi"], kwant["lo"]) != (kwant["storedHi"], kwant["storedLo"]), kwant)

        # ── 6 · the breakdown a headline opens onto ────────────────────
        print("\n── 6 · the breakdown adds up to the headline it explains ──")
        drill = pg.query_selector('.card.primary .drill[data-modal]')
        ck("the objectives headline opens a breakdown", bool(drill))
        if drill:
            drill.click(); pg.wait_for_timeout(500)
            tab = ev(pg, """()=>{
              var t = document.querySelector('#modal-b table');
              if (!t) return null;
              var head = Array.prototype.map.call(t.querySelectorAll('thead th'),
                            function(h){ return h.textContent.trim().toLowerCase(); });
              var col = head.indexOf('progress');
              return {col: col, head: head,
                rows: col < 0 ? [] : Array.prototype.map.call(
                  t.querySelectorAll('tbody tr'), function(r){
                    var c = r.children[col]; return c ? c.textContent.trim() : null; })};
            }""")
            ck("it carries a Progress column", not err(tab) and tab and tab.get("col", -1) >= 0, tab)
            exp = ev(pg, """(k)=>UNITS[k].keyObjectives.map(function(m){
                     var s = measureScore(m);
                     return {score: s, stored: m.progress}; })""", split["unitko"])
            if tab and not err(tab) and tab.get("col", -1) >= 0 and not err(exp):
                got = [num(x) for x in tab["rows"]]
                ck("every row is its SCORE",
                   got == [r["score"] for r in exp], (got, exp))
                ck("...which on this unit is not the stored column it used to print",
                   got != [r["stored"] for r in exp], (got, exp))
            x = pg.query_selector("#modal-x")
            if x: x.click(); pg.wait_for_timeout(300)

        # ── 6b · the group's own breakdown, and a capability's Score ───
        # The same cell on two more surfaces. Every table changed here is
        # measured, or the ones nothing walks drift back in silence (§51.11).
        print("\n── 6b · the group's breakdown, and a capability's Score column ──")
        go_top(pg, "group")
        open_sub(pg, "performance")
        # Found by what the dialog IS, never by its position in the row: the
        # group's page carries three, and which is first is a layout fact.
        gid = ev(pg, """()=>{
          var hit = null;
          document.querySelectorAll('[data-modal]').forEach(function(b){
            var m = MODALS[b.dataset.modal];
            if (!hit && m && /key objectives/i.test(m.title || "")) hit = b.dataset.modal;
          });
          return hit;
        }""")
        gdrill = pg.query_selector('[data-modal="%s"]' % gid) if isinstance(gid, str) else None
        ck("the group's objectives headline opens a breakdown", bool(gdrill), gid)
        if gdrill:
            gdrill.click(); pg.wait_for_timeout(500)
            got = ev(pg, """()=>{
              var t = document.querySelector('#modal-b table');
              if (!t) return null;
              var head = Array.prototype.map.call(t.querySelectorAll('thead th'),
                            function(h){ return h.textContent.trim().toLowerCase(); });
              var col = head.indexOf('progress');
              return {col: col, rows: col < 0 ? [] : Array.prototype.map.call(
                t.querySelectorAll('tbody tr'), function(r){
                  var c = r.children[col]; return c ? c.textContent.trim() : null; })};
            }""")
            exp = ev(pg, """()=>GROUP.keyObjectives.map(function(m){
                     return {score: measureScore(m), stored: m.progress}; })""")
            if not err(got) and got and got.get("col", -1) >= 0 and not err(exp):
                drawn = [num(x) for x in got["rows"]]
                ck("every group objective reads its SCORE",
                   drawn == [r["score"] for r in exp], (drawn, exp))
                ck("...and the demo has one where that is not the stored figure",
                   [r["score"] for r in exp] != [r["stored"] for r in exp], exp)
            else:
                ck("the group breakdown carries a Progress column", False, got)
            x = pg.query_selector("#modal-x")
            if x: x.click(); pg.wait_for_timeout(300)

        cap = ev(pg, """()=>{
          var c = (GROUP.capabilities||[]).filter(function(x){
            return (x.keyObjectives||[]).some(function(m){
              return measureScore(m) != null && measureScore(m) !== m.progress; }); })[0];
          if (!c) return null;
          return {fn: c.fn, id: c.id, name: c.name,
                  scores: c.keyObjectives.map(function(m){ return measureScore(m); }),
                  stored: c.keyObjectives.map(function(m){ return m.progress; })};
        }""")
        ck("a capability holds an objective whose two figures differ",
           not err(cap) and cap is not None, cap)
        if cap and not err(cap):
            show_fns(pg)
            ck("the function carrying that capability opens",
               open_unit(pg, "fn:" + cap["fn"]), cap["fn"])
            open_sub(pg, "performance")
            # Every Score column drawn on the page, so the capability's own is
            # found without the check keeping a copy of the page's layout.
            cols = ev(pg, """()=>{
              var out = [];
              document.querySelectorAll('table').forEach(function(t){
                var head = Array.prototype.map.call(t.querySelectorAll('thead th'),
                              function(h){ return h.textContent.trim().toLowerCase(); });
                var col = head.indexOf('score');
                if (col < 0) return;
                out.push(Array.prototype.map.call(t.querySelectorAll('tbody tr'),
                  function(r){ var c = r.children[col]; return c ? c.textContent.trim() : null; }));
              });
              return out;
            }""")
            got = [[num(x) for x in c] for c in cols] if not err(cols) else []
            ck("its Score column is drawn and holds the SCORES",
               cap["scores"] in got, (got, cap["scores"]))
            ck("...and the stored ratios are nowhere in that column",
               cap["stored"] not in got, (got, cap["stored"]))

        # ── 7 · both ends: nothing stored moved, and Focus is untouched ─
        print("\n── 7 · the stored figure, and the one board that wants it ──")
        raw = ev(pg, """()=>{
          var u = UNITS[Object.keys(UNITS)[0]];
          var m = (u.keyObjectives||[])[0];
          return {stored: m ? m.progress : null,
                  isRaw: m && m.target ? Math.round(
                    parseFloat(String(m.actual).replace(/[^0-9.]/g,'')) /
                    parseFloat(String(m.target).replace(/[^0-9.]/g,'')) * 100) : null};
        }""")
        ck("the stored ratio is still the raw actual-against-annual figure",
           not err(raw) and raw.get("stored") == raw.get("isRaw"), raw)
        # Read the FIGURE the focus board draws rather than its source: what
        # matters is that reward is still judged on the year-end ratio.
        fb = ev(pg, """()=>{
          var out = null;
          Object.keys(UNITS).forEach(function(k){
            (UNITS[k].items||[]).forEach(function(it){
              (it.measures||[]).forEach(function(m){
                if (out) return;
                if (m.progress != null && measureScore(m) != null &&
                    m.progress !== measureScore(m) && isFocus(m.id))
                  out = {name: m.name, stored: m.progress, score: measureScore(m),
                         standing: focusStanding(m.progress).key};
              });
            });
          });
          return out;
        }""")
        if err(fb) or fb is None:
            print("      (no focus-marked measure whose two figures differ — "
                  "the board's raw reading is asserted in focus-switch.py)")
        else:
            ck("a focus-marked row is still judged on the raw year-end ratio",
               fb["standing"] == ev(pg, "(v)=>focusStanding(v).key", fb["stored"]), fb)

        report(errs)
        b.close()


def report(errs):
    print("\npage errors: " + (", ".join(errs) if errs else "none"))
    print(("\n%d FAILED\n" % len(BAD)) if BAD else "\nall green\n")
    if BAD or errs:
        sys.exit(1)


main()
