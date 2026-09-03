"""A REPEATING PROJECT (§115) — and what a new cycle now leaves alone.

Islam: "the CX mystery shopping happens on H1 and is repeated for H2, same
outcomes, same deliverables, same timeline — but we don't want things repeated
in the same project."

The machinery mostly existed: every new cycle already archived and cleared
EVERY project's figures (clearCapability's "nums" pass). What §115 changes is
that the clear became a decision each project makes — a project marked
`repeats: "cycle"` is re-asked with its dates shifted one cycle forward, and
an unmarked one KEEPS its figures, because delivered is delivered.

THIS CHECK FAILS ON THE PRE-§115 BUILD BY CONSTRUCTION: there, the unmarked
project is wiped too, and no date shifts. The state is MADE (§94.2 — the demo
has no repeating project), the cycle is closed and reopened through the REAL
controls with their real confirm dialogs, and the archive is read back for the
fields migration 024 renamed (§51.10 found them stale in the snapshot).
"""
import os
from playwright.sync_api import sync_playwright

URL = "file://" + os.path.abspath(os.path.join(os.path.dirname(__file__), "..",
      "strategy-management-platform.html"))
bad = 0
def ck(w, ok, x=""):
    global bad
    if not ok: bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — %s" % (x,)) if not ok and x != "" else ""))

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("dialog", lambda d: d.accept())
    pg.goto(URL); pg.wait_for_timeout(1500)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)

    # ── the writer, shape by shape (§104's reader has its mirror now) ────
    print("── shiftWhen, the date writer")
    shapes = pg.evaluate("""() => {
      const t = (v, by, want) => ({ v, by, got: shiftWhen(v, by), want });
      return [
        t("March 2026", 6, "September 2026"),
        t("Mar 26", 6, "Sep 26"),
        t("W3 Mar 26", 6, "W3 Sep 26"),
        t("November 2026", 6, "May 2027"),
        t("Q1 2026", 6, "Q3 2026"),
        t("Q3 2026", 6, "Q1 2027"),
        t("Q3", 6, "Q1"),
        t("H1 2026", 6, "H2 2026"),
        t("31 May 2026", 6, "30 Nov 2026"),
        t("1 Jan 2026", 6, "1 Jul 2026"),
        t("Dec 26", 1, "Jan 27"),
        t("Q2", 4, "Q2"),
        t("Pending", 6, "Pending"),
        t("", 6, ""),
        t("FY26", 6, "FY26")
      ];
    }""")
    for c in shapes:
        if c["got"] != c["want"]:
            ck("shift(%r, %s) = %r" % (c["v"], c["by"], c["want"]), False, c["got"])
    ck("all %d shapes shift correctly (unreadable ones untouched)" % len(shapes),
       all(c["got"] == c["want"] for c in shapes))

    # ── the mark, through the real control (§96: it must WRITE) ─────────
    print("── the mark, set from the pen")
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    pg.click('#units button[data-u="fn:finance"]'); pg.wait_for_timeout(500)
    pg.click('.pane .paneact .penbtn[data-page="plan"]'); pg.wait_for_timeout(500)
    # §196: THE MARK IS A COUNT OF MONTHS. What is asserted is that every
    # option the control OFFERS writes the value its label names — never a
    # list of literals here, or the check and the product each hold their own
    # idea of the vocabulary and only one of them is the product (§53.5).
    r = pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      const row = [...document.querySelectorAll('.pfront .pfrow')]
        .find(x => x.querySelector('em').textContent.trim() === 'Repeats');
      const sel = row && row.querySelector('select');
      if (!sel) return { none: true };
      const offered = [...sel.options].map(o => o.value);
      const wrote = {};
      offered.forEach(v => {
        sel.value = v;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        wrote[v] = ("repeats" in p) ? p.repeats : null;
      });
      return { offered: offered, wrote: wrote };
    }""")
    ck("the pen offers a month count, not one word",
       r.get("offered") == ["No", "Every 3 months", "Every 6 months", "Every 12 months"],
       r.get("offered"))
    ck("...and every option writes what its label says",
       r.get("wrote") == {"No": None, "Every 3 months": 3,
                          "Every 6 months": 6, "Every 12 months": 12}, r.get("wrote"))
    pg.wait_for_timeout(300)

    # §30.2 / §96.2: a project marked BEFORE §196 keeps its behaviour, and the
    # word goes on being offered while it is the stored value — never quietly
    # rewritten to a number that might not mean the same thing.
    r = pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      p.repeats = "cycle"; paint();
      const row = [...document.querySelectorAll('.pfront .pfrow')]
        .find(x => x.querySelector('em').textContent.trim() === 'Repeats');
      const sel = row && row.querySelector('select');
      return { offered: sel ? [...sel.options].map(o => o.value) : null,
               showing: sel ? sel.value : null,
               stillStored: p.repeats,
               movesBy: repeatSpan(p, 6) };
    }""")
    ck("a legacy 'Each cycle' is still offered while it is what is stored",
       r.get("offered", [])[:2] == ["No", "Each cycle"], r.get("offered"))
    ck("...and shown, and not rewritten",
       r.get("showing") == "Each cycle" and r.get("stillStored") == "cycle", r)
    ck("...and still means the cycle's own length", r.get("movesBy") == 6, r)
    pg.wait_for_timeout(200)

    # HOW FAR THE DATES MOVE, asked of the rule rather than of a rendered date.
    r = pg.evaluate("""() => ({
      q_short: repeatSpan({repeats:3},  6),   // quarterly, half-yearly cycle
      q_same:  repeatSpan({repeats:6},  6),
      q_long:  repeatSpan({repeats:12}, 6),   // annual, half-yearly cycle
      legacy:  repeatSpan({repeats:"cycle"}, 6),
      none:    repeatSpan({}, 6)
    })""")
    ck("a quarterly project keeps pace with a six-month cycle (6, not 3)",
       r["q_short"] == 6, r)
    ck("a six-month project moves six", r["q_same"] == 6, r)
    ck("an annual project moves to its next run a year on, not half of one",
       r["q_long"] == 12, r)
    ck("an unmarked project moves nothing at all", r["none"] == 0, r)
    pg.wait_for_timeout(200)
    pg.evaluate("""() => { const p = capsOfFunction("finance")[0].projects[0];
                           delete p.repeats; paint(); }""")
    pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      const row = [...document.querySelectorAll('.pfront .pfrow')]
        .find(x => x.querySelector('em').textContent.trim() === 'Repeats');
      const sel = row && row.querySelector('select');
      sel.value = "Every 6 months";
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { stored: p.repeats };
    }""")
    ck("the Repeats select writes the mark", r.get("stored") == 6, r)
    pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      const p = capsOfFunction("finance")[0].projects[0];
      const row = [...document.querySelectorAll('.pfront .pfrow')]
        .find(x => x.querySelector('em').textContent.trim() === 'Repeats');
      const sel = row && row.querySelector('select');
      sel.value = "No"; sel.dispatchEvent(new Event('change', { bubbles: true }));
      return { key: "repeats" in p };
    }""")
    ck("...and No DELETES the key (§50.6), never stores a false", r["key"] is False, r)
    pg.wait_for_timeout(300)
    # read mode: row absent when unmarked, present when marked
    pg.evaluate("""() => {
      capsOfFunction("finance")[0].projects[0].repeats = 6;
      EDIT_PAGE.plan = false; paint(); }""")
    pg.wait_for_timeout(300)
    r = pg.evaluate("""() => {
      const rows = [...document.querySelectorAll('.pfront .pfrow em')].map(e => e.textContent.trim());
      return rows; }""")
    ck("read mode shows the Repeats row on the marked project", "Repeats" in r, r)

    # ── the cycle turns, through the real controls ──────────────────────
    print("── a new cycle: the repeat is re-asked, the build-once is left alone")
    before = pg.evaluate("""() => {
      const caps = capsOfFunction("finance");
      const p1 = caps[0].projects[0];            // marked above
      const p2 = caps[0].projects[1];            // build-once
      // make sure both carry figures and known dates
      p1.milestones[0].status = "done"; p1.milestones[0].pct = null;
      p1.milestones[0].finish = "March 2026";
      p1.milestones[1].status = "wip"; p1.milestones[1].pct = 40;
      p1.deliverables[0].status = "done"; p1.deliverables[0].due = "Feb 26";
      p1.deliverables[0].note = "run one note";
      p1.outcomes[0].actual = "20 h"; p1.outcomes[0].progress = 50;
      p1.outcomes[0].measureAt = "Q2 2026";
      p1.start = "1 Jan 2026"; p1.end = "30 Apr 2026";
      p2.milestones[0].status = "done"; p2.milestones[0].pct = null;
      p2.deliverables[0].status = "done"; p2.deliverables[0].note = "keep me";
      return { p1: p1.id, p2: p2.id, archN: ARCHIVES.length };
    }""")
    # close, then open, through Setup › Running the cycle
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(80)
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('.setuprail [data-setupgo]')]
        .find(x=>/cycle/i.test(x.textContent)); if(b)b.click()}"""); pg.wait_for_timeout(500)
    # §261: CLOSE THE CYCLE IS BEHIND THE PEN NOW (Islam: "keep the close cycle
    # inside the edit ... it's a critical button to click"), so the turn of the
    # cycle this check drives starts one press earlier. §51.11: a check keyed on
    # markup that moved does not fail, it passes quietly.
    pg.click("[data-editcycle]"); pg.wait_for_timeout(400)
    pg.click(".newcycle [data-closecycle]"); pg.wait_for_timeout(600)
    pg.click("[data-opencycle]"); pg.wait_for_timeout(400)
    pg.fill("#nc-name", "H2 2026")
    pg.fill("#nc-from", "Jul 2026"); pg.fill("#nc-to", "Dec 2026")
    # §239: A CYCLE IS NOW OPENED WITH A REVIEW POINT, and it is picked rather
    # than typed -- the whole feature exists because a review point nobody
    # chose was deciding every score. Pressed through the real picker, because
    # writing NEWCYCLE.asOfMonth directly would test a door nobody can open.
    pg.click(".newcycle .monthbtn"); pg.wait_for_timeout(250)
    pg.evaluate("""()=>{const b=[...document.querySelectorAll('.monthpop [data-mpick]')]
        .find(x=>/Dec/.test(x.textContent)); if(b)b.click();}""")
    pg.wait_for_timeout(300)
    pg.wait_for_timeout(200)
    pg.click("[data-nc-go]"); pg.wait_for_timeout(800)

    after = pg.evaluate("""(ids) => {
      const caps = capsOfFunction("finance");
      const p1 = caps[0].projects.find(p => p.id === ids.p1);
      const p2 = caps[0].projects.find(p => p.id === ids.p2);
      const arch = ARCHIVES[0];
      const capId = caps[0].id;
      const am = (arch && arch.figures && arch.figures.caps || {})[capId] || {};
      return {
        cycle: REVIEW.name,
        p1: { ms0: p1.milestones[0].status, ms0finish: p1.milestones[0].finish,
              ms1pct: p1.milestones[1].pct,
              d0: p1.deliverables[0].status, d0due: p1.deliverables[0].due,
              d0note: p1.deliverables[0].note,
              o0: p1.outcomes[0].actual, o0at: p1.outcomes[0].measureAt,
              start: p1.start, end: p1.end },
        p2: { ms0: p2.milestones[0].status, d0: p2.deliverables[0].status,
              d0note: p2.deliverables[0].note },
        archHasDeliv: am[Object.keys(am).find(id =>
          am[id] && am[id].status !== undefined && am[id].pct !== undefined)] || null,
        archN: ARCHIVES.length
      };
    }""", {"p1": before["p1"], "p2": before["p2"]})

    ck("the cycle turned [%s]" % after["cycle"], after["cycle"] == "H2 2026", after["cycle"])
    p1 = after["p1"]
    ck("repeat: figures cleared",
       p1["ms0"] is None and p1["d0"] is None and p1["o0"] is None and p1["d0note"] == "", p1)
    ck("repeat: every date shifted one cycle (6 months)",
       p1["ms0finish"] == "September 2026" and p1["d0due"] == "Aug 26"
       and p1["o0at"] == "Q4 2026" and p1["start"] == "1 Jul 2026"
       and p1["end"] == "30 Oct 2026", p1)
    p2 = after["p2"]
    ck("build-once: figures KEPT — delivered is delivered",
       p2["ms0"] == "done" and p2["d0"] == "done", p2)
    ck("build-once: the note explaining a standing figure stands with it",
       p2["d0note"] == "keep me", p2)
    ck("the run was archived first", after["archN"] > before["archN"], after["archN"])
    ck("...and the archive carries status AND pct (the fields 024 renamed)",
       after["archHasDeliv"] is not None, after["archHasDeliv"])

    ck("no console errors", not errs, errs[:2])
    b.close()
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
