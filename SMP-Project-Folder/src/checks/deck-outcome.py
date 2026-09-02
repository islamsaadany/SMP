"""§251 — the presentation reads what was reported.

   Islam: *"presentations doesn't change when the plan performance is done."*
   A tactic reported through its OUTCOME (§248) puts its figure in `outActual`,
   and five readers were still asking `t.actual`: the review deck's tactics
   slide, the reporting count, the cycle board, the note rule and Submit.

   WHAT THIS FILE ASSERTS IS AGREEMENT, never a literal (§94.8): the slide must
   say what the Performance page says about the same tactic, and the counts must
   agree with the rule that decides whether a row is answered. A check that
   asserted "133%" would have to be rewritten the day the review point moves,
   and would still pass on a build where BOTH surfaces are wrong.

   THE DEMO HAS NO OUTCOME TACTIC AT ALL, so the state is MADE (§94.2): four
   tactics, one per state the slide has to draw.

   Run it against the SHIPPED file to watch it fail:
     python3 checks/deck-outcome.py ../strategy-management-platform-v3.22.html
"""
import os, sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else \
      os.path.join(HERE, "..", "strategy-management-platform.html")
CHROME = os.environ.get("SMP_CHROME", "/opt/pw-browsers/chromium-1194/chrome-linux/chrome")

FAILS = []
def ck(msg, cond, detail=""):
    print(("  ok   " if cond else "  FAIL ") + msg + ("" if cond else "   " + str(detail)))
    if not cond: FAILS.append(msg)

# ── the state: four tactics on Mobile's first pillar, one per state ───────
MAKE = """()=>{
  var u = UNITS['mobile'], p = u.items[0], t = p.tactics.slice(0, 4);
  /* 1 — reported through its outcome, and nothing in the old box */
  t[0].outcome='Stores opened'; t[0].outDir='\\u2265'; t[0].outTarget='6 #';
  t[0].outCompile='Sum'; t[0].outActual='4'; t[0].actual=null;
  t[0].q1=true;t[0].q2=true;t[0].q3=true;t[0].q4=true; t[0].note='';
  /* 2 — no outcome at all: must read exactly as it always did */
  t[1].outcome=''; t[1].outTarget=''; t[1].outActual=null; t[1].actual=62;
  t[1].q1=true;t[1].q2=true;t[1].q3=false;t[1].q4=false; t[1].note='';
  /* 3 — an outcome that is owed a figure */
  t[2].outcome='Average handling time'; t[2].outDir='\\u2264'; t[2].outTarget='4 min';
  t[2].outCompile='Latest'; t[2].outActual=null; t[2].actual=null;
  t[2].q1=true;t[2].q2=true;t[2].q3=true;t[2].q4=false; t[2].note='';
  /* 4 — outside this cycle */
  t[3].outcome='Suppliers onboarded'; t[3].outDir='\\u2265'; t[3].outTarget='12 #';
  t[3].outCompile='Sum'; t[3].outActual=null; t[3].actual=null;
  t[3].q1=false;t[3].q2=false;t[3].q3=false;t[3].q4=true; t[3].note='';
  p.tactics = t;
  paint();
  return { code: pillarCode(u, 0), names: t.map(function(x){ return x.name; }) };
}"""

# The deck's own tactics table, read out of a detached render (§50.3) so the
# answer is the real deck's rather than a description of it.
DECK = """(code)=>{
  var box = document.createElement('div');
  box.innerHTML = deckSlides(UNITS['mobile']);
  var out = null;
  box.querySelectorAll('table').forEach(function(tb){
    var h = tb.querySelector('thead tr'); if (!h || out) return;
    var n = Array.from(h.children).map(function(x){ return x.textContent.trim(); });
    if (n.indexOf('Tactic') < 0) return;
    out = { head:n, rows: Array.from(tb.querySelectorAll('tbody tr')).map(function(r){
      return Array.from(r.children).map(function(c){ return c.textContent.trim(); }); }) };
  });
  return out;
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME,
                          args=["--allow-file-access-from-files", "--no-sandbox"])
    pg = b.new_page(viewport={"width": 1500, "height": 900})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("file://" + SRC); pg.wait_for_timeout(1200)
    pg.evaluate("var o=document.querySelector('.welcomeover'); if(o) o.remove();")
    made = pg.evaluate(MAKE)
    print("§0  the state — " + str(made["code"]) + ", four tactics made")
    # A PROBE THAT DIES REPORTS NOTHING (§215): every later evaluate calls the
    # two shared readers, so a build without them would kill the run and print a
    # failure count of zero. Asked for by name first, and stood in for after.
    have = pg.evaluate("""()=>({
      tacticProgress: typeof tacticProgress === 'function',
      rowAnswered: typeof rowAnswered === 'function' })""")
    ck("`tacticProgress` is declared once and shared", have["tacticProgress"])
    ck("`rowAnswered` is declared once and shared", have["rowAnswered"])
    pg.evaluate("""()=>{
      if (typeof tacticProgress !== 'function')
        window.tacticProgress = function(){ return null; };
      if (typeof rowAnswered !== 'function')
        window.rowAnswered = function(x){
          var o = x && (x.obj || x);
          return !!o && o.actual != null && o.actual !== ''; };
    }""")

    # ── §1 the slide's columns, in order (Islam's option A) ───────────────
    print("\n§1  the tactics slide carries the outcome")
    deck = pg.evaluate(DECK, made["code"])
    ck("a tactics table is drawn at all", deck is not None)
    if deck is None:
        print("\nFAILURES: 1"); sys.exit(1)
    WANT = ["#", "Tactic", "Outcome", "Owner", "Collabs.", "Quarters",
            "YTD actual", "Progress", "Note"]
    ck("its columns are the nine agreed, in order", deck["head"] == WANT, deck["head"])
    ck("the outcome is a COLUMN, never under the name",
       "Outcome" in deck["head"], deck["head"])
    ck("the old wordings are gone",
       "Deliv. / due" not in deck["head"] and "Of plan" not in deck["head"], deck["head"])

    # ── §2 what the slide says vs what Performance says ──────────────────
    print("\n§2  the slide agrees with the Performance page")
    perf = pg.evaluate("""()=>{
      var u = UNITS['mobile'], p = u.items[0];
      return SMPRules.shown(p.tactics).map(function(t){
        return { name:t.name, on:onOutcome(t), answered:tacticAnswered(t),
                 due:tacticDue(t), shown: onOutcome(t) ? outcomeShown(t)
                        : (t.actual == null ? null : t.actual + '%'),
                 bench: tacticBenchmark(t), reads: tacticProgress(t) }; });
    }""")
    rows = deck["rows"]
    ck("the slide draws every tactic", len(rows) == len(perf), len(rows))

    r0, p0 = rows[0], perf[0]
    ck("the outcome tactic names its outcome on the slide",
       r0[2] == "Stores opened", r0)
    ck("its figure on the slide is the figure Performance shows",
       p0["shown"] is not None and p0["shown"].replace(" ", "") in r0[6].replace(" ", ""),
       (p0["shown"], r0[6]))
    ck("it is read against the target due so far",
       p0["bench"] is not None and p0["bench"].replace(" ", "") in r0[6].replace(" ", ""),
       (p0["bench"], r0[6]))
    ck("its score on the slide is the score Performance gives it",
       str(p0["reads"]) + "%" == r0[7], (p0["reads"], r0[7]))
    ck("and it is no longer an em-dash", "—" not in r0[6] + r0[7], (r0[6], r0[7]))

    r1, p1 = rows[1], perf[1]
    ck("a tactic with NO outcome says Missing in the outcome column",
       r1[2] == "Missing", r1[2])
    ck("...and its figure reads exactly as it always did (62%)",
       "62%" in r1[6], r1[6])
    ck("...against the share of its plan that is due",
       p1["bench"] in r1[6], (p1["bench"], r1[6]))
    ck("...scored the old way", str(p1["reads"]) + "%" == r1[7], (p1["reads"], r1[7]))

    r2 = rows[2]
    ck("a tactic still owed a figure SAYS so", "Not reported" in " ".join(r2), r2)
    ck("...and says what it is due at", "4 min" in " ".join(r2), r2)
    r3 = rows[3]
    ck("a tactic outside the cycle is unchanged",
       "Outside this cycle" in " ".join(r3), r3)

    # ── §3 the counts: answered means answered, everywhere ───────────────
    print("\n§3  a reported outcome counts as reported")
    counts = pg.evaluate("""()=>{
      var u = UNITS['mobile'];
      var c = reportedCount(u), a = askedItems(u);
      var byRule = a.filter(function(x){ return rowAnswered(x); }).length;
      var t = a.filter(function(x){ return x.kind === 'tactic'; });
      return { done:c.done, total:c.total, byRule:byRule,
               tacticsAsked: t.length,
               tacticsAnswered: t.filter(function(x){ return tacticAnswered(x.obj); }).length,
               owed: submitBlockers('mobile').owed,
               /* the outcome row alone, asked of the count's own predicate */
               outcomeRowCounted: a.some(function(x){
                 return x.kind === 'tactic' && x.obj.outActual === '4' && rowAnswered(x); })
             };
    }""")
    ck("the outcome row is counted as answered", counts["outcomeRowCounted"], counts)
    ck("the count agrees with the rule behind it",
       counts["done"] == counts["byRule"], counts)
    ck("Submit's 'still to enter' agrees with the count",
       counts["owed"] == counts["total"] - counts["done"], counts)
    ck("...and does not ask again for a figure that is in",
       counts["owed"] == len([x for x in perf if x["due"] and not x["answered"]])
         + (counts["total"] - counts["tacticsAsked"]
            - (counts["done"] - counts["tacticsAnswered"])),
       counts)

    print("\n§4  the board and the note rule read the same box")
    board = pg.evaluate("""()=>{
      var u = UNITS['mobile'], by = 0;
      askedItems(u).forEach(function(x){ if (x.kind === 'tactic' && rowAnswered(x)) by++; });
      /* a badly-missed outcome must be a figure somebody has to explain */
      var t = u.items[0].tactics[0], keep = t.outActual;
      t.outActual = '1';
      var wants = needsNote({ kind:'tactic', obj:t, id:t.id });
      var reads = rowReads({ kind:'tactic', obj:t });
      t.outActual = keep;
      return { boardTactics:by, wantsNote:wants, reads:reads };
    }""")
    ck("the board's tactics column counts the outcome row",
       board["boardTactics"] == counts["tacticsAnswered"], board)
    ck("the note rule can SEE an outcome figure", board["reads"] is not None, board)
    ck("...and asks for a line where the outcome is badly missed",
       board["wantsNote"] is True, board)

    print("\n§5  nothing threw")
    ck("no page error", not errs, errs)
    b.close()

print("\nFAILURES: " + str(len(FAILS)))
for f in FAILS: print("  - " + f)
sys.exit(1 if FAILS else 0)
