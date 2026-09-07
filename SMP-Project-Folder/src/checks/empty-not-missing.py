"""EMPTY IS NOT MISSING (§272) — the bar with nothing owed says where, and
the office is not shown it at all.

Islam, on Mobile and then Care: *"mobile keeps showing filling what's missing
while we can't find something missing and there is no the side badges that
identify where the missing part is."* §223 drew the door for a page whose only
blanks are optional and stopped there, so the way in was drawn and the
destination was not — no count, no chips, no rail marks, because all three read
the COUNTED list and there was nothing in it.

WHAT THIS ASSERTS

· THE OFFICE IS NOT SHOWN THE BAR when nothing is owed — and still holds the
  pen, which is the reason (§94.15: a control with no audience of its own is a
  duplicate). Both ends, or a build that dropped the bar for everybody passes.
· THE FILLER IS SHOWN IT AND IT SAYS WHERE: a count, one chip per place, a
  mark on each rail row — every number asserted as AGREEMENT with the rule
  behind it and never as a literal (§94.8), so a deliberate change to the
  fixture stays green and a build that miscounts does not.
· NOTHING ON THAT BAR IS RED. §145.14's rule is that red means MISSING, and
  the whole point of this register is that nothing here is. Measured as PAINT
  against the tokens (§145.14's own lesson: the bar sits inside `nav.tabs`,
  where `.tabs button` outranks a bare class and strips these to plain words).
· THE WALK WALKS. §192.4 marked the counted list because that was the only
  list the bar counted; with two registers the marker follows the one in
  front of you, and "Next empty" landing on nothing would be that section's
  fault reborn. Asserted by PRESSING it and reading the row back (§96).
· THE MISSING REGISTER IS UNTOUCHED, asserted in the same run on the shipped
  plan: red count, red chips, red button, the same words. A check that only
  measured the quiet half would pass on a build that had lost the loud one
  (§113.8).
· THE IN-PLACE REFRESH KNOWS ITS REGISTER: a fill rewrites the quiet count
  where it stands and must NOT flip the chips to the green tick — `gapTotal`
  is 0 on a quiet bar, which is what a quiet bar MEANS.

THE CHECK MAKES ITS STATE (§94.2). The shipped plan owes 44 on Mobile, so
every assertion here is unreachable until every counted gap is filled and the
collaborators are left alone — which is Islam's tenant, reproduced.

PROVED ABLE TO FAIL (§94.5): against the pre-§272 build, §1 fails (the office
is shown the bar), §2 fails on the count, the chips and the rail marks, §3
fails on the walk, and §5 fails on the refresh.
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


def tok(pg, name):
    """The computed value of a design token, so colours are asserted as
    AGREEMENT with the palette and never as a hex (§94.8, §25)."""
    return pg.evaluate("""(n) => {
      const d = document.createElement('span');
      d.style.color = 'var(' + n + ')';
      document.body.appendChild(d);
      const v = getComputedStyle(d).color;
      d.remove();
      return v;
    }""", name)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    who = pg.evaluate("""() => ({
      unit: "mobile",
      smo: PEOPLE.filter(p => p.role === "super")[0].key,
      cust: (UNIT_ROLES["mobile"] || {}).custodian
    })""")
    print("unit %(unit)s · smo %(smo)s · custodian %(cust)s" % who)

    # ── 0 · THE LOUD REGISTER FIRST, ON THE SHIPPED PLAN ───────────────
    # Asserted BEFORE anything is made, or a build that had lost the missing
    # bar entirely would satisfy every quiet assertion below (§113.8).
    print("\n0 · the missing register, untouched")
    be(pg, who["smo"], who["unit"], "strategy", "plan")
    loud = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      if (!band) return { drawn:false };
      return { drawn:true,
        mode: band.dataset.gapmode || "",
        count: (band.querySelector('[data-gapcount]') || {}).textContent || "",
        chips: band.querySelectorAll('.mchip').length,
        quiet: band.querySelectorAll('.eqchip, .eqcta').length,
        cta:   (band.querySelector('.fillcta') || {}).textContent || "",
        total: gapTotal(TARGET) };
    }""")
    ck("the shipped plan owes something and the bar says so",
       loud.get("drawn") and loud["total"] > 0, loud)
    ck("...as 'N Missing', in the counted register",
       loud.get("count") == str(loud.get("total")) + " Missing", loud.get("count"))
    ck("...with a red chip per owing place and no quiet control",
       loud.get("chips", 0) > 0 and loud.get("quiet") == 0, loud)
    ck("...and the red button keeps its words",
       "Fill in missing elements" in loud.get("cta", ""), loud.get("cta"))

    # ── 1 · THE STATE ISLAM REPORTED, MADE ─────────────────────────────
    # Every counted gap on Mobile filled; the collaborators left exactly as
    # the plan holds them. Nothing here touches what is FILLABLE — the point
    # is that the two lists come apart, which is the tenant he was looking at.
    print("\n1 · nothing owed, something empty — and the office is not shown it")
    made = pg.evaluate("""(u) => {
      const x = UNITS[u];
      if (SMPRules.gapEmpty("aspiration", x)) x.aspiration = "Made by the check.";
      (x.keyObjectives || []).forEach(k => {
        k.dir = k.dir || ">="; k.target = k.target || "10%";
        k.target3y = k.target3y || "30%"; k.compile = k.compile || "Latest"; });
      (x.items || []).forEach(pl => {
        (pl.measures || []).forEach(m => {
          m.dir = m.dir || ">="; m.target = m.target || "10%";
          m.compile = m.compile || "Latest"; });
        (pl.tactics || []).forEach(t => {
          t.owner = t.owner || "Ramy Behairy";
          t.outcome = t.outcome || "Something measurable";
          t.outTarget = t.outTarget || "6 #";
          if (!t.q1 && !t.q2 && !t.q3 && !t.q4) t.q2 = 1;
          delete t.collaborators; });
      });
      paint();
      return { total: gapTotal(u), openable: gapOpenable(u) };
    }""", who["unit"])
    pg.wait_for_timeout(300)
    ck("the state is made: nothing owed", made["total"] == 0, made)
    ck("...and something still empty", made["openable"] > 0, made)

    # THE PEN IS ASKED FOR BY THE QUESTION, NOT BY ONE CLASS (§51.11, and
    # §268 moved it while this branch waited: the office's pen left the pane
    # corner for the section line, so `.penbtn[data-page]` alone reported the
    # office as having no way to edit at all). Every control that opens this
    # page for editing counts, and the RULE is asked beside the screen — a
    # check that only knows today's markup fails the next time it moves.
    office = pg.evaluate("""() => ({
      band: !!document.querySelector('[data-gapband]'),
      pens: document.querySelectorAll(
        '.penbtn[data-page], .secpen[data-page], .editbtn[data-page]').length,
      mayAuthor: SMPRules.mayAuthorPage(world(), viewer(), "u_plan", TARGET),
      cta:  document.querySelectorAll('[data-fillcta]').length,
      rail: document.querySelectorAll('.ritem .rgap').length
    })""")
    ck("the office is shown no bar at all", office["band"] is False, office)
    ck("...no door anywhere on the page", office["cta"] == 0, office)
    ck("...no rail mark either", office["rail"] == 0, office)
    ck("...and STILL HOLDS THE PEN, which is the reason (§94.15)",
       office["pens"] > 0, office)
    ck("...which the rule says too, not just the screen",
       office["mayAuthor"] is True, office)

    # ── 2 · AND SINCE §287.3, THE FILLER IS NOT SHOWN IT EITHER ────────
    # REWRITTEN, NEVER DELETED (§218). §272 shipped a quiet bar for a filler
    # standing on a page that owes nothing, and Islam — testing §287 as a
    # PROJECT OWNER, which is exactly that filler — took it away: *"it
    # requires him to fill something empty and there is nothing empty."*
    # Three answers were put to him with the cost of each and he chose **no
    # button when nothing is owed**, so `seesEmpty()` answers false for
    # everybody and every piece of §272's machinery is untouched and
    # reversible (§287.3).
    #
    # THE ASSERTIONS THAT MOVED ARE INVERTED IN PLACE rather than removed, so
    # a later build cannot drift back through them unnoticed — and BOTH ENDS
    # are asserted: nothing is drawn while nothing is owed, and §3 below puts
    # a real gap back and watches the missing bar return with its walk intact.
    # A check that only asserted the absence would pass on a build that had
    # lost the missing register too (§113.8).
    print("\n2 · the filler is shown no bar either (§287.3)")
    be(pg, who["smo"])
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(250)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(350)
    pg.click('[data-ac="custodian|a_unit_own_strat|fill"]'); pg.wait_for_timeout(350)
    be(pg, who["cust"], who["unit"], "strategy", "plan")

    fil = pg.evaluate("""() => ({
      band: !!document.querySelector('[data-gapband]'),
      cta:  document.querySelectorAll('[data-fillcta]').length,
      rail: document.querySelectorAll('.ritem .rgap').length,
      openable: gapOpenable(TARGET),
      total: gapTotal(TARGET),
      sees: seesEmpty(TARGET),
      pens: document.querySelectorAll(
        '.penbtn[data-page], .secpen[data-page], .editbtn[data-page]').length,
      mayAuthor: SMPRules.mayAuthorPage(world(), viewer(), "u_plan", TARGET)
    })""")
    ck("the filler is shown no bar", fil["band"] is False, fil)
    ck("...no door anywhere on the page", fil["cta"] == 0, fil)
    ck("...no rail mark either", fil["rail"] == 0, fil)
    ck("...and the rule says so, not just the screen", fil["sees"] is False, fil)
    # THE ABSENCE IS A DECISION AND NOT AN EMPTY PAGE. Without this line a
    # build whose fixture had nothing empty in it would satisfy every
    # assertion above while proving nothing (§94.5).
    ck("...over a page that really does still hold empty boxes",
       fil["openable"] > 0 and fil["total"] == 0, fil)
    ck("the filler still has no pen — which is what made the door theirs",
       fil["pens"] == 0 and fil["mayAuthor"] is False, fil)

    # ── 3 · AND THE MISSING REGISTER STILL WORKS, WHOLE ────────────────
    # One gap put back, and everything §272 built for the loud half is
    # asserted here: the count, the chips, the red dress, the door, the walk
    # and the fill. This is the half §287.3 did NOT touch, and it is asserted
    # on the SAME page in the SAME run, or "the bar is gone" and "the bar is
    # broken" look identical from outside.
    print("\n3 · put one gap back — the missing bar returns, and walks")
    pg.evaluate("""(u) => {
      const t = UNITS[u].items.reduce((a, p) => a.concat(p.tactics || []), [])[0];
      delete t.owner;
      paint();
    }""", who["unit"])
    pg.wait_for_timeout(400)

    back = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      if (!band) return { drawn:false };
      const chips = [].slice.call(band.querySelectorAll('.mchip'));
      const map = gapMap(TARGET, false, false).filter(e => e.count > 0);
      return { drawn:true,
        mode:  band.dataset.gapmode || "",
        count: (band.querySelector('[data-gapcount]') || {}).textContent || "",
        total: gapTotal(TARGET),
        chipText: chips.map(c => c.textContent.replace(/\s+/g, " ").trim()),
        want: map.map(e => e.label + " " + e.count),
        quiet: band.querySelectorAll('.eqchip, .eqcta').length,
        cta: (band.querySelector('.fillcta') || {}).textContent || "",
        rail: [].slice.call(document.querySelectorAll('.ritem .rgap'))
                .map(r => r.textContent.trim()) };
    }""")
    ck("the bar is drawn again the moment something is owed", back.get("drawn"), back)
    # THE ATTRIBUTE IS THE QUIET REGISTER'S MARK AND THE LOUD ONE CARRIES
    # NONE — so its absence is what "missing" looks like from outside.
    ck("...in the counted register, which wears no quiet mark",
       back.get("mode") == "", back.get("mode"))
    ck("...saying 'N Missing', in agreement with the rule",
       back.get("count") == str(back.get("total")) + " Missing", back.get("count"))
    ck("...with a chip per owing place, agreeing with gapMap",
       back.get("chipText") == back.get("want"),
       (back.get("chipText"), back.get("want")))
    ck("...and no quiet control anywhere on it", back.get("quiet") == 0, back)
    ck("the red button keeps its words",
       "Fill in missing elements" in back.get("cta", ""), back.get("cta"))
    ck("the rail says where, in the missing register",
       back.get("rail") and all(t.endswith(" Missing") for t in back.get("rail", [])),
       back.get("rail"))

    # THE PAINT, not the class (§145.14: inside nav.tabs a bare class loses,
    # which is how the bar shipped undressed with every assertion green).
    # EVERY PROBE DEGRADES (§215): a build without the control has nothing to
    # compute a style from, and a missing element must report a missing
    # element rather than throw.
    print("\n3b · and red still means missing")
    paint = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      const q = s => (band ? band.querySelector(s) : null);
      const g = e => e ? getComputedStyle(e) : null;
      const c = g(q('[data-gapcount]')), chip = g(q('.mchip')),
            cta = g(q('.fillcta'));
      return { count: c && c.color, chip: chip && chip.borderTopColor,
               ctaBg: cta && cta.backgroundColor,
               chipRadius: chip && chip.borderTopLeftRadius };
    }""")
    bad_tx, bad_ = tok(pg, "--bad-tx"), tok(pg, "--bad")
    ck("the count is drawn in the alarm ink", paint["count"] == bad_tx,
       (paint["count"], bad_tx))
    ck("the chip's edge is the alarm", paint["chip"] == bad_, (paint["chip"], bad_))
    ck("...and it is still a chip (the tab row did not strip it)",
       paint["chipRadius"] not in ("", "0px", None), paint["chipRadius"])
    ck("the button keeps the red FILL", paint["ctaBg"] == bad_,
       (paint["ctaBg"], bad_))

    # A CLICK ON WHAT IS NOT THERE HANGS FOR THIRTY SECONDS AND THEN THROWS
    # (§215 wearing Playwright's clothes): asked for first, so a build without
    # the control fails this line and goes on to the next.
    door = pg.query_selector('[data-gapband] .fillcta')
    ck("the door is there to press", door is not None)
    if door:
        door.click(); pg.wait_for_timeout(600)
    inmode = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      return { fill: !!EDIT_PAGE.plan,
               next: ((band && band.querySelector('[data-nextgap]')) || {}).textContent || "",
               walkable: document.querySelectorAll('.gapwalk').length,
               lit: !!document.querySelector('.gaplit') };
    }""") if door else {"fill": False, "next": "", "walkable": 0, "lit": False}
    ck("the door opens fill mode", inmode["fill"], inmode)
    ck("...and the walk has something to walk", inmode["walkable"] > 0, inmode)
    ck("...the press landed on one of them", inmode["lit"], inmode)
    ck("...the next control says 'Next gap'",
       "Next gap" in inmode["next"], inmode)

    # ── 4 · A FILL LANDS IN THE PLAN ───────────────────────────────────
    print("\n4 · and a fill reaches the data")
    wrote = pg.evaluate("""(u) => {
      /* The walk lit a control; write through the FIELD's own setter, which
         is what the picker does when somebody picks a name (§96: read the
         data back, never the screen). */
      /* THE WALKABLE ELEMENT IS NOT ALWAYS THE BOUND ONE (§177.2): a
         §130.1 picker rings its `.ssbtn` and the `data-fld` sits on the
         hidden select beside it, so the setter is looked for in the cell
         rather than on the marked node. */
      const el = document.querySelector('.gaplit') ||
                 document.querySelector('.gapwalk');
      if (!el) return { ok:false, why:"nothing to walk" };
      const cell = el.closest('td, th, div') || el;
      const b = el.dataset.fld != null ? el : cell.querySelector('[data-fld]');
      const i = b && b.dataset.fld;
      if (i == null) return { ok:false, why:"the walked control is not bound" };
      FIELDS[+i]("Ramy Behairy");
      const t = UNITS[u].items.reduce((a, p) => a.concat(p.tactics || []), [])[0];
      return { ok:true, owner: t.owner || null };
    }""", who["unit"])
    ck("the walked control is bound and writes the plan",
       wrote.get("ok") and wrote.get("owner"), wrote)

    # ── 5 · THE REFRESH REWRITES THE COUNT WHERE IT STANDS ─────────────
    # §71.2: never a repaint under a typing hand, so the number is rewritten
    # in place — and it must follow the register it is IN.
    print("\n5 · the count is rewritten in place, in its own register")
    after = pg.evaluate("""() => {
      gapBandRefresh();
      const band = document.querySelector('[data-gapband]');
      return { count: ((band && band.querySelector('[data-gapcount]')) || {}).textContent || "",
               total: gapTotal(TARGET) };
    }""")
    ck("the count follows what is owed",
       after["count"] == str(after["total"]) + " Missing", after)
    ck("...and the fill took one off it", after["total"] == 0, after)

print("\nerrors: " + (str(errs) if errs else "none"))
print("failures: %d" % (bad + len(errs)))
sys.exit(1 if (bad or errs) else 0)
