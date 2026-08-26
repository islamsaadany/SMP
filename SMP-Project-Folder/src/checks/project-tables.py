"""ONE TABLE, ONE ROW SHAPE (§101).

§99 split a project's table in two because Direction, Target and the date had
nothing to say for a deliverable. §101 gives a deliverable a real direction
(`=`) and a real target (`Y/N`) instead, so the cells have ANSWERS and the
split is undone — fewer parts, same problem solved.

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8, earned the day a
check asserted a POSITION and a reversal made it false the same afternoon).
It never asks where a column sits or how wide it is. It asks:

  * is every cell answering a question its row can answer — no dead em-dash
    left anywhere, on any of the three panes;
  * does the date reader understand every shape people write -- the month and
    year a milestone now uses, the week-month it used yesterday, the quarter
    and the full date already sitting in live plans -- and the two a CYCLE is
    named, including the half-year that made the old reader answer "due" for
    everything;
  * does a row that is not due leave the score AND the tally, and does a row
    that is late look different from one that is early;
  * does the per-cent type itself at both ends and open only in the middle;
  * and — the claim that made this safe to ship — does Execution read the
    SAME figure it read before, while no per-cent has been entered.

That last one is the reason this file exists rather than a screenshot. The
whole change was sold on "nobody's score moves", and a claim like that is
either measured or it is a hope.
"""
from playwright.sync_api import sync_playwright
import pathlib

URL = "file://" + str(pathlib.Path(__file__).resolve().parent.parent /
                     "strategy-management-platform.html")
DEST = "fn:finance"
# (label, tab, section, is-report-mode). Performance carries ONE section since
# §63 folded reporting out of it, and Reporting is a MODE reached from a
# button there — pressing for a section row lands on Performance twice and
# reports it under two names (§50.6, which cost twelve versions).
PAGES = [("Strategy / Projects", "Strategy", "Projects", False),
         ("Performance", "Performance", None, False),
         ("Performance / Report", "Performance", None, True)]

bad = 0
errs = []


def ck(what, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("    ok   " if ok else "    FAIL ") + what + (("  — " + str(x)) if not ok and x else ""))


def goto(pg, key, tab, sec, report):
    """Open a destination, its tab and its section — and CHECK IT LANDED."""
    want = "Functions" if key.startswith("fn:") else "Units"
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == want:
            break
        pg.click("#units .navswitch")
        pg.wait_for_timeout(150)
    pg.click('#units button[data-u="%s"]' % key)
    pg.wait_for_timeout(250)
    for sel, t in (("#subtabs button", tab), ("#secrow button", sec)):
        if not t:
            continue
        pg.evaluate("""([s,t])=>{const b=[...document.querySelectorAll(s)]
            .find(x=>x.textContent.trim().indexOf(t)===0); if(b)b.click()}""", [sel, t])
        pg.wait_for_timeout(250)
    if report:
        r = pg.query_selector("[data-report]")
        if not r:
            return "no Report button"
        r.click()
        pg.wait_for_timeout(350)
    return pg.evaluate("""()=>{const a=document.querySelector('#subtabs [aria-selected="true"]'),
        b=document.querySelector('#secrow [aria-selected="true"]');
        return (a?a.textContent.trim().split(" \\u2014 ")[0]:'?')
             + (b?' / '+b.textContent.trim():'')
             + (document.querySelector('[data-repcancel]')?' / Report':'')}""")


# Every table on the page that carries the project's row shape, read in one
# pass. A cell holding a CONTROL is answered even when it reads empty — the
# Note is a box waiting to be typed into, and counting that as a dead cell
# would flag the one pane the merge helps most.
READ = """
() => {
  const out = [];
  document.querySelectorAll(".pane table, .capbody table").forEach(t => {
    const head = [...t.querySelectorAll("thead th")].map(e => e.textContent.trim());
    if (!head.length) return;
    out.push({ head: head,
      rows: [...t.querySelectorAll("tbody tr")]
        .filter(r => !r.classList.contains("newrow"))
        .map(r => ({ notDue: r.classList.contains("notdue"),
          cells: [...r.children].map(c => ({
            text: c.textContent.trim(), span: +c.colSpan,
            box: !!c.querySelector("input,select,textarea,button"),
            late: !!c.querySelector(".lateval"),
            soon: !!c.querySelector(".soonval") })) })) });
  });
  return out;
}
"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(1200)
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    # ── THE DATE READER ──────────────────────────────────────────────────
    # Asked of the product's own function, not of a copy. Four shapes people
    # write and two a cycle is named, against a cycle closing Jun 2026.
    print("── the date reader")
    dates = pg.evaluate("""() => {
      const t = (v, want) => ({ v: v, got: dueThisCycle(v), want: want });
      return { cycle: cycleMonth(), year: cycleYear(),
        cases: [t("July 26", false), t("Mar 26", true), t("Dec 26", false),
                t("March 2026", true), t("July 2026", false), t("May 2026", true),
                t("W3 Mar 26", true), t("W4 July 26", false),
                t("Q1 2026", true), t("Q3 2026", false), t("Q2", true), t("Q3", false),
                t("31 May 2026", true), t("31 Jul 2026", false),
                t("Done", true), t("", true), t(null, true)],
        overdue: [overdue("Mar 26", false), overdue("Mar 26", true), overdue("Dec 26", false)] };
    }""")
    ck("the cycle's closing month is read", dates["cycle"] is not None, dates)
    for c in dates["cases"]:
        if c["got"] != c["want"]:
            ck("due(%r) is %s" % (c["v"], c["want"]), False, c["got"])
    ck("all %d written shapes read correctly" % len(dates["cases"]),
       all(c["got"] == c["want"] for c in dates["cases"]))
    # OVERDUE AND NOT DUE ARE OPPOSITE READINGS and must not collapse into
    # one: past-and-unfinished is late, and finished is not.
    ck("overdue is past its date AND unfinished", dates["overdue"] == [True, False, False],
       dates["overdue"])

    # ── EXECUTION DOES NOT MOVE (the claim this was sold on) ─────────────
    print("── the Execution figure")
    ex = pg.evaluate("""() => {
      // Strip every per-cent, which is what a tenant looks like on the day
      // this ships, and compare the average against the count it replaces.
      const rows = GROUP.capabilities.map(c => {
        const keep = [];
        (c.projects||[]).forEach(p => (p.milestones||[]).forEach(m => {
          keep.push([m, m.pct]); m.pct = null; }));
        let done = 0, n = 0;
        (c.projects||[]).forEach(p => (p.milestones||[]).forEach(m => {
          n++; if (m.status === "done") done++; }));
        const avg = capExec(c).pct, count = n ? Math.round(done / n * 100) : null;
        keep.forEach(([m, v]) => { m.pct = v; });
        return { cap: c.name, milestones: n, count: count, avg: avg, same: count === avg };
      });
      return { rows: rows, allSame: rows.every(r => r.same) };
    }""")
    for r in ex["rows"]:
        if not r["same"]:
            ck("%s: average matches the count" % r["cap"], False, r)
    ck("with no per-cent entered, Execution is the SAME figure it was — all %d capabilities"
       % len(ex["rows"]), ex["allSame"])

    # ── THE THREE PANES ─────────────────────────────────────────────────
    for label, tab, sec, report in PAGES:
        where = goto(pg, DEST, tab, sec, report)
        print("──", where)
        if where != label:
            errs.append("meant to scan %s, landed on %r" % (label, where))
            continue
        tables = pg.evaluate(READ)
        dx = [t for t in tables if "Type" in t["head"]]
        ms = [t for t in tables if "Milestone" in t["head"]]
        ck("the deliverables-and-outcomes table is one table", len(dx) == 1, len(dx))
        ck("...with a Type column and no band", dx and "Type" in dx[0]["head"], dx and dx[0]["head"])
        ck("the milestone table is there too", len(ms) == 1, len(ms))

        for t in dx + ms:
            n = len(t["head"])
            ragged = [r for r in t["rows"] if sum(c["span"] for c in r["cells"]) != n]
            ck("%s: every row fills the grid" % t["head"][1], not ragged,
               [[c["text"] for c in r["cells"]] for r in ragged][:1])
            # NO DEAD CELL. This is the complaint §99 was built for and §101
            # answers differently: a cell holding nothing but an em-dash is
            # the table asking a row a question its kind cannot answer.
            dead = [c["text"] for r in t["rows"] if not r["notDue"]
                    for c in r["cells"] if c["text"] in ("—", "-", "") and not c["box"]]
            ck("%s: no cell blank or dashed on a row being asked for" % t["head"][1],
               not dead, len(dead))

        # THE DATE IS OFF THE TABLES (§101.8) and must not have taken its two
        # readings with it. A deliverable or outcome that is LATE says so
        # under its name; one that is NOT DUE is dimmed and says so where the
        # figure would be. The milestone table still has its date column, so
        # its own marks stay in the cell.
        ck("no deliverables-and-outcomes table carries a Due date column",
           all("Due date" not in t["head"] for t in dx), dx and dx[0]["head"])
        ck("the milestone table keeps its own", all("Due date" in t["head"] for t in ms),
           ms and ms[0]["head"])
        if not report and tab == "Performance":
            late = sum(1 for t in dx + ms for r in t["rows"] for c in r["cells"] if c["late"])
            notdue = sum(1 for t in dx + ms for r in t["rows"] if r["notDue"])
            ck("late rows are still marked, now under the name", late > 0, late)
            ck("not-due rows are still marked, and differently", notdue > 0, notdue)

    # ── THE PER-CENT TYPES ITSELF ────────────────────────────────────────
    # §94.2: a check that only looks for something PRESENT cannot see a
    # control that should not be drawn. The box must appear for In progress
    # and NOT for the other two.
    print("── the per-cent")
    goto(pg, DEST, "Performance", None, True)
    boxes = pg.evaluate("""() => {
      const out = {};
      document.querySelectorAll("[data-cpick]").forEach(sel => {
        const row = sel.closest("tr"), pctCell = sel.closest("td").nextElementSibling;
        const word = sel.options[sel.selectedIndex].textContent.trim();
        out[word] = out[word] || { box: 0, read: 0 };
        if (pctCell.querySelector("[data-cpct]")) out[word].box++;
        else out[word].read++;
      });
      return out;
    }""")
    ck("In progress opens a box", boxes.get("In progress", {}).get("box", 0) > 0, boxes)
    for w in ("Delivered", "Completed", "Not started"):
        if w in boxes:
            ck("%s writes its own figure, with no box" % w, boxes[w]["box"] == 0, boxes[w])

    # ── THE WORKBOOKS, BOTH ENDS OF EVERY RENAME (§90) ───────────────────
    print("── the workbooks")
    wb = pg.evaluate("""() => {
      const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
      const head = (ws, n) => (ws.filter(s => s.name === n)[0] || {}).head || [];
      const plan = capPlanWorkbook(c), prog = capProgressWorkbook(c);
      // A workbook written BEFORE this version still uploads: its Kind column
      // is read and ignored, and its deliverables simply have no date.
      const old = capPlanFromWorkbook(c, { Deliverables: [
        ["Project","Deliverable","Kind"], ["P","D","Delivered / not"]] })
        .filter(r => r.type === "DELIVERABLE");
      const now = capPlanFromWorkbook(c, { Deliverables: [
        ["Project","Deliverable"], ["P","D"]] })
        .filter(r => r.type === "DELIVERABLE");
      return { planDeliv: head(plan, "Deliverables"), planOut: head(plan, "Outcomes"),
               planMs: head(plan, "Milestones"), progDeliv: head(prog, "Deliverables"),
               progMs: head(prog, "Milestones"),
               oldReads: old.length === 1 && !old[0].finish,
               nowReads: now.length === 1 && now[0].name === "D" };
    }""")
    # §101.8: the template asks for neither a Kind nor a Due date. The OUTCOME
    # sheet keeps its date, deliberately -- see the note in the section.
    ck("the plan's Deliverables sheet asks for neither a Kind nor a date",
       wb["planDeliv"] == ["Project", "Deliverable"], wb["planDeliv"])
    ck("the outcome sheet keeps its Due date", "Due date" in wb["planOut"], wb["planOut"])
    ck("the milestone sheet asks for a Description", "Description" in wb["planMs"], wb["planMs"])
    ck("the progress sheet asks for a status and a per-cent",
       "New status" in wb["progDeliv"] and "New %" in wb["progDeliv"], wb["progDeliv"])
    ck("...and no longer shows a due date it cannot be given",
       "Due date" not in wb["progDeliv"], wb["progDeliv"])
    ck("...and the milestone sheet does too",
       "New status" in wb["progMs"] and "New %" in wb["progMs"], wb["progMs"])
    ck("a workbook written today reads", wb["nowReads"], wb)
    ck("a workbook written before this version still uploads", wb["oldReads"], wb)

    # ── NOT DUE IS A LABEL, NOT A LOCK (§101.8) ──────────────────────────
    # The inverse of §94.2: not "a control that should not be drawn", but a
    # control that SHOULD be and was not. Every check above this one asks
    # whether a cell is answered, and a row replaced wholesale by the word
    # "Not asked" answers every cell -- so all of them passed while the pane
    # refused the one act its own comment promised.
    print("── not due is a label, not a lock")

    # MAKE THE STATE (§99.7): FIN01 happens to carry one not-due deliverable
    # and no not-due milestone at all, so three of the four paths would go
    # unmeasured -- and a reverted build proved it, passing while the
    # milestone lock was back in place. Four rows, one per case: not due and
    # silent, not due and answered early, on each table.
    pg.evaluate("""() => {
      const c = capsOfFunction("finance")[0], p = c.projects[0];
      const far = "Dec 27", d = p.deliverables, m = p.milestones;
      d[d.length - 2].due = far; d[d.length - 2].status = null;
      d[d.length - 1].due = far; d[d.length - 1].status = "done";
      m[m.length - 2].finish = "December 2027"; m[m.length - 2].status = null;
      m[m.length - 1].finish = "December 2027"; m[m.length - 1].status = "done";
      paint();
    }""")
    pg.wait_for_timeout(250)

    def cols(t):
        h = t["head"]
        return (h.index("Status") if "Status" in h else -1,
                h.index("%") if "%" in h else -1)

    for label, tab, sec, rep in (("Performance", "Performance", None, False),
                                 ("Reporting", "Performance", None, True)):
        landed = goto(pg, DEST, tab, sec, rep)
        got = pg.evaluate(READ)
        tabs = [t for t in got if cols(t)[0] > -1 and cols(t)[1] > -1]
        ck("%s: the two tables are there [%s]" % (label, landed), len(tabs) == 2, len(tabs))
        quiet = live = shown = dashed = mixed = 0
        for t in tabs:
            si, pi = cols(t)
            for r in t["rows"]:
                st, pc = r["cells"][si], r["cells"][pi]
                if pc["text"] == "Not due":
                    quiet += 1
                    # a quiet row is DIMMED and, on Reporting, still typeable
                    if rep and st["box"]:
                        live += 1
                    if not rep:
                        live += 1
                elif "%" in pc["text"]:
                    shown += 1
                # THE BUG, stated as an assertion: something reported, nothing read
                said = st["text"] in ("Delivered", "Completed", "Not started") or st["box"]
                if said and pc["text"] in ("\u2014", "-", ""):
                    dashed += 1
                # the two cells must agree about whether the row was answered:
                # a status reading "Not due" beside a figure is the same fault
                # wearing the other cell (found by reverting only one of them)
                if st["text"] == "Not due" and "%" in pc["text"]:
                    mixed += 1
        ck("%s: some row is not due and says so" % label, quiet >= 2, quiet)
        ck("%s: every not-due row keeps its control" % label, live == quiet, (live, quiet))
        ck("%s: rows that were answered read a figure" % label, shown > 0, shown)
        ck("%s: no row is answered and read as a dash" % label, dashed == 0, dashed)
        ck("%s: Status and %% never disagree about a not-due row" % label, mixed == 0, mixed)

    # A row reported EARLY stops being quiet the moment it is: FIN01's fourth
    # deliverable is due Dec 26 and delivered, so it must read 100%, not a dash
    # -- the score has always counted it and the screen used to hide it.
    early = pg.evaluate("""() => {
      const c = FUNCTIONS.finance && capsOfFunction("finance")[0];
      const p = (c.projects || []).find(x => (x.deliverables || [])
        .some(d => d.status && !dueThisCycle(d.due)));
      if (!p) return null;
      const d = p.deliverables.find(x => x.status && !dueThisCycle(x.due));
      return { side: projDeliverySide(p), reads: statusReads(d) };
    }""")
    ck("a deliverable reported early still counts toward the score",
       early and early["reads"] is not None and early["side"] is not None, early)

    # ── THE DECK ─────────────────────────────────────────────────────────
    print("── the review deck")
    deck = pg.evaluate("""() => {
      const box = document.createElement("div");
      box.innerHTML = deckSlidesFn("finance");
      const h = [...box.querySelectorAll("thead th")].map(x => x.textContent.trim());
      return { slides: box.querySelectorAll(".dslide").length,
               type: h.filter(x => x === "Type").length,
               due: h.filter(x => x === "Due date").length,
               pct: h.filter(x => x === "%").length,
               stale: h.filter(x => ["Reads","Finish","Measured as","Reported"].indexOf(x) > -1) };
    }""")
    ck("the deck still builds", deck["slides"] > 0, deck["slides"])
    ck("its project table carries the Type column", deck["type"] > 0, deck)
    ck("...and Due date and %", deck["due"] > 0 and deck["pct"] > 0, deck)
    ck("no slide carries a heading this version removed", not deck["stale"], deck["stale"])

    b.close()

for e in errs:
    print("    FAIL", e)
    bad += 1
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
