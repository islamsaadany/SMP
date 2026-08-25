"""ONE TABLE, TWO HALVES (§99).

A deliverable and an outcome shared one header row on all three of a
capability project's panes, so `Measured as` meant the delivery kind on one
row and the DIRECTION on the next, and `Target` (and, on the plan pane,
`Measured at`) stood empty for every deliverable.

WHAT THIS ASSERTS IS THE PROBLEM, NOT THE LAYOUT (§94.8's lesson, earned the
day a check asserted a POSITION and a reversal made it false the same
afternoon). It never asks where a column sits or how wide it is. It asks:

  * is every cell in the table answering a question its row can answer —
    i.e. is there a dead em-dash cell left anywhere;
  * does each half declare its own columns, and do those declarations add up
    to the same grid, so the two halves line up rather than stagger;
  * does the column a score is read from end in the same place on both
    halves, measured in pixels rather than counted in cells;
  * and does the milestone column say Due date, on every surface — INCLUDING
    the two workbooks, whose reader must still take a file written before the
    rename (§58).

The last one asserts BOTH ENDS (§90): gone from where it was, present where
it went. A rename is the easiest thing to half-do.
"""
from playwright.sync_api import sync_playwright
import pathlib

URL = "file://" + str(pathlib.Path(__file__).resolve().parent.parent /
                     "strategy-management-platform.html")
# A function with capabilities, and its three project pages. Finance is the
# one carrying a real plan with real dates (§52.10), so a wrong reading here
# is a wrong reading of something somebody actually authored.
DEST = "fn:finance"
# (label, tab, section, is-report-mode). Performance carries ONE section since
# §63 folded reporting out of it, so there is no section row to press there —
# and Reporting is a MODE reached from a button on that page, not a tab. A
# check that pressed for a section row would land on Performance twice and
# report it under two names (§50.6, the exact fault that cost twelve
# versions), so what each page IS gets stated here rather than assumed.
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
    """Open a destination, its tab and its section — and CHECK IT LANDED.

    §50.6 and §93.7, both of which cost twelve versions: a probe that clicks
    and does not look reports the page behind under the name of the one it
    meant to open. Matched on the PREFIX, because §69 gave these tabs status
    suffixes ("Performance — not submitted yet") and an exact match silently
    stopped matching.
    """
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
        # ASSERT THE PRESS WORKED. A helper that returns quietly when it found
        # no button is the same lie with a nicer face (§93.7).
        r = pg.query_selector("[data-report]")
        if not r:
            return "no Report button"
        r.click()
        pg.wait_for_timeout(350)
    # Named from what the page IS, not from what was asked for: the tab, then
    # the section where there is one, then the mode where one is open.
    return pg.evaluate("""()=>{const a=document.querySelector('#subtabs [aria-selected="true"]'),
        b=document.querySelector('#secrow [aria-selected="true"]');
        return (a?a.textContent.trim().split(" \u2014 ")[0]:'?')
             + (b?' / '+b.textContent.trim():'')
             + (document.querySelector('[data-repcancel]')?' / Report':'')}""")


# Everything the page can tell us about the split, read in one pass.
READ = """
() => {
  const panes = [...document.querySelectorAll(".pane, .capbody")];
  const out = [];
  document.querySelectorAll("table").forEach(t => {
    const bands = [...t.querySelectorAll("tr.dxband")];
    if (!bands.length) return;
    const halves = bands.map(b => {
      const head = b.nextElementSibling;
      const cells = head && head.classList.contains("dxhead")
        ? [...head.children] : [];
      // A row is one of this half's if it sits between this band and the
      // next: the walk is what proves the halves are actually separate
      // rather than two headers over one list.
      const rows = [];
      let n = head ? head.nextElementSibling : null;
      while (n && !n.classList.contains("dxband")) {
        if (n.tagName === "TR" && !n.classList.contains("newrow")) rows.push(n);
        n = n.nextElementSibling;
      }
      return {
        title: b.querySelector("th").firstChild.textContent.trim(),
        sub: (b.querySelector("th em") || {}).textContent || "",
        span: +b.querySelector("th").colSpan,
        head: cells.map(c => ({ label: c.textContent.trim(), span: +c.colSpan,
                                right: Math.round(c.getBoundingClientRect().right) })),
        rows: rows.map(r => [...r.children].map(c => ({
          text: c.textContent.trim(), span: +c.colSpan,
          // A cell holding a control is ANSWERED even when it reads empty:
          // the reporting pane's Note is a box waiting to be typed into, and
          // counting that as a dead cell would flag the one pane the split
          // helps most.
          box: !!c.querySelector("input,select,textarea,button"),
          right: Math.round(c.getBoundingClientRect().right) })))
      };
    });
    out.push({ halves: halves });
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
    # The SMO: the only viewer who sees every one of the three panes with its
    # controls on, and the pen the plan pane's add rows live behind (§94.2 —
    # a check that only runs as one person cannot see a control that should
    # not be drawn, and this one deliberately runs as the person who sees the
    # most, because what is being measured is the SHAPE of the table).
    pg.select_option("#asWho", "smo")
    pg.wait_for_timeout(300)

    for label, tab, sec, report in PAGES:
        where = goto(pg, DEST, tab, sec, report)
        print("──", where)
        if where != label:
            errs.append("meant to scan %s, landed on %r" % (label, where))
            continue
        tables = pg.evaluate(READ)
        ck("the page has split tables at all", len(tables) > 0, len(tables))

        for t in tables:
            hs = t["halves"]
            if len(hs) != 2:
                ck("every table has exactly two halves", False, [h["title"] for h in hs])
                continue
            d, o = hs
            ck("the halves are Deliverables then Outcomes",
               (d["title"], o["title"]) == ("Deliverables", "Outcomes"),
               (d["title"], o["title"]))
            ck("each half says what it is for", bool(d["sub"]) and bool(o["sub"]))

            # THE GRID HAS TO ADD UP. Two halves under one <table> share one
            # column grid, so a header row whose colspans total something
            # other than the band's span staggers every cell under it — the
            # fault would look like a styling wobble and be a counting one.
            for h in (d, o):
                tot = sum(c["span"] for c in h["head"])
                ck("%s: its header row fills the grid" % h["title"], tot == h["span"],
                   "%d of %d" % (tot, h["span"]))
                for r in h["rows"]:
                    rt = sum(c["span"] for c in r)
                    if rt != h["span"]:
                        ck("%s: a row fills the grid" % h["title"], False,
                           "%d of %d: %s" % (rt, h["span"], [c["text"] for c in r]))
                        break
                else:
                    ck("%s: every row fills the grid" % h["title"], True)

            # NO DEAD CELL. This is the complaint itself, in one assertion: a
            # cell holding nothing but an em-dash is the table asking a row a
            # question its kind cannot answer. An outcome not yet due is not
            # one — it says "Measured at Q4 2026", which is an answer.
            for h in (d, o):
                dead = [c["text"] for r in h["rows"] for c in r
                        if c["text"] in ("—", "-", "") and not c["box"]]
                ck("%s: no cell left blank or dashed" % h["title"], not dead, len(dead))

            # THE SCORE COLUMN ENDS IN THE SAME PLACE ON BOTH HALVES, measured
            # in PIXELS. §53.5's rule: assert the agreement, never the number,
            # so moving both stays green and moving one does not.
            last = [h["head"][-1]["label"] for h in (d, o)]
            if last[0] == last[1]:
                ck("both halves end in %s, at the same edge" % last[0],
                   d["head"][-1]["right"] == o["head"][-1]["right"],
                   "%d vs %d" % (d["head"][-1]["right"], o["head"][-1]["right"]))

            # THE TYPE COLUMN IS GONE. The band says which kind these are; a
            # pill repeating it is the same fact twice.
            heads = [c["label"] for h in (d, o) for c in h["head"]]
            ck("no Type column survives the split", "Type" not in heads, heads)

        # THE MILESTONE COLUMN, both ends of the rename.
        ms = pg.evaluate("""() => [...document.querySelectorAll("thead th")]
            .map(e => e.textContent.trim())""")
        # Leaving the mode before the next page, or the one after it opens
        # behind an overlay and gets measured under its own name (§63's
        # leaveModes, from the checking side).
        ck("the milestone column says Due date", "Due date" in ms, ms)
        ck("nothing on the page still says Finish", "Finish" not in ms, ms)

        if report:
            c = pg.query_selector("[data-repcancel]")
            if c:
                c.click()
                pg.wait_for_timeout(250)

    # ── THE WORKBOOKS ────────────────────────────────────────────────────
    # Written with the new label; read with either, because a header is a
    # contract and somebody is holding a file downloaded before the rename
    # (§58, §65). Asked of the real builders, not of a copy of them.
    print("── the workbooks")
    wb = pg.evaluate("""() => {
      const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
      const nm = ws => ws.map(s => s.name);
      const head = (ws, n) => (ws.filter(s => s.name === n)[0] || {}).head || [];
      const plan = capPlanWorkbook(c), prog = capProgressWorkbook(c);
      return { planMs: head(plan, "Milestones"), progMs: head(prog, "Milestones"),
               planOut: head(plan, "Outcomes"), progOut: head(prog, "Outcomes"),
               sheets: nm(plan) };
    }""")
    ck("the plan workbook's milestone column says Due date",
       "Due date" in wb["planMs"] and "Finish" not in wb["planMs"], wb["planMs"])
    ck("the progress workbook's milestone column says Due date",
       "Due date" in wb["progMs"] and "Finish" not in wb["progMs"], wb["progMs"])
    ck("the outcome sheets say Measure date",
       "Measure date" in wb["planOut"] and "Measure date" in wb["progOut"],
       [wb["planOut"], wb["progOut"]])
    ck("the workbook still keeps deliverables and outcomes on their own sheets",
       "Deliverables" in wb["sheets"] and "Outcomes" in wb["sheets"], wb["sheets"])

    # A FILE WRITTEN BEFORE THE RENAME STILL UPLOADS. Both spellings, through
    # the real reader, with everything else held identical.
    old_new = pg.evaluate("""() => {
      const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
      const one = h => capPlanFromWorkbook(c, { Milestones: [h,
          ["Average debt utilisation report automation", "Solution design",
           "Treasury requirements", "Finance", "20 Mar 2026"]] })
        .filter(r => r.type === "MILESTONE").map(r => r.finish);
      return { now: one(["Project","Milestone","What it covers","Owner","Due date"]),
               then: one(["Project","Milestone","What it covers","Owner","Finish"]) };
    }""")
    ck("a workbook written today reads", old_new["now"] == ["20 Mar 2026"], old_new["now"])
    ck("a workbook written before the rename still reads",
       old_new["then"] == ["20 Mar 2026"], old_new["then"])

    # ── THE REVIEW DECK ──────────────────────────────────────────────────
    # The deck already gave a deliverables slide and an outcomes slide of its
    # own (§15), so the split needed nothing there — but BOTH renames reach
    # it, and a rename is the easiest thing to half-do (§90). Asked of the
    # real builder rather than of a page, because the deck is assembled fresh
    # every time it opens and never stored (§50).
    print("── the review deck")
    deck = pg.evaluate("""() => {
      const box = document.createElement("div");
      box.innerHTML = deckSlidesFn("finance");
      const h = [...box.querySelectorAll("thead th")].map(e => e.textContent.trim());
      return { slides: box.querySelectorAll(".dslide").length,
               reads: h.filter(x => x === "Reads").length,
               finish: h.filter(x => x === "Finish").length,
               perf: h.filter(x => x === "Performance").length,
               due: h.filter(x => x === "Due date").length };
    }""")
    ck("the deck still builds", deck["slides"] > 0, deck["slides"])
    ck("no slide still says Reads", deck["reads"] == 0, deck["reads"])
    ck("no slide still says Finish", deck["finish"] == 0, deck["finish"])
    ck("the deck's score column says Performance", deck["perf"] > 0, deck["perf"])
    ck("the deck's milestone column says Due date", deck["due"] > 0, deck["due"])

    # ── A HALF THAT IS NOT THERE IS NOT DRAWN (§99.7) ────────────────────
    # THE POINT OF THIS BLOCK IS A CONTROL THAT SHOULD NOT BE DRAWN, which is
    # the one thing a check looking for something PRESENT can never see
    # (§94.2). No demo project has an empty half — 0 of 19 — so the state has
    # to be made, or this behaviour is untested for ever and the first client
    # to author a project with no outcomes is the one who finds out.
    print("── empty halves")
    pg.evaluate("""() => {
      const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
      c.projects[0].outcomes = [];                                  // no outcomes
      c.projects[1].deliverables = [];                              // no deliverables
      c.projects[2].outcomes = []; c.projects[2].deliverables = []; // neither
    }""")
    goto(pg, DEST, "Strategy", "Projects", False)

    def halves(pg):
        return pg.evaluate("""() => {
          const t = [...document.querySelectorAll("table")].filter(x => x.querySelector("tr.dxband"));
          return { bands: t.flatMap(x => [...x.querySelectorAll("tr.dxband th")]
                     .map(b => b.firstChild.textContent.trim())),
                   heads: [...document.querySelectorAll("h4.mini")]
                     .map(e => e.textContent.trim())
                     .filter(h => /Deliverab|Outcome/.test(h)) };
        }""")

    WANT = [("no outcomes", ["Deliverables"]),
            ("no deliverables", ["Outcomes"]),
            ("neither", [])]
    for i, (what, want) in enumerate(WANT):
        items = pg.query_selector_all(".rail .ritem")
        if i >= len(items):
            ck("the rail offers project %d" % (i + 1), False, len(items))
            continue
        items[i].click()
        pg.wait_for_timeout(400)
        got = halves(pg)
        ck("%s: only the half that has rows is drawn" % what, got["bands"] == want, got["bands"])
        # THE HEADING IS READ OFF THE SAME ANSWER, or a section names a half it
        # is not drawing — which is the failure this assertion exists for and
        # is invisible to anything that only counts bands.
        if want:
            ck("%s: the heading names only that half" % what,
               len(got["heads"]) == 1 and got["heads"][0].split(" \u2014 ")[0]
                 .replace(" and outcomes", "") == want[0], got["heads"])
        else:
            ck("%s: the section is absent entirely" % what, not got["heads"], got["heads"])

    # AND BEHIND THE PEN, BOTH HALVES ARE BACK. A half hidden for being empty
    # in EDIT mode is a half nobody can ever fill, because the add row is the
    # only way to write its first line — §61's fault exactly.
    pg.query_selector_all(".rail .ritem")[2].click()
    pg.wait_for_timeout(300)
    pen = pg.query_selector(".paneact button")
    if not pen:
        ck("the plan pane offers a pen", False)
    else:
        pen.click()
        pg.wait_for_timeout(600)
        got = halves(pg)
        ck("authoring draws both halves even when both are empty",
           got["bands"] == ["Deliverables", "Outcomes"], got["bands"])
        adds = pg.eval_on_selector_all("[data-rowadd]", "e=>e.map(x=>x.dataset.rowadd.split('|')[0])")
        ck("...so the first deliverable and the first outcome can be written",
           "deliverable" in adds and "outcome" in adds, adds)
        d = pg.query_selector(".paneact button")
        if d:
            d.click()
            pg.wait_for_timeout(300)

    b.close()

for e in errs:
    print("    FAIL", e)
    bad += 1
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
