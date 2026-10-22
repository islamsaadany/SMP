"""A TARGET BY QUARTER AS WELL AS BY MONTH (§575).

Islam: *"for setting targets in the plans we have the option to plan it in
months I need to have the option to plan it in quarters as well."* His three
answers, taken before the mockup was drawn: (1a) a review inside a quarter owes
that quarter in proportion, (2a) switching carries the figures across, and the
workbook's columns are Q1 target to Q4 target.

WHAT THIS ASSERTS, AND WHY EACH ONE IS HERE:

  · THE ARITHMETIC, asked of the shared rule by name: a quarter spread over its
    three months (152 owed at August on 45 / 51 / 84 / 120), EXACT at a quarter
    end, each compile rule its own way, §569's blank and §278's unreadable
    rules unchanged — and a row planned by month reading exactly as it did.
  · Every press is a REAL press and the STORED plan is read back (§96): a
    switch wired to nothing draws the same four boxes and keeps nothing.
  · The switch CARRIES the plan both ways and DELETES what it came from, so a
    row never holds both; and an empty plan switched stores nothing at all
    (§50.6: a row nobody typed into stays byte-identical).
  · The mark lights the moment a figure lands, without a repaint — the defect
    found while drawing the mockup, asserted so it cannot come back.
  · All four surfaces (§278(b)), a unit's AND a function's objectives (A15).
  · The workbook round trip is a FIXED POINT (§22), the four appended after
    December so nothing moves (§65), and a file carrying both is refused.

IT MAKES THE STATE IT MEASURES (§94.2): no row of the worked example carries a
quarterly plan, so every assertion would pass on a build without the feature
if it waited for the demo to show it one. Pass a built file as the first
argument to run it against another build.
"""
import os
import sys
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(
      os.path.dirname(__file__), "..", "strategy-management-platform.html"))
PLAN = [15, 14, 16, 16, 17, 18, 24, 28, 32, 36, 40, 44]   # adds to 300
QUART = [45, 51, 84, 120]                                  # the same 300, by quarter
SPREAD = [15, 15, 15, 17, 17, 17, 28, 28, 28, 40, 40, 40]
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w +
          (("  — %s" % (x,)) if not ok and x != "" else ""))


def ev(pg, js, arg=None):
    """Every probe degrades rather than dying (§215): a check that throws
    reports FEWER failures than the build has."""
    try:
        return pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    except Exception as e:
        return {"threw": str(e)[:160]}


PEN = '#secrow-in .secpen, #panel [data-edit], #panel .penbtn, .pane .paneact .penbtn'
ROW = """(name) => [...document.querySelectorAll('.pane table tbody tr, #panel table tbody tr')]
  .find(x => { const a = x.querySelector('td:nth-child(2) textarea, td:nth-child(2) input');
               return a && (a.value || '').indexOf(name) === 0; })"""
ACC = ("UNITS.mobile.items.find(p => p.code === '03').measures"
       ".find(x => x.name.indexOf('Accessory') === 0)")


def openpen(pg, page):
    if not ev(pg, "(p) => !!(typeof EDIT_PAGE !== 'undefined' && EDIT_PAGE[p])", page):
        try:
            pg.click(PEN)
        except Exception:
            pass
        pg.wait_for_timeout(600)


def chip(pg, name):
    ev(pg, "(n) => { const r = (" + ROW + ")(n); const c = r && r.querySelector('.mpopen'); if (c) c.click(); }", name)
    pg.wait_for_timeout(450)


def mode(pg, m):
    """Press a half of the switch, the real button."""
    ev(pg, "(m) => { const b = document.querySelector('tr.mprow .mpseg button[data-mpmode=\"' + m + '\"]'); if (b) b.click(); }", m)
    pg.wait_for_timeout(450)


def typeboxes(pg, vals):
    return ev(pg, """(vals) => {
      const b = [...document.querySelectorAll('tr.mprow .mpm input')];
      if (b.length !== vals.length) return { n: b.length };
      b.forEach((el, i) => {
        el.value = vals[i] == null ? "" : String(vals[i]);
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return { n: b.length };
    }""", vals)


def drawer(pg):
    return ev(pg, """() => ({
      boxes: document.querySelectorAll('tr.mprow .mpm input').length,
      spans: document.querySelectorAll('tr.mprow .mpm span.mono').length,
      labels: [...document.querySelectorAll('tr.mprow .mpm > span')].map(s => s.textContent),
      head: (document.querySelector('tr.mprow .mphead > span') || {}).textContent || "",
      pressed: [...document.querySelectorAll('tr.mprow .mpseg button')]
        .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.textContent),
      disabled: [...document.querySelectorAll('tr.mprow .mpseg button')]
        .filter(b => b.disabled).map(b => b.textContent + '|' + (b.title || '')),
      msg: (document.querySelector('tr.mprow .mpmsg') || {}).textContent || "",
      note: (document.querySelector('tr.mprow .mpnote') || {}).textContent || "",
      clear: (document.querySelector('tr.mprow .mpbtn') || {}).textContent || "" })""")


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 1500})
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1')}catch(e){}")
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(1400)

    have = ev(pg, """() => ({
      rules: typeof SMPRules !== "undefined" && typeof SMPRules.planBy === "function" &&
             typeof SMPRules.quartersFromMonths === "function" &&
             typeof SMPRules.monthsFromQuarters === "function",
      drawer: typeof monthlySwitch === "function" })""")
    ck("the shared rules and the drawer's switch exist",
       have.get("rules") is True and have.get("drawer") is True, have)

    # ── 1 · the arithmetic, asked of the rule itself ────────────────────
    print("\n── 1 · the arithmetic")
    ar = ev(pg, """(a) => {
      const R = SMPRules, Q = a.q, due = (c, q, k) => R.monthlyDue({ compile: c, quarterly: q }, k);
      return {
        sum: [2, 3, 5, 6, 8, 9, 12].map(k => due("Sum", Q, k)),
        annual: R.monthlySoFar({ compile: "Sum", quarterly: Q }),
        /* EXACT AT A QUARTER END: 50 split in three and added back is
           50.00000000000001 in floating point, and that would print. */
        exact: due("Sum", [50, 50, 50, 50], 6),
        count: due("Count", [0, 0, 3, ""], 8),
        avg: due("Average", Q, 8),
        latest: [due("Latest", Q, 8), due("Latest", Q, 2)],
        part: R.monthlySoFar({ compile: "Sum", quarterly: [45, 51, null, null] }),
        partIn: R.monthlyInForce({ compile: "Sum", quarterly: [45, 51, null, null] }),
        later: due("Sum", ["", "", 30, 30], 6),
        bad: R.monthlySoFar({ compile: "Sum", quarterly: [45, "TBD", null, null] }),
        noRule: R.monthlySoFar({ quarterly: Q }),
        by: [R.planBy({ quarterly: Q }), R.planBy({ monthly: [1], quarterly: Q }),
             R.planBy({}), R.planBy({ quarterly: [null, null, null, null] })],
        both: R.monthlySoFar({ compile: "Sum", monthly: [1,1,1,1,1,1,1,1,1,1,1,1], quarterly: Q }),
        monthsStill: [R.monthlyDue({ compile: "Sum", monthly: a.plan }, 6),
                      R.monthlyDue({ compile: "Count", monthly: [2,2,2,2,2,3,"","","","","",""] }, 9)],
        toQ: [R.quartersFromMonths(a.plan, "Sum"), R.quartersFromMonths(a.plan, "Average"),
              R.quartersFromMonths(a.plan, "Latest")],
        toQpart: R.quartersFromMonths([1, "", 2, "", "", "", null, null, "x", null, null, null], "Sum"),
        toM: R.monthsFromQuarters([45, 50, 12.5, ""], "Sum"),
        toMlatest: R.monthsFromQuarters([45, "", 84, "x"], "Latest"),
        noCarry: [R.quartersFromMonths(a.plan, ""), R.monthsFromQuarters(Q, "")],
        trip: R.monthlySoFar({ compile: "Sum", monthly: R.monthsFromQuarters(Q, "Sum") })
      };
    }""", {"q": QUART, "plan": PLAN})
    ck("Sum: a quarter is spread over its months — 30, 45, 79, 96, 152, 180, 300",
       ar.get("sum") == [30, 45, 79, 96, 152, 180, 300], ar.get("sum"))
    ck("...and all four are the annual target", ar.get("annual") == 300, ar)
    ck("...EXACT at a quarter end, not a hair over", ar.get("exact") == 100, ar.get("exact"))
    ck("Count is owed in whole ones: 3 shops in Q3 owe 2 by August (§276)",
       ar.get("count") == 2, ar.get("count"))
    ck("Average weighs each quarter by its months passed: 57 at August",
       ar.get("avg") == 57, ar.get("avg"))
    ck("Latest stands on the quarter being stood in: Q3 in August, Q1 in February",
       ar.get("latest") == [84, 45], ar.get("latest"))
    ck("a half-filled plan is in force and an empty quarter is nothing planned (§569)",
       ar.get("part") == 96 and ar.get("partIn") is True, ar)
    ck("quarters planned only later owe nought yet", ar.get("later") == 0, ar)
    # ASKED BESIDE A CASE THAT MUST ANSWER (§94.5): on a build with no
    # quarters every quarterly row is null, so `is None` alone guards nothing.
    ck("a quarter holding a word, or no compile rule, keeps the plan out of force",
       ar.get("bad") is None and ar.get("noRule") is None and ar.get("part") == 96, ar)
    ck("a row is planned by quarter only when quarters are typed and months are not",
       ar.get("by") == ["quarter", "month", "month", "month"], ar.get("by"))
    ck("...and should a row hold both, the months are read", ar.get("both") == 12, ar)
    ck("A ROW PLANNED BY MONTH READS EXACTLY AS IT DID (96, and Islam's 13)",
       ar.get("monthsStill") == [96, 13], ar.get("monthsStill"))
    ck("months to quarters, by the row's rule: added up, averaged, the last one",
       ar.get("toQ") == [QUART, [15, 17, 28, 40], [16, 18, 32, 44]], ar.get("toQ"))
    ck("...a blank month adds nothing, an empty quarter stays empty, a word travels",
       ar.get("toQpart") == [3, None, "x", None], ar.get("toQpart"))
    ck("quarters to months splits and adds back exactly: 50 is 16, 17, 17",
       ar.get("toM") == [15, 15, 15, 16, 17, 17, 4.1, 4.2, 4.2, None, None, None], ar.get("toM"))
    ck("...Latest gives each month the quarter's figure",
       ar.get("toMlatest") == [45, 45, 45, None, None, None, 84, 84, 84, None, None, "x"],
       ar.get("toMlatest"))
    ck("...no compile rule carries nothing rather than guessing (§278)",
       ar.get("noCarry") == [None, None], ar.get("noCarry"))
    ck("...and the round trip keeps the year", ar.get("trip") == 300, ar)

    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]')
    pg.wait_for_timeout(500)
    pg.click('.rail [data-urail="mobile|mobile-P3"]')
    pg.wait_for_timeout(400)
    before = ev(pg, "() => { const m = " + ACC + "; return { due: measureDueLabel(m), "
                "monthly: 'monthly' in m, quarterly: 'quarterly' in m, target: m.target }; }")
    ck("the demo carries no plan on the row, so the state is MADE",
       before.get("monthly") is False and before.get("quarterly") is False, before)
    ck("...and it reads flat: 150M EGP owed at June", before.get("due") == "150M EGP", before)

    # ── 2 · the switch ──────────────────────────────────────────────────
    print("\n── 2 · the switch, on a measure")
    openpen(pg, "plan")
    chip(pg, "Accessory")
    d0 = drawer(pg)
    ck("the drawer opens by month, with the switch on its title line",
       d0.get("boxes") == 12 and d0.get("pressed") == ["By month"], d0)
    mode(pg, "q")
    d1 = drawer(pg)
    e1 = ev(pg, "() => { const m = " + ACC + "; return { monthly: 'monthly' in m, quarterly: 'quarterly' in m }; }")
    ck("By quarter draws four boxes, each naming its months",
       d1.get("boxes") == 4 and d1.get("pressed") == ["By quarter"] and
       d1.get("labels", [""])[0].startswith("Q1") and "Jan–Mar" in d1.get("labels", [""])[0], d1)
    ck("...and BOXES, not read-only spans (§96)",
       d1.get("spans") == 0 and d1.get("boxes") == 4, d1)
    ck("...headed as the quarterly plan", d1.get("head", "").startswith("Quarterly plan"), d1)
    ck("AN EMPTY PLAN SWITCHED STORES NOTHING (§50.6)",
       e1.get("monthly") is False and e1.get("quarterly") is False and
       d1.get("pressed") == ["By quarter"], (e1, d1))

    typeboxes(pg, [45, 51, "", ""])
    pg.wait_for_timeout(400)
    h = ev(pg, "(n) => { const m = " + ACC + ", r = (" + ROW + ")(n), c = r.querySelector('td[data-mptgt]');"
           " return { stored: m.quarterly, target: m.target, due: measureDueLabel(m),"
           " box: c.querySelector('input').value, locked: c.querySelector('input').disabled,"
           " chip: r.querySelector('.mpopen').className, title: r.querySelector('.mpopen').title,"
           " msg: (document.querySelector('tr.mprow .mpmsg') || {}).textContent }; }", "Accessory")
    ck("two quarters typed reach the STORED plan, the blanks as null",
       h.get("stored") == [45, 51, None, None], h)
    ck("...the target is what they come to, and the box is locked on it",
       h.get("target") == "96M EGP" and h.get("box") == "96M EGP" and h.get("locked") is True, h)
    ck("...the drawer says so, and that an empty quarter is nothing planned",
       "2 of 4 quarters set" in (h.get("msg") or "") and
       "A quarter left empty counts as nothing planned" in (h.get("msg") or ""), h)
    ck("THE MARK LIGHTS AS THE FIGURE LANDS, with no repaint",
       " on" in (h.get("chip") or "") and (h.get("title") or "").startswith("2 of 4 quarters set"), h)
    ck("...and June owes the two quarters run", h.get("due") == "96M EGP", h)

    typeboxes(pg, QUART)
    pg.wait_for_timeout(400)
    full = ev(pg, "() => { const m = " + ACC + "; return { stored: m.quarterly, target: m.target,"
              " msg: (document.querySelector('tr.mprow .mpmsg') || {}).textContent }; }")
    ck("all four: the annual target", full.get("stored") == QUART and full.get("target") == "300M EGP" and
       "4 of 4 quarters set" in (full.get("msg") or ""), full)

    mode(pg, "m")
    tm = ev(pg, "() => { const m = " + ACC + "; return { monthly: m.monthly, q: 'quarterly' in m, target: m.target }; }")
    dm = drawer(pg)
    ck("By month carries the quarters across, each spread over its three months",
       tm.get("monthly") == SPREAD, tm)
    ck("...DELETES the quarters, so a row never holds both",
       tm.get("q") is False and tm.get("monthly") == SPREAD, tm)
    ck("...keeps the target, and says where the figures came from",
       tm.get("target") == "300M EGP" and "spread evenly" in dm.get("note", ""), (tm, dm))

    typeboxes(pg, PLAN)
    pg.wait_for_timeout(400)
    ck("typing over a carried figure takes the carried-across line away",
       drawer(pg).get("note") == "" and "spread evenly" in dm.get("note", ""), drawer(pg))
    mode(pg, "q")
    tq = ev(pg, "() => { const m = " + ACC + "; return { quarterly: m.quarterly, m: 'monthly' in m, target: m.target }; }")
    ck("a SHAPED monthly plan carried to quarters is exact: 45, 51, 84, 120",
       tq.get("quarterly") == QUART and tq.get("m") is False and tq.get("target") == "300M EGP", tq)
    ck("...and the line says each quarter is its months added up",
       "added up to" in drawer(pg).get("note", ""), drawer(pg))

    nr = ev(pg, "() => { const m = " + ACC + "; delete m.compile; paint(); return true; }")
    pg.wait_for_timeout(300)
    dn = drawer(pg)
    ck("no compile rule: the other half is disabled and says why",
       len(dn.get("disabled", [])) == 1 and dn.get("disabled", [""])[0].startswith("By month|Set a compile rule"),
       dn)
    ev(pg, "() => { const m = " + ACC + "; m.compile = 'Sum'; paint(); return true; }")
    pg.wait_for_timeout(300)

    # ── 3 · the reading side ────────────────────────────────────────────
    print("\n── 3 · Performance")
    pg.evaluate("EDIT_PAGE.plan = false; MONTHOPEN = null; paint();")
    pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub2],[data-sub],.tabs button')]
        .find(x => /^Performance/.test((x.textContent || '').trim()));
      if (b) b.click();
    }""")
    pg.wait_for_timeout(700)
    mk = ev(pg, """() => {
      const t = [...document.querySelectorAll('.pane table')].find(x => x.textContent.indexOf('Accessory revenue') >= 0);
      const row = t && [...t.querySelectorAll('tbody tr')].find(r => r.textContent.indexOf('Accessory revenue') >= 0);
      const sib = t && [...t.querySelectorAll('tbody tr')].find(r => r.textContent.indexOf('Sary revenue') >= 0);
      return { words: row ? (row.querySelector('.subhd') || {}).textContent || null : null,
               sib: sib ? !!sib.querySelector('.subhd') : null };
    }""")
    ck("the annual target says by quarter", mk.get("words") == "by quarter", mk)
    ck("...and a row without a plan says nothing",
       mk.get("sib") is False and mk.get("words") == "by quarter", mk)
    aug = ev(pg, "() => { const m = " + ACC + ", was = REVIEW.to; REVIEW.to = 'Aug 2026';"
             " const d = measureDueLabel(m); REVIEW.to = was; return { aug: d, jun: measureDueLabel(m) }; }")
    ck("ISLAM'S (1a): a review ending in August owes 45 + 51 + 56 = 152M EGP",
       aug.get("aug") == "152M EGP" and aug.get("jun") == "96M EGP", aug)

    # ── 4 · the workbook ────────────────────────────────────────────────
    print("\n── 4 · the workbook")
    wb = ev(pg, """() => {
      const u = UNITS.mobile, sheets = planWorkbook(u);
      const ms = sheets.filter(s => s.name === "Measures")[0];
      const ts = sheets.filter(s => s.name === "Tactics")[0];
      const os = sheets.filter(s => s.name === "Objectives")[0];
      const Q = ["Q1 target", "Q2 target", "Q3 target", "Q4 target"];
      const row = ms.rows.filter(r => r[1] === "Accessory revenue")[0];
      const byName = {};
      sheets.forEach(s => byName[s.name] = [s.head].concat(s.rows));
      const rows = planFromWorkbook(u, byName);
      const rr = rows.filter(r => r.type === "MEASURE" && r.name === "Accessory revenue")[0];
      const sib = rows.filter(r => r.type === "MEASURE" && r.name === "Sary revenue")[0];
      const tailOf = (head, n) => head.slice(head.length - n);
      const tq = ts.head.indexOf("Outcome Q1 target");
      /* BOTH, refused by name; one alone, not. */
      const both = Object.assign({}, rr, { monthly: "1|2|3|4|5|6|7|8|9|10|11|12" });
      const vBoth = validatePlan(u, [both]).problems.map(x => x.at + ": " + x.msg);
      const vOne = validatePlan(u, [rr]).problems.map(x => x.msg);
      return { tail: tailOf(ms.head, 16), q: row ? row.slice(-4) : null,
               months: row ? row.slice(-16, -4).every(c => c === "") : null,
               back: rr ? quartersFromText(rr.quarterly) : null, backM: rr ? rr.monthly : null,
               sib: sib ? [sib.monthly, sib.quarterly] : null,
               objTail: tailOf(os.head, 4), objDec: os.head[os.head.length - 5],
               tacQ: tq > -1 ? ts.head.slice(tq, tq + 4) : null, tacDec: ts.head[tq - 1],
               tacTiming: [ts.head.indexOf("Q1"), ts.head.indexOf("Q4")],
               vBoth, vOne };
    }""")
    ck("Measures: Jan to Dec, then Q1 target to Q4 target, at the END (§65)",
       wb.get("tail") == ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                          "Oct", "Nov", "Dec", "Q1 target", "Q2 target", "Q3 target", "Q4 target"],
       wb.get("tail"))
    ck("...the row writes its quarters there and leaves its months empty",
       wb.get("q") == QUART and wb.get("months") is True, wb)
    ck("...and the reader brings the four back, and no months",
       wb.get("back") == QUART and wb.get("backM") == "", wb)
    ck("a row with no plan carries nothing through the file", wb.get("sib") == ["", ""], wb)
    ck("Objectives appends the four after December",
       wb.get("objTail") == ["Q1 target", "Q2 target", "Q3 target", "Q4 target"] and
       wb.get("objDec") == "Dec", wb)
    ck("Tactics: Outcome Q1 target to Outcome Q4 target after Outcome Dec",
       wb.get("tacQ") == ["Outcome Q1 target", "Outcome Q2 target", "Outcome Q3 target",
                          "Outcome Q4 target"] and wb.get("tacDec") == "Outcome Dec", wb)
    ck("...and the tactic's own Q1–Q4 have NOT moved", wb.get("tacTiming") == [9, 12], wb)
    ck("A ROW WITH BOTH IS REFUSED, BY NAME",
       any("Accessory revenue" in x and "both months and quarters" in x for x in (wb.get("vBoth") or [])),
       wb.get("vBoth"))
    ck("...and a row with one is not",
       not any("both months and quarters" in x for x in (wb.get("vOne") or [])) and
       any("both months and quarters" in x for x in (wb.get("vBoth") or [])), wb)

    # ── 5 · Clear deletes the key (§50.6) ───────────────────────────────
    print("\n── 5 · clearing")
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
    openpen(pg, "plan")
    chip(pg, "Accessory")
    had = ev(pg, "() => { const m = " + ACC + "; return 'quarterly' in m; }")
    pg.on("dialog", lambda d: d.accept())
    ev(pg, "() => { const c = document.querySelector('tr.mprow [data-mpclear]'); if (c) c.click(); }")
    pg.wait_for_timeout(350)
    dlg = ev(pg, "() => (document.querySelector('.overlay.on') || {}).textContent || ''")
    ck("Clear asks about the QUARTERLY plan, and names the four",
       "Clear this quarterly plan?" in dlg and "four quarters" in dlg, dlg[:200])
    ev(pg, "() => { const y = document.querySelector('.overlay.on [data-dstyes]'); if (y) y.click(); }")
    pg.wait_for_timeout(500)
    cl = ev(pg, "(n) => { const m = " + ACC + ", r = (" + ROW + ")(n);"
            " return { key: 'quarterly' in m, due: measureDueLabel(m), target: m.target,"
            " locked: r.querySelector('td[data-mptgt] input').disabled }; }", "Accessory")
    ck("cleared: the key is DELETED, the row flat again on the figure it came to",
       had is True and cl.get("key") is False and cl.get("due") == "150M EGP" and
       cl.get("target") == "300M EGP", (had, cl))
    ck("...and the target box is the office's to type again",
       had is True and cl.get("locked") is False, (had, cl))

    # ── 6 · the other surfaces (Islam's "all four", and A15) ────────────
    print("\n── 6 · a tactic's outcome, a unit's objectives, a function's")
    tname = ev(pg, """() => {
      const t = UNITS.mobile.items.find(p => p.code === '03').tactics[0];
      t.outcome = 'Attach rate'; t.outTarget = '6#'; t.outCompile = 'Sum'; t.outDir = '\\u2265';
      MONTHOPEN = null; paint(); return t.name; }""")
    pg.wait_for_timeout(300)
    chip(pg, tname)
    mode(pg, "q")
    typeboxes(pg, [0, 2, 2, 2])
    pg.wait_for_timeout(400)
    to = ev(pg, """() => {
      const t = UNITS.mobile.items.find(p => p.code === '03').tactics[0];
      const cell = document.querySelector('td[data-mptgt][data-mplock="1"]');
      return { stored: t.outQuarterly, m: 'outMonthly' in t, outTarget: t.outTarget,
               due: measureDueLabel(outcomeOf(t), tacticShare(t)),
               box: cell ? cell.querySelector('input').value : null };
    }""")
    ck("an outcome's quarters reach the tactic, under its own name",
       to.get("stored") == [0, 2, 2, 2] and to.get("m") is False, to)
    ck("...its year is derived and its box holds the VALUE alone",
       to.get("outTarget") == "6#" and to.get("box") == "6", to)
    ck("...and at June it owes Q1 and Q2, the quarters superseding its window",
       to.get("due") == "2#", to)

    pg.evaluate("EDIT_PAGE.plan = false; MONTHOPEN = null; paint();")
    pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      const b = [...document.querySelectorAll('[data-sub2],[data-sub],.tabs button')]
        .find(x => /^(Overview|Foundation)/.test((x.textContent || '').trim()));
      if (b) b.click();
    }""")
    pg.wait_for_timeout(600)
    openpen(pg, "foundation")
    ev(pg, "() => { const c = document.querySelector('.mpopen'); if (c) c.click(); }")
    pg.wait_for_timeout(450)
    mode(pg, "q")
    dk = drawer(pg)
    typeboxes(pg, [10, 10, 10, 10])
    pg.wait_for_timeout(400)
    ko = ev(pg, "() => { const m = (UNITS.mobile.keyObjectives || []).find(x => x.quarterly);"
            " return m ? { q: m.quarterly } : { none: true }; }")
    ck("a unit's key objective: four BOXES that reach the stored objective",
       dk.get("boxes") == 4 and dk.get("spans") == 0 and ko.get("q") == [10, 10, 10, 10], (dk, ko))

    cap = ev(pg, "() => Object.keys(FUNCTIONS).filter(k => (FUNCTIONS[k].keyObjectives || []).length)[0]")
    ev(pg, "(k) => { current = 'fn:' + k; currentSub = 'fnstrat'; CURSEC.fnstrat = 'found';"
           " EDIT_PAGE.capfoundation = true; MONTHOPEN = null; paint(); return true; }", cap)
    pg.wait_for_timeout(600)
    ev(pg, "() => { const c = document.querySelector('#panel .mpopen, .pane .mpopen'); if (c) c.click(); }")
    pg.wait_for_timeout(450)
    mode(pg, "q")
    df = drawer(pg)
    typeboxes(pg, [5, 5, 5, 5])
    pg.wait_for_timeout(400)
    fo = ev(pg, "(k) => { const m = (FUNCTIONS[k].keyObjectives || []).find(x => x.quarterly);"
            " return m ? { q: m.quarterly, target: m.target } : { none: true }; }", cap)
    ck("a FUNCTION's objective does the same (A15)",
       df.get("boxes") == 4 and df.get("spans") == 0 and fo.get("q") == [5, 5, 5, 5], (cap, df, fo))

    # ── 7 · it fits (§158) ──────────────────────────────────────────────
    for w in (1600, 1280, 1100):
        pg.set_viewport_size({"width": w, "height": 1500})
        pg.wait_for_timeout(300)
        fit = ev(pg, """() => {
          const tr = document.querySelector('tr.mprow');
          if (!tr) return { none: true };
          const box = tr.closest('.scroll') || tr.closest('table').parentElement;
          const tbl = tr.closest('table'), g = tr.querySelector('.mpgrid');
          const k = [...g.children].map(c => Math.round(c.getBoundingClientRect().top));
          return { over: tbl.scrollWidth > box.clientWidth + 1, oneLine: new Set(k).size === 1,
                   seg: !!tr.querySelector('.mpseg') };
        }""")
        ck("at %dpx: no sideways scroll, the four on one line, the switch drawn" % w,
           fit.get("over") is False and fit.get("oneLine") is True and fit.get("seg") is True, fit)

    ck("no page errors", not errs, errs)
    print(("FAILED %d" % bad) if bad else "all good")
    b.close()
    sys.exit(1 if bad else 0)
