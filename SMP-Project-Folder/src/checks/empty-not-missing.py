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

    # ── 2 · THE FILLER IS SHOWN IT, AND IT SAYS WHERE ──────────────────
    print("\n2 · the filler's bar carries the count, the chips and the rail marks")
    be(pg, who["smo"])
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(250)
    pg.click('.setuprail [data-setupgo="access"]'); pg.wait_for_timeout(350)
    pg.click('[data-ac="custodian|a_unit_own_strat|fill"]'); pg.wait_for_timeout(350)
    be(pg, who["cust"], who["unit"], "strategy", "plan")

    fil = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      if (!band) return { drawn:false };
      const chips = [].slice.call(band.querySelectorAll('.mchip'));
      const rail  = [].slice.call(document.querySelectorAll('.ritem .rgap'));
      const map = gapMap(TARGET, false, true).filter(e => e.count > 0);
      return { drawn:true,
        mode:  band.dataset.gapmode || "",
        count: (band.querySelector('[data-gapcount]') || {}).textContent || "",
        openable: gapOpenable(TARGET),
        total: gapTotal(TARGET),
        chipN: chips.length,
        quietChips: band.querySelectorAll('.mchip.eqchip').length,
        chipText: chips.map(c => c.textContent.replace(/\\s+/g, " ").trim()),
        want: map.map(e => e.label + " " + e.count),
        loud: band.querySelectorAll('.fillcta, .secmiss').length,
        cta: (band.querySelector('.eqcta') || {}).textContent || "",
        railText: rail.map(r => r.textContent.trim()),
        railQuiet: document.querySelectorAll('.ritem .rgap.req').length,
        pens: document.querySelectorAll(
          '.penbtn[data-page], .secpen[data-page], .editbtn[data-page]').length,
        mayAuthor: SMPRules.mayAuthorPage(world(), viewer(), "u_plan", TARGET) };
    }""")
    ck("the filler IS shown the bar", fil.get("drawn"), fil)
    ck("...in the quiet register", fil.get("mode") == "empty", fil.get("mode"))
    ck("...counting what is empty, in agreement with the rule",
       fil.get("count") == str(fil.get("openable")) + " empty", fil.get("count"))
    ck("...with a chip per place, agreeing with gapMap's fillable answer",
       fil.get("chipText") == fil.get("want"), (fil.get("chipText"), fil.get("want")))
    ck("...every chip quiet, none of them the missing kind",
       fil.get("chipN", 0) > 0 and fil.get("quietChips") == fil.get("chipN"), fil)
    ck("...and nothing on the bar wearing the missing dress",
       fil.get("loud") == 0, fil.get("loud"))
    ck("the button says what it opens",
       fil.get("cta", "").strip() == "Fill in what is empty", fil.get("cta"))
    ck("the rail marks say where, quietly",
       fil.get("railQuiet", 0) > 0 and
       fil.get("railQuiet") == len(fil.get("railText", [])) and
       all(t.endswith(" empty") for t in fil.get("railText", [])), fil.get("railText"))
    ck("...and the rail's numbers add up to the bar's",
       sum(int(t.split()[0]) for t in fil.get("railText", []))
       <= fil.get("openable", 0), fil.get("railText"))
    ck("the filler has no pen — which is why the door is theirs",
       fil.get("pens") == 0 and fil.get("mayAuthor") is False, fil)

    # §145.14 DRAWS THE DOOR TWICE — the section row's bar and the pane's
    # corner — so every copy is asked, not the one this section happened to
    # measure. The first build dressed the bar and left the corner red: two
    # copies of one control saying the same four words in two voices, on one
    # screen, and no assertion here saw it (§53.5, found by looking).
    doors = pg.evaluate("""() => [].slice.call(
      document.querySelectorAll('[data-fillcta]')).map(b => ({
        text: b.textContent.trim(),
        quiet: b.classList.contains('eqcta'),
        loud: b.classList.contains('fillcta'),
        bg: getComputedStyle(b).backgroundColor }))""")
    ck("every copy of the door is drawn, wherever it is drawn",
       len(doors) > 0, doors)
    ck("...all of them saying the same words",
       len(set(d["text"] for d in doors)) == 1, doors)
    ck("...all of them quiet, none of them the red fill",
       all(d["quiet"] and not d["loud"] for d in doors), doors)
    ck("...and all of them PAINTED the same",
       len(set(d["bg"] for d in doors)) == 1, doors)

    # THE PAINT, not the class (§145.14: inside nav.tabs a bare class loses).
    print("\n2b · and it is PAINTED quiet, not merely classed quiet")
    # EVERY PROBE DEGRADES (§215). This file's own first falsification run
    # DIED here — a build without the quiet controls has nothing to compute a
    # style from, so `grep -c FAIL` under-reported the very build it exists to
    # see. A missing element reports a missing element.
    paint = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      const q = s => (band ? band.querySelector(s) : null);
      const g = e => e ? getComputedStyle(e) : null;
      const c = g(q('[data-gapcount]')), chip = g(q('.mchip')),
            cta = g(q('.eqcta')), rail = g(document.querySelector('.ritem .rgap.req'));
      return { count: c && c.color, chip: chip && chip.borderTopColor,
               ctaBg: cta && cta.backgroundColor, ctaInk: cta && cta.color,
               rail: rail && rail.color, railStyle: rail && rail.fontStyle,
               chipRadius: chip && chip.borderTopLeftRadius };
    }""")
    ink2, ink, bad_, line, surf2 = (tok(pg, "--ink-2"), tok(pg, "--ink"),
                                   tok(pg, "--bad"), tok(pg, "--line"),
                                   tok(pg, "--surface-2"))
    ck("the count is drawn in the page's own ink", paint["count"] == ink2,
       (paint["count"], ink2))
    ck("...never in --bad", paint["count"] != bad_, paint["count"])
    ck("the chip's edge is the ordinary line, not the alarm",
       paint["chip"] == line and paint["chip"] != bad_, (paint["chip"], line, bad_))
    ck("...and it is still a chip (the tab row did not strip it)",
       paint["chipRadius"] not in ("", "0px"), paint["chipRadius"])
    ck("the button is a quiet button, not the red fill",
       paint["ctaBg"] == surf2 and paint["ctaInk"] == ink,
       (paint["ctaBg"], surf2, paint["ctaInk"], ink))
    ck("the rail mark is quiet and upright",
       paint["rail"] == ink2 and paint["railStyle"] == "normal", paint)

    # ── 3 · THE CHIP GOES THERE, AND THE WALK WALKS ────────────────────
    print("\n3 · pressing it takes you to the boxes")
    # A CLICK ON WHAT IS NOT THERE HANGS FOR THIRTY SECONDS AND THEN THROWS
    # (§215 again, wearing Playwright's clothes): asked for first, so a build
    # without the control fails this line and goes on to the next.
    chip2 = pg.query_selector('[data-gapband] .mchip:nth-of-type(2)')
    ck("there is a second place to press", chip2 is not None)
    went = {}
    if chip2:
        chip2.click(); pg.wait_for_timeout(450)
        went = pg.evaluate("""() => ({
          rail: (document.querySelector('.ritem.on .rcode') || {}).textContent || "",
          want: ((document.querySelectorAll('[data-gapband] .mchip')[1] || {textContent:""})
                  .textContent.replace(/\\s+/g," ").trim().split(" ")[0]) })""")
    ck("a chip lands on the place it names",
       bool(went) and went["rail"].strip() == went["want"].strip(), went)

    door = pg.query_selector('[data-gapband] .eqcta')
    ck("the quiet door is there to press", door is not None)
    if door:
        door.click(); pg.wait_for_timeout(600)
    inmode = pg.evaluate("""() => {
      const band = document.querySelector('[data-gapband]');
      return { fill: !!EDIT_PAGE.plan,
               next: ((band && band.querySelector('[data-nextgap]')) || {}).textContent || "",
               walkable: document.querySelectorAll('.gapwalk').length,
               lit: !!document.querySelector('.gaplit'),
               red: document.querySelectorAll('[data-gapband] .fillcta').length };
    }""") if door else {"fill": False, "next": "", "walkable": 0,
                        "lit": False, "red": 0}
    ck("the door opens fill mode", inmode["fill"], inmode)
    ck("...and the walk has something to walk (§192.4's rule, one list over)",
       inmode["walkable"] > 0, inmode)
    ck("...the press landed on one of them", inmode["lit"], inmode)
    ck("...the next control says 'Next empty', quietly",
       "Next empty" in inmode["next"] and inmode["red"] == 0, inmode)

    box = pg.evaluate("""() => {
      const el = document.querySelector('.fld.gapfld, .monthbtn.gapfld');
      if (!el) return null;
      const g = getComputedStyle(el);
      return { eq: el.classList.contains('eqfld'),
               border: g.borderTopColor, style: g.borderTopStyle };
    }""")
    ck("the box the chip sent you to is not rung in red either",
       box and box["eq"] and box["border"] != bad_, box)
    ck("...and is still dashed, so fill mode still shows what is open",
       box and box["style"] == "dashed", box)

    # ── 4 · A FILL LANDS IN THE PLAN ───────────────────────────────────
    print("\n4 · and a fill reaches the data")
    wrote = pg.evaluate("""() => {
      /* The walk lit a control; write through the FIELD's own setter, which
         is what the picker does when somebody ticks a name (§96: read the
         data back, never the screen). */
      const el = document.querySelector('[data-gapat]') ||
                 document.querySelector('.gapwalk');
      if (!el) return { ok:false, why:"nothing to walk" };
      const i = el.dataset.fld;
      if (i == null) return { ok:false, why:"the walked control is not bound" };
      FIELDS[+i](["Ramy Behairy"]);
      const t = UNITS.mobile.items.reduce((a, p) => a.concat(p.tactics || []), [])
        .filter(x => (x.collaborators || []).length);
      return { ok:true, wrote: t.length, name: t.length ? t[0].collaborators[0] : null };
    }""")
    ck("the walked control is bound and writes the plan",
       wrote.get("ok") and wrote.get("wrote", 0) > 0, wrote)

    # ── 5 · THE REFRESH KNOWS WHICH REGISTER IT IS IN ──────────────────
    print("\n5 · the count is rewritten in place, in its own register")
    after = pg.evaluate("""() => {
      gapBandRefresh();
      const band = document.querySelector('[data-gapband]');
      const q = s => band ? band.querySelectorAll(s).length : 0;
      return { count: ((band && band.querySelector('[data-gapcount]')) || {}).textContent || "",
               openable: gapOpenable(TARGET),
               total: gapTotal(TARGET),
               ticked: q('.mchip.done'), chips: q('.mchip') };
    }""")
    ck("the count follows what is empty, not what is owed",
       after["count"] == str(after["openable"]) + " empty", after)
    ck("...and NOT every chip flipped to the green tick",
       after["ticked"] < after["chips"], after)
    ck("...while nothing became owed", after["total"] == 0, after)

print("\nerrors: " + (str(errs) if errs else "none"))
print("failures: %d" % (bad + len(errs)))
sys.exit(1 if (bad or errs) else 0)
