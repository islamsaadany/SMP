"""Setup · Overview: it agrees with the pages it summarises (§108.10).

THE ONE FAULT A SUMMARY PAGE CAN HAVE IS BEING WRONG, and it is the one fault
that is invisible from the page itself: every number here is also printed
somewhere else, so a drift shows up as two screens disagreeing about the same
tenant with nothing to say which is right. So almost nothing below asserts a
NUMBER. It asserts that the Overview's number EQUALS the answer the source
function gives — the discipline §53.5 set for the unit/function pair, applied
to a page whose whole job is to restate other pages.

AND IT MAKES THE STATE IT MEASURES. The demo tenant has every custodian filled
and no open claims, so on the shipped data this page correctly shows its quiet
state and every attention row is unexercised — §45.2's trap, and §94.2's:
a check that only looks at what is drawn cannot see a row that should have been
drawn and was not. So the sweep seeds the faults, asserts the exact rows that
appear, and puts the tenant back.

WHAT IT CANNOT SEE FROM file://, AND SAYS SO. Three of the five rows depend on
a server fact (the inbox queue, password states, declarations). Over file://
they are correctly ABSENT, and this file asserts that they are absent rather
than zero — the distinction §93 was written about. Their live behaviour belongs
to an HTTP check the way the chat's does (§94.11, §97.9); it is named in the
output rather than silently skipped, so nobody reads this run as covering them.

Run: SMP_CHROME=... python3 qa-run.py checks/setup-overview.py
"""
import pathlib, sys
from playwright.sync_api import sync_playwright

URL = "file://" + str(pathlib.Path(
    pathlib.Path(__file__).resolve().parent.parent,
    "strategy-management-platform.html").resolve())

fails, errs = [], []


def ck(name, ok, extra=""):
    print(("  ok   " if ok else "  FAIL ") + name + ((" — " + str(extra)) if extra else ""))
    if not ok:
        fails.append(name)


def open_setup(pg, who="smo"):
    pg.select_option("#asWho", who)
    pg.wait_for_timeout(300)
    pg.query_selector(".navmenu-btn").click()
    pg.wait_for_timeout(500)


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1600, "height": 1000})
    pg.on("pageerror", lambda e: errs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL)
    pg.wait_for_timeout(800)
    open_setup(pg)

    print("\n── 1 · the gear lands here, and only for the office ──")
    ck("the SMO lands on Overview",
       pg.eval_on_selector(".setuprail .ritem.on .rilab", "e=>e.textContent.trim()") == "Overview")
    ck("Overview is first in the rail",
       pg.eval_on_selector(".setuprail [data-setupgo]", "e=>e.dataset.setupgo") == "overview")

    print("\n── 2 · the cycle strip equals cycleTotals() ──")
    # THE SOURCE IS ASKED IN THE PAGE, not restated here: a literal 163 in this
    # file would pass for ever and mean nothing the day the demo data moves.
    src = pg.evaluate("()=>{const t=cycleTotals();"
                      "return {done:t.done,total:t.total,sub:t.sub,none:t.none,prog:t.progress,units:t.units};}")
    strip = pg.eval_on_selector(".ovcycle", "e=>e.textContent.replace(/\\s+/g,' ')")
    ck("done/total agree with cycleTotals()",
       ("%d" % src["done"]) in strip and ("of %d items reported" % src["total"]) in strip,
       "%s vs %s" % (src, strip[:90]))
    ck("submitted agrees", ("%d submitted" % src["sub"]) in strip, src["sub"])
    ck("in progress agrees", ("%d in progress" % src["prog"]) in strip, src["prog"])
    # DERIVED, NOT COUNTED — and the denominator is units AND the supporting
    # functions main's §105 put on this board. This assertion read
    # `activeKeys().length` while it was units-only, which the merge made
    # false: the CHECK carried the old assumption, not the product (§108.16).
    ck("in progress is the remainder, not a third count",
       src["prog"] == src["units"] - src["sub"] - src["none"], src)
    ck("and the board counts the supporting functions too (§105)",
       src["units"] == pg.evaluate("activeKeys().length + boardFunctionKeys().length")
       and src["units"] > pg.evaluate("activeKeys().length"), src)
    ck("the strip is a way through, not a control",
       pg.eval_on_selector(".ovcyc-go", "e=>e.dataset.setupgo") == "cycle")

    print("\n── 3 · with the demo as shipped, it says so rather than showing nothing ──")
    ck("no attention rows on the clean tenant",
       pg.eval_on_selector_all(".ovrow", "e=>e.length") == 0)
    ck("and the page SAYS nothing is waiting",
       pg.eval_on_selector_all(".ovquiet", "e=>e.length") == 1)
    # A NULL IS NOT A ZERO (§93, §108.10). Over file:// three sources cannot be
    # asked; the row must be gone, and no "0 ..." may be printed in its place.
    ck("an unasked count draws no row and no zero",
       pg.evaluate("""()=>{
         const q=document.querySelector('.ovquiet');
         return noPasswordCount()===null && saidWhereCount()===null && !!q
                && !/\\b0 /.test(document.querySelector('.ovlist')?
                                 document.querySelector('.ovlist').textContent : '');}"""))

    print("\n── 4 · seed the faults: every row appears, and agrees with its source ──")
    # MADE, NOT WAITED FOR. Two units lose their custodian and one open claim is
    # raised — the two sources that live in the state graph and can be exercised
    # without a server.
    pg.evaluate("""()=>{
      window.__ovkeep = {roles: JSON.stringify(UNIT_ROLES), claims: JSON.stringify(GROUP.claims||[])};
      const ks = activeKeys().slice(0,2);
      ks.forEach(k=>{ UNIT_ROLES[k] = UNIT_ROLES[k]||{}; UNIT_ROLES[k].custodian = null; });
      GROUP.claims = [{id:"cl-test", state:"open", figure:"f1", set:"s1", by:"smo"}];
      paint();}""")
    pg.wait_for_timeout(400)
    rows = pg.eval_on_selector_all(".ovrow",
                                   "e=>e.map(x=>({k:x.dataset.setupgo,t:x.textContent.trim()}))")
    ck("both seeded rows are drawn", len(rows) == 2, [r["t"] for r in rows])
    src2 = pg.evaluate("()=>({cust:unitsWithoutCustodian().length, claims:openClaimsList().length})")
    txt = " | ".join(r["t"] for r in rows)
    ck("the custodian row agrees with unitsWithoutCustodian()",
       ("%d units with no custodian" % src2["cust"]) in txt, "%s in %s" % (src2["cust"], txt))
    ck("the claim row agrees with openClaimsList()",
       ("%d claim request" % src2["claims"]) in txt, "%s in %s" % (src2["claims"], txt))
    ck("the quiet panel is gone while something waits",
       pg.eval_on_selector_all(".ovquiet", "e=>e.length") == 0)
    ck("each row goes to the page that FIXES it",
       sorted(r["k"] for r in rows) == ["cycle", "people"],
       sorted(r["k"] for r in rows))
    # The destination's name comes off the rail's own list, so a rename follows.
    ck("the row names its destination as the rail names it",
       "People register" in txt and "Reporting cycle" in txt, txt)

    print("\n── 4b · the rail's pills are the same counts (§108.15) ──")
    # THE AGREEMENT AGAIN, one surface further out. The pill is not allowed to
    # be its own arithmetic: it is the Overview's own rows summed by
    # destination, so a rail badge can never disagree with the page it points
    # at — which is the one place nobody would ever catch it.
    pills = pg.eval_on_selector_all(".setuprail .ritem",
        "e=>e.map(x=>({k:x.dataset.setupgo,"
        " n:(x.querySelector('.riwait')||{}).textContent||null}))")
    byp = pg.evaluate("attentionByPage()")
    drawn = dict((r["k"], r["n"]) for r in pills if r["n"])
    ck("every pill equals attentionByPage()",
       drawn == dict((k, str(v)) for k, v in byp.items() if v), (drawn, byp))
    ck("the People register's pill is the SUM of its Overview rows",
       byp.get("people") == sum(r["n"] for r in
                                pg.evaluate("attentionRows()") if r["dest"] == "people"),
       byp)
    # NEVER A ZERO: every page with nothing waiting must carry no pill at all.
    quiet = [r["k"] for r in pills if not r["n"]]
    ck("a page with nothing waiting carries no pill",
       all(not byp.get(k) for k in quiet), [k for k in quiet if byp.get(k)])
    ck("and no pill anywhere reads 0",
       "0" not in [r["n"] for r in pills if r["n"]], pills)

    # A FOLDED group speaks for its rows; an open one does not repeat them.
    open_gw = pg.eval_on_selector_all(".setuprail .rgroup:not(.shut) .rgwait",
                                      "e=>e.filter(x=>!x.hidden).length")
    ck("an open group does not repeat its rows' pills", open_gw == 0, open_gw)
    pg.evaluate("""()=>{const h=document.querySelector('.rgroup[data-railgrp=\"who\"]');
                   if(h && !h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(300)
    gw = pg.eval_on_selector('.rgroup[data-railgrp="who"] .rgwait',
                             "e=>e.textContent.trim()")
    ck("a folded group carries the sum of what is behind it",
       gw == str(byp.get("people", 0)), (gw, byp))
    pg.evaluate("""()=>{const h=document.querySelector('.rgroup[data-railgrp=\"who\"]');
                   if(h && h.classList.contains('shut')) h.click();}""")
    pg.wait_for_timeout(250)

    print("\n── 5 · a row is a door ──")
    pg.query_selector('.ovrow[data-setupgo="people"]').click()
    pg.wait_for_timeout(500)
    ck("pressing the custodian row opens the People register",
       pg.eval_on_selector(".setuprail .ritem.on .rilab", "e=>e.textContent.trim()") == "People register")

    print("\n── 6 · one gap closes, one row goes ──")
    pg.evaluate("""()=>{ GROUP.claims=[]; currentSub='overview'; paint(); }""")
    pg.wait_for_timeout(400)
    left = pg.eval_on_selector_all(".ovrow", "e=>e.map(x=>x.dataset.setupgo)")
    ck("the answered claim's row is gone, the custodian row stays",
       left == ["people"], left)

    # PUT THE TENANT BACK, or every later block in a combined run measures a
    # tenant this one broke (§51.11's cousin: a check that leaves state behind).
    pg.evaluate("""()=>{
      const k = window.__ovkeep;
      Object.assign(UNIT_ROLES, JSON.parse(k.roles));
      GROUP.claims = JSON.parse(k.claims);
      currentSub='overview'; paint();}""")
    pg.wait_for_timeout(300)
    ck("the tenant is put back", pg.eval_on_selector_all(".ovrow", "e=>e.length") == 0)

    print("\n── 7 · somebody who is not the office ──")
    # The page is about the office's queue, so it is not offered to anybody
    # else — and their gear must still land somewhere real.
    pg.goto(URL)
    pg.wait_for_timeout(800)
    who = pg.eval_on_selector_all("#asWho option", "e=>e.map(x=>x.value)")
    other = [w for w in who if w not in ("smo",)]
    landed = None
    for w in other:
        pg.select_option("#asWho", w)
        pg.wait_for_timeout(250)
        btn = pg.query_selector(".navmenu-btn")
        if not btn or not btn.is_visible():
            continue
        btn.click()
        pg.wait_for_timeout(400)
        office = pg.evaluate("inOffice()")
        has = pg.eval_on_selector_all('.setuprail [data-setupgo="overview"]', "e=>e.length")
        if not office:
            landed = (w, pg.eval_on_selector(".setuprail .ritem.on .rilab", "e=>e.textContent.trim()"), has)
            break
    if landed:
        ck("a non-office viewer is not offered Overview", landed[2] == 0, landed)
        ck("and their gear still lands on a real page", bool(landed[1]), landed)
        # §69'S DOT: a count somebody cannot clear is a screen nagging them.
        ck("and they are shown no attention pills at all",
           pg.eval_on_selector_all(".setuprail .riwait, .setuprail .rgwait",
                                   "e=>e.length") == 0)
    else:
        ck("a non-office viewer reached Setup at all", False,
           "nobody outside the office could open Setup — assertion not exercised")

    b.close()

print("\nNOT COVERED HERE (needs a server, §94.11): the inbox-queue, password and "
      "declaration rows — asserted absent over file://, never asserted present.")
print("console errors:", errs or "none")
if fails:
    print("\nFAILED: %d" % len(fails))
    for f in fails:
        print("  - " + f)
    sys.exit(1)
print("\nsetup-overview: all assertions passed")
