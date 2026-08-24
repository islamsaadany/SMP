"""THE SMO TEAM RUNS THE PLATFORM AND CANNOT CHANGE WHO RUNS IT (§89).

Islam: "I need to add the SMO team and their role needs to be below the super
user but nearly very close."

Two halves, and the second is the one worth the file. That the role can do
almost everything is easy to build and easy to see. That it cannot do THREE
specific things is the whole design, and each of them fails silently if it is
only hidden: a control the screen withholds and the server accepts is not a
restriction, it is a delay (§42).

So each of the three is asked twice — once of the SCREEN, by signing in as an
SMO team member and looking for the control, and once of the RULE, which is the
same function the server calls. Where the two disagree, the server wins and the
product is broken.
"""
from playwright.sync_api import sync_playwright

URL = "file:///home/user/SMP/SMP-Project-Folder/src/strategy-management-platform.html"
errs = []
bad = 0


def ck(w, ok, x=""):
    global bad
    if not ok:
        bad += 1
    print(("  ok      " if ok else "  FAIL    ") + w + (("  — " + str(x)) if not ok and x else ""))


def setup(pg, page):
    pg.click('#units [data-md="setup"]')
    pg.wait_for_timeout(350)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g)
        pg.wait_for_timeout(60)
    pg.click('.setuprail [data-setupgo="%s"]' % page)
    pg.wait_for_timeout(800)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    # ── THE RULES, ASKED OF THE SHARED MODULE ────────────────────────
    # Same functions api/state.js and api/auth.js call. If these are wrong,
    # every screen below is decoration.
    print("── the rules themselves")
    r = pg.evaluate("""() => {
      const w = world();
      const su = { key:"r_su", role:"super" };
      const tm = { key:"r_tm", role:"smoteam" };
      const tm2 = { key:"r_tm2", role:"smoteam" };
      const ceo = { key:"r_ceo", role:"gceo" };
      const cl = { key:"r_cl", unit:UNIT_KEYS[0] };
      return {
        listed: SMPRules.ROLES.map(x => x.key),
        matrixSuper: SMPRules.mayEditAccess(w, su),
        matrixTeam: SMPRules.mayEditAccess(w, tm),
        destroySuper: SMPRules.mayDestroy(w, su),
        destroyTeam: SMPRules.mayDestroy(w, tm),
        pwClient: SMPRules.mayIssuePasswordTo(w, tm, cl),
        pwSuper: SMPRules.mayIssuePasswordTo(w, tm, su),
        pwTeammate: SMPRules.mayIssuePasswordTo(w, tm, tm2),
        pwByCeo: SMPRules.mayIssuePasswordTo(w, ceo, cl),
        pwBySuper: SMPRules.mayIssuePasswordTo(w, su, tm),
        setup: SMPRules.grantFor(w, "smoteam", "a_setup"),
        group: SMPRules.grantFor(w, "smoteam", "a_group"),
        cycle: SMPRules.grantFor(w, "smoteam", "a_cycle")
      };
    }""")
    ck("the role sits directly under Super user",
       r["listed"][:2] == ["super", "smoteam"], r["listed"])
    ck("it edits Setup, the group and the cycle",
       r["setup"] == "edit" and r["group"] == "edit" and r["cycle"] == "edit", r)
    ck("1 · the matrix is the Super user's",
       r["matrixSuper"] and not r["matrixTeam"])
    ck("2 · destroying is the Super user's",
       r["destroySuper"] and not r["destroyTeam"])
    ck("3 · they reset the client's people",  r["pwClient"])
    ck("...and never a Super user's",         not r["pwSuper"])
    ck("...and never a teammate's",           not r["pwTeammate"])
    ck("a Super user still resets anybody",   r["pwBySuper"])
    ck("and a CEO resets nobody",             not r["pwByCeo"])

    # ── THE SCREEN, SIGNED IN AS ONE ─────────────────────────────────
    # Through the viewer switcher, which is how every other role is walked.
    print("── the same three, on the screen")
    pg.evaluate("""() => {
      window.__tm = addPerson({ name:"Testcase Office Member", empId:"TM-1",
                                email:"office.member@example.com", role:"smoteam",
                                where:"group" });
      window.__cl = PEOPLE.filter(p => personActive(p) && !SMPRules.isOffice(world(), p))[0].key;
      paint(); }""")
    pg.wait_for_timeout(500)
    tm = pg.evaluate("window.__tm")
    cl = pg.evaluate("window.__cl")
    pg.evaluate("(k)=>{ VIEWER=k; current=null; currentSub=null; paint(); }", tm)
    pg.wait_for_timeout(700)

    ck("they can open Setup at all",
       pg.query_selector('#units [data-md="setup"]') is not None)

    setup(pg, "access")
    ck("Roles & access opens for them",
       pg.query_selector(".setuppane table") is not None)
    ck("...and offers nothing to change on it",
       pg.eval_on_selector_all(".setuppane [data-ac]", "e=>e.length") == 0,
       pg.eval_on_selector_all(".setuppane [data-ac]", "e=>e.length"))

    setup(pg, "people")
    ck("the register opens for them",
       pg.query_selector(".peoplecfg") is not None)
    # THE MENU IS OPENED AND READ, not asked about in the abstract: §70's rule,
    # a control that is present and unreachable passes every other check.
    #
    # THE PASSWORD ENTRY IS NOT ASSERTED HERE, and saying why matters more than
    # asserting it badly: it is live-only (`SYNC.isLive()`), and this check runs
    # the built file from file:// where there is no server — so it is absent for
    # EVERYBODY, including the Super user. A check written against it would pass
    # for the wrong reason, which is the fault this project keeps recording
    # (§50.6). Rule 3 is covered above against the shared function the server
    # calls, and at the door by scripts/test-door.js.
    pg.click('.kebab[data-pmenu="%s"]' % cl)
    pg.wait_for_timeout(300)
    onClient = pg.eval_on_selector_all(".kmenu button", "e=>e.map(x=>x.textContent.trim())")
    ck("a client row still offers them the ordinary actions",
       any("Retire" in t for t in onClient) and any("Edit this row" in t for t in onClient),
       onClient)
    ck("...and never Delete permanently",
       not any("Delete" in t for t in onClient), onClient)

    # ── AND THE SUPER USER STILL HAS ALL THREE ───────────────────────
    # A check that only proves the withholding would pass a build that
    # withheld them from everybody.
    print("── and the Super user is unchanged")
    pg.evaluate("""() => { VIEWER = PEOPLE.filter(p => p.role === "super")[0].key;
                           current = null; currentSub = null; paint(); }""")
    pg.wait_for_timeout(600)
    setup(pg, "access")
    ck("the Super user still edits the matrix",
       pg.eval_on_selector_all(".setuppane [data-ac]", "e=>e.length") > 0)
    setup(pg, "people")
    pg.click('.kebab[data-pmenu="%s"]' % cl)
    pg.wait_for_timeout(300)
    su = pg.eval_on_selector_all(".kmenu button", "e=>e.map(x=>x.textContent.trim())")
    ck("...and still deletes", any("Delete" in t for t in su), su)

    # ── GIVING THE ROLE, THROUGH THE REGISTER (§92) ──────────────────
    # Islam: "I added SMO to Mohamed Essam but the employee role persisted and
    # SMO wasn't added." It had not been — the pair commits when the SECOND
    # half is answered, and a seat held over the group offers a list of one, so
    # doing nothing looked exactly like a broken control. Both sides are
    # asserted: a one-place role commits on the role pick, and a role with a
    # real choice still asks, or the fix would have removed the question
    # everywhere.
    print("── giving the role from the register")
    # PMENU TOO. The section above ends with a row menu OPEN, and the first
    # click anywhere else closes it instead of doing what it was aimed at —
    # §47.2's rule met from the test's side.
    # A FRESH PAGE, not five sections of accumulated state. Chasing why one
    # kebab would not click cost more than the reload does, and a check that
    # depends on what the section before it left behind is a check that breaks
    # for reasons that are not about its subject.
    pg.goto(URL)
    pg.wait_for_timeout(1500)
    setup(pg, "people")
    floor = pg.evaluate("""() => PEOPLE.filter(x => personActive(x) &&
        personRoles(x).every(r => SMPRules.isOwnLinesRole(r.role)))[0].key""")
    was = pg.evaluate("(k)=>personRoles(personBy(k)).map(r=>r.role).join(',')", floor)
    ck("the row starts on the floor role only", was in ("employee", "contrib"), was)
    pg.click('.kebab[data-pmenu="%s"]' % floor)
    pg.wait_for_timeout(250)
    pg.click('[data-pedit="%s"]' % floor)
    pg.wait_for_timeout(500)
    pg.click('[data-prole-open="%s"]' % floor)
    pg.wait_for_timeout(350)
    pg.select_option('[data-prole-pick="%s"]' % floor, "smoteam")
    pg.wait_for_timeout(600)
    now = pg.evaluate("(k)=>personRoles(personBy(k)).map(r=>r.role).join(',')", floor)
    ck("picking SMO team gives it, with no second question", now == "smoteam", now)
    ck("...and the floor role is gone with it", "employee" not in now, now)
    ck("...and no where control was left waiting",
       pg.query_selector('[data-prole-where="%s"]' % floor) is None)

    # A ROLE WITH A REAL CHOICE STILL ASKS. Ten units cannot be guessed.
    #
    # THE ROW IS STILL OPEN, so it is not re-opened: an open row shows Save and
    # Cancel where the ⋮ was (spec 012 §2.1), and the first version of this
    # waited thirty seconds for a kebab the product is right not to draw. The
    # check was wrong, not the register.
    pg.evaluate("(k)=>{ revokePersonRole(k,'smoteam','group'); ADDROLE=null; ADDROLE_KIND=''; paint(); }", floor)
    pg.wait_for_timeout(500)
    ck("the open row shows Save and Cancel rather than a menu",
       pg.query_selector('.kebab[data-pmenu="%s"]' % floor) is None and
       pg.query_selector("[data-rowsave]") is not None)
    pg.click('[data-prole-open="%s"]' % floor)
    pg.wait_for_timeout(350)
    pg.select_option('[data-prole-pick="%s"]' % floor, "owner")
    pg.wait_for_timeout(500)
    ck("a unit owner is still asked which unit",
       pg.query_selector('[data-prole-where="%s"]' % floor) is not None)
    ck("...and nothing was granted until it is answered",
       "owner" not in pg.evaluate("(k)=>personRoles(personBy(k)).map(r=>r.role).join(',')", floor))


    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad == 0 and not errs else "%d FAILED" % bad)
    b.close()
raise SystemExit(1 if bad or errs else 0)
