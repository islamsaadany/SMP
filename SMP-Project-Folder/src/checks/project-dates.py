"""A PROJECT'S DATES, AND THE TYPE COLUMN (§179).

Two of Islam's four, and they meet on the same three panes.

THE DATES. Start and End were a free text box, and a live tenant had typed
`30/4/2026` into one — a value `monthsOf()` cannot read at all, so that
project's End was, to the platform, no date. §179 replaces the box with
§177's month picker, which can only produce a shape the reader already
knows. `checks/project-header.py` presses that control and reads the plan
back; what is asserted HERE is the half nothing else covers:

  · `projOverruns()` reads dates the way the rest of the platform does.
    It used `Date.parse` directly, and `Date.parse("Jul 26")` is 26 July
    **2001** — so the moment the picker shipped, a warning that had been
    silently dead would have come back as a false one firing on every
    milestone of every project. The assertion is therefore an EXACT SET,
    never "at least one": a build with the old reader passes any
    "something overran" test and fails this.

  · An END takes the LAST month of a span. A project ending "Q4 2026" ends
    in December, not October — the same rule monthsOf() documents for a
    cycle named Q2 covering April to June.

THE TYPE COLUMN. Islam: "for the types deliverable and Outcome don't make
them chips let's make them normal text." Asserted on ALL THREE panes,
because one builder feeds Plan, Performance and Reporting and a change to
it that reached two of them would be §53.5's drift. BOTH ENDS (§113.8): the
chip is gone AND the words are still there AND the column still has its
measure — a build that dropped the whole cell would satisfy "no chip".

PROVE IT CAN FAIL (§94.5). Run against the shipped pre-§179 file:

    SMP_DATES_HTML=../strategy-management-platform-v3.22.html \\
      SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/project-dates.py

Run:  SMP_CHROME=/opt/pw-browsers/chromium python3 qa-run.py checks/project-dates.py
"""
import os, pathlib
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
FILE = pathlib.Path(os.environ.get("SMP_DATES_HTML") or
                    (HERE.parent / "strategy-management-platform.html"))
if not FILE.is_absolute():
    FILE = (HERE.parent / FILE).resolve()

FN = "finance"
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def go_project(pg):
    """The one walk to a capability's Projects pane."""
    pg.click("#units [data-fold]"); pg.wait_for_timeout(260)
    pg.click('[data-u="fn:%s"]' % FN); pg.wait_for_timeout(360)
    pg.click('[data-s="fnstrat"]'); pg.wait_for_timeout(260)
    pg.click('[data-sub2="proj"]'); pg.wait_for_timeout(560)


with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 980})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto("file://" + str(FILE)); pg.wait_for_timeout(800)

    # ══ 1 · THE OVERRUN WARNING READS DATES THE PLATFORM'S WAY ═════════════
    print("\n── the reader behind the overrun warning")

    # `timeline:"date"` is the gate this function has always had, and §179
    # deliberately does not widen it (§109 recorded that as its own decision).
    # Every case below therefore carries it, so the gate is held constant and
    # what is measured is the READER.
    def overruns(end, finishes):
        return pg.evaluate("""([end, fins]) => projOverruns({
            timeline:"date", end:end,
            milestones: fins.map((f,i)=>({ id:"m"+i, name:"m"+i, finish:f }))
          }).map(m=>m.name);""", [end, finishes])

    # The trap, stated as a measurement rather than as a claim.
    parsed_2001 = pg.evaluate("""()=>{const t=Date.parse("Nov 26");
        return isNaN(t) ? null : new Date(t).getFullYear();}""")
    ck("Date.parse reads 'Nov 26' as 2001 — which is why it is not used",
       parsed_2001 == 2001, parsed_2001)

    got = overruns("Nov 26", ["Oct 26", "Nov 26", "Dec 26", "Jan 27"])
    ck("a month AFTER the end overruns, and only those",
       got == ["m2", "m3"], got)

    got = overruns("Nov 26", ["Nov 26"])
    ck("the end's OWN month is not an overrun", got == [], got)

    # An end written as a quarter ends in the quarter's LAST month.
    got = overruns("Q4 2026", ["Nov 26", "Dec 26", "Jan 27"])
    ck("'Q4 2026' ends in December, not October", got == ["m2"], got)

    # A milestone the reader cannot read is left out rather than guessed at —
    # the same rule monthParts() follows for the picker (§96.2).
    got = overruns("Nov 26", ["On-going", "Dec 26"])
    ck("an unreadable milestone date is skipped, not assumed", got == ["m1"], got)

    # And an unreadable END gives up entirely rather than comparing against
    # nothing. This is the live tenant's `30/4/2026`.
    got = overruns("30/4/2026", ["Dec 26", "Jan 27"])
    ck("an unreadable END warns about nothing", got == [], got)

    # ══ 2 · THE TYPE COLUMN IS PLAIN TEXT, ON ALL THREE PANES ══════════════
    print("\n── deliverable and outcome, unchipped")

    def type_cells(pg):
        """The Type cell of every deliverable/outcome row on screen."""
        return pg.evaluate("""()=>{
          const out=[];
          document.querySelectorAll('.dxtype').forEach(e=>{
            const cs=getComputedStyle(e), td=e.closest('td');
            out.push({ text:e.textContent.trim(),
                       pill:e.classList.contains('pill'),
                       minw:parseFloat(cs.minWidth)||0,
                       border:cs.borderTopWidth,
                       w: td ? Math.round(td.getBoundingClientRect().width) : 0 });
          });
          return out;}""")

    for tag, walk in (
        ("plan", lambda: go_project(pg)),
        ("performance", lambda: (pg.click('[data-s="fnperf"]'), pg.wait_for_timeout(620))),
        ("reporting", lambda: (pg.click('[data-report="fn:%s"]' % FN), pg.wait_for_timeout(620))),
    ):
        walk()
        cells = type_cells(pg)
        ck("%-12s the column is drawn at all" % tag, len(cells) > 0, len(cells))
        if not cells:
            continue
        # BOTH ENDS: the words survive...
        words = sorted(set(c["text"] for c in cells))
        ck("%-12s ...and still says Deliverable / Outcome" % tag,
           words and set(words) <= {"Deliverable", "Outcome"}, words)
        # ...the chip does not...
        ck("%-12s no chip: not a .pill, no border" % tag,
           all(not c["pill"] and c["border"] == "0px" for c in cells),
           [c for c in cells if c["pill"] or c["border"] != "0px"][:1])
        # ...and the MEASURE that kept the column steady is still there. This
        # is the half that was load-bearing: the two words are seven characters
        # apart, and a column that resizes with its rows moves every column
        # beside it.
        ck("%-12s the column keeps its fixed measure" % tag,
           all(c["minw"] >= 90 for c in cells), [c["minw"] for c in cells][:3])
        # The cells all render at ONE width, which is what that measure buys —
        # asserted of the rendering, never of the number (§94.8).
        widths = sorted(set(c["w"] for c in cells))
        ck("%-12s ...so every Type cell is one width" % tag,
           len(widths) == 1, widths)

    ck("no console errors", not errs, errs[:1])
    pg.close()
    b.close()

print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
