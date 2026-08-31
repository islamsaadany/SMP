"""ONE TABLE, ONE ROW SHAPE (§104).

§99 split a project's table in two because Direction, Target and the date had
nothing to say for a deliverable. §104 gives a deliverable a real direction
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
# §222: REPORTING IS ITS OWN TAB, so the third pane is reached from
# Reporting rather than from inside Performance. The label follows the
# navigation, because a label that names a page the walk did not open is
# §50.6's fault — twelve versions of measuring the wrong page under the
# right name.
PAGES = [("Strategy / Projects", "Strategy", "Projects", False),
         ("Performance", "Performance", None, False),
         ("Reporting / Report", "Performance", None, True)]

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
        r = pg.query_selector('[data-s=report]')
        if not r:
            return "no Reporting tab"
        r.click()
        pg.wait_for_timeout(300)
        # §220: A SUBMITTED REPORT IS READ-ONLY, and six of the ten demo units
        # ship already submitted — so a check that drives the fields has to
        # reopen first. Pressing the product's own control rather than
        # clearing the flag, because that is the way a person gets back in.
        pg.evaluate("""() => { const b = document.querySelector('.rc-reopen');
                               if (b) b.click(); }""")
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
      // §104 sold itself on "nobody's score moves", so the average is compared
      // against the count it replaced -- with every per-cent stripped AND
      // every In progress settled, which is what a tenant looked like the day
      // that shipped. THE SETTLING IS §104.10's DOING: an In progress with no
      // number now LEAVES the average rather than counting as nought, so a
      // fixture that strips per-cents and leaves the statuses is no longer
      // modelling the old formula at all -- it would report the deliberate
      // change as a regression, every run, for ever.
      const rows = GROUP.capabilities.map(c => {
        const keep = [];
        (c.projects||[]).forEach(p => (p.milestones||[]).forEach(m => {
          keep.push([m, m.pct, m.status]);
          m.pct = null; if (m.status === "wip") m.status = "todo"; }));
        let done = 0, n = 0;
        (c.projects||[]).forEach(p => (p.milestones||[]).forEach(m => {
          n++; if (m.status === "done") done++; }));
        const avg = capExec(c).pct, count = n ? Math.round(done / n * 100) : null;
        keep.forEach(([m, v, st]) => { m.pct = v; m.status = st; });
        return { cap: c.name, milestones: n, count: count, avg: avg, same: count === avg };
      });
      // AND THE CLAIM FOR TODAY, which is the one somebody would ask about:
      // not one row in the demo is halfway through a sentence, so §104.10 has
      // moved no figure that exists. If a later edit leaves one blank, this
      // says so rather than the parity above going quietly red.
      let pend = 0, wip = 0;
      GROUP.capabilities.forEach(c => {
        pend += capExec(c).pending;
        (c.projects||[]).forEach(p => {
          (p.milestones||[]).forEach(m => { if (m.status === "wip") wip++; });
          (p.deliverables||[]).forEach(d => { if (statusPending(d)) pend++; });
        });
      });
      return { rows: rows, allSame: rows.every(r => r.same), pending: pend, wip: wip };
    }""")
    ck("every In progress in the demo carries its number (%d of them)" % ex["wip"],
       ex["pending"] == 0 and ex["wip"] > 0, ex["pending"])
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
            # NO DEAD CELL. This is the complaint §99 was built for and §104
            # answers differently: a cell holding nothing but an em-dash is
            # the table asking a row a question its kind cannot answer.
            dead = [c["text"] for r in t["rows"] if not r["notDue"]
                    for c in r["cells"] if c["text"] in ("—", "-", "") and not c["box"]]
            ck("%s: no cell blank or dashed on a row being asked for" % t["head"][1],
               not dead, len(dead))

        # THE DATE IS OFF THE TABLES (§104.8) and must not have taken its two
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
    # §104.8: the template asks for neither a Kind nor a Due date. The OUTCOME
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

    # ── NOT DUE IS A LABEL, NOT A LOCK (§104.8) ──────────────────────────
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

    # §104.9: the score column is called Performance on one table and Progress
    # on the other, so it is found by EITHER name -- and both are asserted
    # below, because a check that accepts either would not notice one of them
    # reverting to the bare unit.
    PCT = ("Performance", "Progress", "%")

    def cols(t):
        h = t["head"]
        hit = [i for i, x in enumerate(h) if x in PCT]
        return (h.index("Status") if "Status" in h else -1,
                hit[-1] if hit else -1)

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
    # §104.9: the last column says WHAT it holds, not what it is measured in.
    heads = pg.evaluate("""() => [...document.querySelectorAll(".pane table, .capbody table")]
      .map(t => [...t.querySelectorAll("thead th")].map(e => e.textContent.trim()))
      .filter(h => h.length)""")
    dxh = [h for h in heads if "Deliverables & outcomes" in h]
    msh = [h for h in heads if "Milestone" in h]
    ck("the deliverables-and-outcomes score column is Performance",
       dxh and all(h[-1] == "Performance" or h[-2] == "Performance" for h in dxh), dxh)
    ck("the milestone score column is Progress",
       msh and all(h[-1] == "Progress" or h[-2] == "Progress" for h in msh), msh)
    ck("neither is left as the bare unit",
       not [h for h in dxh + msh if "%" in h], dxh + msh)

    ck("a deliverable reported early still counts toward the score",
       early and early["reads"] is not None and early["side"] is not None, early)

    # ── AN IN PROGRESS WITH NO NUMBER (§104.10) ──────────────────────────
    # Measured, not reasoned about: the whole fault was that the score moved
    # when nobody had said anything, so the assertion is the score.
    print("── an In progress with no number")
    sc = pg.evaluate("""() => {
      const c = capsOfFunction("finance")[0], p = c.projects[0];
      const d = p.deliverables[0], m = p.milestones[0];
      const keep = { ds: d.status, dp: d.pct, ms: m.status, mp: m.pct };
      const before = { side: projDeliverySide(p), exec: capExec(c).pct,
                       rep: projReported(p) };
      d.status = "wip"; d.pct = null; m.status = "wip"; m.pct = null;
      const blank = { side: projDeliverySide(p), exec: capExec(c).pct,
                      rep: projReported(p), pend: capExec(c).pending,
                      dReads: statusReads(d), mReads: msReads(m),
                      dGiven: statusGiven(d), dPending: statusPending(d) };
      // an EMPTY STRING is the case Number() reads as nought
      d.pct = ""; const empty = { reads: statusReads(d), pending: statusPending(d) };
      d.pct = 0; const zero = { reads: statusReads(d), pending: statusPending(d) };
      d.pct = 35; const said = { reads: statusReads(d), pending: statusPending(d),
                                 side: projDeliverySide(p) };
      Object.assign(d, { status: keep.ds, pct: keep.dp });
      Object.assign(m, { status: keep.ms, pct: keep.mp });
      return { before, blank, empty, zero, said };
    }""")
    ck("an In progress with no number reads as unanswered, not nought",
       sc["blank"]["dReads"] is None and sc["blank"]["mReads"] is None, sc["blank"])
    ck("...so it LEAVES the average rather than dragging it to zero",
       sc["blank"]["side"] > 0 and sc["blank"]["exec"] > 0, (sc["before"], sc["blank"]))
    ck("...and the tally counts it as still owed",
       sc["blank"]["rep"]["done"] == sc["before"]["rep"]["done"] - 2
       and sc["blank"]["pend"] == 1, (sc["before"]["rep"], sc["blank"]))
    ck("an empty box is not a nought (Number('') is 0, and it must not be)",
       sc["empty"]["reads"] is None and sc["empty"]["pending"], sc["empty"])
    ck("a typed nought IS a nought",
       sc["zero"]["reads"] == 0 and not sc["zero"]["pending"], sc["zero"])
    ck("a number said clears it and is read",
       sc["said"]["reads"] == 35 and not sc["said"]["pending"], sc["said"])

    # and the SCREEN says so -- on both panes and both tables, which is four
    # places one predicate is asked (§104.10).
    for label, rep in (("Performance", False), ("Reporting", True)):
        goto(pg, DEST, "Performance", None, rep)
        pg.evaluate("""() => {
          const p = capsOfFunction("finance")[0].projects[0];
          p.deliverables[0].status = "wip"; p.deliverables[0].pct = null;
          p.milestones[0].status = "wip"; p.milestones[0].pct = null;
          paint();
        }""")
        pg.wait_for_timeout(250)
        m = pg.evaluate("""() => {
          const e = [...document.querySelectorAll(".pctneed")];
          return { n: e.length, text: e.map(x => x.textContent.trim()),
                   lines: e.map(x => new Set([...x.getClientRects()]
                     .filter(r => r.width > 0).map(r => Math.round(r.top))).size),
                   fits: e.every(x => x.getBoundingClientRect().width
                     <= x.closest("td").getBoundingClientRect().width + 0.5),
                   over: [...document.querySelectorAll(".pane table, .capbody table")]
                     .filter(t => t.scrollWidth > t.clientWidth).length };
        }""")
        ck("%s: both tables mark the row that owes a number" % label,
           m["n"] == 2 and set(m["text"]) == {"Needs a %"}, m)
        ck("%s: the mark is one line and inside its cell" % label,
           set(m["lines"]) == {1} and m["fits"] and m["over"] == 0, m)
        # ...and goes when the number arrives
        pg.evaluate("""() => {
          const p = capsOfFunction("finance")[0].projects[0];
          p.deliverables[0].pct = 40; p.milestones[0].pct = 40; paint();
        }""")
        pg.wait_for_timeout(250)
        gone = pg.evaluate("() => document.querySelectorAll('.pctneed').length")
        ck("%s: and the mark goes when the number arrives" % label, gone == 0, gone)
        pg.evaluate("""() => {
          const p = capsOfFunction("finance")[0].projects[0];
          p.deliverables[0].status = "done"; p.deliverables[0].pct = null;
          p.milestones[0].status = "done"; p.milestones[0].pct = null; paint();
        }""")
        pg.wait_for_timeout(200)

    # ── A FUNCTION SUBMITS (§105) ────────────────────────────────────────
    # §94.2 both ways: the control must BE there, and the refusals must stop it
    # -- a Submit that always submits would pass every "is it present" check.
    print("── a function submits its report")
    goto(pg, DEST, "Performance", None, True)
    btn = pg.eval_on_selector_all("[data-submit]",
        "e=>e.map(x=>[x.dataset.submit, x.textContent.trim()])")
    ck("the Reporting bar carries a Submit", len(btn) == 1, btn)
    ck("...keyed by the fn: target the server authorises",
       btn and btn[0][0] == DEST, btn)

    def press():
        """Press Submit and hand back whatever it said. A build with the control
        REMOVED must fail readably rather than throw a stack trace 30 seconds
        later -- a crash is a failure, but a failure nobody can read is one
        somebody re-runs instead of fixing."""
        if not pg.query_selector("[data-submit]"):
            return "(there is no Submit to press)"
        said = {}
        pg.once("dialog", lambda d: (said.update(m=d.message), d.dismiss()))
        # §221: THE BUTTON IS DIMMED FOR EXACTLY THESE REASONS NOW, and
        # Playwright treats `aria-disabled` as disabled and refuses to click
        # it — which is itself worth knowing. `force` presses it anyway,
        # because the click handler is still the enforcement: the dimming is
        # the explanation given BEFORE the press, not a replacement for the
        # refusal after it, and this section is about the refusal.
        pg.click("[data-submit]", timeout=3000, force=True); pg.wait_for_timeout(350)
        return said.get("m", "")

    # 1 · a row that owes a per-cent stops it (§104.10 with teeth)
    pg.evaluate("""() => {
      fnMissingNotes("finance").forEach(x => x.obj.note = "Explained.");
      const p = capsOfFunction("finance")[0].projects[0];
      p.milestones[0].status = "wip"; p.milestones[0].pct = null; paint();
    }""")
    pg.wait_for_timeout(250)
    said = press()
    ck("a row owing a per-cent refuses the submission",
       "In progress" in said and not pg.evaluate("() => !!REVIEW.submitted['%s']" % DEST), said)

    # 2 · a red figure with no note stops it, the same rule a unit has
    pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      p.milestones[0].status = "todo"; p.milestones[0].pct = null;
      const o = p.outcomes[0]; o.progress = 20; o.actual = "1 h"; o.note = ""; paint();
    }""")
    pg.wait_for_timeout(250)
    said = press()
    ck("a figure at risk with no note refuses it too",
       "no note" in said and not pg.evaluate("() => !!REVIEW.submitted['%s']" % DEST), said)

    # 3 · nothing in the way -> it goes, and the dot the tab has been showing
    #     since §69.9 finally has something that clears it
    pg.evaluate("""() => {
      fnMissingNotes("finance").forEach(x => x.obj.note = "Explained.");
      fnAskedItems("finance").forEach(x => { if (statusPending(x.obj)) x.obj.pct = 50; });
      /* §221 ADDED TWO MORE WAYS TO BE UNREADY, so "nothing in the way" now
         has to mean all five: every asked figure entered, and the plan
         holding no gaps of its own. */
      fnAskedItems("finance").forEach(x => {
        const o = x.obj;
        if (x.kind === "deliverable" || x.kind === "milestone") {
          if (!statusGiven(o)) { o.status = "done"; o.pct = 100; }
        } else if (o.actual == null || o.actual === "") o.actual = o.target || 1;
      });
      capsOfFunction("finance").forEach(c => (c.projects || []).forEach(pr => {
        (pr.milestones || []).forEach(m => { if (!m.finish) m.finish = "Q4 26";
                                             if (!m.owner) m.owner = pr.owner || "Owner"; });
        (pr.outcomes || []).forEach(o => { if (!o.target) o.target = "1"; });
      }));
      paint();
    }""")
    pg.wait_for_timeout(250)
    ck("nothing left in the way", pg.evaluate("() => submitRefusal('%s')" % DEST) == "",
       pg.evaluate("() => submitRefusal('%s')" % DEST))
    said = press()
    ck("...and then it submits", pg.evaluate("() => !!REVIEW.submitted['%s']" % DEST), said)
    ck("...the dot on the Reporting tab clears",
       not pg.evaluate("() => reportPending('%s')" % DEST))
    # §199.2: `.rep-bar` HAS NOT EXISTED FOR VERSIONS. The reporting bar is
    # `.repchrome` (repChrome()), and this line CRASHED the whole file rather
    # than failing one assertion — which is why everything below it has gone
    # unrun. §51.11 from the loud end: a selector that no longer matches
    # usually passes quietly; this one took the check down with it.
    bar = pg.eval_on_selector(".repchrome", "e=>e.textContent")
    ck("...the bar says Submitted and offers Reopen",
       "Submitted" in bar and "Reopen" in bar, bar)
    if pg.query_selector("[data-unsubmit]"):
        pg.click("[data-unsubmit]"); pg.wait_for_timeout(350)
    ck("...and Reopen puts it back",
       not pg.evaluate("() => !!REVIEW.submitted['%s']" % DEST)
       and bool(pg.query_selector("[data-submit]")))

    # ── A PLAN ALREADY STORED, CHECKED (§106) ────────────────────────────
    # Both ends (§94.2): the note must appear on a project that has the fault
    # AND be absent from one that does not -- a note drawn always says nothing.
    print("── a plan already stored")
    goto(pg, DEST, "Strategy", None, False)

    def look():
        return pg.evaluate("""() => ({
          notes: [...document.querySelectorAll('.bad-note')].map(e => e.textContent.trim()),
          rail: [...document.querySelectorAll('.rail .ritem')].map(e => e.textContent.trim())
        })""")

    # clean first, so "it appeared" means something
    pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      p.milestones.forEach(m => { m.finish = "May 2026"; });
      p.end = "31 Dec 2026"; paint();
    }""")
    pg.wait_for_timeout(250)
    d = look()
    ck("a plan with readable dates gets no note",
       not [x for x in d["notes"] if "not a date" in x], d["notes"])
    ck("...and the rail says nothing to check",
       not [r for r in d["rail"] if "to check" in r], d["rail"][:1])

    # now the shape a live tenant actually has
    pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      p.milestones[0].finish = "Pending"; p.milestones[1].finish = "Done"; paint();
    }""")
    pg.wait_for_timeout(250)
    d = look()
    note = " ".join([x for x in d["notes"] if "not a date" in x])
    ck("a status word in a due-date column is named", bool(note), d["notes"])
    ck("...by its value AND the row it is on",
       "Pending" in note and "Solution design" in note and "Done" in note, note[:160])
    ck("...and the rail says which project holds them",
       bool([r for r in d["rail"] if "2 rows to check" in r]), d["rail"][:1])
    # a value the reader CAN read is not flagged -- or every quarter-planned
    # milestone in the product would be
    ck("a quarter is a date and is not flagged",
       pg.evaluate("() => dueFits('Q3 2026') && dueFits('July 26') && !dueFits('Pending')"))

    # THE LOOP CLOSES: correcting it through the pen makes the note go
    pg.evaluate("""() => {
      capsOfFunction("finance")[0].projects[0].milestones[0].finish = "March 2026";
      capsOfFunction("finance")[0].projects[0].milestones[1].finish = "April 2026";
      paint();
    }""")
    pg.wait_for_timeout(250)
    ck("correcting them clears the note",
       not [x for x in look()["notes"] if "not a date" in x])

    # ── AND THE FIGURE SAYS WHAT IT IS BUILT ON ──────────────────────────
    goto(pg, DEST, "Performance", None, False)
    pg.evaluate("""() => {
      GROUP.capabilities.forEach(c => (c.projects||[]).forEach(p =>
        (p.milestones||[]).forEach(m => { m.pct = null; })));
      paint();
    }""")
    pg.wait_for_timeout(250)
    card = pg.evaluate("""() => {
      const c = [...document.querySelectorAll('.scores .card')]
        .find(x => /Execution/.test(x.textContent));
      return { text: c ? c.textContent.trim() : "",
               mark: c ? [...c.querySelectorAll('.missing')].map(e => e.textContent.trim()) : [] };
    }""")
    ck("Execution says how much is not counted yet",
       card["mark"] and "not counted yet" in card["mark"][0], card)
    # and NOT when there is nothing outstanding
    pg.evaluate("""() => {
      GROUP.capabilities.forEach(c => (c.projects||[]).forEach(p =>
        (p.milestones||[]).forEach(m => { if (m.status === "wip") m.pct = 50; })));
      paint();
    }""")
    pg.wait_for_timeout(250)
    quiet = pg.evaluate("""() => {
      const c = [...document.querySelectorAll('.scores .card')]
        .find(x => /Execution/.test(x.textContent));
      return [...c.querySelectorAll('.missing')].length;
    }""")
    ck("...and says nothing when there is nothing outstanding", quiet == 0, quiet)

    # ── THE DECK ─────────────────────────────────────────────────────────
    print("── the review deck")
    deck = pg.evaluate("""() => {
      const box = document.createElement("div");
      box.innerHTML = deckSlidesFn("finance");
      const h = [...box.querySelectorAll("thead th")].map(x => x.textContent.trim());
      return { slides: box.querySelectorAll(".dslide").length,
               type: h.filter(x => x === "Type").length,
               due: h.filter(x => x === "Due date").length,
               dxpct: h.filter(x => x === "Performance").length,
               mspct: h.filter(x => x === "Progress").length,
               bare: h.filter(x => x === "%").length,
               stale: h.filter(x => ["Reads","Finish","Measured as","Reported"].indexOf(x) > -1) };
    }""")
    ck("the deck still builds", deck["slides"] > 0, deck["slides"])
    ck("its project table carries the Type column", deck["type"] > 0, deck)
    ck("...and Due date", deck["due"] > 0, deck)
    ck("...and the two score columns by name, neither left bare",
       deck["dxpct"] > 0 and deck["mspct"] > 0 and deck["bare"] == 0, deck)
    ck("no slide carries a heading this version removed", not deck["stale"], deck["stale"])

    b.close()

for e in errs:
    print("    FAIL", e)
    bad += 1
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
