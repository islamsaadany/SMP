"""WHO A ROW IS, AND TWO ROWS THAT ARE ONE PERSON (§87).

Driven through the SCREEN, not through the functions. qa.py already asserts the
rules — the ladder, the conflicts, the merge — and every one of them was true
in a build where nobody could have reached them: §70's lesson is that a control
which is present, permitted and invisible passes every DOM check ever written
and cannot be used by anybody. So this presses the buttons, with no forcing,
and Playwright refuses to click what a person could not click.

The fault it exists for was found by using the product: three people were on the
register twice, and a message aimed at a role reached the copy with no address.
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


def people_page(pg):
    pg.click('#units [data-md="setup"]')
    pg.wait_for_timeout(400)
    for g in pg.eval_on_selector_all(".setuprail .rgroup.shut", "e=>e.map(x=>x.dataset.railgrp)"):
        pg.click('.setuprail [data-railgrp="%s"]' % g)
        pg.wait_for_timeout(70)
    pg.click('.setuprail [data-setupgo="people"]')
    pg.wait_for_timeout(1100)


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium",
                          args=["--no-sandbox", "--disable-dev-shm-usage"])
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(URL)
    pg.wait_for_timeout(1500)
    people_page(pg)

    # ── ADDING SOMEBODY WHO IS ALREADY HERE ──────────────────────────
    # The register's own door. Typed, pressed, and the row count read before
    # and after — a stop that renders a message and adds the person anyway
    # would pass a check that only looked for the message.
    print("── the add row stops on an identifier")
    seed = pg.evaluate("""() => {
      PEOPLE[2].email = "already.here@example.com"; PEOPLE[2].empId = "AH-1";
      paint();
      return { name: PEOPLE[2].name, n: PEOPLE.length }; }""")
    pg.wait_for_timeout(600)
    pg.fill("#newPersonName", "Somebody Entirely New")
    pg.fill("#newPersonEmail", "already.here@example.com")
    pg.click('[data-padd="1"]')
    pg.wait_for_timeout(500)
    after = pg.evaluate("PEOPLE.length")
    ck("pressing Add did not add the row", after == seed["n"], "%d -> %d" % (seed["n"], after))
    stop = pg.eval_on_selector(".addstop", "e=>e.textContent") if pg.query_selector(".addstop") else ""
    ck("the stop names who it already is", seed["name"] in stop, stop[:90])
    ck("...and says which identifier matched", "address" in stop, stop[:90])

    # THE SECOND PRESS IS THE ONLY WAY PAST IT. A stop that any further press
    # gets through is a message that goes away by itself.
    pg.click('[data-padd="1"]')
    pg.wait_for_timeout(400)
    ck("pressing Add again still refuses", pg.evaluate("PEOPLE.length") == seed["n"])
    pg.click('[data-padd="anyway"]')
    pg.wait_for_timeout(500)
    ck("Add anyway gets through", pg.evaluate("PEOPLE.length") == seed["n"] + 1)
    pg.evaluate("""() => { PEOPLE.pop(); newPersonReset(); paint(); }""")
    pg.wait_for_timeout(500)

    # ── A ROW WITH NOTHING TO IDENTIFY IT IS MARKED ──────────────────
    print("── the twin is found without being told")
    pg.evaluate("""() => {
      window.__keep = addPerson({ name:"Testcase Gamal Sadek Soliman", empId:"TC-1",
                                  email:"testcase@example.com" });
      window.__drop = addPerson({ name:"Testcase Gamal Sadek", where:UNIT_KEYS[0], role:"owner" });
      paint(); }""")
    pg.wait_for_timeout(900)
    soft = pg.eval_on_selector_all(".dupemark.soft", "e=>e.map(x=>x.textContent.trim())")
    ck("the pair is marked on the row", len(soft) >= 2, soft)
    ck("the mark says it is a resemblance, not a collision",
       any("looks like" in m for m in soft), soft)
    # THE COUNT IS READ OFF THE HEADER'S OWN CHIPS, not off the page's text: a
    # substring search over the whole body would pass on the sentence in the
    # note underneath, which says the same words and counts nothing.
    chips = pg.eval_on_selector_all(".phead2 .hright .chip", "e=>e.map(x=>x.textContent.trim())")
    ck("the header counts the pair",
       any("possible duplicate" in c for c in chips), chips)
    ck("...and counts the row with nothing to identify it",
       any("nothing to identify" in c for c in chips), chips)

    # ── MERGING, THROUGH THE MENU ────────────────────────────────────
    print("── merging the pair")
    drop = pg.evaluate("window.__drop")
    keep = pg.evaluate("window.__keep")
    pg.click('.kebab[data-pmenu="%s"]' % drop)
    pg.wait_for_timeout(300)
    ck("the row's menu offers Merge", pg.query_selector('[data-pmerge="%s"]' % drop) is not None)
    pg.click('[data-pmerge="%s"]' % drop)
    pg.wait_for_timeout(700)
    ck("the merge section opened", pg.query_selector(".mgbox") is not None)
    ck("...and it offers the row the mark pointed at",
       pg.query_selector('[data-pmerge-b="%s"]' % keep) is not None)
    pg.click('[data-pmerge-b="%s"]' % keep)
    pg.wait_for_timeout(700)
    ck("both rows are shown to choose between",
       pg.eval_on_selector_all(".mgcard", "e=>e.length") == 2)
    # THE ROW THAT CAN BE MATCHED IS THE ONE OFFERED, because the other is the
    # shape that made the duplicate in the first place.
    ck("the row with an identifier is the default survivor",
       pg.eval_on_selector_all(".mgcard.on input", "e=>e.map(x=>x.dataset.pmergeKeep)") == [keep])
    moves = pg.eval_on_selector(".mgmoves", "e=>e.textContent") if pg.query_selector(".mgmoves") else ""
    ck("it says the role moves across", "owner" in moves.lower() or "Business unit owner" in moves, moves[:120])
    pg.click("[data-pmerge-go]")
    pg.wait_for_timeout(900)

    out = pg.evaluate("""() => {
      const k = personBy(window.__keep);
      return { gone: !personBy(window.__drop), n: PEOPLE.length,
               roles: k ? personRoles(k).map(r=>r.role).join(",") : "(no row)",
               email: k ? k.email : null,
               reached: SMPAudience.resolve(world(), PEOPLE,
                 { roles:["owner"], targets:[], keys:[], everyone:false })
                 .to.filter(x=>x.key===window.__keep).length }; }""")
    ck("the second row is gone", out["gone"])
    ck("the role moved to the surviving row", "owner" in out["roles"], out["roles"])
    ck("the surviving row kept its address", out["email"] == "testcase@example.com", out["email"])
    # AND THE WHOLE POINT: the role now reaches somebody a message can go to.
    ck("a message aimed at that role now reaches them", out["reached"] == 1, out["reached"])
    ck("the receipt says what happened",
       "merged into" in (pg.eval_on_selector(".applied", "e=>e.textContent")
                         if pg.query_selector(".applied") else ""))

    # ── THE PICKER OFFERS THE PERSON BEFORE OFFERING TO CREATE ONE ───
    # This is where the real twins were made: a name typed a little differently
    # matched nothing, and the only thing on offer was "+ Add".
    print("── the picker suggests before it creates")
    pg.evaluate("""() => {
      revokePersonRole(window.__keep, "owner", UNIT_KEYS[0]);
      deletePerson(window.__keep);
      window.__near = addPerson({ name:"Farida Hosny Abdelrahman Saleh", empId:"NR-1",
                                  email:"farida.near@example.com" });
      paint(); }""")
    pg.wait_for_timeout(700)
    pg.click('.setuprail [data-setupgo="units"]')
    pg.wait_for_timeout(800)
    # A UNIT IS EDITED ON ITS ROW NOW (§85, landed on main mid-branch). The
    # whole-table pen this used to press is gone, so the route in is the row's
    # own — §51.11: when a control changes shape, the checks keyed on the old
    # one break, and the ones that do not break are the ones to worry about.
    pg.click('[data-rowedit^="units|"]')
    pg.wait_for_timeout(700)
    pg.click(".pickbtn")
    pg.wait_for_timeout(500)
    ck("the picker opened", pg.query_selector("#pickQ") is not None)
    # A NAME WITH ONE OF ITS PARTS DROPPED, which is what actually happens: it
    # is NOT a substring of the stored name, so a search that finds it has done
    # the looser thing rather than got lucky. Written as a prefix first, which
    # the plain substring match answered — so the check passed while measuring
    # nothing of what it was added for (§50.6).
    pg.fill("#pickQ", "Farida Abdelrahman Saleh")
    pg.wait_for_timeout(400)
    shown = pg.eval_on_selector_all(".pickrow:not([hidden]) b", "e=>e.map(x=>x.textContent)")
    ck("a name with a part dropped still finds them",
       any("Farida Hosny" in n for n in shown), shown)
    ck("...and says so rather than pretending it matched",
       pg.eval_on_selector(".pickdym", "e=>!e.hidden") if pg.query_selector(".pickdym") else False)
    ck("the identifier fields are there to fill",
       pg.eval_on_selector(".picknew", "e=>!e.hidden") if pg.query_selector(".picknew") else False)
    # Searching by ADDRESS finds them too — a register of five hundred people is
    # not a list you scroll, and the address is what the SMO has in front of them.
    pg.fill("#pickQ", "farida.near@example.com")
    pg.wait_for_timeout(400)
    ck("the picker searches on the address as well",
       pg.eval_on_selector_all(".pickrow:not([hidden])", "e=>e.length") == 1,
       pg.eval_on_selector_all(".pickrow:not([hidden])", "e=>e.length"))

    print("── page errors:", errs if errs else "none")
    if errs:
        bad += len(errs)
    print(("ALL PASS" if not bad else "%d FAILED" % bad))
    b.close()
raise SystemExit(1 if bad else 0)
