"""A TARGET THAT IS A YES OR A NO (§251).

Islam: *"for the target we need to add a Y/N in the units which dims the
target itself."* Some rows are not measured — a certification achieved, an
agreement signed, a warehouse open — and the plan had no way to write one.
Both of the decisions this rests on are his, taken before anything was built:
a Y/N row scores **100 or 0** (so it counts in every average exactly as a
measured row does), and it applies in **all three** places the unit picker
appears — a unit's key objectives, a pillar's key measures and a tactic's
outcome.

WHAT IS ASSERTED, and why each one is here:

  · IT IS NOT A GAP. §249 made a target holding only a unit read as Missing,
    which is right for `%` on its way to `90%` and exactly wrong for `Y/N` —
    a finished target with no number in it. Without the carve-out every Y/N
    row wears the red word for ever and refuses Submit (§221) with nothing
    anybody could fill. This is the assertion the whole feature stands on.

  · THE SCORE. 100 for yes, 0 for no, and NOT SCORED for silence — reading
    an unanswered row as a failure would mark a unit down for a question
    nobody has been asked yet (§35, §104.10).

  · THE DIMMING, measured as `disabled` and not as a class. A look is not a
    lock and the keyboard walks straight past something merely faded (§220).
    All four boxes stay DRAWN: a hole among equal boxes reads as a control
    that failed to render (§248).

  · THE UNIT PICKER STAYS LIVE while its three neighbours die, because it is
    the only way back out — dimming the control that SET this state would
    leave the row stuck in it (§61).

  · IT IS REACHABLE ON A BLANK ROW. A brand-new "did it happen" row has no
    number to type, and the pen used to draw an em-dash instead of the picker
    until a target existed — so the one unit that needs no number was the one
    unit you could not pick (§61 again).

  · BOTH SIDES OF THE SWITCH, on a unit AND on a supporting function, per the
    standing rule that a unit and a function are the same product (§53.5).

  · THE PLAN DOES NOT MOVE. Not one shipped target may change meaning: the
    feature is opt-in per row, and a build that quietly reinterpreted an
    existing target would be a silent data fault. Asserted against the demo
    tenant as a whole, not against one row.

PROVED ABLE TO FAIL before it was believed (§94.5): run against the build
before §251 and it goes red from its first section.

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/yn-target.py
"""
import pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = HERE.parent / "strategy-management-platform.html"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


class Blank:
    """What a probe that threw answers with.

    It has to be readable the way a real answer is — indexed by key, indexed
    by position, and `.get`ted — and it has to FAIL every assertion, in both
    directions. So it is TRUTHY on purpose: a `not x` assertion (there is
    nothing wrong) must go red when nothing was measured, and a `x == …` one
    must go red too. Returning None would have quietly satisfied half of them
    (§94.5: a check that cannot fail is not a check).
    """

    def __init__(self, why):
        self.why = why

    def __getitem__(self, k):
        return self

    def get(self, k, d=None):
        return self

    def __bool__(self):
        return True

    def __eq__(self, other):
        return False

    def __repr__(self):
        return "probe threw — " + self.why


def ev(pg, js):
    """§215: A THROW IS A FAILURE, NOT THE END OF THE RUN.

    On a build without §251 the very first probe reaches for a function that
    does not exist, and an un-caught throw kills the suite at that line — so
    `grep -c FAIL` reads ZERO and a falsification looks like a pass. Every
    probe degrades to a shape the assertions can still read, which is what
    makes "N red on the previous build" an honest number.
    """
    try:
        return pg.evaluate(js)
    except Exception as e:                                   # noqa: BLE001
        return Blank(str(e).split("\n")[0])


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1500, "height": 1000})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    # §167.2: the welcome screen covers the viewport and intercepts every
    # click, so it is suppressed as a RETURNING viewer does — before goto,
    # because setting the flag afterwards is too late.
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    pg.goto("file://" + str(FILE))
    pg.wait_for_timeout(800)

    print("\n── 1 · the rule, shared by the screen, the score and the server")
    r = ev(pg, """() => ({
      /* §251.2: the UNIT is what says it — a row keeps its figure and stops
         being counted, so "100 Y/N" is a yes/no row exactly as a bare "Y/N"
         is. Reading only the whole string is the fault Islam caught. */
      reads:  [SMPRules.isYesNo("Y/N"), SMPRules.isYesNo(" y/n "),
               SMPRules.isYesNo("100 Y/N"), SMPRules.isYesNo("100Y/N"),
               SMPRules.isYesNo("Y/NO"), SMPRules.isYesNo("6.2B EGP"),
               SMPRules.isYesNo(""), SMPRules.isYesNo(null)],
      score:  [SMPRules.ynScore("Yes"), SMPRules.ynScore("No"),
               SMPRules.ynScore("yes"), SMPRules.ynScore(""),
               SMPRules.ynScore(null), SMPRules.ynScore("maybe")],
      gapYN:  SMPRules.gapEmptyValue("outTarget", "Y/N"),
      gapUnit:SMPRules.gapEmptyValue("outTarget", "%"),
      gapNum: SMPRules.gapEmptyValue("outTarget", "6 #"),
      gapNone:SMPRules.gapEmptyValue("outTarget", "")
    })""")
    ck("Y/N is read, trimmed and case-insensitively, and nothing else is",
       r["reads"] == [True, True, True, True, False, False, False, False], r["reads"])
    ck("yes scores 100, no scores 0, and silence is NOT SCORED",
       r["score"] == [100, 0, 100, None, None, None], r["score"])
    ck("A Y/N TARGET IS NOT A GAP — the assertion the feature stands on",
       r["gapYN"] is False, r["gapYN"])
    ck("...while a unit on its own still is (§249 intact)",
       r["gapUnit"] is True and r["gapNone"] is True, [r["gapUnit"], r["gapNone"]])
    ck("...and a real target still is not", r["gapNum"] is False, r["gapNum"])

    print("\n── 2 · the setter, both directions")
    t = ev(pg, """() => {
      const mk = (a, b2) => ({target:a, target3y:b2});
      const go = (m, u) => { setTargetUnit(m, u); return [m.target, m.target3y, targetUnitOf(m)]; };
      return {
        from:  go(mk("6.2B EGP","9.0B EGP"), SMPRules.YN_UNIT),
        blank: go(mk("",""),                 SMPRules.YN_UNIT),
        noFar: go(mk("100#",""),             SMPRules.YN_UNIT),
        back:  go(mk("100 Y/N","100 Y/N"),   "%"),
        bare:  go(mk("Y/N",""),              "%"),
        clear: go(mk("Y/N",""),              "")
      };
    }""")
    ck("PICKING Y/N KEEPS THE FIGURE — it stops counting, nothing is destroyed",
       t["from"] == ["6.2 Y/N", "9.0 Y/N", "Y/N"], t["from"])
    ck("A BLANK ROW CAN BECOME ONE — that is how a yes/no row is created",
       t["blank"] == ["Y/N", "", "Y/N"], t["blank"])
    ck("...and an absent 3-year target is not minted behind the office's back",
       t["noFar"] == ["100 Y/N", "", "Y/N"], t["noFar"])
    ck("...AND CHANGING YOUR MIND GIVES THE FIGURE BACK — never 'Y/N%'",
       t["back"] == ["100%", "100%", "%"], t["back"])
    ck("a row that never had a figure leaves Y/N with none",
       t["bare"] == ["%", "", "%"], t["bare"])
    ck("...and clearing it clears the row", t["clear"][2] == "", t["clear"])

    print("\n── 3 · a bare number never inherits Y/N (it would store '5Y/N')")
    inh = ev(pg, """() => {
      const yn = unitInherit({target:"100 Y/N"})("5");
      const eg = unitInherit({target:"6.2B EGP"})("5");
      return [yn, eg]; }""")
    ck("a yes/no row hands a typed 5 straight back", inh[0] == "5", inh)
    ck("...while a measured row still inherits its unit", inh[1] == "5B EGP", inh)

    print("\n── 4 · the score, on a row shaped like the product's own")
    sc = ev(pg, """() => ({
      yes:  measureScore({target:"Y/N", actual:"Yes"}),
      no:   measureScore({target:"Y/N", actual:"No"}),
      none: measureScore({target:"Y/N", actual:""}),
      /* a KEPT figure is not counted — 100 against "Yes" is still 100, and
         against "No" still 0; the number in the box decides nothing */
      kept: measureScore({target:"100 Y/N", actual:"No", dir:"\\u2265"}),
      /* the share is irrelevant: there is no partial yes to prorate (§250) */
      half: measureScore({target:"Y/N", actual:"Yes", compile:"Sum"}, 0.5),
      /* and a measured row is UNTOUCHED by any of this */
      keep: measureScore({target:"10", actual:"5", dir:"\\u2265"}),
      due:  measureDueLabel({target:"Y/N", actual:"Yes"})
    })""")
    ck("yes is 100 and no is 0", [sc["yes"], sc["no"]] == [100, 0], sc)
    ck("a KEPT figure is ignored — the row is judged by the answer alone",
       sc["kept"] == 0, sc)
    ck("unanswered is not scored", sc["none"] is None, sc)
    ck("a Sum yes/no is not prorated to 50", sc["half"] == 100, sc)
    ck("a measured row scores exactly as it did", sc["keep"] == 50, sc)
    ck("there is no 'due at' benchmark to print", sc["due"] is None, sc)

    print("\n── 5 · a tactic's outcome is admitted and scored (§248's shape)")
    oc = ev(pg, """() => {
      const t = {outTarget:"100 Y/N", outActual:"Yes"};   /* a kept figure */
      const n = {outTarget:"Y/N", outActual:"No"};
      const q = {outTarget:"Y/N"};
      const p = {outTarget:"%"};                     /* §249: still a gap */
      return { on: !!outcomeOf(t), score: tacticOutcomeScore(t),
               no: tacticOutcomeScore(n), quiet: tacticOutcomeScore(q),
               bench: tacticBenchmark(t),
               unitOnly: !!outcomeOf(p),
               gapYN: SMPRules.gapEmpty("outTarget", t),
               gapPct: SMPRules.gapEmpty("outTarget", p) }; }""")
    ck("a Y/N outcome is a real outcome", oc["on"] is True, oc)
    ck("...scoring 100 and 0", [oc["score"], oc["no"]] == [100, 0], oc)
    ck("...not scored until somebody answers", oc["quiet"] is None, oc)
    ck("...with nothing to compare it against", oc["bench"] is None, oc)
    ck("...and it does not owe a target", oc["gapYN"] is False, oc)
    ck("a bare unit is still not an outcome and still owes one (§249 intact)",
       oc["unitOnly"] is False and oc["gapPct"] is True, oc)

    print("\n── 6 · NOT ONE SHIPPED TARGET CHANGES MEANING")
    # The feature is opt-in per row. A build that reinterpreted an existing
    # target would be a silent data fault, so this asks the whole tenant
    # rather than one row (§94.8: assert the property, never a literal).
    moved = ev(pg, """() => {
      const hit = [];
      Object.keys(UNITS).forEach(k => {
        (UNITS[k].keyObjectives||[]).forEach(m => {
          if (SMPRules.isYesNo(m.target) || SMPRules.isYesNo(m.target3y)) hit.push(m.name); });
        (UNITS[k].items||[]).forEach(p => {
          (p.measures||[]).forEach(m => { if (SMPRules.isYesNo(m.target)) hit.push(m.name); });
          (p.tactics||[]).forEach(t => { if (SMPRules.isYesNo(t.outTarget)) hit.push(t.name); });
        }); });
      return hit; }""")
    ck("no row in the worked example is silently read as yes/no", not moved, moved)

    print("\n── 7 · the pen: three boxes die, the picker lives")
    # Drive the REAL page: a unit's Plan, the office's pen, a real measure
    # turned into a yes/no row through the control somebody would use.
    # Plan is a SECTION, not a tab (§50.6's own scar — a check that sets
    # `currentSub='plan'` lands on Strategy and measures the wrong pane).
    ev(pg, """() => { VIEWER = PEOPLE.filter(p=>p.role==='super')[0].key;
      leaveModes(); current='mobile'; currentSub='strategy';
      CURSEC.strategy='plan'; EDIT_PAGE.plan=true; paint(); }""")
    pg.wait_for_timeout(600)
    st = ev(pg, """() => {
      const rows = document.querySelectorAll('.pane table tbody tr[data-oi]');
      let sel = null, row = null;
      for (const tr of rows) {
        const s = tr.querySelector('select.fld');
        if (s && [...s.options].some(o => o.value === 'Y/N')) { sel = s; row = tr; break; }
      }
      if (!sel) return { none: true };
      const before = row.querySelectorAll('.fld:disabled').length;
      sel.value = 'Y/N'; sel.dispatchEvent(new Event('change', {bubbles:true}));
      return { before: before, ok: true };
    }""")
    ck("the pen's measures table offers Y/N at all", not st.get("none"), st)
    if not st.get("none"):
        ck("nothing was disabled before", st["before"] == 0, st)
        pg.wait_for_timeout(400)
        af = ev(pg, """() => {
          const rows = document.querySelectorAll('.pane table tbody tr[data-oi]');
          for (const tr of rows) {
            const s = tr.querySelector('select.fld:not(:disabled)');
            if (s && s.value === 'Y/N') {
              return { off: tr.querySelectorAll('.fld:disabled').length,
                       live: [...tr.querySelectorAll('.fld:not(:disabled)')].map(e => e.value),
                       /* the pen's first Y/N-capable row may be a MEASURE or a
                          TACTIC's outcome — both carry the picker, and which
                          one comes first is the plan's business, not this
                          check's. Either reaching the stored plan proves it. */
                       stored: (function(){
                         const u = UNITS[current];
                         for (const p of u.items) {
                           for (const m of (p.measures||[]))
                             if (SMPRules.isYesNo(m.target)) return m.target;
                           for (const t of (p.tactics||[]))
                             if (SMPRules.isYesNo(t.outTarget)) return t.outTarget;
                         }
                         return null; })() };
            } }
          return { lost: true }; }""")
        ck("the row's target reached the stored plan as Y/N",
           af.get("stored") == "Y/N", af)
        ck("THREE boxes are genuinely disabled, not merely dimmed",
           af.get("off") == 3, af)
        ck("...and the unit picker is NOT among them — it is the way back out",
           "Y/N" in (af.get("live") or []), af)

    print("\n── 8 · reading it, and reporting it")
    rd = ev(pg, """() => {
      /* close the pen the platform's own way and read the same row back.
         `EDIT_PAGE = null` is NOT that: it is a map every renderer reads,
         so nulling it throws inside paint() (found by doing it). */
      leaveModes(); paint();
      const cells = [...document.querySelectorAll('.pane table tbody td')]
        .map(td => td.textContent.trim());
      return { saysYesNo: cells.some(c => c === 'Yes / No'),
               saysRaw:   cells.some(c => c === 'Y/N') }; }""")
    ck("the plan says 'Yes / No' where the target goes", rd["saysYesNo"], rd)
    ck("...and never the stored spelling", not rd["saysRaw"], rd)

    # §222 made Reporting a TAB, so it is opened by pressing that tab — the
    # mode is set from the row, and assigning REPORTING alone renders a page
    # the platform does not think it is on (§222's own "rendered perfectly,
    # did nothing").
    ev(pg, """() => { const b = document.querySelector('[data-s=report]');
      if (b) b.click(); }""")
    pg.wait_for_timeout(700)
    rep = ev(pg, """() => {
      const s = document.querySelector('select.ynfield');
      if (!s) return { none: true };
      const opts = [...s.options].map(o => o.value);
      s.value = 'Yes'; s.dispatchEvent(new Event('change', {bubbles:true}));
      return { opts: opts, ok: true }; }""")
    ck("the reporting page asks for a yes or a no, picked not typed",
       not rep.get("none") and rep.get("opts") == ["", "Yes", "No"], rep)
    if not rep.get("none"):
        pg.wait_for_timeout(400)
        got = ev(pg, """() => {
          const u = UNITS[current];
          for (const p of u.items) {
            for (const m of (p.measures||[]))
              if (SMPRules.isYesNo(m.target))
                return { actual: m.actual, score: measureScore(m) };
            for (const t of (p.tactics||[]))
              if (SMPRules.isYesNo(t.outTarget))
                return { actual: t.outActual, score: tacticOutcomeScore(t) };
          }
          return null; }""")
        ck("the answer is stored whole — 'Yes', never 'YesY/N'",
           got and got["actual"] == "Yes", got)
        ck("...and it scores 100", got and got["score"] == 100, got)

        # §251.2, both from Islam using the running page.
        print("\n── 9 · it is the same size as a number box, and it COUNTS")
        # THE WIDTH: `.entry .field` is 78px because a number gives 26px back
        # to the unit suffix beside it. This control has no suffix, so it
        # rendered short in a column an eye runs down.
        w = ev(pg, """() => {
          const yn  = document.querySelector('select.ynfield');
          const num = [...document.querySelectorAll('span.entry')]
                        .find(e => e.querySelector('input.field'));
          const box = yn ? (yn.closest('.entry') || yn) : null;
          const r = e => { const b = e.getBoundingClientRect();
            return [Math.round(b.width), Math.round(b.height)]; };
          return { yn: box ? r(box) : null, num: num ? r(num) : null,
                   rail: [...document.querySelectorAll('.rail .rtally')].map(e=>e.textContent),
                   band: (document.querySelector('.pane .rtally')||{}).textContent }; }""")
        ck("both shapes are present to compare",
           w["yn"] and w["num"], w)
        # ASSERTED AS AGREEMENT, never as a number — a later change to the
        # reporting box must move both or fail here (§94.8, §122.5).
        ck("the yes/no picker is the same width as a number entry",
           w["yn"] and w["num"] and abs(w["yn"][0] - w["num"][0]) <= 2, w)
        # HEIGHT TOO, and it is the half that was actually wrong: `input.field`
        # is ELEMENT-scoped, so the <select> received none of its box and stood
        # 19px against 34. Measuring one dimension and calling it level is how
        # the first fix went to the wrong axis.
        ck("...and the same HEIGHT — the half the first fix missed",
           w["yn"] and w["num"] and abs(w["yn"][1] - w["num"][1]) <= 2, w)
        # THREE TALLIES OF ONE PILLAR, and the rail is the one Islam was
        # looking at: it read 3/4 beside a band reading 4/4.
        ck("the rail and the band agree about the pillar",
           w["band"] and w["band"] in (w["rail"] or []), w)

        # THE TALLY: §248 sends an outcome's figure to `outActual` and the
        # counts read `actual`, so an answer given through the box the page
        # itself drew never counted. Asserted as the DIFFERENCE the answer
        # makes, not as a number — the demo's totals are not this check's
        # business (§94.8).
        cnt = ev(pg, """() => {
          const u = UNITS[current];
          let t = null;
          for (const p of u.items) for (const x of (p.tactics||[]))
            if (SMPRules.isYesNo(x.outTarget)) { t = x; break; }
          if (!t) return { none:true };
          /* BOTH FIELDS CLEARED FIRST, or the trial measures nothing: the
             demo's tactics carry an `actual` from long before outcomes
             existed, and a row answered in EITHER field counts (that is the
             rule that keeps this from getting stricter than what came
             before). So the baseline has to be a row that has said nothing
             at all — §94.2, make the state you mean to measure. */
          const keep = t.actual;
          delete t.actual; delete t.outActual;
          const without = reportedCount(u).done;
          t.outActual = 'Yes';
          const withYes = reportedCount(u).done;
          const alsoOld = (function(){ delete t.outActual; t.actual = keep;
            const n = reportedCount(u).done; t.outActual = 'Yes'; return n; })();
          return { withYes: withYes, without: without, alsoOld: alsoOld,
                   field: reportField({kind:'tactic', obj:t}) }; }""")
        ck("a tactic reports its outcome into outActual",
           cnt.get("field") == "outActual", cnt)
        ck("ANSWERING IT MOVES THE TALLY — the count reads the field the box writes",
           cnt.get("withYes") == cnt.get("without") + 1, cnt)
        # AND IT NEVER GETS STRICTER: a tactic carrying only the OLD field
        # still counts, so giving an existing row an outcome cannot make a
        # report that was complete suddenly owe figures (measured at 18 rows
        # when this was got wrong).
        ck("...and a row answered only the OLD way still counts",
           cnt.get("alsoOld") == cnt.get("without") + 1, cnt)

    ck("no console errors", not errs, errs[:3])
    b.close()

print("\n" + ("ALL PASSED" if not bad else "%d FAILED" % bad))
raise SystemExit(1 if bad else 0)
