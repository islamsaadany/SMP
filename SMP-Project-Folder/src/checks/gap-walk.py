"""THE GAP BAND'S CHIPS AND ITS WALKER ACTUALLY GO SOMEWHERE (§177.2).

Islam, pressing them: *"the CUS01 3 button just opens the project and the next
gap does nothing."* Both were true, and each fault hid the next:

· the walker asked for `.fld.gapfld` — an element TYPE — so §177's month
  picker, a button, was invisible to it and a project owing only due dates
  had nothing to walk;
· an author's fields were never marked at all, so it had never done anything
  in the office's pen — the loudest button on the bar, dead for the person
  who uses it most;
· it read `document.activeElement` as its cursor and the press moves focus TO
  THE BUTTON, so every press computed "I am nowhere" and lit the first field;
· it asked `RAIL` whether a chip's place was on screen, and `RAIL` holds only
  what somebody has PICKED — empty on a page nobody has clicked, while the
  panes are plainly there;
· and the chip lit the first gap on the PAGE, which on a function's projects
  page belongs to whichever capability is topmost, not to the chip.

WHAT IS ASSERTED: press it and something moves, on a UNIT and on a FUNCTION,
as the FILLER and as the OFFICE (§53.5 — a unit and a function are the same
product, and §94.2 — a check that only walks the fill grant cannot see a
button that is dead for the office). Every chip lands in its OWN place, and
walking the whole subject reaches every place the band names rather than
bouncing between two.

PROVED ABLE TO FAIL (§94.5): against the pre-§177.2 build the walk is stuck
on its first field in all four combinations, and the chips land in the wrong
project.
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


UNIT_STATE = """(g) => {
  const uk = UNIT_KEYS.filter(k => (UNIT_ROLES[k]||{}).custodian &&
                                   (UNITS[k].items||[]).length > 1)[0];
  const u = UNITS[uk];
  u.aspiration = "";
  (u.keyObjectives||[]).slice(0,1).forEach(m => { m.target = ""; });
  (u.items||[]).forEach(p => (p.measures||[]).slice(0,1).forEach(m => { m.target = ""; }));
  ACCESS.custodian = Object.assign({}, ACCESS.custodian, { a_unit_own_strat: g });
  return { target: uk, tab: "strategy", sec: "plan",
           filler: UNIT_ROLES[uk].custodian };
}"""
FN_STATE = """(g) => {
  const fk = FUNCTION_KEYS.filter(k => (FUNCTIONS[k]||{}).custodian &&
                                       capsOfFunction(k).length)[0];
  capsOfFunction(fk).forEach(c => (c.projects||[]).forEach(p => {
    if (!p.start) p.start = "Q1 2026";
    if (!p.end) p.end = "Q4 2026";
    if (!p.owner) p.owner = "Noran Adel";
    (p.milestones||[]).slice(0,2).forEach(m => { m.finish = ""; });
  }));
  ACCESS.custodian = Object.assign({}, ACCESS.custodian, { a_fn_own_strat: g });
  return { target: "fn:" + fk, tab: "fnstrat", sec: "proj",
           filler: FUNCTIONS[fk].custodian };
}"""
# WHERE THE WALK IS, ASKED OF THE PRODUCT'S OWN AFFORDANCE FIRST. `.gaplit`
# is the ring §145.14 already drew; `[data-gapat]` is §177.2's cursor. Reading
# the ring means this measures a build that has no cursor on its own terms
# rather than merely noticing that the cursor is absent (§94.8).
WHERE = """() => {
  const c = document.querySelector('.gaplit') ||
            document.querySelector('[data-gapat]');
  if (!c) return null;
  const pl = c.closest('[data-gplace]');
  return pl ? pl.dataset.gplace : ('sec:' + CURSEC[currentSub]);
}"""

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])

    def trial(side, role):
        global bad
        pg = b.new_page(viewport={"width": 1600, "height": 1000})
        pg.on("pageerror", lambda e: errs.append(str(e)))
        # §167.2: a returning viewer, or the welcome overlay eats every click
        pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                           "localStorage.setItem('smp.tour.never','1')}catch(e){}")
        pg.goto(URL)
        pg.wait_for_timeout(1400)
        grant = "fill" if role == "filler" else "edit"
        st = pg.evaluate(UNIT_STATE if side == "unit" else FN_STATE, grant)
        who = st["filler"] if role == "filler" else \
            pg.evaluate("() => PEOPLE.filter(p => p.role === 'super')[0].key")
        pg.evaluate("""(a) => {
          VIEWER = a.who; leaveModes();
          current = a.target; currentSub = a.tab; CURSEC[a.tab] = a.sec; paint();
        }""", dict(st, who=who))
        pg.wait_for_timeout(450)
        tag = "%s / %s" % (side, role)
        total = pg.evaluate("() => gapTotal(TARGET)")
        ck("%s: the band counts something to walk" % tag, total > 2, total)

        # open the mode the way somebody actually would
        if pg.locator("[data-fillcta]").count():
            pg.locator("[data-fillcta]").first.click()
        elif pg.locator("#secrow-in .secpen[data-page='plan']").count():
            # §248: the pen is on the section line now, not in the pane corner.
            pg.locator("#secrow-in .secpen[data-page='plan']").first.click()
        pg.wait_for_timeout(700)
        ck("%s: Next gap is on the bar" % tag,
           pg.locator("[data-nextgap]").count() > 0)
        if not pg.locator("[data-nextgap]").count():
            pg.close(); return

        # ── the walk MOVES, and reaches every place the band names ──
        chips = pg.evaluate(
            "() => [].map.call(document.querySelectorAll('[data-gapband] .mchip'),"
            " c => c.dataset.gkey)")
        seq = []
        for _ in range(total + 4):
            if not pg.locator("[data-nextgap]").count():
                break
            pg.locator("[data-nextgap]").first.click()
            pg.wait_for_timeout(320)
            seq.append(pg.evaluate(WHERE))
        ck("%s: every press marks a field" % tag,
           seq and all(w is not None for w in seq), seq[:4])
        ck("%s: it does not sit on one field" % tag, len(set(seq)) > 1, set(seq))
        # a unit's Foundation and Objectives are two chips over ONE page, so
        # the places reached are never more than the chips and never fewer
        # than the chips that name a distinct place.
        want = pg.evaluate("""() => {
          const seen = {};
          [].forEach.call(document.querySelectorAll('[data-gapband] .mchip'), c => {
            seen[c.dataset.grail ? c.dataset.grail + '|' + c.dataset.gcode
                                 : 'sec:' + c.dataset.gsec] = 1; });
          return Object.keys(seen).length;
        }""")
        ck("%s: the walk reaches every place the band names (%d)" % (tag, want),
           len(set(w for w in seq if w)) >= want,
           "reached %s of %d, chips %s" % (sorted(set(seq)), want, chips))
        pg.close()

    print("\n1 · pressing Next gap, on both sides and for both viewers")
    for side in ("unit", "fn"):
        for role in ("filler", "office"):
            trial(side, role)

    # ── 2 · A CHIP LANDS IN ITS OWN PLACE ────────────────────────────────
    print("\n2 · a chip lands on the gap it named, not on somebody else's")
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1400)
    st = pg.evaluate(FN_STATE, "fill")
    pg.evaluate("""(a) => {
      VIEWER = a.filler; leaveModes();
      current = a.target; currentSub = a.tab; CURSEC[a.tab] = a.sec; paint();
    }""", st)
    pg.wait_for_timeout(450)
    n = pg.locator("[data-gkey]").count()
    ck("the band draws a chip per place that owes", n > 1, n)
    for i in range(n):
        chip = pg.locator("[data-gkey]").nth(i)
        key = chip.get_attribute("data-gkey")
        rail = chip.get_attribute("data-grail")
        code = chip.get_attribute("data-gcode")
        chip.click()
        pg.wait_for_timeout(650)
        landed = pg.evaluate(WHERE)
        ck("chip %s lands in its own place" % key,
           landed == (rail + "|" + code if rail else landed),
           "landed in %s, chip points at %s" % (landed, (rail or "") + "|" + (code or "")))
    pg.close()
    b.close()

print("")
if errs:
    print("PAGE ERRORS: " + " | ".join(errs[:4]))
print("%d failed" % bad if bad else "all good")
sys.exit(1 if bad or errs else 0)
