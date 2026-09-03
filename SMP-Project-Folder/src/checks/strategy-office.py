"""THE STRATEGY TAB IS THE OFFICE'S, AND REPORT IS THE ONE SOLID BUTTON (§94).

Islam, 2026-08-25, having signed in as a strategy custodian and gone looking:
"I tested and the custodian found the pens."

That sentence is the reason this file measures the ABSENCE of controls. Every
existing check asks whether a pen is there and works — `qa.py` counts 22 fields
and 12 handles behind the unit's plan pen — and all of them run as the SMO, so
not one of them would have noticed the custodian's. §51.11's rule with the sign
reversed: a check that only ever looks for something PRESENT cannot see a
control that should not be drawn.

Each closed door is asked TWICE, the way §89's three are: once of the SCREEN,
by switching to that person and looking, and once of the RULE, which is the
same function `api/state.js` calls. Where the two disagree the server wins and
the product is broken — and §94 found three places where they already did.

The last two sections are the other two asks in the same message: where a
person lands, and how the Performance page's two buttons read. That second one
was reversed the same day (§94.9) — asked out of the band legend, then asked
back into it with the legend shrunk instead — so what section 4 measures is the
ORDER OF LOUDNESS rather than a position. That is the thing that was actually
wrong, and the thing a later stylesheet edit could silently undo.
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


def be(pg, key, dest=None, tab=None, sec=None):
    """Look as somebody. `current=null` is how the platform itself starts, so
       passing no destination exercises the landing rule rather than a route."""
    pg.evaluate("""(a) => {
      VIEWER = a.k; leaveModes();
      current = a.dest || null; currentSub = a.tab || null;
      if (a.tab && a.sec) CURSEC[a.tab] = a.sec;
      paint();
    }""", {"k": key, "dest": dest, "tab": tab, "sec": sec})
    pg.wait_for_timeout(450)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)

    who = pg.evaluate("""() => {
      const u = UNIT_KEYS[0];
      const fk = FUNCTION_KEYS.filter(k => capsOfFunction(k).length)[0];
      return { unit:u, fn:fk,
               smo: PEOPLE.filter(p => p.role === "super")[0].key,
               head: (UNIT_ROLES[u] || {}).head,
               cust: (UNIT_ROLES[u] || {}).custodian,
               fnhead: (FUNCTIONS[fk] || {}).head };
    }""")
    print("unit %(unit)s · function %(fn)s · smo %(smo)s · head %(head)s · "
          "custodian %(cust)s · fnhead %(fnhead)s" % who)

    # ── 1 · THE RULE ─────────────────────────────────────────────────
    # Asked of the shared module, which is the server's answer. If this is
    # wrong every screen below is decoration.
    print("\n1 · the rule itself")
    r = pg.evaluate("""(w) => {
      const world_ = world();
      const ask = (k, page, target) =>
        SMPRules.mayAuthorPage(world_, personBy(k), page, target);
      return {
        smoPlan:   ask(w.smo,    "u_plan",  w.unit),
        smoFound:  ask(w.smo,    "u_found", w.unit),
        smoProj:   ask(w.smo,    "k_proj",  "fn:" + w.fn),
        headPlan:  ask(w.head,   "u_plan",  w.unit),
        headFound: ask(w.head,   "u_found", w.unit),
        headSwot:  ask(w.head,   "u_anal",  w.unit),
        custPlan:  ask(w.cust,   "u_plan",  w.unit),
        custFound: ask(w.cust,   "u_found", w.unit),
        custSwot:  ask(w.cust,   "u_anal",  w.unit),
        fnProj:    ask(w.fnhead, "k_proj",  "fn:" + w.fn),
        fnFound:   ask(w.fnhead, "k_found", "fn:" + w.fn),
        /* REPORTING MUST BE UNTOUCHED. This is the half that would make the
           change a mistake rather than a decision: the area also carries the
           pages the unit's own people live on, so closing the AREA instead of
           the PAGES would have taken reporting away to withhold authoring. */
        headReport: SMPRules.grantAtPage(world_, personBy(w.head), "u_report", w.unit),
        custReport: SMPRules.grantAtPage(world_, personBy(w.cust), "u_report", w.unit),
        fnReport:   SMPRules.grantAtPage(world_, personBy(w.fnhead), "k_report", "fn:" + w.fn),
        headPerf:   SMPRules.grantAtPage(world_, personBy(w.head), "u_perf", w.unit)
      };
    }""", who)
    ck("the SMO authors the plan", r["smoPlan"] is True)
    ck("...the foundation", r["smoFound"] is True)
    ck("...and a function's projects", r["smoProj"] is True)
    for k, w in [("headPlan", "a unit owner may not author the plan"),
                 ("headFound", "...nor the foundation above it"),
                 ("headSwot", "...nor the SWOT"),
                 ("custPlan", "a strategy custodian may not author the plan"),
                 ("custFound", "...nor the foundation"),
                 ("custSwot", "...nor the SWOT"),
                 ("fnProj", "a function head may not author its projects"),
                 ("fnFound", "...nor its overview")]:
        ck(w, r[k] is False, r[k])
    ck("a unit owner still REPORTS", r["headReport"] == "edit", r["headReport"])
    ck("a custodian still REPORTS", r["custReport"] == "edit", r["custReport"])
    ck("a function head still REPORTS", r["fnReport"] == "edit", r["fnReport"])
    ck("and the unit's Performance page is untouched", r["headPerf"] != "none", r["headPerf"])

    # ── 2 · THE SCREEN ───────────────────────────────────────────────
    # Both ends, per §90: the pen is THERE for the office and NOT THERE for
    # everybody else. Only asserting the second half would pass a build where
    # the pen had been removed for everyone.
    print("\n2 · the screen agrees, on both sides of the switch")

    def pens(pg, key, dest, tab, sec):
        be(pg, key, dest, tab, sec)
        return pg.evaluate("""() => ({
          /* §268: the strategy pen is `#secrow-in .secpen` now; the old
             homes stay in the list so a build that put one back is seen. */
          pens: document.querySelectorAll("#secrow-in .secpen, .pane .penbtn, "
                                          + ".hoverpen > .penbtn, .paneact .penbtn, "
                                          + ".ptitle .penbtn").length,
          anyPen: document.querySelectorAll("[data-page]").length,
          arrange: document.querySelectorAll("[data-arrange]").length,
          grips: document.querySelectorAll(".grip").length
        })""")

    for label, key, want in [("the SMO", who["smo"], True),
                             ("the unit owner", who["head"], False),
                             ("the custodian", who["cust"], False)]:
        v = pens(pg, key, who["unit"], "strategy", "plan")
        ck("%s %s a pen on the unit's Plan" % (label, "has" if want else "has NO"),
           (v["anyPen"] > 0) is want, v)
        # §101 REVERSED §94.3, and this assertion was written for the old world
        # — it demanded "no way to reorder at all" for the owner and custodian,
        # and went red the day reordering was deliberately given back to them.
        # §51.11 exactly: when a control changes shape, grep the CHECKS. The
        # rule that still has teeth is the SPLIT §101 drew: the words stay the
        # office's (no pen), while the ORDER is the holder's — the arrange
        # control is offered, and handles appear only once it is pressed
        # (checks/plan-arrange.py presses it and asserts both ends).
        if not want:
            ck("...and the §101 split holds — arrange offered, no handles until pressed",
               v["arrange"] == 1 and v["grips"] == 0, v)
        v = pens(pg, key, who["unit"], "strategy", "found")
        ck("...%s a pen on Foundation" % ("has" if want else "has NO"),
           (v["anyPen"] > 0) is want, v)
        v = pens(pg, key, who["unit"], "strategy", "swot")
        ck("...%s a pen on SWOT" % ("has" if want else "has NO"),
           (v["anyPen"] > 0) is want, v)

    # THE FUNCTION IS THE SAME PRODUCT (§53.5). Walking both sides is not
    # testing both sides — so both sides are asked the same question here.
    for label, key, want in [("the SMO", who["smo"], True),
                             ("the function head", who["fnhead"], False)]:
        v = pens(pg, key, "fn:" + who["fn"], "fnstrat", "proj")
        ck("%s %s a pen on the function's Projects" % (label, "has" if want else "has NO"),
           (v["anyPen"] > 0) is want, v)
        v = pens(pg, key, "fn:" + who["fn"], "fnstrat", "found")
        ck("...%s a pen on its Overview" % ("has" if want else "has NO"),
           (v["anyPen"] > 0) is want, v)

    # AND A STALE MODE CANNOT CARRY THE FIELDS ACROSS. The viewer switcher
    # repaints without leaving modes — this is the hole that let an open pen
    # follow the SMO into a custodian's view.
    print("\n2b · an open pen does not survive the switch")
    be(pg, who["smo"], who["unit"], "strategy", "found")
    pg.evaluate("""() => { EDIT_PAGE.foundation = true; paint(); }""")
    pg.wait_for_timeout(300)
    ck("the SMO's foundation is editable", pg.query_selector(".pane textarea, textarea") is not None)
    pg.evaluate("""(k) => { VIEWER = k; paint(); }""", who["cust"])
    pg.wait_for_timeout(400)
    ck("...and the custodian gets no fields even with the mode still set",
       pg.evaluate("""() => document.querySelectorAll("textarea[data-f], input[data-f]").length""") == 0,
       pg.evaluate("""() => document.querySelectorAll("textarea[data-f], input[data-f]").length"""))

    # ── 2c · THE PEN IS THE ONLY WAY IN NOW (§94.15) ─────────────────
    # §63.3 kept an explicit Arrange button beside the pen for people who had
    # no pen; §94.3 closed reordering to the office, who all have one, so the
    # button became a duplicate and Islam asked for it to go.
    #
    # BOTH ENDS, and the second is the one that matters: proving the button is
    # absent proves nothing on its own — a build that had lost the HANDLES too
    # would pass it. So the pen is pressed and the handles counted, on both
    # sides of the navigation switch (§53.5).
    print("\n2c · reordering lives on the pen, and nowhere else")

    def arrange_state(pg):
        return pg.evaluate("""() => ({
          arrange: document.querySelectorAll("[data-arrange]").length,
          pen: document.querySelectorAll("[data-page]").length,
          grips: document.querySelectorAll(".grip").length,
          /* Deleting the leading term of a `return a + b` expression is how a
             function comes to return undefined (ASI), and the page renders the
             word rather than throwing — so it is read, not assumed. */
          undef: document.querySelector("#panel").innerHTML.indexOf("undefined")
        })""")

    for label, dest, tab, sec in [("a unit's Plan", who["unit"], "strategy", "plan"),
                                  ("a function's Projects", "fn:" + who["fn"], "fnstrat", "proj")]:
        be(pg, who["smo"], dest, tab, sec)
        v = arrange_state(pg)
        ck("%s has no Arrange button" % label, v["arrange"] == 0, v)
        ck("...and no handles until the pen is pressed", v["grips"] == 0, v)
        ck("...and renders (no `undefined` from a stripped return)", v["undef"] == -1, v)
        pg.click("[data-page='plan']")
        pg.wait_for_timeout(500)
        v = arrange_state(pg)
        ck("...the pen turns the handles on (%d)" % v["grips"], v["grips"] > 0, v)
        ck("...and still offers no second control", v["arrange"] == 0, v)
        pg.click("[data-page='plan']")
        pg.wait_for_timeout(300)

    # THE GROUP KEEPS ITS OWN, and that is the point rather than an exception:
    # its Performance page has no pen, so the button is the only way to reorder
    # units, themes and capabilities. Asserted, or "remove the Arrange button"
    # read one page too widely would pass silently.
    be(pg, who["smo"], "group", "performance")
    v = arrange_state(pg)
    ck("the group keeps its Arrange button, having no pen", v["arrange"] == 1 and v["pen"] == 0, v)

    # ── 3 · WHERE A PERSON OPENS ─────────────────────────────────────
    print("\n3 · people open where they work, on the plan")
    for label, key, want in [("the unit owner", who["head"], who["unit"]),
                             ("the custodian", who["cust"], who["unit"]),
                             ("the function head", who["fnhead"], "fn:" + who["fn"])]:
        be(pg, key)                                   # no destination: land it
        at = pg.evaluate("""() => ({ dest: current, tab: currentSub,
                                     sec: CURSEC[currentSub] || null })""")
        ck("%s lands on %s" % (label, want), at["dest"] == want, at)
        ck("...on Strategy, and on the plan",
           at["tab"] in ("strategy", "fnstrat") and at["sec"] in ("plan", "proj"), at)
    be(pg, who["smo"])
    ck("the SMO still lands on the group",
       pg.evaluate("() => current") == "group", pg.evaluate("() => current"))

    # ── 4 · THE REPORTING TAB'S FILL, IN BOTH THEMES ─────────────────
    # WHAT THIS SECTION USED TO ASSERT IS GONE, DELIBERATELY. §94.8/§94.9
    # settled the loudness order between the reading-the-colours legend and the
    # two controls beside it; §162/§163 then REMOVED that legend outright —
    # `checks/perf-line.py` asserts its absence in so many words ("the
    # reading-the-colours banner is gone"). So this file has been asserting
    # that a deleted element exists, and has been red ever since: two checks
    # arguing, and the wrong one still speaking. §51.11, from the side where
    # the check is the thing that went stale rather than the product.
    #
    # Removed rather than made to pass — the subject no longer exists, and
    # `perf-line.py` owns what replaced it. What survives is the half that is
    # still true and still worth guarding: the Reporting tab's fill and its
    # contrast, in both themes.
    print("\n4 · the Reporting tab's fill, in both themes (§222)")
    be(pg, who["smo"], who["unit"], "performance")
    ck("the Report BUTTON has left the page (§222)",
       pg.evaluate("()=>!document.querySelector('[data-report]')"))

    # THE SAME BUTTON IN THE OTHER THEME. A token declared in one block only
    # is the classic unreadable-page bug, and this one has four blocks.
    for theme in ("dark", "light"):
        pg.evaluate("(t)=>{ document.documentElement.setAttribute('data-theme', t); }", theme)
        pg.wait_for_timeout(200)
        c = pg.evaluate("""() => {
          /* §222: THE FILL IS ON THE TAB, AND ONLY WHILE IT IS SELECTED.
             Measured unselected the tab is transparent, and comparing an ink
             against `rgba(0,0,0,0)` produces a number that means nothing —
             which is exactly what the first run after the move reported. */
          const rep = document.querySelector('[data-s=report]'); if (!rep) return null;
          rep.click();
          /* AND RE-QUERY AFTER THE PRESS. Selecting the tab repaints the row,
             so the node measured before the click is detached — and
             `getComputedStyle` on a detached node returns empty strings, which
             made the colour parser throw rather than report. */
          const lit = document.querySelector('[data-s=report]'); if (!lit) return null;
          const cs = getComputedStyle(lit);
          const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number);
            const f = m.slice(0,3).map(x => { x/=255; return x<=0.03928 ? x/12.92 : Math.pow((x+0.055)/1.055,2.4); });
            return 0.2126*f[0] + 0.7152*f[1] + 0.0722*f[2]; };
          const l1 = lum(cs.backgroundColor), l2 = lum(cs.color);
          return { bg:cs.backgroundColor, fg:cs.color,
                   cr: Math.round(((Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05))*100)/100 };
        }""")
        ck("...in %s theme too" % theme, bool(c) and c["cr"] >= 4.5,
           c and "%s on %s = %s" % (c["fg"], c["bg"], c["cr"]))
    pg.evaluate("()=>document.documentElement.removeAttribute('data-theme')")

    print("\nerrors:", errs or "none")
    print("ALL GREEN" if bad == 0 and not errs else "%d FAILED" % bad)
    b.close()
raise SystemExit(1 if bad or errs else 0)
