from playwright.sync_api import sync_playwright
import pathlib
url="file://"+str(pathlib.Path("strategy-management-platform.html").resolve())
errs=[]

def walk_destinations(pg):
    # VISIBLE ones, and the menu is OPENED to reach the rest (68). The group
    # and the companies moved inside a <details> — they are still buttons
    # carrying data-u, so the old selector matched them, found them hidden and
    # timed out. Left as a filter alone it would have been worse than a crash:
    # the sweep would have walked the row and quietly stopped visiting the
    # group at all, which is 50.6's fault in the one place it costs most.
    def vis():
        return [e for e in pg.query_selector_all("#units button[data-u]") if e.is_visible()]
    n = len(vis())
    for ui in range(n):
        us = vis()
        if ui >= len(us): break
        us[ui].click(); pg.wait_for_timeout(120)
        walk_subtabs(pg)
    # The group and each company, behind the top selector.
    tops = pg.eval_on_selector_all("#topsel [data-u]", "els=>els.map(e=>e.dataset.u)")
    for k in tops:
        sm = pg.query_selector("#topsel > summary")
        if not sm: break
        sm.click(); pg.wait_for_timeout(120)
        el = pg.query_selector('#topsel [data-u="%s"]' % k)
        if not el or not el.is_visible(): continue
        el.click(); pg.wait_for_timeout(150)
        walk_subtabs(pg)
        n += 1
    return n

def go_top(pg, key):
    """Open the group or a company, wherever the first control has put them.
    They moved inside a <details> in 68, so a direct click resolves the button
    and then waits thirty seconds for something hidden. Three places clicked it
    directly and walk_destinations() was only the first to be found — §51.11's
    rule, and the reason it is one function now: when a control changes shape,
    every check that named the old one has to be found, not just the one that
    crashed first."""
    el = pg.query_selector('#units [data-u="%s"]' % key)
    if el and el.is_visible():
        el.click(); pg.wait_for_timeout(200); return True
    sm = pg.query_selector("#topsel > summary")
    if not sm: return False
    sm.click(); pg.wait_for_timeout(150)
    el = pg.query_selector('#topsel [data-u="%s"]' % key)
    if not el or not el.is_visible():
        sm.click(); return False
    el.click(); pg.wait_for_timeout(250)
    return True

def show_units(pg):
    """The navigation row shows ONE list at a time (51.9), and a block that
    left it on Functions strands every later block that names a unit — which
    is exactly how the 66 assertions came to sit in the file without ever
    running. Pressing the switch is cheap; assuming the side is not."""
    el = pg.query_selector('#units [data-u="mobile"]')
    if el and el.is_visible(): return
    sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
    if sw: sw.click(); pg.wait_for_timeout(250)

def walk_subtabs(pg):
    m=len(pg.query_selector_all("#subtabs button"))
    for si in range(m):
        ss=pg.query_selector_all("#subtabs button")
        if si>=len(ss): break
        ss[si].click(); pg.wait_for_timeout(120)
        # THE SECTION ROW, AND THE REPORT MODE (63). Neither was ever walked:
        # the sweep pressed the tabs and stopped, so the reporting page — the
        # busiest page in the product for two weeks a quarter — had never once
        # been rendered by a check. Reporting is a BUTTON now rather than a
        # section, which would have made that gap permanent and invisible.
        for s2 in pg.eval_on_selector_all("#secrow-in [data-sub2]",
                                          "els=>els.map(e=>e.dataset.sub2)"):
            # Re-queried and checked for visibility each time: pressing one
            # section repaints, and the row itself can disappear (a tab whose
            # sections drop to one has no row at all).
            el = pg.query_selector('#secrow-in [data-sub2="%s"]' % s2)
            if el and el.is_visible(): el.click(); pg.wait_for_timeout(120)
        rep = pg.query_selector('[data-s=report]')
        if rep:
            rep.click(); pg.wait_for_timeout(150)
            back = pg.query_selector("[data-repcancel]")
            if back: back.click(); pg.wait_for_timeout(120)

with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1400,"height":1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: "+str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.goto(url); pg.wait_for_timeout(600)
    people = pg.eval_on_selector_all("#asWho option","els=>els.map(e=>e.value)")
    for v in people:
        pg.select_option("#asWho", v); pg.wait_for_timeout(200)
        # Destinations only. #units also holds the fold buttons, which go
        # nowhere, and — since 2.9 — the Manage menu's entries, which are not
        # visible until it is opened. Each is walked in its own way.
        seen=0
        # UNITS | FUNCTIONS IS ONE BUTTON NOW (51.9), so the row shows one list
        # at a time and the other is reached by PRESSING it rather than by
        # opening a second fold. This walks the list on show, presses, walks the
        # other, and presses again so the switch is left as it was found.
        #
        # It is updated here rather than left to fail, because it would NOT have
        # failed: `.navfold` simply stops matching, the loop iterates nothing,
        # and the sweep reports "ok" having walked half the product. Third time
        # in one session that a check quietly measured less than it claimed.
        if pg.query_selector("#units .navswitch"):
            for _ in range(2):
                seen+=walk_destinations(pg)
                sw=pg.query_selector("#units .navswitch")
                if sw: sw.click(); pg.wait_for_timeout(150)
        else:
            seen+=walk_destinations(pg)
        # The Manage menu: reopened before each entry, because choosing one
        # closes it. Every entry is a destination the two icons used to hold.
        # THE GEAR IS A DESTINATION, NOT A MENU (47.7). Setup and Manage merged
        # into one page whose rail carries all sixteen entries, so the sweep
        # walks the rail — and unfolds every group first, because a folded one
        # hides its rows and a page nothing clicks is a page nothing tests.
        if pg.query_selector('#units [data-md="setup"]'):
            pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(200)
            for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                             "els=>els.map(e=>e.dataset.railgrp)"):
                pg.click('.setuprail [data-railgrp="%s"]'%g); pg.wait_for_timeout(120)
            for key in pg.eval_on_selector_all(".setuprail [data-setupgo]",
                                               "els=>els.map(e=>e.dataset.setupgo)"):
                el=pg.query_selector('.setuprail [data-setupgo="%s"]'%key)
                if not el: continue
                el.click(); pg.wait_for_timeout(160)
                for k2 in pg.eval_on_selector_all(".setuppane .secrow [data-sub2]",
                                                  "els=>els.map(e=>e.dataset.sub2)"):
                    pg.click('.setuppane .secrow [data-sub2="%s"]'%k2); pg.wait_for_timeout(160)
                seen+=1
        print(v,"ok", seen, "destinations")

    # ── THE TEMPLATE MUST SURVIVE A ROUND TRIP (51.14) ───────────────
    # A template downloaded from the product and uploaded back into it was
    # REFUSED: an entirely empty row is not written into an .xlsx at all, so the
    # blank spacer vanished, every row below it shifted up, and a cell read by
    # row NUMBER came back holding the prose underneath it. Nothing caught it —
    # the sweeps walk pages, and this is a file LEAVING the product and coming
    # back. Asserted here on the real writer and the real reader.
    rt = pg.evaluate("""() => {
      /* AND IT MUST BE ROUND-TRIPPED THE WAY EXCEL DOES IT. Writing with our
         own writer and reading with our own reader proves the two AGREE — it
         does not prove the file survives the tool the customer uses. Our writer
         keeps the blank spacer row; Excel does not write an entirely empty row
         at all. The first version of this guard passed on the broken build,
         which is the fault it exists to catch, arriving inside the catcher.
         `asExcel` drops empty rows, which is the whole of what Excel did. */
      const asExcel = sheets => {
        const out = {};
        Object.keys(sheets).forEach(k => {
          out[k] = (sheets[k] || []).filter(r =>
            (r || []).some(c => String(c == null ? "" : c).trim() !== ""));
        });
        return out;
      };
      const u = UNITS[UNIT_KEYS[0]], c = GROUP.capabilities[0];
      return Promise.resolve(readXlsx(buildXlsx(planWorkbook(u)).buffer)).then(us =>
        Promise.resolve(readXlsx(buildXlsx(capPlanWorkbook(c)).buffer)).then(cs => {
          const U = asExcel(us), C = asExcel(cs);
          return { unit: readmePick(U), fn: readmePickFn(U), wantUnit: u.name,
                   cap: readmePick(C), capFn: readmePickFn(C), wantCap: c.name,
                   wantCapFn: (FUNCTIONS[c.fn] || {}).name || "" };
        }));
    }""")
    if rt["unit"] != rt["wantUnit"]:
        errs.append("ROUND TRIP: a unit template comes back naming %r, not %r"
                    % (rt["unit"], rt["wantUnit"]))
    # ONE NAMING IN EACH FILE (51.19). NEITHER template carries a function
    # cell any more — the capability workbook named both and the two had to
    # agree, which refused files for a link the platform owns. So the contract
    # asserted here is that each file names its OWN subject and answers no
    # question about functions. Asserting the contract, not the old shape:
    # a check left asserting what a feature used to do fails on the day the
    # feature is corrected, and gets edited into agreeing rather than read.
    if rt["fn"] or rt["capFn"]:
        errs.append("ROUND TRIP: a template still answers a function question (%r / %r)"
                    % (rt["fn"], rt["capFn"]))
    if rt["cap"] != rt["wantCap"]:
        errs.append("ROUND TRIP: a capability template comes back %r, not %r"
                    % (rt["cap"], rt["wantCap"]))
    print("template round trip: unit=%r | cap=%r | neither names a function"
          % (rt["unit"], rt["cap"]))

    # ── AN EMPTY FUNCTION IS REACHABLE, AND SAYS SO (61) ──────────────
    # Islam, 2026-08-23: three of his functions were missing from the
    # navigation entirely. fnHasWork() was the whole gate, which is right for
    # somebody coming to READ and exactly wrong for the people who have to put
    # something there — a function with no plan could not be opened, so the
    # only way to reach it was to give it a plan first. On a fresh tenant,
    # where migration 004 removes every capability, that hid EVERY function.
    #
    # Asserted as three facts rather than one: it is in the navigation, its
    # page is not blank, and a plan applied to it reaches the FUNCTION. The
    # third is the one that would fail silently — fnAsUnit() hands out a fresh
    # object every call, so a plan written into it is reported as written and
    # is not there afterwards.
    # As the SMO — the sweep above leaves the switcher on whoever it ended on,
    # and "can this person fill it" is the whole of the new gate.
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    fn61 = pg.evaluate("""() => {
      FUNCTIONS.qapill = { name:"QA Pillars Fn", navName:null, codePrefix:"QAP",
                           head:null, custodian:null, active:true, format:"pillars" };
      FUNCTIONS.qaproj = { name:"QA Projects Fn", navName:null, codePrefix:"QAJ",
                           head:null, custodian:null, active:true };
      FUNCTION_KEYS.push("qapill", "qaproj");
      const nav = { pill: fnShows("qapill"), proj: fnShows("qaproj") };
      const blank = { pill: renderFnProjects("fn:qapill").trim().length,
                      proj: renderFnProjects("fn:qaproj").trim().length,
                      projPerf: renderFnPerformance("fn:qaproj").trim().length };
      const u = unitLikeWritable("fn:qapill");
      applyPlanReplace(u, [
        { type:"PILLAR", id:"P1", name:"QA pillar", kind:"Direction" },
        { type:"MEASURE", id:"M1", parent_id:"P1", name:"QA measure",
          direction:"\u2265", value:"1", unit:"", compile:"Latest" }
      ]);
      fnWriteBack("qapill", u);
      const wrote = { items:(FUNCTIONS.qapill.items || []).length,
                      measures:((FUNCTIONS.qapill.items || [])[0] || {measures:[]}).measures.length,
                      hasWork: fnHasWork("qapill") };
      FUNCTION_KEYS.splice(FUNCTION_KEYS.indexOf("qapill"), 1);
      FUNCTION_KEYS.splice(FUNCTION_KEYS.indexOf("qaproj"), 1);
      delete FUNCTIONS.qapill; delete FUNCTIONS.qaproj;
      return { nav:nav, blank:blank, wrote:wrote };
    }""")
    if not (fn61["nav"]["pill"] and fn61["nav"]["proj"]):
        errs.append("EMPTY FUNCTION: not in the navigation for the SMO (%r)" % fn61["nav"])
    for k, n in fn61["blank"].items():
        if n < 40:
            errs.append("EMPTY FUNCTION: %s renders %d characters \u2014 a blank page, "
                        "not an empty state" % (k, n))
    if fn61["wrote"]["items"] != 1 or fn61["wrote"]["measures"] != 1 or not fn61["wrote"]["hasWork"]:
        errs.append("EMPTY FUNCTION: a plan applied to a pillars function did not "
                    "reach the function (%r)" % fn61["wrote"])
    print("empty function: reachable, says what would fill it, and a plan "
          "written to it sticks (%d pillars, %d measures)"
          % (fn61["wrote"]["items"], fn61["wrote"]["measures"]))

    # ── DELETE IS REFUSED WHILE ANYTHING POINTS AT IT (62) ────────────
    # Islam asked to be able to delete a function outright. Retired-never-
    # deleted stands as the DEFAULT, because a function key is written into a
    # capability, a pillar, a person, the Official BU list and every reporting
    # key — so the delete refuses while any of those hold it, and the refusal
    # names them.
    #
    # Asserted from both ends. Every function in the demo is blocked, and it
    # matters WHICH reason: Merchandising is the one that has been reported
    # against, which is the refusal Retire exists for. And a spare function
    # nothing points at deletes, through the button rather than by calling the
    # model — the check that passes while measuring nothing is the one that
    # builds its own payload (50.6, 54.5).
    dele = pg.evaluate("""() => {
      const blocked = {};
      FUNCTION_KEYS.forEach(k => blocked[k] = fnDeleteBlockers(k).map(b => b.short));
      FUNCTIONS.qaspare = { name:"QA Spare", navName:null, codePrefix:"QSP",
                            head:null, custodian:null, active:true };
      FUNCTION_KEYS.push("qaspare");
      return { blocked:blocked, spare:fnDeleteBlockers("qaspare").length,
               refusedAnyway:deleteFunction(FUNCTION_KEYS[0]) };
    }""")
    unblocked = [k for k, v in dele["blocked"].items() if not v]
    if unblocked:
        errs.append("DELETE: %s would delete with something still pointing at it"
                    % ", ".join(unblocked))
    if dele["spare"]:
        errs.append("DELETE: a function nothing points at is still refused")
    if dele["refusedAnyway"]:
        errs.append("DELETE: deleteFunction() ignored its own blockers")
    if "reported against" not in dele["blocked"].get("merchandising", []):
        errs.append("DELETE: a function that has been reported against is not "
                    "refused on that ground (%r)" % dele["blocked"].get("merchandising"))
    # Through the page, in edit mode, the way a person does it.
    pg.click('#units [data-md="setup"]'); pg.wait_for_timeout(200)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut",
                                     "els=>els.map(e=>e.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g); pg.wait_for_timeout(100)
    pg.click('.setuprail [data-setupgo="fns"]'); pg.wait_for_timeout(300)
    pg.evaluate("() => { EDITING.fns = true; paint(); }"); pg.wait_for_timeout(250)
    n0 = len(pg.query_selector_all(".cfg tbody tr"))
    # DELETE LIVES IN THE ROW MENU NOW (§93.14), so the ⋮ is opened first.
    # Two presses, which is what somebody actually does — and the menu is
    # what makes the row one line instead of 155px.
    def fnmenu(k):
        pg.click('[data-fnmenu="%s"]' % k); pg.wait_for_timeout(250)
    fnmenu("qaspare")
    pg.click('[data-fndel="qaspare"]'); pg.wait_for_timeout(250)
    pg.click('[data-fndelyes="qaspare"]'); pg.wait_for_timeout(400)
    n1 = len(pg.query_selector_all(".cfg tbody tr"))
    still = pg.evaluate("() => !!FUNCTIONS.qaspare")
    if still or n1 != n0 - 1:
        errs.append("DELETE: the button did not remove the row (%d -> %d, still %r)"
                    % (n0, n1, still))
    # And the one that is refused says so where the confirmation would be.
    fnmenu("merchandising")
    pg.click('[data-fndel="merchandising"]'); pg.wait_for_timeout(300)
    # The refusal is a panel in the actions cell now, not a `.confirm.wide`
    # inline in a 201px column — it moved with the button (§93.14).
    refusal = pg.eval_on_selector(".kmenu.kconfirm", "e => e.innerText") \
        if pg.query_selector(".kmenu.kconfirm") else ""
    if "cannot be deleted" not in refusal or "Retire" not in refusal:
        errs.append("DELETE: the refusal does not say why, or does not offer "
                    "Retire (%r)" % refusal[:120])
    pg.click("[data-clearno]"); pg.wait_for_timeout(150)
    print("delete: %d of %d functions blocked, a spare one deletes through the "
          "button, and the refusal names what is in the way"
          % (len(dele["blocked"]) - len(unblocked), len(dele["blocked"])))

    # ── PERFORMANCE OPENS, REPORTING IS A MODE, ARRANGE IS ON THE PLAN (63) ──
    # Three of Islam's asks in one place, and one bug they uncovered.
    #
    # A HANDLE THAT RENDERS LOOKS LIKE A FEATURE THAT WAS BUILT. The pillar
    # rail's grips were bound to NOTHING — the shell picked the item selector
    # from data-kind, and "pillars" meant the accordion's .prow-wrap, which
    # does not exist inside a rail. Four grips, zero bound, on every unit, for
    # as long as the rail has had them. So this asserts the BINDING, not the
    # presence: every sortable's grips must find their row.
    #
    # And both sides (A15): a unit's plan and a pillars function's are the same
    # page, so the same three facts are asserted on each.
    def arrange_probe(pg, dest):
        return pg.evaluate("""(d) => {
          const out = { bound:[], order:unitLike(d).items.map(x => x.name) };
          document.querySelectorAll(".sortable").forEach(c => {
            const sel = c.dataset.item || "tr";
            let bound = 0;
            c.querySelectorAll(".grip").forEach(g => { if (g.closest(sel)) bound++; });
            out.bound.push({ kind:c.dataset.kind, grips:c.querySelectorAll(".grip").length,
                             bound:bound });
          });
          return out;
        }""", dest)

    for label, dest, sec in [("unit", "mobile", "plan"),
                             ("function", "fn:merchandising", "plan")]:
        if dest.startswith("fn:"):
            if not pg.query_selector('#units [data-u="%s"]' % dest):
                sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
                if sw: sw.click(); pg.wait_for_timeout(250)
        else:
            show_units(pg)
        pg.click('#units [data-u="%s"]' % dest); pg.wait_for_timeout(250)
        # Performance is ONE page now: no section row, and a Report button.
        pg.click('#subtabs button:has-text("Performance")'); pg.wait_for_timeout(300)
        perf = pg.evaluate("""() => ({
          secrow: !document.getElementById("secrow").hidden,
          report: !!document.querySelector('[data-s=report]'),
          present: !!document.querySelector("details.dlmenu [data-present]"),
          arrange: !!document.querySelector("[data-arrange]") })""")
        if perf["secrow"]:
            errs.append("PERFORMANCE (%s): still has a section row" % label)
        if not perf["report"]:
            errs.append("PERFORMANCE (%s): no Report button in an open cycle" % label)
        if not perf["present"]:
            errs.append("PERFORMANCE (%s): Present is not in the Presentation menu" % label)
        if perf["arrange"]:
            errs.append("PERFORMANCE (%s): Arrange is still here — it belongs to the plan"
                        % label)
        pg.click('[data-s=report]'); pg.wait_for_timeout(300)
        # THE BAR MOVED, IT DID NOT GO (§150). The reporting controls now ride
        # the tab row rather than sitting in the page, so this asked for
        # `.rep-bar` and correctly found nothing — §51.11's fault caught doing
        # its job for once: a check keyed on markup that changed, going red
        # rather than quietly passing. It asks for the CONTROLS and for the
        # box being in the pinned row, which is what the move was for.
        inrep = pg.evaluate("""() => ({
          box: !!document.querySelector(".repchrome"),
          inChrome: !!document.querySelector("#subtabs .repchrome"),
          save: !!document.querySelector("[data-repsave]"),
          cancel: !!document.querySelector("[data-repcancel]") })""")
        if not (inrep["box"] and inrep["inChrome"] and inrep["save"] and inrep["cancel"]):
            errs.append("REPORT (%s): the mode does not carry its controls on the tab row (%r)"
                        % (label, inrep))
        pg.click("[data-repcancel]"); pg.wait_for_timeout(250)
        if pg.query_selector(".rep-bar"):
            errs.append("REPORT (%s): Cancel did not leave the mode" % label)

        # The plan, in edit mode: fields AND handles, and every handle bound.
        pg.click('#subtabs button:has-text("Strategy")'); pg.wait_for_timeout(250)
        el = pg.query_selector('#secrow-in [data-sub2="%s"]' % sec)
        if el: el.click(); pg.wait_for_timeout(250)
        pg.locator(".pane").first.hover(); pg.wait_for_timeout(120)
        pen = pg.query_selector(".penbtn")
        if not pen:
            errs.append("PLAN (%s): no edit pen for the SMO" % label); continue
        pen.click(); pg.wait_for_timeout(300)
        pr = arrange_probe(pg, dest)
        if not pr["bound"]:
            errs.append("PLAN (%s): the pen turned on no handles at all" % label)
        for c in pr["bound"]:
            if c["grips"] != c["bound"] or not c["grips"]:
                errs.append("PLAN (%s): %s has %d grips and %d bound to a row"
                            % (label, c["kind"], c["grips"], c["bound"]))
        # Reorder by keyboard, and Performance must follow — it reads the same
        # array, so this asserts there is no second arrangement anywhere.
        grips = pg.query_selector_all(".rail .grip")
        if len(grips) > 1:
            grips[1].focus(); pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(300)
        after = pg.evaluate("(d) => unitLike(d).items.map(x => x.name)", dest)
        if after == pr["order"]:
            errs.append("PLAN (%s): dragging a pillar in the rail changed nothing" % label)
        pg.click('#subtabs button:has-text("Performance")'); pg.wait_for_timeout(300)
        follows = pg.eval_on_selector_all(".rail .ritem b", "els => els.map(e => e.textContent)")
        if follows != after:
            errs.append("PLAN (%s): Performance does not follow the plan's order (%r vs %r)"
                        % (label, follows, after))
        if pg.query_selector(".grip"):
            errs.append("PLAN (%s): the handles came with us to Performance, "
                        "where nothing can turn them off" % label)
        print("performance/report/arrange (%s): one page, a Report mode, and %d "
              "sortables all bound" % (label, len(pr["bound"])))

    # ── THREE HEADLINE NUMBERS, AND THE MIDDLE ONE IS COMPUTED (64) ───
    # Islam asked for the pillars' collective figure between the objectives and
    # execution. It is unitPillars(), which has existed since the scoring model
    # did — so the assertion that matters is that the CARD shows what the model
    # computes, not that a third card exists. A card showing a plausible number
    # that came from somewhere else is the failure this catches.
    #
    # And the dash: a unit with nothing scored must read "—", never 0. That is
    # the rule the whole scoring model rests on (5.7) and the one a new average
    # is most likely to break.
    for label, dest in [("unit", "mobile"), ("function", "fn:merchandising")]:
        three = pg.evaluate("""(d) => {
          const u = unitLike(d);
          const el = document.createElement("div");
          el.innerHTML = renderUnitPerformance(u);
          const cards = [...el.querySelector(".scores").querySelectorAll(":scope > .card")]
            .map(c => ({ h:c.querySelector("h4").textContent.trim(),
                         big:c.querySelector(".big").textContent.trim() }));
          /* Nothing scored anywhere: the middle number must be a dash. */
          const keep = u.items.map(p => (p.measures || []).map(m => m.progress));
          const by = u.items.map(p => p.by);
          u.items.forEach(p => { delete p.by;
            (p.measures || []).forEach(m => { m.progress = null; }); });
          const bare = document.createElement("div");
          bare.innerHTML = renderUnitPerformance(u);
          const blank = [...bare.querySelector(".scores").querySelectorAll(":scope > .card")][1]
            .querySelector(".big").textContent.trim();
          u.items.forEach((p, i) => { if (by[i]) p.by = by[i];
            (p.measures || []).forEach((m, j) => { m.progress = keep[i][j]; }); });
          return { cards:cards, computed:unitPillars(u), blank:blank };
        }""", dest)
        if len(three["cards"]) != 3:
            errs.append("SCORES (%s): %d headline cards, expected 3 (%r)"
                        % (label, len(three["cards"]), three["cards"]))
            continue
        mid = three["cards"][1]
        want = "\u2014" if three["computed"] is None else "%d%%" % three["computed"]
        if mid["big"].replace("\u2014", "\u2014") != want:
            errs.append("SCORES (%s): the middle card reads %r and unitPillars() "
                        "computes %r" % (label, mid["big"], want))
        if "performance" not in mid["h"].lower():
            errs.append("SCORES (%s): the middle card is not a performance card (%r)"
                        % (label, mid["h"]))
        if three["blank"] != "\u2014":
            errs.append("SCORES (%s): with nothing scored the middle card reads %r, "
                        "not a dash \u2014 unreported is not nought"
                        % (label, three["blank"]))
        print("three numbers (%s): %s / %s / %s, middle agrees with unitPillars(), "
              "dash when nothing is scored"
              % (label, three["cards"][0]["big"], mid["big"], three["cards"][2]["big"]))

    # ── A UNIT AND A FUNCTION MUST MATCH (53.5) ───────────────────────
    # The rule Islam set on 2026-08-23: any change to how something works or
    # how it looks is tested on BOTH sides of the navigation switch, because a
    # unit's page and a function's are the same product and must not drift
    # apart unless something genuinely conflicts. They already had: a unit
    # opened on its Plan and a function on Performance (28, never applied to
    # functions); the unit's rail lost its bare number and its footer in 29.6
    # and the function's kept both; and the function's rail and pane sat 34px
    # narrower, inside a card the unit does not have.
    #
    # Walking both sides would not have caught any of that — the sweep visited
    # every one of those pages and reported "ok". So this MEASURES the two and
    # compares them: the same rail track, the same pane box, the same band,
    # pinned at the same offset. It asserts they AGREE, never what the number
    # is, so a deliberate change to both stays green and a change to one does
    # not.
    def pane_shape(pg):
        return pg.evaluate("""() => {
          const split = document.querySelector('.split');
          if (!split) return { err: 'no .split on this page' };
          const rail = split.querySelector('.rail'), pane = split.querySelector('.pane');
          const band = pane && pane.querySelector(':scope > .pband');
          const nm = band && band.querySelector('.pband-name');
          const panel = document.getElementById('panel');
          const pb = panel.getBoundingClientRect(), rb = pane.getBoundingClientRect();
          const cs = getComputedStyle(pane);
          return {
            railTrack: getComputedStyle(split).gridTemplateColumns.split(' ')[0],
            paneLeft: Math.round(rb.left - pb.left), paneRight: Math.round(pb.right - rb.right),
            panePad: cs.padding,
            railSticky: getComputedStyle(rail).position + ' ' + getComputedStyle(rail).top,
            bandSticky: band ? getComputedStyle(band).position + ' ' + getComputedStyle(band).top : 'no band',
            bandName: nm ? getComputedStyle(nm).fontSize + '/' + getComputedStyle(nm).fontWeight : 'no name',
          };
        }""")

    def goto(pg, key, tab, sec):
        want = "Functions" if key.startswith("fn:") else "Units"
        for _ in range(3):
            on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
            if on and on[0] == want: break
            pg.click("#units .navswitch"); pg.wait_for_timeout(150)
        pg.click('#units button[data-u="%s"]' % key); pg.wait_for_timeout(250)
        pg.evaluate("""(t)=>{const b=[...document.querySelectorAll('#subtabs button')]
            .find(x=>x.textContent.trim()===t); if(b)b.click()}""", tab)
        pg.wait_for_timeout(200)
        pg.evaluate("""(t)=>{const b=[...document.querySelectorAll('#secrow button')]
            .find(x=>x.textContent.trim()===t); if(b)b.click()}""", sec)
        pg.wait_for_timeout(300)
        # THE LABEL MUST SAY WHICH PAGE WAS ACTUALLY SCANNED (50.6). A probe
        # that clicks and does not check reports the page behind under the
        # name of the one it meant to open.
        # THE NAME, NOT ITS ANNOTATIONS (132.12, 51.11's drill): the tab
        # carries a gap-count badge and screen-reader text now, so a bare
        # textContent read "Strategy22 - 22 to fill" and two checks went red
        # on a healthy build. Read the label with the marks removed.
        got = pg.evaluate("""()=>{const label=(el)=>{if(!el)return '?';
            const c=el.cloneNode(true);
            c.querySelectorAll('.tbadge,.vh,.tabdot').forEach(x=>x.remove());
            return c.textContent.trim()};
            return label(document.querySelector('#subtabs [aria-selected="true"]')) + ' / ' +
                   label(document.querySelector('#secrow [aria-selected="true"]'))}""")
        return got

    pg.select_option("#asWho", people[0]); pg.wait_for_timeout(200)
    where_u = goto(pg, "mobile", "Strategy", "Plan")
    unit_shape = pane_shape(pg)
    where_f = goto(pg, "fn:finance", "Strategy", "Projects")
    fn_shape = pane_shape(pg)
    if where_u != "Strategy / Plan":
        errs.append("PARITY: meant to scan a unit's Plan, landed on %r" % where_u)
    if where_f != "Strategy / Projects":
        errs.append("PARITY: meant to scan a function's Projects, landed on %r" % where_f)
    for k in sorted(set(list(unit_shape) + list(fn_shape))):
        if unit_shape.get(k) != fn_shape.get(k):
            errs.append("PARITY %s: unit %r, function %r"
                        % (k, unit_shape.get(k), fn_shape.get(k)))
    print("unit/function parity: %s vs %s \u2014 %s"
          % (where_u, where_f,
             "same shape" if unit_shape == fn_shape else "DIFFERENT"))

    # ── THE STRIP ABOVE A PINNED HEADER IS GROUND (53.7) ──────────────
    # `.pane > .pband::before` and `.split .rail::before` fill the gap between
    # the chrome and the pinned pair with the page's own ground, so the pane's
    # content cannot slide through it. CSS cannot ask whether a sticky element
    # is currently pinned, so they paint at ALL times — which means whatever
    # sits immediately above the split has that much of its bottom painted
    # over. It cost a capability band nine pixels and a key-objectives table
    # twenty-three, and the unit's Report page had it too.
    #
    # `* + .split` leaves the clearance. Asserted here as the distance from the
    # split's top to the LOWEST thing drawn before it in the page — not just
    # its previous sibling, because on a function's Projects page the split is
    # the first child of the capability body and the band is a step further out.
    clear = pg.evaluate("""() => {
      const need = parseInt(getComputedStyle(document.documentElement)
                     .getPropertyValue('--pin-clear')) || 24;
      const panel = document.getElementById('panel');
      const out = [];
      panel.querySelectorAll('.split').forEach(sp => {
        if (!sp.querySelector(':scope > .rail')) return;      /* setup's rail pins nothing */
        const top = sp.getBoundingClientRect().top;
        let lowest = -1e9, who = '(nothing above it)';
        panel.querySelectorAll('*').forEach(el => {
          if (el === sp || sp.contains(el) || el.contains(sp)) return;
          if (!(sp.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING)) return;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return;
          if (r.bottom > lowest && r.bottom <= top) {
            lowest = r.bottom;
            who = (typeof el.className === 'string' && el.className
                   ? '.' + el.className.split(' ')[0] : el.tagName);
          }
        });
        out.push({ who: who, gap: lowest < -1e8 ? null : Math.round(top - lowest), need: need });
      });
      return out;
    }""")
    for c in clear:
        if c["gap"] is not None and c["gap"] < c["need"]:
            errs.append("PIN CLEARANCE: a split sits %dpx under %s, less than the %dpx its "
                        "ground filler paints" % (c["gap"], c["who"], c["need"]))
    print("pin clearance: " + (", ".join("%s +%s" % (c["who"], c["gap"]) for c in clear) or "no railed split here"))

    # A FUNCTION OPENS ON ITS PROJECTS, as a unit opens on its Plan (53.1).
    for key, want in (("mobile", "Strategy / Plan"), ("fn:finance", "Strategy / Projects")):
        w = "Functions" if key.startswith("fn:") else "Units"
        for _ in range(3):
            on = pg.eval_on_selector_all("#units .navswitch .nsw.on", "e=>e.map(x=>x.textContent.trim())")
            if on and on[0] == w: break
            pg.click("#units .navswitch"); pg.wait_for_timeout(150)
        go_top(pg, "group")
        pg.click('#units button[data-u="%s"]' % key); pg.wait_for_timeout(350)
        # THE NAME, NOT ITS ANNOTATIONS (132.12, 51.11's drill): the tab
        # carries a gap-count badge and screen-reader text now, so a bare
        # textContent read "Strategy22 - 22 to fill" and two checks went red
        # on a healthy build. Read the label with the marks removed.
        got = pg.evaluate("""()=>{const label=(el)=>{if(!el)return '?';
            const c=el.cloneNode(true);
            c.querySelectorAll('.tbadge,.vh,.tabdot').forEach(x=>x.remove());
            return c.textContent.trim()};
            return label(document.querySelector('#subtabs [aria-selected="true"]')) + ' / ' +
                   label(document.querySelector('#secrow [aria-selected="true"]'))}""")
        if got != want:
            errs.append("LANDING: %s opens on %r, not %r" % (key, got, want))
        print("%s opens on %s" % (key, got))
    # ── THE PEOPLE FILE MUST SURVIVE THE SAME ROUND TRIP (54.3) ──────
    # Same fault line as the plan template, and one more: this file is the
    # EXPORT as well as the template, so the register downloaded and uploaded
    # back unchanged has to be a FIXED POINT. If it is not, the first thing
    # anybody does with the feature — download it to see the shape — reports a
    # register full of changes that are not changes.
    #
    # Driven through the real writer, the real reader and the real planner,
    # with `asExcel` dropping empty rows exactly as Excel does. The register is
    # given employee numbers first, because without one every row is skipped
    # and the fixed point would hold by measuring nothing (51.11).
    pf = pg.evaluate("""() => {
      const asExcel = sheets => {
        const out = {};
        Object.keys(sheets).forEach(k => {
          out[k] = (sheets[k] || []).filter(r =>
            (r || []).some(c => String(c == null ? "" : c).trim() !== ""));
        });
        return out;
      };

      /* Numbers on everybody, and one department that maps and one that does
         not — the two cases the BU column has to tell apart. */
      PEOPLE.forEach((p, i) => { p.empId = "E" + (1000 + i); });
      /* Three rows, three answers: a name that means ONE place, a name that
         means NOTHING, and — since 57 — a name that holds SEVERAL. The third
         must not be resolved: a Main BU covering three units cannot say which
         of them somebody is in, which is the whole reason the sign-in asks.
         `at` is written as a STRING on the first two on purpose, because that
         is the shape every row saved before 57 still holds. */
      GROUP.mainbus = [{ name: "Retail", at: UNIT_KEYS[1] }, { name: "Risk", at: null },
                       { name: "Distribution", at: [UNIT_KEYS[0], UNIT_KEYS[2]] }];
      PEOPLE[0].mainbu = "Retail";
      PEOPLE[1].mainbu = "Risk";
      PEOPLE[3].mainbu = "Distribution";

      /* ── THE FIXED POINT IS MEASURED WITH EVERYTHING TAKEN (87.6) ──
         Since a difference is an OFFER rather than an instruction, a plan
         whose ticks are all off changes nothing whatever the file says — so a
         fixed point measured on the defaults would be measuring the defaults
         (51.11, the check that passes because it asks nothing). Every pick is
         turned ON first, and the assertion is then the real one: the register
         downloaded and uploaded back proposes nothing to change even when you
         accept all of it. */
      const takeAll = plan => {
        plan.rows.forEach(r => (r.picks || []).forEach(f => { f.take = true; }));
        return plan;
      };
      const movingRows = plan => plan.rows.filter(r =>
        peopleRowEffective(r).mode === "add" || peopleRowChanges(r).length);

      return Promise.resolve(readXlsx(buildXlsx(peopleWorkbook()).buffer)).then(sh => {
        const rows = peopleFromWorkbook(asExcel(sh));
        const fixed = takeAll(planPeopleFile(rows));

        /* THE MAPPING ASSERTIONS BELOW NEED THE Unit COLUMN EMPTY (65).
           It exists to BEAT the Official BU mapping, and since the download
           now fills it for everybody these three stopped observing the mapping
           at all — they reported where each person already sits, which is the
           new column working exactly as designed. The check failed, correctly,
           the first time it was run against it.

           So they run on a copy with Unit blanked, which is the documented
           "leave it and the Official BU decides" path — the assertion is
           sharper than before, because it now proves the fallback as well as
           the mapping. */
        const mapRows = rows.map(r => Object.assign({}, r, { Unit:"" }));
        const mapped = planPeopleFile(mapRows);

        /* THE EDIT IS MADE TO THE FILE, NOT TO THE REGISTER. Written the other
           way round first — change the person, download again — it proved
           nothing at all: the download carried the new value too, so both
           sides agreed and the check reported zero changes while passing.
           Measuring the wrong thing passes (50.6). */
        const target = rows.filter(r => r["Emp ID"] === PEOPLE[2].empId)[0];
        target["Job title"] = "Something else entirely";
        const untaken = planPeopleFile(rows);
        const untakenRow = untaken.rows.filter(r => r.id === PEOPLE[2].empId)[0] || null;
        const moved = takeAll(planPeopleFile(rows));
        const movedRow = moved.rows.filter(r => r.id === PEOPLE[2].empId)[0] || null;
        target["Job title"] = "";

        /* And the case the whole feature exists for: somebody the register has
           never met, in a department it has never heard of. */
        /* "Main BU", THE OLD HEADER, ON PURPOSE (58). The column is called
           Official BU since the rename and the download writes that — which
           the fixed point above already proves reads. This row is the file
           somebody downloaded BEFORE the rename and is still holding: a header
           is a contract, and refusing it would be 54.4's fault arriving
           through a relabelling. Do not "tidy" this to the new name; the new
           name is tested three lines up. */
        rows.push({ "Emp ID": "102347", "Name": "A New Joiner",
                    "Job title": "Senior Manager (Sales)", "Email": "new@example.com",
                    "Mobile": "01000000000", "Main BU": "Maintenance",
                    "Role": "", "Status": "Active" });
        const seeded = planPeopleFile(rows);
        const seededRow = seeded.rows.filter(r => r.id === "102347")[0] || null;

        return {
          fixedMoving: movingRows(fixed).length,
          fixedProblems: fixed.problems.length,
          fixedSkipped: fixed.notices.length,
          rows: fixed.rows.length,
          people: PEOPLE.length,
          mappedAt: (mapped.rows.filter(r => r.key === PEOPLE[0].key)[0] || {}).where || null,
          unmappedAt: (mapped.rows.filter(r => r.key === PEOPLE[1].key)[0] || {}).where || null,
          severalAt: (mapped.rows.filter(r => r.key === PEOPLE[3].key)[0] || {}).where || null,
          severalChoices: (SMPRules && mainbuChoices("Distribution")) || [],
          movedRows: movingRows(moved).length,
          movedWhat: movedRow ? peopleRowChanges(movedRow).join(",") : "(row missing)",
          /* THE DEFAULT IS THE REGISTER'S (87.6). The same file, the same
             changed cell, nothing ticked: it must propose the change and
             apply none of it. */
          untakenOffers: untakenRow ? untakenRow.picks.length : -1,
          untakenDoes: untakenRow ? peopleRowChanges(untakenRow).length : -1,
          seededAction: seededRow ? seededRow.action : "(row missing)",
          seededProblems: seeded.problems.length,
          seededNewBus: seeded.newBus.join(","),

          /* ── THE Unit COLUMN (65) ──────────────────────────────────
             Islam: "the BU as far as I understand is the relation we have …
             we need this in the download template as if I know some of them
             I will upload it ready." So the file carries where somebody
             actually sits, not only the client's own name for it.

             Asserted as five facts. It is WRITTEN (a header alone proves
             nothing — an empty column would still pass a header check). It is
             READ back to the same place. It WINS over the Official BU
             mapping, which is the whole point. A name that is not a place is
             REFUSED, because a column that swallows typos is worse than no
             column. And the OLD header still reads (58's rule, applied
             forward: "BU" was this column's header for one build). */
          unitHead: PEOPLE_FILE_COLS.indexOf("Unit") > -1,
          unitWritten: rows.filter(r => String(r.Unit || "").trim() !== "").length,
          unitReadsBack: (() => {
            const t = rows.filter(r => r["Emp ID"] === PEOPLE[4].empId)[0];
            return t ? planPeopleFile([t]).rows[0].where : "(row missing)";
          })(),
          unitWasAt: personAt(PEOPLE[4]),
          /* PEOPLE[1] is on "Risk", which points at nothing — so the mapping
             leaves them unplaced and the column is the only thing that can
             move them. The strongest case for the feature, so it is the one
             asserted. */
          unitOverrides: (() => {
            const t = rows.filter(r => r["Emp ID"] === PEOPLE[1].empId)[0];
            if (!t) return "(row missing)";
            const was = t.Unit; t.Unit = "Treasury (function)";
            const r = planPeopleFile([t]).rows[0];
            t.Unit = was;
            return r ? r.where : "(no row)";
          })(),
          unitRefuses: (() => {
            const t = rows.filter(r => r["Emp ID"] === PEOPLE[1].empId)[0];
            const was = t.Unit; t.Unit = "Nowhere At All";
            const n = planPeopleFile([t]).problems.length;
            t.Unit = was;
            return n;
          })(),
          unitOldHeader: planPeopleFile(
            [{ "Emp ID":"E-oldhdr", "Name":"Old Header", "BU":"Mobile" }]).rows[0].where
        };
      });
    }""")
    if pf["rows"] != pf["people"]:
        errs.append("PEOPLE FILE: %d of %d people came back through the file"
                    % (pf["rows"], pf["people"]))
    if pf["fixedProblems"] or pf["fixedSkipped"]:
        errs.append("PEOPLE FILE: its own download does not read cleanly (%d problems, %d skipped)"
                    % (pf["fixedProblems"], pf["fixedSkipped"]))
    if pf["fixedMoving"]:
        errs.append("PEOPLE FILE: downloading and uploading it back moves %d rows — not a fixed point"
                    % pf["fixedMoving"])
    if pf["mappedAt"] != "retailstores" or pf["unmappedAt"]:
        errs.append("PEOPLE FILE: BU list resolved to %r / %r, wanted 'retailstores' / nothing"
                    % (pf["mappedAt"], pf["unmappedAt"]))
    # A NAME THAT HOLDS SEVERAL PLACES NOBODY (57). It offers the choices to
    # the sign-in picker instead; guessing one of three would put somebody in a
    # unit nobody said they were in, and the whole point of asking is that the
    # file cannot know.
    if pf["severalAt"]:
        errs.append("PEOPLE FILE: a Main BU holding several placed somebody at %r"
                    % pf["severalAt"])
    if len(pf["severalChoices"]) != 2:
        errs.append("PEOPLE FILE: a Main BU holding two offers %r to the picker"
                    % (pf["severalChoices"],))
    if pf["movedRows"] != 1 or pf["movedWhat"] != "job title":
        errs.append("PEOPLE FILE: one changed cell produced %d changed rows (%r)"
                    % (pf["movedRows"], pf["movedWhat"]))
    # AND THE SAME CELL, UNTICKED, CHANGES NOTHING (87.6). Both halves, or the
    # check proves only that the offer exists and never that it is an offer.
    if pf["untakenOffers"] != 1 or pf["untakenDoes"] != 0:
        errs.append("PEOPLE FILE: an unticked difference offered %d and did %d, wanted 1 and 0"
                    % (pf["untakenOffers"], pf["untakenDoes"]))
    if pf["seededAction"] != "add" or pf["seededProblems"]:
        errs.append("PEOPLE FILE: a new employee in an unknown BU came back as %r (%d problems)"
                    % (pf["seededAction"], pf["seededProblems"]))
    if pf["seededNewBus"] != "Maintenance":
        errs.append("PEOPLE FILE: an unknown BU was not offered to the BU list (%r)"
                    % pf["seededNewBus"])
    if not pf["unitHead"]:
        errs.append("PEOPLE FILE: no Unit column in the workbook")
    if not pf["unitWritten"]:
        errs.append("PEOPLE FILE: the Unit column is written empty for everybody")
    if pf["unitReadsBack"] != pf["unitWasAt"]:
        errs.append("PEOPLE FILE: Unit comes back as %r, wanted %r"
                    % (pf["unitReadsBack"], pf["unitWasAt"]))
    if pf["unitOverrides"] != "fn:treasury":
        errs.append("PEOPLE FILE: Unit did not beat the Official BU mapping (%r)"
                    % pf["unitOverrides"])
    if not pf["unitRefuses"]:
        errs.append("PEOPLE FILE: a Unit that is not a place was accepted in silence")
    if pf["unitOldHeader"] != "mobile":
        errs.append('PEOPLE FILE: the old "BU" header no longer reads (%r)'
                    % pf["unitOldHeader"])
    print("people file: %d rows, fixed point %s, one edited cell -> %d row (%s), "
          "new joiner -> %s + BU %r"
          % (pf["rows"], "PASS" if not pf["fixedMoving"] else "FAIL",
             pf["movedRows"], pf["movedWhat"], pf["seededAction"], pf["seededNewBus"]))
    # ── WHO A ROW IS, AND TWO ROWS THAT ARE ONE PERSON (87) ──────────
    # The fault this is here for was found by USING the product: three people
    # were on the register twice — once from the employee file with an address,
    # once typed into the role picker with nothing — and a message aimed at a
    # role reached the copy with no address and reported them as having none.
    #
    # Four things are asserted, and the first is the one the old code got
    # wrong: A NAME IS NEVER AN IDENTIFIER, so nothing here matches on one.
    ident = pg.evaluate("""() => {
      const before = PEOPLE.length;
      const anchor = PEOPLE[0];
      anchor.empId = "IDENT-1"; anchor.email = "ident.one@example.com";
      const other = PEOPLE[1];
      other.empId = "IDENT-2"; other.email = "ident.two@example.com";

      /* 1. THE LADDER. A row with no employee number and a known address is
            that person, not a new one. */
      const byMail = planPeopleFile([{ "Name":"Whoever", "Email":"IDENT.ONE@example.com" }]);
      const byMailRow = byMail.rows[0] || null;

      /* 2. THE CONFLICT. One row whose number says one person and whose
            address says another cannot be applied by guessing, and must not be
            appliable at all until it is answered. */
      const clash = planPeopleFile([{ "Emp ID":"IDENT-1", "Name":"Whoever",
                                      "Email":"ident.two@example.com" }]);
      const clashRow = clash.rows[0] || null;
      const beforeChoice = peopleFileTally(clash).undecided;
      if (clashRow) peopleRowChoose(clashRow, { mode:"match", key:other.key });
      const afterChoice = peopleFileTally(clash).undecided;

      /* 3. A NEW NUMBER FOR AN ADDRESS ALREADY HERE is the other conflict, and
            it must not silently renumber somebody. */
      const renum = planPeopleFile([{ "Emp ID":"IDENT-NEW", "Name":"Whoever",
                                      "Email":"ident.one@example.com" }]);
      const renumRow = renum.rows[0] || null;

      /* 4. AND ADDING SOMEBODY ALREADY HERE IS STOPPED ON THE IDENTIFIER,
            never on the name. */
      const stopId   = personAddCheck({ name:"Anybody", empId:"IDENT-1" });
      const stopMail = personAddCheck({ name:"Anybody", email:"ident.one@example.com" });
      const namesOnly = personAddCheck({ name:anchor.name });

      return { before: before, after: PEOPLE.length,
               byMailAction: byMailRow ? byMailRow.action : "(none)",
               byMailKey: byMailRow ? byMailRow.key : null,
               byMailBy: byMailRow ? byMailRow.matchedBy : null,
               anchorKey: anchor.key, otherKey: other.key,
               clashAction: clashRow ? clashRow.action : "(none)",
               clashKind: clashRow && clashRow.conflict ? clashRow.conflict.kind : "(none)",
               beforeChoice: beforeChoice, afterChoice: afterChoice,
               chosen: clashRow ? peopleRowEffective(clashRow).key : null,
               renumKind: renumRow && renumRow.conflict ? renumRow.conflict.kind : "(none)",
               stopId: !!stopId.stop, stopMail: !!stopMail.stop,
               nameStops: !!namesOnly.stop, nameWarns: namesOnly.by === "name" };
    }""")
    if ident["after"] != ident["before"]:
        errs.append("IDENTITY: planning a file changed the register (%d -> %d)"
                    % (ident["before"], ident["after"]))
    if ident["byMailAction"] != "match" or ident["byMailKey"] != ident["anchorKey"]:
        errs.append("IDENTITY: a row with only an address came back as %r on %r, wanted the "
                    "person it belongs to" % (ident["byMailAction"], ident["byMailKey"]))
    if ident["byMailBy"] != "email":
        errs.append("IDENTITY: the review does not say the address is what matched (%r)"
                    % ident["byMailBy"])
    if ident["clashAction"] != "conflict" or ident["clashKind"] != "twoPeople":
        errs.append("IDENTITY: a number and an address pointing at two people came back as %r/%r"
                    % (ident["clashAction"], ident["clashKind"]))
    if ident["beforeChoice"] != 1 or ident["afterChoice"] != 0:
        errs.append("IDENTITY: an unanswered conflict left %d waiting and an answered one %d"
                    % (ident["beforeChoice"], ident["afterChoice"]))
    if ident["chosen"] != ident["otherKey"]:
        errs.append("IDENTITY: answering a conflict did not point the row at who was chosen (%r)"
                    % ident["chosen"])
    if ident["renumKind"] != "newId":
        errs.append("IDENTITY: a new number for an address already here came back as %r"
                    % ident["renumKind"])
    if not ident["stopId"] or not ident["stopMail"]:
        errs.append("IDENTITY: adding somebody on an existing identifier was not stopped (%r/%r)"
                    % (ident["stopId"], ident["stopMail"]))
    # A NAME MUST NOT STOP ANYTHING. Two people can share one, and refusing on
    # a name would refuse a real colleague — it is a remark, and the register
    # is what decides. Asserted in BOTH directions, or a check that only proves
    # the stop would pass a version that stopped everybody.
    if ident["nameStops"] or not ident["nameWarns"]:
        errs.append("IDENTITY: a matching NAME stopped an add (%r) / did not warn (%r)"
                    % (ident["nameStops"], ident["nameWarns"]))

    # ── MERGING TWO ROWS THAT ARE ONE PERSON (87.4) ──────────────────
    # Built the way the real ones were built: the employee file's row carries
    # the address, the typed row carries the ROLE and nothing else. Both are
    # asserted — that the register FINDS the pair without being told, and that
    # merging moves the role onto the row that can be emailed.
    mg = pg.evaluate("""() => {
      const unit = UNIT_KEYS[0];
      const full = "Testcase Gamal Sadek Soliman";
      const keepKey = addPerson({ name: full, empId:"MG-1",
                                  email:"testcase.merge@example.com" });
      /* The twin: the same person, typed shorter, given the unit's seat. */
      const dropKey = addPerson({ name:"Testcase Gamal Sadek", where: unit, role:"owner" });

      const found = registerDupes().likely.filter(l =>
        (l.key === dropKey && l.other === keepKey) || (l.key === keepKey && l.other === dropKey));
      const marked = personDupe(personBy(dropKey), registerDupes())
        .filter(d => d.kind === "likely").length;
      /* THE ROW WITH AN IDENTIFIER IS THE DEFAULT SURVIVOR, because the other
         one is the shape that made the duplicate. */
      const dflt = mergeDefaultKeep(dropKey, keepKey);
      const plan = personMergePlan(keepKey, dropKey);
      const rolesMoving = plan ? plan.roles.length : -1;

      const before = PEOPLE.length;
      const r = mergePeople(keepKey, dropKey, {});
      /* READ BEFORE THE TIDY-UP. Written into the returned object instead, it
         was evaluated after the two test rows had been removed again and
         reported that merging took two rows away — the check measuring its own
         cleanup (50.6, in miniature). */
      const removed = before - PEOPLE.length;
      const gone = !personBy(dropKey);
      const keep = personBy(keepKey);
      const held = keep ? personRoles(keep).map(x => x.role + "@" + x.at) : [];

      /* And the audience is the whole reason this exists: the role now reaches
         somebody with an address. */
      const aud = SMPAudience.resolve(world(), PEOPLE,
                                      { roles:["owner"], targets:[], keys:[], everyone:false });
      const reached = aud.to.filter(x => x.key === keepKey).length;
      const skipped = aud.skipped.filter(x => x.key === dropKey || x.key === keepKey).length;

      /* Put the register back, so nothing after this measures a tenant with a
         test person in it. */
      if (keep) { revokePersonRole(keepKey, "owner", unit); deletePerson(keepKey); }
      return { ok:!!r.ok, why:r.why || "", found:found.length, marked:marked, dflt:dflt,
               keepKey:keepKey, dropKey:dropKey, rolesMoving:rolesMoving,
               removed: removed, gone: gone,
               held: held.join(","), email: keep ? keep.email : null,
               name: keep ? keep.name : null, reached: reached, skipped: skipped };
    }""")
    if not mg["found"] or not mg["marked"]:
        errs.append("MERGE: the register did not spot the pair by itself (%d found, %d marked)"
                    % (mg["found"], mg["marked"]))
    if mg["dflt"] != mg["keepKey"]:
        errs.append("MERGE: the row with no identifier was offered as the survivor (%r)" % mg["dflt"])
    if mg["rolesMoving"] != 1:
        errs.append("MERGE: %d roles were listed as moving, wanted 1" % mg["rolesMoving"])
    if not mg["ok"]:
        errs.append("MERGE: refused (%s)" % mg["why"])
    if mg["removed"] != 1 or not mg["gone"]:
        errs.append("MERGE: %d rows went and the second row is %s"
                    % (mg["removed"], "gone" if mg["gone"] else "still here"))
    if "owner@" + "" not in mg["held"] and "owner" not in mg["held"]:
        errs.append("MERGE: the role did not move across (%r)" % mg["held"])
    if mg["email"] != "testcase.merge@example.com":
        errs.append("MERGE: the surviving row lost its address (%r)" % mg["email"])
    # THE FAULT ITSELF, MEASURED. Before the merge the role reached a row with
    # no address; after it, the same role reaches somebody who can be emailed
    # and nobody is skipped.
    if mg["reached"] != 1 or mg["skipped"]:
        errs.append("MERGE: after merging, the role reached %d with an address and skipped %d"
                    % (mg["reached"], mg["skipped"]))
    print("identity: address matches, %s conflict named, add stopped on the identifier; "
          "merge: pair found, role moved, %d reached"
          % (ident["clashKind"], mg["reached"]))

    # ── THE 1-YEAR TOGGLE ON A UNIT'S FOUNDATION (66) ────────────────
    # Islam: "for the key objectives for the business units make a toggle to
    # show and hide the 1 year view in the foundation page."
    #
    # 51.16 hid it behind a hard-coded false "for now"; this is the control it
    # was waiting for, and it still STARTS hidden. Asserted on BOTH layouts —
    # the columns view drops a grid TRACK and the chips view drops a line, so
    # they fail differently and a check on one proves nothing about the other.
    # And it must not appear on the GROUP, whose objectives have always shown
    # both and have nothing to toggle.
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(200)
    pg.evaluate("() => { try { localStorage.removeItem('smp.ko.year2'); } catch (e) {} }")
    show_units(pg)
    pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(200)
    pg.click('#subtabs button:has-text("Strategy")'); pg.wait_for_timeout(250)
    fnd = pg.query_selector('#secrow-in [data-sub2="found"]')
    if fnd: fnd.click(); pg.wait_for_timeout(300)
    ko = pg.evaluate("""() => {
      const read = () => {
        const oh = document.querySelector('.ohead');
        return { on: SHOW_KO_THIS_YEAR,
                 cols: oh ? oh.querySelectorAll('span').length : null,
                 heads: oh ? [...oh.querySelectorAll('span')].map(e=>e.textContent.trim()) : null,
                 chip: (document.querySelector('.ochip') || {}).innerText || null };
      };
      const out = { toggle: !!document.querySelector('[data-koyear]') };
      KO_VIEW = "cols"; setKoThisYear(false); paint();
      out.colsOff = read();
      setKoThisYear(true); paint();
      out.colsOn = read();
      KO_VIEW = "chips"; setKoThisYear(false); paint();
      out.chipsOff = read();
      setKoThisYear(true); paint();
      out.chipsOn = read();
      out.stored = localStorage.getItem("smp.ko.year2");
      setKoThisYear(false); KO_VIEW = "chips"; paint();
      return out;
    }""")
    if not ko["toggle"]:
        errs.append("KO YEAR: no toggle on a unit's foundation")
    # §199: ASSERT THE RELATIONSHIP, NOT THE COUNT (§94.8). This read `2 and 3`
    # and went red the day the Unit column shipped — correctly noticing a
    # change and wrongly calling it a fault, because what the toggle promises
    # is that it DROPS THIS YEAR'S COLUMN, not that the table has three. Now it
    # survives the next column too, and still fails a build where the toggle
    # stops dropping anything.
    if not (ko["colsOn"]["cols"] and ko["colsOff"]["cols"]
            and ko["colsOn"]["cols"] == ko["colsOff"]["cols"] + 1):
        errs.append("KO YEAR: the toggle must drop exactly one column — %r off, %r on"
                    % (ko["colsOff"]["cols"], ko["colsOn"]["cols"]))
    # And the column it drops is THIS YEAR'S, never somebody else's (§113.8:
    # "one fewer column" is preserved by dropping the wrong one).
    if ko["colsOn"].get("heads") and "This year" not in ko["colsOn"]["heads"]:
        errs.append("KO YEAR: with the toggle on there is no This year column (%r)"
                    % ko["colsOn"]["heads"])
    if ko["colsOff"].get("heads") and "This year" in ko["colsOff"]["heads"]:
        errs.append("KO YEAR: with the toggle off This year is still drawn (%r)"
                    % ko["colsOff"]["heads"])
    if not ko["chipsOn"]["chip"] or "3-year" not in ko["chipsOn"]["chip"]:
        errs.append("KO YEAR: the chips view does not carry both horizons when on (%r)"
                    % ko["chipsOn"]["chip"])
    if ko["chipsOff"]["chip"] and "3-year" in ko["chipsOff"]["chip"]:
        errs.append("KO YEAR: the chips view still carries both when off (%r)"
                    % ko["chipsOff"]["chip"])
    if ko["stored"] != "1":
        errs.append("KO YEAR: the choice is not remembered in localStorage (%r)" % ko["stored"])
    show_units(pg)
    go_top(pg, "group")
    pg.click('#subtabs button:has-text("Foundation")'); pg.wait_for_timeout(350)
    if pg.query_selector("[data-koyear]"):
        errs.append("KO YEAR: the toggle is on the group, whose objectives always show both")
    print("key objectives: the 1-year toggle is a unit's only, drops a column in "
          "the table and a line on the chip, and is remembered")

    # ── A COMPANY HAS A PAGE (68) ─────────────────────────────────────
    # Islam: "we will need to add a Companies performance page that includes
    # the overall performance of the company and the general view of the units
    # belonging to them." It REVERSES half of §23 — a company still carries no
    # strategy, and now carries a reading of what it holds.
    #
    # The number is asserted against the MODEL rather than against a literal,
    # so a deliberate change to the compile stays green and a card showing a
    # plausible figure from somewhere else does not (§64's rule). And the
    # narrowing is asserted from the one viewer it matters for: a company CEO
    # whose seeOthers flag is off must see their own and not the other.
    show_units(pg)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    co = pg.evaluate("""() => {
      const ck = COMPANY_KEYS[0];
      const el = document.createElement("div");
      el.innerHTML = renderCompanyPerformance("co:" + ck);
      const big = [].slice.call(el.querySelectorAll(".scores .big"))
        .map(function (x) { return x.textContent.trim(); });
      /* A company holding nothing must say so, not render blank (§61's rule). */
      const was = UNITS[companyUnitKeys(ck)[0]].company;
      const emptied = document.createElement("div");
      companyUnitKeys(ck).forEach(function (k) { delete UNITS[k].company; });
      emptied.innerHTML = renderCompanyPerformance("co:" + ck);
      unitsOfCompany(ck);
      const empty = emptied.innerText.trim().length;
      UNIT_KEYS.forEach(function (k) {
        if (["mobile", "consumerelectronics", "it"].indexOf(k) > -1) UNITS[k].company = was;
      });
      return { ck: ck, big: big, cards: el.querySelectorAll(".scores > .card").length,
               unitCards: el.querySelectorAll(".gauges .gwrap").length,
               model: { perf: companyObjectives(ck), ratio: companyRatio(ck),
                        weight: companyWeight(ck), units: companyUnitKeys(ck).length },
               emptyChars: empty,
               reach: companiesReachable() };
    }""")
    want = ["%d%%" % co["model"]["perf"], "%d%%" % co["model"]["ratio"],
            "%d%%" % co["model"]["weight"]]
    if co["big"] != want:
        errs.append("COMPANY: the cards read %r and the model computes %r"
                    % (co["big"], want))
    if co["unitCards"] != co["model"]["units"]:
        errs.append("COMPANY: %d unit cards for %d units in the company"
                    % (co["unitCards"], co["model"]["units"]))
    if co["emptyChars"] < 40:
        errs.append("COMPANY: a company holding no unit renders %d characters — "
                    "a blank page, not an empty state" % co["emptyChars"])
    # The navigation: a menu when there is more than one destination at this
    # level, a plain button when there is one (a menu of one is a door behind a
    # door, §32).
    nav = pg.evaluate("""() => ({
      menu: !!document.getElementById("topsel"),
      items: document.getElementById("topsel")
        ? [].slice.call(document.querySelectorAll("#topsel [data-u]")).map(e => e.dataset.u)
        : null })""")
    if not nav["menu"] or "group" not in (nav["items"] or []):
        errs.append("COMPANY: the SMO's first control is not a menu holding the group (%r)" % nav)
    pg.select_option("#asWho", "co_dist"); pg.wait_for_timeout(350)
    ccnav = pg.evaluate("""() => ({
      items: document.getElementById("topsel")
        ? [].slice.call(document.querySelectorAll("#topsel [data-u]")).map(e => e.dataset.u)
        : [(document.querySelector('#units [data-u]') || {}).dataset
            ? document.querySelector('#units [data-u]').dataset.u : null],
      reach: companiesReachable() })""")
    if "co:b2c" in (ccnav["items"] or []) or "b2c" in (ccnav["reach"] or []):
        errs.append("COMPANY: Distribution's CEO can reach B2C, whose seeOthers is off (%r)"
                    % ccnav)
    if "co:distribution" not in (ccnav["items"] or []):
        errs.append("COMPANY: Distribution's CEO cannot reach their own company (%r)" % ccnav)
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    # ── THE WAY IN HAS TO BE REACHABLE, NOT MERELY PRESENT (70) ───────
    # Islam asked for edit and add on the projects page and the unit's plan.
    # Both were already built — 34 fields, 14 handles and four Add buttons on a
    # capability; 25, 13 and three on a unit — behind a pen at `opacity:0`
    # until the pane was hovered. On a touch screen there is no hover at all.
    #
    # So this CLICKS the pen the way a person does, with no forcing: Playwright
    # refuses to click something invisible, which is the whole assertion. A
    # querySelector check would have passed every day the control could not be
    # reached, which is how it shipped.
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)
    for dest, sec, tag, wants in [("fn:finance", "Projects", "capability",
                                   ["project", "deliverable", "outcome", "milestone"]),
                                  ("mobile", "Plan", "unit",
                                   ["pillar", "measure", "tactic"])]:
        if dest.startswith("fn:"):
            if not pg.query_selector('#units [data-u="%s"]' % dest):
                sw = pg.query_selector("#units .navswitch .nsw:not(.on)")
                if sw: sw.click(); pg.wait_for_timeout(250)
        else:
            show_units(pg)
        pg.click('#units [data-u="%s"]' % dest); pg.wait_for_timeout(300)
        pg.click('#subtabs button:has-text("Strategy")'); pg.wait_for_timeout(250)
        pg.click('#secrow button:has-text("%s")' % sec); pg.wait_for_timeout(350)
        pen = pg.query_selector('.penbtn[data-page="plan"]')
        if not pen or not pen.is_visible():
            errs.append("PLAN EDIT (%s): the pen is %s \u2014 the edit mode cannot be "
                        "reached without a hover" % (tag, "absent" if not pen else "invisible"))
            continue
        pen.click(); pg.wait_for_timeout(400)
        got = pg.evaluate("""() => ({
          editing: EDIT_PAGE.plan,
          adds: [...document.querySelectorAll("[data-rowadd]")]
                  .map(e => e.dataset.rowadd.split("|")[0]),
          grips: document.querySelectorAll(".grip").length,
          /* §177: a milestone's due date is a PICKER, not an input, so a
             count of `.fld, input` alone silently under-reports the editable
             controls by one per milestone — the number this line prints would
             go on falling every time a field becomes a button (§51.11). */
          fields: document.querySelectorAll(
            ".pane .fld, .pane input, .pane [data-month]").length })""")
        missing = [w for w in wants if w not in got["adds"]]
        if missing:
            errs.append("PLAN EDIT (%s): no Add for %s" % (tag, ", ".join(missing)))
        if not got["grips"]:
            errs.append("PLAN EDIT (%s): editing gives no drag handles" % tag)
        if not got["fields"]:
            errs.append("PLAN EDIT (%s): editing gives no editable fields" % tag)
        back = pg.query_selector('.penbtn[data-page="plan"]')
        if back: back.click(); pg.wait_for_timeout(300)
        if pg.evaluate("() => EDIT_PAGE.plan"):
            errs.append("PLAN EDIT (%s): pressing Done did not leave edit mode" % tag)
        print("plan edit (%s): the pen is visible, and turning it on gives %d fields, "
              "%d handles and Add for %s"
              % (tag, got["fields"], got["grips"], ", ".join(wants)))

    # And somebody who may NOT correct a plan is still not offered one.
    pg.select_option("#asWho", "mobhead"); pg.wait_for_timeout(300)
    show_units(pg)
    pg.click('#units [data-u="mobile"]'); pg.wait_for_timeout(300)
    pg.click('#subtabs button:has-text("Strategy")'); pg.wait_for_timeout(250)
    pg.click('#secrow button:has-text("Plan")'); pg.wait_for_timeout(350)
    if pg.query_selector('.penbtn[data-page="plan"]'):
        errs.append("PLAN EDIT: a unit head is offered a pen \u2014 correcting a plan is "
                    "the SMO's (31)")
    pg.select_option("#asWho", "smo"); pg.wait_for_timeout(250)

    print("company page: %s reads %s from %d units, and its CEO reaches their own "
          "company and not the other"
          % (co["ck"], co["big"], co["model"]["units"]))

    # ── CLEAR PROJECT IS THE DEMO WITH NOTHING FILLED IN (67) ─────────
    # Islam: "Filled Project & Clear Project … the new clear project is a
    # project with the same setup but with no uploaded data at all."
    #
    # The org shape must SURVIVE and everything authored or reported must GO —
    # asserted as both halves, because a clearer that emptied the units too
    # would pass a check that only looked for zeroes. Fidelity against what
    # migration 004 actually leaves is scripts/test-clean-parity.js, which
    # needs a database; this is the half that can be checked in a browser.
    cp = pg.evaluate("""() => {
      const g = { group: GROUP, unitKeys: UNIT_KEYS, units: UNITS,
                  functionKeys: FUNCTION_KEYS, functions: FUNCTIONS,
                  companyKeys: COMPANY_KEYS, companies: COMPANIES,
                  people: PEOPLE, unitRoles: UNIT_ROLES, access: ACCESS,
                  labels: LABELS.entries, bands: BANDS.bands, koWeights: KO_WEIGHTS,
                  cycle: CYCLE, review: REVIEW, history: HISTORY,
                  priorCycle: PRIOR_CYCLE, archives: ARCHIVES };
      const c = clearedGraph(g);
      const count = x => ({
        units: (x.unitKeys || []).length, fns: (x.functionKeys || []).length,
        cos: (x.companyKeys || []).length,
        caps: ((x.group || {}).capabilities || []).length,
        themes: ((x.group || {}).themes || []).length,
        bands: (x.bands || []).length, labels: (x.labels || []).length,
        pillars: (x.unitKeys || []).reduce((n, k) =>
          n + ((x.units[k] || {}).items || []).length, 0),
        gko: ((x.group || {}).keyObjectives || []).length,
        people: (x.people || []).length, history: (x.history || []).length,
        horizon: (x.group || {}).horizon || "",
        mainbus: ((x.group || {}).mainbus || []).length,
        sets: ((x.group || {}).sets || []).length,
        fnItems: (x.functionKeys || []).reduce((n, k) =>
          n + ((x.functions[k] || {}).items || []).length, 0),
        capContent: ((x.group || {}).capabilities || []).reduce((n, c2) =>
          n + (c2.projects || []).length + (c2.keyObjectives || []).length, 0)
      });
      /* And it must not have touched the graph it was given. */
      const before = count(g), after = count(clearedGraph(g)), live = count(g);
      return { full: before, clear: after, unharmed: JSON.stringify(before) === JSON.stringify(live) };
    }""")
    keep = ["units", "fns", "cos", "caps", "themes", "bands", "labels"]
    for k in keep:
        if cp["clear"][k] != cp["full"][k]:
            errs.append("CLEAR PROJECT: %s went from %r to %r — the setup must stay"
                        % (k, cp["full"][k], cp["clear"][k]))
    gone = ["pillars", "gko", "history", "mainbus", "sets", "fnItems", "capContent"]
    for k in gone:
        if cp["clear"][k]:
            errs.append("CLEAR PROJECT: %s still holds %r" % (k, cp["clear"][k]))
    if cp["clear"]["horizon"]:
        errs.append("CLEAR PROJECT: the horizon survived as %r" % cp["clear"]["horizon"])
    if cp["clear"]["people"] != 1:
        errs.append("CLEAR PROJECT: %d people left, wanted 1 (the SMO)"
                    % cp["clear"]["people"])
    if not cp["unharmed"]:
        errs.append("CLEAR PROJECT: clearedGraph() mutated the graph it was given")
    print("clear project: the setup stays (%d units, %d functions, %d companies, "
          "%d capabilities) and everything filled in goes (%d pillars -> 0, "
          "%d people -> 1)"
          % (cp["clear"]["units"], cp["clear"]["fns"], cp["clear"]["cos"],
             cp["clear"]["caps"], cp["full"]["pillars"], cp["full"]["people"]))

    # ── A DROPDOWN OVER 255 CHARACTERS IS AN EMPTY DROPDOWN (67.5) ────
    # Islam: "the drop down in the units in the people registry template is
    # empty." Excel ignores an inline data-validation list longer than 255
    # characters and says nothing — the file opens, the column looks right, and
    # the list is gone. The Unit column was 301; the Official BU list beside it
    # was 93, which is why one worked and one did not.
    #
    # Asserted across EVERY workbook the platform builds, not only the one that
    # broke: any list that grows with the tenant crosses that line eventually,
    # and the failure is silent every time. The writer throws now, so this
    # also proves the throw is reachable rather than decorative.
    dv = pg.evaluate("""() => {
      const out = [];
      const check = (name, sheets) => {
        sheets.forEach(sh => (sh.validations || []).forEach(v => {
          if (v.from) return;
          out.push([name + "/" + sh.name + " " + v.range,
                    ('"' + (v.list || []).join(",") + '"').length]);
        }));
      };
      check("people", peopleWorkbook());
      check("plan", planWorkbook(blankUnitShape()));
      check("capplan", capPlanWorkbook(blankCapShape()));
      check("progress", progressWorkbook(UNITS[UNIT_KEYS[0]]));
      check("capprogress", capProgressWorkbook(GROUP.capabilities[0]));
      let threw = "";
      const long = []; for (let i = 0; i < 40; i++) long.push("A long option name " + i);
      try { buildXlsx([{ name:"S", head:["x"], rows:[["y"]],
              validations:[{ range:"A2:A9", list:long }] }]); }
      catch (e) { threw = e.message; }
      /* And the two that moved to a sheet must actually point at one, sized to
         the list — a range with blank rows shows blank entries. */
      const pw = peopleWorkbook();
      const people = pw.filter(sh => sh.name === "People")[0] || {};
      const lists = pw.filter(sh => sh.name === "Lists")[0] || {};
      const froms = {};
      (people.validations || []).forEach(v => { if (v.from) froms[v.range] = v.from; });
      return { inline: out, threw: threw,
               froms: froms, listRows: (lists.rows || []).length,
               places: placeOptions().length, bus: mainbuNames().length };
    }""")
    over = [r for r in dv["inline"] if r[1] > 255]
    if over:
        errs.append("XLSX: %d inline dropdowns over Excel's 255 limit — %r" % (len(over), over))
    if "255" not in (dv["threw"] or ""):
        errs.append("XLSX: the writer does not refuse an over-long inline list (%r)"
                    % dv["threw"])
    if len(dv["froms"]) != 2:
        errs.append("XLSX: the people workbook has %d sheet-backed dropdowns, wanted 2 "
                    "(Unit and Official BU) — %r" % (len(dv["froms"]), dv["froms"]))
    if dv["listRows"] != max(dv["places"], dv["bus"]):
        errs.append("XLSX: the Lists sheet holds %d rows for %d places and %d BUs"
                    % (dv["listRows"], dv["places"], dv["bus"]))
    for rng, frm in dv["froms"].items():
        want = str(dv["places"] + 1) if "$A$" in frm else str(dv["bus"] + 1)
        if not frm.endswith(want):
            errs.append("XLSX: %s points at %r, which is not sized to its list" % (rng, frm))
    print("xlsx dropdowns: %d inline, longest %d of 255; Unit and Official BU "
          "come from the Lists sheet, and an over-long list now throws"
          % (len(dv["inline"]), max(r[1] for r in dv["inline"])))

    print("unit column: %d of %d rows carry one, it reads back to %s, beats the "
          "Official BU mapping, and refuses a name that is not a place"
          % (pf["unitWritten"], pf["rows"], pf["unitReadsBack"]))

    print("ERRORS:", errs if errs else "none")
    b.close()
