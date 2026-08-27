"""FILL THE GAPS (§132, spec 021) — the screen half, both ends of every door.

· The matrix's Strategy cells carry the third toggle, no other cell does, and
  pressing it stores the grant the rule then answers from.
· Fill mode draws ONLY the gaps: the fields the custodian can type are the
  blank ones, everything settled stays text, and the absences are asserted —
  no add row, no ×, no name field, no drag handle (§94.2: a check that only
  looks for something present cannot see a control that should not be drawn).
· Every press is read back out of the DATA (§96: an editor wired to nothing
  looks identical and discards every keystroke).
· A pending value is amber, still the filler's, and carries the office's
  tick; confirming lifts the mark; an office edit confirms in passing.
· A pending target scores a dash, leaves the average, and blocks Submit —
  while the reported actual and Save draft are untouched.

THE CHECK MAKES ITS GAPS (§94.2): the demo plan is complete, so a check that
only opened it would never draw a single fill field.

PROVED ABLE TO FAIL (§94.5): run against the pre-§132 build it fails from the
first section — the third toggle does not exist there, and the pen never
opens for the custodian.
"""
import sys
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def be(pg, key, dest=None, tab=None, sec=None):
    pg.evaluate("""(a) => {
      VIEWER = a.k; leaveModes();
      current = a.dest || null; currentSub = a.tab || null;
      if (a.tab && a.sec) CURSEC[a.tab] = a.sec;
      paint();
    }""", {"k": key, "dest": dest, "tab": tab, "sec": sec})
    pg.wait_for_timeout(400)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    who = pg.evaluate("""() => {
      const u = "mobile";
      return { unit: u,
               smo: PEOPLE.filter(p => p.role === "super")[0].key,
               cust: (UNIT_ROLES[u] || {}).custodian };
    }""")
    print("unit %(unit)s · smo %(smo)s · custodian %(cust)s" % who)

    # ── 1 · THE MATRIX OFFERS THE THIRD STATE, ON THE RIGHT CELLS ONLY ──
    print("\n1 · the third toggle, where it belongs and nowhere else")
    be(pg, who["smo"])
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(250)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(350)
    ck("the Strategy cell offers Fill gaps",
       pg.query_selector('[data-ac="custodian|a_unit_own_strat|fill"]') is not None)
    ck("...the function half too",
       pg.query_selector('[data-ac="fnhead|a_fn_own_strat|fill"]') is not None)
    ck("...and the Reporting half does NOT (§42: a toggle that grants nothing)",
       pg.query_selector('[data-ac="custodian|a_unit_own|fill"]') is None)
    ck("the legend explains it",
       pg.evaluate("() => document.body.textContent.includes('may fill what’s empty')"))

    pg.click('[data-ac="custodian|a_unit_own_strat|fill"]'); pg.wait_for_timeout(350)
    lit = pg.evaluate("""() =>
      !!document.querySelector('.stbtn.on.st-fill[data-ac^="custodian|a_unit_own_strat"]')""")
    ck("pressing it lights the amber state", lit)
    rule = pg.evaluate("""(w) =>
      SMPRules.mayFillPage(world(), personBy(w.cust), "u_plan", w.unit)""", who)
    ck("...and the rule answers for the custodian", rule is True)
    ck("...while authorship stays refused", pg.evaluate("""(w) =>
      SMPRules.mayAuthorPage(world(), personBy(w.cust), "u_plan", w.unit)""", who) is False)

    # ── 2 · THE GAPS ARE MADE, AND FILL MODE DRAWS THEM ALONE ──────────
    print("\n2 · fill mode opens only the blanks")
    pg.evaluate("""(u) => {
      const x = UNITS[u];
      x.items[0].measures[0].compile = "";
      x.items[0].tactics[0].owner = "";
      const t = x.items[0].tactics[0];
      t.q1 = 0; t.q2 = 0; t.q3 = 0; t.q4 = 0;
      x.keyObjectives[0].target = "";
      paint();
    }""", who["unit"])
    pg.wait_for_timeout(300)

    be(pg, who["cust"], who["unit"], "strategy", "plan")
    pen = pg.query_selector('.pane .paneact .penbtn[data-page="plan"]')
    ck("the custodian's pen appears", pen is not None)
    ck("...and it says what it opens",
       pen is not None and pen.get_attribute("title") == "Fill the gaps",
       pen and pen.get_attribute("title"))
    if pen:
        pen.click(); pg.wait_for_timeout(400)
    shape = pg.evaluate("""() => ({
      gaps:    document.querySelectorAll('.pane .fld.gapfld').length,
      qfill:   document.querySelectorAll('.pane [data-qfill]').length,
      adds:    document.querySelectorAll('.pane [data-rowadd]').length,
      offs:    document.querySelectorAll('.pane [data-rowoff], .pane .xbtn').length,
      handles: document.querySelectorAll('.pane .handle, .pane [draggable]').length,
      fields:  document.querySelectorAll('.pane .fld').length,
      bar:     !!document.querySelector('.pane .fillbar, .fillbar') })""")
    ck("the two blank cells draw fill fields", shape["gaps"] == 2, shape)
    ck("the no-quarter tactic draws the four fill buttons", shape["qfill"] == 4, shape)
    ck("no add row in fill mode", shape["adds"] == 0, shape)
    ck("no remove × in fill mode", shape["offs"] == 0, shape)
    ck("no drag handle in fill mode", shape["handles"] == 0, shape)
    ck("no field beyond the gaps — names and settled values stay text",
       shape["fields"] == shape["gaps"], shape)
    ck("the mode bar states the contract", shape["bar"])

    # ── 3 · A FILL WRITES THE DATA AND WEARS THE MARK ───────────────────
    print("\n3 · pressing writes, and the write wears the mark")
    r = pg.evaluate("""(w) => {
      const sel = [...document.querySelectorAll('.pane select.fld.gapfld')][0];
      if (!sel) return { none: true };
      sel.value = "Latest";
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const m = UNITS[w.unit].items[0].measures[0];
      return { compile: m.compile, pend: m.pend ? m.pend.compile : null };
    }""", who)
    ck("the compile fill lands in the data", not r.get("none") and r["compile"] == "Latest", r)
    ck("...stamped pending, by the person filling",
       bool(r.get("pend")) and r["pend"]["by"] == who["cust"], r)

    pg.evaluate("""() => {
      const q = document.querySelector('.pane [data-qfill$="|2"]');
      if (q) q.click();
    }""")
    pg.wait_for_timeout(350)
    r = pg.evaluate("""(w) => {
      const t = UNITS[w.unit].items[0].tactics[0];
      return { q2: !!t.q2, pend: t.pend ? !!t.pend.quarters : false };
    }""", who)
    ck("a quarter fill lands and the four wear ONE mark", r["q2"] and r["pend"], r)

    # amend while pending: the field is still open, amber, and writes again
    amber = pg.evaluate("""() =>
      document.querySelectorAll('.pane .fld.pendfld, .pane .qs-fill').length""")
    ck("the pending fills stay open to the filler (amber)", amber >= 1, amber)
    r = pg.evaluate("""(w) => {
      const sel = [...document.querySelectorAll('.pane select.fld.pendfld')][0];
      if (!sel) return { none: true };
      sel.value = "Average";
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const m = UNITS[w.unit].items[0].measures[0];
      return { compile: m.compile, pend: !!(m.pend && m.pend.compile) };
    }""", who)
    ck("amending a pending value writes and keeps the mark",
       not r.get("none") and r["compile"] == "Average" and r["pend"], r)

    # ── 4 · READ MODE: THE CHIP, THE COUNT, AND NO TICK FOR THE FILLER ──
    print("\n4 · pending reads as pending, and the tick is the office's")
    pg.click('.pane .paneact .penbtn[data-page="plan"]'); pg.wait_for_timeout(400)
    r = pg.evaluate("""() => ({
      chips: document.querySelectorAll('.pane .pchip').length,
      ticks: document.querySelectorAll('.pane .gapok').length,
      badge: (document.querySelector('.pendcount') || {}).textContent || "" })""")
    ck("the pending chips are drawn in read mode", r["chips"] >= 2, r)
    ck("the custodian sees no confirm tick", r["ticks"] == 0, r)
    ck("the count sits on the band", "awaiting confirmation" in r["badge"], r)

    # ── 5 · THE SCORE WAITS, THE REPORT DOES NOT ────────────────────────
    print("\n5 · a pending target: dash, excluded, submit refused, draft alive")
    r = pg.evaluate("""(w) => {
      const p = UNITS[w.unit].items[0], m = p.measures[1];
      const inBefore = scorableMeasures(p).some(x => x.id === m.id);
      m.pend = { target: { by: w.cust, at: "2026-08-27" } };
      const inAfter = scorableMeasures(p).some(x => x.id === m.id);
      paint();
      return { inBefore, inAfter, prog: m.progress,
               pending: SMPRules.pendingScore(m) };
    }""", who)
    pg.wait_for_timeout(300)
    ck("the rule reads the row as score-pending", r["pending"] is True)
    # THE RELATIONSHIP, NOT THE NUMBER (§94.14): excluding a value near the
    # mean does not move a rounded average, so membership is what is asserted.
    ck("the row leaves the scorable set the average reads",
       r["inBefore"] is True and r["inAfter"] is False, r)
    be(pg, who["cust"], who["unit"], "performance")
    perf = pg.evaluate("""() => {
      const line = document.querySelector('.pendwait');
      const dash = [...document.querySelectorAll('.pill.none')]
        .some(e => (e.title || "").includes('not counted yet'));
      return { dash, line: line ? line.textContent : "" };
    }""")
    ck("the score reads a dash with the reason on hover", perf["dash"], perf)
    ck("...and the table says why — 'not counted yet'",
       "not counted yet" in perf["line"] and
       "awaiting Strategy Office confirmation" in perf["line"], perf)
    sub = pg.evaluate("""(w) => submitRefusal(w.unit)""", who)
    ck("Submit is refused, naming the wait",
       "awaiting Strategy Office confirmation" in sub, sub[:120])
    ck("...and the refusal says reporting and drafts are unaffected",
       "unaffected" in sub, sub[:160])
    blockers = pg.evaluate("""(w) => submitBlockers(w.unit).confirms.length""", who)
    ck("the blocker list carries the pending rows", blockers >= 2, blockers)

    # ── 6 · THE OFFICE CONFIRMS — BY TICK, AND BY CORRECTING ────────────
    print("\n6 · confirming, both of the office's ways")
    be(pg, who["smo"], who["unit"], "strategy", "plan")
    r = pg.evaluate("""() => ({
      ticks: document.querySelectorAll('.pane .gapok').length })""")
    ck("the office sees the confirm ticks", r["ticks"] >= 1, r)
    r = pg.evaluate("""(w) => {
      const t = document.querySelector('.pane .gapok');
      if (!t) return { none: true };
      t.click();
      return { left: Object.keys(UNITS[w.unit].items[0].measures[0].pend || {}).length };
    }""", who)
    pg.wait_for_timeout(400)
    ck("the tick lifts the mark from the data", not r.get("none") and r["left"] == 0, r)

    # correcting confirms: the office edits the pending target through the pen
    r = pg.evaluate("""(w) => {
      const m = UNITS[w.unit].items[0].measures[1];
      return { pendBefore: !!(m.pend && m.pend.target) };
    }""", who)
    ck("(fixture) the second measure still holds its pending target", r["pendBefore"])
    pg.click('.pane .paneact .penbtn[data-page="plan"]'); pg.wait_for_timeout(400)
    r = pg.evaluate("""(w) => {
      const m = UNITS[w.unit].items[0].measures[1];
      const flds = [...document.querySelectorAll('.pane .fld')];
      const mine = flds.filter(f => f.value === String(m.target))[0];
      if (!mine) return { none: true };
      mine.value = m.target + " corrected";
      mine.dispatchEvent(new Event('change', { bubbles: true }));
      return { target: m.target, pend: !!(m.pend && m.pend.target) };
    }""", who)
    ck("an office write settles the value — correcting confirms",
       not r.get("none") and r["pend"] is False, r)

    # ── 7 · THE FOUNDATION'S GAPS FILL THE SAME WAY ─────────────────────
    print("\n7 · the key objectives table, through the same one builder")
    be(pg, who["cust"], who["unit"], "strategy", "found")
    fpen = pg.query_selector('[data-page="foundation"]')
    ck("the foundation pen appears for the custodian", fpen is not None)
    if fpen:
        fpen.click(); pg.wait_for_timeout(400)
    r = pg.evaluate("""(w) => {
      const inp = [...document.querySelectorAll('.koband .fld.gapfld')][0];
      if (!inp) return { none: true, n: document.querySelectorAll('.koband .fld').length };
      inp.value = "EGP 9.9bn";
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      const k = UNITS[w.unit].keyObjectives[0];
      return { target: k.target, pend: !!(k.pend && k.pend.target),
               adds: document.querySelectorAll('.koband [data-koadd]').length,
               rms: document.querySelectorAll('.koband .rmbtn').length };
    }""", who)
    ck("the blank KO target fills and wears the mark",
       not r.get("none") and r["target"] == "EGP 9.9bn" and r["pend"], r)
    ck("no Add and no Remove in the KO band's fill mode",
       not r.get("none") and r["adds"] == 0 and r["rms"] == 0, r)

    print("")
    ck("no page errors anywhere in the run", not errs, "; ".join(errs[:3]))
    b.close()

print("\n%s" % ("ALL OK" if bad == 0 else "%d FAILURES" % bad))
sys.exit(1 if bad else 0)
