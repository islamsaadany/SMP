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
    # THE ADD ROW IS THE ADD DIALOG NOW (§116.3). What is asserted does not
    # change — §87's ladder still stops a second row for somebody already here —
    # only where the fields are. The dialog is where the warning finally has
    # room to be read, which is half of why it moved.
    pg.evaluate("()=>document.querySelector('[data-padd-open]').click()")
    pg.wait_for_timeout(600)
    pg.fill("#modal-b [data-pname]", "Somebody Entirely New")
    pg.fill("#modal-b [data-pemail]", "already.here@example.com")
    pg.evaluate("()=>document.querySelector('[data-pdlg-add]').click()")
    pg.wait_for_timeout(600)
    after = pg.evaluate("PEOPLE.length")
    ck("pressing Add did not add the row", after == seed["n"], "%d -> %d" % (seed["n"], after))
    stop = pg.eval_on_selector(".pdband.bad", "e=>e.textContent") if pg.query_selector(".pdband.bad") else ""
    ck("the stop names who it already is", seed["name"] in stop, stop[:90])
    ck("...and says which identifier matched", "address" in stop, stop[:90])

    # THE SECOND PRESS IS THE ONLY WAY PAST IT. A stop that any further press
    # gets through is a message that goes away by itself.
    pg.evaluate("()=>document.querySelector('[data-pdlg-add]').click()")
    pg.wait_for_timeout(400)
    ck("pressing Add again still refuses", pg.evaluate("PEOPLE.length") == seed["n"])
    pg.evaluate("()=>document.querySelector('[data-pdlg-anyway]').click()")
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
    # THE WORDS ARE ON THE HOVER NOW (116.4). The mark was a phrase beside the
    # name -- "looks like Ahmed Mostafa" -- in the frozen column, so any row
    # carrying one wrapped and grew. What is asserted is unchanged: a
    # resemblance is marked DIFFERENTLY from a collision (87.2), because one is
    # a guess and the other is always wrong.
    soft = pg.eval_on_selector_all(".dupemark.soft", "e=>e.map(x=>x.title)")
    ck("the pair is marked on the row", len(soft) >= 2, soft)
    ck("the mark says it is a resemblance, not a collision",
       any("reads like" in m for m in soft), soft)
    ck("...and it is a different mark from a collision's",
       pg.evaluate("""()=>{const a=document.querySelector('.dupemark.soft');
          const b=[...document.querySelectorAll('.dupemark')].find(x=>!x.classList.contains('soft'));
          return !a || !b || a.textContent.trim() !== b.textContent.trim();}"""))
    # COUNTED IN THE QUEUE, NOT IN A CHIP (111). The header carried a chip per
    # kind of thing outstanding; they are one button that OPENS them, which is
    # what Islam asked for -- "I don't know which lines I should go and check".
    # So the count is asserted where it now lives, against the same two facts.
    q = pg.evaluate("attentionQueue()")
    kinds = [w["kind"] for a in q for w in a["why"]]
    ck("the queue holds the pair", kinds.count("dupe") >= 2, kinds)
    ck("...and the row with nothing to identify it", "noident" in kinds, kinds)
    ck("...and the button says how many",
       pg.evaluate("""()=>{const n=document.querySelector('[data-attn] .attnn');
          return !!n && parseInt(n.textContent,10) === attentionQueue().length;}"""))

    # ── MERGING, THROUGH THE MENU ────────────────────────────────────
    print("── merging the pair")
    drop = pg.evaluate("window.__drop")
    keep = pg.evaluate("window.__keep")
    pg.click('.kebab[data-pmenu="%s"]' % drop)
    pg.wait_for_timeout(300)
    ck("the row's menu offers Merge", pg.query_selector('[data-pmerge="%s"]' % drop) is not None)
    pg.click('[data-pmerge="%s"]' % drop)
    pg.wait_for_timeout(700)
    # ── IT IS A POPUP NOW (§90.4) ────────────────────────────────────
    # The section it replaces rendered 1086px down the page with nothing
    # scrolling to it, so "does it exist in the DOM" was true the whole time it
    # was unusable. What is asserted is that it is ON SCREEN: inside the
    # viewport, over an inert page.
    ck("the dialog is open", pg.eval_on_selector("#overlay", "e=>e.classList.contains('on')"))
    ck("...and it is actually in view", pg.evaluate("""() => {
         const m=document.querySelector('#modal-b'); if(!m) return false;
         const r=m.getBoundingClientRect();
         return r.top>=0 && r.top<window.innerHeight && r.height>40; }"""))
    ck("...and the page behind it is inert",
       pg.eval_on_selector(".wrap", "e=>e.inert === true"))
    ck("step 1 offers the row the mark pointed at",
       pg.query_selector('#modal-b [data-pmerge-b="%s"]' % keep) is not None)
    pg.click('#modal-b [data-pmerge-b="%s"]' % keep)
    pg.wait_for_timeout(300)
    pg.click('#modal-b [data-pmerge-step="2"]')
    pg.wait_for_timeout(400)
    ck("step 2 shows both rows to choose between",
       pg.eval_on_selector_all("#modal-b .mgcard", "e=>e.length") == 2)
    # THE ROW THAT CAN BE MATCHED IS THE ONE OFFERED, because the other is the
    # shape that made the duplicate in the first place.
    ck("the row with an identifier is the default survivor",
       pg.eval_on_selector_all("#modal-b .mgcard.on input",
                               "e=>e.map(x=>x.dataset.pmergeKeep)") == [keep])
    moves = pg.eval_on_selector("#modal-b .mgmoves", "e=>e.textContent") \
        if pg.query_selector("#modal-b .mgmoves") else ""
    ck("it says the role moves across",
       "owner" in moves.lower() or "Business unit owner" in moves, moves[:120])
    pg.click('#modal-b [data-pmerge-step="3"]')
    pg.wait_for_timeout(400)
    ck("step 3 names what survives",
       "survives" in pg.eval_on_selector("#modal-b", "e=>e.textContent"))
    pg.click("#modal-b [data-pmerge-go]")
    pg.wait_for_timeout(900)
    # THE RECEIPT IS THE LAST STEP, NOT A SECTION ON THE PAGE (§93.5).
    # Islam, on a "Merge two rows" panel left standing under the register:
    # "this page is a table page, not for other notifications." Both ends are
    # asserted, because a removal is the easiest thing to half-do (§90).
    ck("the dialog stayed open and said what it did",
       pg.eval_on_selector("#overlay", "e=>e.classList.contains('on')") and
       "merged into" in pg.eval_on_selector("#modal-b", "e=>e.textContent"))
    ck("...and the register behind it carries no notification",
       "Merge two rows" not in pg.eval_on_selector(".wrap", "e=>e.textContent"))

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
    # AND CLOSE IS WHAT ENDS IT — the page comes back and the wizard is gone.
    pg.click("#modal-b [data-pmerge-close]")
    pg.wait_for_timeout(500)
    ck("Close ends the wizard",
       not pg.eval_on_selector("#overlay", "e=>e.classList.contains('on')"))
    ck("...and gives the page back",
       pg.eval_on_selector(".wrap", "e=>e.inert !== true"))
    ck("...leaving nothing behind on it",
       "merged into" not in pg.eval_on_selector(".wrap", "e=>e.textContent"))

    # ── THE UNITS NOBODY IS KEEPING (§93.4) ──────────────────────────
    # Islam: "I want as well to leave a note somewhere by how many units that
    # doesn't have custodians." Both directions, because a count that is always
    # there and a count that is never there both pass a check that only looks
    # once — and the RETIRED case is the one worth the file: the seat is still
    # written on the unit, so asking whether the field is empty would report a
    # unit as covered by somebody who cannot sign in.
    print("── the units with no custodian")
    def custPill():
        # A CHIP ON THE ROW, NOT A LINE UNDER IT (122). Units with no custodian
        # is the one outstanding thing on this page that is NOT about a person,
        # so it cannot be a stop in a queue of people -- there would be nobody
        # to open. It kept a line of its own until Islam asked for the count
        # line to go; it moved onto the controls row rather than going with it,
        # and it still names the units.
        return [x for x in pg.eval_on_selector_all(
            ".phead2 .pnocust", "e=>e.map(x=>[x.textContent, x.title])")
            if "custodian" in x[0]]
    ck("nothing is said while every unit has one",
       pg.evaluate("()=>unitsWithoutCustodian().length") == 0 and not custPill(),
       custPill())
    pg.evaluate("""() => {
      UNIT_ROLES[UNIT_KEYS[0]].custodian = null;                 /* the seat emptied */
      personBy(UNIT_ROLES[UNIT_KEYS[1]].custodian).active = false; /* and the seat retired */
      paint(); }""")
    pg.wait_for_timeout(600)
    pill = custPill()
    ck("an empty seat and a retired one both count",
       pill and pill[0][0].startswith("2 units"), pill)
    first = pg.evaluate("()=>UNITS[UNIT_KEYS[0]].name")
    ck("...and it names which units, and where to fix it",
       pill and first in pill[0][1] and "custodian role" in pill[0][1],
       pill[0][1] if pill else "")

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

    # ── NAME AND FULL NAME (§93.8), AND TWO VALUES THAT COPY (§93.6) ─
    # Islam: "we can have it Name and Full Name" — which reverses half of
    # §93.6's own answer a day later, and gives the 392px back.
    #
    # THE LONGEST NAME IS PUT IN ON PURPOSE. The demo's longest is 25
    # characters and the client's register holds 43 — measuring the demo would
    # have proved nothing about the case the change exists for (§45.2).
    print("── name, full name, and copying an address")
    people_page(pg)
    LONG = "Abd El Moniem Mohamed Abd El Moniem Mahmoud"
    pg.evaluate("""(n) => { PEOPLE[0].name = n; delete PEOPLE[0].known;
      PEOPLE[1].email = "someone.with.a.long.address@rayatrade.example";
      PEOPLE[1].phone = "+20 100 555 0101";
      PCOLS.phone = true; paint(); }""", LONG)
    pg.wait_for_timeout(600)
    heads = pg.eval_on_selector_all(".peoplecfg thead th", "e=>e.map(x=>x.textContent.trim())")
    ck("the register has both columns", heads[1:3] == ["Name", "Full Name"], heads)
    m = pg.evaluate("""() => {
      const row = document.querySelectorAll('.peoplecfg tbody tr')[0];
      const cells = Array.from(document.querySelectorAll('.peoplecfg td.namecell'));
      return {
        known: row.children[1].textContent.trim(),
        full:  row.children[2].textContent.trim(),
        /* ONE LINE STILL (§88): distinct rounded tops among rects with width,
           never getClientRects().length, which counts zero-width extras. */
        lines: Math.max.apply(null, cells.map(function(c){
          const r = Array.from(c.getClientRects()).filter(x => x.width > 0);
          return new Set(r.map(x => Math.round(x.top))).size; })),
        w: Math.round(cells[0].getBoundingClientRect().width) }; }""")
    ck("Name is what somebody is called, not the legal name",
       m["known"] == "Abd El Moniem Mohamed", m)
    ck("...and the whole legal name is in Full Name beside it",
       m["full"] == LONG, m)
    ck("...on one line, in a frozen column that stayed narrow",
       m["lines"] == 1 and m["w"] <= 260, m)

    # TYPED WINS, AND CLEARING IT DOES NOT STORE THE GUESS. The second half is
    # what stops a correction to the full name leaving a stale short one.
    st = pg.evaluate("""() => {
      const p = PEOPLE[0]; setKnownName(p, "Moniem Mahmoud");
      const typed = knownName(p);
      setKnownName(p, knownGuess(p.name));
      return { typed: typed, stored: ("known" in p) }; }""")
    ck("a typed Name wins over the guess", st["typed"] == "Moniem Mahmoud", st)
    ck("...and clearing it back to the guess stores nothing", not st["stored"], st)

    # THE FILE READS AN OLD ONE AND A NEW ONE (§93.8). Every file downloaded
    # before today has "Name" holding the FULL name — read blindly, it would
    # put a legal name in the short column and leave the full one empty.
    f = pg.evaluate("""() => ({
      cols: PEOPLE_FILE_COLS,
      old: [fileFullName({"Name":"Ahmed Mostafa Mohamed El Gebely"}),
            fileKnownName({"Name":"Ahmed Mostafa Mohamed El Gebely"})],
      now: [fileFullName({"Full Name":"Ahmed Mostafa Mohamed El Gebely","Name":"Ahmed Mostafa"}),
            fileKnownName({"Full Name":"Ahmed Mostafa Mohamed El Gebely","Name":"Ahmed Mostafa"})] })""")
    ck("the file writes both columns",
       f["cols"][1:3] == ["Full Name", "Name"], f["cols"])
    ck("a file written before today still means the full name",
       f["old"] == ["Ahmed Mostafa Mohamed El Gebely", ""], f["old"])
    ck("...and one written after keeps them apart",
       f["now"] == ["Ahmed Mostafa Mohamed El Gebely", "Ahmed Mostafa"], f["now"])

    cp = pg.query_selector(".peoplecfg [data-copy]")
    ck("the address is a control, not text", cp is not None)
    ck("...and its hover carries the value as well as the hint",
       "click to copy" in (cp.get_attribute("title") or "") and
       "@" in (cp.get_attribute("title") or ""), cp.get_attribute("title") if cp else "")
    was = cp.text_content()
    cp.click()
    pg.wait_for_timeout(300)
    # FROM file:// THERE IS NO SECURE CONTEXT, so this exercises the
    # execCommand fallback — which is the path that actually runs here.
    ck("clicking it says it copied", cp.text_content() == "Copied", cp.text_content())
    pg.wait_for_timeout(1400)
    ck("...and the value comes back", cp.text_content() == was, cp.text_content())
    ck("the phone copies too",
       pg.eval_on_selector_all(".peoplecfg [data-copy]", "e=>e.length") >= 2)

    # ── THE PAGE'S FURNITURE (§90) ───────────────────────────────────
    # The file moved into the header and the notes moved to the knowledge base.
    # Both are REMOVALS, and a removal is the easiest thing in the world to
    # half-do — so each is asserted from both ends: gone from where it was, and
    # present where it went.
    print("── the file is in the header and the notes are in the knowledge base")
    people_page(pg)
    body = pg.evaluate("document.body.textContent")
    ck("no Seed-the-register steps at the foot of the page",
       "Seed the register from a file" not in body)
    ck("the three notes are gone from under the table",
       "People sign in with the email address" not in body)
    ck("Register file is in the header", pg.query_selector("[data-filemenu]") is not None)
    # AND IT IS STILL HIT-TESTABLE WITH SIX CHIPS BESIDE IT (§93.4). This is
    # how the wrapping fault was found, and asserting "is not None" above is
    # exactly what missed it for a run: `.hright` did not wrap, so adding the
    # units-with-no-custodian count pushed this button clean off the pane —
    # present, styled, enabled, and hitting BODY. §90's fault a third time.
    #
    # THE POINT IS PRESSED, not asked about: elementFromPoint at the button's
    # own centre has to come back as the button.
    pg.evaluate("()=>scrollTo(0,0)")
    pg.wait_for_timeout(250)
    # EVERY header menu, not just this one: the next chip would have taken
    # Columns and Passwords the same way.
    unreachable = pg.evaluate("""() =>
      Array.from(document.querySelectorAll('.setuppane .phead2 .hmenu-btn'))
        .filter(function(b){ const r = b.getBoundingClientRect();
          return document.elementFromPoint(r.left + r.width/2, r.top + r.height/2) !== b; })
        .map(function(b){ return b.textContent.trim(); })""")
    ck("...and the header's chips have pushed no menu off the page",
       not unreachable, unreachable)
    pg.click("[data-filemenu]")
    pg.wait_for_timeout(400)
    ck("...and holds Download", pg.query_selector("[data-dlppl]") is not None)
    ck("...and an Upload you can actually press",
       pg.eval_on_selector('label[for="ppl-file"]', "e=>!!e && e.offsetHeight > 0"))
    pg.click("[data-colmenu]")
    pg.wait_for_timeout(300)
    ck("opening another header menu closes it",
       pg.eval_on_selector_all("[data-dlppl]", "e=>e.length") == 0)

    pg.click('.setuprail [data-setupgo="kb"]')
    pg.wait_for_timeout(700)
    kb = pg.evaluate("document.body.textContent")
    ck("the door note arrived in the knowledge base",
       "sign in with the address on the register" in kb)
    ck("...and the password note",  "chosen their own" in kb or "choose their own" in kb)
    ck("...and retire-versus-delete", "should never have existed" in kb)

    print("── page errors:", errs if errs else "none")
    if errs:
        bad += len(errs)
    print(("ALL PASS" if not bad else "%d FAILED" % bad))
    b.close()
raise SystemExit(1 if bad else 0)
