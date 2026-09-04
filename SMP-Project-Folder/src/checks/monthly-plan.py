"""A TARGET WITH A SHAPE OF ITS OWN (§278).

Islam: *"targets proration is always flat across the year but some targets have
seasonality so the proration is not valid .. so some targets needs a monthly
plan input so the calculation becomes more accurate."*

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE:

  · The chip is on all four surfaces (Islam's "all four") and on none of the
    rows that can never use one. A check that only looks for something PRESENT
    cannot see a control drawn where it should not be (§94.2).
  · Every box is PRESSED and the STORED PLAN is read back. A drawer wired to
    nothing looks identical and discards every keystroke (§96) — which is
    exactly what shipped in the first build of this feature, where the boxes
    rendered as spans on Foundation because they named the wrong page.
  · A TYPED 0 IS A REAL MONTH AND A BLANK IS NOT, asserted from BOTH sides.
    `Number("")` is 0 and finite (§104.10), so a build that read blanks as
    noughts would put a half-filled plan in force and cut the year's target —
    and it would pass every assertion about the complete case.
  · A row with no monthly plan is BYTE-IDENTICAL to before. The whole
    safety argument for shipping into an open cycle is that nothing moves
    until somebody fills twelve boxes in, and that is a measurement, not a
    claim.
  · The workbook round trip is a FIXED POINT (§22): an upload AUTHORS, so a
    column the file does not carry is a column the plan loses.
  · Twelve boxes WRAP rather than overflowing (§158: a plan table fits its
    pane, never "and it scrolls").

IT MAKES THE STATE IT MEASURES (§94.2). Not one row in the worked example
carries a monthly plan, and not one tactic carries an outcome at all — so
every assertion here would pass on a build that had lost the feature entirely
if it waited for the demo to show it one.
"""
import os
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..",
      "strategy-management-platform.html"))
PLAN = [15, 14, 16, 16, 17, 18, 24, 28, 32, 36, 40, 44]   # adds to 300
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w +
          (("  — %s" % (x,)) if not ok and x != "" else ""))


def ev(pg, js, arg=None):
    """Every probe degrades rather than dying (§215): a check that throws
    reports FEWER failures than the build has, and `grep -c FAIL` then reads a
    number that looks like success."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"threw": str(e)[:160]}


def press(pg, sel):
    """A press that DEGRADES. The first falsification run of this file died on
    a missing control and `grep -c FAIL` read 9 where the build has forty —
    §215, in the file written to quote it."""
    try:
        el = pg.query_selector(sel)
        if not el:
            return False
        el.click()
        return True
    except Exception:
        return False


def typemonths(pg, vals):
    return ev(pg, """(vals) => {
      const b = [...document.querySelectorAll('tr.mprow .mpm input')];
      if (b.length !== 12) return { n: b.length };
      b.forEach((el, i) => {
        el.value = vals[i] == null ? "" : String(vals[i]);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { n: 12 };
    }""", vals)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1500})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(1400)

    # The rules the whole feature hangs off, asked BY NAME first. Without them
    # every probe below dies and the run reports nothing (§215, §252's lesson).
    have = ev(pg, """() => ({
      rules: typeof SMPRules !== "undefined" &&
             typeof SMPRules.monthlyDue === "function" &&
             typeof SMPRules.monthSet === "function",
      chip: typeof monthlyChip === "function",
      drawer: typeof monthlyRowFor === "function" })""")
    ck("the shared rules and the two builders exist",
       have.get("rules") and have.get("chip") and have.get("drawer"), have)

    # ── 1 · the arithmetic, asked of the rule itself ────────────────────
    ar = ev(pg, """(plan) => {
      const R = SMPRules, m = { monthly: plan, compile: "Sum" };
      return {
        sum6:  R.monthlyDue(m, 6),
        annual: R.monthlyAnnual(m),
        latest6: R.monthlyDue({ monthly: plan, compile: "Latest" }, 6),
        avg4: R.monthlyDue({ monthly: plan, compile: "Average" }, 4),
        /* A BLANK MONTH IS NOT A NOUGHT. This is the assertion the whole
           feature turns on: with a naive Number() test this reads 82 and the
           row goes in force on a plan somebody has only started. */
        oneBlank: R.monthlyDue({ monthly: [1,2,"",4,5,6,7,8,9,10,11,12], compile:"Sum" }, 6),
        /* ...and a typed 0 IS one. */
        typedZero: R.monthlyDue({ monthly: [0,0,0,0,0,0,10,10,10,10,10,10], compile:"Sum" }, 6),
        zeroSet: R.monthSet(0), blankSet: R.monthSet(""), nullSet: R.monthSet(null),
        /* No compile rule: the platform cannot say what twelve months add up
           to, so the row is not in force rather than guessed at. */
        noCompile: R.monthlyDue({ monthly: plan }, 6),
        inForceNoCompile: R.monthlyInForce({ monthly: plan }),
        eleven: R.monthlySet({ monthly: plan.slice(0, 11) })
      };
    }""", PLAN)
    ck("Sum adds the months that have passed", ar.get("sum6") == 96, ar)
    ck("...and all twelve are the annual target", ar.get("annual") == 300, ar)
    ck("Latest takes the month being stood in", ar.get("latest6") == 18, ar)
    ck("Average takes their mean", ar.get("avg4") == 15.25, ar)
    # ASKED BESIDE A CASE THAT MUST ANSWER. On a build with no monthly plan at
    # all every probe here throws and every `is None` assertion passes — §94.5's
    # own example, and this file's first falsification run did exactly that.
    ck("A BLANK MONTH LEAVES THE PLAN OUT OF FORCE, never read as nought",
       ar.get("oneBlank") is None and ar.get("sum6") == 96, ar)
    ck("A TYPED 0 IS A REAL MONTH", ar.get("typedZero") == 0 and ar.get("zeroSet") is True, ar)
    ck("...and blank and null are not", ar.get("blankSet") is False and
       ar.get("nullSet") is False, ar)
    ck("no compile rule: not in force, never guessed",
       ar.get("noCompile") is None and ar.get("inForceNoCompile") is False, ar)

    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(250)
    press(pg, '#units button[data-u="mobile"]')
    pg.wait_for_timeout(500)
    press(pg, '.rail [data-urail="mobile|03"]')
    pg.wait_for_timeout(400)

    # ── 2 · what the row reads BEFORE, so the change can be measured ────
    before = ev(pg, """() => {
      const m = UNITS.mobile.items.find(p => p.code === '03')
                .measures.find(x => x.name.indexOf('Accessory') === 0);
      const sib = UNITS.mobile.items.find(p => p.code === '03')
                .measures.find(x => x.name.indexOf('Sary revenue') === 0);
      return { target: m.target, actual: m.actual, due: measureDueLabel(m),
               score: measureScore(m), elapsed: elapsedMonths(),
               sibDue: measureDueLabel(sib), sibScore: measureScore(sib),
               sibTarget: sib.target, hasMonthly: "monthly" in m };
    }""")
    ck("the demo carries no monthly plan at all, so the state is MADE",
       before.get("hasMonthly") is False, before)
    ck("flat, today: 96M against half the year, behind",
       before.get("due") == "150M EGP" and before.get("score") == 64, before)

    # ── 3 · the pen: a chip on every measure, none on a yes/no row ──────
    press(pg, '.pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(600)
    chips = ev(pg, """() => {
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => x.querySelector('thead') &&
                   x.querySelector('thead').textContent.indexOf('Measure') >= 0);
      const rows = [...t.querySelectorAll('tbody tr')].filter(r => !r.classList.contains('newrow'));
      return { rows: rows.length,
               withChip: rows.filter(r => r.querySelector('.mpopen')).length };
    }""")
    ck("every measure carries the way in — the first one has to be makeable (§61)",
       chips.get("rows") and chips.get("rows") == chips.get("withChip"), chips)

    # ── 3b · THE MARK IS DRAWN, AND IT SAYS WHAT IT IS (§278.2) ─────────
    # Islam picked a 24px mark over the worded chip. With the word gone the
    # hover is the only thing that says what the control does, and the SVG is
    # the only thing on the button at all — so both are asserted, and the ink
    # is asserted as TWELVE CELLS rather than as "an svg is present" (§52,
    # §185: a mark that renders as nothing passes every presence test).
    mk = ev(pg, """() => {
      const b = document.querySelector('.pane .mpopen');
      if (!b) return { none: true };
      const r = b.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
               cells: b.querySelectorAll('svg rect').length,
               text: (b.textContent || "").trim(),
               name: b.getAttribute('aria-label') || "",
               title: b.getAttribute('title') || "" };
    }""")
    ck("the way in is a 24px mark, the size of the eye beside it",
       mk.get("w") == 24 and mk.get("h") == 22, mk)
    ck("...drawn as twelve cells, not a font character (§52)",
       mk.get("cells") == 12, mk)
    ck("...carrying no text, and saying what it is on the hover AND to a reader",
       mk.get("text") == "" and "month by month" in mk.get("name", "") and
       mk.get("title") == mk.get("name"), mk)

    # AND THE LIT STATE IS THE POINT OF PICKING IT: a row with a plan has to be
    # tellable from one without, across the table. Measured as PAINT, never as
    # a class — a build that lost the rule keeps the class (§145.14).
    lit = ev(pg, """() => {
      const p = UNITS.mobile.items.find(x => x.code === '03');
      const m = p.measures.find(x => x.name.indexOf('Accessory') === 0);
      m.monthly = [1,2,3,4,5,6,7,8,9,10,11,12]; paint();
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => x.querySelector('thead') &&
                   x.querySelector('thead').textContent.indexOf('Measure') >= 0);
      const rows = [...t.querySelectorAll('tbody tr')].filter(r => !r.classList.contains('newrow'));
      const on = rows.map(r => r.querySelector('.mpopen'))
                     .filter(b => b && b.classList.contains('on'));
      const bg = b => getComputedStyle(b).backgroundColor;
      const off = rows.map(r => r.querySelector('.mpopen'))
                      .find(b => b && !b.classList.contains('on'));
      /* READ THE PAINT BEFORE PUTTING THE STATE BACK. `paint()` detaches these
         nodes and a detached element computes to an empty string — the first
         run of this assertion reported a correct build as broken (§222's own
         lesson, and §68.10's family). */
      const out = { nOn: on.length, onBg: on[0] ? bg(on[0]) : null,
                    offBg: off ? bg(off) : null };
      delete m.monthly; paint();
      return out;
    }""")
    ck("exactly the row with a plan is lit, and it is PAINTED differently",
       lit.get("nOn") == 1 and lit.get("onBg") and lit.get("onBg") != lit.get("offBg") and
       lit.get("onBg") != "rgba(0, 0, 0, 0)", lit)

    yn = ev(pg, """() => {
      const p = UNITS.mobile.items.find(x => x.code === '03');
      const m = p.measures[1];
      const had = m.target;
      m.target = "Y/N"; paint();
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => x.querySelector('thead') &&
                   x.querySelector('thead').textContent.indexOf('Measure') >= 0);
      const row = [...t.querySelectorAll('tbody tr')].filter(r => !r.classList.contains('newrow'))[1];
      const has = !!row.querySelector('.mpopen');
      const other = [...t.querySelectorAll('tbody tr')]
        .filter(r => !r.classList.contains('newrow'))[0];
      const sib = !!(other && other.querySelector('.mpopen'));
      m.target = had; paint();
      return { has, sib };
    }""")
    # BOTH ENDS: a build drawing no chips anywhere satisfies "the yes/no row
    # has none", so the row beside it must be asserted to have one.
    ck("a yes/no row gets no chip — there is no number for twelve months to shape",
       yn.get("has") is False and yn.get("sib") is True, yn)

    # ── 4 · the drawer WRITES, and the year is derived ──────────────────
    ev(pg, """() => {
      const rows = [...document.querySelectorAll('.pane table tbody tr')];
      const r = rows.find(x => { const a = x.querySelector('td:nth-child(2) textarea');
                                 return a && a.value.indexOf('Accessory') === 0; });
      const c = r && r.querySelector('.mpopen'); if (c) c.click();
    }""")
    pg.wait_for_timeout(500)
    ck("one drawer, twelve boxes", ev(pg, """() => ({
        rows: document.querySelectorAll('tr.mprow').length,
        boxes: document.querySelectorAll('tr.mprow .mpm input').length })""") ==
       {"rows": 1, "boxes": 12})
    typemonths(pg, PLAN)
    pg.wait_for_timeout(400)
    on = ev(pg, """() => {
      const p = UNITS.mobile.items.find(x => x.code === '03');
      const m = p.measures.find(x => x.name.indexOf('Accessory') === 0);
      const sib = p.measures.find(x => x.name.indexOf('Sary revenue') === 0);
      const cell = document.querySelector('td[data-mptgt][data-mplock="1"]');
      return { stored: m.monthly, target: m.target,
               due: measureDueLabel(m), score: measureScore(m),
               msg: (document.querySelector('.mpmsg') || {}).textContent || "",
               boxValue: cell ? cell.querySelector('input').value : null,
               boxDisabled: cell ? cell.querySelector('input').disabled : null,
               sibDue: measureDueLabel(sib), sibScore: measureScore(sib),
               sibTarget: sib.target };
    }""")
    ck("the twelve reach the STORED plan", on.get("stored") == PLAN, on)
    # ASKED WITH THE TWELVE BESIDE IT: "300M EGP" is what this row already
    # holds, so on a build where nothing was typed the assertion is true and
    # guards nothing (§94.5).
    ck("the annual target is derived, keeping its unit",
       on.get("target") == "300M EGP" and on.get("stored") == PLAN, on)
    ck("the benchmark is the six months that have run, not half the year",
       on.get("due") == "96M EGP", on)
    ck("...so the row reads on plan where it read behind",
       on.get("score") == 100 and before.get("score") == 64, on)
    ck("the target box is locked and shows what it derives",
       on.get("boxDisabled") is True and on.get("boxValue") == "300M EGP", on)
    ck("the drawer says it is complete and what it adds to",
       "12 of 12" in on.get("msg", "") and "300M EGP" in on.get("msg", ""), on)
    ck("A ROW WITHOUT ONE IS BYTE-IDENTICAL — measured, not claimed",
       on.get("sibDue") == before.get("sibDue") and
       on.get("sibScore") == before.get("sibScore") and
       on.get("sibTarget") == before.get("sibTarget"), (on, before))

    # ── 5 · a blank month, and then a typed nought in the same box ──────
    part = list(PLAN)
    part[2] = ""
    typemonths(pg, part)
    pg.wait_for_timeout(400)
    off = ev(pg, """() => {
      const m = UNITS.mobile.items.find(x => x.code === '03')
                .measures.find(x => x.name.indexOf('Accessory') === 0);
      const cell = document.querySelector('td[data-mptgt][data-mplock="1"]');
      return { stored: m.monthly, target: m.target, due: measureDueLabel(m),
               score: measureScore(m), locked: !!cell,
               msg: (document.querySelector('.mpmsg') || {}).textContent || "" };
    }""")
    ck("one blank month puts the row back on flat proration",
       off.get("due") == "150M EGP" and off.get("score") == 64, off)
    ck("...the box is live again, and the last derived year is kept",
       off.get("locked") is False and off.get("target") == "300M EGP", off)
    ck("...and the drawer says how many are set and that it is not in force",
       "11 of 12" in off.get("msg", "") and "not in force" in off.get("msg", ""), off)
    ck("a cleared month is stored as null, never as 0",
       off.get("stored") and off.get("stored")[2] is None, off)

    zero = list(PLAN)
    zero[2] = 0
    typemonths(pg, zero)
    pg.wait_for_timeout(400)
    z = ev(pg, """() => {
      const m = UNITS.mobile.items.find(x => x.code === '03')
                .measures.find(x => x.name.indexOf('Accessory') === 0);
      return { stored: m.monthly, target: m.target, due: measureDueLabel(m) };
    }""")
    ck("A TYPED 0 IS A REAL MONTH: in force, and the year is 16 lighter",
       z.get("stored") and z.get("stored")[2] == 0 and
       z.get("target") == "284M EGP" and z.get("due") == "80M EGP", z)

    # ── 6 · the reading side ───────────────────────────────────────────
    typemonths(pg, PLAN)
    pg.wait_for_timeout(300)
    pg.evaluate("EDIT_PAGE.plan = false; MONTHOPEN = null; paint();")
    pg.wait_for_timeout(400)
    # ON PERFORMANCE, which is the one screen table that prints a benchmark —
    # the mark exists to explain a number that is no longer half the year, so
    # it belongs where that number is drawn and nowhere else.
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub2],[data-sub],.tabs button')]
        .find(x => /^Performance/.test((x.textContent || '').trim()));
      if (b) b.click();
    }""")
    pg.wait_for_timeout(700)
    mark = ev(pg, """() => {
      const t = [...document.querySelectorAll('.pane table')]
        .find(x => x.textContent.indexOf('Accessory revenue') >= 0);
      const row = t && [...t.querySelectorAll('tbody tr')]
        .find(r => r.textContent.indexOf('Accessory revenue') >= 0);
      const sib = t && [...t.querySelectorAll('tbody tr')]
        .find(r => r.textContent.indexOf('Sary revenue') >= 0);
      return { mark: row ? !!row.querySelector('.subhd') : null,
               words: row ? (row.querySelector('.subhd') || {}).textContent : null,
               sibMark: sib ? !!sib.querySelector('.subhd') : null };
    }""")
    ck("the annual target says its shape is monthly",
       mark.get("mark") is True and mark.get("words") == "by month", mark)
    ck("...and a row without one says nothing at all",
       mark.get("sibMark") is False, mark)

    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub2],[data-sub],.tabs button')]
        .find(x => /^Strategy/.test((x.textContent || '').trim()));
      if (b) b.click();
    }""")
    pg.wait_for_timeout(500)
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub2],[data-sub],.tabs button')]
        .find(x => /^Plan/.test((x.textContent || '').trim()));
      if (b) b.click();
    }""")
    pg.wait_for_timeout(500)

    # ── 7 · the workbook round trip is a FIXED POINT (§22) ──────────────
    wb = ev(pg, """() => {
      const u = UNITS.mobile;
      const sheets = planWorkbook(u);
      const ms = sheets.filter(s => s.name === "Measures")[0];
      const jan = ms.head.indexOf("Jan"), dec = ms.head.indexOf("Dec");
      const row = ms.rows.filter(r => r[1] === "Accessory revenue")[0];
      const byName = {};
      sheets.forEach(s => byName[s.name] = [s.head].concat(s.rows));
      const rows = planFromWorkbook(u, byName);
      const rr = rows.filter(r => r.type === "MEASURE" && r.name === "Accessory revenue")[0];
      const sib = rows.filter(r => r.type === "MEASURE" && r.name === "Sary revenue")[0];
      return { jan, dec, twelve: row ? row.slice(jan, dec + 1) : null,
               back: rr ? rr.monthly : null, sibBack: sib ? sib.monthly : null,
               applied: typeof monthsFromText === "function"
                 ? monthsFromText(rr ? rr.monthly : "") : "no reader" };
    }""")
    ck("the Measures sheet carries twelve month columns, appended at the end",
       wb.get("jan") == 7 and wb.get("dec") == 18, wb)
    ck("...and writes the plan into them", wb.get("twelve") == PLAN, wb)
    ck("...and the reader brings all twelve back",
       wb.get("applied") == PLAN, wb)
    ck("a row with no monthly plan carries nothing through the file",
       wb.get("sibBack") == "", wb)

    tac = ev(pg, """() => {
      const u = UNITS.mobile;
      const sheets = planWorkbook(u);
      const ts = sheets.filter(s => s.name === "Tactics")[0];
      const os = sheets.filter(s => s.name === "Objectives")[0];
      return { tacJan: ts.head.indexOf("Outcome Jan"),
               tacDec: ts.head.indexOf("Outcome Dec"),
               tacQ1: ts.head.indexOf("Q1"), tacHidden: ts.head.indexOf("Hidden"),
               objJan: os.head.indexOf("Jan"), objHidden: os.head.indexOf("Hidden") };
    }""")
    ck("the Tactics sheet names the outcome's twelve, and Q1–Q4 have NOT moved",
       tac.get("tacJan") == 14 and tac.get("tacDec") == 25 and
       tac.get("tacQ1") == 9 and tac.get("tacHidden") == 13, tac)
    ck("the Objectives sheet appends its twelve after Hidden",
       tac.get("objJan") == 8 and tac.get("objHidden") == 7, tac)

    # ── 8 · Clear DELETES the key (§50.6) ──────────────────────────────
    press(pg, '.pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    ev(pg, """() => {
      const rows = [...document.querySelectorAll('.pane table tbody tr')];
      const r = rows.find(x => { const a = x.querySelector('td:nth-child(2) textarea');
                                 return a && a.value.indexOf('Accessory') === 0; });
      const c = r && r.querySelector('.mpopen'); if (c) c.click();
    }""")
    pg.wait_for_timeout(400)
    pg.on("dialog", lambda d: d.accept())
    press(pg, "[data-mpclear]")
    pg.wait_for_timeout(500)
    cleared = ev(pg, """() => {
      const m = UNITS.mobile.items.find(x => x.code === '03')
                .measures.find(x => x.name.indexOf('Accessory') === 0);
      return { key: "monthly" in m, target: m.target,
               due: measureDueLabel(m), score: measureScore(m) };
    }""")
    ck("cleared: the key is DELETED, not an array of nulls",
       cleared.get("key") is False, cleared)
    ck("...the row is flat again and keeps the figure the twelve derived",
       cleared.get("due") == "150M EGP" and cleared.get("target") == "300M EGP", cleared)

    # ── 9 · the other three surfaces draw one too (Islam's "all four") ──
    surf = ev(pg, """() => {
      const out = {};
      // a tactic's outcome, on the page already open
      const rows = [...document.querySelectorAll('.pane table tbody tr')];
      const t = UNITS.mobile.items.find(p => p.code === '03').tactics[0];
      const tr = rows.find(x => { const a = x.querySelector('td:nth-child(2) textarea');
                                  return a && a.value === t.name; });
      out.tactic = !!(tr && tr.querySelector('.mpopen'));
      return out;
    }""")
    ck("a tactic's outcome carries a chip", surf.get("tactic") is True, surf)

    tw = ev(pg, """() => {
      const t = UNITS.mobile.items.find(p => p.code === '03').tactics[0];
      t.outcome = 'Attach rate'; t.outTarget = '6#'; t.outCompile = 'Sum'; t.outDir = '\\u2265';
      paint();
      const rows = [...document.querySelectorAll('.pane table tbody tr')];
      const tr = rows.find(x => { const a = x.querySelector('td:nth-child(2) textarea');
                                  return a && a.value === t.name; });
      const c = tr && tr.querySelector('.mpopen'); if (c) c.click();
      return { opened: !!c };
    }""")
    pg.wait_for_timeout(500)
    typemonths(pg, [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
    pg.wait_for_timeout(400)
    tout = ev(pg, """() => {
      const t = UNITS.mobile.items.find(p => p.code === '03').tactics[0];
      const cell = document.querySelector('td[data-mptgt][data-mplock="1"]');
      return { stored: t.outMonthly, outTarget: t.outTarget,
               due: measureDueLabel(outcomeOf(t), tacticShare(t)),
               boxValue: cell ? cell.querySelector('input').value : null };
    }""")
    ck("an outcome's twelve reach the tactic, under its own name",
       tout.get("stored") == [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], tout)
    ck("...the outcome's year is derived and its box holds the VALUE alone",
       tout.get("outTarget") == "6#" and tout.get("boxValue") == "6", tout)
    ck("...and the six months that have run are what it is measured against",
       tout.get("due") == "3#", tout)

    # a unit's key objectives, on Foundation — the surface the first build
    # drew twelve read-only spans on (§96).
    pg.evaluate("EDIT_PAGE.plan = false; MONTHOPEN = null; paint();")
    pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub2],[data-sub],.tabs button')]
        .find(x => /^(Overview|Foundation)/.test((x.textContent || '').trim()));
      if (b) b.click();
    }""")
    pg.wait_for_timeout(600)
    pg.evaluate("""() => { const p = document.querySelector('.penbtn'); if (p) p.click(); }""")
    pg.wait_for_timeout(600)
    pg.evaluate("""() => { const c = document.querySelector('.mpopen'); if (c) c.click(); }""")
    pg.wait_for_timeout(500)
    kb = ev(pg, """() => ({
      boxes: document.querySelectorAll('tr.mprow .mpm input').length,
      spans: document.querySelectorAll('tr.mprow .mpm span.mono').length })""")
    ck("a key objective's drawer draws BOXES, not read-only spans (§96)",
       kb.get("boxes") == 12 and kb.get("spans") == 0, kb)
    typemonths(pg, [10] * 12)
    pg.wait_for_timeout(400)
    ko = ev(pg, """() => {
      const m = (UNITS.mobile.keyObjectives || []).find(x => x.monthly);
      return m ? { monthly: m.monthly, target: m.target, due: measureDueLabel(m) }
               : { none: true };
    }""")
    ck("...and typing in it reaches the stored objective",
       ko.get("monthly") == [10] * 12, ko)

    # ── 10 · it FITS, at four widths (§158) ────────────────────────────
    for w in (1600, 1280, 1100, 1000):
        pg.set_viewport_size({"width": w, "height": 1500})
        pg.wait_for_timeout(300)
        fit = ev(pg, """() => {
          const tr = document.querySelector('tr.mprow');
          if (!tr) return { none: true };
          const box = tr.closest('.scroll') || tr.closest('table').parentElement;
          const tbl = tr.closest('table');
          const g = tr.querySelector('.mpgrid');
          const last = g.lastElementChild.getBoundingClientRect();
          return { over: tbl.scrollWidth > box.clientWidth + 1,
                   inside: last.right <= box.getBoundingClientRect().right + 1 };
        }""")
        ck("at %dpx the table does not scroll sideways and Dec is inside it" % w,
           fit.get("over") is False and fit.get("inside") is True, fit)

    ck("no page errors", not errs, errs)
    print(("FAILED %d" % bad) if bad else "all good")
    b.close()
