"""FILL THE GAPS (§145, spec 023) — the screen half, both ends of every door.

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

PROVED ABLE TO FAIL (§94.5): run against the pre-§145 build it fails from the
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
      const world_ = world();
      const bystander = PEOPLE.filter(p => {
        if (!personActive(p) || !p.unit) return false;
        const rs = SMPRules.personRoles(world_, p);
        return rs.every(r => ["owner","custodian","fnhead","super","smoteam"]
          .indexOf(r.role) < 0);
      })[0];
      return { unit: u,
               smo: PEOPLE.filter(p => p.role === "super")[0].key,
               cust: (UNIT_ROLES[u] || {}).custodian,
               floor: bystander ? bystander.key : null,
               floorUnit: bystander ? bystander.unit : null };
    }""")
    print("unit %(unit)s · smo %(smo)s · custodian %(cust)s · floor %(floor)s" % who)

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
      const t = x.items[0].tactics[0];
      t.owner = ""; t.collaborators = [];
      t.q1 = 0; t.q2 = 0; t.q3 = 0; t.q4 = 0;
      /* Every OTHER tactic on this pillar gets a collaborator, so the
         fixture holds exactly one collaborators gap and the counts below
         are deterministic (§145.10 made empty lists gaps). */
      x.items[0].tactics.slice(1).forEach(tt => {
        if (!(tt.collaborators || []).length) tt.collaborators = ["Somebody"];
      });
      /* §249 made a tactic's outcome and its target counted gaps, and the
         shipped plan has neither on any row — so every tactic on this pillar
         is given both, exactly as the line above gives them a collaborator,
         and the fixture goes on holding the gaps it MEANT to hold. The
         outcome's own fill is proved on its own below, where the state is
         made deliberately rather than inherited. */
      x.items[0].tactics.forEach(tt => {
        if (!tt.outcome)   tt.outcome   = "Something measurable";
        if (!tt.outTarget) tt.outTarget = "6 #";
      });
      x.keyObjectives[0].target = "";
      paint();
    }""", who["unit"])
    pg.wait_for_timeout(300)

    be(pg, who["cust"], who["unit"], "strategy", "plan")
    # §145.14: the fill control is a WORDED RED BUTTON beside the arrows,
    # not a pen glyph — drawn only while something is missing.
    # §268: the fill grant's control is the BAR's, in the section row. The
    # corner copy is gone — one control, one place — so this presses the one
    # that is actually there.
    pen = pg.query_selector('#secrow-in .missbar .fillcta[data-fillcta="plan"]')
    ck("the custodian's red button appears on the section line", pen is not None)
    ck("...and it says what it does",
       pen is not None and pen.text_content().strip() == "Fill in missing elements",
       pen and pen.text_content())
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
    ck("the three blank cells draw fill fields (compile, owner, collaborators)",
       shape["gaps"] == 3, shape)
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

    # ── 4 · §218: THE APPROVAL IS GONE, AND IT IS ASSERTED AS AN ABSENCE ──
    print("\n4 · a filled value is live at once (§218)")
    pg.click('#secrow-in .fdone[data-page="plan"]'); pg.wait_for_timeout(400)
    r = pg.evaluate("""() => ({
      chips: document.querySelectorAll('.pane .pchip').length,
      ticks: document.querySelectorAll('.pane .gapok').length,
      badge: document.querySelectorAll('.pendcount').length,
      cta:   document.querySelectorAll('.pendcta').length,
      wait:  document.querySelectorAll('.pendwait').length })""")
    ck("no 'pending' chip is drawn", r["chips"] == 0, r)
    ck("no confirm tick is drawn", r["ticks"] == 0, r)
    ck("no 'awaiting confirmation' count", r["badge"] == 0, r)
    ck("no Review-pending control", r["cta"] == 0, r)
    ck("no 'not counted yet' line", r["wait"] == 0, r)
    # BOTH ENDS (§113.8): a build that drew no plan at all would pass every
    # absence above, so the page must still be showing the values themselves.
    r = pg.evaluate("""(w) => {
      const p = UNITS[w.unit].items[0];
      return { rows: document.querySelectorAll('.pane table tr').length,
               filled: String(p.measures[0].compile || ""),
               stamped: !!(p.measures[0].pend) };
    }""", who)
    ck("...and the plan is still on screen", r["rows"] > 3, r)
    ck("the fill itself is still there", bool(r["filled"]), r)
    ck("and the stamp is still kept, so the filler can correct it",
       r["stamped"] is True, r)

    # ── 5 · THE SCORE COUNTS IT STRAIGHT AWAY ───────────────────────────
    print("\n5 · a filled target scores at once, and Submit does not wait")
    r = pg.evaluate("""(w) => {
      const p = UNITS[w.unit].items[0], m = p.measures[1];
      const inBefore = scorableMeasures(p).some(x => x.id === m.id);
      m.pend = { target: { by: w.cust, at: "2026-08-27" } };
      const inAfter = scorableMeasures(p).some(x => x.id === m.id);
      paint();
      return { inBefore, inAfter };
    }""", who)
    pg.wait_for_timeout(300)
    ck("a stamped row stays in the set the average reads",
       r["inBefore"] is True and r["inAfter"] is True, r)
    be(pg, who["cust"], who["unit"], "performance")
    perf = pg.evaluate("""() => ({
      dash: [...document.querySelectorAll('.pill.none')]
              .some(e => (e.title || "").includes('not counted yet')),
      line: document.querySelectorAll('.pendwait').length })""")
    ck("no dash standing in for a real score", perf["dash"] is False, perf)
    ck("...and no sentence explaining a wait", perf["line"] == 0, perf)
    sub = pg.evaluate("""(w) => submitRefusal(w.unit)""", who)
    ck("Submit no longer names a confirmation",
       "awaiting Strategy Office confirmation" not in sub, sub[:140])
    blk = pg.evaluate("""(w) => Object.keys(submitBlockers(w.unit))""", who)
    ck("...and `confirms` has left the blocker list", "confirms" not in blk, blk)
    # AND THE TWO REAL RULES SURVIVE, or a build that emptied the whole
    # refusal would pass both assertions above (§113.8).
    ck("the note rule still blocks", "note" in sub.lower(), sub[:140])

    # ── 7 · THE FOUNDATION'S GAPS FILL THE SAME WAY ─────────────────────
    print("\n7 · the key objectives table, through the same one builder")
    be(pg, who["cust"], who["unit"], "strategy", "found")
    fpen = pg.query_selector('.fillcta[data-fillcta="foundation"]')
    ck("the foundation card carries the red button for the custodian", fpen is not None)
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

    # ── 8 · COLLABORATORS FILL, AND THE RIGHT WAITS (§145.10) ───────────
    print("\n8 · collaborators fill, and the reporting right waits")
    be(pg, who["cust"], who["unit"], "strategy", "plan")
    pg.click('#secrow-in .missbar .fillcta[data-fillcta="plan"]'); pg.wait_for_timeout(400)
    # §130.1 MET §145 AT THE MERGE: collaborators are TICKED from the
    # register-fed list, never typed — so the fill control is the same
    # multi-select the office's pen uses, and the check picks two REAL
    # options off it rather than inventing names a list cannot produce.
    r = pg.evaluate("""(w) => {
      const sel = document.querySelector('td.collabs select.fld.gapfld');
      if (!sel) return { none: true };
      const opts = [...sel.options].filter(o => o.value).slice(0, 2);
      if (opts.length < 2) return { few: sel.options.length };
      opts.forEach(o => { o.selected = true; });
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const t = UNITS[w.unit].items[0].tactics[0];
      return { picked: opts.map(o => o.value), list: t.collaborators,
               pend: !!(t.pend && t.pend.collaborators),
               named: SMPRules.namedOn(t, { key: "nh", name: opts[0].value }) };
    }""", who)
    ck("two register names picked land in the array and wear the mark",
       not r.get("none") and not r.get("few") and
       r["list"] == r["picked"] and r["pend"], r)
    # §218 REVERSES §145.10 at Islam's direction: with the approval gone
    # there is nothing for the name to wait for, so it counts at once. The
    # cost was stated before it was accepted — somebody who may fill gaps can
    # name themselves and thereby gain that line's reporting right.
    ck("...and a filled name confers the reporting right at once (§218)",
       r.get("named") is True, r)
    r = pg.evaluate("""(w) => {
      const t = UNITS[w.unit].items[0].tactics[0];
      const name = t.collaborators[0];
      delete t.pend.collaborators;
      if (!Object.keys(t.pend).length) delete t.pend;
      return SMPRules.namedOn(t, { key: "nh", name: name });
    }""", who)
    ck("...and counts the moment the mark lifts", r is True)
    pg.click('#secrow-in .fdone[data-page="plan"]'); pg.wait_for_timeout(300)

    # ── 8b · THE OUTCOME AND ITS TARGET FILL, AND ONLY THOSE TWO (§249) ─
    print("\n8b · a tactic's outcome and its target fill; the two beside them do not")
    # §205's PAIRING, ASSERTED FROM THE SCREEN'S SIDE. The server half is in
    # test-authorize.js §26; this is the half that opens the box. A build that
    # counted these and never drew a control is §223 exactly — the server
    # accepts a save the screen has no way of producing — and one that drew
    # the direction and the compile rule beside them would offer a filler an
    # edit the save refuses, costing the fills in the same post (§184).
    pg.evaluate("""(w) => {
      const t = UNITS[w.unit].items[0].tactics[0];
      delete t.outcome; delete t.outTarget; delete t.outDir; delete t.outCompile;
      if (t.pend) { delete t.pend.outcome; delete t.pend.outTarget; }
      paint();
    }""", who)
    be(pg, who["cust"], who["unit"], "strategy", "plan")
    # THE STATE IS ASSERTED BEFORE IT IS CLEARED, or every assertion below is
    # satisfied by a build that never counted these at all: emptied, they must
    # be OWED, and the point of the section is that filling them settles it.
    owed = pg.evaluate("""(w) => SMPRules.gapMissing(
      "tactic", UNITS[w.unit].items[0].tactics[0])""", who)
    ck("an empty outcome and target are owed to start with",
       "outcome" in owed and "outTarget" in owed, owed)
    pg.click('#secrow-in .missbar .fillcta[data-fillcta="plan"]'); pg.wait_for_timeout(400)
    r = pg.evaluate("""(w) => {
      const row = document.querySelector('.pane tbody tr');
      const grid = document.querySelector('.pane td.tgtcell .tgrid');
      if (!grid) return { nogrid: true };
      const out = { boxes: [...grid.children].filter(c => !c.classList.contains('ss-native')).length,
                    opens: grid.querySelectorAll('.fld').length,
                    folds: !!document.querySelector('.pane td.tgtcell') };
      const area = [...document.querySelectorAll('.pane textarea.fld.gapfld')]
        .filter(a => a.closest('td') && a.closest('td').cellIndex === 2)[0];
      if (area) { area.value = "Stores opened";
                  area.dispatchEvent(new Event('change', { bubbles: true })); }
      const num = grid.querySelector('input.fld');
      if (num) { num.value = "6"; num.dispatchEvent(new Event('change', { bubbles: true })); }
      const t = UNITS[w.unit].items[0].tactics[0];
      out.outcome = t.outcome; out.target = t.outTarget;
      out.marks = Object.keys(t.pend || {});
      return out;
    }""", who)
    ck("the four boxes are still four in fill mode", r.get("boxes") == 4, r)
    # TWO OF THE FOUR OPEN AND TWO READ. The direction and the compile rule
    # carry working defaults, so they are not gaps — drawn read-only rather
    # than dropped, because inside a block of four equal boxes a hole reads as
    # a control that failed to render (§248's own ruling about the unit).
    ck("...and exactly two of them open", r.get("opens") == 2, r)
    # §61: the cell keeps `.tgtcell` while it holds controls, or below 880 the
    # Target column folds away and takes the only way to set one with it.
    ck("...in a cell the narrow layout cannot fold away", r.get("folds"), r)
    ck("the outcome written by a filler reaches the plan",
       r.get("outcome") == "Stores opened", r)
    ck("...and so does the target", str(r.get("target", "")).startswith("6"), r)
    ck("...both stamped with the fill mark",
       "outcome" in (r.get("marks") or []) and "outTarget" in (r.get("marks") or []), r)
    # AND THE ROW STOPS BEING COUNTED, or the page would go on asking for what
    # it has just been given (§116.2: the count and the field are one list).
    left = pg.evaluate("""(w) => SMPRules.gapMissing(
      "tactic", UNITS[w.unit].items[0].tactics[0])""", who)
    ck("...so neither is still owed", "outcome" not in left and "outTarget" not in left, left)

    # §249.2: THE UNIT MAY BE PICKED BEFORE THE NUMBER, AND THAT IS NOT A FILL.
    # §248 lets what a thing is measured in be chosen first, so `outTarget`
    # holds "%" on the way to "90%" — non-blank, and still a gap. Two things
    # must be true of that half-answer, and the first build of §249 got both
    # wrong: the mark must NOT be stamped (a marked field reads as answered, so
    # the row would leave the count, the walk and Submit's refusal with its
    # target unusable), and the save must still be the filler's (it was
    # refused, which is the CX refusal's shape — one unclassified row costs
    # every fill posted with it, §184).
    half = pg.evaluate("""(w) => {
      const t = UNITS[w.unit].items[0].tactics[0];
      delete t.outTarget; if (t.pend) delete t.pend.outTarget;
      paint();
      const grid = document.querySelector('.pane td.tgtcell .tgrid');
      const uni = [...grid.querySelectorAll('select')].filter(
        s => [...s.options].some(o => o.text === 'M EGP'))[0];
      if (!uni) return { nouni: true };
      uni.value = '%'; uni.dispatchEvent(new Event('change', { bubbles: true }));
      return { stored: t.outTarget, marked: !!(t.pend && t.pend.outTarget),
               missing: SMPRules.gapMissing('tactic', t).indexOf('outTarget') > -1 };
    }""", who)
    ck("a unit picked before the number is kept", half.get("stored") == "%", half)
    ck("...and is NOT stamped as a fill", half.get("marked") is False, half)
    ck("...and the row still says the target is missing", half.get("missing"), half)
    # PUT THE STATE BACK (§94.2's neighbour). This section deliberately leaves
    # the row holding a half-answer, and the sections below were written
    # against a row that owes nothing here — a check that changes the world
    # and walks away makes the NEXT one measure something nobody chose.
    pg.evaluate("""(w) => {
      const t = UNITS[w.unit].items[0].tactics[0];
      t.outcome = "Something measurable"; t.outTarget = "6 #";
      if (t.pend) { delete t.pend.outcome; delete t.pend.outTarget;
                    if (!Object.keys(t.pend).length) delete t.pend; }
      paint();
    }""", who)
    pg.wait_for_timeout(300)
    pg.click('#secrow-in .fdone[data-page="plan"]'); pg.wait_for_timeout(300)

    # ── 9 · THE COUNTS THAT FIND YOU (§145.14) ──────────────────────────
    print("\n9 · the missing bar beside the sections, the rail words, the walker")
    be(pg, who["cust"], who["unit"], "strategy", "plan")
    r = pg.evaluate("""() => {
      const bar = document.querySelector('#secrow-in [data-gapband]');
      return {
        badge: document.querySelector('[data-gaptab]') !== null,
        bar: !!bar,
        totalWord: bar ? bar.querySelector('.secmiss').textContent : null,
        total: gapTotal(TARGET),
        cta: bar ? !!bar.querySelector('[data-fillcta]') : false,
        rail: [...document.querySelectorAll('[data-rgap]')].map(e => e.textContent),
        inPage: !!document.querySelector('#panel [data-gapband]') };
    }""")
    ck("the Strategy tab wears NO number (§145.14)", r["badge"] is False, r)
    ck("the missing bar lives in the section row, read mode included",
       r["bar"] is True and r["totalWord"] == str(r["total"]) + " Missing" and r["total"] > 0, r)
    ck("...with the red worded button on it", r["cta"] is True, r)
    # THE BAR SITS INSIDE THE TAB ROW, WHERE `.tabs button` UNDRESSES ANY
    # BUTTON IT OUTRANKS (§145.14's second round — Islam: "the view is not
    # like the design I approved"). Text assertions passed on that build, so
    # the PAINT is asserted: the bar's button wears the same ground as the
    # corner's (the relationship, §53.5), and that ground is a real colour —
    # both vanishing together must still fail. The chip keeps a real border.
    # §268 REMOVED THE CORNER COPY, so this can no longer compare the bar's
    # button with it — and a comparison to something that is gone is satisfied
    # by both sides vanishing (§113.8). It asserts the PROBLEM instead, which
    # is what §145.14 was ever about: inside `nav.tabs` a bare class is
    # outranked and the control renders as a plain word, so the button must
    # carry a solid ground of its own and ink that is not the tab row's.
    pr = pg.evaluate("""() => {
      const barBtn = document.querySelector('#secrow-in .missbar .fillcta');
      const tab = document.querySelector('#secrow-in [data-sub2]');
      const chip = document.querySelector('#secrow-in .missbar .mchip');
      const bs = barBtn ? getComputedStyle(barBtn) : null;
      const ts = tab ? getComputedStyle(tab) : null;
      const ch = chip ? getComputedStyle(chip) : null;
      return { barBg: bs && bs.backgroundColor, barInk: bs && bs.color,
               tabInk: ts && ts.color,
               barBorder: bs && parseFloat(bs.borderTopWidth) > 0,
               chipBorder: ch && parseFloat(ch.borderTopWidth) > 0 &&
                           ch.borderTopColor !== ch.color };
    }""")
    ck("...and the bar's button is PAINTED — solid, bordered, not a bare tab word",
       pr["barBg"] is not None and
       "rgba(0, 0, 0, 0)" not in (pr["barBg"] or "rgba(0, 0, 0, 0)") and
       pr["barBorder"] is True and pr["barInk"] != pr["tabInk"], pr)
    ck("...and the chip keeps its border inside the tab row", pr["chipBorder"] is True, pr)
    ck("...and nothing of it in the page body", r["inPage"] is False, r)
    ck("the rail speaks the same words — 'N Missing'",
       len(r["rail"]) >= 1 and all(t.endswith(" Missing") for t in r["rail"]), r)
    if who["floor"]:
        be(pg, who["floor"], who["floorUnit"], "strategy", "plan")
        ck("somebody with no control to clear it sees no bar and no button (§69)",
           pg.query_selector('[data-gapband]') is None and
           pg.query_selector('[data-fillcta]') is None)
    be(pg, who["cust"], who["unit"], "strategy", "plan")
    # the bar's own button opens fill mode AND walks to the first blank
    pg.click('#secrow-in [data-fillcta]'); pg.wait_for_timeout(400)
    r = pg.evaluate("""() => {
      const bar = document.querySelector('#secrow-in [data-gapband]');
      const map = gapMap(TARGET);
      const owing = map.filter(e => e.count > 0);
      const agree = owing.every(e => {
        const c = bar.querySelector('[data-gkey="' + CSS.escape(e.key) + '"]');
        return c && c.querySelector('b') &&
               c.querySelector('b').textContent.trim() === String(e.count);
      });
      const clearDrawn = map.filter(e => !e.count).some(e =>
        bar.querySelector('[data-gkey="' + CSS.escape(e.key) + '"]'));
      return { mode: EDIT_PAGE.plan, chips: bar.querySelectorAll('.mchip').length,
               owing: owing.length, agree, clearDrawn,
               lit: document.querySelectorAll('.gaplit').length,
               next: !!bar.querySelector('[data-nextgap]') };
    }""")
    ck("one press opens fill mode and lands the ring on the first blank",
       r["mode"] is True and r["lit"] == 1, r)
    ck("one red chip per OWING place, none for a clear one",
       r["chips"] == r["owing"] and r["chips"] > 0 and r["clearDrawn"] is False, r)
    ck("...every chip agreeing with the data it counts", r["agree"] is True, r)
    ck("...and the button now walks — Next gap", r["next"] is True, r)

    # a fill moves the counts IN PLACE — no repaint, the typed field survives
    r = pg.evaluate("""(w) => {
      const chip = document.querySelector('[data-gapband] [data-gkey^="p:"]');
      const key = chip.dataset.gkey;
      const before = chip.textContent.trim();
      const inp = document.querySelector('.pane .fld.gapfld');
      /* §130.1: an owner or a collaborator field is a PICKER now, so the
         trial answers whatever control it lands on — first real option on
         a select, a typed value everywhere else. */
      if (inp.tagName === "SELECT") {
        const o = [...inp.options].filter(o => o.value)[0];
        if (inp.multiple) o.selected = true; else inp.value = o.value;
      /* §249: A TARGET IS ANSWERED WITH A NUMBER. The outcome's target is four
         controls in one cell and the number is one of them, so a trial that
         types a NAME into it writes a value the platform cannot read — the
         field stays a gap, the count rightly does not move, and the check
         reports a working build as broken. The lesson is the one this trial's
         own comment already records for a picker: answer the control you
         landed on. */
      } else if (inp.closest(".tgrid")) inp.value = "6";
      else inp.value = "Somebody Named";
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      const after = chip.textContent.trim();
      const totalWord = document.querySelector('[data-gapband] .secmiss').textContent;
      const want = gapMap(TARGET).filter(e => e.key === key)[0].count;
      return { before, after, totalWord, want, total: gapTotal(TARGET) };
    }""", who)
    ck("a fill ticks its chip down in place, no repaint",
       r["before"] != r["after"] and
       (str(r["want"]) in r["after"] if r["want"] else "✓" in r["after"]), r)
    ck("...and the bar's total follows", r["totalWord"] == str(r["total"]) + " Missing", r)

    # a chip is a door: it navigates AND keeps fill mode on where it lands.
    # The Foundation owes nothing at this point, so its chip is rightly
    # absent — a gap is made first, and the repaint draws the chip (§94.2).
    pg.evaluate("""(w) => { UNITS[w.unit].aspiration = ""; paint(); }""", who)
    pg.wait_for_timeout(300)
    pg.evaluate("""() => {
      document.querySelector('[data-gapband] [data-gkey="found"]').click();
    }""")
    pg.wait_for_timeout(400)
    r = pg.evaluate("""() => ({
      sec: CURSEC[currentSub], pen: EDIT_PAGE.foundation,
      band: !!document.querySelector('#secrow-in [data-gapband]'),
      fld: document.querySelectorAll('#panel .fld.gapfld').length })""")
    ck("a chip walks to Foundation with the mode kept on, fields open",
       r["sec"] == "found" and r["pen"] is True and r["band"] is True and r["fld"] >= 1, r)

    # the SWOT page never fills: a pen that opens nothing is not drawn
    be(pg, who["cust"], who["unit"], "strategy", "anal")
    ck("no fill pen on the Analysis page (u_anal has no fillable field)",
       pg.query_selector('[data-page="analysis"]') is None)

    # ── 10 · THIS YEAR SHOWS BY DEFAULT (§145.11) ───────────────────────
    print("\n10 · the This-year column defaults to shown, saved choices win")
    pg2 = b.new_page()
    pg2.goto(URL); pg2.wait_for_timeout(1200)
    r = pg2.evaluate("""(w) => {
      try { localStorage.removeItem("smp.ko.year2"); } catch (e) {}
      VIEWER = w.smo; leaveModes(); current = w.unit;
      currentSub = "strategy"; CURSEC.strategy = "found";
      paint();  /* §243: one layout, nothing to select */
      const oh = document.querySelector(".ohead");
      return { on: SHOW_KO_THIS_YEAR,
               cols: oh ? oh.querySelectorAll("span").length : null };
    }""", who)
    ck("a fresh browser shows both horizons", r["on"] is True and r["cols"] == 3, r)
    r = pg2.evaluate("""() => {
      setKoThisYear(false);
      return localStorage.getItem("smp.ko.year2");
    }""")
    ck("...and a person's explicit choice is stored to win next time", r == "0", r)
    pg2.close()

    print("")
    ck("no page errors anywhere in the run", not errs, "; ".join(errs[:3]))
    b.close()

print("\n%s" % ("ALL OK" if bad == 0 else "%d FAILURES" % bad))
sys.exit(1 if bad else 0)
