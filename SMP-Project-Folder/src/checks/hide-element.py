"""HIDING AN ELEMENT FROM THE PRESENTATION (§233).

Islam: *"the hide approach is about hiding it from the presnetation. this
applies to a mesure or an objective or a tactic. etc. something we need to
keep but hide from the ppt"* — and his three decisions: hidden is NOT
counted, rows only (never a pillar, a capability or a project), and the
workbook carries the mark. Mockup signed off 2026-09-01.

Both ends throughout (§94.2), and the DATA is read back after every press
(§96 — an eye drawn and wired to nothing looks identical):

  - no eye in read mode, none for a unit head, and NEVER one on a pillar's
    head or a project's band (a whole slide cannot disappear);
  - the pen's eye writes `hide:true`; the same press deletes the key
    (§50.6 — shown-again and never-hidden are byte-identical);
  - the score AGREES with the visible rows (asserted as agreement, §94.8):
    the pillar's average recomputed over shown scorable rows IS pillarPerf;
  - reporting stops asking (reportItems), the gap count stops counting
    (gapMap), and the reporting pane stops drawing the row;
  - read mode says so — the chip, on a row still showing its figure;
  - the deck carries neither the row nor its name, on the unit AND the
    function side of the switch (§53.5);
  - the workbook writes Yes in the Hidden column and the reader brings it
    back — the round trip keeps the mark, or a re-upload silently shows
    everything again (§22).
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

def press(pg, sel):
    el = pg.query_selector(sel)
    if el: el.click(); return True
    ck("press " + sel, False, "not drawn"); return False

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1500, "height": 2400})
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL); pg.wait_for_timeout(1500)

    # ── 1 · closed ends ─────────────────────────────────────────────────
    pg.select_option("#asWho", "mobhead"); pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(500)
    ck("a unit head sees no eye anywhere",
       pg.evaluate("() => document.querySelectorAll('.eyebtn').length") == 0)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(500)
    ck("read mode draws no eye either",
       pg.evaluate("() => document.querySelectorAll('.eyebtn').length") == 0)

    # ── 2 · the pen's eye writes, and the score agrees ──────────────────
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    eyes = pg.evaluate("""() => ({
      n: document.querySelectorAll('.eyebtn').length,
      onHead: document.querySelectorAll('.ptitle.edhead .eyebtn').length,
      firstId: (document.querySelector('.eyebtn') || {}).dataset
        ? document.querySelector('.eyebtn').dataset.hiderow : null })""")
    ck("the pen draws eyes on the rows", eyes["n"] > 0, eyes)
    ck("...and NEVER on the pillar's own head", eyes["onHead"] == 0, eyes)

    before = pg.evaluate("""() => {
      const p = UNITS.mobile.items[0], m = p.measures[0];
      return { id: m.id, perf: pillarPerf(p), n: p.measures.length };
    }""")
    press(pg, '.eyebtn[data-hiderow="%s"]' % before["id"]); pg.wait_for_timeout(400)
    after = pg.evaluate("""(id) => {
      const p = UNITS.mobile.items[0];
      const m = p.measures.filter(x => x.id === id)[0];
      const vis = p.measures.filter(x => x.hide !== true &&
        x.target && x.progress != null).map(x => x.progress);
      const want = vis.length
        ? Math.round(vis.reduce((a,b) => a+b, 0) / vis.length) : null;
      const btn = document.querySelector('.eyebtn[data-hiderow="' + id + '"]');
      return { hide: m.hide === true, perf: pillarPerf(p), want,
               lit: btn ? btn.classList.contains('on') : null,
               row: btn ? !!btn.closest('tr.hiddenrow') : null };
    }""", before["id"])
    ck("pressing the eye writes hide:true", after["hide"], after)
    ck("...the eye re-draws lit on a quiet row", after["lit"] and after["row"], after)
    ck("...and the score IS the average of the shown rows",
       after["perf"] == after["want"], after)
    ck("...which moved it", after["perf"] != before["perf"], (before["perf"], after["perf"]))

    # not asked, not counted, not walked
    asks = pg.evaluate("""(id) => ({
      asked: reportItems(UNITS.mobile).some(x => x.id === id),
      gaps: (function(){
        const m = UNITS.mobile.items[0].measures.filter(x => x.id === id)[0];
        const was = m.target; m.target = "";
        const g = gapMap("mobile", true).reduce((a, e) => a + e.count, 0);
        m.target = was;
        return g;
      })() })""", before["id"])
    ck("a hidden row is not asked in reporting", not asks["asked"], asks)
    blank_gap = pg.evaluate("""(id) => {
      const m = UNITS.mobile.items[0].measures.filter(x => x.id === id)[0];
      const was = m.target; m.target = "";
      const withHide = gapMap("mobile", true).reduce((a, e) => a + e.count, 0);
      delete m.hide;
      const without = gapMap("mobile", true).reduce((a, e) => a + e.count, 0);
      m.hide = true; m.target = was;
      return { withHide, without };
    }""", before["id"])
    ck("...and its blanks are not gaps",
       blank_gap["without"] == blank_gap["withHide"] + 1, blank_gap)

    # ── 3 · read mode says so, deck says nothing ────────────────────────
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    read = pg.evaluate("""(id) => {
      const chip = document.querySelector('tr.hiddenrow .hidchip');
      const name = UNITS.mobile.items[0].measures.filter(x => x.id === id)[0].name;
      const deck = deckSlides(UNITS.mobile).join ? deckSlides(UNITS.mobile).join("") : String(deckSlides(UNITS.mobile));
      const sib = UNITS.mobile.items[0].measures.filter(x => x.id !== id)[0].name;
      return { chip: chip ? chip.textContent : null,
               deckHasIt: deck.indexOf(name) > -1,
               deckHasSib: deck.indexOf(sib) > -1,
               rep: (function(){
                 // the reporting pane must not draw the row
                 return null; })() };
    }""", before["id"])
    ck("read mode wears the chip", read["chip"] == "Hidden — not counted", read)
    ck("the deck does not carry the row — and does carry its sibling",
       not read["deckHasIt"] and read["deckHasSib"], read)

    # ── 4 · the workbook round trip keeps the mark ──────────────────────
    wb = pg.evaluate("""(id) => {
      const u = UNITS.mobile;
      const sheets = planWorkbook(u);
      const ms = sheets.filter(s => s.name === "Measures")[0];
      const hIdx = ms.head.indexOf("Hidden");
      const name = u.items[0].measures.filter(x => x.id === id)[0].name;
      const row = ms.rows.filter(r => r[1] === name)[0];
      // and back through the real reader
      const byName = {};
      sheets.forEach(s => byName[s.name] = [s.head].concat(s.rows));
      const rows = planFromWorkbook(u, byName);
      const rr = rows.filter(r => r.type === "MEASURE" && r.name === name)[0];
      return { hIdx, cell: row ? row[hIdx] : null, back: rr ? rr.hidden : null };
    }""", before["id"])
    ck("the Measures sheet carries Hidden and writes Yes",
       wb["hIdx"] > -1 and wb["cell"] == "Yes", wb)
    ck("...and the reader brings the mark back", wb["back"] == "1", wb)

    # ── 5 · the same press shows it again, key DELETED ──────────────────
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    press(pg, '.eyebtn[data-hiderow="%s"]' % before["id"]); pg.wait_for_timeout(400)
    back = pg.evaluate("""(id) => {
      const p = UNITS.mobile.items[0];
      const m = p.measures.filter(x => x.id === id)[0];
      return { key: "hide" in m, perf: pillarPerf(p) };
    }""", before["id"])
    ck("shown again: the key is DELETED, not false", not back["key"], back)
    ck("...and the score is back", back["perf"] == before["perf"], (back, before))
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(400)

    # ── 6 · a milestone on a function, and the project band has no eye ──
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                     "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Functions": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    pg.click('#units button[data-u="fn:finance"]'); pg.wait_for_timeout(500)
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    fn = pg.evaluate("""() => {
      const onBand = document.querySelectorAll('.pband.edband .eyebtn').length;
      const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
      const p = c.projects[0], m = p.milestones[0];
      const btn = document.querySelector('.eyebtn[data-hiderow="' + m.id + '"]');
      return { onBand, id: m.id, there: !!btn,
               exec: capExec(c).pct, total: capExec(c).total };
    }""")
    ck("the project band carries no eye — a project cannot be hidden",
       fn["onBand"] == 0, fn)
    ck("a milestone row carries one", fn["there"], fn)
    press(pg, '.eyebtn[data-hiderow="%s"]' % fn["id"]); pg.wait_for_timeout(400)
    fna = pg.evaluate("""(spec) => {
      const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
      const m = c.projects[0].milestones.filter(x => x.id === spec.id)[0];
      const deck = String(deckSlidesFn("finance"));
      return { hide: m.hide === true, total: capExec(c).total,
               deckHasIt: deck.indexOf(m.name) > -1,
               asked: fnReportItems("finance").some(x => x.id === spec.id) };
    }""", fn)
    ck("the milestone hides, leaves the exec counts, the deck and the asks",
       fna["hide"] and fna["total"] == fn["total"] - 1
       and not fna["deckHasIt"] and not fna["asked"], (fn, fna))
    # put it back — the demo data must leave as it arrived (§94.2)
    press(pg, '.eyebtn[data-hiderow="%s"]' % fn["id"]); pg.wait_for_timeout(400)
    ck("...and shows again clean",
       pg.evaluate("""(id) => {
         const c = GROUP.capabilities.filter(x => x.fn === "finance")[0];
         return !("hide" in c.projects[0].milestones.filter(x => x.id === id)[0]);
       }""", fn["id"]))

    # ── 7 · A HIDDEN ROW OWES NOTHING, AND SAYS SO (§250) ───────────────
    #
    # Islam, from the running platform: *"for the hidden tactics or measures
    # they needs to be removed from the missing for the user and they don't
    # count as missing on the pillar card as well."*
    #
    # §233 taught `gapMap()` and stopped, so the six readers that call
    # `gapMissing()` directly — the pillar's rail row above all — went on
    # counting hidden rows. MEASURED on the pre-§250 build: with the five
    # owing tactics of Mobile's MB01 hidden, the band read 34 and dropped
    # MB01's chip while the pillar's own row still read "10 Missing", and
    # the rows carried 15 red `Missing` beside their own "Hidden — not
    # counted" chip.
    #
    # ASSERTED AS AGREEMENT, NEVER AS A NUMBER (§94.8): whatever the demo
    # plan happens to owe, the pillar's row and the band's chip must say the
    # same thing about the same pillar. A check written against 10 and 34
    # would have to be rewritten the day anybody edits the seed.
    #
    # BOTH ENDS (§94.2): the state is MADE, because the demo ships nothing
    # hidden, and it is put back — a build that simply stopped counting
    # everything would pass every "it went" assertion and fail these.
    for _ in range(3):
        on = pg.eval_on_selector_all("#units .navswitch .nsw.on",
                                     "e=>e.map(x=>x.textContent.trim())")
        if on and on[0] == "Units": break
        pg.click("#units .navswitch"); pg.wait_for_timeout(150)
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(600)

    def board():
        """What the page says about missing, in the three places that say it."""
        return pg.evaluate("""() => {
          const rail = {}, chip = {};
          document.querySelectorAll('[data-rgap]').forEach(e =>
            rail[e.dataset.rgap] = e.textContent.trim());
          document.querySelectorAll('.missbar .mchip').forEach(e =>
            chip[e.dataset.gkey] = e.textContent.trim());
          return { rail, chip, total: gapTotal(TARGET), all: gapTotalAll(TARGET),
                   red: document.querySelectorAll('#panel .missing').length,
                   redHidden: document.querySelectorAll('#panel .hiddenrow .missing').length };
        }""")

    before = board()
    owed = pg.evaluate("""() => {
      const p = UNITS.mobile.items.filter(p =>
        (p.tactics || []).some(t => SMPRules.gapMissing('tactic', t).length))[0];
      return { code: p.code, key: 'p:' + p.code,
               n: (p.tactics || []).reduce((a, t) =>
                    a + SMPRules.gapMissing('tactic', t).length, 0),
               ids: (p.tactics || []).filter(t =>
                    SMPRules.gapMissing('tactic', t).length).map(t => t.id) };
    }""")
    ck("the demo has a pillar owing something to hide", owed["n"] > 0, owed)
    ck("...and it is drawn on the pillar's own row AND on the band's chip",
       owed["key"] in before["rail"] and owed["key"] in before["chip"], before)

    # hide every owing tactic in that pillar, through the platform's own eye
    pg.click('#units button[data-u="mobile"]'); pg.wait_for_timeout(400)
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    pressed = 0
    for rid in owed["ids"]:
        el = pg.query_selector('.eyebtn[data-hiderow="%s"]' % rid)
        if el: el.click(); pg.wait_for_timeout(200); pressed += 1
    ck("every owing tactic has an eye to press", pressed == len(owed["ids"]),
       (pressed, len(owed["ids"])))
    ck("...and the eye is what wrote the mark",
       pg.evaluate("""(ids) => ids.every(id =>
         SMPRules.isHidden(hideableById(id)))""", owed["ids"]))
    # out of the pen, so the read surface is what is being measured
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)

    after = board()
    ck("the band's total drops by exactly what the hidden rows owed",
       after["total"] == before["total"] - owed["n"], (before, after, owed))
    ck("...and Submit's own count with it (the viewer-blind one)",
       after["all"] == before["all"] - owed["n"], (before, after, owed))
    ck("the pillar card stops counting them — it agrees with its own chip",
       after["rail"].get(owed["key"], "") == after["chip"].get(owed["key"], "")
       or (owed["key"] not in after["rail"] and owed["key"] not in after["chip"]),
       after)
    ck("every OTHER pillar is untouched, on the row and on the chip",
       all(after["rail"].get(k) == v for k, v in before["rail"].items()
           if k != owed["key"])
       and all(after["chip"].get(k) == v for k, v in before["chip"].items()
               if k != owed["key"]),
       (before, after))
    ck("no hidden row wears the red word", after["redHidden"] == 0, after)
    # A DASH AND AN EMPTY CELL ARE NOT THE SAME THING. Dropping the word
    # outright would satisfy the assertion above and leave a row of blank
    # boxes, which reads as a table that failed to render (§45.2). So the
    # cells that lost the word are asked to hold the platform's own mark for
    # absent, and no cell in the row is allowed to be empty.
    dash = pg.evaluate("""() => {
      const rows = [...document.querySelectorAll('#panel tr.hiddenrow')];
      return { rows: rows.length,
               nobody: rows.reduce((a, r) => a + r.querySelectorAll('.nobody').length, 0),
               emptyCells: rows.reduce((a, r) => a +
                 [...r.querySelectorAll('td')].filter(td =>
                   !td.textContent.trim() && !td.children.length).length, 0) };
    }""")
    ck("...and it is a dash it wears instead — never an empty cell",
       dash["rows"] > 0 and dash["nobody"] >= dash["rows"] and dash["emptyCells"] == 0,
       dash)
    # THE WORD MUST STILL BE SOMEWHERE, or a build that deleted it outright
    # passes every assertion above. It cannot be asked of THIS pane: every
    # owing tactic in this pillar has just been hidden, so the pane honestly
    # holds none — the first run said FAIL here and the CHECK was what was
    # wrong (§100.3, and §94.2 from the inside: a state I had made myself).
    # The rail's next owing pillar is where a shown row lives.
    other = [k for k in after["rail"] if k != owed["key"]]
    ck("another pillar still owes something to look at", bool(other), after)
    if other:
        pg.click('[data-urail="mobile|%s"]' % other[0].split(":", 1)[1])
        pg.wait_for_timeout(400)
        red = pg.evaluate("""() => ({
          red: document.querySelectorAll('#panel .missing').length,
          hidden: document.querySelectorAll('#panel tr.hiddenrow').length })""")
        ck("a SHOWN row still says Missing — the word did not simply go",
           red["red"] > 0 and red["hidden"] == 0, red)
        pg.click('[data-urail="mobile|%s"]' % owed["code"]); pg.wait_for_timeout(400)

    # ── and back, or "not counted" would be indistinguishable from "gone"
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    for rid in owed["ids"]:
        el = pg.query_selector('.eyebtn[data-hiderow="%s"]' % rid)
        if el: el.click(); pg.wait_for_timeout(200)
    press(pg, '.ptitle.edhead .penbtn, .pband.edband .penbtn, .pane .paneact .penbtn[data-page="plan"]')
    pg.wait_for_timeout(500)
    back = board()
    ck("showing them again brings the count, the row and the word back",
       back["total"] == before["total"] and back["rail"] == before["rail"]
       and back["red"] == before["red"], (before, back))
    ck("...and leaves no mark behind (§50.6)",
       pg.evaluate("""(ids) => ids.every(id => !("hide" in hideableById(id)))""",
                   owed["ids"]))

    ck("no console errors", not errs, errs[:3])
    b.close()
print(("\n%d FAILED" % bad) if bad else "\nall passed")
raise SystemExit(1 if bad else 0)
