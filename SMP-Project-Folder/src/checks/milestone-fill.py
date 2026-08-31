"""A MILESTONE IS FILLED, AND A BOUNDED ROLE FILLS ONLY ITS OWN (§177).

Islam, of a project owner who could report and could not fill: *"his project
has missing items. he should be able to fill the missing items."* — and, of
the grant's reach, *"the fill grant should be for his project only he is not
a cutodian."*

WHAT IS ASSERTED, and why each is here rather than in checks/gap-fill.py:

· THE PRODUCT'S OWN VOCABULARY AGREES WITH ITSELF. Every place a project
  pane prints the red word `Missing` is a place `gapMissing()` counts. That
  is the whole of the fault: the page said Missing three times on a project
  whose gap total was 0, so no control was drawn at all. Asserted as an
  AGREEMENT (§53.5, §94.8) rather than as a number, so a plan with different
  blanks in it stays green.

· A DELIVERABLE IS DELIBERATELY NOT FILLABLE. Its direction and target are
  written FOR it ("=" and "Y/N", §104), so there is nothing there to fill —
  asserted as an absence, or a build that made everything fillable would
  satisfy every assertion above (§94.2).

· THE DUE DATE IS PICKED, NEVER TYPED. No input, a month grid, a year
  stepper, and what it writes is a shape `monthsOf()`, `dueFits()` and
  `shiftWhen()` all read — asked of the three functions themselves, because
  a picker that produced "24/07/2026" would look perfect and quietly stop
  every date comparison in the product.

· THE PANEL IS REACHABLE. It is mounted position:fixed precisely because a
  project's tables sit in an overflow box that clips an absolute one (§45.5)
  — so the assertion is `elementFromPoint` at its centre, not "is in the
  document" (§93.4, §70: present, styled, enabled and unreachable).

· BOUNDED, AT BOTH ENDS. The project owner's own project opens; the one
  beside it does not; the capability Overview does not; and the OFFICE still
  sees all of it. Asked of the screen AND of the shared rule, because a
  control hidden on one side and permitted on the other is the drift
  lib/rules.js exists to prevent (§42).

THE CHECK MAKES ITS STATE (§94.2): every demo project's milestones carry a
date and an owner, so a check that only opened one would measure nothing.

PROVED ABLE TO FAIL (§94.5): against the pre-§177 build it fails from §2 —
the page prints Missing and the gap total answers 0, there is no month
button, and the fill grant reaches every project in the function.
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


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    # §167.2: a returning viewer, or the welcome overlay intercepts every click
    pg.add_init_script("try{sessionStorage.setItem('smp.welcome.seen','1');"
                       "localStorage.setItem('smp.tour.never','1')}catch(e){}")
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    # ── THE STATE (§94.2) ────────────────────────────────────────────────
    # A capability function with two projects, one owned by somebody who holds
    # NOTHING else — so every answer below is the bounded role's, not a
    # custodian's wearing its clothes.
    setup = pg.evaluate("""() => {
      const cap = (GROUP.capabilities || []).filter(c => c.fn && (c.projects||[]).length >= 2)[0];
      if (!cap) return null;
      const fk = cap.fn, target = "fn:" + fk;
      const w = world();
      const free = PEOPLE.filter(p =>
        personActive(p) && SMPRules.personRoles(w, p).length === 0)[0]
        || PEOPLE.filter(p => personActive(p) &&
             SMPRules.personRoles(w, p).every(r => r.role === "contrib"))[0];
      if (!free) return null;
      /* Nothing owed anywhere else, so what the counts say is only ever about
         the rows this section made. */
      (cap.projects || []).forEach(pr => {
        if (!pr.start) pr.start = "Q1 2026";
        if (!pr.end) pr.end = "Q4 2026";
        if (!pr.owner) pr.owner = "Noran Adel";
        (pr.outcomes || []).forEach(o => { if (!o.target) o.target = "1"; });
        (pr.milestones || []).forEach(m => {
          if (!m.finish) m.finish = "Q2 2026";
          if (!m.owner) m.owner = "Noran Adel";
        });
      });
      (cap.keyObjectives || []).forEach(m => {
        if (!m.dir) m.dir = "\\u2265"; if (!m.target) m.target = "1";
        if (!m.compile) m.compile = "Average"; if (!m.weight) m.weight = 100;
      });
      const mine = cap.projects[0], theirs = cap.projects[1];
      mine.owner = free.name;
      /* HIS project owes: one milestone with no date and no owner, and one
         outcome with no target. THEIRS owes a milestone date. And the
         capability Overview owes a direction — a gap inside no row at all. */
      mine.milestones[0].finish = "";
      mine.milestones[0].owner = "";
      if ((mine.outcomes || []).length) mine.outcomes[0].target = "";
      if ((theirs.milestones || []).length) theirs.milestones[0].finish = "";
      if ((cap.keyObjectives || []).length) cap.keyObjectives[0].dir = "";
      ACCESS.powner = ACCESS.powner || {};
      ACCESS.powner.a_fn_own_strat = "fill";
      ACCESS.powner.a_fn_own = "edit";
      return { fk: fk, target: target, cap: cap.id, who: free.key, name: free.name,
               mine: mine.id, theirs: theirs.id,
               outcomes: (mine.outcomes || []).length,
               deliverables: (mine.deliverables || []).length };
    }""")
    if not setup:
        print("no capability with two projects, or nobody without a role — cannot run")
        sys.exit(1)
    print("function %(fk)s · his project %(mine)s · theirs %(theirs)s · as %(name)s"
          % setup)

    def be(who, rail=None):
        pg.evaluate("""(a) => {
          VIEWER = a.who; leaveModes();
          current = a.target; currentSub = "fnstrat"; CURSEC.fnstrat = "proj";
          if (a.rail) RAIL["cap:" + a.cap] = a.rail;
          paint();
        }""", dict(setup, who=who, rail=rail))
        pg.wait_for_timeout(450)

    # ── 1 · HE IS A PROJECT OWNER AND NOTHING ELSE ───────────────────────
    print("\n1 · the role is derived from the plan, and it is the only one")
    be(setup["who"], setup["mine"])
    roles = pg.evaluate("() => personRoles(viewer()).map(r => r.role + '@' + r.at)")
    ck("he holds exactly one role, project owner", roles == ["powner@" + setup["target"]], roles)
    ck("the grant on the Strategy half is fill",
       pg.evaluate("() => SMPRules.grantAtPage(world(), viewer(), 'k_proj', TARGET)") == "fill")

    # ── 2 · THE PAGE'S OWN RED WORD AND THE GAP COUNT AGREE ──────────────
    print("\n2 · every Missing the page prints is a Missing the count knows about")
    shown = pg.evaluate("() => document.querySelectorAll('#panel .missing').length")
    counted = pg.evaluate("() => gapTotal(TARGET)")
    ck("his project shows the red word at all", shown > 0, shown)
    ck("and the count is not zero while it does", counted > 0, counted)
    ck("what the pane says and what the count says agree",
       shown == counted, "shown %s, counted %s" % (shown, counted))

    # ── 3 · WHAT IS FILLABLE, AND WHAT IS DELIBERATELY NOT ───────────────
    print("\n3 · the fields that open, and the ones that must not")
    pg.click("[data-fillcta]")
    pg.wait_for_timeout(600)
    fields = pg.evaluate("""() => ({
      months: document.querySelectorAll('#panel [data-month]').length,
      owners: document.querySelectorAll('#panel .ownersel').length,
      gaps:   document.querySelectorAll('#panel .gapfld').length,
      adds:   document.querySelectorAll('#panel [data-rowadd]').length,
      xs:     document.querySelectorAll('#panel .xbtn').length,
      grips:  document.querySelectorAll('#panel .sortable').length,
      names:  document.querySelectorAll('#panel tbody input.fld:not(.gapfld):not(.pendfld)').length
    })""")
    ck("the milestone with no date gets a month picker", fields["months"] == 1, fields)
    ck("the milestone with no owner gets a register picker", fields["owners"] == 1, fields)
    if setup["outcomes"]:
        ck("the outcome with no target gets a field", fields["gaps"] >= 1, fields)
    ck("no row can be added in fill mode", fields["adds"] == 0, fields)
    ck("nothing can be removed", fields["xs"] == 0, fields)
    ck("nothing can be reordered", fields["grips"] == 0, fields)
    ck("no settled field opens", fields["names"] == 0, fields)
    # a deliverable is written FOR, not asked OF (§104) — nothing to fill
    ck("a deliverable's target is not a gap",
       pg.evaluate("() => !SMPRules.GAP_FIELDS.deliverable"))

    # ── 4 · THE PANEL IS REACHABLE, NOT MERELY PRESENT (§45.5, §93.4) ────
    print("\n4 · the month panel escapes the table's scroll box")
    have_picker = pg.query_selector("#panel [data-month]") is not None
    ck("there is a month button to open", have_picker)
    if have_picker:
        pg.click("#panel [data-month]")
        pg.wait_for_timeout(350)
        panel = pg.evaluate("""() => {
          const p = document.querySelector('.monthpop');
          if (!p) return null;
          const r = p.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return { fixed: getComputedStyle(p).position,
                   inWindow: r.top >= 0 && r.left >= 0 &&
                             r.bottom <= innerHeight && r.right <= innerWidth,
                   whole: Math.round(r.height) > 100,
                   hits: hit ? (hit.className || hit.tagName) : null,
                   months: p.querySelectorAll('[data-mpick]').length,
                   lit: p.querySelectorAll('.mp-m.on').length,
                   year: p.querySelector('.mp-yr b').textContent };
        }""")
        ck("the panel opens", panel is not None)
        if panel:
            ck("...position:fixed, so the table cannot clip it", panel["fixed"] == "fixed", panel)
            ck("...whole and inside the window", panel["inWindow"] and panel["whole"], panel)
            ck("...a click at its centre reaches it", "mp-" in str(panel["hits"]), panel)
            ck("...twelve months and a year", panel["months"] == 12 and panel["year"].isdigit(), panel)
            ck("...nothing lit, because nothing has been set", panel["lit"] == 0, panel)

        # ── 5 · PICKING WRITES A SHAPE THE PLATFORM READS ────────────────
        print("\n5 · the pick is read back out of the data, and the product reads it")
        pg.click("[data-myr='1']"); pg.wait_for_timeout(150)
        yr2 = pg.evaluate("() => document.querySelector('.mp-yr b').textContent")
        pg.click("[data-myr='-1']"); pg.wait_for_timeout(150)
        yr1 = pg.evaluate("() => document.querySelector('.mp-yr b').textContent")
        ck("the year steps and comes back", int(yr2) == int(yr1) + 1, (yr1, yr2))
        pg.click("[data-mpick='6']")
        pg.wait_for_timeout(600)
        wrote = pg.evaluate("""(a) => {
          const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
          const pr = (cap.projects || []).filter(x => x.id === a.mine)[0];
          const m = pr.milestones[0];
          return { value: m.finish, mark: !!(m.pend || {}).finish,
                   reads: monthsOf(m.finish), fits: dueFits(m.finish),
                   shifted: shiftWhen(m.finish, 6), gone: !document.querySelector('.monthpop') };
        }""", setup)
        ck("the month is written as Mon YY", (wrote["value"] or "").startswith("Jul "), wrote)
        ck("...and it is pending, not settled", wrote["mark"], wrote)
        ck("...monthsOf reads it", wrote["reads"] is not None, wrote)
        ck("...dueFits accepts it", wrote["fits"], wrote)
        ck("...shiftWhen moves it six months", wrote["shifted"] == "Jan 27", wrote)
        ck("the panel closes on the pick", wrote["gone"], wrote)
        # Clear puts it back to Missing
        pg.click("#panel [data-month]"); pg.wait_for_timeout(300)
        pg.click("[data-mclear]"); pg.wait_for_timeout(500)
        cleared = pg.evaluate("""(a) => {
          const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
          const pr = (cap.projects || []).filter(x => x.id === a.mine)[0];
          return { value: pr.milestones[0].finish, mark: !!(pr.milestones[0].pend || {}).finish };
        }""", setup)
        ck("Clear empties the value and lifts the mark",
           not cleared["value"] and not cleared["mark"], cleared)

    # ── 6 · BOUNDED, ON THE SCREEN AND IN THE RULE ───────────────────────
    print("\n6 · his project only — a project owner is not a custodian")
    be(setup["who"], setup["mine"])
    # A build with no per-row rule at all is a FAILURE here, not a crash that
    # takes §7 with it (§54.5: name what is unmeasured, never die on it).
    reach = pg.evaluate("""(a) => {
      if (typeof mayFillRow !== "function") return { norule: true };
      const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
      const mine = (cap.projects || []).filter(x => x.id === a.mine)[0];
      const theirs = (cap.projects || []).filter(x => x.id === a.theirs)[0];
      return {
        mine:   mayFillRow("k_proj", { project: mine, row: mine.milestones[0] }),
        theirs: mayFillRow("k_proj", { project: theirs, row: theirs.milestones[0] }),
        capko:  mayFillRow("k_found", {}),
        page:   mayFill("k_proj"),
        map:    gapMap(TARGET).filter(e => e.count).map(e => e.key)
      };
    }""", setup)
    ck("the per-row fill rule exists at all", not reach.get("norule"))
    if reach.get("norule"):
        reach = {"mine": False, "theirs": True, "capko": True, "page": False, "map": []}
    ck("the rule opens his own project's row", reach["mine"], reach)
    ck("...and closes the project beside it", not reach["theirs"], reach)
    ck("...and closes the capability's own objectives", not reach["capko"], reach)
    ck("the page-level grant still says fill", reach["page"], reach)
    ck("he is counted only what he can close",
       reach["map"] == ["pr:" + setup["mine"]], reach["map"])
    # on THEIR project, in fill mode, nothing opens
    pg.click("[data-fillcta]"); pg.wait_for_timeout(600)
    pg.evaluate("""(a) => { RAIL["cap:" + a.cap] = a.theirs; paint(); }""", setup)
    pg.wait_for_timeout(450)
    theirs = pg.evaluate("""() => ({
      band: (document.querySelector('.pband') || {}).textContent || '',
      months: document.querySelectorAll('#panel [data-month]').length,
      gaps: document.querySelectorAll('#panel .gapfld').length })""")
    ck("their project draws no field even with fill mode open",
       theirs["months"] == 0 and theirs["gaps"] == 0, theirs)

    # ── 7 · AND THE OFFICE IS UNCHANGED (§94.2, the other end) ───────────
    print("\n7 · the office still sees, and can close, all of it")
    smo = pg.evaluate("() => PEOPLE.filter(p => p.role === 'super')[0].key")
    be(smo, setup["mine"])
    office = pg.evaluate("""() => ({
      map: gapMap(TARGET).filter(e => e.count).map(e => e.key),
      total: gapTotal(TARGET),
      author: mayAuthor("k_proj")
    })""")
    ck("the office authors the page", office["author"])
    # §94.8: THE RELATIONSHIP, NEVER THE NUMBER. This asked for `>= 3` places
    # and `total > 3`, which held only while a capability's key objectives were
    # counted as missing — §214.2 stopped counting them at Islam's direction
    # ("the key objectives should not count as missing in the functions in
    # general"), and the literal turned a deliberate decision into a red line.
    # What the section is actually about is that the office is counted MORE
    # than a bounded role is, which is true whatever the totals are.
    ck("...and is counted every place that owes, not only the one he owns",
       len(office["map"]) > len(reach["map"]), {"office": office, "bounded": reach["map"]})
    ck("...and more of them than the project owner was",
       office["total"] > 1, office)

    # ── 8 · A DATE ALREADY WRITTEN IS NOT REWRITTEN BY BEING LOOKED AT ───
    print("\n8 · what a plan already carries survives the picker")
    kept = pg.evaluate("""(a) => {
      const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
      const pr = (cap.projects || []).filter(x => x.id === a.mine)[0];
      pr.milestones[0].finish = "Q1 2026";
      if (pr.milestones[1]) pr.milestones[1].finish = "On-going";
      if (pr.milestones[2]) pr.milestones[2].finish = "July 2026";
      leaveModes(); paint();
      return true;
    }""", setup)
    pg.wait_for_timeout(400)
    pen = pg.query_selector(".penbtn[data-page='plan']")
    if pen:
        pen.click(); pg.wait_for_timeout(600)
        parts = pg.evaluate("""() => [].map.call(
          document.querySelectorAll('#panel [data-month]'),
          b => [b.textContent.trim(), b.dataset.mi, b.dataset.yr])""")
        by = dict((p[0], p) for p in parts)
        ck("a stored quarter reads as its year and NO month",
           by.get("Q1 2026", [None, "?", "?"])[1] == "" and
           by.get("Q1 2026", [None, "?", "?"])[2] == "2026", parts)
        ck("...a month-named value still lights its month",
           by.get("July 2026", [None, "?", "?"])[1] == "6", parts)
        ck("...and a value the platform cannot read as a time lights nothing",
           by.get("On-going", [None, "?", "?"])[1] == "", parts)
        # opening and closing without picking must change nothing
        pg.click("#panel [data-month]"); pg.wait_for_timeout(400)
        pg.keyboard.press("Escape"); pg.wait_for_timeout(400)
        after = pg.evaluate("""(a) => {
          const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
          const pr = (cap.projects || []).filter(x => x.id === a.mine)[0];
          return pr.milestones.slice(0, 3).map(m => m.finish);
        }""", setup)
        ck("opening the panel and closing it rewrites nothing",
           after[:1] == ["Q1 2026"], after)
    else:
        ck("the office's pen is there to test the stored shapes with", False)

    # ── 8 · A DATE THE PLATFORM CANNOT READ IS A GAP (§184) ──────────────
    # Islam, on the CX strategy custodian: they filled three empty due dates
    # and touched a fourth holding `30/09/2026` — a value `monthsOf()` cannot
    # read at all — and the whole save came back refused, taking the three
    # good fills with it. Non-blank was not a gap, so the fill grant would
    # not open that row, the office was the only one who could correct it,
    # and the person who tried lost everything else in the same post.
    #
    # THE TWO HALVES ARE MEASURED SEPARATELY, because collapsing them is the
    # tempting wrong fix: the row OPENS to a filler (it is a gap) and still
    # SHOWS what is stored (it is not blank). A build that answered "Missing"
    # in both places would hide the very value somebody needs to see in order
    # to correct it (§96.2).
    print("\n9 · a due date the platform cannot read")
    # BACK TO THE FILLER. §7 left the page as the OFFICE, whose pen opens
    # every field there is — so the first run of this section counted six
    # month buttons and called a correct build broken (§50.6: a check that
    # measures the wrong state passes or fails for reasons of its own).
    be(setup["who"], setup["mine"])
    pg.evaluate("""(a) => {
      const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
      /* Every milestone in the capability gets a readable date first, so what
         is measured below is this ONE row and not §3's leftovers. */
      (cap.projects || []).forEach(pr => {
        (pr.milestones || []).forEach(m => { m.finish = "Q2 2026";
                                             if (!m.owner) m.owner = "Noran Adel"; });
        (pr.outcomes || []).forEach(o => { if (!o.target) o.target = "1"; });
        if (!pr.owner) pr.owner = "Noran Adel";
        if (!pr.start) pr.start = "Q1 2026";
        if (!pr.end) pr.end = "Q4 2026";
      });
      const pr = (cap.projects || []).filter(x => x.id === a.mine)[0];
      pr.milestones[0].finish = "30/09/2026";
      leaveModes(); paint();
    }""", setup)
    pg.wait_for_timeout(450)

    ck("the shared reader says it is not a date",
       pg.evaluate("() => SMPRules.whenReadable('30/09/2026') === false"))
    ck("...and the fill rule therefore calls the row a gap",
       pg.evaluate("() => SMPRules.gapEmpty('finish', { finish: '30/09/2026' }) === true"))
    ck("...while a date it CAN read is still the office's",
       pg.evaluate("() => SMPRules.gapEmpty('finish', { finish: 'Jul 26' }) === false"))
    # The rule is the FIELD's, not every field's: an unreadable TARGET is
    # still a target somebody wrote, and opening it would be a different
    # decision nobody asked for.
    ck("...and it reaches dates only",
       pg.evaluate("() => SMPRules.gapEmpty('target', { target: '30/09/2026' }) === false"))

    counted = pg.evaluate("() => gapTotal(TARGET)")
    ck("the bad date is COUNTED as owed", counted >= 1, counted)
    pg.click("[data-fillcta]")
    pg.wait_for_timeout(600)
    bad_row = pg.evaluate("""(a) => {
      const btns = Array.from(document.querySelectorAll('#panel [data-month]'));
      const hit = btns.filter(b => (b.textContent || '').indexOf('30/09/2026') > -1)[0];
      if (!hit) return { count: btns.length, texts: btns.map(b => b.textContent.trim()) };
      const r = hit.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { found: true, count: btns.length,
               reachable: !!(at && (at === hit || hit.contains(at))),
               walkable: hit.classList.contains('gapwalk') ||
                         !!hit.closest('.gapwalk'),
               shows: (hit.textContent || '').trim() };
    }""", setup)
    ck("the filler is offered a control on it", bad_row.get("found"), bad_row)
    if bad_row.get("found"):
        ck("...exactly one, the row that owes something", bad_row["count"] == 1, bad_row)
        ck("...a click at its centre reaches it", bad_row["reachable"], bad_row)
        # THE OTHER HALF: the value is SHOWN, never replaced by the word
        # Missing — it is what the person is being asked to correct.
        ck("...and it still shows what is stored", "30/09/2026" in bad_row["shows"], bad_row)
        ck("...and Next gap can walk to it", bad_row["walkable"], bad_row)

    # AND THE CONTROL THAT IS DRAWN IS ON A ROW THE COUNT NAMES. §177's rule
    # from §184's side: the page's own controls and `gapMissing()` have to be
    # about the same rows, or the red button promises a field it will not open.
    ck("the row the control sits on is one the gap rule names",
       pg.evaluate("""(a) => {
         const cap = (GROUP.capabilities || []).filter(c => c.id === a.cap)[0];
         const pr = (cap.projects || []).filter(x => x.id === a.mine)[0];
         const owed = pr.milestones.filter(m => SMPRules.gapMissing("milestone", m).length);
         return owed.length === 1 && owed[0].finish === "30/09/2026";
       }""", setup))

    pg.evaluate("() => { if (MONTHPOP) MONTHPOP.shut(); leaveModes(); paint(); }")
    pg.wait_for_timeout(300)

print("")
if errs:
    print("PAGE ERRORS: " + " | ".join(errs[:4]))
print("%d failed" % bad if bad else "all good")
sys.exit(1 if bad or errs else 0)
