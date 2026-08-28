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
      x.keyObjectives[0].target = "";
      paint();
    }""", who["unit"])
    pg.wait_for_timeout(300)

    be(pg, who["cust"], who["unit"], "strategy", "plan")
    # §145.14: the fill control is a WORDED RED BUTTON beside the arrows,
    # not a pen glyph — drawn only while something is missing.
    pen = pg.query_selector('.pane .paneact .fillcta[data-fillcta="plan"]')
    ck("the custodian's red button appears beside the arrows", pen is not None)
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

    # ── 4 · READ MODE: THE CHIP, THE COUNT, AND NO TICK FOR THE FILLER ──
    print("\n4 · pending reads as pending, and the tick is the office's")
    pg.click('.pane .paneact .fdone[data-page="plan"]'); pg.wait_for_timeout(400)
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
    pg.click('.pane .paneact .fillcta[data-fillcta="plan"]'); pg.wait_for_timeout(400)
    r = pg.evaluate("""(w) => {
      const inp = document.querySelector('td.collabs .fld.gapfld');
      if (!inp) return { none: true };
      inp.value = "New Helper, Second Helper";
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      const t = UNITS[w.unit].items[0].tactics[0];
      return { list: t.collaborators, pend: !!(t.pend && t.pend.collaborators),
               named: SMPRules.namedOn(t, { key: "nh", name: "New Helper" }) };
    }""", who)
    ck("a typed list parses into the array and wears the mark",
       not r.get("none") and r["list"] == ["New Helper", "Second Helper"] and r["pend"], r)
    ck("...and the pending name confers NO reporting right (§50.2 held)",
       r.get("named") is False, r)
    r = pg.evaluate("""(w) => {
      const t = UNITS[w.unit].items[0].tactics[0];
      delete t.pend.collaborators;
      if (!Object.keys(t.pend).length) delete t.pend;
      return SMPRules.namedOn(t, { key: "nh", name: "New Helper" });
    }""", who)
    ck("...and counts the moment the mark lifts", r is True)
    pg.click('.pane .paneact .fdone[data-page="plan"]'); pg.wait_for_timeout(300)

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
    pr = pg.evaluate("""() => {
      const barBtn = document.querySelector('#secrow-in .missbar .fillcta');
      const corner = document.querySelector('.pane .paneact .fillcta');
      const chip = document.querySelector('#secrow-in .missbar .mchip');
      const bs = barBtn ? getComputedStyle(barBtn) : null;
      const cs = corner ? getComputedStyle(corner) : null;
      const ch = chip ? getComputedStyle(chip) : null;
      return { barBg: bs && bs.backgroundColor, cornerBg: cs && cs.backgroundColor,
               barInk: bs && bs.color, cornerInk: cs && cs.color,
               chipBorder: ch && parseFloat(ch.borderTopWidth) > 0 &&
                           ch.borderTopColor !== ch.color };
    }""")
    ck("...and the bar's button is PAINTED like the corner's — solid, not a tab",
       pr["barBg"] is not None and pr["barBg"] == pr["cornerBg"] and
       "rgba(0, 0, 0, 0)" not in (pr["barBg"] or "rgba(0, 0, 0, 0)") and
       pr["barInk"] == pr["cornerInk"], pr)
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
      inp.value = "Somebody Named";
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
      try { localStorage.removeItem("smp.ko.year"); } catch (e) {}
      VIEWER = w.smo; leaveModes(); current = w.unit;
      currentSub = "strategy"; CURSEC.strategy = "found";
      KO_VIEW = "cols"; paint();
      const oh = document.querySelector(".ohead");
      return { on: SHOW_KO_THIS_YEAR,
               cols: oh ? oh.querySelectorAll("span").length : null };
    }""", who)
    ck("a fresh browser shows both horizons", r["on"] is True and r["cols"] == 3, r)
    r = pg2.evaluate("""() => {
      setKoThisYear(false);
      return localStorage.getItem("smp.ko.year");
    }""")
    ck("...and a person's explicit choice is stored to win next time", r == "0", r)
    pg2.close()

    print("")
    ck("no page errors anywhere in the run", not errs, "; ".join(errs[:3]))
    b.close()

print("\n%s" % ("ALL OK" if bad == 0 else "%d FAILURES" % bad))
sys.exit(1 if bad else 0)
